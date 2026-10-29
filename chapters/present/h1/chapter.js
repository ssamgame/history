// 현대편 1장 「8·15 광복」(D-47): 광복 몇 달 뒤 서울 큰길, 집집마다 태극기.
// 「서울」 문으로 들어와 서울 시민·할머니·신문 파는 아이 이야기를 아무 차례로 듣고(모두 들어야 돌아온 김구),
// 김구에게 가면 학생의 결심 → 1945년 8월 15일 그날, 집과 가게에서 태극기를 든 사람들이 쏟아져 나와 만세 →
// ① 문패 바꿔 달기(집주인이 말한 이름을 골라 단다) ② 신문 파는 아이에게 말을 걸면 첫 한글 수업 교실.
import * as THREE from 'three';
import { makeKitChapter } from '../../kit/chapter.js';
import { buildArena, labelSprite, toast } from '../../kit/play.js';
import { holdFlag, cheerFlag, BUILD } from '../../kit/town.js';
import { signMaterial } from '../../kit/buildings.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { walkInAndTalk, anyOrderTalk } from '../../kit/talk.js';
import { wait, person, ease, face, sayer, classroom, meet, minigameWithMeet, facingShare } from '../../kit/walk.js';
import { waitInteract } from '../../../core/portal.js';
import { mat, setCarry } from '../../../core/people.js';
import { placePlayer } from '../../joseon/common.js';
import script from './script.js';

const PEOPLE = ['citizen', 'grandma', 'newsboy'];
const GATE_Z = 14.5, INTRO_FROM = [0, 17.5], SPOT = [0, 7];
// 받침이 있으면 '이에요', 없으면 '예요'
const ieyo = w => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c % 28 ? `${w}이에요` : `${w}예요`; };
const bookMesh = color => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.3), mat(color, 'cloth', 'object')); m.castShadow = true; return m; };

// ── 무대(마을에서 떨어진 x 400) ──
// 1945년 8월 15일 거리(탐험 끝 장면): 길 양쪽 가게와 집에서 사람들이 나와 길 가운데 모인다. 카메라는 남쪽에서 마주 본다
export const STREET = { edge: { style: 'city', seed: 815 },
  origin: [400, 0], ground: 'stone', groundColor: 0xa8a090, bounds: { x0: -16, x1: 16, z0: -20, z1: 14 },
  roads: [{ x: 0, z: -3, w: 9, d: 34, color: 0x8a8070 }],
  props: [
    { type: 'shop', x: -10, z: 2, w: 5, style: 'modern', ry: Math.PI / 2, awning: 0x2f6b5e, seed: 2 }, { type: 'shop', x: 10, z: 1, w: 5, style: 'modern', ry: -Math.PI / 2, awning: 0x8a2f24, seed: 5 },
    { type: 'hanok', x: -10, z: -6, ry: Math.PI / 2, tile: true }, { type: 'hanok', x: 10, z: -7, ry: -Math.PI / 2 },
    { type: 'western', x: 0, z: -17, w: 10, d: 5, h: 6, color: 0x9a7a5a },
    { type: 'lamp', x: -5.2, z: 6 }, { type: 'lamp', x: 5.2, z: -10 }, { type: 'tree', x: -6, z: -14, kind: 'poplar' }, { type: 'tree', x: 6.5, z: 9, kind: 'poplar' },
  ],
  doors: [[-7.4, 2.6], [-7.4, 1], [-7.6, -5.4], [-7.6, -7], [7.4, 1.8], [7.4, 0.2], [7.6, -6.4], [7.6, -8], [-7.4, 3.6], [7.4, -5.2], [-7.6, -8.4], [7.6, 2.8], [-7.4, -0.4], [7.6, -9.2]],
  watch: [5.6, 2.6],
};
// 문패 바꿔 달기: 남쪽에서 북쪽으로 곧은 골목, 양쪽에 번갈아 선 기와집·초가집 네 채. 문패 기둥은 골목 쪽
export const NAMES = { edge: { style: 'thatch', seed: 452 },
  origin: [400, 0], ground: 'earth', groundColor: 0x9a8a6a, bounds: { x0: -16, x1: 16, z0: -26, z1: 22 },
  roads: [{ x: 0, z: -2, w: 5, d: 48, color: 0x8a8070 }],
  props: [{ type: 'jars', x: -12, z: 15 }, { type: 'straw', x: 12, z: -18 }, { type: 'tree', x: 13, z: 16 }, { type: 'tree', x: -13, z: -20 }, { type: 'flagpole', x: -3.6, z: -23 }, { type: 'flagpole', x: 3.6, z: -23 }],
  from: [0, 19],
  houses: [{ x: -8, z: 11, side: -1, tile: true }, { x: 8, z: 3, side: 1 }, { x: -8, z: -5, side: -1 }, { x: 8, z: -13, side: 1, tile: true }],
};
// 첫 한글 수업: 앞이 열린 교실(남쪽에서 들어온다)
export const SCHOOL = { edge: { style: 'city', seed: 946 },
  origin: [400, 0], ground: 'earth', groundColor: 0x9a8a6a, bounds: { x0: -12, x1: 12, z0: -8, z1: 14 },
  props: [{ type: 'flagpole', x: -7.5, z: 8 }, { type: 'tree', x: 8, z: 9, kind: 'poplar' }, { type: 'tree', x: -9, z: 12, kind: 'poplar' }],
  from: [0, 11], room: [0, 0], crate: [-3.4, -2.4],
};

