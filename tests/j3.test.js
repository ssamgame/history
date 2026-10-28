import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import j3Script from '../chapters/joseon/j3/script.js';
import { buildJ3Scene } from '../chapters/joseon/j3/scene.js';
import j3, { HOURS, DIAL_ROUNDS, GAUGE_ROUNDS, CLOCK_SPOTS, townTalk, dialTiles, gaugeTiles } from '../chapters/joseon/j3/chapter.js';
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

test('j3: sundial rounds — three different animals, and the hour lines run west to east', () => {
  eq(HOURS.length, 9);
  eq(HOURS[4][0], '말', 'middle line is 오시(말)');
  eq(new Set(DIAL_ROUNDS).size, 3);
  eq(GAUGE_ROUNDS.length, 2);
});

test('j3: scene has the three instruments and people', () => {
  const w = testWorld();
  try {
    const s = buildJ3Scene(w);
    eq([...w.npcs.values()].filter(n => !n.spot).map(n => n.id).sort(), ['commoner', 'crownPrince', 'jangyeongsil']);
    eq([...w.npcs.values()].filter(n => n.spot).map(n => n.id).sort(), ['signClock', 'signDial', 'signGauge', 'signJongmyo'], 'signs only beside heritage');
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
    eq(r.firstTryCorrect, 3);
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
  eq(j3Script.intro.length, 1);
  for (const k of ['dial', 'clock', 'rain']) eq(j3Script[k].howto.steps.length, 2, k);
  for (const id of ['commoner', 'jangyeongsil', 'crownPrince']) ok(!('tooEarly' in j3Script.npc[id]), `${id} never blocks`);
  eq(townTalk('crownPrince', new Set(['commoner']))[0], j3Script.npc.crownPrince.bridge, 'picks up after someone else');
  eq(townTalk('commoner', new Set()), j3Script.npc.commoner.first);
});

test('j3 D-23: picking spots are far enough apart that only one is near at a time', () => {
  const s = touchSetup(j3Script.speakers);
  try {
    j3.buildScene(s.w, s.ctx);
    for (const tiles of [dialTiles(), gaugeTiles()]) for (let i = 1; i < tiles.length; i++) ok(Math.hypot(tiles[i].x - tiles[i - 1].x, tiles[i].z - tiles[i - 1].z) >= 2.5, 'gap');
    for (let i = 1; i < CLOCK_SPOTS.length; i++) ok(Math.hypot(CLOCK_SPOTS[i].x - CLOCK_SPOTS[i - 1].x, CLOCK_SPOTS[i].z - CLOCK_SPOTS[i - 1].z) > 2, 'clock spots apart');
  } finally { s.done(); }
});

test('j3 D-23: the shadow points at the right animal, water rises to the level, and the clock moves part by part in order', async () => {
  const s = touchSetup(j3Script.speakers);
  const bot = touchBot(s, { answers });
  let shadowOk = 0, levels = [];
  const sc0 = { v: null };
  const off = s.w.onUpdate(() => {
    const sc = sc0.v; if (!sc) return;
    const t = s.ctx.testHooks.walkTo;
    if (t && sc.shadow.userData.target != null && !sc.gauge.userData.level) { const a = Math.atan2(t.x - sc.dialAt[0], t.z - sc.dialAt[1]); if (Math.abs(a - sc.shadow.rotation.y) < 0.02) shadowOk += 1; }
    if (sc.gauge.userData.level && !levels.includes(sc.gauge.userData.level)) levels.push(sc.gauge.userData.level);
  });
  try {
    sc0.v = j3.buildScene(s.w, s.ctx);
    j3.enterStage(s.ctx, 'minigame');
    const r = await j3.minigame(s.ctx);
    ok(shadowOk > 0, 'shadow pointed at the target animal');
    eq(levels, GAUGE_ROUNDS);
    eq(s.ctx.testHooks.clockActs, [0, 1, 2, 3], 'water, ball, puppets, bell in order');
    eq(r.firstTryCorrect, 3);
  } finally { off(); bot.stop(); s.done(); }
}, { timeout: 150000 });
