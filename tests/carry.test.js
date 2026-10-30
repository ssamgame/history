// D-18: 물건을 들고 다닐 때 자연스러운 동작(모든 장 공통). 든 물건은 손 가까이에 붙고, 팔이 받치는 자세가 되며,
// 걸을 때 팔을 크게 흔들지 않고 물건과 함께 살짝 흔들린다. 내려놓으면 팔이 원래대로.
import * as THREE from 'three';
import { test, eq, ok } from './harness.js';
import { makePerson, setCarry, animateWalk } from '../core/people.js';
import { LOOKS } from '../content/characters.js';
import { touchSetup } from './bot.js';

const box = () => new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.4), new THREE.MeshBasicMaterial());
const handsNear = (p, obj) => {
  p.updateMatrixWorld(true);
  const o = new THREE.Vector3(); obj.getWorldPosition(o);
  return p.userData.arms.map(a => { const h = new THREE.Vector3(); a.getObjectByName('hand').getWorldPosition(h); return h.distanceTo(o); });
};

test('carry: 두 팔로 안으면 물건이 두 손 사이에 붙고, 걸어도 팔을 휘젓지 않고 살짝 흔들리며, 내려놓으면 팔이 돌아온다', () => {
  const p = makePerson(LOOKS.villager, { track: false }), b = box();
  setCarry(p, b, 'arms');
  ok(b.parent === p.userData.upper, '몸통 관절(upper)에 붙는다'); // 2026-10-30: 든 물건은 상체와 함께 움직이게 몸통 관절의 자식
  const u = p.userData;
  ok(u.arms.every(a => a.rotation.x < -0.6), 'both arms forward');
  ok(handsNear(p, b).every(d => d < 0.6), `hands at the object ${handsNear(p, b).map(d => d.toFixed(2))}`);
  const ys = [], diffs = [];
  let legMax = 0; // 걸음 박자에 따라 한 순간의 다리 각은 작을 수 있어, 걷는 동안 가장 크게 벌어진 각을 본다
  for (let i = 0; i < 40; i++) { animateWalk(p, true, 0.05); ys.push(b.position.y); diffs.push(Math.abs(u.arms[0].rotation.x - u.arms[1].rotation.x)); legMax = Math.max(legMax, ...u.legs.map(l => Math.abs(l.rotation.x))); }
  ok(Math.max(...diffs) < 0.25, 'arms do not swing opposite');
  const sway = Math.max(...ys) - Math.min(...ys); ok(sway > 0.005 && sway < 0.12, `gentle sway ${sway.toFixed(3)}`);
  ok(legMax > 0.3, `legs still walk ${legMax.toFixed(2)}`);
  setCarry(p, null);
  ok(!b.parent, 'put down');
  for (let i = 0; i < 20; i++) animateWalk(p, false, 0.05); // 내려놓으면 팔이 천천히 내려온다(2026-10-30 움직임 개선: 갑자기 꺾이지 않게)
  ok(u.arms.every(a => Math.abs(a.rotation.x) < 0.01 && Math.abs(a.rotation.z) < 0.01), 'arms back');
});

test('carry: 옆구리에 끼거나 어깨에 메면 그쪽 손이 물건을 잡고, 다른 팔은 걸을 때 흔든다', () => {
  for (const style of ['side', 'shoulder']) {
    const p = makePerson(LOOKS.villager, { track: false }), b = box();
    setCarry(p, b, style);
    const d = handsNear(p, b);
    ok(d[1] < 0.6, `${style}: holding hand ${d[1].toFixed(2)}`);
    const free = [];
    for (let i = 0; i < 40; i++) { animateWalk(p, true, 0.05); free.push(p.userData.arms[0].rotation.x); }
    ok(Math.max(...free) - Math.min(...free) > 0.3, `${style}: the other arm swings`);
  }
});

test('carry: 크기가 다른 학생(아이)도 물건이 손에 붙는다', () => {
  const p = makePerson(LOOKS.villager, { track: false }); p.scale.setScalar(0.8);
  const b = box(); setCarry(p, b, 'arms');
  ok(handsNear(p, b).every(d => d < 0.5));
});

test('carry: 고려 4장 노비 문서를 받으면 옆구리에 끼고, 더미에 놓으면 손을 비운다', async () => {
  const { default: ch4, setupChungju, carryDocuments } = await import('../chapters/ch4/chapter.js');
  const s = touchSetup({});
  try {
    const sc = ch4.buildScene(s.w, s.ctx);
    setupChungju(s.ctx);
    carryDocuments(s.ctx);
    const g1 = s.w.getGoal(); s.w.player.position.set(g1.x, 0, g1.z); s.w.step(0.05, { x: 0, z: 0 });
    for (let i = 0; i < 8; i++) s.w.step(0.05, { x: 0, z: 0 }); // 집어 든 물건은 0.3초 동안 손으로 옮겨 온다(순간이동하지 않게)
    const c = s.w.player.userData.carry;
    ok(c && c.obj === sc.bundles[0], 'carrying the bundle');
    ok(handsNear(s.w.player, sc.bundles[0])[1] < 0.7, 'in hand');
    const g2 = s.w.getGoal(); s.w.player.position.set(g2.x, 0, g2.z); s.w.step(0.05, { x: 0, z: 0 });
    ok(!s.w.player.userData.carry, 'hands free after placing');
  } finally { s.done(); }
});

test('carry: 고려 3장 쇠가죽을 주우면 어깨에 메고 다니다가 둑에서 내려놓는다', async () => {
  const { default: ch3, collectHides } = await import('../chapters/ch3/chapter.js');
  const s = touchSetup({});
  try {
    const sc = ch3.buildScene(s.w, s.ctx);
    const done = collectHides(s.ctx);
    const h = sc.hides[0]; s.w.player.position.set(h.x, 0, h.z); s.w.step(0.05, { x: 0, z: 0 });
    ok(s.w.player.userData.carry, 'carrying hides after the first one');
    for (const k of sc.hides) { s.w.player.position.set(k.x, 0, k.z); s.w.step(0.05, { x: 0, z: 0 }); }
    s.w.player.position.set(sc.dam.x, 0, sc.dam.z); s.w.step(0.05, { x: 0, z: 0 });
    await done;
    ok(!s.w.player.userData.carry, 'put down at the dam');
  } finally { s.done(); }
});

test('carry: 건네받기(give)로 받은 꾸러미는 두 팔로 안고 다닌다', async () => {
  const { PLAY } = await import('../chapters/kit/play.js');
  const s = touchSetup({});
  try {
    const arena = { origin: [300, 0], ground: 'earth', bounds: { x0: -20, x1: 20, z0: -20, z1: 20 } };
    PLAY.drive(s.ctx, { arena, from: [0, 10], seconds: 60, route: [{ x: 0, z: 0, give: true }, { x: 0, z: -10 }] }, false);
    s.w.player.position.set(300, 0, 0);
    for (let i = 0; i < 30; i++) s.w.step(1 / 20, { x: 0, z: 0 });
    const c = s.w.player.userData.carry;
    ok(c && c.style === 'arms', 'held in both arms');
    ok(handsNear(s.w.player, c.obj).every(d => d < 0.7), 'at the hands');
  } finally { s.done(); }
});
