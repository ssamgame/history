import { test, eq, ok, skip } from './harness.js';
import { createWorld, MOODS } from '../core/world.js';
import { makePerson } from '../core/people.js';

// 헤드리스 브라우저의 WebGL은 불안정하므로, 로직 테스트는 렌더러 대역을 쓴다.
function fakeRenderer() {
  let ratio = 1;
  return {
    domElement: document.createElement('canvas'),
    shadowMap: { enabled: false, type: null },
    setPixelRatio(r) { ratio = r; }, getPixelRatio() { return ratio; },
    setSize() {}, render() {}, dispose() {}, forceContextLoss() {},
  };
}
function makeWorld(quality = 'medium') {
  return createWorld(document.getElementById('sandbox'), { quality, renderer: fakeRenderer() });
}
function makeRealWorld() {
  try { return createWorld(document.getElementById('sandbox'), { quality: 'medium' }); }
  catch (e) { if (e.message === 'WEBGL_UNAVAILABLE') skip('no WebGL in this browser'); throw e; }
}

test('world: real WebGL renders sunset mood', () => {
  const w = makeRealWorld();
  w.render();
  w.dispose();
});

test('world: builds sunset mood without throwing', () => {
  const w = makeWorld();
  ok(MOODS.sunset && MOODS.sunset.fog.length === 3);
  w.setMood('sunset');
  w.render();
  w.dispose();
});

test('world: player is pushed out of a collider', () => {
  const w = makeWorld();
  w.addCollider({ x: 0, z: -2, r: 1 });
  w.player.position.set(0, 0, 0);
  for (let i = 0; i < 10; i++) w.step(0.05, { x: 0, z: -1 });
  const d = Math.hypot(w.player.position.x, w.player.position.z + 2);
  ok(d >= 1.39, `distance ${d}`);
  w.dispose();
});

test('world: player stays inside bounds', () => {
  const w = makeWorld();
  w.bounds = { x0: -5, x1: 5, z0: -5, z1: 5 };
  w.player.position.set(0, 0, 0);
  for (let i = 0; i < 100; i++) w.step(0.05, { x: 1, z: 0 });
  ok(w.player.position.x <= 5 + 1e-9);
  w.dispose();
});

test('world: nearestNpc respects distance', () => {
  const w = makeWorld();
  w.addNpc('a', { robe: 0x7a3b2e, hat: 'helmet' }, 2, 0, 0);
  w.addNpc('b', { robe: 0x2b4c7e, hat: 'official' }, 10, 0, 0);
  w.player.position.set(0, 0, 0);
  eq(w.nearestNpc(2.8).id, 'a');
  eq(w.nearestNpc(1.5), null);
  w.dispose();
});

test('world: setQuality changes pixel ratio and shadows', () => {
  const w = makeWorld();
  w.setQuality('low');
  eq(w.renderer.getPixelRatio(), 0.75);
  eq(w.renderer.shadowMap.enabled, false);
  w.setQuality('medium');
  eq(w.renderer.shadowMap.enabled, true);
  eq(w.quality.particles, 0.9);
  w.dispose();
});

test('world: goal arrow shows when far and hides when close', () => {
  const w = makeWorld();
  w.player.position.set(0, 0, 0);
  w.setGoal({ x: 10, z: 0 });
  w.step(0.016, { x: 0, z: 0 });
  eq(w.goalArrow.visible, true);
  w.setGoal({ x: 1, z: 0 });
  w.step(0.016, { x: 0, z: 0 });
  eq(w.goalArrow.visible, false);
  w.setGoal(null);
  w.step(0.016, { x: 0, z: 0 });
  eq(w.goalArrow.visible, false);
  w.dispose();
});

test('world: fixed camera is not moved by step', () => {
  const w = makeWorld();
  w.setFixedCamera([8, 4, -29], [0, 1.6, -34]);
  w.step(0.1, { x: 1, z: 0 });
  eq(w.camera.position.toArray(), [8, 4, -29]);
  w.camMode = 'follow';
  w.dispose();
});

test('world: clearLevel removes level objects, colliders and npcs', () => {
  const w = makeWorld();
  w.addNpc('a', { robe: 0x7a3b2e, hat: 'helmet' }, 2, 0, 0);
  w.addCollider({ x: 0, z: 0, r: 1 });
  w.level.add(makePerson({ robe: 0x111111, hat: 'fur' }));
  w.clearLevel();
  eq(w.npcs.size, 0);
  eq(w.colliders.length, 0);
  eq(w.level.children.length, 0);
  w.dispose();
});

test('people: person has two legs and two arms for walking', () => {
  const p = makePerson({ robe: 0x2f6b5e, hat: 'helmet' });
  eq(p.userData.legs.length, 2);
  eq(p.userData.arms.length, 2);
});

