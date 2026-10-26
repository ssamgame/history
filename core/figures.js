// 고려편 새 기준(2026-10-26 기획서 6-2) 사람 모델: '따뜻한 그림책 입체' 2.5~3등신.
// 어깨·허리가 있는 몸통, 따로 움직이는 팔다리, 크고 또렷한 눈·눈썹(표정은 모두 근엄: 눈·눈썹 stern, 입 flat).
// 성능: 한 사람을 조각 6개(몸통·머리·팔 둘·다리 둘, 활을 든 사람만 활 하나 더)로 그린다.
//   몸통·팔다리는 꼭짓점 색으로 칠한 조각을 합쳐 모든 사람이 재질 하나(toonMat)를 같이 쓰고,
//   머리는 얼굴 무늬를 머리 공에 바로 입혀(머리카락·모자는 무늬의 흰 귀퉁이를 써서 꼭짓점 색 그대로) 같은 얼굴끼리 재질을 같이 쓴다.
// 기존 core/people.js(30장이 쓰는 사람)는 그대로 둔다. 이 파일은 고려편 새 시범에서만 쓴다.
import * as THREE from 'three';

// ── 그림책 재질과 조각 모음 ──
let gradient = null;
function gradientMap() { // 세 단계 명암(그림책 채색처럼 면이 또렷하게 나뉜다)
  if (gradient) return gradient;
  gradient = new THREE.DataTexture(new Uint8Array([172, 215, 255]), 3, 1, THREE.RedFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter; gradient.generateMipmaps = false; gradient.needsUpdate = true;
  return gradient;
}
let bodyMat = null;
export function toonMat() {
  return bodyMat || (bodyMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradientMap() }));
}
const CORNER_UV = [0.004, 0.996]; // 얼굴 무늬의 흰 귀퉁이: 머리카락·모자·귀는 여기를 보아 꼭짓점 색 그대로 보인다
const V = new THREE.Vector3(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(), M = new THREE.Matrix4(), C = new THREE.Color();

// 꼭짓점 색 조각 모음: add(도형, 색, 자리, 회전, 크기)로 모으고 geometry()로 한 덩어리를 만든다.
export function vcBuilder() {
  const geos = [];
  const api = {
    add(geo, color, at = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1], { keepUV = false } = {}) {
      M.compose(V.set(...at), Q.setFromEuler(E.set(...rot)), S.set(...scale));
      geo.applyMatrix4(M);
      if (!geo.attributes.normal) geo.computeVertexNormals();
      const n = geo.attributes.position.count, col = new Float32Array(n * 3);
      C.set(color);
      for (let i = 0; i < n; i++) { col[i * 3] = C.r; col[i * 3 + 1] = C.g; col[i * 3 + 2] = C.b; }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      if (!keepUV || !geo.attributes.uv) { const uv = new Float32Array(n * 2); for (let i = 0; i < n; i++) { uv[i * 2] = CORNER_UV[0]; uv[i * 2 + 1] = CORNER_UV[1]; } geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); }
      geos.push(geo);
      return api;
    },
    box(w, h, d, color, at, rot, scale) { return api.add(new THREE.BoxGeometry(w, h, d), color, at, rot, scale); },
    cyl(r0, r1, h, seg, color, at, rot, scale) { return api.add(new THREE.CylinderGeometry(r0, r1, h, seg), color, at, rot, scale); },
    ball(r, color, at, scale, seg = 10) { return api.add(new THREE.SphereGeometry(r, seg, Math.max(6, seg - 3)), color, at, [0, 0, 0], scale); },
    cap(r, color, at, rot, scale, part = 0.5, seg = 14) { return api.add(new THREE.SphereGeometry(r, seg, 8, 0, Math.PI * 2, 0, Math.PI * part), color, at, rot, scale); },
    ring(r, t, color, at, rot, scale, seg = 16) { return api.add(new THREE.TorusGeometry(r, t, 6, seg), color, at, rot, scale); },
    lathe(pts, color, at, scale, seg = 12) { return api.add(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), color, at, [0, 0, 0], scale); },
    get count() { return geos.length; },
    geometry() {
      const pos = [], nor = [], col = [], uv = [], idx = [];
      let base = 0;
      for (const g of geos) {
        const p = g.attributes.position, nn = g.attributes.normal, c = g.attributes.color, u = g.attributes.uv;
        for (let i = 0; i < p.count; i++) {
          pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(nn.getX(i), nn.getY(i), nn.getZ(i));
          col.push(c.getX(i), c.getY(i), c.getZ(i)); uv.push(u.getX(i), u.getY(i));
        }
        if (g.index) for (let i = 0; i < g.index.count; i++) idx.push(g.index.getX(i) + base);
        else for (let i = 0; i < p.count; i++) idx.push(i + base);
        base += p.count; g.dispose();
      }
      const out = new THREE.BufferGeometry();
      out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      out.setIndex(idx);
      out.computeBoundingSphere();
      return out;
    },
    mesh(material = toonMat(), name = '') {
      const m = new THREE.Mesh(api.geometry(), material);
      m.name = name; m.castShadow = true;
      return m;
    },
  };
  return api;
}

// 그려지는 조각 수(그리기 횟수): 보이는 메시·점·스프라이트
export function drawPieces(obj) {
  let n = 0;
  obj.traverseVisible(o => { if (o.isMesh || o.isPoints || o.isSprite) n += 1; });
  return n;
}

