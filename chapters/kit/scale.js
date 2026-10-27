// 놀이 부품 「의견 저울」(2026-10-27, 조선편 남한산성 척화 · 주화). 말풍선을 하나씩 저울의 알맞은 접시(왼쪽 · 오른쪽)에 놓는다(누르기 · 끌기 · 키보드 1 · 2).
// 그 말과 같은 생각의 접시에만 들어가고(아니면 튕김 + 힌트), 다 놓으면 저울이 수평이 된다. 어느 쪽이 옳다는 점수는 없다(원칙).
// maxWrong번 틀리면 실패. easy면 알맞은 접시가 반짝인다. 사실 문장은 만들지 않는다(말풍선 글은 장이 준다).
import { makePanel, btn } from './panel.js';

const CSS = `
.scale-now { margin: 0 auto 8px; max-width: 520px; padding: 10px 14px; border-radius: 14px; background: #fffaf0; border: 2px solid #8a6a45; font: 700 18px var(--font-ui); text-align: center;
  word-break: keep-all; touch-action: none; cursor: grab; user-select: none; -webkit-user-select: none; }
.scale-now.drag { box-shadow: 0 0 0 3px #d9a441, 0 8px 16px #0005; }
.scale-wrap { position: relative; height: 150px; max-width: 560px; margin: 0 auto; }
.scale-beam { position: absolute; left: 10%; right: 10%; top: 30px; height: 8px; border-radius: 4px; background: #6b4a32; transition: transform .4s; transform-origin: 50% 50%; }
.scale-post { position: absolute; left: calc(50% - 5px); top: 30px; width: 10px; height: 110px; background: #6b4a32; }
.scale-pans { position: absolute; left: 0; right: 0; top: 48px; display: flex; justify-content: space-between; gap: 10px; }
.scale-pan { flex: 0 1 44%; min-height: 84px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 2px; transition: transform .4s; }
.scale-pan .jp-btn { width: 100%; min-height: 56px; }
.scale-pan .cnt { font: 800 15px var(--font-ui); color: #6b4a32; }
.scale-pan.hot .jp-btn { outline: 4px solid #f2c14a; }
@media (max-height: 430px) { .scale-wrap { height: 120px; } .scale-now { font-size: 15px; padding: 6px 10px; margin-bottom: 4px; } }
`;
function ensureStyle() { if (document.getElementById('kit-scale-style')) return; const s = document.createElement('style'); s.id = 'kit-scale-style'; s.textContent = CSS; document.head.appendChild(s); }

// bins: [{ id, label }] 두 개(왼쪽 · 오른쪽), cards: [{ text, bin }]
export function scale(ctx, { bins, cards, title = '', prompt = '', eyebrow = '의견 저울', hint = '', easy = false, maxWrong = 2 } = {}) {
  ensureStyle();
  return new Promise(resolve => {
    const P = makePanel(ctx, { kind: 'scale', eyebrow, title, prompt });
    const now = document.createElement('div'); now.className = 'scale-now';
    const wrap = document.createElement('div'); wrap.className = 'scale-wrap';
    wrap.innerHTML = '<div class="scale-post"></div><div class="scale-beam"></div><div class="scale-pans"></div>';
    const beam = wrap.querySelector('.scale-beam'), pansEl = wrap.querySelector('.scale-pans');
    const counts = Object.fromEntries(bins.map(b => [b.id, 0]));
    const pans = bins.map((b, i) => {
      const p = document.createElement('div'); p.className = 'scale-pan'; p.dataset.bin = b.id;
      const bb = btn(`${i + 1} ${b.label}`, i ? 'alt' : ''); bb.dataset.bin = b.id;
      const c = document.createElement('div'); c.className = 'cnt'; c.textContent = '0';
      p.append(bb, c); pansEl.append(p); bb.addEventListener('click', () => put(b.id)); return p;
    });
    P.body.append(now, wrap);
    let i = 0, wrong = 0, done = false;
    const tilt = () => {
      const d = counts[bins[0].id] - counts[bins[1].id], a = Math.max(-14, Math.min(14, -d * 5));
      beam.style.transform = `rotate(${a}deg)`;
      pans[0].style.transform = `translateY(${(-a) * 1.2}px)`; pans[1].style.transform = `translateY(${a * 1.2}px)`;
    };
    const show = () => {
      now.textContent = cards[i] ? `“${cards[i].text}”` : '';
      pans.forEach(p => p.querySelector('.jp-btn').classList.toggle('glow', easy && !!cards[i] && p.dataset.bin === cards[i].bin));
      if (ctx.testHooks) ctx.testHooks.scale = done || !cards[i] ? null : { ready: true, answer: cards[i].bin, wrong };
    };
    const finish = ok => { done = true; if (ctx.testHooks) ctx.testHooks.scale = null; removeEventListener('keydown', onKey); setTimeout(() => { P.close(); resolve({ ok, wrong, counts: { ...counts } }); }, ok ? 1000 : 300); };
    function put(id) {
      if (done || !cards[i]) return;
      if (cards[i].bin !== id) {
        wrong += 1; ctx.audio?.play('wrong'); P.shake(now); P.hint(hint);
        if (wrong >= maxWrong) return finish(false);
        return show();
      }
      ctx.audio?.play('tap');
      counts[id] += 1; pans.find(p => p.dataset.bin === id).querySelector('.cnt').textContent = counts[id];
      i += 1; tilt();
      if (i >= cards.length) { now.textContent = '⚖'; ctx.audio?.play('correct'); return finish(true); }
      show();
    }
    const onKey = e => { if (e.code === 'Digit1' || e.code === 'Numpad1') put(bins[0].id); else if (e.code === 'Digit2' || e.code === 'Numpad2') put(bins[1].id); };
    addEventListener('keydown', onKey);
    // 말풍선을 끌어 접시에 놓기
    let drag = null;
    now.addEventListener('pointerdown', e => { if (done) return; drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; now.classList.add('drag'); now.setPointerCapture?.(e.pointerId); });
    now.addEventListener('pointermove', e => {
      if (!drag || drag.id !== e.pointerId) return;
      now.style.transform = `translate(${e.clientX - drag.x}px, ${e.clientY - drag.y}px)`;
      pans.forEach(p => { const r = p.getBoundingClientRect(); p.classList.toggle('hot', e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top - 30 && e.clientY <= r.bottom); });
    });
    const up = e => {
      if (!drag || drag.id !== e.pointerId) return;
      drag = null; now.classList.remove('drag'); now.style.transform = '';
      const hot = pans.find(p => p.classList.contains('hot')); pans.forEach(p => p.classList.remove('hot'));
      if (hot) put(hot.dataset.bin);
    };
    now.addEventListener('pointerup', up); now.addEventListener('pointercancel', up);
    tilt(); show();
  });
}
