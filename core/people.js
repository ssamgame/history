// 코드로 만드는 로우폴리 인물과 걷기 동작, 머리 위 표시.
import * as THREE from 'three';
import { faceTexture } from './faces.js';
import { worldMapped } from './textures.js';

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
let skinMat = null;
const headMat = () => skinMat || (skinMat = new THREE.MeshLambertMaterial({ color: 0xf0c9a2 }));
const faceMats = new Map();
function faceMat(face) {
  const key = JSON.stringify(face);
  // 이목구비는 조명을 받지 않게(MeshBasic) 해서 역광에서도 또렷하게 보인다
  if (!faceMats.has(key)) faceMats.set(key, new THREE.MeshBasicMaterial({ map: faceTexture(face), transparent: true, alphaTest: 0.1, depthWrite: false }));
  return faceMats.get(key);
}

// 조선 모자 부품 [모양, 색, x, y(몸 기준 높이), z]. 머리 반지름 0.32, 머리 중심 높이 2.02.
// 2026-10-26: 모자 아래 끝(챙)은 눈썹(약 2.18)보다 위에 둔다. 넓은 챙은 탐험 카메라(27도 위)에서도 눈썹이 보이게 더 올린다(tests/faces.test.js).
const HAIR = () => [new THREE.SphereGeometry(0.33, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.4), 0x1e1c1a, 0, 2.04, -0.01];
const JOSEON_HATS = {
  // 갓: 넓은 챙과 높은 원통 모자 (양반·학자)
  gat: () => [HAIR(),
    [new THREE.CylinderGeometry(0.6, 0.6, 0.025, 20), 0x1a1816, 0, 2.39, 0],
    [new THREE.CylinderGeometry(0.19, 0.23, 0.32, 14), 0x1a1816, 0, 2.55, 0]],
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
  short: () => [[new THREE.SphereGeometry(0.335, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.2), 0x1e1c1a, 0, 2.05, -0.01]],
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
  bun: () => [HAIR(), [new THREE.SphereGeometry(0.13, 8, 6), 0x1e1c1a, 0, 1.98, -0.32]],
  braid: () => [HAIR(), [new THREE.CylinderGeometry(0.06, 0.04, 0.55, 6), 0x1e1c1a, 0, 1.75, -0.3]],
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
    g.getWorldPosition(wp);
    const moved = u.last ? Math.hypot(wp.x - u.last.x, wp.z - u.last.z) / dt : 0;
    if (!u.last) u.last = new THREE.Vector3();
    u.last.copy(wp);
    animateWalk(g, !u.noWalk && g.visible && moved > 0.4, dt);
  }
}