// ── 얼굴: 머리 공(SphereGeometry, 앞이 u=0.25)에 바로 입히는 512×256 무늬 ──
const SKIN = 0xf2c9a0, KID_SKIN = 0xf6d2ae, INK = '#2e2a30';
const hex = n => `#${n.toString(16).padStart(6, '0')}`;
function drawFace(g, face, cx, cy, R, kid) {
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  // 볼(아이만 아주 옅게), 나이 든 사람은 이마 주름
  if (kid) { g.fillStyle = 'rgba(236,130,110,0.22)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 0.5 * R, cy + 0.3 * R, 0.16 * R, 0.09 * R, 0, 0, Math.PI * 2); g.fill(); } }
  if (face.age === 'old') {
    g.strokeStyle = 'rgba(150,95,65,0.5)'; g.lineWidth = 0.03 * R;
    for (const dy of [-0.62, -0.53]) { g.beginPath(); g.moveTo(cx - 0.3 * R, cy + dy * R); g.quadraticCurveTo(cx, cy + (dy - 0.05) * R, cx + 0.3 * R, cy + dy * R); g.stroke(); }
  }
  // 수염(입보다 먼저)
  const beardC = face.beardColor || INK;
  g.fillStyle = beardC;
  if (face.beard === 'full') {
    g.beginPath(); g.moveTo(cx - 0.58 * R, cy + 0.2 * R); g.quadraticCurveTo(cx - 0.55 * R, cy + 1.0 * R, cx, cy + 1.08 * R);
    g.quadraticCurveTo(cx + 0.55 * R, cy + 1.0 * R, cx + 0.58 * R, cy + 0.2 * R); g.quadraticCurveTo(cx, cy + 0.62 * R, cx - 0.58 * R, cy + 0.2 * R); g.fill();
  } else if (face.beard === 'goatee') {
    g.beginPath(); g.moveTo(cx - 0.13 * R, cy + 0.6 * R); g.quadraticCurveTo(cx, cy + 0.66 * R, cx + 0.13 * R, cy + 0.6 * R); g.lineTo(cx, cy + 0.98 * R); g.closePath(); g.fill();
  }
  if (face.beard) { g.beginPath(); for (const s of [-1, 1]) g.ellipse(cx + s * 0.14 * R, cy + 0.42 * R, 0.15 * R, 0.045 * R, s * 0.3, 0, Math.PI * 2); g.fill(); }
  // 코: 작은 그림자 곡선
  g.strokeStyle = '#c08262'; g.lineWidth = 0.04 * R;
  g.beginPath(); g.moveTo(cx - 0.07 * R, cy + 0.3 * R); g.quadraticCurveTo(cx, cy + 0.34 * R, cx + 0.07 * R, cy + 0.3 * R); g.stroke();
  // 입: 다문 입(flat) 한 줄
  g.strokeStyle = '#6a3428'; g.lineWidth = 0.05 * R;
  const my = cy + 0.52 * R;
  g.beginPath(); g.moveTo(cx - 0.12 * R, my); g.quadraticCurveTo(cx, my - 0.015 * R, cx + 0.12 * R, my); g.stroke();
  // 눈: 크고 또렷하게(흰자·큰 눈동자·빛 두 점), 굵은 윗눈꺼풀이 안쪽으로 내려와 근엄하다
  const w = (kid ? 0.25 : 0.23) * R, h = (kid ? 0.19 : 0.16) * R, ir = (kid ? 0.16 : 0.14) * R;
  for (const s of [-1, 1]) {
    const ex = cx + s * 0.4 * R, ey = cy + 0.04 * R;
    g.fillStyle = '#fbf7ef';
    g.beginPath(); g.moveTo(ex - w, ey); g.quadraticCurveTo(ex - s * 0.2 * w, ey - h * 1.25, ex + w, ey - s * 0.12 * h);
    g.quadraticCurveTo(ex, ey + h * 1.15, ex - w, ey); g.fill();
    g.save(); g.clip();
    g.fillStyle = '#4a2e1e'; g.beginPath(); g.arc(ex - s * 0.08 * w, ey + 0.05 * h, ir, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#16100c'; g.beginPath(); g.arc(ex - s * 0.08 * w, ey + 0.05 * h, ir * 0.55, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(ex - s * 0.08 * w + 0.35 * ir, ey - 0.3 * ir, 0.28 * ir, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(ex - s * 0.08 * w - 0.3 * ir, ey + 0.35 * ir, 0.13 * ir, 0, Math.PI * 2); g.fill();
    g.restore();
    // 윗눈꺼풀: 코 쪽(안쪽)이 낮은 굵은 선
    g.strokeStyle = INK; g.lineWidth = 0.075 * R;
    g.beginPath(); g.moveTo(ex - s * w * 1.08, ey + 0.1 * h); g.quadraticCurveTo(ex - s * 0.1 * w, ey - h * 1.3, ex + s * w * 1.12, ey - 0.35 * h); g.stroke();
  }
  // 눈썹: 굵고 안쪽 끝이 내려간다(근엄)
  g.strokeStyle = face.browColor || INK; g.lineWidth = 0.1 * R;
  for (const s of [-1, 1]) {
    const bx = cx + s * 0.41 * R, by = cy - 0.27 * R;
    g.beginPath(); g.moveTo(bx - s * 0.22 * R, by + 0.08 * R); g.quadraticCurveTo(bx, by - 0.06 * R, bx + s * 0.24 * R, by - 0.05 * R); g.stroke();
  }
  g.restore();
}
const headMats = new Map();
function headMat(face, kid, skin) {
  const key = JSON.stringify([face, kid, skin]);
  if (headMats.has(key)) return headMats.get(key);
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256;
  const g = cv.getContext('2d');
  g.fillStyle = hex(skin); g.fillRect(0, 0, 512, 256);
  g.fillStyle = '#fff'; g.fillRect(0, 0, 10, 10); // 흰 귀퉁이(CORNER_UV)
  drawFace(g, face, 128, 138, 96, kid); // 앞(u=0.25)·적도 둘레. 무늬 81px ≈ 머리 공 1라디안
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const m = new THREE.MeshToonMaterial({ map: tex, vertexColors: true, gradientMap: gradientMap() });
  headMats.set(key, m);
  return m;
}

// ── 생김새(look) ──
// job: 직업(모양 틀), robe: 겉옷색, trim: 깃·띠색, pants: 바지색, hat: 머리 모양·모자, gear: 손에 든 무기, prop: 손에 든 것,
// sleeve: 소매색(지킴이 표시), height: 키 배율, kid/girl: 견습생, face: 얼굴(모두 근엄)
const STERN = { eyes: 'stern', brows: 'stern', mouth: 'flat' };
export const FIGURE_LOOKS = {
  soldier: { job: 'soldier', name: '고려 병사', robe: 0xb5452f, trim: 0xd9a441, pants: 0x4a4250, armor: 0x5f7590, hat: 'helmet', gear: 'spear', face: { ...STERN } },
  official: { job: 'official', name: '관리', robe: 0x5a4f9a, trim: 0xd9a441, pants: 0x3a3440, hat: 'bokdu', face: { ...STERN, beard: 'goatee' } },
  archer: { job: 'archer', name: '궁수', robe: 0x5e8a4a, trim: 0xe6d6b0, pants: 0x6a5a48, hat: 'hood', gear: 'bow', face: { ...STERN } },
  monk: { job: 'monk', name: '승려', robe: 0x9c9fa3, trim: 0xb0503a, pants: 0x8a8c90, hat: 'bald', face: { ...STERN } },
  artisan: { job: 'artisan', name: '장인', robe: 0xd9c8a8, trim: 0x8a5a38, pants: 0xb8a888, hat: 'band', gear: 'hammer', face: { ...STERN, beard: 'mustache' } },
  commoner: { job: 'commoner', name: '백성', robe: 0xece4d2, trim: 0x8a6a4a, pants: 0xd8cdb5, hat: 'topknot', face: { ...STERN } },
  commonerWoman: { job: 'commonerWoman', name: '백성(여자)', robe: 0xf2eadc, trim: 0xc0504a, pants: 0x5a6aa0, hat: 'coil', face: { ...STERN } },
  khitan: { job: 'khitan', name: '거란 병사', robe: 0x8a6438, trim: 0x2e6a66, pants: 0x4a3a2e, hat: 'furcap', gear: 'spear', prop: 'shield', face: { ...STERN } },
};
// 지킴이 견습생 생김새 3가지(머리 모양·소매색이 다르다)와 장별 옷 3가지
export const GUARDIAN_LOOKS = {
  a: { name: '소년(땋은 머리)', hair: 'braid', sleeve: 0x3f7fc8, girl: false },
  b: { name: '소녀(댕기 머리)', hair: 'ribbon', sleeve: 0xd8564a, girl: true },
  c: { name: '소년(쌍상투)', hair: 'buns', sleeve: 0x3f9a5a, girl: false },
};
export const GUARDIAN_OUTFITS = {
  soldier: { name: '병사 옷', job: 'soldier', robe: 0xb5452f, trim: 0xd9a441, pants: 0x4a4250, armor: 0x5f7590, hat: 'kidHelmet', gear: 'spear' },
  archer: { name: '궁수 두건', job: 'archer', robe: 0x5e8a4a, trim: 0xe6d6b0, pants: 0x6a5a48, hat: 'hood', gear: 'bow' },
  worker: { name: '일꾼 앞치마', job: 'artisan', robe: 0xe2d4b6, trim: 0x8a5a38, pants: 0xb8a888, hat: 'band', gear: null },
};
export function guardianLook(id, outfit = 'soldier') {
  const g = GUARDIAN_LOOKS[id], o = GUARDIAN_OUTFITS[outfit];
  return { ...o, name: `지킴이 ${g.name} · ${o.name}`, guardian: id, outfit, kid: true, girl: g.girl, hair: g.hair, sleeve: g.sleeve, height: 1, face: { ...STERN } };
}
// 군중 변형: 같은 직업도 키·옷색·모자·손에 든 것이 seed마다 다르다(4가지가 서로 겹치지 않게)
const CROWD = {
  soldier: { robes: [0xb5452f, 0x9a3b2c, 0xc0583a, 0x8a4030], hats: ['helmet', 'helmetPlain', 'helmet', 'helmetPlain'], props: ['none', 'shield', 'bundle', 'none'] },
  official: { robes: [0x5a4f9a, 0x3f6a5a, 0x9a3b3b, 0x4a5a8a], hats: ['bokdu', 'bokdu', 'bokdu', 'bokdu'], props: ['none', 'tablet', 'none', 'tablet'] },
  archer: { robes: [0x5e8a4a, 0x4a7a5a, 0x6a8a3e, 0x557a62], hats: ['hood', 'band', 'hood', 'band'], props: ['none', 'none', 'none', 'none'] },
  monk: { robes: [0x9c9fa3, 0x8a8d90, 0xa8a49a, 0x94989c], hats: ['bald', 'bald', 'bald', 'bald'], props: ['none', 'staff', 'none', 'staff'] },
  artisan: { robes: [0xd9c8a8, 0xc8b898, 0xe0d0b0, 0xbfae8e], hats: ['band', 'towel', 'band', 'towel'], props: ['none', 'basket', 'none', 'bundle'] },
  commoner: { robes: [0xece4d2, 0xd8c8a8, 0xc9d2cc, 0xe0cfb0], hats: ['topknot', 'straw', 'towel', 'band'], props: ['none', 'bundle', 'basket', 'staff'] },
  commonerWoman: { robes: [0xf2eadc, 0xe8d8c8, 0xdfe4dc, 0xf0dcc8], hats: ['coil', 'towel', 'coil', 'towel'], props: ['none', 'bundle', 'basket', 'none'] },
  khitan: { robes: [0x8a6438, 0x7a5a3a, 0x9a7444, 0x6e5634], hats: ['furcap', 'furcap', 'furcap', 'furcap'], props: ['shield', 'none', 'shield', 'none'] },
};
const HEIGHTS = [0.93, 0.97, 1.02, 1.06];
export function crowdLook(job, seed = 1) {
  const base = FIGURE_LOOKS[job], c = CROWD[job], i = ((seed % 4) + 4) % 4;
  return { ...base, robe: c.robes[(i + 1) % 4], hat: c.hats[(i * 3) % 4], prop: c.props[i] === 'none' ? null : c.props[i], height: HEIGHTS[i], crowd: seed, face: { ...base.face } };
}
export const ACTIONS = ['idle', 'walk', 'cheer', 'surprise', 'push', 'shoot', 'carry', 'nod'];

// ── 몸 짓기 ──
const HAIR = 0x2e2a30, SHOE = 0x3a3236, STEEL = 0x7d8ea0, GOLD = 0xd9a441, WHITE = 0xf4efe4, WOOD = 0x8a5a38, FUR = 0x4a3a2e;

function buildHead(B, L, rH) {
  const hat = L.hat, hair = L.hairColor ?? HAIR, c = [0, 0, 0];
  const hairCap = (tilt = -0.45, part = 0.5) => B.cap(rH * 1.05, hair, c, [tilt, 0, 0], [1, 1, 1], part, 16);
  // 귀(살색)
  for (const s of [-1, 1]) B.ball(rH * 0.17, L.kid ? KID_SKIN : SKIN, [s * rH * 0.97, -rH * 0.05, -rH * 0.05], [0.5, 1, 0.8], 8);
  if (hat === 'helmet' || hat === 'helmetPlain' || hat === 'kidHelmet') { // 고려 투구: 둥근 철모, 챙, 목 가리개, 붉은 술
    B.cap(rH * 1.14, STEEL, [0, rH * 0.05, 0], [0, 0, 0], [1, 1.02, 1], 0.5, 16);
    B.ring(rH * 1.12, rH * 0.07, 0x5e6e80, [0, rH * 0.07, 0], [Math.PI / 2, 0, 0], [1, 1, 1], 20);
    B.lathe([[rH * 1.12, 0], [rH * 1.28, -rH * 0.55], [rH * 1.2, -rH * 0.6]], 0x6a5040, [0, rH * 0.05, -rH * 0.05], [1, 1, 1], 12); // 가죽 목 가리개
    B.cyl(rH * 0.05, rH * 0.08, rH * 0.4, 6, GOLD, [0, rH * 1.25, 0]);
    if (hat !== 'helmetPlain') B.add(new THREE.ConeGeometry(rH * 0.28, rH * 0.55, 8), 0xc8402e, [0, rH * 1.55, 0], [Math.PI, 0, 0]); // 붉은 술
  } else if (hat === 'bokdu') { // 복두: 네모진 검은 관과 양옆으로 길게 뻗은 날개
    hairCap(-0.3);
    B.box(rH * 1.7, rH * 0.9, rH * 1.6, 0x2e2a30, [0, rH * 0.85, -rH * 0.1]);
    B.box(rH * 1.5, rH * 0.5, rH * 1.0, 0x2e2a30, [0, rH * 1.4, -rH * 0.35]);
    for (const s of [-1, 1]) B.box(rH * 1.5, rH * 0.13, rH * 0.42, 0x2e2a30, [s * rH * 1.45, rH * 1.2, -rH * 0.8], [0, 0, s * 0.06]); // 날개
  } else if (hat === 'hood') { // 두건: 머리를 감싼 천과 뒤로 늘어진 두 자락
    B.cap(rH * 1.12, 0x3e5a3a, [0, rH * 0.08, -rH * 0.06], [-0.6, 0, 0], [1, 1.05, 1.05], 0.5, 16);
    B.ring(rH * 1.06, rH * 0.1, 0x334a30, [0, rH * 0.4, -rH * 0.05], [Math.PI / 2 + 0.3, 0, 0], [1, 1, 1], 20);
    for (const s of [-1, 1]) B.box(rH * 0.22, rH * 0.9, rH * 0.06, 0x3e5a3a, [s * rH * 0.18, -rH * 0.2, -rH * 1.1], [0.25, 0, s * 0.15]);
  } else if (hat === 'bald') { // 삭발: 파르스름한 머리 자국
    B.cap(rH * 1.012, 0xc9b6a6, c, [-0.55, 0, 0], [1, 1, 1], 0.42, 16);
  } else if (hat === 'furcap') { // 거란 털모자: 위가 넓은 털모자와 양옆 귀가리개
    hairCap(-0.3);
    B.cyl(rH * 1.18, rH * 1.08, rH * 0.75, 12, FUR, [0, rH * 0.7, 0]);
    B.cap(rH * 1.0, 0xa8834f, [0, rH * 1.0, 0], [0, 0, 0], [1, 0.55, 1], 0.5, 12);
    for (const s of [-1, 1]) B.box(rH * 0.3, rH * 0.9, rH * 0.6, FUR, [s * rH * 1.02, -rH * 0.1, -rH * 0.05], [0, 0, s * -0.1]);
  } else if (hat === 'coil') { // 얹은머리: 땋은 머리를 머리 위에 둘러 얹는다
    hairCap(-0.35);
    B.ring(rH * 0.68, rH * 0.2, hair, [0, rH * 0.82, -rH * 0.12], [Math.PI / 2 + 0.25, 0, 0], [1, 1, 1], 16);
    B.cyl(rH * 0.035, rH * 0.035, rH * 1.6, 5, GOLD, [0, rH * 0.85, -rH * 0.2], [0, 0, Math.PI / 2]); // 비녀
  } else if (hat === 'straw') { // 패랭이: 대나무로 엮은 둥근 갓
    hairCap(-0.45);
    B.add(new THREE.ConeGeometry(rH * 1.7, rH * 0.9, 14, 1, true), 0xc8a868, [0, rH * 1.05, 0]);
    B.cyl(rH * 0.7, rH * 0.75, rH * 0.12, 12, 0x6a4a32, [0, rH * 0.8, 0]);
  } else if (hat === 'towel') { // 머리 수건
    hairCap(-0.45);
    B.cap(rH * 1.1, 0xe8e2d2, [0, rH * 0.12, -rH * 0.05], [-0.15, 0, 0], [1, 0.9, 1.05], 0.45, 14);
    B.box(rH * 0.35, rH * 0.3, rH * 0.2, 0xe8e2d2, [0, rH * 0.4, -rH * 1.05]);
  } else if (hat === 'band') { // 두건 띠(장인·일꾼): 이마에 맨 천 띠와 매듭
    if (!L.kid) { hairCap(-0.45); B.ball(rH * 0.26, hair, [0, rH * 1.08, -rH * 0.05], [1, 1.1, 1]); }
    B.ring(rH * 1.04, rH * 0.09, 0xeae0cc, [0, rH * 0.32, -rH * 0.05], [Math.PI / 2 + 0.2, 0, 0], [1, 1, 1], 20);
    B.box(rH * 0.3, rH * 0.4, rH * 0.12, 0xeae0cc, [rH * 0.25, rH * 0.05, -rH * 1.05], [0.2, 0, 0.5]);
  } else if (hat === 'topknot' || !hat) { // 상투와 망건
    hairCap(-0.45);
    B.cyl(rH * 0.2, rH * 0.26, rH * 0.38, 10, hair, [0, rH * 1.12, -rH * 0.04]);
    B.ball(rH * 0.2, hair, [0, rH * 1.3, -rH * 0.04]);
    B.ring(rH * 1.0, rH * 0.035, 0x1e1c20, [0, rH * 0.45, -rH * 0.05], [Math.PI / 2 + 0.3, 0, 0], [1, 1, 1], 20); // 망건
  }
  // 견습생 머리(모자 아래로 보인다)
  if (L.kid) {
    if (hat !== 'hood' && !String(hat).includes('elmet')) hairCap(-0.5, 0.52);
    for (const s of [-1, 1]) B.box(rH * 0.5, rH * 0.18, rH * 0.2, hair, [s * rH * 0.42, rH * 0.68, rH * 0.82], [0.5, 0, s * 0.35]); // 앞머리
    if (L.hair === 'braid' || L.hair === 'ribbon') { // 뒤로 땋아 내린 머리
      const n = L.hair === 'ribbon' ? 2 : 5;
      for (let i = 0; i < n; i++) B.ball(rH * (0.2 - i * 0.012), hair, [0, -rH * (0.25 + i * 0.3), -rH * (1.0 + i * 0.03)], [1, 1.3, 1], 8);
      if (L.hair === 'ribbon') { // 붉은 댕기: 큰 나비 매듭
        const y = -rH * (0.25 + n * 0.3);
        for (const s of [-1, 1]) B.box(rH * 0.7, rH * 0.4, rH * 0.1, 0xd03a3a, [s * rH * 0.38, y, -rH * 1.06], [0, 0, s * 0.35]);
        B.box(rH * 0.2, rH * 0.4, rH * 0.06, 0xd03a3a, [0, y - rH * 0.25, -rH * 1.06]);
        for (const s of [-1, 1]) B.box(rH * 0.16, rH * 0.75, rH * 0.2, hair, [s * rH * 0.98, -rH * 0.05, rH * 0.25], [0, 0, s * 0.08]); // 귀 옆 머리
      } else B.ball(rH * 0.12, 0x3a5a9a, [0, -rH * (0.25 + n * 0.3), -rH * 1.12]);
    } else if (L.hair === 'buns' && hat !== 'hood' && !String(hat).includes('elmet')) { // 쌍상투: 머리 위 양쪽 두 묶음
      for (const s of [-1, 1]) { B.ball(rH * 0.3, hair, [s * rH * 0.55, rH * 0.95, -rH * 0.1]); B.ring(rH * 0.2, rH * 0.06, 0x3f9a5a, [s * rH * 0.5, rH * 0.75, -rH * 0.1], [Math.PI / 2, 0, 0], [1, 1, 1], 10); }
    } else if (L.hair === 'buns') { B.ball(rH * 0.3, hair, [0, -rH * 0.2, -rH * 1.05]); }
  }
  // 지킴이 표시: 머리 위 작은 금빛 마름모
  if (L.guardian) B.add(new THREE.OctahedronGeometry(rH * 0.3), 0xf0c040, [0, rH * 2.55, 0], [0, 0, 0], [0.8, 1.3, 0.8]);
}

function buildTorso(B, L, P) {
  const { hip, neck } = P, job = L.job, sq = [1, 1, 0.8];
  const skin = L.kid ? KID_SKIN : SKIN;
  B.cyl(0.09, 0.1, 0.16, 8, skin, [0, neck + 0.02, 0]); // 목
  const top = neck - 0.02, chest = hip + (neck - hip) * 0.62, waist = hip + (neck - hip) * 0.28;
  const prof = (hemY, hemR, w = 1) => [[0.001, hemY], [hemR, hemY], [0.25 * w, waist], [0.29 * w, chest], [0.28 * w, top - 0.06], [0.2 * w, top], [0.08, top + 0.02]];
  if (job === 'official' || job === 'monk') { // 발목까지 오는 긴 옷
    B.lathe(prof(0.08, 0.42, 1.03), L.robe, [0, 0, 0], sq, 14);
    B.ring(0.265, 0.045, job === 'official' ? GOLD : L.robe, [0, waist + 0.04, 0], [Math.PI / 2, 0, 0], sq, 16);
    if (job === 'monk') B.ring(0.33, 0.06, L.trim, [0, (waist + chest) / 2, 0], [Math.PI / 2, 0.55, 0], [1, 1, 0.82], 18); // 가사: 비스듬히 두른 붉은 천
    if (job === 'official') B.box(0.16, 0.2, 0.03, GOLD, [0, waist + 0.04, 0.22]); // 서대 장식
  } else if (job === 'commonerWoman') { // 긴 치마와 짧은 저고리, 고름
    B.lathe([[0.001, 0.05], [0.44, 0.05], [0.3, waist], [0.24, chest - 0.02], [0.001, chest - 0.02]], L.pants, [0, 0, 0], sq, 14);
    B.lathe([[0.001, chest - 0.08], [0.27, chest - 0.1], [0.29, chest], [0.27, top - 0.06], [0.2, top], [0.08, top + 0.02]], L.robe, [0, 0, 0], sq, 14);
    B.box(0.06, 0.26, 0.03, L.trim, [0.06, chest - 0.12, 0.225], [0, 0, 0.15]);
  } else {
    const long = { soldier: [0.42, 0.34], archer: [0.45, 0.32], khitan: [0.3, 0.37] }[job] || [hip - 0.08, 0.28];
    B.lathe(prof(long[0], long[1]), L.robe, [0, 0, 0], sq, 14);
    B.ring(0.26, 0.04, L.trim, [0, waist + 0.03, 0], [Math.PI / 2, 0, 0], sq, 16);
    if (job === 'commoner' || job === 'artisan') B.box(0.05, 0.24, 0.03, L.trim, [0.07, chest - 0.1, 0.225], [0, 0, 0.12]); // 고름
  }
  // 앞섶(깃): 가슴에서 엇갈리는 흰 깃
  if (job !== 'khitan') for (const s of [-1, 1]) B.box(0.06, 0.32, 0.03, job === 'monk' ? 0xe8e4dc : WHITE, [s * 0.05, top - 0.14, 0.215], [-0.15, 0, -s * 0.55]);
  if (job === 'soldier') { // 비늘 갑옷 조끼(가로 띠)와 어깨 갑옷
    const A = L.armor ?? 0x5f7590;
    B.lathe([[0.001, waist - 0.1], [0.3, waist - 0.1], [0.31, chest], [0.29, top - 0.07], [0.001, top - 0.07]], A, [0, 0, 0], [1, 1, 0.84], 14);
    for (const y of [waist, (waist + chest) / 2, chest]) B.ring(0.305, 0.022, 0x3e4c60, [0, y, 0], [Math.PI / 2, 0, 0], [1, 1, 0.84], 16);
    for (const s of [-1, 1]) {
      B.cap(0.17, A, [s * 0.32, top - 0.05, 0], [0, 0, -s * 0.5], [1, 0.8, 1.1], 0.5, 10);
      B.ring(0.15, 0.025, L.trim, [s * 0.36, top - 0.12, 0], [Math.PI / 2, 0, -s * 0.5], [1, 1.1, 1], 10);
    }
  }
  if (job === 'khitan') { // 왼섶 긴 옷, 털 깃, 어깨 털
    B.ring(0.17, 0.08, FUR, [0, top - 0.02, 0], [Math.PI / 2, 0, 0], [1, 1, 0.9], 14);
    B.box(0.07, 0.6, 0.03, L.trim, [-0.08, chest - 0.15, 0.225], [-0.05, 0, -0.25]);
    for (const s of [-1, 1]) B.ball(0.15, FUR, [s * 0.3, top - 0.05, 0], [1, 0.7, 1.1], 8);
  }
  if (job === 'artisan') { // 앞치마와 목끈
    B.box(0.42, 0.62, 0.03, L.trim, [0, hip + 0.02, 0.235], [0.08, 0, 0]);
    B.box(0.42, 0.06, 0.035, 0x6a4028, [0, hip + 0.33, 0.24], [0.08, 0, 0]);
    B.box(0.05, 0.3, 0.03, 0x6a4028, [0, chest + 0.02, 0.215], [-0.2, 0, 0]);
  }
  if (job === 'archer') { // 등의 화살통과 깃
    B.cyl(0.08, 0.07, 0.62, 8, 0x7a5232, [0.08, chest - 0.02, -0.25], [0, 0, 0.45]);
    for (let i = 0; i < 3; i++) B.add(new THREE.ConeGeometry(0.035, 0.14, 4), WHITE, [0.22 + i * 0.03, chest + 0.32 + i * 0.02, -0.25 + (i - 1) * 0.04], [0, 0, 0.45]);
  }
  if (L.kid && L.sleeve) B.ring(0.17, 0.03, L.sleeve, [0, top - 0.02, 0], [Math.PI / 2, 0, 0], [1, 1, 0.9], 14); // 지킴이: 소매색 깃 띠
}

function buildArm(B, L, side, P) {
  const wide = L.job === 'official' || L.job === 'monk';
  const col = L.sleeve ?? L.robe, len = P.arm, skin = L.kid ? KID_SKIN : SKIN;
  if (wide) { B.cyl(0.1, 0.22, len, 10, col, [0, -len / 2, 0]); B.cyl(0.21, 0.21, 0.04, 10, L.trim === GOLD ? 0x2e2a30 : L.trim, [0, -len + 0.01, 0]); }
  else {
    B.cyl(0.095, 0.105, len, 8, col, [0, -len / 2, 0]);
    B.cyl(0.11, 0.11, 0.06, 8, L.job === 'soldier' ? (L.armor ?? 0x5f7590) : L.trim, [0, -len + 0.04, 0]); // 소맷부리(병사는 팔 보호대)
  }
  B.ball(0.085, skin, [0, -len - 0.07, 0], [1, 1, 1], 8);
  const hy = -len - 0.07;
  if (side === 0) { // 오른손
    if (L.gear === 'spear') {
      const s = L.kid ? 0.75 : 1;
      B.cyl(0.028, 0.028, 2.5 * s, 6, WOOD, [0, hy + 0.55 * s, 0.05]);
      B.add(new THREE.ConeGeometry(0.07, 0.3 * s, 4), 0xd8dde2, [0, hy + 1.95 * s, 0.05]);
      B.ball(0.08, 0xc8402e, [0, hy + 1.72 * s, 0.05], [1, 0.8, 1], 6);
    } else if (L.gear === 'hammer') {
      B.cyl(0.025, 0.025, 0.5, 6, WOOD, [0, hy - 0.05, 0.12], [Math.PI / 2, 0, 0]);
      B.box(0.12, 0.12, 0.22, 0x6a6a70, [0, hy - 0.05, 0.38], [0, Math.PI / 2, 0]);
    } else if (L.prop === 'tablet') B.box(0.06, 0.4, 0.12, 0xe8dcc0, [0, hy + 0.1, 0.07], [0.2, 0, 0]); // 홀
  } else { // 왼손
    if (L.prop === 'shield') { B.cyl(0.32, 0.32, 0.05, 12, L.job === 'khitan' ? 0x7a5a3a : 0x9a3b2c, [0.08, hy + 0.1, 0.05], [0, 0, Math.PI / 2]); B.ball(0.07, GOLD, [0.12, hy + 0.1, 0.05], [1, 1, 1], 6); }
    else if (L.prop === 'bundle') { B.ball(0.2, 0x5a7aa0, [0, hy - 0.12, 0.05], [1.1, 0.9, 1], 8); B.ball(0.06, 0x5a7aa0, [0, hy + 0.02, 0.05], [1, 1, 1], 6); }
    else if (L.prop === 'basket') { B.cyl(0.2, 0.14, 0.2, 10, 0xc8a060, [0, hy - 0.15, 0.08]); B.ring(0.12, 0.015, 0x9a7440, [0, hy - 0.02, 0.08], [0, 0, 0], [1, 1, 1], 10); }
    else if (L.prop === 'staff') B.cyl(0.025, 0.025, 1.9, 6, WOOD, [0, hy + 0.5, 0.05]);
  }
}

// 활(따로 그리는 조각: 손이 올라가도 늘 세로로 서 있게 팔 기울기를 되돌린다)
function makeBow(kid) {
  const B = vcBuilder(), r = kid ? 0.5 : 0.62;
  const end = Math.PI * 0.425; // 활 끝은 줌통에서 ±76도. 줌통(손)이 앞, 시위가 뒤
  B.add(new THREE.TorusGeometry(r, 0.03, 5, 16, end * 2), 0x6a4028, [0, 0, -r], [end, -Math.PI / 2, 0]);
  B.cyl(0.006, 0.006, 2 * r * Math.sin(end), 3, WHITE, [0, 0, -r + r * Math.cos(end)]);
  B.cyl(0.04, 0.04, 0.16, 6, 0x3a2a20, [0, 0, 0]);
  const m = B.mesh(toonMat(), 'bow');
  return m;
}

let figureCount = 0;
// look → 사람(THREE.Group). 몸 짓는 결과는 생김새마다 한 번만 만들고 같은 생김새끼리 나눠 쓴다.
const geoCache = new Map();
export function makeFigure(look, { name = '' } = {}) {
  const L = { ...look };
  const kid = !!L.kid;
  const P = kid ? { hip: 0.58, neck: 1.18, rH: 0.43, arm: 0.44, sx: 0.29, leg: 0.11 } : { hip: 0.74, neck: 1.46, rH: 0.41, arm: 0.54, sx: 0.33, leg: 0.12 };
  const key = JSON.stringify(L);
  let G = geoCache.get(key);
  if (!G) {
    G = {};
    const T = vcBuilder(); buildTorso(T, L, P); G.torso = T.geometry();
    const H = vcBuilder();
    H.add(new THREE.SphereGeometry(P.rH, 22, 16), 0xffffff, [0, 0, 0], [0, 0, 0], [1, 0.96, 0.98], { keepUV: true });
    buildHead(H, L, P.rH); G.head = H.geometry();
    G.arms = [0, 1].map(s => { const A = vcBuilder(); buildArm(A, L, s, P); return A.geometry(); });
    G.legs = [0, 1].map(() => {
      const B = vcBuilder(), h = P.hip;
      const boots = L.job === 'soldier' || L.job === 'khitan';
      B.cyl(P.leg, P.leg * 0.9, h - 0.08, 8, L.pants, [0, -(h - 0.08) / 2, 0]);
      if (boots) B.cyl(P.leg * 1.05, P.leg * 1.0, h * 0.5, 8, SHOE, [0, -h * 0.72, 0]);
      else if (L.job === 'commoner' || L.job === 'artisan') B.cyl(P.leg * 0.98, P.leg * 0.95, h * 0.35, 8, 0xd8d0c0, [0, -h * 0.78, 0]); // 행전
      B.ball(0.12, SHOE, [0, -h + 0.07, 0.05], [0.95, 0.65, 1.5], 10);
      return B.geometry();
    });
    geoCache.set(key, G);
  }
  const fig = new THREE.Group(); fig.name = name || `figure:${L.job}`;
  const rig = new THREE.Group(); fig.add(rig);
  const legs = [-1, 1].map((s, i) => {
    const piv = new THREE.Group(); piv.position.set(s * P.leg * 1.15, P.hip, 0); rig.add(piv);
    const m = new THREE.Mesh(G.legs[i], toonMat()); m.castShadow = true; m.name = 'leg'; piv.add(m);
    return piv;
  });
  const body = new THREE.Group(); body.position.y = P.hip; rig.add(body);
  const torso = new THREE.Mesh(G.torso, toonMat()); torso.name = 'torso'; torso.castShadow = true; torso.position.y = -P.hip; body.add(torso);
  const arms = [-1, 1].map((s, i) => {
    const piv = new THREE.Group(); piv.position.set(s * P.sx, P.neck - 0.12 - P.hip, 0); body.add(piv);
    const m = new THREE.Mesh(G.arms[i], toonMat()); m.castShadow = true; m.name = 'arm'; piv.add(m);
    return piv;
  });
  let bow = null;
  if (L.gear === 'bow') { bow = makeBow(kid); bow.position.set(0, -P.arm - 0.07, 0.02); arms[1].add(bow); }
  const headPiv = new THREE.Group(); headPiv.position.y = P.neck + 0.08 - P.hip; body.add(headPiv);
  const head = new THREE.Mesh(G.head, headMat(L.face, kid, kid ? KID_SKIN : SKIN)); head.name = 'head'; head.castShadow = true;
  head.position.y = P.rH * 0.88; headPiv.add(head);
  // 옮기기용 짐(평소에는 숨김: 그리기 수에 들지 않는다)
  const LB = vcBuilder();
  LB.box(0.5, 0.36, 0.36, 0xc8a46a, [0, 0, 0]); LB.box(0.52, 0.04, 0.38, 0x7a5232, [0, 0.06, 0]); LB.box(0.04, 0.38, 0.38, 0x7a5232, [0, 0, 0]);
  const load = LB.mesh(toonMat(), 'carryLoad'); load.visible = false;
  load.position.set(0, P.neck - P.hip - 0.48, 0.42); body.add(load);
  figureCount += 1;
  const k = Math.sin(figureCount * 12.9898) * 43758.5453;
  const h = (L.height || 1) * (kid ? 0.92 : 1.12);
  fig.scale.setScalar(h);
  fig.userData = { look: L, kid, rig, body, legs, arms, head: headPiv, bow, load, action: 'idle', t: 0, ph: (k - Math.floor(k)) * 20, P };
  return fig;
}

export function setAction(fig, action) {
  const u = fig.userData;
  if (u.action !== action) { u.action = action; u.t = 0; }
  return fig;
}

// 동작: 매 프레임 부른다. 목표 자세로 부드럽게 다가간다(팔은 어깨, 다리는 엉덩이에서만 돈다)
export function animateFigure(fig, dt) {
  const u = fig.userData;
  if (!u.legs) return;
  u.t += dt;
  const t = u.t + u.ph, a = u.action;
  const k = Math.min(1, dt * 12);
  const ease = (o, prop, v) => { o[prop] += (v - o[prop]) * k; };
  let L0 = 0, L1 = 0, A = [[0, -0.08], [0, 0.08]], lean = 0, turn = 0, hop = 0, hx = 0, hy = 0, bob = 0;
  if (a === 'walk' || a === 'carry') {
    const s = Math.sin(t * (a === 'carry' ? 8 : 10));
    L0 = s * (a === 'carry' ? 0.4 : 0.65); L1 = -L0; bob = Math.abs(Math.cos(t * 10)) * 0.04;
    if (a === 'walk') A = [[-s * 0.55, -0.1], [s * 0.55, 0.1]];
    else { A = [[-1.15, 0.12], [-1.15, -0.12]]; lean = -0.05; }
  } else if (a === 'cheer') {
    const w = Math.sin(t * 12) * 0.25;
    A = [[-2.75 + w, -0.35], [-2.75 - w, 0.35]]; hop = Math.max(0, Math.sin(t * 7)) * 0.16; hx = -0.18;
  } else if (a === 'surprise') {
    const j = u.t < 0.25 ? Math.sin(u.t / 0.25 * Math.PI) * 0.12 : 0;
    A = [[-0.85, -0.95], [-0.85, 0.95]]; lean = -0.2; hx = -0.15; hop = j; L0 = 0.15; L1 = -0.1;
  } else if (a === 'push') {
    const p = Math.sin(t * 6) * 0.15;
    A = [[-1.45 + p, 0.1], [-1.45 + p, -0.1]]; lean = 0.32; L0 = 0.55; L1 = -0.45; hx = -0.2;
  } else if (a === 'shoot') {
    const c = (u.t % 1.6) / 1.6, draw = c < 0.7 ? c / 0.7 : 0; // 당겼다가 놓는다
    A = [[-1.45 + draw * 0.2, 0.15 + draw * 0.55], [-1.5, -0.1]]; turn = 0.35; hy = -0.3; L0 = 0.3; L1 = -0.2;
  } else if (a === 'nod') {
    hx = Math.max(0, Math.sin(t * 5)) * 0.28;
  } else { // 서 있기: 숨쉬기와 천천히 두리번
    hy = Math.sin(t * 0.45) * 0.3 * Math.max(0, Math.sin(t * 0.21));
    bob = Math.sin(t * 2) * 0.008;
  }
  ease(u.legs[0].rotation, 'x', L0); ease(u.legs[1].rotation, 'x', L1);
  for (let i = 0; i < 2; i++) { ease(u.arms[i].rotation, 'x', A[i][0]); ease(u.arms[i].rotation, 'z', A[i][1]); }
  ease(u.body.rotation, 'x', lean); ease(u.body.rotation, 'y', turn);
  ease(u.head.rotation, 'x', hx); ease(u.head.rotation, 'y', hy);
  u.body.position.y = u.P.hip + bob; u.rig.position.y += (hop - u.rig.position.y) * Math.min(1, dt * 20);
  if (u.bow) u.bow.rotation.x = -u.arms[1].rotation.x - u.body.rotation.x; // 활은 늘 세로
  u.load.visible = a === 'carry';
}
