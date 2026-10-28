import { test, eq, ok } from './harness.js';
import * as THREE from 'three';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import j2Script from '../chapters/joseon/j2/script.js';
import { buildJ2Scene } from '../chapters/joseon/j2/scene.js';
import j2, { BOARDS, MODELS, LETTER_SPOTS, courtTalk, markCourt, VOWEL_LABEL_Y } from '../chapters/joseon/j2/chapter.js';
import { runChapter } from '../core/flow.js';
import { JOSEON } from '../chapters/index.js';
import { testWorld, touchSetup, touchBot, memSave } from './bot.js';

const answers = new Set(j2Script.quizzes.map(q => q.options[q.answer]));

test('j2: script passes validation', () => eq(validateScript(j2Script, SOURCES), []));

test('j2: quiz answers and letter shapes match the spec (S27, S28)', () => {
  eq(j2Script.quizzes.map(q => q.options[q.answer]), ['세종', '혀가 윗잇몸에 붙는 모양']);
  const cap = a => j2Script.consonants.pictures.find(p => p.answer === a).caption;
  eq(['ㄱ', 'ㄴ', 'ㅁ', 'ㅅ', 'ㅇ'].map(cap), ['혀뿌리가 목구멍을 막는 모양', '혀가 윗잇몸에 붙는 모양', '입 모양', '이 모양', '목구멍 모양']);
  eq(j2Script.vowels.models.find(m => m.letter === 'ㆍ').label, '하늘');
  eq(j2Script.strokes.cards, ['ㄴ', 'ㄷ', 'ㅌ']);
  // 그림 보고 고르기: 본뜬 모양 그림 → 글자
  eq(Object.fromEntries(j2Script.consonants.pictures.map(p => [p.shape, p.answer]).sort()), { mouth: 'ㅁ', root: 'ㄱ', teeth: 'ㅅ', throat: 'ㅇ', tongue: 'ㄴ' });
  eq(Object.fromEntries(j2Script.vowels.pictures.map(p => [p.shape, p.answer])), { sky: 'ㆍ', earth: 'ㅡ', person: 'ㅣ' });
  eq(j2Script.strokes.steps.map(s => [s.base, s.answer]), [['ㄴ', 'ㄷ'], ['ㄷ', 'ㅌ']]);
  ok(j2Script.result[0].text.includes('1443') && j2Script.result[0].text.includes('1446'));
});

test('j2: scene builds a palace with three people, player is a palace kid', () => {
  const w = testWorld();
  try {
    buildJ2Scene(w);
    eq([...w.npcs.values()].filter(n => !n.spot).map(n => n.id).sort(), ['commoner', 'scholar', 'sejong']);
    ok(j2.player && j2.player.hat === 'topknot');
  } finally { w.dispose(); }
});

