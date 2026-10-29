// 근대편 4장 「독립 협회와 대한 제국」(D-33): 한성 서대문 밖 큰길, 돌 독립문, 연단과 모인 사람들, 러시아 공사관·독립신문사.
// 마을 어귀 문으로 들어와 한성 시민·선비 이야기를 아무 차례로 듣고(모두 들어야 서재필), 서재필에게 가면 학생의 결심 →
// 환구단 즉위식 장면(사람들이 지켜보는 가운데 고종이 제단에 올라 황제 옷으로) →
// ① 독립신문 배달 ② 시민에게 말을 걸면 종로 만민 공동회 연설 ③ 시민들의 말이 맞는지 가려내기(judge).
import * as THREE from 'three';
import { makeKitChapter } from '../../kit/chapter.js';
import { buildArena } from '../../kit/play.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { walkInAndTalk, anyOrderTalk } from '../../kit/talk.js';
import { makePerson, mat } from '../../../core/people.js';
import { waitInteract } from '../../../core/portal.js';
import { LOOKS } from '../../../content/characters.js';
import { placePlayer } from '../../joseon/common.js';
import script from './script.js';

const PEOPLE = ['citizen', 'scholar'];
const GATE_Z = 14.5, INTRO_FROM = [0, 17.5], SPOT = [0, 6];
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const wait = (world, sec, f) => new Promise(res => { let t = 0; const off = world.onUpdate(dt => { t = Math.min(sec, t + dt); f?.(t / sec, dt); if (t >= sec) { off(); res(); } }); });
const person = (g, look, x, z, ry = 0) => { const p = makePerson(typeof look === 'string' ? LOOKS[look] : look); p.position.set(x, 0, z); p.rotation.y = ry; g.add(p); return p; };
const JAPAN = { ...LOOKS.gendarme, gear: 'rifle' }; // 1890년대 일본군(국방색 군복·모자)
const ease = k => k * k * (3 - 2 * k);

// 러시아 깃발(흰·파랑·빨강 가로 줄): 도입 장면에서 공사관 앞에 잠깐 세운다
function russianFlag() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4, 6), mat(0x5a3f2a, 'wood', 'object')); pole.position.y = 2; g.add(pole);
  [0xf2f2ee, 0x2f5aa8, 0xc0302a].forEach((c, i) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.3), new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }));
    s.position.set(0.72, 3.75 - i * 0.3, 0); g.add(s);
  });
  return g;
}

