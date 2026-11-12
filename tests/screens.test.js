import { COURSES } from '../chapters/index.js';
import { test, eq, ok } from './harness.js';
import { showTitle, askName, showMap, showSessionCard, showMenu, showChapterResult, createHud } from '../core/screens.js';
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
    eq(labels, ['시간 여행 일지']); // 결과 카드 → 시간 여행 일지(타임머신 틀, 2026-11-09)
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
  eq(result, { action: 'new', course: 'goryeo' }); // 이름은 캐릭터 만들기에서 짓는다(2026-11-10)
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
  ok(!el.querySelector('#student-name'), '첫 화면에는 이름 칸이 없다(2026-11-10)');
  eq(btn(el, '캐릭터').textContent, '캐릭터 생성하기 ▸');
  btn(el, '캐릭터').click();
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
  const b = btn(ui, '캐릭터 생성하기');
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
  btn(el, '장 선택').click();
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
  ok(!btn(el, '시간 여행 일지'), '마친 장이 없으면 시간 여행 일지 없음');
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
  cards[1].click(); // 시대 탭은 고르기만(배경 장면이 바뀐다, 2026-11-09), 이어하기로 들어간다
  eq(cards[1].getAttribute('aria-pressed'), 'true');
  btn(el, '이어하기').click();
  eq(await p, { action: 'continue', course: 'joseon' });
  el.remove();
});

test('title: 기록이 없으면 시대 탭을 고르고 「캐릭터 생성하기」로 시작한다(이름은 캐릭터 만들기에서)', async () => {
  const { COURSES } = await import('../chapters/index.js');
  const el = root();
  const p = showTitle(el, { savedName: '', hasProgress: false, storageOk: true, courses: COURSES, save: titleSave({}) });
  el.querySelector('[data-course="present"]').click();
  ok(!el.querySelector('input'), '이름 칸 없음');
  btn(el, '캐릭터 생성하기').click();
  eq(await p, { action: 'new', course: 'present' });
  el.remove();
});

