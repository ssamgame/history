// 근대편 6장 「을사늑약과 나라를 지키려는 노력」(D-35): 1905년 한성 거리. 왼쪽은 솔숲 산자락의 의병 진지, 오른쪽은 학교와 신문사.
// 마을 어귀 문으로 들어와 학생·의병·신문 읽는 선비 이야기를 아무 차례로 듣고(모두 들어야 안창호),
// 안창호에게 가면 학생의 결심 → 을사늑약 소식에 사람들이 신문사 앞에 모이고 큰길 가게가 판자 덧문을 닫는 장면 →
// ① 두 갈래 길(애국 계몽 길: 학교 수업·신문 찍기·우리 물건 가게 / 의병 길: 해산된 군인 맞이·연합 부대 출정)
// ② 의병에게 말을 걸면 한성으로 가는 고갯길 매복 ③ 다시 의병에게 말을 걸면 강가 나룻배까지 걸어가 만주·연해주로 떠나보냄
// ④ 학생에게 말을 걸면 헤이그 특사 이정표 걷기.
import * as THREE from 'three';
import { makeKitChapter } from '../../kit/chapter.js';
import { buildArena, labelSprite } from '../../kit/play.js';
import { wait, person, ease, face, stationMarks, walkStations, classroom, meet, minigameWithMeet } from '../../kit/walk.js';
import { BUILD } from '../../kit/town.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { walkInAndTalk, anyOrderTalk } from '../../kit/talk.js';
import { setCarry, mat } from '../../../core/people.js';
import { placePlayer } from '../../joseon/common.js';
import script from './script.js';

const PEOPLE = ['student', 'uibyeong', 'reader'];
const GATE_Z = 14.5, INTRO_FROM = [0, 17.5], SPOT = [0, 7];
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
// 해산된 대한 제국 군인(짙은 군복·모자·총)
const SOLDIER = { robe: 0x2f3540, hat: 'cap', gear: 'rifle', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } };

// ── 마을 ──
const SCHOOL = { x: 9, z: -8, w: 9, d: 5, h: 5 }, PRESS = { x: -1, z: -9, w: 5 }; // 학교(뾰족탑), 신문사(2층 상점)
const SHOPS = [[-12.5, 9.5], [12.5, 9.5]]; // 마을 어귀 큰길가 기와 가게(앞이 큰길 쪽)

