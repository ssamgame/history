// 게임 화면들: 첫 화면, 이름, 편 고르기, 장 선택 지도, 해설 카드, 장 결과, 결과 카드, 메뉴, HUD.
import { SESSIONS, isUnlocked } from '../chapters/index.js';
import { QR_URL, QR_SIZE, QR_PATH } from '../content/qr.js';

const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  return el;
};
export const starText = n => '★'.repeat(n) + '☆'.repeat(3 - n);
export const timeText = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function screen(root, cls, ...kids) {
  const el = h('section', { class: `screen ${cls}` }, ...kids);
  root.appendChild(el);
  return el;
}

// 행동 버튼에 쓸 짧은 낱말: 말풍선 글의 마지막 낱말('백성 구하기' → '구하기'). '— 꾹 누르기' 같은 덧말은 뗀다. 이야기하기·말 걸기는 '대화'
export function buttonWord(label) {
  if (!label) return '대화';
  const w = String(label).replace(/\([^)]*\)/g, ' ').split('—')[0].trim().split(/\s+/).pop() || ''; // 괄호 속 설명·'(3/4)' 같은 셈은 뺀다
  return /(이야기하기|대화하기|말걸기|걸기)$/.test(w) || !w ? '대화' : w;
}

// 첫 화면(2026-11-09 선생님 시안 C): 뒤에는 고른 시대의 3D 장면(main.js가 띄움), 왼쪽 유리 판에 제목·소개·이름 칸·시작 단추, 아래에 시대 탭 다섯.
// 탭을 누르면 고른 시대만 바뀌고(onCourse로 배경 장면을 바꾼다), 시작 단추로 들어간다. { action: 'new'|'continue', course, name? }로 끝난다(new일 때 name).
// 전체 화면 켜고 끄기 단추(2026-11-10 선생님): 첫 화면과 메뉴에 둔다. 브라우저가 전체 화면을 못 하면(아이폰 사파리 등) 단추를 만들지 않는다
export function fullscreenButton(cls = '') {
  const d = document, root = d.documentElement;
  const on = () => !!(d.fullscreenElement || d.webkitFullscreenElement);
  if (!(root.requestFullscreen || root.webkitRequestFullscreen) || d.fullscreenEnabled === false) return null;
  const b = h('button', { class: `btn fs-btn ${cls}`, type: 'button', onclick: () => {
    try { const r = on() ? (d.exitFullscreen || d.webkitExitFullscreen).call(d) : (root.requestFullscreen || root.webkitRequestFullscreen).call(root); r?.catch?.(() => {}); } catch { /* 막힌 기기에서는 아무 일도 없다 */ }
  } }, '');
  const label = () => { b.textContent = on() ? '⛶ 전체 화면 끄기' : '⛶ 전체 화면'; b.setAttribute('aria-pressed', String(on())); };
  label();
  const sync = () => { if (b.isConnected) label(); else { d.removeEventListener('fullscreenchange', sync); d.removeEventListener('webkitfullscreenchange', sync); } };
  d.addEventListener('fullscreenchange', sync); d.addEventListener('webkitfullscreenchange', sync);
  return b;
}

// 첫 화면 오른쪽 위의 큰 QR코드(2026-11-10 선생님: 설명·테두리 없이 게임 그림 위에): 학생 주소로 바로 들어온다. 그림 파일 없이 SVG로 그린다(content/qr.js)
function qrBox() {
  const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'), path = document.createElementNS(NS, 'path');
  svg.setAttribute('viewBox', `-4 -4 ${QR_SIZE + 8} ${QR_SIZE + 8}`); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', `이 사이트로 오는 QR코드 ${QR_URL}`); svg.setAttribute('shape-rendering', 'crispEdges');
  path.setAttribute('d', QR_PATH); path.setAttribute('fill', '#1b1714'); svg.append(path);
  return h('div', { class: 'title-qr' }, svg); // 글·테두리 없이 장면 위에 바로 얹는다
}

