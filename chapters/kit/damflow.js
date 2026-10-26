// 놀이 부품 「둑 수위 조절」(2026-10-26, 고려 3장 흥화진 앞 냇물에서 처음 씀). 장 데이터만 바꿔 다른 장에서도 쓴다.
// 아래 큰 단추를 누르고 있으면 둑 뒤에 물이 차오르고(fillSeconds에 꽉 참), 떼면 둑이 터진다. 꽉 찬 채 overflowSeconds를 넘기면 저절로 터진다(실패).
// 적 무리가 냇물을 건너는 진행도 k(0→1, crossSeconds)가 window 안이고 물 높이가 minLevel 이상일 때 떼야 성공.
// 실패 까닭(why): early(일찍) · late(늦음, 끝까지 안 뗌) · low(물 모자람) · overflow(넘침). easy면 easyWindow·easyMinLevel, 성공 칸이 반짝인다.
// 3D 연출은 장이 넘겨 준 scene({ cross(k), level(v), reset() })이 맡는다. 글(단추 이름)은 장이 준다. 사실 문장은 만들지 않는다.
// 단추는 누르고 떼기가 필요해서 core/minigame.js의 actionButton을 쓰지 않고 여기서 만든다(터치·마우스·스페이스 키).
const CSS = `
.dam-btn { position: fixed; z-index: 25; left: 50%; transform: translateX(-50%); bottom: calc(18px + env(safe-area-inset-bottom, 0px));
  min-height: 72px; min-width: 240px; max-width: calc(100% - 24px); padding: 0 26px; box-sizing: border-box; border-radius: 36px; border: 3px solid var(--hanji, #f2ead9);
  background: radial-gradient(circle at 30% 25%, #6aa8c8, #2f5f7e 70%); color: #fff; font: 800 22px var(--font-ui); box-shadow: 0 6px 0 #1d3a4e, 0 10px 18px #0006;
  touch-action: none; user-select: none; -webkit-user-select: none; cursor: pointer; }
.dam-btn.down { transform: translateX(-50%) translateY(4px); box-shadow: 0 2px 0 #1d3a4e, 0 6px 12px #0006; background: radial-gradient(circle at 30% 25%, #8cc4e0, #3b7396 70%); }
.dam-meter { position: fixed; z-index: 24; left: 50%; top: 10px; transform: translateX(-50%); width: 64px; box-sizing: border-box; padding: 6px 6px 8px; border-radius: 12px;
  background: rgba(27,31,29,.78); border: 2px solid var(--gold, #d9a441); pointer-events: none; font-family: var(--font-ui); color: var(--hanji, #f2ead9); text-align: center; }
.dam-meter .ttl { font: 800 12px var(--font-ui); margin-bottom: 4px; white-space: nowrap; }
.dam-meter .tube { position: relative; height: 120px; border-radius: 8px; background: #3a4a52; overflow: hidden; border: 2px solid #1b1f1d; }
.dam-meter .water { position: absolute; left: 0; right: 0; bottom: 0; height: 0; background: linear-gradient(#7fc4e6, #2f6f96); }
.dam-meter .goal { position: absolute; left: 0; right: 0; top: 0; border: 2px dashed #f6e7b8; border-radius: 6px; box-sizing: border-box; }
.dam-meter .goal.blink { animation: dam-blink .6s ease-in-out infinite alternate; background: #f6e7b833; }
@keyframes dam-blink { to { border-color: #fff; background: #f6e7b866; } }
.dam-meter .tick { position: absolute; left: 0; right: 0; height: 2px; background: #f2ead9aa; }
.dam-meter.full .tube { animation: dam-shake .2s linear infinite; }
@keyframes dam-shake { 0%,100% { transform: none; } 50% { transform: translateX(2px); } }
@media (max-height: 430px) { .dam-meter .tube { height: 84px; } .dam-btn { min-height: 60px; font-size: 19px; bottom: 10px; } }
`;
function ensureStyle() {
  if (document.getElementById('kit-damflow-style')) return;
  const s = document.createElement('style'); s.id = 'kit-damflow-style'; s.textContent = CSS; document.head.appendChild(s);
}

