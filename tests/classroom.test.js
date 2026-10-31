import { test, eq, ok } from './harness.js';
import { showTitle } from '../core/screens.js';
import { orderCards, traceGlyph } from '../core/minigame.js';
import { sleep } from './bot.js';

const btn = (el, text) => [...el.querySelectorAll('button')].find(b => b.textContent.includes(text));

test('title: no QR button and no teacher guide', async () => {
  const el = document.createElement('div'); document.body.appendChild(el);
  showTitle(el, { savedName: '', hasProgress: false, storageOk: true });
  ok(!el.textContent.includes('QR'), 'no QR button');
  ok(!el.textContent.includes('선생님 안내'), 'no guide link');
  const lib = await fetch('../vendor/qrcode.min.js', { cache: 'no-store' });
  eq(lib.status, 404, 'QR tool removed');
  el.remove();
  const r = await fetch('../teacher.html', { cache: 'no-store' });
  eq(r.status, 404, 'guide page removed');
});

// 글자 새기기 판은 화면 높이를 거의 다 쓴다 (갤럭시 탭 S6 Lite 가로 약 1000×530, 크롬북 1366×650, 휴대폰 740×360)
for (const [w, h, min] of [[1000, 530, 440], [1366, 650, 560], [740, 360, 290]]) {
  test(`trace board is big and fits on ${w}×${h}`, async () => {
    const frame = document.createElement('iframe');
    frame.src = './fit.html?kind=trace'; frame.style.cssText = `width:${w}px;height:${h}px;position:fixed;left:-3000px;top:0;border:0`;
    document.body.appendChild(frame);
    try {
      await new Promise(r => frame.addEventListener('load', r));
      for (let i = 0; i < 50 && !frame.contentDocument.querySelector('.screen'); i++) await sleep(20);
      const r = frame.contentDocument.querySelector('.trace-board').getBoundingClientRect();
      ok(r.width >= min, `board ${Math.round(r.width)}px wide, want ≥ ${min}`);
      ok(r.top >= 0 && r.bottom <= h + 1 && r.right <= w + 1, `board inside ${Math.round(r.left)},${Math.round(r.top)}..${Math.round(r.right)},${Math.round(r.bottom)}`);
    } finally { frame.remove(); }
  }, { timeout: 15000 });
}

for (const kind of ['trace', 'order']) {
  test(`phone: ${kind} screen fits a 740×360 phone held sideways`, async () => {
    const frame = document.createElement('iframe');
    frame.src = `./fit.html?kind=${kind}`; frame.style.cssText = 'width:740px;height:360px;position:fixed;left:-3000px;top:0;border:0';
    document.body.appendChild(frame);
    try {
      await new Promise(r => frame.addEventListener('load', r));
      for (let i = 0; i < 50 && !frame.contentDocument.querySelector('.screen'); i++) await sleep(20);
      const d = frame.contentDocument;
      const target = kind === 'trace' ? d.querySelector('.trace-board') : d.querySelector('.order-pile');
      const r = target.getBoundingClientRect();
      ok(r.bottom <= 360 + 1 && r.top >= 0, `${kind} spans ${Math.round(r.top)}..${Math.round(r.bottom)} in a 360px-tall screen`);
    } finally { frame.remove(); }
  }, { timeout: 15000 });
}

test('marks: placed cards get ○ and a wrong card gets ×', async () => {
  const ui = document.createElement('div'); document.body.appendChild(ui);
  const p = orderCards({ ui }, { title: '순서', cards: ['가', '나', '다'] });
  [...ui.querySelectorAll('.order-card')].find(b => b.textContent === '가').click();
  ok(ui.querySelector('.order-slots li').textContent.startsWith('○'), 'placed card marked ○');
  const wrong = [...ui.querySelectorAll('.order-card')].find(b => b.textContent === '다');
  wrong.click();
  ok(wrong.textContent.startsWith('×'), 'wrong card marked ×');
  ok(!ui.querySelector('.card-why').hidden, 'and an explanation is shown');
  [...ui.querySelectorAll('.order-card')].find(b => b.textContent === '나').click();
  await new Promise(r => setTimeout(r, 950)); // 틀린 카드의 × 표시가 사라지면 이어서 고른다
  [...ui.querySelectorAll('.order-card')].find(b => b.textContent === '다').click();
  eq(await p, 'missed'); ui.remove();
});

test('marks: passed dots show a ✓', () => {
  const ui = document.createElement('div'); document.body.appendChild(ui);
  traceGlyph({ ui }, { glyph: '一', strokes: [[[0.2, 0.5], [0.5, 0.5], [0.8, 0.5]]] });
  const board = ui.querySelector('.trace-board'), r = board.getBoundingClientRect();
  const at = (type, fx, fy) => board.dispatchEvent(new PointerEvent(type, { pointerId: 6, bubbles: true, clientX: r.left + fx * r.width, clientY: r.top + fy * r.height }));
  at('pointerdown', 0.2, 0.5); at('pointermove', 0.5, 0.5);
  eq(board.querySelectorAll('.dot-check').length, 2, 'first two dots checked');
  ui.remove();
});


// 남은 일 "첫 화면 병사가 버튼 뒤에 겹침"(2026-10-31 확인): 시대를 고른 뒤 장 고르기 지도에서 학생 병사가 반투명 장 단추 뒤에 비쳐 보였다
test('map: 장 고르기 지도 뒤에 학생 병사가 보이지 않는다', async () => {
  const frame = document.createElement('iframe');
  frame.src = '../index.html?e2e=1'; frame.style.cssText = 'width:1000px;height:560px;position:fixed;left:-3000px;top:0;border:0';
  document.body.appendChild(frame);
  try {
    await new Promise(r => frame.addEventListener('load', r));
    const d = () => frame.contentDocument, find = t => [...d().querySelectorAll('button')].find(b => b.textContent.includes(t));
    const wait = async (f, ms = 20000) => { for (let i = 0; i < ms / 50; i++) { const v = f(); if (v) return v; await sleep(50); } return null; };
    const w = await wait(() => frame.contentWindow.__world);
    ok(w, 'world');
    (await wait(() => find('고려를 지켜라'))).click();
    (await wait(() => find('처음부터'))).click();
    (await wait(() => d().querySelector('input'))).value = '시험';
    (await wait(() => find('시작'))).click();
    ok(await wait(() => d().body.textContent.includes('어디로 갈까요')), '장 고르기 지도');
    await sleep(300);
    ok(!w.player.visible, '지도 뒤 학생 병사는 숨긴다');
  } finally { frame.remove(); }
}, { timeout: 40000 });