// ── 무대(마을에서 떨어진 x 400) ──
// 신문 배달: 1890년대 한성. 궁궐·러시아 공사관·신문사·환구단·종로가 흩어져 있다
const HANSEONG = { edge: { style: 'street', seed: 79 }, center: [{ type: 'papers', x: -17, z: 2, kind: 'news', n: 3 }, { type: 'cart', x: -16, z: -5, ry: 0.3 }, { type: 'noticeBoard', x: 16, z: -6, ry: -0.5 }, { type: 'cart', x: 7, z: 14, ry: 0.3 }, { type: 'papers', x: 9, z: 7, kind: 'news', n: 3 }],
  origin: [400, 0], ground: 'earth', groundColor: 0x9a8a6a, bounds: { x0: -24, x1: 24, z0: -22, z1: 22 },
  roads: [{ x: 0, z: 0, w: 46, d: 5, color: 0x8a8070 }, { x: 0, z: 0, w: 5, d: 44, color: 0x8a8070 }],
  props: [
    { type: 'hanok', x: -15, z: -16, tile: true, scale: 1.6 },              // 궁궐
    { type: 'western', x: 15, z: 15, w: 6, d: 6, h: 9, color: 0xe8e4da },   // 러시아 공사관
    { type: 'western', x: -15, z: 15, w: 6, d: 4, h: 4, color: 0x8a5a4a },  // 독립신문사
    { type: 'pavilion', x: 15, z: -16 },                                    // 환구단
    { type: 'stage', x: 15, z: 4 }, { type: 'crowd', x: 9, z: 2, n: 6, cols: 3, looks: ['citizen', 'gentleman', 'student'], face: Math.PI / 2 }, // 종로
  ],
};
// 환구단 즉위식(탐험 끝 장면): 가운데 둥근 세 단 제단(아래에서 따로 짓는다), 돌길 양옆에 신하, 뒤에 지켜보는 사람들
export const HWANGUDAN = { edge: { style: 'tile', seed: 133 },
  origin: [400, 0], ground: 'earth', groundColor: 0x9a8f78, bounds: { x0: -16, x1: 16, z0: -15, z1: 14 },
  roads: [{ x: 0, z: 5.5, w: 3, d: 14, color: 0xc8c2b6, kind: 'stone' }],
  props: [
    { type: 'wall', x: -9.5, z: -14, w: 13, color: 0x8c8577 }, { type: 'wall', x: 9.5, z: -14, w: 13, color: 0x8c8577 },
    { type: 'flagpole', x: -7, z: -4 }, { type: 'flagpole', x: 7, z: -4 },
    { type: 'tree', x: -13, z: -8, kind: 'pine' }, { type: 'tree', x: 13, z: -9, kind: 'pine' },
  ],
  altar: [0, -6], tiers: [[5.4, 0xc8c2b6], [4.2, 0xd6d0c4], [3.0, 0xe2dccf]], tierH: 0.45,
};
// 종로 만민 공동회: 북쪽 연단, 연단을 보는 사람들, 양옆 가게. 시민들은 앞마당에 흩어져 선다
export const JONGNO = { edge: { style: 'street', seed: 91 }, center: [{ type: 'papers', x: -11, z: -10, kind: 'news', n: 3 }, { type: 'noticeBoard', x: 11, z: -10, ry: -0.4 }],
  origin: [400, 0], ground: 'earth', groundColor: 0x9a8a6a, bounds: { x0: -18, x1: 18, z0: -13, z1: 14 },
  roads: [{ x: 0, z: 2, w: 36, d: 6, color: 0x8a8070 }],
  props: [
    { type: 'stage', x: 0, z: -8 }, { type: 'flagpole', x: -3.6, z: -9.6 }, { type: 'flagpole', x: 3.6, z: -9.6 },
    { type: 'crowd', x: -4.6, z: -4.4, n: 8, cols: 4, looks: ['commoner', 'gentleman', 'woman', 'scholar'], face: Math.PI },
    { type: 'crowd', x: 4.6, z: -4.4, n: 8, cols: 4, looks: ['citizen', 'commoner', 'student', 'woman'], face: Math.PI },
    { type: 'shop', x: -14, z: -4, w: 5, ry: Math.PI / 2, sign: '비단', seed: 2 }, { type: 'shop', x: -14, z: 6, w: 5, ry: Math.PI / 2, thatch: true, seed: 4 },
    { type: 'shop', x: 14, z: -4, w: 5, ry: -Math.PI / 2, sign: '종이', seed: 6 }, { type: 'shop', x: 14, z: 6, w: 5, ry: -Math.PI / 2, sign: '약방', seed: 1 },
  ],
  stand: [0, -8.3], from: [0, 11],
};
const JUDGE_SPOTS = [{ x: -9, z: 3, ry: 0.5 }, { x: -4.5, z: 7, ry: 0.2 }, { x: 0, z: 3.4, ry: 0 }, { x: 4.5, z: 7, ry: -0.2 }, { x: 9, z: 3, ry: -0.5 }];

let scene = null;

// ── 환구단 즉위식: 고종이 돌길을 걸어와 학생 쪽을 보고 말한 뒤 제단에 오르고, 맨 위에서 황제 옷(노란색)으로 바뀐다.
// 신하들이 제단 쪽으로 돌아서 절한다. 대사는 script.coronation.lines(출처 있는 문장 그대로) ──
export async function coronation(ctx) {
  const { world, dialogue } = ctx;
  const L = script.coronation.lines, A = HWANGUDAN;
  ctx.setGoal(script.goals[2]);
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group, O = a.at(0, 0);
  // 둥근 세 단 제단과 앞 계단(위로 갈수록 작고 밝은 돌)
  const [ax, az] = A.altar, H = A.tierH, TOP = H * A.tiers.length;
  A.tiers.forEach(([r, c], i) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.15, H, 32), mat(c, 'stone')); m.position.set(ax, H * (i + 0.5), az); m.receiveShadow = true; m.castShadow = true; g.add(m); });
  for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(1.8, (i + 1) * (TOP / 6), 0.46), mat(0xbab3a5, 'stone')); s.position.set(ax, (i + 1) * (TOP / 12), az + 5.5 - i * 0.46); g.add(s); }
  const stepY = z => Math.min(1, Math.max(0, (az + 5.7 - z) / 2.8)) * TOP; // 계단을 오르는 높이
  world.addCollider({ ...a.at(ax, az), r: 5 }); // 학생이 제단 위로 걸어 올라가지 않게(무대를 치우면 함께 치운다)
  // 신하: 돌길 양옆에 마주 보고 선다 / 지켜보는 사람들: 뒤쪽 양옆
  const officials = [1, 3, 5, 7].flatMap(z => [person(g, 'joseonOfficial', -2.4, z, Math.PI / 2), person(g, 'joseonOfficial', 2.4, z, -Math.PI / 2)]);
  const looks = ['commoner', 'woman', 'scholar', 'citizen', 'gentleman', 'commoner', 'student'];
  const watchers = [];
  [[-8.2, 8.4], [-6.8, 8.6], [-5.4, 8.3], [-4, 8.7], [-7.5, 10], [-6.1, 10.2], [-4.7, 9.9], [5.4, 8.4], [6.8, 8.6], [8.2, 8.3], [4.9, 10.1], [6.3, 10.2], [7.7, 9.9], [3.9, 11.4]]
    .forEach(([x, z], i) => watchers.push(person(g, looks[i % looks.length], x, z, Math.PI + (x < 0 ? 0.35 : -0.35))));
  const king = person(g, 'gojongKing', 0, 13, Math.PI);
  const me = a.at(2.7, 9.4); placePlayer(world, [me.x, me.z], Math.PI - 0.3);
  const cam = (eye, look) => world.setFixedCamera([O.x + eye[0], eye[1], O.z + eye[2]], [O.x + look[0], look[1], O.z + look[2]]);
  const hook = ctx.testHooks.coronation = { watchers: officials.length + watchers.length, robe: LOOKS.gojongKing.robe, top: 0, bowed: false };
  try {
    cam([6, 6.8, -3.5], [0, 0.6, 7]); // 제단 옆에서 돌길을 내려다본다: 걸어오는 왕과 지켜보는 사람들
    await ctx.fade?.(false);
    await wait(world, 4.5, k => { king.position.z = 13 - ease(k) * 12.4; }); // 돌길을 걸어온다(다리는 공용 걷기가 움직인다)
    king.rotation.y = 0; // 돌아서서 사람들(남쪽)을 보고 말한다. 얼굴은 돌길 가운데에서 정면으로 크게(신하 줄 사이)
    cam([0, 2.35, 0.6 + 3.4], [0, 2.05, 0.6 + 0.3]);
    await dialogue.say(L[0]); dialogue.close();
    // 제단에 오른다
    king.rotation.y = Math.PI;
    cam([-8.5, 3.8, 3], [0, 1.6, -3.5]);
    await wait(world, 3.4, k => { const z = 0.6 - ease(k) * 6.6; king.position.z = z; king.position.y = stepY(z); });
    // 맨 위에서 황제 옷으로: 붉은 곤룡포의 왕이 노란 옷의 황제가 된다
    const emperor = person(g, 'gojong', ax, az, 0); emperor.position.y = TOP;
    king.visible = false;
    hook.robe = LOOKS.gojong.robe; hook.top = emperor.position.y;
    cam([0, 2.2, 6.5], [0, 2.6, -6]);
    ctx.audio?.play?.('correct');
    officials.forEach(o => { o.rotation.order = 'YXZ'; o.rotation.y = Math.PI; });
    await wait(world, 1.2, k => officials.forEach(o => { o.rotation.x = 0.5 * ease(k); }));
    hook.bowed = true;
    await dialogue.say(L[1]); dialogue.close();
    cam([12, 7.5, 13], [0, 1.2, -5]);
    await dialogue.say(L[2]); dialogue.close();
    cam([0, TOP + 2.3, az + 3.6], [0, TOP + 2.0, az + 0.3]); // 황제 얼굴을 정면에서 크게
    await dialogue.say(L[3]); dialogue.close();
  } finally {
    await ctx.fade?.(true);
    a.dispose();
    world.player.visible = true;
    placePlayer(world, SPOT);
    world.camMode = 'follow'; world.snapCamera();
    ctx.input.enabled = false;
    await ctx.fade?.(false);
  }
}