// ── 무대(마을에서 떨어진 x 400) ──
const TWO_ROADS_EDGE = { style: 'forest', seed: 611 };
// 두 갈래 길: 남쪽에서 들어와 갈림길 이정표 → 오른쪽(동쪽) 애국 계몽 길(학교·신문사·우리 물건 가게) → 왼쪽(서쪽) 의병 길(진지)
export const ROADS = { edge: TWO_ROADS_EDGE,
  origin: [400, 0], ground: 'grass', groundColor: 0x6f8a56, bounds: { x0: -22, x1: 22, z0: -14, z1: 14 },
  roads: [{ x: 0, z: 11, w: 4, d: 7, color: 0x9a8a72 }, { x: 6.5, z: 7.5, w: 13, d: 3, color: 0x9a8a72 }, { x: -6.5, z: 7.5, w: 13, d: 3, color: 0x8a7a5a },
    { x: 13, z: -1, w: 3, d: 19, kind: 'stone', color: 0xa59c8a }, { x: -12, z: 0, w: 3, d: 16, color: 0x8a7a5a }],
  props: [
    { type: 'western', x: 18.5, z: 4, w: 8, d: 5, h: 5, ry: -Math.PI / 2, tower: true, color: 0x8a4a3a }, // 학교(앞이 서쪽)
    { type: 'shop', x: 18.3, z: -4, w: 5, ry: -Math.PI / 2, style: 'modern', sign: '신문사', awning: 0x3a3a44, seed: 3 },
    { type: 'shop', x: 13, z: -12.4, w: 5, sign: '우리 물건', seed: 2, awning: 0x2f6b5e },     // 우리 물건 가게(앞이 북쪽 길)
    { type: 'tent', x: -17, z: -10, color: 0xc8c0a8 }, { type: 'tent', x: -11.5, z: -12, color: 0xc8c0a8 }, // 의병 진지
    { type: 'firepit', x: -15.5, z: -5.5 }, { type: 'rifles', x: -19, z: -6 }, { type: 'woodpile', x: -19.5, z: -1 },
    { type: 'tree', x: -19, z: 6, kind: 'pine' }, { type: 'tree', x: -7, z: 12, kind: 'pine' }, { type: 'tree', x: 7, z: 12 }, { type: 'tree', x: 19.5, z: 11, kind: 'pine' },
    { type: 'lamp', x: 11, z: 9.5 },
  ],
  from: [0, 13], fork: [0, 5.4], ahn: [2.6, 9.6],
  // 걸어가 서는 자리(script.parts.roads.edu.stations, army.stations 차례)
  stations: [{ x: 13, z: 4 }, { x: 13, z: -4 }, { x: 13, z: -8.4 }, { x: -12, z: 3 }, { x: -12, z: -3 }],
  teacherAt: [15.2, 2], press: [15.4, -1.2], printer: [15.4, 0.4], stack: [15.4, -6.6], merchant: [11.4, -10.4], table: [14.8, -9.6],
};
// 만주·연해주로: 남쪽 마을에서 들어와 할머니와 인사하고, 북쪽 강가 나룻배까지 의병들과 함께 걷는다(물은 걷는 곳 밖)
export const EXILE = { edge: { style: 'forest', seed: 733, back: false },
  origin: [400, 0], ground: 'grass', groundColor: 0x6a7a4c, bounds: { x0: -16, x1: 16, z0: -14, z1: 14 },
  roads: [{ x: 0, z: 0, w: 3, d: 28, color: 0x8a7a5a }],
  props: [
    { type: 'water', x: 0, z: -70, w: 240, d: 100, color: 0x4f7f92 },
    { type: 'hanok', x: -11, z: 10, ry: 0.3 }, { type: 'hanok', x: 10.5, z: 11, tile: true, ry: -0.2 }, { type: 'jars', x: -7, z: 12 },
    { type: 'tree', x: -13, z: -6, kind: 'willow' }, { type: 'tree', x: 13, z: -9, kind: 'willow' }, { type: 'tree', x: 12, z: 2, kind: 'pine' },
    { type: 'boat', x: 9, z: -23, ry: 0.5, color: 0x6b4a32 },
  ],
  from: [0, 12], boat: [3, -22], villager: [-3.6, 4.4],
  stations: [{ x: -1.4, z: 5 }, { x: 3, z: -12.6 }],
};
const PASS = { edge: { style: 'forest', seed: 307 }, center: [{ type: 'firepit', x: -14, z: 14 }, { type: 'rifles', x: -18, z: 10 }, { type: 'woodpile', x: 15, z: 10, ry: 0.4 }], // 한성으로 가는 산속 고갯길: 양쪽 숲에 의병이 숨어 있다
  origin: [400, 0], ground: 'grass', groundColor: 0x55703f, bounds: { x0: -30, x1: 30, z0: -30, z1: 30 },
  roads: [{ x: 0, z: 0, w: 5, d: 70, color: 0x7a6a50 }],
  props: [
    { type: 'tree', x: -8, z: -18, color: 0x34503a }, { type: 'tree', x: -10, z: -6, color: 0x34503a }, { type: 'tree', x: -8, z: 6, color: 0x34503a },
    { type: 'tree', x: 8, z: -14, color: 0x34503a }, { type: 'tree', x: 10, z: -2, color: 0x34503a }, { type: 'tree', x: 8, z: 10, color: 0x34503a },
    { type: 'crowd', x: -14, z: 4, n: 4, cols: 2, looks: ['uibyeong'], face: Math.PI / 2 }, { type: 'crowd', x: 13, z: -4, n: 3, cols: 1, looks: ['uibyeong'], face: -Math.PI / 2 },
  ],
};
const HAGUE = { edge: { style: 'brick', seed: 207 }, center: [{ type: 'lamp', x: -14, z: 4 }, { type: 'lamp', x: 14, z: 4 }, { type: 'lamp', x: -14, z: -8 }, { type: 'lamp', x: 14, z: -8 }, { type: 'lamp', x: 7, z: 7 }, { type: 'lamp', x: 9, z: 0 }], // 헤이그 회의장 앞
  origin: [400, 0], ground: 'stone', groundColor: 0xb0a890, bounds: { x0: -20, x1: 20, z0: -12, z1: 14 },
  props: [
    { type: 'western', x: 0, z: -14, w: 18, d: 5, h: 8, dome: true, color: 0xc8b8a0 },
  ],
};

let scene = null;

// 판자 덧문: 가게 앞(x, z, 앞이 -z)에 판자가 하나씩 내려와 닫힌다. 돌려준 함수에 0~1을 주면 그만큼 닫힌다
function shutters(g, x, z, w = 4.4) {
  const n = 5, boards = [];
  for (let i = 0; i < n; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w / n - 0.04, 2.1, 0.07), mat(0xb08a5a, 'wood', 'object')); // 가게 안보다 밝은 새 판자
    b.position.set(x - w / 2 + (i + 0.5) * (w / n), 1.35, z); b.visible = false; b.castShadow = true; g.add(b); boards.push(b);
  }
  return k => boards.forEach((b, i) => { const u = Math.max(0, Math.min(1, k * n - i)); b.visible = u > 0; b.scale.y = Math.max(0.01, u); b.position.y = 2.4 - 1.05 * u; });
}
const sheet = () => new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.02, 0.44), new THREE.MeshLambertMaterial({ color: 0xf2ecd8 }));