export function showTitle(root, { savedName, hasProgress, storageOk, courses = [], save = null, course = null, onCourse = null }) {
  return new Promise(resolve => {
    let picked = (courses.find(c => c.id === course) || courses[0] || { id: 'goryeo' }).id;
    const eraOf = id => courses.find(c => c.id === id)?.era || '고려';
    // 이름은 첫 화면에서 묻지 않고 캐릭터 만들기에서 짓는다(2026-11-10 선생님)
    const done = action => { el.remove(); resolve({ action, course: picked }); };
    const confirm = h('div', { class: 'confirm', hidden: true },
      h('p', {}, `${savedName || '앞 친구'}의 기록이 지워져요. 지울까요?`),
      h('div', { class: 'row' },
        h('button', { class: 'btn danger', type: 'button', onclick: () => done('new') }, '지우기'),
        h('button', { class: 'btn', type: 'button', onclick: () => { confirm.hidden = true; } }, '취소')));
    const startBtn = h('button', { class: `btn ${hasProgress ? '' : 'primary'} title-start`, type: 'button', onclick: () => (hasProgress ? (confirm.hidden = false) : done('new')) }, '');
    const label = () => { startBtn.textContent = hasProgress ? '새 캐릭터로 처음부터' : '캐릭터 생성하기 ▸'; startBtn.title = `${eraOf(picked)}편 처음부터`; };
    const cards = courses.map(c => {
      const results = save ? c.chapters.map(ch => save.chapterResult(ch.id)).filter(Boolean) : [];
      const stars = results.reduce((a, r) => a + (r.stars || 0), 0);
      return h('button', { class: 'title-course', type: 'button', 'data-course': c.id, 'aria-pressed': String(c.id === picked),
        onclick: () => { picked = c.id; cards.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.course === picked))); label(); onCourse?.(c.id); } },
        h('span', { class: 'title-course-era' }, `${c.era}편`),
        h('b', { class: 'title-course-name' }, c.title),
        h('span', { class: 'title-course-progress' }, results.length ? `마친 장 ${results.length}/${c.chapters.length} · ★${stars}` : '아직 시작 전'));
    });
    label();
    const el = screen(root, 'title',
      h('div', { class: 'title-inner' },
        h('div', { class: 'title-intro' },
          h('div', { class: 'eyebrow' }, '초등 5학년 사회 · 3D 역사 탐험'),
          h('h1', {}, '역사 속으로 ', h('span', {}, '걸어가기')),
          h('p', { class: 'lead' }, '시대를 골라 그때 사람이 되어 보세요. 직접 걷고, 이야기를 듣고, 역사의 현장을 겪어 봐요.'),
          !storageOk && h('p', { class: 'warn' }, '이 기기에서는 저장되지 않아요. 끝까지 한 번에 해 주세요.'),
          h('div', { class: 'title-actions' },
            h('div', { class: 'row' },
              hasProgress && h('button', { class: 'btn primary title-start', type: 'button', onclick: () => done('continue') }, `이어하기 (${savedName || '저장된 기록'})`),
              startBtn),
            confirm),
          h('p', { class: 'controls' }, '걷기: 방향키·WASD 또는 화면 왼쪽을 손가락으로 끌기 · 말 걸기: 가까이 가서 스페이스·E 또는 「대화」 단추')),
        qrBox(),
        fullscreenButton('title-fs'),
        cards.length > 0 && h('div', { class: 'title-courses' }, cards),
        h('p', { class: 'copyright' }, '© 2026 Jang ssam. All rights reserved.')));
  });
}

export function askName(root, prev) {
  return new Promise(resolve => {
    const input = h('input', { id: 'student-name', type: 'text', placeholder: '예: 5학년 3반 12번 김고려', autocomplete: 'off', maxlength: '30' });
    input.value = prev || '';
    const submit = () => { el.remove(); resolve(input.value.trim()); };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    const el = screen(root, 'name',
      h('div', { class: 'card' },
        h('h2', {}, '이름을 알려 주세요'),
        h('label', { for: 'student-name' }, '이름 또는 번호 (결과 카드에만 쓰여요. 비워도 돼요)'),
        input,
        h('button', { class: 'btn primary', type: 'button', onclick: submit }, '시작')));
    setTimeout(() => input.focus(), 50);
  });
}