// ── 종로 만민 공동회 연설: 연단 위 독립 협회 회원이 연설하고, 사람들이 두 손을 들어 호응한다. 끝나면 어두운 채로 judge가 이어진다 ──
async function speechScene(ctx) {
  const { world, dialogue } = ctx;
  await ctx.fade?.(true);
  const a = buildArena(world, JONGNO), g = a.group, O = a.at(0, 0);
  nameBoard(g, '종로', 3.4, 10.4);
  const [sx, sz] = JONGNO.stand;
  const speaker = person(g, 'scholarModern', sx, sz, 0); speaker.position.y = 0.8;
  const cheer = [[-2, -0.6], [-0.7, -0.2], [0.7, -0.4], [2, -0.8], [-1.4, 0.9], [1.4, 0.8]].map(([x, z], i) => person(g, ['commoner', 'citizen', 'woman', 'student'][i % 4], x, z, Math.PI));
  const p0 = a.at(...JONGNO.from); placePlayer(world, [p0.x, p0.z]);
  const wide = () => world.setFixedCamera([O.x + 7, 5, O.z + 9], [O.x, 1.6, O.z - 6]);
  const face = () => world.setFixedCamera([O.x + sx + 0.6, 0.8 + 2.2, O.z + sz + 4.6], [O.x + sx, 0.8 + 1.75, O.z + sz]); // 연사 얼굴을 정면에서
  const arm = p => p.userData.arms?.[1];
  ctx.testHooks.speech = { audience: cheer.length };
  try {
    wide();
    await ctx.fade?.(false);
    for (const l of script.parts.speech.lines) {
      if (l.who === 'speaker') { face(); if (arm(speaker)) arm(speaker).rotation.x = -2.3; } else wide();
      await dialogue.say(l);
      if (arm(speaker)) arm(speaker).rotation.x = 0;
      if (l.text.includes('자주독립')) { // 사람들이 손을 들어 호응한다
        dialogue.close(); wide();
        await wait(world, 1.4, k => cheer.forEach((p, i) => { for (const m of p.userData.arms || []) m.rotation.x = -2.6 * Math.sin(Math.min(1, k * 2) * Math.PI / 2) - Math.sin(k * 12 + i) * 0.2; }));
        ctx.testHooks.speech.cheered = true;
      }
    }
    dialogue.close();
  } finally {
    await ctx.fade?.(true); // 어두운 채로 가려내기 놀이가 같은 종로 무대에서 이어진다(그 부분의 before가 밝힌다)
    a.dispose();
    placePlayer(world, SPOT);
    world.camMode = 'follow'; world.snapCamera();
    ctx.input.enabled = false;
  }
}

// 다음 놀이 앞에서 기다리기(C-05): 부분 intro 맨 앞의 { meet } 표시에서 그 사람 머리 위에 느낌표를 띄우고, 학생이 말을 걸 때까지 기다린다
const meet = (who, label, lines) => [{ meet: { who, label } }, ...lines];
async function meetPerson(ctx, { who, label }) {
  const { world } = ctx, npc = world.npcs.get(who);
  npc.mark.visible = true;
  await waitInteract(ctx, { pos: npc.mesh.position, label, mark: false });
  npc.mark.visible = false;
  const m = npc.mesh.position, pp = world.player.position;
  npc.mesh.rotation.y = Math.atan2(pp.x - m.x, pp.z - m.z); // 말을 건 학생 쪽으로 돌아서서 정면으로
  world.setTalkCamera(npc.mesh);
}

