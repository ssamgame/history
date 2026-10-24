// 건물·소품 모양(근대·일제 강점기·현대편 장 부품 상자에서 쓴다). 상자 하나로 끝내지 않고 기단·기둥·창살·처마를 갖춘다.
// 태블릿 성능을 위해 한 건물의 조각들을 재질별로 하나로 합쳐(merge) 그린다: 건물 하나에 그리기 서너 번.
// 모두 (0,0,0) 기준, 앞은 +z. 부딪힘 자리는 town.js가 정한다(예전 크기와 같게 두어 이동·미니게임이 그대로 되게).
import * as THREE from 'three';
import { mat } from '../../core/people.js';
import { worldMapped } from '../../core/textures.js';

const V = new THREE.Vector3(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(1, 1, 1), M = new THREE.Matrix4();

// 여러 도형을 한 덩어리로 합친다
export function merge(geos) {
  const pos = [], nor = [], uv = [], idx = [];
  let base = 0;
  for (const g of geos) {
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0); }
    if (g.index) for (let i = 0; i < g.index.count; i++) idx.push(g.index.getX(i) + base);
    else for (let i = 0; i < p.count; i++) idx.push(i + base);
    base += p.count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  return out;
}

// 매끈한 면(지붕 곡선)용 재질: 무늬는 같고 면을 각지게 하지 않는다
const smoothMats = new Map();
function smoothMat(color, kind) {
  const key = `${color}:${kind}`;
  if (!smoothMats.has(key)) smoothMats.set(key, worldMapped(new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }), kind));
  return smoothMats.get(key);
}

// 창살 문·창(종이 바른 격자): 그림 파일 없이 캔버스로
let latticeMat = null, glassMat = null;
function lattice() {
  if (latticeMat) return latticeMat;
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 96;
  const c = cv.getContext('2d');
  c.fillStyle = '#efe6cf'; c.fillRect(0, 0, 64, 96);
  c.fillStyle = '#6b4a32';
  for (let x = 0; x <= 64; x += 10.6) c.fillRect(Math.round(x) - 1, 0, 2, 96);
  for (let y = 0; y <= 96; y += 12) c.fillRect(0, Math.round(y) - 1, 64, 2);
  c.lineWidth = 6; c.strokeStyle = '#5a3f2a'; c.strokeRect(0, 0, 64, 96);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  latticeMat = new THREE.MeshLambertMaterial({ map: t });
  return latticeMat;
}
// 서양식 유리창: 네 칸 창틀과 하늘이 비친 유리
function glass() {
  if (glassMat) return glassMat;
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 96;
  const c = cv.getContext('2d');
  const gr = c.createLinearGradient(0, 0, 64, 96); gr.addColorStop(0, '#9fb8c8'); gr.addColorStop(0.5, '#3f5a6e'); gr.addColorStop(1, '#2a3a48');
  c.fillStyle = gr; c.fillRect(0, 0, 64, 96);
  c.fillStyle = '#e9e2d2'; c.fillRect(30, 0, 4, 96); c.fillRect(0, 46, 64, 4);
  c.lineWidth = 6; c.strokeStyle = '#e9e2d2'; c.strokeRect(0, 0, 64, 96);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  glassMat = new THREE.MeshLambertMaterial({ map: t });
  return glassMat;
}

// 조각 모음: add(도형, 색, 무늬, [x,y,z], [rx,ry,rz])로 모으고 into(g)로 재질별 한 덩어리씩 넣는다
function parts() {
  const groups = new Map();
  const api = {
    add(geo, color, kind, [x, y, z], [rx, ry, rz] = [0, 0, 0], opt = {}) {
      M.compose(V.set(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), S);
      geo.applyMatrix4(M);
      const key = opt.material ? `m:${opt.material.uuid}` : `${color}:${kind}:${opt.smooth ? 1 : 0}`;
      if (!groups.has(key)) groups.set(key, { geos: [], color, kind, smooth: opt.smooth, material: opt.material, shadow: opt.shadow !== false });
      groups.get(key).geos.push(geo);
      return api;
    },
    box(w, h, d, color, kind, at, rot, opt) { return api.add(new THREE.BoxGeometry(w, h, d), color, kind, at, rot, opt); },
    cyl(r0, r1, h, seg, color, kind, at, rot, opt) { return api.add(new THREE.CylinderGeometry(r0, r1, h, seg), color, kind, at, rot, opt); },
    into(g) {
      for (const p of groups.values()) {
        const m = new THREE.Mesh(merge(p.geos), p.material || (p.smooth ? smoothMat(p.color, p.kind) : mat(p.color, p.kind)));
        m.castShadow = p.shadow; m.receiveShadow = true; g.add(m);
      }
      return g;
    },
  };
  return api;
}

// 처마가 들린 우진각 지붕 면. W×D 바닥, 높이 H. profile: 'tile'(오목, 처마 끝이 들림) 또는 'thatch'(둥글게 부푼 초가)
// 위면과 서까래가 보이는 아랫면(두께 thick)을 함께 돌려준다.
export function roofSurface({ W, D, H, lift = 0, profile = 'tile', thick = 0.14, nx = 18, nz = 14 }) {
  const half = D / 2;
  const height = (x, z) => {
    const t = Math.max(0, Math.min(1, Math.min((W / 2 - Math.abs(x)) / half, (D / 2 - Math.abs(z)) / half)));
    const prof = profile === 'thatch' ? Math.pow(t, 0.75) : Math.pow(t, 1.35);
    const cx = Math.abs(x) / (W / 2), cz = Math.abs(z) / (D / 2);
    const corner = Math.pow(cx, 3) * Math.pow(cz, 3); // 네 귀퉁이 처마가 하늘로 들린다(추녀)
    const edge = Math.pow(Math.max(cx, cz), 6) * 0.25;  // 처마 선 전체도 살짝 휜다(앙곡)
    return H * prof + lift * (corner + edge) * Math.pow(1 - t, 2);
  };
  const mk = (dy, flip) => {
    const g = new THREE.PlaneGeometry(W, D, nx, nz); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, height(p.getX(i), p.getZ(i)) + dy);
    if (flip) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const a = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = a; } }
    g.computeVertexNormals();
    return g;
  };
  return { top: mk(0, false), under: mk(-thick, true), ridgeY: H, ridgeLen: Math.max(0.4, W - D) };
}

const WOOD = 0x6b4a32, DARKWOOD = 0x4e3826, PLASTER = 0xe9e2cf, STONE = 0xb3ab99, TILE = 0x3d4846, RIDGE = 0x2c3331;

