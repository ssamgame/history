import { test, eq, ok } from './harness.js';
import { createInput } from '../core/input.js';
import { createAudio, sayCue } from '../core/audio.js';

function setup() {
  const joyZone = document.createElement('div');
  const actionButton = document.createElement('button');
  Object.assign(joyZone.style, { position: 'fixed', left: '0', top: '0', width: '300px', height: '300px' });
  document.body.append(joyZone, actionButton);
  const input = createInput({ target: window, joyZone, actionButton });
  return { input, joyZone, actionButton, done: () => { input.dispose(); joyZone.remove(); actionButton.remove(); } };
}
const key = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code }));

test('input: diagonal keys are normalized', () => {
  const { input, done } = setup();
  key('keydown', 'KeyW'); key('keydown', 'KeyD');
  const m = input.move();
  ok(Math.abs(Math.hypot(m.x, m.z) - 1) < 1e-6, `length ${Math.hypot(m.x, m.z)}`);
  ok(m.x > 0 && m.z < 0, 'W is -z, D is +x');
  key('keyup', 'KeyW'); key('keyup', 'KeyD');
  eq(input.move(), { x: 0, z: 0 });
  done();
});

test('input: arrow keys move too', () => {
  const { input, done } = setup();
  key('keydown', 'ArrowLeft');
  eq(input.move(), { x: -1, z: 0 });
  key('keyup', 'ArrowLeft');
  done();
});

test('input: disabled input returns zero', () => {
  const { input, done } = setup();
  key('keydown', 'KeyS');
  input.enabled = false;
  eq(input.move(), { x: 0, z: 0 });
  key('keyup', 'KeyS');
  done();
});

test('input: E key and action button both fire onAction', () => {
  const { input, actionButton, done } = setup();
  let n = 0; input.onAction(() => { n += 1; });
  key('keydown', 'KeyE'); key('keyup', 'KeyE');
  actionButton.click();
  eq(n, 2);
  done();
});

test('input: Esc fires onMenu', () => {
  const { input, done } = setup();
  let n = 0; input.onMenu(() => { n += 1; });
  key('keydown', 'Escape');
  eq(n, 1);
  done();
});

test('input: joystick drag gives direction and release stops', () => {
  const { input, joyZone, done } = setup();
  const pe = (type, x, y) => joyZone.dispatchEvent(new PointerEvent(type, { pointerId: 7, clientX: x, clientY: y, bubbles: true }));
  pe('pointerdown', 100, 100);
  pe('pointermove', 100, 200);
  const m = input.move();
  ok(Math.abs(m.x) < 1e-6 && Math.abs(m.z - 1) < 1e-6, JSON.stringify(m));
  pe('pointerup', 100, 200);
  eq(input.move(), { x: 0, z: 0 });
  done();
});

test('input: tiny joystick drag is inside dead zone', () => {
  const { input, joyZone, done } = setup();
  const pe = (type, x, y) => joyZone.dispatchEvent(new PointerEvent(type, { pointerId: 8, clientX: x, clientY: y, bubbles: true }));
  pe('pointerdown', 100, 100); pe('pointermove', 103, 100);
  eq(input.move(), { x: 0, z: 0 });
  pe('pointerup', 103, 100);
  done();
});

test('audio: starts quiet and can be muted before any sound', () => {
  const a = createAudio();
  eq(a.volume, 0.3);
  eq(a.muted, false);
  a.setMuted(true);
  eq(a.muted, true);
  a.play('tap'); // 음소거 상태에서는 아무것도 하지 않음
});

test('input: lost pointer capture releases the joystick', () => {
  const { input, joyZone, done } = setup();
  const pe = (type, x, y) => joyZone.dispatchEvent(new PointerEvent(type, { pointerId: 9, clientX: x, clientY: y, bubbles: true }));
  pe('pointerdown', 100, 100); pe('pointermove', 100, 200);
  joyZone.dispatchEvent(new PointerEvent('lostpointercapture', { pointerId: 9, bubbles: true }));
  eq(input.move(), { x: 0, z: 0 });
  pe('pointerdown', 50, 50); pe('pointermove', 90, 50);
  ok(input.move().x > 0.5, 'a new touch works again');
  pe('pointerup', 90, 50);
  done();
});

// 2026-11-12 선생님이 고른 효과음: 대화 시작(두 음 올림)·대사 넘기기(물방울)·상호작용(맑은 딩), 시간지기 안내는 소리 없음
test('audio: 대화가 열릴 때는 talk, 이어지는 대사는 next, 시간지기 안내는 소리 없이', () => {
  const a = createAudio(); a.setMuted(true);
  sayCue(a, { who: 'seohui', text: '가' }, false); eq(a.last, 'talk');
  sayCue(a, { who: 'narr', text: '나' }, true); eq(a.last, 'next');
  a.last = null; sayCue(a, { who: 'guide', text: '다' }, false); eq(a.last, null);
  for (const n of ['next', 'talk', 'act']) { a.play(n); eq(a.last, n); }
  a.play('tap'); eq(a.last, 'act', '행동 소리 바로 뒤의 톡 소리는 겹치지 않게 뺀다');
});
