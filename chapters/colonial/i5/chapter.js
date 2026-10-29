// 일제 강점기편 5장 「민족 문화를 지킨 사람들」(D-44): 1920~30년대 경성 골목의 학교와 조선어 학회, 서점.
// 「경성」 골목 문으로 들어와 학생·역사학자·상인 이야기를 아무 차례로 듣고(모두 들어야 조선어 학회 학자),
// 학자에게 가면 학생의 결심 → 1929년 광주에서 학생들이 차별 교육에 반대하며 거리로 나서는 장면 →
// ① 경찰 피해 「우리말 큰사전」 원고 모으기 ② 역사학자에게 말을 걸면 민족 문화 걷기.
import * as THREE from 'three';
import { makeKitChapter } from '../../kit/chapter.js';
import { buildArena, labelSprite } from '../../kit/play.js';
import { cheerFlag } from '../../kit/town.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { walkInAndTalk, anyOrderTalk } from '../../kit/talk.js';
import { wait, person, ease, face, stationMarks, walkStations, sayer, classroom, meet, minigameWithMeet, facingShare } from '../../kit/walk.js';
import { setCarry, mat } from '../../../core/people.js';
import { placePlayer } from '../../joseon/common.js';
import script from './script.js';

const PEOPLE = ['student', 'historian', 'merchant'];
const GATE_Z = 14.5, INTRO_FROM = [0, 17.5], SPOT = [0, 7];
const SCHOOL = { x: -9, z: -9, d: 5 }, HAK = { x: 9, z: -8.5 };
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const sheet = (w = 0.5, d = 0.36, color = 0xf2ecd8) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), new THREE.MeshLambertMaterial({ color })); m.castShadow = true; return m; };
const book = () => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.3), mat(0x6b2a24, 'cloth', 'object')); return m; };
const cloth = () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.7, 10), mat(0xe8dcc0, 'cloth')); m.rotation.z = Math.PI / 2; return m; };

