// 고려편 새 기준(2026-10-26 기획서 6-3) 고려 성 세트(2장 흥화진용): 여장이 있는 성벽, 옹성을 두른 성문과 문루, 망루, 사다리, 깃발,
// 성안 기와집·장독대·나무 더미·모닥불(불길 없이 숯불과 연기만), 눈 내린 땅과 눈 덮인 소나무, 먼 눈산, 내리는 눈.
// 사람(core/figures.js)과 같은 그림책 재질(세 단계 명암 + 꼭짓점 색)로 칠해 한 물건을 한두 번에 그린다.
// 모두 (0,0,0) 기준. 성벽은 x축을 따라 놓이고 바깥(적이 오는 쪽)이 -z, 성안이 +z.
import * as THREE from 'three';
import { vcBuilder, toonMat } from '../../core/figures.js';
import { roofSurface } from '../kit/buildings.js';

// 2장 팔레트: 연한 하늘색·눈흰색·성벽 회갈색 + 깃발 빨강. 가장 어두운 색도 검정 대신 짙은 청갈색
export const PALETTE = {
  sky: 0xbcd8ec, snow: 0xf4f6f8, snowShade: 0xdde7f0, wall: 0x9a8b7a, wallLight: 0xb2a593, flag: 0xc8402e,
  wood: 0x8a5a38, post: 0x9a3e2c, tile: 0x50586a, plaster: 0xf3ecdc, ink: 0x3a3a48, pine: 0x3f6e58, earth: 0xc9bcab,
};
// 눈 내리는 밝은 아침(하늘 연한 하늘색 + 지평선 분홍빛). world.setMood에 쓰려면 MOODS에 넣는다(갤러리 참고)
export const SNOW_MOOD = {
  skyTop: 0x8fbfe4, skyHorizon: 0xf6e6e8, skyBottom: 0xe8eef4,
  fog: [0xe8eef5, 70, 210],
  sun: { color: 0xfff0dc, intensity: 1.6, dir: [-22, 34, 20] },
  hemi: [0xf6f9ff, 0xa8b4c4, 1.0],
  particles: 'snow', clouds: 0.25, cloud: 0xffffff,
};

const P = PALETTE;
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const pick = a => a[Math.floor(rnd() * a.length)];
const STONES = [0x9a8b7a, 0x8e806f, 0xa69886, 0x918472, 0xa09080];
const meshOf = (B, name, receive = true) => { const m = B.mesh(toonMat(), name); m.receiveShadow = receive; return m; };
// 눈 쌓인 덮개: 가장자리가 둥글게 부푼 얇은 판
function snowCap(B, w, d, at, h = 0.12) {
  B.box(w, h, d, P.snow, at);
  for (const s of [-1, 1]) B.cyl(h / 2, h / 2, w, 6, P.snow, [at[0], at[1], at[2] + s * d / 2], [0, 0, Math.PI / 2]);
}

// ── 성벽: 돌 켜(층마다 다른 돌), 걷는 길, 바깥 가장자리의 여장(기와 덮개 + 총안)과 눈 ──
export function cityWall({ length = 16, height = 4.2, thick = 3.2, snow = true, crenel = true } = {}) {
  const g = new THREE.Group(); g.name = 'cityWall';
  const B = vcBuilder();
  B.box(length, height - 0.05, thick - 0.1, P.wall, [0, (height - 0.05) / 2, 0]);
  const rowH = 0.6;
  for (const face of [-1, 1]) {
    let row = 0;
    for (let y = 0; y < height - 0.2; y += rowH, row++) {
      let x = -length / 2 + (row % 2 ? 0.45 : 0);
      if (row % 2) B.box(0.45, rowH - 0.06, 0.12, pick(STONES), [-length / 2 + 0.225, y + rowH / 2, face * (thick / 2 - 0.02)]);
      while (x < length / 2 - 0.05) {
        const w = Math.min(0.9 + rnd() * 0.6, length / 2 - x);
        const inset = face < 0 ? row * 0.02 : 0; // 바깥 면은 위로 갈수록 조금 들어간다
        B.box(w - 0.06, rowH - 0.06, 0.12, pick(STONES), [x + w / 2, y + rowH / 2, face * (thick / 2 - 0.02 - inset)]);
        x += w;
      }
    }
  }
  B.box(length, 0.12, thick, P.wallLight, [0, height, 0]); // 걷는 길 바닥돌
  if (snow) {
    snowCap(B, length, thick - 1.1, [0.0, height + 0.1, 0.35], 0.1);
    for (let i = 0; i < length / 2.5; i++) B.ball(0.35 + rnd() * 0.3, P.snow, [-length / 2 + 1 + rnd() * (length - 2), height + 0.1, thick / 2 - 0.4], [1.6, 0.3, 1]);
  }
  g.add(meshOf(B, 'wallBody'));
  // 여장: 바깥 가장자리의 낮은 담. 칸마다 기와 덮개와 가운데 총안, 칸 사이는 틈(활 쏘는 곳)
  if (crenel) {
    const W = vcBuilder(), mw = 1.3, gap = 0.45, h = 1.15, z = -thick / 2 + 0.28;
    for (let x = -length / 2 + mw / 2; x <= length / 2 - mw / 2 + 0.01; x += mw + gap) {
      W.box(mw, h, 0.55, pick([0xa89a88, 0x9f9180, 0xb0a290]), [x, height + h / 2, z]);
      W.box(0.22, 0.22, 0.58, P.ink, [x, height + h * 0.5, z]); // 총안
      W.box(mw + 0.18, 0.12, 0.8, P.tile, [x, height + h + 0.05, z]); // 기와 덮개
      W.box(mw + 0.02, 0.1, 0.36, P.tile, [x, height + h + 0.16, z]);
      if (snow) snowCap(W, mw + 0.05, 0.62, [x, height + h + 0.26, z], 0.1);
    }
    g.add(meshOf(W, 'parapet'));
  }
  g.userData = { height, thick, length };
  return g;
}

