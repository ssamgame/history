// 조선편 6장 장면: 가을의 수원 화성 공사장. 북쪽에 쌓는 중인 성벽(빈자리 셋)과 서쪽 성문, 성벽 위를 가로지르는 거중기,
// 돌 더미와 수레, 정조가 머무는 차일.
import * as THREE from 'three';
import { surroundings } from '../../kit/terrain.js';
import { curvedHipRoof, cart as cartModel, woodpile, jars } from '../../kit/buildings.js';
import { sceneGround } from '../../kit/terrain.js';
import { mat, makePerson } from '../../../core/people.js';
import { scatter } from '../../../core/props.js';
import { LOOKS } from '../../../content/characters.js';
import { hwaseongGate } from '../landmarks.js';
import { addSigns } from '../common.js';

export const WALL_Z = -10, WALL_H = 3.6;
export const GAPS = [-6, 0, 6];          // 성벽 빈자리(가운데 x)
export const TRACK = [-10, 10];          // 거중기 돌이 지나가는 x 범위(화면에 다 들어오게 좁힘)

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
  // 거중기: 성벽 뒤에 선 두 기둥과 그 위를 가로지르는 들보, 들보를 따라 움직이는 도르래 수레와 매단 돌
  const crane = new THREE.Group(); L.add(crane);
  for (const x of [TRACK[0] - 1, TRACK[1] + 1]) for (const dz of [-1.4, 1.4]) {
    const leg = mk(new THREE.CylinderGeometry(0.16, 0.2, 9, 6), 0x7a5a3c, x, 4.5, WALL_Z + dz, crane); leg.rotation.x = dz * 0.04;
  }
  mk(new THREE.BoxGeometry(TRACK[1] - TRACK[0] + 3, 0.4, 0.4), 0x6b4a32, 0, 9, WALL_Z - 1.4, crane);
  mk(new THREE.BoxGeometry(TRACK[1] - TRACK[0] + 3, 0.4, 0.4), 0x6b4a32, 0, 9, WALL_Z + 1.4, crane);
  const trolley = new THREE.Group(); trolley.position.set(TRACK[0], 0, WALL_Z); crane.add(trolley);
  mk(new THREE.BoxGeometry(1.2, 0.4, 3.2), 0x5e432c, 0, 9.3, 0, trolley);
  for (const dz of [-0.5, 0.5]) { const p = mk(new THREE.CylinderGeometry(0.32, 0.32, 0.16, 12), 0x8a6a45, 0, 8.6, dz, trolley); p.rotation.x = Math.PI / 2; } // 위 도르래
  const rope = mk(new THREE.CylinderGeometry(0.03, 0.03, 1, 4), 0xd8c9a0, 0, 7, 0, trolley, false);
  const lower = new THREE.Group(); trolley.add(lower);
  for (const dz of [-0.4, 0.4]) { const p = mk(new THREE.CylinderGeometry(0.26, 0.26, 0.14, 12), 0x8a6a45, 0, 0, dz, lower); p.rotation.x = Math.PI / 2; } // 아래(움직) 도르래
  const stone = mk(new THREE.BoxGeometry(2, 1.2, 2.4), 0xb3ada2, 0, -1.0, 0, lower); // 성벽 돌과 같은 돌
  // 갈고리와 돌을 묶은 줄(인형뽑기의 집게처럼 돌을 잡는다)
  mk(new THREE.TorusGeometry(0.22, 0.05, 6, 12), 0x3a3a3a, 0, -0.3, 0, lower);
  for (const sx of [-0.7, 0.7]) mk(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 4), 0xd8c9a0, sx * 0.6, -0.55, 0, lower, false).rotation.z = sx * 0.9;
  // 거중기 아래 땅의 돌 더미(여기서 돌을 집어 올린다)
  for (const [dx, dz] of [[-0.6, 1.8], [0.9, 2.2], [0.1, 3.3]]) mk(new THREE.BoxGeometry(2, 1.2, 2.4), 0xb3ada2, TRACK[0] + dx, 0.6, WALL_Z + dz).rotation.y = dx;
  // 돌 높이: 0 = 땅, 1 = 성벽 위로 넉넉히
  const setLift = h => { lower.userData.h = h; lower.position.y = 1.0 + h * (WALL_H + 2.2); rope.scale.y = Math.max(0.1, 8.6 - lower.position.y); rope.position.y = (8.6 + lower.position.y) / 2; };
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
  // 일하는 사람들(배경)
  for (const [x, z, ry] of [[7, -2, Math.PI], [11, 0, -Math.PI / 2], [-6, 6, 0.5], [13, 6, Math.PI * 0.8]]) { const p = makePerson(LOOKS.worker); p.position.set(x, 0, z); p.rotation.y = ry; L.add(p); }
  scatter(world, { kind: 'pine', count: 40, area: { x0: -80, x1: 80, z0: -60, z1: -16 }, seed: 101, ground: hillH, scale: [1.1, 1.7], color: 0x4f6b3a });
  scatter(world, { kind: 'bush', count: 20, area: { x0: -30, x1: 30, z0: 13, z1: 30 }, seed: 102, color: 0xb0743a });
  scatter(world, { kind: 'grass', count: 60, area: { x0: -18, x1: 18, z0: 9, z1: 14 }, seed: 103, color: 0xa89a5a });

  addSigns(world, [
    { id: 'signGate', title: '장안문', x: -14.5, z: -1.5 },
    { id: 'signUigwe', title: '화성성역의궤', x: 12.5, z: 9.5 },
    { id: 'signTangpyeong', title: '탕평비 이야기', x: -11, z: 9.5 },
  ]);

  world.addNpc('official', LOOKS.joseonOfficial, -6, 7, Math.PI);
  world.addNpc('worker', LOOKS.worker, 7, 4.5, -Math.PI / 2);
  world.addNpc('jeongyakyong', LOOKS.jeongyakyong, 2, -5, 0);
  world.addNpc('jeongjo', LOOKS.jeongjo, -10, -3, 0);

  world.onUpdate((dt, t) => { if (gapGlow.visible) gapGlow.material.opacity = 0.45 + Math.sin(t * 5) * 0.3; });
  // 천천히 움직이기: sec 동안 fn(0→1)
  const anim = (sec, fn) => new Promise(resolve => { let t = 0; const off = world.onUpdate(dt => { t = Math.min(1, t + dt / sec); fn(t); if (t >= 1) { off(); resolve(); } }); });
  const ease = t => t * t * (3 - 2 * t);
  const PICK_H = 0.6 / (WALL_H + 2.2), GAP_H = (WALL_H - 0.6) / (WALL_H + 2.2); // 돌 더미 높이, 빈자리 높이(setLift 값: 돌 가운데 높이 ÷ 들 수 있는 높이)
  const slideTo = x => { const x0 = trolley.position.x; return anim(Math.max(0.4, Math.abs(x - x0) / 12), t => { trolley.position.x = x0 + (x - x0) * ease(t); }); };
  const liftTo = h => { const h0 = lower.userData.h ?? 1; return anim(0.9, t => { const v = h0 + (h - h0) * ease(t); lower.userData.h = v; setLift(v); }); };

  surroundings(world, { bounds: world.bounds, houses: 'thatch', trees: ['pine', 'tree'], count: 10, gap: 8, seed: 19 }); // 걷는 곳 바깥에 그 장소다운 집·나무(깊이감)
  return {
    start: [0, 9], fillers, gapGlow, trolley, stone, setLift,
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
