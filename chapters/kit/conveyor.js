// 놀이 부품 「경판 공방」(2026-10-26, 고려 새 6장 팔만대장경에서 처음 씀). 장 데이터만 바꿔 다른 장에서도 쓴다.
// 나무판(boards)이 위쪽 벨트를 따라 왼쪽에서 오른쪽으로 흘러간다. 판마다 지금 상태(states[판 상태])가 보인다.
// 학생은 판을 골라(누르기, 가장 앞선 판이 기본) 아래 작업대 단추를 누르거나, 판을 끌어 작업대에 놓는다. 키보드 1~6 = 작업대.
// 그 판의 다음 일(작업대 번호 = 판 상태)이면 작업이 잠깐 이루어지고(그동안 판은 멈춤) 상태가 하나 오른다. 마지막 켜진 작업대까지 마치면 선반으로 간다.
// 틀린 작업대면 판이 튕기고(제자리) 힌트 한 줄. 끝까지 못 마친 판이 벨트 끝에 maxMiss개 닿으면 실패. 모든 판이 끝나면 성공.
// easy: 벨트 속도 0.7배, 고른 판의 다음 작업대가 반짝인다(판 수 줄이기는 장이 정한다).
// 3D 연출은 장이 넘겨 준 scene({ work(station) → Promise | undefined, shelf(완성 수) })가 맡는다. 글은 장이 준다. 사실 문장은 만들지 않는다.
const CSS = `
.conv-belt { position: fixed; z-index: 24; left: 50%; transform: translateX(-50%); bottom: calc(96px + env(safe-area-inset-bottom, 0px)); width: min(920px, calc(100% - 16px)); height: 64px;
  border-radius: 12px; background: repeating-linear-gradient(90deg, #5a4430 0 18px, #4e3a28 18px 36px); border: 3px solid #2b1d10; box-shadow: 0 4px 10px #0006; box-sizing: border-box; }
.conv-belt .end { position: absolute; right: 0; top: 0; bottom: 0; width: 10px; background: #b8452f; border-radius: 0 8px 8px 0; }
.conv-board { position: absolute; top: 4px; width: 96px; height: 50px; margin-left: -48px; border-radius: 8px; box-sizing: border-box; padding: 2px 4px; border: 2px solid #3b2414;
  font: 800 13px var(--font-ui); color: #2b1d10; text-align: center; display: flex; align-items: center; justify-content: center; line-height: 1.15;
  touch-action: none; user-select: none; -webkit-user-select: none; cursor: grab; box-shadow: 0 3px 0 #2b1d10; }
.conv-board.sel { outline: 4px solid #fff6c8; z-index: 2; }
.conv-board.busy { opacity: .45; cursor: default; }
.conv-board.no { animation: conv-no .35s linear; }
.conv-board.drag { z-index: 5; box-shadow: 0 0 0 3px var(--gold, #d9a441), 0 10px 18px #0007; }
@keyframes conv-no { 0%,100% { transform: none; } 25% { transform: translateY(-8px) rotate(-6deg); } 75% { transform: translateY(-4px) rotate(5deg); } }
.conv-stations { position: fixed; z-index: 25; left: 50%; transform: translateX(-50%); bottom: calc(8px + env(safe-area-inset-bottom, 0px)); display: flex; gap: 6px;
  width: min(920px, calc(100% - 16px)); justify-content: center; }
.conv-st { position: relative; flex: 1 1 0; max-width: 150px; min-width: 0; min-height: 80px; padding: 2px 2px 4px; border-radius: 12px; border: 3px solid var(--hanji, #f2ead9);
  background: linear-gradient(#3b5a50, #22382f); color: #fff6c8; font: 800 13px var(--font-ui); box-shadow: 0 4px 0 #0007; cursor: pointer; touch-action: manipulation;
  display: flex; flex-direction: column; align-items: center; gap: 1px; box-sizing: border-box; }
.conv-st svg { width: 100%; max-width: 64px; height: 42px; border-radius: 6px; }
.conv-st .k { position: absolute; left: 5px; top: 1px; font: 700 11px var(--font-ui); opacity: .85; }
.conv-st .t { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.conv-st[disabled] { opacity: .3; filter: grayscale(1); cursor: default; }
.conv-st.hot { outline: 4px solid #fff6c8; }
.conv-st.glow { animation: conv-glow .6s ease-in-out infinite alternate; }
@keyframes conv-glow { to { box-shadow: 0 0 0 4px #f2c14a, 0 0 18px #f2c14a; } }
.conv-hint { position: fixed; z-index: 26; left: 50%; transform: translateX(-50%); bottom: calc(168px + env(safe-area-inset-bottom, 0px)); padding: 6px 14px; border-radius: 12px;
  background: rgba(27,31,29,.88); color: #fff6c8; font: 700 16px var(--font-ui); white-space: nowrap; max-width: calc(100% - 24px); box-sizing: border-box; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
.conv-hint[hidden] { display: none; }
@media (max-height: 430px) { .conv-st { min-height: 62px; } .conv-st svg { height: 28px; } .conv-belt { bottom: 76px; height: 52px; } .conv-board { height: 40px; top: 3px; font-size: 12px; } .conv-hint { bottom: 134px; font-size: 14px; } }
@media (max-width: 560px) { .conv-st { font-size: 11px; } .conv-board { width: 76px; margin-left: -38px; font-size: 11px; } }
`;
function ensureStyle() {
  if (document.getElementById('kit-conveyor-style')) return;
  const s = document.createElement('style'); s.id = 'kit-conveyor-style'; s.textContent = CSS; document.head.appendChild(s);
}

