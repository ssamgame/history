// 장면 부품 상자: 근대·일제 강점기·현대편 장들이 '배치표(layout)'만 써서 장면을 만든다.
// layout = { ground, area, bounds, start, props: [{ type, x, z, ry, ... }], npcs: [{ id, look, x, z, ry }], signs: [{ id, title, x, z }], scatter: [...] }
import * as THREE from 'three';
import { mat, makePerson, setWork } from '../../core/people.js';
import { scatter } from '../../core/props.js';
import { makeSign, placeSign } from '../../core/signs.js';
import { LOOKS } from '../../content/characters.js';
import { createWeather } from '../../core/weather.js';
import * as LM from '../joseon/landmarks.js';
import * as BLD from './buildings.js';
import { terrainField, terrainMesh, mountainRing, skyline, hillColorFor } from './terrain.js';
const { hipRoof, gableRoof } = LM;

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
function add(g, geo, color, x, y, z, kind = null, cast = true) {
  const m = new THREE.Mesh(geo, mat(color, kind));
  m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; g.add(m); return m;
}

// 태극기 그림(흰 바탕, 가운데 태극, 네 귀퉁이의 괘)
let flagTex = null;
export function taegukgiTexture() {
  if (flagTex) return flagTex;
  const cv = document.createElement('canvas'); cv.width = 192; cv.height = 128;
  const c = cv.getContext('2d');
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, 192, 128);
  const cx = 96, cy = 64, r = 32;
  c.save(); c.translate(cx, cy); c.rotate(Math.atan2(2, 3));
  c.fillStyle = '#cd2e3a'; c.beginPath(); c.arc(0, 0, r, Math.PI, 0); c.fill();
  c.fillStyle = '#0047a0'; c.beginPath(); c.arc(0, 0, r, 0, Math.PI); c.fill();
  c.fillStyle = '#cd2e3a'; c.beginPath(); c.arc(-r / 2, 0, r / 2, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#0047a0'; c.beginPath(); c.arc(r / 2, 0, r / 2, 0, Math.PI * 2); c.fill();
  c.restore();
  // 괘: 건(좌상) 곤(우하) 감(우상) 리(좌하)
  const bars = (x, y, ang, pattern) => {
    c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = '#000';
    pattern.forEach((broken, k) => {
      const yy = -12 + k * 10;
      if (broken) { c.fillRect(-16, yy, 14, 6); c.fillRect(2, yy, 14, 6); } else c.fillRect(-16, yy, 32, 6);
    });
    c.restore();
  };
  const a = Math.atan2(2, 3);
  bars(40, 26, a - Math.PI / 2, [0, 0, 0]); bars(152, 102, a - Math.PI / 2, [1, 1, 1]);
  bars(152, 26, -a + Math.PI / 2, [1, 0, 1]); bars(40, 102, -a + Math.PI / 2, [0, 1, 0]);
  flagTex = new THREE.CanvasTexture(cv); flagTex.colorSpace = THREE.SRGBColorSpace;
  return flagTex;
}
export function flagMesh(w = 1.2, h = 0.8, color = null) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h).translate(w / 2, 0, 0),
    color == null ? new THREE.MeshLambertMaterial({ map: taegukgiTexture(), side: THREE.DoubleSide }) : new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }));
  m.castShadow = true; return m;
}

// 부품마다 만드는 법. 모두 (0,0,0) 기준, 앞은 +z.
export const BUILD = {
  // 초가집 / 기와집
  hanok(g, p) { BLD.hanok(g, p); return { rect: [4.4, 3.6] }; },
  // 벽돌로 지은 서양식 건물 (근대 건물·학교·관청). tower: 뾰족탑, dome: 둥근 지붕
  western(g, p) { BLD.western(g, p); return { rect: [p.w || 8, p.d || 5] }; },
  // 돌로 쌓은 무지개 문 (독립문 등). label: 앞에 새긴 글
  arch(g, p) { BLD.arch(g, p); return { rect: [5.2, 3.2] }; },
  // 도성 문(흥인지문 등): 가운데 넓은 문길은 열어 두고 양쪽 돌 몸채만 막는다. label: 현판 글
  gate(g, p) {
    BLD.cityGate(g, p);
    const { W, D, R } = BLD.GATE, pw = W / 2 - R - 0.2, wing = p.wing || 0;
    const parts = [-1, 1].map(sx => ({ dx: sx * (R + 0.2 + pw / 2), rect: [pw, D] }));
    if (wing) for (const sx of [-1, 1]) { // 양옆으로 이어진 성벽(돌아서 지나가지 못하게)
      const w = new THREE.Group(); w.position.x = sx * (W / 2 + wing / 2 - 0.2); BLD.wall(w, { w: wing, h: 4.2, color: 0xb3ab99 }); g.add(w);
      parts.push({ dx: w.position.x, rect: [wing, 1.2] });
    }
    return { parts };
  },
  // 깃대와 깃발 (color 없으면 태극기)
  flagpole(g, p) {
    add(g, new THREE.CylinderGeometry(0.06, 0.06, 4.4, 6), 0x5a3f2a, 0, 2.2, 0, 'wood');
    const f = flagMesh(1.4, 0.95, p.color ?? null); f.position.set(0, 3.8, 0); g.add(f); g.userData.flag = f;
    return 0.4;
  },
  // 사람들 무리. looks: 생김새 목록, n: 사람 수, flags: 태극기를 든 사람 비율(0~1), ry: 바라보는 방향
  crowd(g, p) {
    const looks = p.looks || ['commoner'], n = p.n || 10, cols = p.cols || 5;
    for (let i = 0; i < n; i++) {
      const lk = LOOKS[looks[i % looks.length]] || LOOKS.commoner;
      const person = makePerson(lk);
      // 바둑판처럼 줄 서지 않게: 줄마다 반 칸씩 엇갈리고, 저마다 조금씩 비켜 서서 서로 다른 쪽을 본다
      const j = n2 => { const v = Math.sin((i + 1) * n2 * 12.9898 + (p.x || 0) * 3.1) * 43758.5453; return v - Math.floor(v) - 0.5; };
      const row = Math.floor(i / cols);
      person.position.set((i % cols - (cols - 1) / 2) * 1.3 + (row % 2) * 0.6 + j(1) * 0.55, 0, row * 1.35 + j(2) * 0.5);
      person.rotation.y = (p.face || 0) + j(3) * 0.7;
      if (p.flags && (i * 7) % 10 < p.flags * 10) { const f = flagMesh(0.6, 0.4); f.position.set(0.5, 2.6, 0); person.add(f); add(person, new THREE.CylinderGeometry(0.02, 0.02, 1.2, 4), 0x5a3f2a, 0.5, 2.3, 0); }
      g.add(person);
    }
    return 0;
  },
  // 전차와 선로
  tram(g, p) {
    const len = p.track || 30;
    for (const dx of [-0.6, 0.6]) add(g, box(0.1, 0.06, len), 0x6b6862, dx, 0.03, 0, null, false);
    for (let z = -len / 2 + 0.5; z < len / 2; z += 1.2) add(g, box(1.7, 0.04, 0.22), 0x5a3f2a, 0, 0.02, z, 'wood', false); // 침목
    const car = new THREE.Group(); car.name = 'tramCar'; g.add(car);
    BLD.tramCar(car);
    g.userData.car = car;
    return 0;
  },
  // 전봇대 줄 (전신·전화·전기)
  poles(g, p) {
    const n = p.n || 4, gap = p.gap || 6;
    for (let i = 0; i < n; i++) {
      add(g, new THREE.CylinderGeometry(0.1, 0.13, 6, 6), 0x5a3f2a, i * gap, 3, 0, 'wood');
      add(g, box(1.4, 0.12, 0.12), 0x5a3f2a, i * gap, 5.6, 0, 'wood');
    }
    for (const dz of [-0.6, 0.6]) { const w = add(g, new THREE.CylinderGeometry(0.015, 0.015, (n - 1) * gap, 4), 0x1e1c1a, (n - 1) * gap / 2, 5.7, 0, null, false); w.rotation.z = Math.PI / 2; w.position.z = dz * 0.9; }
    return 0;
  },
  // 연단(만민 공동회·독립 선언)과 탁자
  stage(g) {
    add(g, box(5, 0.8, 3), 0x7a5a3c, 0, 0.4, 0, 'wood');
    add(g, box(1.2, 1, 0.6), 0x5e432c, 0, 1.3, 0.6, 'wood');
    return { rect: [5.2, 3.2] };
  },
  // 천막
  tent(g, p) { BLD.tent(g, p); return 1.6; },
  // 돌담·벽 (w 길이)
  wall(g, p) { BLD.wall(g, p); return 0; },
  // 쌀가마 더미
  rice(g, p) {
    for (let i = 0; i < (p.n || 9); i++) { const s = add(g, new THREE.CylinderGeometry(0.4, 0.4, 0.9, 10), 0xd8c08a, (i % 3) * 0.85 - 0.85, 0.4 + Math.floor(i / 9) * 0.8, Math.floor((i % 9) / 3) * 0.85 - 0.85); s.rotation.z = Math.PI / 2; }
    return 1.6;
  },
  // 증기선 (항구)
  steamship(g, p) { BLD.steamship(g, p); return 0; }, // old: 1860~70년대 돛대 셋 목조 증기 군함
  // 바다·강 (넓은 물판)
  water(g, p) { const m = new THREE.Mesh(new THREE.PlaneGeometry(p.w || 200, p.d || 60).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: p.color || 0x3f7d9a, shininess: 60, transparent: true, opacity: 0.93 })); m.position.y = -0.3; g.add(m); return 0; },
  // 섬·땅덩이(바다 무대): 모래톱 위에 풀. r 반지름
  island(g, p) {
    const r = p.r || 4;
    add(g, new THREE.CylinderGeometry(r, r * 1.1, 0.6, 20), p.sand || 0xcdbb8a, 0, 0.1, 0);
    add(g, new THREE.CylinderGeometry(r * 0.75, r * 0.9, 1.4, 16), p.color || 0x6a8a4c, 0, 0.6, 0);
    if (p.peak) add(g, new THREE.ConeGeometry(r * 0.8, p.peak, 9), p.color || 0x6a8a4c, 0, 1.2 + p.peak / 2, 0); // 산(예: 한양 터의 백악)
    return r;
  },
  // 조선편 유물 모형(자격루·앙부일구·측우기 등): name은 landmarks.js의 함수 이름, r 부딪힘 반지름
  landmark(g, p) { g.add(LM[p.name]()); return p.rect ? { rect: p.rect } : (p.r ?? 2); },
  // 우물: 돌로 쌓은 둥근 우물과 두레박 기둥
  well(g) {
    add(g, new THREE.CylinderGeometry(0.8, 0.85, 0.8, 14, 1, true), 0x8c8577, 0, 0.4, 0, 'stone');
    add(g, new THREE.CylinderGeometry(0.72, 0.72, 0.05, 14), 0x2f4a5e, 0, 0.55, 0);
    for (const sx of [-0.8, 0.8]) add(g, box(0.1, 1.6, 0.1), 0x5a3f2a, sx, 1.2, 0, 'wood');
    add(g, box(1.8, 0.1, 0.1), 0x5a3f2a, 0, 1.95, 0, 'wood');
    return 0.9;
  },
  // 부두(배를 대는 곳)
  pier(g, p) { BLD.pier(g, p); return 0; },
  // 큰 나무. kind: pine·willow·bare·poplar (없으면 둥근 활엽수)
  tree(g, p) { BLD.tree(g, p); return 0.6; },
  // 가게: style 'hanok'(기와·초가 가게와 좌판) / 'modern'(1910~30년대 2층 상점), sign 간판 글
  shop(g, p) { BLD.shop(g, p); return { rect: [p.w || 5, 3.6] }; },
  // 상하이 석고문 골목집(n칸)
  lanehouse(g, p) { BLD.lanehouse(g, p); return { rect: [(p.n || 3) * 3.6, 5] }; },
  // 시멘트 건물(1950~80년대): floors 층수, sign 세로 간판
  concrete(g, p) { BLD.concrete(g, p); return { rect: [p.w || 7, p.d || 5] }; },
  // 군 막사
  barracks(g, p) { BLD.barracks(g, p); return { rect: [p.w || 9, 4] }; },
  // 시장 노점
  stall(g, p) { BLD.stall(g, p); return { rect: [p.w || 2.6, 1.8] }; },
  // 다리(돌·나무): 물 위에 놓는 장식(부딪힘 없음)
  bridge(g, p) { BLD.bridge(g, p); return 0; },
  // 물가에 매어 둔 나룻배
  boat(g, p) { BLD.boat(g, p); return 0; },
  // 망루·창걸이·과녁(진영)
  watchtower(g, p) { BLD.watchtower(g, p); return { rect: [3, 3] }; },
  spearRack(g, p) { BLD.spearRack(g, p); return 0.9; },
  archeryTarget(g) { BLD.archeryTarget(g); return 0.6; },
  // 논(들판): 논두렁과 벼 포기. ripe면 누렇게 익은 벼. 밟고 지나갈 수 있다
  paddy(g, p) { BLD.paddy(g, p); return 0; },
  // 축대와 계단: 위에 놓을 부품은 y를 h만큼 준다
  terrace(g, p) { BLD.terrace(g, p); return { rect: [p.w || 8, p.d || 6] }; },
  // 무대 가운데 역사 소품: 깃발·짐·화포·모래주머니·투표함·종이 묶음·연장 걸이·게시판·모닥불 자리·소총·물통
  banner(g, p) { BLD.banner(g, p); return 0.3; },
  cargo(g, p) { BLD.cargo(g, p); return 1.1; },
  cannon(g) { BLD.cannon(g); return 0.9; },
  sandbags(g, p) { BLD.sandbags(g, p); return { rect: [p.w || 4, 0.6] }; },
  ballot(g) { BLD.ballot(g); return 0.9; },
  papers(g, p) { BLD.papers(g, p); return 0.8; },
  toolRack(g, p) { BLD.toolRack(g, p); return 1.1; },
  noticeBoard(g, p) { BLD.noticeBoard(g, p); return 1.0; },
  firepit(g) { BLD.firepit(g); return 0.7; },
  rifles(g) { BLD.rifles(g); return 0.4; },
  buckets(g) { BLD.buckets(g); return 0.6; },
  // 책상과 책 (학교·연구실)
  desk(g) {
    add(g, box(1.6, 0.75, 0.9), 0x7a5a3c, 0, 0.38, 0, 'wood');
    for (let k = 0; k < 3; k++) add(g, box(0.5, 0.08, 0.36), [0xd8c9a0, 0x2f6b5e, 0xa8392b][k], -0.4 + k * 0.4, 0.8, 0);
    return 0.9;
  },
  // 판잣집 (전쟁 뒤 피란민)
  shack(g) { BLD.shack(g); return { rect: [3.4, 2.8] }; },
  // 장독대·수레·짚더미·장작더미·가로등
  jars(g, p) { BLD.jars(g, p); return 1.1; },
  cart(g, p) { BLD.cart(g, p); return 1.2; },
  straw(g) { BLD.straw(g); return 1; },
  woodpile(g) { BLD.woodpile(g); return 0.8; },
  lamp(g, p) { BLD.lamp(g, p); return 0.25; }, // lit: 불 켜진 가로등(밤)
  // 벽걸이 전화기·텔레비전·국수 그릇 상·측량 막대(역사책 그림 소품)
  telephone(g) { BLD.telephone(g); return 0.4; },
  tv(g) { BLD.tv(g); return 0.8; },
  bowls(g, p) { BLD.bowls(g, p); return 1.0; },
  surveyPole(g, p) { BLD.surveyPole(g, p); return 0.4; },
  // 군용 트럭
  truck(g, p) { BLD.truck(g, p); return { rect: [2.4, 5.2] }; },
  // 증기 기관차와 화물칸(쌀가마를 싣고), 선로
  train(g, p) {
    const len = p.track || 50;
    for (const dx of [-0.7, 0.7]) add(g, box(0.1, 0.08, len), 0x6b6862, dx, 0.04, 0, null, false);
    for (let z = -len / 2; z < len / 2; z += 1.4) add(g, box(2, 0.08, 0.3), 0x5a3f2a, 0, 0.02, z, 'wood', false);
    add(g, box(2.2, 2.2, 5), 0x2b2b2b, 0, 1.5, -6);
    add(g, new THREE.CylinderGeometry(1, 1, 3.4, 14), 0x2b2b2b, 0, 1.8, -7.6).rotation.x = Math.PI / 2;
    add(g, new THREE.CylinderGeometry(0.35, 0.45, 1.4, 10), 0x1e1c1a, 0, 3.3, -8.6);
    for (let k = 0; k < (p.cars || 3); k++) {
      add(g, box(2.2, 1.6, 4.6), 0x6b4a32, 0, 1.2, -1 + k * 5, 'wood');
      for (let i = 0; i < 6; i++) { const s = add(g, new THREE.CylinderGeometry(0.35, 0.35, 0.8, 8), 0xd8c08a, (i % 2) * 0.8 - 0.4, 2.3, -2.6 + k * 5 + Math.floor(i / 2) * 1.2); s.rotation.z = Math.PI / 2; }
    }
    for (let k = -1; k < (p.cars || 3); k++) for (const dz of [-1.5, 1.5]) for (const sx of [-0.8, 0.8]) { const w = add(g, new THREE.CylinderGeometry(0.4, 0.4, 0.15, 10), 0x1e1c1a, sx, 0.4, (k < 0 ? -6 : -1 + k * 5) + dz); w.rotation.z = Math.PI / 2; }
    return { rect: [2.6, 6 + (p.cars || 3) * 5] };
  },
  // 팔각정(탑골 공원): 돌 기단, 기둥 여덟, 팔각 지붕
  pavilion(g) {
    add(g, new THREE.CylinderGeometry(3.4, 3.6, 0.6, 8), 0xb3ab99, 0, 0.3, 0, 'stone');
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; add(g, new THREE.CylinderGeometry(0.16, 0.16, 3, 8), 0xa8392b, Math.cos(a) * 2.8, 2.1, Math.sin(a) * 2.8); }
    add(g, new THREE.CylinderGeometry(3.1, 3.1, 0.3, 8), 0x2f6b5e, 0, 3.6, 0);
    add(g, new THREE.ConeGeometry(4.2, 2.2, 8), 0x3d4846, 0, 4.8, 0, 'tile');
    add(g, new THREE.ConeGeometry(1.2, 1.4, 8), 0x3d4846, 0, 6.2, 0, 'tile');
    return 3.6;
  },
  // 철조망 울타리 (휴전선)
  fence(g, p) {
    const w = p.w || 20;
    for (let x = -w / 2; x <= w / 2; x += 2.5) add(g, new THREE.CylinderGeometry(0.06, 0.06, 2, 5), 0x6b6862, x, 1, 0);
    for (const y of [0.6, 1.2, 1.8]) { const l = add(g, new THREE.CylinderGeometry(0.02, 0.02, w, 4), 0x8a8a88, 0, y, 0, null, false); l.rotation.z = Math.PI / 2; }
    return 0;
  },
};

