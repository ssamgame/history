// 코드로 만드는 로우폴리 인물과 걷기 동작, 머리 위 표시.
import * as THREE from 'three';
import { faceTexture, faceVariant } from './faces.js';
import { roleOf } from './facebuild.js';
import { hairStyle, eraKey } from './hairstyle.js';
import { worldMapped } from './textures.js';
import { animateWalk, HIP } from './motion.js';
export { gaitPose, carryPose, setCarry, animateWalk, setWork, setStyle, setLook, setTalking, playAction, blendArms, CARRY, HIP } from './motion.js';

// 장면에서 쓰는 색 → 어울리는 무늬. 무늬를 따로 말하지 않으면 색으로 고른다(성벽 회색은 돌, 지붕 먹색은 기와, 갈색 목재는 나뭇결).
const AUTO = new Map([
  ...[0x5a3f2a, 0x6b4a32, 0x8a6a45, 0x5e432c, 0x7a4e32, 0x3a2c20, 0x7a5a3c, 0x94643f, 0x8a5a3a, 0x5d4330, 0xb07a42, 0xc48a4c, 0x2a1a12].map(c => [c, 'wood']),
  ...[0x8c8577, 0xa59c8a, 0x7d766a, 0xb3ab99, 0x8c877e, 0x77736a, 0x6b6862, 0xb3ada2, 0xe4ded2].map(c => [c, 'stone']),
  ...[0x3d4846].map(c => [c, 'tile']),
  ...[0x8a7356, 0x7a6449, 0x8f7556, 0xc8a476, 0xb59a76].map(c => [c, 'earth']),
  ...[0xd8d0bc, 0xe6dcc3].map(c => [c, 'cloth']),
  ...[0x5a7a4a, 0x587a48, 0x4f6b4a, 0x6f8a5a, 0x3e5f4a, 0x3e6b46].map(c => [c, 'grass']),
]);
// 색 + 무늬 종류(grain·stone·wood·tile·grass·cloth·earth)로 재질을 만든다. 같은 조합은 같이 쓴다.
const mats = new Map();
export function mat(color, kind = null, space = 'world') {
  kind = kind || AUTO.get(color) || 'grain';
  const key = `${color}:${kind}:${space}`;
  if (!mats.has(key)) mats.set(key, worldMapped(new THREE.MeshLambertMaterial({ color, flatShading: true }), kind, space));
  return mats.get(key);
}

function part(geo, color, x, y, z, parent, kind = 'cloth') {
  const m = new THREE.Mesh(geo, mat(color, kind, 'object'));
  m.position.set(x, y, z); m.castShadow = true;
  parent.add(m);
  return m;
}

const HEAD_Y = 2.02, HEAD_SCALE = 1.3;
// 피부색(D-54): 밝은 얼굴(light), 보통, 햇볕에 그을린 얼굴(tan: 농민·군사·일꾼), 나이 든 얼굴(old)
export const SKINS = { light: 0xf6d8ba, base: 0xf2cfab, tan: 0xe8c09a, old: 0xecc9a8 }; // D-54 고침: 얼굴이 너무 진해 보이지 않게 밝게
const skinMats = new Map();
const headMat = (skin = 'base', tone = 0) => { const c0 = new THREE.Color(SKINS[skin] ?? SKINS.base); const c = c0.offsetHSL(0, tone * 0.02, tone * 0.02).getHex(); if (!skinMats.has(c)) skinMats.set(c, new THREE.MeshLambertMaterial({ color: c })); return skinMats.get(c); };
// 찰갑(작은 쇠·가죽 조각을 끈으로 엮은 갑옷) 무늬: 회색조로 그려 재질 색을 곱한다
let lamellarTex = null;
function lamellar() {
  if (lamellarTex) return lamellarTex;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  c.fillStyle = '#9a9a9a'; c.fillRect(0, 0, 128, 128);
  for (let r = 0; r < 8; r++) for (let i = 0; i < 9; i++) {
    const x = i * 16 - (r % 2) * 8, y = r * 16;
    c.fillStyle = (i + r) % 3 ? '#e8e8e8' : '#d4d4d4'; c.beginPath(); c.roundRect(x + 1.5, y + 1, 13, 14, 4); c.fill();
    c.fillStyle = '#5a5a5a'; c.fillRect(x + 7, y + 3, 2, 2); c.fillRect(x + 7, y + 11, 2, 2); // 엮은 끈 구멍
  }
  c.strokeStyle = '#6a6a6a'; c.lineWidth = 2; for (let r = 1; r < 8; r++) { c.beginPath(); c.moveTo(0, r * 16); c.lineTo(128, r * 16); c.stroke(); }
  lamellarTex = new THREE.CanvasTexture(cv); lamellarTex.colorSpace = THREE.SRGBColorSpace; lamellarTex.wrapS = lamellarTex.wrapT = THREE.RepeatWrapping; lamellarTex.repeat.set(2, 1.5);
  return lamellarTex;
}
// 투구 드림: 양옆과 뒤를 둘러 늘어뜨린 찰갑 목 가리개(앞은 열려 얼굴이 보인다)
function helmetGuard(color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.41, 0.46, 14, 1, true, Math.PI * 0.32, Math.PI * 1.36), armorMat(color));
  m.material.side = THREE.DoubleSide; m.position.y = -0.02; m.castShadow = true; m.name = 'neckGuard'; return m; // 목덜미까지 덮는다
}
const armorMats = new Map();
const armorMat = color => { if (!armorMats.has(color)) armorMats.set(color, new THREE.MeshLambertMaterial({ color, map: lamellar() })); return armorMats.get(color); };
const faceMats = new Map();
function faceMat(face) {
  const key = JSON.stringify(face);
  // 이목구비는 조명을 받지 않게(MeshBasic) 해서 역광에서도 또렷하게 보인다
  if (!faceMats.has(key)) faceMats.set(key, new THREE.MeshBasicMaterial({ map: faceTexture(face), transparent: true, alphaTest: 0.1, depthWrite: false }));
  return faceMats.get(key);
}