// ── 무대(마을에서 떨어진 x 400) ──
const STREETS = { edge: { style: 'modern', seed: 801 }, center: [{ type: 'papers', x: -15, z: 1, kind: 'book', n: 3 }, { type: 'lamp', x: 8, z: 12 }, { type: 'lamp', x: -8, z: -14 }, { type: 'papers', x: -7, z: 12, kind: 'book', n: 3 }, { type: 'lamp', x: 7, z: 12 }, { type: 'papers', x: 9, z: 5, kind: 'book', n: 3 }], // 경성 골목: 서점, 학교 담장, 조선어 학회. 경찰이 순찰한다
  origin: [400, 0], ground: 'stone', groundColor: 0x9a948a, bounds: { x0: -20, x1: 20, z0: -22, z1: 20 },
  roads: [{ x: 0, z: 0, w: 5, d: 42, color: 0x8a8070 }],
  props: [
    { type: 'western', x: -12, z: 10, w: 6, d: 4, h: 4, color: 0x8a5a4a }, { type: 'hanok', x: 13, z: 12, tile: true },
    { type: 'western', x: 12, z: -2, w: 7, d: 4, h: 5, color: 0xb8a070 }, { type: 'hanok', x: -13, z: -6 },
    { type: 'western', x: 0, z: -21, w: 8, d: 4, h: 4, color: 0x8a5a4a },
  ],
};
// 1929년 광주(탐험 끝 장면): 학교 앞 거리. 학생들이 남쪽(카메라 쪽)으로 걸어 나온다
export const GWANGJU = { edge: { style: 'modern', seed: 719 },
  origin: [400, 0], ground: 'stone', groundColor: 0x9a948a, bounds: { x0: -16, x1: 16, z0: -20, z1: 14 },
  roads: [{ x: 0, z: -3, w: 8, d: 34, color: 0x8a8070 }],
  props: [
    { type: 'western', x: 0, z: -17, w: 12, d: 5, h: 6, tower: true, color: 0x8a4a3a },
    { type: 'shop', x: -9.5, z: -2, w: 5, style: 'modern', ry: Math.PI / 2, awning: 0x2f6b5e, seed: 3 }, { type: 'shop', x: 9.5, z: -4, w: 5, style: 'modern', ry: -Math.PI / 2, awning: 0x8a2f24, seed: 6 },
    { type: 'lamp', x: -5, z: 4 }, { type: 'lamp', x: 5, z: -8 }, { type: 'tree', x: -8, z: 8, kind: 'poplar' }, { type: 'tree', x: 8, z: 7, kind: 'poplar' },
  ],
  watch: [5.6, 3.6],
};
// 민족 문화 걷기: 남쪽에서 북쪽으로 곧은 길. 우리 물건 상점 → 밤 교실 → 역사학자의 서재 → 시인의 책상 → 조선어 학회
export const CULTURE = { edge: { style: 'modern', seed: 905 },
  origin: [400, 0], ground: 'stone', groundColor: 0x9a948a, bounds: { x0: -16, x1: 16, z0: -36, z1: 30 },
  roads: [{ x: 0, z: -3, w: 4, d: 66, color: 0x8a8070 }],
  props: [
    { type: 'shop', x: -10, z: 21, w: 5, ry: Math.PI / 2, style: 'modern', sign: '우리 옷감', awning: 0x2f6b5e, seed: 2 }, { type: 'lamp', x: -3.4, z: 25 },
    { type: 'papers', x: -10, z: -1.5, kind: 'book', n: 3 }, { type: 'desk', x: -7.4, z: -4.6 }, { type: 'tree', x: -12, z: -9, kind: 'poplar' },
    { type: 'desk', x: 7.2, z: -16 }, { type: 'lamp', x: 3.6, z: -11 },
    { type: 'hanok', x: -1, z: -33, tile: true }, { type: 'desk', x: 0, z: -29.4 },
  ],
  from: [0, 28], box: [-6.6, 18.2], room: [10, 2], hist: [-7.4, -4.6], poem: [7.2, -16], dict: [0, -29.4],
  stations: [{ x: -4, z: 20 }, { x: 10, z: 9.4 }, { x: -4, z: -4.6 }, { x: 4.4, z: -16 }, { x: 0, z: -26.6 }],
};

let scene = null;

// ── 탐험 끝 장면: 1929년 광주, 학생들이 학교 앞 거리로 걸어 나와 차별 교육에 반대하며 주먹을 든다 ──
export async function gwangjuScene(ctx) {
  const { world, dialogue } = ctx;
  const L = script.gwangju.lines, A = GWANGJU, say = sayer(ctx);
  ctx.setGoal(script.goals[2]);
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  const hook = ctx.testHooks.gwangju = { students: 0, walked: 0, fists: 0, camFront: false, facing: 0 };
  const looks = ['student', 'schoolgirl', 'student', 'student', 'schoolgirl', 'student', 'student', 'schoolgirl', 'student', 'schoolgirl', 'student', 'student'];
  const crowd = looks.map((look, i) => person(g, look, -2.7 + (i % 4) * 1.8 + (Math.floor(i / 4) % 2) * 0.5, -13 + Math.floor(i / 4) * 1.6, 0));
  hook.students = crowd.length;
  const lead = crowd[1];
  const W = a.at(...A.watch); placePlayer(world, [W.x, W.z], -Math.PI * 0.6);
  const C = a.at(1.6, 6), T = a.at(-0.2, -6);
  const front = () => world.setFixedCamera([C.x, 2.6, C.z], [T.x, 1.5, T.z]); // 거리 앞쪽에서 걸어 나오는 학생들의 얼굴을 마주 본다
  try {
    front();
    hook.camFront = world.camera.position.z > crowd[0].getWorldPosition(new THREE.Vector3()).z + 5;
    await ctx.fade?.(false);
    await dialogue.say(L[0]);
    dialogue.close();
    const z0 = crowd.map(p => p.position.z);
    await wait(world, 4, k => crowd.forEach((p, i) => { p.position.z = z0[i] + 8 * ease(k); }));
    hook.walked = crowd[0].position.z - z0[0];
    await say(L[1], lead);
    dialogue.close();
    front();
    hook.facing = facingShare(world, crowd);
    for (let n = 0; n < 3; n++) { // 다 함께 주먹을 든다
      ctx.audio?.play?.('tap');
      await wait(world, 0.9, k => crowd.forEach((p, i) => cheerFlag(p, Math.sin(Math.min(1, Math.max(0, k * 1.15 - (i % 4) * 0.05)) * Math.PI))));
      hook.fists += 1;
    }
    await dialogue.say(L[2]);
    await say(L[3], lead);
    dialogue.close();
    front();
    await dialogue.say(L[4]);
    dialogue.close();
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

// ── 민족 문화 걷기 ──
const ACT = {
  async goods({ ctx, a, g, st, say, hook, set }) { // 우리 옷감을 받아 들고, 동포들이 대학을 세울 성금을 모금함에 넣는다
    const { world } = ctx;
    await say(st.lines[0], set.merchant);
    setCarry(world.player, cloth(), 'arms'); hook.cloth = true;
    ctx.audio?.play?.('correct');
    const B = a.at(...CULTURE.box);
    world.setFixedCamera([B.x + 5, 2.8, B.z + 4.5], [B.x - 0.5, 1, B.z - 0.5]);
    ctx.dialogue.close();
    for (const [i, p] of set.donors.entries()) {
      p.visible = true;
      const p0 = p.position.clone(), to = new THREE.Vector3(CULTURE.box[0] + 0.9, 0, CULTURE.box[1] + 0.2 + i * 0.1);
      face(p, to.x, to.z);
      await wait(world, 0.7, k => p.position.lerpVectors(p0, to, ease(k)));
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 10), mat(0xc9a441, 'stone')); coin.position.set(CULTURE.box[0] + 0.1 - i * 0.15, 0.95, CULTURE.box[1]); g.add(coin);
      ctx.audio?.play?.('tap'); hook.coins += 1;
      await wait(world, 0.6, k => p.position.lerpVectors(to, new THREE.Vector3(p0.x + 2, 0, p0.z - 2.5), ease(k)));
    }
    await say(st.lines[1]);
    setCarry(world.player, null);
  },
  async night({ ctx, a, g, st, say, hook }) { // 밤 교실: 칠판에 '아는 것이 힘', 어른과 아이들이 글자를 배운다
    const { world } = ctx;
    await ctx.fade?.(true);
    const [rx, rz] = CULTURE.room, room = classroom(g, rx, rz, { teacher: 'scholarModern', wall: 0xd8ccb0 }), O = a.at(rx, rz);
    room.kids.forEach((k, i) => { if (i % 3 === 1) { k.removeFromParent(); room.kids[i] = person(room.group, i % 2 ? 'woman' : 'peasant', k.position.x, k.position.z, Math.PI); } }); // 어른도 함께 배운다
    const board = labelSprite('아는 것이 힘', { size: 0.9 }); board.position.set(0, 2.1, -3.2); room.group.add(board); hook.board = true;
    hook.learners = room.kids.length;
    placePlayer(world, [O.x + 2.6, O.z + 4], Math.PI);
    const view = () => world.setFixedCamera([O.x - 1.2, 5.2, O.z + 7.5], [O.x, 1.4, O.z - 2.2]);
    view();
    await ctx.fade?.(false);
    await say(st.lines[0], room.teacher);
    view();
    await say(st.lines[1]);
    ctx.dialogue.close();
    await ctx.fade?.(true);
    room.group.removeFromParent();
    const back = a.at(CULTURE.stations[1].x, CULTURE.stations[1].z);
    placePlayer(world, [back.x, back.z], Math.PI);
    await ctx.fade?.(false);
  },
  async history({ ctx, st, say, hook, set }) { // 역사학자가 우리 역사책을 건넨다
    const { world } = ctx;
    await say(st.lines[0], set.historian);
    setCarry(world.player, book(), 'arms'); hook.book = true;
    ctx.audio?.play?.('correct');
    const pp = world.player.position;
    world.setFixedCamera([pp.x + 2.8, 2.2, pp.z + 2.8], [pp.x - 0.8, 1.2, pp.z - 0.4]);
    await say(st.lines[1]);
    setCarry(world.player, null);
  },
  async poem({ ctx, a, g, st, say, hook, set }) { // 시인이 책상 위 원고지에 시를 적는다
    const { world } = ctx;
    await say(st.lines[0], set.poet);
    ctx.dialogue.close();
    const D = a.at(...CULTURE.poem);
    world.setFixedCamera([D.x - 3.6, 2.6, D.z + 2.8], [D.x, 1, D.z]);
    for (let i = 0; i < 3; i++) { const s = sheet(0.4, 0.3); s.position.set(CULTURE.poem[0] - 0.4 + i * 0.3, 0.87 + i * 0.01, CULTURE.poem[1]); g.add(s); ctx.audio?.play?.('tap'); hook.poems += 1; await wait(world, 0.4); }
    await say(st.lines[1]);
  },
  async dict({ ctx, a, g, st, say, hook, set }) { // 모아 온 사전 원고가 학회 책상에 쌓인다
    const { world } = ctx;
    await say(st.lines[0], set.linguist);
    ctx.dialogue.close();
    const D = a.at(...CULTURE.dict);
    world.setFixedCamera([D.x + 3.4, 2.6, D.z + 3.6], [D.x, 1, D.z]);
    for (let i = 0; i < 5; i++) { const s = sheet(); s.position.set(CULTURE.dict[0], 0.87 + i * 0.03, CULTURE.dict[1]); s.rotation.y = (i % 2 - 0.5) * 0.2; g.add(s); ctx.audio?.play?.('tap'); hook.stack += 1; await wait(world, 0.3); }
    await say(st.lines[1]);
  },
};