// ── 탐험 끝 장면: 1945년 8월 15일, 집과 가게에서 태극기를 든 사람들이 쏟아져 나와 길 가운데에서 함께 만세 ──
export async function liberationScene(ctx) {
  const { world, dialogue } = ctx;
  const L = script.liberation.lines, A = STREET, say = sayer(ctx);
  ctx.setGoal(script.goals[2]);
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  const hook = ctx.testHooks.liberation = { people: 0, flags: 0, cameOut: 0, cheers: 0, facing: 0 };
  const looks = ['citizen', 'woman', 'student', 'grandma', 'gentleman', 'schoolgirl', 'commoner', 'kidModern', 'citizen', 'woman', 'student', 'peasant', 'schoolgirl', 'citizen'];
  const crowd = looks.map((look, i) => { const [x, z] = A.doors[i]; const p = person(g, look, x, z, 0); face(p, 0, z); p.visible = false; holdFlag(p); return p; });
  hook.people = crowd.length; hook.flags = crowd.filter(p => p.userData.carry?.style === 'flag').length;
  const spots = crowd.map((_, i) => [-3 + (i % 5) * 1.5 + (Math.floor(i / 5) % 2) * 0.6, -1 - Math.floor(i / 5) * 1.5]); // 길 가운데 다섯 줄씩
  const W = a.at(...A.watch); placePlayer(world, [W.x, W.z], -Math.PI * 0.7);
  const C = a.at(0.6, 6.2), T = a.at(0, -2.6);
  const front = () => world.setFixedCamera([C.x, 2.7, C.z], [T.x, 1.5, T.z]); // 길 남쪽에서 사람들의 얼굴을 마주 본다
  try {
    front();
    await ctx.fade?.(false);
    await dialogue.say(L[0]);
    dialogue.close();
    // 집과 가게에서 차례로 뛰어나와 길 가운데로 모인다
    const p0 = crowd.map(p => p.position.clone()), to = spots.map(([x, z]) => new THREE.Vector3(x, 0, z));
    await wait(world, 4.5, k => crowd.forEach((p, i) => {
      const u = Math.min(1, Math.max(0, (k - i * 0.035) / 0.5));
      if (u > 0 && !p.visible) { p.visible = true; hook.cameOut += 1; }
      p.position.lerpVectors(p0[i], to[i], ease(u));
      if (u > 0 && u < 1) face(p, to[i].x, to[i].z);
    }));
    crowd.forEach(p => face(p, C.x - a.at(0, 0).x, C.z - a.at(0, 0).z)); // 모두 카메라 쪽을 본다(D-45)
    await say(L[1], crowd[0]);
    dialogue.close();
    front();
    hook.facing = facingShare(world, crowd);
    for (let n = 0; n < 3; n++) {
      ctx.audio?.play?.('correct');
      await wait(world, 0.9, k => crowd.forEach((p, i) => cheerFlag(p, Math.sin(Math.min(1, Math.max(0, k * 1.15 - (i % 4) * 0.05)) * Math.PI))));
      hook.cheers += 1;
      if (n === 0) { await dialogue.say(L[2]); dialogue.close(); front(); }
    }
    await dialogue.say(L[3]);
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

// 기둥에 단 세로 문패(글씨 판)
function plate(text, bg = '#e9dcc0') {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 1.3), signMaterial(text, { vertical: true, bg, fg: '#2b241c' }));
  m.castShadow = true; return m;
}
// 무대를 마치면 마을로 돌아온다
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

