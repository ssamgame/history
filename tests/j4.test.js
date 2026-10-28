import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import j4Script from '../chapters/joseon/j4/script.js';
import { buildJ4Scene, STRAIT_Z } from '../chapters/joseon/j4/scene.js';
import j4, { LURE, portTalk } from '../chapters/joseon/j4/chapter.js';
import { runChapter } from '../core/flow.js';
import { JOSEON } from '../chapters/index.js';
import { testWorld, touchSetup, touchBot, memSave } from './bot.js';

const answers = new Set(j4Script.quizzes.map(q => q.options[q.answer]));

test('j4: script passes validation', () => eq(validateScript(j4Script, SOURCES), []));

test('j4: quiz answers match the spec and the turtle ship leads the wing (S43)', () => {
  eq(j4Script.quizzes.map(q => q.options[q.answer]), ['의병', '학익진']); // 일어난 차례: 의병(1592년 4월~) → 한산도 대첩(7월)
  const wing = j4Script.wing.done[0];
  ok(wing.text.includes('거북선') && wing.src.includes('S43'), wing.text);
  ok(j4Script.result[0].src.includes('S35'));
});

test('j4: scene — harbor people, turtle ship, and the fleets move the right way', () => {
  const w = testWorld();
  try {
    const s = buildJ4Scene(w);
    eq([...w.npcs.values()].filter(n => !n.spot).map(n => n.id).sort(), ['commoner', 'navy', 'yisunsin']);
    ok(s.turtle, 'turtle ship at the dock');
    s.setStage('lure'); s.setLure(0); const a = s.lure.position.z; s.setLure(1);
    ok(s.lure.position.z < a && s.lure.position.z < STRAIT_Z, 'lure goes north into the strait');
    s.setChase(0); const e0 = s.enemy.position.z; s.setChase(1);
    ok(s.enemy.position.z > e0, 'enemy follows south into open sea');
    s.setStage('won');
    ok(s.enemy.children.every(e => e.userData.smoke.visible), 'smoke after the battle');
  } finally { w.dispose(); }
});

