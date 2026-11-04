// 일제 강점기편 1장 「일제의 식민 통치」(D-36): 흐린 날의 항구 마을, 쌀가마를 실은 기차와 배, 둥근 지붕의 조선 총독부.
// 마을 어귀 문으로 들어와 농민·짐꾼·총독부 앞 사람 이야기를 아무 차례로 듣고(모두 들어야 학교 선생님),
// 선생님에게 가면 학생의 결심 → 칼 찬 헌병들이 큰길을 줄지어 순찰하고 사람들이 길을 비키는 장면 →
// ① 시대별 체험 걷기(시대의 문 셋: 1910년대 토지 측량·칼 찬 교사 / 1920년대 늘어난 경찰·쌀가마 싣고 떠나는 기차 / 1930년대 후반 일본어 수업·끌려가는 사람들)
// ② 선생님에게 말을 걸면 헌병의 눈을 피해 우리 역사책을 서당까지 전하기.
import * as THREE from 'three';
import { makeKitChapter } from '../../kit/chapter.js';
import { buildArena, labelSprite } from '../../kit/play.js';
import { BUILD } from '../../kit/town.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { walkInAndTalk, anyOrderTalk } from '../../kit/talk.js';
import { wait, person, ease, face, stationMarks, walkStations, sayer, classroom, meet, minigameWithMeet } from '../../kit/walk.js';
import { setCarry, mat } from '../../../core/people.js';
import { LOOKS } from '../../../content/characters.js';
import { placePlayer } from '../../joseon/common.js';
import script from './script.js';

const PEOPLE = ['farmer', 'porter', 'clerk'];
const GATE_Z = 14.5, INTRO_FROM = [0, 17.5], SPOT = [0, 7];
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const GENDARME_SWORD = { ...LOOKS.gendarme, gear: 'sword' };           // 칼 찬 헌병
const TEACHER_SWORD = { ...LOOKS.teacherUniform, gear: 'sword' };      // 제복을 입고 칼을 찬 1910년대 교사
const GOV = { x: 13, z: 9.5, w: 8, d: 5, h: 6 };                       // 조선 총독부(둥근 지붕, 앞이 큰길 쪽)

// ── 무대(마을에서 떨어진 x 400) ──
// 시대별 체험 걷기: 남쪽에서 북쪽으로 곧은 길, 시대의 문 셋(1910년대·1920년대·1930년대 후반)을 지나며 길 양옆 자리를 겪는다
export const ERAS = { edge: { style: 'modern', seed: 113 },
  origin: [400, 0], ground: 'earth', groundColor: 0x8a7d66, bounds: { x0: -14, x1: 14, z0: -40, z1: 38 },
  roads: [{ x: 0, z: -1, w: 4, d: 78, color: 0x8a8070 }],
  props: [
    { type: 'arch', x: 0, z: 27, solid: false }, { type: 'arch', x: 0, z: 3, solid: false }, { type: 'arch', x: 0, z: -21, solid: false },
    { type: 'paddy', x: -10, z: 18 }, { type: 'hanok', x: -10, z: 31, ry: Math.PI / 2 },                    // 1910년대: 논과 초가
    { type: 'western', x: -10.5, z: -4, w: 6, d: 4, h: 4, ry: Math.PI / 2, color: 0x8a7a6a },              // 1920년대: 주재소(앞이 동쪽 길)
    { type: 'rice', x: 6.5, z: -8.5, n: 6 }, { type: 'poles', x: 13, z: -18, n: 3, gap: 6, ry: Math.PI / 2 },
    { type: 'tree', x: 12, z: 24, kind: 'poplar' }, { type: 'tree', x: -12, z: -14, kind: 'poplar' }, { type: 'tree', x: 12, z: -26, kind: 'bare' },
  ],
  from: [0, 35],
  arches: [27, 3, -21],
  // 걸어가 서는 자리(script.parts.eras.eras[*].stations 차례)
  stations: [{ x: -4.5, z: 19 }, { x: 4.5, z: 11 }, { x: -4.5, z: -4 }, { x: 4.5, z: -12.5 }, { x: -4.5, z: -28 }, { x: 4.5, z: -33 }],
  train: [10, -14], truck: [10, -36],
};
const ALLEY = { edge: { style: 'street', seed: 139 }, center: [{ type: 'jars', x: -15, z: 3 }, { type: 'straw', x: 14, z: 10 }, { type: 'papers', x: -14, z: -10, kind: 'book', n: 2 }], // 마을 골목: 헌병이 순찰하고, 쌀가마·짐 더미 뒤에 숨을 수 있다. 끝에 서당
  origin: [400, 0], ground: 'earth', groundColor: 0x8a7a62, bounds: { x0: -18, x1: 18, z0: -24, z1: 20 },
  props: [
    { type: 'hanok', x: -13, z: 12, tile: true }, { type: 'hanok', x: 13, z: 2 }, { type: 'wall', x: -8, z: -2, w: 8 },
    { type: 'well', x: 9, z: -9 }, { type: 'hanok', x: 0, z: -22, tile: true, scale: 1.2 }, { type: 'tree', x: -14, z: -14 },
  ],
};

