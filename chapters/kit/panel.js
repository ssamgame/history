// 조선편 놀이 판(2026-10-27): 화면 가운데 한지 카드 한 장(제목 · 물음 · 놀이 판 · 힌트 줄). 글자 조립 · 해 그림자 · 의견 저울 · 학익진이 함께 쓴다.
// 카드 놀이가 아니라 판 위에서 끌고 옮기는 놀이의 틀이다. 힌트는 hint(글)로 잠깐 보였다 사라진다.
const CSS = `
.jp-card { position: relative; width: min(760px, 100%); max-height: calc(100vh - 24px); overflow-y: auto; box-sizing: border-box; padding: 14px 18px 16px; border-radius: 14px;
  background: var(--hanji, #f2ead9); color: #2b241c; border: 3px solid #3b2f22; box-shadow: 0 10px 30px #0008; font-family: var(--font-ui); }
.jp-card .eyebrow { color: #8a5a2a; font: 700 13px var(--font-ui); letter-spacing: .06em; }
.jp-card h2 { font: 800 21px var(--font-display, var(--font-ui)); margin: 2px 0 4px; word-break: keep-all; }
.jp-card .q { font: 600 16px var(--font-ui); margin: 0 0 8px; word-break: keep-all; }
.jp-hint { min-height: 24px; margin-top: 6px; padding: 4px 10px; border-radius: 8px; background: #2b241c; color: #fff6c8; font: 700 15px var(--font-ui); word-break: keep-all; }
.jp-hint:empty { visibility: hidden; }
.jp-btn { min-height: 52px; min-width: 52px; padding: 0 16px; border-radius: 12px; border: 3px solid #3b2f22; background: #2f6b5e; color: #fff6c8; font: 800 18px var(--font-ui);
  box-shadow: 0 4px 0 #1b3a33; cursor: pointer; touch-action: manipulation; }
.jp-btn.alt { background: #8a4a2e; box-shadow: 0 4px 0 #4e2818; }
.jp-btn[disabled] { opacity: .4; cursor: default; }
.jp-btn.glow, .jp-glow { animation: jp-glow .6s ease-in-out infinite alternate; }
@keyframes jp-glow { to { box-shadow: 0 0 0 4px #f2c14a, 0 0 18px #f2c14a; } }
.jp-no { animation: jp-no .35s linear; }
@keyframes jp-no { 0%,100% { transform: none; } 25% { transform: translateX(-7px); } 75% { transform: translateX(7px); } }
@media (max-height: 430px) { .jp-card { padding: 8px 12px 10px; } .jp-card h2 { font-size: 17px; } .jp-card .q { font-size: 14px; margin-bottom: 4px; } .jp-btn { min-height: 46px; font-size: 16px; } }
`;
function ensureStyle() {
  if (document.getElementById('kit-panel-style')) return;
  const s = document.createElement('style'); s.id = 'kit-panel-style'; s.textContent = CSS; document.head.appendChild(s);
}
export function makePanel(ctx, { kind, eyebrow = '', title = '', prompt = '' }) {
  ensureStyle();
  const screen = document.createElement('section'); screen.className = `screen jp jp-${kind}`;
  const card = document.createElement('div'); card.className = 'jp-card';
  card.innerHTML = '<div class="eyebrow"></div><h2></h2><p class="q"></p><div class="jp-body"></div><div class="jp-hint" aria-live="polite"></div>';
  card.querySelector('.eyebrow').textContent = eyebrow; card.querySelector('h2').textContent = title; card.querySelector('.q').textContent = prompt;
  if (!prompt) card.querySelector('.q').remove();
  screen.append(card); ctx.ui.append(screen);
  const hintEl = card.querySelector('.jp-hint');
  let timer = null;
  return {
    screen, card, body: card.querySelector('.jp-body'),
    hint(text, ms = 2600) { hintEl.textContent = text || ''; clearTimeout(timer); if (text && ms) timer = setTimeout(() => { hintEl.textContent = ''; }, ms); },
    shake(node) { node.classList.remove('jp-no'); void node.offsetWidth; node.classList.add('jp-no'); },
    close() { clearTimeout(timer); screen.remove(); },
  };
}
export const btn = (label, cls = '') => { const b = document.createElement('button'); b.type = 'button'; b.className = `jp-btn ${cls}`.trim(); b.textContent = label; return b; };