// stations: [{ label, short?, picture? }], active: 켜진 작업대 번호들(앞에서부터 이어진 것), states: 판 상태 이름(작업대 수 + 1개)
// boards: 판 수, gap: 판이 들어오는 간격(초), beltSeconds: 판이 벨트 끝까지 가는 시간
// 돌려주는 것: { ok, done(완성 판 수), misses, wrong(틀린 놓기 수) }
export function conveyor(ctx, { stations, active, states, colors = [], boards, gap = 4, beltSeconds = 22, easy = false, maxMiss = 3, scene = {}, hints = {}, workSeconds = 0.8 } = {}) {
  ensureStyle();
  const { ui, world } = ctx;
  const last = Math.max(...active) + 1, speed = (1 / beltSeconds) * (easy ? 0.7 : 1);
  return new Promise(resolve => {
    const belt = document.createElement('div'); belt.className = 'conv-belt'; belt.innerHTML = '<div class="end"></div>';
    const row = document.createElement('div'); row.className = 'conv-stations';
    const hint = document.createElement('div'); hint.className = 'conv-hint'; hint.hidden = true;
    const btns = stations.map((s, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'conv-st'; b.dataset.st = i;
      b.innerHTML = `<span class="k">${i + 1}</span>${s.picture || ''}<span class="t"></span>`;
      b.querySelector('.t').textContent = s.short || s.label; b.setAttribute('aria-label', s.label);
      b.disabled = !active.includes(i);
      b.addEventListener('click', () => send(i));
      row.append(b); return b;
    });
    ui.append(belt, row, hint);

    const list = []; // { el, k(0~1 벨트 위치), state, busy, gone }
    let t = 0, spawned = 0, done = 0, misses = 0, wrong = 0, sel = null, finished = false, hintT = 0;
    const live = () => list.filter(b => !b.gone);
    const pickDefault = () => live().filter(b => !b.busy).sort((a, b) => b.k - a.k)[0] || null;
    const select = b => { sel = b; for (const x of list) x.el.classList.toggle('sel', x === sel); glow(); hooks(); };
    const glow = () => btns.forEach((b, i) => b.classList.toggle('glow', easy && !!sel && !sel.busy && sel.state === i));
    const paint = b => { b.el.textContent = states[b.state]; b.el.style.background = colors[b.state] || '#e8d6b0'; };
    const setHint = text => { hint.textContent = text || ''; hint.hidden = !text; hintT = text ? 2 : 0; };
    const hooks = () => {
      if (!ctx.testHooks) return;
      const b = sel && !sel.gone && !sel.busy ? sel : null;
      ctx.testHooks.conveyor = finished ? null : { ready: !!b, answer: b ? b.state : null, easy, done, misses };
    };
    const finish = ok => {
      if (finished) return; finished = true;
      off(); removeEventListener('keydown', onKey); removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp);
      belt.remove(); row.remove(); hint.remove();
      if (ctx.testHooks) ctx.testHooks.conveyor = null;
      resolve({ ok, done, misses, wrong });
    };
    async function send(i) {
      if (finished) return;
      const b = sel && !sel.gone && !sel.busy ? sel : pickDefault();
      if (!b || btns[i].disabled) return;
      if (b.state !== i) {
        wrong += 1; ctx.audio?.play('wrong');
        b.el.classList.remove('no'); void b.el.offsetWidth; b.el.classList.add('no');
        setHint(hints.wrong?.(b.state, i) || hints.order || '');
        hooks(); return;
      }
      ctx.audio?.play('tap');
      setHint('');
      b.busy = true; b.el.classList.add('busy');
      if (sel === b) select(pickDefault()); // 일하는 동안 다른 판을 고를 수 있다
      const w = scene.work?.(i);
      await Promise.all([w, ctx.wait ? ctx.wait(workSeconds * 1000) : null]);
      if (finished) return;
      b.state += 1; b.busy = false; b.el.classList.remove('busy'); paint(b);
      if (b.state >= last) {
        b.gone = true; b.el.remove(); done += 1; ctx.audio?.play('correct'); scene.shelf?.(done);
      }
      if (!sel || sel.gone) select(pickDefault());
      check();
    }
    const check = () => { if (spawned >= boards && !live().length) finish(misses < maxMiss); else hooks(); };
    const onKey = e => { const n = /^(Digit|Numpad)([1-6])$/.exec(e.code); if (n && !e.repeat) send(+n[2] - 1); };
    addEventListener('keydown', onKey);
    // 판을 끌어 작업대에 놓기
    let drag = null;
    const onMove = e => {
      if (!drag || drag.id !== e.pointerId) return;
      drag.b.el.style.transform = `translate(${e.clientX - drag.x}px, ${e.clientY - drag.y}px)`;
      const over = btns.find(b => { const r = b.getBoundingClientRect(); return !b.disabled && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; });
      btns.forEach(b => b.classList.toggle('hot', b === over));
    };
    const onUp = e => {
      if (!drag || drag.id !== e.pointerId) return;
      const b = drag.b; drag = null; b.el.classList.remove('drag'); b.el.style.transform = '';
      const over = btns.find(x => x.classList.contains('hot')); btns.forEach(x => x.classList.remove('hot'));
      if (over) send(+over.dataset.st);
    };
    addEventListener('pointermove', onMove); addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);
    const spawn = () => {
      const el = document.createElement('div'); el.className = 'conv-board';
      const b = { el, k: 0, state: 0, busy: false, gone: false };
      el.addEventListener('pointerdown', e => { if (b.busy || b.gone || finished) return; select(b); drag = { id: e.pointerId, x: e.clientX, y: e.clientY, b }; el.classList.add('drag'); });
      paint(b); belt.append(el); list.push(b); spawned += 1;
      if (!sel || sel.gone || sel.busy) select(b);
    };
    const off = world.onUpdate(dt => {
      if (finished) return;
      t += dt;
      if (hintT > 0) { hintT -= dt; if (hintT <= 0) hint.hidden = true; }
      while (spawned < boards && t >= 0.5 + spawned * gap) spawn();
      const W = belt.clientWidth || 600;
      for (const b of list) {
        if (b.gone) continue;
        if (!b.busy && !(drag && drag.b === b)) b.k += speed * dt;
        b.el.style.left = `${Math.round(48 + b.k * (W - 96))}px`;
        if (b.k >= 1 && !b.busy) {
          b.gone = true; b.el.remove(); misses += 1; ctx.audio?.play('wrong'); setHint(hints.miss || '');
          if (sel === b) select(pickDefault());
          if (misses >= maxMiss) return finish(false);
        }
      }
      if (sel && sel.gone) select(pickDefault());
      check();
    });
    hooks();
  });
}
