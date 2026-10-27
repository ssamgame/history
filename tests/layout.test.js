// 조선편 미니게임 화면 배치 점검: 탭(가로)·크롬북·휴대폰 크기에서 버튼과 판이 화면 안에 다 들어오고 서로 겹치지 않는지
import { test, ok } from './harness.js';
import { sleep } from './bot.js';

const KINDS = ['j3dial', 'j3gauge', 'j4wing', 'j6pulley']; // 아직 게임에 남은 화면 카드 놀이(나머지는 장면 속 놀이로 바뀜)
const SIZES = [[1000, 530], [1000, 600], [1280, 720], [1366, 650], [740, 360], [390, 844], [360, 740]]; // 마지막 둘: 휴대폰 세로
const overlap = (a, b) => a.left < b.right - 2 && b.left < a.right - 2 && a.top < b.bottom - 2 && b.top < a.bottom - 2;

for (const kind of KINDS) {
  test(`layout: ${kind} fits and nothing overlaps on tablet, Chromebook and phone`, async () => {
    for (const [w, h] of SIZES) {
      const frame = document.createElement('iframe');
      frame.src = `./fit.html?kind=${kind}`; frame.style.cssText = `width:${w}px;height:${h}px;position:fixed;left:-3000px;top:0;border:0`;
      document.body.appendChild(frame);
      try {
        await new Promise(r => frame.addEventListener('load', r));
        const d = frame.contentDocument;
        for (let i = 0; i < 100 && !d.querySelector('.screen button'); i++) await sleep(20);
        await sleep(50);
        const buttons = [...d.querySelectorAll('.screen button')];
        ok(buttons.length > 0, `${kind} ${w}x${h}: has buttons`);
        for (const b of buttons) {
          const r = b.getBoundingClientRect();
          ok(r.top >= -1 && r.bottom <= h + 1 && r.left >= -1 && r.right <= w + 1, `${kind} ${w}x${h}: "${b.textContent}" outside the screen (${Math.round(r.left)},${Math.round(r.top)}..${Math.round(r.right)},${Math.round(r.bottom)})`);
          ok(r.height >= 40, `${kind} ${w}x${h}: "${b.textContent}" too small to tap (${Math.round(r.height)}px)`);
        }
        const fig = d.querySelector('.choose-figure svg');
        if (fig) { const r = fig.getBoundingClientRect(); ok(r.height >= 90 && r.bottom <= h, `${kind} ${w}x${h}: picture ${Math.round(r.height)}px tall`); }
        const marks = [...d.querySelectorAll('.place-slot, .place-decor')].map(e => [e, e.getBoundingClientRect()]);
        for (let i = 0; i < marks.length; i++) for (let j = i + 1; j < marks.length; j++) ok(!overlap(marks[i][1], marks[j][1]), `${kind} ${w}x${h}: "${marks[i][0].textContent}" overlaps "${marks[j][0].textContent}"`);
        const board = d.querySelector('.place-board');
        if (board) { const br = board.getBoundingClientRect(); for (const [e, r] of marks) ok(r.left >= br.left - 1 && r.right <= br.right + 1 && r.top >= br.top - 1 && r.bottom <= br.bottom + 1, `${kind} ${w}x${h}: "${e.textContent}" sticks out of the board`); }
      } finally { frame.remove(); }
    }
  }, { timeout: 60000 });
}

// 3D 미니게임 카메라: 꼭 보여야 할 곳이 화면 안에 있고, 아래쪽 큰 버튼(화면 아래 약 20%)과 위쪽 목표 상자에 가리지 않아야 한다
import * as THREE from 'three';
import { testWorld } from './bot.js';
const ASPECTS = [1000 / 530, 1000 / 600, 1366 / 650, 1280 / 720, 740 / 360, 4 / 3];
function checkView(w, fit, points, label) {
  for (const a of ASPECTS) {
    w.camera.aspect = a; w.camera.updateProjectionMatrix();
    w.fitFixedCamera(fit.target, fit.dir, fit.points, fit.margin);
    w.camera.updateMatrixWorld();
    for (const p of points) {
      const v = new THREE.Vector3(...p).project(w.camera);
      ok(Math.abs(v.x) <= 0.95 && v.y >= -0.58 && v.y <= 0.8 && v.z < 1, `${label} aspect ${a.toFixed(2)}: point ${p} at (${v.x.toFixed(2)}, ${v.y.toFixed(2)})`);
    }
  }
}

test('layout: 거중기 장면 — 돌이 지나가는 길과 빈자리 셋이 모든 화면에서 보인다', async () => {
  const { buildJ6Scene, GAPS, TRACK, WALL_Z, WALL_H } = await import('../chapters/joseon/j6/scene.js');
  const w = testWorld();
  try {
    const s = buildJ6Scene(w);
    const pts = [[TRACK[0], WALL_H + 2.5, WALL_Z], [TRACK[1], WALL_H + 2.5, WALL_Z], ...GAPS.map(g => [g, WALL_H - 1.2, WALL_Z]), [0, 9.4, WALL_Z]];
    checkView(w, s.wallFit, pts, 'crane');
  } finally { w.dispose(); }
});

