// 3장 장면: 비바람 속 삼교천(고려 진영, 둑 자리, 냇물을 건너는 거란군)과 남쪽의 귀주 벌판.
import * as THREE from 'three';
import { backdropMountains } from '../kit/terrain.js';
import { groundMaterial } from '../../core/textures.js';
import { mat, makePerson } from '../../core/people.js';
import { scatter } from '../../core/props.js';
import { LOOKS, look } from '../../content/characters.js';
import { createWeather } from '../../core/weather.js';

const RIVER_Z = -8, RIVER_W = 6;
const DAM_X = -20;
const GUJU_Z = 62;

// 땅 높이(지형과 같은 식): 소품을 땅 위에 놓을 때 쓴다
function groundH(x, z) {
  let h = 0.1 * Math.sin(x * 0.4) * Math.cos(z * 0.3);
  const dr = Math.abs(z - RIVER_Z);
  if (dr < RIVER_W / 2 + 1.5) { const k = 1 - dr / (RIVER_W / 2 + 1.5); h -= k * k * (3 - 2 * k) * 1.4; }
  const far = Math.max(0, Math.abs(x) - 40, -z - 40, z - 90);
  return h + Math.min(far * far * 0.03, 14);
}

function seeded(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }

export function buildCh3Scene(world) {
  const L = world.level, rand = seeded(19);
  const mk = (geo, color, x, y, z, parent = L, cast = true) => {
    const m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
  };
  world.bounds = { x0: -28, x1: 28, z0: -3.5, z1: 14 };

  // 젖은 풀밭과 냇물 골짜기
  {
    const g = new THREE.PlaneGeometry(240, 240, 70, 70); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, cols = [], c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      let h = 0.1 * Math.sin(x * 0.4) * Math.cos(z * 0.3);
      const dr = Math.abs(z - RIVER_Z);
      if (dr < RIVER_W / 2 + 1.5) { const k = 1 - dr / (RIVER_W / 2 + 1.5); h -= k * k * (3 - 2 * k) * 1.4; }
      const far = Math.max(0, Math.abs(x) - 40, -z - 40, z - 90);
      h += Math.min(far * far * 0.03, 14);
      p.setY(i, h);
      const j = rand() * 0.04;
      if (dr < RIVER_W / 2 + 1.2 && h < 0.2) c.setRGB(0.45 + j, 0.42 + j, 0.36 + j);
      else c.setRGB(0.3 + j, 0.42 + j, 0.27 + j);
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.computeVertexNormals();
    const t = new THREE.Mesh(g, groundMaterial('grass'));
    t.receiveShadow = true; L.add(t);
  }
  const water = new THREE.Mesh(new THREE.PlaneGeometry(200, RIVER_W).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: 0x4d6a78, transparent: true, opacity: 0.88, shininess: 30 }));
  water.position.set(0, -0.45, RIVER_Z); L.add(water);

  // 고려 진영 (남쪽 강둑)
  for (const [x, z] of [[-14, 9], [-6, 12], [8, 11], [16, 8], [22, 12]]) {
    const t = mk(new THREE.ConeGeometry(2.3, 2.7, 4), 0xd8d0bc, x, 1.35, z); t.rotation.y = Math.PI / 4;
    mk(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 4), 0x5a3f2a, x, 3.0, z);
    const door = mk(new THREE.PlaneGeometry(0.85, 1.15), 0x3a2c20, 0.9, -0.72, 0.9, t, false);
    door.rotation.order = 'YXZ'; door.rotation.set(-0.54, Math.PI / 4, 0);
    world.addCollider({ x, z, r: 1.8 });
  }
  const flagPoles = [];
  for (const [x, z, c] of [[-10, 2, 0xb8452f], [0, 2, 0xd9a441], [10, 2, 0xb8452f]]) {
    mk(new THREE.CylinderGeometry(0.07, 0.07, 4.4, 5), 0x5a3f2a, x, 2.2, z);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.9).translate(0.65, 0, 0), new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }));
    f.position.set(x, 3.4, z); L.add(f); flagPoles.push(f);
  }
  // 쇠가죽 묶음 6개
  const hides = [[-24, 6], [-12, 3], [-2, 7], [6, 3.5], [14, 4], [24, 5]].map(([x, z]) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); L.add(g);
    for (let k = 0; k < 3; k++) mk(new THREE.BoxGeometry(1.1, 0.22, 0.8), [0x8a5a3a, 0x7a4e32, 0x94643f][k], 0, 0.12 + k * 0.22, 0, g).rotation.y = k * 0.4;
    return { x, z, mesh: g, taken: false };
  });
  // 둑 자리와 쇠가죽 둑 (처음엔 숨김)
  const damWall = new THREE.Group(); damWall.visible = false; L.add(damWall);
  for (let k = 0; k < 7; k++) mk(new THREE.BoxGeometry(1, 1.4, 0.5), 0x7a4e32, DAM_X, 0.2, RIVER_Z - RIVER_W / 2 + 0.5 + k * 0.85, damWall).rotation.y = Math.PI / 2;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(DAM_X, 0.08, -2.5); ring.visible = false; L.add(ring);
  // 터지는 물결
  const wave = mk(new THREE.BoxGeometry(4, 1.6, RIVER_W), 0xcfe3ec, DAM_X, 0.3, RIVER_Z, L, false);
  wave.material = new THREE.MeshLambertMaterial({ color: 0xcfe3ec, transparent: true, opacity: 0.8 });
  wave.visible = false;

  // 냇물을 건너는 거란군 (북쪽 강둑 → 남쪽)
  const zNorth = RIVER_Z - RIVER_W / 2, zSouth = RIVER_Z + RIVER_W / 2;
  const army = new THREE.Group(); L.add(army);
  for (let i = 0; i < 14; i++) {
    const k = makePerson(LOOKS.khitan);
    k.position.set(-6 + (i % 7) * 2.2, 0, -Math.floor(i / 7) * 2); k.rotation.y = 0; army.add(k);
  }
  const setCross = t => { army.position.set(4, 0, zNorth - 8 + t * (zSouth + 4 - (zNorth - 8))); };
  setCross(0);
  // 북쪽 거란 진영
  for (const [x, z] of [[-10, -30], [2, -34], [14, -31], [-20, -38], [8, -42]]) {
    mk(new THREE.CylinderGeometry(2.1, 2.1, 1.7, 9), 0x8f7556, x, 0.85, z);
    mk(new THREE.ConeGeometry(2.4, 1.5, 9), 0x5e432c, x, 2.45, z);
  }

  // 귀주 벌판: 남쪽 고려군, 북쪽 거란군, 동쪽에서 오는 지원군
  const guju = new THREE.Group(); L.add(guju);
  const gujuFlags = [], gujuKhitan = [], gujuGoryeo = [];
  for (let i = 0; i < 12; i++) {
    const p = makePerson(LOOKS.player); p.position.set(-11 + i * 2, 0, GUJU_Z + 6); p.rotation.y = Math.PI; guju.add(p); gujuGoryeo.push(p);
    const q = makePerson(LOOKS.khitan); q.position.set(-11 + i * 2, 0, GUJU_Z - 6); q.rotation.order = 'YXZ'; guju.add(q); gujuKhitan.push(q);
  }
  // 싸움 먼지: 두 군대가 부딪치는 곳에 피어오르는 흙먼지(처음엔 숨김)
  const dust = [];
  for (let i = 0; i < 10; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshLambertMaterial({ color: 0xb8a888, transparent: true, opacity: 0, depthWrite: false }));
    d.position.set(-10 + i * 2.2, 0.8, GUJU_Z); d.userData.ph = i * 0.7; d.visible = false; guju.add(d); dust.push(d);
  }
  for (const [x, c] of [[-8, 0xb8452f], [0, 0xd9a441], [8, 0xb8452f]]) {
    mk(new THREE.CylinderGeometry(0.08, 0.08, 5, 5), 0x5a3f2a, x, 2.5, GUJU_Z + 8, guju);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.2).translate(0.8, 0, 0), new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }));
    f.position.set(x, 3.8, GUJU_Z + 8); guju.add(f); gujuFlags.push(f);
  }
  const reinforcements = new THREE.Group(); reinforcements.visible = false; guju.add(reinforcements);
  for (let i = 0; i < 8; i++) {
    const p = makePerson(look('soldier', { robe: 0x3c5a7a })); p.position.set((i % 4) * 2, 0, Math.floor(i / 4) * 2); p.rotation.y = -Math.PI / 2; reinforcements.add(p);
  }
  reinforcements.position.set(30, 0, GUJU_Z + 4);

  // 빗물 웅덩이 (진영 바닥)
  {
    const puddle = new THREE.MeshPhongMaterial({ color: 0x5a6670, shininess: 90, specular: 0x9aa6b0, transparent: true, opacity: 0.75 });
    for (const [x, z, s] of [[-18, 4, 1.4], [-8, 6, 1], [2, 4.5, 1.2], [11, 6.5, 0.9], [19, 3, 1.3], [-22, 11, 1], [4, 13, 1.1], [13, 13, 0.8]]) {
      const p = new THREE.Mesh(new THREE.CircleGeometry(1, 14).rotateX(-Math.PI / 2), puddle);
      p.position.set(x, groundH(x, z) + 0.03, z); p.scale.set(s * 1.4, 1, s); p.rotation.y = x; p.receiveShadow = true; L.add(p);
    }
  }
  // 냇가 갈대와 바위, 진영의 젖은 풀, 귀주 벌판 둘레
  {
    const bank = [{ x: DAM_X, z: RIVER_Z, r: 5 }, { x: 10, z: RIVER_Z, r: 10 }];
    for (const [z0, z1, s] of [[RIVER_Z - RIVER_W / 2 - 2.6, RIVER_Z - RIVER_W / 2 - 0.4, 41], [RIVER_Z + RIVER_W / 2 + 0.4, RIVER_Z + RIVER_W / 2 + 2.2, 42]]) {
      scatter(world, { kind: 'grass', count: 110, area: { x0: -60, x1: 60, z0, z1 }, avoid: bank, seed: s, ground: groundH, scale: [1.4, 2.4], color: 0x8a9a5a });
      scatter(world, { kind: 'rock', count: 16, area: { x0: -60, x1: 60, z0, z1 }, avoid: bank, seed: s + 3, ground: groundH, scale: [0.5, 1.3] });
    }
    const keep = [[-14, 9], [-6, 12], [8, 11], [16, 8], [22, 12], [-24, 6], [-12, 3], [-2, 7], [6, 3.5], [14, 4], [24, 5], [-4, 5], [5, 7.5], [0, 10], [DAM_X, -2.5]].map(([x, z]) => ({ x, z, r: 2.6 }));
    scatter(world, { kind: 'grass', count: 120, area: { x0: -28, x1: 28, z0: -2, z1: 16 }, avoid: keep, seed: 43, ground: groundH, color: 0x6f8f4a });
    scatter(world, { kind: 'pine', count: 40, area: { x0: -70, x1: 70, z0: 20, z1: 110 }, avoid: [{ x: 0, z: GUJU_Z, r: 30 }, { x: 22, z: GUJU_Z + 18, r: 10 }], seed: 44, ground: groundH, scale: [1, 1.6] });
    scatter(world, { kind: 'grass', count: 140, area: { x0: -26, x1: 34, z0: GUJU_Z - 14, z1: GUJU_Z + 16 }, seed: 45, ground: groundH, color: 0x7a9450 });
    scatter(world, { kind: 'rock', count: 20, area: { x0: -60, x1: 60, z0: -60, z1: -16 }, seed: 46, ground: groundH, scale: [0.8, 2.2] });
  }
  const rain = createWeather(world, 'rain', { count: 900 });

  world.addNpc('gangamchan', LOOKS.gangamchan, -4, 5, 0);
  world.addNpc('soldier', LOOKS.soldier, 5, 7.5, Math.PI * 0.8);

  // 깃발 방향: 북쪽(-z)으로 휘날리면 rotation.y = +PI/2, 남쪽이면 -PI/2
  let flagDir = -Math.PI / 2;
  const scene = {
    hides, damWall, ring, wave, rain, flagPoles, gujuFlags, gujuKhitan, gujuGoryeo, reinforcements, guju, dust, gujuZ: GUJU_Z,
    dam: { x: DAM_X, z: -2.5, r: 1.6 },
    river: { army, setCross, zNorth, zSouth },
    damCam: { pos: [6, 12, 12], target: [-4, 0, -9] },
    gujuCam: { pos: [22, 10, GUJU_Z + 18], target: [0, 1, GUJU_Z] },
    gujuBounds: { x0: -12, x1: 12, z0: GUJU_Z + 7, z1: GUJU_Z + 12 },
    start: [0, 10],
    setFlags(northward) { flagDir = northward ? Math.PI / 2 : -Math.PI / 2; rain.setWind(northward ? -2 : 2); },
  };
  world.onUpdate((dt, t) => {
    for (const f of [...flagPoles, ...gujuFlags]) f.rotation.y += (flagDir + Math.sin(t * 3 + f.position.x) * 0.25 - f.rotation.y) * Math.min(1, dt * 3);
    if (ring.visible) ring.material.opacity = 0.55 + Math.sin(t * 4) * 0.3;
    hides.forEach((h, i) => { if (!h.taken) h.mesh.rotation.y = Math.sin(t + i) * 0.2; });
  });
  scene.setFlags(false);
  backdropMountains(world.level, { color: 0x4f6a42, radius: 130 }); // 먼 산줄기(깊이감)
  return scene;
}
