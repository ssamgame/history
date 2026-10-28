import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import j2Script from '../chapters/joseon/j2/script.js';
import { buildJ2Scene } from '../chapters/joseon/j2/scene.js';
import j2, { BOARDS, MODELS, LETTER_SPOTS, courtTalk } from '../chapters/joseon/j2/chapter.js';
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