test('layout: 한산도 바다 — 미끼 배 출발점, 견내량 입구, 기다리는 적, 학익진이 모든 화면에서 보인다', async () => {
  const { buildJ4Scene, STRAIT_Z, ENEMY_WAIT, WING } = await import('../chapters/joseon/j4/scene.js');
  const w = testWorld();
  try {
    const s = buildJ4Scene(w);
    const pts = [[0, 0, -30], [0, 0, STRAIT_Z + 2], [-8, 0, ENEMY_WAIT], [8, 0, ENEMY_WAIT + 7], [WING.x - WING.r, 0, WING.z + 6], [WING.x + WING.r, 0, WING.z + 6], [0, 0, -40]];
    checkView(w, s.seaFit, pts, 'sea');
  } finally { w.dispose(); }
});

// 근대~현대편 카드형 미니게임: 모든 버튼이 화면 안에 있고, 손가락으로 누를 수 있으며(다른 것에 덮이지 않음), 자리 놓기 판의 칸이 겹치지 않는다
import { MODERN, COLONIAL, PRESENT } from '../chapters/index.js';
const KIT_SIZES = [[1000, 530], [1280, 720], [1280, 800], [1366, 650], [740, 360], [390, 844], [360, 740]];
for (const meta of [...MODERN, ...COLONIAL, ...PRESENT]) {
  test(`layout: ${meta.id} card minigames fit, can be tapped and do not overlap`, async () => {
    const parts = Object.values((await meta.load()).default.script.parts);
    for (const [n, p] of parts.entries()) {
      if (!['choose', 'sort', 'place', 'order', 'gauge'].includes(p.type)) continue; // 화면 카드 놀이만 (장면 속 놀이는 kit·play 테스트가 맡는다)
      for (const fill of p.type === 'place' ? ['', '&fill=1'] : ['']) {
        // 화면 크기마다 새 iframe을 띄우지 않고 하나를 크기만 바꿔 가며 본다(헤드리스 브라우저 메모리 아끼기)
        const frame = document.createElement('iframe');
        frame.src = `./fit.html?kind=kit:${meta.id}:${n}${fill}`; frame.style.cssText = 'position:fixed;left:-3000px;top:0;border:0';
        document.body.appendChild(frame);
        try {
          await new Promise(r => frame.addEventListener('load', r));
          const d = frame.contentDocument;
          for (let i = 0; i < 100 && !d.querySelector('#ui button'); i++) await sleep(20);
          for (const [w, h] of KIT_SIZES) {
            const tag = `${meta.id}:${n} ${p.type}${fill ? ' filled' : ''} ${w}x${h}`;
            frame.style.width = `${w}px`; frame.style.height = `${h}px`;
            await sleep(60);
            const buttons = [...d.querySelectorAll('#ui button')].filter(b => !b.hidden && !b.disabled);
            ok(buttons.length > 0, `${tag}: has buttons`);
            for (const b of buttons) {
              const r = b.getBoundingClientRect();
              ok(r.top >= -1 && r.bottom <= h + 1 && r.left >= -1 && r.right <= w + 1, `${tag}: "${b.textContent}" outside the screen`);
              ok(r.height >= 40, `${tag}: "${b.textContent}" too small to tap (${Math.round(r.height)}px)`);
              const top = d.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
              ok(top && (top === b || b.contains(top)), `${tag}: "${b.textContent}" is covered by ${top && top.className}`);
              ok(b.scrollWidth <= b.clientWidth + 2, `${tag}: "${b.textContent}" text sticks out`);
            }
            const marks = [...d.querySelectorAll('.place-slot, .place-decor')].map(e => [e, e.getBoundingClientRect()]);
            for (let i = 0; i < marks.length; i++) for (let j = i + 1; j < marks.length; j++) ok(!overlap(marks[i][1], marks[j][1]), `${tag}: "${marks[i][0].textContent}" overlaps "${marks[j][0].textContent}"`);
            const board = d.querySelector('.place-board');
            if (board) { const br = board.getBoundingClientRect(); for (const [e, r] of marks) ok(r.left >= br.left - 1 && r.right <= br.right + 1 && r.top >= br.top - 1 && r.bottom <= br.bottom + 1, `${tag}: "${e.textContent}" sticks out of the board`); }
          }
        } finally { frame.remove(); }
      }
    }
  }, { timeout: 120000 });
}

