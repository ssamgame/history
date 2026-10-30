// 일제 강점기편 2장 「3·1 운동」(D-39): 1919년 3월 1일 탑골 공원 팔각정, 태극기를 품은 사람들, 공원 담 너머 태화관.
// 공원 문으로 들어와 학생·유관순·상인 이야기를 아무 차례로 듣고(모두 들어야 종교 지도자),
// 지도자에게 가면 학생의 결심 → 팔각정에서 학생이 독립 선언서를 읽고 모두 태극기를 꺼내 만세를 외치는 장면 →
// ① 숨겨 둔 태극기 모아 나눠 주기 ② 학생에게 말을 걸면 만세 행진 ③ 유관순에게 말을 걸면 만세의 흐름 걷기
// (1918년 신문 → 전국으로 퍼진 만세 → 천안 아우내 장터 → 화성 제암리).
import * as THREE from 'three';
import { makeKitChapter } from '../../kit/chapter.js';
import { buildArena } from '../../kit/play.js';
import { BUILD, holdFlag, cheerFlag } from '../../kit/town.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { walkInAndTalk, anyOrderTalk } from '../../kit/talk.js';
import { burning } from '../../kit/fire.js';
import { wait, person, ease, face, stationMarks, walkStations, sayer, meet, minigameWithMeet, facingShare } from '../../kit/walk.js';
import { LOOKS } from '../../../content/characters.js';
import { placePlayer } from '../../joseon/common.js';
import script from './script.js';

const PEOPLE = ['student', 'yugwansun', 'merchant'];
const GATE_Z = 14.5, INTRO_FROM = [0, 17.5], SPOT = [0, 7];
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const GENDARME_SWORD = { ...LOOKS.gendarme, gear: 'sword' };
const HALL = { x: 13, z: 8, scale: 1.3 }; // 공원 담 너머 태화관(앞이 공원 쪽)

// 만세(D-43): 태극기 든 오른팔을 가슴 앞에서 머리 위로 번쩍 들었다 내린다(k 0~1). 깃발 쥐기는 kit/town.js holdFlag
const cheerPose = (p, k) => cheerFlag(p, Math.sin(k * Math.PI));

// ── 무대(마을에서 떨어진 x 400) ──
const JONGNO = { edge: { style: 'modern', seed: 352 }, center: [{ type: 'papers', x: -14, z: 4, kind: 'news', n: 3 }, { type: 'flagpole', x: 14, z: 16 }, { type: 'cargo', x: -14, z: -10, kind: 'cloth', n: 5 }, { type: 'papers', x: -7, z: 16, kind: 'news', n: 3 }, { type: 'flagpole', x: 7, z: 16 }], // 탑골 공원 문에서 종로 거리, 시장, 큰길로
  origin: [400, 0], ground: 'stone', groundColor: 0xa09a8c, bounds: { x0: -24, x1: 24, z0: -28, z1: 28 },
  roads: [{ x: 0, z: 0, w: 7, d: 56, color: 0x8a8070 }, { x: 0, z: -14, w: 40, d: 6, color: 0x8a8070 }],
  props: [
    { type: 'pavilion', x: -13, z: 25, solid: false }, // 탑골 공원 팔각정: 출발 자리 뒤(카메라 쪽)를 막지 않게 옆으로
    { type: 'hanok', x: -9, z: 12, ry: Math.PI / 2, tile: true }, { type: 'hanok', x: 9, z: 6, ry: -Math.PI / 2, tile: true },
    { type: 'rice', x: -8, z: -4, n: 6 }, { type: 'tent', x: 8, z: -6 },
    { type: 'western', x: -14, z: -22, w: 8, d: 5, h: 5, color: 0x8a4a3a }, { type: 'western', x: 14, z: -22, w: 8, d: 5, h: 6, color: 0x9a948a },
  ],
};
// 만세의 흐름 걷기: 남쪽에서 북쪽으로 곧은 길. 1918년 신문 가판 → 전국으로(여러 계층) → 천안 아우내 장터 → 화성 제암리 마을
export const FLOW = { edge: { style: 'thatch', seed: 419 },
  origin: [400, 0], ground: 'earth', groundColor: 0x8a7d66, bounds: { x0: -14, x1: 14, z0: -36, z1: 30 },
  roads: [{ x: 0, z: -3, w: 4, d: 66, color: 0x8a8070 }],
  props: [
    { type: 'shop', x: -9, z: 21, w: 5, ry: Math.PI / 2, style: 'modern', awning: 0x5a5e62, seed: 4 }, { type: 'lamp', x: -4, z: 24 },   // 서울 거리 신문 가판
    { type: 'hanok', x: 9.5, z: 10, ry: -Math.PI / 2, tile: true }, { type: 'tree', x: -11, z: 6, kind: 'poplar' },
    { type: 'stall', x: -8, z: -9, ry: Math.PI / 2, seed: 2 }, { type: 'stall', x: -8, z: -14, ry: Math.PI / 2, seed: 5 }, { type: 'stall', x: 8, z: -11, ry: -Math.PI / 2, seed: 3 }, // 아우내 장터
    { type: 'hanok', x: -9, z: -28 }, { type: 'hanok', x: 9, z: -30, ry: -0.3 }, { type: 'hanok', x: -2, z: -34, tile: true }, // 제암리 마을
    { type: 'tree', x: 12, z: -20, kind: 'bare' },
  ],
  from: [0, 28],
  boards: [['서울', 26], ['전국으로', 9], ['천안 아우내 장터', -6], ['화성 제암리', -22]],
  stations: [{ x: -4, z: 21 }, { x: 4.5, z: 6 }, { x: -4, z: -11.5 }, { x: 3.5, z: -27 }],
};