export const MAP_OUTLINE = '40,70 80,40 130,30 180,20 230,10 270,30 250,80 215,120 205,150 215,190 230,230 240,280 235,320 210,340 180,345 150,350 120,345 100,340 95,310 85,280 100,250 90,220 105,200 90,175 80,150 70,120 55,100';

// 편 고르기: 편마다 카드 한 장(이름, 시대, 마친 장 수와 별 합계). 누른 편의 id로 끝난다.
export function showCourses(root, courses, save) {
  return new Promise(resolve => {
    const cards = courses.map(c => {
      const done = c.chapters.map(ch => save.chapterResult(ch.id)).filter(Boolean);
      const stars = done.reduce((a, r) => a + (r.stars || 0), 0);
      const ready = c.chapters.filter(ch => ch.load).length;
      return h('button', { class: 'course-card', type: 'button', 'data-course': c.id, onclick: () => { el.remove(); resolve(c.id); } },
        h('span', { class: 'course-era' }, `${c.era}편 · ${c.eyebrow}`),
        h('b', { class: 'course-title' }, c.title),
        h('span', { class: 'course-lead' }, c.lead),
        h('span', { class: 'course-progress' }, done.length ? `마친 장 ${done.length}/${c.chapters.length} · ★${stars}` : '아직 시작 전'),
        ready < c.chapters.length && h('small', { class: 'course-note' }, ready ? `준비된 장 ${ready}/${c.chapters.length}` : '지금 만들고 있어요'));
    });
    const el = screen(root, 'courses',
      h('div', { class: 'courses-inner' }, h('h2', {}, '어느 시대로 갈까요?'), h('div', { class: 'course-row' }, cards)));
  });
}