// ── 탐험 끝 을사늑약 소식 장면: 신문사 앞에 사람들이 모여 선비가 펼친 신문을 들여다보고, 큰길 가게 주인들이 판자 덧문을 닫는다 ──
export async function newsScene(ctx) {
  const { world, dialogue } = ctx;
  const L = script.news.lines;
  ctx.setGoal(script.goals[2]);
  world.closeView = true;
  await ctx.fade?.(true);
  const g = new THREE.Group(); g.name = 'k6News'; world.level.add(g);
  const hook = ctx.testHooks.news = { crowd: 0, paper: false, shut: 0 };
  const reader = world.npcs.get('reader'), R = reader.mesh.position;
  placePlayer(world, [R.x + 2.6, R.z + 3.4], -2.4);
  face(reader.mesh, world.player.position.x, world.player.position.z);
  const paper = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.62, 0.02), new THREE.MeshLambertMaterial({ color: 0xf2ecd8 })); // 펼쳐 든 신문
  paper.position.set(0, 1.35, 0.42); paper.rotation.x = -0.35; reader.mesh.add(paper); hook.paper = true;
  const crowd = [['citizen', -1.8, 1.4], ['woman', -1.1, 2.2], ['commoner', 0.2, 2.6], ['student', 1.4, 2.1], ['gentleman', 2.0, 1.1], ['grandma', -2.4, 0.3]]
    .map(([look, dx, dz]) => { const p = person(g, look, R.x + dx, R.z + dz); face(p, R.x, R.z); return p; });
  hook.crowd = crowd.length;
  const closers = SHOPS.map(([x, z]) => shutters(g, x, z - 2.05)); // 좌판 앞
  const merchant = person(g, 'commoner', SHOPS[1][0] - 3.3, SHOPS[1][1] - 2.6, Math.PI); // 덧문이 다 보이게 가게 옆에 선다
  try {
    world.setFixedCamera([R.x + 3.2, 3.0, R.z + 6.2], [R.x - 0.3, 1.4, R.z - 0.6]); // 신문을 둘러싼 사람들 너머로 신문사
    await ctx.fade?.(false);
    await wait(world, 0.6);
    await dialogue.say(L[0]); await dialogue.say(L[1]);
    world.setTalkCamera(crowd[0]); face(crowd[0], world.player.position.x, world.player.position.z);
    await dialogue.say(L[2]);
    dialogue.close();
    const S = SHOPS[1];
    world.setFixedCamera([S[0] - 5.5, 2.1, S[1] - 9.5], [S[0] - 0.5, 1.5, S[1] - 1.6]); // 큰길 건너에서 가게 앞을
    face(merchant, S[0] - 5.5, S[1] - 9.5);
    await dialogue.say(L[3]); dialogue.close();
    await wait(world, 1.8, k => closers.forEach(c => c(ease(k))));
    hook.shut = closers.length;
    ctx.audio?.play?.('tap');
    await wait(world, 1.4); // 닫힌 덧문을 잠깐 보여 준다
    const ahn = world.npcs.get('ahnchangho');
    face(ahn.mesh, world.player.position.x, world.player.position.z);
    world.setTalkCamera(ahn.mesh);
    await dialogue.say(L[4]);
    await dialogue.say(L[5]);
    dialogue.close();
  } finally {
    await ctx.fade?.(true);
    paper.removeFromParent();
    g.removeFromParent();
    world.setMood(base.mood);
    placePlayer(world, SPOT);
    world.camMode = 'follow'; world.snapCamera();
    ctx.input.enabled = false;
    await ctx.fade?.(false);
  }
}

// ── 두 갈래 길의 체험 자리 ──
function printingPress(g, x, z) { // 나무 인쇄기: 손잡이를 내리면 누름판이 내려와 종이를 찍는다(앞이 서쪽)
  const p = new THREE.Group(); p.position.set(x, 0, z); p.rotation.y = -Math.PI / 2; g.add(p);
  const W = (w, h, d, bx, by, bz, color = 0x6b4a32) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, 'wood', 'object')); m.position.set(bx, by, bz); m.castShadow = true; p.add(m); return m; };
  W(1.6, 0.8, 1.0, 0, 0.4, 0); W(1.4, 0.06, 0.8, 0, 0.83, 0, 0x2a1e18);
  for (const s of [-1, 1]) W(0.14, 2.4, 0.14, s * 0.7, 1.2, 0);
  W(1.6, 0.18, 0.2, 0, 2.35, 0);
  const platen = W(1.1, 0.12, 0.7, 0, 1.6, 0, 0x5a3f2a);
  const lever = new THREE.Group(); lever.position.set(0, 2.1, 0); p.add(lever);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), mat(0x3a2c20)); arm.rotation.z = Math.PI / 2; arm.position.x = 0.6; lever.add(arm);
  return { group: p, platen, lever };
}
function goodsTable(g, x, z) {
  const t = new THREE.Group(); t.position.set(x, 0, z); g.add(t);
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.8), mat(0x7a5a3c, 'wood', 'object')); top.position.y = 0.85; t.add(top);
  for (const [sx, sz] of [[-0.8, -0.33], [0.8, -0.33], [-0.8, 0.33], [0.8, 0.33]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.85, 0.07), mat(0x5a3f2a, 'wood', 'object')); l.position.set(sx, 0.42, sz); t.add(l); }
  return t;
}
const GOODS = [ // 우리 손으로 만든 물건: 옷감 두루마리·항아리·짚신
  () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.7, 10), mat(0xe8dcc0, 'cloth')); m.rotation.z = Math.PI / 2; return m; },
  () => new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mat(0x6b3a22)),
  () => new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.14), mat(0xc8a868, 'thatch')),
];

const ACT = {
  async school({ ctx, a, g, st, say, hook }) {
    const { world } = ctx;
    await ctx.fade?.(true);
    const room = classroom(g, 3, -4), O = a.at(3, -4);
    placePlayer(world, [O.x + 2.6, O.z + 3.6], Math.PI);
    hook.classroom = room.kids.length;
    const view = () => world.setFixedCamera([O.x - 1.2, 5.4, O.z + 7.5], [O.x, 1.3, O.z - 2.2]); // 학생들 머리 너머로 선생님과 칠판
    view();
    await ctx.fade?.(false);
    await say(st.lines[0], room.teacher);
    view();
    await say(st.lines[1]);
    ctx.dialogue.close();
    await ctx.fade?.(true);
    room.group.removeFromParent();
    const back = a.at(ROADS.stations[0].x, ROADS.stations[0].z);
    placePlayer(world, [back.x, back.z], Math.PI);
    await ctx.fade?.(false);
  },
  async press({ ctx, a, g, st, say, hook, set }) {
    const { world } = ctx;
    await say(st.lines[0], set.printer);
    ctx.dialogue.close();
    const P = a.at(...ROADS.press);
    world.player.rotation.y = -Math.PI / 2;
    world.setFixedCamera([P.x - 4.2, 3.2, P.z + 3.4], [P.x + 0.2, 1.4, P.z - 1.6]);
    const S = ROADS.stack;
    for (let i = 0; i < 3; i++) { // 세 번 눌러 세 장을 찍어 옆에 쌓는다
      await wait(world, 0.5, k => { const u = Math.sin(k * Math.PI); set.press.lever.rotation.z = -0.5 * u; set.press.platen.position.y = 1.6 - 0.66 * u; });
      ctx.audio?.play?.('tap');
      const sh = sheet(); g.add(sh);
      const from = new THREE.Vector3(ROADS.press[0], 0.9, ROADS.press[1]), to = new THREE.Vector3(S[0], 0.92 + i * 0.03, S[1]);
      await wait(world, 0.45, k => { sh.position.lerpVectors(from, to, k); sh.position.y += Math.sin(k * Math.PI) * 0.8; });
      hook.printed += 1;
    }
    await say(st.lines[1]);
  },
  async goods({ ctx, a, g, st, say, hook, set }) {
    const { world } = ctx;
    await say(st.lines[0], set.merchant);
    const T = ROADS.table, items = [];
    for (const [i, make] of GOODS.entries()) { // 가게 주인이 진열대에 물건을 하나씩 내놓는다
      const m = make(); m.position.set(T[0] - 0.55 + i * 0.55, 1.02, T[1]); g.add(m); items.push(m); hook.goods += 1;
      ctx.audio?.play?.('tap'); await wait(world, 0.3);
    }
    const roll = GOODS[0](); setCarry(world.player, roll, 'arms'); // 옷감 두루마리를 받아 든다
    ctx.audio?.play?.('correct');
    const pp = world.player.position, TT = a.at(...T);
    world.setFixedCamera([pp.x - 3.2, 2.6, pp.z + 3.2], [(pp.x + TT.x) / 2, 1.1, (pp.z + TT.z) / 2]);
    await say(st.lines[1]);
    setCarry(world.player, null);
  },
  async soldiers({ ctx, a, st, say, hook, set }) {
    const { world } = ctx;
    const C = a.at(-15, -2);
    world.player.rotation.y = -Math.PI * 0.75;
    world.setFixedCamera([C.x + 9, 4.2, C.z + 9.5], [C.x - 1, 1.2, C.z - 1]); // 의병 진지로 걸어 들어오는 군인들
    set.soldiers.forEach(p => { p.visible = true; });
    const from = set.soldiers.map(p => p.position.clone()), to = set.soldierTo.map(([x, z]) => new THREE.Vector3(x, 0, z));
    set.soldiers.forEach((p, i) => face(p, to[i].x, to[i].z));
    await say(st.lines[0]);
    ctx.dialogue.close();
    await wait(world, 3.2, k => set.soldiers.forEach((p, i) => p.position.lerpVectors(from[i], to[i], ease(k))));
    set.soldiers.forEach(p => face(p, set.camp[0].position.x, set.camp[0].position.z));
    set.camp.forEach(p => face(p, -14.5, -3));
    hook.soldiers = set.soldiers.length;
    await say(st.lines[1], set.soldiers[0]);
    await say(st.lines[2], set.camp[0]);
  },
  async march({ ctx, a, g, st, say, hook, set }) {
    const { world } = ctx;
    await ctx.fade?.(true);
    const army = [...set.camp, ...set.soldiers]; // 의병과 해산된 군인이 줄을 맞춰 선다(연합 부대)
    const extra = ['uibyeong', 'peasant', 'uibyeong', SOLDIER].map(l => person(g, l, 0, 0));
    const all = [...army, ...extra];
    all.forEach((p, i) => { p.position.set(-8.5 + (i % 5) * 1.3, 0, -6 - Math.floor(i / 5) * 1.4); p.rotation.y = Math.PI / 2; });
    for (const z of [-4.6, -9.6]) { const b = new THREE.Group(); b.position.set(-2.4, 0, z); BUILD.banner(b, { text: '倡義' }); g.add(b); }
    hook.army = all.length;
    const M = a.at(-6, -7);
    world.player.rotation.y = Math.PI / 2;
    world.setFixedCamera([M.x + 6.5, 3.8, M.z + 7], [M.x - 0.5, 1.3, M.z]);
    await ctx.fade?.(false);
    await say(st.lines[0], set.camp[0]);
    world.setFixedCamera([M.x + 6.5, 3.8, M.z + 7], [M.x - 0.5, 1.3, M.z]);
    await say(st.lines[1]);
    await say(st.lines[2]);
  },
};

function signpost(g, [x, z], { edu, army }) { // 갈림길 이정표: 오른쪽 애국 계몽 길, 왼쪽 의병 길
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.6, 0.16), mat(0x6b4a32, 'wood', 'object')); post.position.set(x, 1.3, z); post.castShadow = true; g.add(post);
  for (const [s, text] of [[1, `${edu} →`], [-1, `← ${army}`]]) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.34, 0.06), mat(0x8a6a48, 'wood', 'object')); board.position.set(x + s * 0.7, s > 0 ? 2.25 : 1.8, z); g.add(board);
    const lab = labelSprite(text, { size: 0.7 }); lab.position.set(x + s * 1.6, s > 0 ? 3.0 : 2.5, z); g.add(lab);
  }
}

export async function twoRoads(ctx) {
  const { world, dialogue, hud } = ctx;
  const P = script.parts.roads, A = ROADS, stations = [...P.edu.stations, ...P.army.stations];
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  signpost(g, A.fork, P.fork);
  const hook = ctx.testHooks.roads = { used: [], pressed: 0, signpost: true, classroom: 0, printed: 0, goods: 0, soldiers: 0, army: 0 };
  const press = printingPress(g, ...A.press);
  world.addCollider({ ...a.at(...A.press), r: 1.0 }); // 무대를 치우면 함께 치운다
  goodsTable(g, ...A.table); world.addCollider({ ...a.at(...A.table), r: 0.9 });
  const stackTable = goodsTable(g, ...A.stack); world.addCollider({ ...a.at(...A.stack), r: 0.9 }); stackTable.scale.setScalar(0.8);
  const printer = person(g, 'worker', ...A.printer, -Math.PI / 2);
  const merchant = person(g, 'commoner', ...A.merchant, 0);
  person(g, 'scholarModern', ...A.teacherAt, -Math.PI / 2);
  const ahn = person(g, 'ahnchangho', ...A.ahn, Math.PI);
  const camp = [[-16.5, -7.4], [-15.2, -8.2], [-13.9, -7.4], [-12.8, -8.4]].map(([x, z]) => person(g, 'uibyeong', x, z, Math.PI / 2));
  const soldiers = [[-21, 12], [-21.8, 13.2], [-20.2, 13.4], [-21.2, 14.6]].map(([x, z]) => { const p = person(g, SOLDIER, x, z); p.visible = false; return p; });
  const soldierTo = [[-16.6, -2.6], [-15.4, -3.2], [-14.2, -2.6], [-13, -3.2]];
  const marks = stationMarks(a, g, stations, A.stations);
  const p0 = a.at(...A.from); placePlayer(world, [p0.x, p0.z]);
  const set = { press, printer, merchant, camp, soldiers, soldierTo };
  const say = async (line, who = null) => {
    if (who) { const m = who.getWorldPosition(new THREE.Vector3()), pp = world.player.position; who.rotation.y = Math.atan2(pp.x - m.x, pp.z - m.z); world.setTalkCamera({ position: m }); } // 말하는 사람 얼굴을 정면에서
    await dialogue.say(line);
  };
  try {
    await ctx.fade?.(false);
    await walkStations(ctx, {
      stations, marks, counter: '겪어 본 노력',
      async between(i) { // 계몽 길을 다 걸으면 정리하고, 갈림길의 안창호가 의병 길로 보낸다
        if (i !== P.edu.stations.length) return;
        await dialogue.say(P.edu.sum);
        const pp = world.player.position, m = ahn.getWorldPosition(new THREE.Vector3());
        ahn.rotation.y = Math.atan2(pp.x - m.x, pp.z - m.z);
        world.setTalkCamera({ position: m });
        await dialogue.say(P.edu.turn);
        dialogue.close();
        world.camMode = 'follow';
      },
      async act(st) { hook.pressed += 1; await ACT[st.id]({ ctx, a, g, st, say, hook, set }); hook.used.push(st.id); },
    });
  } finally {
    await ctx.fade?.(true);
    hud.setCounter(null);
    setCarry(world.player, null);
    a.dispose();
    placePlayer(world, SPOT);
    world.camMode = 'follow'; world.snapCamera();
    ctx.input.enabled = false;
    await ctx.fade?.(false);
  }
}

