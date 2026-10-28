import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import ch3Script from '../chapters/ch3/script.js';
import { buildCh3Scene } from '../chapters/ch3/scene.js';
import { testWorld } from './bot.js';

test('ch3: script passes validation', () => eq(validateScript(ch3Script, SOURCES), []));

test('ch3: quiz answers match the spec', () => {
  eq(ch3Script.quizzes.map(q => q.options[q.answer]), ['쇠가죽으로 물을 막았다가 터뜨리기', '귀주 대첩']); // 일어난 차례: 삼교천(1018) → 귀주(1019)
});

test('ch3: scene builds with 6 hides and a dam', () => {
  const w = testWorld();
  const s = buildCh3Scene(w);
  eq([...w.npcs.keys()].sort(), ['gangamchan', 'scout', 'soldier']);
  eq(s.hides.length, 6);
  ok(s.hides.every(h => h.mesh.visible), 'hides visible');
  eq(s.damWall.visible, false);
  ok(s.dam.r > 0);
  // 강을 건너는 거란군: 진행도 0이면 북쪽 강둑, 1이면 남쪽 강둑
  s.river.setCross(0); const z0 = s.river.army.position.z;
  s.river.setCross(1); const z1 = s.river.army.position.z;
  ok(z0 < s.river.zNorth && z1 > s.river.zSouth, `${z0} → ${z1}`);
  w.dispose();
});

import ch3 from '../chapters/ch3/chapter.js';
import { runChapter } from '../core/flow.js';
import { CHAPTERS } from '../chapters/index.js';
import { touchSetup, touchBot, memSave } from './bot.js';
const answers = new Set(ch3Script.quizzes.map(q => q.options[q.answer]));

test('ch3: completes with touch-only actions', async () => {
  const s = touchSetup(ch3Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    const r = await runChapter(CHAPTERS[2], ch3, s.ctx, memSave());
    eq(r.quizCorrect, 2);
    eq(r.easyModeUsed, false);
    eq(r.stars, 3);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('ch3: resume at quiz shows guju aftermath', () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    const sc = ch3.buildScene(s.w, s.ctx);
    ch3.enterStage(s.ctx, 'quiz');
    eq(s.w.bounds, sc.gujuBounds);
    eq(sc.reinforcements.visible, true);
    eq(sc.damWall.visible, true);
  } finally { s.done(); }
});

test('ch3: guju lines avoid unsourced claims and the 1019 explanation cites S5', () => {
  ok(!ch3Script.guju.intro.some(l => l.text.includes('내려왔')), 'no claim that the Khitan came down to Guju');
  ok(ch3Script.quizzes[0].src.includes('S5'));
});

// ---- D-10: 말이 모이는 탐험, 걸어가 터뜨리는 둑, 걸어가 치는 신호 북 ----
import { gangamchanTalk, damAttempt, gujuAttempt, setupDam, setupGuju } from '../chapters/ch3/chapter.js';
import { sleep } from './bot.js';

test('ch3 D-10: camp gate, 삼교천 진영 name board, scout, no reading signs, one-paragraph intro', () => {
  const w = testWorld();
  const sc = buildCh3Scene(w);
  ok(sc.gate && sc.gate.leaves.length === 2, 'gate leaves');
  let board = false; w.level.traverse(o => { if (o.userData && o.userData.title === '삼교천 진영') board = true; });
  ok(board, '삼교천 진영 name board');
  eq([...w.npcs.values()].filter(n => n.spot).length, 0, 'no reading signs');
  eq(ch3Script.intro.length, 1); ok(!ch3Script.intro[0].text.includes('\n'));
  ok(ch3Script.intro[0].src.includes('S3'));
  ok(sc.guju.visible === false, 'guju armies are hidden until the guju part');
  w.dispose();
});

test('ch3 D-10: Gang Gam-chan gathers what the soldier and the scout said (any order, never stuck)', () => {
  const n = ch3Script.npc.gangamchan;
  eq(gangamchanTalk(new Set()), [...n.greet, ...n.tooEarly]);
  const all = gangamchanTalk(new Set(['soldier', 'scout']));
  ok(all.some(l => l.text.includes('쇠가죽')) && all.some(l => l.src && l.src.includes('S5')), 'ends with the cowhide plan (S3, S5)');
  eq(all.filter(l => l === n.heard.soldier || l === n.heard.scout).length, 2);
  ok(gangamchanTalk(new Set(['scout'])).some(l => l.text.includes('쇠가죽')), 'one person heard is enough');
  ok(ch3Script.npc.scout.first.every(l => l.src && l.src.includes('S3')), 'scout lines are sourced');
});

function stepUntil(w, cond, max = 600) { for (let i = 0; i < max && !cond(); i++) w.step(0.05, { x: 0, z: 0 }); }

test('ch3 D-10: the dam bursts when the student walks to the plug in time (no button); too early only gets 아직이다', async () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    const sc = ch3.buildScene(s.w, s.ctx);
    setupDam(s.ctx);
    eq(s.w.camMode, 'follow');
    let res = null;
    damAttempt(s.ctx, false, { why: '' }).then(r => { res = r; });
    eq(s.ui.querySelectorAll('.big-action').length, 0, 'no big button');
    s.w.player.position.set(sc.plug.x, s.w.player.position.y, sc.plug.z); // 너무 일찍 마개로
    s.w.step(0.05, { x: 0, z: 0 });
    ok((s.ctx.testHooks.damTooEarly || 0) >= 1, '아직이다');
    await sleep(5);
    ok(res === null, 'the plug does not react before the signal');
    s.w.player.position.set(sc.stand.x, s.w.player.position.y, sc.stand.z); // 강감찬 곁으로 돌아가 기다린다
    stepUntil(s.w, () => s.ctx.testHooks.damNow, 200);
    await sleep(5);
    eq(res, null);
    const g = s.w.getGoal(); ok(g && Math.abs(g.x - sc.plug.x) < 0.01, 'arrow points at the plug after 지금이다');
    ok(sc.plug.ring.visible, 'plug glows');
    s.w.player.position.set(sc.plug.x, s.w.player.position.y, sc.plug.z);
    s.w.step(0.05, { x: 0, z: 0 });
    await sleep(5);
    eq(res, true);
  } finally { s.done(); }
});