test('j2: completes with touch-only actions', async () => {
  const s = touchSetup(j2Script.speakers);
  const bot = touchBot(s, { answers });
  try {
    const r = await runChapter(JOSEON.find(c => c.id === 'j2'), j2, s.ctx, memSave());
    eq(r.quizCorrect, 2);
    eq(r.firstTryCorrect, 3);
    eq(r.firstTryTotal, 3);
    eq(r.stars, 3);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('j2: a wrong letter pick gets the hint and the student carries on (not from the start)', async () => {
  const s = touchSetup(j2Script.speakers);
  const said = [];
  const say = s.dialogue.say; s.dialogue.say = l => { said.push(l.text); return say(l); };
  let wrongOnce = true;
  const choose = s.dialogue.choose;
  s.dialogue.choose = (p, o, x) => { if (wrongOnce && s.ctx.testHooks.choice != null) { wrongOnce = false; s.ctx.testHooks.choice = (s.ctx.testHooks.choice + 1) % o.length; } return choose(p, o, x); };
  const bot = touchBot(s, { answers });
  try {
    j2.buildScene(s.w, s.ctx);
    j2.enterStage(s.ctx, 'minigame');
    const r = await j2.minigame(s.ctx);
    ok(said.some(t => t.includes(j2Script.consonants.fail)), 'hint said');
    eq(r.firstTryCorrect, 2, 'consonant part missed once, the rest right');
    eq(r.firstTryTotal, 3);
    eq(s.ctx.testHooks.carved.length, 5, 'all five boards carved');
    eq(s.ctx.testHooks.word, '한글', 'letters gathered into 한글');
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('j2: intro says people found 한자 hard, not that no writing existed', () => {
  ok(!j2Script.intro[0].text.includes('방법이 없'), j2Script.intro[0].text);
  ok(j2Script.intro[0].text.includes('한자'));
});

// ---- D-24 ----
test('j2 D-24: palace gate and 경복궁 board, one-paragraph intro, two-line how-to, people in any order, 세종 decides', () => {
  const w = testWorld();
  try {
    const sc = buildJ2Scene(w);
    ok(sc.gate && sc.gate.leaves.length === 2 && sc.introFrom[1] > sc.start[1], 'gate');
    let board = false; w.level.traverse(o => { if (o.userData && o.userData.title === '경복궁') board = true; });
    ok(board, '경복궁 board');
  } finally { w.dispose(); }
  eq(j2Script.intro.length, 1);
  for (const h of [j2Script.consonants.howto, j2Script.vowels.howto, j2Script.wordsHowto]) eq(h.steps.length, 2);
  ok(!('tooEarly' in j2Script.npc.scholar), 'scholar never blocks');
  eq(courtTalk('scholar', new Set(['commoner']))[0], j2Script.npc.scholar.bridge);
  const decide = j2Script.npc.sejong.first[0];
  ok(decide.text.includes('새 글자를 내가 직접 만들겠다') && decide.src.includes('S27'), 'decision line, sourced');
});

test('j2 D-24: picking places are apart and no card games are left', () => {
  const pts = [...BOARDS.map(b => [b.x, b.z + 2.4]), ...Object.values(MODELS).map(m => [m.x, m.z + 2.4])];
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) ok(Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) >= 2.6, `${i}-${j}`);
  ok(LETTER_SPOTS.length >= 6);
  ok(!JSON.stringify(j2Script.words).includes('options'), 'words are gathered, not chosen on cards');
});

// ---- D-30 ----
const fakeCtx = w => ({ world: w, hud: { setCounter() {} }, setGoal() {} });
test('j2 C-01/C-03: quest list without quiz, everyone first, no road signs (facts moved to people)', () => {
  ok(!j2Script.goals.some(g => g.includes('확인')), 'no quiz goal');
  ok(j2Script.npc.sejong.wait[0].text.includes('모두'), 'wait says everyone');
  ok(j2Script.more.text.includes('모두'), 'more says everyone');
  for (const k of ['signThrone', 'signJiphyeon', 'signHaerye']) ok(!(k in j2Script.npc), k);
  ok(j2Script.npc.commoner.first.some(l => l.text.includes('근정전') && l.src.includes('S46')), '근정전 to the commoner');
  ok(j2Script.npc.scholar.first.some(l => l.text.includes('1420') && l.src.includes('S29')), '집현전 year to the scholar');
  ok(j2Script.result.some(l => l.text.includes('해례본') && l.src.includes('S49')), '해례본 in the closing lines');
  ok(j2Script.intro.every(l => !l.text.includes('\n')));
  const w = testWorld();
  try {
    buildJ2Scene(w);
    eq([...w.npcs.values()].filter(n => n.spot).length, 0, 'no reading signs');
    const names = w.level.children.map(o => o.name).filter(n => n.startsWith('plaque:')).sort();
    eq(names, ['plaque:근정전', 'plaque:집현전']);
    const heard = new Set(['commoner']);
    markCourt(fakeCtx(w), heard);
    ok(!w.npcs.get('sejong').mark.visible, '세종 mark hidden until everyone is heard');
    heard.add('scholar'); markCourt(fakeCtx(w), heard);
    ok(w.npcs.get('sejong').mark.visible, '세종 mark after everyone');
  } finally { w.dispose(); }
});

test('j2 K-01: 세종 sits on the highest dais, above everyone, still reachable', () => {
  const w = testWorld();
  try {
    const sc = buildJ2Scene(w);
    const sj = w.npcs.get('sejong').mesh;
    w.level.updateMatrixWorld(true);
    const headY = m => m.userData.head.getWorldPosition(new THREE.Vector3()).y;
    ok(sj.userData.seatLift > 0.8, `raised ${sj.userData.seatLift}`);
    for (const n of w.npcs.values()) if (n.id !== 'sejong') ok(headY(sj) > headY(n.mesh) + 0.8, n.id);
    ok(sj.userData.seated && sj.userData.legs[0].rotation.x < -1, 'seated');
    ok(sc.dais && sc.dais.userData.top > 1.4, 'dais higher than the 월대 (1.4)');
    w.player.position.set(sj.position.x, 0, sj.position.z + 2.1); // 단상 앞(남쪽)에서 대화 거리 안
    eq(w.nearestNpc(2.8)?.id, 'sejong');
  } finally { w.dispose(); }
});

test('j2 C-02/C-03: intro scene and a portal on open ground', () => {
  const w = testWorld();
  try {
    j2.buildScene(w);
    const sc = j2.introScene({ world: w });
    ok(sc.shots.length >= j2Script.intro.length);
    const [px, pz] = j2.portal.at, b = w.bounds;
    ok(px > b.x0 + 2 && px < b.x1 - 2 && pz > b.z0 + 1 && pz < b.z1 - 1, 'inside');
    for (const n of w.npcs.values()) ok(Math.hypot(n.mesh.position.x - px, n.mesh.position.z - pz) > 3.5, `clear of ${n.id}`);
  } finally { w.dispose(); }
});

test('j2 K-02/K-03: each game starts by talking to 세종; vowel to make is on the floor, not the counter', async () => {
  const s = touchSetup(j2Script.speakers);
  const said = [], counters = [];
  const dist = () => { const a = s.w.player.position, b = s.w.npcs.get('sejong').mesh.position; return Math.hypot(a.x - b.x, a.z - b.z); };
  const say = s.dialogue.say; s.dialogue.say = l => { said.push({ l, near: dist() }); return say(l); };
  const setCounter = s.hud.setCounter; s.hud.setCounter = t => { counters.push(t); return setCounter(t); };
  const bot = touchBot(s, { answers });
  try {
    j2.buildScene(s.w, s.ctx);
    j2.enterStage(s.ctx, 'minigame');
    await j2.minigame(s.ctx);
    const S = j2Script.npc.sejong;
    const at = l => said.findIndex(x => x.l === l);
    const iC = at(j2Script.consonants.done[0]), iV = at(S.vowelQuest[0]), iVa = said.findIndex(x => x.l.text === j2Script.vowels.ask('ㅡ').text), iW = at(S.wordQuest[0]), iWi = at(j2Script.words[0].intro);
    ok(iC >= 0 && iC < iV && iV < iVa && iVa < iW && iW < iWi, `order ${[iC, iV, iVa, iW, iWi]}`);
    ok(said[iV].near < 3.4 && said[iW].near < 3.4, 'talked next to 세종'); // 단상 앞 계단 아래
    ok(!counters.some(t => t && /「[ㅡㆍㅣ]」/.test(t)), 'letter is not on the counter');
    eq(s.ctx.testHooks.floorLetters, ['ㅡ', 'ㆍ', 'ㅣ']);
    ok(VOWEL_LABEL_Y.person > 3.8, 'label above the person model face');
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });
