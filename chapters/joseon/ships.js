// 조선편 4장 배 모형: 판옥선·거북선·일본 배. 상자 몇 개 대신 배의 생김새(평평한 뱃머리, 노, 포를 쏘는 구멍, 2층 갑판과 장대, 돛대)를 갖춘다.
// 크기는 예전 모형과 같다(폭 약 3, 길이 약 7, 뱃머리는 −z). 조각은 재질별로 합쳐 그린다(buildings.js의 bakeStatic).
import * as THREE from 'three';
import { mat } from '../../core/people.js';
import { bakeStatic, curvedHipRoof } from '../kit/buildings.js';

const HULL = 0x4e3826, PLANK = 0x6b4a32, UPPER = 0x7a5a3c, DARK = 0x2b241c;
function add(g, geo, color, x, y, z, rx = 0, ry = 0, rz = 0, kind = 'wood') {
  const m = new THREE.Mesh(geo, mat(color, kind));
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

// 바닥이 평평한 조선 배의 몸통: 바닥판, 양 뱃전(살짝 벌어짐), 뒤로 비스듬한 평평한 뱃머리판과 고물판
function koreanHull(g) {
  add(g, box(2.4, 0.5, 5.6), HULL, 0, 0.05, 0);
  for (const s of [-1, 1]) add(g, box(0.22, 1.1, 6.6), HULL, s * 1.42, 0.55, 0, 0, 0, s * -0.14);
  add(g, box(2.9, 1.2, 0.22), HULL, 0, 0.65, -3.3, 0.5);   // 뱃머리(이물): 평평한 판이 비스듬히
  add(g, box(2.7, 1.1, 0.22), HULL, 0, 0.65, 3.3, -0.4);   // 고물
  for (const s of [-1, 1]) add(g, box(0.1, 0.12, 6.4), DARK, s * 1.56, 0.95, 0);   // 뱃전 띠
}

// 노(D-30 I-01): 배 조각을 합친(bakeStatic) 뒤에 단다. 노마다 뱃전에 박힌 받침(pivot)이 있어 그 점을 중심으로
// 앞뒤로 젓고(y) 물에 담갔다 든다(z). 노 끝(날)은 userData.tip(받침 기준 자리).
const OAR_LEN = 2.8;
function addOars(g, n) {
  const m = mat(PLANK, 'wood');
  const shaft = box(OAR_LEN, 0.08, 0.08), blade = box(0.6, 0.04, 0.3);
  g.userData.oars = [];
  for (let i = 0; i < n; i++) for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 1.5, 0.95, -2.2 + i * (4.4 / Math.max(1, n - 1)));
    pivot.rotation.order = 'YZX'; // 먼저 기울이고(물에 담금), 그다음 앞뒤로 돈다(젓기)
    const a = new THREE.Mesh(shaft, m); a.position.x = s * OAR_LEN / 2; a.castShadow = true;
    const b = new THREE.Mesh(blade, m); b.position.x = s * (OAR_LEN - 0.3); b.castShadow = true;
    pivot.add(a, b);
    pivot.userData.oar = s; pivot.userData.tip = [s * (OAR_LEN - 0.2), 0, 0];
    g.add(pivot); g.userData.oars.push(pivot);
  }
  rowShip(g, 0, 0);
}

