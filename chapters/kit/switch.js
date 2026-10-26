// 놀이 부품 「갈림길 보내기」(2026-10-26, 고려 새 4장 별무반 갈림길에서 처음 씀). 장 데이터만 바꿔 다른 장에서도 쓴다.
// 사람(people)이 차례로 갈림길 앞에 오면, 학생이 아래 길 단추(lanes) 가운데 하나를 골라 그 사람을 보낸다(누르기 · 키보드 1·2·3 · 사람 카드를 끌어 단추에 놓기).
// 맞는 길은 장이 준 판정 함수 rule(person) → lane id가 정한다(규칙은 장의 script에 데이터로 둔다).
// 맞으면 그 길 숫자가 오르고 다음 사람. 틀리면 힌트 한 줄(hints[맞는 길])을 보이고 같은 사람을 다시. 한 무리에서 maxWrong번 틀리면 실패({ ok: false }).
// gap(초)을 주면 사람이 그 간격으로 하나씩 와서 줄을 선다(늦어도 실패가 아니라 줄이 길어질 뿐). 없으면 모두 처음부터 줄에 있다.
// easy: 틀린 길 단추 하나를 흐리게(누를 수 없게) 하고, 사람 카드의 단서(말·염주)를 반짝인다.
// 3D 연출은 장이 넘겨 준 scene({ line(waiting), send(i, lane), wrong(i) })이 맡는다. send가 약속(Promise)을 돌려주면 끝날 때까지 기다린다.
// 글(길 이름·힌트·사람 이름)은 장이 준다. 사실 문장은 만들지 않는다.
const CSS = `
.switch-lanes { position: fixed; z-index: 25; left: 50%; transform: translateX(-50%); bottom: calc(10px + env(safe-area-inset-bottom, 0px)); display: flex; gap: 10px;
  max-width: calc(100% - 16px); font-family: var(--font-ui); }
.switch-lane { position: relative; display: flex; align-items: center; gap: 8px; min-width: 128px; min-height: 64px; padding: 6px 16px 6px 8px; border-radius: 16px; box-sizing: border-box;
  border: 3px solid var(--hanji, #f2ead9); color: #fff; font: 800 20px var(--font-ui); box-shadow: 0 5px 0 #0007, 0 8px 16px #0005; cursor: pointer; touch-action: manipulation; }
.switch-lane svg { width: 40px; height: 40px; flex: none; }
.switch-lane .k { position: absolute; left: 6px; top: 2px; font: 700 11px var(--font-ui); opacity: .8; }
.switch-lane .n { margin-left: auto; min-width: 26px; padding: 0 6px; border-radius: 12px; background: #0005; font: 800 16px var(--font-ui); text-align: center; }
.switch-lane.hot { outline: 4px solid #fff6c8; }
.switch-lane.dim { opacity: .35; filter: grayscale(.8); cursor: default; }
.switch-lane.no { animation: switch-no .35s linear; }
@keyframes switch-no { 0%,100% { transform: none; } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
.switch-who { position: fixed; z-index: 26; left: 50%; transform: translateX(-50%); bottom: calc(92px + env(safe-area-inset-bottom, 0px)); display: flex; align-items: center; gap: 8px;
  padding: 6px 14px 6px 8px; border-radius: 14px; background: var(--hanji, #f2ead9); color: #2b241c; border: 2px solid #3b2f22; box-shadow: 0 4px 10px #0006;
  font: 800 17px var(--font-ui); touch-action: none; user-select: none; -webkit-user-select: none; cursor: grab; white-space: nowrap; max-width: calc(100% - 24px); }
.switch-who .clue { display: flex; gap: 2px; }
.switch-who .clue svg { width: 30px; height: 30px; }
.switch-who .clue.blink { animation: switch-blink .55s ease-in-out infinite alternate; }
@keyframes switch-blink { to { transform: scale(1.25); filter: drop-shadow(0 0 6px #f2c14a); } }
.switch-who .wait { font: 700 13px var(--font-ui); color: #6b5a44; }
.switch-who.drag { box-shadow: 0 0 0 3px var(--gold, #d9a441), 0 10px 18px #0007; }
.switch-who.shake { animation: switch-no .35s linear; }
.switch-hint { position: fixed; z-index: 26; left: 50%; transform: translateX(-50%); bottom: calc(142px + env(safe-area-inset-bottom, 0px)); padding: 6px 14px; border-radius: 12px;
  background: rgba(27,31,29,.88); color: #fff6c8; font: 700 16px var(--font-ui); white-space: nowrap; max-width: calc(100% - 24px); overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
.switch-hint[hidden] { display: none; }
@media (max-height: 430px) {
  .switch-lane { min-height: 52px; min-width: 112px; font-size: 17px; } .switch-lane svg { width: 32px; height: 32px; }
  .switch-who { bottom: 74px; font-size: 15px; padding: 4px 10px 4px 6px; } .switch-who .clue svg { width: 24px; height: 24px; }
  .switch-hint { bottom: 116px; font-size: 14px; }
}
@media (max-width: 520px) {
  .switch-lanes { gap: 6px; } .switch-lane { min-width: 0; flex: 1 1 0; padding: 6px 8px 6px 6px; font-size: 16px; gap: 4px; } .switch-lane svg { width: 28px; height: 28px; }
  .switch-lane .n { min-width: 20px; padding: 0 4px; font-size: 14px; }
}
`;
function ensureStyle() {
  if (document.getElementById('kit-switch-style')) return;
  const s = document.createElement('style'); s.id = 'kit-switch-style'; s.textContent = CSS; document.head.appendChild(s);
}

