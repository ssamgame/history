// 조선 6장 도구(D-30). 공용 파일을 고치지 않으려고 장 폴더 안에 둔다.
// holdPress(J-05): E·스페이스·엔터 키를 누르고 있거나 화면 아래 큰 버튼을 손가락으로 누르고 있으면 막대가 찬다(sec초).
//   떼면 멈추고 천천히 줄어든다(decay: 줄어드는 빠르기, 차는 빠르기에 대한 비율). 다 차면 끝난다.
//   테스트 봇에게는 ctx.testHooks.hold = { el, sec }로 누를 버튼을 알려 준다.
// dragStone(J-06): 매단 돌을 손가락·마우스로 끌거나 방향키(WASD)로 옮긴다. 아래는 dragStone 설명 참고.
import * as THREE from 'three';

const HOLD_KEYS = new Set(['KeyE', 'Space', 'Enter']);

export function holdPress(ctx, { label, sec, onProgress, decay = 0.35 }) {
  const { world, ui } = ctx;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'big-action j6-hold';
  // 화면 오른쪽(대화 버튼 위): 가운데 아래에 두면 올라가는 돌을 가린다
  Object.assign(btn.style, { touchAction: 'none', userSelect: 'none', webkitUserSelect: 'none', left: 'auto', transform: 'none', minWidth: '200px',
    right: 'calc(24px + env(safe-area-inset-right, 0px))', bottom: 'calc(132px + env(safe-area-inset-bottom, 0px))' });
  const txt = document.createElement('span'); txt.textContent = label;
  const bar = document.createElement('span');
  Object.assign(bar.style, { display: 'block', height: '10px', marginTop: '6px', borderRadius: '5px', background: 'rgba(0,0,0,.35)', overflow: 'hidden' });
  const fill = document.createElement('span');
  Object.assign(fill.style, { display: 'block', height: '100%', width: '0%', background: '#f2c45a' });
  bar.append(fill); btn.append(txt, bar);
  ui.append(btn);
  let keyHeld = false, pointer = null, p = 0;
  const holding = () => keyHeld || pointer !== null;
  const onKeyDown = e => { if (HOLD_KEYS.has(e.code)) { keyHeld = true; e.preventDefault?.(); } };
  const onKeyUp = e => { if (HOLD_KEYS.has(e.code)) keyHeld = false; };
  const onDown = e => { pointer = e.pointerId; try { btn.setPointerCapture(e.pointerId); } catch { /* 합성 이벤트 */ } e.preventDefault?.(); };
  const onUp = e => { if (pointer === null || e.pointerId === pointer || e.type === 'lostpointercapture') pointer = null; };
  const onBlur = () => { keyHeld = false; pointer = null; };
  addEventListener('keydown', onKeyDown); addEventListener('keyup', onKeyUp); addEventListener('blur', onBlur);
  btn.addEventListener('pointerdown', onDown);
  btn.addEventListener('lostpointercapture', onUp);
  addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);
  btn.addEventListener('contextmenu', e => e.preventDefault()); // 길게 누를 때 뜨는 메뉴 막기
  ctx.testHooks.hold = { el: btn, sec };
  return new Promise(resolve => {
    const off = world.onUpdate(dt => {
      if (ctx.dialogue?.isOpen?.()) return;
      const on = holding();
      p = on ? Math.min(1, p + dt / sec) : Math.max(0, p - (dt / sec) * decay);
      btn.classList.toggle('held', on);
      fill.style.width = `${Math.round(p * 100)}%`;
      onProgress?.(p, on, dt);
      if (p >= 1) {
        off();
        removeEventListener('keydown', onKeyDown); removeEventListener('keyup', onKeyUp); removeEventListener('blur', onBlur);
        removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp);
        btn.remove();
        if (ctx.testHooks.hold?.el === btn) ctx.testHooks.hold = null;
        resolve();
      }
    });
  });
}