// 한옥: 돌 기단과 계단, 둥근 기둥, 툇마루, 창살 문과 창, 흰 회벽과 나무 틀, 처마가 들린 기와지붕(또는 둥근 초가지붕)
export function hanok(g, p = {}) {
  const P = parts(), tile = !!p.tile;
  const base = tile ? 0.45 : 0.3, wallTop = base + 1.95;
  // 기단(기와집은 다듬은 돌, 초가는 흙과 막돌)과 앞 계단
  P.box(4.7, base, 3.9, tile ? STONE : 0x9a8a6e, 'stone', [0, base / 2, 0]);
  P.box(1.5, base * 0.5, 0.45, tile ? 0xc2baa8 : 0x9a8a6e, 'stone', [0.7, base * 0.25, 2.17]);
  if (tile) P.box(1.5, base * 0.5, 0.4, 0xc2baa8, 'stone', [0.7, base * 0.75, 1.92]);
  // 몸채: 앞은 툇마루만큼 들어가 있다
  const wallColor = tile ? PLASTER : 0xcdb58e;
  P.box(3.9, 1.95, 2.5, wallColor, tile ? 'grain' : 'earth', [0, base + 0.975, -0.3]);
  // 툇마루
  P.box(4.0, 0.12, 0.7, 0x8a6a48, 'wood', [0, base + 0.42, 1.25]);
  P.box(4.0, 0.36, 0.08, DARKWOOD, 'wood', [0, base + 0.18, 1.58]);
  // 기둥: 앞줄 넷, 뒷줄 넷, 옆 가운데
  const colR = tile ? 0.11 : 0.1;
  for (const x of [-1.95, -0.65, 0.65, 1.95]) for (const z of [1.55, -1.55]) P.cyl(colR, colR * 1.1, 1.95, 8, WOOD, 'wood', [x, base + 0.975, z]);
  for (const x of [-1.95, 1.95]) P.cyl(colR, colR * 1.1, 1.95, 8, WOOD, 'wood', [x, base + 0.975, 0]);
  // 나무 틀: 벽 아래·위 가로대(인방)와 처마 밑 도리
  for (const z of [0.96, -1.56]) for (const y of [base + 0.12, wallTop - 0.1]) P.box(3.96, 0.13, 0.1, WOOD, 'wood', [0, y, z]);
  for (const x of [-1.96, 1.96]) for (const y of [base + 0.12, wallTop - 0.1]) P.box(0.1, 0.13, 2.55, WOOD, 'wood', [x, y, -0.3]);
  for (const z of [1.55, -1.55]) P.box(4.3, 0.16, 0.16, DARKWOOD, 'wood', [0, wallTop + 0.06, z]);
  for (const x of [-1.95, 1.95]) P.box(0.16, 0.16, 3.4, DARKWOOD, 'wood', [x, wallTop + 0.06, 0]);
  // 창살 문 두 짝(앞)과 옆·뒤 창
  for (const x of [-0.65, 0.65]) P.box(0.95, 1.45, 0.05, 0, null, [x, base + 0.95, 0.98], [0, 0, 0], { material: lattice() });
  for (const x of [-1.5, 1.5]) P.box(0.6, 0.7, 0.05, 0, null, [x, base + 1.15, 0.98], [0, 0, 0], { material: lattice() });
  for (const s of [-1, 1]) P.box(0.05, 0.6, 0.8, 0, null, [s * 1.98, base + 1.2, -0.3], [0, 0, 0], { material: lattice() });
  P.box(0.7, 0.55, 0.05, 0, null, [0.9, base + 1.25, -1.58], [0, 0, 0], { material: lattice() });
  // 지붕
  if (tile) {
    const r = roofSurface({ W: 6.0, D: 4.9, H: 1.55, lift: 0.55, profile: 'tile' });
    P.add(r.top, TILE, 'tile', [0, wallTop + 0.12, 0], [0, 0, 0], { smooth: true });
    P.add(r.under, 0x7a5a3c, 'wood', [0, wallTop + 0.12, 0], [0, 0, 0], { smooth: true, shadow: false });
    // 용마루와 양 끝의 망와
    const ry = wallTop + 0.12 + r.ridgeY;
    P.box(r.ridgeLen + 0.5, 0.3, 0.34, RIDGE, 'tile', [0, ry + 0.08, 0]);
    P.box(r.ridgeLen + 0.7, 0.1, 0.42, 0xd8d0bc, 'stone', [0, ry - 0.06, 0]);
    for (const s of [-1, 1]) P.box(0.22, 0.42, 0.42, RIDGE, 'tile', [s * (r.ridgeLen / 2 + 0.3), ry + 0.18, 0], [0, 0, s * 0.25]);
  } else {
    const r = roofSurface({ W: 5.4, D: 4.3, H: 1.9, profile: 'thatch', thick: 0.3 });
    P.add(r.top, p.roofColor ?? 0xd2b07a, p.roofColor ? 'grain' : 'thatch', [0, wallTop + 0.05, 0], [0, 0, 0], { smooth: true }); // roofColor: 눈 덮인 지붕 등
    P.add(r.under, 0x8a6a48, 'grain', [0, wallTop + 0.05, 0], [0, 0, 0], { smooth: true, shadow: false });
    // 지붕을 묶은 새끼줄(용마름)
    P.cyl(0.14, 0.14, r.ridgeLen + 0.6, 8, 0xa8885a, 'grain', [0, wallTop + 0.05 + r.ridgeY, 0], [0, 0, Math.PI / 2]);
  }
  return P.into(g);
}