// 길 단추·사람 카드의 작은 그림: 말 · 창 · 염주(굵은 선의 단순한 모양)
export const SWITCH_ICONS = {
  horse: '<path d="M12 46 L16 30 C18 22 26 18 34 18 L40 10 L44 12 L42 18 C48 20 52 26 50 30 L44 28 L40 30 V46 M20 46 V36 M34 46 V34" fill="none" stroke="#fff6c8" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/>',
  spear: '<path d="M18 52 L42 12" stroke="#fff6c8" stroke-width="4.5" stroke-linecap="round"/><path d="M42 12 L46 4 L48 16 Z" fill="#fff6c8" stroke="#fff6c8" stroke-width="2" stroke-linejoin="round"/><path d="M14 40 L26 46" stroke="#fff6c8" stroke-width="3" stroke-linecap="round"/>',
  beads: '<circle cx="30" cy="28" r="15" fill="none" stroke="#fff6c8" stroke-width="2"/>' + Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return `<circle cx="${(30 + Math.cos(a) * 15).toFixed(1)}" cy="${(28 + Math.sin(a) * 15).toFixed(1)}" r="4" fill="#fff6c8"/>`; }).join('') + '<path d="M30 43 V54" stroke="#fff6c8" stroke-width="4" stroke-linecap="round"/>',
};
const icon = (name, color) => `<svg viewBox="0 0 60 60" aria-hidden="true">${(SWITCH_ICONS[name] || '').replaceAll('#fff6c8', color)}</svg>`;

