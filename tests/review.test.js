// 편 복습 퀴즈(D-21): 편마다 6문제(장마다 하나), 출처, 장 끝 퀴즈와 겹치지 않음, 화면에서 고르고 해설 보기
import { test, eq, ok } from './harness.js';
import { REVIEW } from '../content/review.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';
import { ALL_CHAPTERS } from '../chapters/index.js';
import { showReviewQuiz, showSessionCard } from '../core/screens.js';
import { memSave } from './bot.js';

test('review: every course has six questions, one per chapter in order, sourced and valid', () => {
  for (const session of [1, 2, 3, 4, 5]) {
    const qs = REVIEW[session], ids = ALL_CHAPTERS.filter(c => c.session === session).map(c => c.id);
    eq(qs.map(q => q.chapter), ids, `session ${session}`);
    eq(validateScript({ qs }, SOURCES), [], `session ${session} valid`);
  }
});

test('review: questions are new — not the end-of-chapter quizzes', async () => {
  const same = [];
  for (const session of [1, 2, 3, 4, 5]) for (const q of REVIEW[session]) {
    const meta = ALL_CHAPTERS.find(c => c.id === q.chapter);
    const mod = (await meta.load()).default;
    for (const c of mod.quizzes) if (c.question === q.question || c.options[c.answer] === q.options[q.answer]) same.push(`${q.chapter}: ${q.question}`);
  }
  eq(same, []);
});

test('review: answers are not always in the same place', () => {
  const at = new Set(Object.values(REVIEW).flat().map(q => q.answer));
  ok(at.size === 3, [...at].join(','));
});

test('review: pick an answer, see right/wrong with the explanation, go on; the result goes on the course card', async () => {
  const ui = document.createElement('div'); document.body.appendChild(ui);
  const qs = REVIEW[1];
  const p = showReviewQuiz(ui, 1, qs);
  for (const [k, q] of qs.entries()) {
    ok(ui.querySelector('h2').textContent === q.question);
    const pick = k === 0 ? (q.answer + 1) % q.options.length : q.answer;
    ui.querySelector(`.review-opt[data-i="${pick}"]`).click();
    const why = ui.querySelector('.card-why');
    ok(!why.hidden && why.textContent.includes(q.explain));
    if (k === 0) ok(why.textContent.includes(q.options[q.answer]), 'shows the right answer');
    ok([...ui.querySelectorAll('.review-opt')].every(b => b.disabled), 'one try');
    ui.querySelector('.review .btn.primary').click();
  }
  const r = await p;
  eq([r.correct, r.total, r.wrong.length], [5, 6, 1]);
  const save = memSave();
  save.setReview(1, r);
  eq(save.review(1).correct, 5);
  showSessionCard(ui, 1, save, ALL_CHAPTERS);
  ok(ui.querySelector('.session').textContent.includes('5/6'), 'course card shows the review score');
  ok(ui.querySelector('.session .review').textContent.includes(qs[0].question), 'missed one is in 다시 보기');
  ui.remove();
});
