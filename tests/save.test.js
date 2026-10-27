import { test, eq, ok } from './harness.js';
import { createStorage } from '../core/storage.js';
import { createSave, computeStars } from '../core/save.js';

function memoryBackend() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
}

test('stars: minigame first tries count — 3 needs at least half of the parts right on the first try', () => {
  eq(computeStars({ quizCorrect: 2, easyModeUsed: false, firstTryCorrect: 2, firstTryTotal: 3 }), 3);
  eq(computeStars({ quizCorrect: 2, easyModeUsed: false, firstTryCorrect: 1, firstTryTotal: 3 }), 2, 'too few first tries');
  eq(computeStars({ quizCorrect: 0, easyModeUsed: false, firstTryCorrect: 2, firstTryTotal: 2 }), 2, 'good play lifts a 1 to a 2');
  eq(computeStars({ quizCorrect: 0, easyModeUsed: false, firstTryCorrect: 0, firstTryTotal: 2 }), 1);
});

import { runWithRetries } from '../core/minigame.js';
test('runWithRetries: tells whether the first attempt succeeded cleanly', async () => {
  const ctx = { dialogue: { say: async () => {}, close() {} } };
  eq((await runWithRetries(ctx, async () => true, { failHint: '' })).first, true);
  eq((await runWithRetries(ctx, async () => 'missed', { failHint: '' })).first, false, 'fixed a mistake');
  let n = 0;
  eq((await runWithRetries(ctx, async () => ++n > 1, { failHint: '' })).first, false, 'second attempt');
});

test('stars: 3 needs both quizzes and no easy mode', () => {
  eq(computeStars({ quizCorrect: 2, easyModeUsed: false }), 3);
  eq(computeStars({ quizCorrect: 2, easyModeUsed: true }), 2);
  eq(computeStars({ quizCorrect: 1, easyModeUsed: false }), 2);
  eq(computeStars({ quizCorrect: 0, easyModeUsed: false }), 1);
});

test('save: round trip name, checkpoint, result', () => {
  const backend = memoryBackend();
  const a = createSave(createStorage(backend));
  a.setName('5-3 12번');
  a.checkpoint('ch1', 'minigame');
  const b = createSave(createStorage(backend));
  b.load();
  eq(b.data.name, '5-3 12번');
  eq(b.data.current, { id: 'ch1', stage: 'minigame' });
});

test('save: storage that throws', () => {
  const bad = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
  const s = createStorage(bad);
  eq(s.available, false);
  eq(s.set('k', 1), false);
  eq(s.get('k'), null);
  const save = createSave(s);
  save.load();
  save.setName('김고려');
  eq(save.data.name, '김고려');
});

test('save: finishing a chapter twice keeps the later result only', () => {
  const save = createSave(createStorage(memoryBackend()));
  const r = { stars: 1, quizCorrect: 0, quizTotal: 2, firstTryCorrect: 0, firstTryTotal: 2, easyModeUsed: false, seconds: 300, wrongQuizzes: [0, 1] };
  save.finishChapter('ch1', r);
  save.finishChapter('ch1', { ...r, stars: 3, quizCorrect: 2, wrongQuizzes: [] });
  eq(Object.keys(save.data.chapters), ['ch1']);
  eq(save.chapterResult('ch1').stars, 3);
  eq(save.data.current, null);
});

test('save: reset clears name, chapters, current', () => {
  const backend = memoryBackend();
  const save = createSave(createStorage(backend));
  save.setName('a'); save.checkpoint('ch1', 'quiz');
  save.finishChapter('ch1', { stars: 2 });
  save.reset();
  eq(save.data, { name: '', chapters: {}, current: null, course: null });
  const again = createSave(createStorage(backend)); again.load();
  eq(again.data.name, '');
});

test('save: corrupt stored data falls back to empty', () => {
  const backend = memoryBackend();
  backend.setItem('goryeo-game:v1', '{not json');
  const save = createSave(createStorage(backend)); save.load();
  eq(save.data, { name: '', chapters: {}, current: null, course: null });
  ok(true);
});

test('save: storage whose getter throws (blocked site data)', () => {
  const s = createStorage(() => { throw new Error('SecurityError'); });
  eq(s.available, false);
  eq(s.get('k'), null);
  eq(s.set('k', 1), false);
});

test('save: abandonCurrent clears the in-progress chapter and persists', () => {
  const backend = memoryBackend();
  const a = createSave(createStorage(backend));
  a.checkpoint('ch1', 'explore');
  a.abandonCurrent();
  const b = createSave(createStorage(backend)); b.load();
  eq(b.data.current, null);
});

test('save: default storage works when window.localStorage itself throws', () => {
  const desc = Object.getOwnPropertyDescriptor(window, 'localStorage') || Object.getOwnPropertyDescriptor(Window.prototype, 'localStorage');
  Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('blocked', 'SecurityError'); } });
  try {
    const s = createStorage();
    eq(s.available, false);
    const save = createSave(s); save.load(); save.setName('김고려');
    eq(save.data.name, '김고려');
  } finally {
    if (Object.getOwnPropertyDescriptor(Window.prototype, 'localStorage')) delete window.localStorage;
    else Object.defineProperty(window, 'localStorage', desc);
  }
});

test('save: 고른 편을 기억하고, 고려편을 하던 옛 기록은 고려편', () => {
  const backend = memoryBackend();
  backend.setItem('goryeo-game:v1', JSON.stringify({ name: '옛 학생', chapters: { ch1: { stars: 2 } }, current: { id: 'ch2', stage: 'explore' } }));
  const a = createSave(createStorage(backend)); a.load();
  eq(a.data.course, 'goryeo', '고려편 장을 한 옛 기록은 고려편으로');
  eq(a.data.current, { id: 'ch2', stage: 'explore' });
  a.setCourse('joseon');
  const b = createSave(createStorage(backend)); b.load();
  eq(b.data.course, 'joseon');
  eq(b.data.chapters.ch1.stars, 2);
  b.reset(); eq(b.data.course, null);
});

test('save: 옛 기록 — 장 사이에서 멈췄어도 고려편, 이름만 있으면 편 고르기', () => {
  const backend = memoryBackend();
  backend.setItem('goryeo-game:v1', JSON.stringify({ name: '지난주 학생', chapters: { ch1: { stars: 3 }, ch2: { stars: 2 }, ch3: { stars: 1 } }, current: null }));
  const a = createSave(createStorage(backend)); a.load();
  eq(a.data.course, 'goryeo');
  backend.setItem('goryeo-game:v1', JSON.stringify({ name: '이름만', chapters: {}, current: null }));
  const b = createSave(createStorage(backend)); b.load();
  eq(b.data.course, null, '아무 장도 안 했으면 편을 고른다');
});

// D-9: 역사 수첩을 없앴다. 옛 수첩이 저장된 기록도 오류 없이 읽고, 수첩은 버린다
test('save D-9: old saves with notebook notes load fine and the notes are dropped', () => {
  const st = createStorage(memoryBackend());
  st.set('goryeo-game:v1', { name: '가', chapters: { ch1: { stars: 3 } }, current: null, course: 'goryeo', notes: { ch1: [{ kind: 'event', lines: [] }] } });
  const s = createSave(st);
  s.load();
  eq(s.data.name, '가'); eq(s.chapterResult('ch1').stars, 3);
  ok(!('notes' in s.data), 'notes dropped');
  eq(typeof s.notes, 'undefined', 'no notes API');
});
