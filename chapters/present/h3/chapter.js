// 현대편 3장 「6·25 전쟁」(D-50): 1950년 여름 낙동강 가의 국군 진지(천막, 트럭, 모래주머니).
// 「낙동강 진지」 문으로 들어와 국군 병사·유엔군 병사·피란민 이야기를 아무 차례로 듣고(모두 들어야 국군 지휘관),
// 지휘관에게 가면 학생의 결심 → 부산 항구에 16개 나라 유엔군이 도착해 나라 이름판 아래 줄지어 선다 →
// ① 군함 갑판에서 물때표를 읽어 물이 가장 높이 찰 때 월미도·인천에 상륙 ② 국군 병사에게 말을 걸면 되찾은 서울에 태극기 올리기.
import * as THREE from 'three';
import { makeKitChapter } from '../../kit/chapter.js';
import { buildArena, labelSprite, toast } from '../../kit/play.js';
import { holdFlag, cheerFlag, flagMesh } from '../../kit/town.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { walkInAndTalk, anyOrderTalk } from '../../kit/talk.js';
import { wait, person, ease, face, sayer, meet, minigameWithMeet, facingShare } from '../../kit/walk.js';
import { waitInteract } from '../../../core/portal.js';
import { mat, setCarry } from '../../../core/people.js';
import { placePlayer } from '../../joseon/common.js';
import script from './script.js';
import { handshake } from '../../../core/interact.js';
import { warMap, playWarMap } from '../../kit/warmap.js';

const PEOPLE = ['soldier', 'unSoldier', 'refugee'];
const GATE_Z = 14.5, INTRO_FROM = [0, 17.5], SPOT = [0, 7];
const blk = (g, w, h, d, color, x, y, z, kind = 'wood') => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, kind)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
const ring = (g, x, z, r = 0.9) => { const m = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.25, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.09, z); m.visible = false; g.add(m); return m; };
function canvasBoard(w, h, px = 128) {
  const cv = document.createElement('canvas'); cv.width = Math.round(w * px); cv.height = Math.round(h * px);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex }));
  return { mesh, c: cv.getContext('2d'), cv, tex };
}
// 상륙정(2026-11-05 선생님: 하나로, 크게, 배답게): 뾰족한 뱃머리·앞 내림판·양 뱃전·뒤 조타실과 굴뚝·국기, 뒤에 하얀 물보라.
// 탄 병사는 aboard(배가 움직여도 걷지 않는다). 앞이 -z(북쪽). 돌려준 함수 rock(t)로 출렁인다
function landingCraft(g, x, z) {
  const b = new THREE.Group(); b.position.set(x, 0, z); g.add(b);
  const hull = new THREE.Group(); b.add(hull);
  const H = 0x55603f, D = 0x3e4630;
  blk(hull, 3.6, 0.9, 7.4, H, 0, 0.25, 0.4, 'grain'); // 배 바닥
  const bow = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.9, 3, 1, false, -Math.PI / 6, Math.PI / 3 * 2).rotateY(Math.PI), mat(H, 'grain')); bow.scale.set(1, 1, 0.9); bow.position.set(0, 0.25, -3.3); hull.add(bow); // 뾰족한 뱃머리
  for (const s of [-1, 1]) { blk(hull, 0.16, 0.9, 7.4, D, s * 1.72, 1.05, 0.4, 'grain'); blk(hull, 0.24, 0.08, 7.4, 0x2e3426, s * 1.72, 1.52, 0.4, 'grain'); } // 뱃전과 그 위 테
  blk(hull, 3.4, 1.2, 0.16, D, 0, 1.0, -3.0, 'grain'); // 앞 내림판
  blk(hull, 1.6, 1.1, 1.4, 0x6a7350, 0, 1.25, 3.3, 'grain'); blk(hull, 1.8, 0.08, 1.6, 0x2e3426, 0, 1.84, 3.3, 'grain'); // 조타실
  for (let i = 0; i < 3; i++) blk(hull, 0.28, 0.2, 0.04, 0x9ab0b8, -0.5 + i * 0.5, 1.45, 2.58, 'grain'); // 조타실 창
  const pole = blk(hull, 0.05, 1.4, 0.05, 0x3a3a3a, 0.6, 2.5, 3.8, 'grain'); void pole;
  const flag = flagMesh(0.7, 0.47); flag.position.set(0.97, 2.9, 3.8); hull.add(flag);
  blk(hull, 3.7, 0.12, 0.12, 0xc8c0a8, 0, 0.72, -1.4, 'grain'); // 흰 띠
  const crew = [];
  for (const dx of [-0.8, 0, 0.8]) for (const dz of [-1.6, -0.2]) { const p = person(hull, 'rokSoldier', dx, dz, Math.PI); p.position.y = 0.7; p.userData.aboard = true; crew.push(p); }
  const wake = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf4f6f6, transparent: true, opacity: 0.55, depthWrite: false })); wake.position.set(0, 0.32, 6); b.add(wake);
  b.userData.dynamic = true;
  b.userData.rock = (t, speed) => { hull.position.y = 0.06 * Math.sin(t * 2.1); hull.rotation.z = 0.035 * Math.sin(t * 1.3); hull.rotation.x = 0.025 * Math.sin(t * 1.7) - 0.03 * speed; wake.material.opacity = 0.15 + 0.5 * speed; wake.scale.z = 0.4 + speed; };
  b.userData.crew = crew;
  return b;
}

// 탱크(2026-11-05 선생님: 남침 장면): 무한궤도(바퀴 여섯 쌍)·차체·포탑·긴 포신, 앞이 +z
function tank(g, x, z, ry = 0) {
  const t = new THREE.Group(); t.position.set(x, 0, z); t.rotation.y = ry; g.add(t);
  const C = 0x4a5238, D = 0x2e3226;
  for (const s of [-1, 1]) {
    blk(t, 0.7, 0.75, 5.2, D, s * 1.35, 0.42, 0, 'grain'); // 무한궤도
    for (let i = 0; i < 6; i++) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.74, 12).rotateZ(Math.PI / 2), mat(0x3a3e34, 'grain')); w.position.set(s * 1.35, 0.4, -2 + i * 0.8); t.add(w); }
  }
  blk(t, 2.2, 0.7, 4.8, C, 0, 0.95, 0, 'grain'); blk(t, 2.2, 0.4, 1.2, C, 0, 0.75, 2.6, 'grain'); // 차체·앞판
  const tur = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.0, 0.7, 10), mat(C, 'grain')); tur.position.set(0, 1.65, -0.3); tur.castShadow = true; t.add(tur);
  const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 3.2, 8).rotateX(Math.PI / 2), mat(D, 'grain')); gun.position.set(0, 1.7, 1.9); t.add(gun);
  blk(t, 0.5, 0.25, 0.5, D, 0.3, 2.1, -0.5, 'grain'); // 해치
  t.userData.dynamic = true;
  return t;
}
// 남침에서 낙동강까지(국군이 밀려 내려간 길). 첫 곳은 38도선 위(이름은 선 옆 글씨가 대신)
export const RETREAT = [['', 132, 196, 10], ['서울', 132, 228, -10], ['대전', 140, 276, -10], ['낙동강', 182, 300, 10]];

// ── 무대(마을에서 떨어진 x 400) ──
// 부산 항구(탐험 끝 장면): 북쪽 바다에 군함, 부두 위에 유엔군이 두 줄로 남쪽(카메라)을 보고 선다
export const PORT = { edge: { style: 'city', seed: 1950 },
  origin: [400, 0], ground: 'stone', groundColor: 0x9a948a, bounds: { x0: -14, x1: 14, z0: -8, z1: 10 },
  props: [
    { type: 'water', x: 0, z: -24, w: 160, d: 30, color: 0x4f6f80 },
    { type: 'steamship', x: 7, z: -16, ry: Math.PI / 2, solid: false }, { type: 'steamship', x: -16, z: -22, ry: Math.PI / 2.3, solid: false },
    { type: 'flagpole', x: -10, z: -5.5, color: 0x5b92e5 }, { type: 'flagpole', x: 10, z: -5.5 },
    { type: 'cargo', x: -12.5, z: 2, kind: 'crate', n: 3 }, { type: 'truck', x: 12.5, z: 3, ry: 0.2 },
  ],
  gang: [6, -9], rows: [-4.4, -2.2], watch: [-9, 5.5],
};
// 군함 갑판(물때 놀이): 학생은 갑판 위, 북쪽 멀리 월미도와 인천 방파제, 그 앞 갯벌
export const FLEET = {
  origin: [400, 0], sea: 0x4f6f80, bounds: { x0: -4.6, x1: 4.6, z0: -6.2, z1: 7.4 },
  props: [
    { type: 'island', x: -17, z: -34, r: 6 }, // 월미도
    { type: 'western', x: -8, z: -54, w: 8, d: 5, h: 5, color: 0x9a948a, solid: false }, { type: 'western', x: 8, z: -55, w: 7, d: 5, h: 6, color: 0xa86a52, solid: false },
    { type: 'steamship', x: -14, z: 6, ry: 0.2, solid: false }, { type: 'steamship', x: 15, z: 10, ry: -0.3, solid: false },
  ],
  from: [0, 5.5], board: [-1.5, -5.6], mast: [3, -3.6], wall: -44, flat: [-14, -44],
};
// 되찾은 서울(태극기 올리기): 북쪽 끝 둥근 지붕 큰 건물과 깃대, 양옆 부서진 건물, 길 위 무너진 벽돌 더미
export const RUINS = { edge: { style: 'city', seed: 928 },
  origin: [400, 0], ground: 'stone', groundColor: 0x9a9284, bounds: { x0: -10, x1: 10, z0: -15, z1: 13 },
  props: [
    { type: 'western', x: 0, z: -22, w: 16, d: 6, h: 7, dome: true, color: 0xc8c0b0 },
    { type: 'concrete', x: -14, z: -4, floors: 2, w: 6, ry: Math.PI / 2, color: 0x8a8478, shop: false }, { type: 'concrete', x: 14, z: 3, floors: 2, w: 6, ry: -Math.PI / 2, color: 0x948e82, shop: false },
    { type: 'tree', x: -8.5, z: 10, kind: 'bare' }, { type: 'tree', x: 8.5, z: -11, kind: 'bare' },
  ],
  rubble: [[-3.2, 6, 1.5], [3.6, 1.5, 1.5], [-5.4, 1.2, 1.3], [3.2, -8.5, 1.3]], // 시민들이 모이는 길(양옆 x ±9 → 깃대 앞 두 줄)을 막지 않게(2026-11-05 선생님: 벽돌을 뚫고 걸었다)
  colliders: [{ x: -3.2, z: 6, r: 1.5 }, { x: 3.6, z: 1.5, r: 1.5 }, { x: -5.4, z: 1.2, r: 1.3 }, { x: 3.2, z: -8.5, r: 1.3 }],
  from: [0, 11], pole: [0, -13],
};

