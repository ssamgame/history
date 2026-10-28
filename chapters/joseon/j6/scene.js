// 조선편 6장 장면: 가을의 수원 화성 공사장. 북쪽에 쌓는 중인 성벽(빈자리 셋)과 서쪽 성문, 성벽 위를 가로지르는 거중기,
// 돌 더미와 수레, 정조가 머무는 차일.
import * as THREE from 'three';
import { surroundings } from '../../kit/terrain.js';
import { curvedHipRoof, cart as cartModel, woodpile, jars } from '../../kit/buildings.js';
import { sceneGround } from '../../kit/terrain.js';
import { mat, makePerson, setCarry, carryPose, gaitPose } from '../../../core/people.js';
import { scatter } from '../../../core/props.js';
import { LOOKS } from '../../../content/characters.js';
import { hwaseongGate } from '../landmarks.js';
import { addSigns } from '../common.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { labelSprite } from '../../kit/play.js';

export const WALL_Z = -10, WALL_H = 3.6;
export const GAPS = [-6, 0, 6];          // 성벽 빈자리(가운데 x)
export const TRACK = [-10, 10];          // 거중기 돌이 지나가는 x 범위(화면에 다 들어오게 좁힘)

// 밧줄 한 가닥(높이 1인 원기둥)을 두 점 a, b 사이에 놓는다
const UP = new THREE.Vector3(0, 1, 0), dirV = new THREE.Vector3();
export function ropeBetween(m, a, b) {
  dirV.subVectors(b, a); const len = dirV.length();
  m.position.addVectors(a, b).multiplyScalar(0.5);
  m.scale.set(1, Math.max(0.05, len), 1);
  if (len > 1e-6) m.quaternion.setFromUnitVectors(UP, dirV.multiplyScalar(1 / len));
}

// 도르래 묶음(J-04): 위(고정) 도르래 n개는 top에, 아래(움직) 도르래 n개는 bottom(돌과 함께 오르내리는 묶음)에 단다.
// 밧줄은 위 묶음에 묶인 끝에서 아래 바퀴 → 위 바퀴 → 아래 바퀴 … 차례로 감아 돌아 2n가닥이 돌을 받친다(n = 0이면 한 가닥).
// bottomY: bottom 안에서 아래 바퀴(n = 0이면 줄 끝)의 높이. update(y): bottom이 top 기준 높이 y에 있을 때 가닥 길이를 맞춘다.
// pullX: 당기는 끝 줄이 내려오는 x(마지막 위 바퀴의 오른쪽).
function pulleyTackle({ top, bottom, n, r, topY, bottomY, mk, x0 = 0, z = 0 }) {
  const out = { top: [], bottom: [], strands: [] };
  const wheel = (parent, x, y) => {
    const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
    mk(new THREE.CylinderGeometry(r, r, 0.1, 14), 0x8a6a45, 0, 0, 0, g).rotation.x = Math.PI / 2;
    mk(new THREE.CylinderGeometry(r * 0.32, r * 0.32, 0.15, 8), 0x3a3a3a, 0, 0, 0, g, false).rotation.x = Math.PI / 2;
    mk(new THREE.BoxGeometry(r * 1.7, 0.05, 0.12), 0x5a3f2a, 0, 0, 0, g, false); // 바퀴살(돌아가는 것이 보이게)
    return g;
  };
  const a = k => x0 + (k - (n - 1) / 2) * 4 * r; // 아래 바퀴 가운데
  const b = k => a(k) + 2 * r;                  // 위 바퀴 가운데
  for (let k = 0; k < n; k++) {
    out.top.push(wheel(top, b(k), topY));
    out.bottom.push(wheel(bottom, a(k), bottomY));
    mk(new THREE.BoxGeometry(0.05, r + 0.2, 0.05), 0x3a3a3a, b(k), topY + (r + 0.2) / 2, z + 0.09, top, false); // 위 바퀴를 매단 쇠
    mk(new THREE.BoxGeometry(0.05, r + 0.16, 0.05), 0x3a3a3a, a(k), bottomY - (r + 0.16) / 2, z + 0.09, bottom, false); // 아래 바퀴를 매단 쇠
  }
  if (n) {
    mk(new THREE.BoxGeometry(b(n - 1) - a(0) + 2 * r + 0.3, 0.1, 0.14), 0x5a3f2a, (a(0) + b(n - 1)) / 2, topY + r + 0.2, z, top); // 위 묶음 나무
    mk(new THREE.BoxGeometry(a(n - 1) - a(0) + 2 * r + 0.2, 0.1, 0.14), 0x5a3f2a, (a(0) + a(n - 1)) / 2, bottomY - r - 0.16, z, bottom); // 아래 묶음 나무
  }
  const rope = (x, yt) => { const m = mk(new THREE.CylinderGeometry(0.03, 0.03, 1, 5), 0xd8c9a0, x, yt, z + 0.06, top, false); m.userData.top = yt; out.strands.push(m); return m; };
  if (!n) rope(x0, topY);
  else for (let j = 0; j < 2 * n; j++) rope(a(0) - r + 2 * r * j, j === 0 ? topY + r + 0.15 : topY);
  out.pullX = n ? b(n - 1) + r : x0;
  out.update = y => { const yb = y + bottomY; for (const m of out.strands) { const yt = m.userData.top; m.scale.y = Math.max(0.05, yt - yb); m.position.y = (yt + yb) / 2; } };
  out.spin = d => { out.top.forEach(w => { w.rotation.z -= d; }); out.bottom.forEach(w => { w.rotation.z += d; }); };
  out.update(bottom.position.y);
  return out;
}