// 장 고르기(2026-11-09 선생님 시안 E): 1장부터 6장까지 점선 길로 이어진 보드게임 길. 마친 장은 초록, 지금 할 장은 빨강(크게), 아직 못 가는 장은 흐리게.
// heading: 위 작은 줄(편 이름). onCourses가 있으면 '다른 시대' 버튼이 생기고 'courses'로 끝난다. onBack이 있으면 '◀ 뒤로' 버튼이 생기고 'back'으로 끝난다(첫 화면으로).
const STOPS = [[9, 72], [26, 30], [42, 66], [58, 28], [75, 64], [91, 30]]; // 길 위 여섯 자리(%)
// 자리들을 지나는 구불구불한 길(가로 화면은 위아래로, 세로 화면(tall)은 좌우로 휜다)
const pathD = (pts, tall = false) => pts.map(([x, y], i) => {
  if (!i) return `M ${x} ${y}`;
  const [px, py] = pts[i - 1], out = i % 2 ? -14 : 14;
  return tall ? ` Q ${(out < 0 ? Math.min(px, x) : Math.max(px, x)) + out} ${(py + y) / 2} ${x} ${y}` : ` Q ${(px + x) / 2} ${(out < 0 ? Math.min(py, y) : Math.max(py, y)) + out} ${x} ${y}`;
}).join('');
export function showMap(root, chapters, save, { onSessionCard, onCourses, onBack, onLetters, heading } = {}) { // onLetters: 편지를 받은 편이면 「편지함」 단추
  return new Promise(resolve => {
    const board = h('div', { class: 'board' });
    const wide = STOPS, tall = STOPS.map(([x, y]) => [y, x]); // 세로 화면에서는 위에서 아래로
    board.innerHTML = `<svg class="board-path wide" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${pathD(wide)}" vector-effect="non-scaling-stroke"/></svg>` +
      `<svg class="board-path tall" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${pathD(tall, true)}" vector-effect="non-scaling-stroke"/></svg>`;
    let next = null;
    chapters.forEach((c, i) => {
      const r = save.chapterResult(c.id);
      const open = isUnlocked(c, save), now = open && !r && !next && c.load;
      if (now) next = c;
      const [x, y] = STOPS[i] || [50, 50];
      board.appendChild(h('button', {
        class: `pick stop ${r ? 'done' : ''} ${now ? 'now' : ''}`, type: 'button', 'data-chapter': c.id, disabled: !open, style: `--x:${x}%;--y:${y}%`,
        onclick: () => { el.remove(); resolve(c.id); },
      }, h('i', {}, String(c.no)), save.quest?.(c.id) && h('em', { class: 'stop-quest', title: '도전 쪽지를 해냈어요' }, '✦'), h('b', {}, c.title),
      h('small', {}, r ? starText(r.stars) : c.load ? (now ? `${c.years} · ▶ 지금 여기` : c.years) : '준비 중')));
    });
    // 이 편의 장을 하나라도 마쳤으면 결과 카드를 다시 볼 수 있다 (한 편의 1~6장이 한 장의 결과 카드)
    const sessionButtons = chapters.some(c => save.chapterResult(c.id))
      ? [h('button', { class: 'btn', type: 'button', onclick: () => onSessionCard && onSessionCard() }, '시간 여행 일지')] : [];
    const courseButton = onCourses ? h('button', { class: 'btn', type: 'button', onclick: () => { el.remove(); resolve('courses'); } }, '다른 시대') : null;
    const letterButton = onLetters && chapters.some(c => save.chapterResult(c.id)) ? h('button', { class: 'btn board-letters', type: 'button', onclick: () => onLetters() }, '편지함') : null;
    const backButton = onBack ? h('button', { class: 'btn board-back', type: 'button', onclick: () => { el.remove(); resolve('back'); } }, '◀ 뒤로') : null; // 첫 화면으로(2026-11-10 선생님)
    const el = screen(root, 'mapscreen',
      h('div', { class: 'board-wrap' },
        h('div', { class: 'board-head' },
          h('div', {}, heading && h('div', { class: 'eyebrow' }, heading), h('h2', {}, '어디로 갈까요?')),
          h('div', { class: 'row' }, backButton, letterButton, sessionButtons, courseButton)),
        board,
        next && h('button', { class: 'btn primary board-go', type: 'button', onclick: () => { el.remove(); resolve(next.id); } }, `${next.no}장 시작하기 ▸`)));
  });
}

// 장 시작 해설 카드: 줄거리와 시작하기 단추. "이번 장의 나" 상자는 2026-10-27 선생님 말씀으로 뺐다
export function showIntroCard(root, meta, lines) {
  return new Promise(resolve => {
    const el = screen(root, 'intro',
      h('div', { class: 'card' },
        h('div', { class: 'eyebrow' }, `${meta.no}장 · ${meta.years} · ${meta.event}`),
        h('h2', {}, meta.title),
        ...lines.map(l => h('p', {}, l.text)),
        h('button', { class: 'btn primary', type: 'button', onclick: () => { el.remove(); resolve(); } }, '시작하기')));
  });
}