// 부딪힘 자리: 둥근 것은 원 하나, 네모난 건물은 긴 쪽을 따라 작은 원을 줄지어 놓는다(앞마당까지 막지 않게)
export function addFootprint(world, p, r) {
  const s = p.scale || 1;
  if (typeof r === 'number') { world.addCollider({ x: p.x, z: p.z, r: r * s }); return; }
  if (r.parts) { // 여러 조각(성문의 양쪽 몸채 등): 조각마다 제자리에서 따로 막는다
    const c = Math.cos(p.ry || 0), sn = Math.sin(p.ry || 0);
    for (const q of r.parts) addFootprint(world, { ...p, x: p.x + q.dx * s * c, z: p.z - q.dx * s * sn }, { rect: q.rect });
    return;
  }
  let [w, d] = r.rect; w *= s; d *= s;
  const along = w >= d, len = along ? w : d, rad = (along ? d : w) / 2;
  const n = Math.max(1, Math.ceil(len / (rad * 1.4)));
  const c = Math.cos(p.ry || 0), sn = Math.sin(p.ry || 0);
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : -len / 2 + rad + (len - 2 * rad) * i / (n - 1);
    const lx = along ? t : 0, lz = along ? 0 : t;
    world.addCollider({ x: p.x + lx * c + lz * sn, z: p.z - lx * sn + lz * c, r: rad });
  }
}

