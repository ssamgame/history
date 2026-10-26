// 고려편 새 기준(2026-10-26 기획서 2-1·5-3) 놀이 화면 부품: 위 가운데 '지킴 게이지', 아래 '지혜 카드 손', 성공 '도장 쾅'.
// 자리는 장마다 같고 모양만 바뀐다. 그림 파일 없이 CSS와 코드로 그린 SVG만 쓴다. 스타일은 처음 쓸 때 한 번 넣는다(styles.css는 그대로).
const CSS = `
.ops-gauge { position: absolute; left: 50%; top: 10px; transform: translateX(-50%); width: min(460px, 62vw); z-index: 30; pointer-events: none;
  font-family: var(--font-ui); color: #3a2a1c; }
.ops-gauge-title { text-align: center; font: 700 13px var(--font-display); color: var(--hanji, #f2ead9); text-shadow: 0 1px 2px #1b1f1d, 0 0 6px #1b1f1d88; margin-bottom: 3px; letter-spacing: 1px; }
.ops-gauge-bar { position: relative; height: 30px; border-radius: 17px; background: linear-gradient(#8a6a45, #6b4f32); border: 2px solid var(--gold, #d9a441);
  box-shadow: 0 0 0 3px rgba(27,31,29,.85), 0 6px 14px #0005; overflow: visible; }
.ops-gauge-fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 14px 6px 6px 14px; background: linear-gradient(#3f8a78, #2f6b5e);
  transition: width .45s cubic-bezier(.3,1.6,.5,1); }
.ops-gauge-fill::after { content: ''; position: absolute; left: 8px; right: 8px; top: 4px; height: 7px; border-radius: 4px; background: #ffffff55; }
.ops-gauge-knob { position: absolute; top: 50%; width: 38px; height: 38px; margin: -19px 0 0 -19px; transition: left .45s cubic-bezier(.3,1.6,.5,1); filter: drop-shadow(0 2px 2px #0006); }
.ops-gauge-side { position: absolute; top: 50%; transform: translateY(-50%); display: flex; align-items: center; gap: 4px; font: 800 14px var(--font-ui); color: #fff; text-shadow: 0 1px 2px #0008; }
.ops-gauge-side.l { left: 10px; } .ops-gauge-side.r { right: 10px; }
.ops-gauge.bump .ops-gauge-bar { animation: ops-bump .35s ease-out; }
@keyframes ops-bump { 0% { transform: scale(1); } 40% { transform: scale(1.06, 1.14); } 100% { transform: scale(1); } }
.ops-hand { position: absolute; left: 50%; bottom: 8px; transform: translateX(-50%); display: flex; align-items: flex-end; gap: 10px; z-index: 30; }
.ops-card { position: relative; width: 104px; height: 138px; padding: 0; border: 2px solid #3b2f22; border-radius: 10px; background: var(--hanji, #f2ead9); color: #2b241c;
  box-shadow: 0 3px 0 #3b2f22, 0 8px 16px #0005; display: flex; flex-direction: column; align-items: center; overflow: hidden;
  transition: transform .18s ease-out, box-shadow .18s; touch-action: manipulation; font-family: var(--font-ui); }
.ops-card .art { width: 100%; height: 66px; display: grid; place-items: center; border-bottom: 2px solid var(--hanji-edge, #d8ccb3); }
.ops-card .art svg { width: 60px; height: 60px; }
.ops-card .t { font: 800 15px var(--font-ui); margin: 7px 4px 2px; line-height: 1.15; text-align: center; }
.ops-card .d { font-size: 12px; color: #5a4a38; margin: 0 6px; text-align: center; line-height: 1.2; }
.ops-card.picked { transform: translateY(-20px) !important; border-color: var(--gold, #d9a441); box-shadow: 0 0 0 3px var(--gold, #d9a441), 0 12px 20px #0006; }
.ops-card:active { filter: brightness(.96); }
.ops-stamp { position: absolute; inset: 0; display: grid; place-items: center; z-index: 60; pointer-events: none; }
.ops-stamp .seal { position: relative; width: 176px; height: 176px; animation: ops-slam .42s cubic-bezier(.2,.9,.3,1.25) both; }
.ops-stamp .ring { position: absolute; left: 50%; top: 50%; width: 176px; height: 176px; margin: -88px 0 0 -88px; border-radius: 50%; border: 6px solid #b8452f88; animation: ops-ring .6s .18s ease-out both; }
.ops-stamp .sub { position: absolute; left: 50%; top: calc(50% + 104px); transform: translateX(-50%); white-space: nowrap; font: 800 26px var(--font-display); color: var(--hanji, #f2ead9);
  text-shadow: 0 2px 0 #1b1f1d, 0 0 10px #000a; animation: ops-pop .4s .35s cubic-bezier(.3,1.6,.5,1) both; }
.ops-stamp.out { animation: ops-fade .35s ease-in both; }
@keyframes ops-slam { 0% { transform: scale(2.8) rotate(-22deg); opacity: 0; } 55% { transform: scale(.92) rotate(-7deg); opacity: 1; } 100% { transform: scale(1) rotate(-8deg); opacity: 1; } }
@keyframes ops-ring { 0% { transform: scale(.7); opacity: 1; } 100% { transform: scale(1.9); opacity: 0; } }
@keyframes ops-pop { 0% { transform: translateX(-50%) scale(.3); opacity: 0; } 100% { transform: translateX(-50%) scale(1); opacity: 1; } }
@keyframes ops-fade { to { opacity: 0; transform: scale(1.05); } }
.ops-shake { animation: ops-shake .32s linear; }
@keyframes ops-shake { 0%,100% { transform: none; } 20% { transform: translate(-6px, 3px); } 40% { transform: translate(5px, -4px); } 60% { transform: translate(-3px, 2px); } 80% { transform: translate(2px, -1px); } }
`;
function ensureStyle() {
  if (document.getElementById('hud-ops-style')) return;
  const s = document.createElement('style'); s.id = 'hud-ops-style'; s.textContent = CSS; document.head.appendChild(s);
}

