// 일제 강점기편 3장 「대한민국 임시 정부」(D-41): 1919년 중국 상하이의 회색 벽돌 골목집 거리와 임시 정부 청사.
// 「상하이」 거리 문으로 들어와 연락원·독립신문 기자·안창호 이야기를 아무 차례로 듣고(모두 들어야 김구),
// 김구에게 가면 학생의 결심 → 청사 앞에 사람들이 모이고 태극기가 오르며 임시 정부가 세워지는 장면 →
// ① 임시 정부의 헌법 읽기 ② 연락원에게 말을 걸면 일본 경찰 피해 비밀 편지 전하기
// ③ 김구에게 말을 걸면 임시 정부 청사 걷기(비밀 연락 → 독립신문 → 독립 공채 → 외교 → 독립군).
import * as THREE from 'three';
import { makeKitChapter } from '../../kit/chapter.js';
import { buildArena } from '../../kit/play.js';
import { flagMesh } from '../../kit/town.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { walkInAndTalk, anyOrderTalk } from '../../kit/talk.js';
import { wait, person, ease, face, stationMarks, walkStations, sayer, meet, minigameWithMeet } from '../../kit/walk.js';
import { setCarry, mat } from '../../../core/people.js';
import { placePlayer } from '../../joseon/common.js';
import script from './script.js';

const PEOPLE = ['messenger', 'reporter', 'ahnchangho'];
const GATE_Z = 14.5, INTRO_FROM = [0, 17.5], SPOT = [0, 7];
const POLE = [5, -4.6], FLAG_TOP = 3.8, FLAG_LOW = 0.9; // 청사 앞 깃대: 출범 장면에서 태극기가 오른다
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const paper = (w = 0.5, d = 0.36, color = 0xf2ecd8) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), new THREE.MeshLambertMaterial({ color })); m.castShadow = true; return m; };

// 만세: 두 팔을 번쩍 들었다 내린다(k 0~1)
const cheerPose = (p, k) => { const a = p.userData.arms; if (!a) return; const u = Math.sin(k * Math.PI); a[1].rotation.x = Math.PI * 0.95 * u; a[0].rotation.x = Math.PI * 0.95 * u; };

// ── 무대(마을에서 떨어진 x 400) ──
const ALLEY = { edge: { style: 'shanghai', seed: 546 }, center: [{ type: 'lamp', x: -14, z: 12 }, { type: 'cargo', x: 14, z: 6, kind: 'crate', n: 4 }, { type: 'cargo', x: -15, z: -14, kind: 'barrel', n: 3 }], // 상하이 골목: 담과 가게 사이로 몰래
  origin: [400, 0], ground: 'stone', groundColor: 0x8c8577, bounds: { x0: -18, x1: 18, z0: -22, z1: 20 },
  props: [
    { type: 'wall', x: -9, z: 8, w: 8 }, { type: 'wall', x: 9, z: -4, w: 8 }, { type: 'rice', x: -10, z: -8, n: 6 },
    { type: 'western', x: -15, z: -18, w: 6, d: 5, h: 5, color: 0x8a4a3a }, { type: 'western', x: 15, z: 16, w: 6, d: 5, h: 5, color: 0x9a948a },
  ],
};
// 임시 정부 청사 걷기: 남쪽 문에서 들어와 연락 방 → 신문 찍는 방 → 공채 책상 → 외교관이 떠나는 길 → 만주로 떠나는 독립군
export const OFFICE = { edge: { style: 'shanghai', seed: 852 },
  origin: [400, 0], ground: 'stone', groundColor: 0x8a6a4a, bounds: { x0: -18, x1: 18, z0: -28, z1: 18 },
  roads: [{ x: 0, z: -5, w: 4, d: 46, color: 0x7a746a }],
  props: [
    { type: 'desk', x: -11, z: 10 }, { type: 'papers', x: -14, z: 12, kind: 'book', n: 2 }, // 연락 방
    { type: 'desk', x: 11.2, z: 9.8 }, { type: 'papers', x: 14.5, z: 4, kind: 'news', n: 3 }, // 신문 찍는 방
    { type: 'desk', x: -11, z: -3 }, { type: 'noticeBoard', x: -15.5, z: -1, ry: Math.PI / 2 }, // 공채 책상
    { type: 'cargo', x: 15.5, z: -9, kind: 'crate', n: 3 }, { type: 'lamp', x: 4, z: -12 },
    { type: 'flagpole', x: -4, z: -14 },
  ],
  from: [0, 15],
  boards: [['다른 나라로', 15, -19], ['만주로', -3.4, -25]],
  press: [11.5, 6.6], stack: [11.2, 9.8], bondDesk: [-11, -3],
  stations: [{ x: -8, z: 9 }, { x: 8.6, z: 6.6 }, { x: -8, z: -3 }, { x: 8, z: -7 }, { x: 0, z: -15 }],
};

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
const briefcase = () => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 0.14), mat(0x4a3224, 'cloth')); return m; };

let scene = null;
const raiseFlag = k => { const f = scene?.flag; if (!f) return; f.position.y = FLAG_LOW + (FLAG_TOP - FLAG_LOW) * k; f.visible = k > 0.02; }; // 오르기 전에는 깃대만

// ── 탐험 끝 장면: 청사 앞에 동포들이 모이고, 김구가 임시 정부가 세워졌음을 알리자 깃대에 태극기가 오르고 모두 만세 ──
export async function launchScene(ctx) {
  const { world, dialogue } = ctx;
  const L = script.launch.lines, say = sayer(ctx);
  ctx.setGoal(script.goals[2]);
  world.closeView = true;
  await ctx.fade?.(true);
  const g = new THREE.Group(); g.name = 'i3Launch'; world.level.add(g);
  const hook = ctx.testHooks.launch = { crowd: 0, flagFrom: scene.flag.position.y, flagTo: 0, cheers: 0 };
  const kimgu = world.npcs.get('kimgu'), ahn = world.npcs.get('ahnchangho');
  const ahn0 = ahn.mesh.position.clone(), ahnRy = ahn.mesh.rotation.y;
  kimgu.mesh.position.set(1.5, 0, -4.6); kimgu.mesh.rotation.y = 0;
  ahn.mesh.position.set(-0.6, 0, -4.8); ahn.mesh.rotation.y = 0;
  const looks = ['citizen', 'student', 'gentleman', 'woman', 'scholarModern', 'citizen', 'schoolgirl', 'worker', 'gentleman', 'student'];
  const crowd = looks.map((look, i) => { const r = i < 5 ? 0 : 1, c = i % 5; const p = person(g, look, -3.4 + c * 1.6 + r * 0.7, -1.2 + r * 1.5); face(p, 0.5, -4.6); return p; });
  hook.crowd = crowd.length;
  raiseFlag(0);
  placePlayer(world, [3.6, 0.6], Math.PI * 0.9);
  try {
    world.setFixedCamera([6.5, 4.2, 5.5], [0.8, 1.8, -4]); // 비스듬히 위에서 청사와 모인 사람들을 함께
    await ctx.fade?.(false);
    await dialogue.say(L[0]);
    await say(L[1], kimgu.mesh);
    dialogue.close();
    world.setFixedCamera([1.5, 2.2, 3.2], [POLE[0] - 0.6, 3, POLE[1]]); // 깃대 쪽을 올려다본다
    ctx.audio?.play?.('correct');
    await wait(world, 3, k => raiseFlag(ease(k)));
    hook.flagTo = scene.flag.position.y;
    world.setFixedCamera([6.5, 4.2, 5.5], [0.8, 1.8, -4]);
    await dialogue.say(L[2]);
    dialogue.close();
    world.setFixedCamera([-5.5, 3, 4.5], [0.4, 1.6, -2.6]); // 반대쪽에서 만세를 부르는 동포들
    for (let n = 0; n < 3; n++) {
      ctx.audio?.play?.('tap');
      await wait(world, 0.9, k => crowd.forEach((p, i) => cheerPose(p, Math.min(1, Math.max(0, k * 1.15 - (i % 4) * 0.04)))));
      hook.cheers += 1;
      if (n === 0) { await dialogue.say(L[3]); dialogue.close(); }
    }
    await dialogue.say(L[4]);
    await say(L[5], kimgu.mesh);
    dialogue.close();
  } finally {
    await ctx.fade?.(true);
    g.removeFromParent();
    raiseFlag(1);
    ahn.mesh.position.copy(ahn0); ahn.mesh.rotation.y = ahnRy;
    const k0 = base.layout.npcs.find(n => n.id === 'kimgu'); kimgu.mesh.position.set(k0.x, 0, k0.z); kimgu.mesh.rotation.y = k0.ry;
    world.setMood(base.mood);
    placePlayer(world, SPOT);
    world.camMode = 'follow'; world.snapCamera();
    ctx.input.enabled = false;
    await ctx.fade?.(false);
  }
}

