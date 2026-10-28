// 근대편 2장 「갑신정변」(D-29): 해 질 녘 한성 거리와 우정총국.
// 큰길 문으로 들어와 상인·우정총국 관리의 이야기를 아무 차례로 듣고(막지 않음), 김옥균에게 가면 학생의 결심 →
// 김옥균을 따라 그날 밤을 걷기(잔치 → 정변 → 개혁안 발표 → 청 군대 → 3일 만에 끝남) → 방을 들고 진짜 개혁안만 게시판에 붙이기.
import * as THREE from 'three';
import { makeKitChapter } from '../../kit/chapter.js';
import { buildArena } from '../../kit/play.js';
import { BUILD } from '../../kit/town.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { walkInAndTalk, anyOrderTalk } from '../../kit/talk.js';
import { leadWalk } from '../../kit/lead.js';
import { showHowTo } from '../../../core/minigame.js';
import { makePerson, animateWalk } from '../../../core/people.js';
import { LOOKS } from '../../../content/characters.js';
import { sayAll, placePlayer } from '../../joseon/common.js';
import script from './script.js';

const PEOPLE = ['merchant', 'clerk'];
const GATE_Z = 12.5, INTRO_FROM = [0, 15.5];

// 미니게임 무대(마을에서 떨어진 x 400): 겨울밤의 우정총국 거리(김옥균을 따라 걷는 길)와 개혁안 게시판이 선 마당
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const NIGHT = { edge: { style: 'street', seed: 709 }, center: [{ type: 'papers', x: -7, z: -4, kind: 'news', n: 3 }, { type: 'cart', x: 8, z: 5, ry: -0.4 }, { type: 'jars', x: -8, z: 6 }, { type: 'cart', x: 7, z: 10, ry: -0.4 }, { type: 'jars', x: -9, z: 3 }, { type: 'papers', x: 9, z: 3, kind: 'news', n: 3 }],
  origin: [400, 0], ground: 'stone', groundColor: 0x847e74, bounds: { x0: -20, x1: 20, z0: -18, z1: 18 },
  roads: [{ x: 0, z: 0, w: 6, d: 36, color: 0x6e6a62 }],
  props: [
    { type: 'hanok', x: -9, z: 10, ry: Math.PI / 2, tile: true }, { type: 'hanok', x: 10, z: -2, ry: -Math.PI / 2, tile: true, scale: 1.3 },
    { type: 'hanok', x: -12, z: -12, tile: true, scale: 1.4 }, { type: 'hanok', x: 12, z: -12, tile: true },
    { type: 'crowd', x: -8, z: 7, n: 3, cols: 3, looks: ['joseonOfficial'], face: Math.PI / 2 }, // 우정총국 잔치에 모인 관리들
  ],
};
const YARD = { edge: { style: 'tile', seed: 134 }, center: [{ type: 'papers', x: 4, z: -9, kind: 'book', n: 2 }, { type: 'jars', x: 14, z: 6 }],
  origin: [400, 0], ground: 'earth', groundColor: 0x9a8a70, bounds: { x0: -18, x1: 18, z0: -12, z1: 14 },
  props: [{ type: 'hanok', x: 0, z: -12, tile: true, scale: 1.5 }, { type: 'wall', x: -14, z: -2, w: 2 }, { type: 'wall', x: 14, z: -2, w: 2 },
    { type: 'noticeBoard', x: -7, z: -5, n: -1 }], // 빈 게시판(n -1: 미리 붙은 종이 없음). 학생이 가져온 방이 여기에 붙는다
};
const BOARD_DROP = [-0.6, 1.42, -2.93, 0.6]; // 게시판 칸(-7, -2) 기준: 게시판 판 앞면에 왼쪽부터 붙인다

// 김옥균을 따라 걷는 밤길: 멈추는 곳(무대 기준)과 학생이 서는 곳
const NIGHT_STOPS = [
  { at: [-3.5, 8], stand: [-1, 10], face: -Math.PI / 2 },  // 1 잔치(관리들 앞)
  { at: [3, 2], stand: [1, 4.5], face: Math.PI * 0.8 },     // 2 정변
  { at: [-3, -4], stand: [-0.5, -1.5], face: Math.PI * 0.8 }, // 3 개혁안 발표(게시판이 솟는다)
  { at: [2.5, -9], stand: [0, -7], face: Math.PI },          // 4 청 군대(북쪽에서 몰려온다)
  { at: [6, -11], stand: [2.5, -10], face: -Math.PI / 2 },   // 5 3일 만에 끝남(김옥균이 몸을 피한다)
];

const base = makeKitChapter({
  id: 'k2', mood: 'winterDusk', script,
  player: { robe: 0xc9d4d8, hat: 'topknot', trim: 0x3a4a5a, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['merchant', 'clerk', 'kimokgyun'],
  spot: [0, 1],
  layout: {
    // 1884년 한성 종로 근처: 돌을 깐 큰길 양쪽에 기와·초가 가게와 노점, 가운데 우정총국, 멀리 도성 안 기와지붕들과 북쪽 산
    ground: 'earth', groundColor: 0x9e8b6c, bounds: { x0: -15, x1: 15, z0: -7, z1: 11 }, start: [0, 9], hill: 1.3,
    skyline: { style: 'hanok', color: 0x4a4e4c, arc: [Math.PI * 0.55, Math.PI * 1.45] },
    roads: [{ x: 0, z: 2, w: 34, d: 5, kind: 'stone', color: 0xa59c8a }, { x: 0, z: 8, w: 4, d: 16 }],
    props: [
      { type: 'hanok', x: 0, z: -6, tile: true, scale: 1.6, name: 'post' },
      { type: 'flagpole', x: 4, z: -4.5, color: 0xd9a441 },
      { type: 'wall', x: -6.5, z: -8.4, w: 5, h: 2.2, solid: false }, { type: 'wall', x: 6.5, z: -8.4, w: 5, h: 2.2, solid: false },
      { type: 'shop', x: -11.5, z: -4.6, w: 5, sign: '포목점', awning: 0x8a2f24 }, { type: 'shop', x: 11.5, z: -4.6, w: 5, sign: '지물포', awning: 0x6b5a3a, seed: 3 },
      { type: 'shop', x: -12, z: 8.5, w: 5, ry: Math.PI, thatch: true, seed: 2 }, { type: 'shop', x: 12, z: 8.5, w: 5, ry: Math.PI, thatch: true, seed: 5 },
      { type: 'stall', x: -11, z: 4.6, ry: Math.PI, color: 0xd8cdb0 }, { type: 'stall', x: 13.5, z: 4.6, ry: Math.PI, color: 0x8a6a48, seed: 4 },
      { type: 'rice', x: -8.5, z: 7.5, n: 6 }, { type: 'tree', x: 15.5, z: 14.5 },
      { type: 'wall', x: -8.5, z: GATE_Z, w: 13, h: 1.8, solid: false }, { type: 'wall', x: 8.5, z: GATE_Z, w: 13, h: 1.8, solid: false }, // 큰길 어귀 담
    ],
    npcs: [
      { id: 'merchant', look: 'commoner', x: -7, z: 4.5, ry: Math.PI * 0.8 },
      { id: 'clerk', look: 'joseonOfficial', x: 3.5, z: -1.5, ry: 0 },
      { id: 'kimokgyun', look: 'kimokgyun', x: 9, z: 3, ry: -Math.PI / 2 },
    ],
    signs: [{ id: 'signPost', title: '우정총국', x: -4, z: -2 }, { id: 'signCoup', title: '갑신정변', x: 5, z: 7.5 }],
    scatter: [{ kind: 'pine', count: 30, area: { x0: -60, x1: 60, z0: -40, z1: -14 }, seed: 211 }],
  },
  parts: [
    { type: 'scene', title: script.night.title, goal: script.goals[2], play: ctx => nightWalk(ctx) },
    { ...script.parts.reform, goal: script.goals[3], arena: YARD, from: [0, 5], bins: [{ ...script.parts.reform.bins[0], x: -7, z: -2, drop: BOARD_DROP }, { ...script.parts.reform.bins[1], x: 7, z: -2 }] },
  ],
  decorate(world) { // 큰길 어귀 나무 문과 「우정총국 앞 큰길」 이름판(S51). 문짝은 굳히기에 합쳐지지 않게 돌려준다
    const gate = gateLeaves(world.level, { x: 0, z: GATE_Z, width: 4, height: 2.6, inward: -1 });
    nameBoard(world.level, '우정총국 앞 큰길', 3.2, GATE_Z - 1.6);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return { gate };
  },
});

let scene = null;
const wait = (world, sec, f) => new Promise(res => { let t = 0; const off = world.onUpdate(dt => { t = Math.min(sec, t + dt); f?.(t / sec, dt); if (t >= sec) { off(); res(); } }); });

// 김옥균을 따라 그날 밤을 걷는다. 멈춘 곳마다 그때 일이 장면에 나타나고 이야기를 듣는다. 끝나면 무대를 치우고 김옥균은 제자리로
export async function nightWalk(ctx) {
  const { world, dialogue } = ctx;
  const N = script.night;
  await showHowTo(ctx.ui, N.howto);
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, NIGHT), g = a.group;
  const kim = world.npcs.get('kimokgyun'), home = { x: kim.mesh.position.x, z: kim.mesh.position.z, ry: kim.mesh.rotation.y, r: kim.collider.r };
  const start = a.at(0, 15), k0 = a.at(0, 12.5);
  world.moveNpc('kimokgyun', k0.x, k0.z, Math.PI);
  placePlayer(world, [start.x, start.z]);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.05, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.visible = false; world.level.add(ring);
  await ctx.fade?.(false);
  // 3에서 솟는 게시판, 4에서 몰려오는 청 군사
  const board = new THREE.Group(); BUILD.noticeBoard(board, {}); board.position.set(-6, -3, -4); board.visible = false; g.add(board);
  const qing = [0, 1, 2, 3, 4, 5].map(i => { const p = makePerson(LOOKS.qingSoldier); p.position.set((i % 3 - 1) * 1.6, 0, -26 - Math.floor(i / 3) * 1.6); p.visible = false; g.add(p); return p; });
  try {
    for (const [i, st] of NIGHT_STOPS.entries()) {
      ctx.hud.setCounter(`${i + 1}/${NIGHT_STOPS.length} ${N.stops[i].label}`);
      const at = a.at(...st.at), stand = a.at(...st.stand);
      await leadWalk(ctx, { id: 'kimokgyun', path: [[at.x, at.z]], stand: [stand.x, stand.z], ring, face: st.face });
      if (i === 2) { board.visible = true; await wait(world, 1.2, k => { board.position.y = -3 * (1 - k) * (1 - k); }); }
      if (i === 3) { // 청 군사들이 북쪽에서 걸어 내려온다
        qing.forEach(p => { p.visible = true; });
        await wait(world, 3, (k, dt) => qing.forEach((p, j) => { p.position.z = -26 - Math.floor(j / 3) * 1.6 + 12 * k; animateWalk(p, k < 1, dt); }));
      }
      if (i !== 3) { // 김옥균이 학생 쪽으로 돌아서서 정면으로 말한다
        const m = kim.mesh.position, pp = world.player.position;
        kim.mesh.rotation.y = Math.atan2(pp.x - m.x, pp.z - m.z);
        world.setTalkCamera(kim.mesh);
      }
      await sayAll(dialogue, N.stops[i].talk);
      dialogue.close(); world.camMode = 'follow';
      if (i === 4) { // 김옥균이 몸을 피해 동쪽 골목으로 걸어간다
        const p0 = kim.mesh.position.clone(), to = a.at(16, -11);
        await wait(world, 2.2, (k, dt) => { world.moveNpc('kimokgyun', p0.x + (to.x - p0.x) * k, p0.z + (to.z - p0.z) * k, Math.PI / 2); animateWalk(kim.mesh, k < 1, dt); });
      }
    }
  } finally {
    ctx.hud.setCounter(null);
    await ctx.fade?.(true);
    world.level.remove(ring); a.dispose();
    world.moveNpc('kimokgyun', home.x, home.z, home.ry); kim.collider.r = home.r; kim.mesh.visible = true;
    placePlayer(world, base.layout.start);
    ctx.input.enabled = false;
    await ctx.fade?.(false);
  }
}

export const villageTalk = (id, heard) => anyOrderTalk(script, PEOPLE, id, heard);
export const devScene = () => scene; // 개발용(사진 찍기)

export default {
  ...base,
  anyOrder: true, // 거리 사람은 아무 차례로(차례 전 대사 tooEarly가 없다, tests/quest.test.js)
  buildScene(world) { scene = base.buildScene(world); return scene; },
  enterStage(ctx, stage) { scene.gate.setOpen(0); ctx.world.closeView = true; base.enterStage(ctx, stage); },
  explore(ctx) { return walkInAndTalk(ctx, script, { people: PEOPLE, final: 'kimokgyun', gate: scene.gate, from: INTRO_FROM, to: base.layout.start }); },
};
