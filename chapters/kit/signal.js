// 놀이 부품 「신호 맞추기」(2026-10-26, 고려 3장 귀주 신호에서 처음 씀). 장 데이터만 바꿔 다른 장에서도 쓴다.
// 화면 위에 신호 표시 여러 개(lights: [{ label, at }])가 at초에 차례로 켜진다. 모두 켜진 뒤 open초(easy면 easyOpen초) 동안
// 아래 단추를 누르면 성공. 하나도 안 켜졌을 때(early)·일부만 켜졌을 때(one) 누르거나, 그 시간이 지나면(late) 실패.
// 표시가 켜질 때 장이 넘겨 준 scene.on(i)를 부르고, 매 순간 scene.update?(t)를 부른다(지원군·깃발 같은 3D 움직임은 장이 맡는다).
// 글(표시 이름·단추 이름)은 장이 준다. 사실 문장은 만들지 않는다.
const CSS = `
.signal-lights { position: fixed; z-index: 24; left: 50%; top: 10px; transform: translateX(-50%); display: flex; gap: 10px; padding: 8px 12px; border-radius: 14px;
  background: rgba(27,31,29,.8); border: 2px solid var(--gold, #d9a441); pointer-events: none; font-family: var(--font-ui); }
.signal-light { display: flex; align-items: center; gap: 8px; padding: 4px 12px 4px 6px; border-radius: 20px; background: #2b302d; color: #9a9a90; font: 800 16px var(--font-ui); white-space: nowrap; }
.signal-light i { width: 26px; height: 26px; border-radius: 50%; background: #4a4f4b; border: 2px solid #1b1f1d; display: block; }
.signal-light.on { color: #fff; background: #2f6b5e; }
.signal-light.on i { background: radial-gradient(circle at 35% 30%, #fff6c8, #f2c14a 60%, #c88a1c); box-shadow: 0 0 12px #f2c14a; }
.signal-light.pop { animation: signal-pop .4s ease-out; }
@keyframes signal-pop { 50% { transform: scale(1.18); } }
.signal-lights.all { border-color: #fff; animation: signal-all .5s ease-in-out infinite alternate; }
@keyframes signal-all { to { box-shadow: 0 0 18px #f2c14a; } }
.big-action.signal-btn { z-index: 25; }
@media (max-height: 430px) { .big-action.signal-btn { min-height: 58px; bottom: 10px; } }
`;
function ensureStyle() {
  if (document.getElementById('kit-signal-style')) return;
  const s = document.createElement('style'); s.id = 'kit-signal-style'; s.textContent = CSS; document.head.appendChild(s);
}
// 위 가운데가 목표 상자(.hud)와 겹치면 오른쪽으로, 그래도 모자라면 아래로 비킨다
function placeBeside(ui, el) {
  el.style.left = ''; el.style.top = ''; el.style.transform = '';
  const box = ui.querySelector('.hud:not([hidden])')?.getBoundingClientRect(), r = el.getBoundingClientRect();
  if (!box || !box.width || box.right + 8 <= r.left || box.bottom + 4 <= r.top) return;
  if (box.right + 12 + r.width <= innerWidth - 84) { el.style.left = `${box.right + 12}px`; el.style.transform = 'none'; }
  else el.style.top = `${Math.round(box.bottom + 8)}px`;
}

export function signal(ctx, { lights, open = 3, easyOpen = 5, easy = false, scene = {}, label = '공격 신호' }) {
  ensureStyle();
  const { ui, world } = ctx;
  const win = easy ? easyOpen : open, allAt = Math.max(...lights.map(l => l.at));
  return new Promise(resolve => {
    const panel = document.createElement('div'); panel.className = 'signal-lights';
    const els = lights.map(l => { const e = document.createElement('div'); e.className = 'signal-light'; e.append(document.createElement('i'), document.createTextNode(l.label)); panel.append(e); return e; });
    // 큰 단추: 지금 게임의 큰 단추 모양(big-action)을 빌려 쓴다. 누르기·스페이스·E(ctx.onAction)
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'big-action signal-btn'; btn.textContent = label;
    ui.append(panel, btn);
    placeBeside(ui, panel);
    const onResize = () => placeBeside(ui, panel); addEventListener('resize', onResize);
    let t = 0, done = false;
    const lit = lights.map(() => false);
    const finish = (ok, why) => {
      if (done) return; done = true;
      off(); unbind(); removeEventListener('resize', onResize); removeEventListener('keydown', onKey);
      panel.remove(); btn.remove();
      if (ctx.testHooks) { ctx.testHooks.signalReady = false; ctx.testHooks.ready = false; }
      resolve({ ok, why, t });
    };
    const press = () => {
      if (done) return;
      const n = lit.filter(Boolean).length;
      if (n === lights.length) { ctx.audio?.play('whoosh'); return finish(true, null); }
      ctx.audio?.play('wrong');
      finish(false, n === 0 ? 'early' : 'one');
    };
    btn.addEventListener('click', press);
    const unbind = ctx.onAction ? ctx.onAction(press) : () => {};
    const onKey = e => { if (!ctx.onAction && (e.code === 'Space' || e.code === 'KeyE') && !e.repeat) press(); };
    addEventListener('keydown', onKey);
    const off = world.onUpdate(dt => {
      if (done) return;
      t += dt;
      scene.update?.(t);
      lights.forEach((l, i) => {
        if (!lit[i] && t >= l.at) { lit[i] = true; els[i].classList.add('on', 'pop'); ctx.audio?.play('tap'); scene.on?.(i); }
      });
      const all = lit.every(Boolean);
      panel.classList.toggle('all', all);
      if (ctx.testHooks) ctx.testHooks.signalReady = ctx.testHooks.ready = all && t <= allAt + win - 0.2;
      if (all && t > allAt + win) finish(false, 'late');
    });
  });
}
