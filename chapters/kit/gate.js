// 장 시작 장면 도우미(D-5): 문짝 두 개가 열리고 학생이 그 문을 지나 걸어 들어온다. 문 바로 안쪽 길옆에는 장소 이름판.
// 선생님 규칙: 앞으로 장을 만들 때마다 낮은 카메라(world.closeView)·이 시작 장면·정면 대화를 함께 넣는다.
import * as THREE from 'three';
import { mat } from '../../core/people.js';
import { makeSign } from '../../core/signs.js';

// 문짝 두 개(가운데 x, 문턱 z, 너비 width). 문짝은 바깥쪽 경첩에서 안쪽(-z 쪽, inward)으로 열린다. 부딪힘은 없다.
// 돌려주는 { leaves, z, setOpen(k) }을 장면이 돌려주는 객체에 넣어야 굳히기(bake)에 합쳐지지 않는다.
export function gateLeaves(parent, { x = 0, z = 0, y = 0, width = 6, height = 3, color = 0x6b4a32, inward = -1 } = {}) {
  const half = width / 2, leaves = [];
  for (const side of [-1, 1]) {
    const hinge = new THREE.Group(); hinge.name = 'gateLeaf';
    hinge.position.set(x + side * half, y, z); parent.add(hinge);
    const board = new THREE.Mesh(new THREE.BoxGeometry(half - 0.05, height, 0.22), mat(color, 'wood', 'object'));
    board.position.set(-side * (half / 2), height / 2, 0); board.castShadow = true; hinge.add(board);
    for (const hy of [0.5, height - 0.5]) { // 가로 띠장
      const bar = new THREE.Mesh(new THREE.BoxGeometry(half - 0.2, 0.18, 0.3), mat(0x4a3322, 'wood', 'object'));
      bar.position.set(-side * (half / 2), hy, 0); hinge.add(bar);
    }
    hinge.userData.openSign = side * inward; // 안쪽으로 돌아가는 방향
    leaves.push(hinge);
  }
  const gate = {
    leaves, x, z,
    setOpen(k) { k = Math.min(1, Math.max(0, k)); const e = k * k * (3 - 2 * k); for (const l of leaves) l.rotation.y = -l.userData.openSign * e * Math.PI * 0.47; },
  };
  return gate;
}

// 장소 이름판: 읽기용 i 표시(spot) 없이 그냥 세워 둔다. 앞면(+z)이 들어오는 쪽을 보게 ry로 돌린다.
export function nameBoard(parent, name, x, z, { y = 0, ry = 0 } = {}) {
  const s = makeSign(name); s.position.set(x, y, z); s.rotation.y = ry; parent.add(s); return s;
}

// 시작 장면: from(문 밖)에 세우고, 문을 openTime초 동안 연 뒤 to까지 걸어 들어온다. 그동안 입력을 막고,
// 누르거나 키를 누르면 건너뛴다(문은 활짝 열리고 학생은 to에). 걷는 곳(bounds)은 잠깐 넓혔다가 돌려놓는다.
export function enterThroughGate(ctx, { from, to, gate, openTime = 0.6, speed = 0.8 }) {
  const { world, input } = ctx;
  const b0 = world.bounds, s0 = world.speedScale;
  let dx = to[0] - from[0], dz = to[1] - from[1];
  const len = Math.hypot(dx, dz) || 1; dx /= len; dz /= len;
  input.enabled = false;
  world.bounds = { x0: Math.min(b0.x0, from[0]), x1: Math.max(b0.x1, from[0]), z0: Math.min(b0.z0, from[1]), z1: Math.max(b0.z1, from[1]) };
  world.player.position.set(from[0], 0, from[1]);
  world.player.rotation.y = Math.atan2(dx, dz);
  world.camMode = 'follow'; world.snapCamera();
  if (gate) gate.setOpen(0);
  return new Promise(resolve => {
    let off = null, t = 0;
    const end = e => {
      if (!off) return;
      off(); off = null;
      removeEventListener('keydown', end, true); removeEventListener('pointerdown', end, true);
      if (gate) gate.setOpen(1);
      world.autoMove = null; world.speedScale = s0; world.bounds = b0;
      world.player.position.set(to[0], 0, to[1]);
      if (e) world.snapCamera(); // 건너뛰면 카메라도 바로 제자리로
      resolve();
    };
    off = world.onUpdate(dt => {
      t += dt;
      if (gate) gate.setOpen(t / openTime);
      if (t >= openTime && !world.autoMove) { world.speedScale = speed; world.autoMove = { x: dx, z: dz }; }
      const p = world.player.position;
      if ((p.x - to[0]) * dx + (p.z - to[1]) * dz >= 0) end();
    });
    addEventListener('keydown', end, true); addEventListener('pointerdown', end, true);
  });
}