// 조선 모자 부품 [모양, 색, x, y(몸 기준 높이), z]. 머리 반지름 0.32, 머리 중심 높이 2.02.
// 2026-10-26: 모자 아래 끝(챙)은 눈썹(약 2.18)보다 위에 둔다. 넓은 챙은 탐험 카메라(27도 위)에서도 눈썹이 보이게 더 올린다(tests/faces.test.js).
// 머리카락(D-55 고침): 앞머리 선은 이마 위(눈썹이 보이게), 뒤통수는 귀 높이 아래까지 따로 덮는다
const HAIR_TOP = (r = 0.335) => new THREE.SphereGeometry(r, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2.9);
const HAIR_BACK = (r = 0.333) => new THREE.SphereGeometry(r, 10, 6, Math.PI, Math.PI, Math.PI / 2.9 - 0.06, 1.05); // 뒤쪽 반(z < 0)만
const HAIR_T = () => [HAIR_TOP(), 0x1e1c1a, 0, 2.06, -0.01]; // 갓 밑(모자에 가려 거의 안 보인다)
const HAIR_B = () => [HAIR_BACK(), 0x1e1c1a, 0, 2.06, -0.012];
// 머리선 따라 덮는 머리(바가지 모양이 되지 않게, 2026-10-30): 이마는 눈썹 위, 관자놀이에서 귀 앞 구레나룻으로 내려오고, 귀 위를 지나 뒤통수는 목덜미까지.
// o.front 이마 선(straight 곧은·round 둥근·m 양쪽 이마가 들어간·part 한쪽 가르마), o.side 귀 위 높이, o.back 목덜미, o.flat 정수리를 판판하게(상고머리),
// o.lift 정수리 부풀림, o.crown 뒤통수 부풀림(넘긴 머리), o.part 가르마 쪽(1 오른쪽, -1 왼쪽)
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function hairCap(r = 0.335, o = {}) {
  const geo = new THREE.SphereGeometry(r, 26, 18, 0, Math.PI * 2, 0, 2.45), pos = geo.attributes.position, v = new THREE.Vector3();
  const F = Math.PI / 2.9, side = o.side ?? 1.42, back = o.back ?? 2.15, fr = o.front || 'straight', ps = o.part || 1;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const th = Math.acos(Math.max(-1, Math.min(1, v.y / r))), az = Math.atan2(v.x, v.z), a = Math.abs(az);
    let front = F;
    if (fr === 'round') front = F - 0.05 * (1 - ss(0, 0.7, a));           // 가운데가 조금 내려온 둥근 이마 선(눈썹 위)
    else if (fr === 'm') front = F - 0.12 * ss(0.15, 0.55, a) * (1 - ss(0.6, 0.85, a)); // 양쪽 이마가 들어간 선
    else if (fr === 'part') front = F - (az * ps > 0 ? 0.1 * ss(0.05, 0.3, a) * (1 - ss(0.55, 0.8, a)) : 0); // 가르마 쪽 이마가 넓게 드러난다
    // 이마(앞 ±0.75) → 관자놀이·구레나룻(±1.25 근처 조금 더 내려옴) → 귀 위(±1.6) → 뒤통수(±2.1 뒤)
    let lim = front + (side + 0.06 - front) * ss(0.72, 1.22, a);
    lim += (side - (side + 0.06)) * ss(1.3, 1.6, a);
    lim += (back - side) * ss(1.7, 2.3, a);
    const t = th / 2.45 * lim; // 줄마다 머리선까지 고르게 펴서(잘라 내지 않고) 가장자리가 톱니 없이 매끈하다
    const sinT = Math.sin(t), cosT = Math.cos(t), ph = Math.atan2(v.z, -v.x);
    let x = -r * Math.cos(ph) * sinT, y = r * cosT, z = r * Math.sin(ph) * sinT;
    if (o.flat && y > r * (1 - o.flat)) y = r * (1 - o.flat) + (y - r * (1 - o.flat)) * 0.25; // 판판한 정수리
    if (o.lift) y += o.lift * r * Math.max(0, cosT) ** 2 * (0.6 + 0.4 * Math.max(0, z / r)); // 앞쪽 정수리를 부풀린다
    if (o.crown) { const k = Math.max(0, -z / r) * Math.max(0, cosT); y += o.crown * r * k * 0.6; z -= o.crown * r * k * 0.5; }
    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals(); geo.userData.hairCap = true;
  return geo;
}
const HAIR = (o) => [hairCap(0.335, o), 0x1e1c1a, 0, 2.08, -0.01];
const JOSEON_HATS = {
  // 갓: 넓은 챙과 높은 원통 모자 (양반·학자)
  gat: () => [HAIR_T(), HAIR_B(),
    [new THREE.CylinderGeometry(0.6, 0.6, 0.025, 20), 0x1a1816, 0, 2.43, 0],
    [new THREE.CylinderGeometry(0.19, 0.23, 0.32, 14), 0x1a1816, 0, 2.59, 0]],
  // 익선관: 둥근 검은 관, 뒤가 높고 위로 선 두 날개 (임금·세자)
  ikseon: () => [
    [new THREE.SphereGeometry(0.35, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(-0.45), 0x1e1c1a, 0, 2.08, 0],
    [new THREE.CylinderGeometry(0.25, 0.28, 0.22, 14), 0x1e1c1a, 0, 2.38, -0.1],
    [new THREE.BoxGeometry(0.06, 0.26, 0.2), 0x1e1c1a, -0.17, 2.56, -0.2],
    [new THREE.BoxGeometry(0.06, 0.26, 0.2), 0x1e1c1a, 0.17, 2.56, -0.2]],
  // 전립(벙거지): 챙 달린 둥근 모자와 붉은 술 (조선 군사)
  jeollip: () => [
    [new THREE.CylinderGeometry(0.5, 0.5, 0.03, 18), 0x2a2622, 0, 2.34, 0],
    [new THREE.SphereGeometry(0.3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0x2a2622, 0, 2.34, 0],
    [new THREE.SphereGeometry(0.08, 8, 6), 0xb8452f, 0, 2.66, 0]],
  // 근대·현대: 짧은 머리, 중절모, 챙 달린 모자(학생·군인), 철모, 쪽진 머리, 땋은 머리
  short: () => [HAIR({ front: 'part', side: 1.4, back: 2.05, lift: 0.08 })],
  fedora: () => [
    [new THREE.CylinderGeometry(0.5, 0.5, 0.03, 18), 0x3a3530, 0, 2.34, 0],
    [new THREE.CylinderGeometry(0.27, 0.31, 0.3, 14), 0x3a3530, 0, 2.49, 0],
    [new THREE.CylinderGeometry(0.315, 0.315, 0.06, 14), 0x1e1c1a, 0, 2.37, 0]],
  cap: () => [
    [new THREE.CylinderGeometry(0.34, 0.33, 0.2, 14), 0x22262e, 0, 2.39, 0],
    [new THREE.BoxGeometry(0.4, 0.03, 0.22), 0x111214, 0, 2.31, 0.3]],
  steel: () => [
    [new THREE.SphereGeometry(0.37, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(-0.32), 0x5a6448, 0, 2.15, 0],
    [new THREE.CylinderGeometry(0.42, 0.42, 0.03, 16).rotateX(-0.32), 0x4e5840, 0, 2.16, 0]],
  bun: () => [HAIR({ front: 'round', side: 1.52, back: 2.25 }), [new THREE.SphereGeometry(0.13, 8, 6), 0x1e1c1a, 0, 1.98, -0.32]],
  braid: () => [HAIR({ front: 'round', side: 1.52, back: 2.25 }), [new THREE.CylinderGeometry(0.06, 0.04, 0.55, 6), 0x1e1c1a, 0, 1.75, -0.3]],
  // 청나라 모자: 낮은 원뿔과 붉은 술
  qing: () => [
    [new THREE.ConeGeometry(0.44, 0.3, 14), 0x3a3028, 0, 2.45, 0],
    [new THREE.SphereGeometry(0.08, 8, 6), 0xb8452f, 0, 2.63, 0]],
};

// 움직이는 인물(따라오는 사람·감시원·행진하는 사람들)도 걸을 때 다리와 팔을 흔든다. 만든 인물을 모아 두고 매 프레임 자리가 바뀌었는지 본다.
// 탈것에 탄 사람은 userData.noWalk = true로 둔다(배와 함께 움직여도 걷지 않는다). 플레이어는 world가 직접 움직임을 알려 준다.
const walkers = new Set();
const wp = new THREE.Vector3();
export function animateWalkers(dt, root) {
  if (!dt) return;
  for (const g of walkers) {
    let top = g; while (top.parent) top = top.parent;
    if (top !== root) { if (g.userData.seen) walkers.delete(g); continue; } // 장면에서 치운 인물은 놓아준다
    const u = g.userData; u.seen = true;
    if (u.manual) continue; // 장이 직접 걸음 동작을 맡은 인물(고려 1장 물러나는 거란군)
    if (!g.visible) { u.last = null; continue; } // 숨긴 인물은 계산하지 않는다(다시 보일 때 움직임을 새로 잰다)
    g.getWorldPosition(wp);
    const moved = u.last ? Math.hypot(wp.x - u.last.x, wp.z - u.last.z) / dt : 0;
    if (!u.last) u.last = new THREE.Vector3();
    u.last.copy(wp);
    animateWalk(g, !u.noWalk && g.visible && moved > 0.12, dt); // 천천히 움직여도 걷는다(미끄러지듯 떠가지 않게)
  }
}

// gear: 'spear'(창) · 'sword'(허리에 찬 칼) · 'bow'(등에 멘 활) · 없음. track: false면 걷기 자동 움직임에서 뺀다(플레이어)
let personCount = 0;
// outfit(D-54): 'armor'(고려·조선 찰갑: 몸통·어깨·허리 아래 갑옷 조각, armor 색), 'danryeong'(둥근 깃 단령과 각대), 'jangsam'(스님 장삼과 가사),
//   'short'(저고리와 바지: 웃옷이 엉덩이까지, pants 색 바지와 행전), 'deel'(거란·몽골: 오른쪽으로 여미는 긴 옷과 목 긴 장화), 'suit'(양복),
//   'chima'(저고리와 긴 치마: 웃옷이 짧고 치마가 발목까지), 'uniform'(단추 달린 제복·군복·교복, 주머니)
// stable: 늘 같은 생김새(말을 거는 사람·학생). 아니면 이름 없는 사람(병사·마을 사람·군중)은 한 사람씩 얼굴과 옷빛이 조금씩 다르다(D-54).
// 이름난 인물은 LOOKS에 named: true(어디서 만들어도 같은 얼굴).
export function makePerson(look = {}, { track = true, stable = false } = {}) {
  // 시대마다 다른 옷차림(2026-10-30 선생님: 당시 시대상을 복장에): 생김새의 eras[시대]가 있으면 그 시대 옷으로 바꿔 입는다
  { const ek = eraKey(), o = look.eras && ek && (look.eras[ek] || (ek === 'presentLate' && look.eras.present)); if (o) look = { ...look, ...o }; }
  const vary = !stable && !look.named;
  const { trim = 0x2b241c, gear = null, outfit = null, hairColor = null, armor = 0x6b665e, pants = null, skin = null, sleeve = null, badge = null, royal = false, cord = null } = look; // sleeve 소매 빛(동달이), badge 흉배 빛, royal 곤룡포의 둥근 보, cord 도포의 세조대 빛
  let { robe, hat } = look;
  const crowdN = vary ? personCount % 6 + 1 : (look._n || 0); // 같은 생김새 묶음마다 여섯 가지 얼굴을 돌려 쓴다(얼굴 그림 수를 줄여 태블릿 메모리를 아낀다)
  const hv = hairStyle(look, crowdN, roleOf(look)); // 시대별 머리 모양(D-56, core/hairstyle.js)
  if (hv.beard !== undefined) look = { ...look, face: { ...look.face, beard: hv.beard } }; // 군중 수염(시대·역할 범위 안에서)
  const face = look.face || {};
  hat = hv.hat; // 시대에 맞는 머리 종류(예: 현대편 상투 → 짧은 머리)
  const fv = faceVariant({ ...look, _n: crowdN }), S = fv.S, F = fv.F; // 얼굴 짜임(D-55, core/facebuild.js)
  if (vary && robe != null) robe = new THREE.Color(robe).offsetHSL((F.tone * 0.37 % 1) * 0.03, 0, F.tone * 0.05).getHex(); // 옷빛도 조금씩
  const g = new THREE.Group();
  const legs = [], arms = [];
  for (const sx of [-0.16, 0.16]) {
    // 다리는 허벅지와 정강이 두 토막, 사이에 무릎 관절(2026-10-29 선생님: 모든 인물에 다리 관절, gaitPose가 굽힌다)
    const piv = new THREE.Group(); piv.position.set(sx, 0.55, 0); g.add(piv);
    part(new THREE.BoxGeometry(0.2, 0.29, 0.22), 0x2b241c, 0, -0.14, 0, piv).name = 'thigh';
    const knee = new THREE.Group(); knee.name = 'knee'; knee.position.y = -0.275; piv.add(knee);
    part(new THREE.BoxGeometry(0.2, 0.29, 0.22), 0x2b241c, 0, -0.14, 0, knee).name = 'shin';
    part(new THREE.BoxGeometry(0.24, 0.12, 0.34), 0x1e1a16, 0, -0.225, 0.05, knee, 'grain').name = 'shoe'; // 신발
    piv.userData.knee = knee;
    legs.push(piv);
  }
  // 몸통 옷: 긴 옷(기본)은 무릎 아래까지, 저고리(short)는 엉덩이까지, 치마(chima)는 발목까지 넓게
  const sk = skin || (face.age === 'old' ? 'old' : 'base');
  if (outfit === 'shirt') { // 셔츠와 양복바지(해방 뒤 도시 사람): 바지에 넣어 입은 셔츠, 가는 허리띠, 곧은 바지
    const top = part(new THREE.CylinderGeometry(0.38, 0.42, 0.68, 7), robe, 0, 1.4, 0, g); top.name = 'robe';
    part(new THREE.CylinderGeometry(0.405, 0.405, 0.06, 7), 0x2a2420, 0, 1.06, 0, g).name = 'belt';
    const pc = pants ?? 0x3a3f4a;
    part(new THREE.CylinderGeometry(0.39, 0.36, 0.48, 7), pc, 0, 0.8, 0, g).name = 'pantsTop';
    legs.forEach(l => { l.children.forEach(m => { if (m.name === 'thigh') { m.material = mat(pc, 'cloth', 'object'); m.scale.set(1.1, 1, 1.1); } }); l.userData.knee.children.forEach(m => { if (m.name === 'shin') { m.material = mat(pc, 'cloth', 'object'); m.scale.set(1.05, 1, 1.05); } }); });
  } else if (outfit === 'dress') { // 블라우스와 무릎 치마(1950~80년대 여자·여학생 교복): 무릎 아래로 다리가 보인다
    const top = part(new THREE.CylinderGeometry(0.34, 0.4, 0.62, 7), robe, 0, 1.44, 0, g); top.name = 'jeogori';
    const sk2 = part(new THREE.CylinderGeometry(0.38, 0.5, 0.62, 9), pants ?? trim, 0, 0.84, 0, g); sk2.name = 'robe';
    legs.forEach(l => l.userData.knee.children.forEach(m => { if (m.name === 'shin') m.material = mat(0xd8b898, 'cloth', 'object'); }));
  } else if (outfit === 'short' || outfit === 'uniform') {
    const top = part(new THREE.CylinderGeometry(0.4, 0.5, 0.78, 7), robe, 0, 1.36, 0, g); top.name = 'robe';
    part(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 7), trim, 0, 1.04, 0, g).name = 'belt';
    // 바지 허리(웃옷 아래에서 허벅지까지)
    part(new THREE.CylinderGeometry(0.4, 0.38, 0.5, 7), pants ?? (outfit === 'uniform' ? robe : 0xd8cfbf), 0, 0.76, 0, g).name = 'pantsTop';
    // 바지: 허벅지는 넉넉하게, 정강이는 행전으로 묶는다(바지 색)
    const pc = pants ?? (outfit === 'uniform' ? robe : 0xd8cfbf);
    legs.forEach(l => { l.children.forEach(m => { if (m.name === 'thigh') { m.material = mat(pc, 'cloth', 'object'); m.scale.set(1.25, 1, 1.2); } }); const kn = l.userData.knee; kn.children.forEach(m => { if (m.name === 'shin') m.material = mat(outfit === 'uniform' ? pc : 0xe6dcc3, 'cloth', 'object'); }); });
  } else if (outfit === 'chima') {
    const top = part(new THREE.CylinderGeometry(0.36, 0.42, 0.42, 7), robe, 0, 1.58, 0, g); top.name = 'jeogori';
    const sk2 = part(new THREE.CylinderGeometry(0.4, 0.66, 1.1, 9), pants ?? trim, 0, 0.92, 0, g); sk2.name = 'robe'; // 가슴에서 발목까지 치마
    part(new THREE.BoxGeometry(0.1, 0.34, 0.04), 0xb8452f, 0.06, 1.47, 0.4, g).name = 'goreum'; // 옷고름
  } else {
    const len = outfit === 'danryeong' || outfit === 'jangsam' || outfit === 'deel' || outfit === 'dopo' ? 1.5 : 1.25; // 단령·장삼·델·도포는 발등 가까이까지
    const r = part(new THREE.CylinderGeometry(0.38, 0.58 + (len - 1.25) * 0.2, len, 7), robe, 0, 1.745 - len / 2, 0, g); r.name = 'robe'; r.userData.len = len;
    if (outfit === 'dopo') { // 도포: 허리에 가는 세조대를 매고 끝을 앞으로 늘어뜨린다
      part(new THREE.CylinderGeometry(0.395, 0.395, 0.04, 7), cord ?? 0x8a2f24, 0, 1.3, 0, g).name = 'belt';
      for (const sx of [-0.05, 0.05]) part(new THREE.BoxGeometry(0.03, 0.5, 0.03), cord ?? 0x8a2f24, sx, 1.05, 0.4, g).rotation.x = -0.12;
    } else if (outfit === 'jeonbok') { // 군복: 동달이 위에 소매 없는 전복, 허리에 붉은 전대
      part(new THREE.CylinderGeometry(0.405, 0.405, 0.1, 7), cord ?? 0xb8452f, 0, 1.25, 0, g).name = 'belt';
      part(new THREE.BoxGeometry(0.1, 0.5, 0.03), cord ?? 0xb8452f, 0.2, 1.0, 0.43, g).rotation.x = -0.15; // 전대 끝
    } else part(new THREE.CylinderGeometry(0.4, 0.4, 0.12, 7), outfit === 'danryeong' ? 0x1e1c1a : trim, 0, 1.25, 0, g).name = 'belt'; // 허리띠(단령은 검은 각대)
    part(new THREE.CylinderGeometry(0.585 + (len - 1.25) * 0.2, 0.6 + (len - 1.25) * 0.2, 0.08, 7), trim, 0, 1.745 - len + 0.035, 0, g).name = 'hem'; // 옷자락 끝단
  }
  if (outfit === 'danryeong') for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.42; part(new THREE.BoxGeometry(0.09, 0.08, 0.03), 0xd9a441, Math.sin(a) * 0.41, 1.25, Math.cos(a) * 0.41, g, 'grain').rotation.y = a; } // 각대 장식
  if (badge != null) { // 흉배: 관리의 가슴 네모 무늬(짙은 바탕에 수놓은 밝은 학)
    const b = part(new THREE.BoxGeometry(0.34, 0.32, 0.03), badge, 0, 1.47, 0.41, g, 'grain'); b.rotation.x = -0.08; b.name = 'badge';
    const c = part(new THREE.BoxGeometry(0.18, 0.1, 0.02), 0xe8e2d2, 0, 1.48, 0.43, g, 'grain'); c.rotation.set(-0.08, 0, 0.25); const d = part(new THREE.BoxGeometry(0.05, 0.12, 0.02), 0xe8e2d2, 0.08, 1.54, 0.43, g, 'grain'); d.rotation.x = -0.08;
  }
  if (royal) { // 곤룡포: 가슴과 두 어깨에 금빛 둥근 보(용무늬 자리)
    const r = part(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 12), 0xd9a441, 0, 1.47, 0.41, g, 'grain'); r.rotation.x = Math.PI / 2 - 0.08; r.name = 'bo';
    for (const sx of [-0.4, 0.4]) { const q = part(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 10), 0xd9a441, sx, 1.7, 0.18, g, 'grain'); q.rotation.set(Math.PI / 2 - 0.5, 0, sx > 0 ? -0.4 : 0.4); }
  }
  if (outfit === 'jeonbok') for (const sx of [-1, 1]) { // 전복 앞자락의 트인 섶(겉옷 가장자리)
    const f = part(new THREE.BoxGeometry(0.05, 0.7, 0.03), trim, sx * 0.08, 1.35, 0.4, g); f.rotation.x = -0.15;
  }
  if (outfit === 'deel') { // 오른쪽으로 비스듬히 여민 섶과 목 긴 장화
    const f = part(new THREE.BoxGeometry(0.08, 0.6, 0.04), trim, 0.16, 1.5, 0.37, g); f.rotation.set(-0.28, 0, 0.55); f.name = 'flap';
    legs.forEach(l => l.userData.knee.children.forEach(m => { if (m.name === 'shin') m.material = mat(0x2a2018, 'grain', 'object'); }));
  }
  if (outfit === 'armor') { // 찰갑: 몸통 갑옷, 어깨 갑옷, 허리 아래 갑옷 자락
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.47, 0.62, 8), armorMat(armor)); a.position.set(0, 1.45, 0); a.castShadow = true; a.name = 'armor'; g.add(a);
    const sk3 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 0.5, 8, 1, true), armorMat(armor)); sk3.material.side = THREE.DoubleSide; sk3.position.set(0, 0.95, 0); sk3.castShadow = true; g.add(sk3);
    for (const sx of [-0.47, 0.47]) { const sh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), armorMat(armor)); sh.scale.set(1.25, 0.8, 1.3); sh.position.set(sx, 1.66, 0); sh.castShadow = true; g.add(sh); }
  }
  if (outfit === 'jangsam') { // 가사: 왼쪽 어깨에서 오른쪽 옆구리로 걸친 붉은 밤색 천
    const k = part(new THREE.BoxGeometry(0.2, 1.1, 0.04), 0x8a3a2a, 0.04, 1.32, 0.39, g); k.rotation.set(-0.15, 0, -0.62); k.name = 'kasaya';
    const kb = part(new THREE.BoxGeometry(0.2, 1.1, 0.04), 0x8a3a2a, -0.04, 1.32, -0.39, g); kb.rotation.set(0.15, 0, -0.62);
  }
  if (outfit === 'uniform') { // 앞단추와 가슴 주머니
    for (let i = 0; i < 4; i++) part(new THREE.SphereGeometry(0.03, 5, 4), 0xc8b070, 0, 1.68 - i * 0.16, 0.42 + i * 0.012, g, 'grain');
    for (const sx of [-0.2, 0.2]) part(new THREE.BoxGeometry(0.16, 0.13, 0.03), trim, sx, 1.56, 0.41, g).rotation.x = -0.12;
  }
  // 앞섶(깃): 가슴에서 엇갈리는 흰 깃 두 줄. 양복(suit)이면 흰 셔츠와 넥타이
  if (outfit === 'shirt' || outfit === 'dress') { // 셔츠 깃: 목 아래 두 갈래로 펼친 흰(또는 옷빛) 깃
    for (const sx of [-1, 1]) { const c = part(new THREE.BoxGeometry(0.16, 0.12, 0.03), outfit === 'dress' ? 0xf2efe8 : new THREE.Color(robe).offsetHSL(0, 0, 0.06).getHex(), sx * 0.09, 1.7, 0.33, g); c.rotation.set(-0.35, 0, sx * -0.5); c.name = 'collar'; }
  } else if (outfit === 'suit') {
    part(new THREE.BoxGeometry(0.3, 0.44, 0.05), 0xf2efe8, 0, 1.5, 0.36, g).rotation.x = -0.28;
    const tie = part(new THREE.BoxGeometry(0.09, 0.4, 0.05), 0x7a2a2a, 0, 1.47, 0.39, g); tie.rotation.x = -0.28; tie.name = 'tie';
  } else if (outfit === 'danryeong' || outfit === 'uniform' || outfit === 'deel') { // 둥근 깃(단령)·선 깃(제복)
    const c = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 5, 14), mat(outfit === 'uniform' ? robe : trim, 'cloth', 'object')); c.rotation.x = Math.PI / 2 - 0.15; c.position.set(0, 1.78, 0.04); c.name = 'collar'; g.add(c);
  } else if (outfit !== 'armor')
  for (const [sx, rz] of [[-0.08, -0.5], [0.08, 0.5]]) {
    const c = part(new THREE.BoxGeometry(0.07, 0.42, 0.04), 0xece4d2, sx, 1.52, 0.37, g);
    c.rotation.set(-0.28, 0, rz); c.name = 'collar';
  }
  for (const sx of [-0.5, 0.5]) {
    const piv = new THREE.Group(); piv.position.set(sx, 1.65, 0); g.add(piv);
    const wide = outfit === 'dopo' || outfit === 'danryeong' || royal; // 도포·단령·곤룡포는 넓은 소매
    part(new THREE.BoxGeometry(wide ? 0.24 : 0.18, 0.72, wide ? 0.26 : 0.2), sleeve ?? robe, 0, -0.34, 0, piv); // sleeve: 동달이처럼 몸판과 다른 소매 빛
    part(new THREE.BoxGeometry(wide ? 0.26 : 0.2, 0.08, wide ? 0.28 : 0.22), trim, 0, -0.66, 0, piv); // 소맷부리
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), headMat(sk, F.tone)); hand.position.set(0, -0.78, 0); hand.castShadow = true; hand.name = 'hand'; piv.add(hand);
    arms.push(piv);
  }
  // 머리 묶음: 둥근 머리 + 만화풍 얼굴 무늬 + 모자. 만화처럼 머리를 크게(1.3배) 그린다.
  const hg = new THREE.Group(); hg.name = 'headGroup';
  hg.position.set(0, HEAD_Y + 0.08, 0); hg.scale.setScalar(HEAD_SCALE); g.add(hg);
  const hp = (geo, color, x, y, z) => part(geo, color, x, y - HEAD_Y, z, hg); // y는 몸 기준 높이로 적는다
  // 머리 모양(D-54): 공 대신 위가 둥글고 턱으로 갈수록 갸름한 달걀꼴(얼굴 무늬 판도 같은 꼴로)
  // 얼굴형(D-55): jaw 턱으로 갈수록 좁아짐, square 턱 끝을 평평하고 넓게(각진 얼굴), cheek 광대 부풀림, chin 턱 길이
  const jawify = geo => {
    const pa = geo.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      let x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
      const ck = 1 + (S.cheek - 1) * Math.exp(-(((y + 0.06) / 0.11) ** 2)); x *= ck; // 광대(눈 아래 볼 높이)
      if (y < 0) {
        const t = Math.min(1, -y / 0.32);
        const k = S.square ? 1 - (0.05 + S.jaw) * t * t : 1 - S.jaw * t; // 각진 얼굴은 턱 끝까지 넓다
        x *= k; z *= 1 - 0.08 * t;
        y *= 1.1 + S.chin * t;
        if (S.square) { const floor = -0.32 * (1.1 + S.chin) * (1 - 0.16 * S.square); if (y < floor) y = floor + (y - floor) * 0.25; } // 턱 끝을 평평하게
      }
      pa.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals(); return geo;
  };
  const head = new THREE.Mesh(jawify(new THREE.SphereGeometry(0.32, 18, 14)), headMat(sk, F.tone));
  head.name = 'head'; head.castShadow = true; hg.add(head);
  const faceGeo = jawify(new THREE.SphereGeometry(0.326, 18, 16, Math.PI / 2 - 1.15, 2.3, 0.62, 1.85));
  const faceMesh = new THREE.Mesh(faceGeo, faceMat({ ...face, v: fv }));
  faceMesh.userData.look = { ...look, _n: crowdN }; // 상황 표정(setExpression)이 같은 얼굴로 다시 그린다
  faceMesh.name = 'face'; hg.add(faceMesh);
  // 얼굴 모양: 갸름한 얼굴(long)은 위아래로, 둥근 얼굴(round)은 옆으로 조금 늘린다
  hg.scale.set(HEAD_SCALE * S.w * (F.faceW || 1), HEAD_SCALE * S.h, HEAD_SCALE * (0.98 + (S.w - 1) * 0.4)); // 얼굴형마다 다른 머리 너비·길이(D-55)
  // 귀와 코
  const ears = new THREE.Group(); ears.name = 'ears'; hg.add(ears);
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), headMat(sk, F.tone)); e.scale.set(0.55 * (F.ear || 1), F.ear || 1, 0.8 * (F.ear || 1)); e.position.set(sx * 0.315, -0.02, -0.02); ears.add(e); }
  // 코(D-55): 콧대(길이 noseL·높이 nosePro)와 코끝(너비 noseW·둥글기 noseTip)을 따로 만든다(로우폴리 두 조각)
  const nose = new THREE.Group(); nose.name = 'nose'; hg.add(nose);
  const nm = headMat(sk, F.tone), nl = 0.1 * fv.noseL, npro = fv.nosePro;
  if (fv.noseBridge >= 0.6) { const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.026 + 0.01 * fv.noseW, nl * 0.75, 0.018 * npro), nm); bridge.position.set(0, -0.03 + nl * 0.3, 0.318 + 0.01 * npro); bridge.rotation.x = -0.3; nose.add(bridge); } // 콧대가 선 코(길고 곧은 코·높은 코)만
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), nm); tip.scale.set(fv.noseW * 1.25, 0.95 * fv.noseTip, (0.8 + 0.5 * npro)); tip.position.set(0, -0.03, 0.322 + 0.022 * npro); tip.name = 'noseTip'; nose.add(tip); // 얼굴 무늬의 코끝 자리(세로각 약 95도)
  // 안경(둥근 검은 테)
  if (face.glasses === 'round') {
    const gl = new THREE.Group(); gl.name = 'glasses'; hg.add(gl);
    const frame = mat(0x1a1614, null, 'object');
    for (const sx of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 6, 16), frame); r.position.set(sx * 0.105, 0.015, 0.315); gl.add(r); }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.012), frame); bridge.position.set(0, 0.03, 0.33); gl.add(bridge);
  }
  // 머리카락 색(흰머리·희끗한 머리)
  // 머리카락 빛깔과 머리 모양(D-56, core/hairstyle.js): 시대·집단의 기본형, 군중은 일부만 한 가지씩 다르게
  const hc = new THREE.Color(hv.color || hairColor || '#1e1c1a').getHex();
  const hm = (geo, x, y, z, parent = hg) => part(geo, hc, x, y, z, parent, 'grain'); // 머리 묶음 기준 자리(y 0 = 머리 가운데)
  const band = (color, y, r0 = 0.29, r1 = 0.31, hgt = 0.06) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, hgt, 16, 1, true), mat(color, 'cloth', 'object')); m.material.side = THREE.DoubleSide; m.position.y = y; hg.add(m); return m; };
  const sideburns = () => { for (const sx of [-1, 1]) { const b = hm(new THREE.CylinderGeometry(0.016, 0.01, 0.1, 4), sx * 0.31, 0.05, 0.04); b.scale.z = 1.6; } }; // 구레나룻(귀 앞 가는 머리, 얼굴 무늬 밖)
  if (hat === 'buzz') { // 아주 짧게 깎은 머리: 머리 모양을 따라 얇게
    const hz = new THREE.Group(); hz.name = 'hat:buzz'; hg.add(hz);
    part(hairCap(0.327, { front: hv.front || 'straight', side: 1.36, back: 2.0 }), hc, 0, 0.04, -0.012, hz, 'grain');
  } else if (hat === 'swept') { // 뒤로 빗어 넘긴 머리
    const hz = new THREE.Group(); hz.name = 'hat:swept'; hg.add(hz);
    part(hairCap(0.338, { front: hv.front || 'm', side: 1.4, back: 2.1, crown: 0.25, lift: 0.05 }), hc, 0, 0.05, -0.02, hz, 'grain');
  }
  if (hat === 'official') {
    hp(new THREE.BoxGeometry(0.5, 0.32, 0.46), 0x1e1c1a, 0, 2.38, -0.02);
    hp(new THREE.BoxGeometry(1.2, 0.05, 0.07), 0x1e1c1a, 0, 2.38, -0.26);
  } else if (hat === 'helmet') {
    hp(new THREE.ConeGeometry(0.38, 0.5, 7), 0x5d5a55, 0, 2.42, 0).rotation.x = -0.3; // 뒤로 젖혀 써서 앞 끝이 눈썹보다 위(얼굴이 보이게)
    hp(new THREE.SphereGeometry(0.09, 5, 4), 0xb8452f, 0, 2.71, -0.09);
    // 투구 드림: 양옆과 뒤로 늘어뜨린 목 가리개(얼굴은 가리지 않는다)
    hg.add(helmetGuard(0x5d5a55));
    part(hairCap(0.338, { side: 1.46, back: 2.2 }), 0x3a3430, 0, 0.06, -0.01, hg, 'cloth').name = 'helmetLiner'; // 투구 밑 받침 두건: 뒤에서 봐도 투구와 드림 사이가 비지 않게
  } else if (hat === 'general') {
    hp(new THREE.ConeGeometry(0.4, 0.55, 8), 0x8a8478, 0, 2.45, 0).rotation.x = -0.3;
    hp(new THREE.SphereGeometry(0.11, 6, 5), 0xb8452f, 0, 2.77, -0.1);
    if (outfit !== 'armor') { for (const sx of [-0.48, 0.48]) part(new THREE.BoxGeometry(0.34, 0.14, 0.46), 0x8a8478, sx, 1.72, 0, g); part(new THREE.BoxGeometry(0.62, 0.5, 0.5), 0x8a8478, 0, 1.45, 0, g); }
    hg.add(helmetGuard(0x8a8478)); // 투구 드림
    part(hairCap(0.338, { side: 1.46, back: 2.2 }), 0x3a3430, 0, 0.06, -0.01, hg, 'cloth').name = 'helmetLiner';
  } else if (hat === 'fur') {
    hp(new THREE.CylinderGeometry(0.4, 0.36, 0.34, 8), 0x5a4130, 0, 2.43, 0); // 털모자(눈썹이 보이게 조금 높이)
  } else if (hat === 'kunfa') {     // 거란 곤발: 정수리를 깎고 귀 앞 머리 타래를 늘어뜨린다(lock 머리 타래 길이)
    const hz = new THREE.Group(); hz.name = 'hat:kunfa'; hg.add(hz);
    const ln = 0.42 * (hv.lock || 1);
    for (const sx of [-1, 1]) { part(new THREE.CylinderGeometry(0.05, 0.03, ln, 5), hc, sx * 0.29, 0.13 - ln / 2 - 0.02, 0.1, hz, 'grain'); part(new THREE.SphereGeometry(0.08, 6, 4), hc, sx * 0.29, 0.13, 0.08, hz, 'grain'); }
    part(new THREE.SphereGeometry(0.327, 12, 6, Math.PI, Math.PI, Math.PI / 2.6, 0.5), hc, 0, 0, -0.02, hz, 'grain').scale.set(1, 1, 0.98); // 뒤통수 아래 머리
  } else if (hat === 'mongol') {    // 몽골 모자: 털 두른 챙과 둥글게 솟은 모자, 꼭대기 술. loops: 귀 뒤로 땋아 늘어뜨린 고리
    const hz = new THREE.Group(); hz.name = 'hat:mongol'; hg.add(hz);
    part(new THREE.CylinderGeometry(0.4, 0.42, 0.12, 12), 0x6a5038, 0, 0.35, 0, hz, 'grain');
    part(new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), trim, 0, 0.39, 0, hz, 'grain');
    part(new THREE.SphereGeometry(0.06, 6, 4), 0xb8452f, 0, 0.71, 0, hz, 'grain');
    if (hv.loops) for (const sx of [-1, 1]) { const t = part(new THREE.TorusGeometry(0.07, 0.022, 4, 8), hc, sx * 0.31, -0.06, -0.08, hz, 'grain'); t.rotation.y = Math.PI / 2; }
  } else if (hat === 'daenggi' || hat === 'braid') { // 땋은 머리와 댕기(가운데 가르마). braids 2면 양 갈래, short면 짧게 땋은 머리
    const hz = new THREE.Group(); hz.name = `hat:${hat}`; hg.add(hz);
    part(hairCap(0.335, { front: hv.front || 'round', side: 1.5, back: 2.2 }), hc, 0, 0.06, -0.01, hz, 'grain'); // 가운데 가르마로 빗어 내린 머리
    const rib = { red: 0xb8282c, purple: 0x6a2a5a, black: 0x22201e }[hv.ribbon || 'red'];
    const len = hv.short ? 0.36 : 0.6, two = hv.braids === 2;
    for (const sx of two ? [-1, 1] : [0]) {
      const bx = sx * 0.2, bz = two ? -0.22 : -0.3;
      part(new THREE.CylinderGeometry(0.05, 0.035, len, 6), hc, bx, -0.03 - len / 2, bz, hz, 'grain');
      part(new THREE.BoxGeometry(0.09, 0.14, 0.03), rib, bx, -0.06 - len, bz - 0.01, hz, 'grain');
    }
  } else if (hat === 'topknot') {   // 맨머리에 상투(knot 자리·크기), 조선 뒤에는 망건(이마 위 검은 띠), towel 흰 수건 머리띠
    hp(hairCap(0.335, { front: hv.front || 'straight', side: 1.44, back: 2.1, lift: -0.04 }), hc, 0, 2.08, -0.01); // 이마 위로 빗어 올려 정수리에 묶은 머리(바짝 당겨 납작하게)
    const ky = { high: 0.44, mid: 0.4, low: 0.33 }[hv.knot || 'mid'], kz = { high: 0, mid: -0.02, low: -0.12 }[hv.knot || 'mid'];
    hm(new THREE.SphereGeometry(0.1 * (hv.knotSize || 1), 8, 6), 0, ky, kz).name = 'sangtu';
    if (hv.manggeon && !hv.towel) band(0x141210, 0.235, 0.27, 0.285, 0.035).name = 'manggeon'; // 이마 위 머리 선에 걸친 가는 띠
    if (hv.towel) band(0xe8e4d8, 0.225, 0.275, 0.3, 0.06).name = 'towel';
    if (hv.sideburn) sideburns();
  } else if (hat === 'short' && hv.cut) { // 짧은 머리: crop 상고머리, side 가르마, buzz 까까머리, back 뒤로 넘긴 머리
    const hz = new THREE.Group(); hz.name = 'hat:short'; hg.add(hz);
    const thin = hv.cut === 'buzz';
    const CUT = { crop: { front: 'straight', side: 1.36, back: 1.95, flat: 0.12, lift: 0.06 }, side: { front: 'part', side: 1.42, back: 2.05, lift: 0.1 }, buzz: { front: 'straight', side: 1.38, back: 1.9 }, back: { front: 'm', side: 1.42, back: 2.1, crown: 0.28, lift: 0.06 } }[hv.cut];
    part(hairCap(thin ? 0.326 : 0.337, { ...CUT, front: hv.front || CUT.front }), hc, 0, thin ? 0.04 : 0.06, -0.01, hz, 'grain'); // 자른 모양마다 윤곽이 다르다(상고머리 판판한 정수리, 가르마 한쪽 이마, 넘긴 머리 부푼 뒤통수)
    if (hv.cut === 'side') { const s = part(new THREE.BoxGeometry(0.2, 0.05, 0.22), hc, 0.1, 0.29, 0.05, hz, 'grain'); s.rotation.z = -0.4; } // 한쪽으로 빗은 가르마
    if (hv.sideburn) sideburns();
  } else if (hat === 'bun' && hv.perm) { // 1950년대 파마머리: 짧고 곱슬한 머리
    const hz = new THREE.Group(); hz.name = 'hat:perm'; hg.add(hz);
    part(hairCap(0.34, { front: 'round', side: 1.55, back: 2.0, lift: 0.14 }), hc, 0, 0.06, -0.01, hz, 'grain');
    for (let k = 0; k < 7; k++) { const a = Math.PI * (0.05 + k * 0.15); part(new THREE.SphereGeometry(0.08, 6, 4), hc, Math.cos(a) * 0.31, -0.02 - (k % 2) * 0.04, Math.sin(a) * -0.27 - 0.03, hz, 'grain'); } // 옆과 뒤의 곱슬(얼굴 앞에는 두지 않는다)
  } else if (JOSEON_HATS[hat]) {    // 모자·머리 묶음 하나(hat:이름)로 만든다
    const hatG = new THREE.Group(); hatG.name = `hat:${hat}`; hg.add(hatG);
    for (const [geo, color, x, y, z] of JOSEON_HATS[hat]()) part(geo, color === 0x1e1c1a ? hc : color, x, y - HEAD_Y, z, hatG, 'grain'); // 머리카락은 머리 빛깔로
    if (hat === 'bun') { // 쪽: 크기, 비녀
      const bun = hatG.children.find(m => m.geometry.type === 'SphereGeometry' && m.geometry.parameters.radius === 0.13); if (bun) bun.scale.setScalar(hv.bun || 1);
      const pin = { silver: 0xc8c8c4, wood: 0x6b4a32, jade: 0x5a8a6a }[hv.pin || 'silver'];
      const b = part(new THREE.CylinderGeometry(0.014, 0.014, 0.36, 5), pin, 0, 1.98 - HEAD_Y, -0.33, hatG, 'grain'); b.rotation.z = Math.PI / 2; b.name = 'binyeo';
    }
    if (hv.manggeon) band(0x141210, 0.235, 0.27, 0.285, 0.035).name = 'manggeon'; // 갓·전립 밑으로 보이는 망건
    if (hv.sideburn) sideburns();
    if (hv.nape) hm(new THREE.SphereGeometry(0.325, 10, 3, Math.PI * 1.1, Math.PI * 0.8, Math.PI / 1.85, 0.32), 0, 0.02, -0.01); // 모자 밑 뒷머리
  }
  // 머리선 머리도 얼굴형(광대·턱)을 따라 늘인다: 넓은 광대·긴 턱이 머리 밖으로 비죽 나오지 않게
  const hv3 = new THREE.Vector3();
  hg.traverse(m => { if (!m.isMesh || !m.geometry.userData.hairCap || m.geometry.userData.fit) return;
    hv3.set(0, 0, 0); for (let o = m; o && o !== hg; o = o.parent) hv3.add(o.position);
    m.geometry.translate(hv3.x, hv3.y, hv3.z); const pa = m.geometry.attributes.position, q = new THREE.Vector3();
    for (let i = 0; i < pa.count; i++) { q.fromBufferAttribute(pa, i); const d = q.length(), min = 0.333 + 0.01 * Math.max(0, q.y / 0.32); if (d < min) { q.multiplyScalar(min / d); pa.setXYZ(i, q.x, q.y, q.z); } } // 머리 가운데에서 늘 머리통 밖(아래쪽 가장자리가 머리통에 묻히지 않게)
    jawify(m.geometry); m.geometry.translate(-hv3.x, -hv3.y, -hv3.z); m.geometry.computeVertexNormals(); m.geometry.userData.fit = true; });
  // 들고 있는 무기
  if (gear === 'spear') { // 오른손에 세워 든 창
    const s = new THREE.Group(); s.name = 'spear'; s.position.set(0, -0.78, 0.04); arms[1].add(s);
    part(new THREE.CylinderGeometry(0.035, 0.035, 2.6, 5), 0x5a3f2a, 0, 0.55, 0, s, 'wood');
    part(new THREE.ConeGeometry(0.08, 0.32, 4), 0xc9ccd0, 0, 2.0, 0, s, 'grain');
    part(new THREE.SphereGeometry(0.07, 5, 4), 0xb8452f, 0, 1.78, 0, s, 'grain'); // 창술
  } else if (gear === 'sword') { // 왼쪽 허리에 찬 칼
    const s = new THREE.Group(); s.name = 'sword'; s.position.set(-0.42, 1.0, 0.12); s.rotation.set(0.25, 0, 0.35); g.add(s);
    part(new THREE.BoxGeometry(0.08, 0.95, 0.12), 0x2b2118, 0, -0.2, 0, s, 'wood');
    part(new THREE.BoxGeometry(0.2, 0.05, 0.16), 0xd9a441, 0, 0.29, 0, s, 'grain');
    part(new THREE.CylinderGeometry(0.035, 0.035, 0.24, 5), 0x3a2c20, 0, 0.42, 0, s, 'wood');
  } else if (gear === 'rifle') { // 등에 비스듬히 멘 총(독립군·광복군·국군)
    const r = new THREE.Group(); r.name = 'rifle'; r.position.set(0.1, 1.45, -0.42); r.rotation.set(0, 0, 0.5); g.add(r);
    part(new THREE.BoxGeometry(0.07, 1.25, 0.07), 0x2b2b2b, 0, 0.1, 0, r, 'grain');
    part(new THREE.BoxGeometry(0.12, 0.45, 0.1), 0x5a3f2a, 0, -0.55, 0, r, 'wood');
  } else if (gear === 'bow') { // 등에 멘 활
    const b = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.035, 4, 12, Math.PI), mat(0x5a3f2a, 'wood', 'object'));
    b.name = 'bow'; b.position.set(0, 1.45, -0.42); b.rotation.set(0, 0, Math.PI / 2 + 0.3); b.castShadow = true; g.add(b);
  }
  // 사람마다 조금씩 다른 키(복제한 듯 보이지 않게)와 저마다 다른 숨쉬기·두리번거리기 박자
  personCount += 1;
  const k = Math.sin(personCount * 12.9898) * 43758.5453, rnd = k - Math.floor(k);
  if (track) g.scale.setScalar(0.95 + rnd * 0.1);
  // 몸통 관절(2026-10-30 움직임 개선, core/motion.js): 골반 높이에서 상체(윗옷·갑옷·깃)·두 팔·머리를 함께 돌린다. 긴 옷자락·다리·허리 칼은 그대로
  const upper = new THREE.Group(); upper.name = 'upper'; upper.position.y = HIP;
  for (const c of [...g.children]) if (arms.includes(c) || c === hg || (c.position.y > 1.28 && !legs.includes(c))) { g.remove(c); c.position.y -= HIP; upper.add(c); }
  g.add(upper);
  // 무기를 쥔 팔의 기본 자세(grip: [앞뒤, 안팎]): 창은 오른손으로 곧게 세워 쥐고, 칼은 왼손을 칼자루에 얹는다. 쥔 팔은 걸을 때 거의 흔들지 않는다
  const grip = gear === 'spear' ? [null, [-0.25, -0.04]] : gear === 'sword' ? [[-0.2, 0.12], null] : null;
  if (gear === 'spear') { const sp = arms[1].getObjectByName('spear'); if (sp) sp.rotation.x = 0.25; } // 팔을 앞으로 든 만큼 창을 세운다
  g.userData = { legs, arms, walk: 0, head: hg, upper, grip, gear, lookAge: face.age, ph: rnd * 20, spear: gear === 'spear' ? arms[1].getObjectByName('spear') : null };
  if (track) walkers.add(g);
  return rigHook ? rigHook(g, look) : g; // 공통 뼈대 몸(core/body.js): 켜져 있으면 조각을 뼈에 옮겨 붙인다
}

