import { test, eq, ok } from './harness.js';
import { showTitle, askName, showMap, showSessionCard } from '../core/screens.js';
import { CHAPTERS, SESSIONS } from '../chapters/index.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));
function root() { const d = document.createElement('div'); document.body.appendChild(d); return d; }
const btn = (el, text) => [...el.querySelectorAll('button')].find(b => b.textContent.includes(text));

test('chapters: six chapters, playable ones load and the rest are 준비 중', () => {
  eq(CHAPTERS.length, 6);
  ok(CHAPTERS[0].load, 'ch1 loads');
  ok(CHAPTERS[1].load, 'ch2 loads');
  ok(CHAPTERS.every(c => c.load), 'all six chapters load');
});

test('one session: all six chapters are one lesson with one result card', async () => {
  const { isUnlocked } = await import('../chapters/index.js');
  eq(CHAPTERS.map(c => c.session), [1, 1, 1, 1, 1, 1]);
  eq(Object.keys(SESSIONS), ['1', '2', '3', '4', '5']);
  eq(SESSIONS[1].points.length, 6);
  ok(!SESSIONS[1].title.includes('차시'), SESSIONS[1].title);
  const save = { data: { chapters: {} } };
  save.chapterResult = id => save.data.chapters[id] || null;
  eq(isUnlocked(CHAPTERS[3], save), false, 'ch4 waits for ch3');
  save.data.chapters.ch3 = { stars: 1 };
  eq(isUnlocked(CHAPTERS[3], save), true);
});

test('one session: title has no 2차시 button and the map has one result button', async () => {
  const el = root(), el2 = root();
  try {
    showTitle(el, { savedName: '김고려', hasProgress: true, storageOk: true });
    ok(!el.textContent.includes('차시'), 'no 차시 on title');
    const save = { data: { chapters: { ch1: { stars: 3 }, ch4: { stars: 2 } } } };
    save.chapterResult = id => save.data.chapters[id] || null;
    showMap(el2, CHAPTERS, save);
    const labels = [...el2.querySelectorAll('.row button')].map(b => b.textContent);
    eq(labels, ['결과 카드']);
  } finally { el.remove(); el2.remove(); }
});

test('title: shows saved name and confirms reset', async () => {
  const el = root();
  let result = null;
  showTitle(el, { savedName: '5-3 12번', hasProgress: true, storageOk: true }).then(r => { result = r; });
  ok(el.textContent.includes('5-3 12번'), 'saved name visible');
  btn(el, '처음부터').click();
  await sleep(10);
  eq(result, null, 'needs confirmation');
  ok(el.textContent.includes('지울까요'), 'confirm panel');
  btn(el, '취소').click();
  await sleep(10);
  eq(result, null);
  btn(el, '처음부터').click();
  btn(el, '지우기').click();
  await sleep(10);
  eq(result, { action: 'new', course: 'goryeo' });
  el.remove();
});

test('title: continue button resumes', async () => {
  const el = root();
  const p = showTitle(el, { savedName: '김고려', hasProgress: true, storageOk: true });
  btn(el, '이어하기').click();
  eq(await p, { action: 'continue', course: 'goryeo' });
  el.remove();
});

test('title: without progress, start needs no confirmation', async () => {
  const el = root();
  const p = showTitle(el, { savedName: '', hasProgress: false, storageOk: true });
  ok(!btn(el, '이어하기'), 'no continue button');
  btn(el, '처음부터').click();
  eq(await p, { action: 'new', course: 'goryeo' });
  el.remove();
});

test('screens: storage warning shown when storage unavailable', () => {
  const el = root();
  showTitle(el, { savedName: '', hasProgress: false, storageOk: false });
  ok(el.textContent.includes('이 기기에서는 저장되지 않아요'));
  el.remove();
});

test('name: typed name is returned, empty is allowed', async () => {
  const el = root();
  let p = askName(el, '');
  el.querySelector('input').value = '5학년 3반 12번';
  btn(el, '시작').click();
  eq(await p, '5학년 3반 12번');
  p = askName(el, '');
  btn(el, '시작').click();
  eq(await p, '');
  el.remove();
});

test('map: finished chapter shows stars, unavailable chapters are disabled', async () => {
  const el = root();
  const save = { data: { chapters: { ch1: { stars: 2 } } }, chapterResult: id => save.data.chapters[id] || null };
  const p = showMap(el, CHAPTERS, save);
  const b1 = el.querySelector('[data-chapter="ch1"]');
  ok(b1.textContent.includes('★★☆'), b1.textContent);
  eq(el.querySelector('[data-chapter="ch2"]').disabled, false, 'ch2 opens after ch1');
  eq(el.querySelector('[data-chapter="ch3"]').disabled, true, 'ch3 waits for ch2');
  b1.click();
  eq(await p, 'ch1');
  el.remove();
});