// 역사책: 재현 그림을 크게 보여 주되, 설명문·쪽 번호·이전/다음 버튼이 화면 안에 있고 서로 겹치지 않는다(탭 가로·세로, 휴대폰 가로·세로)
test('layout: 역사책 그림은 크고, 글·쪽 번호·버튼은 잘리거나 겹치지 않는다', async () => {
  for (const [w, h, minPic] of [[1000, 560, 300], [1280, 800, 330], [800, 1280, 330], [740, 360, 150], [844, 390, 170], [390, 844, 160], [360, 640, 140]]) {
    const frame = document.createElement('iframe');
    frame.src = '../tools/book-preview.html?ch=k5&page=2'; frame.style.cssText = `width:${w}px;height:${h}px;position:fixed;left:-3000px;top:0;border:0`;
    document.body.appendChild(frame);
    try {
      await new Promise(r => frame.addEventListener('load', r));
      const d = frame.contentDocument;
      for (let i = 0; i < 300 && d.title !== 'done'; i++) await sleep(30);
      await sleep(100);
      const R = s => d.querySelector(s)?.getBoundingClientRect();
      const img = R('.book-diorama'), text = R('.book-text'), nav = R('.book-nav'), page = R('.page');
      ok(img && d.querySelector('.book-badge')?.textContent === '재현 그림', `${w}x${h}: 재현 그림과 표`);
      ok(img.width >= minPic, `${w}x${h}: 그림 너비 ${Math.round(img.width)}px`);
      ok(img.bottom <= nav.top + 1 && text.bottom <= nav.top + 1, `${w}x${h}: 그림·글이 버튼 줄과 겹친다`);
      for (const b of [...d.querySelectorAll('.book-nav button')].map(e => e.getBoundingClientRect()).concat([page]))
        ok(b.top >= -1 && b.bottom <= h + 1 && b.left >= -1 && b.right <= w + 1 && b.height <= 60, `${w}x${h}: 버튼·쪽 번호가 화면 밖이거나 두 줄 (${Math.round(b.left)},${Math.round(b.top)}..${Math.round(b.right)},${Math.round(b.bottom)})`);
      ok(text.width >= 140 && text.height >= 60, `${w}x${h}: 글 칸이 너무 작다 ${Math.round(text.width)}x${Math.round(text.height)}`);
    } finally { frame.remove(); }
  }
}, { timeout: 120000 });

// 탐험 화면 위 정보(HUD): 세로 화면에서도 목표가 한 글자씩 세로로 쌓이지 않고, 메뉴·남은 시간·알림·대화창과 겹치지 않는다
test('layout: 목표 상자·남은 시간·알림·대화창이 세로·가로 모든 화면에서 겹치거나 한 글자씩 꺾이지 않는다', async () => {
  for (const [w, h] of [[320, 568], [360, 640], [390, 844], [412, 915], [800, 1280], [740, 360], [844, 390], [1000, 560], [1280, 800], [1920, 1080]]) for (const play of [false, true]) {
    const frame = document.createElement('iframe');
    frame.src = `./fit.html?kind=hud${play ? '&toast=1' : ''}`; frame.style.cssText = `width:${w}px;height:${h}px;position:fixed;left:-3000px;top:0;border:0`;
    document.body.appendChild(frame);
    try {
      await new Promise(r => frame.addEventListener('load', r));
      const d = frame.contentDocument;
      for (let i = 0; i < 100 && !d.querySelector('.dlg-text')?.textContent; i++) await sleep(20);
      await sleep(80);
      const R = s => { const e = d.querySelector(s); return e && !e.hidden ? e.getBoundingClientRect() : null; };
      const hud = R('.hud'), goal = R('.goal-text'), menu = R('.menubtn'), big = R('.hud-bigtimer'), wait = R('.hud-bigwait'), note = R('.hud-notice'), dlg = R('.dlg'), dtext = d.querySelector('.dlg-text'), toastR = R('.play-toast');
      const tag = `${w}x${h}${play ? ' 미니게임' : ' 탐험'}`;
      ok(goal.width >= 150, `${tag}: 목표 글 칸이 좁다 ${Math.round(goal.width)}px`);
      ok(goal.height <= 4 * 23, `${tag}: 목표가 너무 여러 줄 ${Math.round(goal.height)}px`);
      for (const [name, r] of [['메뉴', menu], ['남은 시간', big], ['기다리기', wait], play ? ['놀이 알림', toastR] : ['새 장소 알림', note]]) ok(r && !overlap(hud, r), `${tag}: 목표 상자가 ${name}와 겹친다`);
      if (play) ok(!overlap(toastR, big) && !overlap(toastR, menu) && !overlap(toastR, wait), `${tag}: 놀이 알림이 남은 시간·메뉴·기다리기와 겹친다`);
      ok(!overlap(big, menu) && !overlap(wait, menu) && !overlap(big, wait), `${tag}: 남은 시간·기다리기·메뉴가 서로 겹친다`);
      for (const [name, r] of [['목표 상자', hud], play ? ['놀이 알림', toastR] : ['새 장소 알림', note], ['대화창', dlg], ['남은 시간', big], ['메뉴', menu]]) ok(r.left >= -1 && r.right <= w + 1 && r.top >= -1 && r.bottom <= h + 1, `${tag}: ${name}가 화면 밖`);
      ok(!overlap(hud, dlg), `${tag}: 목표 상자와 대화창이 겹친다`);
      ok(dtext.scrollHeight <= dtext.clientHeight + 2, `${tag}: 대화 글이 잘린다`);
      const name = R('.dlg-name'); ok(name.right <= dlg.right + 1, `${tag}: 긴 이름이 대화창 밖으로`);
    } finally { frame.remove(); }
  }
}, { timeout: 120000 });
