// 근대편 3장 「동학 농민 운동과 갑오개혁」(D-31): 전라도 고부의 들판, 관아와 초가 마을들.
// 마을 어귀 문으로 들어와 고부 농민·농민군 이야기를 아무 차례로 듣고(모두 들어야 전봉준), 전봉준에게 가면 학생의 결심 →
// ① 마을을 돌며 농민 모으기(뒤따르는 농민이 죽창·낫을 들고 걷는다) ② 전봉준에게 말을 걸면 횃불을 든 농민들과 밤길을 걸어 고부 관아로
// ③ 고부 관아를 차지하는 장면 ④ 농민군의 요구(두루마리) ⑤ 전봉준에게 말을 걸면 그를 따라 황토현 → 전주성 → 집강소 → 다시 일어섬 → 우금치를 걷는다.
import * as THREE from 'three';
import { makeKitChapter } from '../../kit/chapter.js';
import { buildArena } from '../../kit/play.js';
import { BUILD } from '../../kit/town.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { walkInAndTalk, anyOrderTalk } from '../../kit/talk.js';
import { leadWalk } from '../../kit/lead.js';
import { burning } from '../../kit/fire.js';
import { melee, volley, fallDown } from '../../kit/clash.js';
import { storyScene } from '../../kit/story.js';
import { showHowTo } from '../../../core/minigame.js';
import { makePerson, setCarry } from '../../../core/people.js';
import { waitInteract } from '../../../core/portal.js';
import { LOOKS } from '../../../content/characters.js';
import { placePlayer } from '../../joseon/common.js';
import { NIGHT_MOOD, wait, person, JAPAN, makeTorch, makeTool, flicker, torchLights, addTorchLight, equipFollowers, runTo, mound, followJeon } from './stage.js';
import script from './script.js';

export { NIGHT_MOOD, makeTorch, torchLights, equipFollowers };
const PEOPLE = ['peasant', 'farmer'];
const GATE_Z = 17, INTRO_FROM = [0, 20.5], SPOT = [0, 4.5];
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));