export async function cultureWalk(ctx) {
  const { world, hud } = ctx;
  const P = script.parts.culture, A = CULTURE;
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  const hook = ctx.testHooks.culture = { used: [], pressed: 0, cloth: false, coins: 0, board: false, learners: 0, book: false, poems: 0, stack: 0 };
  const merchant = person(g, 'commoner', -7.6, 20.4, Math.PI / 2);
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.5), mat(0x7a5a3c, 'wood', 'object')); box.position.set(A.box[0], 0.45, A.box[1]); box.castShadow = true; g.add(box); // 대학을 세울 성금 모금함
  const donors = [['citizen', -2.6, 14.5], ['woman', -1.8, 15.6], ['student', -3.4, 16.2]].map(([look, x, z]) => { const p = person(g, look, x, z); p.visible = false; return p; });
  const historian = person(g, 'gentleman', -8.8, -4.6, Math.PI / 2);
  const poet = person(g, 'scholarModern', 8.4, -16.6, -Math.PI / 2);
  const linguist = person(g, 'scholarModern', 1.4, -30.4, -Math.PI / 4);
  const marks = stationMarks(a, g, P.stations, A.stations);
  const p0 = a.at(...A.from); placePlayer(world, [p0.x, p0.z], Math.PI);
  const set = { merchant, donors, historian, poet, linguist };
  const say = sayer(ctx);
  try {
    await ctx.fade?.(false);
    await walkStations(ctx, {
      stations: P.stations, marks, counter: '찾아간 곳',
      async act(st) { hook.pressed += 1; await ACT[st.id]({ ctx, a, g, st, say, hook, set }); hook.used.push(st.id); },
    });
  } finally {
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
  id: 'i5', mood: 'haze', script,
  player: { robe: 0xe9e4da, hat: 'braid', trim: 0x2c3a5a, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['student', 'historian', 'merchant', 'linguist'],
  spot: SPOT, // 놀이를 마치면 골목 문 앞에서 북쪽(빛나는 문)을 보고 선다
  layout: {
    // 1920~30년대 경성 골목: 뾰족탑 학교와 벽돌 건물, 길가의 2층 상점과 가로등, 조선어 학회가 있던 기와집, 멀리 벽돌 건물과 굴뚝
    ground: 'earth', groundColor: 0x9a8a6a, bounds: { x0: -16, x1: 16, z0: -6, z1: 11 }, start: [0, 9], hill: 1.2,
    skyline: { style: 'brick', color: 0x4e4a46, arc: [Math.PI * 0.55, Math.PI * 1.45] },
    roads: [{ x: 0, z: 2, w: 36, d: 5, color: 0x8a8070 }, { x: 0, z: 10, w: 4, d: 10, color: 0x8a8070 }],
    props: [
      { type: 'western', x: SCHOOL.x, z: SCHOOL.z, w: 10, d: SCHOOL.d, h: 6, tower: true, color: 0x8a4a3a },
      { type: 'hanok', x: HAK.x, z: HAK.z, tile: true, scale: 1.3 },
      { type: 'desk', x: 5, z: -4.5 }, { type: 'desk', x: 12.5, z: -4.5 },
      { type: 'shop', x: -13, z: 8.5, w: 5, style: 'modern', ry: Math.PI, sign: '서점', awning: 0x2f6b5e, seed: 2 },
      { type: 'shop', x: 13, z: 8.5, w: 5, style: 'modern', ry: Math.PI, sign: '양화점', awning: 0x8a2f24, seed: 4 },
      { type: 'crowd', x: -10, z: -2, n: 6, cols: 3, looks: ['student', 'schoolgirl'], face: 0.4 },
      { type: 'lamp', x: -6, z: -0.8 }, { type: 'lamp', x: 6, z: 4.8 }, { type: 'tree', x: 17, z: -5, kind: 'poplar' }, { type: 'tree', x: -17, z: 4, kind: 'poplar' },
      { type: 'wall', x: -8.5, z: GATE_Z, w: 13, h: 1.8, solid: false }, { type: 'wall', x: 8.5, z: GATE_Z, w: 13, h: 1.8, solid: false }, // 골목 어귀 담과 문
    ],
    npcs: [
      { id: 'student', look: 'student', x: -4, z: 6, ry: Math.PI * 0.8 },
      { id: 'historian', look: 'gentleman', x: -11, z: 5.4, ry: Math.PI * 0.75 },
      { id: 'merchant', look: 'commoner', x: 11, z: 5.6, ry: -Math.PI * 0.75 },
      { id: 'linguist', look: 'scholarModern', x: 7, z: -1.5, ry: 0 },
    ],
    // 길 위 안내판 대신 간판(C-03): 뾰족탑 건물 「학교」, 기와집 「조선어 학회」. 안내판 글(물산 장려·6·10 만세)은 사람 대사·걷기로 옮겼다
    signs: [{ id: 'signSchool', title: '학교', x: SCHOOL.x + 2, z: SCHOOL.z + SCHOOL.d / 2 + 0.5, ry: 0, plaque: { y: 4.3, back: 0.42 } },
      { id: 'signHak', title: '조선어 학회', x: HAK.x, z: HAK.z + 2.9, ry: 0, plaque: { y: 2.9, back: 0.6 } }],
  },
  parts: [
    { ...script.parts.pages, goal: script.goals[3], arena: STREETS, from: [0, 17],
      route: xy(script.parts.pages.route, [{ x: -6, z: 6 }, { x: 6, z: -4 }, { x: 0, z: -16 }]),
      pickups: xy(script.parts.pages.pickups, [{ x: -16, z: 16 }, { x: 16, z: 6 }, { x: -16, z: 0 }, { x: 16, z: -12 }, { x: -14, z: -16 }]),
      hazards: [{ x: -16, z: 8, to: [16, 8], kind: 'crowd', r: 1.6, speed: 0.4 }, { x: 16, z: -8, to: [-16, -8], kind: 'crowd', r: 1.6, speed: 0.45 }] },
    { ...script.parts.culture, goal: script.goals[4], intro: meet('historian', '역사학자와 이야기하기', script.parts.culture.intro), play: ctx => cultureWalk(ctx) },
  ],
  // 골목 문과 「경성」 이름판은 굳히기에 합쳐지지 않게 돌려준다
  decorate(world) {
    const gate = gateLeaves(world.level, { x: 0, z: GATE_Z, width: 4, height: 2.6, inward: -1 });
    const board = nameBoard(world.level, '경성', 3.2, GATE_Z - 1.6);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return { gate, board };
  },
});