test('title: 태블릿 가로와 휴대폰 세로 화면에서 소개 판·시대 탭·버튼이 다 보이고, 맨 밑에 저작권 표시', async () => {
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
      ok(intro.bottom <= list.top + 1, `${w}x${h}: 소개 판이 시대 탭 위에`); // 2026-11-09 시안 C: 왼쪽 판 + 아래 탭
      ok(acts.top >= intro.top - 1 && acts.bottom <= intro.bottom + 1, `${w}x${h}: 시작 단추는 소개 판 안`);
      const cr = d.querySelector('.copyright');
      ok(cr && cr.textContent.includes('©') && cr.textContent.includes('Jang ssam'), `${w}x${h}: 저작권 표시`);
      ok(cr && cr.getBoundingClientRect().top >= list.bottom - 1 && cr.getBoundingClientRect().bottom <= h + 1, `${w}x${h}: 저작권 표시가 맨 밑, 화면 안`);
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

// 2026-10-27 선생님: 장 시작 카드의 "이번 장의 나" 상자와 화면 위 "나: …" 줄을 모든 장에서 뺀다
test('screens: intro card and hud show no "이번 장의 나" box or "나:" line', async () => {
  const { showIntroCard, createHud } = await import('../core/screens.js');
  const r = root();
  const role = { name: '고려의 젊은 병사', does: '진영을 둘러본다', lookOpts: 'soldier' };
  const done = showIntroCard(r, CHAPTERS[0], [{ text: '줄거리 한 문단.' }], role);
  ok(!r.querySelector('.role-card') && !r.textContent.includes('이번 장의 나'), 'no role box');
  eq(r.querySelectorAll('.intro p').length, 1);
  btn(r, '시작하기').click(); await done;
  const hud = createHud(r, { touch: true });
  hud.show(CHAPTERS[0], role);
  ok(![...r.querySelectorAll('.hud *')].some(e => !e.hidden && e.children.length === 0 && e.textContent.startsWith('나:')), 'no 나: line');
  r.remove();
});

// D-9: 역사 수첩은 학생 화면 어디에도 없다(메뉴·장 결과 카드)
test('screens D-9: no 역사 수첩 in the menu or on the chapter result card', async () => {
  const r = root();
  try {
    showMenu(r, { muted: false, quality: 'medium', notebook: true }, () => {});
    await sleep(10);
    ok(!r.textContent.includes('수첩'), 'menu has no notebook button');
    btn(r, '닫기').click(); await sleep(10);
    showChapterResult(r, { no: 1, title: '서희의 외교 담판' }, { stars: 3, quizCorrect: 2, quizTotal: 2, firstTryCorrect: 1, firstTryTotal: 1, seconds: 300 }, [{ kind: 'event', lines: [{ text: 'x', src: ['S1'] }] }]);
    await sleep(10);
    ok(!r.textContent.includes('수첩'), 'result card has no notebook button');
  } finally { r.remove(); }
});

// (예전 'title D-11-2: 한 줄 조작 안내' 검사는 2026-11-12 조작법 상자 검사로 바꿨다 — 파일 끝)
test('screens: the action button shows what it does, not always 대화 (2026-11-08)', async () => {
  const { buttonWord } = await import('../core/screens.js');
  eq(buttonWord(null), '대화'); eq(buttonWord('세종과 이야기하기'), '대화');
  eq(buttonWord('백성 구하기'), '구하기'); eq(buttonWord('봉화 올리기'), '올리기'); eq(buttonWord('포격'), '포격');
  eq(buttonWord('물레 돌리기 — 길게 누르기'), '돌리기'); eq(buttonWord('줍기'), '줍기');
  eq(buttonWord('글자 새기기 (3/4)'), '새기기'); eq(buttonWord('마구리(판 양 끝에 나무 덧대기)'), '마구리'); eq(buttonWord('문으로 들어가 복습 퀴즈 풀기'), '풀기');
});

test('title: 첫 화면에 학생 주소로 가는 QR코드가 크게 보인다(2026-11-10 선생님)', async () => {
  const { QR_URL, QR_SIZE, QR_PATH } = await import('../content/qr.js');
  eq(QR_URL, 'https://ssamgame.github.io/history/'); ok(QR_SIZE >= 25 && QR_PATH.split('M').length > 300, 'QR 칸');
  const el = document.createElement('div'); el.id = 'ui'; document.body.appendChild(el);
  try {
    showTitle(el, { hasProgress: false, savedName: '', storageOk: true });
    const q = el.querySelector('.title-qr svg'); ok(q, 'QR 그림'); ok(q.getAttribute('aria-label').includes(QR_URL));
    if (innerWidth > 760) { const r = q.getBoundingClientRect(); ok(r.width >= 140 && r.height >= 140, `크게 ${Math.round(r.width)}px`); }
  } finally { el.remove(); }
});

test('map: 장 고르기에 「◀ 뒤로」 단추 — 누르면 back으로 끝난다(첫 화면으로, 2026-11-10 선생님)', async () => {
  const { CHAPTERS } = await import('../chapters/index.js');
  const el = document.createElement('div'); el.id = 'ui'; document.body.appendChild(el);
  try {
    const save = { chapterResult: () => null, data: { chapters: {} } };
    const p = showMap(el, CHAPTERS, save, { onCourses: true, onBack: true, heading: '고려편' });
    const b = el.querySelector('.board-back'); ok(b && b.textContent.includes('뒤로'));
    const r = b.getBoundingClientRect(); ok(r.width >= 44 && r.height >= 40, '손가락 크기');
    b.click(); eq(await p, 'back'); ok(!el.querySelector('.mapscreen'), '화면이 닫힌다');
    const p2 = showMap(el, CHAPTERS, save, { onCourses: true }); ok(!el.querySelector('.board-back'), 'onBack이 없으면 단추도 없다'); el.querySelector('.screen')?.remove(); void p2;
  } finally { el.remove(); }
});

test('fullscreen: 첫 화면과 메뉴에 전체 화면 단추 — 누르면 켜기/끄기를 부르고 글이 바뀐다(2026-11-10 선생님)', async () => {
  const { fullscreenButton } = await import('../core/screens.js');
  const d = document, root = d.documentElement, keep = { req: root.requestFullscreen, exit: d.exitFullscreen };
  let on = false; const calls = [];
  Object.defineProperty(d, 'fullscreenElement', { configurable: true, get: () => (on ? root : null) });
  root.requestFullscreen = () => { calls.push('on'); on = true; d.dispatchEvent(new Event('fullscreenchange')); return Promise.resolve(); };
  d.exitFullscreen = () => { calls.push('off'); on = false; d.dispatchEvent(new Event('fullscreenchange')); return Promise.resolve(); };
  const el = document.createElement('div'); el.id = 'ui'; document.body.appendChild(el);
  try {
    showTitle(el, { hasProgress: false, savedName: '', storageOk: true });
    const b = el.querySelector('.title-fs'); ok(b, '첫 화면 단추'); eq(b.textContent, '⛶ 전체 화면');
    const r = b.getBoundingClientRect(); ok(r.width >= 44 && r.height >= 40, '손가락 크기');
    b.click(); eq(calls, ['on']); eq(b.textContent, '⛶ 전체 화면 끄기');
    b.click(); eq(calls, ['on', 'off']); eq(b.textContent, '⛶ 전체 화면');
    el.querySelector('.screen').remove();
    const m = showMenu(el, { muted: false, quality: 'medium' }, () => {});
    const mb = el.querySelector('.menu .fs-btn'); ok(mb, '메뉴 단추'); mb.click(); eq(calls.length, 3); ok(el.querySelector('.menu'), '눌러도 메뉴는 닫히지 않는다');
    [...el.querySelectorAll('.menu button')].find(x => x.textContent === '닫기').click(); await m;
  } finally { el.remove(); delete d.fullscreenElement; root.requestFullscreen = keep.req; d.exitFullscreen = keep.exit; }
});

// 2026-11-11 선생님 시안: 퀘스트는 상자 없이 먹 글씨 + 붉은 도장(D), 메뉴는 옆으로 펼치는 두루마리(③)
test('screens: 메뉴 두루마리 — 항목이 한 줄 띠에 놓이고, 소리·화질은 눌러도 닫히지 않고 바뀌며, 바깥을 누르면 닫힌다', async () => {
  const el = root();
  try {
    const changes = [];
    const p = showMenu(el, { muted: false, music: true, quality: 'lite', letters: 3, machine: true }, c => changes.push(c));
    const items = [...el.querySelectorAll('.menu-band .scroll-item')];
    eq(items.map(b => b.querySelector('b').textContent), ['소리', '음악', '화질', '전체 화면', '편지함', '타임머신', '장 선택'].filter(n => n !== '전체 화면' || el.querySelector('.fs-btn')));
    ok(el.querySelectorAll('.menu-roll').length === 2 && el.querySelector('.menu-scroll').style.getPropertyValue('--w').endsWith('px'), '두루마리 축 둘과 펼쳐지는 길이');
    ok(!el.querySelector('.menu .card') && !el.textContent.includes('캐릭터'), '예전 카드 메뉴·캐릭터 바꾸기는 없다');
    const [sound, , q] = items;
    ok(sound.textContent.includes('켜짐')); sound.click(); ok(sound.textContent.includes('꺼짐')); sound.click(); ok(sound.textContent.includes('켜짐'));
    ok(q.textContent.includes('보통'), 'lite는 보통으로 보인다'); q.click(); q.click(); q.click();
    eq(changes, [{ muted: true }, { muted: false }, { quality: 'high' }, { quality: 'low' }, { quality: 'medium' }]); ok(q.textContent.includes('보통') && el.querySelector('.menu'), '메뉴는 그대로 열려 있다');
    for (const b of el.querySelectorAll('.menu button')) if (b.offsetParent) { const r = b.getBoundingClientRect(); ok(r.width >= 44 && r.height >= 44 && r.left >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1, `단추 ${b.textContent}`); }
    const close = el.querySelector('.menu-close'), band = el.querySelector('.menu-scroll').getBoundingClientRect(), c = close.getBoundingClientRect();
    ok(c.bottom <= band.top + 12, '닫기 단추는 두루마리 위(메뉴 단추 자리)');
    el.querySelector('.screen.menu').click(); eq(await p, 'close'); ok(!el.querySelector('.menu'));
  } finally { el.remove(); }
});

test('screens: 퀘스트 표시 — 붉은 도장에 장과 차례(2/6), 지금 퀘스트는 먹 글씨, 금빛 줄이 차례만큼 찬다', () => {
  const el = root();
  try {
    const hud = createHud(el, { touch: false }); hud.show({ no: 3, years: '1018~1019', event: '귀주 대첩' });
    eq(el.querySelector('.hud-stamp b').textContent, '3장'); eq(el.querySelector('.hud-chapter').textContent, '1018~1019 귀주 대첩'); ok(!el.querySelector('.hud .seal'), "'퀘스트' 딱지는 없다");
    ok(el.querySelector('.goal-step').hidden, '퀘스트를 정하기 전에는 차례가 없다');
    hud.setGoal('나', [2, 4], ['가', '나', '다', '라']);
    eq(el.querySelector('.hud-stamp').textContent, '3장2/4'); eq(el.querySelector('.quest.now .goal-text').textContent, '나');
    const bar = el.querySelector('.quest.now .hud-bar'); ok(bar && !bar.hidden); eq(bar.firstChild.style.width, '50%');
    const box = getComputedStyle(el.querySelector('.hud')); ok(box.backgroundColor === 'rgba(0, 0, 0, 0)' && box.borderTopWidth === '0px', '상자(바탕·테두리)가 없다'); ok(box.textShadow !== 'none', '글씨에 먹 그림자');
    eq(getComputedStyle(el.querySelector('.quest.done')).display, 'none', '마친 퀘스트 줄은 숨긴다(도장과 줄이 알려 준다)');
    hud.setGoal('빛나는 문으로'); ok(el.querySelector('.goal-step').hidden && el.querySelector('.hud-bar').hidden, '차례가 없는 퀘스트');
    const m = el.querySelector('.menubtn').getBoundingClientRect(); ok(Math.abs(m.width - m.height) < 1 && m.width >= 48, '메뉴 단추는 둥근 도장');
  } finally { el.remove(); }
});

// 2026-11-12 선생님: 첫 화면에 조작법을 키보드가 있을 때·없을 때로 나눠 적는다
test('screens: 첫 화면 조작법 — 키보드가 있을 때와 없을 때를 따로 적고, QR·시작 단추와 겹치지 않는다', () => {
  const el = root();
  try {
    showTitle(el, { hasProgress: true, savedName: '김여행', storageOk: true, onCode: true, courses: COURSES });
    const rows = [...el.querySelectorAll('.title-help > div')]; eq(rows.map(r => r.querySelector('b').textContent), ['키보드가 있을 때', '키보드가 없을 때']);
    ok(rows[0].textContent.includes('방향키') && rows[0].textContent.includes('E') && rows[0].textContent.includes('Esc')); ok(rows[1].textContent.includes('끌어서 걷기') && rows[1].textContent.includes('둥근 단추'));
    ok(!el.querySelector('.controls'), '예전 한 줄 조작 안내는 없다');
    ok(parseFloat(getComputedStyle(el.querySelector('.title-help')).fontSize) >= 15 && parseFloat(getComputedStyle(el.querySelector('.title .lead')).fontSize) >= 16, '글씨를 키웠다');
    const R = s => el.querySelector(s).getBoundingClientRect(), hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const help = R('.title-help');
    if (help.width) { ok(!(el.querySelector('.title-qr') && hit(help, R('.title-qr'))) && !hit(help, R('.title-actions')) && !hit(help, R('.title-courses')), '겹치지 않는다'); ok(help.right <= innerWidth + 1 && help.top >= 0); }
  } finally { el.remove(); }
});
