// 일제 강점기편 4장 「봉오동 전투와 청산리 대첩」(D-42): 1920년 만주 산골짜기의 독립군 진영.
// 「독립군 진영」 문으로 들어와 독립군 대원·홍범도·남자현 이야기를 아무 차례로 듣고(모두 들어야 김좌진),
// 김좌진에게 가면 학생의 결심 → 봉오동 골짜기 양쪽 숲에 숨은 홍범도 부대가 일본군을 무찌르는 장면 →
// ① 흩어진 부대 모으기 ② 김좌진에게 말을 걸면 청산리 산비탈 풀숲에 엎드려 매복 ③ 홍범도에게 말을 걸면 승리한 진영 걷기.
import * as THREE from 'three';
import { makeKitChapter } from '../../kit/chapter.js';
import { buildArena, proneShooter, muzzleFire } from '../../kit/play.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { walkInAndTalk, anyOrderTalk } from '../../kit/talk.js';
import { burning } from '../../kit/fire.js';
import { wait, person, ease, face, stationMarks, walkStations, sayer, meet, minigameWithMeet, facingShare } from '../../kit/walk.js';
import { LOOKS } from '../../../content/characters.js';
import { placePlayer } from '../../joseon/common.js';
import script from './script.js';

const PEOPLE = ['soldier', 'hongbeomdo', 'namjahyeon'];
const GATE_Z = 14.5, INTRO_FROM = [0, 17.5], SPOT = [0, 7];
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const pines = pts => pts.map(([x, z]) => ({ type: 'tree', x, z, color: 0x34503a }));
const JAPAN = { ...LOOKS.gendarme, gear: 'rifle' };
// 골짜기 양쪽 산비탈 풀숲에 엎드려 길 앞쪽(빛나는 곳)을 겨눈 독립군(근대 6장 D-38과 같은 자세, 군모라 머리띠는 없다). (x, z)는 가슴 자리
const AIM = (x, z) => ({ x, z, ry: Math.atan2(-x, -1 - z), look: 'independenceArmy', band: false });
const SHOOTERS = [AIM(-4.4, 9), AIM(-5.8, 10.2), AIM(-4, 11.4), AIM(4.4, 8.6), AIM(5.9, 9.8), AIM(4.2, 11.2)];
// 만세: 두 팔을 번쩍 들었다 내린다(k 0~1)
const cheerPose = (p, k) => { const a = p.userData.arms; if (!a) return; const u = Math.sin(k * Math.PI); a[1].rotation.x = -Math.PI * 0.95 * u; a[0].rotation.x = -Math.PI * 0.95 * u; }; // 팔은 앞으로 들어 올린다(음수, D-45)