test('world: paused world does not run updaters or move the player', () => {
  const w = makeWorld();
  let n = 0; w.onUpdate(() => { n += 1; });
  w.paused = true;
  w.player.position.set(0, 0, 0);
  w.step(0.1, { x: 1, z: 0 });
  eq(n, 0); eq(w.player.position.x, 0);
  w.paused = false; w.step(0.1, { x: 0, z: 0 });
  eq(n, 1);
  w.dispose();
});

test('world: unsubscribing twice or inside the loop does not remove other updaters', () => {
  const w = makeWorld();
  let a = 0, b = 0;
  const offA = w.onUpdate(() => { a += 1; offA(); });
  w.onUpdate(() => { b += 1; });
  w.step(0.016, { x: 0, z: 0 });
  offA();
  w.step(0.016, { x: 0, z: 0 });
  eq(a, 1); eq(b, 2);
  w.dispose();
});

test('world: follow camera stays behind the player even far from the origin', () => {
  const w = makeWorld();
  w.bounds = { x0: -100, x1: 100, z0: -100, z1: 100 };
  w.player.position.set(20, 0, 60);
  w.snapCamera();
  for (let i = 0; i < 200; i++) w.step(0.05, { x: 0, z: 0 });
  const c = w.camera.position;
  ok(Math.abs(c.x - 20) < 0.5, `camera x ${c.x.toFixed(1)}`);
  ok(c.z > 60 + 5, `camera is south of (behind) the player: z ${c.z.toFixed(1)}`);
  w.dispose();
});

// 안내판 글씨: 판에 비해 글자가 작거나 눌려 보이지 않게, 모든 제목을 큰 글씨로 판 안에 쓴다
test('signs: 모든 안내판 제목이 판 높이의 절반쯤 되는 큰 글씨로 판 안에 들어간다', async () => {
  const { signTextLayout, SIGN_CANVAS } = await import('../core/signs.js');
  const titles = ['5·10 총선거', '6·10 만세 운동', '88 서울 올림픽', '여성 독립운동가', '고려와 송, 거란', '훈민정음 해례본', '화성성역의궤', '임시 정부 청사', '제주 4·3 사건', '탕평비 이야기', '물산 장려 운동', '종묘', '강동 6주'];
  const c = document.createElement('canvas').getContext('2d');
  for (const t of titles) {
    const L = signTextLayout(c, t);
    const lineH = L.size * L.lines.length;
    ok(L.size >= SIGN_CANVAS.h * 0.32, `${t}: ${L.size}px is too small for a ${SIGN_CANVAS.h}px board`);
    ok(lineH <= SIGN_CANVAS.h * 0.85, `${t}: too tall`);
    c.font = L.font;
    for (const line of L.lines) ok(c.measureText(line).width <= SIGN_CANVAS.w * 0.9, `${t}: "${line}" wider than the board`);
    eq(L.lines.join(' '), t);
  }
});

// D-5 가까운 시점(closeView): 따라가기 카메라가 낮고(0,6,9), 대화 때는 인물 얼굴을 정면에서 당겨 보며 학생 몸은 숨긴다. autoMove는 정해진 걸음.
test('world: closeView lowers the follow camera and faces the talk camera to the npc', () => {
  const w = makeWorld();
  w.player.position.set(0, 0, 0);
  w.snapCamera(); eq([w.camera.position.y, w.camera.position.z], [8.5, 12]);
  w.closeView = true; w.snapCamera(); eq([w.camera.position.y, w.camera.position.z], [6, 9]);
  const npc = makePerson({}); npc.position.set(3, 0, -4); w.level.add(npc);
  const talk = () => {
    w.setTalkCamera(npc);
    for (let i = 0; i < 120; i++) w.step(1 / 30, { x: 0, z: 0 });
    return w.camera.fov;
  };
  ok(talk() < 47, 'close talk zooms in on the face ' + w.camera.fov);
  // 정면: 카메라가 인물에서 학생 쪽 방향 위에 있다(비스듬하지 않게)
  const toP = Math.atan2(w.player.position.x - 3, w.player.position.z + 4), toC = Math.atan2(w.camera.position.x - 3, w.camera.position.z + 4);
  ok(Math.abs(Math.atan2(Math.sin(toC - toP), Math.cos(toC - toP))) < 0.1, 'camera straight in front ' + (toC - toP));
  ok(!w.player.visible, 'player hidden while talking');
  w.camMode = 'follow'; for (let i = 0; i < 120; i++) w.step(1 / 30, { x: 0, z: 0 });
  ok(Math.abs(w.camera.fov - 50) < 0.5, 'fov back after talk ' + w.camera.fov);
  ok(w.player.visible, 'player shown again');
  w.closeView = false;
  eq(talk(), 50);
  ok(w.player.visible, 'other chapters keep the player visible');
  w.camMode = 'follow';
  w.autoMove = { x: 0, z: -1 };
  for (let i = 0; i < 30; i++) w.step(1 / 30, { x: 0, z: 0 });
  ok(w.player.position.z < -2, 'autoMove walks ' + w.player.position.z);
  w.dispose();
});
