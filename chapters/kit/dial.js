// 놀이 부품 「해 그림자 맞추기」(2026-10-27, 조선편 세종 과학 · 앙부일구). 그릇 위 둥근 길의 해를 끌거나(◀ ▶ · ← →) 옮기면
// 그림자 바늘이 반대쪽으로 움직인다(해가 동쪽이면 그림자는 서쪽). 목표 시각(동물) 줄에 그림자를 맞추고 '맞춰 보기'(스페이스 · 엔터).
// 한 판에서 maxWrong번 틀리면 실패. easy면 목표 줄이 반짝이고 허용 폭이 넓다. 사실 문장은 만들지 않는다.
import { makePanel, btn } from './panel.js';

const CSS = `
.dial-svg { display: block; width: 100%; max-width: 560px; max-height: calc(100vh - 250px); margin: 0 auto; touch-action: none; user-select: none; }
.dial-row { display: flex; justify-content: center; gap: 10px; margin-top: 6px; }
.dial-target .blink { animation: dial-blink .6s ease-in-out infinite alternate; }
@keyframes dial-blink { to { stroke: #f2c14a; stroke-width: 6; } }
@media (max-height: 430px) { .dial-svg { max-width: 380px; } }
`;
function ensureStyle() { if (document.getElementById('kit-dial-style')) return; const s = document.createElement('style'); s.id = 'kit-dial-style'; s.textContent = CSS; document.head.appendChild(s); }

// hours: [[이름, 그림]...](서쪽 → 동쪽, 9칸), target: 맞출 칸 번호
export function dial(ctx, { hours, target, title = '', prompt = '', eyebrow = '앙부일구', hint = '', easy = false, maxWrong = 2, labels = {} } = {}) {
  ensureStyle();
  const N = hours.length - 1, tol = easy ? 0.6 : 0.3;
  const X = i => 50 + i * 25;
  return new Promise(resolve => {
    const P = makePanel(ctx, { kind: 'dial', eyebrow, title, prompt });
    const lines = hours.map((h, i) => `<line class="hl${i === target ? ' tgt' : ''}" x1="${X(i)}" y1="96" x2="${X(i)}" y2="186" stroke="${i === target ? '#b8452f' : '#5a4130'}" stroke-width="${i === target ? 3 : 1.4}"/><text x="${X(i)}" y="206" font-size="19" text-anchor="middle">${h[1]}</text>`).join('');
    P.body.innerHTML = `<svg class="dial-svg dial-target" viewBox="0 0 300 214" role="img" aria-label="앙부일구"><path d="M30 70 Q150 -6 270 70" fill="none" stroke="#d9a441" stroke-width="2" stroke-dasharray="4 4"/>
      <text x="22" y="86" font-size="11">서</text><text x="270" y="86" font-size="11">동</text>
      <ellipse cx="150" cy="140" rx="128" ry="58" fill="#c9a86a" stroke="#6b4a32" stroke-width="3"/>${lines}
      <line class="shadow" x1="150" y1="92" x2="150" y2="180" stroke="#1b1f1d" stroke-width="7" stroke-linecap="round" opacity="0.85"/>
      <circle class="sun" cx="150" cy="32" r="13" fill="#f2c14a" stroke="#b8862a" stroke-width="3"/></svg>`;
    const svg = P.body.querySelector('svg'), sunEl = svg.querySelector('.sun'), shEl = svg.querySelector('.shadow');
    if (easy) svg.querySelector('.tgt').classList.add('blink');
    const row = document.createElement('div'); row.className = 'dial-row';
    const left = btn(labels.left || '◀ 해'), right = btn(labels.right || '해 ▶'), ok = btn(labels.check || '맞춰 보기', 'alt');
    left.dataset.act = 'left'; right.dataset.act = 'right'; ok.dataset.act = 'check';
    row.append(left, ok, right); P.body.append(row);
    let sun = N / 2, wrong = 0, done = false;
    const shadowAt = () => N - sun;
    const draw = () => {
      const u = sun / N, x = 30 + u * 240, y = 70 - Math.sin(Math.PI * u) * 38;
      sunEl.setAttribute('cx', x.toFixed(1)); sunEl.setAttribute('cy', y.toFixed(1));
      const sx = X(shadowAt()); shEl.setAttribute('x1', sx.toFixed(1)); shEl.setAttribute('x2', sx.toFixed(1));
      if (ctx.testHooks) ctx.testHooks.dial = done ? null : { ready: true, sun, need: N - target, tol };
    };
    const move = d => { if (done) return; sun = Math.max(0, Math.min(N, Math.round((sun + d) * 2) / 2)); ctx.audio?.play('tap'); draw(); };
    const check = () => {
      if (done) return;
      if (Math.abs(shadowAt() - target) <= tol + 1e-6) { done = true; ctx.audio?.play('correct'); draw(); setTimeout(() => { P.close(); resolve({ ok: true, wrong }); }, 700); return; }
      wrong += 1; ctx.audio?.play('wrong'); P.shake(svg); P.hint(hint);
      if (wrong >= maxWrong) { done = true; draw(); setTimeout(() => { P.close(); resolve({ ok: false, wrong }); }, 300); }
      else draw();
    };
    left.addEventListener('click', () => move(-0.5)); right.addEventListener('click', () => move(0.5)); ok.addEventListener('click', check);
    // 해를 끌어 옮기기
    let drag = null;
    svg.addEventListener('pointerdown', e => { if (done) return; drag = e.pointerId; svg.setPointerCapture?.(e.pointerId); onMove(e); });
    const onMove = e => {
      if (drag !== e.pointerId) return;
      const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 300;
      sun = Math.max(0, Math.min(N, Math.round(((x - 30) / 240) * N * 2) / 2)); draw();
    };
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', () => { drag = null; }); svg.addEventListener('pointercancel', () => { drag = null; });
    const onKey = e => { if (done) return removeEventListener('keydown', onKey); if (e.code === 'ArrowLeft') move(-0.5); else if (e.code === 'ArrowRight') move(0.5); else if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault?.(); check(); } };
    addEventListener('keydown', onKey);
    draw();
  });
}