// 판옥선: 평평한 몸통 위 판옥(위층 갑판)과 포를 쏘는 구멍, 여장(난간), 장대(지휘하는 누각), 돛대 둘과 깃발
export function panokseon() {
  const g = new THREE.Group();
  koreanHull(g);
  add(g, box(3.0, 0.1, 6.2), PLANK, 0, 1.1, 0);
  add(g, box(3.3, 0.95, 5.3), UPPER, 0, 1.62, 0.15);
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) add(g, box(0.05, 0.26, 0.32), DARK, s * 1.66, 1.65, -1.8 + i * 0.95, 0, 0, 0, 'grain'); // 포혈
  add(g, box(3.6, 0.12, 5.7), PLANK, 0, 2.15, 0.15);
  for (const s of [-1, 1]) for (let i = 0; i < 9; i++) add(g, box(0.12, 0.38, 0.45), UPPER, s * 1.74, 2.4, -2.4 + i * 0.64); // 여장
  for (const z of [-2.75, 3.05]) for (let i = 0; i < 5; i++) add(g, box(0.45, 0.38, 0.12), UPPER, -1.4 + i * 0.7, 2.4, z);
  // 장대: 고물 쪽 네 기둥 누각
  for (const [x, z] of [[-0.6, 1.2], [0.6, 1.2], [-0.6, 2.4], [0.6, 2.4]]) add(g, new THREE.CylinderGeometry(0.06, 0.06, 1.1, 6), 0x8a2f24, x, 2.75, z, 0, 0, 0, 'grain');
  curvedHipRoof(g, 1.9, 1.8, 0.55, 0x3d4846, 0, 3.3, 1.8);
  // 돛대 둘(돛은 접어 둠)과 깃발
  for (const [z, h] of [[-1.2, 4.6], [0.3, 4.0]]) {
    add(g, new THREE.CylinderGeometry(0.07, 0.09, h, 6), 0x5a3f2a, 0, 2.2 + h / 2, z);
    add(g, new THREE.CylinderGeometry(0.16, 0.16, 1.9, 8), 0xd8cdb0, 0, 2.2 + h * 0.8, z, 0, 0, Math.PI / 2, 'cloth');
  }
  bakeStatic(g);
  addOars(g, 6);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.4).translate(0.55, 0, 0), new THREE.MeshLambertMaterial({ color: 0xb8452f, side: THREE.DoubleSide }));
  flag.position.set(0, 7.2, -1.2); g.add(flag);
  return g;
}

// 거북선: 판옥선 몸통 위를 등딱지 덮개(개판)로 덮고 송곳을 꽂았다. 앞에 용머리, 옆에 포를 쏘는 구멍과 노.
export function geobukseon() {
  const g = new THREE.Group();
  koreanHull(g);
  add(g, box(3.1, 0.75, 6.0), UPPER, 0, 1.45, 0.1);
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) add(g, box(0.05, 0.24, 0.3), DARK, s * 1.56, 1.5, -2.2 + i * 0.85, 0, 0, 0, 'grain');
  const shell = add(g, new THREE.SphereGeometry(1.7, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0x4a5a48, 0, 1.8, 0.2, 0, 0, 0, 'tile');
  shell.scale.set(1.0, 0.62, 1.95);
  // 등딱지 위 송곳(쇠못)
  for (let row = 0; row < 4; row++) for (let i = 0; i < 9; i++) {
    const z = -2.8 + i * 0.7, x = (row - 1.5) * 0.55;
    const k = 1 - (x / 1.7) ** 2 - ((z - 0.2) / 3.3) ** 2;
    if (k <= 0.05) continue;
    add(g, new THREE.ConeGeometry(0.05, 0.28, 4), 0xc9ccd0, x, 1.8 + Math.sqrt(k) * 1.05 + 0.08, z, 0, 0, 0, 'grain').castShadow = false;
  }
  // 용머리: 목, 머리, 벌린 입, 뿔, 눈
  add(g, box(0.6, 0.6, 1.1), 0x6b5a3a, 0, 1.75, -3.6, -0.5);
  add(g, box(0.85, 0.7, 0.85), 0x8a6a3a, 0, 2.25, -4.2);
  add(g, box(0.7, 0.16, 0.6), 0x5a2a20, 0, 1.95, -4.6, 0.25);
  for (const s of [-1, 1]) {
    add(g, new THREE.ConeGeometry(0.07, 0.4, 5), 0xd8cdb0, s * 0.25, 2.75, -4.05, -0.4, 0, s * 0.3, 'grain');
    add(g, new THREE.SphereGeometry(0.08, 6, 5), 0xd9a441, s * 0.3, 2.4, -4.6, 0, 0, 0, 'grain');
  }
  add(g, new THREE.SphereGeometry(0.12, 6, 4), 0xb8452f, 0, 2.05, -4.66, 0, 0, 0, 'grain');
  bakeStatic(g);
  addOars(g, 7);
  return g;
}