export function showChapterResult(root, meta, r, { quest = null } = {}) { // quest: 도전 쪽지가 있는 장이면 해냈는지(true/false), 없으면 null
  return new Promise(resolve => {
    const el = screen(root, 'result',
      h('div', { class: 'card' },
        h('div', { class: 'eyebrow' }, `${meta.no}장 끝`),
        h('h2', {}, meta.title),
        h('div', { class: 'stats' },
          h('div', {}, h('b', { class: 'stars' }, starText(r.stars)), h('span', {}, '별점')),
          h('div', {}, h('b', {}, `${r.quizCorrect}/${r.quizTotal}`), h('span', {}, '퀴즈')),
          r.firstTryTotal > 0 && h('div', {}, h('b', {}, `${r.firstTryCorrect}/${r.firstTryTotal}`), h('span', {}, '놀이 한 번에')),
          h('div', {}, h('b', {}, timeText(r.seconds)), h('span', {}, '걸린 시간'))),
        quest !== null && h('p', { class: `result-quest ${quest ? 'got' : ''}` }, quest ? '✦ 도전 쪽지 — 참 잘했어요! 금빛 도장을 받았어요' : '✦ 도전 쪽지는 아직이에요. 다시 와서 숨은 안내판을 찾아봐요'),
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', type: 'button', onclick: () => { el.remove(); resolve(); } }, '다음'))));
  });
}

// 편 복습 퀴즈(D-21): 6장을 마치면 결과 카드 전에 장마다 한 문제씩. 고르면 맞았는지와 해설을 보여 주고 '다음'.
// 처음 고른 답으로 센다. { correct, total, wrong: [{ question, answer, explain }] }으로 끝난다
export function showReviewQuiz(root, session, questions) {
  return new Promise(resolve => {
    let k = 0, correct = 0;
    const wrong = [];
    const card = h('div', { class: 'card review-quiz' });
    const el = screen(root, 'review', card);
    const show = () => {
      const q = questions[k];
      const why = h('p', { class: 'card-why', hidden: true, role: 'status' });
      const next = h('button', { class: 'btn primary', type: 'button', hidden: true, onclick: () => { k += 1; if (k < questions.length) show(); else { el.remove(); resolve({ correct, total: questions.length, wrong }); } } }, k + 1 < questions.length ? '다음' : '결과 보기');
      const opts = q.options.map((o, i) => h('button', { class: 'btn review-opt', type: 'button', 'data-i': i, onclick: () => {
        opts.forEach(b => { b.disabled = true; });
        opts[q.answer].classList.add('right');
        if (i === q.answer) { correct += 1; why.textContent = `맞았어요! ${q.explain}`; }
        else { opts[i].classList.add('wrong'); wrong.push({ question: q.question, answer: q.options[q.answer], explain: q.explain }); why.textContent = `정답은 '${q.options[q.answer]}'이에요. ${q.explain}`; }
        why.hidden = false; next.hidden = false;
      } }, o));
      card.replaceChildren(
        h('div', { class: 'eyebrow' }, `복습 퀴즈 · ${SESSIONS[session].title} · ${k + 1}/${questions.length}`),
        h('h2', {}, q.question),
        h('div', { class: 'review-opts' }, opts), why, h('div', { class: 'row' }, next));
    };
    show();
  });
}

export function showSessionCard(root, session, save, chapters) {
  return new Promise(resolve => {
    const list = chapters.filter(c => c.session === session);
    const results = list.map(c => save.chapterResult(c.id)).filter(Boolean);
    const qc = results.reduce((a, r) => a + r.quizCorrect, 0), qt = results.reduce((a, r) => a + r.quizTotal, 0);
    const secs = results.reduce((a, r) => a + r.seconds, 0);
    const rv = save.review ? save.review(session) : null; // 편 복습 퀴즈(D-21)
    const wrong = [...results.flatMap(r => r.wrongQuizzes || []), ...(rv?.wrong || [])];
    const today = new Date();
    const el = screen(root, 'session',
      h('div', { class: 'card wide' },
        h('div', { class: 'eyebrow' }, `시간 여행 일지 · ${SESSIONS[session].title}`),
        h('h2', {}, save.data.name || '이름 없음'),
        h('div', { class: 'stamps' }, list.map(c => { const r = save.chapterResult(c.id); return h('i', { class: r ? 'done' : '', title: `${c.no}장` }, r ? '★'.repeat(r.stars || 0) || '✓' : String(c.no)); })), // 다녀온 장마다 도장(타임머신 틀, 2026-11-09)
        h('p', { class: 'date' }, `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`),
        h('ul', { class: 'chapter-list' }, list.map(c => {
          const r = save.chapterResult(c.id);
          return h('li', {}, h('span', {}, `${c.no}장 ${c.title}`), h('b', { class: 'stars' }, r ? starText(r.stars) : '아직'));
        })),
        h('div', { class: 'stats' },
          h('div', {}, h('b', {}, `${qc}/${qt}`), h('span', {}, '퀴즈 정답')),
          rv && h('div', {}, h('b', {}, `${rv.correct}/${rv.total}`), h('span', {}, '복습 퀴즈')),
          h('div', {}, h('b', {}, timeText(secs)), h('span', {}, '걸린 시간'))),
        h('div', { class: 'points' }, h('b', {}, '핵심 정리'), h('ol', {}, SESSIONS[session].points.map(p => h('li', {}, p)))),
        wrong.length > 0 && h('div', { class: 'review' }, h('b', {}, '다시 보기'),
          h('ul', {}, wrong.map(w => h('li', {}, `${w.question} → 정답: ${w.answer}. ${w.explain}`)))),
        h('p', { class: 'note' }, '이 화면을 선생님께 보여 주세요.'),
        h('button', { class: 'btn primary', type: 'button', onclick: () => { el.remove(); resolve(); } }, '닫기')));
  });
}

const openMenus = new WeakMap(); // root → 열려 있는 메뉴의 약속 (Esc를 여러 번 눌러도 메뉴는 하나)
export function showMenu(root, { muted, music = null, quality, storageOk = true }, onChange) { // 역사 수첩 단추는 2026-10-27(D-9) 뺐다
  if (openMenus.has(root)) return openMenus.get(root);
  const p = new Promise(resolve => {
    const close = v => { el.remove(); openMenus.delete(root); resolve(v); };
    const leave = h('div', { class: 'confirm', hidden: true },
      h('p', {}, '이 기기에서는 저장되지 않아서, 장 선택으로 나가면 지금까지 한 것이 사라져요.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn danger', type: 'button', onclick: () => close('map') }, '그래도 나가기'),
        h('button', { class: 'btn', type: 'button', onclick: () => { leave.hidden = true; } }, '계속하기')));
    const fsMenu = fullscreenButton();
    const shown = quality === 'lite' ? 'medium' : quality; // lite는 자동 조절이 고르는 '보통(가볍게)': 단추는 보통에 불이 켜진다
    const qb = (lv, label) => h('button', { class: `btn ${shown === lv ? 'on' : ''}`, type: 'button', onclick: () => { onChange({ quality: lv }); close('close'); } }, label);
    const el = screen(root, 'menu',
      h('div', { class: 'card' },
        h('h2', {}, '메뉴'),
        h('p', {}, '소리'),
        h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => { onChange({ muted: !muted }); close('close'); } }, muted ? '소리 켜기' : '소리 끄기'),
          music !== null && h('button', { class: 'btn', type: 'button', onclick: () => { onChange({ music: !music }); close('close'); } }, music ? '음악 끄기' : '음악 켜기')),
        h('p', {}, '화질'),
        h('div', { class: 'row' }, qb('low', '낮음'), qb('medium', '보통'), qb('high', '높음')),
        fsMenu && h('p', {}, '화면'), fsMenu && h('div', { class: 'row' }, fsMenu),
        h('div', { class: 'row' },
          h('button', { class: 'btn', type: 'button', onclick: () => close('avatar') }, '내 캐릭터 바꾸기'),
          h('button', { class: 'btn', type: 'button', onclick: () => (storageOk ? close('map') : (leave.hidden = false)) }, '장 선택으로'),
          h('button', { class: 'btn primary', type: 'button', onclick: () => close('close') }, '닫기')),
        leave));
  });
  openMenus.set(root, p);
  return p;
}