// 위 가운데가 목표 상자(.hud)와 겹치면 목표 상자 오른쪽으로 비킨다(ops.js의 게이지와 같은 방식)
function placeBeside(ui, el) {
  el.style.left = ''; el.style.transform = '';
  const box = ui.querySelector('.hud:not([hidden])')?.getBoundingClientRect(), r = el.getBoundingClientRect();
  if (!box || !box.width || box.right + 8 <= r.left || box.bottom + 4 <= r.top) return;
  el.style.left = `${Math.min(innerWidth - r.width - 8, box.right + 12)}px`; el.style.transform = 'none';
  const r2 = el.getBoundingClientRect();
  if (r2.left < box.right + 4 && r2.top < box.bottom + 4) { el.style.top = `${Math.round(box.bottom + 8)}px`; }
}

export function damflow(ctx, { window: win = [0.5, 0.82], easyWindow = null, crossSeconds = 12, minLevel = 2 / 3, easyMinLevel = 1 / 3, easy = false,
  fillSeconds = 4, overflowSeconds = 1, scene = {}, label = '물 모으기', title = '물 높이' } = {}) {
  ensureStyle();
  const { ui, world } = ctx;
  const [lo, hi] = easy && easyWindow ? easyWindow : win, need = easy ? easyMinLevel : minLevel;
  return new Promise(resolve => {
    const meter = document.createElement('div'); meter.className = 'dam-meter';
    meter.innerHTML = `<div class="ttl"></div><div class="tube"><div class="goal${easy ? ' blink' : ''}"></div><div class="tick" style="bottom:33.3%"></div><div class="tick" style="bottom:66.6%"></div><div class="water"></div></div>`;
    meter.querySelector('.ttl').textContent = title;
    meter.querySelector('.goal').style.height = `${Math.round((1 - need) * 100)}%`;
    const water = meter.querySelector('.water');
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'dam-btn'; btn.textContent = label;
    ui.append(meter, btn);
    placeBeside(ui, meter);
    const onResize = () => placeBeside(ui, meter); addEventListener('resize', onResize);

    let t = 0, level = 0, held = false, full = 0, done = false;
    scene.reset?.(); scene.cross?.(0); scene.level?.(0);
    const hooks = () => {
      if (!ctx.testHooks) return;
      const k = t / crossSeconds, startAt = lo * crossSeconds + 0.5 - fillSeconds * need; // 봇: 창이 열리고 조금 뒤 물이 넉넉해지게 미리 누른다
      ctx.testHooks.damLevel = level;
      ctx.testHooks.dam = { press: t >= startAt && k < hi - 0.05, release: k >= lo + 0.03 && k <= hi - 0.03 && level >= need + 0.05 };
    };
    const finish = (ok, why) => {
      if (done) return; done = true;
      off(); removeEventListener('resize', onResize);
      removeEventListener('keydown', onKey); removeEventListener('keyup', onKeyUp);
      meter.remove(); btn.remove();
      if (ctx.testHooks) { delete ctx.testHooks.dam; delete ctx.testHooks.damLevel; }
      resolve({ ok, why, k: t / crossSeconds, level });
    };
    const press = () => { if (done || held) return; held = true; btn.classList.add('down'); ctx.audio?.play('tap'); };
    const lift = () => {
      if (done || !held) return; held = false; btn.classList.remove('down');
      const k = t / crossSeconds;
      if (k < lo) return finish(false, 'early');
      if (k > hi) return finish(false, 'late');
      if (level < need) return finish(false, 'low');
      ctx.audio?.play('water');
      finish(true, null);
    };
    btn.addEventListener('pointerdown', e => { e.preventDefault(); press(); });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) btn.addEventListener(ev, lift);
    const onKey = e => { if (e.code === 'Space' && !e.repeat) { e.preventDefault?.(); press(); } };
    const onKeyUp = e => { if (e.code === 'Space') lift(); };
    addEventListener('keydown', onKey); addEventListener('keyup', onKeyUp);

    const off = world.onUpdate(dt => {
      if (done) return;
      t += dt;
      const k = Math.min(1, t / crossSeconds);
      if (held) level = Math.min(1, level + dt / fillSeconds);
      full = held && level >= 1 ? full + dt : 0;
      water.style.height = `${Math.round(level * 100)}%`;
      meter.classList.toggle('full', level >= 1);
      scene.cross?.(k); scene.level?.(level);
      hooks();
      if (full >= overflowSeconds) { held = false; btn.classList.remove('down'); return finish(false, 'overflow'); }
      if (k >= 1) finish(false, 'late');
    });
    hooks();
  });
}
