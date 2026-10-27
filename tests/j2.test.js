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
    eq(r.firstTryCorrect, 1);
    eq(r.firstTryTotal, 1, 'one play: 글자 조립소');
    eq(r.stars, 3);
  } finally { bot.stop(); s.done(); }
}, { timeout: 150000 });

test('j2: a letter out of order bounces with the hint and the student carries on', async () => {
  const s = touchSetup(j2Script.speakers);
  const bot = touchBot(s, { answers });
  s.ctx.testHooks.wrongOnce = true;
  let hinted = false;
  const mo = new MutationObserver(() => { if (s.ui.textContent.includes(j2Script.wordsFail)) hinted = true; });
  mo.observe(s.ui, { subtree: true, childList: true, characterData: true });
  try {
    j2.buildScene(s.w, s.ctx);
    j2.enterStage(s.ctx, 'minigame');
    const r = await j2.minigame(s.ctx);
    ok(hinted, 'hint shown on the board');
    eq(r, { firstTryCorrect: 0, firstTryTotal: 1, easyModeUsed: false }, 'missed once, carried on');
  } finally { mo.disconnect(); bot.stop(); s.done(); }
}, { timeout: 150000 });

test('j2: 글자 조립소 builds syllable blocks the 모아쓰기 way', async () => {
  const { assemble, split } = await import('../chapters/kit/assemble.js');
  eq(split('한'), ['ㅎ', 'ㅏ', 'ㄴ']); eq(split('무'), ['ㅁ', 'ㅜ']); eq(split('글'), ['ㄱ', 'ㅡ', 'ㄹ']);
  const s = touchSetup(j2Script.speakers);
  try {
    const p = assemble(s.ctx, { word: '나무', decoys: ['ㅓ'] });
    const blocks = [...s.ui.querySelectorAll('.asm-block')];
    eq(blocks.length, 2);
    ok(!blocks[0].children[1].classList.contains('wide'), 'ㅏ sits to the right');
    ok(blocks[1].children[1].classList.contains('wide'), 'ㅜ sits below');
    for (const l of ['ㄴ', 'ㅏ', 'ㅁ', 'ㅜ']) s.ui.querySelector(`.asm-tile[data-letter="${l}"]`).click();
    eq((await p).ok, true);
  } finally { s.done(); }
});

test('j2: intro says people found 한자 hard, not that no writing existed', () => {
  ok(!j2Script.intro[0].text.includes('방법이 없'), j2Script.intro[0].text);
  ok(j2Script.intro[0].text.includes('한자'));
});
