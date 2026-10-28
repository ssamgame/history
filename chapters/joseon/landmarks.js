// 조선편 유물·유적 모형: 실제 모양을 본떠 조금 더 자세히 만든다(로우폴리 안에서).
// 모두 (0,0,0)에 놓인 묶음(Group)을 돌려준다. 앞면은 +z.
import * as THREE from 'three';
import { mat } from '../../core/people.js';
import { curvedHipRoof } from '../kit/buildings.js';

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
function add(g, geo, color, x, y, z, kind = null, cast = true) {
  const m = new THREE.Mesh(geo, mat(color, kind));
  m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; g.add(m); return m;
}
// 우진각(사방으로 내려오는) 지붕
export function hipRoof(g, w, d, h, color, x, y, z) { return curvedHipRoof(g, w, d, h, color, x, y, z); }
// 맞배(앞뒤 두 면) 지붕: 세모 기둥을 옆으로 눕힌 모양
export function gableRoof(g, len, d, h, color, x, y, z) {
  const geo = new THREE.CylinderGeometry(1, 1, 1, 3); geo.rotateZ(Math.PI / 2); geo.rotateX(-Math.PI / 2); // 꼭짓점이 위로
  const r = add(g, geo, color, x, y + h * 0.5 / 1.5, z); r.scale.set(len, h / 1.5, d / 1.732); return r;
}
// 돌난간: 기둥과 가로대
function railing(g, x0, x1, z, y, color = 0xd6d0c2) {
  for (let x = x0; x <= x1 + 0.01; x += 1.2) add(g, box(0.16, 0.6, 0.16), color, x, y + 0.3, z, 'stone');
  add(g, box(x1 - x0, 0.1, 0.12), color, (x0 + x1) / 2, y + 0.5, z, 'stone');
}

// 앙부일구 시각 칸: 서쪽(묘시)에서 북쪽(오시)을 지나 동쪽(유시)까지 ANGBU_HOURS 칸. hourAngle(k)는 칸 가운데의 방위각(atan2(x, z), 북쪽 = π)
export const ANGBU_HOURS = 7;
export const ANGBU_STEP = Math.PI / 7.5;
export const hourAngle = k => Math.PI + (3 - k) * ANGBU_STEP;
// 그릇 안쪽 면 위의 점(그릇 묶음 좌표): 방위각 a, 테두리에서 아래로 e(라디안)
export function bowlPoint(a, e) { const r = 0.78; return new THREE.Vector3(Math.sin(a) * r * Math.cos(e), 2.25 - r * Math.sin(e), Math.cos(a) * r * Math.cos(e)); }

// 앙부일구: 두 단 돌받침 위, 십자 받침과 네 다리가 받치는 가마솥 모양 청동 그릇. 안쪽에 시각선과 절기선, 남쪽에서 북쪽으로 뻗은 그림자 바늘.
export function angbuilgu() {
  const g = new THREE.Group();
  add(g, box(2.2, 0.35, 2.2), 0xb3ab99, 0, 0.18, 0, 'stone');
  add(g, box(1.5, 0.9, 1.5), 0xb3ab99, 0, 0.8, 0, 'stone');
  const bronze = 0x7a5a2e;
  for (const a of [0, Math.PI / 2]) { const c = add(g, box(1.5, 0.12, 0.16), bronze, 0, 1.31, 0); c.rotation.y = a; } // 십자 받침(물길)
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    const leg = add(g, new THREE.CylinderGeometry(0.05, 0.08, 0.5, 6), bronze, Math.cos(a) * 0.64, 1.52, Math.sin(a) * 0.64);
    leg.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
    add(g, new THREE.SphereGeometry(0.1, 8, 6), bronze, Math.cos(a) * 0.68, 1.33, Math.sin(a) * 0.68); // 다리 끝(용 발 모양을 줄여 표현)
  }
  // 그릇: 안쪽 면에 시각선(세로)과 절기선(가로)을 그린 무늬. 시각선은 북쪽 반(묘시~유시, ANGBU_HOURS 칸)에만 긋는다(D-30 S-01)
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
  const c = cv.getContext('2d');
  c.fillStyle = '#b48a46'; c.fillRect(0, 0, 512, 128);
  const ux = a => ((((a + Math.PI / 2) / (Math.PI * 2)) % 1) + 1) % 1 * 512; // 방위각 a(atan2(x, z)) → 무늬의 가로 자리(SphereGeometry의 u)
  const a0 = hourAngle(0) + ANGBU_STEP / 2, a1 = hourAngle(ANGBU_HOURS - 1) - ANGBU_STEP / 2;
  c.strokeStyle = '#4a3418'; c.lineWidth = 2;
  for (let j = 1; j < 13; j++) { // 절기선(가로): 시각선이 있는 쪽에만
    c.beginPath(); c.moveTo(ux(a1), 14 + j * 7); c.lineTo(ux(a0), 14 + j * 7); c.stroke();
  }
  c.lineWidth = 3;
  for (let k = 0; k <= ANGBU_HOURS; k++) { const x = ux(a0 - k * ANGBU_STEP); c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 118); c.stroke(); } // 시각 칸 경계
  c.strokeStyle = 'rgba(74,52,24,0.55)'; c.lineWidth = 1.5;
  for (let k = 0; k < ANGBU_HOURS; k++) { const x = ux(hourAngle(k)); c.beginPath(); c.moveTo(x, 6); c.lineTo(x, 110); c.stroke(); } // 칸 가운데 잔줄
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const inner = new THREE.Mesh(new THREE.SphereGeometry(0.78, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshLambertMaterial({ map: tex, side: THREE.BackSide }));
  inner.position.y = 2.25; g.add(inner);
  const outer = new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(bronze, 'grain'));
  outer.position.y = 2.25; outer.castShadow = true; g.add(outer);
  const rim = add(g, new THREE.TorusGeometry(0.8, 0.05, 6, 32), 0x9a7638, 0, 2.25, 0); rim.rotation.x = Math.PI / 2;
  const gnomon = add(g, new THREE.CylinderGeometry(0.02, 0.02, 1.0, 5), 0x3a2c18, 0, 2.1, 0.25); gnomon.rotation.x = -0.65; // 남(+z)에서 북으로
  return g;
}