// 서양식 벽돌 건물: 받침돌, 모서리 기둥, 층마다 띠, 창틀·창턱·창 위 돌, 계단과 차양이 있는 문, 낮은 지붕(탑이나 둥근 지붕이 없으면)
export function western(g, p = {}) {
  const P = parts();
  const w = p.w || 8, d = p.d || 5, h = p.h || 5, color = p.color || 0x9a4a32, trim = 0xd8d0bc;
  P.box(w + 0.4, 0.5, d + 0.4, 0xa39b8c, 'stone', [0, 0.25, 0]);
  P.box(w, h - 0.5, d, color, 'stone', [0, 0.5 + (h - 0.5) / 2, 0]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.box(0.45, h, 0.45, trim, 'stone', [sx * (w / 2 - 0.1), h / 2, sz * (d / 2 - 0.1)]);
  const floors = Math.max(1, Math.floor(h / 2.4));
  for (let f = 1; f < floors; f++) P.box(w + 0.12, 0.16, d + 0.12, trim, 'stone', [0, f * 2.2 + 0.2, 0]);
  P.box(w + 0.5, 0.35, d + 0.5, trim, 'stone', [0, h, 0]); // 처마 돌림띠
  // 창: 앞면·뒷면·옆면
  const win = (x, y, z, ry) => {
    const n = [Math.sin(ry), 0, Math.cos(ry)];
    const at = k => [x + n[0] * k, y, z + n[2] * k];
    P.box(0.92, 1.3, 0.05, trim, 'stone', at(0.02), [0, ry, 0]);
    P.box(0.7, 1.1, 0.05, 0, null, at(0.05), [0, ry, 0], { material: glass() });
    P.box(1.0, 0.1, 0.22, trim, 'stone', [x + n[0] * 0.1, y - 0.68, z + n[2] * 0.1], [0, ry, 0]);
    P.box(1.04, 0.2, 0.12, trim, 'stone', [x + n[0] * 0.06, y + 0.74, z + n[2] * 0.06], [0, ry, 0]);
  };
  const cols = Math.max(1, Math.floor((w - 1) / 1.6));
  for (let f = 0; f < floors; f++) {
    const y = 1.5 + f * 2.2;
    for (let i = 0; i < cols; i++) {
      const x = -((cols - 1) * 1.6) / 2 + i * 1.6;
      if (!(f === 0 && Math.abs(x) < 0.9)) win(x, y, d / 2, 0); // 문 자리는 비운다
      win(x, y, -d / 2, Math.PI);
    }
    const sc = Math.max(1, Math.floor((d - 1) / 1.6));
    for (let i = 0; i < sc; i++) { const z = -((sc - 1) * 1.6) / 2 + i * 1.6; win(w / 2, y, z, Math.PI / 2); win(-w / 2, y, z, -Math.PI / 2); }
  }
  // 문: 문틀, 두 짝 문, 계단, 세모 차양
  P.box(1.6, 2.3, 0.1, trim, 'stone', [0, 1.65, d / 2 + 0.03]);
  P.box(1.3, 2.0, 0.08, 0x3a2c20, 'wood', [0, 1.5, d / 2 + 0.07]);
  P.box(0.04, 2.0, 0.1, 0x22180f, 'wood', [0, 1.5, d / 2 + 0.1]);
  P.box(2.2, 0.25, 0.6, 0xa39b8c, 'stone', [0, 0.38, d / 2 + 0.5]);
  P.box(2.6, 0.25, 0.6, 0xa39b8c, 'stone', [0, 0.13, d / 2 + 0.9]);
  P.box(2.0, 0.12, 0.7, trim, 'stone', [0, 2.78, d / 2 + 0.36]); // 문 위 차양
  const tri = new THREE.Shape([new THREE.Vector2(-1.05, 0), new THREE.Vector2(1.05, 0), new THREE.Vector2(0, 0.55)]);
  P.add(new THREE.ExtrudeGeometry(tri, { depth: 0.16, bevelEnabled: false }), trim, 'stone', [0, 2.84, d / 2 + 0.55]); // 세모 박공
  // 지붕: 탑·둥근 지붕이 없는 건물은 낮은 슬레이트 지붕
  if (!p.tower && !p.dome && !p.flat) {
    const r = roofSurface({ W: w + 0.6, D: d + 0.6, H: Math.min(2.2, d * 0.35), profile: 'tile', thick: 0.1 });
    P.add(r.top, 0x4a4f55, 'tile', [0, h + 0.17, 0], [0, 0, 0], { smooth: true });
    P.add(r.under, 0x5a4a3a, 'wood', [0, h + 0.17, 0], [0, 0, 0], { smooth: true, shadow: false });
    for (const s of [-1, 1]) P.box(0.5, 1.4, 0.5, color, 'stone', [s * w * 0.28, h + 1.1, -d * 0.12]); // 굴뚝
  }
  if (p.tower) {
    P.box(1.9, 3, 1.9, color, 'stone', [0, h + 1.5, 0]);
    for (const s of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) P.box(0.5, 0.9, 0.05, 0, null, [Math.sin(s) * 0.98, h + 1.9, Math.cos(s) * 0.98], [0, s, 0], { material: glass() });
    P.box(2.2, 0.25, 2.2, trim, 'stone', [0, h + 3.1, 0]);
    P.add(new THREE.ConeGeometry(1.45, 3.4, 4), 0x3d4846, 'tile', [0, h + 4.9, 0], [0, Math.PI / 4, 0]);
  }
  if (p.dome) {
    P.cyl(1.9, 1.9, 1.4, 16, trim, 'stone', [0, h + 0.7, 0]);
    P.add(new THREE.SphereGeometry(1.9, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2), 0x6f8a86, 'grain', [0, h + 1.4, 0], [0, 0, 0], { smooth: true });
    P.cyl(0.08, 0.08, 1.2, 6, 0x3a3a3a, 'grain', [0, h + 3.8, 0]);
  }
  return P.into(g);
}

// 활엽수: 굽은 줄기와 가지, 잎 덩어리 여럿(색이 조금씩 다르다). seed가 같으면 같은 모양.
export function tree(g, p = {}) {
  const P = parts();
  let s = Math.abs(Math.round((p.x || 0) * 13 + (p.z || 0) * 7)) + 3;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const base = new THREE.Color(p.color || 0x4f7344);
  // kind: 'pine'(굽은 붉은 줄기의 소나무, 납작한 잎 층) 'willow'(물가 버드나무, 늘어진 잎) 'bare'(겨울 빈 가지) 'poplar'(길가의 키 큰 미루나무)
  if (p.kind === 'pine') {
    P.cyl(0.16, 0.3, 4.2, 7, 0x8a4a32, 'wood', [0.25, 2.1, 0], [0.04, 0, -0.14]);
    [[0.6, 4.4, 0, 1.7], [-0.3, 3.6, 0.3, 1.3], [0.9, 3.2, -0.4, 1.1]].forEach(([x, y, z, rad]) => {
      const c = new THREE.Color(p.color || 0x3f5f3a).multiplyScalar(0.85 + r() * 0.3).getHex();
      const geo = new THREE.SphereGeometry(rad, 8, 5); geo.scale(1, 0.38, 1);
      P.add(geo, c, 'grain', [x, y, z]);
    });
    return P.into(g);
  }
  if (p.kind === 'willow') { // 늘어진 가지: 가늘고 긴 잎 줄기를 둥글게 늘어뜨린다
    P.cyl(0.22, 0.36, 2.8, 7, 0x5e4330, 'wood', [0, 1.4, 0], [0.08, 0, 0.05]);
    const leaf = new THREE.Color(p.color || 0x8aa85a);
    P.add(new THREE.IcosahedronGeometry(1.3, 1).scale(1.2, 0.7, 1.2), leaf.getHex(), 'grain', [0, 3.7, 0]);
    for (let k = 0; k < 12; k++) {
      const a = k * (Math.PI * 2 / 12) + r() * 0.3, rad = 1.1 + r() * 0.5, len = 1.8 + r() * 0.9;
      const geo = new THREE.CylinderGeometry(0.22, 0.05, len, 5); geo.translate(0, -len / 2, 0);
      P.add(geo, leaf.clone().multiplyScalar(k % 2 ? 0.85 : 1.05).getHex(), 'grain', [Math.sin(a) * rad, 3.7, Math.cos(a) * rad], [Math.cos(a) * 0.15, 0, -Math.sin(a) * 0.15]);
    }
    return P.into(g);
  }
  if (p.kind === 'bare') {
    P.cyl(0.18, 0.3, 2.6, 6, 0x4e3a2a, 'wood', [0, 1.3, 0]);
    for (let k = 0; k < 6; k++) {
      const a = k * 1.05 + r(), up = 0.5 + r() * 0.4;
      P.cyl(0.03, 0.09, 1.9, 4, 0x4e3a2a, 'wood', [Math.sin(a) * 0.6, 3.0 + k * 0.1, Math.cos(a) * 0.6], [Math.cos(a) * up, 0, -Math.sin(a) * up]);
    }
    return P.into(g);
  }
  if (p.kind === 'poplar') {
    P.cyl(0.14, 0.22, 2.0, 6, 0x6b5a48, 'wood', [0, 1.0, 0]);
    const geo = new THREE.SphereGeometry(1, 8, 7); geo.scale(0.9, 3.0, 0.9);
    P.add(geo, p.color || 0x5a7a40, 'grain', [0, 4.6, 0]);
    return P.into(g);
  }
  P.cyl(0.2, 0.34, 2.4, 7, 0x5e4330, 'wood', [0, 1.2, 0], [0.05, 0, -0.06]);
  for (let k = 0; k < 3; k++) {
    const a = k * 2.1 + r();
    P.cyl(0.07, 0.13, 1.4, 5, 0x5e4330, 'wood', [Math.sin(a) * 0.45, 2.55, Math.cos(a) * 0.45], [Math.cos(a) * 0.7, 0, -Math.sin(a) * 0.7]);
  }
  const blobs = [[0, 3.5, 0, 1.45], [0.9, 3.1, 0.3, 1.0], [-0.8, 3.2, -0.4, 1.05], [0.2, 4.2, -0.5, 0.95], [-0.3, 3.0, 0.9, 0.9]];
  blobs.forEach(([x, y, z, rad], i) => {
    const c = base.clone().multiplyScalar(0.85 + r() * 0.3).getHex();
    P.add(new THREE.IcosahedronGeometry(rad, 1), i % 2 ? c : base.getHex(), 'grain', [x, y, z]);
  });
  return P.into(g);
}

// 돌담: 막돌을 쌓은 담과 위에 얹은 기와(지붕처럼 양쪽으로 흘러내린다)
export function wall(g, p = {}) {
  const P = parts(), w = p.w || 10, h = p.h || 2;
  P.box(w, h, 0.8, p.color || 0x8c8577, 'stone', [0, h / 2, 0]);
  P.box(w + 0.1, 0.25, 0.95, 0x9a9384, 'stone', [0, 0.12, 0]);
  if (h <= 3) {
    for (const s of [-1, 1]) P.box(w + 0.3, 0.12, 0.62, TILE, 'tile', [0, h + 0.14, s * 0.24], [s * 0.45, 0, 0]);
    P.box(w + 0.35, 0.16, 0.2, RIDGE, 'tile', [0, h + 0.3, 0]);
  }
  return P.into(g);
}

// 판잣집: 덧댄 판자 벽, 기운 함석지붕(골이 진), 굴뚝, 기운 문
export function shack(g) {
  const P = parts();
  P.box(3.2, 2, 2.6, 0x8a7a62, 'wood', [0, 1, 0]);
  P.box(1.2, 0.9, 0.05, 0x6f6450, 'wood', [-0.8, 1.2, 1.31], [0, 0, 0.05]);
  P.box(0.8, 1.4, 0.06, 0x3a2c20, 'wood', [0.6, 0.7, 1.32]);
  for (let i = 0; i < 7; i++) P.box(0.12, 0.08, 3.1, i % 2 ? 0x7a7872 : 0x6b6862, 'grain', [-1.6 + i * 0.53, 2.2 - i * 0.06, 0], [0, 0, 0.11]);
  P.box(3.7, 0.06, 3.1, 0x6b6862, 'grain', [0, 2.12, 0], [0, 0, 0.11]);
  P.cyl(0.1, 0.1, 1.2, 6, 0x3a3a3a, 'grain', [1.1, 2.6, -0.6]);
  return P.into(g);
}

// ── 새 소품(배치표에서 type으로 쓰고, 마을 꾸미기에도 쓴다) ──
// 장독대: 낮은 돌 단 위의 크고 작은 항아리
export function jars(g, p = {}) {
  const P = parts(), n = p.n || 5;
  P.box(2.2, 0.3, 1.3, 0x9a9384, 'stone', [0, 0.15, 0]);
  const pot = rad => new THREE.LatheGeometry([[0, 0], [rad * 0.7, 0], [rad, rad * 0.9], [rad * 0.95, rad * 1.5], [rad * 0.55, rad * 1.85], [rad * 0.6, rad * 1.95], [0, 1.95 * rad]].map(([x, y]) => new THREE.Vector2(x, y)), 10);
  for (let i = 0; i < n; i++) {
    const rad = i % 2 ? 0.26 : 0.36, x = -0.75 + (i % 3) * 0.75, z = i < 3 ? -0.25 : 0.3;
    P.add(pot(rad), 0x5a3a26, 'grain', [x, 0.3, z], [0, 0, 0], { smooth: true });
    P.cyl(rad * 0.62, rad * 0.62, 0.05, 10, 0x4a2e1e, 'grain', [x, 0.3 + rad * 1.97, z]);
  }
  return P.into(g);
}
// 수레: 짐칸과 큰 바퀴 둘, 앞으로 뻗은 손잡이
export function cart(g, p = {}) {
  const P = parts();
  P.box(1.4, 0.12, 2.2, 0x8a6a48, 'wood', [0, 0.85, 0]);
  for (const s of [-1, 1]) P.box(0.08, 0.35, 2.2, 0x7a5a3c, 'wood', [s * 0.7, 1.05, 0]);
  for (const s of [-1, 1]) {
    P.add(new THREE.TorusGeometry(0.62, 0.06, 6, 16), 0x5e4330, 'wood', [s * 0.82, 0.62, -0.1], [0, Math.PI / 2, 0]);
    for (let k = 0; k < 4; k++) P.box(0.05, 1.2, 0.05, 0x5e4330, 'wood', [s * 0.82, 0.62, -0.1], [k * Math.PI / 4, 0, 0]);
  }
  for (const s of [-1, 1]) P.box(0.08, 0.08, 1.6, 0x6b4a32, 'wood', [s * 0.55, 0.75, 1.8], [0.25, 0, 0]);
  if (p.load) for (let i = 0; i < 4; i++) P.cyl(0.3, 0.3, 0.75, 8, 0xd8c08a, 'grain', [(i % 2) * 0.6 - 0.3, 1.2, -0.5 + Math.floor(i / 2) * 0.8], [0, 0, Math.PI / 2]);
  return P.into(g);
}
// 짚더미(볏가리)
export function straw(g) {
  const P = parts();
  P.add(new THREE.SphereGeometry(1, 12, 8), 0xc9a865, 'grain', [0, 0.75, 0], [0, 0, 0], { smooth: true });
  P.add(new THREE.ConeGeometry(0.7, 0.8, 10), 0xb8955a, 'grain', [0, 1.85, 0]);
  return P.into(g);
}
// 장작더미: 차곡차곡 쌓은 통나무
export function woodpile(g) {
  const P = parts();
  for (let row = 0; row < 3; row++) for (let i = 0; i < 5 - row; i++) P.cyl(0.14, 0.14, 1.3, 7, row % 2 ? 0x8a6a48 : 0x7a5a3c, 'wood', [-0.6 + i * 0.3 + row * 0.15, 0.14 + row * 0.26, 0], [Math.PI / 2, 0, 0]);
  return P.into(g);
}
// 가로등(근대 이후 거리): 쇠기둥과 등
export function lamp(g) {
  const P = parts();
  P.cyl(0.07, 0.1, 3.4, 8, 0x2b2b2b, 'grain', [0, 1.7, 0]);
  P.box(0.5, 0.08, 0.08, 0x2b2b2b, 'grain', [0.2, 3.35, 0]);
  P.add(new THREE.ConeGeometry(0.25, 0.3, 6), 0x2b2b2b, 'grain', [0.42, 3.25, 0]);
  P.add(new THREE.SphereGeometry(0.14, 8, 6), 0xfff1c8, 'grain', [0.42, 3.08, 0], [0, 0, 0], { shadow: false });
  return P.into(g);
}

// 고려·조선편 장면에서 쓰는 기와지붕: 예전 네모뿔(우진각) 자리에 그대로, 처마가 들리고 서까래가 보이는 곡선 지붕을 얹는다.
// (parent, 가로, 세로, 높이, 색, x, y(처마 높이), z). 세로가 더 길면 용마루가 앞뒤로 놓인다.
export function curvedHipRoof(parent, w, d, h, color, x, y, z) {
  const P = parts(), along = w >= d, W = along ? w : d, D = along ? d : w;
  const r = roofSurface({ W, D, H: h, lift: Math.min(1.0, 0.15 + 0.08 * D), profile: 'tile', thick: Math.min(0.3, 0.05 + 0.02 * D) });
  const rot = along ? [0, 0, 0] : [0, Math.PI / 2, 0];
  P.add(r.top, color, 'tile', [0, 0, 0], rot, { smooth: true });
  P.add(r.under, 0x7a5a3c, 'wood', [0, 0, 0], rot, { smooth: true, shadow: false });
  const k = Math.min(1.6, 0.4 + 0.06 * D);
  const ridge = new THREE.BoxGeometry(r.ridgeLen + k, 0.22 * k, 0.26 * k);
  P.add(ridge, RIDGE, 'tile', [0, h + 0.06 * k, 0], rot);
  for (const s of [-1, 1]) { // 용마루 양 끝이 살짝 솟는다
    const end = new THREE.BoxGeometry(0.16 * k, 0.34 * k, 0.3 * k);
    const ex = s * (r.ridgeLen / 2 + 0.45 * k);
    P.add(end, RIDGE, 'tile', along ? [ex, h + 0.14 * k, 0] : [0, h + 0.14 * k, ex], along ? [0, 0, s * 0.3] : [s * -0.3, Math.PI / 2, 0]);
  }
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  return P.into(g);
}

// 서 있기만 하는 무리(사람 여럿)를 재질별 한 덩어리로 굳힌다: 사람 하나가 스무 번 넘게 그리던 것을 무리 전체가 몇 번에 그린다.
// skip(mesh)이 true인 조각(바람에 흔들리는 깃발 등)은 그대로 둔다. 걷기 움직임은 없어진다(움직이지 않는 무리에만 쓴다).
export function bakeStatic(group, skip = () => false) {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert(), rel = new THREE.Matrix4();
  const buckets = new Map(), keep = [];
  group.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh) return;
    if (skip(o)) { keep.push(o); return; }
    rel.multiplyMatrices(inv, o.matrixWorld);
    const geo = o.geometry.clone().applyMatrix4(rel);
    if (!geo.attributes.normal) geo.computeVertexNormals();
    const key = o.material.uuid;
    if (!buckets.has(key)) buckets.set(key, { mat: o.material, geos: [], shadow: o.castShadow });
    buckets.get(key).geos.push(geo);
  });
  for (const k of keep) { k.updateMatrixWorld(true); rel.multiplyMatrices(inv, k.matrixWorld); rel.decompose(k.position, k.quaternion, k.scale); }
  for (const c of [...group.children]) group.remove(c);
  for (const b of buckets.values()) { const m = new THREE.Mesh(merge(b.geos), b.mat); m.castShadow = b.shadow; m.receiveShadow = true; group.add(m); }
  for (const k of keep) group.add(k);
  return group;
}