// ── 탐험 끝 장면: 부산 항구에 유엔군이 도착해 16개 나라 이름판 아래 두 줄로 선다(얼굴이 보이게) ──
export async function arrivalScene(ctx) {
  const { world, dialogue } = ctx;
  const S = script.arrival, L = S.lines, A = PORT, say = sayer(ctx);
  ctx.setGoal(script.goals[2]);
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  // 다리판(군함에서 부두로)
  blk(g, 1.4, 0.1, 6, 0x6b5a44, A.gang[0], 0.35, A.gang[1] - 3);
  const spots = S.nations.map((_, i) => [-7 + (i % 8) * 2, A.rows[Math.floor(i / 8)]]);
  const troops = S.nations.map((_, i) => { const p = person(g, 'unSoldier', A.gang[0], A.gang[1] - 4, 0); p.visible = false; return p; });
  const labels = S.nations.map((n, i) => { const l = labelSprite(n, { size: n.length > 5 ? 0.36 : 0.5 }); const [x, z] = spots[i]; l.position.set(x, i < 8 ? 3.5 : 2.75, z); l.visible = false; g.add(l); return l; });
  const greet = [[-12, -1, 'rokSoldier'], [-12.4, 0.6, 'citizen'], [-11.6, 2, 'woman'], [12, -1.4, 'rokSoldier'], [11.8, 0.6, 'kidModern'], [12.4, 1.6, 'citizen']]
    .map(([x, z, look]) => { const p = person(g, look, x, z, 0); face(p, 0, -3); if (look !== 'rokSoldier') holdFlag(p); return p; });
  const officer = person(g, 'rokSoldier', 4.6, 2.4, Math.PI * 0.95); // 카메라를 가리지 않게 옆에서 유엔군을 맞이한다
  const hook = ctx.testHooks.arrival = { troops: troops.length, nations: S.nations.length, labels: 0, saluted: false, facing: 0 };
  const W = a.at(...A.watch); placePlayer(world, [W.x, W.z], Math.PI * 0.8);
  const C = a.at(0.4, 8.6), T = a.at(0, -3);
  const front = () => world.setFixedCamera([C.x, 3.4, C.z], [T.x, 1.7, T.z]); // 부두 남쪽에서 유엔군의 얼굴을 마주 본다
  try {
    front();
    await ctx.fade?.(false);
    await dialogue.say(L[0]);
    dialogue.close();
    // 다리판을 내려와 차례로 자리에 선다
    const from = new THREE.Vector3(A.gang[0], 0, A.gang[1] - 4);
    await wait(world, 5, k => troops.forEach((p, i) => {
      const u = Math.min(1, Math.max(0, (k - i * 0.04) / 0.36));
      if (u > 0 && !p.visible) p.visible = true;
      p.position.lerpVectors(from, new THREE.Vector3(spots[i][0], 0, spots[i][1]), ease(u));
      if (u > 0 && u < 1) face(p, spots[i][0], spots[i][1]); else if (u >= 1) { p.rotation.y = 0; if (!labels[i].visible) { labels[i].visible = true; hook.labels += 1; } }
    }));
    troops.forEach((p, i) => { p.rotation.y = 0; labels[i].visible = true; });
    hook.labels = labels.filter(l => l.visible).length;
    front();
    hook.facing = facingShare(world, troops);
    await say(L[1], troops[4]);
    dialogue.close();
    front();
    await dialogue.say(L[2]);
    // 경례
    await wait(world, 0.8, k => troops.forEach(p => { const ar = p.userData.arms; if (ar) ar[1].rotation.set(-2.3 * ease(k), 0, 0.5 * ease(k)); }));
    hook.saluted = true;
    greet.forEach((p, i) => { if (p.userData.carry) cheerFlag(p, 0.8); else face(p, 0, -3); });
    await say(L[3], officer);
    dialogue.close();
    // 지휘관이 가장 가까운 유엔군 병사와 악수한다(바라보기 → 다가서기 → 손 뻗기 → 흔들기 → 놓기, 2026-10-30 움직임 개선)
    // 앞줄 끝(동쪽) 유엔군 병사에게 지휘관이 다가가 서로 바라보며 악수한다. 옆(동쪽, 가리는 사람이 없는 쪽)에서 본다(2026-11-05 선생님: 시선·자리·손)
    const near = troops[15], N = a.at(near.position.x, near.position.z);
    await wait(world, 0.5, k => troops.forEach(p => { const ar = p.userData.arms; if (ar) ar[1].rotation.set(-2.3 * (1 - ease(k)), 0, 0.5 * (1 - ease(k))); })); // 경례를 내린다
    greet.forEach(p => { if (p.position.x > 0) p.visible = false; }); // 동쪽 환영 인파는 카메라 앞을 가리지 않게
    officer.position.set(near.position.x + 0.4, 0, near.position.z + 2.4); face(officer, near.position.x, near.position.z); // 장면을 바꾸며 병사 앞(남쪽)에 세운다: 둘이 남북으로 마주 보아 옆에서 손이 보인다
    world.setFixedCamera([N.x + 6.2, 1.8, N.z + 0.65], [N.x + 0.2, 1.25, N.z + 0.65]);
    hook.handshake = await handshake(world, near, officer);
    await wait(world, 0.4);
  } finally {
    await ctx.fade?.(true);
    a.dispose();
    world.setMood(base.mood);
    placePlayer(world, SPOT);
    world.camMode = 'follow'; world.snapCamera();
    ctx.input.enabled = false;
    await ctx.fade?.(false);
  }
}

async function leaveArena(ctx, a) {
  const { world, hud } = ctx;
  await ctx.fade?.(true);
  hud.setCounter(null); world.setGoal(null);
  setCarry(world.player, null);
  a.dispose();
  placePlayer(world, SPOT);
  world.camMode = 'follow'; world.snapCamera();
  ctx.input.enabled = false;
  await ctx.fade?.(false);
}