let scene = null;

// 만세 행진 중 지점에 닿으면(D-43): 카메라가 행렬 앞쪽으로 돌아가 뒤따르는 사람들이 얼굴을 보이며 태극기를 번쩍 든다
async function marchCheer(ctx) {
  const { world } = ctx, p = world.player.position.clone(), ry = world.player.rotation.y;
  const fx = Math.sin(ry), fz = Math.cos(ry), v = new THREE.Vector3();
  world.setFixedCamera([p.x + fx * 6.5 + fz * 1.6, 2.6, p.z + fz * 6.5 - fx * 1.6], [p.x - fx * 3, 1.4, p.z - fz * 3]);
  const folk = [];
  world.level.traverse(o => { if (o.userData?.carry?.style === 'flag' && o.getWorldPosition(v).distanceTo(p) < 16) folk.push(o); });
  for (let n = 0; n < 2; n++) { ctx.audio?.play?.('tap'); await wait(world, 0.85, k => folk.forEach((f, i) => cheerPose(f, Math.min(1, Math.max(0, k * 1.15 - (i % 3) * 0.05))))); }
  world.camMode = 'follow';
  if (ctx.testHooks) ctx.testHooks.marchCheer = (ctx.testHooks.marchCheer || 0) + 1;
}

// ── 탐험 끝 장면: 팔각정에서 학생이 독립 선언서를 읽고, 모인 사람들이 품속 태극기를 꺼내 세 번 만세를 외친다 ──
export async function declarationScene(ctx) {
  const { world, dialogue } = ctx;
  const L = script.declare.lines, say = sayer(ctx);
  ctx.setGoal(script.goals[2]);
  world.closeView = true;
  await ctx.fade?.(true);
  const g = new THREE.Group(); g.name = 'i2Declare'; world.level.add(g);
  const hook = ctx.testHooks.declare = { reader: false, flags: 0, cheers: 0, held: false, camZ: 0, raisedY: 0, facing: 0 };
  const reader = person(g, 'student', 0, -4.9, 0); reader.position.y = 0.6; // 팔각정 위
  const paper = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.02), new THREE.MeshLambertMaterial({ color: 0xf2ecd8 })); paper.position.set(0, 1.4, 0.45); paper.rotation.x = -0.4; reader.add(paper); hook.reader = true;
  const looks = ['student', 'schoolgirl', 'commoner', 'woman', 'gentleman', 'peasant', 'student', 'citizen', 'schoolgirl', 'worker', 'commoner', 'student'];
  const crowd = looks.map((look, i) => { const r = i < 6 ? 0 : 1, c = i % 6; const p = person(g, look, -4.2 + c * 1.7 + r * 0.8, 0.4 + r * 1.5); face(p, 0, -5); return p; }); // 팔각정 앞을 조금 띄워 마주 보는 카메라 자리를 둔다(D-43)
  const flags = []; // 낭독이 끝나면 품속 태극기를 꺼내 든다
  placePlayer(world, [5.2, 3.2], Math.PI * 0.95);
  try {
    world.setFixedCamera([6.6, 3.4, -4.6], [-1, 1.4, -1.2]); // 팔각정 옆 앞쪽에서 읽는 학생과 모인 사람들의 얼굴을 함께(D-43)
    await ctx.fade?.(false);
    await dialogue.say(L[0]);
    world.setTalkCamera({ position: new THREE.Vector3(0, 0.6, -4.9) }); face(reader, world.player.position.x, world.player.position.z);
    await dialogue.say(L[1]);
    world.setFixedCamera([6.6, 3.4, -4.6], [-1, 1.4, -1.2]);
    await dialogue.say(L[2]);
    dialogue.close();
    crowd.forEach(p => flags.push(holdFlag(p))); hook.flags = flags.length; hook.held = crowd.every(p => p.userData.carry?.style === 'flag'); // 모두 품속 태극기를 꺼내 가슴 앞에 든다
    world.setFixedCamera([1.2, 2.8, -2.6], [-0.2, 1.4, 2.4]); // 팔각정 계단 앞에서 마주 보며 태극기를 든 사람들의 얼굴(D-43)
    for (let n = 0; n < 3; n++) { // 대한 독립 만세! 세 번
      ctx.audio?.play?.('correct');
      await wait(world, 0.9, k => { crowd.forEach((p, i) => cheerPose(p, Math.min(1, Math.max(0, k * 1.15 - (i % 4) * 0.04)))); hook.raisedY = Math.max(hook.raisedY, ...flags.map(f => f.position.y + (f.parent?.name === 'upper' ? 1.05 : 0))); }); // 깃발 높이는 몸 기준
      hook.cheers += 1;
      if (n === 0) { hook.camZ = world.camera.position.z; hook.facing = facingShare(world, crowd); }
      if (n === 0) { await dialogue.say(L[3]); dialogue.close(); }
    }
    await dialogue.say(L[4]);
    const leader = world.npcs.get('leader');
    await say(L[5], leader.mesh);
    dialogue.close();
  } finally {
    await ctx.fade?.(true);
    g.removeFromParent();
    world.setMood(base.mood);
    placePlayer(world, SPOT);
    world.camMode = 'follow'; world.snapCamera();
    ctx.input.enabled = false;
    await ctx.fade?.(false);
  }
}