// 장 도입(C-03): ① 골목 가게 앞에서 사람들이 우리 물건을 고른다 ② 학교 앞에서 학생들이 책을 끼고 모여 있다. 끝나면 더한 것을 치운다
function introScene(ctx) {
  const { world } = ctx, L = world.level;
  const buyers = [['woman', 11.6, 5.2, Math.PI], ['citizen', 12.8, 5.6, Math.PI], ['grandma', 13.8, 5, Math.PI]].map(([look, x, z, ry]) => { const p = person(L, look, x, z, ry); p.visible = false; return p; });
  const pupils = [['student', -8.4, -4.4], ['schoolgirl', -7, -4], ['student', -9.6, -3.6], ['schoolgirl', -8, -3]].map(([look, x, z]) => { const p = person(L, look, x, z, 0.3); setCarry(p, book(), 'side'); p.visible = false; return p; });
  const hide = on => { for (const id of [...PEOPLE, 'linguist']) { const n = world.npcs.get(id); if (n) n.mesh.visible = on; } };
  return {
    shots: [
      { cam: [8.4, 2.4, 1.6], look: [12.8, 1.4, 6.4], to: { cam: [9, 2.3, 1.2], look: [12.8, 1.4, 6.4] },
        act: () => { hide(false); buyers.forEach(p => { p.visible = true; }); } }, // 우리 물건을 고르는 사람들
      { cam: [-4.2, 2.5, 3.2], look: [-8.4, 1.4, -4.4], to: { cam: [-4.8, 2.4, 2.6], look: [-8.4, 1.4, -4.4] },
        act: () => { buyers.forEach(p => { p.visible = false; }); pupils.forEach(p => { p.visible = true; }); } }, // 학교 앞 학생들
    ],
    done: () => { hide(true); for (const o of [...buyers, ...pupils]) o.removeFromParent(); },
  };
}