// 물높이(0~1) 하루 그래프: 아침과 저녁에 두 번 찬다
const TIDE = t => 0.5 + 0.5 * Math.cos((t - 0.27) * Math.PI * 2 / 0.51);
const TIDE_MARKS = [0.02, 0.27, 0.52, 0.52, 0.65, 0.78]; // ①②③ ④⑤⑥ 자리(하루 중 때)

// ── 놀이 ①: 물때를 읽고 인천에 상륙하기 ──
export async function tidePlay(ctx) {
  const { world, dialogue, hud, audio } = ctx;
  const P = script.parts.tide, A = FLEET;
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  const hook = ctx.testHooks.tide = { picks: [], high: 0, ebb: false, signal: false, climbed: 0 };
  // 군함 갑판: 회색 철판, 둘레 뱃전과 난간, 돛대
  blk(g, 10.6, 0.06, 15.4, 0x6e7378, 0, 0.04, 0.6, 'stone');
  for (const s of [-1, 1]) blk(g, 0.3, 0.8, 15.4, 0x55595e, s * 5.2, 0.4, 0.6, 'stone');
  blk(g, 10.6, 0.8, 0.3, 0x55595e, 0, 0.4, -7, 'stone'); blk(g, 10.6, 0.8, 0.3, 0x55595e, 0, 0.4, 8.2, 'stone');
  blk(g, 3, 2.6, 2.6, 0x7a7f84, -2.6, 1.3, 5.4, 'stone'); // 함교
  const [mx, mz] = A.mast; blk(g, 0.18, 7, 0.18, 0x4a4e52, mx, 3.5, mz, 'stone'); blk(g, 2.4, 0.1, 0.1, 0x4a4e52, mx, 5.8, mz, 'stone');
  const sig = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), new THREE.MeshLambertMaterial({ color: 0xc8402c, side: THREE.DoubleSide })); sig.position.set(mx + 0.5, 1.2, mz); g.add(sig);
  const officer = person(g, 'rokSoldier', A.board[0] - 2.4, A.board[1] + 0.6, 0);
  // 물때표 판
  const board = canvasBoard(3.6, 2.2, 128); board.mesh.position.set(A.board[0], 1.9, A.board[1]); g.add(board.mesh);
  blk(g, 3.8, 2.4, 0.08, 0x3a3f44, A.board[0], 1.9, A.board[1] - 0.06);
  for (const s of [-1, 1]) blk(g, 0.1, 0.8, 0.1, 0x3a3f44, A.board[0] + s * 1.6, 0.4, A.board[1] - 0.06);
  const drawBoard = (round, picked = -1) => {
    const { c, cv } = board; c.fillStyle = '#f2ecd8'; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = '#2b241c'; c.font = 'bold 26px sans-serif'; c.textAlign = 'center'; c.fillText('인천 앞바다 물때표', cv.width / 2, 34);
    const x0 = 50, x1 = cv.width - 24, y0 = cv.height - 46, y1 = 60, X = t => x0 + (x1 - x0) * t, Y = v => y0 - (y0 - y1) * v;
    c.strokeStyle = '#6b5a3a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y1 - 6); c.lineTo(x0, y0); c.lineTo(x1, y0); c.stroke();
    c.font = '18px sans-serif'; c.fillStyle = '#4a3f30';
    [['새벽', 0.05], ['아침', 0.3], ['낮', 0.52], ['저녁', 0.76], ['밤', 0.95]].forEach(([t, u]) => c.fillText(t, X(u), y0 + 24));
    c.save(); c.translate(20, (y0 + y1) / 2); c.rotate(-Math.PI / 2); c.fillText('물 높이', 0, 0); c.restore();
    c.strokeStyle = '#2f6b9a'; c.lineWidth = 4; c.beginPath();
    for (let i = 0; i <= 96; i++) { const t = i / 96; (i ? c.lineTo : c.moveTo).call(c, X(t), Y(TIDE(t) * 0.9 + 0.05)); }
    c.stroke();
    const marks = round < 0 ? [] : P.rounds[round].marks;
    marks.forEach((m, i) => {
      const t = TIDE_MARKS[round * 3 + i], x = X(t), y = Y(TIDE(t) * 0.9 + 0.05);
      c.fillStyle = i === picked ? '#b8282c' : '#2b241c'; c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.fill();
      c.font = 'bold 26px sans-serif'; c.fillText(m, x, y - 14);
    });
    board.tex.needsUpdate = true;
  };
  drawBoard(0);
  // 북쪽 바다: 갯벌(물이 빠지면 드러난다), 인천 방파제와 사다리, 상륙정
  const [fz0, fz1] = A.flat;
  const flat = new THREE.Mesh(new THREE.PlaneGeometry(90, fz0 - fz1).rotateX(-Math.PI / 2), mat(0x7a6a50, 'earth')); flat.position.set(0, -0.3, (fz0 + fz1) / 2); flat.receiveShadow = true; g.add(flat);
  const land = new THREE.Mesh(new THREE.PlaneGeometry(120, 40).rotateX(-Math.PI / 2), mat(0x8a8070, 'earth')); land.position.set(0, 2.6, A.wall - 20.6); g.add(land);
  blk(g, 120, 2.8, 1.2, 0x8a8478, 0, 1.3, A.wall, 'stone'); // 방파제
  const isle = a.at(-17, -34);
  const crafts = [landingCraft(g, 0, -21)]; // 상륙정 하나(2026-11-05 선생님)
  const toIsle = [[-15, -28.5]], toWall = [[0, A.wall + 7.2]]; // 뱃머리 끝이 사다리 밑(wall+1.75) 앞에 멈춘다
  // 사다리: 방파제 앞(남쪽) 면에 기대 세운다. 밑은 앞으로 1.2m, 꼭대기는 방파제 면(wall+0.6) 바로 앞(벽을 뚫지 않게, 2026-11-05 선생님)
  const LADDER_X = [-1.2, 1.2], LEAN = Math.atan2(1.0, 3.0);
  const ladders = LADDER_X.map(x => { const l = new THREE.Group(); l.position.set(x, 0, A.wall + 1.75); l.rotation.x = -LEAN; l.visible = false; g.add(l); for (const s of [-0.3, 0.3]) blk(l, 0.08, 3.2, 0.08, 0x6b4a32, s, 1.6, 0); for (let i = 0; i < 7; i++) blk(l, 0.6, 0.06, 0.06, 0x6b4a32, 0, 0.3 + i * 0.45, 0); return l; });
  hook.ladderTop = A.wall + 1.75 - Math.sin(LEAN) * 3.2;
  const climbers = [...LADDER_X, ...LADDER_X].map((x, i) => { const p = person(g, 'rokSoldier', x, A.wall + 2.6 + (i >> 1) * 0.9, Math.PI); p.visible = false; return p; });
  const level = v => { flat.position.y = 0.25 - 0.6 * v; }; // 물이 차면 갯벌이 물에 잠긴다. 물결(±0.1) 마루·골과 겹치지 않게 위(0.25)·아래(-0.35)로(2026-11-05 선생님: 경계가 계속 바뀜)
  level(0);
  const shore = () => { const C = a.at(3, -11), T = a.at(-6, A.wall + 9); world.setFixedCamera([C.x, 6, C.z], [T.x, 0.4, T.z]); }; // 갑판 앞 바다 위에서 갯벌과 월미도·방파제를 내려다본다
  const wallView = () => { const C = a.at(7, A.wall + 13), T = a.at(0, A.wall + 1); world.setFixedCamera([C.x, 4.2, C.z], [T.x, 1.6, T.z]); }; // 방파제를 오르는 병사들
  const p0 = a.at(...A.from); placePlayer(world, [p0.x, p0.z], Math.PI);
  const say = sayer(ctx), total = P.rounds.length + 1;
  // 배가 나아가기: 가는 쪽으로 천천히 뱃머리를 돌리고, 빨라졌다 느려지며 출렁인다(물보라는 빠를수록 길게)
  let tRock = 0; const offRock = world.onUpdate(dt => { tRock += dt; crafts.forEach(b => b.userData.rock(tRock, b.userData.speed || 0)); });
  const sail = async (list, sec) => {
    const s0 = crafts.map(b => b.position.clone()), r0 = crafts.map(b => b.rotation.y);
    await wait(world, sec, k => crafts.forEach((b, i) => {
      const to = new THREE.Vector3(list[i][0], 0, list[i][1]), want = Math.atan2(-(to.x - s0[i].x), -(to.z - s0[i].z)); // 앞이 -z
      const turn = Math.atan2(Math.sin(want - r0[i]), Math.cos(want - r0[i])), back = k > 0.75 ? (k - 0.75) / 0.25 : 0;
      b.rotation.y = r0[i] + turn * Math.min(1, k * 3) * (1 - back);
      b.position.lerpVectors(s0[i], to, ease(k)); b.userData.speed = Math.sin(Math.PI * k);
    }));
    crafts.forEach(b => { b.userData.speed = 0; });
  };
  try {
    await ctx.fade?.(false);
    for (const [r, R] of P.rounds.entries()) {
      hud.setCounter(`${P.counter} ${r}/${total}`);
      drawBoard(r);
      const mk = ring(g, A.board[0], A.board[1] + 2); mk.visible = true;
      await waitInteract(ctx, { pos: a.at(A.board[0], A.board[1] + 2), label: '물때표 보기', r: 1.6 });
      ctx.input.enabled = false;
      mk.removeFromParent();
      const B = a.at(...A.board);
      world.player.visible = false; world.setFixedCamera([B.x, 1.75, B.z + 2.3], [B.x, 1.85, B.z]); // 1인칭(2026-11-05 선생님): 내 캐릭터는 숨기고 물때표만 본다
      face(officer, world.player.position.x - a.at(0, 0).x, world.player.position.z - a.at(0, 0).z);
      await dialogue.say(R.ask);
      for (;;) {
        ctx.testHooks.choice = R.answer; // 테스트 봇이 고를 답
        const k = await dialogue.choose({ who: 'guide', text: '물이 가장 높이 차는 때는?' }, R.marks);
        ctx.testHooks.choice = null;
        hook.picks.push(k);
        drawBoard(r, k);
        if (k === R.answer) break;
        audio.play('wrong');
        await dialogue.say({ who: 'guide', text: `× ${P.wrong}` });
      }
      dialogue.close();
      world.player.visible = true; hook.firstPerson = (hook.firstPerson || 0) + 1;
      audio.play('correct'); toast(ctx, `○ ${R.marks[R.answer]} 물이 가득 차요`, 'good');
      if (r === 0) { // 물이 차오르고 상륙정이 월미도로
        shore();
        await wait(world, 1.4, k => level(ease(k)));
        hook.high += 1;
        await sail(toIsle, 2.6);
        for (const l of R.done) await dialogue.say(l);
        dialogue.close();
        // 물이 빠지면 갯벌이 드러나고 상륙정이 갯벌에 걸린다
        await wait(world, 1.6, k => level(1 - ease(k)));
        hook.ebb = true;
        for (const l of P.ebb) await dialogue.say(l);
        dialogue.close();
      } else {
        shore();
        await wait(world, 1.4, k => level(ease(k)));
        hook.high += 1;
        for (const l of R.done) await dialogue.say(l);
        dialogue.close();
      }
      world.camMode = 'follow';
    }
    // 돛대에서 상륙 신호를 올린다
    hud.setCounter(`${P.counter} ${P.rounds.length}/${total}`);
    const mk = ring(g, mx, mz + 1.4); mk.visible = true;
    await waitInteract(ctx, { pos: a.at(mx, mz + 1.4), label: P.signal.act, r: 1.4 });
    ctx.input.enabled = false;
    mk.removeFromParent();
    const M = a.at(mx, mz); world.setFixedCamera([M.x - 3, 2.6, M.z + 5], [M.x, 3.6, M.z]);
    audio.play('tap');
    await wait(world, 1.2, k => { sig.position.y = 1.2 + 4.4 * ease(k); });
    hook.signal = true;
    shore();
    await sail(toWall, 3);
    wallView();
    ladders.forEach(l => { l.visible = true; });
    climbers.forEach(p => { p.visible = true; });
    const z0s = climbers.map(p => p.position.z), top = hook.ladderTop;
    await wait(world, 3.4, k => climbers.forEach((p, i) => {
      const u = Math.min(1, Math.max(0, (k - (i >> 1) * 0.35) / 0.55)), x0 = p.position.x;
      const w = Math.min(1, u * 3), c = Math.max(0, (u - 0.33) / 0.67); // 사다리 밑까지 걷고 → 사다리를 따라 오른다 → 방파제 위로
      const zb = A.wall + 2.0, z = c < 0.9 ? (z0s[i] + (zb - z0s[i]) * w) + (top + 0.3 - zb) * (c / 0.9) : top + 0.3 - (top + 0.3 - (A.wall - 0.3)) * ((c - 0.9) / 0.1);
      p.position.set(x0, 2.8 * Math.min(1, c / 0.9), z);
      if (u >= 1 && !p.userData.up) { p.userData.up = true; hook.climbed += 1; }
    }));
    for (const l of P.signal.lines) await dialogue.say(l);
    hud.setCounter(`${P.counter} ${total}/${total}`);
    audio.play('correct');
    for (const l of P.done) await dialogue.say(l);
    dialogue.close();
    void isle;
  } finally {
    offRock();
    ctx.testHooks.choice = null; world.player.visible = true;
    await leaveArena(ctx, a);
  }
  return true;
}

// ── 놀이 ②: 되찾은 서울에 태극기 올리기. 깃대 줄을 여러 번 당기면 태극기가 올라가고, 시민들이 나와 만세 ──
export async function seoulPlay(ctx) {
  const { world, dialogue, hud, audio } = ctx;
  const P = script.parts.seoul, A = RUINS;
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  // 무너진 벽돌 더미
  A.rubble.forEach(([x, z, r], i) => {
    for (let k = 0; k < 7; k++) { const s = 0.4 + ((i * 7 + k) % 3) * 0.2, m = blk(g, s * 1.6, s, s, k % 2 ? 0x8a4a3a : 0x9a948a, x + Math.sin(k * 2.3) * r * 0.6, s / 2 + (k > 4 ? 0.35 : 0), z + Math.cos(k * 1.7) * r * 0.5, 'stone'); m.rotation.y = k; }
  });
  const [px, pz] = A.pole;
  blk(g, 1.6, 0.3, 1.6, 0x9a948a, px, 0.15, pz, 'stone');
  blk(g, 0.12, 7, 0.12, 0x5a5e62, px, 3.5, pz, 'stone');
  const flag = flagMesh(1.4, 0.95); flag.position.set(px + 0.07, 0.9, pz); g.add(flag);
  const hook = ctx.testHooks.seoul = { pulls: 0, flagY: 0, people: 0, cheers: 0, facing: 0 };
  const looks = ['citizen', 'woman', 'grandma', 'kidModern', 'student', 'gentleman', 'schoolgirl', 'citizen', 'woman', 'rokSoldier', 'unSoldier', 'peasant'];
  const crowd = looks.map((look, i) => { const x = (i % 2 ? 1 : -1) * 9, z = -6 + i; const p = person(g, look, x, z, 0); p.visible = false; if (!/Soldier/.test(look)) holdFlag(p); return p; });
  const spots = crowd.map((_, i) => [-4 + (i % 6) * 1.6 + (Math.floor(i / 6) % 2) * 0.6, -3.6 + Math.floor(i / 6) * 1.6]);
  const p0 = a.at(...A.from); placePlayer(world, [p0.x, p0.z], Math.PI);
  const say = sayer(ctx);
  const mk = ring(g, px + 0.9, pz + 1.3, 0.7);
  try {
    await ctx.fade?.(false);
    for (const l of P.start) await dialogue.say(l);
    dialogue.close();
    mk.visible = true;
    const F = a.at(px, pz);
    for (let i = 0; i < P.pulls; i++) {
      hud.setCounter(`${P.counter} ${i}/${P.pulls}`);
      await waitInteract(ctx, { pos: a.at(px + 0.9, pz + 1.3), label: i ? `줄 당기기 ${i + 1}/${P.pulls}` : '깃대 줄 잡기', r: 1.4 });
      ctx.input.enabled = false;
      if (!i) world.setFixedCamera([F.x + 3.2, 1.8, F.z + 7.5], [F.x, 3.4, F.z]); // 깃대 남쪽 아래에서 올라가는 태극기를 본다
      audio.play('tap');
      const y0 = flag.position.y, y1 = 0.9 + (6.4 - 0.9) * (i + 1) / P.pulls;
      await wait(world, 0.45, k => { flag.position.y = y0 + (y1 - y0) * ease(k); });
      hook.pulls += 1; hook.flagY = flag.position.y;
      ctx.input.enabled = true;
    }
    ctx.input.enabled = false;
    mk.visible = false;
    hud.setCounter(`${P.counter} ${P.pulls}/${P.pulls}`);
    toast(ctx, '○ 태극기가 올라갔어요', 'good'); audio.play('correct');
    // 무너진 건물 뒤에서 시민들이 나와 깃대 앞에 모인다(깃대 쪽 카메라를 본다, D-45)
    const C = a.at(0.5, -11.6), T = a.at(0, -1.5);
    const Q = a.at(-3.4, -11.4); placePlayer(world, [Q.x, Q.z], Math.PI * 0.85); // 학생은 카메라를 가리지 않게 깃대 옆으로
    const front = () => world.setFixedCamera([C.x, 3.4, C.z], [T.x, 1.3, T.z]);
    front();
    const q0 = crowd.map(p => p.position.clone()), to = spots.map(([x, z]) => new THREE.Vector3(x, 0, z));
    // 양옆 길(x ±9)을 따라 깃대 앞 줄 높이까지 걸어온 뒤 옆으로 들어가 선다(벽돌 더미를 지나지 않게)
    const mid = q0.map((q, i) => new THREE.Vector3(q.x, 0, to[i].z));
    await wait(world, 4.2, k => crowd.forEach((p, i) => {
      const u = Math.min(1, Math.max(0, (k - i * 0.04) / 0.6));
      if (u > 0 && !p.visible) { p.visible = true; hook.people += 1; }
      const l1 = mid[i].distanceTo(q0[i]), l2 = to[i].distanceTo(mid[i]), d = ease(u) * (l1 + l2);
      const tgt = d < l1 ? mid[i] : to[i];
      if (d < l1) p.position.lerpVectors(q0[i], mid[i], l1 ? d / l1 : 1); else p.position.lerpVectors(mid[i], to[i], l2 ? (d - l1) / l2 : 1);
      if (u > 0 && u < 1) face(p, tgt.x, tgt.z);
      hook.minRubble = Math.min(hook.minRubble ?? 99, ...A.rubble.map(([x, z, r]) => Math.hypot(p.position.x - x, p.position.z - z) - r));
    }));
    crowd.forEach(p => { p.visible = true; p.rotation.y = Math.PI; });
    hook.people = crowd.length;
    hook.facing = facingShare(world, crowd);
    await say(P.end[0], crowd[0]);
    dialogue.close();
    front();
    for (let n = 0; n < 3; n++) {
      audio.play('correct');
      await wait(world, 0.9, k => crowd.forEach((p, i) => { const u = Math.sin(Math.min(1, Math.max(0, k * 1.15 - (i % 4) * 0.05)) * Math.PI); if (p.userData.carry) cheerFlag(p, u); else { const ar = p.userData.arms; if (ar) { ar[0].rotation.set(-2.6 * u, 0, 0); ar[1].rotation.set(-2.6 * u, 0, 0); } } }));
      hook.cheers += 1;
    }
    for (const l of P.end.slice(1)) await dialogue.say(l);
    dialogue.close();
  } finally {
    await leaveArena(ctx, a);
  }
  return true;
}