// ── 만세의 흐름 걷기 ──
const ACT = {
  async hope({ ctx, a, st, say, hook, set }) {
    const { world } = ctx;
    await say(st.lines[0], set.reader);
    const news = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.62, 0.02), new THREE.MeshLambertMaterial({ color: 0xf2ecd8 })); // 펼쳐 든 신문
    news.position.set(0, 1.4, 0.45); news.rotation.x = -0.35; set.reader.add(news); hook.newspaper = true;
    const R = set.reader.getWorldPosition(new THREE.Vector3());
    world.setFixedCamera([R.x + 3.4, 2.4, R.z + 3.4], [R.x, 1.4, R.z]);
    await say(st.lines[1]); await say(st.lines[2]);
  },
  async spread({ ctx, a, st, say, hook, set }) {
    const { world } = ctx;
    const C = a.at(8, 6);
    world.player.rotation.y = Math.PI / 2;
    world.setFixedCamera([C.x - 8, 3, C.z + 6], [C.x, 1.6, C.z]);
    for (const [i, p] of set.classes.entries()) { // 학생·노동자·농민·상인·여성이 차례로 태극기를 든다
      p.visible = true; hook.classes += 1;
      ctx.audio?.play?.('tap');
      await wait(world, 0.45, k => cheerPose(p, k));
      if (i === 1) await say(st.lines[0], p);
      if (i === 2) await say(st.lines[1], p);
      ctx.dialogue.close();
      world.setFixedCamera([C.x - 8, 3, C.z + 6], [C.x, 1.6, C.z]);
    }
    await wait(world, 1.2, k => set.classes.forEach(p => cheerPose(p, k)));
    await say(st.lines[2]);
  },
  async aunae({ ctx, a, st, say, hook, set }) {
    const { world } = ctx;
    const M = a.at(-1.5, -12);
    world.player.rotation.y = -Math.PI / 2;
    world.setFixedCamera([M.x + 7.5, 3, M.z + 6.5], [M.x - 1, 1.5, M.z - 0.5]);
    set.market.forEach(p => { p.visible = true; });
    await wait(world, 1, k => [set.yu, ...set.market].forEach(p => cheerPose(p, k)));
    await say(st.lines[0], set.yu);
    ctx.dialogue.close();
    world.setFixedCamera([M.x + 7.5, 3, M.z + 6.5], [M.x - 1, 1.5, M.z - 0.5]);
    set.guards.forEach(p => { p.visible = true; });
    const from = set.guards.map(p => p.position.clone()), Y = set.yu.position.clone();
    await wait(world, 2, k => set.guards.forEach((p, i) => { p.position.lerpVectors(from[i], new THREE.Vector3(Y.x + (i ? 0.8 : -0.8), 0, Y.z - 0.6), ease(k)); face(p, Y.x, Y.z); }));
    hook.arrested = true; // 헌병들이 유관순을 끌고 간다
    const y0 = set.yu.position.clone(), g0 = set.guards.map(p => p.position.clone());
    await wait(world, 2.2, k => { const dz = -6 * ease(k); set.yu.position.set(y0.x - 4 * ease(k), 0, y0.z + dz * 0.2); set.yu.rotation.y = -Math.PI / 2; set.guards.forEach((p, i) => { p.position.set(g0[i].x - 4 * ease(k), 0, g0[i].z + dz * 0.2); p.rotation.y = -Math.PI / 2; }); });
    await say(st.lines[1]);
  },
  async jeamri({ ctx, a, g, st, say, hook, set }) {
    const { world } = ctx;
    const V = a.at(-3, -30);
    world.player.rotation.y = Math.PI;
    world.setFixedCamera([V.x + 9, 3.6, V.z + 9], [V.x - 1, 1.6, V.z - 1]);
    for (const [x, z] of [[-9, -28], [-2, -34]]) { // 습격당한 마을의 집에서 불길과 연기가 오른다
      const f = burning(world, { parent: g, x, y: 2.6, z: z + 0.5, size: 1.1, level: 1 }); set.fires.push(f); hook.smoke += 1;
    }
    set.raid.forEach(p => { p.visible = true; });
    await wait(world, 1.6);
    await say(st.lines[0]);
  },
};