const base = makeKitChapter({
  id: 'k4', mood: 'morning', script,
  player: { robe: 0x5d7a9a, hat: 'short', trim: 0xe6dcc3, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['citizen', 'scholar', 'seojaepil'],
  spot: SPOT, // 놀이를 마치면 큰길 가운데에서 북쪽(빛나는 문·독립문)을 보고 선다
  layout: {
    // 1896~1897년 한성 서대문 밖 큰길: 돌 독립문, 연단과 모인 사람들, 길가의 러시아 공사관·독립신문사·가게와 노점, 뒤로 높은 바위산, 멀리 도성의 지붕들
    ground: 'earth', groundColor: 0x9a8a6a, bounds: { x0: -16, x1: 16, z0: -9, z1: 11 }, start: [0, 9], hill: 1.6,
    skyline: { style: 'hanok', color: 0x4a4e4c, arc: [Math.PI * 0.6, Math.PI * 1.1] },
    roads: [{ x: 0, z: 2, w: 36, d: 5, color: 0x9a8a72 }, { x: 0, z: 6, w: 4, d: 14 }],
    props: [
      { type: 'arch', x: 0, z: -7, label: '독립문' },
      { type: 'stage', x: -10, z: -4 },
      { type: 'crowd', x: -10, z: -0.5, n: 10, cols: 5, looks: ['commoner', 'gentleman', 'student', 'woman', 'scholar'], face: Math.PI },
      { type: 'hanok', x: 11, z: -6, tile: true, scale: 1.5 },
      { type: 'flagpole', x: 7.5, z: -0.6, scale: 1.3 }, { type: 'flagpole', x: -14, z: -6 }, // 태극기가 집에 가리지 않게 길가 앞쪽에
      { type: 'western', x: 13, z: 9.5, w: 6, d: 4, h: 5, ry: Math.PI },
      { type: 'shop', x: -13, z: 9.5, w: 5, ry: Math.PI, seed: 2 }, { type: 'shop', x: -19, z: 6, w: 4.5, ry: Math.PI / 2, thatch: true, seed: 5 },
      { type: 'stall', x: 17.5, z: 4, ry: -Math.PI / 2, color: 0xd8cdb0, seed: 3 },
      { type: 'tree', x: -16.5, z: -8.5, kind: 'pine' }, { type: 'tree', x: 16.5, z: -9, kind: 'pine' },
      { type: 'wall', x: -8.5, z: GATE_Z, w: 13, h: 1.8, solid: false }, { type: 'wall', x: 8.5, z: GATE_Z, w: 13, h: 1.8, solid: false }, // 마을 어귀 담
    ],
    npcs: [
      { id: 'citizen', look: 'commoner', x: 5, z: 7, ry: Math.PI * 0.8 },
      { id: 'scholar', look: 'scholar', x: -5.5, z: 6, ry: -Math.PI * 0.8 },
      { id: 'seojaepil', look: 'seojaepil', x: -3.5, z: -3, ry: 0 },
    ],
    // 길 위 안내판 대신 건물 간판(C-03): 서양식 건물 「러시아 공사관」, 서쪽 가게 「독립신문사」. 안내판 글(독립문·만민 공동회·환구단)은 대사·장면으로 옮겼다
    signs: [{ id: 'signLegation', title: '러시아 공사관', x: 13, z: 7, ry: Math.PI, plaque: { y: 3.95, back: 0.3 } }, { id: 'signPaper', title: '독립신문사', x: -13, z: 7, ry: Math.PI, plaque: { y: 3.0, back: 0.8 } }],
    scatter: [{ kind: 'pine', count: 30, area: { x0: -60, x1: 60, z0: -40, z1: -14 }, seed: 241 }],
  },
  parts: [
    { ...script.parts.paper, goal: script.goals[3], arena: HANSEONG, from: [0, 19],
      route: xy(script.parts.paper.route, [{ x: -11, z: 10 }, { x: 4, z: 4 }, { x: -6, z: -10 }, { x: 6, z: -4 }, { x: 0, z: 14 }]) },
    { ...script.parts.speech, goal: script.goals[4], intro: meet('citizen', '한성 시민과 이야기하기', script.parts.speech.intro), play: ctx => speechScene(ctx) },
    { ...script.parts.forum, goal: script.goals[4], arena: JONGNO, from: JONGNO.from, mark: '!', items: xy(script.parts.forum.items, JUDGE_SPOTS),
      before: ctx => { ctx.fade?.(false); } }, // 연설 장면이 어둡게 끝난 채로 같은 종로 무대를 밝힌다
  ],
  decorate(world) { // 마을 어귀 나무 문과 「한성」 이름판(S51). 문짝·이름판은 굳히기에 합쳐지지 않게 돌려준다
    const gate = gateLeaves(world.level, { x: 0, z: GATE_Z, width: 4, height: 2.6, inward: -1 });
    const board = nameBoard(world.level, '한성', 3.2, GATE_Z - 1.6);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return { gate, board };
  },
});

// 장 도입(C-03): ① 궁궐 앞, 일본군이 왕을 둘러싸 압박하고 왕은 러시아 깃발이 선 공사관 쪽을 돌아본다(일본의 간섭, 러시아의 힘을 빌림)
// ② 일본군이 궁궐로 몰려 들어가고(을미사변), 왕은 큰길을 지나 러시아 공사관으로 몸을 피한다. 끝나면 더한 것을 치운다
function introScene(ctx) {
  const { world } = ctx, L = world.level;
  const king = person(L, 'gojongKing', 11, -2.6, -Math.PI / 2);
  const soldiers = [[8, -3.4], [7.6, -1.8], [8.2, -0.3]].map(([x, z]) => person(L, JAPAN, x, z, Math.PI / 2));
  const flag = russianFlag(); flag.position.set(9.4, 0, 7.2); L.add(flag);
  let off = null;
  const run = fn => { off?.(); let t = 0; off = world.onUpdate(dt => { t += dt; fn(t); }); };
  const hide = on => { for (const id of ['citizen', 'scholar', 'seojaepil']) { const n = world.npcs.get(id); if (n) n.mesh.visible = on; } };
  const s0 = soldiers.map(p => p.position.clone());
  return {
    shots: [
      { cam: [3.2, 2.6, 4.2], look: [11, 1.4, -2], to: { cam: [4, 2.5, 3.4], look: [11, 1.4, -2] },
        act: () => { hide(false); run(u => { // 일본군이 다가서고, 왕은 공사관(러시아 깃발) 쪽으로 돌아선다
          soldiers.forEach((p, i) => { p.position.x = s0[i].x + Math.min(1, u / 1.6) * 1.2; });
          king.rotation.y = -Math.PI / 2 + (Math.PI / 2 + 0.25) * ease(Math.min(1, Math.max(0, (u - 1.8) / 1.2)));
        }); } },
      { cam: [2.6, 3.2, 3.4], look: [11, 1.2, 1.5], to: { cam: [3.4, 3, 2.6], look: [11.5, 1.2, 2.5] },
        act: () => run(u => { // 일본군은 궁궐로 몰려 들어가고, 왕은 큰길을 지나 공사관으로 몸을 피한다
          soldiers.forEach((p, i) => { const k = Math.min(1, Math.max(0, (u - 0.3 - i * 0.15) / 1.6)); p.position.set(s0[i].x + 1.2 + k * 2.4, 0, s0[i].z + (-4.4 - s0[i].z) * k); p.rotation.y = Math.atan2(2.4, -4.4 - s0[i].z); p.visible = k < 1; });
          const k = ease(Math.min(1, u / 3.8)); king.rotation.y = 0.2; king.position.set(11 + k * 1.6, 0, -2.6 + k * 9.2);
        }) },
    ],
    done: () => { off?.(); off = null; hide(true); for (const o of [king, ...soldiers, flag]) o.removeFromParent(); },
  };
}

export const villageTalk = (id, heard) => anyOrderTalk(script, PEOPLE, id, heard);
export const devScene = () => scene; // 개발용(사진 찍기)

export default {
  ...base,
  anyOrder: true, // 한성 사람은 아무 차례로(차례 전 대사 tooEarly가 없다, tests/quest.test.js)
  introScene,
  portal: { at: [0, 2], ry: 0 }, // 미니게임 뒤 빛나는 문(C-02): 돌아온 학생(SPOT) 바로 앞 큰길 가운데, 앞면은 학생(남쪽) 쪽
  buildScene(world) { scene = base.buildScene(world); return scene; },
  enterStage(ctx, stage) { scene.gate.setOpen(0); ctx.world.closeView = true; base.enterStage(ctx, stage); },
  // 모두 들은 뒤 서재필에게 가면 학생의 결심 → 환구단 즉위식 장면
  async explore(ctx) {
    await walkInAndTalk(ctx, script, { people: PEOPLE, final: 'seojaepil', gate: scene.gate, from: INTRO_FROM, to: base.layout.start });
    await coronation(ctx);
  },
  // 공용 kit 미니게임을 그대로 돌리되, { meet } 줄에서는 그 사람에게 말을 걸 때까지 기다린다(C-05)
  async minigame(ctx) {
    const d = ctx.dialogue, say = d.say;
    d.say = line => (line && line.meet ? meetPerson(ctx, line.meet) : say.call(d, line));
    try { return await base.minigame(ctx); } finally { d.say = say; ctx.setGoal(null); } // 퀴즈 목표는 빛나는 문이 대신(C-01)
  },
};