let scene = null;

// ── 탐험 끝 헌병 순찰 장면: 칼 찬 헌병 다섯이 큰길을 줄지어 걷고, 길 위의 사람들이 서둘러 길가로 비켜선다 ──
export async function patrolScene(ctx) {
  const { world, dialogue } = ctx;
  const L = script.patrol.lines, say = sayer(ctx);
  ctx.setGoal(script.goals[2]);
  world.closeView = true;
  await ctx.fade?.(true);
  const g = new THREE.Group(); g.name = 'i1Patrol'; world.level.add(g);
  const hook = ctx.testHooks.patrol = { gendarmes: 0, walked: 0, stepAside: 0 };
  placePlayer(world, [-9, 6.2], Math.PI * 0.7); // 카메라 옆 길가(헌병 줄을 가리지 않게)
  const troop = [];
  for (let i = 0; i < 5; i++) troop.push(person(g, GENDARME_SWORD, 15 + i * 1.5, i % 2 ? 2.6 : 1.5, -Math.PI / 2));
  hook.gendarmes = troop.length;
  const folk = [['woman', 7, 2.2], ['kidModern', 4, 1.8], ['commoner', 1, 2.4]].map(([look, x, z]) => { const p = person(g, look, x, z, Math.PI / 2); p.userData.home = z; return p; });
  let off = null;
  try {
    world.setFixedCamera([-5.5, 3.2, 9.8], [3, 1.3, 1.8]); // 큰길 남쪽 길가에서 동쪽으로
    await ctx.fade?.(false);
    await dialogue.say(L[0]); dialogue.close();
    let moved = 0;
    off = world.onUpdate(dt => {
      for (const p of troop) p.position.x -= dt * 1.5;
      moved += dt * 1.5; hook.walked = moved;
      for (const p of folk) { // 헌병이 다가오면 길가(남쪽)로 비켜서서 고개를 숙인다
        const near = troop.some(t => Math.abs(t.position.x - p.position.x) < 6);
        if (near && !p.userData.aside) { p.userData.aside = true; hook.stepAside += 1; }
        if (p.userData.aside && p.position.z < 5.2) { p.position.z = Math.min(5.2, p.position.z + dt * 2.6); p.rotation.y = 0; }
        if (p.userData.aside && p.position.z >= 5.2) face(p, p.position.x, 0);
      }
    });
    await wait(world, 7.5);
    await dialogue.say(L[1]);
    const farmer = world.npcs.get('farmer'), teacher = world.npcs.get('teacher');
    await say(L[2], farmer.mesh);
    await say(L[3], teacher.mesh);
    await dialogue.say(L[4]);
    dialogue.close();
  } finally {
    await ctx.fade?.(true);
    off?.();
    g.removeFromParent();
    world.setMood(base.mood);
    placePlayer(world, SPOT);
    world.camMode = 'follow'; world.snapCamera();
    ctx.input.enabled = false;
    await ctx.fade?.(false);
  }
}

// ── 시대별 체험 자리 ──
const sack = () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.8, 10), mat(0xd8c08a, 'cloth')); m.rotation.z = Math.PI / 2; return m; };