export async function flowWalk(ctx) {
  const { world, hud } = ctx;
  const P = script.parts.flow, A = FLOW;
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  A.boards.forEach(([name, z]) => nameBoard(g, name, -3.2, z, { ry: 0 }));
  const hook = ctx.testHooks.flow = { used: [], pressed: 0, newspaper: false, classes: 0, arrested: false, smoke: 0 };
  const reader = person(g, 'citizen', -6.2, 21, Math.PI / 2);
  const classes = [['student', 7.5, 3.5], ['worker', 8.6, 5.2], ['peasant', 9.6, 6.8], ['commoner', 7.4, 7.6], ['woman', 8.3, 9]].map(([look, x, z]) => { const p = person(g, look, x, z, -Math.PI / 2); holdFlag(p); p.visible = false; return p; });
  const yu = person(g, 'yugwansun', -3.2, -13.5, Math.PI / 2); holdFlag(yu);
  const market = [['peasant', -5.8, -15], ['commoner', -6.2, -12.4], ['woman', -4.6, -16.4], ['grandma', -6.6, -10.4], ['kidModern', -4.4, -10.8]].map(([look, x, z]) => { const p = person(g, look, x, z, Math.PI / 2); holdFlag(p); p.visible = false; return p; });
  const guards = [[2.8, -18], [3.8, -17.4]].map(([x, z]) => { const p = person(g, GENDARME_SWORD, x, z, 0); p.visible = false; return p; });
  const raid = [[-5.5, -25], [0.5, -29.5], [5, -26]].map(([x, z]) => { const p = person(g, GENDARME_SWORD, x, z, Math.PI); p.visible = false; return p; });
  const marks = stationMarks(a, g, P.stations, A.stations);
  const p0 = a.at(...A.from); placePlayer(world, [p0.x, p0.z]);
  const set = { reader, classes, yu, market, guards, raid, fires: [] };
  const say = sayer(ctx);
  try {
    await ctx.fade?.(false);
    await walkStations(ctx, {
      stations: P.stations, marks, counter: '따라가 본 곳',
      async act(st) { hook.pressed += 1; await ACT[st.id]({ ctx, a, g, st, say, hook, set }); hook.used.push(st.id); },
    });
  } finally {
    await ctx.fade?.(true);
    hud.setCounter(null);
    set.fires.forEach(f => f.setLevel?.(0));
    a.dispose();
    placePlayer(world, SPOT);
    world.camMode = 'follow'; world.snapCamera();
    ctx.input.enabled = false;
    await ctx.fade?.(false);
  }
}