export const villageTalk = (id, heard) => anyOrderTalk(script, PEOPLE, id, heard);
export const devScene = () => scene; // 개발용(사진 찍기)

export default {
  ...base,
  anyOrder: true, // 골목 사람은 아무 차례로(차례 전 대사 tooEarly가 없다, tests/quest.test.js)
  introScene,
  portal: { at: [0, 3.4], ry: 0 }, // 미니게임 뒤 빛나는 문(C-02): 돌아온 학생(SPOT) 바로 앞, 앞면은 학생(남쪽) 쪽
  buildScene(world) { scene = base.buildScene(world); return scene; },
  enterStage(ctx, stage) { scene.gate.setOpen(0); ctx.world.closeView = true; base.enterStage(ctx, stage); },
  // 모두 들은 뒤 조선어 학회 학자에게 가면 학생의 결심 → 광주 학생 항일 운동 장면
  async explore(ctx) {
    await walkInAndTalk(ctx, script, { people: PEOPLE, final: 'linguist', gate: scene.gate, from: INTRO_FROM, to: base.layout.start });
    await gwangjuScene(ctx);
  },
  // 공용 kit 미니게임을 그대로 돌리되, { meet } 줄에서는 그 사람에게 말을 걸 때까지 기다린다(C-05, chapters/kit/walk.js)
  minigame: ctx => minigameWithMeet(base, ctx),
};
