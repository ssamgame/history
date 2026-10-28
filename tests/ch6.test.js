import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import { LOOKS } from '../content/characters.js';
import { runChapter } from '../core/flow.js';
import { CHAPTERS } from '../chapters/index.js';
import ch6Script from '../chapters/ch6/script.js';
import ch6 from '../chapters/ch6/chapter.js';
import { buildCh6Scene } from '../chapters/ch6/scene.js';
import { sailLeg } from '../chapters/ch6/chapter.js';
import { testWorld, touchSetup, touchBot, memSave } from './bot.js';
import * as THREE from 'three';

const answers = new Set(ch6Script.quizzes.map(q => q.options[q.answer]));

test('ch6: script passes validation', () => {
  eq(validateScript(ch6Script, SOURCES), []);
  for (const [id, sp] of Object.entries(ch6Script.speakers)) if (id !== 'guide') ok(LOOKS[sp.look], id);
  eq(ch6Script.quizzes.map(q => q.options[q.answer]), ['고려 조정이 몽골과 싸움을 멈추고 개경으로 돌아가는 데 반대해서', '강화도 → 진도 → 제주도']); // 까닭(1270) → 옮겨 간 순서(1270~1273)
  ok(!('meet' in ch6Script) && !('fit' in ch6Script), 'no meeting of all the people (D-20: 편 복습 퀴즈로)');
});

test('ch6: destinations start ahead of the boat', () => {
  const w = testWorld();
  const s = buildCh6Scene(w);
  eq(s.legs.length, 2);
  for (const leg of s.legs) ok(leg.to.z < leg.from[1] - 30, `goal ${leg.to.z} is ahead (north) of start ${leg.from[1]}`);
  ok(w.npcs.has('baejungson'), 'baejungson at the port');
  w.dispose();
});

test('ch6: caught by a pursuer restarts the leg', async () => {
  const s = touchSetup(ch6Script.speakers);
  const said = [];
  const say = s.dialogue.say; s.dialogue.say = l => { said.push(l.text); return say(l); };
  let caught = false;
  let sc = null;
  const bot = touchBot(s, { answers, holdStill: () => sc && sc.boat.visible && !caught && !said.includes(ch6Script.sail.failHint) }); // 배를 모는 동안만 가만히 있어 잡힌다
  try {
    sc = ch6.buildScene(s.w, s.ctx);
    ch6.enterStage(s.ctx, 'minigame');
    await ch6.minigame(s.ctx);
    ok(said.includes(ch6Script.sail.failHint), 'caught once, then sailed again');
    caught = true;
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('ch6: completes with touch-only actions', async () => {
  const s = touchSetup(ch6Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    const r = await runChapter(CHAPTERS[5], ch6, s.ctx, memSave());
    eq(r.quizCorrect, 2); eq(r.easyModeUsed, false); eq(r.stars, 3);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('ch6: pursuers wait a moment before chasing so the student can get going', async () => {
  const s = touchSetup(ch6Script.speakers);
  try {
    const sc = ch6.buildScene(s.w, s.ctx);
    ch6.enterStage(s.ctx, 'minigame');
    sailLeg(s.ctx, sc.legs[0], false);
    const start = sc.pursuers.map(p => [p.position.x, p.position.z]);
    for (let i = 0; i < 40; i++) s.w.step(0.05, { x: 0, z: 0 }); // 2초
    eq(sc.pursuers.map(p => [p.position.x, p.position.z]), start, 'not moving yet');
    for (let i = 0; i < 40; i++) s.w.step(0.05, { x: 0, z: 0 });
    ok(sc.pursuers.some((p, i) => p.position.x !== start[i][0]), 'then they chase');
  } finally { s.done(); }
});

test('ch6: 김통정 stands on solid ground at 용장성 and 항파두리, and 제주 is solid from the sea', () => {
  const w = testWorld();
  try {
    const sc = buildCh6Scene(w);
    for (const id of ['jindo', 'jeju']) {
      const A = sc.lands[id], g = new THREE.Box3().setFromObject(A.ground);
      for (const [x, z] of [A.kim, A.shore]) ok(x > g.min.x && x < g.max.x && z > g.min.z && z < g.max.z && g.max.y >= -0.05, `${id} ground under ${x},${z}`);
      let board = false; w.level.traverse(o => { if (o.userData && o.userData.title === A.name) board = true; });
      ok(board, `${A.name} name board`);
    }
    const leg = sc.legs[1];
    w.bounds = sc.seaBounds;
    w.player.position.set(leg.to.x, 0, leg.to.z);
    for (let i = 0; i < 60; i++) w.step(0.05, { x: 0, z: -1 });
    ok(w.player.position.z > leg.to.z - 4, `stopped at the shore (z ${w.player.position.z.toFixed(1)})`);
  } finally { w.dispose(); }
});

// ---- D-19 ----
test('ch6 D-19: port gate and 강화도 board, one-paragraph intro, people talk in any order and gather to 배중손', async () => {
  const w = testWorld();
  const sc = buildCh6Scene(w);
  ok(sc.gate && sc.gate.leaves.length === 2, 'gate');
  ok(sc.introFrom[1] > sc.start[1], 'comes in through the gate');
  let board = false; w.level.traverse(o => { if (o.userData && o.userData.title === '강화도') board = true; });
  ok(board, '강화도 board');
  for (const id of ['minister', 'sambyeolcho', 'villager', 'baejungson']) ok(w.npcs.has(id), id);
  eq([...w.npcs.values()].filter(n => n.spot).length, 0, 'no reading signs');
  w.dispose();
  eq(ch6Script.intro.length, 2); ok(ch6Script.intro.every(l => !l.text.includes('\n'))); // D-30: 자막 장면 두 문장
  ok(['minister', 'sambyeolcho', 'villager'].every(id => ch6Script.npc[id].every(l => l.src && l.src.includes('S21'))));
  ok(ch6Script.npc.baejungson.decide[0].text.includes('진도'));
  eq(ch6Script.sail.howto.steps.length, 2);
  ok(!JSON.stringify(ch6Script).includes('배중손 장군'));
});

test('ch6 D-20: sailing — low camera just behind the boat, oars row while moving, 몽골 배 start ahead on the sides', async () => {
  const s = touchSetup(ch6Script.speakers);
  try {
    const sc = ch6.buildScene(s.w, s.ctx);
    ch6.enterStage(s.ctx, 'minigame');
    for (const leg of sc.legs) ok(leg.chasers.every(([x, z]) => z < leg.from[1] - 10 && Math.abs(x - leg.from[0]) > 12), 'ahead and to the side');
    sailLeg(s.ctx, sc.legs[0], false);
    ok(s.w.followOffset && s.w.followOffset.y < 3.5 && s.w.followOffset.z < 7, 'low camera behind the boat');
    const oar = sc.boat.userData.oars[0], r0 = oar.rotation.y;
    for (let i = 0; i < 6; i++) s.w.step(0.05, { x: 0, z: -1 });
    ok(Math.abs(oar.rotation.y - r0) > 0.05, 'oars move while rowing');
    const arms = sc.boat.children.find(c => c.userData.arms)?.userData.arms;
    ok(arms && arms[0].rotation.x < -0.4, 'the rower pulls the oar');
  } finally { s.done(); }
});

test('ch6 D-19: full run uses no cards, low camera on land, sailing camera only at sea', async () => {
  const s = touchSetup(ch6Script.speakers);
  const bot = touchBot(s, { answers });
  let cards = 0, landHigh = 0;
  let sc = null;
  const off = s.w.onUpdate(() => {
    if (s.ui.querySelector('.fit-figure, .order-card, .choose-card')) cards += 1;
    if (sc && !sc.boat.visible && !s.w.closeView && !s.ctx.testHooks.quizView) landHigh += 1;
  });
  const build = ch6.buildScene;
  try {
    const r = await runChapter(CHAPTERS[5], { ...ch6, buildScene(w) { sc = build(w); return sc; } }, s.ctx, memSave());
    eq(cards, 0, 'no cards'); eq(landHigh, 0, 'low camera on land');
    eq(r.firstTryCorrect, 2); eq(r.quizCorrect, 2);
  } finally { off(); bot.stop(); s.done(); }
}, { timeout: 200000 });