// ── 근대 이후 탈것·천막 ──
const tri = (w, h, depth) => new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, h)]), { depth, bevelEnabled: false });
// 천막: 앞뒤가 세모인 맞배 천막, 가운데 기둥과 줄, 앞 출입구
export function tent(g, p = {}) {
  const P = parts(), c = p.color || 0xd8d0bc, W = 3.2, L = 3.4, H = 2.4;
  const slope = Math.hypot(W / 2, H), ang = Math.atan2(H, W / 2);
  for (const s of [-1, 1]) P.box(slope, 0.06, L, c, 'cloth', [s * W / 4, H / 2, 0], [0, 0, -s * ang]);
  P.add(tri(W, H, 0.05), c, 'cloth', [0, 0, -L / 2]);
  P.add(tri(W, H, 0.05), c, 'cloth', [0, 0, L / 2 - 0.05]);
  P.add(tri(1.1, 1.5, 0.06), 0x3a2c20, 'cloth', [0, 0, L / 2 - 0.02]); // 출입구
  P.cyl(0.05, 0.05, H + 0.3, 6, 0x5a3f2a, 'wood', [0, (H + 0.3) / 2, L / 2 + 0.05]);
  P.cyl(0.05, 0.05, H + 0.3, 6, 0x5a3f2a, 'wood', [0, (H + 0.3) / 2, -L / 2 - 0.05]);
  for (const s of [-1, 1]) for (const z of [-L / 2, L / 2]) P.cyl(0.012, 0.012, 1.9, 3, 0x8a7a62, 'grain', [s * 2.0, 0.8, z * 1.15], [z > 0 ? 0.25 : -0.25, 0, s * 0.9]);
  return P.into(g);
}
// 증기선: 뾰족한 뱃머리, 붉은 물선, 갑판, 흰 선실과 창, 굴뚝 둘, 돛대와 줄
export function steamship(g) {
  const P = parts();
  const hull = (scale, h) => { const sh = new THREE.Shape([new THREE.Vector2(-2.5 * scale, -8), new THREE.Vector2(2.5 * scale, -8), new THREE.Vector2(2.5 * scale, 4.5), new THREE.Vector2(0, 8.2), new THREE.Vector2(-2.5 * scale, 4.5)]); const geo = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false }); geo.rotateX(Math.PI / 2); return geo; };
  P.add(hull(1, 2.4), 0x2b2f36, 'grain', [0, 2.0, 0]);
  P.add(hull(1.02, 0.45), 0x8a2f24, 'grain', [0, 0.3, 0]);
  P.box(4.7, 0.14, 12, 0x8a6a48, 'wood', [0, 2.05, -1.4]);
  P.box(3.6, 1.7, 6.2, 0xe6dcc3, 'grain', [0, 2.95, -0.6]);
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) P.box(0.05, 0.55, 0.7, 0, null, [s * 1.82, 3.1, -3 + i * 1.2], [0, 0, 0], { material: glass() });
  P.box(2.6, 1.0, 2.4, 0xe6dcc3, 'grain', [0, 4.3, 0.8]);
  P.box(2.4, 0.4, 0.05, 0, null, [0, 4.4, 2.02], [0, 0, 0], { material: glass() });
  for (const dz of [-2.2, -0.2]) { P.cyl(0.55, 0.6, 3.2, 14, 0x8a2f24, 'grain', [0, 5.2, dz]); P.cyl(0.57, 0.57, 0.5, 14, 0x1e1c1a, 'grain', [0, 6.85, dz]); }
  for (const dz of [-6.5, 5]) { P.cyl(0.08, 0.1, 7, 6, 0x5a3f2a, 'wood', [0, 5.5, dz]); P.box(2.6, 0.08, 0.08, 0x5a3f2a, 'wood', [0, 7.2, dz]); }
  P.cyl(0.015, 0.015, 11.6, 3, 0x2b241c, 'grain', [0, 8.0, -0.75], [Math.PI / 2 - 0.02, 0, 0]);
  return P.into(g);
}
// 트럭(군용은 짐칸에 덮개): 앞(−z)에 보닛, 유리 낀 운전칸, 바퀴와 휠
export function truck(g, p = {}) {
  const P = parts(), c = p.color || 0x55603f, cover = p.cover ?? (!p.color || p.color === 0x55603f);
  P.box(2.0, 0.3, 5.0, 0x2b2b2b, 'grain', [0, 0.75, 0]);
  P.box(1.9, 0.75, 1.1, c, 'grain', [0, 1.25, -2.15]);
  P.box(2.1, 1.35, 1.5, c, 'grain', [0, 1.6, -1.0]);
  P.box(1.8, 0.6, 0.05, 0, null, [0, 1.95, -1.77], [-0.12, 0, 0], { material: glass() });
  for (const s of [-1, 1]) P.box(0.05, 0.55, 0.8, 0, null, [s * 1.06, 1.95, -1.0], [0, 0, 0], { material: glass() });
  P.box(2.1, 0.12, 3.2, c, 'grain', [0, 0.95, 1.0]);
  for (const s of [-1, 1]) P.box(0.08, 0.6, 3.2, c, 'grain', [s * 1.02, 1.3, 1.0]);
  P.box(2.1, 0.6, 0.08, c, 'grain', [0, 1.3, 2.58]);
  if (cover) { const geo = new THREE.CylinderGeometry(1.05, 1.05, 3.2, 12, 1, false, -Math.PI / 2, Math.PI); geo.rotateX(-Math.PI / 2); P.add(geo, 0x6b6a4a, 'cloth', [0, 1.55, 1.0], [0, 0, 0], { smooth: true }); }
  for (const dz of [-1.7, 1.6]) for (const s of [-1, 1]) {
    P.cyl(0.45, 0.45, 0.3, 14, 0x1e1c1a, 'grain', [s * 1.0, 0.45, dz], [0, 0, Math.PI / 2]);
    P.cyl(0.2, 0.2, 0.32, 8, 0x8a8a88, 'grain', [s * 1.01, 0.45, dz], [0, 0, Math.PI / 2]);
  }
  for (const s of [-0.6, 0.6]) P.cyl(0.1, 0.1, 0.06, 8, 0xfff1c8, 'grain', [s, 1.3, -2.71], [Math.PI / 2, 0, 0], { shadow: false });
  return P.into(g);
}
// 전차 몸통: 아래는 붉은 판, 위는 크림색에 유리창, 둥근 지붕, 집전봉(트롤리), 앞뒤 창과 등
export function tramCar(car) {
  const P = parts();
  P.box(2.2, 1.0, 6, 0xa8452a, 'grain', [0, 0.95, 0]);
  P.box(2.2, 1.1, 6, 0xe9dcb8, 'grain', [0, 2.0, 0]);
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) P.box(0.05, 0.7, 0.85, 0, null, [s * 1.11, 2.05, -2.3 + i * 1.15], [0, 0, 0], { material: glass() });
  for (const s of [-1, 1]) P.box(1.6, 0.7, 0.05, 0, null, [0, 2.05, s * 3.01], [0, 0, 0], { material: glass() });
  const roof = new THREE.CylinderGeometry(1.2, 1.2, 6.3, 14, 1, false, -Math.PI / 2, Math.PI); roof.rotateX(-Math.PI / 2); roof.scale(1, 0.32, 1);
  P.add(roof, 0x6b4a32, 'wood', [0, 2.55, 0], [0, 0, 0], { smooth: true });
  P.box(2.3, 0.12, 6.3, 0xe0c56a, 'grain', [0, 2.55, 0]);
  P.cyl(0.03, 0.03, 2.4, 4, 0x2b241c, 'grain', [0, 3.6, -0.6], [0.5, 0, 0]);
  for (const s of [-1, 1]) P.cyl(0.12, 0.12, 0.05, 8, 0xfff1c8, 'grain', [0, 1.2, s * 3.02], [Math.PI / 2, 0, 0], { shadow: false });
  for (const dz of [-2, 2]) for (const sx of [-0.6, 0.6]) P.cyl(0.35, 0.35, 0.15, 12, 0x2b241c, 'grain', [sx, 0.35, dz], [0, 0, Math.PI / 2]);
  return P.into(car);
}
// 부두: 판자와 물에 박힌 기둥
export function pier(g, p = {}) {
  const P = parts(), w = p.w || 8, d = p.d || 3;
  P.box(w, 0.3, d, 0x7a5a3c, 'wood', [0, 0.4, 0]);
  for (let x = -w / 2 + 0.4; x <= w / 2 - 0.3; x += 1.8) for (const z of [-d / 2 + 0.2, d / 2 - 0.2]) P.cyl(0.15, 0.15, 1.6, 7, 0x5e4330, 'wood', [x, -0.2, z]);
  for (const x of [-w / 2 + 0.6, w / 2 - 0.6]) P.cyl(0.18, 0.2, 0.5, 8, 0x3a3a3a, 'grain', [x, 0.8, d / 2 - 0.3]);
  return P.into(g);
}