// lanes: [{ id, label, icon: 'horse'|'spear'|'beads', color }], people: [{ name?, horse?, monk?, ... }]
// 돌려주는 것: { ok, wrong(틀린 고르기 수), wrongs(틀린 사람 차례), counts({ lane id: 보낸 수 }) }
export function switchLanes(ctx, { lanes, people, rule, hints = {}, easy = false, scene = {}, gap = null, maxWrong = 2, clue = p => [p.horse && 'horse', p.monk && 'beads'].filter(Boolean), name = p => p.name || '' } = {}) {
  ensureStyle();
  const { ui, world } = ctx;
  return new Promise(resolve => {
    const bar = document.createElement('div'); bar.className = 'switch-lanes';
    const counts = Object.fromEntries(lanes.map(l => [l.id, 0]));
    const btns = lanes.map((l, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'switch-lane'; b.dataset.lane = l.id;
      b.style.background = `linear-gradient(${l.color || '#2f6b5e'}, ${l.dark || '#1d3a33'})`;
      b.innerHTML = `<span class="k">${i + 1}</span>${icon(l.icon, '#fff6c8')}<span class="t"></span><span class="n">0</span>`;
      b.querySelector('.t').textContent = l.label;
      b.addEventListener('click', () => pick(l.id));
      bar.append(b); return b;
    });
    const who = document.createElement('div'); who.className = 'switch-who'; who.hidden = true;
    const hint = document.createElement('div'); hint.className = 'switch-hint'; hint.hidden = true;
    ui.append(bar, who, hint);

    let arrived = gap ? 1 : people.length, served = 0, wrong = 0, busy = false, done = false, t = 0;
    const wrongs = [];
    const waiting = () => Array.from({ length: arrived - served }, (_, k) => served + k);
    const hooks = () => {
      if (!ctx.testHooks) return;
      const p = people[served];
      ctx.testHooks.lanes = p && served < arrived && !busy && !done ? { ready: true, index: served, answer: rule(p), easy, wrongNow: wrong, wave: ctx.testHooks.wave ?? 0 } : { ready: false };
    };
    const showWho = () => {
      const p = people[served];
      if (!p || served >= arrived) { who.hidden = true; hooks(); return; }
      const c = clue(p);
      who.innerHTML = `<span class="clue${easy ? ' blink' : ''}">${c.map(n => icon(n === 'horse' ? 'horse' : 'beads', '#6b4a32')).join('')}</span><span class="nm"></span><span class="wait"></span>`;
      who.querySelector('.nm').textContent = name(p);
      const rest = arrived - served - 1;
      who.querySelector('.wait').textContent = rest > 0 ? `+${rest}` : '';
      who.hidden = false;
      // 쉬운 모드: 틀린 길 하나를 흐리게
      const right = rule(p);
      btns.forEach(b => { b.classList.remove('dim'); b.disabled = false; });
      if (easy) { const off = btns.find(b => b.dataset.lane !== right); if (off) { off.classList.add('dim'); off.disabled = true; } }
      hooks();
    };
    const finish = ok => {
      if (done) return; done = true;
      offUpdate(); removeEventListener('keydown', onKey); removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp);
      bar.remove(); who.remove(); hint.remove();
      if (ctx.testHooks) ctx.testHooks.lanes = { ready: false };
      resolve({ ok, wrong, wrongs, counts: { ...counts } });
    };
    async function pick(id) {
      if (done || busy || served >= arrived) return;
      const b = btns.find(x => x.dataset.lane === id);
      if (!b || b.disabled) return;
      const p = people[served], right = rule(p);
      if (id !== right) {
        wrong += 1; wrongs.push(served);
        ctx.audio?.play('wrong');
        b.classList.remove('no'); void b.offsetWidth; b.classList.add('no');
        who.classList.remove('shake'); void who.offsetWidth; who.classList.add('shake');
        hint.textContent = hints[right] || ''; hint.hidden = !hint.textContent;
        scene.wrong?.(served);
        if (wrong >= maxWrong) finish(false);
        return;
      }
      ctx.audio?.play('correct');
      hint.hidden = true;
      counts[id] += 1; b.querySelector('.n').textContent = counts[id];
      busy = true; who.hidden = true; hooks();
      const i = served;
      served += 1;
      await scene.send?.(i, id);
      busy = false;
      if (done) return;
      scene.line?.(waiting());
      if (served >= people.length) return finish(true);
      showWho();
    }
    const onKey = e => { const n = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code]; if (n != null && lanes[n] && !e.repeat) pick(lanes[n].id); };
    addEventListener('keydown', onKey);
    // 사람 카드를 끌어 길 단추 위에 놓기
    let drag = null;
    who.addEventListener('pointerdown', e => { if (busy || done) return; drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; who.classList.add('drag'); });
    const onMove = e => {
      if (!drag || e.pointerId !== drag.id) return;
      who.style.transform = `translate(calc(-50% + ${e.clientX - drag.x}px), ${e.clientY - drag.y}px)`;
      const over = btns.find(b => { const r = b.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; });
      btns.forEach(b => b.classList.toggle('hot', b === over));
    };
    const onUp = e => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null; who.classList.remove('drag'); who.style.transform = '';
      const over = btns.find(b => b.classList.contains('hot'));
      btns.forEach(b => b.classList.remove('hot'));
      if (over) pick(over.dataset.lane);
    };
    addEventListener('pointermove', onMove); addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);
    const offUpdate = world.onUpdate(dt => {
      if (done || !gap || arrived >= people.length) return;
      t += dt;
      if (t >= gap) { t -= gap; arrived += 1; scene.line?.(waiting()); if (who.hidden && !busy) showWho(); else if (!who.hidden) { const w = who.querySelector('.wait'); const rest = arrived - served - 1; if (w) w.textContent = rest > 0 ? `+${rest}` : ''; } }
    });
    scene.line?.(waiting());
    showWho();
  });
}
