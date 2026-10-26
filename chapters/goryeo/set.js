// 고려편 시범(2026-10-26) 2장 흥화진 성 세트 — 지금 2장 장면(chapters/ch2/scene.js)의 모양과 색을 바탕으로 다듬은 것.
// 그대로 쓰는 것: 밝은 돌색 성벽(0xe4ded2)과 회색 성가퀴, 눈 덮인 초가(kit hanok, 눈 지붕 0xeef2f5), 기와집(kit hanok tile),
//   장작더미·장독대·짚더미·우물·쌀가마(kit), 소나무 원뿔과 눈, 먼 산줄기, 거란 천막, 'snow' 분위기와 내리는 눈.
// 보태는 것: 성벽 아래 받침돌·윗돌·여장(활 쏘는 凹 틈만, 총안 없음), 성문 문루(눈 덮인 곡선 기와지붕)와 반달 옹성, 나무 망루, 사다리,
//   펄럭이는 깃발, 모닥불(불길 없이 숯불과 연기). 화포·총안·수원 화성식 시설은 넣지 않는다(고증 체크리스트 4절).
// 모두 (0,0,0) 기준. 성벽은 x축을 따라 놓이고 바깥(적이 오는 쪽)이 -z.
import * as THREE from 'three';
import { mat } from '../../core/people.js';
import { MOODS } from '../../core/world.js';
import { worldMapped, groundMaterial } from '../../core/textures.js';
import { merge, hanok, woodpile as kitWoodpile, jars, straw, watchtower as kitWatchtower, curvedHipRoof, roofSurface } from '../kit/buildings.js';
import { BUILD } from '../kit/town.js';
import { backdropMountains } from '../kit/terrain.js';
import { createWeather } from '../../core/weather.js';

// 지금 2장 색 그대로(깃발은 2장의 붉은색·금색)
export const PALETTE = {
  sky: 0xc4cdd8, snow: 0xf2f5f7, snowRoof: 0xeef2f5, wall: 0xe4ded2, parapet: 0x8c877e, base: 0xb3ab99, cap: 0xb3ada2,
  flag: 0xb8452f, gold: 0xd9a441, wood: 0x6b4a32, door: 0x5d4330, ladder: 0xb07a42, rung: 0xc48a4c, pine: 0x3e5f4a,
};
// 지금 'snow' 분위기에서 너무 어두운 곳만 조금 밝게(해·하늘빛을 한 단계)
export const SNOW_MOOD = { ...MOODS.snow, sun: { ...MOODS.snow.sun, intensity: 0.95 }, hemi: [MOODS.snow.hemi[0], 0x8a9098, 0.85] };

const P = PALETTE;
// 조각 모음: 색·무늬가 같은 조각은 하나로 합쳐 그린다(kit buildings.js의 parts와 같은 방식)
function parts() {
  const groups = new Map();
  const api = {
    add(geo, color, kind, at, rot = [0, 0, 0], opt = {}) {
      geo.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...at), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(1, 1, 1)));
      const key = `${color}:${kind}:${opt.smooth ? 1 : 0}`;
      if (!groups.has(key)) groups.set(key, { geos: [], color, kind, smooth: opt.smooth, shadow: opt.shadow !== false });
      groups.get(key).geos.push(geo);
      return api;
    },
    box(w, h, d, color, kind, at, rot, opt) { return api.add(new THREE.BoxGeometry(w, h, d), color, kind, at, rot, opt); },
    cyl(r0, r1, h, seg, color, kind, at, rot, opt) { return api.add(new THREE.CylinderGeometry(r0, r1, h, seg), color, kind, at, rot, opt); },
    into(g, name = '') {
      for (const p of groups.values()) {
        const m = new THREE.Mesh(merge(p.geos), p.smooth ? smooth(p.color, p.kind) : mat(p.color, p.kind));
        m.castShadow = p.shadow; m.receiveShadow = true; m.name = name; g.add(m);
      }
      return g;
    },
  };
  return api;
}
const smooths = new Map();
function smooth(color, kind) { const k = `${color}:${kind}`; if (!smooths.has(k)) smooths.set(k, worldMapped(new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }), kind)); return smooths.get(k); }
let seed = 11;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