// ── 무대(마을에서 떨어진 x 400) ──
// 들판 사이 마을 길: 마을마다 초가와 살림살이를 두어 어디가 어느 마을인지 한눈에 보이게
const paddy = (x, z, w, d) => [{ x, z, w, d, color: 0x7a9a4a, kind: 'grass' }, { x, z: z - d / 2 - 0.3, w, d: 0.5, color: 0x8f7556 }]; // 논과 둑
export const FARMS = { edge: { style: 'thatch', seed: 187 }, center: [{ type: 'toolRack', x: -9, z: 8, ry: 0.3 }, { type: 'cargo', x: 11, z: -10, kind: 'sack', n: 4 }, { type: 'toolRack', x: -9, z: 11, ry: 0.3 }, { type: 'cargo', x: 9, z: 11, kind: 'sack', n: 4 }],
  origin: [400, 0], ground: 'grass', groundColor: 0x7a8a4c, bounds: { x0: -24, x1: 24, z0: -26, z1: 26 },
  roads: [{ x: 0, z: 0, w: 5, d: 52, color: 0x8f7556 }, ...paddy(14, 20, 12, 7), ...paddy(-16, 2, 12, 8), ...paddy(15, -12, 12, 7)],
  props: [
    // 윗마을: 초가 셋, 장독대, 짚더미
    { type: 'hanok', x: -9, z: 15, ry: Math.PI / 2 }, { type: 'hanok', x: -12, z: 21, ry: Math.PI / 2 }, { type: 'hanok', x: -15, z: 13, ry: Math.PI / 2 },
    { type: 'jars', x: -9, z: 19.5, ry: Math.PI / 2 }, { type: 'straw', x: -6, z: 21 },
    // 냇가 마을: 시냇물과 징검다리 같은 나무다리, 냇가의 초가
    { type: 'water', x: 0, z: 9, w: 120, d: 2.6, color: 0x5a8aa0 }, { type: 'pier', x: 0, z: 9, w: 5.4, d: 3.4, solid: false },
    { type: 'hanok', x: 9, z: 5, ry: -Math.PI / 2 }, { type: 'hanok', x: 12, z: 0, ry: -Math.PI / 2 }, { type: 'woodpile', x: 8, z: 1.5 },
    // 장터: 천막 가게, 쌀가마, 수레, 사람들
    { type: 'tent', x: -9, z: -3, color: 0xd8c9a0 }, { type: 'tent', x: -9, z: -9, color: 0xc8b890 }, { type: 'rice', x: -5.5, z: -6, n: 6 },
    { type: 'cart', x: 6, z: -6, ry: 0.4, load: true }, { type: 'jars', x: 7, z: -1.5 }, { type: 'crowd', x: -5, z: -12, n: 3, cols: 3, looks: ['commoner', 'woman', 'peasant'], face: Math.PI },
    // 모이는 곳: 담장과 기와집
    { type: 'hanok', x: 0, z: -24, tile: true, scale: 1.4 }, { type: 'wall', x: -8, z: -20, w: 9 }, { type: 'wall', x: 8, z: -20, w: 9 }, { type: 'flagpole', x: -4, z: -18.5, color: 0xe8e0c0 },
  ],
};
// 횃불 밤길(D-31): 남쪽 마을에서 논 사이 길을 따라 북쪽 고부 관아(담 가운데 문)까지
export const MARCH = { edge: { style: 'thatch', seed: 412 },
  origin: [400, 0], ground: 'grass', groundColor: 0x6a7444, bounds: { x0: -14, x1: 14, z0: -38, z1: 14 },
  roads: [{ x: 0, z: -12, w: 5, d: 54, color: 0x7a6a50 }, ...paddy(-9, 2, 8, 14), ...paddy(9, -6, 8, 14), ...paddy(-9, -20, 8, 10)],
  props: [
    { type: 'hanok', x: 9.5, z: 8, ry: -Math.PI / 2 }, { type: 'hanok', x: -9.5, z: -9, ry: Math.PI / 2 }, { type: 'hanok', x: 9.5, z: -22, ry: -Math.PI / 2 },
    { type: 'straw', x: 6, z: 3 }, { type: 'straw', x: -6, z: -15 },
    { type: 'hanok', x: 0, z: -42, tile: true, scale: 1.5 }, { type: 'wall', x: -8, z: -35, w: 10, h: 2.2 }, { type: 'wall', x: 8, z: -35, w: 10, h: 2.2 }, { type: 'flagpole', x: -4.5, z: -33.5, color: 0xe8e0c0 },
  ],
  names: [{ text: '고부 관아', x: 4.4, z: -32.6 }],
  path: [[0, 8], [1.5, -2], [-1.5, -12], [1, -22], [0, -31]], stand: [0, -28.5], from: [0, 11], jeonAt: [0, 8.5],
};
// 고부 관아 장면: 관아(담장·기와집·곡식 창고) 앞으로 횃불을 든 농민군이 몰려온다
const GOBU = {
  origin: [400, 260], ground: 'earth', groundColor: 0x8f7a5c, bounds: { x0: -18, x1: 18, z0: -14, z1: 16 },
  props: [
    { type: 'hanok', x: 0, z: -11, tile: true, scale: 1.6 }, { type: 'wall', x: -9, z: -6, w: 12 }, { type: 'wall', x: 9, z: -6, w: 12 },
    { type: 'hanok', x: 11, z: -12, tile: true, scale: 1.1 }, { type: 'flagpole', x: -3, z: -4.5, color: 0xe8e0c0 },
    { type: 'hanok', x: 13, z: -0.5, ry: -Math.PI / 2 }, // 곡식 창고(담 앞마당 동쪽, 문은 마당 쪽): 농민들이 곡식을 내온다(2026-11-04 선생님)
  ],
};
// 전봉준을 따라 걷는 길(D-31): 남쪽에서 북쪽으로 황토현(동쪽 언덕) → 전주성(성벽과 문) → 집강소(성 안 기와집) → 다시 일어선 들판 → 공주 우금치(북쪽 고개)
export const WALK_ARENA = {
  origin: [400, 0], ground: 'grass', groundColor: 0x8a9452, bounds: { x0: -9, x1: 9, z0: -94, z1: 14 }, hill: 0.5,
  roads: [{ x: 0, z: -40, w: 5, d: 110, color: 0x8f7556 }],
  props: [
    { type: 'wall', x: -11.5, z: -32, w: 17, h: 3.2, color: 0x9a9488 }, { type: 'wall', x: 11.5, z: -32, w: 17, h: 3.2, color: 0x9a9488 }, // 전주성 성벽(가운데 문)
    { type: 'hanok', x: 7.5, z: -40, ry: -Math.PI / 2, tile: true }, // 성 안 기와집
    { type: 'hanok', x: -7, z: -51, ry: Math.PI / 2, tile: true }, // 집강소
    { type: 'straw', x: 6, z: -60 }, { type: 'straw', x: -6.5, z: -78 },
  ],
  names: [{ text: '황토현', x: -3.2, z: -3.5 }, { text: '전주성', x: 4.2, z: -29.4 }, { text: '집강소', x: -3.4, z: -46.5 }, { text: '공주 우금치', x: -3.4, z: -83 }],
};
// path: 전봉준이 걷는 길, stand: 학생이 서는 곳, face: 전봉준이 보는 쪽, show: 그곳 일이 장면으로
export const WALK = [
  { path: [[0, 8], [1, 0], [-1, -8]], stand: [0.5, -5.5], face: Math.PI / 2, show: st => st.hwangto() },
  { path: [[0, -14], [-1, -22], [0, -27]], stand: [0.5, -24.5], face: Math.PI, show: st => st.jeonju() },
  { path: [[1, -38], [1, -44], [0.5, -50]], stand: [1.5, -47.5], face: -Math.PI / 2, show: st => st.jipgang() },
  { path: [[0, -56], [-1, -62], [0, -66]], stand: [0.5, -63.5], face: Math.PI, show: st => st.rise() },
  { path: [[0, -76], [1, -82], [0, -88]], stand: [0.5, -85.5], face: Math.PI, show: st => st.ugeumchi() },
];

let scene = null;
const torchCrowd = (g, list, look = i => (i % 3 === 2 ? 'commoner' : 'peasant')) => list.map(([x, z, ry = Math.PI], i) => { const p = person(g, look(i), x, z, ry); return p; });