// 돌로 쌓은 무지개 문(독립문 등): 화강암 몸채에 둥근 아치 문, 아치 머리돌, 처마 돌림띠와 난간, 이름 판. label: 앞에 새긴 글
export function arch(g, p = {}) {
  const P = parts(), W = 5.2, H = 6.2, D = 3, R = 1.15, SPRING = 2.6; // 아치 반지름·아치가 시작하는 높이
  const face = new THREE.Shape([new THREE.Vector2(-W / 2, 0), new THREE.Vector2(W / 2, 0), new THREE.Vector2(W / 2, H), new THREE.Vector2(-W / 2, H)]);
  const hole = new THREE.Path(); hole.moveTo(-R, 0); hole.lineTo(-R, SPRING); hole.absarc(0, SPRING, R, Math.PI, 0, true); hole.lineTo(R, 0); hole.lineTo(-R, 0);
  face.holes.push(hole);
  const body = new THREE.ExtrudeGeometry(face, { depth: D, bevelEnabled: false, curveSegments: 16 }); body.translate(0, 0, -D / 2);
  P.add(body, 0xd6d0c4, 'stone', [0, 0, 0]);
  P.box(W + 0.4, 0.4, D + 0.4, 0xc8c2b6, 'stone', [0, 0.2, 0]);                  // 받침
  P.box(W + 0.5, 0.35, D + 0.5, 0xc8c2b6, 'stone', [0, H + 0.1, 0]);             // 돌림띠
  P.box(W + 0.2, 0.6, D + 0.2, 0xd6d0c4, 'stone', [0, H + 0.58, 0]);            // 위 난간(막힌 돌담)
  P.box(W + 0.35, 0.12, D + 0.35, 0xc8c2b6, 'stone', [0, H + 0.94, 0]);
  P.box(0.5, 0.6, 0.12, 0xc8c2b6, 'stone', [0, SPRING + R - 0.1, D / 2 + 0.03]); // 아치 머리돌
  P.box(0.5, 0.6, 0.12, 0xc8c2b6, 'stone', [0, SPRING + R - 0.1, -D / 2 - 0.03]);
  for (const sx of [-1, 1]) P.box(0.25, H - 0.4, 0.1, 0xc8c2b6, 'stone', [sx * (W / 2 - 0.35), H / 2, D / 2 + 0.03]); // 모서리 기둥 무늬
  P.into(g);
  if (p.label) {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
    const c = cv.getContext('2d'); c.fillStyle = '#e9e4da'; c.fillRect(0, 0, 256, 64); c.strokeStyle = '#8a8478'; c.lineWidth = 4; c.strokeRect(2, 2, 252, 60); c.fillStyle = '#2b241c';
    c.font = 'bold 40px "Nanum Myeongjo", Batang, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(p.label, 128, 34, 240);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshLambertMaterial({ map: t })); m.position.set(0, H - 0.75, D / 2 + 0.02); g.add(m);
  }
  return g;
}