// ── 성벽: 2장 성벽(밝은 돌색 상자)에 받침돌·윗돌·눈을 보태고, 바깥 가장자리에 여장(凹 틈만) ──
export function cityWall({ length = 16, height = 4.2, thick = 1.6, crenel = true } = {}) {
  const g = new THREE.Group(); g.name = 'cityWall';
  const B = parts();
  B.box(length, height, thick, P.wall, 'stone', [0, height / 2, 0]);
  B.box(length, 0.55, thick + 0.4, P.base, 'stone', [0, 0.27, 0]);
  B.box(length, 0.16, thick + 0.12, P.cap, 'stone', [0, height - 0.02, 0]);
  B.box(length + 0.1, 0.14, thick + 0.1, P.snow, 'grain', [0, height + 0.13, 0], [0, 0, 0], { shadow: false });
  B.into(g, 'wallBody');
  if (crenel) {
    const W = parts(), z = -thick / 2 - 0.05;
    W.box(length, 0.35, 0.5, P.parapet, 'stone', [0, height + 0.24, z]);
    for (let x = -length / 2 + 0.45; x <= length / 2 - 0.44; x += 1.8) {
      W.box(0.9, 0.8, 0.5, P.parapet, 'stone', [x, height + 0.4 + 0.2, z]);
      W.box(0.98, 0.1, 0.58, P.snow, 'grain', [x, height + 1.05, z], [0, 0, 0], { shadow: false });
    }
    W.into(g, 'parapet');
  }
  g.userData = { height, thick, length };
  return g;
}

// ── 성문: 2장의 나무 문짝을 그대로 두고 문 위에 문루(나무 기둥·난간·눈 덮인 곡선 기와지붕), 앞에 반달 옹성 ──
export function gateWithOngseong({ height = 4.6, width = 8, depth = 2.4, radius = 5.2, ongseong = true } = {}) {
  const g = new THREE.Group(); g.name = 'gate';
  const B = parts(), ow = 2.8, oh = 3.3;
  for (const s of [-1, 1]) B.box((width - ow) / 2, height, depth, P.wall, 'stone', [s * (ow / 2 + (width - ow) / 4), height / 2, 0]);
  B.box(ow, height - oh, depth, P.wall, 'stone', [0, oh + (height - oh) / 2, 0]);
  B.box(width, 0.55, depth + 0.4, P.base, 'stone', [0, 0.27, 0]);
  for (const s of [-1, 1]) B.box(ow / 2 - 0.05, oh, 0.2, P.door, 'wood', [s * ow / 4, oh / 2, 0.2]);
  B.box(ow + 0.3, 0.25, 0.4, P.wood, 'wood', [0, oh + 0.1, depth / 2]);
  // 문루
  const LW = width - 1.6, LD = depth - 0.4, y0 = height;
  B.box(width, 0.2, depth + 0.2, P.base, 'stone', [0, y0 + 0.1, 0]);
  for (const x of [-LW / 2, -LW / 6, LW / 6, LW / 2]) for (const z of [-LD / 2, LD / 2]) B.cyl(0.11, 0.13, 2.0, 8, P.wood, 'wood', [x, y0 + 1.2, z]);
  for (const z of [-LD / 2, LD / 2]) { B.box(LW + 0.2, 0.09, 0.09, P.wood, 'wood', [0, y0 + 0.75, z]); B.box(LW + 0.3, 0.18, 0.18, P.wood, 'wood', [0, y0 + 2.2, z]); }
  for (const x of [-LW / 2, LW / 2]) B.box(0.18, 0.18, LD + 0.2, P.wood, 'wood', [x, y0 + 2.2, 0]);
  B.into(g, 'gateBody');
  curvedHipRoof(g, LW + 1.8, LD + 1.8, 1.25, P.snowRoof, 0, y0 + 2.3, 0);
  // 옹성: 성문 바깥(-z)을 반달처럼 두른 담. 한쪽이 트여 있다. "흥화진에 옹성이 있었다"고 설명하지 않는다(고증 4-2)
  if (ongseong) {
    const O = parts(), h = height - 0.8, t = 1.4, cz = -depth / 2, a0 = -0.05, a1 = Math.PI * 0.8, n = 12;
    for (let i = 0; i < n; i++) {
      const a = a0 + (a1 - a0) * (i + 0.5) / n, seg = radius * (a1 - a0) / n + 0.1;
      const x = Math.cos(a) * radius, z = cz - Math.sin(a) * radius, ry = Math.PI / 2 - a;
      O.box(seg, h, t, P.wall, 'stone', [x, h / 2, z], [0, ry, 0]);
      O.box(seg, 0.14, t + 0.08, P.snow, 'grain', [x, h + 0.07, z], [0, ry, 0], { shadow: false });
      const ox = Math.cos(a) * (radius + t / 2 - 0.25), oz = cz - Math.sin(a) * (radius + t / 2 - 0.25);
      if (i % 2 === 0) { O.box(0.9, 0.8, 0.5, P.parapet, 'stone', [ox, h + 0.4, oz], [0, ry, 0]); O.box(0.98, 0.1, 0.58, P.snow, 'grain', [ox, h + 0.85, oz], [0, ry, 0], { shadow: false }); }
    }
    O.into(g, 'ongseong');
  }
  g.userData = { height, width, depth };
  return g;
}