// ── 성문: 무지개문(홍예)이 뚫린 돌 문, 붉은 문짝, 위의 문루(붉은 기둥·단청 띠·눈 덮인 기와지붕), 앞을 감싼 반달 모양 옹성 ──
export function gateWithOngseong({ height = 4.6, width = 10, depth = 6, radius = 8.5 } = {}) {
  const g = new THREE.Group(); g.name = 'gate';
  const B = vcBuilder();
  const sh = new THREE.Shape([new THREE.Vector2(-width / 2, 0), new THREE.Vector2(width / 2, 0), new THREE.Vector2(width / 2, height), new THREE.Vector2(-width / 2, height)]);
  const hole = new THREE.Path(); const aw = 1.7, ah = 2.5;
  hole.moveTo(-aw, 0); hole.lineTo(aw, 0); hole.lineTo(aw, ah); hole.absarc(0, ah, aw, 0, Math.PI, false); hole.lineTo(-aw, 0);
  sh.holes.push(hole);
  B.add(new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 14 }), P.wall, [0, 0, -depth / 2]);
  // 홍예 둘레 돌(바깥·안)
  for (const zf of [-1, 1]) for (let i = 0; i <= 10; i++) {
    const a = Math.PI * i / 10;
    B.box(0.5, 0.75, 0.16, i % 2 ? P.wallLight : 0xa49684, [Math.cos(a) * (aw + 0.32), ah + Math.sin(a) * (aw + 0.32), zf * (depth / 2 + 0.03)], [0, 0, a - Math.PI / 2]);
  }
  for (const zf of [-1, 1]) for (let y = 0.3; y < height - 0.2; y += 0.6) for (const s of [-1, 1]) B.box(1.0 + rnd() * 0.6, 0.54, 0.12, pick(STONES), [s * (width / 2 - 1.2 - rnd() * 0.3), y, zf * (depth / 2 + 0.02)]);
  // 문짝 두 장과 징
  for (const s of [-1, 1]) {
    B.box(aw - 0.04, ah + aw * 0.75, 0.22, 0x8a3a28, [s * aw / 2, (ah + aw * 0.75) / 2, -0.3]);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) B.ball(0.07, 0xd9a441, [s * (0.4 + c * 0.7), 0.6 + r * 0.85, -0.42], [1, 1, 0.6], 6);
  }
  B.box(width, 0.14, depth, P.wallLight, [0, height + 0.07, 0]);
  snowCap(B, width - 0.6, depth - 3.5, [0, height + 0.2, 0], 0.1);
  // 여장(앞뒤 가장자리)
  for (const zf of [-1, 1]) for (let x = -width / 2 + 0.65; x <= width / 2 - 0.6; x += 1.75) {
    B.box(1.3, 1.1, 0.5, 0xa89a88, [x, height + 0.69, zf * (depth / 2 - 0.25)]);
    B.box(1.45, 0.12, 0.75, P.tile, [x, height + 1.28, zf * (depth / 2 - 0.25)]);
    snowCap(B, 1.35, 0.6, [x, height + 1.42, zf * (depth / 2 - 0.25)], 0.1);
  }
  // 문루: 붉은 기둥 4×2, 난간, 단청 띠, 겹처마 대신 눈 덮인 곡선 기와지붕
  const LW = 6.4, LD = 3.2, PH = 2.3, y0 = height + 0.14;
  B.box(LW + 0.6, 0.25, LD + 0.6, 0x7a5a3c, [0, y0 + 0.12, 0]);
  for (const x of [-LW / 2, -LW / 6, LW / 6, LW / 2]) for (const z of [-LD / 2, LD / 2]) B.cyl(0.14, 0.16, PH, 8, P.post, [x, y0 + 0.25 + PH / 2, z]);
  for (const z of [-LD / 2, LD / 2]) { B.box(LW + 0.3, 0.1, 0.1, P.post, [0, y0 + 0.85, z]); B.box(LW + 0.4, 0.32, 0.3, 0x3f7a6a, [0, y0 + 0.25 + PH - 0.05, z]); B.box(LW + 0.4, 0.1, 0.32, 0xc8402e, [0, y0 + 0.25 + PH - 0.26, z]); }
  for (const x of [-LW / 2, LW / 2]) { B.box(0.3, 0.32, LD + 0.4, 0x3f7a6a, [x, y0 + 0.25 + PH - 0.05, 0]); B.box(0.1, 0.1, LD, P.post, [x, y0 + 0.85, 0]); }
  const ey = y0 + 0.25 + PH + 0.1;
  const r = roofSurface({ W: LW + 3.0, D: LD + 3.0, H: 1.7, lift: 0.7, profile: 'tile', thick: 0.18 });
  B.add(r.top, P.tile, [0, ey, 0]); B.add(r.under, 0x7a5a3c, [0, ey, 0]);
  const s2 = roofSurface({ W: LW + 2.2, D: LD + 2.2, H: 1.5, lift: 0.5, profile: 'tile', thick: 0.05 });
  B.add(s2.top, P.snow, [0, ey + 0.32, 0]);
  B.box(r.ridgeLen + 1.2, 0.34, 0.4, P.snow, [0, ey + 1.86, 0]);
  for (const s of [-1, 1]) B.box(0.28, 0.6, 0.38, P.tile, [s * (r.ridgeLen / 2 + 0.7), ey + 1.95, 0], [0, 0, s * 0.3]);
  g.add(meshOf(B, 'gateBody'));
  // 옹성: 성문 앞(바깥)을 반달처럼 감싼 성벽. 한쪽 옆이 트여 적이 곧장 문으로 오지 못한다
  const O = vcBuilder(), oh = height - 0.4, ot = 1.9, cz = -depth / 2;
  const a0 = -0.15, a1 = Math.PI * 0.78, n = 16; // 오른쪽 끝은 성벽에 붙고 왼쪽 끝이 트인 입구
  for (let i = 0; i < n; i++) {
    const a = a0 + (a1 - a0) * (i + 0.5) / n, seg = radius * (a1 - a0) / n + 0.08;
    const x = Math.cos(a) * radius, z = cz - Math.sin(a) * radius, ry = -a + Math.PI / 2;
    O.box(seg, oh, ot, pick(STONES), [x, oh / 2, z], [0, ry, 0]);
    for (const k of [-0.25, 0.25]) O.box(seg * 0.42, 0.5, 0.08, pick(STONES), [x + Math.cos(a) * (ot / 2 + 0.02) + Math.sin(a) * k * seg, oh * (0.3 + rnd() * 0.5), z - Math.sin(a) * (ot / 2 + 0.02) + Math.cos(a) * k * seg], [0, ry, 0]);
    const ox = Math.cos(a) * (radius + ot / 2 - 0.25), oz = cz - Math.sin(a) * (radius + ot / 2 - 0.25);
    { O.box(seg * 0.7, 1.0, 0.45, 0xa89a88, [ox, oh + 0.5, oz], [0, ry, 0]); O.box(seg * 0.8, 0.12, 0.65, P.tile, [ox, oh + 1.05, oz], [0, ry, 0]); O.box(seg * 0.75, 0.12, 0.6, P.snow, [ox, oh + 1.17, oz], [0, ry, 0]); }
    O.box(seg, 0.1, ot - 0.6, P.snow, [Math.cos(a) * (radius - 0.2), oh + 0.05, cz - Math.sin(a) * (radius - 0.2)], [0, ry, 0]);
  }
  const ong = meshOf(O, 'ongseong'); g.add(ong);
  g.userData = { height, width, depth };
  return g;
}