// 돌 옮기기(J-06): 성벽을 정면에서 본 화면에서 매단 돌을 끌거나(손가락·마우스, 화면 어디를 눌러 끌어도 돌이 그만큼 따라 움직인다)
// 방향키·WASD(←→ 옆으로, ↓ 내리기, ↑ 올리기)로 옮긴다. 돌은 성벽 위로만 지나가고, 빈자리 위에서만 그 안으로 내려간다.
// 빈자리가 아닌 곳에서 내리면 성벽 위에 걸려 멈추고 onBump()를 부른다. 빈자리 바닥까지 내리거나, 빈자리 위에서 손을 떼면 끝.
// get/set: 돌의 { x, h }(h는 들어 올린 정도), planeZ: 성벽 면, yOf(h)/hOf(y): 높이 바꾸기, gaps: 남은 빈자리 x, track: x 범위,
// topH: 성벽 위를 지나는 가장 낮은 h, bottomH: 빈자리 바닥 h. 돌려주는 약속은 들어간 빈자리 번호(gaps의 순서)로 끝난다.
export function dragStone(ctx, { get, set, planeZ, yOf, hOf, gaps, track, topH, bottomH, onBump, snap = 0.6 }) {
  const { world, ui } = ctx;
  const layer = document.createElement('div');
  layer.className = 'j6-drag';
  Object.assign(layer.style, { position: 'fixed', inset: '0', touchAction: 'none', cursor: 'grab' });
  ui.prepend(layer); // 메뉴·대화창보다 아래
  const keys = new Set();
  const KEYS = { ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd' };
  const onKeyDown = e => { if (KEYS[e.code]) { keys.add(KEYS[e.code]); e.preventDefault?.(); } };
  const onKeyUp = e => { if (KEYS[e.code]) keys.delete(KEYS[e.code]); };
  addEventListener('keydown', onKeyDown); addEventListener('keyup', onKeyUp);
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -planeZ), ray = new THREE.Raycaster(), hit = new THREE.Vector3();
  const rect = () => layer.getBoundingClientRect();
  const toPlane = (cx, cy) => {
    const r = rect();
    ray.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), world.camera);
    return ray.ray.intersectPlane(plane, hit) ? hit.clone() : null;
  };
  const toScreen = (x, y) => {
    world.camera.updateMatrixWorld();
    const v = new THREE.Vector3(x, y, planeZ).project(world.camera), r = rect();
    return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height];
  };
  const nearGap = x => { let best = -1, d = snap; gaps.forEach((g, i) => { if (g != null && Math.abs(x - g) < d) { d = Math.abs(x - g); best = i; } }); return best; };
  let bumped = false, finishing = false, resolveFn = null, drag = null;
  // 옮기기 규칙: 빈자리 안(성벽 위보다 낮음)에서는 옆으로 못 움직이고, 성벽 위에서는 빈자리 위에서만 아래로 내려간다
  const moveTo = (nx, nh) => {
    const cur = get();
    let x = Math.min(track[1], Math.max(track[0], nx)), h = Math.min(1, nh);
    if (cur.h < topH - 1e-4) { const i = nearGap(cur.x); x = i >= 0 ? gaps[i] : cur.x; }
    if (h < topH) {
      const i = nearGap(x);
      if (i >= 0) x = gaps[i];
      else { h = topH; if (nh < topH - 0.02 && !bumped) { bumped = true; onBump?.(); } }
    }
    h = Math.max(bottomH, h);
    set(x, h);
    const i = nearGap(x);
    if (i >= 0 && h <= bottomH + 1e-3) finish(i);
  };
  const finish = i => { if (finishing) return; finishing = true; cleanup(); resolveFn(i); };
  const onDown = e => {
    if (ctx.dialogue?.isOpen?.() || finishing) return;
    const p = toPlane(e.clientX, e.clientY); if (!p) return;
    drag = { id: e.pointerId, p0: p, s0: get() };
    try { layer.setPointerCapture(e.pointerId); } catch { /* 합성 이벤트 */ }
    layer.style.cursor = 'grabbing';
  };
  const onMove = e => {
    if (!drag || e.pointerId !== drag.id || ctx.dialogue?.isOpen?.()) return;
    const p = toPlane(e.clientX, e.clientY); if (!p) return;
    moveTo(drag.s0.x + (p.x - drag.p0.x), drag.s0.h + (hOf(p.y) - hOf(drag.p0.y)));
  };
  const onUp = e => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null; layer.style.cursor = 'grab';
    const s = get(), i = nearGap(s.x);
    if (i >= 0 && !finishing) finish(i); // 빈자리 위에서 손을 떼면 그 자리로 내려간다
  };
  layer.addEventListener('pointerdown', onDown);
  layer.addEventListener('pointermove', onMove);
  layer.addEventListener('pointerup', onUp);
  layer.addEventListener('pointercancel', onUp);
  const off = world.onUpdate(dt => {
    if (finishing || ctx.dialogue?.isOpen?.() || !keys.size) return;
    const s = get();
    const dx = ((keys.has('r') ? 1 : 0) - (keys.has('l') ? 1 : 0)) * 5 * dt, dh = ((keys.has('u') ? 1 : 0) - (keys.has('d') ? 1 : 0)) * 0.45 * dt;
    if (dx || dh) moveTo(s.x + dx, s.h + dh);
  });
  // 테스트 봇용: 돌이 있는 화면 자리와, 남은 첫 빈자리 바닥의 화면 자리
  ctx.testHooks.drag = {
    el: layer,
    stone: () => { const s = get(); return toScreen(s.x, yOf(s.h)); },
    target: () => { const s = get(), g = gaps.find(v => v != null); return toScreen(g, yOf(s.h) - (yOf(s.h) - yOf(bottomH)) * 0.3); },
  };
  function cleanup() {
    off(); layer.remove();
    removeEventListener('keydown', onKeyDown); removeEventListener('keyup', onKeyUp);
    ctx.testHooks.drag = null;
  }
  return new Promise(r => { resolveFn = r; });
}