test('ch3 D-10: missing the moment at the dam fails as late', async () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    ch3.buildScene(s.w, s.ctx);
    setupDam(s.ctx);
    const fail = { why: '' }; let res = null;
    damAttempt(s.ctx, false, fail).then(r => { res = r; });
    stepUntil(s.w, () => res !== null || fail.why, 600);
    await sleep(5);
    eq(res, false); eq(fail.why, 'late');
  } finally { s.done(); }
});

test('ch3 D-10: the signal drum sounds only after the flags turn north', async () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    const sc = ch3.buildScene(s.w, s.ctx);
    setupGuju(s.ctx, false);
    ok(sc.guju.visible, 'guju armies shown');
    let res = null;
    gujuAttempt(s.ctx, false, { why: '' }).then(r => { res = r; });
    eq(s.ui.querySelectorAll('.big-action').length, 0, 'no big button');
    s.w.player.position.set(sc.drum.x, 0, sc.drum.z);
    s.w.step(0.05, { x: 0, z: 0 });
    ok((s.ctx.testHooks.drumTooEarly || 0) >= 1, '깃발을 보아라');
    s.w.player.position.set(sc.gujuStand[0], 0, sc.gujuStand[1]);
    stepUntil(s.w, () => s.ctx.testHooks.drumNow, 300);
    await sleep(5);
    eq(res, null);
    s.w.player.position.set(sc.drum.x, 0, sc.drum.z);
    s.w.step(0.05, { x: 0, z: 0 });
    await sleep(5);
    eq(res, true);
  } finally { s.done(); }
});

test('ch3 D-10: easy mode crosses slower and the drum is closer', () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    const sc = ch3.buildScene(s.w, s.ctx);
    setupGuju(s.ctx, false); const far = Math.hypot(sc.drum.x - sc.gujuStand[0], sc.drum.z - sc.gujuStand[1]);
    setupGuju(s.ctx, true); const near = Math.hypot(sc.drum.x - sc.gujuStand[0], sc.drum.z - sc.gujuStand[1]);
    ok(near < far - 2, `${near} < ${far}`);
  } finally { s.done(); }
});

test('ch3 D-10: full run keeps the low camera and walks (no fixed camera, no buttons)', async () => {
  const s = touchSetup(ch3Script.speakers);
  const bot = touchBot(s, { answers });
  let fixed = false, big = false;
  const off = s.w.onUpdate(() => { if (s.w.camMode === 'fixed') fixed = true; if (s.ui.querySelector('.big-action')) big = true; });
  try {
    const sc = ch3.buildScene(s.w, s.ctx);
    ok(s.w.closeView, 'low camera');
    const r = await ch3.minigame(s.ctx);
    eq(fixed, false); eq(big, false);
    eq(r.firstTryTotal, 2); eq(r.firstTryCorrect, 2);
    eq(s.w.followOffset, null);
    ok(sc.damWall.visible, 'dam stays');
    ok(sc.river.army.position.y > -0.01, 'the Khitan army was pushed back, not sunk');
  } finally { off(); bot.stop(); s.done(); }
}, { timeout: 150000 });

