// 현대편 2장 「대한민국 정부 수립」(D-48): 1945~1948년 서울, 둥근 지붕의 큰 관청 앞 돌 광장.
// 「서울」 문으로 들어와 서울 시민·이승만·김구 이야기를 아무 차례로 듣고(모두 들어야 신문 기자),
// 기자에게 가면 학생의 결심 → 1948년 5월 10일 투표소 앞에 줄 선 사람들 →
// ① 내 손으로 투표하기(명부 → 투표용지 → 기표소 → 투표함) ② 기자에게 말을 걸면 제헌 헌법 완성하기.
import * as THREE from 'three';
import { makeKitChapter } from '../../kit/chapter.js';
import { buildArena, toast } from '../../kit/play.js';
import { BUILD } from '../../kit/town.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { walkInAndTalk, anyOrderTalk } from '../../kit/talk.js';
import { wait, person, ease, face, sayer, meet, minigameWithMeet, facingShare } from '../../kit/walk.js';
import { waitInteract } from '../../../core/portal.js';
import { mat, setCarry } from '../../../core/people.js';
import { LOOKS } from '../../../content/characters.js';
import { placePlayer } from '../../joseon/common.js';
import script from './script.js';

const PEOPLE = ['citizen', 'syngmanrhee', 'kimgu'];
const GATE_Z = 14.5, INTRO_FROM = [0, 17.5], SPOT = [0, 7];
const blk = (g, w, h, d, color, x, y, z, kind = 'wood') => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, kind)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
const ring = (g, x, z, r = 0.9) => { const m = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.25, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.09, z); m.visible = false; g.add(m); return m; };
const paperMesh = () => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.3), new THREE.MeshLambertMaterial({ color: 0xf2ecd8 })); m.castShadow = true; return m; };
// 캔버스 글씨 판(그릴 때마다 다시 그린다)
function canvasBoard(w, h, px = 128) {
  const cv = document.createElement('canvas'); cv.width = Math.round(w * px); cv.height = Math.round(h * px);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex }));
  return { mesh, c: cv.getContext('2d'), cv, tex };
}

// ── 무대(마을에서 떨어진 x 400) ──
// 1948년 5월 10일 아침 투표소(탐험 끝 장면): 학교 건물 앞에 남쪽으로 길게 줄 선 사람들. 카메라는 투표소 입구 쪽에서 본다
export const QUEUE = { edge: { style: 'city', seed: 510 },
  origin: [400, 0], ground: 'earth', groundColor: 0x9a8a6a, bounds: { x0: -16, x1: 16, z0: -20, z1: 14 },
  props: [
    { type: 'western', x: 0, z: -15, w: 12, d: 5, h: 6, color: 0x9a7a5a }, { type: 'flagpole', x: -7.5, z: -11 },
    { type: 'tree', x: 7, z: -9, kind: 'poplar' }, { type: 'tree', x: -9, z: 6, kind: 'poplar' }, { type: 'hanok', x: 11, z: 4, ry: -Math.PI / 2, tile: true }, { type: 'concrete', x: -12, z: -3, floors: 2, w: 6, ry: Math.PI / 2, color: 0xbab2a2 },
  ],
  door: [0, -12], watch: [-4.2, -3],
};
// 투표소 안: 명부 책상 → 투표용지 책상 → 가림막 기표소 → 투표함
export const POLL = { edge: { style: 'city', seed: 291 },
  origin: [400, 0], ground: 'stone', groundColor: 0xb8b0a0, bounds: { x0: -12, x1: 12, z0: -12, z1: 12 },
  props: [{ type: 'western', x: 0, z: -17, w: 20, d: 4, h: 6, color: 0xb8b0a0 }, { type: 'flagpole', x: -9, z: 9 }, { type: 'crowd', x: -9, z: 3, n: 4, cols: 2, looks: ['citizen', 'woman', 'grandma', 'gentleman'], face: -Math.PI / 2 }],
  from: [0, 9],
  roll: [-5, -1], paper: [-1, -4.5], booth: [5.5, -4], box: [1, -9.5],
};
// 제헌 국회 회의장: 북쪽 벽에 헌법 판, 국회 의원들이 줄지어 북쪽을 보고 선다
export const HALL = { edge: { style: 'city', seed: 717 },
  origin: [400, 0], ground: 'stone', groundColor: 0xa89a80, bounds: { x0: -12, x1: 12, z0: -12, z1: 12 },
  props: [{ type: 'flagpole', x: -7, z: -9 }, { type: 'flagpole', x: 7, z: -9 }],
  from: [0, 9.5], cols: [-4.5, -1.5, 1.5, 4.5], rows: [-3, -0.5, 2, 4.5],
  raisers: [[-4.5, 4.5], [4.5, 2], [1.5, -3]],
};