// 도성 문(흥인지문 같은 큰 성문): 돌로 쌓은 몸채 가운데 넓은 무지개 문길(전차·수레가 지나간다), 위에 여장과 2층 나무 문루.
// 크기: 너비 W, 문길 반지름 R(문길 너비 2R). 부딪힘은 town.js가 양쪽 몸채에만 둔다.
export const GATE = { W: 11, D: 4.4, R: 2.2, SPRING: 2.6 };
export function cityGate(g, p = {}) {
  const P = parts(), { W, D, R, SPRING } = GATE, H = SPRING + R + 1.0;
  const face = new THREE.Shape([new THREE.Vector2(-W / 2, 0), new THREE.Vector2(W / 2, 0), new THREE.Vector2(W / 2 - 0.3, H), new THREE.Vector2(-W / 2 + 0.3, H)]);
  const hole = new THREE.Path(); hole.moveTo(-R, 0); hole.lineTo(-R, SPRING); hole.absarc(0, SPRING, R, Math.PI, 0, true); hole.lineTo(R, 0); hole.lineTo(-R, 0);
  face.holes.push(hole);
  const body = new THREE.ExtrudeGeometry(face, { depth: D, bevelEnabled: false, curveSegments: 18 }); body.translate(0, 0, -D / 2);
  P.add(body, 0xc9c2b4, 'stone', [0, 0, 0]);
  for (const sz of [-1, 1]) P.box(0.6, 0.5, 0.14, 0xb3ab99, 'stone', [0, SPRING + R + 0.05, sz * (D / 2 + 0.05)]); // 홍예 머리돌
  for (let x = -W / 2 + 0.5; x <= W / 2 - 0.4; x += 1.0) for (const sz of [-1, 1]) P.box(0.7, 0.55, 0.35, 0x9c958a, 'stone', [x, H + 0.28, sz * (D / 2 - 0.2)]); // 여장
  // 문루: 기둥 줄, 아래층 벽, 아래 지붕, 위층, 위 지붕
  const LW = W - 2.4, LD = D - 0.8;
  P.box(LW, 0.3, LD, 0x8a8478, 'stone', [0, H + 0.15, 0]);
  for (let i = 0; i < 6; i++) for (const sz of [-1, 1]) P.cyl(0.14, 0.15, 2.0, 8, 0xa8392b, 'grain', [-LW / 2 + 0.4 + i * (LW - 0.8) / 5, H + 1.3, sz * (LD / 2 - 0.3)]);
  P.box(LW - 0.8, 1.2, LD - 0.9, 0xe6dcc3, 'grain', [0, H + 1.3, 0]);
  P.box(LW - 1.6, 1.3, LD - 1.3, 0xa8392b, 'grain', [0, H + 3.3, 0]);
  P.into(g);
  curvedHipRoof(g, LW + 1.6, LD + 1.6, 1.1, 0x3d4846, 0, H + 2.35, 0);
  curvedHipRoof(g, LW + 0.6, LD + 0.8, 1.6, 0x3d4846, 0, H + 3.95, 0);
  if (p.label) {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 72;
    const c = cv.getContext('2d'); c.fillStyle = '#2b241c'; c.fillRect(0, 0, 256, 72); c.strokeStyle = '#d9a441'; c.lineWidth = 5; c.strokeRect(3, 3, 250, 66); c.fillStyle = '#f2e6b0';
    c.font = 'bold 42px "Nanum Myeongjo", Batang, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(p.label, 128, 38, 236);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    for (const sz of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.5), new THREE.MeshLambertMaterial({ map: t })); m.position.set(0, H + 3.3, sz * ((LD - 1.3) / 2 + 0.02)); if (sz < 0) m.rotation.y = Math.PI; g.add(m); }
  }
  return g;
}

// ── 시대·장소별 건물 (2026-10-24 전면 개선) ──
// 간판·현판 글: 나무판(또는 천)에 쓴 글자. 같은 글은 한 번만 그린다.
const signTex = new Map();
function signMaterial(text, { bg = '#2b241c', fg = '#f2e6b0', vertical = false } = {}) {
  const key = `${text}|${bg}|${fg}|${vertical}`;
  if (signTex.has(key)) return signTex.get(key);
  const cv = document.createElement('canvas'); cv.width = vertical ? 64 : 256; cv.height = vertical ? 256 : 64;
  const c = cv.getContext('2d'); c.fillStyle = bg; c.fillRect(0, 0, cv.width, cv.height);
  c.strokeStyle = fg; c.globalAlpha = 0.5; c.lineWidth = 4; c.strokeRect(4, 4, cv.width - 8, cv.height - 8); c.globalAlpha = 1;
  c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
  if (vertical) { c.font = 'bold 40px "Nanum Gothic", sans-serif'; [...text].forEach((ch, i, a) => c.fillText(ch, 32, 128 + (i - (a.length - 1) / 2) * 46)); }
  else { c.font = 'bold 38px "Nanum Gothic", sans-serif'; c.fillText(text, 128, 34, 236); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshLambertMaterial({ map: t }); signTex.set(key, m);
  return m;
}
// 가게 물건: 바구니·자루·항아리·옷감 두루마리(색만 조금씩 다르게)
function goods(P, x, y, z, w, seed = 1) {
  const cols = [0xc8a040, 0x8a2f24, 0x5a7a4a, 0xd8c9a0, 0x3a5a7a, 0xb46a3a];
  for (let i = 0; i < Math.max(2, Math.floor(w / 0.55)); i++) {
    const gx = x - w / 2 + 0.3 + i * 0.55, c = cols[(seed + (i % 2) * 2) % cols.length]; // 가게마다 두 가지 색만(그리기 횟수를 줄인다)
    if ((i + seed) % 3 === 0) P.cyl(0.2, 0.16, 0.3, 8, 0x8a6a48, 'wood', [gx, y + 0.15, z]);            // 바구니
    else if ((i + seed) % 3 === 1) P.add(new THREE.SphereGeometry(0.2, 7, 5), c, 'cloth', [gx, y + 0.18, z]); // 자루·과일
    else P.cyl(0.12, 0.12, 0.45, 8, c, 'cloth', [gx, y + 0.12, z], [0, 0, Math.PI / 2]);                  // 옷감 두루마리
  }
}

// 가게. style 'hanok'(개항 무렵 기와 가게: 판자 덧문을 연 가게 앞, 천 차양, 좌판) / 'modern'(1910~30년대 2층 상점: 평평한 앞벽, 유리 진열창, 차양, 2층 난간)
// w 너비, sign 간판 글, awning 차양 색
export function shop(g, p = {}) {
  const P = parts(), w = p.w || 5, d = 3.4, awn = p.awning ?? 0x8a6a48;
  if (p.style === 'modern') {
    const h = 5.2, wall = p.color || 0xd6c8a8;
    P.box(w, h, d, wall, 'grain', [0, h / 2, -0.2]);
    P.box(w + 0.3, 0.5, d + 0.2, 0x8a7a62, 'stone', [0, h + 0.1, -0.2]);                 // 앞벽 위 돌림띠
    P.box(w + 0.1, 0.25, d + 0.1, 0x6b5a48, 'wood', [0, 2.7, -0.2]);                     // 층 띠
    P.box(w - 0.8, 1.6, 0.05, 0, null, [0, 1.35, d / 2 - 0.15], [0, 0, 0], { material: glass() }); // 진열창
    P.box(w - 0.6, 0.12, 0.3, 0x5a3f2a, 'wood', [0, 0.5, d / 2 - 0.1]);
    goods(P, 0, 0.56, d / 2 - 0.4, w - 1.2, p.seed || 1);
    for (let i = 0; i < Math.max(1, Math.floor(w / 1.6)); i++) P.box(0.9, 1.2, 0.05, 0, null, [-w / 2 + 0.9 + i * 1.6, 3.9, d / 2 - 0.15], [0, 0, 0], { material: glass() });
    P.box(w, 0.08, 0.6, 0x5a3f2a, 'wood', [0, 3.05, d / 2 + 0.1]);                       // 2층 발코니
    for (let x = -w / 2 + 0.2; x <= w / 2 - 0.1; x += 0.4) P.box(0.05, 0.6, 0.05, 0x3a2c20, 'wood', [x, 3.35, d / 2 + 0.36]);
    P.box(w, 0.06, 0.06, 0x3a2c20, 'wood', [0, 3.65, d / 2 + 0.36]);
    P.box(w - 0.2, 0.06, 1.3, awn, 'cloth', [0, 2.45, d / 2 + 0.45], [0.28, 0, 0]);     // 차양
  } else {
    const base = 0.3, top = base + 2.1;
    P.box(w + 0.3, base, d + 0.3, 0x9a8a6e, 'stone', [0, base / 2, 0]);
    P.box(w, 2.1, 0.12, 0xcdb58e, 'earth', [0, base + 1.05, -d / 2 + 0.1]);              // 뒷벽
    for (const s of [-1, 1]) P.box(0.12, 2.1, d, 0xcdb58e, 'earth', [s * (w / 2 - 0.06), base + 1.05, 0]);
    for (let x = -w / 2 + 0.1; x <= w / 2; x += w / 3) P.cyl(0.1, 0.11, 2.1, 7, WOOD, 'wood', [x, base + 1.05, d / 2 - 0.1]);
    P.box(w, 0.14, 0.14, DARKWOOD, 'wood', [0, top, d / 2 - 0.1]);
    for (const s of [-1, 1]) P.box(0.9, 1.6, 0.06, WOOD, 'wood', [s * (w / 2 - 0.55), base + 1.0, d / 2 - 0.25], [0, s * 0.6, 0]); // 활짝 연 판자 덧문
    P.box(w - 1.2, 0.7, 1.0, 0x8a6a48, 'wood', [0, base + 0.35, d / 2 - 0.1]);         // 좌판
    goods(P, 0, base + 0.7, d / 2 - 0.1, w - 1.4, p.seed || 1);
    const r = roofSurface({ W: w + 1.4, D: d + 1.4, H: 1.3, lift: 0.35, profile: 'tile', thick: 0.1 });
    P.add(r.top, p.thatch ? 0xd2b07a : TILE, p.thatch ? 'thatch' : 'tile', [0, top + 0.08, 0], [0, 0, 0], { smooth: true });
    P.add(r.under, 0x7a5a3c, 'wood', [0, top + 0.08, 0], [0, 0, 0], { smooth: true, shadow: false });
    P.box(w - 0.4, 0.05, 1.4, awn, 'cloth', [0, top - 0.25, d / 2 + 0.65], [0.3, 0, 0]);   // 천 차양
    for (const s of [-1, 1]) P.cyl(0.04, 0.04, 1.9, 5, DARKWOOD, 'wood', [s * (w / 2 - 0.4), base + 0.85, d / 2 + 1.25]);
  }
  P.into(g);
  if (p.sign) {
    const vertical = p.style !== 'modern';
    const m = new THREE.Mesh(new THREE.PlaneGeometry(vertical ? 0.5 : Math.min(w - 0.6, 3.2), vertical ? 1.7 : 0.6), signMaterial(p.sign, { vertical, bg: p.style === 'modern' ? '#f2efe6' : '#2b241c', fg: p.style === 'modern' ? '#2b241c' : '#f2e6b0' }));
    m.position.set(vertical ? w / 2 - 0.1 : 0, vertical ? 1.5 : 4.85, d / 2 + (vertical ? 0.02 : 0.02)); g.add(m);
  }
  return g;
}

// 상하이 석고문 골목집: 회색 벽돌 2층 집이 나란히(n칸), 칸마다 돌 문틀과 검은 대문, 문 위 둥근 장식, 작은 창, 기와지붕
export function lanehouse(g, p = {}) {
  const P = parts(), n = p.n || 3, uw = 3.6, w = n * uw, d = 5, h = 5.6;
  P.box(w, h, d, 0x7d7a74, 'stone', [0, h / 2, 0]);
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + uw / 2 + i * uw;
    P.box(1.7, 2.6, 0.2, 0xc9c2b4, 'stone', [x, 1.3, d / 2 + 0.05]);                     // 돌 문틀
    P.box(1.2, 2.2, 0.1, 0x1e1c1a, 'wood', [x, 1.1, d / 2 + 0.12]);                      // 검은 대문
    P.add(new THREE.CylinderGeometry(0.85, 0.85, 0.22, 14, 1, false, -Math.PI / 2, Math.PI), 0xc9c2b4, 'stone', [x, 2.6, d / 2 + 0.05], [Math.PI / 2, 0, 0]); // 문 위 반원 장식
    P.box(1.0, 1.1, 0.05, 0, null, [x, 4.1, d / 2 + 0.03], [0, 0, 0], { material: glass() });
    P.box(0.12, h, 0.12, 0x5a5650, 'stone', [x + uw / 2, h / 2, d / 2 + 0.03]);             // 칸 나눔
  }
  P.box(w + 0.2, 0.25, d + 0.2, 0x5a5650, 'stone', [0, h, 0]);
  const r = roofSurface({ W: w + 0.6, D: d + 0.8, H: 1.4, lift: 0.15, profile: 'tile', thick: 0.1 });
  P.add(r.top, 0x3a3e40, 'tile', [0, h + 0.12, 0], [0, 0, 0], { smooth: true });
  P.add(r.under, 0x5a4a3a, 'wood', [0, h + 0.12, 0], [0, 0, 0], { smooth: true, shadow: false });
  return P.into(g);
}