// 공통 뼈대 몸(2026-10-31): core/flow.js가 켜고 끈다(core/body.js의 attachBody). 끈 동안 makePerson은 예전과 똑같다.
// POST_POSE: 한 프레임의 걸음·동작 자세를 다 정한 뒤 부르는 일(뼈대 몸의 동작 갱신). world.step이 부른다
let rigHook = null;
export function setRigHook(fn) { rigHook = fn; }
export const POST_POSE = new Set();

// 상황 표정(D-55): 'neutral'·'talk'·'surprise'·'worry'·'anger'·'joy'·'tension'(core/facebuild.js EXPRESSIONS). 같은 얼굴 짜임으로 다시 그린 무늬로 바꾼다
export function setExpression(person, expr = 'neutral') {
  const f = person.getObjectByName('face'); if (!f?.userData.look) return;
  const L = f.userData.look; f.material = faceMat({ ...(L.face || {}), v: faceVariant(L, expr) });
  person.userData.expr = expr;
}

// 네 다리 짐승(말)의 걸음: 대각선 짝(앞왼·뒤오른 / 앞오른·뒤왼)이 번갈아 나가고 머리를 걸음에 맞춰 끄덕인다. 들썩이는 높이를 돌려준다
export function horseGait(horse, ph) {
  const s = Math.sin(ph) * 0.6;
  horse.userData.legs.forEach((l, j) => { l.rotation.x = j === 0 || j === 3 ? s : -s; });
  if (horse.userData.head) horse.userData.head.rotation.x = Math.sin(ph * 2) * 0.08;
  return Math.abs(Math.cos(ph)) * 0.05;
}

export function markerSprite(text = '!', bg = '#d9a441') {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const x = cv.getContext('2d');
  x.fillStyle = bg; x.beginPath(); x.arc(32, 32, 28, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#1b1f1d'; x.lineWidth = 4; x.stroke();
  x.fillStyle = '#1b1f1d'; x.font = 'bold 40px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 32, 34);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv) }));
  s.scale.set(0.8, 0.8, 0.8);
  return s;
}

export function labelSprite(text) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 72;
  const x = cv.getContext('2d');
  x.fillStyle = 'rgba(27,31,29,.85)'; x.fillRect(0, 0, 256, 72);
  x.strokeStyle = '#d9a441'; x.lineWidth = 4; x.strokeRect(2, 2, 252, 68);
  x.fillStyle = '#f2ead9'; x.font = 'bold 34px "Nanum Myeongjo", Batang, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 128, 38);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false }));
  s.scale.set(4.4, 1.25, 1);
  return s;
}