test('screens: session card lists chapters with stars and wrong quiz answers', async () => {
  const el = root();
  const save = { data: { name: '김고려', chapters: { ch1: { stars: 2, quizCorrect: 1, quizTotal: 2, seconds: 125, wrongQuizzes: [{ question: '서희가 얻은 땅은?', answer: '강동 6주', explain: '압록강 동쪽이에요.' }] } } } };
  save.chapterResult = id => save.data.chapters[id] || null;
  const p = showSessionCard(el, 1, save, CHAPTERS);
  const t = el.textContent;
  ok(t.includes('김고려'));
  ok(t.includes('서희의 외교 담판') && t.includes('★★☆'));
  ok(t.includes('1/2'), 'quiz total');
  ok(t.includes('2:05'), 'time');
  ok(t.includes('강동 6주') && t.includes('서희가 얻은 땅은?'));
  ok(t.includes(SESSIONS[1].points[0]));
  btn(el, '닫기').click();
  await p;
  el.remove();
});

test('screens: title button is really clickable with HUD layers on top', async () => {
  const ui = document.getElementById('ui');
  const { createHud } = await import('../core/screens.js');
  const hud = createHud(ui, { touch: true });
  const p = showTitle(ui, { savedName: '', hasProgress: false, storageOk: true });
  const b = btn(ui, '처음부터');
  const r = b.getBoundingClientRect();
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  ok(hit === b || b.contains(hit), `top element is ${hit && (hit.className || hit.tagName)}`);
  b.click(); await p;
  ui.innerHTML = '';
  ok(hud);
});

test('menu: leaving to the map without storage asks first', async () => {
  const { showMenu } = await import('../core/screens.js');
  const el = root();
  let result = null;
  showMenu(el, { muted: false, quality: 'medium', storageOk: false }, () => {}).then(r => { result = r; });
  btn(el, '장 선택으로').click();
  await sleep(10);
  eq(result, null);
  ok(el.textContent.includes('사라져요'));
  btn(el, '그래도 나가기').click();
  await sleep(10);
  eq(result, 'map');
  el.remove();
});

test('result card: only after chapter 6, lists all six chapters', async () => {
  const { isSessionDone } = await import('../chapters/index.js');
  const mk = stars => ({ stars, quizCorrect: 2, quizTotal: 2, seconds: 300, wrongQuizzes: [] });
  const save = { data: { name: '김고려', chapters: { ch1: mk(3), ch2: mk(2), ch3: mk(1) } } };
  save.chapterResult = id => save.data.chapters[id] || null;
  eq(isSessionDone(1, save), false, 'not after chapter 3');
  Object.assign(save.data.chapters, { ch4: mk(3), ch5: mk(2), ch6: mk(3) });
  eq(isSessionDone(1, save), true);
  const el = root();
  const p = showSessionCard(el, 1, save, CHAPTERS);
  const t = el.textContent;
  for (const c of CHAPTERS) ok(t.includes(c.title), c.title);
  ok(t.includes('★★★') && t.includes('★★☆') && t.includes('★☆☆'));
  ok(t.includes('12/12'), 'quiz total over six chapters');
  ok(t.includes(SESSIONS[1].points[5]));
  btn(el, '닫기').click(); await p; el.remove();
});

test('menu: pressing Esc again while the menu is open does not stack a second menu', async () => {
  const { showMenu } = await import('../core/screens.js');
  const el = root();
  try {
    const p1 = showMenu(el, { muted: false, quality: 'medium' }, () => {});
    const p2 = showMenu(el, { muted: false, quality: 'medium' }, () => {});
    eq(el.querySelectorAll('.screen.menu').length, 1, 'one menu');
    btn(el, '닫기').click();
    eq(await p1, 'close'); eq(await p2, 'close');
    eq(el.querySelectorAll('.screen.menu').length, 0);
  } finally { el.remove(); }
});

test('title: 사이트 이름은 역사 속으로 걸어가기', () => {
  const el = root();
  try {
    showTitle(el, { savedName: '', hasProgress: false, storageOk: true });
    eq(el.querySelector('h1').textContent, '역사 속으로 걸어가기');
  } finally { el.remove(); }
});

test('courses screen: 두 편과 진행, 누르면 그 편', async () => {
  const { showCourses } = await import('../core/screens.js');
  const { COURSES } = await import('../chapters/index.js');
  const el = root();
  const save = { data: { chapters: { ch1: { stars: 3 }, ch2: { stars: 2 } } } };
  save.chapterResult = id => save.data.chapters[id] || null;
  const p = showCourses(el, COURSES, save);
  const g = el.querySelector('[data-course="goryeo"]'), j = el.querySelector('[data-course="joseon"]');
  ok(g.textContent.includes('고려를 지켜라') && g.textContent.includes('2/6') && g.textContent.includes('★5'), g.textContent);
  ok(j.textContent.includes('조선을 걷다') && j.textContent.includes('아직 시작 전'), j.textContent);
  j.click();
  eq(await p, 'joseon');
  eq(el.children.length, 0, 'screen removed');
  el.remove();
});