// 시멘트(콘크리트) 건물(1950~80년대): 평평한 옥상과 난간, 층마다 창 줄, 1층 가게 셔터, 옥상 물탱크. floors 층수, sign 세로 간판
export function concrete(g, p = {}) {
  const P = parts(), w = p.w || 7, d = p.d || 5, floors = p.floors || 3, fh = 2.6, h = floors * fh, col = p.color || 0xc8c2b4;
  P.box(w, h, d, col, 'stone', [0, h / 2, 0]);
  P.box(w + 0.15, 0.6, d + 0.15, new THREE.Color(col).multiplyScalar(0.85).getHex(), 'stone', [0, h + 0.3, 0]); // 옥상 난간
  for (let f = 0; f < floors; f++) {
    const y = f * fh + 1.5;
    if (f > 0) P.box(w + 0.1, 0.12, d + 0.1, new THREE.Color(col).multiplyScalar(0.9).getHex(), 'stone', [0, f * fh, 0]);
    const cols = Math.max(1, Math.floor((w - 0.6) / 1.5));
    for (let i = 0; i < cols; i++) {
      const x = -((cols - 1) * 1.5) / 2 + i * 1.5;
      if (f === 0 && p.shop !== false) continue;
      P.box(1.0, 1.1, 0.05, 0, null, [x, y, d / 2 + 0.02], [0, 0, 0], { material: glass() });
      P.box(1.1, 0.08, 0.18, 0x9a948a, 'stone', [x, y - 0.6, d / 2 + 0.08]);
    }
  }
  if (p.shop !== false) { // 1층 가게: 셔터와 유리문
    P.box(w - 0.6, 2.0, 0.06, 0x8a8e92, 'grain', [-(w - 0.6) / 4, 1.0, d / 2 + 0.03]);
    P.box((w - 0.6) / 2 - 0.2, 2.0, 0.05, 0, null, [(w - 0.6) / 4, 1.0, d / 2 + 0.04], [0, 0, 0], { material: glass() });
    P.box(w, 0.1, 0.9, p.awning ?? 0x3a6a8a, 'cloth', [0, 2.3, d / 2 + 0.4], [0.2, 0, 0]);
  }
  if (p.tank !== false) { P.cyl(0.6, 0.6, 1.0, 10, 0x8a8e92, 'grain', [w / 2 - 1.2, h + 1.0, -d / 2 + 1.2]); for (const s of [-1, 1]) P.box(0.08, 0.6, 0.08, 0x5a5a5a, 'grain', [w / 2 - 1.2 + s * 0.4, h + 0.3, -d / 2 + 1.2]); }
  P.into(g);
  if (p.sign) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, Math.min(h - 1, 2.6)), signMaterial(p.sign, { vertical: true, bg: p.signBg || '#f2efe6', fg: '#8a2f24' })); m.position.set(w / 2 - 0.4, h - Math.min(h - 1, 2.6) / 2 - 0.3, d / 2 + 0.06); g.add(m); }
  return g;
}

// 막사: 긴 나무 집, 함석 맞배지붕, 작은 창 줄, 끝의 문
export function barracks(g, p = {}) {
  const P = parts(), w = p.w || 9, d = 4, h = 2.6, col = p.color || 0x6b5a42;
  P.box(w, 0.3, d, 0x7a7060, 'stone', [0, 0.15, 0]);
  P.box(w, h, d, col, 'wood', [0, 0.3 + h / 2, 0]);
  for (let x = -w / 2 + 1; x < w / 2 - 0.5; x += 1.6) for (const s of [-1, 1]) P.box(0.8, 0.6, 0.05, 0, null, [x, 1.9, s * (d / 2 + 0.02)], [0, s < 0 ? Math.PI : 0, 0], { material: glass() });
  P.box(0.05, 1.9, 1.1, 0x3a2c20, 'wood', [w / 2 + 0.02, 1.25, 0]);
  const slope = Math.hypot(d / 2 + 0.4, 1.3), ang = Math.atan2(1.3, d / 2 + 0.4);
  for (const s of [-1, 1]) P.box(w + 0.4, 0.08, slope, p.roof || 0x6b6862, 'grain', [0, 0.3 + h + 0.65, s * (d / 4 + 0.2)], [s * ang, 0, 0]);
  return P.into(g);
}

// 시장 노점: 네 기둥과 천 차양, 물건을 늘어놓은 좌판
export function stall(g, p = {}) {
  const P = parts(), w = p.w || 2.6, c = p.color || 0xd8cdb0;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.cyl(0.05, 0.05, 2.2, 5, 0x5a3f2a, 'wood', [sx * w / 2, 1.1, sz * 0.8]);
  P.box(w + 0.4, 0.06, 2.0, c, 'cloth', [0, 2.25, 0], [0.12, 0, 0]);
  P.box(w, 0.7, 1.1, 0x8a6a48, 'wood', [0, 0.35, 0.2]);
  goods(P, 0, 0.7, 0.2, w - 0.2, p.seed || 2);
  return P.into(g);
}