// ── 망루: 네 기둥, 엇갈린 버팀목, 난간 두른 마루, 눈 덮인 작은 지붕, 오르는 사다리 ──
export function watchtower({ h = 4.2 } = {}) {
  const g = new THREE.Group(); g.name = 'watchtower';
  const B = vcBuilder(), s = 1.3;
  for (const x of [-s, s]) for (const z of [-s, s]) B.cyl(0.13, 0.16, h + 2.0, 7, P.wood, [x, (h + 2.0) / 2, z]);
  for (const [x, z, ry] of [[0, -s, 0], [0, s, 0], [-s, 0, Math.PI / 2], [s, 0, Math.PI / 2]]) {
    B.box(2.9, 0.1, 0.1, 0x7a4e30, [x, h * 0.45, z], [0, ry, 0.95]); B.box(2.9, 0.1, 0.1, 0x7a4e30, [x, h * 0.45, z], [0, ry, -0.95]);
  }
  B.box(3.3, 0.18, 3.3, 0x7a5a3c, [0, h, 0]);
  for (const [x, z, w, d] of [[0, -s, 2.8, 0.1], [0, s, 2.8, 0.1], [-s, 0, 0.1, 2.8], [s, 0, 0.1, 2.8]]) { B.box(w, 0.1, d, P.wood, [x, h + 0.85, z]); B.box(w, 0.08, d, P.wood, [x, h + 0.45, z]); }
  const r = roofSurface({ W: 3.8, D: 3.8, H: 1.1, lift: 0.35, profile: 'tile', thick: 0.12 });
  B.add(r.top, P.tile, [0, h + 2.0, 0]); B.add(r.under, 0x7a5a3c, [0, h + 2.0, 0]);
  const s2 = roofSurface({ W: 3.2, D: 3.2, H: 1.0, profile: 'tile', thick: 0.05 });
  B.add(s2.top, P.snow, [0, h + 2.2, 0]);
  snowCap(B, 2.6, 2.6, [0, h + 0.15, 0], 0.08);
  // 사다리
  for (const x of [-0.35, 0.35]) B.box(0.1, h + 0.6, 0.1, 0xb08050, [x, (h + 0.6) / 2 - 0.1, s + 0.7], [-0.15, 0, 0]);
  for (let y = 0.4; y < h; y += 0.5) B.box(0.7, 0.07, 0.08, 0xb08050, [0, y, s + 0.7 - y * 0.15 + 0.3], [-0.15, 0, 0]);
  g.add(meshOf(B, 'towerBody'));
  return g;
}

