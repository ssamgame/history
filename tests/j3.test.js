import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import j3Script from '../chapters/joseon/j3/script.js';
import { buildJ3Scene } from '../chapters/joseon/j3/scene.js';
import j3, { HOURS, HOUR_ANGLES, DIAL_ROUNDS, GAUGE_ROUNDS, CLOCK_STEPS, townTalk } from '../chapters/joseon/j3/chapter.js';
import { runChapter } from '../core/flow.js';
import { JOSEON } from '../chapters/index.js';
import { testWorld, touchSetup, touchBot, memSave } from './bot.js';

const answers = new Set(j3Script.quizzes.map(q => q.options[q.answer]));

test('j3: script passes validation', () => eq(validateScript(j3Script, SOURCES), []));

test('j3: quiz answers match the spec, and the rain gauge is not credited to 장영실', () => {
  eq(j3Script.quizzes.map(q => q.options[q.answer]), ['12지신 동물', '측우기']);
  const all = JSON.stringify(j3Script);
  ok(!/장영실[^"]*측우기를? (만들|발명)/.test(all) && !/측우기[^"]*장영실이 (만들|발명)/.test(all), 'no 장영실 측우기 claim');
});

test('j3: sundial rounds — three different hours, named 묘시~유시 with clock times, west to east', async () => {
  eq(HOURS.map(h => h[0]), ['묘시', '진시', '사시', '오시', '미시', '신시', '유시']);
  eq(HOURS[1][1], '7~9시');
  // 2026-10-29 선생님: 12지신 동물 그림 옆에 괄호로 작게 시각 이름과 시간
  const { HOUR_ANIMALS, hourLabel } = await import('../chapters/joseon/j3/chapter.js');
  eq(HOUR_ANIMALS.map(a => a[0]), ['토끼', '용', '뱀', '말', '양', '원숭이', '닭']);
  eq(hourLabel(1), { text: '🐲 용', sub: '(진시 7~9시)' });
  ok(HOURS.every(h => /^\d+~\d+시$/.test(h[1])), 'every hour has a clock time');
  ok(HOUR_ANGLES[0] > HOUR_ANGLES[6] && Math.abs(HOUR_ANGLES[3] - Math.PI) < 1e-6, 'west → north(오시) → east');
  eq(new Set(DIAL_ROUNDS).size, 3);
  eq(GAUGE_ROUNDS.length, 2);
});

test('j3: scene has the three instruments and people', () => {
  const w = testWorld();
  try {
    const s = buildJ3Scene(w);
    eq([...w.npcs.values()].filter(n => !n.spot).map(n => n.id).sort(), ['commoner', 'crownPrince', 'jangyeongsil']);
    eq([...w.npcs.values()].filter(n => n.spot).map(n => n.id), [], 'no road signs (C-03)');
    ok(w.level.children.some(o => o.name === 'plaque:보루각'), '보루각 plaque');
    ok(s.dial && s.gauge && s.clock, 'instruments');
    s.setRain(true); s.setRain(false); s.ringClock();
  } finally { w.dispose(); }
});

