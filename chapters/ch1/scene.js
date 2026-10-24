// 1장 장면: 노을 진 고려 진영, 강, 강 건너 거란 진영, 강동 6주 빛기둥.
import { makeSign } from '../../core/signs.js';
import * as THREE from 'three';
import { backdropMountains, surroundings } from '../kit/terrain.js';
import { curvedHipRoof } from '../kit/buildings.js';
import { groundMaterial } from '../../core/textures.js';
import { mat, makePerson, labelSprite } from '../../core/people.js';
import { scatter } from '../../core/props.js';
import { LOOKS, look } from '../../content/characters.js';

const RIVER_Z = -19.5;

function groundH(x, z) {
  let h = 0.12 * Math.sin(x * 0.45 + z * 0.2) * Math.cos(z * 0.37);
  const dr = Math.abs(z - RIVER_Z);
  if (dr < 4.6) { const k = 1 - dr / 4.6; h -= k * k * (3 - 2 * k) * 1.6; }
  const ox = Math.max(0, Math.abs(x) - 36), oz = Math.max(0, z - 38, -z - 56);
  const o = Math.hypot(ox, oz);
  if (o > 0) h += Math.min(o * o * 0.03, 14) * (0.8 + 0.35 * Math.sin(x * 0.21 + 1.3) * Math.cos(z * 0.17));
  return h;
}
function seeded(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }

export function buildCh1Scene(world) {
  const L = world.level, q = world.quality, rand = seeded(7);
  const mk = (geo, color, x, y, z, parent = L, cast = true) => {
    const m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
  };
  world.bounds = { x0: -30.8, x1: 30.8, z0: -14.4, z1: 22 };

  // 지형
  {
    const g = new THREE.PlaneGeometry(220, 220, 80, 80); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, cols = [], c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), h = groundH(x, z), j = rand() * 0.05;
      p.setY(i, h);
      if (Math.abs(z - RIVER_Z) < 4.8 && h < 0.4) c.setRGB(0.78 + j, 0.7 + j, 0.52 + j);
      else if (h > 7) c.setRGB(0.47 + j, 0.48 + j, 0.44 + j);
      else if (h > 1.5) c.setRGB(0.33 + j, 0.47 + j, 0.29 + j);
      else c.setRGB(0.33 + j, 0.52 + j, 0.24 + j);
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.computeVertexNormals();
    const t = new THREE.Mesh(g, groundMaterial('grass'));
    t.receiveShadow = true; L.add(t);
  }
  // 강: 보통 이상 화질에서는 물결이 움직인다
  const riverGeo = new THREE.PlaneGeometry(220, 9, q.water === 'waves' ? 60 : 1, q.water === 'waves' ? 6 : 1);
  riverGeo.rotateX(-Math.PI / 2);
  const river = new THREE.Mesh(riverGeo, new THREE.MeshPhongMaterial({ color: 0x3f7f9c, specular: 0xffc58a, shininess: 40, transparent: true, opacity: 0.9, flatShading: true }));
  river.position.set(0, -0.4, RIVER_Z); L.add(river);
  // 먼 산
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rand() * 0.3, d = 105 + rand() * 20;
    const m = mk(new THREE.ConeGeometry(18 + rand() * 14, 22 + rand() * 22, 5 + (i % 3)), [0x6f7f86, 0x7d8a8c, 0x62737a][i % 3], Math.cos(a) * d, 6, Math.sin(a) * d, L, false);
    m.rotation.y = rand() * 3;
  }
  // 소나무 (인스턴스로 가볍게)
  {
    const spots = [];
    while (spots.length < 70) {
      const x = (rand() - 0.5) * 190, z = (rand() - 0.5) * 190;
      if (Math.abs(x) < 34 && z > -58 && z < 38) continue;
      if (Math.abs(z - RIVER_Z) < 4.8) continue;
      spots.push([x, groundH(x, z), z, 0.8 + rand() * 0.7]);
    }
    const leaves = new THREE.InstancedMesh(new THREE.ConeGeometry(1.4, 3.6, 6), mat(0x3e6b46), spots.length);
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.28, 1, 5), mat(0x6b4a32), spots.length);
    const o = new THREE.Object3D();
    spots.forEach(([x, y, z, s], i) => {
      o.scale.set(s, s, s);
      o.position.set(x, y + 0.5 * s, z); o.updateMatrix(); trunks.setMatrixAt(i, o.matrix);
      o.position.set(x, y + 2.6 * s, z); o.updateMatrix(); leaves.setMatrixAt(i, o.matrix);
    });
    leaves.castShadow = trunks.castShadow = true;
    L.add(leaves, trunks);
  }

  const flags = [];
  const hipRoof = (w, d, h, color, x, y, z) => curvedHipRoof(L, w, d, h, color, x, y, z); // 처마가 들린 곡선 기와지붕
  const flag = (x, z, color, parent = L, h = 4.2) => {
    mk(new THREE.CylinderGeometry(0.07, 0.07, h, 5), 0x5a3f2a, x, h / 2, z, parent);
    const g = new THREE.PlaneGeometry(1.3, 1.9); g.translate(0.65, 0, 0);
    const f = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide, flatShading: true }));
    f.position.set(x, h - 1.05, z); f.castShadow = true; parent.add(f);
    flags.push({ m: f, ph: rand() * 6 });
  };

  // 남쪽 성벽과 성문
  {
    const wz = 34;
    for (const sx of [-1, 1]) mk(new THREE.BoxGeometry(28.5, 3.2, 1.6), 0x8c8577, sx * 17.75, 1.6, wz);
    const cren = [];
    for (let x = -31.5; x <= 31.5; x += 1.8) if (Math.abs(x) > 4) cren.push(x);
    const cm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.7, 1.7), mat(0x7d766a), cren.length);
    const o = new THREE.Object3D();
    cren.forEach((x, i) => { o.position.set(x, 3.55, wz); o.updateMatrix(); cm.setMatrixAt(i, o.matrix); });
    cm.castShadow = true; L.add(cm);
    for (const sx of [-1, 1]) mk(new THREE.BoxGeometry(2.2, 4, 2.4), 0x7d766a, sx * 4.1, 2, wz);
    mk(new THREE.BoxGeometry(6, 3, 0.4), 0x6b4a32, 0, 1.5, wz);
    mk(new THREE.BoxGeometry(10, 0.4, 3.2), 0x8c8577, 0, 4.2, wz);
    for (const sx of [-4, -1.4, 1.4, 4]) mk(new THREE.CylinderGeometry(0.15, 0.15, 1.6, 6), 0xa8392b, sx, 5.2, wz);
    mk(new THREE.BoxGeometry(9.6, 0.25, 3.4), 0x2f6b5e, 0, 6.05, wz);
    hipRoof(12, 5, 2, 0x3d4846, 0, 6.15, wz);
  }
  // 양옆 목책
  {
    const stakes = [];
    for (const sx of [-32, 32]) for (let z = -15; z <= 33; z += 0.8) stakes.push([sx, z]);
    const sm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.18, 0.24, 2.6, 5), mat(0x7a5a3c), stakes.length);
    const o = new THREE.Object3D();
    stakes.forEach(([x, z], i) => { o.position.set(x, 1.3, z); o.rotation.z = (rand() - 0.5) * 0.12; o.updateMatrix(); sm.setMatrixAt(i, o.matrix); });
    sm.castShadow = true; L.add(sm);
  }
  // 서희가 머무는 지휘소 (단청 기둥과 기와지붕)
  {
    const px = -11, pz = -3;
    mk(new THREE.BoxGeometry(8, 0.5, 6), 0xa59c8a, px, 0.25, pz);
    for (const dx of [-3.6, 0, 3.6]) for (const dz of [-2.6, 2.6]) mk(new THREE.CylinderGeometry(0.18, 0.18, 2.6, 6), 0xa8392b, px + dx, 1.8, pz + dz);
    mk(new THREE.BoxGeometry(8.4, 0.3, 6.4), 0x2f6b5e, px, 3.15, pz);
    hipRoof(11, 8.6, 2.4, 0x3d4846, px, 3.3, pz);
    mk(new THREE.BoxGeometry(2.4, 0.8, 1.2), 0x6b4a32, px, 0.9, pz - 0.6);
    world.addCollider({ x: px - 2, z: pz, r: 3.3 }); world.addCollider({ x: px + 2, z: pz, r: 3.3 });
    flag(px - 4.6, pz + 3.6, 0xb8452f); flag(px + 4.6, pz + 3.6, 0xd9a441);
  }
  // 천막
  for (const [x, z] of [[10, 3], [15, -4], [-3, 8], [-17, 11], [17, 13], [-21, -1], [21, 4]]) {
    const t = mk(new THREE.ConeGeometry(2.4, 2.8, 4), 0xe6dcc3, x, 1.4, z);
    t.rotation.y = Math.PI / 4 + rand() * 0.3;
    // 천막 꼭대기 장대와 어두운 출입구
    mk(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 4), 0x5a3f2a, x, 3.1, z);
    // 네모뿔의 한 면 가운데(45도 방향)에 면 기울기(0.545)만큼 눕혀 붙인다
    const door = mk(new THREE.PlaneGeometry(0.9, 1.2), 0x3a2c20, 0.94, -0.75, 0.94, t, false);
    door.rotation.order = 'YXZ'; door.rotation.set(-0.545, Math.PI / 4, 0);
    world.addCollider({ x, z, r: 1.9 });
  }
  for (const [x, z] of [[12.5, 6.5], [13.4, 7.2], [-6, 10], [19, 0]]) {
    mk(new THREE.BoxGeometry(1, 1, 1), 0x8a6a45, x, 0.5, z).rotation.y = rand();
    world.addCollider({ x, z, r: 0.7 });
  }
  flag(-4, 29, 0xb8452f); flag(4, 29, 0xd9a441); flag(26, -10, 0xb8452f); flag(-26, -10, 0xd9a441);

  // 모닥불과 불티
  const fx = 6, fz = 10.5, flames = [];
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; mk(new THREE.DodecahedronGeometry(0.28, 0), 0x77736a, fx + Math.cos(a) * 0.8, 0.15, fz + Math.sin(a) * 0.8); }
  for (const c of [0xe2742c, 0xf2b33d]) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.2, 5), new THREE.MeshBasicMaterial({ color: c }));
    f.position.set(fx, 0.6, fz); L.add(f); flames.push(f);
  }
  world.addCollider({ x: fx, z: fz, r: 1.1 });
  const emberCount = Math.round(80 * q.particles);
  const emberGeo = new THREE.BufferGeometry();
  const emberPos = new Float32Array(emberCount * 3), emberLife = new Float32Array(emberCount);
  for (let i = 0; i < emberCount; i++) emberLife[i] = rand() * 2.5;
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
  const embers = new THREE.Points(emberGeo, new THREE.PointsMaterial({ color: 0xffb35c, size: 0.12, transparent: true, opacity: 0.9 }));
  L.add(embers);

  // 나루터와 배, 빛나는 원
  mk(new THREE.BoxGeometry(2.4, 0.2, 5), 0x8a6a45, 8, 0.05, -16.6);
  for (const dx of [-1.1, 1.1]) for (const dz of [-14.6, -18.6]) mk(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 5), 0x5a3f2a, 8 + dx, -0.3, dz);
  mk(new THREE.BoxGeometry(1.8, 0.6, 4), 0x6b4a32, 8, -0.25, -20.6);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(8, 0.1, -13.4); ring.visible = false; L.add(ring);

  // 거란 진영 (강 건너편)
  const khitanGroup = new THREE.Group(); L.add(khitanGroup);
  const yurt = (x, z, s = 1) => {
    mk(new THREE.CylinderGeometry(2.2 * s, 2.2 * s, 1.7 * s, 9), 0x8f7556, x, 0.85 * s, z, khitanGroup);
    mk(new THREE.ConeGeometry(2.5 * s, 1.5 * s, 9), 0x5e432c, x, 2.45 * s, z, khitanGroup);
  };
  yurt(0, -41, 1.5);
  for (const [x, z] of [[-9, -37], [9, -37], [-16, -44], [16, -44], [-6, -48], [7, -49], [-22, -38], [22, -38], [-13, -52], [14, -53]]) yurt(x, z, 0.9 + rand() * 0.3);
  for (const [x, z] of [[-4, -36.5], [4, -36.5], [-18, -32], [18, -32]]) flag(x, z, 0x2a2a2e, khitanGroup, 4.4);
  const sonn = makePerson(LOOKS.sonn);
  sonn.position.set(0, 0, -36); khitanGroup.add(sonn);
  for (let i = 0; i < 9; i++) {
    const k = makePerson(LOOKS.khitan);
    k.position.set(-16 + i * 4, 0, -27 - (i % 2) * 1.5); khitanGroup.add(k);
    mk(new THREE.CylinderGeometry(0.04, 0.04, 3, 4), 0x3a2c20, 0.62, 1.5, 0.1, k);
  }

  // 강동 6주 빛기둥 (담판 뒤에 나타남)
  const gangdongPillars = new THREE.Group(); gangdongPillars.visible = false; L.add(gangdongPillars);
  ['흥화진', '용주', '통주', '철주', '귀주', '곽주'].forEach((name, i) => {
    const x = -25 + i * 10, z = -42 - (i % 2) * 4;
    const pill = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 14, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
    pill.position.set(x, 7, z); gangdongPillars.add(pill);
    const label = labelSprite(name); label.position.set(x, 9, z); gangdongPillars.add(label);
  });

  // 풀포기·들꽃(진영 안), 바위·덤불(목책 밖). 길과 천막 자리는 비운다.
  {
    const keep = [[10, 3], [15, -4], [-3, 8], [-17, 11], [17, 13], [-21, -1], [21, 4], [-11, -3], [4, 12.5], [-11, 1.3], [-7, 20.5], [15.5, 8], [8, -13.4], [0, 19]].map(([x, z]) => ({ x, z, r: 3.2 }));
    const camp = { x0: -30, x1: 30, z0: -13, z1: 30 };
    scatter(world, { kind: 'grass', count: 160, area: camp, avoid: keep, seed: 11, ground: groundH, scale: [0.7, 1.4] });
    scatter(world, { kind: 'flower', count: 70, area: camp, avoid: keep, seed: 12, ground: groundH });
    for (const [x0, x1, s] of [[-95, -36, 21], [36, 95, 22]]) {
      scatter(world, { kind: 'rock', count: 18, area: { x0, x1, z0: -15, z1: 45 }, seed: s, ground: groundH, scale: [0.8, 2.2] });
      scatter(world, { kind: 'bush', count: 24, area: { x0, x1, z0: -15, z1: 45 }, seed: s + 5, ground: groundH, scale: [0.8, 1.6] });
      scatter(world, { kind: 'grass', count: 60, area: { x0, x1, z0: -15, z1: 45 }, seed: s + 9, ground: groundH, scale: [0.8, 1.6] });
    }
  }

  // NPC
  world.addNpc('soldier', LOOKS.soldier, 4, 12.5, Math.PI * 0.85);
  world.addNpc('seohui', LOOKS.seohui, -11, 1.3, 0.15);
  world.addNpc('archer', LOOKS.archer, -7, 20.5, Math.PI);
  world.addNpc('officer', LOOKS.officer, 15.5, 8, -Math.PI * 0.6);
  // 안내판(볼거리): 읽지 않아도 장은 끝난다
  world.addSpot('signGangdong', makeSign('강동 6주'), -1.5, 16.5);
  world.addSpot('signSong', makeSign('고려와 송, 거란'), 9.5, 18);

  const scene = { ring, khitanGroup, gangdongPillars, sonn, emberCount, retreating: false,
    ferry: { x: 8, z: -13.4, r: 1.6 },
    negotiationSpot: {
      seohui: [0, -32.8, Math.PI], player: [1.7, -31.6, Math.PI],
      cam: { pos: [8, 4.4, -29.2], target: [0, 1.6, -34.4] },
    },
  };

  // 움직임: 깃발, 불꽃, 불티, 물결, 빛나는 원, 거란군 철수, 빛기둥
  const rp = riverGeo.attributes.position;
  world.onUpdate((dt, t) => {
    for (const f of flags) f.m.rotation.y = Math.sin(t * 2 + f.ph) * 0.35;
    flames.forEach((f, i) => { const s = 0.8 + Math.sin(t * 13 + i * 2) * 0.15 - (i ? 0.2 : 0); f.scale.set(s, s + 0.2, s); });
    for (let i = 0; i < emberCount; i++) {
      emberLife[i] += dt;
      if (emberLife[i] > 2.5) emberLife[i] = 0;
      const k = emberLife[i];
      emberPos[i * 3] = fx + Math.sin(i * 12.9 + k * 2) * 0.4 * k;
      emberPos[i * 3 + 1] = 0.8 + k * 1.4;
      emberPos[i * 3 + 2] = fz + Math.cos(i * 7.3 + k * 2) * 0.4 * k;
    }
    emberGeo.attributes.position.needsUpdate = true;
    if (world.quality.water === 'waves') {
      for (let i = 0; i < rp.count; i++) rp.setY(i, Math.sin(rp.getX(i) * 0.35 + t * 1.6) * 0.08 + Math.cos(rp.getZ(i) * 1.3 + t) * 0.05);
      rp.needsUpdate = true;
    }
    if (ring.visible) ring.material.opacity = 0.55 + Math.sin(t * 4) * 0.3;
    if (scene.retreating && khitanGroup.visible) {
      khitanGroup.position.y -= dt * 1.4; khitanGroup.position.z -= dt * 3;
      if (khitanGroup.position.y < -6) khitanGroup.visible = false;
    }
    if (gangdongPillars.visible) gangdongPillars.children.forEach((c, i) => { if (c.isMesh) c.material.opacity = 0.25 + Math.sin(t * 2 + i) * 0.1; });
  });
  backdropMountains(world.level, { color: 0x6a7a4a, radius: 130 }); // 먼 산줄기(깊이감)
  surroundings(world, { bounds: world.bounds, trees: ['pine'], count: 8, back: false, seed: 11 }); // 걷는 곳 바깥에 그 장소다운 집·나무(깊이감)
  return scene;
}
