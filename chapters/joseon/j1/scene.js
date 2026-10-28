// 조선편 1장 장면: 장맛비 속 압록강의 섬 위화도. 고려군 진영(천막, 지휘 천막, 깃발)과 북쪽(요동 쪽)을 향해 늘어선 군사들.
// 회군 때 군사들은 돌아서서 남쪽 물길을 건너 개경 쪽으로 간다.
import * as THREE from 'three';
import { backdropMountains } from '../../kit/terrain.js';
import { tent, tree, boat, spearRack } from '../../kit/buildings.js';
import { BUILD } from '../../kit/town.js';
import { groundMaterial } from '../../../core/textures.js';
import { mat, makePerson } from '../../../core/people.js';
import { scatter } from '../../../core/props.js';
import { LOOKS, look } from '../../../content/characters.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { createWeather } from '../../../core/weather.js';

const ISLAND = { rx: 30, rz: 17 }; // 섬 크기(타원 반지름)
const SOUTH_Z = 22;                // 남쪽 물길 가운데 (회군 때 건너는 곳)

// 땅 높이: 섬 안은 거의 평평하고, 가장자리에서 물 아래로 내려간다
export function groundH(x, z) {
  const e = Math.hypot(x / ISLAND.rx, z / ISLAND.rz);
  let h = 0.12 * Math.sin(x * 0.35) * Math.cos(z * 0.4);
  if (e > 0.85) h -= Math.min(2.2, (e - 0.85) * 6);
  return h;
}

function seeded(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }

export function buildJ1Scene(world) {
  const L = world.level, rand = seeded(23);
  const mk = (geo, color, x, y, z, parent = L, cast = true) => {
    const m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
  };
  world.bounds = { x0: -20, x1: 20, z0: -11, z1: 12 };

  // 섬 땅 (젖은 풀밭, 물가는 진흙빛)
  {
    const g = new THREE.PlaneGeometry(90, 60, 72, 48); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, cols = [], c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), h = groundH(x, z);
      p.setY(i, h);
      const j = rand() * 0.04;
      if (h < -0.15) c.setRGB(0.42 + j, 0.4 + j, 0.33 + j); else c.setRGB(0.29 + j, 0.41 + j, 0.26 + j);
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.computeVertexNormals();
    const t = new THREE.Mesh(g, groundMaterial('grass'));
    t.receiveShadow = true; L.add(t);
  }
  // 압록강: 섬 둘레의 넓은 흙탕물, 강 건너 먼 산
  const water = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: 0x6b7a72, transparent: true, opacity: 0.92, shininess: 40 }));
  water.position.y = -0.55; L.add(water);
  for (const [x, z, s] of [[-60, -70, 22], [-15, -80, 28], [40, -75, 24], [80, -60, 18], [-70, 70, 20], [10, 85, 26], [70, 75, 22]]) {
    const m = mk(new THREE.ConeGeometry(s, s * 0.55, 7), 0x55624e, x, s * 0.27 - 0.6, z, L, false);
    m.rotation.y = x;
  }

  // 진영: 천막들과 가운데 지휘 천막
  // 동쪽 통로(x 2.5~12)는 비워 둔다: 회군 때 군사들이 이 길로 남쪽 물길까지 걸어간다
  const tents = [[-13, 4], [-9, -4], [-14, -7], [16, 5], [16, -3], [-6, 10], [-13, 10]];
  for (const [x, z] of tents) {
    const g = new THREE.Group(); g.position.set(x, groundH(x, z), z); g.rotation.y = rand() * 0.6 - 0.3; L.add(g); tent(g, { color: 0xd8d0bc });
    world.addCollider({ x, z, r: 1.7 });
  }
  const command = new THREE.Group(); command.position.set(0, 0, -6); L.add(command);
  mk(new THREE.CylinderGeometry(3, 3, 2.2, 8), 0xe6dcc3, 0, 1.1, 0, command);
  mk(new THREE.ConeGeometry(3.4, 1.8, 8), 0x8a2f24, 0, 3.1, 0, command);
  mk(new THREE.BoxGeometry(1.4, 1.8, 0.1), 0x3a2c20, 0, 0.9, 2.98, command, false);
  world.addCollider({ x: 0, z: -6, r: 3.1 });
  // 깃발: 비바람에 남쪽으로 날린다
  const flags = [];
  for (const [x, z, c] of [[-4, -2.6, 0xb8452f], [2.2, -3.2, 0xd9a441], [-16, 1, 0xb8452f], [16.5, 1, 0xb8452f]]) {
    mk(new THREE.CylinderGeometry(0.07, 0.07, 4.6, 5), 0x5a3f2a, x, 2.3, z);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.9).translate(0.65, 0, 0), new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }));
    f.position.set(x, 3.6, z); f.rotation.y = -Math.PI / 2; L.add(f); flags.push(f);
  }
  // 젖은 짐: 거적을 덮은 쌀가마(군량)와 창걸이
  const put = (fn, x, z, ry = 0, p = {}) => { const g = new THREE.Group(); g.position.set(x, groundH(x, z), z); g.rotation.y = ry; L.add(g); fn(g, p); return g; };
  for (const [x, z] of [[-11, 1.5], [-4, -9.5]]) { put(BUILD.rice, x, z, x, { n: 6 }); mk(new THREE.BoxGeometry(2.6, 0.08, 2.6), 0x8a7a52, x, groundH(x, z) + 1.25, z).rotation.set(0.08, x, 0.05); world.addCollider({ x, z, r: 1.3 }); }
  put(spearRack, -17.5, 5, Math.PI / 2); world.addCollider({ x: -17.5, z: 5, r: 0.9 });
  // 섬 가장자리의 버드나무와 남쪽 물가에 매어 둔 나룻배(회군하는 동쪽 길은 비운다)
  for (const [x, z] of [[-23, 2], [-21, -9], [23, -2], [22, 8], [-19, 13.5], [-8, 14.5], [17, 13.5], [-12, -13.5], [16, -13]]) { const g = put(tree, x, z, rand() * 3, { kind: 'willow', x, z }); g.position.y = Math.max(-0.3, g.position.y); }
  for (const [x, z, ry] of [[-14, 17.5, 0.5], [-5, 18, -0.2], [18, 17.5, 0.3]]) { const g = new THREE.Group(); g.position.set(x, -0.75, z); g.rotation.y = ry; L.add(g); boat(g, { len: 4.4 }); }
  // 빗물 웅덩이
  {
    const puddle = new THREE.MeshPhongMaterial({ color: 0x5a6670, shininess: 90, specular: 0x9aa6b0, transparent: true, opacity: 0.75 });
    for (const [x, z, s] of [[-7, 2, 1.3], [3, 3, 1], [9, -1, 1.2], [-2, -10, 0.9], [-16, -2, 1.1], [15, 8, 1], [0, 11, 1.2]]) {
      const p = new THREE.Mesh(new THREE.CircleGeometry(1, 14).rotateX(-Math.PI / 2), puddle);
      p.position.set(x, groundH(x, z) + 0.03, z); p.scale.set(s * 1.4, 1, s); p.rotation.y = x; p.receiveShadow = true; L.add(p);
    }
  }

  // 북쪽 강가에 요동 쪽을 향해 늘어선 군사들 (회군 때 돌아서서 남쪽으로 간다)
  const army = new THREE.Group(); L.add(army);
  for (let i = 0; i < 18; i++) {
    const s = makePerson(i % 3 === 0 ? LOOKS.archer : LOOKS.soldier);
    s.position.set((i % 6) * 1.6, 0, -Math.floor(i / 6) * 1.5); s.rotation.y = Math.PI; army.add(s);
  }
  army.position.set(3, 0, -11.2);
  const armyStart = army.position.clone();
  // 회군 장면: 0이면 북쪽 강가(북쪽을 봄), 1이면 남쪽 물길을 건너 섬 밖으로
  const setTurn = t => {
    army.children.forEach(s => { s.rotation.y = t > 0 ? 0 : Math.PI; });
    army.position.set(armyStart.x, 0, armyStart.z + t * (SOUTH_Z + 8 - armyStart.z));
  };

  // 물가 갈대와 바위, 섬의 젖은 풀, 강 건너 소나무
  {
    const keep = [...tents, [0, -6], [-11, 1.5], [-4, -9.5], [-3, 5.5], [-8, 3], [14, -9], [0, -2]].map(([x, z]) => ({ x, z, r: 2.6 }));
    scatter(world, { kind: 'grass', count: 130, area: { x0: -24, x1: 24, z0: -13, z1: 14 }, avoid: [...keep, { x: 7, z: -12, r: 6 }], seed: 51, ground: groundH, color: 0x6f8f4a });
    scatter(world, { kind: 'grass', count: 90, area: { x0: -32, x1: 32, z0: 12, z1: 18 }, seed: 52, ground: groundH, scale: [1.0, 1.6], color: 0x8a9a5a });
    scatter(world, { kind: 'grass', count: 90, area: { x0: -32, x1: 32, z0: -18, z1: -13 }, avoid: [{ x: 0, z: -12, r: 12 }], seed: 53, ground: groundH, scale: [1.0, 1.6], color: 0x8a9a5a });
    scatter(world, { kind: 'rock', count: 14, area: { x0: -34, x1: 34, z0: -18, z1: 18 }, avoid: keep, seed: 54, ground: groundH, scale: [0.5, 1.2] });
    scatter(world, { kind: 'pine', count: 30, area: { x0: -90, x1: 90, z0: 34, z1: 70 }, seed: 55, ground: () => -0.4, scale: [1.2, 1.8] });
  }
  const rain = createWeather(world, 'rain', { count: 900 });
  rain.setWind(1.5);

  // 진영 목책 문(시작 장면, D-22): 서쪽으로만 목책을 둘러 회군 때 동쪽 통로(x 2.5~12)를 가리지 않는다. 읽기 안내판은 두지 않는다
  const GATE_Z = 13.2;
  for (let k = 0; k < 7; k++) mk(new THREE.CylinderGeometry(0.16, 0.18, 1.6, 6), 0x6b4a32, -2.4 - k * 1.8, 0.7, GATE_Z);
  mk(new THREE.BoxGeometry(12.8, 0.14, 0.12), 0x5a3f2a, -8.4, 1.1, GATE_Z);
  for (const sx of [-1, 1]) mk(new THREE.BoxGeometry(0.34, 2.4, 0.34), 0x5a3f2a, sx * 2.05, 1.1, GATE_Z);
  const gate = gateLeaves(L, { x: 0, z: GATE_Z, y: -0.1, width: 3.7, height: 2, color: 0x6b4a32, inward: 1 });
  nameBoard(L, '위화도', 2.8, 11); // S23

  world.addNpc('archer', LOOKS.archer, -8, 3, Math.PI * 0.25);
  world.addNpc('soldier', look('soldier', { robe: 0x6b3a2e }), 14, -9, -Math.PI * 0.7);
  world.addNpc('yiseonggye', LOOKS.yiseonggye, 0, -2.4, 0);

  world.onUpdate((dt, t) => {
    for (const f of flags) f.rotation.y = -Math.PI / 2 + Math.sin(t * 3 + f.position.x) * 0.3;
  });

  backdropMountains(world.level, { color: 0x5a6e4a, radius: 130 }); // 먼 산줄기(깊이감)
  return {
    army, setTurn, rain, flags, gate,
    start: [0, 9], introFrom: [0, 16.5],
    turnCam: { pos: [26, 12, 16], target: [6, 0, 2] },
    turnTarget: [0, 0, 6],
  };
}