// ── 만주·연해주로: 의병 셋이 학생 뒤를 따라 걷고, 할머니와 인사한 뒤 강가에서 나룻배에 올라 강 건너로 떠난다 ──
export async function exileWalk(ctx) {
  const { world, dialogue, hud } = ctx;
  const P = script.parts.exile, A = EXILE;
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  const villager = person(g, 'grandma', ...A.villager, Math.PI / 2);
  const boat = new THREE.Group(); boat.position.set(A.boat[0], 0.1, A.boat[1]); BUILD.boat(boat, { len: 4.6, color: 0x7a5a3c }); g.add(boat);
  const followers = [0, 1, 2].map(i => person(g, 'uibyeong', A.from[0] - 1 + i, A.from[1] + 1.8));
  const hook = ctx.testHooks.exile = { used: [], followers: followers.length, sailed: false };
  const marks = stationMarks(a, g, P.stations, A.stations);
  const p0 = a.at(...A.from); placePlayer(world, [p0.x, p0.z]);
  const O = a.at(0, 0), tmp = new THREE.Vector3();
  const offFollow = world.onUpdate(dt => followers.forEach((f, i) => { // 학생 뒤로 한 줄로 따라온다(다리는 공용 걷기가 움직인다)
    if (!f.visible) return;
    const pp = world.player.position, back = 1.6 + i * 1.3, ry = world.player.rotation.y;
    tmp.set(pp.x - O.x - Math.sin(ry) * back + (i - 1) * 0.6, 0, pp.z - O.z - Math.cos(ry) * back);
    const dx = tmp.x - f.position.x, dz = tmp.z - f.position.z, d = Math.hypot(dx, dz);
    if (d > 0.3) { const s = Math.min(d, dt * 3.4); f.position.x += dx / d * s; f.position.z += dz / d * s; f.rotation.y = Math.atan2(dx, dz); }
  }));
  const say = async (line, who = null) => {
    if (who) { const m = who.getWorldPosition(new THREE.Vector3()), pp = world.player.position; who.rotation.y = Math.atan2(pp.x - m.x, pp.z - m.z); world.setTalkCamera({ position: m }); }
    await dialogue.say(line);
  };
  try {
    await ctx.fade?.(false);
    await walkStations(ctx, {
      stations: P.stations, marks, counter: '지난 곳',
      async act(st) {
        if (st.id === 'farewell') { await say(st.lines[0], villager); await say(st.lines[1], followers[0]); }
        else {
          await ctx.fade?.(true); // 의병들이 나룻배에 올라 앉는다
          followers.forEach((f, i) => { f.visible = false; const s = person(boat, 'uibyeong', 0, -1.2 + i * 1.1, Math.PI); s.position.y = 0.25; });
          const B = a.at(A.boat[0], A.boat[1]);
          world.player.rotation.y = Math.PI;
          world.setFixedCamera([B.x + 5.5, 3.6, B.z + 13], [B.x, 0.8, B.z - 6]);
          await ctx.fade?.(false);
          await say(st.lines[0]);
          dialogue.close();
          const z0 = A.boat[1];
          await wait(world, 3.6, k => { boat.position.z = z0 - 22 * ease(k); boat.rotation.z = Math.sin(k * 18) * 0.03; });
          hook.sailed = true;
          await say(st.lines[1]);
          await say(P.sum);
        }
        hook.used.push(st.id);
      },
    });
  } finally {
    offFollow();
    await ctx.fade?.(true);
    hud.setCounter(null);
    a.dispose();
    placePlayer(world, SPOT);
    world.camMode = 'follow'; world.snapCamera();
    ctx.input.enabled = false;
    await ctx.fade?.(false);
  }
}

const base = makeKitChapter({
  id: 'k6', mood: 'overcast', script,
  player: { robe: 0x22262e, hat: 'cap', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['student', 'uibyeong', 'reader', 'ahnchangho'],
  spot: SPOT, // 놀이를 마치면 큰길 앞에서 북쪽(빛나는 문·학교)을 보고 선다
  layout: {
    // 1905년 한성: 왼쪽은 솔숲 산자락의 의병 진지(천막·장작), 오른쪽은 학교와 신문사, 마을 어귀 큰길가에 기와 가게. 뒤로 높은 산
    ground: 'grass', groundColor: 0x6f8a56, bounds: { x0: -16, x1: 16, z0: -8, z1: 11 }, start: [0, 9], hill: 1.8,
    roads: [{ x: 0, z: 3, w: 36, d: 5, color: 0x9a8a72 }, { x: 0, z: 8, w: 4, d: 14 }, { x: 10, z: -4.5, w: 12, d: 4, kind: 'stone', color: 0xa59c8a }],
    props: [
      { type: 'western', x: SCHOOL.x, z: SCHOOL.z, w: SCHOOL.w, d: SCHOOL.d, h: SCHOOL.h, color: 0x8a4a3a, tower: true },
      { type: 'desk', x: 6, z: -3.5 }, { type: 'desk', x: 12, z: -3.5 },
      { type: 'shop', x: PRESS.x, z: PRESS.z, w: PRESS.w, style: 'modern', awning: 0x3a3a44, seed: 3 },
      { type: 'tent', x: -13, z: -5, color: 0xc8c0a8 }, { type: 'tent', x: -9, z: -7, color: 0xc8c0a8 }, { type: 'woodpile', x: -15.5, z: -1 },
      { type: 'crowd', x: -13, z: 0, n: 6, cols: 3, looks: ['uibyeong', 'peasant', 'uibyeong'], face: Math.PI / 2 },
      { type: 'tree', x: -17, z: -8, kind: 'pine' }, { type: 'tree', x: -6, z: -9.5, kind: 'pine' }, { type: 'tree', x: -17.5, z: 6, kind: 'pine' },
      ...SHOPS.map(([x, z], i) => ({ type: 'shop', x, z, w: 5, ry: Math.PI, seed: 2 + i * 3, awning: i ? 0x8a2f24 : 0x2f6b5e })),
      { type: 'tree', x: 17, z: 0 }, { type: 'lamp', x: 4, z: -1.5 },
      { type: 'wall', x: -8.5, z: GATE_Z, w: 13, h: 1.8, solid: false }, { type: 'wall', x: 8.5, z: GATE_Z, w: 13, h: 1.8, solid: false }, // 마을 어귀 담
    ],
    npcs: [
      { id: 'student', look: 'student', x: 5, z: 6.5, ry: -Math.PI * 0.8 },
      { id: 'uibyeong', look: 'uibyeong', x: -8, z: -1.5, ry: Math.PI / 2 },
      { id: 'reader', look: 'scholarModern', x: -2.5, z: -4.8, ry: 0 },
      { id: 'ahnchangho', look: 'ahnchangho', x: 8.5, z: -1, ry: 0 },
    ],
    // 길 위 안내판 대신 건물 간판(C-03): 뾰족탑 건물 「학교」, 2층 상점 「신문사」. 안내판 글(헤이그 특사·신문·안중근)은 사람 대사·놀이로 옮겼다
    signs: [{ id: 'signSchool', title: '학교', x: SCHOOL.x + 2, z: SCHOOL.z + SCHOOL.d / 2 + 0.5, ry: 0, plaque: { y: 4.3, back: 0.42 } },
      { id: 'signPress', title: '신문사', x: PRESS.x, z: PRESS.z + 2, ry: 0, plaque: { y: 4.75, back: 0.45 } }],
    scatter: [{ kind: 'pine', count: 40, area: { x0: -60, x1: -18, z0: -30, z1: 20 }, seed: 261 }],
  },
  parts: [
    { ...script.parts.roads, goal: script.goals[3], play: ctx => twoRoads(ctx) },
    { ...script.parts.hills, goal: script.goals[4], intro: meet('uibyeong', '의병과 이야기하기', script.parts.hills.intro), arena: PASS, camera: { pos: [-14, 15, 18], target: [0, 0, -2] }, path: [[0, -32], [0, 30]], zone: { x: 0, z: 0, r: 7 }, look: 'gendarme' },
    { ...script.parts.exile, goal: script.goals[5], intro: meet('uibyeong', '의병과 이야기하기', script.parts.exile.intro), play: ctx => exileWalk(ctx) },
    { ...script.parts.envoys, goal: script.goals[6], intro: meet('student', '학생과 이야기하기', script.parts.envoys.intro), arena: HAGUE, from: [0, 12], route: xy(script.parts.envoys.route, [{ x: -6, z: 7 }, { x: 6, z: 3 }, { x: -6, z: -1 }, { x: 0, z: -7 }]) },
  ],
  // 마을 어귀 나무 문과 「한성」 이름판(S51)은 굳히기에 합쳐지지 않게 돌려준다
  decorate(world) {
    const gate = gateLeaves(world.level, { x: 0, z: GATE_Z, width: 4, height: 2.6, inward: -1 });
    const board = nameBoard(world.level, '한성', 3.2, GATE_Z - 1.6);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return { gate, board };
  },
});

// 장 도입(C-03): ① 러시아와의 전쟁에서 이긴 일본군이 한성 큰길로 줄지어 들어온다 ② 학교 앞 탁자에 조약 문서가 놓이고 일본군이 둘러선다. 끝나면 더한 것을 치운다
function introScene(ctx) {
  const { world } = ctx, L = world.level;
  const troops = [];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) { const p = person(L, 'gendarme', 8 + i * 1.3, 2.2 + r * 1.3, -Math.PI / 2); p.visible = false; troops.push(p); }
  const doc = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.02, 0.5), new THREE.MeshLambertMaterial({ color: 0xf2ecd8 })); doc.position.set(9, 0.8, -3.5); doc.visible = false; L.add(doc);
  const table = [person(L, 'joseonOfficial', 9, -2.3, Math.PI), person(L, 'gentleman', 9, -4.7, 0)];
  const guards = [[6.6, -2.2], [11.4, -2.2], [6.6, -4.9], [11.4, -4.9]].map(([x, z]) => person(L, 'gendarme', x, z, 0));
  [...table, ...guards].forEach(p => { p.visible = false; });
  guards.forEach(p => face(p, 9, -3.5));
  let off = null;
  const run = fn => { off?.(); let t = 0; off = world.onUpdate(dt => { t += dt; fn(t, dt); }); };
  const hide = on => { for (const id of ['student', 'uibyeong', 'reader', 'ahnchangho']) { const n = world.npcs.get(id); if (n) n.mesh.visible = on; } };
  return {
    shots: [
      { cam: [-5, 2.4, 8.5], look: [2, 1.4, 2.8], to: { cam: [-3.5, 2.4, 8], look: [-1, 1.4, 2.8] },
        act: () => { hide(false); troops.forEach(p => { p.visible = true; }); run((u, dt) => troops.forEach(p => { p.position.x -= dt * 1.5; })); } }, // 일본군이 큰길로 줄지어 들어온다
      { cam: [4.5, 2.6, 2.4], look: [9, 1.2, -3.5], to: { cam: [5.2, 2.4, 1.6], look: [9, 1.1, -3.5] },
        act: () => { off?.(); off = null; troops.forEach(p => { p.visible = false; }); [doc, ...table, ...guards].forEach(p => { p.visible = true; }); } }, // 조약 문서를 둘러싼 사람들
    ],
    done: () => { off?.(); off = null; hide(true); for (const o of [...troops, doc, ...table, ...guards]) o.removeFromParent(); },
  };
}