const ACT = {
  async survey({ ctx, a, g, st, say, hook, set }) {
    const { world } = ctx;
    const F = a.at(-10, 18);
    world.player.rotation.y = -Math.PI / 2;
    world.setFixedCamera([F.x + 7.5, 3.6, F.z + 6], [F.x, 1.0, F.z]);
    await say(st.lines[0], set.farmer);
    ctx.dialogue.close();
    world.setFixedCamera([F.x + 7.5, 3.6, F.z + 6], [F.x, 1.0, F.z]);
    for (const [i, [x, z]] of [[-13, 15], [-7, 15], [-13, 21], [-7, 21]].entries()) { // 논 네 귀퉁이에 측량 막대를 꽂는다
      const pg = new THREE.Group(); pg.position.set(x, 0, z); BUILD.surveyPole(pg, {}); g.add(pg);
      set.surveyor.position.set(x + 0.8, 0, z + 0.4); face(set.surveyor, x, z);
      ctx.audio?.play?.('tap'); await wait(world, 0.55);
      if (i === 0) hook.surveyed = true;
    }
    await say(st.lines[1]); await say(st.lines[2]);
  },
  async sword({ ctx, a, st, say, hook, set }) {
    const { world } = ctx;
    const R = a.at(9.5, 11);
    world.player.rotation.y = Math.PI / 2;
    world.setFixedCamera([R.x - 7, 4.4, R.z + 1.2], [R.x + 1, 1.4, R.z]); // 열린 쪽으로 교실을 들여다본다
    hook.sword = !!set.swordTeacher;
    await say(st.lines[0]);
    world.setFixedCamera([R.x - 7, 4.4, R.z + 1.2], [R.x + 1, 1.4, R.z]);
    await say(st.lines[1]);
  },
  async police({ ctx, a, st, say, hook, set }) {
    const { world } = ctx;
    const P = a.at(-8, -4);
    world.player.rotation.y = -Math.PI / 2;
    world.setFixedCamera([P.x + 7, 3.4, P.z + 6], [P.x - 1, 1.4, P.z]);
    for (const [i, p] of set.police.entries()) { // 주재소에서 경찰이 하나씩 늘어난다
      p.visible = true; hook.police += 1;
      const from = p.position.clone(), to = new THREE.Vector3(-7.2, 0, -6.4 + i * 1.6);
      face(p, to.x, to.z);
      await wait(world, 0.5, k => p.position.lerpVectors(from, to, ease(k)));
      p.rotation.y = Math.PI / 2;
    }
    await say(st.lines[0]); await say(st.lines[1]);
  },
  async rice({ ctx, a, g, st, say, hook, set }) {
    const { world } = ctx;
    await say(st.lines[0], set.worker);
    const s = sack(); setCarry(world.player, s, 'arms'); hook.carried = true; // 쌀가마를 받아 든다
    ctx.audio?.play?.('tap');
    const T = a.at(...ERAS.train);
    world.player.rotation.y = Math.PI / 2;
    world.setFixedCamera([T.x - 8, 3.6, T.z + 9], [T.x - 1, 1.4, T.z - 2]);
    await wait(world, 0.8);
    setCarry(world.player, null);
    const load = sack(); load.position.set(0, 2.8, 3); set.train.add(load); // 화물칸 위에 하나 더 얹는다
    await say(st.lines[1]);
    ctx.dialogue.close();
    world.setFixedCamera([T.x - 8, 3.6, T.z + 9], [T.x - 1, 1.4, T.z - 8]);
    const z0 = set.train.position.z;
    await wait(world, 3.6, k => { set.train.position.z = z0 - 30 * k * k; }); // 기차가 항구 쪽(북쪽)으로 떠난다
    hook.trainLeft = true;
    await say(st.lines[2]); await say(st.lines[3]);
  },
  async class({ ctx, a, st, say, hook, set }) {
    const { world } = ctx;
    const R = a.at(-9.5, -28);
    world.player.rotation.y = -Math.PI / 2;
    world.setFixedCamera([R.x + 7, 4.4, R.z - 1.2], [R.x - 1, 1.4, R.z]);
    hook.classroom = set.room1930.kids.length;
    for (const l of st.lines) await say(l);
  },
  async force({ ctx, a, st, say, hook, set }) {
    const { world } = ctx;
    const T = a.at(...ERAS.truck);
    world.player.rotation.y = Math.PI / 2;
    world.setFixedCamera([T.x - 9, 3.4, T.z + 7], [T.x - 3, 1.3, T.z + 1]);
    set.forced.forEach(p => { p.visible = true; });
    const from = set.forced.map(p => p.position.clone());
    hook.forced = set.forced.length - 2; // 앞뒤의 헌병 둘은 빼고 센다
    await wait(world, 3.4, k => set.forced.forEach((p, i) => { p.position.x = from[i].x + 5.5 * ease(k); p.rotation.y = Math.PI / 2; }));
    for (const l of st.lines) await say(l);
  },
};

