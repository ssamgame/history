import { test, eq, ok } from './harness.js';
import { SOURCES } from '../content/sources.js';
import { validateScript } from '../core/content.js';

test('content: 65 sources with title and url', () => {
  eq(Object.keys(SOURCES).length, 71);
  for (const [id, s] of Object.entries(SOURCES)) ok(s.title && s.url.startsWith('https://'), id);
});

test('content: narration without src is rejected', () => {
  const errs = validateScript({ intro: [{ who: 'narr', text: '993년' }] }, SOURCES);
  ok(errs.some(e => e.includes('src')), errs.join());
});

test('content: narration with src passes', () => {
  eq(validateScript({ intro: [{ who: 'narr', text: '993년', src: ['S16'] }] }, SOURCES), []);
});

test('content: forbidden wording is rejected', () => {
  ok(validateScript({ a: [{ who: 'seohui', text: '서희 장군이 왔다' }] }, SOURCES).length > 0);
  ok(validateScript({ a: [{ who: 'sonn', text: '왜 거란과 사귀지 않느냐' }] }, SOURCES).length > 0);
});

test('content: unknown source id is rejected', () => {
  ok(validateScript({ a: [{ who: 'narr', text: 'x', src: ['S99'] }] }, SOURCES).some(e => e.includes('S99')));
});

test('content: choice must have exactly one correct option', () => {
  const choice = { kind: 'choice', who: 'sonn', prompt: { who: 'sonn', text: '질문' }, options: [
    { text: 'a', correct: true, reply: null, hint: null },
    { text: 'b', correct: true, reply: null, hint: null },
  ] };
  ok(validateScript({ q: choice }, SOURCES).some(e => e.includes('correct')));
});

test('content: quiz answer must be inside options and have src', () => {
  const quiz = { kind: 'quiz', question: '?', options: ['a', 'b', 'c'], answer: 3, explain: 'x', src: [] };
  const errs = validateScript({ quizzes: [quiz] }, SOURCES);
  ok(errs.some(e => e.includes('answer')), errs.join());
  ok(errs.some(e => e.includes('src')), errs.join());
});

test('content: forbidden wording inside a quiz option is rejected', () => {
  const quiz = { kind: 'quiz', question: '?', options: ['서희 장군', 'b', 'c'], answer: 1, explain: 'x', src: ['S1'] };
  ok(validateScript({ quizzes: [quiz] }, SOURCES).length > 0);
});