// gear: 'spear'(창) · 'sword'(허리에 찬 칼) · 'bow'(등에 멘 활) · 없음. track: false면 걷기 자동 움직임에서 뺀다(플레이어)
let personCount = 0;
export function makePerson({ robe, hat, trim = 0x2b241c, face = {}, gear = null, outfit = null, hairColor = null }, { track = true } = {}) {
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
  part(new THREE.CylinderGeometry(0.38, 0.58, 1.25, 7), robe, 0, 1.12, 0, g);
  part(new THREE.CylinderGeometry(0.4, 0.4, 0.12, 7), trim, 0, 1.25, 0, g).name = 'belt'; // 허리띠
  part(new THREE.CylinderGeometry(0.585, 0.6, 0.08, 7), trim, 0, 0.53, 0, g).name = 'hem'; // 옷자락 끝단
  // 앞섶(깃): 가슴에서 엇갈리는 흰 깃 두 줄. 양복(suit)이면 흰 셔츠와 넥타이
  if (outfit === 'suit') {
    part(new THREE.BoxGeometry(0.3, 0.44, 0.05), 0xf2efe8, 0, 1.5, 0.36, g).rotation.x = -0.28;
    const tie = part(new THREE.BoxGeometry(0.09, 0.4, 0.05), 0x7a2a2a, 0, 1.47, 0.39, g); tie.rotation.x = -0.28; tie.name = 'tie';
  } else
  for (const [sx, rz] of [[-0.08, -0.5], [0.08, 0.5]]) {
    const c = part(new THREE.BoxGeometry(0.07, 0.42, 0.04), 0xece4d2, sx, 1.52, 0.37, g);
    c.rotation.set(-0.28, 0, rz); c.name = 'collar';
  }
  for (const sx of [-0.5, 0.5]) {
    const piv = new THREE.Group(); piv.position.set(sx, 1.65, 0); g.add(piv);
    part(new THREE.BoxGeometry(0.18, 0.72, 0.2), robe, 0, -0.34, 0, piv);
    part(new THREE.BoxGeometry(0.2, 0.08, 0.22), trim, 0, -0.66, 0, piv); // 소맷부리
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), headMat()); hand.position.set(0, -0.78, 0); hand.castShadow = true; hand.name = 'hand'; piv.add(hand);
    arms.push(piv);
  }
  // 머리 묶음: 둥근 머리 + 만화풍 얼굴 무늬 + 모자. 만화처럼 머리를 크게(1.3배) 그린다.
  const hg = new THREE.Group(); hg.name = 'headGroup';
  hg.position.set(0, HEAD_Y + 0.08, 0); hg.scale.setScalar(HEAD_SCALE); g.add(hg);
  const hp = (geo, color, x, y, z) => part(geo, color, x, y - HEAD_Y, z, hg); // y는 몸 기준 높이로 적는다
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), headMat());
  head.name = 'head'; head.castShadow = true; hg.add(head);
  const faceGeo = new THREE.SphereGeometry(0.326, 16, 12, Math.PI / 2 - 1.15, 2.3, 0.62, 1.45);
  const faceMesh = new THREE.Mesh(faceGeo, faceMat(face));
  faceMesh.name = 'face'; hg.add(faceMesh);
  // 얼굴 모양: 갸름한 얼굴(long)은 위아래로, 둥근 얼굴(round)은 옆으로 조금 늘린다
  if (face.shape === 'long') hg.scale.set(HEAD_SCALE * 0.92, HEAD_SCALE * 1.1, HEAD_SCALE * 0.96);
  else if (face.shape === 'round') hg.scale.set(HEAD_SCALE * 1.06, HEAD_SCALE * 0.98, HEAD_SCALE * 1.04);
  // 귀와 코
  const ears = new THREE.Group(); ears.name = 'ears'; hg.add(ears);
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), headMat()); e.scale.set(0.55, 1, 0.8); e.position.set(sx * 0.315, -0.02, -0.02); ears.add(e); }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 6), headMat()); nose.name = 'nose';
  nose.rotation.x = Math.PI / 2 + 0.25; nose.position.set(0, -0.02, 0.33); hg.add(nose);
  // 안경(둥근 검은 테)
  if (face.glasses === 'round') {
    const gl = new THREE.Group(); gl.name = 'glasses'; hg.add(gl);
    const frame = mat(0x1a1614, null, 'object');
    for (const sx of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 6, 16), frame); r.position.set(sx * 0.105, 0.015, 0.315); gl.add(r); }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.012), frame); bridge.position.set(0, 0.03, 0.33); gl.add(bridge);
  }
  // 머리카락 색(흰머리·희끗한 머리)
  const hc = hairColor ? new THREE.Color(hairColor).getHex() : 0x1e1c1a;
  if (hat === 'buzz') { // 아주 짧게 깎은 머리: 머리 모양을 따라 얇게
    const hz = new THREE.Group(); hz.name = 'hat:buzz'; hg.add(hz);
    part(new THREE.SphereGeometry(0.326, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2.3), hc, 0, 0.02, -0.012, hz, 'grain');
  } else if (hat === 'swept') { // 뒤로 빗어 넘긴 머리
    const hz = new THREE.Group(); hz.name = 'hat:swept'; hg.add(hz);
    part(new THREE.SphereGeometry(0.338, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2.1), hc, 0, 0.03, -0.02, hz, 'grain');
    part(new THREE.SphereGeometry(0.2, 10, 6), hc, 0, 0.2, -0.16, hz, 'grain');
  }
  if (hat === 'official') {
    hp(new THREE.BoxGeometry(0.5, 0.32, 0.46), 0x1e1c1a, 0, 2.38, -0.02);
    hp(new THREE.BoxGeometry(1.2, 0.05, 0.07), 0x1e1c1a, 0, 2.38, -0.26);
  } else if (hat === 'helmet') {
    hp(new THREE.ConeGeometry(0.38, 0.5, 7), 0x5d5a55, 0, 2.42, 0).rotation.x = -0.3; // 뒤로 젖혀 써서 앞 끝이 눈썹보다 위(얼굴이 보이게)
    hp(new THREE.SphereGeometry(0.09, 5, 4), 0xb8452f, 0, 2.71, -0.09);
  } else if (hat === 'general') {
    hp(new THREE.ConeGeometry(0.4, 0.55, 8), 0x8a8478, 0, 2.45, 0).rotation.x = -0.3;
    hp(new THREE.SphereGeometry(0.11, 6, 5), 0xb8452f, 0, 2.77, -0.1);
    for (const sx of [-0.48, 0.48]) part(new THREE.BoxGeometry(0.34, 0.14, 0.46), 0x8a8478, sx, 1.72, 0, g);
    part(new THREE.BoxGeometry(0.62, 0.5, 0.5), 0x8a8478, 0, 1.45, 0, g);
  } else if (hat === 'fur') {
    hp(new THREE.CylinderGeometry(0.4, 0.36, 0.34, 8), 0x5a4130, 0, 2.38, 0);
  } else if (hat === 'topknot') {   // 맨머리에 상투
    hp(new THREE.SphereGeometry(0.33, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.4), 0x1e1c1a, 0, 2.04, -0.01);
    hp(new THREE.SphereGeometry(0.1, 8, 6), 0x1e1c1a, 0, 2.4, -0.02);
  } else if (JOSEON_HATS[hat]) {    // 조선 모자: 묶음 하나(hat:이름)로 만든다
    const hatG = new THREE.Group(); hatG.name = `hat:${hat}`; hg.add(hatG);
    for (const [geo, color, x, y, z] of JOSEON_HATS[hat]()) part(geo, hairColor && color === 0x1e1c1a ? hc : color, x, y - HEAD_Y, z, hatG, 'grain'); // 머리카락은 hairColor로
  }
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
  g.userData = { legs, arms, walk: 0, head: hg, ph: rnd * 20 };
  if (track) walkers.add(g);
  return g;
}