// ── 횃불 밤 행진: 전봉준이 횃불을 들고 앞장서고, 학생과 횃불을 든 농민들이 줄지어 따른다 ──
export async function torchMarch(ctx) {
  const { world, dialogue } = ctx;
  await showHowTo(ctx.ui, script.march.howto);
  world.closeView = true;
  const jeon = world.npcs.get('jeonbongjun'), home = { x: jeon.mesh.position.x, z: jeon.mesh.position.z, ry: jeon.mesh.rotation.y, r: jeon.collider.r };
  await ctx.fade?.(true);
  world.setMood(NIGHT_MOOD);
  const a = buildArena(world, MARCH), g = a.group;
  for (const n of MARCH.names) nameBoard(g, n.text, n.x, n.z);
  const j0 = a.at(...MARCH.jeonAt), s0 = a.at(...MARCH.from);
  world.moveNpc('jeonbongjun', j0.x, j0.z, Math.PI);
  placePlayer(world, [s0.x, s0.z]);
  const torches = [makeTorch(), makeTorch()];
  setCarry(jeon.mesh, torches[0], 'side'); setCarry(world.player, torches[1], 'side');
  const lights = torchLights(world) ? [addTorchLight(torches[0]), addTorchLight(torches[1])] : [];
  // 함께 걷는 농민 열 명: 학생 양옆에 두 줄로 서서 함께 걷는다(뒤에 서면 카메라를 가린다). 걸음은 공용 걷기가 다리를 움직인다
  const SLOTS = Array.from({ length: 10 }, (_, i) => [(i % 2 ? 1 : -1) * (1.9 + (Math.floor(i / 2) % 2) * 0.3), 1.2 - Math.floor(i / 2) * 1.1]); // [옆, 앞]
  const followers = SLOTS.map(([sx, f], i) => {
    const p = person(world.level, i % 3 === 2 ? 'commoner' : 'peasant', s0.x + sx, s0.z - f, Math.PI);
    const t = makeTorch(); setCarry(p, t, 'side'); torches.push(t); return p;
  });
  const offFlicker = flicker(world, torches);
  const offFollow = world.onUpdate(dt => {
    const pp = world.player.position, ry = world.player.rotation.y, fx = Math.sin(ry), fz = Math.cos(ry);
    followers.forEach((f, i) => {
      const [sx, fw] = SLOTS[i], tx = pp.x + fz * sx + fx * fw, tz = pp.z - fx * sx + fz * fw;
      const dx = tx - f.position.x, dz = tz - f.position.z, d = Math.hypot(dx, dz);
      if (d > 0.25) { const k = Math.min(d, dt * (d > 2 ? 6 : 4)); f.position.x += (dx / d) * k; f.position.z += (dz / d) * k; if (d > 0.5) f.rotation.y = Math.atan2(dx, dz); }
    });
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.05, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.visible = false; world.level.add(ring);
  ctx.testHooks.march = { torches: torches.length, lights: lights.length };
  await ctx.fade?.(false);
  try {
    const stand = a.at(...MARCH.stand);
    await leadWalk(ctx, { id: 'jeonbongjun', path: MARCH.path.map(q => { const w = a.at(...q); return [w.x, w.z]; }), stand: [stand.x, stand.z], ring, face: 0, speed: 3 });
    const m = jeon.mesh.position, pp = world.player.position;
    jeon.mesh.rotation.y = Math.atan2(pp.x - m.x, pp.z - m.z);
    world.setTalkCamera(jeon.mesh);
    for (const l of script.march.end) await dialogue.say(l);
    dialogue.close();
  } finally {
    await ctx.fade?.(true); // 어두운 채로 고부 관아 장면으로 이어진다(관아 장면이 밝힌다)
    offFollow(); offFlicker();
    followers.forEach(f => f.removeFromParent());
    lights.forEach(l => l.removeFromParent());
    setCarry(jeon.mesh, null); setCarry(world.player, null);
    world.level.remove(ring); a.dispose();
    world.moveNpc('jeonbongjun', home.x, home.z, home.ry); jeon.collider.r = home.r;
    placePlayer(world, SPOT);
    ctx.input.enabled = false;
  }
}

// ── 고부 관아 장면(밤): 횃불을 든 농민군이 관아 앞으로 몰려오고, 조병갑은 달아나고, 곡식을 나눈다 ──
async function gobuScene(ctx) {
  const { world, dialogue } = ctx;
  const L = script.parts.gobu.lines;
  await ctx.fade(true);
  world.setMood(NIGHT_MOOD);
  const arena = buildArena(world, GOBU), g = arena.group, O = arena.at(0, 0);
  const was = world.player.visible; world.player.visible = false;
  const crowd = new THREE.Group(); BUILD.crowd(crowd, { n: 12, cols: 4, looks: ['peasant', 'commoner', 'peasant', 'peasant'], face: Math.PI }); crowd.position.set(-2, 0, 16); g.add(crowd);
  const leader = makePerson(LOOKS.jeonbongjun); leader.rotation.y = Math.PI; crowd.add(leader); leader.position.set(0, 0, -2);
  const porters = [0, 1, 2].map(i => { const p = makePerson(LOOKS.peasant); p.rotation.y = Math.PI; p.position.set(0.6 + i * 1.1, 0, 15 + (i % 2) * 0.6); g.add(p); return p; }); // 곡식 창고에서 가마를 내올 농민(무리 몸은 한 덩어리로 합쳐져 따로 움직일 수 없다)
  const torches = [];
  crowd.children.forEach((p, i) => { if (!p.userData.legs) return; const t = i % 3 === 1 ? makeTool(i) : makeTorch(); if (t.userData.flame) torches.push(t); setCarry(p, t, 'side'); });
  const offFlicker = flicker(world, torches);
  const lights = torchLights(world) ? [addTorchLight(torches[0]), addTorchLight(torches[Math.floor(torches.length / 2)])] : [];
  const jo = makePerson(LOOKS.jobyeonggap); jo.position.set(0, 0, -4); g.add(jo);
  const dg = new THREE.Group(); dg.position.set(10.75, 0, -0.5); dg.rotation.y = -Math.PI / 2; g.add(dg); const granary = gateLeaves(dg, { width: 1.6, height: 1.9, inward: -1, color: 0x6b4a32 }); // 곡식 창고 문(앞면이 마당 쪽)
  world.setFixedCamera([O.x + 14, 9, O.z + 16], [O.x, 1.5, O.z - 3]);
  await ctx.fade(false);
  const anim = (sec, fn) => wait(world, sec, k => fn(k));
  try {
    await dialogue.say(L[0]); dialogue.close();
    const march = anim(4, t => { crowd.position.z = 16 - t * 13; porters.forEach((p, i) => { p.position.z = 15 + (i % 2) * 0.6 - t * 13; }); });
    await anim(0.8, () => {});
    await dialogue.say(L[1]); dialogue.close();
    // 조병갑은 담 옆으로 빠져나가 전주 쪽(동쪽)으로 달아난다
    await runTo(world, jo, { x: 22, z: -5 }, 2.4);
    jo.visible = false;
    await march;
    ctx.audio.play('correct');
    // 곡식 창고 문을 열고 농민들이 곡식 가마를 안아 내와 관아 앞마당에 내려놓는다(2026-11-04 선생님)
    const carriers = porters;
    const via = async (p, pts, sp) => { for (const [x, z] of pts) await runTo(world, p, { x, z }, Math.hypot(x - p.position.x, z - p.position.z) / sp + 0.05, { lean: 0.1 }); };
    await Promise.all(carriers.map((p, i) => via(p, [[9.2, -1.8 + i * 0.9]], 3.4)));
    await anim(0.8, k => granary.setOpen(k));
    const sacks = carriers.map(p => { const b = new THREE.Group(); BUILD.rice(b, { n: 1 }); setCarry(p, b, 'arms'); return b; });
    await anim(0.4, () => {});
    await Promise.all(carriers.map((p, i) => via(p, [[2.6 + i * 1.3, 0.6]], 2.2)));
    carriers.forEach((p, i) => { setCarry(p, null); sacks[i].position.set(2.6 + i * 1.3, 0, -0.6); sacks[i].rotation.set(0, 0, 0); g.add(sacks[i]); });
    const rice = new THREE.Group(); BUILD.rice(rice, { n: 6 }); rice.position.set(4, 0, -2.4); g.add(rice); // 먼저 내온 가마들
    await dialogue.say(L[2]); dialogue.close();
    await dialogue.say(L[3]); dialogue.close();
    ctx.testHooks.gobu = { fled: !jo.visible, rice: true, torches: torches.length };
  } finally {
    await ctx.fade(true);
    offFlicker(); lights.forEach(l => l.removeFromParent());
    arena.dispose();
    world.setMood(base.mood);
    world.player.visible = was;
    world.camMode = 'follow'; world.snapCamera();
    await ctx.fade(false);
  }
}

// ── 전봉준을 따라 걷기: 멈춘 곳마다 그 일 ──
export function walkStage({ ctx, a, g, jeon }) { // (테스트가 싸움 장면을 따로 돌린다)
  const { world } = ctx;
  const heavy = torchLights(world) > 0; // 불길은 화질 '보통·높음'에서 크게
  const cam = (eye, look) => { const e = a.at(eye[0], eye[2]), l = a.at(look[0], look[2]); return () => world.setFixedCamera([e.x, eye[1], e.z], [l.x, look[1], l.z]); };
  const fires = [];
  // 1 황토현: 동쪽 언덕 위 관군, 길가 농민군
  const hill1 = mound(g, 19, -9, { r: 12, h: 3.6, sx: 1.2, color: 0x8a8a4a }); // 2026-11-04 선생님: 언덕을 넓히고 두 쪽 사이를 띄운다
  const gwangun = [[12, -12.5], [12.4, -9.5], [12, -6.5], [14, -11], [14.2, -8], [13.8, -14]].map(([x, z]) => { const p = person(g, 'joseonSoldier', x, z, -Math.PI / 2); p.position.y = hill1.top(x, z); return p; });
  const army1 = torchCrowd(g, [[2.4, -11], [2.8, -8.8], [2.4, -6.6], [4.2, -10], [4.4, -7.6], [2.2, -13.2]], () => 'peasant');
  army1.forEach((p, i) => { p.rotation.y = Math.PI / 2; setCarry(p, makeTool(i), 'side'); });
  // 2 전주성: 성문(문짝), 성 위 깃발은 차지한 뒤 올린다
  const gate = gateLeaves(g, { x: 0, z: -32, width: 5.4, height: 3.2, inward: -1, color: 0x6b4a32 });
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.6, 1.2), new THREE.MeshLambertMaterial({ color: 0x3d4846 })); lintel.position.set(0, 3.5, -32); g.add(lintel);
  // 구호(보국안민·제폭구민)는 청·일본군이 들어온 뒤 다시 일어설 때 처음 보인다(2026-11-06 선생님): 전주성 깃발은 글자 없이
  const flags = [-4, 4].map(x => { const b = new THREE.Group(); BUILD.banner(b, { color: 0xe8dcc0, h: 3 }); b.position.set(x, 3.2, -32); b.visible = false; g.add(b); return b; });
  const army2 = torchCrowd(g, [[-1.2, -21], [1.2, -21], [-1.2, -19.6], [1.2, -19.6], [0, -18.4]], () => 'peasant');
  army2.forEach((p, i) => setCarry(p, makeTool(i + 1), 'side'));
  // 3 집강소: 화약을 맺는 정부 관리와 농민군, 동쪽에서 들어온 청·일본 군대
  const desk = new THREE.Group(); BUILD.desk(desk); desk.position.set(-3.6, 0, -51); desk.rotation.y = Math.PI / 2; g.add(desk);
  const official = person(g, 'joseonOfficial', -4.6, -51, Math.PI / 2);
  const jipgang = [[-3.8, -53], [-4.6, -49.4], [-2.6, -49.2]].map(([x, z]) => person(g, 'peasant', x, z, Math.PI / 2));
  const foreign = [...[[6, -58], [7.2, -58], [6, -59.3], [7.2, -59.3]].map(([x, z]) => person(g, 'qingSoldier', x, z, -Math.PI * 0.75)),
    ...[[8.6, -55], [9.8, -55], [8.6, -56.3], [9.8, -56.3]].map(([x, z]) => person(g, JAPAN, x, z, -Math.PI * 0.75))];
  foreign.forEach(p => { p.visible = false; });
  // 4 다시 일어섬: 들판 양쪽에서 농민군이 몰려와 깃발을 세운다
  const rise = torchCrowd(g, Array.from({ length: 12 }, (_, i) => [(i % 2 ? 1 : -1) * 16, -69 - Math.floor(i / 2) * 1.2, Math.PI]), () => 'peasant');
  rise.forEach((p, i) => { p.visible = false; setCarry(p, makeTool(i), 'side'); });
  const banners = [[-5, -71, '보국안민'], [5, -71, '제폭구민']].map(([x, z, text]) => { const b = new THREE.Group(); BUILD.banner(b, { text }); b.position.set(x, -4.6, z); g.add(b); return b; });
  // 5 우금치: 북쪽 고개 위 일본군과 관군, 고개 아래 농민군
  const ridge = mound(g, 0, -104, { r: 11, h: 4, sx: 2.2, color: 0x6f7a5a });
  const top = [[-6, -98.5, JAPAN], [-3, -98, JAPAN], [0, -98, JAPAN], [3, -98, JAPAN], [6, -98.5, 'joseonSoldier'], [8.5, -99, 'joseonSoldier']].map(([x, z, look]) => { const p = person(g, look, x, z, 0); p.position.y = ridge.top(x, z); return p; });
  const army5 = torchCrowd(g, [[-3, -91], [-1.6, -91.6], [0, -91], [1.6, -91.6], [3, -91], [-2.2, -92.8], [2.2, -92.8]], () => 'peasant');
  army5.forEach((p, i) => setCarry(p, makeTool(i), 'side'));
  return {
    keepDark: false,
    async hwangto() { // 농민군이 무기를 들고 언덕으로 달려가고, 관군은 돌아서서 언덕 너머 동쪽으로 달아난다(2026-11-04 선생님)
      
      this.view = cam([-2, 3.6, -1], [11, 1.4, -9]); this.view();
      const hook = this.hook = { charged: 0, fled: 0 };
      const up = army1.map((p, i) => runTo(world, p, { x: 9 + (i % 3) * 0.4, z: p.position.z }, 2.6 + i * 0.12, { lean: 0.25, heightAt: hill1.top }).then(() => { hook.charged += 1; }));
      await wait(world, 0.9);
      const off = gwangun.map((p, i) => { p.rotation.y = Math.PI / 2; return runTo(world, p, { x: p.position.x + 13, z: p.position.z + (i % 2 ? 1 : -1) }, 2.4 + i * 0.1, { lean: 0.3, heightAt: hill1.top }).then(() => { p.visible = false; hook.fled += 1; }); });
      await Promise.all([...up, ...off]);
      army1.forEach(p => { p.rotation.y = Math.PI / 2; });
    },
    async jeonju() { // 성문이 열리고 농민군이 성 안으로, 성 위에 깃발
      
      this.view = cam([3, 3.2, -18], [0, 2.6, -32]); this.view();
      await wait(world, 1.2, k => gate.setOpen(k));
      army2.forEach((p, i) => runTo(world, p, { x: (i - 2) * 1.2, z: -38 - (i % 2) }, 2.4, { lean: 0.1, speed: 1.4 }));
      await wait(world, 1.6);
      flags.forEach(f => { f.visible = true; });
    },
    async jipgang() { // 청·일본 군대가 들어온다 → 관리와 농민군이 화약을 맺고 집강소에서 고을 일을 본다
      
      this.view = cam([4, 3.6, -43], [-1, 1.4, -54]); this.view();
      foreign.forEach(p => { p.visible = true; p.rotation.y = Math.atan2(-4 - p.position.x, -51 - p.position.z); }); // 농민군이 선 곳을 보며 그쪽으로 다가온다(2026-11-04 선생님)
      await wait(world, 1.4, (k, dt) => foreign.forEach(p => { p.position.x += Math.sin(p.rotation.y) * dt * 2; p.position.z += Math.cos(p.rotation.y) * dt * 2; }));
    },
    async rise() { // 양쪽 들판에서 농민군이 몰려와 길가에 서고, 깃발이 오른다
      
      this.view = cam([0, 3.4, -58], [0, 1.6, -71]); this.view();
      rise.forEach(p => { p.visible = true; });
      await Promise.all([
        ...rise.map((p, i) => runTo(world, p, { x: (i % 2 ? 1 : -1) * (4 + (Math.floor(i / 2) % 3) * 1.3), z: p.position.z }, 2.2, { lean: 0.1, speed: 1.6 }).then(() => { p.rotation.y = 0; })),
        wait(world, 2.2, k => banners.forEach(b => { b.position.y = -4.6 + k * 4.6; })),
      ]);
    },
    async ugeumchi() {
      // 농민군이 고개로 올라가자 고개 위 일본군과 관군이 줄지어 총을 쏘고(불빛·연기), 몇이 쓰러진 뒤 농민군이 크게 져서 물러선다(D-65). 체포는 해설로만, 잡힌 곳은 보여 주지 않는다
      this.view = cam([-13, 3.6, -90], [2, 2.6, -98]); this.view(); // 2026-11-06 선생님: 일본군이 총을 잡고 쏘는 게 보이게 비스듬한 옆에서
      ctx.audio?.play?.('boom');
      for (const [x, z] of heavy ? [[-4, -99.5], [2, -99], [6.5, -100]] : [[0, -99]]) fires.push(burning(world, { parent: g, x, y: ridge.top(x, z), z, size: heavy ? 0.9 : 0.6, level: 1 }));
      const up = army5.map(p => runTo(world, p, { x: p.position.x * 0.9, z: p.position.z - 3 }, 1.6, { lean: 0.2, heightAt: ridge.top }));
      const hook = this.hook = { volleys: 0, fell: 0 };
      const hit = [army5[2], army5[5], army5[0]];
      await volley(world, g, top, { rounds: 3, gap: 0.8, audio: ctx.audio, onRound: v => { hook.volleys += 1; if (hit[v]) { fallDown(world, hit[v], { side: v % 2 ? 1 : -1, sec: 3 }); hook.fell += 1; } } });
      await Promise.all(up);
      await Promise.all(army5.filter(p => !hit.includes(p)).map((p, i) => runTo(world, p, { x: (i % 2 ? 1 : -1) * (14 + i), z: p.position.z + 8 }, 2.2 + i * 0.1, { lean: 0.25 }).then(() => { p.visible = false; })));
    },
    dispose() { fires.forEach(f => f.setLevel(0)); },
  };
}
export function historyWalk(ctx) {
  ctx.world.closeView = true;
  return showHowTo(ctx.ui, script.walk.howto).then(() => followJeon(ctx, { arena: WALK_ARENA, stops: WALK, lines: script.walk.stops, stage: walkStage, start: [0, 11], jeonAt: [0, 8.5], spot: SPOT }));
}