export function buildJ6Scene(world) {
  const L = world.level;
  const mk = (geo, color, x, y, z, parent = L, cast = true) => {
    const m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
  };
  const hipRoof = (w, d, h, color, x, y, z, parent = L) => curvedHipRoof(parent, w, d, h, color, x, y, z); // 처마가 들린 곡선 기와지붕
  world.bounds = { x0: -15, x1: 15, z0: -6.5, z1: 11 };

  // 땅: 풀밭과 다져진 공사장 흙
  let hillH = () => 0;
  {
    hillH = sceneGround(L, { bounds: world.bounds, margin: 9, color: 0x80854d }); // 바깥은 가을 언덕과 먼 산
    mk(new THREE.BoxGeometry(36, 0.05, 22), 0x8f7556, 0, 0.025, 1, L, false);
  }
  // 쌓는 중인 성벽: 빈자리 셋을 남기고 돌을 쌓았다. 빈자리를 채울 돌은 처음엔 숨김.
  const fillers = [];
  for (let x = -17; x <= 17; x += 2) {
    if (GAPS.some(g => Math.abs(x - g) < 1.1)) continue;
    mk(new THREE.BoxGeometry(2, WALL_H, 2.4), 0xb3ada2, x, WALL_H / 2, WALL_Z);
  }
  for (const g of GAPS) {
    mk(new THREE.BoxGeometry(2, WALL_H - 1.2, 2.4), 0xb3ada2, g, (WALL_H - 1.2) / 2, WALL_Z); // 빈자리 아래쪽은 이미 쌓임
    const f = mk(new THREE.BoxGeometry(2, 1.2, 2.4), 0xb3ada2, g, WALL_H - 0.6, WALL_Z); f.visible = false; fillers.push(f); // 성벽 돌과 같은 돌·무늬
  }
  for (let x = -17; x <= 17; x += 2) world.addCollider({ x, z: WALL_Z, r: 1.3 });
  // 빈자리 표시(빛나는 테두리)
  const gapGlow = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.2, 2.5), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.7 }));
  gapGlow.visible = false; L.add(gapGlow);
  // 북문 장안문: 2층 문루와 성 밖(북쪽)을 둘러싼 반달 옹성
  const gate = hwaseongGate(); gate.position.set(-22, 0, WALL_Z); gate.rotation.y = Math.PI; L.add(gate);
  // 거중기(J-04): 성벽 앞뒤로 선 네 기둥과 X자 버팀목, 그 위를 가로지르는 두 들보, 들보를 따라 움직이는 수레.
  // 수레에는 위 도르래 넷(고정), 매단 돌에는 아래 도르래 넷(움직)이 있고 밧줄 여덟 가닥이 둘 사이를 감아 돈다. 끝 줄은 물레로 간다
  const crane = new THREE.Group(); L.add(crane);
  for (const x of [TRACK[0] - 1, TRACK[1] + 1]) {
    for (const dz of [-1.4, 1.4]) { const leg = mk(new THREE.CylinderGeometry(0.16, 0.2, 9, 6), 0x7a5a3c, x, 4.5, WALL_Z + dz, crane); leg.rotation.x = dz * 0.04; }
    mk(new THREE.BoxGeometry(0.3, 0.3, 3.4), 0x6b4a32, x, 8.85, WALL_Z, crane); // 두 기둥을 잇는 머리 보
    for (const s of [-1, 1]) { const b = mk(new THREE.BoxGeometry(0.12, 5.2, 0.12), 0x6b4a32, x, 6.2, WALL_Z, crane); b.rotation.x = s * 0.5; } // X자 버팀목
    const inward = x < 0 ? 1 : -1;
    for (const dz of [-1.4, 1.4]) { const b = mk(new THREE.BoxGeometry(0.12, 1.85, 0.12), 0x6b4a32, x + inward * 0.6, 8.3, WALL_Z + dz, crane); b.rotation.z = -inward * 0.86; } // 기둥과 들보 사이 받침
  }
  mk(new THREE.BoxGeometry(TRACK[1] - TRACK[0] + 3, 0.4, 0.4), 0x6b4a32, 0, 9, WALL_Z - 1.4, crane);
  mk(new THREE.BoxGeometry(TRACK[1] - TRACK[0] + 3, 0.4, 0.4), 0x6b4a32, 0, 9, WALL_Z + 1.4, crane);
  const trolley = new THREE.Group(); trolley.position.set(TRACK[0], 0, WALL_Z); crane.add(trolley);
  mk(new THREE.BoxGeometry(3.9, 0.35, 3.2), 0x5e432c, 0.2, 9.35, 0, trolley);
  for (const dz of [-1.1, 1.1]) mk(new THREE.BoxGeometry(3.9, 0.18, 0.2), 0x4a3322, 0.2, 9.1, dz, trolley); // 수레 바퀴 틀
  const lower = new THREE.Group(); trolley.add(lower);
  const tackle = pulleyTackle({ top: trolley, bottom: lower, n: 4, r: 0.2, topY: 8.6, bottomY: 0, mk });
  const stone = mk(new THREE.BoxGeometry(2, 1.2, 2.4), 0xb3ada2, 0, -1.0, 0, lower); // 성벽 돌과 같은 돌
  // 아래 도르래 묶음의 갈고리와 돌을 묶은 줄(인형뽑기의 집게처럼 돌을 잡는다)
  mk(new THREE.TorusGeometry(0.22, 0.05, 6, 12), 0x3a3a3a, 0, -0.3, 0, lower);
  for (const sx of [-0.7, 0.7]) mk(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 4), 0xd8c9a0, sx * 0.6, -0.55, 0, lower, false).rotation.z = sx * 0.9;
  // 끝 줄: 위 도르래 마지막 바퀴에서 물레 통으로(수레가 움직이면 따라 기운다)
  const pull = mk(new THREE.CylinderGeometry(0.035, 0.035, 1, 5), 0xd8c9a0, 0, 0, 0, trolley, false);
  const WINCH_AT = new THREE.Vector3(3, 1.1, WALL_Z + 2.8);
  const pullFrom = new THREE.Vector3(tackle.pullX, 8.6, 0), pullTo = new THREE.Vector3();
  const updatePull = () => { pullTo.set(WINCH_AT.x - trolley.position.x, WINCH_AT.y, WINCH_AT.z - WALL_Z); ropeBetween(pull, pullFrom, pullTo); };
  updatePull();
  // 거중기 아래 땅의 돌 더미(여기서 돌을 집어 올린다)
  for (const [dx, dz] of [[-0.6, 1.8], [0.9, 2.2], [0.1, 3.3]]) mk(new THREE.BoxGeometry(2, 1.2, 2.4), 0xb3ada2, TRACK[0] + dx, 0.6, WALL_Z + dz).rotation.y = dx;
  // 돌 높이: 0 = 땅, 1 = 성벽 위로 넉넉히. 밧줄 여덟 가닥이 함께 늘었다 줄었다 하고 도르래가 돈다
  const setLift = h => { const y0 = lower.position.y; lower.userData.h = h; lower.position.y = 1.0 + h * (WALL_H + 2.2); tackle.update(lower.position.y); tackle.spin((lower.position.y - y0) / 0.2); };
  setLift(1);
  // 돌 더미, 수레, 정조의 차일
  for (const [x, z] of [[8, 2], [10, 3.5], [9, 0.5], [-9, 3], [-10.5, 1.5]]) mk(new THREE.BoxGeometry(1.8, 1, 1.4), 0xc9c2b4, x, 0.5, z).rotation.y = x;
  world.addCollider({ x: 9, z: 2, r: 2 }); world.addCollider({ x: -10, z: 2.3, r: 1.6 });
  const cart = new THREE.Group(); cart.position.set(4, 0, 5); cart.rotation.y = 0.4; L.add(cart);
  cartModel(cart); mk(new THREE.BoxGeometry(1.2, 0.7, 1.4), 0xc9c2b4, 0, 1.3, -0.2, cart); // 돌을 실은 수레
  world.addCollider({ x: 4, z: 5, r: 1.4 });
  // 공사장 살림: 목재·장작 더미, 일꾼이 마실 물 항아리, 성벽 위 공사 깃발
  const put = (fn, x, z, ry = 0, p = {}, r = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; L.add(g); fn(g, p); if (r) world.addCollider({ x, z, r }); return g; };
  put(woodpile, -13.5, 5, 0.3, {}, 0.8); put(woodpile, 13.5, -3.5, -0.4, {}, 0.8); put(jars, 15, 6.5, -Math.PI / 2, { n: 3 }, 0.9);
  for (const [x, c] of [[-14, 0xd9a441], [14, 0xa8392b]]) {
    mk(new THREE.CylinderGeometry(0.07, 0.07, 3.4, 5), 0x5a3f2a, x, WALL_H + 1.7, WALL_Z);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6).translate(0.6, 0, 0), new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide })); f.position.set(x, WALL_H + 2.6, WALL_Z); L.add(f);
  }
  const tent = new THREE.Group(); tent.position.set(-10, 0, -3); L.add(tent);
  for (const [dx, dz] of [[-2, -1.6], [2, -1.6], [-2, 1.6], [2, 1.6]]) mk(new THREE.CylinderGeometry(0.08, 0.08, 3, 6), 0x5a3f2a, dx, 1.5, dz, tent);
  const cloth = mk(new THREE.BoxGeometry(4.8, 0.08, 4), 0xe6dcc3, 0, 3, 0, tent); cloth.rotation.z = 0.04;
  mk(new THREE.BoxGeometry(2.2, 0.2, 1.6), 0xa8392b, 0, 0.1, 0, tent, false); // 깔개
  // (J-01) 까닭 없이 팔을 올렸다 내리던 배경 일꾼(망치 없는 망치질·빈손 나르기)은 뺐다. 대신 돌을 나르는 백성(아래 carriers)
  scatter(world, { kind: 'pine', count: 40, area: { x0: -80, x1: 80, z0: -60, z1: -16 }, seed: 101, ground: hillH, scale: [1.1, 1.7], color: 0x4f6b3a });
  scatter(world, { kind: 'bush', count: 20, area: { x0: -30, x1: 30, z0: 13, z1: 30 }, seed: 102, color: 0xb0743a });
  scatter(world, { kind: 'grass', count: 60, area: { x0: -18, x1: 18, z0: 9, z1: 14 }, seed: 103, color: 0xa89a5a });

  // 장안문 간판(C-03): 길 위 안내판 대신 문루 2층 처마 아래에 이름만(성문 이야기는 화성 둘러보기 해설에 있다)
  addSigns(world, [{ id: 'plaqueGate', title: '장안문', x: -22, z: -6, ry: 0, plaque: { y: 9.0, back: 2.85 } }]);

  // 공사장 문(시작 장면, D-27): 남쪽 나무 울타리 사이 문과 「수원 화성」 이름판
  const GATE_Z = 11.6;
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 5; k++) mk(new THREE.CylinderGeometry(0.15, 0.17, 1.4, 6), 0x6b4a32, sx * (2.4 + k * 1.7), 0.7, GATE_Z);
    mk(new THREE.BoxGeometry(7, 0.12, 0.1), 0x5a3f2a, sx * 5.8, 1.05, GATE_Z);
    mk(new THREE.BoxGeometry(0.32, 2.3, 0.32), 0x5a3f2a, sx * 2.05, 1.15, GATE_Z);
  }
  const yardGate = gateLeaves(L, { x: 0, z: GATE_Z, width: 3.7, height: 1.9, color: 0x6b4a32, inward: 1 });
  nameBoard(L, '수원 화성', 2.8, 9.8); // S39

  // 도르래 세 틀(D-27): 정약용 곁. 가(도르래 없음)·나(움직도르래 1)·다(움직도르래 2), 같은 돌. 학생이 당기면 돌이 올라간다
  const PULLEYS = [{ x: -3.5, n: 0, label: '가' }, { x: 1, n: 1, label: '나' }, { x: 5.5, n: 2, label: '다' }].map(r => {
    const g = new THREE.Group(); g.position.set(r.x, 0, -3.6); L.add(g);
    // 나무 틀(J-04): 양쪽에 앞뒤로 벌린 A자 다리, 다리를 잇는 가로대와 받침 나무, 위 보
    for (const sx of [-1.05, 1.05]) {
      for (const dz of [-0.45, 0.45]) { const leg = mk(new THREE.BoxGeometry(0.13, 3.5, 0.13), 0x7a5a3c, sx, 1.72, dz / 2, g); leg.rotation.x = -dz * 0.29; }
      mk(new THREE.BoxGeometry(0.1, 0.1, 0.8), 0x6b4a32, sx, 0.9, 0, g);
      mk(new THREE.BoxGeometry(0.16, 0.12, 1.2), 0x5a3f2a, sx, 0.06, 0, g);
    }
    mk(new THREE.BoxGeometry(2.4, 0.2, 0.22), 0x6b4a32, 0, 3.45, 0, g);
    const load = new THREE.Group(); g.add(load); // 돌과 움직도르래(함께 올라간다)
    mk(new THREE.BoxGeometry(0.8, 0.6, 0.6), 0xb3ada2, 0, 0.3, 0, load);
    for (const sx of [-0.22, 0.22]) mk(new THREE.BoxGeometry(0.05, 0.62, 0.62), 0xd8c9a0, sx, 0.3, 0, load, false); // 돌을 묶은 줄
    const t = pulleyTackle({ top: g, bottom: load, n: r.n, r: 0.18, topY: r.n ? 3.05 : 3.35, bottomY: r.n ? 0.95 : 0.6, mk });
    const pull = mk(new THREE.CylinderGeometry(0.03, 0.03, 1, 5), 0xd8c9a0, 0, 0, 0, g, false); // 당기는 끝 줄: 학생 손 쪽으로
    ropeBetween(pull, new THREE.Vector3(t.pullX, r.n ? 3.05 : 3.35, 0.06), new THREE.Vector3(t.pullX + 0.25, 1.15, 1.7));
    const lab = labelSprite(r.label, { size: 0.8 }); lab.position.set(-1.5, 2.7, 0); g.add(lab);
    world.addCollider({ x: r.x, z: -3.6, r: 1.1 });
    const setH = h => { const d = h - load.position.y; load.position.y = h; t.update(h); t.spin(d / 0.18); };
    setH(0);
    return { ...r, z: -3.6, g, load, setH, wheels: { top: t.top, bottom: t.bottom }, strands: t.strands }; // g를 돌려줘야 굳히기(bake)에 합쳐지지 않아 통째로 숨길 수 있다
  });

  // 거중기 물레(D-27): 거중기 왼쪽 기둥 곁. 손잡이를 돌리면 매단 돌이 올라간다
  const winch = new THREE.Group(); winch.position.set(3, 0, WALL_Z + 2.8); L.add(winch); // 빈자리 둘 사이, 앞을 가리는 건물이 없는 곳
  for (const sx of [-0.7, 0.7]) mk(new THREE.BoxGeometry(0.16, 1.2, 0.16), 0x7a5a3c, sx, 0.6, 0, winch);
  const drum = new THREE.Group(); drum.position.y = 1.1; winch.add(drum);
  { const d = mk(new THREE.CylinderGeometry(0.28, 0.28, 1.3, 10), 0x8a6a45, 0, 0, 0, drum); d.rotation.z = Math.PI / 2;
    for (let k = 0; k < 4; k++) { const sp = mk(new THREE.BoxGeometry(0.08, 1.3, 0.08), 0x5a3f2a, 0.72, 0, 0, drum); sp.rotation.x = k * Math.PI / 4; } } // 손잡이 살(돌리는 막대)
  world.addCollider({ x: 3, z: WALL_Z + 2.8, r: 0.8 });

  world.addNpc('official', LOOKS.joseonOfficial, -6, 7, Math.PI);
  world.addNpc('worker', LOOKS.worker, 7, 4.5, -Math.PI / 2);
  world.addNpc('jeongyakyong', LOOKS.jeongyakyong, -6.6, -4.6, Math.PI * 0.3); // 도르래 틀 곁
  world.addNpc('jeongjo', LOOKS.jeongjo, -10, -3, 0);

  // 돌 나르는 백성(J-02): 동쪽 돌 더미에서 돌을 안아 들고 걸어가 거중기 옆 돌무더기에 내려놓고, 빈손으로 돌아와 다시 든다.
  // 놓인 돌은 쌓이고, 얼마쯤 지나면 하나씩 줄어든다(거중기로 가져다 쓴다). 걸음·들기·내려놓기는 사람마다 박자가 다르다
  const pileAt = new THREE.Vector3(-7.4, 0, -7.4);
  const yardPileGroup = new THREE.Group(); yardPileGroup.position.copy(pileAt); yardPileGroup.rotation.y = 0.25; L.add(yardPileGroup);
  const SLOTS = [[-0.66, 0, 0.05], [0, 0, 0.1], [0.66, 0, 0], [-0.33, 0, -0.5], [0.36, 0, -0.48], [-0.3, 1, -0.2], [0.34, 1, -0.16]];
  const pileStones = SLOTS.map(([x, l, z], i) => { const m = mk(new THREE.BoxGeometry(0.6, 0.4, 0.46), 0xb3ada2, x, 0.2 + l * 0.4, z, yardPileGroup); m.rotation.y = (i % 3 - 1) * 0.2; return m; });
  let pileN = 3, pileClock = 0;
  const showPile = () => pileStones.forEach((m, i) => { m.visible = i < pileN; });
  showPile();
  const yardPile = {
    group: yardPileGroup, stones: pileStones, max: SLOTS.length, count: () => pileN,
    add() { if (pileN >= SLOTS.length) pileN -= 1; pileN += 1; showPile(); pileClock = 0; },
    take() { if (pileN > 2) { pileN -= 1; showPile(); } },
  };
  const ROUTE = [[7.3, 0.2], [6.3, -5.5], [-4.6, -5.9], [-6.8, -6.5]].map(([x, z]) => new THREE.Vector3(x, 0, z));
  const carriers = [0, 0.37, 0.71].map((k, i) => {
    const p = makePerson(LOOKS.worker);
    const u = p.userData;
    u.manual = true; // 걸음·몸짓은 아래 stepCarrier가 직접 맡는다
    const seg = Math.max(1, ROUTE.length - 1 - Math.floor(k * (ROUTE.length - 1)));
    u.job = { phase: 'back', seg, t: 0, wait: k * 4, ph: i * 1.7, speed: 1.5 + i * 0.12, did: false };
    u.load = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.46), mat(0xb3ada2)); u.load.castShadow = true;
    p.position.copy(ROUTE[seg]);
    L.add(p); return p;
  });
  const legsPose = (p, crouch) => { // 쪼그려 앉기(0~1): 허벅지는 앞으로, 무릎은 굽히고, 빈손이면 팔을 앞으로 뻗는다
    const u = p.userData;
    u.legs.forEach(l => { l.rotation.x = -0.95 * crouch; if (l.userData.knee) l.userData.knee.rotation.x = 1.7 * crouch; });
    if (u.carry) carryPose(p, 0, 0);
    else if (u.arms) u.arms.forEach(a => { a.rotation.set(-1.25 * crouch, 0, 0); });
    p.position.y = -0.38 * crouch;
  };
  const stepCarrier = (p, dt) => {
    const u = p.userData, j = u.job;
    if (j.wait > 0) { j.wait -= dt; return; }
    if (j.phase === 'pick' || j.phase === 'drop') { // 쪼그려 앉아 돌을 들거나 내려놓고 일어선다
      j.t += dt / 1.3; u.walking = false;
      if (j.t >= 0.5 && !j.did) { j.did = true; if (j.phase === 'pick') setCarry(p, u.load, 'arms'); else { setCarry(p, null); yardPile.add(); } }
      legsPose(p, Math.sin(Math.min(1, j.t) * Math.PI));
      if (j.t >= 1) { legsPose(p, 0); j.did = false; j.t = 0; j.phase = j.phase === 'pick' ? 'to' : 'back'; }
      return;
    }
    // 걷기: 'to'는 길을 따라 돌무더기로(돌을 안고 조금 느리게), 'back'은 거꾸로 돌 더미로
    const fwd = j.phase === 'to', next = fwd ? j.seg + 1 : j.seg - 1;
    const goal = ROUTE[next], d = Math.hypot(goal.x - p.position.x, goal.z - p.position.z), v = j.speed * (fwd ? 0.82 : 1) * dt;
    let dr = Math.atan2(goal.x - p.position.x, goal.z - p.position.z) - p.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr));
    p.rotation.y += dr * Math.min(1, dt * 6);
    if (d <= v) {
      p.position.x = goal.x; p.position.z = goal.z; j.seg = next;
      if (next === ROUTE.length - 1) { j.phase = 'drop'; p.rotation.y = Math.atan2(pileAt.x - p.position.x, pileAt.z - p.position.z); }
      else if (next === 0) { j.phase = 'pick'; p.rotation.y = Math.atan2(9 - p.position.x, 0.8 - p.position.z); } // 동쪽 돌 더미를 보고 든다
    } else { p.position.x += (goal.x - p.position.x) / d * v; p.position.z += (goal.z - p.position.z) / d * v; }
    u.walking = true;
    j.ph += dt * 7.2 * (fwd ? 0.85 : 1) * (0.94 + (j.speed - 1.5) * 0.4);
    p.position.y = gaitPose(p, j.ph, 1);
  };
  let carriersOn = true;
  world.onUpdate((dt, t) => {
    if (gapGlow.visible) gapGlow.material.opacity = 0.45 + Math.sin(t * 5) * 0.3;
    if (Math.abs(trolley.position.x - (trolley.userData.px ?? 1e9)) > 1e-4) { trolley.userData.px = trolley.position.x; updatePull(); }
    if (!carriersOn || !dt) return;
    for (const p of carriers) stepCarrier(p, Math.min(dt, 0.1));
    pileClock += dt; if (pileClock > 11) { pileClock = 0; yardPile.take(); } // 거중기 쪽에서 돌을 가져다 쓴다
  });
  // 천천히 움직이기: sec 동안 fn(0→1)
  const anim = (sec, fn) => new Promise(resolve => { let t = 0; const off = world.onUpdate(dt => { t = Math.min(1, t + dt / sec); fn(t); if (t >= 1) { off(); resolve(); } }); });
  const ease = t => t * t * (3 - 2 * t);
  const PICK_H = 0.6 / (WALL_H + 2.2), GAP_H = (WALL_H - 0.6) / (WALL_H + 2.2); // 돌 더미 높이, 빈자리 높이(setLift 값: 돌 가운데 높이 ÷ 들 수 있는 높이)
  const slideTo = x => { const x0 = trolley.position.x; return anim(Math.max(0.4, Math.abs(x - x0) / 12), t => { trolley.position.x = x0 + (x - x0) * ease(t); }); };
  const liftTo = h => { const h0 = lower.userData.h ?? 1; return anim(0.9, t => { const v = h0 + (h - h0) * ease(t); lower.userData.h = v; setLift(v); }); };

  surroundings(world, { bounds: world.bounds, houses: 'thatch', trees: ['pine', 'tree'], count: 10, gap: 8, seed: 19 }); // 걷는 곳 바깥에 그 장소다운 집·나무(깊이감)
  return {
    carriers, yardPile, tackle, drum, stoneH: () => lower.userData.h,
    setCarriers(on) { carriersOn = on; carriers.forEach(p => { p.visible = on; }); },
    start: [0, 8.5], introFrom: [0, 15], yardGate, pulleys: PULLEYS, winch: { x: 3, z: WALL_Z + 4.2 }, fillers, gapGlow, trolley, stone, setLift, gate, slideTo: x => slideTo(x), liftTo: h => liftTo(h), PICK_H, GAP_H,
    // 물레를 한 번 돌린다(손잡이가 돌고 돌이 조금 올라간다)
    turnWinch(h) { const a0 = drum.rotation.x; return Promise.all([anim(0.6, t => { drum.rotation.x = a0 + ease(t) * Math.PI / 2; }), liftTo(h)]); },
    // 돌을 옆으로 옮김: 0 = 왼쪽 끝, 1 = 오른쪽 끝
    setSlide: k => { trolley.position.x = TRACK[0] + k * (TRACK[1] - TRACK[0]); },
    kOf: x => (x - TRACK[0]) / (TRACK[1] - TRACK[0]),
    showGap(i) { gapGlow.visible = i != null; if (i != null) gapGlow.position.set(GAPS[i], WALL_H - 1.15, WALL_Z); },
    fill(i, on = true) { fillers[i].visible = on; },
    wallMaterial: fillers[0].material,
    // 인형뽑기처럼: 빈 갈고리가 돌 더미 위로 가서 내려가 돌을 잡고 올라온다
    async pickUp() {
      stone.visible = false;
      await liftTo(1); await slideTo(TRACK[0] + 0.1); await liftTo(PICK_H);
      stone.visible = true; await liftTo(1);
    },
    // 지금 자리에서 줄을 풀어 돌을 빈자리에 내려놓고, 빈 갈고리를 다시 올린다
    async placeAt(i) {
      await slideTo(GAPS[i]); await liftTo(GAP_H);
      fillers[i].visible = true; stone.visible = false;
      await liftTo(1);
    },
    // 거중기 장면 카메라: 화면 비율이 달라도 돌이 지나는 길 양 끝, 빈자리 셋, 들보가 모두 보이게 맞춘다(아래쪽 큰 버튼을 피해 위쪽에)
    wallFit: { target: [0, 3.2, WALL_Z], dir: [0, 0.42, 1], margin: 0.72,
      points: [[TRACK[0], WALL_H + 2.5, WALL_Z], [TRACK[1], WALL_H + 2.5, WALL_Z], ...GAPS.map(g => [g, WALL_H - 1.2, WALL_Z]), [0, 9.4, WALL_Z]] },
  };
}
