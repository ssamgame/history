// 놀이 부품 「학익진 날개 펴기」(2026-10-27, 조선편 한산도). 바다 판(위에서 본 그림) 가운데에 적 함대, 아래에 우리 배 줄.
// 왼 날개 · 오른 날개 끝 손잡이를 끌어(또는 날개 단추 · 키보드 ← →) 날개를 앞으로 굽혀 적을 감싼다.
// 두 날개 끝이 모두 감싸는 자리(표시 원) 안에 들면 성공, 제한 시간(seconds) 안에 못 하면 실패. easy면 표시 원이 크고 반짝인다.
// 사실 문장은 만들지 않는다(놀이 장치).
import { makePanel, btn } from './panel.js';

const CSS = `
.form-svg { display: block; width: 100%; max-width: 600px; max-height: calc(100vh - 250px); margin: 0 auto; touch-action: none; user-select: none; background: #4f88a8; border-radius: 12px; }
.form-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 6px; max-width: 600px; margin-left: auto; margin-right: auto; }
.form-time { font: 800 18px var(--font-ui); color: #2b241c; }
.form-goal.blink { animation: form-blink .6s ease-in-out infinite alternate; }
@keyframes form-blink { to { stroke: #fff; stroke-width: 4; } }
@media (max-height: 430px) { .form-svg { max-width: 400px; } }
`;
function ensureStyle() { if (document.getElementById('kit-formation-style')) return; const s = document.createElement('style'); s.id = 'kit-formation-style'; s.textContent = CSS; document.head.appendChild(s); }