// 다음 놀이 앞에서 기다리기(C-05): 부분 intro 맨 앞의 { meet } 표시에서 전봉준 머리 위에 느낌표를 띄우고, 학생이 말을 걸 때까지 기다린다
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
let followOff = null;

const gather = script.parts.gather;
const base = makeKitChapter({
  id: 'k3', mood: 'autumn', script,
  player: { robe: 0xddd2bb, hat: 'topknot', trim: 0x8a2f24, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['peasant', 'farmer', 'jeonbongjun'],
  spot: SPOT, // 놀이를 마치면 마을 길 가운데에서 북쪽(빛나는 문)을 보고 선다
  layout: {
    // 1894년 전라도 고부: 넓은 들판(논)이 둘러싼 낮은 마을, 북쪽 축대 위에 담을 두른 관아, 마을 어귀의 문과 버드나무·볏가리
    ground: 'grass', groundColor: 0x8a9a52, bounds: { x0: -17, x1: 17, z0: -10, z1: 13 }, start: [0, 11.5], hill: 0.55,
    roads: [{ x: 0, z: 1, w: 4, d: 24 }, { x: 0, z: -2, w: 36, d: 3.5 }],
    props: [
      { type: 'terrace', x: 0, z: -9.6, w: 9.4, d: 6, h: 0.8, steps: false }, { type: 'hanok', x: 0, z: -9.8, y: 0.8, tile: true, scale: 1.5 },
      { type: 'wall', x: -7, z: -6, w: 8 }, { type: 'wall', x: 7, z: -6, w: 8 },
      { type: 'hanok', x: -13, z: 7, ry: 0.3 }, { type: 'hanok', x: 13, z: 7, ry: -0.3 }, { type: 'hanok', x: -14, z: -6 }, { type: 'hanok', x: 14, z: -6 },
      { type: 'flagpole', x: -3, z: 6, color: 0xf2efe6 }, { type: 'flagpole', x: 4, z: 6, color: 0xb8452f },
      { type: 'crowd', x: 9, z: 2, n: 6, cols: 3, looks: ['peasant', 'uibyeong', 'peasant'], face: -Math.PI / 2 },
      { type: 'rice', x: -10, z: 2, n: 6 }, { type: 'straw', x: -15.5, z: 2.5 }, { type: 'straw', x: 16, z: 1 },
      { type: 'tree', x: 10, z: 10.6, kind: 'willow' }, { type: 'tree', x: -16, z: 10.6, kind: 'willow' },
      { type: 'wall', x: -8.5, z: GATE_Z, w: 13, h: 1.8, solid: false }, { type: 'wall', x: 8.5, z: GATE_Z, w: 13, h: 1.8, solid: false }, // 마을 어귀 담
      { type: 'paddy', x: -21, z: 0, w: 7, d: 20, ripe: true }, { type: 'paddy', x: 21, z: 0, w: 7, d: 20, ripe: true },
      { type: 'paddy', x: -21, z: 14, w: 7, d: 6, ripe: true }, { type: 'paddy', x: 21, z: 14, w: 7, d: 6, ripe: true },
    ],
    npcs: [
      { id: 'peasant', look: 'peasant', x: -6, z: 7, ry: Math.PI * 0.8 },
      { id: 'jeonbongjun', look: 'jeonbongjun', x: 4, z: 1, ry: -Math.PI / 2 },
      { id: 'farmer', look: 'uibyeong', x: -8, z: -2.5, ry: Math.PI / 2 },
    ],
    // 길 위 안내판 대신 건물 간판(C-03): 관아 처마 아래 「고부 관아」, 동쪽 초가 처마 아래 「주막」. 안내판 대사는 농민군 대사·끝 정리로 옮겼다
    signs: [{ id: 'signGwana', title: '고부 관아', x: 0, z: -4.4, plaque: { y: 4.1, back: 2.5 } }, { id: 'signInn', title: '주막', x: 14, z: -2.6, plaque: { y: 2.3, back: 1.4 } }],
    scatter: [{ kind: 'grass', count: 90, area: { x0: -17, x1: 17, z0: -10, z1: 12 }, avoid: [{ x: 0, z: 1, r: 3 }, { x: 9, z: 4, r: 4 }, { x: 0, z: 0, r: 3 }], seed: 221, color: 0x9aaa5a }],
  },
  parts: [
    { ...gather, goal: script.goals[2], arena: FARMS, from: [0, 23], followers: { looks: ['peasant', 'commoner'], per: 2 },
      route: xy(gather.route, [{ x: -3, z: 15 }, { x: 3, z: 5 }, { x: -3, z: -5 }, { x: 0, z: -17 }]).map(r => ({ ...r, labelSize: 1.4 })),
      pickups: xy(gather.pickups, [{ x: 16, z: 18 }, { x: -17, z: 4 }, { x: 15, z: -10 }]),
      hazards: [{ x: -9, z: 10, to: [9, 10], kind: 'constable', r: 1.1, speed: 0.45 }, { x: 9, z: 0, to: [-9, 0], kind: 'constable', r: 1.1, speed: 0.55 }, { x: -9, z: -11, to: [9, -11], kind: 'constable', r: 1.1, speed: 0.5 }], // 마을 길을 도는 관아 포졸
      before: ctx => { followOff = equipFollowers(ctx.world); }, after: () => { followOff?.(); followOff = null; } },
    { type: 'scene', title: script.march.title, goal: script.goals[3], mood: NIGHT_MOOD, intro: meet('jeonbongjun', '전봉준과 이야기하기', script.march.intro), play: ctx => torchMarch(ctx) },
    { ...script.parts.gobu, goal: script.goals[3], play: ctx => gobuScene(ctx) },
    { ...script.parts.demands, goal: script.goals[4], scroll: true },
    { type: 'scene', title: script.walk.title, goal: script.goals[5], intro: meet('jeonbongjun', '전봉준과 이야기하기', script.walk.intro), play: ctx => historyWalk(ctx) },
  ],
  decorate(world) { // 마을 어귀 나무 문과 「전라도 고부」 이름판(S51). 문짝·이름판은 굳히기에 합쳐지지 않게 돌려준다
    const gate = gateLeaves(world.level, { x: 0, z: GATE_Z, width: 4, height: 2.6, inward: -1 });
    const board = nameBoard(world.level, '전라도 고부', 3.2, GATE_Z - 1.6);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return { gate, board };
  },
});

// 장 도입(C-03): ① 관리가 농민들의 곡식 가마를 수레에 실어 간다(늘어난 세금과 수탈)
// ② 관아 앞 고부 군수 앞에서 농민들이 모여 주먹을 쥐고 웅성인다(군수의 횡포와 농민의 불만). 끝나면 더한 것을 치운다
function introScene(ctx) {
  const { world } = ctx, L = world.level;
  const add = (look, x, z, ry) => { const p = makePerson(LOOKS[look]); p.position.set(x, 0, z); p.rotation.y = ry; L.add(p); return p; };
  const cart = new THREE.Group(); BUILD.cart(cart, {}); cart.position.set(-3.5, 0, 3.2); cart.rotation.y = Math.PI / 2; L.add(cart);
  const taxmen = [add('joseonOfficial', -4.6, 1.8, -Math.PI / 2), add('joseonSoldier', -2.4, 1.6, -Math.PI / 2)];
  const sacks = new THREE.Group(); BUILD.rice(sacks, { n: 1 }); sacks.position.set(-7.6, 0, 3.4); L.add(sacks); // 군졸이 두 팔로 안아 수레에 싣는다(2026-11-04 선생님: 볏짐이 저절로 올라가던 것)
  const pile = new THREE.Group(); BUILD.rice(pile, { n: 2 }); pile.position.set(-8.2, 0, 2.4); L.add(pile);
  const farmers1 = [add('peasant', -8.4, 4.6, Math.PI / 2), add('peasant', -8.8, 1.4, Math.PI / 2)];
  const gunsu = add('jobyeonggap', 0, -4.6, 0); gunsu.visible = false;
  const crowd = [[-2, -1], [-0.8, -0.6], [0.6, -0.8], [1.8, -1.2], [-1.4, 0.4], [1.2, 0.4]].map(([x, z]) => { const p = add(x > 0 ? 'peasant' : 'commoner', x, z + 2.5, Math.PI); p.visible = false; return p; });
  let off = null;
  const run = fn => { off?.(); let t = 0; off = world.onUpdate(dt => { t += dt; fn(t); }); };
  const hide = on => { for (const id of ['jeonbongjun', 'farmer', 'peasant']) { const n = world.npcs.get(id); if (n) n.mesh.visible = on; } };
  return {
    shots: [
      { cam: [2.2, 2.6, 6.4], look: [-5, 1.1, 2.4], to: { cam: [1.4, 2.4, 5.6], look: [-5, 1.1, 2.4] },
        act: () => { hide(false);
          const sol = taxmen[1]; sol.position.set(-6.9, 0, 3.4); sol.rotation.y = -Math.PI / 2; let got = false, put = false;
          run(u => {
            farmers1.forEach(p => { p.rotation.x = 0.12 * Math.min(1, u); });
            if (!got && u > 0.5) { got = true; sacks.position.set(0, 0, 0); setCarry(sol, sacks, 'arms'); } // 볏짐을 안아 들고
            if (got && !put) { const k = Math.min(1, (u - 0.5) / 2); sol.position.x = -6.9 + k * 2.2; sol.rotation.y = Math.PI / 2; // 수레 앞까지 걸어가
              if (k >= 1) { put = true; setCarry(sol, null); sacks.position.set(-3.5, 0.75, 3.2); L.add(sacks); } } // 수레 위에 올린다
          }); } },
      { cam: [6.5, 3.4, 1.5], look: [-0.5, 1.4, -2.6], to: { cam: [5.6, 3.2, 0.8], look: [-0.5, 1.4, -2.6] },
        act: () => {
          for (const o of [cart, sacks, pile, ...taxmen, ...farmers1]) o.visible = false;
          gunsu.visible = true; crowd.forEach(p => { p.visible = true; });
          run(u => crowd.forEach((p, i) => { p.position.z = [-1, -0.6, -0.8, -1.2, 0.4, 0.4][i] + 2.5 - Math.min(1, u / 1.5) * 1.6; const arm = p.userData.arms?.[1]; if (arm) arm.rotation.x = -1.2 - Math.sin(u * 5 + i) * 0.4; }));
        } },
    ],
    done: () => { off?.(); off = null; hide(true); for (const o of [cart, sacks, pile, ...taxmen, ...farmers1, gunsu, ...crowd]) o.removeFromParent(); },
  };
}

export const villageTalk = (id, heard) => anyOrderTalk(script, PEOPLE, id, heard);
export const devScene = () => scene; // 개발용(사진 찍기)

export default {
  ...base,
  anyOrder: true, // 고부 사람은 아무 차례로(차례 전 대사 tooEarly가 없다, tests/quest.test.js)
  introScene,
  stories: { fights: ctx => storyScene(ctx, { key: 'fights', arena: WALK_ARENA, run: async ({ a, g, fadeIn }) => { const st = walkStage({ ctx, a, g, jeon: null }); st.hwangtoView?.(); await fadeIn(); await st.hwangto(); await wait(ctx.world, 1); await st.ugeumchi(); st.dispose(); } }) }, // 개발용 ?debug=k3-story(황토현·우금치 싸움만 본다)
  portal: { at: [0, 0], ry: 0 }, // 미니게임 뒤 빛나는 문(C-02): 돌아온 학생(SPOT) 바로 앞 마을 길 가운데, 앞면은 학생(남쪽) 쪽
  buildScene(world) { scene = base.buildScene(world); return scene; },
  enterStage(ctx, stage) { scene.gate.setOpen(0); ctx.world.closeView = true; base.enterStage(ctx, stage); },
  explore(ctx) { return walkInAndTalk(ctx, script, { people: PEOPLE, final: 'jeonbongjun', gate: scene.gate, from: INTRO_FROM, to: base.layout.start }); },
  // 공용 kit 미니게임을 그대로 돌리되, { meet } 줄에서는 전봉준에게 말을 걸 때까지 기다린다(C-05)
  async minigame(ctx) {
    const d = ctx.dialogue, say = d.say;
    d.say = line => (line && line.meet ? meetPerson(ctx, line.meet) : say.call(d, line));
    try { return await base.minigame(ctx); } finally { d.say = say; followOff?.(); followOff = null; ctx.setGoal(null); } // 퀴즈 목표는 빛나는 문이 대신(C-01)
  },
};
