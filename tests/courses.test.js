import { test, eq, ok } from './harness.js';
import { COURSES, CHAPTERS, JOSEON, ALL_CHAPTERS, SESSIONS, courseById, courseOfChapter, isUnlocked, isSessionDone } from '../chapters/index.js';

const mkSave = chapters => { const s = { data: { chapters } }; s.chapterResult = id => s.data.chapters[id] || null; return s; };

test('courses: 다섯 편, 이름과 장 묶음', () => {
  eq(COURSES.map(c => c.id), ['goryeo', 'joseon', 'modern', 'colonial', 'present']);
  eq(COURSES.map(c => c.title), ['고려를 지켜라', '조선을 걷다', '새 나라를 꿈꾸다', '빼앗긴 나라를 되찾아라', '대한민국을 세우다']);
  eq(COURSES.map(c => c.session), [1, 2, 3, 4, 5]);
  ok(COURSES.every(c => c.chapters.length === 6), '편마다 6장');
  eq(courseOfChapter('h6').id, 'present');
  eq(courseById('joseon').chapters.map(c => c.id), ['j1', 'j3', 'j2', 'j4', 'j5', 'j6']); // 일어난 차례: 과학 기구(1434~) 다음 훈민정음(1443~)
  eq(courseById('nope').id, 'goryeo');
  eq(courseOfChapter('ch4').id, 'goryeo');
  eq(courseOfChapter('j2').id, 'joseon');
  eq(ALL_CHAPTERS.length, 30);
  eq(new Set(ALL_CHAPTERS.map(c => c.id)).size, 30, 'ids are unique');
});

test('courses: 조선편은 session 2, 정리는 6줄', () => {
  ok(JOSEON.every(c => c.session === 2));
  eq(SESSIONS[2].points.length, 6);
  ok(CHAPTERS.every(c => c.session === 1));
});

test('courses: 열림 규칙은 같은 편 안에서만 센다', () => {
  const save = mkSave({ ch1: { stars: 3 }, ch2: { stars: 3 }, ch3: { stars: 3 }, ch4: { stars: 3 }, ch5: { stars: 3 }, ch6: { stars: 3 } });
  eq(isSessionDone(1, save), true);
  eq(isSessionDone(2, save), false, '고려편을 마쳐도 조선편은 끝나지 않음');
  const j1 = { ...JOSEON[0], load: () => null }, j2 = { ...JOSEON[1], load: () => null };
  eq(isUnlocked(j1, save), true, '조선편 1장은 처음부터 열림');
  eq(isUnlocked(j2, save), false, '고려편 1장을 마친 것으로 조선편 2장이 열리지 않음');
  save.data.chapters.j1 = { stars: 1 };
  eq(isUnlocked(j2, save), true);
  eq(isUnlocked({ ...JOSEON[1], load: null }, save), false, '준비 중인 장은 열리지 않음');
});