const base = makeKitChapter({
  id: 'i2', mood: 'earlySpring', script,
  player: { robe: 0x22262e, hat: 'cap', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['student', 'yugwansun', 'merchant', 'leader'],
  spot: SPOT, // 놀이를 마치면 공원 문 앞에서 북쪽(빛나는 문·팔각정)을 보고 선다
  layout: {
    // 1919년 3월 1일 서울 탑골 공원: 돌 마당의 팔각정과 모여든 사람들, 공원 담 너머 태화관과 종로의 가게들, 멀리 도성의 지붕과 북쪽 산
    ground: 'stone', groundColor: 0xb0a890, bounds: { x0: -16, x1: 16, z0: -6, z1: 11 }, start: [0, 9], hill: 1.3,
    skyline: { style: 'hanok', color: 0x4a4e4c, arc: [Math.PI * 0.55, Math.PI * 1.45] },
    roads: [{ x: 0, z: 9.5, w: 4, d: 11 }],
    props: [
      { type: 'pavilion', x: 0, z: -7 },
      { type: 'crowd', x: -10, z: -2, n: 12, cols: 4, flags: 0.6, looks: ['student', 'commoner', 'schoolgirl', 'woman', 'gentleman'], face: 0.3 },
      { type: 'crowd', x: 9, z: -2, n: 12, cols: 4, flags: 0.6, looks: ['commoner', 'student', 'peasant', 'schoolgirl'], face: -0.3 },
      { type: 'hanok', x: HALL.x, z: HALL.z, tile: true, scale: HALL.scale, ry: Math.PI },
      { type: 'wall', x: -17, z: 2, w: 16, ry: Math.PI / 2 }, { type: 'wall', x: 17, z: -4, w: 10, ry: Math.PI / 2 },
      { type: 'shop', x: -20, z: -5, w: 5, style: 'modern', ry: Math.PI / 2, sign: '양복점', awning: 0x2f6b5e, seed: 1 }, { type: 'shop', x: 20, z: 3, w: 5, ry: -Math.PI / 2, sign: '포목점', seed: 3 },
      { type: 'tree', x: -13, z: 7 }, { type: 'tree', x: 17, z: 11.5, color: 0x5a7a40 }, { type: 'tree', x: -8, z: -8.5, color: 0x5a7a40 }, { type: 'tree', x: 9, z: -8.5 },
      { type: 'flagpole', x: -6.5, z: 4 }, // 낭독 장면 카메라(팔각정 옆)를 가리지 않게 옆으로(D-43) { type: 'lamp', x: -15, z: 9.5 },
      { type: 'wall', x: -8.5, z: GATE_Z, w: 13, h: 1.8, solid: false }, { type: 'wall', x: 8.5, z: GATE_Z, w: 13, h: 1.8, solid: false }, // 공원 담과 문
    ],
    npcs: [
      { id: 'student', look: 'student', x: -4, z: 6, ry: Math.PI * 0.8 },
      { id: 'yugwansun', look: 'yugwansun', x: -3, z: -2, ry: 0 },
      { id: 'merchant', look: 'commoner', x: 4.5, z: 1.2, ry: -Math.PI * 0.8 },
      { id: 'leader', look: 'gentleman', x: 9.5, z: 4, ry: -Math.PI / 2 },
    ],
    // 길 위 안내판 대신 간판(C-03): 「팔각정」, 담 너머 「태화관」. 안내판 글(독립 선언·유관순·제암리)은 장면·걷기로 옮겼다
    signs: [{ id: 'signPavilion', title: '팔각정', x: 0, z: -3.0, ry: 0, plaque: { y: 3.35, back: 0.7 } },
      { id: 'signHall', title: '태화관', x: HALL.x, z: HALL.z - 2.9, ry: 0, plaque: { y: 2.9, back: 0.6 } }],
  },
  parts: [
    { ...script.parts.flags, goal: script.goals[3], arena: JONGNO, from: [0, 21],
      route: xy(script.parts.flags.route, [{ x: -4, z: 4 }, { x: 4, z: -10 }]),
      pickups: xy(script.parts.flags.pickups, [{ x: -16, z: 18 }, { x: 15, z: 14 }, { x: -15, z: 0 }, { x: 16, z: -2 }]) },
    { ...script.parts.march, goal: script.goals[4], intro: meet('student', '학생과 이야기하기', script.parts.march.intro), arena: JONGNO, from: [0, 21], followers: { looks: ['student', 'schoolgirl', 'citizen', 'woman', 'peasant', 'yugwansun'], per: 2, flags: true },
      route: xy(script.parts.march.route, [{ x: 0, z: 18 }, { x: 2, z: 6, scene: marchCheer }, { x: -2, z: -6 }, { x: 0, z: -18, scene: marchCheer }]),
      hazards: [{ x: -14, z: 0, to: [14, 0], kind: 'crowd', r: 1.6, speed: 0.4 }, { x: 14, z: -12, to: [-14, -12], kind: 'crowd', r: 1.6, speed: 0.45 }] },
    { ...script.parts.flow, goal: script.goals[5], intro: meet('yugwansun', '유관순과 이야기하기', script.parts.flow.intro), play: ctx => flowWalk(ctx) },
  ],
  // 공원 문과 「탑골 공원」 이름판은 굳히기에 합쳐지지 않게 돌려준다
  decorate(world) {
    const gate = gateLeaves(world.level, { x: 0, z: GATE_Z, width: 4, height: 2.6, inward: -1 });
    const board = nameBoard(world.level, '탑골 공원', 3.2, GATE_Z - 1.6);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return { gate, board };
  },
});

// 장 도입(C-03): ① 사람들이 큰 전쟁이 끝났다는 신문을 돌려 본다 ② 종교 지도자들이 모여 만세 시위를 의논한다. 끝나면 더한 것을 치운다
function introScene(ctx) {
  const { world } = ctx, L = world.level;
  const readers = [['citizen', -1.2, 5.6, 0.4], ['student', 0.2, 6.6, Math.PI], ['commoner', 1.4, 5.4, -0.6], ['woman', -0.4, 4.4, 0]].map(([look, x, z, ry]) => person(L, look, x, z, ry));
  const news = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.62, 0.02), new THREE.MeshLambertMaterial({ color: 0xf2ecd8 })); news.position.set(0, 1.4, 0.45); news.rotation.x = -0.35; readers[0].add(news);
  const leaders = [['gentleman', 11.4, 3.2], ['scholarModern', 12.8, 2.4], ['gentleman', 12.6, 4.2], ['scholar', 11.2, 1.8]].map(([look, x, z]) => { const p = person(L, look, x, z); face(p, 12, 3); p.visible = false; return p; });
  readers.forEach(p => { p.visible = false; });
  const hide = on => { for (const id of [...PEOPLE, 'leader']) { const n = world.npcs.get(id); if (n) n.mesh.visible = on; } };
  return {
    shots: [
      { cam: [3.2, 2.4, 9.5], look: [0, 1.4, 5.4], to: { cam: [2.6, 2.3, 8.6], look: [0, 1.4, 5.4] },
        act: () => { hide(false); readers.forEach(p => { p.visible = true; }); } }, // 전쟁이 끝났다는 신문을 돌려 본다
      { cam: [7.5, 2.4, 7], look: [12, 1.4, 3], to: { cam: [8.2, 2.3, 6.4], look: [12, 1.4, 3] },
        act: () => { readers.forEach(p => { p.visible = false; }); leaders.forEach(p => { p.visible = true; }); } }, // 지도자들이 모여 의논한다
    ],
    done: () => { hide(true); for (const o of [...readers, ...leaders]) o.removeFromParent(); },
  };
}

