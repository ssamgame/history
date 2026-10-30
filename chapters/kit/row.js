// 노 젓기(2026-10-30 선생님: 뱃사공이 실제로 배에 타서 노를 젓는 모습). 우리 옛 배의 노처럼 배 뒤쪽(고물)에 걸친 긴 노 하나를
// 뱃사공이 서서 좌우로 밀고 당긴다. 노깃은 늘 물속에 있고, 손잡이가 좌우로 오가는 동안 사공은 몸을 틀고 무게를 옮기며 허리를 숙였다 편다.
// 두 손은 매 프레임 노 손잡이의 실제 자리로 팔을 뻗어 쥔다(손과 노가 떨어지지 않게). 배가 빠를수록 빠르게, 서 있으면 노도 멈춘다.
// (게임 연출로 단순하게 보인 것이다. 실제 노 젓는 법은 배와 지역마다 달랐다.)
import * as THREE from 'three';
import { makePerson, mat } from '../../core/people.js';
import { LOOKS } from '../../content/characters.js';

const ARM = 0.78; // 어깨에서 손(가운데)까지
const v3 = new THREE.Vector3(), w3 = new THREE.Vector3(), S = new THREE.Vector3(), E = new THREE.Euler(), M = new THREE.Matrix4(), G = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
const HIPY = 1.05; // 사공 몸통 관절(upper) 높이(core/motion.js HIP)

// boat에 사공과 노를 단다. deckY 갑판 높이, sternZ 고물(뒤끝) z, side 노를 거는 자리(x), dir 뱃머리 쪽(+1이면 +z)
export function addSculler(boat, { look = 'villager', deckY = 0.42, sternZ = -1.7, side = 0.32, dir = 1, scale = 1 } = {}) {
  const oar = new THREE.Group(); oar.name = 'scullOar';
  oar.position.set(side, deckY + 0.28, sternZ); boat.add(oar); // 노 받침(놋좆) 자리
  const m = (geo, color, x, y, z) => { const o = new THREE.Mesh(geo, mat(color, 'wood', 'object')); o.position.set(x, y, z); o.castShadow = true; oar.add(o); return o; };
  // 노는 받침에서 뒤로 비스듬히 물속까지(노깃), 앞으로 사공 손까지(손잡이). 노 자체 좌표: +z가 손잡이 쪽
  const shaft = new THREE.CylinderGeometry(0.04, 0.05, 3.6, 6).rotateX(Math.PI / 2);
  m(shaft, 0x6b4a32, 0, 0, -0.55);
  m(new THREE.BoxGeometry(0.06, 0.32, 0.9), 0x6b4a32, 0, 0, -2.2); // 노깃
  m(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 6).rotateZ(Math.PI / 2), 0x4a3426, 0, 0, 1.22); // 손잡이(가로 막대)
  m(new THREE.BoxGeometry(0.1, 0.18, 0.1), 0x4a3426, 0, 0, 0); // 받침
  oar.rotation.order = 'YXZ'; oar.rotation.x = -0.6; // 손잡이는 위로, 노깃은 물속으로
  if (dir < 0) oar.rotation.y = Math.PI;
  const p = makePerson({ ...(typeof look === 'string' ? LOOKS[look] : look), gear: null }); // 노를 쥐는 손이라 무기는 들지 않는다
  p.userData.manual = true; p.userData.noWalk = true; // 걸음 자동 움직임 대신 아래가 몸을 맡는다
  p.scale.setScalar(scale);
  boat.add(p);
  // 사공은 노 손잡이 앞(뱃머리 쪽)에 비스듬히 서서 손잡이를 쥔다
  const grip = new THREE.Vector3(0, 0, 1.22);
  const rig = { boat, oar, person: p, ph: Math.random() * 6, k: 0, step: 0, deckY, dir, scale, grip, base: new THREE.Vector3(), last: null, speed: 0, side };
  oar.updateMatrix(); const gw = grip.clone().applyMatrix4(oar.matrix); // 손잡이의 배 위 자리
  rig.base.set(gw.x + 0.05 * dir, deckY, gw.z + 0.62 * dir);
  p.position.copy(rig.base); p.rotation.y = dir > 0 ? Math.PI * 0.92 : -Math.PI * 0.08; // 손잡이(고물 쪽)를 보고 선다
  p.userData.legs.forEach((l, i) => { l.rotation.set(0, 0, (i ? -1 : 1) * 0.14); }); // 다리를 벌려 버틴다
  rowPose(rig, 0);
  return rig;
}