// ── 놀이 ①: 문패 바꿔 달기. 집주인이 나와 이름을 말하면 세 문패 가운데 그 이름을 골라 단다 ──
export async function nameplatePlay(ctx, scene, easy) {
  const { world, dialogue, hud, audio } = ctx;
  const P = script.parts.names, A = NAMES;
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  const hook = ctx.testHooks.names = { hung: [], oldDropped: 0, owners: 0 };
  let missed = false;
  const houses = A.houses.map((h, i) => {
    const hx = h.x, hz = h.z;
    const px = hx - h.side * 3.6, pz = hz + 2.4; // 골목 쪽 문 옆 문패 기둥
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.1, 0.22), mat(0x6b4a32, 'wood')); post.position.set(px, 1.05, pz); post.castShadow = true; g.add(post);
    const old = plate(P.houses[i].old, '#d8d0c0'); old.position.set(px - h.side * 0.13, 1.35, pz); old.rotation.y = -h.side * Math.PI / 2; g.add(old);
    const owner = person(g, i % 2 ? 'woman' : 'citizen', px + h.side * 0.6, pz + 1.1, -h.side * Math.PI / 2); // 문패 기둥 옆(문 앞) owner.visible = false;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(px - h.side * 1.4, 0.09, pz); ring.visible = false; g.add(ring);
    return { ...h, px, pz, old, owner, ring, data: P.houses[i] };
  });
  // 집 모양(무대 부품과 같은 한옥, 앞이 골목 쪽)
  houses.forEach(h => { const hg = new THREE.Group(); hg.position.set(h.x, 0, h.z); hg.rotation.y = h.side < 0 ? Math.PI / 2 : -Math.PI / 2; g.add(hg); BUILD.hanok(hg, { tile: h.tile }); });
  const p0 = a.at(...A.from); placePlayer(world, [p0.x, p0.z], Math.PI);
  try {
    await ctx.fade?.(false);
    for (const [i, h] of houses.entries()) {
      hud.setCounter(`${P.counter} ${i}/${houses.length}`);
      h.ring.visible = true;
      const pos = a.at(h.px - h.side * 1.4, h.pz);
      await waitInteract(ctx, { pos, label: '문패 바꿔 달기', r: 2.4 });
      ctx.input.enabled = false;
      h.ring.visible = false;
      // 집주인이 나온다
      h.owner.visible = true; hook.owners += 1;
      face(h.owner, h.px - h.side * 1.4, h.pz);
      const S = a.at(h.px - h.side * 1.3, h.pz + 2.2); placePlayer(world, [S.x, S.z], Math.atan2(h.side * 1.3, -2.2)); // 학생은 남쪽으로 비켜 문패를 본다
      const C = a.at(h.px - h.side * 3.6, h.pz - 2.4), T = a.at(h.px, h.pz + 0.5);
      world.setFixedCamera([C.x, 2.3, C.z], [T.x, 1.3, T.z]); // 골목 북쪽에서 문패와 집주인을 마주 본다
      await dialogue.say({ who: 'owner', text: `제 이름은 ${ieyo(h.data.name)}. 할아버지 때부터 써 온 우리 이름이지요.` });
      for (;;) { // 세 문패 가운데 고른다(틀리면 다시)
        ctx.testHooks.choice = h.data.options.indexOf(h.data.name); // 테스트 봇이 고를 답
        const k = await dialogue.choose({ who: 'guide', text: '어느 문패를 달까요?' }, h.data.options);
        ctx.testHooks.choice = null;
        if (h.data.options[k] === h.data.name) break;
        missed = true; audio.play('wrong');
        await dialogue.say({ who: 'guide', text: `× ${P.wrong}` });
      }
      dialogue.close();
      // 옛 문패는 떨어지고 새 문패를 단다
      audio.play('tap');
      const y0 = h.old.position.y;
      await wait(world, 0.6, k => { h.old.position.y = y0 - 1.3 * k * k; h.old.rotation.z = k * 1.2; });
      h.old.visible = false; hook.oldDropped += 1;
      const np = plate(h.data.name); np.position.set(h.px - h.side * 0.13, 1.35, h.pz); np.rotation.y = -h.side * Math.PI / 2; np.scale.setScalar(0.01); g.add(np);
      await wait(world, 0.4, k => np.scale.setScalar(0.01 + 0.99 * ease(k)));
      audio.play('correct'); hook.hung.push(h.data.name);
      toast(ctx, `○ ${h.data.name}`, 'good');
      await wait(world, 0.7, k => { h.owner.rotation.x = 0.35 * Math.sin(k * Math.PI); }); // 고맙다고 고개 숙여 인사
      world.camMode = 'follow';
    }
    hud.setCounter(`${P.counter} ${houses.length}/${houses.length}`);
    for (const l of P.done) await dialogue.say(l);
    dialogue.close();
  } finally {
    ctx.testHooks.choice = null;
    await leaveArena(ctx, a);
  }
  return missed ? 'missed' : true;
}