// 걸음 한 박자(ph)의 자세(D-9 고려 1장 물러나는 거란군 걸음을 모든 인물에, D-11): 다리를 앞뒤로 크게, 무릎이 있는 인물은
// 앞으로 내딛는 다리의 무릎을 굽히고, 팔은 다리와 반대로 흔든다. k(0~1)는 걸음 세기(멈출 때 줄어든다). 돌려주는 값은 들썩이는 높이.
// 새 메시는 만들지 않고 관절 몇 개만 돌린다(무릎이 없는 인물은 무릎 없이).
export function gaitPose(person, ph, k = 1) {
  const u = person.userData, s = Math.sin(ph) * k, c = Math.cos(ph);
  u.legs[0].rotation.x = s * 0.75; u.legs[1].rotation.x = -s * 0.75;
  const k0 = u.legs[0].userData.knee, k1 = u.legs[1].userData.knee;
  if (k0) k0.rotation.x = (0.1 + Math.max(0, -c) * 1.1) * k;
  if (k1) k1.rotation.x = (0.1 + Math.max(0, c) * 1.1) * k;
  if (u.carry) carryPose(person, ph, k); // 물건을 들었으면 팔은 물건을 받치고, 물건과 함께 살짝 흔들린다(D-18)
  else if (u.arms) { u.arms[0].rotation.x = -s * 0.65; u.arms[1].rotation.x = s * 0.65; }
  return Math.abs(c) * 0.08 * k;
}

// 물건 들기(D-18, 모든 장 공통): 든 물건을 몸에 붙이고 팔이 받치는 자세가 된다. style:
//   'arms'(두 팔로 가슴 앞에 안기: 꾸러미·판) · 'side'(굽힌 오른팔 위에 얹어 옆구리에 끼기: 두루마리) · 'shoulder'(오른손으로 어깨에 멘 것을 잡기: 쇠가죽 묶음)
// at: 물건 자리(몸 기준), arms: [왼팔, 오른팔]의 [앞뒤, 안팎] 각도(null이면 걸을 때 흔드는 팔)
const CARRY = {
  arms: { at: [0, 1.22, 0.6], arms: [[-1.0, 0.33], [-1.0, -0.33]] },
  side: { at: [0.56, 1.42, 0.45], arms: [null, [-1.1, 0.05]] },
  shoulder: { at: [0.48, 2.0, -0.08], arms: [null, [-2.9, -0.15]] },
};
export function carryPose(person, ph = 0, k = 0) {
  const u = person.userData, c = u.carry; if (!c || !u.arms) return;
  const P = CARRY[c.style] || CARRY.arms, sway = Math.sin(ph * 2) * 0.04 * k;
  P.arms.forEach((a, i) => {
    if (a) u.arms[i].rotation.set(a[0] + sway, 0, a[1]);
    else u.arms[i].rotation.set(-Math.sin(ph) * k * 0.65 * (i ? -1 : 1), 0, 0); // 빈 팔은 걸음에 맞춰 흔든다
  });
  c.obj.position.set(P.at[0], P.at[1] + Math.abs(Math.cos(ph)) * 0.035 * k, P.at[2]);
  c.obj.rotation.z = c.rz + Math.sin(ph) * 0.05 * k;
}
// 물건을 든다(obj) / 내려놓는다(null). 들던 것이 있으면 먼저 내려놓는다. 물건은 사람의 자식이 되어 함께 움직인다
export function setCarry(person, obj, style = 'arms') {
  const u = person.userData, prev = u.carry;
  if (prev && prev.obj !== obj && prev.obj.parent === person) person.remove(prev.obj);
  if (!obj) {
    u.carry = null;
    if (u.arms) for (const a of u.arms) a.rotation.set(0, 0, 0);
    return;
  }
  person.add(obj);
  u.carry = { obj, style, rz: prev && prev.obj === obj ? prev.rz : obj.rotation.z };
  carryPose(person);
}
// 네 다리 짐승(말)의 걸음: 대각선 짝(앞왼·뒤오른 / 앞오른·뒤왼)이 번갈아 나가고 머리를 걸음에 맞춰 끄덕인다. 들썩이는 높이를 돌려준다
export function horseGait(horse, ph) {
  const s = Math.sin(ph) * 0.6;
  horse.userData.legs.forEach((l, j) => { l.rotation.x = j === 0 || j === 3 ? s : -s; });
  if (horse.userData.head) horse.userData.head.rotation.x = Math.sin(ph * 2) * 0.08;
  return Math.abs(Math.cos(ph)) * 0.05;
}

