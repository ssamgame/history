import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import j4Script from '../chapters/joseon/j4/script.js';
import { buildJ4Scene, STRAIT_Z } from '../chapters/joseon/j4/scene.js';
import j4, { WING_BOARD } from '../chapters/joseon/j4/chapter.js';
import { runChapter } from '../core/flow.js';
import { JOSEON } from '../chapters/index.js';
import { testWorld, touchSetup, touchBot, memSave } from './bot.js';

const answers = new Set(j4Script.quizzes.map(q => q.options[q.answer]));
const places = { '판옥선': ['w1', 'w2', 'w3', 'w4', 'w5'] };

test('j4: script passes validation', () => eq(validateScript(j4Script, SOURCES), []));

test('j4: quiz answers match the spec and the turtle ship leads the wing (S43)', () => {
  eq(j4Script.quizzes.map(q => q.options[q.answer]), ['의병', '학익진']); // 일어난 차례: 의병(1592년 4월~) → 한산도 대첩(7월)
  const wing = j4Script.wing.done[0];
  ok(wing.text.includes('거북선') && wing.src.includes('S43'), wing.text);
  ok(j4Script.result[0].src.includes('S35'));
});

test('j4: wing board has five curved spots and three wrong back-row spots', () => {
  eq(WING_BOARD.slots.filter(s => s.answer === 'ship').length, 5);
  eq(WING_BOARD.slots.filter(s => s.answer === null).length, 3);
  const wing = WING_BOARD.slots.filter(s => s.answer === 'ship');
  ok(wing[2].xy[1] > wing[0].xy[1] && wing[2].xy[1] > wing[4].xy[1], 'middle is lower than the wing tips (a curve)');
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
    ok(s.enemy.children.every(e => e.userData.smoke.visible), 'smoke, no fire');
  } finally { w.dispose(); }
});

test('j4: completes with touch-only actions', async () => {
  const s = touchSetup(j4Script.speakers);
  const bot = touchBot(s, { answers, places });
  try {
    const r = await runChapter(JOSEON[3], j4, s.ctx, memSave());
    eq(r.quizCorrect, 2);
    eq(r.firstTryCorrect, 3);
    eq(r.stars, 3);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('j4: turning the lure ships too early gives the early hint', async () => {
  const s = touchSetup(j4Script.speakers);
  const said = [];
  const say = s.dialogue.say;
  s.dialogue.say = l => { said.push(l.text); return say(l); };
  const bot = touchBot(s, { answers, places, pressEarlyOnce: true });
  try {
    j4.buildScene(s.w, s.ctx);
    j4.enterStage(s.ctx, 'minigame');
    const r = await j4.minigame(s.ctx);
    ok(said.includes(j4Script.lure.early), 'early hint');
    eq(r.firstTryCorrect, 2);
  } finally { bot.stop(); s.done(); }
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
