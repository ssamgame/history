import { test, eq, ok } from './harness.js';
import { buildCh1Scene } from '../chapters/ch1/scene.js';
import { testWorld, touchSetup, touchBot, memSave } from './bot.js';

test('ch1: scene builds with 4 npcs and hidden pillars', () => {
  const w = testWorld();
  const s = buildCh1Scene(w);
  eq([...w.npcs.values()].filter(n => !n.spot).map(n => n.id).sort(), ['archer', 'officer', 'seohui', 'soldier']);
  eq(s.gangdongPillars.visible, false);
  eq(s.gangdongPillars.children.filter(c => c.isSprite).length, 6);
  ok(s.khitanGroup.children.length > 0);
  eq(w.bounds, { x0: -30.8, x1: 30.8, z0: -14.4, z1: 22 });
  w.dispose();
});

test('ch1: player can reach the ferry from the start', () => {
  const w = testWorld();
  const s = buildCh1Scene(w);
  w.player.position.set(0, 0, 19);
  for (let i = 0; i < 600; i++) {
    const dx = s.ferry.x - w.player.position.x, dz = s.ferry.z - w.player.position.z, d = Math.hypot(dx, dz);
    if (d < s.ferry.r) break;
    w.step(1 / 30, { x: dx / d, z: dz / d });
  }
  ok(Math.hypot(s.ferry.x - w.player.position.x, s.ferry.z - w.player.position.z) < s.ferry.r, 'ferry reached');
  w.dispose();
});

test('ch1: low quality scene builds with flat water and fewer embers', () => {
  const lo = testWorld('low'); const a = buildCh1Scene(lo);
  const hi = testWorld('high'); const b = buildCh1Scene(hi);
  ok(a.emberCount < b.emberCount, `${a.emberCount} < ${b.emberCount}`);
  lo.dispose(); hi.dispose();
});

// ---- 1장 대사와 진행 ----
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import ch1Script from '../chapters/ch1/script.js';
import ch1, { introWalk, INTRO_FROM, START } from '../chapters/ch1/chapter.js';
import { runChapter } from '../core/flow.js';
import { CHAPTERS } from '../chapters/index.js';

const answers = new Set([
  ...[ch1Script.negotiation.q1, ch1Script.negotiation.q2].map(c => c.options.find(o => o.correct).text),
  ...ch1Script.quizzes.map(q => q.options[q.answer]),
]);

test('ch1: script passes validation', () => eq(validateScript(ch1Script, SOURCES), []));

test('ch1: correct answers use the exact sentences', () => {
  eq(ch1Script.negotiation.q1.options.find(o => o.correct).text, '고려는 고구려를 이은 나라이다.');
  eq(ch1Script.negotiation.q2.options.find(o => o.correct).text, '여진이 길을 막고 있어서 거란과 교류를 할 수 없다.');
  eq(ch1Script.negotiation.q2.prompt.text, '고려는 왜 가까운 거란과 친하게 지내지 않느냐?');
  eq(ch1Script.quizzes.length, 2);
});


test('ch1: completes with touch-only actions', async () => {
  const s = touchSetup(ch1Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    const r = await runChapter(CHAPTERS[0], ch1, s.ctx, memSave());
    eq(r.firstTryTotal, 2);
    eq(r.firstTryCorrect, 2);
    eq(r.quizCorrect, 2);
    eq(r.stars, 3);
    ok(bot.taps >= 2, 'talked through the touch button');
  } finally { bot.stop(); s.done(); }
}, { timeout: 90000 });

test('ch1: wrong first answer gives hint and lowers firstTryCorrect', async () => {
  const s = touchSetup(ch1Script.speakers);
  const bot = touchBot(s, { answers, wrongFirst: new Set(['고려는 고구려를 이은 나라이다.']) });
  try {
    ch1.buildScene(s.w, s.ctx);
    const r = await ch1.minigame(s.ctx);
    eq(r, { firstTryCorrect: 1, firstTryTotal: 2, easyModeUsed: false });
  } finally { bot.stop(); s.done(); }
}, { timeout: 60000 });

// D-5: 고려 1장 정식 — 낮은 카메라·정면 대화·문을 열고 들어오는 시작 장면과 장소 이름판
test('ch1: camp gate has two leaves on the road and a name board just inside (not a spot)', () => {
  const w = testWorld();
  const sc = buildCh1Scene(w);
  ok(sc.gate && sc.gate.leaves.length === 2, 'gate leaves');
  const gz = sc.gate.z;
  ok(gz < INTRO_FROM[1] && gz > START[1], 'gate between intro start and start');
  sc.gate.setOpen(0); eq(sc.gate.leaves.map(l => +l.rotation.y.toFixed(2)), [0, 0]);
  sc.gate.setOpen(1); ok(sc.gate.leaves.every(l => Math.abs(l.rotation.y) > 1.3), 'opens');
  const board = w.level.getObjectByName('sign:고려군 진영');
  ok(board, 'name board');
  ok(board.position.z < gz && board.position.z > gz - 6 && Math.abs(board.position.x) > 1.5 && Math.abs(board.position.x) < 6, 'beside the road inside the gate');
  ok(![...w.npcs.values()].some(n => n.mesh === board), 'not a reading spot');
  w.dispose();
});

test('ch1: intro walk path from outside the camp is not blocked by colliders', () => {
  const w = testWorld();
  buildCh1Scene(w);
  ok(INTRO_FROM[1] > w.bounds.z1, 'starts outside the camp');
  for (let t = 0; t <= 1; t += 0.02) {
    const x = INTRO_FROM[0] + (START[0] - INTRO_FROM[0]) * t, z = INTRO_FROM[1] + (START[1] - INTRO_FROM[1]) * t;
    for (const c of w.colliders) ok(Math.hypot(x - c.x, z - c.z) > c.r + 0.45, `blocked at ${x},${z}`);
  }
  w.dispose();
});

test('ch1: intro walk brings the player in 3~5 s with input off, then restores; a key skips it', async () => {
  const s = touchSetup(ch1Script.speakers);
  try {
    ch1.buildScene(s.w, s.ctx);
    const b0 = { ...s.w.bounds };
    s.ctx.input.enabled = true;
    let done = false;
    const p = introWalk(s.ctx).then(() => { done = true; });
    eq(s.ctx.input.enabled, false);
    ok(s.w.player.position.z > b0.z1, 'starts outside');
    let t = 0;
    for (; t < 8 && !done; t += 1 / 30) { s.w.step(1 / 30, { x: 0, z: 0 }); await Promise.resolve(); }
    await p;
    ok(t >= 3 && t <= 5.2, 'took ' + t.toFixed(2) + ' s');
    const leaves = []; s.w.level.traverse(o => { if (o.name === 'gateLeaf') leaves.push(o); });
    ok(leaves.length === 2 && leaves.every(l => Math.abs(l.rotation.y) > 1.3), 'gate left open');
    ok(Math.hypot(s.w.player.position.x - START[0], s.w.player.position.z - START[1]) < 0.3, 'at start');
    eq(s.w.bounds, b0); eq(s.w.autoMove, null);
    // 건너뛰기: 키를 누르면 바로 끝난다
    const q = introWalk(s.ctx);
    s.w.step(1 / 30, { x: 0, z: 0 });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    await q;
    ok(Math.hypot(s.w.player.position.x - START[0], s.w.player.position.z - START[1]) < 0.3, 'skip lands at start');
    eq(s.w.bounds, b0);
  } finally { s.done(); }
});