// ---- D-12: 미리 와 있으면 신호가 나지 않고, 강감찬 곁으로 돌아와야 신호. 귀주는 장면 전환으로 언덕에서 대치 ----
test('ch3 D-12: waiting at the plug never gets the signal; coming back beside Gang Gam-chan does', async () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    const sc = ch3.buildScene(s.w, s.ctx);
    setupDam(s.ctx);
    let res = null;
    damAttempt(s.ctx, false, { why: '' }).then(r => { res = r; });
    const y = s.w.player.position.y;
    s.w.player.position.set(sc.plug.x, y, sc.plug.z);
    for (let i = 0; i < 140; i++) s.w.step(0.05, { x: 0, z: 0 }); // 7초: 신호 구간(5~8.2초)에 들어섰다
    await sleep(5);
    eq(res, null, 'nothing bursts while the student waits at the plug');
    eq(s.ctx.testHooks.damNow, false, 'no signal yet');
    const g = s.w.getGoal(); ok(g && Math.abs(g.x - sc.stand.x) < 0.01, 'arrow points back beside Gang Gam-chan');
    s.w.player.position.set(sc.stand.x, y, sc.stand.z);
    s.w.step(0.05, { x: 0, z: 0 });
    eq(s.ctx.testHooks.damNow, true, 'signal once back beside him');
    s.w.player.position.set(sc.plug.x, y, sc.plug.z);
    s.w.step(0.05, { x: 0, z: 0 });
    await sleep(5);
    eq(res, true);
  } finally { s.done(); }
});

test('ch3 D-12: the drum also waits until the student is beside Gang Gam-chan', async () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    const sc = ch3.buildScene(s.w, s.ctx);
    setupGuju(s.ctx, false);
    let res = null;
    gujuAttempt(s.ctx, false, { why: '' }).then(r => { res = r; });
    s.w.player.position.set(sc.drum.x, s.w.player.position.y, sc.drum.z);
    for (let i = 0; i < 130; i++) s.w.step(0.05, { x: 0, z: 0 }); // 6.5초: 깃발은 이미 북쪽
    await sleep(5);
    eq(res, null); eq(s.ctx.testHooks.drumNow, false);
    s.w.player.position.set(sc.gujuStand[0], s.w.player.position.y, sc.gujuStand[1]);
    s.w.step(0.05, { x: 0, z: 0 });
    eq(s.ctx.testHooks.drumNow, true);
  } finally { s.done(); }
});

test('ch3 D-12: Guju opens on the hill beside Gang Gam-chan, the Khitan camp far across the field, no Samgyocheon soldiers', () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    const sc = ch3.buildScene(s.w, s.ctx);
    setupGuju(s.ctx, false);
    for (let i = 0; i < 20; i++) s.w.step(0.05, { x: 0, z: 0 });
    ok(s.w.player.position.y > 1, `student stands on the hill (${s.w.player.position.y.toFixed(2)})`);
    const gc = s.w.npcs.get('gangamchan').mesh.position;
    ok(Math.hypot(gc.x - s.w.player.position.x, gc.z - s.w.player.position.z) < 2.6, 'beside Gang Gam-chan');
    const gap = Math.min(...sc.gujuGoryeo.map(p => p.position.z)) - Math.max(...sc.gujuKhitan.map(p => p.position.z));
    ok(gap > 15, `the armies face each other across the field (${gap})`);
    eq(sc.river.army.visible, false, 'Samgyocheon Khitan army hidden');
    ok(Math.min(...sc.gujuKhitan.map(p => p.position.z)) - 20 > 24, 'Guju is far from the camp');
  } finally { s.done(); }
});

test('ch3 D-12: the flood is water (teal, see-through, white foam), pushes the Khitan back and nobody sinks', () => {
  const s = touchSetup(ch3Script.speakers);
  try {
    const sc = ch3.buildScene(s.w, s.ctx);
    sc.flood.show(0, 1.2, 0.5);
    let teal = false, foam = false;
    sc.flood.group.traverse(o => { if (o.material) { const c = o.material.color; if (o.material.transparent && c.b > c.r && c.g > c.r) teal = true; if (c.r > 0.9 && c.g > 0.9 && c.b > 0.9) foam = true; } });
    ok(teal && foam, 'teal water and white foam');
    sc.flood.hide();
    eq(sc.flood.group.visible, false);
  } finally { s.done(); }
});

test('ch3 D-16: Khitan camp tents behind their line catch fire during the Guju charge, away from the hill where the student stands', async () => {
  const { default: ch3, playGujuBattle } = await import('../chapters/ch3/chapter.js');
  const s = touchSetup(ch3Script.speakers);
  try {
    const sc = ch3.buildScene(s.w, s.ctx);
    ok(sc.gujuFires.length >= 2, 'fires');
    ok(sc.gujuFires.every(f => !f.group.visible), 'no fire before the charge');
    sc.guju.visible = true;
    const p = playGujuBattle(s.ctx);
    for (let i = 0; i < 100; i++) s.w.step(0.05, { x: 0, z: 0 });
    ok(sc.gujuFires.every(f => f.group.visible && f.level() > 0.5), 'tents burn');
    const b = sc.gujuBounds;
    for (const f of sc.gujuFires) ok(f.group.position.z < b.z0 - 15, 'far from the student');
    for (let i = 0; i < 60; i++) s.w.step(0.05, { x: 0, z: 0 });
    await p;
  } finally { s.done(); }
});