// ── 망루: kit 망루(나무 기둥·엇갈린 버팀목·난간·사다리)에 눈 덮인 지붕 ──
export function watchtower({ h = 3.2 } = {}) {
  const g = new THREE.Group(); g.name = 'watchtower';
  kitWatchtower(g, { h, roof: P.snowRoof });
  return g;
}

// ── 사다리: 2장 사다리(굵고 밝은 나무)와 같은 색. 로컬 +y로 선다 ──
export function ladder({ len = 6 } = {}) {
  const g = new THREE.Group(); g.name = 'ladder';
  const B = parts();
  for (const sx of [-0.42, 0.42]) B.box(0.2, len, 0.2, P.ladder, 'wood', [sx, len / 2, 0]);
  for (let y = 0.4; y < len; y += 0.5) B.box(0.84, 0.12, 0.12, P.rung, 'wood', [0, y, 0]);
  return B.into(g, 'ladderBody');
}

// ── 깃발: 2장 깃발(장대에 단 붉은 천)에 금빛 꼭지와 바람에 흔들리는 천 ──
const clothMats = new Map();
export function flag({ color = P.flag, h = 5, w = 1.3, ch = 1.9 } = {}) {
  const g = new THREE.Group(); g.name = 'flag';
  const B = parts();
  B.cyl(0.07, 0.07, h, 5, 0x5a3f2a, 'wood', [0, h / 2, 0]);
  B.add(new THREE.ConeGeometry(0.11, 0.28, 6), P.gold, 'grain', [0, h + 0.14, 0]);
  B.into(g, 'flagPole');
  const geo = new THREE.PlaneGeometry(w, ch, 8, 3); geo.translate(w / 2 + 0.07, h - 0.1 - ch / 2, 0);
  if (!clothMats.has(color)) clothMats.set(color, new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }));
  const cloth = new THREE.Mesh(geo, clothMats.get(color)); cloth.name = 'flagCloth'; cloth.castShadow = true; g.add(cloth);
  const rest = Float32Array.from(geo.attributes.position.array), n = geo.attributes.position.count, ph = rnd() * 6;
  g.userData.update = (dt, t) => {
    const p = geo.attributes.position;
    for (let i = 0; i < n; i++) { const x = rest[i * 3] - 0.07; p.setZ(i, Math.sin(x * 2.6 - (t + ph) * 4) * 0.18 * (x / w)); }
    p.needsUpdate = true; geo.computeVertexNormals();
  };
  return g;
}

