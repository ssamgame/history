import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import j2Script from '../chapters/joseon/j2/script.js';
import { buildJ2Scene } from '../chapters/joseon/j2/scene.js';
import j2, { CONSONANTS, VOWELS, YARD, C_BINS } from '../chapters/joseon/j2/chapter.js';
import { runChapter } from '../core/flow.js';
import { JOSEON } from '../chapters/index.js';
import { testWorld, touchSetup, touchBot, memSave } from './bot.js';

const answers = new Set(j2Script.quizzes.map(q => q.options[q.answer]));

test('j2: script passes validation', () => eq(validateScript(j2Script, SOURCES), []));

test('j2: quiz answers and letter shapes match the spec (S27, S28)', () => {
  eq(j2Script.quizzes.map(q => q.options[q.answer]), ['세종', '혀가 윗잇몸에 붙는 모양']);
  const shape = id => CONSONANTS.slots.find(s => s.answer === id).label;
  eq([shape('g'), shape('n'), shape('m'), shape('s'), shape('o')], ['혀뿌리가 목구멍을 막는 모양', '혀가 윗잇몸에 붙는 모양', '입 모양', '이 모양', '목구멍 모양']);
  eq(VOWELS.slots.find(s => s.answer === 'dot').label.startsWith('하늘'), true);
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
    eq(r.firstTryCorrect, 4);
    eq(r.firstTryTotal, 4);
    eq(r.stars, 3);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('j2: a wrong letter pick shows the hint and the student carries on (not from the start)', async () => {
  const s = touchSetup(j2Script.speakers);
  const said = [];
  const say = s.dialogue.say;
  s.dialogue.say = l => { said.push(l.text); return say(l); };
  const bot = touchBot(s, { answers });
  s.ctx.testHooks.chooseWrongOnce = 'ㅁ'; // 처음 그림(혀뿌리 모양)에서 한 번은 ㅁ을 고른다
  let hinted = false;
  const mo = new MutationObserver(() => { if (s.ui.textContent.includes(j2Script.consonants.fail)) hinted = true; });
  mo.observe(s.ui, { subtree: true, childList: true, characterData: true });
  const off = () => mo.disconnect();
  try {
    j2.buildScene(s.w, s.ctx);
    j2.enterStage(s.ctx, 'minigame');
    const r = await j2.minigame(s.ctx);
    ok(hinted, 'hint shown on the card');
    eq(r.firstTryCorrect, 3, 'consonant round missed once, the rest right');
    eq(r.firstTryTotal, 4);
  } finally { off(); bot.stop(); s.done(); }
}, { timeout: 150000 });

test('j2: intro says people found 한자 hard, not that no writing existed', () => {
  ok(!j2Script.intro[0].text.includes('방법이 없'), j2Script.intro[0].text);
  ok(j2Script.intro[0].text.includes('한자'));
});