// 자격루: 돌 단 위에 크기가 다른 물그릇 셋(파수호)을 계단처럼, 긴 물통 둘(수수호), 그 옆 나무 상자 위에 시각을 알리는 인형 셋과 종·북·징.
export function jagyeongnu() {
  const g = new THREE.Group();
  const bronze = 0x6b5530;
  for (let i = 0; i < 3; i++) {
    const h = 2.4 - i * 0.7;
    add(g, box(1.5, h, 1.5), 0xb3ada2, -3 + i * 1.5, h / 2, 0, 'stone');
    const r = 0.62 - i * 0.12;
    const pot = add(g, new THREE.CylinderGeometry(r, r * 0.75, r * 1.2, 16), bronze, -3 + i * 1.5, h + r * 0.6, 0);
    add(g, new THREE.TorusGeometry(r, 0.04, 6, 20), 0x9a7638, -3 + i * 1.5, h + r * 1.2, 0).rotation.x = Math.PI / 2;
    pot.name = `파수호${i + 1}`;
  }
  for (const dz of [-0.4, 0.4]) {
    add(g, new THREE.CylinderGeometry(0.28, 0.28, 2.6, 14), bronze, 1.3, 1.3, dz);
    for (const y of [0.5, 1.3, 2.1]) add(g, new THREE.TorusGeometry(0.29, 0.03, 6, 16), 0x9a7638, 1.3, y, dz).rotation.x = Math.PI / 2;
  }
  // 시각을 알리는 장치: 3단 나무 상자, 위에 인형 셋
  add(g, box(2, 2.8, 1.4), 0x8a5a3a, 3.4, 1.4, 0, 'wood');
  for (let k = 0; k < 3; k++) add(g, box(1.9, 0.06, 1.42), 0x3a2c20, 3.4, 0.9 + k * 0.9, 0.0, 'wood');
  const puppets = [];
  for (let k = 0; k < 3; k++) {
    const p = new THREE.Group(); p.position.set(2.75 + k * 0.65, 2.8, 0.2); g.add(p);
    add(p, box(0.26, 0.5, 0.22), [0x2f6b5e, 0xa8392b, 0x2c4a7a][k], 0, 0.25, 0, 'cloth');
    add(p, new THREE.SphereGeometry(0.13, 8, 6), 0xf0c9a2, 0, 0.62, 0);
    puppets.push(p);
  }
  add(g, new THREE.CylinderGeometry(0.2, 0.28, 0.42, 12), 0x8a6a3a, 2.75, 3.6, -0.3);               // 종
  add(g, new THREE.CylinderGeometry(0.3, 0.3, 0.3, 14), 0xa8392b, 3.4, 3.6, -0.3).rotation.x = Math.PI / 2; // 북
  add(g, new THREE.CylinderGeometry(0.28, 0.28, 0.05, 16), 0x9a7638, 4.05, 3.6, -0.3).rotation.x = Math.PI / 2; // 징
  // 물이 차면 떠오르는 잣대(물통마다 하나, 처음엔 물통 안에 잠겨 있다), 구슬이 굴러 내려가는 비탈 홈, 구슬(D-30 S-03 장면)
  const rods = [-0.4, 0.4].map(dz => { const r = add(g, new THREE.CylinderGeometry(0.035, 0.035, 1.2, 6), 0xd8c9a0, 1.3, 2.0, dz); r.userData.y0 = 2.0; return r; });
  add(g, box(0.55, 0.16, 0.3), 0x3a2c20, 1.3, 2.69, 0, 'wood'); // 두 물통 위를 잇는 나무 판(잣대가 밀어 올린다)
  const chute = { from: new THREE.Vector3(1.6, 2.86, 0.18), to: new THREE.Vector3(2.45, 2.35, 0.18) };
  const ch = add(g, box(chute.from.distanceTo(chute.to) + 0.2, 0.05, 0.22), 0x6b4a32, (chute.from.x + chute.to.x) / 2, (chute.from.y + chute.to.y) / 2 - 0.13, 0.18, 'wood');
  ch.rotation.z = Math.atan2(chute.to.y - chute.from.y, chute.to.x - chute.from.x);
  const ball = add(g, new THREE.SphereGeometry(0.11, 12, 8), 0x4a4a48, chute.from.x, chute.from.y, chute.from.z);
  add(g, box(1.1, 0.12, 0.16), bronze, 0.75, 0.25, 0); // 아래 물그릇에서 물통으로 물이 드는 관
  g.userData.puppets = puppets; g.userData.rods = rods; g.userData.ball = ball; g.userData.chute = chute;
  return g;
}

