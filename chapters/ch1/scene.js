// 1장 장면: 노을 진 고려 진영, 강, 강 건너 거란 진영, 강동 6주 빛기둥.
// 2026-10-26 새로 만들기: 담판 카메라(두 얼굴을 크게, 해를 등지고), 길 가운데 안내판을 길 옆으로, 천막 3가지(큰 지휘 천막·작은 천막·말뚝과 줄),
// 서 있는 고려 병사(굳혀진다)와 털모자·털깃 거란 병사(core/figures.js의 crowdLook)로 두 편 옷이 한눈에 다르게, 6주 기둥이 차례로 올라오게.
import { makeSign } from '../../core/signs.js';
import * as THREE from 'three';
import { backdropMountains, surroundings } from '../kit/terrain.js';
import { curvedHipRoof, tent, cart, boat, watchtower, spearRack, archeryTarget, straw } from '../kit/buildings.js';
import { makeFigure, setAction, crowdLook } from '../../core/figures.js';
import { castleMarker } from '../goryeo/set.js';
import { flatten } from '../kit/ops.js';
import { BUILD } from '../kit/town.js';
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
  // 천막 3가지(2026-10-26): 큰 지휘 천막(깃발), 보통 천막, 작은 천막. 자리와 부딪힘은 예전 그대로(큰 천막만 조금 넓게)
  const TENTS = [[10, 3, 1], [15, -4, 1.45], [-3, 8, 0.78], [-17, 11, 1], [17, 13, 0.78], [-21, -1, 0.78], [21, 4, 1]];
  for (const [x, z, k] of TENTS) {
    const g = new THREE.Group(); g.position.set(x, groundH(x, z), z); g.rotation.y = rand() * 0.6 - 0.3 + (x > 0 ? -0.4 : 0.4); L.add(g);
    tent(g, { color: k > 1.2 ? 0xd9ccaa : k < 0.9 ? 0xeee5cf : 0xe6dcc3 });
    g.scale.set(k, k * (k > 1.2 ? 0.95 : 1), k);
    if (k > 1.2) { flag(x + 0.2, z + 0.1, 0xb8452f, L, 5.6); mk(new THREE.BoxGeometry(2.2, 0.08, 0.5), 0x2f6b5e, x, 3.38, z); } // 지휘 천막: 꼭대기 깃발과 용마루 천
    world.addCollider({ x, z, r: k > 1.2 ? 2.6 : 1.9 * Math.max(0.85, k) });
  }
  // 말뚝과 줄: 말을 매어 두는 줄 말뚝(진영 왼쪽 뒤)과 짚단
  {
    const posts = [[-25, -7], [-22.5, -7.4], [-20, -7]];
    for (const [x, z] of posts) mk(new THREE.CylinderGeometry(0.1, 0.13, 1.5, 5), 0x6b4a32, x, groundH(x, z) + 0.75, z);
    for (let i = 0; i < posts.length - 1; i++) {
      const [ax, az] = posts[i], [bx, bz] = posts[i + 1], len = Math.hypot(bx - ax, bz - az);
      const r = mk(new THREE.CylinderGeometry(0.025, 0.025, len, 3), 0x8a7a62, (ax + bx) / 2, groundH(ax, az) + 1.3, (az + bz) / 2, L, false);
      r.rotation.z = Math.PI / 2; r.rotation.y = -Math.atan2(bz - az, bx - ax);
    }
    world.addCollider({ x: -22.5, z: -7.2, r: 1.6 });
  }
  // 군량과 물자: 쌀가마 더미, 군량 수레, 창걸이(예전 상자 자리)
  const put = (fn, x, z, ry = 0, p = {}) => { const g = new THREE.Group(); g.position.set(x, groundH(x, z), z); g.rotation.y = ry; L.add(g); fn(g, p); return g; };
  put(BUILD.rice, 12.9, 6.8, 0.3, { n: 6 }); world.addCollider({ x: 12.9, z: 6.8, r: 1.4 });
  put(cart, -6, 10, 0.8, { load: true }); world.addCollider({ x: -6, z: 10, r: 1.2 });
  put(spearRack, 19, 0, -Math.PI / 2); world.addCollider({ x: 19, z: 0, r: 0.9 });
  put(spearRack, -16, 6, Math.PI / 2); world.addCollider({ x: -16, z: 6, r: 0.9 });
  put(straw, -24, -4.6, 0.4); world.addCollider({ x: -24, z: -4.6, r: 1 });
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
  { const g = new THREE.Group(); g.position.set(8, -0.55, -20.8); L.add(g); boat(g, { len: 4.4 }); } // 나루터에 매어 둔 나룻배
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(8, 0.1, -13.4); ring.visible = false; L.add(ring);

  // 거란 진영 (강 건너편)
  const khitanGroup = new THREE.Group(); L.add(khitanGroup);
  const yurt = (x, z, s = 1) => {
    mk(new THREE.CylinderGeometry(2.2 * s, 2.2 * s, 1.7 * s, 9), 0x8f7556, x, 0.85 * s, z, khitanGroup);
    mk(new THREE.ConeGeometry(2.5 * s, 1.5 * s, 9), 0x5e432c, x, 2.45 * s, z, khitanGroup);
  };
  yurt(5, -45, 1.5); // 소손녕의 큰 천막(담판 화면 왼쪽을 덮지 않게 뒤로)
  // 담판 카메라(서남쪽)가 천막 하나에 가리지 않게 (-9, -37) 천막만 뒤로
  for (const [x, z] of [[-12, -47], [9, -37], [-16, -44], [16, -44], [-6, -48], [7, -49], [-22, -38], [22, -38], [-13, -52], [14, -53]]) yurt(x, z, 0.9 + rand() * 0.3);
  for (const [x, z] of [[-5, -39.5], [5, -39.5], [-18, -32], [18, -32]]) flag(x, z, 0x2a2a2e, khitanGroup, 4.4); // 담판 화면을 덮지 않게 소손녕 뒤로
  const sonn = makePerson(LOOKS.sonn);
  sonn.position.set(0, 0, -36); sonn.rotation.y = -0.48; khitanGroup.add(sonn); // 서희 쪽을 보며 담판 카메라(서쪽) 쪽으로 조금 돈다
  // 강가에 늘어선 거란 병사: 털모자·털깃·방패(고려 병사의 붉은 옷·투구와 한눈에 다르다). 무리와 함께 물러난다
  for (let i = 0; i < 9; i++) {
    const k = makeFigure(crowdLook('khitan', i + 1)); setAction(k, 'idle');
    k.position.set(-16 + i * 4, 0, -27 - (i % 2) * 1.5); khitanGroup.add(k);
  }

  // 강동 6주 성채 표시 (담판 뒤에 하나씩 땅에서 솟아오른다: pillars[i].set(0~1)). 2026-10-26: 속이 빈 빛기둥(멀리서 하얀 줄기로 보임) 대신
  // 작은 성 한 채(chapters/goryeo/set.js castleMarker)로, 나루터에서 보이게 강 건너 가까이 둔다. 이름표는 다 솟으면 위에 뜬다
  const gangdongPillars = new THREE.Group(); gangdongPillars.visible = false; L.add(gangdongPillars);
  const pillars = ['흥화진', '용주', '통주', '철주', '귀주', '곽주'].map((name, i) => {
    const x = -25 + i * 10, z = -31 - (i % 2) * 3.5;
    const m = flatten(castleMarker({ flagColor: i % 2 ? 0xd9a441 : 0xb8452f })); // 조각을 재질별로 합쳐 가볍게
    m.position.set(x, groundH(x, z), z); m.rotation.y = (i - 2.5) * 0.08; gangdongPillars.add(m);
    const label = labelSprite(name); label.position.set(x, groundH(x, z) + 8.2, z); gangdongPillars.add(label);
    return Object.assign(Object.create(null), { set(k) { m.scale.y = Math.max(0.001, k); m.visible = k > 0.01; label.visible = k >= 1; } });
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
  world.addSpot('signGangdong', makeSign('강동 6주'), -5, 15.5); // 길 한가운데서 화면을 가리지 않게 길 옆으로
  // 서 있는 고려 병사(붉은 옷·투구, 움직이지 않아 장면 굳히기로 합쳐진다): 성문, 망루 아래, 지휘 천막 앞
  for (const [x, z, ry, seed] of [[-2.6, 31.2, 0, 1], [2.6, 31.2, 0, 2], [-26.5, -10.2, Math.PI * 0.85, 3], [26.5, -10.2, -Math.PI * 0.85, 4], [12.4, -1.2, 0.5, 2]]) {
    const f = makeFigure(crowdLook('soldier', seed)); f.position.set(x, groundH(x, z), z); f.rotation.y = ry; setAction(f, 'idle'); L.add(f);
    world.addCollider({ x, z, r: 0.6 });
  }
  world.addSpot('signSong', makeSign('고려와 송, 거란'), 9.5, 18);

  const scene = { ring, khitanGroup, gangdongPillars, pillars, sonn, emberCount: fire.emberCount, retreating: false,
    ferry: { x: 8, z: -13.4, r: 1.6 },
    negotiationSpot: {
      // 노을 해(서쪽 -x·북쪽 -z)를 등지고 서남쪽 위에서 마주 선 두 사람을 본다(역광으로 얼굴이 그늘지지 않게, 두 얼굴이 크게).
      // 카메라는 cam.target에서 cam.pos 쪽으로 물러나며 points가 화면 안(margin)에 들 때까지 거리를 맞춘다(world.fitFixedCamera).
      // 학생(서희 곁의 젊은 병사)은 카메라 뒤에 서서 서희를 가리지 않는다
      seohui: [0, -32.8, Math.PI + 1.05], player: [-17.6, -28.9, Math.PI * 0.6],
      cam: { pos: [-8.6, 5.8, -31.7], target: [0, 2.0, -34.4], points: [[0, 2.95, -32.8], [0, 2.95, -36], [0, 1.15, -32.8], [0, 1.15, -36]], margin: 0.6 },
    },
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
      khitanGroup.position.y -= dt * 1.4; khitanGroup.position.z -= dt * 3;
      if (khitanGroup.position.y < -6) khitanGroup.visible = false;
    }
  });
  backdropMountains(world.level, { color: 0x6a7a4a, radius: 130 }); // 먼 산줄기(깊이감)
  surroundings(world, { bounds: world.bounds, trees: ['pine'], count: 8, back: false, seed: 11 }); // 걷는 곳 바깥에 그 장소다운 집·나무(깊이감)
  return scene;
}