export const villageTalk = (id, heard) => anyOrderTalk(script, PEOPLE, id, heard);
export const devScene = () => scene; // 개발용(사진 찍기)

export default {
  ...base,
  anyOrder: true, // 마을 사람은 아무 차례로(차례 전 대사 tooEarly가 없다, tests/quest.test.js)
  introScene,
  portal: { at: [0, 3.4], ry: 0 }, // 미니게임 뒤 빛나는 문(C-02): 돌아온 학생(SPOT) 바로 앞 큰길, 앞면은 학생(남쪽) 쪽
  buildScene(world) { scene = base.buildScene(world); return scene; },
  enterStage(ctx, stage) { scene.gate.setOpen(0); ctx.world.closeView = true; base.enterStage(ctx, stage); },
  // 모두 들은 뒤 안창호에게 가면 학생의 결심 → 을사늑약 소식 장면
  async explore(ctx) {
    await walkInAndTalk(ctx, script, { people: PEOPLE, final: 'ahnchangho', gate: scene.gate, from: INTRO_FROM, to: base.layout.start });
    await newsScene(ctx);
  },
  // 공용 kit 미니게임을 그대로 돌리되, { meet } 줄에서는 그 사람에게 말을 걸 때까지 기다린다(C-05, chapters/kit/walk.js)
  minigame: ctx => minigameWithMeet(base, ctx),
};