// 작은 그림(카드·게이지 그림): 굵은 선의 단순한 모양
const ICONS = {
  shield: '<path d="M30 6 L50 13 V30 C50 43 41 51 30 55 C19 51 10 43 10 30 V13 Z" fill="#2f6b5e" stroke="#1b3a33" stroke-width="3"/><path d="M30 14 V47 M18 27 H42" stroke="#f6e7b8" stroke-width="5" stroke-linecap="round"/>',
  horse: '<circle cx="30" cy="30" r="22" fill="#6b4f32" stroke="#3b2f22" stroke-width="3"/><path d="M20 42 L24 24 L34 16 L40 20 L36 26 L40 36" fill="none" stroke="#f6e7b8" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>',
  soldier: '<circle cx="30" cy="24" r="10" fill="#f2c9a0" stroke="#3a2a1c" stroke-width="2.5"/><path d="M19 22 C19 10 41 10 41 22 Z" fill="#7d8ea0" stroke="#3a2a1c" stroke-width="2.5"/><path d="M17 54 C17 40 43 40 43 54 Z" fill="#7a3b2e" stroke="#3a2a1c" stroke-width="2.5"/><path d="M48 8 V54" stroke="#8a5a38" stroke-width="3"/><path d="M48 4 L52 12 H44 Z" fill="#cfd5da" stroke="#3a2a1c" stroke-width="1.5"/><path d="M8 32 L4 28 M8 32 L4 36 M8 32 H16" stroke="#d9a441" stroke-width="3" stroke-linecap="round"/>',
  push: '<path d="M14 54 L34 6" stroke="#b48654" stroke-width="5"/><path d="M26 54 L46 6" stroke="#b48654" stroke-width="5"/><path d="M18 44 H30 M22 34 H34 M26 24 H38 M30 14 H42" stroke="#c89a64" stroke-width="3.5"/><path d="M8 30 C2 22 8 14 16 16" fill="none" stroke="#b8452f" stroke-width="4" stroke-linecap="round"/><path d="M16 16 L10 12 M16 16 L12 22" stroke="#b8452f" stroke-width="4" stroke-linecap="round"/>',
  stone: '<path d="M10 40 C8 28 20 18 32 20 C46 22 52 34 46 44 C40 52 16 52 10 40 Z" fill="#9a958e" stroke="#4a4640" stroke-width="3"/><path d="M20 32 C24 28 28 28 32 30" fill="none" stroke="#c9c4bc" stroke-width="3" stroke-linecap="round"/><path d="M30 6 V14 M22 10 L30 16 L38 10" stroke="#3a2a1c" stroke-width="3" fill="none" stroke-linecap="round"/>',
  flag: '<path d="M14 56 V6" stroke="#6a4028" stroke-width="4" stroke-linecap="round"/><path d="M16 8 C26 4 34 14 48 9 V33 C34 38 26 28 16 32 Z" fill="#b8452f" stroke="#6a2418" stroke-width="2.5"/><path d="M16 8 C26 4 34 14 48 9" fill="none" stroke="#e0b048" stroke-width="3"/>',
  bow: '<path d="M18 6 C44 18 44 42 18 54" fill="none" stroke="#6a4028" stroke-width="5" stroke-linecap="round"/><path d="M18 6 V54" stroke="#e8e0d0" stroke-width="2"/><path d="M14 30 H54" stroke="#3a2a1c" stroke-width="3"/><path d="M54 30 L46 25 V35 Z" fill="#cfd5da" stroke="#3a2a1c" stroke-width="1.5"/>',
};
const svg = (name, size = 60) => `<svg viewBox="0 0 60 60" width="${size}" height="${size}" aria-hidden="true">${ICONS[name] || ICONS.shield}</svg>`;