// ── 사다리(거란군이 성벽에 거는 긴 사다리): 세로대 둘과 가로대. 로컬 +y로 선다 ──
export function ladder({ len = 6 } = {}) {
  const B = vcBuilder();
  for (const x of [-0.38, 0.38]) B.box(0.14, len, 0.14, 0xb48654, [x, len / 2, 0]);
  for (let y = 0.45; y < len - 0.2; y += 0.5) B.cyl(0.04, 0.04, 0.78, 5, 0xc89a64, [0, y, 0], [0, 0, Math.PI / 2]);
  for (const x of [-0.38, 0.38]) B.box(0.16, 0.12, 0.2, 0x5e4030, [x, len - 0.6, 0]); // 끝의 갈고리
  const g = new THREE.Group(); g.name = 'ladder';
  g.add(meshOf(B, 'ladderBody'));
  return g;
}

// ── 깃발: 장대·금빛 꼭지·바람에 펄럭이는 천(빨강 바탕, 금빛 테두리) ──
let clothMat = null;
const cloth = () => clothMat || (clothMat = Object.assign(toonMat().clone(), { side: THREE.DoubleSide }));
export function flag({ color = P.flag, h = 5.2, w = 1.5, ch = 2.1 } = {}) {
  const g = new THREE.Group(); g.name = 'flag';
  const B = vcBuilder();
  B.cyl(0.06, 0.07, h, 6, 0x6a4028, [0, h / 2, 0]);
  B.add(new THREE.ConeGeometry(0.11, 0.3, 6), 0xd9a441, [0, h + 0.15, 0]);
  B.ball(0.09, 0xd9a441, [0, h - 0.02, 0], [1, 1, 1], 6);
  g.add(meshOf(B, 'flagPole'));
  const geo = new THREE.PlaneGeometry(w, ch, 10, 5); geo.translate(w / 2 + 0.06, h - 0.15 - ch / 2, 0);
  const n = geo.attributes.position.count, col = new Float32Array(n * 3), c = new THREE.Color(), gold = new THREE.Color(0xe0b048), base = new THREE.Color(color);
  for (let i = 0; i < n; i++) {
    const x = geo.attributes.position.getX(i) - 0.06, y = geo.attributes.position.getY(i) - (h - 0.15 - ch / 2);
    const edge = x < 0.12 || x > w - 0.14 || Math.abs(y) > ch / 2 - 0.14;
    c.copy(edge ? gold : base); col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const rest = Float32Array.from(geo.attributes.position.array);
  const banner = new THREE.Mesh(geo, cloth()); banner.name = 'flagCloth'; banner.castShadow = true;
  g.add(banner);
  const ph = Math.random() * 6;
  g.userData.update = (dt, t) => {
    const p = geo.attributes.position;
    for (let i = 0; i < n; i++) {
      const x = rest[i * 3] - 0.06;
      p.setZ(i, Math.sin(x * 2.6 - (t + ph) * 4.2) * 0.22 * (x / w) + Math.sin(rest[i * 3 + 1] * 1.7 + t * 2.3) * 0.04 * (x / w));
    }
    p.needsUpdate = true; geo.computeVertexNormals();
  };
  return g;
}

// ── 기와집: 다듬은 돌 기단, 붉은 기둥, 흰 회벽과 나무 틀, 창살문, 눈 덮인 곡선 기와지붕(처마 끝 기와가 보이게) ──
export function giwaHouse({ w = 6.2, d = 4.2, wall = P.plaster, roofTone = P.tile } = {}) {
  const g = new THREE.Group(); g.name = 'giwaHouse';
  const B = vcBuilder(), base = 0.5, wh = 2.1, top = base + wh;
  B.box(w + 0.8, base, d + 0.8, 0xb8ad9c, [0, base / 2, 0]);
  for (let x = -w / 2; x < w / 2; x += 1.1) B.box(1.0, base - 0.1, 0.08, pick([0xc2b8a8, 0xaea290]), [x + 0.55, base / 2, d / 2 + 0.41]);
  B.box(1.6, base / 2, 0.5, 0xc2b8a8, [0, base / 4, d / 2 + 0.65]);
  snowCap(B, w + 0.6, 0.4, [0, base + 0.03, -d / 2 - 0.2], 0.06);
  B.box(w - 0.3, wh, d - 0.9, wall, [0, base + wh / 2, -0.2]);
  B.box(w, 0.1, 0.8, 0x9a7450, [0, base + 0.35, d / 2 - 0.35]); // 툇마루
  const cols = [-w / 2 + 0.1, -w / 6, w / 6, w / 2 - 0.1];
  for (const x of cols) for (const z of [d / 2 - 0.1, -d / 2 + 0.1]) B.cyl(0.13, 0.14, wh, 8, P.post, [x, base + wh / 2, z]);
  for (const z of [d / 2 - 0.68, -d / 2 + 0.25]) for (const y of [base + 0.15, top - 0.15]) B.box(w - 0.25, 0.14, 0.1, 0x6a4a32, [0, y, z]);
  B.box(w + 0.2, 0.22, 0.22, 0x6a4a32, [0, top + 0.05, d / 2 - 0.1]);
  B.box(w + 0.2, 0.18, 0.2, 0x3f7a6a, [0, top - 0.1, d / 2 - 0.1]);
  // 창살문: 종이색 판 + 나무 살
  for (const x of [-w / 3, 0, w / 3]) {
    const dz = d / 2 - 0.64;
    B.box(1.1, 1.5, 0.05, 0xf4ead2, [x, base + 1.0, dz]);
    for (let k = -2; k <= 2; k++) B.box(0.035, 1.5, 0.07, 0x7a5232, [x + k * 0.25, base + 1.0, dz]);
    for (let k = -2; k <= 2; k++) B.box(1.1, 0.035, 0.07, 0x7a5232, [x, base + 1.0 + k * 0.32, dz]);
    B.box(1.18, 1.58, 0.04, 0x6a4a32, [x, base + 1.0, dz - 0.02]);
  }
  const r = roofSurface({ W: w + 2.6, D: d + 2.4, H: 1.75, lift: 0.75, profile: 'tile', thick: 0.18 });
  B.add(r.top, roofTone, [0, top + 0.15, 0]); B.add(r.under, 0x7a5a3c, [0, top + 0.15, 0]);
  const s2 = roofSurface({ W: w + 1.7, D: d + 1.5, H: 1.62, lift: 0.4, profile: 'tile', thick: 0.05 });
  B.add(s2.top, P.snow, [0, top + 0.36, 0]);
  B.box(r.ridgeLen + 0.9, 0.34, 0.42, P.snow, [0, top + 0.15 + 1.82, 0]);
  for (const s of [-1, 1]) B.box(0.25, 0.55, 0.4, roofTone, [s * (r.ridgeLen / 2 + 0.55), top + 0.15 + 1.92, 0], [0, 0, s * 0.3]);
  g.add(meshOf(B, 'houseBody'));
  return g;
}

// ── 장독대: 낮은 돌 단 위 옹기 다섯(뚜껑에 눈) ──
export function jangdok() {
  const g = new THREE.Group(); g.name = 'jangdok';
  const B = vcBuilder();
  B.box(3.0, 0.35, 1.9, 0xb8ad9c, [0, 0.175, 0]);
  const jars = [[-0.95, -0.35, 1.0], [0, -0.4, 1.15], [0.95, -0.35, 0.95], [-0.5, 0.45, 0.75], [0.5, 0.45, 0.8]];
  for (const [x, z, s] of jars) {
    const pts = [[0.001, 0], [0.22, 0], [0.4, 0.25], [0.44, 0.45], [0.36, 0.7], [0.24, 0.8], [0.24, 0.84], [0.001, 0.84]].map(([a, b]) => [a * s, b * s]);
    B.lathe(pts, pick([0x6a3e2a, 0x5e3624, 0x74462e]), [x, 0.35, z], [1, 1, 1], 12);
    B.cyl(0.29 * s, 0.31 * s, 0.07 * s, 12, 0x5a3424, [x, 0.35 + 0.86 * s, z]);
    B.cap(0.29 * s, P.snow, [x, 0.35 + 0.89 * s, z], [0, 0, 0], [1, 0.35, 1], 0.5, 12);
    B.box(0.05 * s, 0.25 * s, 0.03, 0xa06a4a, [x + 0.2 * s, 0.35 + 0.5 * s, z + 0.36 * s], [0, 0.5, 0]); // 윤기
  }
  g.add(meshOf(B, 'jars'));
  return g;
}

// ── 나무 더미: 통나무를 쌓고(밝은 마구리) 위에 눈 ──
export function woodpile() {
  const g = new THREE.Group(); g.name = 'woodpile';
  const B = vcBuilder();
  const rows = [5, 4, 3, 2];
  rows.forEach((n, row) => {
    for (let i = 0; i < n; i++) {
      const x = 0, z = (i - (n - 1) / 2) * 0.3, y = 0.15 + row * 0.26, l = 1.7 + rnd() * 0.2;
      B.cyl(0.14, 0.14, l, 8, pick([0x7a5236, 0x6e4a30, 0x86603e]), [x, y, z], [0, 0, Math.PI / 2]);
      for (const s of [-1, 1]) B.cyl(0.115, 0.115, 0.02, 8, 0xe0c290, [s * (l / 2 + 0.005), y, z], [0, 0, Math.PI / 2]);
    }
  });
  B.cap(0.75, P.snow, [0, 0.15 + 3 * 0.26 + 0.1, 0], [0, 0, 0], [1.2, 0.25, 0.55], 0.5, 12);
  for (const s of [-1, 1]) B.box(0.1, 1.2, 0.1, 0x6a4028, [s * 0.4, 0.6, 0.85]);
  g.add(meshOf(B, 'woodBody'));
  return g;
}

// ── 모닥불: 둘러놓은 돌, 타고 남은 장작, 빨갛게 빛나는 숯불, 피어오르는 연기(불길은 그리지 않는다) ──
let emberMat = null, smokeMat = null;
export function campfire({ puffs = 10 } = {}) {
  const g = new THREE.Group(); g.name = 'campfire';
  const B = vcBuilder();
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; B.ball(0.2 + rnd() * 0.06, pick([0x8e8a84, 0x9a958e, 0x7e7a74]), [Math.cos(a) * 0.62, 0.1, Math.sin(a) * 0.62], [1.2, 0.75, 1], 7); }
  for (let i = 0; i < 4; i++) B.cyl(0.07, 0.08, 0.95, 6, 0x3a2c26, [0, 0.16, 0], [0.3, i * Math.PI / 4, Math.PI / 2 - 0.25]);
  B.cap(0.42, 0x5a5050, [0, 0.0, 0], [0, 0, 0], [1, 0.25, 1], 0.5, 10); // 재
  g.add(meshOf(B, 'fireStones'));
  // 숯불: 빛나는 작은 덩어리(조명 계산 없이 스스로 빛남)
  const E = new THREE.BufferGeometry(); const eg = [];
  for (let i = 0; i < 8; i++) { const d = new THREE.DodecahedronGeometry(0.07 + rnd() * 0.05); d.translate((rnd() - 0.5) * 0.5, 0.1 + rnd() * 0.06, (rnd() - 0.5) * 0.5); eg.push(d); }
  const embers = new THREE.Mesh(mergePlain(eg), emberMat || (emberMat = new THREE.MeshBasicMaterial({ color: 0xff7a30 })));
  embers.name = 'embers'; g.add(embers);
  // 연기: 한 번에 그리는 공 여러 개(커지며 올라가 옅어진다)
  const smoke = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.3, 1), smokeMat || (smokeMat = new THREE.MeshLambertMaterial({ color: 0xe4e6ea, transparent: true, opacity: 0.5, depthWrite: false })), puffs);
  smoke.name = 'smoke'; g.add(smoke);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
  const ph = [...Array(puffs)].map((_, i) => i / puffs);
  const update = (dt, t) => {
    for (let i = 0; i < puffs; i++) {
      const k = (t * 0.22 + ph[i]) % 1;
      v.set(Math.sin(k * 5 + i) * 0.25 + k * 0.9, 0.4 + k * 4.2, Math.cos(k * 4 + i) * 0.2);
      s.setScalar(0.5 + k * 2.2 * (1 - k * 0.35));
      smoke.setMatrixAt(i, m.compose(v, q, s));
    }
    smoke.instanceMatrix.needsUpdate = true;
    emberMat.color.setHSL(0.06, 1, 0.5 + Math.sin(t * 5) * 0.06);
  };
  update(0, 0);
  g.userData.update = update;
  return g;
}
function mergePlain(geos) {
  const B = vcBuilder();
  for (const gg of geos) B.add(gg, 0xffffff);
  return B.geometry();
}