export function showMessage(root, title, text) {
  screen(root, 'intro', h('div', { class: 'card' }, h('h2', {}, title), h('p', {}, text)));
}

// 탐험 중 화면 위 정보: 장 제목, 목표, 메뉴 버튼, 인물 위 "대화하기" 표시, 터치 조작.
export function createHud(root, { touch }) {
  // 왼쪽 위 '퀘스트' 목록(C-01, 2026-10-28): 마친 퀘스트는 ✓로 흐리게, 지금 퀘스트는 굵게, 그 아래 진행 수(들은 이야기 1/3 등)
  const quests = h('ol', { class: 'quest-list' });
  const goal = h('span', { class: 'goal-text' }); // 지금 퀘스트 글(시험·배치 검사가 찾는다)
  const goalStep = h('span', { class: 'goal-step', hidden: true });
  const chapter = h('div', { class: 'hud-chapter' });
  const timer = h('div', { class: 'hud-timer', hidden: true });
  const counter = h('div', { class: 'hud-counter', hidden: true });
  const found = h('div', { class: 'hud-found', hidden: true }); // 예전 '살펴본 안내판' 칸: 이제 쓰지 않는다(늘 숨김)
  quests.append(h('li', { class: 'quest' }, counter)); // 퀘스트를 정하기 전에도 진행 수는 보인다
  const box = h('div', { class: 'hud', hidden: true }, chapter, h('div', { class: 'hud-goal' }, h('span', { class: 'seal' }, '퀘스트'), quests), found, h('div', { class: 'hud-row' }, timer));
  const notice = h('div', { class: 'hud-notice', hidden: true, role: 'status' });
  const bigTimer = h('div', { class: 'hud-bigtimer', hidden: true, 'aria-live': 'off' }); // 남은 시간: 화면 위 가운데에 크게
  const bigWait = h('div', { class: 'hud-bigwait', hidden: true, 'aria-live': 'off' }); // 기다리는 동안 남은 초(정류장 등): 큰 시간 바로 아래
  const menuBtn = h('button', { class: 'menubtn', type: 'button', hidden: true, 'aria-label': '메뉴' }, '메뉴');
  const prompt = h('div', { class: 'prompt', hidden: true }, touch ? '대화 버튼을 눌러요' : 'E 대화하기');
  const joyZone = h('div', { class: 'joyzone', hidden: true });
  const talkBtn = h('button', { class: 'talkbtn', type: 'button', hidden: true, disabled: true }, '대화');
  const fade = h('div', { class: 'fade' });
  root.append(box, menuBtn, prompt, joyZone, talkBtn, fade, notice, bigTimer, bigWait);
  // 행동 버튼 글자(2026-11-08 선생님): 늘 '대화'가 아니라 지금 하는 일(구하기·줍기·올리기…)을 보인다. 사람과 이야기할 때만 '대화'
  const setActionLabel = label => { const t = buttonWord(label); if (talkBtn.textContent !== t) { talkBtn.textContent = t; talkBtn.classList.toggle('long', t.length > 3); } };
  let noticeTimer = null;
  let camera = null;
  let lastList = null, lastIdx = -1; // 퀘스트 목록에서 마지막으로 보인 차례
  let noteLi = null; // 도전 쪽지 줄
  return {
    joyZone, talkBtn, menuBtn,
    attachCamera(c) { camera = c; },
    show(meta) { // 화면 위 "나: …" 줄은 2026-10-27 선생님 말씀으로 뺐다
      chapter.textContent = `${meta.no}장 · ${meta.years} ${meta.event}`;
      box.hidden = false; menuBtn.hidden = false; joyZone.hidden = talkBtn.hidden = !touch; },
    hide() { noteLi?.remove(); noteLi = null; box.hidden = true; menuBtn.hidden = true; prompt.hidden = true; joyZone.hidden = talkBtn.hidden = true; notice.hidden = true; found.hidden = true; bigTimer.hidden = true; bigWait.hidden = true; },
    // 잠깐 뜨는 알림(새 장소 발견 등): 화면 위 가운데, 누르지 않아도 사라진다
    notice(text) { notice.textContent = text; notice.hidden = false; if (!box.hidden) notice.style.top = `${Math.round(box.getBoundingClientRect().bottom + 8)}px`; /* 목표 상자 바로 아래 */ clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { notice.hidden = true; }, 2800); },
    // 예전 '살펴본 안내판 a/b': 퀘스트 목록으로 합쳐 더는 보이지 않는다(C-01)
    setFound() { found.hidden = true; },
    // 지금 퀘스트(text)와 이 장의 퀘스트 목록(list). list 안에서 text보다 앞의 것은 마친 퀘스트로 ✓
    setGoal(text, step = null, list = []) {
      goal.textContent = text || ''; goalStep.hidden = !step; if (step) goalStep.textContent = `${step[0]}/${step[1]}`;
      const i = list.indexOf(text);
      if (list !== lastList) { lastList = list; lastIdx = -1; }
      // 목록에 없는 퀘스트(빛나는 문 찾아가기 등)는 그때까지 한 퀘스트를 모두 마친 것으로 본다
      const done = (i >= 0 ? list.slice(0, i) : list.slice(0, lastIdx + 1)).slice(-2); // 마친 것은 바로 앞 두 개만(화면이 좁아서)
      if (i >= 0) lastIdx = i;
      const cur = h('li', { class: 'quest now' }, goal, counter);
      quests.replaceChildren(...done.map(t => h('li', { class: 'quest done' }, t)), text ? cur : h('li', { class: 'quest' }, counter)); // 퀘스트가 없어도 진행 수는 보인다
      if (noteLi) quests.append(noteLi);
    },
    // 도전 쪽지 줄(core/challenge.js): 퀘스트 목록 맨 아래에 붙는다. done이면 금빛 ✓, text가 없으면 뗀다
    setChallenge(text, done = false) {
      noteLi?.remove(); noteLi = text ? h('li', { class: `quest note ${done ? 'got' : ''}` }, h('b', {}, done ? '✦ 참 잘했어요' : '✦ 도전 쪽지'), ` ${text}`) : null;
      if (noteLi) quests.append(noteLi);
    },
    setTimer(sec) {
      timer.hidden = true; bigTimer.hidden = sec == null; // 작은 글 대신 가운데 큰 숫자
      if (sec != null) { const n = Math.max(0, Math.ceil(sec)); timer.textContent = `남은 시간 ${n}초`; bigTimer.textContent = `${n}초`; bigTimer.classList.toggle('low', n <= 10); }
    },
    // 기다리기(정류장에서 손님이 내리는 중 등): 화면 위 가운데에 크게 (null이면 숨김)
    setWait(text, { center = false } = {}) { bigWait.hidden = text == null; bigWait.classList.toggle('center', text != null && center); if (text != null) bigWait.textContent = text; }, // center: 화면 한가운데에 크게
    setCounter(text) { counter.hidden = text == null; if (text != null) counter.textContent = text; },
    setTalkEnabled(b) { talkBtn.disabled = !b; },
    setTouchVisible(b) { joyZone.hidden = talkBtn.hidden = !(touch && b); },
    // label: 말풍선 글(없으면 'E 대화하기'). 문·물건 앞에서는 '문으로 들어가기' 등으로 바꾼다
    setPrompt(pos, label = null) {
      setActionLabel(label); // 말풍선 자리가 없어도(조선 4장 포격) 버튼 글자는 하는 일로
      if (!pos || !camera) { prompt.hidden = true; return; }
      prompt.textContent = label ? (touch ? label : `E ${label}`) : (touch ? '말 걸기' : 'E 대화하기');
      const v = pos.clone().setY(3.3).project(camera);
      prompt.style.left = `${((v.x + 1) / 2) * 100}%`;
      prompt.style.top = `${((1 - v.y) / 2) * 100}%`;
      prompt.hidden = false;
    },
    fade(on) { fade.classList.toggle('on', on); return new Promise(r => setTimeout(r, 650)); },
  };
}