// 지킴 게이지: value(0~1)는 고려 기세의 몫. 왼쪽(파랑)이 고려, 오른쪽(붉은 밤색)이 적
export function createGauge(root, { value = 0.5, title = '지킴 게이지', left = '고려', right = '거란', leftIcon = 'shield', rightIcon = 'horse' } = {}) {
  ensureStyle();
  const el = document.createElement('div'); el.className = 'ops-gauge';
  el.innerHTML = `<div class="ops-gauge-title">${title}</div><div class="ops-gauge-bar"><div class="ops-gauge-fill"></div>
    <div class="ops-gauge-side l">${svg(leftIcon, 22)}${left}</div><div class="ops-gauge-side r">${right}${svg(rightIcon, 22)}</div>
    <div class="ops-gauge-knob">${svg('flag', 38)}</div></div>`;
  root.appendChild(el);
  const fill = el.querySelector('.ops-gauge-fill'), knob = el.querySelector('.ops-gauge-knob');
  const api = {
    el, value,
    set(v) {
      v = Math.max(0, Math.min(1, v));
      const pct = `${Math.round(v * 100)}%`;
      fill.style.width = pct; knob.style.left = pct; api.value = v;
      el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
      return api;
    },
    dispose() { el.remove(); },
  };
  fill.style.width = knob.style.left = `${Math.round(value * 100)}%`;
  return api;
}

// 지혜 카드 손: 아래 가운데 부채꼴로 펼친 카드. 누르면 그 카드가 올라오고 onPick(id)
export function createCardHand(root, cards, { onPick = () => {} } = {}) {
  ensureStyle();
  const el = document.createElement('div'); el.className = 'ops-hand';
  const mid = (cards.length - 1) / 2;
  const btns = cards.map((c, i) => {
    const b = document.createElement('button'); b.className = 'ops-card'; b.type = 'button'; b.dataset.id = c.id;
    const tilt = (i - mid) * 4, drop = Math.abs(i - mid) * 4;
    b.style.transform = `translateY(${drop}px) rotate(${tilt}deg)`;
    b.innerHTML = `<div class="art" style="background:${c.color || '#e6dcc3'}">${svg(c.icon || 'soldier')}</div><div class="t">${c.title}</div><div class="d">${c.text || ''}</div>`;
    b.addEventListener('click', () => { btns.forEach(x => x.classList.toggle('picked', x === b)); onPick(c.id); });
    el.appendChild(b);
    return b;
  });
  root.appendChild(el);
  return { el, cards: btns, pick(id) { btns.find(b => b.dataset.id === id)?.click(); }, dispose() { el.remove(); } };
}

// 도장 쾅: 붉은 인장이 크게 내려와 찍히고 화면이 흔들린다. hold 동안 보였다가 사라진다(keep이면 남긴다). 끝나면 풀리는 약속을 돌려준다.
export function stampSeal(root, { text = '지킴', sub = '', hold = 900, keep = false } = {}) {
  ensureStyle();
  const el = document.createElement('div'); el.className = 'ops-stamp';
  const chars = [...text];
  const glyphs = chars.length <= 2
    ? chars.map((ch, i) => `<text x="88" y="${chars.length === 1 ? 112 : 78 + i * 62}" font-size="${chars.length === 1 ? 92 : 64}" text-anchor="middle" font-family="Nanum Myeongjo, Batang, serif" font-weight="800" fill="#b8452f">${ch}</text>`).join('')
    : `<text x="88" y="104" font-size="44" text-anchor="middle" font-family="Nanum Myeongjo, Batang, serif" font-weight="800" fill="#b8452f">${text}</text>`;
  el.innerHTML = `<div class="ring"></div><div class="seal"><svg viewBox="0 0 176 176" width="176" height="176">
    <defs><filter id="ops-ink"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.25"/><feComposite in="SourceGraphic" operator="in"/></filter></defs>
    <g filter="url(#ops-ink)"><rect x="8" y="8" width="160" height="160" rx="16" fill="#f2ead9cc" stroke="#b8452f" stroke-width="9"/><rect x="22" y="22" width="132" height="132" rx="8" fill="none" stroke="#b8452f" stroke-width="3"/>${glyphs}</g></svg></div>
    ${sub ? `<div class="sub">${sub}</div>` : ''}`;
  root.appendChild(el);
  setTimeout(() => { root.classList.remove('ops-shake'); void root.offsetWidth; root.classList.add('ops-shake'); setTimeout(() => root.classList.remove('ops-shake'), 340); }, 230);
  if (keep) return Promise.resolve(el);
  return new Promise(res => setTimeout(() => { el.classList.add('out'); setTimeout(() => { el.remove(); res(); }, 360); }, 420 + hold));
}
