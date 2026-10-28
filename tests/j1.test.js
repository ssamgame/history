import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import j1Script from '../chapters/joseon/j1/script.js';
import { buildJ1Scene } from '../chapters/joseon/j1/scene.js';
import j1, { HANYANG_SITE } from '../chapters/joseon/j1/chapter.js';
import { runChapter } from '../core/flow.js';
import { JOSEON, isUnlocked } from '../chapters/index.js';
import { testWorld, touchSetup, touchBot, memSave } from './bot.js';

const answers = new Set(j1Script.quizzes.map(q => q.options[q.answer]));

test('j1: script passes validation', () => eq(validateScript(j1Script, SOURCES), []));

test('j1: quiz answers and the four reasons match the spec', () => {
  eq(j1Script.quizzes.map(q => q.options[q.answer]), ['위화도', '한양']);
  eq(j1Script.reasons.people.length, 6);
  eq(j1Script.reasons.people.filter(p => p.correct).length, 4, 'four reasons (4불가론)');
  ok(j1Script.reasons.people.filter(p => p.correct).every(p => p.talk.some(l => l.src && l.src.includes('S23'))), 'relayed reasons cite S23');
  ok(j1Script.intro.every(l => l.src.includes('S23')));
});

test('j1: chapter is open in 조선편 and loads', async () => {
  const meta = JOSEON[0];
  ok(meta.load, 'j1 has load');
  eq(isUnlocked(meta, { chapterResult: () => null }), true);
  eq((await meta.load()).default.id, 'j1');
});

test('j1: scene builds the camp with three people and a turning army', () => {
  const w = testWorld();
  try {
    const s = buildJ1Scene(w);
    eq([...w.npcs.values()].filter(n => !n.spot).map(n => n.id).sort(), ['archer', 'soldier', 'yiseonggye']);
    s.setTurn(0); const z0 = s.army.position.z; const r0 = s.army.children[0].rotation.y;
    s.setTurn(1); const z1 = s.army.position.z;
    ok(z1 > z0 + 20, `army crosses south ${z0} → ${z1}`);
    ok(Math.abs(r0 - Math.PI) < 1e-6 && s.army.children[0].rotation.y === 0, 'army turns around');
  } finally { w.dispose(); }
});

test('j1: completes with touch-only actions', async () => {
  const s = touchSetup(j1Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    const r = await runChapter(JOSEON[0], j1, s.ctx, memSave());
    eq(r.quizCorrect, 2);
    eq(r.firstTryCorrect, 2);
    eq(r.stars, 3);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('j1: soldiers relay what 이성계 said; a wrong judgement gets the explanation, then the student carries on', async () => {
  const s = touchSetup(j1Script.speakers);
  const said = [];
  const say = s.dialogue.say;
  s.dialogue.say = l => { said.push(l.text); return say(l); };
  const choose = s.dialogue.choose;
  let wrongOnce = true;
  s.dialogue.choose = (p, o, x) => { if (wrongOnce && s.ctx.testHooks.choice != null) { wrongOnce = false; const c = s.ctx.testHooks.choice; s.ctx.testHooks.choice = 1 - c; } return choose(p, o, x); };
  const bot = touchBot(s, { answers });
  try {
    j1.buildScene(s.w, s.ctx);
    j1.enterStage(s.ctx, 'minigame');
    const r = await j1.minigame(s.ctx);
    ok(said.some(t => t.startsWith('× 다시 생각해 봐요.')), 'explanation after the wrong judgement');
    eq(r.firstTryCorrect, 1, 'judging missed once, Hanyang right the first time');
    eq(r.easyModeUsed, false);
    ok(s.ctx.testHooks.march && s.ctx.testHooks.march.done, 'march on the map played');
    eq(s.ctx.testHooks.march.joseon, true, '고려 gives way to 조선 on the map');
    eq(s.ctx.testHooks.built, ['palace', 'jongmyo', 'sajik'], 'three buildings rose at their sites');
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('j1: nothing stands between the camera and the player at the Hanyang site', () => {
  const from = 13; // 학생이 서는 곳(남쪽)
  ok(!HANYANG_SITE.props.some(p => p.z > from - 1 && (p.type === 'wall' || p.type === 'hanok' || p.type === 'western')), 'no wall south of the player');
});

test('j1: resume at quiz shows the army already gone south', () => {
  const s = touchSetup(j1Script.speakers);
  try {
    const sc = j1.buildScene(s.w, s.ctx);
    j1.enterStage(s.ctx, 'quiz');
    ok(sc.army.position.z > 20, 'army crossed');
  } finally { s.done(); }
});

// ---- D-22 ----
import { campTalk, TOUR } from '../chapters/joseon/j1/chapter.js';

test('j1 D-22: camp gate and 위화도 board, no reading signs, one-paragraph intro, two-line how-to', () => {
  const w = testWorld();
  try {
    const sc = buildJ1Scene(w);
    ok(sc.gate && sc.gate.leaves.length === 2, 'gate');
    ok(sc.introFrom[1] > sc.start[1], 'comes in through the gate');
    let board = false; w.level.traverse(o => { if (o.userData && o.userData.title === '위화도') board = true; });
    ok(board, '위화도 board');
    eq([...w.npcs.values()].filter(n => n.spot).length, 0, 'no reading signs');
  } finally { w.dispose(); }
  ok(j1Script.intro.length <= 3); ok(j1Script.intro.every(l => !l.text.includes('\n'))); // 자막 장면(C-03): 짧은 문장 몇 개
  eq(j1Script.hanyang.howto.steps.length, 2);
  ok(j1Script.npc.archer.first.some(l => l.text.includes('압록강에 있는 섬')), 'island fact moved into a person');
  ok(j1Script.npc.soldier.first.some(l => l.text.includes('5만여 명')), 'army fact moved into a person');
});

test('j1 D-22/D-30: soldiers talk in any order and pick up from each other; 이성계 waits until all were heard', () => {
  ok(j1Script.npc.yiseonggye.wait[0].text.includes('모두'));
  eq(campTalk('soldier', new Set()), j1Script.npc.soldier.first, 'soldier first');
  eq(campTalk('archer', new Set(['soldier']))[0], j1Script.npc.archer.bridge, 'archer picks up from the soldier');
  ok(!('tooEarly' in j1Script.npc.soldier), 'soldier never blocks');
  ok(j1Script.npc.yiseonggye.turn[0].text.includes('군사를 돌려'), '이성계 decides to turn back');
  ok(j1Script.npc.yiseonggye.turn[0].src.includes('S23'));
});

test('j1 D-22: before building, the 관리 leads a walk north, east and west of the Hanyang site, one sourced line at each', async () => {
  const s = touchSetup(j1Script.speakers);
  const said = [];
  const say = s.dialogue.say; s.dialogue.say = l => { said.push(l); return say(l); };
  const bot = touchBot(s, { answers });
  try {
    j1.buildScene(s.w, s.ctx);
    j1.enterStage(s.ctx, 'minigame');
    await j1.minigame(s.ctx);
    const T = j1Script.hanyang.tour;
    const at = ['north', 'east', 'west'].map(k => said.findIndex(l => l === T[k][0]));
    ok(at.every(i => i >= 0) && at[0] < at[1] && at[1] < at[2], `tour lines in order ${at}`);
    ok(['north', 'east', 'west'].every(k => T[k][0].src), 'sourced');
    eq(TOUR.stops.length, 3);
    eq(s.ctx.testHooks.built, ['palace', 'jongmyo', 'sajik']);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });
