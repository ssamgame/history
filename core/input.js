// 키보드(WASD·방향키·E·스페이스·엔터·Esc)와 터치(끌면 나타나는 조이스틱, 대화 버튼) 입력.
const MOVE_KEYS = {
  KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0],
};
const ACTION_KEYS = new Set(['KeyE', 'Space', 'Enter']);
const JOY_RADIUS = 48;
const DEAD_ZONE = 0.12;

export function createInput({ target = window, joyZone, actionButton }) {
  const held = new Set();
  const joy = { id: null, cx: 0, cy: 0, x: 0, z: 0 };
  const actionFns = [], menuFns = [];
  const actionKeys = new Set(); let btnHeld = false; // 꾹 누르기(D-62): 행동 키·버튼을 누르고 있는지

  const base = document.createElement('div');
  base.className = 'joy'; base.hidden = true;
  base.innerHTML = '<div class="joy-knob"></div>';
  joyZone.appendChild(base);
  const knob = base.firstChild;

  const onKeyDown = e => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (MOVE_KEYS[e.code]) { held.add(e.code); if (e.code.startsWith('Arrow')) e.preventDefault?.(); }
    if (ACTION_KEYS.has(e.code)) actionKeys.add(e.code);
    if (ACTION_KEYS.has(e.code) && !e.repeat) {
      if (e.target && e.target.tagName === 'BUTTON') return; // 버튼 위에서는 브라우저 기본 동작(클릭)에 맡김
      e.preventDefault?.();
      actionFns.forEach(f => f());
    }
    if (e.code === 'Escape') menuFns.forEach(f => f());
  };
  const onKeyUp = e => { held.delete(e.code); actionKeys.delete(e.code); };
  const onBlur = () => { held.clear(); actionKeys.clear(); btnHeld = false; };
  const btnDown = () => { btnHeld = true; }, btnUp = () => { btnHeld = false; };

  const endJoy = e => {
    if (e.pointerId !== joy.id) return;
    joy.id = null; joy.x = joy.z = 0; knob.style.transform = ''; base.hidden = true;
  };
  const onDown = e => {
    if (joy.id !== null) return;
    joy.id = e.pointerId; joy.cx = e.clientX; joy.cy = e.clientY;
    try { joyZone.setPointerCapture(e.pointerId); } catch { /* 합성 이벤트 */ }
    const r = joyZone.getBoundingClientRect();
    base.style.left = `${e.clientX - r.left}px`; base.style.top = `${e.clientY - r.top}px`;
    base.hidden = false;
  };
  const onMove = e => {
    if (e.pointerId !== joy.id) return;
    let dx = e.clientX - joy.cx, dy = e.clientY - joy.cy;
    const d = Math.hypot(dx, dy);
    if (d > JOY_RADIUS) { dx *= JOY_RADIUS / d; dy *= JOY_RADIUS / d; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    joy.x = dx / JOY_RADIUS; joy.z = dy / JOY_RADIUS;
  };
  const onAction = e => { e.preventDefault(); actionFns.forEach(f => f()); };

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  target.addEventListener('blur', onBlur);
  joyZone.addEventListener('pointerdown', onDown);
  joyZone.addEventListener('pointermove', onMove);
  joyZone.addEventListener('pointerup', endJoy);
  joyZone.addEventListener('pointercancel', endJoy);
  joyZone.addEventListener('lostpointercapture', endJoy);
  actionButton.addEventListener('click', onAction);
  actionButton.addEventListener('pointerdown', btnDown);
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) actionButton.addEventListener(ev, btnUp);

  const input = {
    enabled: true,
    move() {
      if (!input.enabled) return { x: 0, z: 0 };
      let x = joy.x, z = joy.z;
      for (const k of held) { x += MOVE_KEYS[k][0]; z += MOVE_KEYS[k][1]; }
      const len = Math.hypot(x, z);
      if (len < DEAD_ZONE) return { x: 0, z: 0 };
      const k = len > 1 ? 1 / len : 1;
      return { x: x * k + 0, z: z * k + 0 };
    },
    onAction(fn) { actionFns.push(fn); },
    actionHeld() { return btnHeld || actionKeys.size > 0; }, // 행동 키(E·스페이스 등)나 행동 버튼을 누르고 있는 동안 true
    onMenu(fn) { menuFns.push(fn); },
    releaseJoystick() { endJoy({ pointerId: joy.id }); },
    dispose() {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
      target.removeEventListener('blur', onBlur);
      joyZone.removeEventListener('pointerdown', onDown);
      joyZone.removeEventListener('pointermove', onMove);
      joyZone.removeEventListener('pointerup', endJoy);
      joyZone.removeEventListener('pointercancel', endJoy);
      joyZone.removeEventListener('lostpointercapture', endJoy);
      actionButton.removeEventListener('click', onAction);
      actionButton.removeEventListener('pointerdown', btnDown);
      for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) actionButton.removeEventListener(ev, btnUp);
      base.remove();
    },
  };
  return input;
}