// 측우대와 측우기: 다듬은 화강암 받침 위에 마디가 셋인 쇠 원통
export function cheugugi() {
  const g = new THREE.Group();
  add(g, box(1.1, 0.9, 1.1), 0xc8c2b6, 0, 0.45, 0, 'stone');
  add(g, box(0.95, 0.08, 0.95), 0xd6d0c4, 0, 0.94, 0, 'stone');
  for (let k = 0; k < 3; k++) {
    add(g, new THREE.CylinderGeometry(0.2, 0.2, 0.22, 16), 0x4a4a48, 0, 1.1 + k * 0.24, 0);
    add(g, new THREE.TorusGeometry(0.205, 0.025, 6, 16), 0x6a6a66, 0, 1.0 + k * 0.24, 0).rotation.x = Math.PI / 2;
  }
  add(g, new THREE.TorusGeometry(0.2, 0.025, 6, 16), 0x6a6a66, 0, 1.72, 0).rotation.x = Math.PI / 2;
  return g;
}

// 종묘 정전: 넓은 돌 월대 위의 아주 긴 건물(칸마다 신위를 모셔 옆으로 길다), 붉은 기둥과 맞배지붕, 앞 가운데 돌길
export function jongmyo(bays = 13) {
  const g = new THREE.Group();
  const bw = 2, len = bays * bw;
  add(g, box(len + 6, 0.7, 14), 0xa59c8a, 0, 0.35, 2, 'stone');           // 월대
  add(g, box(2.4, 0.08, 14), 0xb3ab99, 0, 0.74, 2, 'stone');               // 가운데 신로
  add(g, box(len + 2, 0.5, 5.6), 0xb3ada2, 0, 0.95, -3.4, 'stone');         // 기단
  add(g, box(len, 2.6, 3.6), 0x8a3a2a, 0, 2.5, -3.8, 'wood');               // 벽(붉은 판문)
  for (let i = 0; i <= bays; i++) add(g, new THREE.CylinderGeometry(0.17, 0.17, 2.8, 8), 0xa8392b, -len / 2 + i * bw, 2.6, -1.9);
  add(g, box(len + 0.4, 0.35, 4.6), 0x2f6b5e, 0, 4.1, -3.4);                 // 단청 창방
  gableRoof(g, len + 2.4, 7.2, 2.6, 0x3d4846, 0, 4.25, -3.4);
  for (const sx of [-1, 1]) add(g, box(3, 3.2, 5), 0xb3ada2, sx * (len / 2 + 1.6), 2.2, -3.4, 'stone'); // 양쪽 끝 월랑 벽
  return g;
}