// ── 무대(마을에서 떨어진 x 400) ──
const FOREST = { edge: { style: 'forest', seed: 836 }, center: [{ type: 'firepit', x: -15, z: 5 }, { type: 'rifles', x: 16, z: 10 }, { type: 'woodpile', x: 17, z: -6, ry: 0.5 }, { type: 'cargo', x: -15, z: -15, kind: 'crate', n: 3 }, { type: 'rifles', x: 7, z: 18 }],
  origin: [400, 0], ground: 'grass', groundColor: 0x5a7646, bounds: { x0: -24, x1: 24, z0: -26, z1: 26 },
  props: [
    { type: 'tent', x: -12, z: 13, color: 0x6b6a4a }, { type: 'tent', x: 13, z: 3, color: 0x6b6a4a }, { type: 'tent', x: -12, z: -9, color: 0x6b6a4a },
    ...pines([[-20, 20], [20, 20], [-4, 22], [6, 12], [-20, 2], [20, -10], [-3, -14], [10, -20], [-18, -20], [3, 2]]),
  ],
};
// 청산리 골짜기: 가운데 골짜기 길, 양쪽 산비탈 숲에 독립군이 엎드려 있다(근대 6장 고갯길 PASS와 같은 틀)
const VALLEY = { edge: { style: 'forest', seed: 543 }, center: [{ type: 'rifles', x: -18, z: 12 }, { type: 'cargo', x: 17, z: 13, kind: 'crate', n: 3 }, { type: 'firepit', x: -15, z: 16 }],
  origin: [400, 0], ground: 'grass', groundColor: 0x5f7a48, bounds: { x0: -30, x1: 30, z0: -30, z1: 30 },
  roads: [{ x: 0, z: 0, w: 5, d: 70, color: 0x7a6a50 }],
  props: pines([[-9, -20], [-11, -10], [-10, -1], [9, -20], [11, -10], [10, -2], [-16, -4], [16, 4], [-14, -14], [14, -14]]),
};
// 봉오동 골짜기(탐험 끝 장면): 같은 골짜기 꼴, 학생과 김좌진은 뒤쪽 높은 곳에서 지켜본다
export const BONGO = { edge: { style: 'forest', seed: 611 },
  origin: [400, 0], ground: 'grass', groundColor: 0x5a7444, bounds: { x0: -24, x1: 24, z0: -30, z1: 20 },
  roads: [{ x: 0, z: -5, w: 5, d: 50, color: 0x7a6a50 }],
  props: pines([[-9, -18], [-11, -8], [9, -18], [11, -8], [-15, -3], [15, 5], [-14, -14], [14, -13]]), // 지켜보는 자리와 길 사이는 비운다
  shooters: [AIM(-4.4, 5), AIM(-5.8, 6.2), AIM(-4, 7.4), AIM(-6.4, 4.2), AIM(4.4, 4.6), AIM(5.9, 5.8), AIM(4.2, 7.2), AIM(6.4, 3.8)],
  watch: [5.5, 13], hong: [-2.6, 11.5],
};
// 승리한 진영: 홍범도 → 김좌진 → 모닥불 가 대원들
export const CAMP = { edge: { style: 'camp', seed: 652 }, center: [{ type: 'rifles', x: 12, z: -6 }, { type: 'cargo', x: 13, z: 8, kind: 'crate', n: 3 }, { type: 'cargo', x: -13, z: 8, kind: 'crate', n: 3 }],
  origin: [400, 0], ground: 'grass', groundColor: 0x5f7a4c, bounds: { x0: -18, x1: 18, z0: -14, z1: 14 },
  props: [{ type: 'tent', x: -10, z: -10, color: 0x6b6a4a }, { type: 'tent', x: 10, z: -10, color: 0x6b6a4a }, { type: 'flagpole', x: -3.5, z: -11 }],
  from: [0, 12], fire: [0, -6],
  stations: [{ x: -6, z: 6 }, { x: 6, z: 1 }, { x: 0, z: -2.6 }],
};