// ── 놀이 ②: 첫 한글 수업. 책상마다 일본어 교과서를 걷고 한글 교과서를 놓으면 아이가 일어나 낱말을 읽는다 ──
export async function classroomPlay(ctx) {
  const { world, dialogue, hud, audio } = ctx;
  const P = script.parts.school, A = SCHOOL;
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  const [rx, rz] = A.room, room = classroom(g, rx, rz, { teacher: 'scholarModern', seated: true }), O = a.at(rx, rz);
  const kids = room.kids;
  const hook = ctx.testHooks.school = { desks: kids.length, books: 0, oldBooks: 0, read: 0, board: false, facing: 0, seated: kids.filter(k => k.userData.seated).length };
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.6), mat(0x7a5a3c, 'wood', 'object')); crate.position.set(A.crate[0], 0.25, A.crate[1]); g.add(crate); // 걷은 교과서 상자
  const desks = kids.map((kid, i) => {
    const kx = kid.position.x, kz = kid.position.z - 0.3; // 책상 줄(아이는 그 뒤 의자에 앉아 있다)
    const old = bookMesh(0x5a3a2a); old.position.set(kx, 0.74, kz - 0.55); room.group.add(old); hook.oldBooks += 1;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.6, 24), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(kx + 0.8, 0.1, kz - 0.2); ring.visible = false; room.group.add(ring);
    return { kid, kx, kz, old, ring, word: P.words[i % P.words.length] };
  });
  const p0 = a.at(...A.from); placePlayer(world, [p0.x, p0.z], Math.PI);
  setCarry(world.player, bookMesh(0xd8c08a), 'arms'); // 한글 교과서 묶음을 안고 들어간다
  const classView = () => world.setFixedCamera([O.x + 0.4, 5, O.z - 3.3], [O.x, 0.6, O.z + 1.4]);
  try {
    await ctx.fade?.(false);
    world.setFixedCamera([O.x + 1.5, 3.6, O.z + 7], [O.x, 1, O.z - 1]);
    for (const l of P.start) await dialogue.say(l);
    dialogue.close();
    world.camMode = 'follow';
    for (const [i, d] of desks.entries()) {
      hud.setCounter(`${P.counter} ${i}/${desks.length}`);
      d.ring.visible = true;
      const pos = a.at(rx + d.kx + 0.8, rz + d.kz - 0.2);
      await waitInteract(ctx, { pos, label: '한글 교과서 놓기', r: 1.3, markY: 2.6 });
      ctx.input.enabled = false;
      d.ring.visible = false;
      d.old.removeFromParent(); hook.oldBooks -= 1; // 일본어 교과서를 걷는다
      const nb = bookMesh(0xd8c08a); nb.position.set(d.kx, 0.74, d.kz - 0.55); room.group.add(nb); hook.books += 1;
      audio.play('tap');
      const lab = labelSprite(d.word, { size: 0.7 }); lab.position.set(d.kx, 2.5, d.kz); room.group.add(lab); // 아이가 일어나 낱말을 읽는다
      classView(); // 칠판 쪽 높은 곳에서 아이들의 얼굴과 책상을 본다
      await wait(world, 0.9, k => { const ar = d.kid.userData.arms; if (ar) ar[1].rotation.x = -1.3 * Math.sin(k * Math.PI); }); // 앉은 채 손을 들고 읽는다
      hook.read += 1;
      await wait(world, 0.9);
      lab.removeFromParent();
      world.camMode = 'follow';
    }
    hud.setCounter(`${P.counter} ${desks.length}/${desks.length}`);
    setCarry(world.player, null);
    // 선생님이 칠판에 '우리말 우리글'을 쓰고, 칠판 앞에서 아이들을 마주 보며 다 함께 읽는다
    const bd = labelSprite(P.board, { size: 1 }); bd.position.set(0, 2.15, -3.2); room.group.add(bd); hook.board = true;
    world.setFixedCamera([O.x + 0.6, 2.6, O.z + 5.5], [O.x, 1.7, O.z - 3]); // 교실 뒤에서 칠판 글씨를 본다
    audio.play('correct');
    await dialogue.say(P.end[0]);
    classView(); // 다 함께 읽는 아이들의 얼굴
    hook.facing = facingShare(world, kids);
    for (const l of P.end.slice(1)) await dialogue.say(l);
    dialogue.close();
  } finally {
    await leaveArena(ctx, a);
  }
  return true;
}

