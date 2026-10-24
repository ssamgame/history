// 6장 장면: 넓은 바다. 북쪽(화면 위)으로 갈수록 남쪽 섬에 가까워지도록, 강화도 포구를 아래(+z)에,
// 진도를 가운데, 제주를 위(-z)에 둔다. 배는 늘 화면 위쪽으로 나아간다.
import * as THREE from 'three';
import { mat, makePerson } from '../../core/people.js';
import { scatter } from '../../core/props.js';
import { LOOKS } from '../../content/characters.js';
import { tent, pier, hanok, tree } from '../kit/buildings.js';
import { BUILD } from '../kit/town.js';

const PORT_Z = 70, JINDO = [-10, 4], JEJU = [6, -74];

function seeded(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }

// 고려 배: 바닥이 평평한 몸통, 비스듬한 뱃머리판(앞 +z), 노, 돛대와 대나무 살을 댄 네모 돛
function makeBoat(mk, hull, sail, parent) {
  const g = new THREE.Group(); parent.add(g);
  mk(new THREE.BoxGeometry(1.5, 0.35, 3.6), hull, 0, -0.05, 0, g);
  for (const sx of [-1, 1]) mk(new THREE.BoxGeometry(0.14, 0.7, 4.2), hull, sx * 0.88, 0.2, 0, g).rotation.z = sx * -0.15;
  mk(new THREE.BoxGeometry(1.8, 0.75, 0.14), hull, 0, 0.25, 2.12, g).rotation.x = -0.5;
  mk(new THREE.BoxGeometry(1.7, 0.7, 0.14), hull, 0, 0.25, -2.1, g).rotation.x = 0.4;
  mk(new THREE.BoxGeometry(1.6, 0.08, 3.8), 0x8a6a45, 0, 0.42, 0, g);
  for (const sx of [-1, 1]) for (const z of [-0.8, 0.6]) { const o = mk(new THREE.BoxGeometry(0.05, 0.05, 1.6), 0x6b4a32, sx * 1.3, 0.2, z, g); o.rotation.set(0, Math.PI / 2, sx * 0.4); }
  mk(new THREE.CylinderGeometry(0.07, 0.09, 3.6, 6), 0x5a3f2a, 0, 2.2, 0.2, g);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.2), new THREE.MeshLambertMaterial({ color: sail, side: THREE.DoubleSide }));
  s.position.set(0, 2.5, 0.25); g.add(s);
  for (let i = 0; i < 5; i++) mk(new THREE.BoxGeometry(1.9, 0.04, 0.04), 0x7a6a4a, 0, 1.5 + i * 0.5, 0.27, g); // 돛에 댄 대나무 살
  return g;
}