// ── 눈 덮인 소나무 여러 그루(한 번에 그린다) ──
export function snowPines(spots) {
  const B = vcBuilder();
  for (const [x, z, s = 1] of spots) {
    B.cyl(0.18 * s, 0.25 * s, 1.6 * s, 6, 0x6a4a36, [x, 0.8 * s, z]);
    for (let i = 0; i < 3; i++) {
      const r = (1.7 - i * 0.42) * s, y = (1.4 + i * 1.15) * s, h = 1.7 * s;
      B.add(new THREE.ConeGeometry(r, h, 8), i % 2 ? 0x447458 : P.pine, [x, y + h / 2, z], [0, rnd() * 3, 0]);
      B.add(new THREE.ConeGeometry(r * 0.78, h * 0.5, 8), P.snow, [x, y + h * 0.78, z], [0, rnd() * 3, 0]);
    }
  }
  return meshOf(B, 'pines');
}

// ── 눈 땅: 큰 판에 부드러운 굴곡(걷는 곳은 평평), 푸르스름한 그늘과 밟힌 길 ──
function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function noise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  return (hash(ix, iz) * (1 - sx) + hash(ix + 1, iz) * sx) * (1 - sz) + (hash(ix, iz + 1) * (1 - sx) + hash(ix + 1, iz + 1) * sx) * sz;
}
export function snowGround({ size = 260, flat = { x0: -40, x1: 40, z0: -30, z1: 30 }, paths = [] } = {}) {
  const geo = new THREE.PlaneGeometry(size, size, 130, 130); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, n = p.count, col = new Float32Array(n * 3);
  const snow = new THREE.Color(P.snow), shade = new THREE.Color(P.snowShade), earth = new THREE.Color(P.earth), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const out = Math.hypot(Math.max(flat.x0 - x, 0, x - flat.x1), Math.max(flat.z0 - z, 0, z - flat.z1));
    const hill = Math.min(1, out / 30);
    p.setY(i, hill * hill * (noise(x * 0.05, z * 0.05) * 14 + 2) + noise(x * 0.3, z * 0.3) * 0.12);
    c.copy(snow).lerp(shade, noise(x * 0.12 + 9, z * 0.12) * 0.75);
    for (const q of paths) { // 밟힌 길: 선분에서 가까우면 흙빛이 비친다
      const [ax, az, bx, bz, w] = q, dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2)), d = Math.hypot(x - ax - t * dx, z - az - t * dz);
      if (d < w) c.lerp(earth, (1 - d / w) * 0.55 * (0.7 + noise(x * 0.8, z * 0.8) * 0.3));
    }
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.computeVertexNormals();
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  m.name = 'snowGround'; m.receiveShadow = true;
  return m;
}