// ── 기와집: kit 기와 한옥 그대로에 지붕 눈(처마 끝 기와가 보이게 조금 작게) ──
export function giwaHouse({ snow = true } = {}) {
  const g = new THREE.Group(); g.name = 'giwaHouse';
  hanok(g, { tile: true });
  if (snow) {
    const B = parts(), r = roofSurface({ W: 5.3, D: 4.2, H: 1.5, lift: 0.3, profile: 'tile', thick: 0.04 });
    B.add(r.top, P.snowRoof, 'grain', [0, 2.4 + 0.12 + 0.1, 0], [0, 0, 0], { smooth: true });
    B.box(r.ridgeLen + 0.6, 0.18, 0.4, P.snowRoof, 'grain', [0, 2.52 + 1.55 + 0.25, 0]);
    B.into(g, 'roofSnow');
  }
  return g;
}
// 눈 덮인 초가(2장 그대로)
export function thatchHouse() { const g = new THREE.Group(); g.name = 'thatchHouse'; hanok(g, { roofColor: P.snowRoof }); return g; }

// ── 장독대: kit 장독대에 뚜껑 눈 ──
export function jangdok() {
  const g = new THREE.Group(); g.name = 'jangdok';
  jars(g, { n: 5 });
  const B = parts();
  for (let i = 0; i < 5; i++) { const rad = i % 2 ? 0.26 : 0.36, x = -0.75 + (i % 3) * 0.75, z = i < 3 ? -0.25 : 0.3; B.cyl(rad * 0.6, rad * 0.66, 0.06, 10, P.snow, 'grain', [x, 0.3 + rad * 1.97 + 0.05, z]); }
  return B.into(g, 'jarSnow');
}
// ── 장작더미: kit 장작더미에 눈 ──
export function woodpile() {
  const g = new THREE.Group(); g.name = 'woodpile';
  kitWoodpile(g);
  const B = parts(); B.box(0.9, 0.08, 1.3, P.snow, 'grain', [0.15, 0.82, 0], [0, 0, 0], { shadow: false });
  return B.into(g, 'woodSnow');
}

// ── 모닥불: 2장 화톳불 자리의 돌 둘레(같은 돌)와 타다 남은 장작, 빨간 숯불, 피어오르는 연기. 불길은 그리지 않는다 ──
let emberMat = null, smokeMat = null;
export function campfire({ puffs = 9 } = {}) {
  const g = new THREE.Group(); g.name = 'campfire';
  const B = parts();
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; B.add(new THREE.DodecahedronGeometry(0.24, 0), 0x77736a, 'stone', [Math.cos(a) * 0.7, 0.12, Math.sin(a) * 0.7]); }
  for (let i = 0; i < 4; i++) B.cyl(0.07, 0.08, 0.9, 6, 0x3a2c20, 'wood', [0, 0.16, 0], [0.3, i * Math.PI / 4, Math.PI / 2 - 0.25]);
  B.into(g, 'fireStones');
  const eg = [];
  for (let i = 0; i < 7; i++) { const d = new THREE.DodecahedronGeometry(0.07 + rnd() * 0.05); d.translate((rnd() - 0.5) * 0.5, 0.12, (rnd() - 0.5) * 0.5); eg.push(d); }
  const embers = new THREE.Mesh(merge(eg), emberMat || (emberMat = new THREE.MeshBasicMaterial({ color: 0xe8642a })));
  embers.name = 'embers'; g.add(embers);
  const smoke = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.3, 1), smokeMat || (smokeMat = new THREE.MeshLambertMaterial({ color: 0xd8dce0, transparent: true, opacity: 0.45, depthWrite: false })), puffs);
  smoke.name = 'smoke'; g.add(smoke);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
  const update = (dt, t) => {
    for (let i = 0; i < puffs; i++) {
      const k = (t * 0.22 + i / puffs) % 1;
      v.set(Math.sin(k * 5 + i) * 0.25 + k * 0.8, 0.4 + k * 4, Math.cos(k * 4 + i) * 0.2);
      s.setScalar(0.5 + k * 2 * (1 - k * 0.35));
      smoke.setMatrixAt(i, m.compose(v, q, s));
    }
    smoke.instanceMatrix.needsUpdate = true;
    emberMat.color.setHSL(0.05, 0.85, 0.5 + Math.sin(t * 5) * 0.06);
  };
  update(0, 0);
  g.userData.update = update;
  return g;
}