export function buildCh6Scene(world) {
  const L = world.level, rand = seeded(41);
  const mk = (geo, color, x, y, z, parent = L, cast = true) => {
    const m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
  };
  world.bounds = { x0: -18, x1: 18, z0: 64, z1: 86 };

  // 바다 (물결)
  const seaGeo = new THREE.PlaneGeometry(340, 340, 50, 50); seaGeo.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(seaGeo, new THREE.MeshPhongMaterial({ color: 0x2f7fa6, shininess: 40, flatShading: true }));
  sea.position.y = -0.5; sea.receiveShadow = true; L.add(sea);

  // 강화도 포구: 땅과 부두
  mk(new THREE.BoxGeometry(60, 1, 28), 0x6f8a5a, 0, -0.5, PORT_Z + 13);
  const put = (fn, x, y, z, ry = 0, p = {}) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; L.add(g); fn(g, p); return g; };
  put(pier, 0, -0.5, PORT_Z - 4, 0, { w: 6, d: 10 }); // 기둥 위 나무 부두
  for (const [x, z] of [[-12, 80], [12, 79], [-6, 84], [8, 85]]) { put(tent, x, 0, z, 0.3 * Math.sign(x), { color: 0xd8d0bc }).scale.setScalar(0.75); world.addCollider({ x, z, r: 1.8 }); }
  // 포구 뒤 마을: 초가와 소나무(걷는 곳 바깥)
  for (const [x, z, ry] of [[-20, 90, 0.4], [-10, 91, 0.1], [11, 90.5, -0.2], [21, 89, -0.5]]) put(hanok, x, 0, z, ry + Math.PI, {});
  for (const [x, z] of [[-26, 84], [-15, 94], [0, 93], [16, 94], [27, 83]]) put(tree, x, 0, z, 0, { kind: 'pine', x, z });
  for (let i = 0; i < 5; i++) { const p = makePerson(LOOKS.sambyeolcho); p.position.set(-10 + i * 5, 0, 76 + (i % 2) * 2); p.rotation.y = Math.PI; L.add(p); }

  // 진도: 섬과 용장성 성벽
  const jindo = new THREE.Group(); L.add(jindo);
  const JX = JINDO[0] - 13, JZ = JINDO[1] - 6; // 섬은 도착 지점 서쪽에 (항로와 겹치지 않게)
  mk(new THREE.ConeGeometry(9, 7, 10), 0x5a7a4a, JX, 1.5, JZ, jindo).scale.set(1.2, 1, 1);
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const s = mk(new THREE.BoxGeometry(2.2, 1.6, 0.8), 0x8c8577, JX + Math.cos(a) * 4.5, 3.6, JZ + Math.sin(a) * 4.5, jindo); s.rotation.y = -a + Math.PI / 2; }
  world.addCollider({ x: JX, z: JZ, r: 9 });
  { const g = new THREE.Group(); g.position.set(JX, 4.4, JZ); g.scale.setScalar(0.55); jindo.add(g); hanok(g, { tile: true }); } // 용장성 안의 궁궐
  // 진도 나루: 섬에서 도착 지점 쪽으로 뻗은 나무 부두. 김통정이 이 위에 서서 배를 맞는다(바다 위에 떠 있지 않게).
  const docks = [mk(new THREE.BoxGeometry(12, 0.3, 3.2), 0x8a6a45, JINDO[0] - 4, -0.05, JINDO[1] - 3, jindo)];
  for (const dx of [-9, -5, -1]) mk(new THREE.CylinderGeometry(0.18, 0.18, 1.4, 6), 0x5a3f2a, JINDO[0] + dx, -0.5, JINDO[1] - 1.4, jindo);
  world.addCollider({ x: JINDO[0] - 6, z: JINDO[1] - 3, r: 1.6 });
  // 제주: 큰 섬과 항파두리 토성
  const jeju = new THREE.Group(); L.add(jeju);
  mk(new THREE.ConeGeometry(30, 10, 12), 0x587a48, JEJU[0], 1.5, JEJU[1] - 26, jeju).scale.set(1.6, 1, 0.9);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const s = mk(new THREE.BoxGeometry(2.4, 1.4, 1), 0x8a7356, JEJU[0] + Math.cos(a) * 8, 5.4, JEJU[1] - 24 + Math.sin(a) * 5, jeju); s.rotation.y = -a + Math.PI / 2; }
  // 제주 섬 해안: 배가 섬 안으로 들어가지 않게 막는다(도착 지점은 해안 바로 앞)
  world.addCollider({ x: JEJU[0], z: JEJU[1] - 25, r: 23 });
  for (const dx of [-26, 26]) world.addCollider({ x: JEJU[0] + dx, z: JEJU[1] - 24, r: 18 });

  // 섬의 소나무 (섬 원뿔 높이에 맞춰), 포구의 풀과 매어 둔 배, 부두의 짐
  {
    const jindoH = (x, z) => 5 - 7 * Math.hypot((x - JX) / 1.2, z - JZ) / 9;
    scatter(world, { kind: 'pine', count: 16, area: { x0: JX - 10, x1: JX + 10, z0: JZ - 9, z1: JZ + 9 }, avoid: [{ x: JX, z: JZ, r: 5.5 }], seed: 71, ground: jindoH, scale: [0.6, 1] });
    const jejuH = (x, z) => 6.5 - 10 * Math.hypot((x - JEJU[0]) / 1.6, (z - JEJU[1] + 26) / 0.9) / 30;
    scatter(world, { kind: 'pine', count: 40, area: { x0: JEJU[0] - 44, x1: JEJU[0] + 44, z0: JEJU[1] - 50, z1: JEJU[1] - 4 }, avoid: [{ x: JEJU[0], z: JEJU[1] - 24, r: 11 }, { x: JEJU[0], z: JEJU[1], r: 6 }], seed: 72, ground: jejuH, scale: [1, 1.5] });
    scatter(world, { kind: 'grass', count: 90, area: { x0: -28, x1: 28, z0: 72, z1: 96 }, avoid: [{ x: 0, z: PORT_Z, r: 4 }, { x: 0, z: 80, r: 3 }], seed: 73, color: 0x7f9a52 });
    scatter(world, { kind: 'rock', count: 14, area: { x0: -30, x1: 30, z0: 66, z1: 70 }, avoid: [{ x: 0, z: 68, r: 5 }], seed: 74, scale: [0.6, 1.4] });
    for (const [x, z, ry] of [[-8, PORT_Z - 5, 0.3], [9, PORT_Z - 6, -0.2]]) {
      const b = makeBoat(mk, 0x6b4a32, 0xd8d0bc, L); b.position.set(x, -0.3, z); b.rotation.y = ry;
      world.addCollider({ x, z, r: 1.8 });
    }
    for (const [x, z] of [[-1.6, PORT_Z - 1], [1.7, PORT_Z - 2.5], [-1.5, PORT_Z - 6.5]]) {
      mk(new THREE.CylinderGeometry(0.34, 0.3, 0.75, 9), 0x7a4e32, x, 0.48, z);
      mk(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 9), 0x3a2c20, x, 0.66, z);
    }
    put(BUILD.rice, 1.6, 0, PORT_Z - 6, 0.2, { n: 3 }); // 배에 실을 쌀가마
  }

  // 바위 (부딪히면 돌아가야 한다) — 출발점과 도착점을 잇는 곧은 길 위에는 두지 않는다
  for (const [x, z, r] of [[12, 44], [-22, 30], [16, 18], [-20, -20], [22, -40], [-14, -52], [24, 6]]) {
    mk(new THREE.DodecahedronGeometry(1.8, 0), 0x6b6862, x, 0.2, z);
    world.addCollider({ x, z, r: 2.2 });
    void r;
  }

  // 플레이어가 탄 배 (항해 중에만 보인다)
  const boat = makeBoat(mk, 0x6b4a32, 0xe8e2d6, L); boat.visible = false;
  const crew = makePerson(LOOKS.sambyeolcho); crew.scale.setScalar(0.8); crew.position.set(0, 0.4, -1.1); crew.userData.noWalk = true; boat.add(crew); // 배에 탄 사람은 걷지 않는다
  // 뒤쫓는 배 3척
  // 뒤쫓는 배에는 몽골 군사 두 명이 타고 있다(창을 든 병사)
  const pursuers = [0, 1, 2].map(() => {
    const b = makeBoat(mk, 0x2a2a30, 0x3e4a5c, L); b.visible = false;
    for (const [x, z] of [[-0.35, 0.6], [0.35, -0.9]]) {
      const m = makePerson({ ...LOOKS.mongol, gear: 'spear' }); m.scale.setScalar(0.8); m.position.set(x, 0.4, z); m.userData.noWalk = true; m.name = 'enemy'; b.add(m);
    }
    return b;
  });

  // 도착 지점 원
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.2, 32), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.visible = false; L.add(ring);

  world.addNpc('baejungson', LOOKS.baejungson, 0, PORT_Z, Math.PI);
  world.addNpc('sambyeolcho', LOOKS.sambyeolcho, 6, 74, Math.PI * 0.8);
  world.addNpc('kimtongjeong', LOOKS.kimtongjeong, JINDO[0], JINDO[1] - 3, 0);
  world.npcs.get('kimtongjeong').mesh.visible = false;

  const sp = seaGeo.attributes.position;
  let sailing = false;
  world.onUpdate((dt, t) => {
    if (world.quality.water === 'waves') {
      for (let i = 0; i < sp.count; i++) sp.setY(i, Math.sin(sp.getX(i) * 0.15 + t * 1.2) * 0.18 + Math.cos(sp.getZ(i) * 0.2 + t) * 0.12);
      sp.needsUpdate = true;
    }
    if (ring.visible) ring.material.opacity = 0.55 + Math.sin(t * 4) * 0.3;
    if (sailing) {
      boat.position.set(world.player.position.x, -0.3 + Math.sin(t * 2) * 0.08, world.player.position.z);
      boat.rotation.y = world.player.rotation.y;
    }
  });

  return {
    boat, pursuers, ring, jindo, jeju, docks,
    setSailing(b) { sailing = b; boat.visible = b; world.player.visible = !b; },
    portBounds: { x0: -18, x1: 18, z0: 64, z1: 86 },
    seaBounds: { x0: -40, x1: 40, z0: -84, z1: 66 },
    legs: [
      { name: '진도', from: [0, 61], to: { x: JINDO[0], z: JINDO[1], r: 2.4 }, chasers: [[-22, 58], [22, 56], [-26, 40]] },
      { name: '제주', from: [JINDO[0], -4], to: { x: JEJU[0], z: JEJU[1], r: 2.4 }, chasers: [[-26, -6], [20, -10], [-28, -30]] },
    ],
    start: [0, 80],
  };
}