// 한 번 젓기 자세: ph 박자, k 세기(0~1)
function rowPose(rig, dt) {
  const { oar, person: p, boat } = rig, u = p.userData, s = Math.sin(rig.ph), c = Math.cos(rig.ph), k = rig.k;
  oar.rotation.y = (rig.dir < 0 ? Math.PI : 0) + s * 0.26 * k; // 손잡이가 좌우로 오간다
  oar.rotation.z = c * 0.12 * k; // 노깃을 비틀어 물을 민다
  // 몸: 손잡이 쪽으로 무게를 옮기고(엉덩이째), 허리를 틀고, 미는 쪽으로 숙였다 편다
  const sway = s * k;
  boat.updateMatrixWorld(true); oar.updateMatrixWorld(true);
  const hand = oar.localToWorld(v3.copy(rig.grip));
  // 엉덩이째 손잡이 쪽으로 무게를 옮긴다(배 좌표에서 손잡이가 간 만큼 조금)
  const hb = boat.worldToLocal(w3.copy(hand));
  const ry = p.rotation.y, fx = Math.sin(ry), fz = Math.cos(ry); // 사공이 바라보는 쪽(배 좌표)
  p.position.set(rig.base.x + (hb.x - rig.base.x) * 0.6 + fx * rig.step, rig.base.y, rig.base.z + fz * rig.step);
  u.legs[0].rotation.x = 0.12 * sway; u.legs[1].rotation.x = -0.12 * sway;
  p.updateMatrixWorld(true);
  // 사공 몸 좌표에서 두 손이 쥘 자리
  const gl = p.worldToLocal(oar.localToWorld(G[0].set(-0.11, 0, rig.grip.z))), gr = p.worldToLocal(oar.localToWorld(G[1].set(0.11, 0, rig.grip.z)));
  const mid = G[2].addVectors(gl, gr).multiplyScalar(0.5), twist = Math.max(-0.7, Math.min(0.7, Math.atan2(mid.x, mid.z))); // 허리는 손잡이 쪽으로 튼다
  // 두 손이 다 닿는 허리 숙임과 반 발짝(앞뒤)을 고른다: 어깨 자리를 바로 계산해 몇 가지를 재 본다(행렬을 다시 만들지 않아 가볍다)
  let best = 0.15, bestStep = rig.step, err = 1e9;
  for (let ds = -0.1; ds <= 0.101; ds += 0.05) for (let lean = -0.35; lean <= 0.651; lean += 0.05) {
    E.set(lean, twist, sway * 0.05); M.makeRotationFromEuler(E);
    let e = 0;
    for (const [sx, g] of [[-0.5, gl], [0.5, gr]]) { // 왼팔(-x)은 왼쪽 자리, 오른팔은 오른쪽 자리
      S.set(sx, 0.6, 0).applyMatrix4(M); S.y += HIPY; S.z += ds / rig.scale;
      e = Math.max(e, Math.abs(S.distanceTo(g) - ARM));
    }
    e += Math.abs(lean - 0.2) * 0.04 + Math.abs(rig.step + ds) * 0.1;
    if (e < err) { err = e; best = lean; bestStep = rig.step + ds; }
  }
  rig.step += (Math.max(-0.25, Math.min(0.25, bestStep)) - rig.step) * Math.min(1, dt * 8 + (dt ? 0 : 1));
  u.upper.rotation.set(best, twist, sway * 0.05); p.updateMatrixWorld(true);
  // 두 팔을 손잡이 양 끝으로 뻗는다
  u.arms.forEach((a, i) => {
    const tgt = oar.localToWorld(w3.set((i ? 0.11 : -0.11), 0, rig.grip.z));
    const L = u.upper.worldToLocal(tgt).sub(a.position), n = L.length() || 1, dx = L.x / n, dy = L.y / n, dz = L.z / n;
    a.rotation.set(Math.atan2(-dz, -dy), 0, Math.asin(Math.max(-1, Math.min(1, dx))));
  });
  if (u.head) u.head.rotation.set(0.12, sway * 0.25, 0); // 시선은 앞(뱃머리 너머)
  rig.reach = err;
}

// 배의 실제 빠르기(m/s)를 재어 그만큼 젓는다. 매 프레임 부른다
export function rowStep(rig, dt) {
  if (!dt) return;
  rig.boat.getWorldPosition(v3);
  const raw = rig.last ? Math.hypot(v3.x - rig.last.x, v3.z - rig.last.z) / dt : 0;
  rig.last = (rig.last || new THREE.Vector3()).copy(v3);
  rig.speed += (Math.min(raw, 12) - rig.speed) * Math.min(1, dt * 5);
  const want = Math.min(1, rig.speed / 1.2);
  rig.k += (want - rig.k) * Math.min(1, dt * 4); // 출발할 때 힘을 주기 시작하고, 멈추면 천천히 쉰다
  rig.ph += dt * (2.2 + Math.min(4, rig.speed * 0.9)) * Math.min(1, rig.k * 2); // 빠를수록 잦게
  rowPose(rig, dt);
}

// 여러 배의 사공을 함께 움직인다(장면이 끝나면 돌려준 함수를 부른다)
export function autoRow(world, rigs) {
  return world.onUpdate(dt => { for (const r of rigs) if (r.boat.visible !== false) rowStep(r, dt); });
}