// ── 임시 정부 청사 걷기 ──
const ACT = {
  async contact({ ctx, a, g, st, say, hook, set }) { // 연락원이 책상 위 편지를 옷 속에 숨기고 문밖으로 나간다
    const { world } = ctx;
    const M = set.messenger, D = a.at(-11, 10);
    world.player.rotation.y = -Math.PI / 2;
    world.setFixedCamera([D.x + 5.5, 2.6, D.z + 4.5], [D.x, 1.2, D.z]);
    await say(st.lines[0], M);
    ctx.dialogue.close();
    world.setFixedCamera([D.x + 5.5, 2.6, D.z + 4.5], [D.x, 1.2, D.z]);
    const L = set.letter, from = L.position.clone(), to = new THREE.Vector3(M.position.x, 1.3, M.position.z + 0.2);
    await wait(world, 0.9, k => { L.position.lerpVectors(from, to, ease(k)); L.position.y += Math.sin(k * Math.PI) * 0.4; });
    L.visible = false; hook.letterHidden = true; // 옷 속으로
    const m0 = M.position.clone();
    M.rotation.y = -Math.PI / 2;
    await wait(world, 2, k => { M.position.x = m0.x - 6 * ease(k); });
    M.visible = false;
    await say(st.lines[1]);
  },
  async news({ ctx, a, g, st, say, hook, set }) {
    const { world } = ctx;
    await say(st.lines[0], set.reporter);
    ctx.dialogue.close();
    const P = a.at(...OFFICE.press);
    world.player.rotation.y = Math.PI / 2;
    world.setFixedCamera([P.x - 4.6, 3.2, P.z - 3.2], [P.x + 0.2, 1.3, P.z + 1.2]);
    const S = OFFICE.stack;
    for (let i = 0; i < 3; i++) { // 세 번 눌러 세 장을 찍어 책상에 쌓는다
      await wait(world, 0.5, k => { const u = Math.sin(k * Math.PI); set.press.lever.rotation.z = -0.5 * u; set.press.platen.position.y = 1.6 - 0.66 * u; });
      ctx.audio?.play?.('tap');
      const sh = paper(0.7, 0.5); g.add(sh);
      const from = new THREE.Vector3(OFFICE.press[0], 0.9, OFFICE.press[1]), to = new THREE.Vector3(S[0], 0.86 + i * 0.03, S[1]);
      await wait(world, 0.45, k => { sh.position.lerpVectors(from, to, k); sh.position.y += Math.sin(k * Math.PI) * 0.8; });
      hook.printed += 1;
    }
    await say(st.lines[1]);
  },
  async bond({ ctx, a, g, st, say, hook, set }) { // 동포들이 차례로 돈을 내고 공채를 받는다. 학생도 한 장 받아 든다
    const { world } = ctx;
    const D = a.at(...OFFICE.bondDesk);
    world.player.rotation.y = -Math.PI / 2;
    await say(st.lines[0], set.kimgu);
    ctx.dialogue.close();
    world.setFixedCamera([D.x + 6, 3, D.z + 4.5], [D.x + 0.5, 1.1, D.z - 0.5]);
    for (const [i, p] of set.donors.entries()) {
      p.visible = true;
      const p0 = p.position.clone(), to = new THREE.Vector3(OFFICE.bondDesk[0] + 1.1, 0, OFFICE.bondDesk[1] - 1.4 + i * 0.1);
      face(p, to.x, to.z);
      await wait(world, 0.8, k => p.position.lerpVectors(p0, to, ease(k)));
      face(p, OFFICE.bondDesk[0], OFFICE.bondDesk[1]);
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 10), mat(0xc9a441, 'stone')); coin.position.set(OFFICE.bondDesk[0] + 0.1 - i * 0.2, 0.88, OFFICE.bondDesk[1] - 0.2); g.add(coin);
      ctx.audio?.play?.('tap'); hook.coins += 1;
      await wait(world, 0.3);
      await wait(world, 0.7, k => p.position.lerpVectors(to, new THREE.Vector3(p0.x - 2, 0, p0.z - 3), ease(k)));
    }
    const bond = paper(0.46, 0.32, 0xe8d8a8); bond.rotation.x = -Math.PI / 2.4; setCarry(world.player, bond, 'arms'); hook.bond = true; // 공채 한 장을 받아 든다
    ctx.audio?.play?.('correct');
    const pp = world.player.position;
    world.setFixedCamera([pp.x + 2.6, 2.2, pp.z + 2.8], [pp.x - 0.6, 1.1, pp.z - 0.4]);
    await say(st.lines[1]);
    await say(st.lines[2]);
    setCarry(world.player, null);
  },
  async diplo({ ctx, a, st, say, hook, set }) { // 가방을 든 외교관이 「다른 나라로」 길을 따라 떠난다
    const { world } = ctx;
    const E = set.envoy;
    world.player.rotation.y = Math.PI / 2;
    await say(st.lines[0], E);
    ctx.dialogue.close();
    const C = a.at(12, -12);
    world.setFixedCamera([C.x - 9, 3.4, C.z + 9], [C.x + 1, 1.2, C.z - 2]);
    const e0 = E.position.clone(), to = new THREE.Vector3(15, 0, -19.5);
    face(E, to.x, to.z);
    await wait(world, 3, k => E.position.lerpVectors(e0, to, ease(k)));
    E.visible = false; hook.envoyLeft = true;
    await say(st.lines[1]);
  },
  async army({ ctx, a, st, say, hook, set }) { // 독립군이 줄지어 서서 경례하고 「만주로」 떠난다
    const { world } = ctx;
    const A = a.at(0, -20);
    world.player.rotation.y = Math.PI;
    world.setFixedCamera([A.x + 7, 3.4, A.z + 9], [A.x, 1.3, A.z - 1]);
    await say(st.lines[0], set.army[0]);
    ctx.dialogue.close();
    world.setFixedCamera([A.x + 7, 3.4, A.z + 9], [A.x, 1.3, A.z - 1]);
    const from = set.army.map(p => p.position.clone());
    set.army.forEach(p => { p.rotation.y = Math.PI; });
    await wait(world, 3.6, k => set.army.forEach((p, i) => { p.position.z = from[i].z - 9 * ease(k); }));
    set.army.forEach(p => { p.visible = false; }); hook.marched = set.army.length;
    await say(st.lines[1]);
  },
};