const base = makeKitChapter({
  id: 'h1', mood: 'summer', script,
  player: { robe: 0xe9e4da, hat: 'short', trim: 0x2b241c, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['citizen', 'grandma', 'newsboy', 'kimgu'],
  spot: SPOT, // 놀이를 마치면 서울 문 앞에서 북쪽(빛나는 문)을 보고 선다
  layout: {
    // 광복 몇 달 뒤 서울 큰길: 태극기를 든 사람들, 벽돌·시멘트 건물과 2층 상점, 가로수와 가로등, 멀리 도시의 건물들과 북쪽 산
    ground: 'earth', groundColor: 0x9a8a6a, bounds: { x0: -16, x1: 16, z0: -6, z1: 11 }, start: [0, 9], hill: 1.3,
    skyline: { style: 'brick', color: 0x4e4a46, arc: [Math.PI * 0.55, Math.PI * 1.45] },
    roads: [{ x: 0, z: 1, w: 40, d: 6, color: 0x8a8070 }],
    props: [
      { type: 'crowd', x: -9, z: -4, n: 15, cols: 5, flags: 0.7, looks: ['citizen', 'woman', 'student', 'gentleman', 'schoolgirl', 'grandma'], face: 0.2 },
      { type: 'crowd', x: 9, z: -4, n: 15, cols: 5, flags: 0.7, looks: ['commoner', 'student', 'woman', 'citizen', 'peasant'], face: -0.2 },
      { type: 'western', x: 0, z: -11, w: 10, d: 5, h: 6, color: 0x9a7a5a },
      { type: 'concrete', x: -13, z: -11, floors: 2, w: 7, color: 0xc8c0b0, awning: 0x5a5e62 }, { type: 'shop', x: 13, z: -10.5, w: 6, style: 'modern', awning: 0x2f6b5e, seed: 3 },
      { type: 'shop', x: -19, z: 6, w: 5, style: 'modern', ry: Math.PI / 2, awning: 0x8a2f24, seed: 1 }, { type: 'hanok', x: 18, z: 8, tile: true, ry: -Math.PI / 2 },
      { type: 'flagpole', x: 4.5, z: -6 }, { type: 'flagpole', x: -4, z: -6 },
      { type: 'tree', x: -16.5, z: -1.5, kind: 'poplar' }, { type: 'tree', x: 16.5, z: -1.5, kind: 'poplar' }, { type: 'lamp', x: -7, z: 4.2 }, { type: 'lamp', x: 12, z: 4.2 },
      { type: 'wall', x: -8.5, z: GATE_Z, w: 13, h: 1.8, color: 0x9a948a, solid: false }, { type: 'wall', x: 8.5, z: GATE_Z, w: 13, h: 1.8, color: 0x9a948a, solid: false }, // 큰길 어귀 담과 문
    ],
    npcs: [
      { id: 'citizen', look: 'citizen', x: -4, z: 6, ry: Math.PI * 0.8 },
      { id: 'grandma', look: 'grandma', x: 8, z: 5.5, ry: -Math.PI * 0.6 },
      { id: 'newsboy', look: 'kidModern', x: -10, z: 4, ry: Math.PI / 2 },
      { id: 'kimgu', look: 'kimgu', x: 1, z: -4, ry: 0 },
    ],
    // 길 위 안내판 대신 건물 간판(C-03): 「신문사」·「학교」. 안내판 글(다시 나온 신문·어린이날 선서)은 사람 대사·놀이로 옮겼다
    signs: [{ id: 'signPaper', title: '신문사', x: 0, z: -8.5, ry: 0, plaque: { y: 2.55, back: 0.45 } },
      { id: 'signSchool', title: '학교', x: -13, z: -8.5, ry: 0, plaque: { y: 2.55, back: 0.45 } }],
  },
  parts: [
    { ...script.parts.names, goal: script.goals[3], play: (ctx, scene, easy) => nameplatePlay(ctx, scene, easy) },
    { ...script.parts.school, goal: script.goals[4], intro: meet('newsboy', '신문 파는 아이와 이야기하기', script.parts.school.intro), play: ctx => classroomPlay(ctx) },
  ],
  // 서울 문과 「서울」 이름판은 굳히기에 합쳐지지 않게 돌려준다
  decorate(world) {
    const gate = gateLeaves(world.level, { x: 0, z: GATE_Z, width: 4, height: 2.6, inward: -1 });
    const board = nameBoard(world.level, '서울', 3.2, GATE_Z - 1.6);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return { gate, board };
  },
});

// 장 도입(C-03): ① 새 나라를 세울 준비를 하는 독립운동가들 ② 숨겨 둔 태극기를 꺼내 든 사람들의 만세. 끝나면 더한 것을 치운다
function introScene(ctx) {
  const { world } = ctx, L = world.level;
  const leaders = [['gentleman', -0.8, 6.5], ['kimgu', 0.8, 7.2], ['gentleman', -0.2, 8.4]].map(([look, x, z]) => { const p = person(L, look, x, z, Math.PI); p.visible = false; return p; });
  const cheer = [];
  for (let i = 0; i < 6; i++) { const p = person(L, ['citizen', 'woman', 'student', 'grandma', 'schoolgirl', 'commoner'][i], -3.5 + i * 1.4, 1.5 + (i % 2) * 0.8, Math.PI * 0.05); holdFlag(p); p.visible = false; cheer.push(p); }
  let off = null;
  const run = fn => { off?.(); let t = 0; off = world.onUpdate(dt => { t += dt; fn(t, dt); }); };
  const hide = on => { for (const id of [...PEOPLE, 'kimgu']) { const n = world.npcs.get(id); if (n) n.mesh.visible = on; } };
  return {
    shots: [
      { cam: [3.4, 2.4, 12.5], look: [0, 1.4, 6.5], to: { cam: [2.8, 2.3, 11.8], look: [0, 1.4, 6] },
        act: () => { hide(false); leaders.forEach(p => { p.visible = true; }); run((t, dt) => leaders.forEach(p => { p.position.z -= dt * 0.6; })); } }, // 새 나라를 세울 준비
      { cam: [1, 2.4, 9], look: [0, 1.5, 1.5], to: { cam: [0.8, 2.6, 8.4], look: [0, 1.6, 1.5] },
        act: () => { leaders.forEach(p => { p.visible = false; }); cheer.forEach(p => { p.visible = true; }); run(t => cheer.forEach(p => cheerFlag(p, Math.abs(Math.sin(t * 2))))); } }, // 태극기를 들고 만세(얼굴이 카메라 쪽)
    ],
    done: () => { off?.(); off = null; hide(true); for (const o of [...leaders, ...cheer]) o.removeFromParent(); },
  };
}

let scene = null;
export const villageTalk = (id, heard) => anyOrderTalk(script, PEOPLE, id, heard);
export const devScene = () => scene; // 개발용(사진 찍기)

export default {
  ...base,
  anyOrder: true, // 거리 사람은 아무 차례로(차례 전 대사 tooEarly가 없다, tests/quest.test.js)
  introScene,
  portal: { at: [0, 3.4], ry: 0 }, // 미니게임 뒤 빛나는 문(C-02): 돌아온 학생(SPOT) 바로 앞, 앞면은 학생(남쪽) 쪽
  buildScene(world) { scene = base.buildScene(world); return scene; },
  enterStage(ctx, stage) { scene.gate.setOpen(0); ctx.world.closeView = true; base.enterStage(ctx, stage); },
  // 모두 들은 뒤 김구에게 가면 학생의 결심 → 1945년 8월 15일 그날의 거리 만세 장면
  async explore(ctx) {
    await walkInAndTalk(ctx, script, { people: PEOPLE, final: 'kimgu', gate: scene.gate, from: INTRO_FROM, to: base.layout.start });
    await liberationScene(ctx);
  },
  // 공용 kit 미니게임을 그대로 돌리되, { meet } 줄에서는 그 사람에게 말을 걸 때까지 기다린다(C-05, chapters/kit/walk.js)
  minigame: ctx => minigameWithMeet(base, ctx),
};