// 근정전: 난간을 두른 두 단 월대 위의 2층(겹처마) 큰 전각
export function geunjeongjeon() {
  const g = new THREE.Group();
  add(g, box(22, 0.7, 14), 0xa59c8a, 0, 0.35, 0, 'stone');
  add(g, box(18, 0.7, 11), 0xb3ab99, 0, 1.05, -1, 'stone');
  railing(g, -11, 11, 7, 0.7); railing(g, -9, 9, 4.5, 1.4);
  for (let i = 0; i < 3; i++) add(g, box(3.4, 0.3, 0.9), 0xb3ab99, 0, 0.15 + i * 0.47, 7.8 - i * 1.2, 'stone'); // 가운데 계단
  add(g, box(14, 3.4, 6.4), 0xe6dcc3, 0, 3.1, -2);
  for (let dx = -7; dx <= 7.01; dx += 2.333) for (const dz of [-5.2, 1.2]) add(g, new THREE.CylinderGeometry(0.22, 0.22, 3.6, 8), 0xa8392b, dx, 3.2, dz);
  add(g, box(14.6, 0.4, 7), 0x2f6b5e, 0, 5.05, -2);
  hipRoof(g, 18, 10.5, 1.6, 0x3d4846, 0, 5.2, -2);                          // 아래 처마
  add(g, box(10, 1.6, 4.6), 0xa8392b, 0, 7.2, -2);                            // 위층 벽
  add(g, box(10.4, 0.3, 5), 0x2f6b5e, 0, 8.05, -2);
  hipRoof(g, 14, 8, 2.4, 0x3d4846, 0, 8.15, -2);                              // 위 처마
  return g;
}

// 화성 장안문: 무지개 문이 난 돌 성문, 2층 문루, 앞의 반달 모양 옹성과 여장
export function hwaseongGate() {
  const g = new THREE.Group();
  add(g, box(9, 5, 4), 0xc9c2b4, 0, 2.5, 0, 'stone');
  add(g, box(3, 3.4, 4.1), 0x2b241c, 0, 1.7, 0);
  const arch = add(g, new THREE.CylinderGeometry(1.5, 1.5, 4.12, 16, 1, false, 0, Math.PI), 0x2b241c, 0, 3.4, 0); arch.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  for (let dx = -3.6; dx <= 3.61; dx += 1.8) for (const dz of [-1.4, 1.4]) add(g, new THREE.CylinderGeometry(0.16, 0.16, 2.2, 8), 0xa8392b, dx, 6.1, dz);
  add(g, box(8, 1.6, 2.6), 0xe6dcc3, 0, 6, 0);
  hipRoof(g, 11, 6, 1.4, 0x3d4846, 0, 7.2, 0);
  add(g, box(6, 1.1, 2.2), 0xa8392b, 0, 9, 0);
  hipRoof(g, 8.5, 4.6, 1.8, 0x3d4846, 0, 9.5, 0);
  // 옹성: 문 앞(+z)을 둘러싼 반달 성벽과 여장
  for (let i = 2; i <= 10; i++) { // 동쪽(i 0~1)은 옹성 출입구로 비워 둔다
    const a = Math.PI * (i / 10), x = Math.cos(a) * 6, z = 2 + Math.sin(a) * 5;
    const s = add(g, box(2, 3.4, 1), 0xc9c2b4, x, 1.7, z, 'stone'); s.rotation.y = -a + Math.PI / 2;
    const c = add(g, box(0.9, 0.6, 0.9), 0x8c877e, x, 3.7, z, 'stone'); c.rotation.y = s.rotation.y;
  }
  return g;
}

// 사직단: 낮은 담으로 두른 마당에 흙을 쌓은 네모난 제단 둘(동쪽 사단·서쪽 직단), 앞의 홍살문
export function sajikdan() {
  const g = new THREE.Group();
  add(g, box(12, 0.15, 9), 0x9a8a6e, 0, 0.08, 0, 'stone');
  for (const [w, d, x, z] of [[12, 0.4, 0, -4.4], [12, 0.4, 0, 4.4], [0.4, 9, -5.9, 0], [0.4, 9, 5.9, 0]]) add(g, box(w, 0.9, d), 0xb3ab99, x, 0.45, z, 'stone');
  for (const x of [-2.4, 2.4]) {
    add(g, box(3.2, 0.5, 3.2), 0xc2baa8, x, 0.4, -0.5, 'stone');
    add(g, box(2.6, 0.35, 2.6), 0x8a6a48, x, 0.82, -0.5, 'earth');
    for (const [sx, sz] of [[0, 1.75], [0, -1.75], [1.75, 0], [-1.75, 0]]) add(g, box(sx ? 0.1 : 0.9, 0.3, sx ? 0.9 : 0.1), 0xd8d0bc, x + sx, 0.3, -0.5 + sz, 'stone');
  }
  for (const x of [-1.2, 1.2]) add(g, new THREE.CylinderGeometry(0.1, 0.1, 3, 8), 0xa8392b, x, 1.5, 4.4);
  add(g, box(2.8, 0.14, 0.14), 0xa8392b, 0, 2.9, 4.4);
  for (let i = 0; i < 7; i++) add(g, box(0.05, 0.9, 0.05), 0xa8392b, -1.05 + i * 0.35, 2.4, 4.4);
  return g;
}