export const villageTalk = (id, heard) => anyOrderTalk(script, PEOPLE, id, heard);
export const devScene = () => scene; // 개발용(사진 찍기)

export default {
  ...base,
  anyOrder: true, // 공원 사람은 아무 차례로(차례 전 대사 tooEarly가 없다, tests/quest.test.js)
  introScene,
  portal: { at: [0, 3.4], ry: 0 }, // 미니게임 뒤 빛나는 문(C-02): 돌아온 학생(SPOT) 바로 앞, 앞면은 학생(남쪽) 쪽
  buildScene(world) { scene = base.buildScene(world); return scene; },
  enterStage(ctx, stage) { scene.gate.setOpen(0); ctx.world.closeView = true; base.enterStage(ctx, stage); },
  // 모두 들은 뒤 종교 지도자에게 가면 학생의 결심 → 독립 선언서 낭독 장면
  async explore(ctx) {
    await walkInAndTalk(ctx, script, { people: PEOPLE, final: 'leader', gate: scene.gate, from: INTRO_FROM, to: base.layout.start });
    await declarationScene(ctx);
  },
  // 공용 kit 미니게임을 그대로 돌리되, { meet } 줄에서는 그 사람에게 말을 걸 때까지 기다린다(C-05, chapters/kit/walk.js)
  minigame: ctx => minigameWithMeet(base, ctx),
};
