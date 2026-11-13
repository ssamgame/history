import { test, eq, ok } from './harness.js';
import { runChapter } from '../core/flow.js';
import { createStorage } from '../core/storage.js';
import { createSave } from '../core/save.js';

function memSave() {
  const m = new Map();
  return createSave(createStorage({ getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) }));
}
const quizzes = [
  { kind: 'quiz', question: 'Q1', options: ['가', '나', '다'], answer: 0, explain: 'E1', src: ['S1'] },
  { kind: 'quiz', question: 'Q2', options: ['가', '나', '다'], answer: 1, explain: 'E2', src: ['S1'] },
];
function fakeChapter(log, { firstTryCorrect = 2, easyModeUsed = false } = {}) {
  return {
    id: 'fake', script: { intro: [{ who: 'narr', text: 'x', src: ['S1'] }] }, quizzes,
    buildScene() { log.push('build'); },
    enterStage(ctx, stage) { log.push(`enter:${stage}`); },
    async explore() { log.push('explore'); },
    async minigame() { log.push('minigame'); return { firstTryCorrect, firstTryTotal: 2, easyModeUsed }; },
  };
}
function fakeCtx(log, picks) {
  return {
    screens: { showIntroCard: async () => { log.push('intro'); } },
    dialogue: { quiz: async q => { log.push(`quiz:${q.question}`); return { correct: picks.shift() === q.answer }; }, close() {} },
  };
}
const meta = { id: 'fake', no: 1, title: '가짜 장' };

test('flow: time spent before closing the game is kept when resuming', async () => {
  const log = [], save = memSave();
  save.data.current = { id: 'fake', stage: 'quiz', carry: { firstTryCorrect: 0, firstTryTotal: 0, easyModeUsed: false }, elapsed: 300 };
  const r = await runChapter(meta, fakeChapter(log), fakeCtx(log, [0, 1]), save, { resumeStage: 'quiz' });
  ok(r.seconds >= 300 && r.seconds < 310, `seconds ${r.seconds}`);
});

test('flow: checkpoints record time spent so far', async () => {
  const log = [], save = memSave();
  let seen = null;
  const ch = fakeChapter(log);
  ch.minigame = async () => { await new Promise(r => setTimeout(r, 1100)); return { firstTryCorrect: 0, firstTryTotal: 0, easyModeUsed: false }; };
  const ctx = fakeCtx(log, [0, 1]);
  const quiz = ctx.dialogue.quiz;
  ctx.dialogue.quiz = async q => { if (!seen) seen = { ...save.data.current }; return quiz(q); };
  await runChapter(meta, ch, ctx, save);
  eq(seen.stage, 'quiz');
  ok(seen.elapsed >= 1, `elapsed ${seen.elapsed}`);
});

test('flow: runs stages in order and saves checkpoints', async () => {
  const log = [], save = memSave();
  const seen = [];
  const orig = save.checkpoint; save.checkpoint = (id, stage) => { seen.push(stage); orig(id, stage); };
  const r = await runChapter(meta, fakeChapter(log), fakeCtx(log, [0, 1]), save);
  eq(log, ['intro', 'build', 'explore', 'minigame', 'quiz:Q1', 'quiz:Q2']);
  eq(seen, ['intro', 'explore', 'minigame', 'quiz']);
  eq(r.quizCorrect, 2); eq(r.quizTotal, 2);
  eq(save.data.current, null);
  eq(save.chapterResult('fake').stars, 3);
});

test('flow: resume from checkpoint does not double count', async () => {
  const log = [], save = memSave();
  save.checkpoint('fake', 'quiz');
  const r = await runChapter(meta, fakeChapter(log), fakeCtx(log, [0, 2]), save, { resumeStage: 'quiz' });
  ok(!log.includes('minigame'), 'minigame skipped');
  ok(log.includes('enter:quiz'), 'chapter told where it resumes');
  eq(r.firstTryTotal, 0);
  eq(r.quizTotal, 2);
  eq(r.quizCorrect, 1);
  eq(Object.keys(save.data.chapters), ['fake']);
});

test('flow: chapter result stars use quiz and easy mode', async () => {
  const log = [], save = memSave();
  const r = await runChapter(meta, fakeChapter(log, { easyModeUsed: true }), fakeCtx(log, [0, 1]), save);
  eq(r.stars, 2);
});

test('flow: wrong quizzes are kept with question, right answer and explanation', async () => {
  const log = [], save = memSave();
  const r = await runChapter(meta, fakeChapter(log), fakeCtx(log, [2, 1]), save);
  eq(r.wrongQuizzes, [{ question: 'Q1', answer: '가', explain: 'E1' }]);
});

test('flow: resume at quiz keeps easy mode used in the minigame', async () => {
  const log = [], save = memSave();
  runChapter(meta, { ...fakeChapter(log), async minigame() { return { firstTryCorrect: 0, firstTryTotal: 0, easyModeUsed: true }; } },
    { ...fakeCtx(log, []), dialogue: { quiz: () => new Promise(() => {}), close() {} } }, save); // 퀴즈에서 멈춘 채로 둔다
  // 퀴즈 도중 멈춘 상태 그대로 새로 불러온다
  await new Promise(r => setTimeout(r, 20));
  eq(save.data.current.stage, 'quiz');
  const r = await runChapter(meta, fakeChapter([]), fakeCtx([], [0, 1]), save, { resumeStage: 'quiz' });
  eq(r.easyModeUsed, true);
  eq(r.stars, 2);
});

// 2026-11-13 선생님: 고려 4장 — 이야기(저고여 사건)가 끝난 뒤에 타임머신에서 내린다
test('flow: 장에 prelude가 있으면 도착 연출보다 먼저 돌고, 이어하기(탐험부터)에서는 돌지 않는다', async () => {
  const log = [], save = memSave();
  const ch = { ...fakeChapter(log), async prelude() { log.push('prelude'); } };
  const ctx = { ...fakeCtx(log, [0, 1]), arrival: async () => { log.push('arrival'); } };
  await runChapter(meta, ch, ctx, save);
  ok(log.indexOf('prelude') >= 0 && log.indexOf('prelude') < log.indexOf('arrival') && log.indexOf('arrival') < log.indexOf('explore'), log.join(','));
  log.length = 0;
  await runChapter(meta, ch, { ...fakeCtx(log, [0, 1]), arrival: async () => { log.push('arrival'); } }, save, { resumeStage: 'explore' });
  ok(!log.includes('prelude') && !log.includes('arrival') && log.includes('explore'), log.join(','));
  const ch4 = (await import('../chapters/ch4/chapter.js')).default; eq(typeof ch4.prelude, 'function', '고려 4장은 저고여 사건을 먼저 본다');
  const { arrivalLine } = await import('../content/avatar.js'); ok(arrivalLine({ years: '1231~1253', place: '개경' }, null).startsWith('1231년 개경에 도착했어'));
  ok((await (await fetch('../chapters/ch4/chapter.js')).text()).includes("place: '개경'"), '고려 4장은 개경에 내린다고 말한다');
});