test('map: 다른 시대 버튼과 편 이름 줄', async () => {
  const { JOSEON } = await import('../chapters/index.js');
  const el = root();
  const save = { data: { chapters: {} } };
  save.chapterResult = id => save.data.chapters[id] || null;
  const p = showMap(el, JOSEON.map(c => ({ ...c, load: null })), save, { onCourses: true, heading: '조선을 걷다' });
  ok(el.textContent.includes('조선을 걷다'));
  ok([...el.querySelectorAll('[data-chapter]')].every(b => b.disabled), '준비 중은 눌리지 않음');
  ok(!btn(el, '결과 카드'), '마친 장이 없으면 결과 카드 없음');
  btn(el, '다른 시대').click();
  eq(await p, 'courses');
  el.remove();
});

// 첫 화면: 왼쪽 소개, 오른쪽 시대 고르기, 아래 처음부터/이어하기. 하던 시대가 있어도 다른 시대를 골라 넘어갈 수 있다.
const titleSave = chapters => { const s = { data: { chapters } }; s.chapterResult = id => s.data.chapters[id] || null; return s; };
test('title: 오른쪽에 다섯 시대가 진행과 함께 있고, 고른 시대로 이어하기', async () => {
  const { COURSES } = await import('../chapters/index.js');
  const el = root();
  const p = showTitle(el, { savedName: '김고려', hasProgress: true, storageOk: true, courses: COURSES, save: titleSave({ ch1: { stars: 3 }, ch2: { stars: 2 } }), course: 'goryeo' });
  const cards = [...el.querySelectorAll('.title-course')];
  eq(cards.map(c => c.dataset.course), ['goryeo', 'joseon', 'modern', 'colonial', 'present']);
  ok(cards[0].textContent.includes('2/6') && cards[0].textContent.includes('★5'), cards[0].textContent);
  eq(cards[0].getAttribute('aria-pressed'), 'true', '하던 시대가 처음부터 골라져 있다');
  cards[1].click();
  eq(cards[1].getAttribute('aria-pressed'), 'true'); eq(cards[0].getAttribute('aria-pressed'), 'false');
  btn(el, '이어하기').click();
  eq(await p, { action: 'continue', course: 'joseon' });
  el.remove();
});

test('title: 처음부터도 고른 시대로 시작한다', async () => {
  const { COURSES } = await import('../chapters/index.js');
  const el = root();
  const p = showTitle(el, { savedName: '', hasProgress: false, storageOk: true, courses: COURSES, save: titleSave({}) });
  el.querySelector('[data-course="present"]').click();
  btn(el, '처음부터').click();
  eq(await p, { action: 'new', course: 'present' });
  el.remove();
});

test('title: 태블릿 가로와 휴대폰 세로 화면에서 소개·시대·버튼이 다 보이고, 맨 밑에 저작권 표시', async () => {
  for (const [w, h] of [[1000, 530], [1280, 800], [1366, 650], [390, 844], [360, 740]]) {
    const frame = document.createElement('iframe');
    frame.src = './fit.html?kind=title'; frame.style.cssText = `width:${w}px;height:${h}px;position:fixed;left:-3000px;top:0;border:0`;
    document.body.appendChild(frame);
    try {
      await new Promise(r => frame.addEventListener('load', r));
      const d = frame.contentDocument;
      for (let i = 0; i < 100 && !d.querySelector('.title-course'); i++) await sleep(20);
      await sleep(80);
      const intro = d.querySelector('.title-intro').getBoundingClientRect(), list = d.querySelector('.title-courses').getBoundingClientRect(), acts = d.querySelector('.title-actions').getBoundingClientRect();
      if (w > h) ok(intro.right <= list.left + 1, `${w}x${h}: 소개가 시대 목록 왼쪽`);
      else ok(intro.bottom <= list.top + 1, `${w}x${h}: 세로 화면에서는 소개가 시대 목록 위`);
      ok(acts.top >= Math.max(intro.bottom, list.bottom) - 1, `${w}x${h}: 버튼이 맨 아래`);
      const cr = d.querySelector('.copyright');
      ok(cr && cr.textContent.includes('©') && cr.textContent.includes('Jang ssam'), `${w}x${h}: 저작권 표시`);
      ok(cr && cr.getBoundingClientRect().top >= acts.top - 1 && cr.getBoundingClientRect().bottom <= h, `${w}x${h}: 저작권 표시가 맨 밑, 화면 안`);
      for (const b of d.querySelectorAll('button')) {
        if (b.closest('[hidden]')) continue;
        const r = b.getBoundingClientRect();
        ok(r.top >= 0 && r.bottom <= h && r.left >= 0 && r.right <= w, `${w}x${h}: "${b.textContent}" 화면 밖`);
        ok(r.height >= 44, `${w}x${h}: "${b.textContent}" 너무 작음`);
        const top = d.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        ok(top && (top === b || b.contains(top)), `${w}x${h}: "${b.textContent}" 가려짐`);
      }
    } finally { frame.remove(); }
  }
}, { timeout: 30000 });

test('portrait: 휴대폰 세로로 들어도 「가로로 돌려 주세요」 화면이 막지 않는다', async () => {
  const html = await (await fetch('../index.html', { cache: 'no-store' })).text();
  ok(!html.includes('id="rotate"'), 'rotate overlay removed');
  const css = await (await fetch('../styles.css', { cache: 'no-store' })).text();
  ok(!css.includes('#rotate'), 'no rotate rule');
});