// ── 탐험 끝 장면: 1948년 5월 10일 아침, 투표소 앞에 길게 줄 선 사람들이 차례로 들어간다 ──
export async function electionScene(ctx) {
  const { world, dialogue } = ctx;
  const L = script.election.lines, A = QUEUE, say = sayer(ctx);
  ctx.setGoal(script.goals[2]);
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  const looks = ['grandma', 'citizen', 'woman', 'gentleman', 'peasant', 'woman', 'citizen', 'grandma', 'commoner', 'woman', 'gentleman', 'peasant', 'citizen', 'woman'];
  const line = looks.map((look, i) => person(g, look, Math.sin(i * 0.7) * 0.6, -9 + i * 1.25, Math.PI)); // 모두 북쪽(투표소 입구)을 본다
  const hook = ctx.testHooks.election = { people: line.length, looks: new Set(looks).size, entered: 0, facing: 0 };
  const W = a.at(...A.watch); placePlayer(world, [W.x, W.z], Math.PI * 0.75);
  const C = a.at(5.6, -9.6), T = a.at(-0.6, -0.5);
  const view = () => world.setFixedCamera([C.x, 3.2, C.z], [T.x, 1.1, T.z]); // 줄 맨 앞 옆(투표소 입구 쪽)에서 줄 선 사람들의 얼굴을 본다
  try {
    view();
    hook.facing = facingShare(world, line);
    await ctx.fade?.(false);
    await dialogue.say(L[0]);
    dialogue.close();
    for (let n = 0; n < 2; n++) { // 맨 앞 사람이 투표소로 들어가고, 줄이 한 칸씩 앞으로
      const first = line.shift(), f0 = first.position.clone(), [dx, dz] = A.door;
      const p0 = line.map(p => p.position.clone());
      await wait(world, 1.6, k => {
        first.position.lerpVectors(f0, new THREE.Vector3(dx, 0, dz), ease(k));
        line.forEach((p, i) => { p.position.z = p0[i].z - 1.25 * ease(k); });
      });
      first.visible = false; hook.entered += 1;
    }
    await say(L[1], line[0]);
    dialogue.close();
    view();
    await dialogue.say(L[2]);
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

// ── 놀이 ①: 내 손으로 투표하기 ──
export async function votePlay(ctx) {
  const { world, dialogue, hud, audio } = ctx;
  const P = script.parts.vote, A = POLL;
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  const hook = ctx.testHooks.vote = { steps: [], stamped: -1, inBox: false };
  // 명부 책상과 직원, 투표용지 책상과 직원
  const desk = ([x, z]) => { blk(g, 1.8, 0.8, 0.8, 0x6b4a32, x, 0.4, z); };
  desk(A.roll); desk(A.paper);
  blk(g, 0.5, 0.06, 0.4, 0xe6dcc3, A.roll[0] - 0.3, 0.83, A.roll[1], 'cloth'); // 펼친 명부
  for (let i = 0; i < 4; i++) blk(g, 0.4, 0.02, 0.3, 0xf2ecd8, A.paper[0] + 0.4, 0.82 + i * 0.02, A.paper[1], 'cloth'); // 투표용지 더미
  const clerk1 = person(g, 'scholarModern', A.roll[0], A.roll[1] - 1, 0), clerk2 = person(g, 'scholarModern', A.paper[0], A.paper[1] - 1, 0);
  // 가림막 기표소: 세 벽과 앞 천, 안쪽 선반
  const [bx, bz] = A.booth;
  blk(g, 2, 2, 0.08, 0x8a7a5a, bx, 1, bz - 1); blk(g, 0.08, 2, 2, 0x8a7a5a, bx - 1, 1, bz); blk(g, 0.08, 2, 2, 0x8a7a5a, bx + 1, 1, bz);
  const curtain = blk(g, 2, 1.3, 0.04, 0xd8ccb0, bx, 1.35, bz + 1, 'cloth');
  blk(g, 1.2, 0.06, 0.5, 0x6b4a32, bx, 1.0, bz - 0.7);
  // 투표용지(기표소 선반 위): 후보 세 칸
  const ballot = (() => { const b = { ...canvasBoard(0.9, 0.6, 256) }; b.mesh.rotation.x = -Math.PI / 2; b.mesh.position.set(bx, 1.04, bz - 0.65); b.mesh.visible = false; g.add(b.mesh); return b; })();
  const drawBallot = mark => {
    const { c, cv } = ballot; c.fillStyle = '#f2ecd8'; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = '#2b241c'; c.font = 'bold 18px sans-serif'; c.textAlign = 'center'; c.fillText('국회 의원 선거 투표용지', cv.width / 2, 28);
    P.candidates.forEach((t, i) => {
      const y = 46 + i * 34; c.strokeStyle = '#2b241c'; c.lineWidth = 2; c.strokeRect(18, y, cv.width - 36, 30);
      c.textAlign = 'left'; c.font = '20px sans-serif'; c.fillText(t, 30, y + 22);
      if (i === mark) { c.strokeStyle = '#b8282c'; c.lineWidth = 4; c.beginPath(); c.arc(cv.width - 50, y + 15, 11, 0, Math.PI * 2); c.stroke(); }
    });
    ballot.tex.needsUpdate = true;
  };
  drawBallot(-1);
  const box = new THREE.Group(); box.position.set(A.box[0], 0, A.box[1]); g.add(box); BUILD.ballot(box, {});
  const spots = { roll: [A.roll[0], A.roll[1] + 1.3], paper: [A.paper[0], A.paper[1] + 1.3], booth: [bx, bz + 0.2], box: [A.box[0], A.box[1] + 1.5] };
  const marks = Object.fromEntries(Object.entries(spots).map(([k, [x, z]]) => [k, ring(g, x, z)]));
  const p0 = a.at(...A.from); placePlayer(world, [p0.x, p0.z], Math.PI);
  const say = sayer(ctx);
  try {
    await ctx.fade?.(false);
    for (const [i, st] of P.steps.entries()) {
      hud.setCounter(`${P.counter} ${i}/${P.steps.length}`);
      marks[st.id].visible = true;
      const pos = a.at(...spots[st.id]);
      await waitInteract(ctx, { pos, label: st.act, r: 1.6 });
      ctx.input.enabled = false;
      marks[st.id].visible = false;
      if (st.id === 'roll') { await say(st.lines[0], clerk1); }
      if (st.id === 'paper') { setCarry(world.player, paperMesh(), 'arms'); audio.play('tap'); await say(st.lines[0], clerk2); }
      if (st.id === 'booth') { // 가림막 안: 선반 위 투표용지에 도장을 찍는다
        curtain.position.x = bx - 0.7; // 천을 젖히고 들어간다
        setCarry(world.player, null); ballot.mesh.visible = true;
        const B = a.at(bx, bz - 0.65);
        world.setFixedCamera([B.x, 2.2, B.z + 0.9], [B.x, 1.0, B.z - 0.05]);
        await dialogue.say(st.lines[0]);
        ctx.testHooks.choice = 0; // 테스트 봇이 고를 답(어느 후보든 괜찮다)
        const k = await dialogue.choose({ who: 'guide', text: '누구에게 도장을 찍을까?' }, P.candidates);
        ctx.testHooks.choice = null;
        drawBallot(k); hook.stamped = k; audio.play('tap');
        dialogue.close();
        await wait(world, 0.9);
        await wait(world, 0.5, u => { ballot.mesh.scale.set(1, 1 - 0.5 * u, 1); }); // 반으로 접는다
        ballot.mesh.visible = false; setCarry(world.player, paperMesh(), 'arms');
        curtain.position.x = bx;
        world.camMode = 'follow';
      }
      if (st.id === 'box') { // 접은 투표용지를 투표함에 넣는다
        setCarry(world.player, null);
        const slip = paperMesh(); slip.position.set(A.box[0], 1.6, A.box[1]); g.add(slip);
        const X = a.at(...A.box); world.setFixedCamera([X.x + 3.2, 2.6, X.z + 0.6], [X.x - 0.4, 1, X.z + 0.4]); // 투표함 옆에서(학생이 가리지 않게)
        await wait(world, 0.6, u => { slip.position.y = 1.6 - 0.7 * u; });
        slip.removeFromParent(); hook.inBox = true; audio.play('correct');
        toast(ctx, '○ 소중한 한 표', 'good');
        await say(st.lines[0], clerk2);
      }
      hook.steps.push(st.id);
      dialogue.close();
      world.camMode = 'follow';
    }
    hud.setCounter(`${P.counter} ${P.steps.length}/${P.steps.length}`);
    for (const l of P.done) await dialogue.say(l);
    dialogue.close();
  } finally {
    ctx.testHooks.choice = null;
    await leaveArena(ctx, a);
  }
  return true;
}

// ── 놀이 ②: 제헌 헌법 완성하기. 손 든 의원에게 가서 빈칸을 함께 정하면 헌법 판에 글이 채워진다 ──
export async function constitutionPlay(ctx) {
  const { world, dialogue, hud, audio } = ctx;
  const P = script.parts.law, A = HALL;
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  // 북쪽 벽과 헌법 판, 의장석
  blk(g, 16, 5, 0.3, 0xd8ccb0, 0, 2.5, -9.6, 'stone');
  const board = canvasBoard(8, 2.8, 128); board.mesh.position.set(0, 3.1, -9.42); g.add(board.mesh);
  blk(g, 2.2, 1.1, 0.8, 0x6b4a32, -3.4, 0.55, -7);
  const chair = person(g, 'gentleman', -3.4, -8, 0); // 의장은 판을 가리지 않게 옆에
  const filled = [];
  const drawBoard = () => {
    const { c, cv } = board; c.fillStyle = '#f4efe2'; c.fillRect(0, 0, cv.width, cv.height);
    c.strokeStyle = '#6b4a32'; c.lineWidth = 10; c.strokeRect(5, 5, cv.width - 10, cv.height - 10);
    c.fillStyle = '#2b241c'; c.font = 'bold 40px serif'; c.textAlign = 'center'; c.fillText('제헌 헌법', cv.width / 2, 58);
    const text = P.text.replace(/[①②③]/g, m => { const i = '①②③'.indexOf(m); return filled[i] ? `「${filled[i]}」` : '(   ?   )'; });
    const lines = text.split(/(?<=이다\.|있고,) /); // 세 줄로
    c.font = '34px serif'; lines.forEach((l, i) => c.fillText(l, cv.width / 2, 120 + i * 62));
    board.tex.needsUpdate = true;
  };
  drawBoard();
  // 국회 의원들: 줄마다 앞에 책상, 모두 북쪽(헌법 판)을 본다
  const members = [];
  for (const z of A.rows) for (const x of A.cols) {
    blk(g, 1.4, 0.75, 0.5, 0x6b4a32, x, 0.375, z - 0.7);
    members.push(person(g, (members.length % 3) ? 'gentleman' : 'citizen', x, z, Math.PI));
  }
  const hook = ctx.testHooks.law = { filled, members: members.length, clapped: false, facing: 0 };
  const at = (x, z) => members.find(m => Math.abs(m.position.x - x) < 0.1 && Math.abs(m.position.z - z) < 0.1);
  const raisers = A.raisers.map(([x, z]) => at(x, z));
  const raise = (m, u) => { const ar = m.userData.arms; if (ar) ar[1].rotation.x = -Math.PI * 0.9 * u; };
  const p0 = a.at(...A.from); placePlayer(world, [p0.x, p0.z], Math.PI);
  const say = sayer(ctx);
  const front = () => { const B = a.at(0.6, -7.6), T = a.at(0, 3); world.setFixedCamera([B.x, 3.4, B.z], [T.x, 1.2, T.z]); }; // 헌법 판 앞에서 의원들의 얼굴을 본다
  try {
    await ctx.fade?.(false);
    for (const [i, bl] of P.blanks.entries()) {
      hud.setCounter(`${P.counter} ${i}/${P.blanks.length}`);
      const m = raisers[i]; raise(m, 1);
      const side = m.position.x > 0 ? -1 : 1, sx = m.position.x + side * 1.4, sz = m.position.z + 0.3;
      const mk = ring(g, sx, sz, 0.7); mk.visible = true;
      await waitInteract(ctx, { pos: a.at(sx, sz), label: '의원과 이야기하기', r: 1.4 });
      ctx.input.enabled = false;
      mk.removeFromParent();
      await say(bl.ask, m);
      for (;;) {
        ctx.testHooks.choice = bl.options.indexOf(bl.answer); // 테스트 봇이 고를 답
        const k = await dialogue.choose({ who: 'guide', text: '빈칸에 어떤 말을 쓸까?' }, bl.options);
        ctx.testHooks.choice = null;
        if (bl.options[k] === bl.answer) break;
        audio.play('wrong');
        await dialogue.say({ who: 'guide', text: `× ${P.wrong}` });
      }
      dialogue.close();
      raise(m, 0);
      filled.push(bl.answer); drawBoard(); audio.play('correct');
      const B = a.at(0, -9.4); world.setFixedCamera([B.x + 0.4, 3.1, B.z + 6.5], [B.x, 2.9, B.z]); // 채워지는 헌법 판
      toast(ctx, `○ ${bl.answer}`, 'good');
      await wait(world, 1.2);
      world.camMode = 'follow';
    }
    hud.setCounter(`${P.counter} ${P.blanks.length}/${P.blanks.length}`);
    // 의원들이 일어나 손뼉(카메라는 헌법 판 앞에서 의원들을 마주 본다)
    front();
    hook.facing = facingShare(world, members);
    audio.play('correct');
    await wait(world, 2, k => members.forEach((m, i) => { const ar = m.userData.arms; if (!ar) return; const u = Math.abs(Math.sin(k * Math.PI * 6 + i)); ar[0].rotation.set(-1.2, 0, 0.5 * u); ar[1].rotation.set(-1.2, 0, -0.5 * u); }));
    members.forEach(m => m.userData.arms?.forEach(ar => ar.rotation.set(0, 0, 0)));
    hook.clapped = true;
    face(chair, 0, 3);
    for (const l of P.done) await dialogue.say(l);
    dialogue.close();
  } finally {
    ctx.testHooks.choice = null;
    await leaveArena(ctx, a);
  }
  return true;
}

const base = makeKitChapter({
  id: 'h2', mood: 'morning', script,
  player: { robe: 0x5d7a9a, hat: 'short', trim: 0xe6dcc3, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['citizen', 'syngmanrhee', 'kimgu', 'reporter'],
  spot: SPOT, // 놀이를 마치면 서울 문 앞에서 북쪽(빛나는 문)을 보고 선다
  layout: {
    // 1945~1948년 서울: 둥근 지붕의 큰 관청 앞 돌 광장, 투표를 알리는 책상과 사람들, 양옆 시멘트 건물과 가로수, 멀리 도시
    ground: 'stone', groundColor: 0xb0a890, bounds: { x0: -16, x1: 16, z0: -6, z1: 11 }, start: [0, 9], hill: 1.4,
    skyline: { style: 'brick', color: 0x4e4a46, arc: [Math.PI * 0.6, Math.PI * 1.4] },
    props: [
      { type: 'western', x: 0, z: -12, w: 14, d: 6, h: 7, dome: true, color: 0xc8c0b0 },
      { type: 'flagpole', x: -4, z: -6.5 }, { type: 'flagpole', x: 4, z: -6.5 },
      { type: 'desk', x: -11, z: -2 }, { type: 'desk', x: -8, z: -2 },
      { type: 'crowd', x: -10, z: 2, n: 8, cols: 2, looks: ['citizen', 'woman', 'grandma', 'gentleman'], face: Math.PI },
      { type: 'concrete', x: -14, z: -11, floors: 2, w: 6, color: 0xbab2a2, shop: false }, { type: 'concrete', x: 14, z: -11, floors: 3, w: 6, color: 0xc8c2b4, awning: 0x5a5e62 },
      { type: 'hanok', x: 18, z: 7, tile: true, ry: -Math.PI / 2 }, { type: 'shop', x: -19, z: 7, w: 5, style: 'modern', ry: Math.PI / 2, awning: 0x2f6b5e, seed: 2 },
      { type: 'tree', x: 13, z: 1, kind: 'poplar' }, { type: 'tree', x: -16, z: -4, kind: 'poplar' },
      { type: 'wall', x: -8.5, z: GATE_Z, w: 13, h: 1.8, color: 0x9a948a, solid: false }, { type: 'wall', x: 8.5, z: GATE_Z, w: 13, h: 1.8, color: 0x9a948a, solid: false }, // 광장 어귀 담과 문
    ],
    npcs: [
      { id: 'citizen', look: 'citizen', x: -2.5, z: 6.4, ry: Math.PI * 0.8 },
      { id: 'syngmanrhee', look: 'syngmanrhee', x: 7, z: 4, ry: -Math.PI / 2 },
      { id: 'kimgu', look: 'kimgu', x: 3, z: -3, ry: 0 },
      { id: 'reporter', look: 'gentleman', x: -5.5, z: -3.2, ry: Math.PI / 4 },
    ],
    // 길 위 안내판 대신 건물 간판(C-03): 「투표소」·「신문사」. 안내판 글(5·10 총선거·제주 4·3·제헌 헌법)은 기자 대사·장면·놀이로 옮겼다
    signs: [{ id: 'signPoll', title: '투표소', x: -14, z: -8.5, ry: 0, plaque: { y: 2.55, back: 0.45 } },
      { id: 'signPaper', title: '신문사', x: 14, z: -8.5, ry: 0, plaque: { y: 2.55, back: 0.45 } }],
  },
  parts: [
    { ...script.parts.vote, goal: script.goals[3], play: ctx => votePlay(ctx) },
    { ...script.parts.law, goal: script.goals[4], intro: meet('reporter', '신문 기자와 이야기하기', script.parts.law.intro), play: ctx => constitutionPlay(ctx) },
  ],
  // 서울 문과 「서울」 이름판은 굳히기에 합쳐지지 않게 돌려준다
  decorate(world) {
    const gate = gateLeaves(world.level, { x: 0, z: GATE_Z, width: 4, height: 2.6, inward: -1 });
    const board = nameBoard(world.level, '서울', 3.2, GATE_Z - 1.6);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return { gate, board };
  },
});

// 장 도입(C-03): ① 38도선 남쪽의 미군과 북쪽의 소련군 ② 모스크바에서 회의하는 세 나라 외교 장관 ③ 신탁 통치 결정 ④ 생각이 갈린 사람들. 끝나면 더한 것을 치운다
function introScene(ctx) {
  const { world } = ctx, L = world.level;
  const add = (look, x, z, ry) => { const p = person(L, look, x, z, ry); p.visible = false; return p; };
  const south = [-1.6, 0, 1.6].map(x => add({ ...LOOKS.unSoldier, robe: 0x7a7458 }, x, 3.4, Math.PI)); // 미군
  const north = [-1.6, 0, 1.6].map(x => add({ ...LOOKS.unSoldier, robe: 0x5a6a4a, hat: 'cap' }, x, -0.6, 0)); // 소련군
  const line = new THREE.Mesh(new THREE.BoxGeometry(8, 0.04, 0.12), new THREE.MeshBasicMaterial({ color: 0xd9a441 })); line.position.set(0, 0.05, 1.4); line.visible = false; L.add(line); // 38도선
  const table = new THREE.Group(); table.visible = false; L.add(table); blk(table, 2.4, 0.8, 1.2, 0x6b4a32, 0, 0.4, 1.2);
  const talks = [[-1.6, 1.2, Math.PI / 2], [1.6, 1.2, -Math.PI / 2], [0, 2.4, Math.PI]].map(([x, z, ry]) => add('gentleman', x, z, ry));
  const sideA = [-3, -2, -1].map(x => add('citizen', x - 1, 1.6 + (x % 2) * 0.6, Math.PI / 2));
  const sideB = [1, 2, 3].map(x => add('gentleman', x + 1, 1.6 + (x % 2) * 0.6, -Math.PI / 2));
  const hide = on => { for (const id of [...PEOPLE, 'reporter']) { const n = world.npcs.get(id); if (n) n.mesh.visible = on; } };
  const show = list => { for (const o of [...south, ...north, line, table, ...talks, ...sideA, ...sideB]) o.visible = list.includes(o); };
  return {
    shots: [
      { cam: [5.5, 3, 6.5], look: [0, 1, 1.4], to: { cam: [5, 2.8, 6], look: [0, 1, 1.4] }, act: () => { hide(false); show([...south, ...north, line]); } },
      { cam: [2.6, 2.4, 6.5], look: [0, 1.2, 1.2], to: { cam: [2.2, 2.3, 6], look: [0, 1.2, 1.2] }, act: () => show([table, ...talks]) },
      { cam: [-2.6, 2.4, 5.5], look: [0, 1.2, 1.2], to: { cam: [-2.2, 2.3, 5.2], look: [0, 1.2, 1.2] }, act: () => show([table, ...talks]) },
      { cam: [0.5, 2.4, 7.5], look: [0, 1.3, 1.8], to: { cam: [0.4, 2.4, 7], look: [0, 1.3, 1.8] }, act: () => show([...sideA, ...sideB]) },
    ],
    done: () => { hide(true); for (const o of [...south, ...north, line, table, ...talks, ...sideA, ...sideB]) o.removeFromParent(); },
  };
}

let scene = null;
export const villageTalk = (id, heard) => anyOrderTalk(script, PEOPLE, id, heard);
export const devScene = () => scene; // 개발용(사진 찍기)

export default {
  ...base,
  anyOrder: true, // 광장 사람은 아무 차례로(차례 전 대사 tooEarly가 없다, tests/quest.test.js)
  introScene,
  portal: { at: [0, 3.4], ry: 0 }, // 미니게임 뒤 빛나는 문(C-02): 돌아온 학생(SPOT) 바로 앞, 앞면은 학생(남쪽) 쪽
  buildScene(world) { scene = base.buildScene(world); return scene; },
  enterStage(ctx, stage) { scene.gate.setOpen(0); ctx.world.closeView = true; base.enterStage(ctx, stage); },
  // 모두 들은 뒤 기자에게 가면 학생의 결심 → 5·10 총선거 투표 날 장면
  async explore(ctx) {
    await walkInAndTalk(ctx, script, { people: PEOPLE, final: 'reporter', gate: scene.gate, from: INTRO_FROM, to: base.layout.start });
    await electionScene(ctx);
  },
  // 공용 kit 미니게임을 그대로 돌리되, { meet } 줄에서는 그 사람에게 말을 걸 때까지 기다린다(C-05, chapters/kit/walk.js)
  minigame: ctx => minigameWithMeet(base, ctx),
};