// ── 탐험 끝 장면: 봉오동 골짜기에 들어온 일본군을 양쪽 숲의 홍범도 부대가 무찌른다 ──
export async function bongoScene(ctx) {
  const { world, dialogue } = ctx;
  const L = script.bongo.lines, A = BONGO, say = sayer(ctx);
  ctx.setGoal(script.goals[2]);
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  const hook = ctx.testHooks.bongo = { prone: 0, enemies: 0, volleys: 0, fallen: 0, retreated: false };
  const shooters = A.shooters.map((sp, i) => proneShooter(g, { seed: i + 3, ...sp })); hook.prone = shooters.length;
  const hong = person(g, 'hongbeomdo', ...A.hong, Math.PI);
  const kim = person(g, 'kimjwajin', A.watch[0] + 1.4, A.watch[1] + 0.3, Math.PI);
  const enemy = [];
  for (let r = 0; r < 4; r++) for (const sx of [-1, 1]) { const p = person(g, JAPAN, sx * 0.9, -30 - r * 1.6, 0); enemy.push(p); }
  hook.enemies = enemy.length;
  const W = a.at(...A.watch); placePlayer(world, [W.x, W.z], Math.PI);
  const C = a.at(0.5, 15.5), T = a.at(0, -8);
  const wide = () => world.setFixedCamera([C.x, 3.8, C.z], [T.x, 0.4, T.z]); // 엎드린 독립군 등 뒤 낮은 곳에서 골짜기 길 앞쪽을 본다(매복 놀이와 같은 눈높이)
  try {
    wide();
    await ctx.fade?.(false);
    const z0 = enemy.map(p => p.position.z);
    const march = wait(world, 6, k => enemy.forEach((p, i) => { p.position.z = z0[i] + 26 * k; })); // 일본군이 골짜기 깊이 들어온다
    await dialogue.say(L[0]);
    await march;
    dialogue.close();
    await say(L[1], hong);
    dialogue.close();
    wide();
    const front = [...enemy].sort((p, q) => q.position.z - p.position.z); // 앞줄부터
    for (let v = 0; v < 3; v++) { // 양쪽 숲에서 세 번 쏘고, 맞은 앞줄 일본군이 뒤로 쓰러진다(D-45, 피는 없다)
      shooters.forEach((sh, i) => { if ((i + v) % 2 === 0 || v === 2) muzzleFire(g, sh, ctx); });
      ctx.audio?.play?.('shot');
      hook.volleys += 1;
      const hit = front.slice(v * 2, v * 2 + 2);
      await wait(world, 0.7, k => hit.forEach((p, i) => { const u = Math.min(1, Math.max(0, k * 1.6 - i * 0.2)); p.rotation.x = -Math.PI / 2 * u * u; }));
      hook.fallen += hit.length;
    }
    const left = front.slice(6), z1 = left.map(p => p.position.z);
    left.forEach(p => { p.rotation.y = Math.PI; });
    await wait(world, 3, k => left.forEach((p, i) => { p.position.z = z1[i] - 24 * ease(k); })); // 남은 일본군은 크게 지고 물러난다
    hook.retreated = left.every((p, i) => p.position.z < z1[i] - 10);
    await dialogue.say(L[2]);
    await say(L[3], kim);
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

// ── 승리한 진영 걷기 ──
const ACT = {
  async hong({ st, say, hook, set }) {
    await say(st.lines[0], set.hong);
    await say(st.lines[1], set.hong);
    hook.met.push('hongbeomdo');
  },
  async kim({ st, say, hook, set }) {
    await say(st.lines[0], set.kim);
    await say(st.lines[1], set.kim);
    hook.met.push('kimjwajin');
  },
  async camp({ ctx, a, st, say, hook, set }) { // 모닥불 둘레의 대원들이 총을 들고 만세
    const { world } = ctx;
    const F = a.at(...CAMP.fire), S = a.at(-2.4, -3.4);
    placePlayer(world, [S.x, S.z], Math.PI * 0.85); // 학생은 불 왼쪽 앞으로 비켜 선다(카메라를 가리지 않게)
    const view = () => world.setFixedCamera([F.x + 1.6, 2.9, F.z + 6.4], [F.x, 1.4, F.z - 1.4]); // 불 앞(남쪽)에서 대원들을 마주 본다
    view();
    set.ring.forEach(p => face(p, F.x - a.at(0, 0).x + 1.6, F.z - a.at(0, 0).z + 6.4)); // 모두 카메라 쪽을 본다
    hook.facing = facingShare(world, set.ring);
    for (let n = 0; n < 3; n++) {
      ctx.audio?.play?.('correct');
      await wait(world, 0.9, k => set.ring.forEach((p, i) => cheerPose(p, Math.min(1, Math.max(0, k * 1.15 - (i % 3) * 0.05)))));
      hook.cheers += 1;
      if (n === 0) { await say(st.lines[0], set.ring[0]); ctx.dialogue.close(); view(); }
    }
    await say(st.lines[1]);
  },
};

export async function victoryWalk(ctx) {
  const { world, hud } = ctx;
  const P = script.parts.victory, A = CAMP;
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  const hook = ctx.testHooks.victory = { used: [], pressed: 0, met: [], cheers: 0, fire: false, facing: 0 };
  const hong = person(g, 'hongbeomdo', -7.6, 4.6, Math.PI / 4);
  const kim = person(g, 'kimjwajin', 7.8, -0.2, -Math.PI / 4);
  const [fx, fz] = A.fire;
  const fire = burning(world, { parent: g, x: fx, y: 0.2, z: fz, size: 0.6, level: 1 }); hook.fire = true;
  const ring = [];
  for (let i = 0; i < 7; i++) { // 불 북쪽에 활처럼 둘러서서 모두 남쪽(학생·카메라 쪽)을 본다(D-45: 만세는 얼굴이 보이게)
    const t = Math.PI * (-0.42 + i * 0.14), p = person(g, 'independenceArmy', fx + Math.sin(t) * 2.6, fz - Math.cos(t) * 2.2 - 0.6, 0); ring.push(p); }
  const marks = stationMarks(a, g, P.stations, A.stations);
  const p0 = a.at(...A.from); placePlayer(world, [p0.x, p0.z], Math.PI);
  const set = { hong, kim, ring };
  const say = sayer(ctx);
  try {
    await ctx.fade?.(false);
    await walkStations(ctx, {
      stations: P.stations, marks, counter: '만난 사람',
      async act(st) { hook.pressed += 1; await ACT[st.id]({ ctx, a, g, st, say, hook, set }); hook.used.push(st.id); },
    });
  } finally {
    await ctx.fade?.(true);
    hud.setCounter(null);
    fire.setLevel?.(0);
    a.dispose();
    placePlayer(world, SPOT);
    world.camMode = 'follow'; world.snapCamera();
    ctx.input.enabled = false;
    await ctx.fade?.(false);
  }
}

const base = makeKitChapter({
  id: 'i4', mood: 'forest', script,
  player: { robe: 0x5a6448, hat: 'cap', gear: 'rifle', trim: 0x2b241c, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['soldier', 'hongbeomdo', 'namjahyeon', 'kimjwajin'],
  spot: SPOT, // 놀이를 마치면 진영 문 앞에서 북쪽(빛나는 문)을 보고 선다
  layout: {
    // 1920년 만주의 깊은 산골짜기: 가파른 산이 둘러싼 좁은 골짜기, 솔숲 속 천막 진영과 나무 막사, 골짜기를 따라 난 흙길
    ground: 'grass', groundColor: 0x68854f, bounds: { x0: -15, x1: 15, z0: -9, z1: 11 }, start: [0, 9], hill: 2.4,
    roads: [{ x: 0, z: 2, w: 4, d: 26, color: 0x7a6a50 }],
    props: [
      { type: 'tent', x: -10, z: 6, color: 0x8a8a6a }, { type: 'tent', x: -12, z: 0, color: 0x8a8a6a }, { type: 'tent', x: 11, z: 7.5, color: 0x8a8a6a }, { type: 'tent', x: 12.5, z: 1, color: 0x7a7a5a },
      { type: 'barracks', x: -8.5, z: -8.5, w: 7, color: 0x6b5a42 }, { type: 'barracks', x: 8.5, z: -8.5, w: 7, color: 0x5a4a36 },
      { type: 'flagpole', x: 3.5, z: -5.6 },
      { type: 'crowd', x: 8, z: -3.4, n: 6, cols: 3, looks: ['independenceArmy'], face: -Math.PI / 2 },
      { type: 'desk', x: -3, z: -4.6 }, { type: 'woodpile', x: -14.5, z: 4 }, { type: 'woodpile', x: 15, z: -3 },
      { type: 'tree', x: -15.5, z: -8, kind: 'pine' }, { type: 'tree', x: 15.5, z: -9, kind: 'pine' }, { type: 'tree', x: -16.5, z: 9, kind: 'pine' }, { type: 'tree', x: 16.5, z: 10, kind: 'pine' },
      { type: 'wall', x: -8.5, z: GATE_Z, w: 13, h: 1.8, color: 0x6b4a32, solid: false }, { type: 'wall', x: 8.5, z: GATE_Z, w: 13, h: 1.8, color: 0x6b4a32, solid: false }, // 진영 어귀 목책과 문
    ],
    npcs: [
      { id: 'soldier', look: 'independenceArmy', x: -5, z: 6, ry: Math.PI * 0.8 },
      { id: 'hongbeomdo', look: 'hongbeomdo', x: 5, z: -1, ry: -Math.PI / 2 },
      { id: 'namjahyeon', look: 'woman', x: 7.5, z: 4.6, ry: -Math.PI * 0.7 },
      { id: 'kimjwajin', look: 'kimjwajin', x: -6, z: -2.5, ry: Math.PI / 2 },
    ],
    // 길 위 안내판 대신 막사 간판(C-03): 「독립군 사령부」·「무기 창고」. 안내판 글(여성 독립운동가·의열단)은 사람 대사로 옮겼다
    signs: [{ id: 'signHq', title: '독립군 사령부', x: -8.5, z: -6.0, ry: 0, plaque: { y: 2.55, back: 0.45 } },
      { id: 'signArms', title: '무기 창고', x: 8.5, z: -6.0, ry: 0, plaque: { y: 2.55, back: 0.45 } }],
    scatter: [
      { kind: 'pine', count: 70, area: { x0: -70, x1: 70, z0: -60, z1: 30 }, avoid: [{ x: 0, z: 1, r: 18 }], seed: 431, scale: [1.2, 1.9] },
      { kind: 'rock', count: 18, area: { x0: -15, x1: 15, z0: -9, z1: 11 }, avoid: [{ x: 0, z: 1, r: 4 }, { x: -10, z: 4, r: 4 }, { x: 10, z: 3, r: 5 }, { x: -5, z: 6, r: 2 }, { x: 5, z: -1, r: 2 }, { x: -6, z: -3, r: 2 }, { x: 7.5, z: 4.6, r: 2 }, { x: -8.5, z: -8, r: 5 }, { x: 8.5, z: -8, r: 5 }], keep: (x, z) => Math.abs(x) > 3.5, seed: 432 }, // 가운데 흙길(너비 4)은 비운다
    ],
  },
  parts: [
    { ...script.parts.gather, goal: script.goals[3], arena: FOREST, from: [0, 23], followers: { looks: ['independenceArmy'], per: 2 },
      route: xy(script.parts.gather.route, [{ x: -8, z: 12 }, { x: 9, z: 2 }, { x: -8, z: -9 }, { x: 0, z: -21 }]),
      pickups: xy(script.parts.gather.pickups, [{ x: 16, z: 14 }, { x: -17, z: -6 }, { x: 14, z: -16 }]) },
    { ...script.parts.ambush, goal: script.goals[4], intro: meet('kimjwajin', '김좌진과 이야기하기', script.parts.ambush.intro), arena: VALLEY, camera: { pos: [0.5, 3.6, 19.5], target: [0, 0.4, -3] }, path: [[0, -34], [0, 7]], zone: { x: 0, z: -1, r: 5 }, look: 'gendarme', shooters: SHOOTERS, flag: true }, // 독립군 등 뒤 낮은 곳에서 골짜기 길 앞쪽을 본다(근대 6장 D-38과 같게)
    { ...script.parts.victory, goal: script.goals[5], intro: meet('hongbeomdo', '홍범도와 이야기하기', script.parts.victory.intro), play: ctx => victoryWalk(ctx) },
  ],
  // 진영 문과 「독립군 진영」 이름판은 굳히기에 합쳐지지 않게 돌려준다
  decorate(world) {
    const gate = gateLeaves(world.level, { x: 0, z: GATE_Z, width: 4, height: 2.6, inward: -1 });
    const board = nameBoard(world.level, '독립군 진영', 3.2, GATE_Z - 1.6);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return { gate, board };
  },
});

// 장 도입(C-03): ① 나라 밖으로 떠난 사람들이 만주 진영으로 걸어 들어온다 ② 대원들이 줄지어 총을 메고 훈련한다. 끝나면 더한 것을 치운다
function introScene(ctx) {
  const { world } = ctx, L = world.level;
  const comers = [['peasant', -0.8, 6.5], ['student', 0.8, 7.2], ['woman', -0.2, 8.4], ['citizen', 1.2, 9]].map(([look, x, z]) => { const p = person(L, look, x, z, Math.PI); p.visible = false; return p; });
  const drill = [];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) { const p = person(L, 'independenceArmy', -2.4 + i * 1.6, -3 + r * 1.5, 0); p.visible = false; drill.push(p); }
  let off = null;
  const run = fn => { off?.(); let t = 0; off = world.onUpdate(dt => { t += dt; fn(t, dt); }); };
  const hide = on => { for (const id of [...PEOPLE, 'kimjwajin']) { const n = world.npcs.get(id); if (n) n.mesh.visible = on; } };
  return {
    shots: [
      { cam: [3.4, 2.4, 12.5], look: [0, 1.4, 6.5], to: { cam: [2.8, 2.3, 11.8], look: [0, 1.4, 6] },
        act: () => { hide(false); comers.forEach(p => { p.visible = true; }); run((t, dt) => comers.forEach(p => { p.position.z -= dt * 0.9; })); } }, // 나라 밖으로 떠난 사람들이 진영으로
      { cam: [5.5, 2.6, 3.5], look: [0, 1.3, -2.2], to: { cam: [4.8, 2.5, 2.8], look: [0, 1.3, -2.2] },
        act: () => { off?.(); off = null; comers.forEach(p => { p.visible = false; }); drill.forEach(p => { p.visible = true; }); } }, // 대원들이 줄지어 훈련한다
    ],
    done: () => { off?.(); off = null; hide(true); for (const o of [...comers, ...drill]) o.removeFromParent(); },
  };
}

let scene = null;
export const villageTalk = (id, heard) => anyOrderTalk(script, PEOPLE, id, heard);
export const devScene = () => scene; // 개발용(사진 찍기)

export default {
  ...base,
  anyOrder: true, // 진영 사람은 아무 차례로(차례 전 대사 tooEarly가 없다, tests/quest.test.js)
  introScene,
  portal: { at: [0, 3.4], ry: 0 }, // 미니게임 뒤 빛나는 문(C-02): 돌아온 학생(SPOT) 바로 앞, 앞면은 학생(남쪽) 쪽
  buildScene(world) { scene = base.buildScene(world); return scene; },
  enterStage(ctx, stage) { scene.gate.setOpen(0); ctx.world.closeView = true; base.enterStage(ctx, stage); },
  // 모두 들은 뒤 김좌진에게 가면 학생의 결심 → 봉오동 전투 장면
  async explore(ctx) {
    await walkInAndTalk(ctx, script, { people: PEOPLE, final: 'kimjwajin', gate: scene.gate, from: INTRO_FROM, to: base.layout.start });
    await bongoScene(ctx);
  },
  // 공용 kit 미니게임을 그대로 돌리되, { meet } 줄에서는 그 사람에게 말을 걸 때까지 기다린다(C-05, chapters/kit/walk.js)
  minigame: ctx => minigameWithMeet(base, ctx),
};
