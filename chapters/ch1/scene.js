// 1장 장면: 노을 진 고려 진영, 강, 강 건너 거란 진영, 강동 6주 빛기둥.
import * as THREE from 'three';
import { backdropMountains, surroundings } from '../kit/terrain.js';
import { curvedHipRoof, tent, cart, boat, watchtower, spearRack, archeryTarget } from '../kit/buildings.js';
import { BUILD } from '../kit/town.js';
import { gateLeaves, nameBoard } from '../kit/gate.js';
import { makeFire } from '../../core/fire.js';
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

// 소손녕이 타는 말(로우폴리). 머리가 +z 쪽, 다리 넷은 걸을 때 흔든다(D-7)
function makeHorse() {
  const g = new THREE.Group(); g.name = 'horse';
  const p = (geo, color, x, y, z, parent = g) => { const m = new THREE.Mesh(geo, mat(color)); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
  const coat = 0x6b4a32, dark = 0x2e2219;
  p(new THREE.BoxGeometry(0.62, 0.62, 1.6), coat, 0, 1.08, 0); // 몸통
  p(new THREE.BoxGeometry(0.34, 0.85, 0.4), coat, 0, 1.55, 0.78).rotation.x = 0.5; // 목
  p(new THREE.BoxGeometry(0.12, 0.75, 0.14), dark, 0, 1.68, 0.6).rotation.x = 0.5; // 갈기
  p(new THREE.BoxGeometry(0.3, 0.32, 0.64), coat, 0, 1.92, 1.12); // 머리
  for (const sx of [-0.09, 0.09]) p(new THREE.ConeGeometry(0.05, 0.16, 4), dark, sx, 2.13, 0.92);
  p(new THREE.BoxGeometry(0.12, 0.7, 0.12), dark, 0, 1.0, -0.88).rotation.x = -0.35; // 꼬리
  p(new THREE.BoxGeometry(0.66, 0.1, 0.62), 0x7a2a22, 0, 1.43, 0); // 안장
  const legs = [];
  for (const [x, z] of [[-0.2, 0.62], [0.2, 0.62], [-0.2, -0.62], [0.2, -0.62]]) {
    const piv = new THREE.Group(); piv.position.set(x, 0.85, z); g.add(piv);
    p(new THREE.BoxGeometry(0.16, 0.78, 0.18), coat, 0, -0.39, 0, piv);
    p(new THREE.BoxGeometry(0.18, 0.1, 0.2), dark, 0, -0.8, 0, piv);
    legs.push(piv);
  }
  g.userData.legs = legs;
  return g;
}

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

  // 남쪽 성벽과 성문(문짝 두 개는 장 시작 장면에서 열린다), 문 바로 안쪽 길옆에 진영 이름판
  let gate;
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
    gate = gateLeaves(L, { x: 0, z: wz, y: groundH(0, wz), width: 6, height: 3 });
    nameBoard(L, '고려군 진영', -2.2, wz - 5.5, { y: groundH(-2.2, wz - 5.5) }); // 열린 왼쪽 문짝에 가리지 않는 자리
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
  // 천막: 앞뒤가 세모인 맞배 천막(기둥과 줄). 자리와 부딪힘은 예전 그대로
  for (const [x, z] of [[10, 3], [15, -4], [-3, 8], [-17, 11], [17, 13], [-21, -1], [21, 4]]) {
    const g = new THREE.Group(); g.position.set(x, groundH(x, z), z); g.rotation.y = rand() * 0.6 - 0.3 + (x > 0 ? -0.4 : 0.4); L.add(g);
    tent(g, { color: 0xe6dcc3 });
    world.addCollider({ x, z, r: 1.9 });
  }
  // 군량과 물자: 쌀가마 더미, 군량 수레, 창걸이(예전 상자 자리)
  const put = (fn, x, z, ry = 0, p = {}) => { const g = new THREE.Group(); g.position.set(x, groundH(x, z), z); g.rotation.y = ry; L.add(g); fn(g, p); return g; };
  put(BUILD.rice, 12.9, 6.8, 0.3, { n: 6 }); world.addCollider({ x: 12.9, z: 6.8, r: 1.4 });
  put(cart, -6, 10, 0.8, { load: true }); world.addCollider({ x: -6, z: 10, r: 1.2 });
  put(spearRack, 19, 0, -Math.PI / 2); world.addCollider({ x: 19, z: 0, r: 0.9 });
  put(spearRack, -16, 6, Math.PI / 2); world.addCollider({ x: -16, z: 6, r: 0.9 });
  put(archeryTarget, -7, 27, Math.PI); world.addCollider({ x: -7, z: 27, r: 0.6 }); // 궁수가 연습하는 과녁
  // 목책 모서리의 망루(강 건너를 살핀다)
  for (const sx of [-1, 1]) { put(watchtower, sx * 28.5, -12, 0, { h: 4.5 }); world.addCollider({ x: sx * 28.5, z: -12, r: 1.6 }); }
  // 진영 안 흙길: 성문에서 나루터로, 천막 사이를 가로질러(땅 높낮이를 따라 깐다)
  for (const [cx, cz, w, d] of [[1.5, 9, 3, 46], [0, 3, 40, 2.4]]) {
    const geo = new THREE.PlaneGeometry(w, d, Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(d / 2))); geo.rotateX(-Math.PI / 2);
    const pp = geo.attributes.position;
    for (let i = 0; i < pp.count; i++) pp.setY(i, groundH(pp.getX(i) + cx, pp.getZ(i) + cz) + 0.04);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat(0x9a8058, 'earth')); m.position.set(cx, 0, cz); m.receiveShadow = true; L.add(m);
  }
  flag(-4, 29, 0xb8452f); flag(4, 29, 0xd9a441); flag(26, -10, 0xb8452f); flag(-26, -10, 0xd9a441);

  // 모닥불: 돌을 두른 화톳불(겹친 불꽃·불티·연기, core/fire.js)
  const fx = 6, fz = 10.5;
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; mk(new THREE.DodecahedronGeometry(0.28, 0), 0x77736a, fx + Math.cos(a) * 0.8, 0.15, fz + Math.sin(a) * 0.8); }
  for (let i = 0; i < 4; i++) mk(new THREE.CylinderGeometry(0.1, 0.12, 1.1, 5), 0x4e3826, fx + Math.cos(i * 1.6) * 0.25, 0.15, fz + Math.sin(i * 1.6) * 0.25).rotation.set(Math.PI / 2, i * 0.8, 0.3);
  const fire = makeFire({ size: 0.75, detail: q.particles }); fire.group.position.set(fx, 0.45, fz); fire.setLit(true); L.add(fire.group);
  world.addCollider({ x: fx, z: fz, r: 1.1 });

  // 나루터와 배, 빛나는 원
  mk(new THREE.BoxGeometry(2.4, 0.2, 5), 0x8a6a45, 8, 0.05, -16.6);
  for (const dx of [-1.1, 1.1]) for (const dz of [-14.6, -18.6]) mk(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 5), 0x5a3f2a, 8 + dx, -0.3, dz);
  { const g = new THREE.Group(); g.position.set(11.6, -0.55, -20.4); L.add(g); boat(g, { len: 4.4 }); } // 나루터 옆에 매어 둔 나룻배
  // 나루터에서 강 건너로 이은 널다리: 서희를 따라 이 다리로만 강을 건넌다(D-6)
  mk(new THREE.BoxGeometry(2.4, 0.2, 7), 0x8a6a45, 8, 0.05, -22.5);
  for (let z = -19.5; z >= -26; z -= 0.9) mk(new THREE.BoxGeometry(2.6, 0.06, 0.12), 0x6b5236, 8, 0.17, z, L, false);
  for (const dx of [-1.25, 1.25]) for (const dz of [-20.6, -23.4, -25.6]) mk(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 5), 0x5a3f2a, 8 + dx, -0.4, dz);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(1.1, 0.1, -33.2); ring.visible = false; L.add(ring); // 담판 때 학생이 설 자리

  // 거란 진영 (강 건너편)
  const khitanGroup = new THREE.Group(); L.add(khitanGroup);
  const khitanCamp = new THREE.Group(); khitanGroup.add(khitanCamp); // 천막·깃발: 군대를 물릴 때 진영을 걷는다(D-7)
  const yurt = (x, z, s = 1) => {
    mk(new THREE.CylinderGeometry(2.2 * s, 2.2 * s, 1.7 * s, 9), 0x8f7556, x, 0.85 * s, z, khitanCamp);
    mk(new THREE.ConeGeometry(2.5 * s, 1.5 * s, 9), 0x5e432c, x, 2.45 * s, z, khitanCamp);
  };
  yurt(0, -41, 1.5);
  for (const [x, z, s] of [[-14, -40, 0.75], [9, -37], [-16, -44], [16, -44], [-6, -48], [7, -49], [-22, -38], [22, -38], [-13, -52], [14, -53]]) yurt(x, z, s || 0.9 + rand() * 0.3); // 왼쪽 앞 큰 천막은 담판을 가리지 않게 뒤로 옮기고 작게(D-6)
  for (const [x, z] of [[-5, -39.5], [5, -39.5], [-18, -32], [18, -32]]) flag(x, z, 0x2a2a2e, khitanCamp, 4.4); // 담판 화면을 덮지 않게 소손녕 뒤로
  const sonn = makePerson(LOOKS.sonn);
  sonn.position.set(0, 0, -36); sonn.rotation.y = 0; khitanGroup.add(sonn); // 강 쪽(서희와 학생이 다가오는 쪽)을 바로 본다
  // 소손녕의 말: 천막 옆에 매어 두었다가 군대를 물릴 때 올라탄다(D-7)
  const horse = makeHorse(); horse.position.set(-2.8, 0, -37.6); horse.rotation.y = 0.5; khitanGroup.add(horse);
  const guards = [];
  [-20, -16, -12, -8, -4, 13, 17, 21, 25].forEach((x, i) => { // 다리에서 소손녕 앞으로 가는 길은 비워 둔다
    const k = makePerson(LOOKS.khitan);
    k.position.set(x, 0, -27 - (i % 2) * 1.5); khitanGroup.add(k);
    if (i === 0) { k.name = 'flagBearer'; flag(0.62, 0.1, 0x2a2a2e, k, 3.6); } // 물러날 때 맨 앞에 서는 깃발 병사
    else mk(new THREE.CylinderGeometry(0.04, 0.04, 3, 4), 0x3a2c20, 0.62, 1.5, 0.1, k);
    guards.push(k);
  });

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
  // 안내판(볼거리)은 두지 않는다(D-7: 안내판은 문화유산·특정 건물 옆에만. 1장에는 그런 대상이 없다)

  const scene = { gate, ring, khitanGroup, gangdongPillars, sonn, horse /* 다리를 흔들어야 하므로 굳히지 않는다 */, emberCount: fire.emberCount, retreating: false,
    campBounds: { ...world.bounds },
    // 서희가 앞장서 걷는 길(D-6): 지휘소 앞 → 흙길 → 나루터 → 널다리 → 소손녕 앞
    leadPath: [[-6, 2.8], [1.5, 2.8], [1.5, -6], [8, -12], [8, -25.8], [4.5, -29.5], [-1.1, -33.2]],
    bridge: { x: 8, half: 1.1, z1: -26 }, // 널다리(가운데 x, 반폭, 건너편 끝 z)
    negotiationSpot: {
      // 서희와 학생이 나란히 서서 소손녕과 마주한다. 카메라는 두 사람 뒤에서 소손녕 얼굴을 정면으로 본다
      seohui: [-1.1, -33.2, Math.PI], player: [1.1, -33.2, Math.PI],
      cam: { pos: [0, 3.9, -29.4], target: [0, 0.3, -36] }, // 높이서 내려다봐 소손녕 얼굴이 두 사람 머리 위·대화창 위에 보이게
    },
  };

  // 거란군이 물러나는 모습(D-7): 진영을 걷고, 깃발 병사가 맨 앞, 말 탄 소손녕, 그 뒤로 두 줄.
  // 앞줄부터 차례로 몸을 돌려 걸어가며 흙먼지를 일으키고, 멀어지면 흐려져 사라진다(땅속으로 꺼지지 않는다).
  const MARCH = 2.6, FADE_FROM = -58, GONE = -80;
  const DX = -0.41, DZ = -0.912, FACE = Math.atan2(DX, DZ); // 북쪽으로 조금 왼쪽(서쪽)으로 비스듬히 물러난다: 뒤에서 보아도 대열이 겹치지 않게
  const march = [], dust = [];
  let marchT = 0, dustT = 0;
  scene.army = march.map(u => u.o);
  scene.startRetreat = () => {
    if (march.length) return scene.army;
    khitanCamp.visible = false;
    horse.add(sonn); sonn.position.set(0, 0.88, 0); sonn.rotation.y = 0;
    sonn.userData.noWalk = true; sonn.userData.legs.forEach((l, i) => { l.rotation.set(0, 0, i ? -0.75 : 0.75); });
    [guards[0], horse, ...guards.slice(1)].forEach((o, i) => {
      const row = i < 2 ? i : 2 + Math.floor((i - 2) / 2);
      const side = i < 2 ? 0 : ((i - 2) % 2 ? 0.9 : -0.9), along = i === 0 ? 5 : i === 1 ? 2.5 : -(row - 2) * 1.6;
      const x = DX * along - DZ * side, z = -41 + DZ * along + DX * side;
      o.position.set(x, Math.max(0, groundH(x, z)), z); o.rotation.y = 0; o.visible = true; // 처음에는 고려 쪽을 보고 서 있다
      const mats = [];
      o.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.transparent = true; mats.push(m.material); } });
      march.push({ o, delay: 0.4 + row * 0.35, mats });
    });
    const n = Math.round(6 + 8 * Math.min(1, q.particles));
    for (let i = 0; i < n; i++) {
      const d = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), new THREE.MeshLambertMaterial({ color: 0xc9ad84, transparent: true, opacity: 0, depthWrite: false, flatShading: true }));
      d.visible = false; d.userData.age = 9; L.add(d); dust.push(d);
    }
    scene.army = march.map(u => u.o);
    scene.retreating = true;
    return scene.army;
  };

  // 움직임: 깃발, 화톳불, 물결, 빛나는 원, 거란군 철수, 빛기둥
  const rp = riverGeo.attributes.position;
  world.onUpdate((dt, t) => {
    for (const f of flags) f.m.rotation.y = Math.sin(t * 2 + f.ph) * 0.35;
    fire.update(dt, t);
    if (world.quality.water === 'waves') {
      for (let i = 0; i < rp.count; i++) rp.setY(i, Math.sin(rp.getX(i) * 0.35 + t * 1.6) * 0.08 + Math.cos(rp.getZ(i) * 1.3 + t) * 0.05);
      rp.needsUpdate = true;
    }
    if (ring.visible) ring.material.opacity = 0.55 + Math.sin(t * 4) * 0.3;
    if (scene.retreating && khitanGroup.visible) {
      marchT += dt; dustT += dt;
      const walking = [];
      for (const u of march) {
        const o = u.o, k = marchT - u.delay;
        if (k < 0 || !o.visible) continue;
        const e = Math.min(1, k / 0.55); o.rotation.y = FACE * e * e * (3 - 2 * e); // 몸을 돌린다
        if (e < 1) continue;
        o.position.x += DX * MARCH * dt; o.position.z += DZ * MARCH * dt;
        o.position.y = Math.max(0, groundH(o.position.x, o.position.z));
        const a = Math.min(1, Math.max(0, (o.position.z - GONE) / (FADE_FROM - GONE)));
        for (const m of u.mats) m.opacity = a;
        if (o.position.z < GONE) { o.visible = false; continue; }
        if (o === horse) { const s = Math.sin(marchT * 9) * 0.5; horse.userData.legs.forEach((l, j) => { l.rotation.x = j === 0 || j === 3 ? s : -s; }); }
        if (o.position.z > FADE_FROM) walking.push(o);
      }
      if (walking.length && dustT > 0.14) { // 발밑 흙먼지
        dustT = 0;
        const d = dust.find(p => p.userData.age > 1.4), w = walking[Math.floor(Math.random() * walking.length)];
        if (d) { d.userData.age = 0; d.visible = true; d.position.set(w.position.x + (Math.random() - 0.5) * 0.8, 0.25, w.position.z + 0.6); }
      }
    }
    for (const d of dust) {
      if (!d.visible) continue;
      const a = (d.userData.age += dt);
      if (a > 1.4) { d.visible = false; continue; }
      d.scale.setScalar(0.6 + a * 1.3); d.position.y += dt * 0.35; d.material.opacity = 0.45 * (1 - a / 1.4);
    }
    if (gangdongPillars.visible) gangdongPillars.children.forEach((c, i) => { if (c.isMesh) c.material.opacity = 0.25 + Math.sin(t * 2 + i) * 0.1; });
  });
  backdropMountains(world.level, { color: 0x6a7a4a, radius: 130 }); // 먼 산줄기(깊이감)
  surroundings(world, { bounds: world.bounds, trees: ['pine'], count: 8, back: false, seed: 11 }); // 걷는 곳 바깥에 그 장소다운 집·나무(깊이감)
  return scene;
}