// ── 2장 흥화진 세트 한 벌: 지금 2장 장면과 같은 배치(성안 반 너비 12, 남쪽 성문)에 새 부품을 보탠다 ──
const HALF = 12, WALL_H = 4.2;
export function buildHeunghwaSet(world, { weather = true } = {}) {
  seed = 11;
  const L = world.level, updates = [];
  const put = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; L.add(o); if (o.userData.update) updates.push(o.userData.update); return o; };
  // 눈 덮인 땅(2장과 같은 굴곡·색, 조금 밝게)
  {
    const g = new THREE.PlaneGeometry(240, 240, 60, 60); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, cols = [], c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), far = Math.max(0, Math.hypot(x, z - 20) - 60);
      p.setY(i, Math.min(far * far * 0.01, 16) + Math.sin(x * 0.3) * Math.cos(z * 0.25) * 0.15);
      const j = rnd() * 0.04; c.setRGB(0.69 + j, 0.73 + j, 0.79 + j); cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.computeVertexNormals();
    const t = new THREE.Mesh(g, groundMaterial('grain')); t.receiveShadow = true; L.add(t);
  }
  // 성벽 네 면: 북쪽(거란이 오는 쪽)·동·서는 바깥에 여장. 남쪽은 2장처럼 나무 문(카메라가 넘겨다보는 쪽이라 여장 없음),
  // 서쪽 가운데에 문루와 옹성을 갖춘 큰 성문(지금 2장 탐험 각도에서 왼쪽에 보인다)
  const LEN = HALF * 2 + 3.2;
  put(cityWall({ length: LEN }), 0, 0, -HALF - 0.8);
  put(cityWall({ length: LEN }), HALF + 0.8, 0, 0, -Math.PI / 2);
  for (const sz of [-1, 1]) put(cityWall({ length: LEN / 2 - 4 }), -HALF - 0.8, 0, sz * (4 + (LEN / 2 - 4) / 2), Math.PI / 2);
  put(gateWithOngseong({}), -HALF - 0.8, 0, 0, Math.PI / 2);
  for (const sx of [-1, 1]) put(cityWall({ length: LEN / 2 - 2.5, crenel: false }), sx * (2.5 + (LEN / 2 - 2.5) / 2), 0, HALF + 0.8);
  { const B = parts(); B.box(5, WALL_H - 3.2, 1.6, P.wall, 'stone', [0, 3.2 + (WALL_H - 3.2) / 2, 0]); B.box(5.1, 0.14, 1.7, P.snow, 'grain', [0, WALL_H + 0.07, 0]);
    for (const s of [-1, 1]) B.box(2.45, 3.2, 0.25, P.door, 'wood', [s * 1.25, 1.6, 0]); B.box(5, 0.25, 0.4, P.wood, 'wood', [0, 3.15, 0.3]);
    put(B.into(new THREE.Group(), 'southDoor'), 0, 0, HALF + 0.8); }
  // 성벽 계단(2장 자리)과 눈
  { const B = parts(); for (let i = 0; i < 6; i++) { B.box(3, 0.7 * (i + 1), 0.8, P.parapet, 'stone', [0, 0.35 * (i + 1), -HALF + 0.4 + (5 - i) * 0.8]); B.box(2.9, 0.06, 0.6, P.snow, 'grain', [0, 0.7 * (i + 1) + 0.03, -HALF + 0.4 + (5 - i) * 0.8], [0, 0, 0], { shadow: false }); } L.add(B.into(new THREE.Group(), 'stairs')); }
  put(watchtower({}), -HALF - 0.8, WALL_H, -HALF - 0.8);
  put(watchtower({}), HALF + 0.8, WALL_H, -HALF - 0.8);
  for (const [x, z, c] of [[-7, -HALF - 0.4, P.flag], [7, -HALF - 0.4, P.gold], [-HALF - 0.4, -6, P.flag], [-HALF - 0.4, 6, P.flag]]) put(flag({ color: c }), x, WALL_H + 0.2, z);
  // 성안: 2장 자리에 초가 둘·기와집 둘, 장작더미·쌀가마·장독대·짚더미·우물, 모닥불
  put(thatchHouse(), -7, 0, 3, 0.2); put(giwaHouse(), 7, 0, -2, -0.3); put(giwaHouse(), -6, 0, -5, 0); put(thatchHouse(), 8, 0, 7, 0.4);
  const kit = (fn, x, z, ry = 0, p = {}) => { const g = new THREE.Group(); fn(g, p); return put(g, x, 0, z, ry); };
  put(woodpile(), 3.4, 0, 3.3, 0.3); kit(BUILD.rice, -2, 8.2, 0, { n: 6 }); put(jangdok(), -9.6, 0, 0.6, Math.PI / 2); kit(straw, 9.8, -6.5); kit(BUILD.well, -1.5, -2.6);
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 17).rotateX(-Math.PI / 2), mat(0xc4c4c0, 'earth')); m.position.set(0, 0.03, 2.5); m.receiveShadow = true; L.add(m); }
  put(campfire(), 5, 0, 0.5);
  // 성 밖: 북쪽 성벽에 걸린 사다리, 거란 천막(2장 모양)
  const ladders = [];
  for (const x of [-6, 2, 9]) { const len = 6.4, tilt = 0.32, l = put(ladder({ len }), x, 0, -HALF - 1.7 - len * Math.sin(tilt)); l.rotation.x = tilt; ladders.push(l); }
  { const B = parts(); for (const [x, z] of [[-14, -36], [-4, -40], [7, -37], [16, -42], [-20, -46], [0, -50], [12, -52]]) { B.cyl(2.1, 2.1, 1.7, 9, 0x8f7556, 'earth', [x, 0.85, z]); B.add(new THREE.ConeGeometry(2.4, 1.5, 9), 0x5e432c, 'wood', [x, 2.45, z]); B.add(new THREE.ConeGeometry(1.4, 0.5, 9), P.snow, 'grain', [x, 3.0, z]); } L.add(B.into(new THREE.Group(), 'camp')); }
  // 소나무(2장 모양과 같은 원뿔 + 눈)
  { const B = parts(); for (let i = 0; i < 40; i++) { const a = rnd() * Math.PI * 2, d = 30 + rnd() * 50, x = Math.cos(a) * d, z = Math.sin(a) * d + 20; if (Math.abs(x) < 26 && z > 16 && z < 80) continue; if (Math.abs(x) < 32 && z < -14 && z > -60) continue; B.add(new THREE.ConeGeometry(1.4, 3.6, 6), P.pine, 'grass', [x, 2.4, z]); B.add(new THREE.ConeGeometry(1.0, 1.2, 6), P.snow, 'grain', [x, 3.9, z]); } L.add(B.into(new THREE.Group(), 'pines')); }
  backdropMountains(L, { color: 0xc8ccd0, radius: 130 });
  if (weather) createWeather(world, 'snow', { count: 700 });
  const update = (dt, t) => { for (const u of updates) u(dt, t); };
  world.onUpdate(update);
  return { ladders, wallHeight: WALL_H, half: HALF, update };
}