// 다리: 'stone'(돌 무지개다리) / 'wood'(나무 널다리). 길이 len, +z 방향으로 건넌다
export function bridge(g, p = {}) {
  const P = parts(), len = p.len || 10, w = p.w || 3;
  if (p.style === 'wood') {
    P.box(w, 0.2, len, 0x7a5a3c, 'wood', [0, 0.35, 0]);
    for (let z = -len / 2 + 1; z <= len / 2 - 1; z += 2.5) for (const s of [-1, 1]) P.cyl(0.14, 0.14, 2.2, 6, 0x5e4330, 'wood', [s * (w / 2 - 0.2), -0.6, z]);
    for (const s of [-1, 1]) { P.box(0.1, 0.1, len, 0x5e4330, 'wood', [s * w / 2, 1.1, 0]); for (let z = -len / 2; z <= len / 2; z += 1.25) P.box(0.08, 0.75, 0.08, 0x5e4330, 'wood', [s * w / 2, 0.75, z]); }
  } else {
    const arch = new THREE.Shape(); arch.moveTo(-len / 2, -1.2); arch.lineTo(-len / 2, 0.6); arch.lineTo(len / 2, 0.6); arch.lineTo(len / 2, -1.2); arch.lineTo(len * 0.3, -1.2); arch.absarc(0, -1.2, len * 0.3, 0, Math.PI, false); arch.lineTo(-len / 2, -1.2);
    const geo = new THREE.ExtrudeGeometry(arch, { depth: w, bevelEnabled: false, curveSegments: 14 }); geo.translate(0, 0, -w / 2); geo.rotateY(Math.PI / 2);
    P.add(geo, 0xb3ab99, 'stone', [0, 0, 0]);
    for (const s of [-1, 1]) P.box(0.3, 0.5, len, 0xa39b8c, 'stone', [s * (w / 2 - 0.15), 0.85, 0]);
  }
  return P.into(g);
}

// 나룻배·고깃배: 앞뒤가 들린 나무배와 노 하나(사람이 타지 않은 채 물가에 매어 둠)
export function boat(g, p = {}) {
  const P = parts(), L = p.len || 4.2;
  const hg = new THREE.BoxGeometry(1.7, 0.55, L, 1, 1, 6); const pos = hg.attributes.position;
  for (let i = 0; i < pos.count; i++) { const z = pos.getZ(i) / (L / 2), y = pos.getY(i); pos.setX(i, pos.getX(i) * (1 - Math.pow(Math.abs(z), 3) * 0.75) * (y < 0 ? 0.7 : 1)); pos.setY(i, y + Math.pow(Math.abs(z), 2) * 0.35); }
  hg.computeVertexNormals();
  P.add(hg, p.color || 0x7a5a3c, 'wood', [0, 0.15, 0]);
  P.box(1.3, 0.06, L * 0.6, 0x5e4330, 'wood', [0, 0.3, 0]);
  P.box(0.07, 0.07, 3, 0x6b4a32, 'wood', [0.5, 0.55, L * 0.15], [0.15, 0.3, 0]);
  return P.into(g);
}

// 축대(돌로 쌓은 단)와 앞 계단: 건물을 한 단 높이 올려 세울 때 쓴다(위에 놓는 부품은 y로 올린다). w×d 크기, h 높이
export function terrace(g, p = {}) {
  const P = parts(), w = p.w || 8, d = p.d || 6, h = p.h || 1.2, stone = p.color || 0xa39b8c;
  P.box(w, h, d, stone, 'stone', [0, h / 2, 0]);
  P.box(w + 0.2, 0.15, d + 0.2, new THREE.Color(stone).multiplyScalar(1.1).getHex(), 'stone', [0, h + 0.02, 0]);
  if (p.steps !== false) { const n = Math.max(2, Math.round(h / 0.3)), sw = p.stepW || 2.4; for (let i = 0; i < n; i++) P.box(sw, h - i * (h / n), 0.42, 0xb3ab99, 'stone', [p.stepX || 0, (h - i * (h / n)) / 2, d / 2 + 0.21 + i * 0.42]); }
  return P.into(g);
}

// 논: 낮은 논두렁으로 나눈 칸마다 물이 고인 흙과 줄지어 선 벼 포기(멀리서 보는 들판). w×d, ripe면 누렇게 익은 벼
export function paddy(g, p = {}) {
  const P = parts(), w = p.w || 12, d = p.d || 8, cells = Math.max(1, Math.round(w / 6));
  const cw = w / cells, rice = p.ripe ? 0xc8a84a : 0x7a9a3a;
  P.box(w, 0.05, d, 0x6a6a4a, 'earth', [0, 0.03, 0]);
  for (let i = 0; i <= cells; i++) P.box(0.35, 0.22, d, 0x8a7a52, 'earth', [-w / 2 + i * cw, 0.11, 0]);
  for (const s of [-1, 1]) P.box(w, 0.22, 0.35, 0x8a7a52, 'earth', [0, 0.11, s * d / 2]);
  for (let c = 0; c < cells; c++) for (let row = 0; row < Math.floor(d / 0.8) - 1; row++) P.box(cw - 0.8, 0.35, 0.18, rice, 'grain', [-w / 2 + (c + 0.5) * cw, 0.2, -d / 2 + 0.8 + row * 0.8]);
  return P.into(g);
}

// ── 고려·조선 진영 소품 ──
// 망루: 네 기둥 위 판자 망대와 난간, 사다리, 작은 지붕. h 망대 높이
export function watchtower(g, p = {}) {
  const P = parts(), h = p.h || 4.5, w = 2.6;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.cyl(0.12, 0.16, h + 2.2, 6, 0x6b4a32, 'wood', [sx * w / 2 * 0.85, (h + 2.2) / 2, sz * w / 2 * 0.85], [sz * 0.04, 0, -sx * 0.04]);
  for (const y of [h * 0.35, h * 0.7]) for (const s of [-1, 1]) { P.box(w * 0.9, 0.1, 0.1, 0x5e4330, 'wood', [0, y, s * w / 2 * 0.85], [0, 0, s * 0.5]); P.box(0.1, 0.1, w * 0.9, 0x5e4330, 'wood', [s * w / 2 * 0.85, y, 0], [s * 0.5, 0, 0]); } // 엇갈린 버팀목
  P.box(w + 0.4, 0.18, w + 0.4, 0x7a5a3c, 'wood', [0, h, 0]);
  for (const s of [-1, 1]) { P.box(w + 0.4, 0.7, 0.08, 0x7a5a3c, 'wood', [0, h + 0.45, s * (w / 2 + 0.2)]); P.box(0.08, 0.7, w + 0.4, 0x7a5a3c, 'wood', [s * (w / 2 + 0.2), h + 0.45, 0]); }
  for (let k = 0; k < Math.floor(h / 0.45); k++) P.box(0.7, 0.06, 0.08, 0x5e4330, 'wood', [0, 0.3 + k * 0.45, w / 2 + 0.55]); // 사다리 가로대
  for (const s of [-1, 1]) P.box(0.07, h, 0.07, 0x5e4330, 'wood', [s * 0.35, h / 2, w / 2 + 0.55]);
  const r = roofSurface({ W: w + 1.2, D: w + 1.2, H: 1.0, lift: 0.3, profile: 'thatch', thick: 0.12 });
  P.add(r.top, p.roof ?? 0xb89a68, 'thatch', [0, h + 1.9, 0], [0, 0, 0], { smooth: true });
  return P.into(g);
}
// 창걸이: 두 기둥과 가로대에 기대어 세운 창들
export function spearRack(g, p = {}) {
  const P = parts(), n = p.n || 5;
  for (const s of [-1, 1]) P.cyl(0.07, 0.08, 1.6, 6, 0x5e4330, 'wood', [s * 1.1, 0.8, 0]);
  P.box(2.4, 0.08, 0.08, 0x5e4330, 'wood', [0, 1.4, 0]);
  for (let i = 0; i < n; i++) { const x = -0.9 + i * (1.8 / (n - 1)); P.cyl(0.03, 0.03, 2.8, 4, 0x6b4a32, 'wood', [x, 1.35, 0.18], [-0.12, 0, 0]); P.add(new THREE.ConeGeometry(0.06, 0.3, 4), 0xb8bcc0, 'grain', [x, 2.85, 0.35], [-0.12, 0, 0]); }
  return P.into(g);
}
// 과녁: 나무 받침에 세운 둥근 짚 과녁(가운데 붉은 점)
export function archeryTarget(g) {
  const P = parts();
  for (const s of [-1, 1]) P.cyl(0.06, 0.07, 1.9, 5, 0x5e4330, 'wood', [s * 0.5, 0.95, -0.15], [0.2, 0, 0]);
  P.cyl(0.75, 0.75, 0.25, 16, 0xd2b07a, 'thatch', [0, 1.4, 0], [Math.PI / 2, 0, 0]);
  P.cyl(0.45, 0.45, 0.27, 16, 0xe6dcc3, 'cloth', [0, 1.4, 0], [Math.PI / 2, 0, 0]);
  P.cyl(0.18, 0.18, 0.29, 12, 0xb8452f, 'cloth', [0, 1.4, 0], [Math.PI / 2, 0, 0]);
  return P.into(g);
}