// 집 둘레 살림살이: 기와집 뒤에는 장독대, 초가 뒤에는 장작더미와 짚더미(집 뒤쪽이라 앞마당과 길을 막지 않는다)
function dressHouse(world, L, p, layout) {
  const k = p.scale || 1, c = Math.cos(p.ry || 0), sn = Math.sin(p.ry || 0);
  const put = (type, lx, lz, r, extra = {}) => {
    const x = p.x + (lx * c + lz * sn) * k, z = p.z + (-lx * sn + lz * c) * k;
    // 안내판·인물·다른 건물 가까이면 놓지 않는다(다가가 읽고 말 거는 자리를 막지 않게)
    const busy = [...(layout.signs || []), ...(layout.npcs || [])].some(o => Math.hypot(o.x - x, o.z - z) < 3)
      || (layout.props || []).some(o => o !== p && o.type !== 'water' && Math.hypot(o.x - x, o.z - z) < (o.type === 'western' ? Math.max(o.w || 8, o.d || 5) / 2 + 1.5 : 3) * (o.scale || 1));
    if (busy) return;
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = p.ry || 0; g.scale.setScalar(Math.min(k, 1.2)); L.add(g);
    BUILD[type](g, { x, z, ...extra });
    world.addCollider({ x, z, r: r * Math.min(k, 1.2) });
  };
  if (p.tile) put('jars', 1.0, -2.9, 1.0, { n: 5 });
  else { put('woodpile', -1.2, -2.6, 0.8); put('straw', 1.6, -2.9, 1.0); }
}