export async function eraWalk(ctx) {
  const { world, dialogue, hud } = ctx;
  const P = script.parts.eras, A = ERAS, stations = P.eras.flatMap(e => e.stations);
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  const hook = ctx.testHooks.eras = { used: [], pressed: 0, gates: 0, surveyed: false, sword: false, police: 0, carried: false, trainLeft: false, classroom: 0, forced: 0 };
  P.eras.forEach((e, i) => { const lab = labelSprite(e.label, { size: 1.2 }); lab.position.set(0, 6.2, A.arches[i]); g.add(lab); hook.gates += 1; }); // 시대의 문 이름
  const farmer = person(g, 'peasant', -7, 22, Math.PI);
  const surveyor = person(g, 'gentleman', -12, 14, 0);
  person(g, GENDARME_SWORD, -6.2, 15.2, -Math.PI / 2);
  const room1910 = classroom(g, 9.5, 11, { teacher: TEACHER_SWORD }); room1910.group.rotation.y = -Math.PI / 2; // 열린 쪽이 길(서쪽)
  world.addCollider({ ...a.at(9.5, 11), r: 3.6 });
  const police = [0, 1, 2, 3].map(() => { const p = person(g, 'gendarme', -10.5, -4, Math.PI / 2); p.visible = false; return p; });
  const train = new THREE.Group(); train.position.set(A.train[0], 0, A.train[1]); BUILD.train(train, { cars: 2, track: 26 }); g.add(train);
  world.addCollider({ ...a.at(A.train[0], A.train[1]), r: 2.2 });
  const worker = person(g, 'worker', 6.8, -11, -Math.PI / 2);
  const room1930 = classroom(g, -9.5, -28, { teacher: 'teacherUniform' }); room1930.group.rotation.y = Math.PI / 2; // 열린 쪽이 길(동쪽)
  world.addCollider({ ...a.at(-9.5, -28), r: 3.6 });
  const truck = new THREE.Group(); truck.position.set(A.truck[0], 0, A.truck[1]); BUILD.truck(truck, {}); g.add(truck);
  world.addCollider({ ...a.at(A.truck[0], A.truck[1]), r: 2 });
  const forced = [GENDARME_SWORD, 'peasant', 'commoner', 'worker', 'student', GENDARME_SWORD].map((look, i) => { const p = person(g, look, 1.5 + (i % 2) * 0.3, -31 - i * 0.9, Math.PI / 2); p.visible = false; return p; });
  const marks = stationMarks(a, g, stations, A.stations);
  const p0 = a.at(...A.from); placePlayer(world, [p0.x, p0.z]);
  const set = { farmer, surveyor, swordTeacher: room1910.teacher, police, train, worker, room1930, forced };
  const say = sayer(ctx);
  try {
    await ctx.fade?.(false);
    await walkStations(ctx, {
      stations, marks, counter: '겪어 본 일',
      async act(st) { hook.pressed += 1; await ACT[st.id]({ ctx, a, g, st, say, hook, set }); hook.used.push(st.id); },
    });
    await dialogue.say(P.end);
    dialogue.close(); // 대화창이 열린 채면 다음 놀이(선생님에게 말 걸기)를 누를 수 없다
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

const base = makeKitChapter({
  id: 'i1', mood: 'overcast', script,
  player: { robe: 0xddd2bb, hat: 'short', trim: 0x7a4e32, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['farmer', 'porter', 'clerk', 'teacher'],
  spot: SPOT, // 놀이를 마치면 큰길 앞에서 북쪽(빛나는 문·부두)을 보고 선다
  layout: {
    // 1910~30년대 항구 마을: 부두에 쌓인 쌀가마와 붉은 벽돌 쌀 창고, 선로와 기차, 둥근 지붕 조선 총독부, 길가 가게와 초가
    ground: 'earth', groundColor: 0x8a7d66, bounds: { x0: -16, x1: 16, z0: -7, z1: 11 }, start: [0, 9], hill: 1.1,
    skyline: { style: 'brick', color: 0x4e4a46, arc: [Math.PI * 0.35, Math.PI * 0.75] },
    roads: [{ x: 0, z: 2, w: 36, d: 4, color: 0x8a8070 }, { x: 0, z: 8, w: 4, d: 10 }],
    props: [
      { type: 'water', x: 0, z: -40, w: 260, d: 50 },
      { type: 'steamship', x: -6, z: -20, ry: Math.PI / 2, solid: false },
      { type: 'pier', x: -8, z: -13, w: 10, d: 4, solid: false },
      { type: 'rice', x: -9, z: -6, n: 9 }, { type: 'rice', x: -4, z: -6, n: 9 }, { type: 'rice', x: -12.5, z: -11, n: 6 },
      { type: 'barracks', x: -15, z: -6.5, w: 7, color: 0x8a4a3a, roof: 0x5a5e62, ry: Math.PI / 2 },
      { type: 'train', x: 10, z: -4, ry: Math.PI / 2, cars: 2, track: 50, solid: false },
      { type: 'western', x: GOV.x, z: GOV.z, w: GOV.w, d: GOV.d, h: GOV.h, dome: true, color: 0xb8b0a0, ry: Math.PI },
      { type: 'shop', x: 18.5, z: -1, w: 5, style: 'modern', ry: -Math.PI / 2, awning: 0x5a5e62, seed: 2 },
      { type: 'hanok', x: -13, z: 9, ry: 0.3 }, { type: 'hanok', x: -13, z: 3, ry: 0.6 },
      { type: 'tree', x: 17, z: 4, kind: 'poplar' }, { type: 'tree', x: -17.5, z: 6, kind: 'poplar' }, { type: 'tree', x: 17.5, z: -6, kind: 'poplar' },
      { type: 'wall', x: -8.5, z: GATE_Z, w: 13, h: 1.8, solid: false }, { type: 'wall', x: 8.5, z: GATE_Z, w: 13, h: 1.8, solid: false }, // 마을 어귀 담
    ],
    npcs: [
      { id: 'farmer', look: 'peasant', x: -8, z: 6, ry: Math.PI * 0.8 },
      { id: 'porter', look: 'commoner', x: -6, z: -2.5, ry: 0, work: 'carry' },
      { id: 'clerk', look: 'citizen', x: 9, z: 4.6, ry: -Math.PI * 0.8 },
      { id: 'teacher', look: 'scholarModern', x: 3.5, z: 6.5, ry: Math.PI },
    ],
    // 길 위 안내판 대신 건물 간판(C-03): 둥근 지붕 「조선 총독부」, 붉은 벽돌 「쌀 창고」. 안내판 글(식민 통치·철도·강제 동원)은 사람 대사·체험 걷기로 옮겼다
    signs: [{ id: 'signGov', title: '조선 총독부', x: GOV.x, z: GOV.z - GOV.d / 2 - 0.5, ry: Math.PI, plaque: { y: 5.25, back: 0.42 } },
      { id: 'signStore', title: '쌀 창고', x: -12.5, z: -6.5, ry: Math.PI / 2, plaque: { y: 2.75, back: 0.45 } }],
  },
  parts: [
    { ...script.parts.eras, goal: script.goals[3], play: ctx => eraWalk(ctx) },
    { ...script.parts.book, goal: script.goals[4], intro: meet('teacher', '선생님과 이야기하기', script.parts.book.intro), arena: ALLEY, from: [0, 17],
      waypoints: xy(script.parts.book.waypoints, [{ x: -8, z: 9 }, { x: -9, z: 0 }, { x: 6, z: -8 }, { x: 0, z: -17 }]),
      hides: [{ x: -6, z: 13, r: 1.8 }, { x: -12, z: 4, r: 1.8 }, { x: 0, z: -4, r: 1.8 }, { x: 4, z: -13, r: 1.8 }],
      guards: [{ path: [[4, 14], [4, 2]], speed: 0.6, range: 5.5 }, { path: [[-14, -6], [10, -6]], speed: 0.5, range: 5.5 }, { path: [[-6, -14], [10, -14]], speed: 0.55, range: 5 }] },
  ],
  // 마을 어귀 나무 문과 「항구 마을」 이름판은 굳히기에 합쳐지지 않게 돌려준다
  decorate(world) {
    const gate = gateLeaves(world.level, { x: 0, z: GATE_Z, width: 4, height: 2.6, inward: -1 });
    const board = nameBoard(world.level, '항구 마을', 3.2, GATE_Z - 1.6);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return { gate, board };
  },
});

// 장 도입(C-03): ① 칼 찬 헌병들이 큰길로 줄지어 들어온다(국권을 빼앗김) ② 둥근 지붕 조선 총독부 앞에 헌병이 서고 관리들이 드나든다. 끝나면 더한 것을 치운다
function introScene(ctx) {
  const { world } = ctx, L = world.level;
  const troops = [];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) { const p = person(L, GENDARME_SWORD, 8 + i * 1.3, 1.4 + r * 1.3, -Math.PI / 2); p.visible = false; troops.push(p); }
  const front = GOV.z - GOV.d / 2 - 1.2;
  const guards = [GOV.x - 2.2, GOV.x + 2.2].map(x => person(L, GENDARME_SWORD, x, front, Math.PI));
  const officials = [['gentleman', GOV.x - 0.6, front - 2.4], ['gentleman', GOV.x + 0.7, front - 3.4]].map(([look, x, z]) => person(L, look, x, z, 0));
  [...guards, ...officials].forEach(p => { p.visible = false; });
  let off = null;
  const run = fn => { off?.(); let t = 0; off = world.onUpdate(dt => { t += dt; fn(t, dt); }); };
  const hide = on => { for (const id of [...PEOPLE, 'teacher']) { const n = world.npcs.get(id); if (n) n.mesh.visible = on; } };
  return {
    shots: [
      { cam: [-5, 2.4, 8], look: [2, 1.4, 2], to: { cam: [-3.5, 2.4, 7.5], look: [-1, 1.4, 2] },
        act: () => { hide(false); troops.forEach(p => { p.visible = true; }); run((u, dt) => troops.forEach(p => { p.position.x -= dt * 1.5; })); } }, // 헌병들이 큰길로 들어온다
      { cam: [5.5, 2.4, 1.5], look: [GOV.x, 3.2, GOV.z], to: { cam: [6.5, 2.6, 0.8], look: [GOV.x, 3.6, GOV.z] },
        act: () => { troops.forEach(p => { p.visible = false; }); [...guards, ...officials].forEach(p => { p.visible = true; }); run((u, dt) => officials.forEach(p => { p.position.z += dt * 0.8; })); } }, // 총독부로 들어가는 관리들
    ],
    done: () => { off?.(); off = null; hide(true); for (const o of [...troops, ...guards, ...officials]) o.removeFromParent(); },
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
  // 모두 들은 뒤 학교 선생님에게 가면 학생의 결심 → 헌병 순찰 장면
  async explore(ctx) {
    await walkInAndTalk(ctx, script, { people: PEOPLE, final: 'teacher', gate: scene.gate, from: INTRO_FROM, to: base.layout.start });
    await patrolScene(ctx);
  },
  // 공용 kit 미니게임을 그대로 돌리되, { meet } 줄에서는 그 사람에게 말을 걸 때까지 기다린다(C-05, chapters/kit/walk.js)
  minigame: ctx => minigameWithMeet(base, ctx),
};