const BASE = [150, 176], START = { left: [44, 176], right: [256, 176] }, GOAL = { left: [72, 64], right: [228, 64] };
export function formation(ctx, { seconds = 25, easy = false, title = '', prompt = '', eyebrow = '학익진', labels = {}, hint = '' } = {}) {
  ensureStyle();
  const R = easy ? 30 : 20;
  return new Promise(resolve => {
    const P = makePanel(ctx, { kind: 'formation', eyebrow, title, prompt });
    const ship = (cls, fill) => `<g class="${cls}"><path d="M-6 -9 L6 -9 L8 6 L0 12 L-8 6 Z" fill="${fill}" stroke="#2b241c" stroke-width="1.5"/></g>`;
    P.body.innerHTML = `<svg class="form-svg" viewBox="0 0 300 200" role="img" aria-label="학익진 바다 판">
      <g class="enemy">${[[-24, -6], [-8, -12], [8, -12], [24, -6], [-16, 8], [0, 4], [16, 8]].map(([x, y]) => `<g transform="translate(${150 + x} ${72 + y}) rotate(180)"><path d="M-5 -8 L5 -8 L7 5 L0 10 L-7 5 Z" fill="#3a3f4a" stroke="#1b1f1d"/></g>`).join('')}</g>
      ${['left', 'right'].map(s => `<circle class="form-goal${easy ? ' blink' : ''}" data-side="${s}" cx="${GOAL[s][0]}" cy="${GOAL[s][1]}" r="${R}" fill="#ffffff22" stroke="#f2c14a" stroke-width="2.5" stroke-dasharray="5 4"/>`).join('')}
      <g class="ships"></g>
      ${['left', 'right'].map(s => `<circle class="form-handle" data-side="${s}" r="13" fill="#d9a441" stroke="#2b241c" stroke-width="2.5"/>`).join('')}
      ${ship('flag', '#b8452f')}</svg>`;
    const svg = P.body.querySelector('svg'), shipsEl = svg.querySelector('.ships');
    svg.querySelector('.flag').setAttribute('transform', `translate(${BASE[0]} ${BASE[1]})`);
    const row = document.createElement('div'); row.className = 'form-row';
    const lb = btn(labels.left || '◀ 왼 날개'), rb = btn(labels.right || '오른 날개 ▶'), time = document.createElement('div'); time.className = 'form-time';
    lb.dataset.side = 'left'; rb.dataset.side = 'right';
    row.append(lb, time, rb); P.body.append(row);
    const tip = { left: [...START.left], right: [...START.right] };
    let t = 0, done = false;
    const inGoal = s => Math.hypot(tip[s][0] - GOAL[s][0], tip[s][1] - GOAL[s][1]) <= R;
    const draw = () => {
      let html = '';
      for (const s of ['left', 'right']) {
        const [tx, ty] = tip[s], cx = (BASE[0] + tx) / 2 + (s === 'left' ? -18 : 18), cy = Math.max(ty, BASE[1]) + 6; // 바깥으로 불룩한 날개
        for (let k = 1; k <= 4; k++) {
          const u = k / 4, x = (1 - u) * (1 - u) * BASE[0] + 2 * (1 - u) * u * cx + u * u * tx, y = (1 - u) * (1 - u) * BASE[1] + 2 * (1 - u) * u * cy + u * u * ty;
          html += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><path d="M-6 -9 L6 -9 L8 6 L0 12 L-8 6 Z" fill="#8a5a2a" stroke="#2b241c" stroke-width="1.5"/></g>`;
        }
        const h = svg.querySelector(`.form-handle[data-side="${s}"]`); h.setAttribute('cx', tx.toFixed(1)); h.setAttribute('cy', ty.toFixed(1));
        h.setAttribute('fill', inGoal(s) ? '#7fc47a' : '#d9a441');
      }
      shipsEl.innerHTML = html;
      if (ctx.testHooks) ctx.testHooks.formation = done ? null : { ready: true, left: inGoal('left'), right: inGoal('right') };
    };
    const finish = ok => { if (done) return; done = true; off(); removeEventListener('keydown', onKey); draw(); if (ctx.testHooks) ctx.testHooks.formation = null; setTimeout(() => { P.close(); resolve({ ok, time: t }); }, ok ? 800 : 300); };
    const check = () => { if (inGoal('left') && inGoal('right')) { ctx.audio?.play('correct'); finish(true); } };
    // 단추 · 키: 그 날개 끝을 감싸는 자리 쪽으로 한 걸음
    const stepTo = s => {
      if (done) return;
      const [gx, gy] = GOAL[s], [x, y] = tip[s], d = Math.hypot(gx - x, gy - y);
      const k = Math.min(1, 34 / Math.max(d, 1)); tip[s] = [x + (gx - x) * k, y + (gy - y) * k];
      ctx.audio?.play('tap'); draw(); check();
    };
    lb.addEventListener('click', () => stepTo('left')); rb.addEventListener('click', () => stepTo('right'));
    const onKey = e => { if (e.code === 'ArrowLeft') stepTo('left'); else if (e.code === 'ArrowRight') stepTo('right'); };
    addEventListener('keydown', onKey);
    // 손잡이 끌기
    let drag = null;
    svg.addEventListener('pointerdown', e => {
      if (done) return;
      const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 300, y = (e.clientY - r.top) / r.height * 200;
      const s = ['left', 'right'].sort((a, b) => Math.hypot(tip[a][0] - x, tip[a][1] - y) - Math.hypot(tip[b][0] - x, tip[b][1] - y))[0];
      if (Math.hypot(tip[s][0] - x, tip[s][1] - y) > 40) return;
      drag = { id: e.pointerId, s }; svg.setPointerCapture?.(e.pointerId);
    });
    svg.addEventListener('pointermove', e => {
      if (!drag || drag.id !== e.pointerId) return;
      const r = svg.getBoundingClientRect(), s = drag.s;
      let x = (e.clientX - r.left) / r.width * 300, y = (e.clientY - r.top) / r.height * 200;
      x = s === 'left' ? Math.max(10, Math.min(140, x)) : Math.max(160, Math.min(290, x)); y = Math.max(20, Math.min(190, y));
      tip[s] = [x, y]; draw();
    });
    const up = e => { if (drag && drag.id === e.pointerId) { drag = null; check(); } };
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    const off = ctx.world.onUpdate(dt => {
      if (done) return;
      t += dt; time.textContent = `${Math.max(0, Math.ceil(seconds - t))}초`;
      if (t >= seconds) { P.hint(hint, 0); finish(false); }
    });
    draw();
  });
}