// 자연 꾸미기: 바깥 언덕에는 소나무·덤불·바위, 마을 가장자리에는 풀포기(길·건물·안내판·인물 자리는 비운다).
// 같은 배치표면 늘 같은 자리. 모두 인스턴스로 한 종류당 한두 번에 그린다.
export function addNature(world, layout, field, kind, color, parent = world.level) {
  const b = layout.bounds, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
  const wide = { x0: cx - 75, x1: cx + 75, z0: cz - 75, z1: cz + 75 };
  const onHill = (x, z) => field.heightAt(x, z) > 0.7;
  const hsl = {}; new THREE.Color(color).getHSL(hsl);
  const snowy = hsl.l > 0.7;
  const seed = Math.round(Math.abs(b.x0 * 31 + b.z1 * 17)) + 5;
  const hill = layout.hillColor ?? hillColorFor(kind, color, world.moodName);
  const hasPines = (layout.scatter || []).some(s => s.kind === 'pine');
  scatter(world, { parent, kind: 'pine', count: hasPines ? 35 : 70, area: wide, keep: onHill, ground: field.heightAt, seed, scale: [1.1, 1.9] });
  scatter(world, { parent, kind: 'bush', count: 30, area: wide, keep: onHill, ground: field.heightAt, seed: seed + 1, scale: [0.9, 1.6], color: snowy ? 0xdfe6ea : null });
  scatter(world, { parent, kind: 'rock', count: 24, area: wide, keep: onHill, ground: field.heightAt, seed: seed + 2, scale: [0.8, 2.2] });
  if (kind === 'stone' || snowy) return; // 포장한 길과 눈밭에는 풀포기를 두지 않는다
  const busy = [
    ...(layout.signs || []).map(s => ({ x: s.x, z: s.z, r: 1.8 })), ...(layout.npcs || []).map(n => ({ x: n.x, z: n.z, r: 1.5 })),
    ...(layout.props || []).filter(p => p.type !== 'water').map(p => ({ x: p.x, z: p.z, r: (p.type === 'western' ? Math.max(p.w || 8, p.d || 5) * 0.65 : 3.2) * (p.scale || 1) })),
    { x: layout.start?.[0] ?? 0, z: layout.start?.[1] ?? 0, r: 2 },
  ];
  const onRoad = (x, z) => (layout.roads || []).some(r => Math.abs(x - r.x) < r.w / 2 + 0.6 && Math.abs(z - r.z) < r.d / 2 + 0.6);
  const f = field.flat;
  scatter(world, { parent, kind: 'grass', count: 90, area: { x0: f.x0, x1: f.x1, z0: f.z0, z1: f.z1 }, avoid: busy, keep: (x, z) => !onRoad(x, z), seed: seed + 3, scale: [0.7, 1.2], color: new THREE.Color(hill ? new THREE.Color(color).lerp(new THREE.Color(hill), 0.7) : color).multiplyScalar(1.25).getHex() }); // 흙 마당의 풀포기는 언덕 풀빛 쪽으로(마른 흙빛 풀이 아니게)
  if (hsl.h > 0.17 && hsl.h < 0.45 && hsl.s > 0.2) scatter(world, { parent, kind: 'flower', count: 25, area: { x0: f.x0, x1: f.x1, z0: f.z0, z1: f.z1 }, avoid: busy, keep: (x, z) => !onRoad(x, z), seed: seed + 4 });
}