test('j4: completes with touch-only actions', async () => {
  const s = touchSetup(j4Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    const r = await runChapter(JOSEON[3], j4, s.ctx, memSave());
    eq(r.quizCorrect, 2);
    eq(r.firstTryCorrect, 2);
    eq(r.stars, 3);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('j4 D-25: waiting at the strait mouth gets the ship caught; then sailing away succeeds', async () => {
  const s = touchSetup(j4Script.speakers);
  const said = [];
  const say = s.dialogue.say; s.dialogue.say = l => { said.push(l.text); return say(l); };
  let seen = false;
  const bot = touchBot(s, { answers, holdStill: () => seen && !said.includes(j4Script.lure.fail) }); // 적을 본 뒤 처음 한 번은 가만히 있다
  const off = s.w.onUpdate(() => { if (said.includes(j4Script.lure.seen.text)) seen = true; });
  try {
    j4.buildScene(s.w, s.ctx);
    j4.enterStage(s.ctx, 'minigame');
    const r = await j4.minigame(s.ctx);
    ok(said.includes(j4Script.lure.fail), 'caught once');
    eq(r.firstTryCorrect, 1, 'lure missed, wing right');
    ok(s.ctx.testHooks.sunk === 8, 'battle played');
  } finally { off(); bot.stop(); s.done(); }
}, { timeout: 150000 });

test('j4: a turtle ship leads the fleet in the wing formation', async () => {
  const { buildJ4Scene } = await import('../chapters/joseon/j4/scene.js');
  const w = testWorld();
  try { const s = buildJ4Scene(w); s.setStage('harbor'); ok(!s.leadTurtle.visible); ok(s.leadTurtle.parent === w.level, 'in the scene'); s.setStage('wing'); ok(s.leadTurtle.visible); } finally { w.dispose(); }
});

test('j4: when the lure ships turn, the enemy is still far away (gap ≥ 20)', async () => {
  const { buildJ4Scene, STRAIT_Z } = await import('../chapters/joseon/j4/scene.js');
  const w = testWorld();
  try {
    const s = buildJ4Scene(w);
    s.setStage('lure'); s.setLure(0.95);
    const enemyNearest = Math.max(...s.enemy.children.map(c => s.enemy.position.z + c.position.z));
    ok(s.lure.position.z - enemyNearest >= 20, `gap ${s.lure.position.z - enemyNearest}`);
    for (const k of [0, 0.5, 1]) { s.setChase(k); const near = Math.max(...s.enemy.children.map(c => s.enemy.position.z + c.position.z)); ok(s.lure.position.z - near >= 20, `chase gap at ${k}`); }
  } finally { w.dispose(); }
});

test('j4: 이순신 stands in front of the harbour in view, and no rock sits in the ships\' lane', async () => {
  const { buildJ4Scene, STRAIT_Z } = await import('../chapters/joseon/j4/scene.js');
  const w = testWorld();
  try {
    const s = buildJ4Scene(w);
    const yi = w.npcs.get('yisunsin').mesh.position;
    ok(Math.abs(yi.x - s.start[0]) < 5 && Math.abs(yi.z - s.start[1]) < 3, `이순신 near the start (${yi.x}, ${yi.z})`);
    const rocks = [];
    w.level.traverse(o => { if (o.isMesh && o.geometry.type === 'DodecahedronGeometry' && Math.abs(o.position.z - STRAIT_Z) < 15) rocks.push(o.position.x); });
    ok(rocks.length >= 2, 'rocks still mark the narrow strait');
    const half = Math.max(...s.enemy.children.map(e => Math.abs(e.position.x))) + 1.3;
    ok(rocks.every(x => Math.abs(x) - 0.9 > half), `rocks ${rocks} clear of ships (±${half})`);
  } finally { w.dispose(); }
});

test('j4: the attack fires cannons and sinks the enemy ships', async () => {
  const { buildJ4Scene } = await import('../chapters/joseon/j4/scene.js');
  const w = testWorld();
  try {
    const s = buildJ4Scene(w);
    s.setStage('wing'); s.setAdvance(0.85);
    const p = s.playBattle();
    let n = null; p.then(v => { n = v; });
    for (let i = 0; i < 400 && n === null; i++) { w.step(0.05, { x: 0, z: 0 }); await new Promise(r => setTimeout(r, 0)); }
    eq(n, 8, 'all eight hit');
    ok(s.enemy.children.every(e => !e.visible), 'sunk');
    s.setStage('wing');
    ok(s.enemy.children.every(e => e.visible && !e.userData.sink), 'restored for a retry');
  } finally { w.dispose(); }
});

// ---- D-25 ----
test('j4 D-25: harbour gate and board, one-paragraph intro, two-line how-to, people in any order, no general reading sign', () => {
  const w = testWorld();
  try {
    const sc = buildJ4Scene(w);
    ok(sc.gate && sc.gate.leaves.length === 2 && sc.introFrom[1] > sc.start[1], 'gate');
    let board = false; w.level.traverse(o => { if (o.userData && o.userData.title === '수군 포구') board = true; });
    ok(board, 'board');
    eq([...w.npcs.values()].filter(n => n.spot).map(n => n.id).sort(), ['signPanok', 'signTurtle'], 'signs only beside the ships');
    ok(sc.myShip && sc.myShip.userData.oars.length > 0, 'the student\'s ship has oars');
  } finally { w.dispose(); }
  eq(j4Script.intro.length, 1);
  for (const h of [j4Script.sail, j4Script.wing.howto]) eq(h.steps.length, 2);
  ok(!('tooEarly' in j4Script.npc.commoner));
  eq(portTalk('commoner', new Set(['navy']))[0], j4Script.npc.commoner.bridge);
  ok(LURE.open.z > LURE.mouth.z, 'the open sea is south of the strait mouth');
});

test('j4 D-25: the fleet spreads into the wing with one empty spot on the curve; the turtle ship charges to the front', async () => {
  const w = testWorld();
  try {
    const s = buildJ4Scene(w);
    s.setStage('wing');
    let done = false; s.spreadFleet(1).then(() => { done = true; });
    for (let i = 0; i < 30 && !done; i++) { w.step(0.05, { x: 0, z: 0 }); await new Promise(r => setTimeout(r, 0)); }
    ok(done, 'spread');
    eq(s.fleet.children.length, 5, 'five ships + the student = six');
    ok(s.fleet.children.every(sh => Math.hypot(sh.position.x - s.slot.x, sh.position.z - s.slot.z) > 3), 'the slot is empty');
    ok(s.decoys.every(d => d.z > s.slot.z + 5), 'decoys sit in a straight row behind');
    let t = false; s.turtleCharge(1).then(() => { t = true; });
    for (let i = 0; i < 30 && !t; i++) { w.step(0.05, { x: 0, z: 0 }); await new Promise(r => setTimeout(r, 0)); }
    ok(s.leadTurtle.position.z < Math.min(...s.fleet.children.map(sh => sh.position.z)), 'turtle in front of the wing');
  } finally { w.dispose(); }
});
