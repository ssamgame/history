// 놀이 부품 「글자 조립소」(2026-10-27, 조선편 훈민정음). 낱말 하나를 소리 나는 차례대로 낱자 조각을 눌러(또는 끌어) 글자 칸에 넣는다.
// 칸은 모아쓰기 모양: 첫소리 왼쪽 위, 세로 모음(ㅏ ㅣ …)은 오른쪽, 가로 모음(ㅗ ㅜ ㅡ …)은 아래, 끝소리(받침)는 밑.
// 차례에 맞지 않는 조각은 튕기고 힌트. 한 낱말에서 maxWrong번 틀리면 실패. easy면 다음 조각이 반짝인다. 사실 문장은 만들지 않는다.
import { makePanel } from './panel.js';

const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ', JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ', JONG = ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ';
const SIDE = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅣ'; // 오른쪽에 붙는 모음(나머지는 아래)
// 한글 한 글자 → [첫소리, 가운뎃소리, 끝소리?]
export function split(syl) {
  const c = syl.charCodeAt(0) - 0xac00;
  if (c < 0 || c > 11171) return [syl];
  const jong = JONG[c % 28].trim();
  return [CHO[Math.floor(c / 588)], JUNG[Math.floor((c % 588) / 28)], ...(jong ? [jong] : [])];
}
const CSS = `
.asm-blocks { display: flex; justify-content: center; gap: 14px; margin: 4px 0 10px; flex-wrap: wrap; }
.asm-block { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto auto auto; gap: 4px; padding: 6px; border-radius: 10px; background: #e2d4b4; border: 2px dashed #8a6a45; }
.asm-slot { min-width: 54px; min-height: 54px; border-radius: 8px; border: 2px solid #b8a27a; background: #fffaf0; display: grid; place-items: center; font: 800 32px var(--font-ui); color: #2b241c; }
.asm-slot.next { border-color: #d9a441; box-shadow: 0 0 0 3px #f2c14a66; }
.asm-slot.wide { grid-column: 1 / span 2; }
.asm-done { font: 800 30px var(--font-display, var(--font-ui)); text-align: center; color: #2f6b5e; min-height: 0; }
.asm-tiles { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.asm-tile { min-width: 56px; min-height: 56px; font-size: 28px; touch-action: none; }
.asm-tile.used { visibility: hidden; }
@media (max-height: 430px) { .asm-slot { min-width: 44px; min-height: 44px; font-size: 24px; } .asm-tile { min-height: 48px; min-width: 48px; font-size: 22px; } .asm-blocks { margin: 2px 0 6px; } }
`;
function ensureStyle() { if (document.getElementById('kit-assemble-style')) return; const s = document.createElement('style'); s.id = 'kit-assemble-style'; s.textContent = CSS; document.head.appendChild(s); }

// word: '나무', decoys: 섞어 넣을 다른 낱자들
export function assemble(ctx, { word, decoys = [], title = '', prompt = '', eyebrow = '글자 조립소', hint = '', easy = false, maxWrong = 2 } = {}) {
  ensureStyle();
  return new Promise(resolve => {
    const P = makePanel(ctx, { kind: 'assemble', eyebrow, title, prompt });
    const blocksEl = document.createElement('div'); blocksEl.className = 'asm-blocks';
    const doneEl = document.createElement('div'); doneEl.className = 'asm-done';
    const tilesEl = document.createElement('div'); tilesEl.className = 'asm-tiles';
    P.body.append(blocksEl, doneEl, tilesEl);
    const order = []; // 차례대로 채울 칸 [{ letter, el }]
    for (const syl of word) {
      const parts = split(syl), b = document.createElement('div'); b.className = 'asm-block';
      const [cho, jung, jong] = parts, side = SIDE.includes(jung);
      const slot = (letter, cls = '') => { const s = document.createElement('div'); s.className = `asm-slot ${cls}`.trim(); b.append(s); order.push({ letter, el: s }); return s; };
      slot(cho, side ? '' : 'wide');
      slot(jung, side ? '' : 'wide');
      if (jong) slot(jong, 'wide');
      blocksEl.append(b);
    }
    // 조각: 낱말의 낱자 + 덤 조각, 섞어서(정해진 섞음)
    const letters = [...order.map(o => o.letter), ...decoys];
    const mixed = letters.map((l, i) => [((i * 7 + 3) % letters.length) + i / 100, l]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    const tiles = mixed.map(l => { const t = document.createElement('button'); t.type = 'button'; t.className = 'jp-btn asm-tile'; t.dataset.letter = l; t.textContent = l; tilesEl.append(t); return t; });
    let next = 0, wrong = 0, done = false;
    const mark = () => {
      order.forEach((o, i) => o.el.classList.toggle('next', i === next));
      tiles.forEach(t => t.classList.toggle('glow', easy && !t.classList.contains('used') && order[next] && t.dataset.letter === order[next].letter));
      if (ctx.testHooks) ctx.testHooks.assemble = done ? null : { ready: true, answer: order[next]?.letter, wrong };
    };
    const finish = ok => { done = true; if (ctx.testHooks) ctx.testHooks.assemble = null; setTimeout(() => { P.close(); resolve({ ok, wrong }); }, ok ? 900 : 300); };
    const pick = t => {
      if (done || t.classList.contains('used')) return;
      const want = order[next].letter;
      if (t.dataset.letter !== want) {
        wrong += 1; ctx.audio?.play('wrong'); P.shake(t); P.hint(hint);
        if (wrong >= maxWrong) return finish(false);
        mark(); return;
      }
      ctx.audio?.play('tap');
      t.classList.add('used'); order[next].el.textContent = want; next += 1;
      if (next >= order.length) { doneEl.textContent = word; ctx.audio?.play('correct'); mark(); return finish(true); }
      mark();
    };
    tiles.forEach(t => t.addEventListener('click', () => pick(t)));
    mark();
  });
}