export function buildTown(world, layout) {
  const L = world.level;
  world.bounds = layout.bounds;
  // 땅: 걷는 곳은 평평하고 바깥은 언덕, 멀리 산줄기
  const field = terrainField({ bounds: layout.bounds, props: layout.props || [], hill: layout.hill ?? 1 });
  const color = layout.groundColor ?? 0x5f7a4c;
  const kind = layout.ground || 'grass';
  if (kind === 'stone') { // 돌을 깐 도시: 걷는 곳만 포장하고 바깥 언덕은 흙
    const f = field.flat, pave = new THREE.Mesh(box(f.x1 - f.x0, 0.04, f.z1 - f.z0), mat(color, 'stone'));
    pave.position.set((f.x0 + f.x1) / 2, 0.01, (f.z0 + f.z1) / 2); pave.receiveShadow = true; L.add(pave);
  }
  const hill = layout.hillColor ?? hillColorFor(kind, color, world.moodName); // 바깥 언덕: 흙·돌 바닥이어도 계절에 맞는 풀빛(맨흙 산이 사막처럼 보이지 않게)
  L.add(terrainMesh(field, { color: kind === 'stone' ? 0x7d7158 : color, kind: kind === 'stone' ? 'earth' : kind, roads: layout.roads || [], hill }));
  // skyline: { style: 'hanok'|'brick'|'concrete', arc: [시작, 끝] 라디안, color } — 도시 장면의 먼 건물 실루엣
  if (layout.skyline) { const sk = skyline(field, { center: [(layout.bounds.x0 + layout.bounds.x1) / 2, (layout.bounds.z0 + layout.bounds.z1) / 2], ...layout.skyline }); if (sk) L.add(sk); }
  if (layout.mountains !== false) { const mr = mountainRing(field, { color: hill ?? (kind === 'stone' ? 0x6a7a58 : color), center: [(layout.bounds.x0 + layout.bounds.x1) / 2, (layout.bounds.z0 + layout.bounds.z1) / 2] }); if (mr) L.add(mr); }
  for (const r of layout.roads || []) { const m = new THREE.Mesh(box(r.w, 0.05, r.d), mat(r.color || 0x8f7556, r.kind || 'earth')); m.position.set(r.x, 0.025, r.z); m.receiveShadow = true; L.add(m); }
  const named = {};
  for (const p of layout.props || []) {
    const g = new THREE.Group(); g.position.set(p.x, p.y || 0, p.z); g.rotation.y = p.ry || 0; if (p.scale) g.scale.setScalar(p.scale); L.add(g); // y: 축대 위에 올린 부품
    const r = BUILD[p.type](g, p);
    if (p.type === 'crowd') BLD.bakeStatic(g, m => !!flagTex && m.material.map === flagTex); // 서 있는 무리는 한 덩어리로(태블릿 성능), 깃발은 그대로 흔들린다
    if (r && p.solid !== false) addFootprint(world, p, r);
    if (p.name) named[p.name] = g;
    if (p.type === 'hanok' && layout.dress !== false) dressHouse(world, L, p, layout);
  }
  for (const s of layout.scatter || []) scatter(world, { ground: field.heightAt, ...s });
  if (layout.nature !== false) addNature(world, layout, field, kind, color);
  for (const n of layout.npcs || []) { world.addNpc(n.id, typeof n.look === 'string' ? LOOKS[n.look] : n.look, n.x, n.z, n.ry || 0); if (n.work) setWork(world.npcs.get(n.id).mesh, n.work); } // work: 일하는 동작
  for (const s of layout.signs || []) placeSign(world, s); // plaque면 이름만 있는 건물 간판(C-03)
  const weather = layout.weather ? createWeather(world, layout.weather, { count: 700 }) : null;
  // 깃발이 바람에 흔들린다
  const flags = Object.values(named).map(g => g.userData.flag).filter(Boolean);
  // 깃발 그림이 아직 없으면(flagTex null) 무늬 없는 산·땅·물까지 '깃발'로 잡혀 흔들리던 오류(D-32)를 막는다
  if (flagTex) L.traverse(o => { if (o.isMesh && o.material && o.material.map === flagTex && !flags.includes(o)) flags.push(o); });
  world.onUpdate((dt, t) => { flags.forEach((f, i) => { f.rotation.y = Math.sin(t * 2.5 + i) * 0.25; }); });
  return { named, weather, start: layout.start };
}