export async function officeWalk(ctx) {
  const { world, hud } = ctx;
  const P = script.parts.office, A = OFFICE;
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  A.boards.forEach(([name, x, z]) => nameBoard(g, name, x, z, { ry: 0 }));
  const hook = ctx.testHooks.office = { used: [], pressed: 0, letterHidden: false, printed: 0, coins: 0, bond: false, envoyLeft: false, marched: 0 };
  const messenger = person(g, 'student', -12.2, 9, Math.PI / 2);
  const letter = paper(0.4, 0.28); letter.position.set(-11, 0.86, 10); g.add(letter);
  const press = printingPress(g, ...A.press);
  const reporter = person(g, 'scholarModern', 10.6, 4.4, -Math.PI / 4);
  const kimgu = person(g, 'kimgu', -12.4, -3, Math.PI / 2);
  const donors = [['citizen', -3, -0.5], ['woman', -2.4, 0.6], ['worker', -3.6, 1.4]].map(([look, x, z]) => { const p = person(g, look, x, z); p.visible = false; return p; });
  const envoy = person(g, 'gentleman', 10.4, -7.6, -Math.PI / 2);
  const bag = briefcase(); setCarry(envoy, bag, 'side');
  const army = [[-2.4, -19], [-1.2, -19.4], [0, -19], [1.2, -19.4], [2.4, -19]].map(([x, z]) => person(g, 'independenceArmy', x, z, 0));
  const marks = stationMarks(a, g, P.stations, A.stations);
  const p0 = a.at(...A.from); placePlayer(world, [p0.x, p0.z], Math.PI);
  const set = { messenger, letter, press, reporter, kimgu, donors, envoy, army };
  const say = sayer(ctx);
  try {
    await ctx.fade?.(false);
    await walkStations(ctx, {
      stations: P.stations, marks, counter: '해 본 일',
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
  id: 'i3', mood: 'overcast', script,
  player: { robe: 0x3a3a44, hat: 'short', trim: 0xe6dcc3, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['messenger', 'reporter', 'ahnchangho', 'kimgu'],
  spot: SPOT, // 놀이를 마치면 거리 문 앞에서 북쪽(빛나는 문·청사)을 보고 선다
  layout: {
    // 1919년 중국 상하이: 회색 벽돌 2층 석고문 골목집이 줄지어 선 거리(임시 정부 청사도 이런 집), 길가 가게와 가로수, 멀리 큰 도시의 건물들
    ground: 'stone', groundColor: 0x9a948a, bounds: { x0: -16, x1: 16, z0: -6, z1: 11 }, start: [0, 9], hill: 0.5, mountains: false,
    skyline: { style: 'brick', color: 0x5a5650 },
    roads: [{ x: 0, z: 2, w: 40, d: 6, color: 0x7a746a }, { x: 0, z: 10, w: 4, d: 10, color: 0x7a746a }],
    props: [
      { type: 'lanehouse', x: 0, z: -9, n: 3 },
      { type: 'lanehouse', x: -14, z: -9, n: 2 }, { type: 'lanehouse', x: 14, z: -9, n: 2 },
      { type: 'shop', x: -13, z: 10.5, w: 6, style: 'modern', ry: Math.PI, awning: 0x8a2f24, seed: 2 },
      { type: 'shop', x: 13, z: 10.5, w: 6, style: 'modern', ry: Math.PI, awning: 0x2f4a6a, seed: 5 },
      { type: 'papers', x: -12, z: -5.2, kind: 'news', n: 2 }, { type: 'tree', x: 17, z: 5, color: 0x5a7a40 }, { type: 'tree', x: -17, z: 5, color: 0x5a7a40 },
      { type: 'lamp', x: -9, z: -1.2 }, { type: 'lamp', x: 9, z: -1.2 }, { type: 'cart', x: 16, z: 2, ry: 1.5 },
      { type: 'wall', x: -8.5, z: GATE_Z, w: 13, h: 1.8, solid: false }, { type: 'wall', x: 8.5, z: GATE_Z, w: 13, h: 1.8, solid: false }, // 거리 어귀 담과 문
    ],
    npcs: [
      { id: 'messenger', look: 'student', x: -6, z: 6, ry: Math.PI * 0.8 },
      { id: 'reporter', look: 'scholarModern', x: -11, z: -3.6, ry: Math.PI * 0.2 },
      { id: 'ahnchangho', look: 'ahnchangho', x: 7, z: 5, ry: -Math.PI * 0.6 },
      { id: 'kimgu', look: 'kimgu', x: 1.5, z: -4.4, ry: 0 },
    ],
    // 길 위 안내판 대신 간판(C-03): 가운데 골목집 「대한민국 임시 정부」, 왼쪽 골목집 「독립신문사」. 안내판 글(청사·독립 공채)은 장면·걷기로 옮겼다
    signs: [{ id: 'signOffice', title: '대한민국 임시 정부', x: 0, z: -6.0, ry: 0, plaque: { y: 5.1, back: 0.45 } },
      { id: 'signNews', title: '독립신문사', x: -14, z: -6.0, ry: 0, plaque: { y: 5.1, back: 0.45 } }],
  },
  parts: [
    { ...script.parts.charter, goal: script.goals[3] },
    { ...script.parts.letters, goal: script.goals[4], intro: meet('messenger', '연락원과 이야기하기', script.parts.letters.intro), arena: ALLEY, from: [0, 17],
      waypoints: xy(script.parts.letters.waypoints, [{ x: -9, z: 5.5 }, { x: -12, z: -5 }, { x: 10, z: -2 }, { x: 12, z: -14 }, { x: 4, z: -19 }]),
      hides: [{ x: -5, z: 12, r: 1.8 }, { x: -6, z: -1, r: 1.8 }, { x: 5, z: -7, r: 1.8 }, { x: 14, z: -8, r: 1.6 }],
      guards: [{ path: [[-2, 12], [-2, -2]], speed: 0.7, range: 5 }, { path: [[-14, -10], [6, -10]], speed: 0.55, range: 5 }, { path: [[16, 4], [16, -18]], speed: 0.5, range: 5 }] },
    { ...script.parts.office, goal: script.goals[5], intro: meet('kimgu', '김구와 이야기하기', script.parts.office.intro), play: ctx => officeWalk(ctx) },
  ],
  // 거리 문과 「상하이」 이름판, 청사 앞 깃대(출범 장면에서 태극기가 오른다)는 굳히기에 합쳐지지 않게 돌려준다
  decorate(world) {
    const gate = gateLeaves(world.level, { x: 0, z: GATE_Z, width: 4, height: 2.6, inward: -1 });
    const board = nameBoard(world.level, '상하이', 3.2, GATE_Z - 1.6);
    const pole = new THREE.Group(); pole.position.set(POLE[0], 0, POLE[1]); world.level.add(pole);
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.4, 6), mat(0x5a3f2a, 'wood')); stick.position.y = 2.2; stick.castShadow = true; pole.add(stick);
    const flag = flagMesh(1.4, 0.95); flag.position.set(0, FLAG_TOP, 0); pole.add(flag);
    world.addCollider({ x: POLE[0], z: POLE[1], r: 0.4 });
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return { gate, board, pole, flag };
  },
});

// 장 도입(C-03): ① 3·1 운동 뒤 태극기를 든 사람들 ② 나라 안팎에서 온 사람들이 상하이 청사 앞 책상에 모여 의논한다. 끝나면 더한 것을 치운다
function introScene(ctx) {
  const { world } = ctx, L = world.level;
  const marchers = [['student', -1.4, 5.2], ['schoolgirl', 0, 5.8], ['citizen', 1.4, 5.2], ['peasant', -0.7, 6.8], ['woman', 0.8, 6.9]].map(([look, x, z]) => {
    const p = person(L, look, x, z, Math.PI);
    const f = flagMesh(0.6, 0.4); f.position.set(0.5, 2.6, 0); p.add(f);
    p.visible = false; return p;
  });
  const leaders = [['gentleman', -0.8, -2.8], ['scholarModern', 0.8, -2.6], ['ahnchangho', 0, -3.8], ['gentleman', -1.6, -1.9]].map(([look, x, z]) => { const p = person(L, look, x, z); face(p, 0, -2.6); p.visible = false; return p; });
  const doc = paper(0.7, 0.5); doc.position.set(0, 0.82, -2.6); doc.visible = false; L.add(doc);
  const hide = on => { for (const id of [...PEOPLE, 'kimgu']) { const n = world.npcs.get(id); if (n) n.mesh.visible = on; } };
  return {
    shots: [
      { cam: [3.2, 2.4, 10], look: [0, 1.6, 5.8], to: { cam: [2.6, 2.3, 9.2], look: [0, 1.6, 5.8] },
        act: () => { hide(false); marchers.forEach(p => { p.visible = true; }); } }, // 3·1 운동 뒤 태극기를 든 사람들
      { cam: [4.2, 2.6, 1.8], look: [0, 1.2, -2.8], to: { cam: [3.4, 2.4, 1.2], look: [0, 1.2, -2.8] },
        act: () => { marchers.forEach(p => { p.visible = false; }); [doc, ...leaders].forEach(p => { p.visible = true; }); } }, // 상하이에 모여 의논한다
    ],
    done: () => { hide(true); for (const o of [...marchers, ...leaders, doc]) o.removeFromParent(); },
  };
}

export const villageTalk = (id, heard) => anyOrderTalk(script, PEOPLE, id, heard);
export const devScene = () => scene; // 개발용(사진 찍기)

export default {
  ...base,
  anyOrder: true, // 거리 사람은 아무 차례로(차례 전 대사 tooEarly가 없다, tests/quest.test.js)
  introScene,
  portal: { at: [0, 3.4], ry: 0 }, // 미니게임 뒤 빛나는 문(C-02): 돌아온 학생(SPOT) 바로 앞, 앞면은 학생(남쪽) 쪽
  buildScene(world) { scene = base.buildScene(world); raiseFlag(0); return scene; },
  enterStage(ctx, stage) { scene.gate.setOpen(0); raiseFlag(stage === 'explore' ? 0 : 1); ctx.world.closeView = true; base.enterStage(ctx, stage); },
  // 모두 들은 뒤 김구에게 가면 학생의 결심 → 임시 정부가 세워지는 장면
  async explore(ctx) {
    raiseFlag(0);
    await walkInAndTalk(ctx, script, { people: PEOPLE, final: 'kimgu', gate: scene.gate, from: INTRO_FROM, to: base.layout.start });
    await launchScene(ctx);
  },
  // 공용 kit 미니게임을 그대로 돌리되, { meet } 줄에서는 그 사람에게 말을 걸 때까지 기다린다(C-05, chapters/kit/walk.js)
  minigame: ctx => minigameWithMeet(base, ctx),
};