// 일본 배(안택선 모양): 높은 뱃전, 갑판 위 누각, 네모 돛 하나(무늬 없이). 공격을 받으면 연기(불길은 j4 장면이 붙인다)
export function japaneseShip() {
  const g = new THREE.Group();
  add(g, box(2.4, 1.5, 6.0), 0x3a2c20, 0, 0.45, 0);
  add(g, box(1.6, 1.2, 0.3), 0x3a2c20, 0, 0.9, -3.15, 0.6);       // 뾰족이 솟은 이물
  for (const s of [-1, 1]) add(g, box(0.14, 0.7, 6.0), 0x5d4330, s * 1.22, 1.45, 0);  // 높은 뱃전 방패판
  add(g, box(2.2, 1.2, 2.4), 0x5d4330, 0, 1.9, 1.5);                 // 누각
  add(g, box(2.5, 0.12, 2.7), 0x2b241c, 0, 2.55, 1.5);
  add(g, new THREE.CylinderGeometry(0.07, 0.07, 4.2, 5), DARK, 0, 3.0, -0.6);
  add(g, box(2.9, 0.08, 0.08), DARK, 0, 4.55, -0.6);
  bakeStatic(g);
  const sail = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 2.6), new THREE.MeshLambertMaterial({ color: 0xe6dcc3, side: THREE.DoubleSide }));
  sail.position.set(0, 3.25, -0.6); g.add(sail);
  const smoke = new THREE.Group(); smoke.visible = false; g.add(smoke);
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.6 + i * 0.15, 8, 6), new THREE.MeshLambertMaterial({ color: 0x8a8a88, transparent: true, opacity: 0.55 }));
    p.position.set((i % 2) * 0.4 - 0.2, 2.4 + i * 0.8, 0.5 - i * 0.2); smoke.add(p);
  }
  g.userData.smoke = smoke;
  return g;
}

// 판옥선 그림(옆모습, SVG): 학익진 자리 놓기 판에 쓴다
export const PANOK_ICON = '<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4 30 L60 30 L54 40 L10 40 Z" fill="#4e3826"/><rect x="10" y="22" width="44" height="8" fill="#7a5a3c"/><g fill="#2b241c"><rect x="15" y="24" width="4" height="3"/><rect x="24" y="24" width="4" height="3"/><rect x="33" y="24" width="4" height="3"/><rect x="42" y="24" width="4" height="3"/></g><path d="M8 22 H56" stroke="#6b4a32" stroke-width="2"/><g fill="#7a5a3c"><rect x="9" y="18" width="3" height="4"/><rect x="17" y="18" width="3" height="4"/><rect x="25" y="18" width="3" height="4"/><rect x="33" y="18" width="3" height="4"/><rect x="41" y="18" width="3" height="4"/><rect x="49" y="18" width="3" height="4"/></g><path d="M38 12 L50 12 L52 15 L36 15 Z" fill="#3d4846"/><path d="M40 15 V20 M48 15 V20" stroke="#8a2f24" stroke-width="1.5"/><path d="M24 4 V20" stroke="#5a3f2a" stroke-width="2"/><path d="M24 4 L34 7 L24 10 Z" fill="#b8452f"/></svg>';

// 노 젓기(D-25, D-30 I-01): 모든 노가 같은 박자(ph)로 젓는다. 노 날이 물에 잠긴 채 뒤(고물 쪽)로 당기고,
// 물 위로 들어 올린 채 앞으로 돌아온다. k는 세기(0이면 노를 물 위로 든 채 쉰다). 학생 배·함대가 멈추면 k가 천천히 0이 된다.
export function rowShip(ship, ph, k = 1) {
  const sweep = Math.sin(ph) * 0.42 * k, dip = 0.3 + k * (0.13 - Math.cos(ph) * 0.15); // cos<0(당기는 때)일 때 깊이 담근다
  for (const o of ship.userData.oars || []) {
    const sd = o.userData.oar;
    o.rotation.y = sd * sweep;
    o.rotation.z = -sd * dip;
  }
}