test('j3: completes with touch-only actions', async () => {
  const s = touchSetup(j3Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    const r = await runChapter(JOSEON.find(c => c.id === 'j3'), j3, s.ctx, memSave());
    eq(r.quizCorrect, 2);
    eq(r.firstTryCorrect, 2);
    eq(r.firstTryTotal, 2, 'the 자격루 is a scene, not scored');
    eq(r.stars, 3);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

// ---- D-23 ----
test('j3 D-23: gate and 한양 board, one-paragraph intro, two-line how-to cards, people in any order', () => {
  const w = testWorld();
  try {
    const sc = buildJ3Scene(w);
    ok(sc.gate && sc.gate.leaves.length === 2 && sc.introFrom[1] > sc.start[1], 'gate');
    let board = false; w.level.traverse(o => { if (o.userData && o.userData.title === '한양') board = true; });
    ok(board, '한양 board');
  } finally { w.dispose(); }
  for (const k of ['dial', 'rain']) eq(j3Script[k].howto.steps.length, 2, k);
  for (const id of ['commoner', 'jangyeongsil', 'crownPrince']) ok(!('tooEarly' in j3Script.npc[id]), `${id} never blocks`);
  eq(townTalk('crownPrince', new Set(['commoner']))[0], j3Script.npc.crownPrince.bridge, 'picks up after someone else');
  eq(townTalk('commoner', new Set()), j3Script.npc.commoner.first);
});

test('j3 D-30: intro scene, portal, goals without the quiz line, no sign lines left in the script (C-01·C-02·C-03)', () => {
  ok(j3Script.intro.length >= 1 && j3Script.intro.length <= 3 && j3Script.intro.every(l => !l.text.includes('\n') && l.src), 'short sourced intro');
  ok(typeof j3.introScene === 'function' && j3.portal && j3.portal.at, 'introScene and portal');
  eq(j3Script.goals.length, 4);
  ok(!j3Script.goals.some(g => g.includes('확인')), 'no quiz goal');
  ok(!Object.keys(j3Script.npc).some(k => k.startsWith('sign')), 'sign lines moved to people');
  const s = touchSetup(j3Script.speakers);
  try {
    j3.buildScene(s.w, s.ctx);
    const sc = j3.introScene(s.ctx);
    ok(sc.shots.length >= j3Script.intro.length, 'a shot per line');
    sc.shots.forEach(sh => sh.act?.(s.ctx)); sc.done?.(s.ctx);
    const [px, pz] = j3.portal.at;
    for (const n of s.w.npcs.values()) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 3, `portal clear of ${n.id}`);
  } finally { s.done(); }
});

test('j3 D-30: each game waits until the student walks to the instrument (C-05/S-02)', async () => {
  const s = touchSetup(j3Script.speakers);
  try {
    j3.buildScene(s.w, s.ctx);
    j3.enterStage(s.ctx, 'minigame');
    j3.minigame(s.ctx);
    for (let i = 0; i < 40; i++) { s.w.step(1 / 20, { x: 0, z: 0 }); await new Promise(r => setTimeout(r, 5)); }
    ok(!s.ui.querySelector('.dial-pick'), 'dial game has not started by itself');
    eq(s.ctx.testHooks.j3Started || [], []);
    const g = s.w.getGoal(); ok(g && Math.hypot(g.x - (-8), g.z - 5) < 5, 'arrow points at the 앙부일구');
  } finally { s.done(); }
});

test('j3 D-30: tap the hour the shadow points at, the 자격루 plays as one scene, tap the water height in the gauge', async () => {
  const s = touchSetup(j3Script.speakers);
  const bot = touchBot(s, { answers });
  let sc = null, rainWhileFill = false;
  const off = s.w.onUpdate(() => { if (sc && sc.gauge.userData.filling && sc.rain.points.visible) rainWhileFill = true; });
  try {
    sc = j3.buildScene(s.w, s.ctx);
    j3.enterStage(s.ctx, 'minigame');
    const r = await j3.minigame(s.ctx);
    const P = s.ctx.testHooks.picks;
    eq(P.filter(p => p.cls === 'dial-pick').map(p => p.n), [7, 7, 7], 'seven hour buttons on the bowl, three rounds');
    eq(P.filter(p => p.cls === 'gauge-pick').map(p => p.n), [6, 6], 'six tick buttons in the gauge, two rounds');
    ok(P.every(p => p.onScreen), 'buttons on screen');
    ok(s.ctx.testHooks.shadowErr.every(e => e < 1e-6), 'shadow points at the asked hour');
    ok(rainWhileFill, 'it rains while the gauge fills');
    eq(s.ctx.testHooks.gaugeLevels, GAUGE_ROUNDS);
    eq(s.ctx.testHooks.clockActs, CLOCK_STEPS, 'pour, water rises, rod floats up, ball rolls, puppets strike');
    eq(s.ctx.testHooks.j3Started, ['dial', 'clock', 'gauge']);
    eq(r.firstTryCorrect, 2);
    eq(DIAL_ROUNDS.length, 3);
  } finally { off(); bot.stop(); s.done(); }
}, { timeout: 150000 });