// 걷기: gaitPose로 걷는다. 사람마다 박자(ph)와 빠르기가 조금씩 달라 줄지어 걸어도 똑같이 움직이지 않는다.
// 멈추면 걸음 세기가 부드럽게 줄어 제자리로 돌아온다. 들썩임은 높이에 더했다 빼는 방식이라 장이 높이를 정해도(둑·성벽 위) 쌓이지 않는다.
export function animateWalk(person, moving, dt) {
  const u = person.userData;
  if (!u.legs) return;
  u.t = (u.t || 0) + dt;
  const was = u.stride || 0;
  u.stride = was + ((moving ? 1 : 0) - was) * Math.min(1, dt * 8);
  if (u.stride < 0.002 && !moving) u.stride = 0;
  if (moving || u.stride > 0) u.walk += dt * 7.5 * (0.92 + ((u.ph * 7.3) % 1) * 0.16);
  const ph = u.walk + u.ph;
  const working = !moving && u.work;
  // 들썩임: 지난 프레임에 더한 값을 빼고 새 값을 더한다(그 사이 장이 높이를 새로 정했으면 그 높이를 바탕으로)
  const p = person.position, base = u.bobY !== undefined && p.y === u.bobY ? p.y - (u.bob || 0) : p.y;
  if (u.stride > 0) {
    if (working) u.bob = 0; // 일하는 동작은 아래에서 따로 움직인다(걸음이 막 끝난 참이면 다리·팔은 그쪽으로 천천히 돌아간다)
    else u.bob = gaitPose(person, ph, u.stride);
  } else u.bob = 0;
  p.y = base + u.bob; u.bobY = p.y;
  const ease = (o, v) => { o.rotation.x += (v - o.rotation.x) * 0.3; };
  if (working) { // 일하는 동작: 망치질(오른팔을 들었다 내리기), 나르기(두 팔을 앞으로 모아 들기), 쓸기(두 팔을 함께 흔들기)
    ease(u.legs[0], 0); ease(u.legs[1], 0);
    const w = u.t * (u.work === 'hammer' ? 5 : 2.2) + u.ph;
    if (u.work === 'hammer') { ease(u.arms[1], -1.6 + Math.max(0, Math.sin(w)) * 1.4); ease(u.arms[0], -0.3); }
    else if (u.work === 'carry') { ease(u.arms[0], -1.1); ease(u.arms[1], -1.1); }
    else { const s = Math.sin(w) * 0.45; ease(u.arms[0], -0.6 + s); ease(u.arms[1], -0.6 + s); }
  }
  if (u.head) { // 서 있을 때는 천천히 두리번거리고(걸을 때는 앞을 본다)
    const look = moving ? 0 : Math.sin(u.t * 0.45 + u.ph) * 0.35 * Math.max(0, Math.sin(u.t * 0.21 + u.ph * 2));
    u.head.rotation.y += (look - u.head.rotation.y) * Math.min(1, dt * 3);
  }
}
// 일하는 사람으로 정한다: 'hammer'(망치질) 'carry'(짐 들기) 'sweep'(쓸기·노 젓기). 장면 굳히기(core/bake.js)에서 빠져 계속 움직인다.
export function setWork(person, kind) { person.userData.work = kind; return person; }

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