// 먼 눈산 세 겹(멀수록 하늘빛)
export function farMountains() {
  const B = vcBuilder();
  const layers = [[130, 0x9fb6cc, 26], [160, 0xb6c8d8, 34], [190, 0xc8d6e2, 42]];
  for (const [R, color, H] of layers) for (let i = 0; i < 22; i++) {
    const a = i / 22 * Math.PI * 2 + R, h = H * (0.6 + rnd() * 0.6), r = h * (1.3 + rnd() * 0.6);
    const x = Math.cos(a) * R, z = Math.sin(a) * R;
    B.add(new THREE.ConeGeometry(r, h, 7), color, [x, h / 2 - 2, z], [0, rnd() * 3, 0]);
    B.add(new THREE.ConeGeometry(r * 0.36, h * 0.36, 7), 0xf6f8fb, [x, h - 2 - h * 0.18 + 0.2, z], [0, rnd() * 3, 0]);
  }
  const m = B.mesh(toonMat(), 'mountains'); m.castShadow = false;
  return m;
}

// 내리는 눈(화질 보통 이상): 점 하나로 그린다
export function snowfall({ count = 700, area = 60, center = [0, 0, 0] } = {}) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) pos.set([center[0] + (rnd() - 0.5) * area, rnd() * 26, center[2] + (rnd() - 0.5) * area], i * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const cv = document.createElement('canvas'); cv.width = cv.height = 32;
  const x = cv.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.28, map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, color: 0xffffff }));
  pts.name = 'snowfall';
  pts.userData.update = (dt, t) => {
    const a = geo.attributes.position;
    for (let i = 0; i < count; i++) {
      let y = a.getY(i) - dt * (1.6 + (i % 5) * 0.25);
      if (y < 0) y += 26;
      a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t * 0.8 + i) * dt * 0.3);
    }
    a.needsUpdate = true;
  };
  return pts;
}