const base = makeKitChapter({
  id: 'h3', mood: 'overcast', script,
  player: { robe: 0x5a6448, hat: 'steel', gear: 'rifle', trim: 0x3a3f2c, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['soldier', 'unSoldier', 'refugee', 'officer'],
  spot: SPOT, // 놀이를 마치면 진지 문 앞에서 북쪽(빛나는 문)을 보고 선다
  layout: {
    // 1950년 여름 낙동강 가: 북쪽으로 흐르는 넓은 강과 강둑의 버드나무, 모래주머니를 쌓은 진지, 천막과 트럭, 둘레의 높은 산
    ground: 'grass', groundColor: 0x6a7a4c, bounds: { x0: -16, x1: 16, z0: -8, z1: 11 }, start: [0, 9], hill: 1.7,
    roads: [{ x: 0, z: 2, w: 4, d: 20, color: 0x7a6a50 }],
    props: [
      { type: 'water', x: 0, z: -24, w: 260, d: 14, color: 0x5a7a7a, river: true },
      { type: 'sandbags', x: -8, z: -9, w: 6 }, { type: 'sandbags', x: 8, z: -9, w: 6 }, { type: 'sandbags', x: 0, z: -10, w: 4 },
      { type: 'tent', x: -12, z: 7, color: 0x6b6a4a }, { type: 'tent', x: 12, z: 7, color: 0x6b6a4a }, { type: 'tent', x: -12, z: 0.5, color: 0x6b6a4a },
      { type: 'truck', x: 11, z: -1, ry: 0.3 },
      { type: 'flagpole', x: -3, z: -5.5 }, { type: 'flagpole', x: 3, z: -5.5, color: 0x5b92e5 },
      { type: 'crowd', x: -7, z: -6.5, n: 4, cols: 4, looks: ['rokSoldier', 'unSoldier'], face: Math.PI },
      { type: 'tree', x: -18, z: -11, kind: 'willow' }, { type: 'tree', x: 18, z: -11.5, kind: 'willow' }, { type: 'tree', x: 4, z: -13, kind: 'willow' },
      { type: 'woodpile', x: 15.5, z: 3 }, { type: 'tree', x: -18, z: 4, kind: 'pine' },
      { type: 'wall', x: -8.5, z: GATE_Z, w: 13, h: 1.4, color: 0x7a7458, solid: false }, { type: 'wall', x: 8.5, z: GATE_Z, w: 13, h: 1.4, color: 0x7a7458, solid: false }, // 진지 어귀 담과 문
    ],
    npcs: [
      { id: 'soldier', look: 'rokSoldier', x: -5, z: 4.5, ry: Math.PI * 0.8 },
      { id: 'unSoldier', look: 'unSoldier', x: 6.5, z: 4.5, ry: -Math.PI * 0.6 },
      { id: 'refugee', look: 'citizen', x: -7.5, z: 9.6, ry: Math.PI * 0.7 },
      { id: 'officer', look: 'rokSoldier', x: 0, z: -2.5, ry: 0 },
    ],
    // 길 위 안내판 대신 천막 간판(C-03): 「국군 진지」·「유엔군 진지」. 안내판 글(유엔군·낙동강 방어선)은 대사·장면으로 옮겼다
    signs: [{ id: 'signRok', title: '국군 진지', x: -12, z: 8.9, ry: 0, plaque: { y: 1.7, back: 0 } },
      { id: 'signUN', title: '유엔군 진지', x: 12, z: 8.9, ry: 0, plaque: { y: 1.7, back: 0 } }],
    scatter: [{ kind: 'pine', count: 40, area: { x0: -70, x1: 70, z0: 18, z1: 50 }, seed: 531 }],
  },
  parts: [
    { ...script.parts.tide, ownDone: true, goal: script.goals[3], play: ctx => tidePlay(ctx) },
    { ...script.parts.seoul, goal: script.goals[4], intro: meet('soldier', '국군 병사와 이야기하기', script.parts.seoul.intro), play: ctx => seoulPlay(ctx) },
  ],
  decorate(world) {
    const gate = gateLeaves(world.level, { x: 0, z: GATE_Z, width: 4, height: 2.6, inward: -1 });
    const board = nameBoard(world.level, '낙동강 진지', 3.2, GATE_Z - 1.6);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return { gate, board };
  },
});

// 장 도입(C-03): ① 탱크를 앞세워 38도선을 넘어 내려오는 북한군(2026-11-05 선생님) ② 낙동강까지 물러난 국군과 피란민, 지도에 밀려 내려간 길. 끝나면 더한 것을 치운다
function introScene(ctx) {
  const { world } = ctx, L = world.level, offs = [];
  const add = (look, x, z, ry) => { const p = person(L, look, x, z, ry); p.visible = false; return p; };
  const line = new THREE.Mesh(new THREE.BoxGeometry(14, 0.04, 0.12), new THREE.MeshBasicMaterial({ color: 0xd9a441 })); line.position.set(0, 0.05, 1.6); line.visible = false; L.add(line); // 38도선
  const tanks = [[-2.6, -5.5], [2.8, -7.5]].map(([x, z]) => { const t = tank(L, x, z); t.visible = false; return t; });
  const north = [-3.6, -1.8, 0, 1.8, 3.6].map((x, i) => add('nkSoldier', x * 1.1, -9.5 - (i % 2) * 1.2, 0));
  const south = [-1.6, 0, 1.6].map((x, i) => add('rokSoldier', x * 1.2, 3.6 + (i % 2) * 0.8, 0));
  const folk = [[-2.6, 4.6, 'refugee'], [2.6, 4.4, 'woman'], [0.9, 5.2, 'grandma']].map(([x, z, l]) => add(l === 'refugee' ? 'citizen' : l, x, z, 0));
  let map = null;
  const hide = on => { for (const id of [...PEOPLE, 'officer']) { const n = world.npcs.get(id); if (n) n.mesh.visible = on; } };
  const all = [line, ...tanks, ...north, ...south, ...folk];
  const show = list => { for (const o of all) o.visible = list.includes(o); };
  return {
    shots: [
      { cam: [7.5, 3.4, 9.5], look: [0, 1, -1], to: { cam: [6.5, 3.2, 8.5], look: [0, 1, 0] }, act: () => {
        hide(false); show([line, ...tanks, ...north]);
        offs.push(world.onUpdate(dt => { tanks.forEach(t => { t.position.z += dt * 1.6; }); north.forEach(p => { p.position.z += dt * 1.6; }); })); // 탱크를 앞세워 남쪽으로 밀고 내려온다
      } },
      { cam: [0.6, 2.2, 9.5], look: [-1.4, 1.2, 4], to: { cam: [0.4, 2.2, 9], look: [-1.4, 1.2, 4] }, act: () => {
        offs.forEach(f => f()); offs.length = 0; show([...south, ...folk]);
        map = warMap(ctx.ui, { stops: RETREAT }); if (ctx.testHooks) ctx.testHooks.warMap = RETREAT.length;
        if (map) offs.push(playWarMap(map, world, 3.2)); // 38도선 → 서울 → 대전 → 낙동강
      } },
    ],
    done: () => { offs.forEach(f => f()); map?.remove(); hide(true); for (const o of all) o.removeFromParent(); },
  };
}

let scene = null;
export const villageTalk = (id, heard) => anyOrderTalk(script, PEOPLE, id, heard);
export const devScene = () => scene; // 개발용(사진 찍기)

export default {
  ...base,
  anyOrder: true, // 진지 사람은 아무 차례로(차례 전 대사 tooEarly가 없다, tests/quest.test.js)
  introScene,
  portal: { at: [0, 3.4], ry: 0 }, // 미니게임 뒤 빛나는 문(C-02): 돌아온 학생(SPOT) 바로 앞
  buildScene(world) { scene = base.buildScene(world); return scene; },
  enterStage(ctx, stage) { scene.gate.setOpen(0); ctx.world.closeView = true; base.enterStage(ctx, stage); },
  // 모두 들은 뒤 지휘관에게 가면 학생의 결심 → 부산 항구에 도착한 유엔군
  async explore(ctx) {
    await walkInAndTalk(ctx, script, { people: PEOPLE, final: 'officer', gate: scene.gate, from: INTRO_FROM, to: base.layout.start });
    await arrivalScene(ctx);
  },
  minigame: ctx => minigameWithMeet(base, ctx),
};