// ── 2장 흥화진 세트 한 벌: 성벽(가운데 성문·옹성), 망루, 성 밖 사다리, 깃발, 성안 기와집 3동·장독대·나무 더미·모닥불·계단, 소나무·먼 산·눈 ──
export function buildHeunghwaSet(parent, { snow = true } = {}) {
  seed = 7;
  const root = new THREE.Group(); root.name = 'heunghwaSet'; parent.add(root);
  const updates = [];
  const put = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; root.add(o); if (o.userData.update) updates.push(o.userData.update); return o; };
  const H = 4.2, T = 3.2;
  put(snowGround({ flat: { x0: -45, x1: 45, z0: -28, z1: 30 }, paths: [[0, -26, 0, 4, 2.4], [0, 4, -12, 14, 1.6], [0, 4, 12, 13, 1.6], [0, 4, 0, 18, 1.8]] }), 0, 0, 0);
  put(gateWithOngseong({ height: 4.6, depth: T + 2.8 }), 0, 0, 0);
  for (const [x0, x1] of [[-40, -5], [5, 40]]) put(cityWall({ length: x1 - x0, height: H, thick: T }), (x0 + x1) / 2, 0, 0);
  put(watchtower({ h: 3.0 }), -20, H + 0.1, 0.2);
  put(watchtower({ h: 3.0 }), 26, H + 0.1, 0.2);
  // 성안에서 성벽 위로 오르는 돌계단
  const S = vcBuilder();
  for (let i = 0; i < 9; i++) S.box(2.4, (i + 1) * H / 9, 0.6, i % 2 ? 0xa89a88 : 0xb2a593, [0, (i + 1) * H / 18, T / 2 + 5.4 - i * 0.6]);
  for (let i = 0; i < 9; i++) S.box(2.2, 0.06, 0.4, P.snow, [0, (i + 1) * H / 9 + 0.03, T / 2 + 5.4 - i * 0.6]);
  put(meshOf(S, 'stairs'), -9, 0, 0);
  for (const [x, ry] of [[-30, 0], [-14, 0], [14, 0], [32, 0]]) put(flag({}), x, H + 0.1, 0.9, ry);
  for (const x of [-2.6, 2.6]) put(flag({ h: 3.4, w: 1.1, ch: 1.5 }), x, 4.75, -1.6);
  put(giwaHouse({}), -13, 0, 15, 0.25);
  put(giwaHouse({ w: 7.2, d: 4.6 }), 1, 0, 21);
  put(giwaHouse({ w: 5.4, d: 4.0, wall: 0xf0e2c8 }), 14, 0, 14.5, -0.3);
  put(jangdok(), -17.5, 0, 9.8, 0.3);
  put(woodpile(), 9.5, 0, 9.5, -0.5);
  put(woodpile(), 18.2, 0, 10.5, 0.2);
  put(campfire(), -4.5, 0, 9.5);
  // 성 밖: 거란군이 걸어 놓은 사다리(바깥 면에 비스듬히)
  const ladders = [];
  for (const x of [-18, 12, 20]) { const len = 6.8, tilt = 0.3; const l = put(ladder({ len }), x, 0, -T / 2 - 0.1 - len * Math.sin(tilt)); l.rotation.x = tilt; ladders.push(l); }
  // 소나무: 성안 몇 그루, 성 밖 들판과 언덕에 무리
  const pines = [[-24, 14, 1.1], [24, 18, 1.2], [-6, 26, 1], [30, 6, 0.9], [-34, 8, 1.1]];
  for (let i = 0; i < 40; i++) { const a = rnd() * Math.PI * 2, r = 50 + rnd() * 45; pines.push([Math.cos(a) * r, Math.sin(a) * r, 0.9 + rnd() * 0.8]); }
  for (let i = 0; i < 10; i++) pines.push([-45 + rnd() * 90, -30 - rnd() * 14, 0.8 + rnd() * 0.5]);
  put(snowPines(pines), 0, 0, 0);
  put(farMountains(), 0, 0, 0);
  let fall = null;
  if (snow) fall = put(snowfall({ area: 80, center: [0, 0, 0] }), 0, 0, 0);
  return { root, ladders, wallHeight: H, wallThick: T, update: (dt, t) => { for (const u of updates) u(dt, t); } };
}
