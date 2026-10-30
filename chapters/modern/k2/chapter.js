// 근대편 2장 「갑신정변」(D-29, D-30): 해 질 녘 한성 거리와 우정총국.
// 큰길 문으로 들어와 상인·우정총국 관리의 이야기를 아무 차례로 듣고(모두 들어야 김옥균이 이야기한다), 김옥균에게 가면 학생의 결심 →
// ① 김옥균을 따라 그날 밤을 걷기(우정총국 잔치 → 정변의 불길·소란 → 창덕궁으로 → 새 정부와 개혁안, 밤 하늘)
// ② 김옥균에게 말을 걸면: 한성 곳곳의 담·게시판에 진짜 개혁안만 붙이기(붙이면 두루마리로 그 내용을 본다)
// ③ 김옥균에게 말을 걸면: 다시 궁으로. 청 군대가 몰려와 김옥균이 몸을 숙이고 달아나고, 3일 만에 끝남.
import * as THREE from 'three';
import { makeKitChapter } from '../../kit/chapter.js';
import { buildArena } from '../../kit/play.js';
import { BUILD } from '../../kit/town.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { walkInAndTalk, anyOrderTalk } from '../../kit/talk.js';
import { leadWalk } from '../../kit/lead.js';
import { burning } from '../../kit/fire.js';
import { showHowTo, showDocument } from '../../../core/minigame.js';
import { makePerson, animateWalk, setCarry, mat } from '../../../core/people.js';
import { waitInteract } from '../../../core/portal.js';
import { MOODS } from '../../../core/world.js';
import { LOOKS } from '../../../content/characters.js';
import { sayAll, placePlayer } from '../../joseon/common.js';
import script from './script.js';
import { qingStreetScene } from './story.js';

const PEOPLE = ['merchant', 'clerk'];
const GATE_Z = 12.5, INTRO_FROM = [0, 15.5];

// 정변이 일어난 겨울밤(D-30 G-01): 달빛이 도는 짙은 남색 하늘. 공용 분위기 목록에 이 장 것 하나를 더한다(마을은 해 질 녘 winterDusk 그대로)
export const NIGHT_MOOD = 'k2Night';
MOODS[NIGHT_MOOD] ??= {
  skyTop: 0x0b1230, skyHorizon: 0x34406a, skyBottom: 0x1a1e2a,
  fog: [0x232a40, 40, 130],
  sun: { color: 0xb8c8f0, intensity: 0.85, dir: [24, 40, 18] }, // 달빛
  hemi: [0xa8b4dc, 0x4a4650, 0.95], // 얼굴이 어둠에 묻히지 않게
  particles: null, clouds: 0.15, cloud: 0x4a5270,
};

// ── 무대(마을에서 떨어진 x 400) ──
// ① 정변의 밤: 남쪽 우정총국(잔치)에서 굽은 큰길을 따라 북쪽 창덕궁 문, 문 안 마당과 전각까지
export const NIGHT_A = { edge: { style: 'street', seed: 709 }, center: [{ type: 'jars', x: 12, z: 8 }, { type: 'cart', x: 13, z: -12, ry: -0.4 }, { type: 'jars', x: -13, z: -16 }],
  origin: [400, 0], ground: 'stone', groundColor: 0x6a665e, bounds: { x0: -18, x1: 18, z0: -46, z1: 18 },
  roads: [{ x: 0, z: -12, w: 11, d: 58, color: 0x5e5a54 }],
  props: [
    { type: 'hanok', x: -11, z: 6, ry: Math.PI / 2, tile: true, scale: 1.4 }, // 우정총국(잔치를 연 곳)
    { type: 'hanok', x: -11, z: -4, ry: Math.PI / 2, tile: true }, // 정변 때 불길이 오르는 이웃 집
    { type: 'hanok', x: 11, z: 4, ry: -Math.PI / 2, tile: true }, { type: 'hanok', x: 11, z: -8, ry: -Math.PI / 2, thatch: true },
    { type: 'hanok', x: -11, z: -15, ry: Math.PI / 2, thatch: true }, { type: 'hanok', x: 11, z: -19, ry: -Math.PI / 2, tile: true },
    // 창덕궁: 문 양옆 궁궐 담, 문 안 마당 끝의 큰 전각
    { type: 'wall', x: -10.5, z: -30, w: 15, h: 2.8, color: 0x8a5a48 }, { type: 'wall', x: 10.5, z: -30, w: 15, h: 2.8, color: 0x8a5a48 },
    { type: 'hanok', x: 0, z: -47, tile: true, scale: 1.8 },
    { type: 'wall', x: -16, z: -38, w: 16, h: 2.8, color: 0x8a5a48, ry: Math.PI / 2 }, { type: 'wall', x: 16, z: -38, w: 16, h: 2.8, color: 0x8a5a48, ry: Math.PI / 2 },
  ],
  names: [{ text: '우정총국', x: -4.6, z: 11.5 }, { text: '창덕궁', x: 4.2, z: -27.2 }], // 장소 이름판(그곳 바로 옆, 길가)
};
// ③ 다시 창덕궁: 남쪽 문으로 들어온 마당, 서쪽 담 틈으로 청 군사가 몰려오고 김옥균은 동쪽 담 틈으로 달아난다
export const PALACE_B = { edge: { style: 'tile', seed: 377 }, center: [{ type: 'jars', x: -13, z: 9 }],
  origin: [400, 0], ground: 'stone', groundColor: 0x8a847a, bounds: { x0: -18, x1: 18, z0: -16, z1: 14 },
  props: [
    { type: 'hanok', x: 0, z: -17, tile: true, scale: 1.8 },
    { type: 'wall', x: -16, z: -9.5, w: 9, h: 2.8, color: 0x8a5a48, ry: Math.PI / 2 }, { type: 'wall', x: -16, z: 8.5, w: 11, h: 2.8, color: 0x8a5a48, ry: Math.PI / 2 }, // 서쪽 담(가운데 틈)
    { type: 'wall', x: 16, z: -9.5, w: 9, h: 2.8, color: 0x8a5a48, ry: Math.PI / 2 }, { type: 'wall', x: 16, z: 8.5, w: 11, h: 2.8, color: 0x8a5a48, ry: Math.PI / 2 }, // 동쪽 담(가운데 틈)
    { type: 'wall', x: -9.5, z: 14.5, w: 13, h: 2.8, color: 0x8a5a48 }, { type: 'wall', x: 9.5, z: 14.5, w: 13, h: 2.8, color: 0x8a5a48 },
  ],
  names: [{ text: '창덕궁', x: 4.2, z: 11.4 }],
};
// ② 한성 곳곳: 큰길 담벼락(서쪽) · 시장 게시판(동쪽) · 우물가 담(북쪽). 「개혁안이 아닌 것」은 처음 자리 옆
const STREETS = { edge: { style: 'street', seed: 134 }, center: [{ type: 'jars', x: 15, z: 9 }, { type: 'cart', x: -15, z: 8, ry: 0.5 }],
  origin: [400, 0], ground: 'earth', groundColor: 0x9a8a70, bounds: { x0: -19, x1: 19, z0: -18, z1: 12 },
  roads: [{ x: 0, z: -2, w: 34, d: 5, kind: 'stone', color: 0xa59c8a }, { x: 0, z: -8, w: 5, d: 18 }],
  props: [
    { type: 'wall', x: -12, z: -9, w: 6, h: 2.3 }, { type: 'hanok', x: -12, z: -13.5, tile: true },
    { type: 'noticeBoard', x: 12, z: -9, n: -1 }, { type: 'stall', x: 16.5, z: -8, color: 0xd8cdb0 }, { type: 'shop', x: 12, z: -14, w: 5, sign: '포목점', awning: 0x8a2f24 },
    { type: 'wall', x: 0, z: -17, w: 6, h: 2.3 }, { type: 'well', x: 4.5, z: -14 },
    { type: 'rice', x: 8, z: 7, n: 3 },
  ],
};
const PLACES = { gate: { x: -12, z: -6, drop: [0, 1.3, -2.57, 0] }, market: { x: 12, z: -6, drop: [0, 1.42, -2.93, 0] }, well: { x: 0, z: -14, drop: [0, 1.3, -2.57, 0] }, no: { x: 7, z: 4 } };

// 김옥균을 따라 걷는 길(무대 기준): path는 김옥균이 걷는 길, stand는 학생이 서는 곳, show는 그곳의 일이 장면으로 나타나는 것
export const WALK_A = [
  { path: [[2, 11], [3, 8.6], [1.6, 6.6]], stand: [0.5, 10], face: -Math.PI / 2, show: st => st.toast() },          // 1 잔치: 관리들이 잔을 들고, 관리가 앞에 나선다
  { path: [[0.5, 5], [2.5, 1]], stand: [0, 3.5], face: Math.PI, show: st => st.uproar() },              // 2 정변: 이웃 집에 불길, 손님들이 놀라 흩어진다
  { path: [[4, -4], [-4, -9], [-4, -15], [4, -19], [2, -24], [0, -26.5]], stand: [0.5, -24], face: Math.PI, show: st => st.openGate() }, // 3 궁으로 가는 길 → 창덕궁 문이 열린다
  { path: [[0, -33], [3.5, -35.5], [2.5, -39], [-2.5, -40]], stand: [0.5, -37.5], face: Math.PI * 0.8, show: st => st.council() }, // 4 전각 앞에 모인 개화 세력, 김옥균이 개혁안 두루마리를 든다
];
export const WALK_B = [
  { path: [[0, 5], [-1, 0], [-2, -4]], stand: [0.5, -2], face: -Math.PI / 2, show: st => st.qingArrive() }, // 1 서쪽에서 청 군사들이 몰려온다
  { ring: [13.5, 0], show: st => st.after() },                                                               // 2 김옥균이 달아난 동쪽 담 틈에서
];

let scene = null;
const wait = (world, sec, f) => new Promise(res => { let t = 0; const off = world.onUpdate(dt => { t = Math.min(sec, t + dt); f?.(t / sec, dt); if (t >= sec) { off(); res(); } }); });
const person = (g, look, x, z, ry = 0) => { const p = makePerson(LOOKS[look]); p.position.set(x, 0, z); p.rotation.y = ry; g.add(p); return p; };

// 청사초롱 등불(밤): 나무 기둥에 매단 붉고 푸른 초롱. 불빛은 스스로 빛나는 재질(빛 계산 없이 가볍다)
function lantern(g, x, z, h = 2.4) {
  const o = new THREE.Group(); o.position.set(x, 0, z); g.add(o);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, h, 6), mat(0x4a3322, 'wood', 'object')); pole.position.y = h / 2; o.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), mat(0x4a3322)); arm.position.set(0.22, h - 0.05, 0); o.add(arm);
  const glow = c => new THREE.MeshBasicMaterial({ color: c });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.22, 10), glow(0xff6a4a)); top.position.set(0.42, h - 0.32, 0); o.add(top);
  const bot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.22, 10), glow(0x5f8adf)); bot.position.set(0.42, h - 0.54, 0); o.add(bot);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffb070, transparent: true, opacity: 0.1, depthWrite: false })); halo.position.set(0.42, h - 0.43, 0); o.add(halo);
  return o;
}
const names = (a, list) => list.forEach(n => nameBoard(a.group, n.text, n.x, n.z));

// 달아나기(D-30 G-04): 몸을 앞으로 숙이고, 걷기보다 두 배 넘게 빠른 걸음으로 팔·다리를 크게 흔들며 to까지 sec초 동안 뛴다.
// 공용 걸음(animateWalk)을 이 장에서 빠르게 돌린다. 끝나면 자세를 되돌린다
export function runAway(world, mesh, to, sec = 2.5, { lean = 0.3 } = {}) {
  const u = mesh.userData, p0 = mesh.position.clone(), order = mesh.rotation.order;
  u.manual = true; mesh.rotation.order = 'YXZ'; // 걷기 자동 움직임에서 잠깐 빼고, 숙임은 몸이 보는 쪽 기준으로
  const ry = Math.atan2(to.x - p0.x, to.z - p0.z);
  return new Promise(res => {
    let t = 0;
    const off = world.onUpdate(dt => {
      t = Math.min(sec, t + dt);
      const k = t / sec, e = k < 0.15 ? (k * k) / 0.3 : k - 0.075; // 첫걸음만 살짝 가속
      const f = Math.min(1, e / 0.925);
      mesh.position.set(p0.x + (to.x - p0.x) * f, p0.y, p0.z + (to.z - p0.z) * f);
      mesh.rotation.y = ry; mesh.rotation.x = lean * Math.min(1, t / 0.25);
      animateWalk(mesh, true, dt * 2.4);
      for (const a of u.arms || []) a.rotation.x *= 1.5;
      for (const l of u.legs || []) l.rotation.x *= 1.25;
      if (t >= sec) {
        off(); mesh.rotation.x = 0; mesh.rotation.order = order; u.manual = false;
        for (const a of u.arms || []) a.rotation.x = 0;
        for (const l of u.legs || []) l.rotation.x = 0;
        res();
      }
    });
  });
}

// 김옥균을 따라 걷는 밤길 하나(stops: WALK_A 또는 WALK_B). 멈춘 곳마다 그때 일이 장면에 나타나고 그 사람의 얼굴을 보며 이야기를 듣는다
async function walkWith(ctx, { arena, stops, lines, stage, start = [0, 15], kimAt = [0, 12.5] }) {
  const { world, dialogue } = ctx;
  const kim = world.npcs.get('kimokgyun'), home = { x: kim.mesh.position.x, z: kim.mesh.position.z, ry: kim.mesh.rotation.y, r: kim.collider.r };
  await ctx.fade?.(true);
  const a = buildArena(world, arena), g = a.group;
  names(a, arena.names || []);
  const k0 = a.at(...kimAt), s0 = a.at(...start);
  world.moveNpc('kimokgyun', k0.x, k0.z, Math.PI);
  placePlayer(world, [s0.x, s0.z]);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.05, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.visible = false; world.level.add(ring);
  const st = stage({ ctx, a, g, kim });
  await ctx.fade?.(false);
  const face = who => { // 말하는 사람이 학생 쪽으로 돌아서서 정면으로(무대 안 사람은 무대 기준 자리라 세계 자리로 바꿔 카메라를 둔다)
    const m = who.getWorldPosition(new THREE.Vector3()), pp = world.player.position;
    who.rotation.y = Math.atan2(pp.x - m.x, pp.z - m.z);
    world.setTalkCamera({ position: m });
  };
  st.face = face;
  try {
    for (const [i, stop] of stops.entries()) {
      ctx.hud.setCounter(`${i + 1}/${stops.length} ${lines[i].label}`);
      if (stop.path) {
        const stand = a.at(...stop.stand);
        await leadWalk(ctx, { id: 'kimokgyun', path: stop.path.map(q => { const w = a.at(...q); return [w.x, w.z]; }), stand: [stand.x, stand.z], ring, face: stop.face, speed: 3.4 });
      } else { // 김옥균 없이 그 자리(ring)까지 걸어간다
        const r = a.at(...stop.ring);
        ring.position.set(r.x, 0.08, r.z); ring.visible = true;
        ctx.input.enabled = true; world.setGoal(r); ctx.testHooks.walkTo = r;
        await new Promise(res => { const off = world.onUpdate(() => { const p = world.player.position; if (Math.hypot(p.x - r.x, p.z - r.z) < 1.6) { off(); res(); } }); });
        ctx.input.enabled = false; ring.visible = false; world.setGoal(null); ctx.testHooks.walkTo = null;
      }
      const speaker = await stop.show(st); // 장면이 말할 사람을 돌려주면 그 사람을, 아니면 김옥균을 본다
      if (speaker !== false) face(speaker || kim.mesh);
      await st.say(lines[i].talk);
      dialogue.close(); world.camMode = 'follow';
      await st.afterTalk?.(i);
      if (lines[i].after) { await sayAll(dialogue, lines[i].after); dialogue.close(); }
    }
  } finally {
    ctx.hud.setCounter(null);
    await ctx.fade?.(true);
    st.dispose?.();
    world.level.remove(ring); a.dispose();
    world.moveNpc('kimokgyun', home.x, home.z, home.ry); kim.collider.r = home.r; kim.mesh.visible = true; kim.mesh.rotation.x = 0;
    setCarry(kim.mesh, null);
    placePlayer(world, base.layout.start);
    world.camMode = 'follow'; world.snapCamera();
    ctx.input.enabled = false;
    await ctx.fade?.(false);
  }
}

// ① 정변의 밤(밤 하늘): 잔치 → 정변 → 창덕궁 → 새 정부와 개혁안
function nightStage({ ctx, a, g, kim }) {
  const { world, dialogue } = ctx;
  for (const [x, z] of [[-4.5, 3], [-4.5, 10], [5, 7], [5, -2], [-5.5, -12], [5.5, -16], [-3.6, -28.6], [3.6, -28.6], [-4, -42], [4, -42]]) lantern(g, x, z);
  // 잔치 자리: 우정총국 앞에 차린 상 두 개, 둘러앉은 관리들, 앞에 나선 우정총국 관리
  for (const z of [4.6, 7.6]) { const d = new THREE.Group(); BUILD.desk(d); d.position.set(-7, 0, z); d.rotation.y = Math.PI / 2; g.add(d); }
  const guests = [[-8.2, 4], [-8.2, 5.2], [-8.2, 7], [-8.2, 8.2], [-5.8, 4.2], [-5.8, 7.2]].map(([x, z], i) => person(g, i % 3 === 2 ? 'scholar' : 'joseonOfficial', x, z, x < -7 ? Math.PI / 2 : -Math.PI / 2));
  const clerk = person(g, 'joseonOfficial', -4.2, 6, Math.PI / 2);
  // 궁으로 가는 길의 군사들, 창덕궁 문짝, 전각 앞에 모인 사람들(처음엔 숨김)
  const guards = [[-3.4, -27.6], [3.4, -27.6]].map(([x, z]) => person(g, 'joseonSoldier', x, z, 0));
  const gate = gateLeaves(g, { x: 0, z: -30, width: 5.4, height: 3, inward: -1, color: 0x7a3a2a });
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.5, 1), mat(0x3d4846, 'tile')); lintel.position.set(0, 3.4, -30); g.add(lintel);
  for (const sx of [-1, 1]) { const col = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 3.2, 8), mat(0x8a2f24)); col.position.set(sx * 2.95, 1.6, -30); g.add(col); }
  const council = [[-4.5, -41], [-5.5, -39], [4.5, -41], [5.5, -39], [-3.5, -43], [3.5, -43]].map(([x, z]) => { const p = person(g, x < 0 ? 'joseonOfficial' : 'scholar', x, z, x < 0 ? Math.PI / 2 : -Math.PI / 2); p.visible = false; return p; });
  const desk = new THREE.Group(); BUILD.desk(desk); desk.position.set(0, 0, -42); g.add(desk);
  const scroll = new THREE.Group();
  { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.6, 10), mat(0xf2ede0)); r.rotation.z = Math.PI / 2; scroll.add(r);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.22), mat(0xa3262a)); scroll.add(band); }
  const fires = [], flee = [];
  const heavy = (world.quality?.particles ?? 0.9) >= 0.9; // 불티 많은 큰 불은 화질 '보통·높음'에서만, '낮음'은 작은 불과 붉은 빛
  return {
    say: lines => sayAll(dialogue, lines),
    toast() { guests.forEach(p => { const u = p.userData; if (u.arms) u.arms[1].rotation.x = -1.3; }); return clerk; },
    async uproar() {
      ctx.audio?.play?.('boom');
      fires.push(burning(world, { parent: g, x: -8.6, y: 0, z: -4, size: heavy ? 1.6 : 0.9, level: 1 }));
      if (heavy) fires.push(burning(world, { parent: g, x: -9.6, y: 2.6, z: -3, size: 1.1, level: 1 }));
      const glow = new THREE.Mesh(new THREE.SphereGeometry(3, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff7a2e, transparent: true, opacity: 0.16, depthWrite: false })); glow.position.set(-9, 1.6, -4); g.add(glow);
      // 잔치 손님들이 놀라 사방으로 흩어진다(달음질)
      const away = [[-16, 14], [-15, 16], [-6, 18], [6, 18], [16, 14], [15, 8]];
      guests.forEach((p, i) => { p.userData.arms && (p.userData.arms[1].rotation.x = 0); flee.push(runAway(world, p, { x: away[i][0], z: away[i][1] }, 2.2 + i * 0.15, { lean: 0.25 }).then(() => { p.visible = false; })); });
      flee.push(runAway(world, clerk, { x: -2, z: 18 }, 2.4, { lean: 0.25 }).then(() => { clerk.visible = false; }));
      // 김옥균이 불길 쪽을 보는 동안 카메라가 불과 흩어지는 사람들을 함께 담는다
      const pp = world.player.position, eye = [pp.x + 4, 3.2, pp.z + 4], look = a.at(-8, 1);
      world.setFixedCamera(eye, [look.x, 1.8, look.z]);
      await wait(world, 3);
    },
    async openGate() { guards.forEach((p, i) => { p.rotation.y = i ? -Math.PI / 2 : Math.PI / 2; }); await wait(world, 1.2, k => gate.setOpen(k)); },
    async council() { council.forEach(p => { p.visible = true; }); setCarry(kim.mesh, scroll, 'side'); },
    dispose() { fires.forEach(f => f.setLevel(0)); setCarry(kim.mesh, null); },
    gate,
  };
}

// ③ 다시 창덕궁: 청 군사들이 서쪽에서 몰려오고, 김옥균이 동쪽 담 틈으로 달아난다 → 그 자리에서 3일 만에 끝남
function palaceStage({ ctx, a, g, kim }) {
  const { world, dialogue } = ctx;
  for (const [x, z] of [[-4, -11], [4, -11], [-4, 11], [4, 11]]) lantern(g, x, z);
  const allies = [[-3, -9], [3, -9], [5, -7]].map(([x, z]) => person(g, 'joseonOfficial', x, z, Math.PI));
  const QING = 15, row = j => Math.floor(j / 5); // 다섯 줄 세 겹, 줄마다 조금씩 엇갈려 몰려온다
  const qing = Array.from({ length: QING }, (_, i) => { const p = makePerson(LOOKS.qingSoldier); p.position.set(-30 - row(i) * 1.5, 0, (i % 5 - 2) * 1.25 + (row(i) % 2) * 0.4); p.rotation.y = Math.PI / 2; p.visible = false; p.userData.manual = true; g.add(p); return p; });
  let step = 0;
  return {
    say: lines => sayAll(dialogue, lines),
    async qingArrive() {
      qing.forEach(p => { p.visible = true; });
      const pp = world.player.position, look = a.at(-12, 0);
      world.setFixedCamera([pp.x + 3, 3.4, pp.z + 5], [look.x, 1.4, look.z]);
      await wait(world, 3.2, (k, dt) => qing.forEach((p, j) => { p.position.x = -30 - row(j) * 1.5 + 19 * k; animateWalk(p, k < 1, dt); }));
      allies.forEach(p => { p.rotation.y = -Math.PI / 2; });
      step = 1;
      return false; // 해설(narr)은 청 군사들을 본 채로
    },
    async afterTalk(i) {
      if (i !== 0 || step !== 1) return;
      this.face(kim.mesh); await sayAll(dialogue, script.night.b[0].then); dialogue.close();
      // 김옥균이 동쪽 담 틈으로 몸을 숙이고 뛰어 멀리 달아난다(같이 있던 관리들도)
      const gap = a.at(16, 0), far = a.at(46, 2);
      const e = a.at(4, 10), l = a.at(9, -2);
      world.setFixedCamera([e.x, 2.6, e.z], [l.x, 1.2, l.z]); // 옆에서: 몸을 숙이고 뛰는 모습이 보이게
      const m = kim.mesh.position;
      allies.forEach((p, j) => runAway(world, p, { x: 36 + j * 3, z: 1 - j }, 2.6 + j * 0.2, { lean: 0.25 }).then(() => { p.visible = false; }));
      await runAway(world, kim.mesh, { x: gap.x, z: gap.z }, Math.hypot(gap.x - m.x, gap.z - m.z) / 8);
      await runAway(world, kim.mesh, far, 3);
      kim.mesh.visible = false;
      world.camMode = 'follow'; world.snapCamera();
    },
    after() { // 김옥균이 사라진 담 틈 너머 골목을 내다본다(해설은 이 장면 위에)
      const pp = world.player.position, far = a.at(40, 1);
      world.setFixedCamera([pp.x + 1, 2.2, pp.z + 1.5], [far.x, 1.4, far.z]); // 학생은 카메라 뒤
      return false;
    },
    dispose() {},
  };
}

export async function nightWalk(ctx) {
  const { world } = ctx;
  await showHowTo(ctx.ui, script.night.howto);
  world.closeView = true;
  const mood = world.moodName;
  world.setMood(NIGHT_MOOD);
  try { await walkWith(ctx, { arena: NIGHT_A, stops: WALK_A, lines: script.night.a, stage: nightStage }); } finally { world.setMood(mood || base.mood); }
}
export async function qingWalk(ctx) {
  ctx.world.closeView = true;
  await walkWith(ctx, { arena: PALACE_B, stops: WALK_B, lines: script.night.b, stage: palaceStage, start: [0, 11], kimAt: [0, 8.5] });
}

// 다음 놀이 앞에서 기다리기(D-30 C-05): 부분 intro 맨 앞의 { meet } 표시에서 김옥균 머리 위에 느낌표를 띄우고, 학생이 말을 걸 때까지 기다린다
const meet = (who, label, lines) => [{ meet: { who, label } }, ...lines];
async function meetPerson(ctx, { who, label }) {
  const { world } = ctx, npc = world.npcs.get(who);
  npc.mark.visible = true;
  await waitInteract(ctx, { pos: npc.mesh.position, label, mark: false });
  npc.mark.visible = false;
  world.setTalkCamera(npc.mesh);
}
// 붙인 개혁안을 종이 두루마리로 본다(D-30 G-03, 근대 1장 조약문과 같은 두루마리)
export function docLine(ctx, { doc }) {
  return showDocument(ctx, { title: doc.title, heading: doc.heading, items: doc.items, src: doc.src, scroll: true, button: '다 읽었어요' });
}

// 다음에 붙일 곳 위의 빛기둥: 지금 든 방이 진짜든 아니든, 아직 비어 있는 다음 자리를 가리킨다(어느 방이 진짜인지는 알려 주지 않는다)
function nextPlaceBeacon(ctx) {
  const { world } = ctx, cards = script.parts.reform.cards;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 7, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
  beam.visible = false; world.level.add(beam);
  const off = world.onUpdate((dt, t) => {
    const held = world.player.children.find(o => o.isSprite && o.userData.text);
    const i = held ? cards.findIndex(c => c.text === held.userData.text) : -1;
    const next = i < 0 ? null : cards.slice(i).find(c => c.bin !== 'no');
    beam.visible = !!next;
    if (next) { const p = PLACES[next.bin]; beam.position.set(400 + p.x, 3.5, p.z - 1.2); beam.material.opacity = 0.18 + Math.sin((t || 0) * 3) * 0.06; }
  });
  return () => { off(); beam.removeFromParent(); };
}
let beaconOff = null;

const reform = script.parts.reform;
const base = makeKitChapter({
  id: 'k2', mood: 'winterDusk', script,
  player: { robe: 0xc9d4d8, hat: 'topknot', trim: 0x3a4a5a, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['merchant', 'clerk', 'kimokgyun'],
  spot: [0, 7.5], // 놀이를 마치면 큰길 어귀에서 북쪽(빛나는 문)을 보고 선다
  layout: {
    // 1884년 한성 종로 근처: 돌을 깐 큰길 양쪽에 기와·초가 가게와 노점, 가운데 우정총국, 멀리 도성 안 기와지붕들과 북쪽 산
    ground: 'earth', groundColor: 0x9e8b6c, bounds: { x0: -15, x1: 15, z0: -7, z1: 11 }, start: [0, 9], hill: 1.3,
    skyline: { style: 'hanok', color: 0x4a4e4c, arc: [Math.PI * 0.55, Math.PI * 1.45] },
    roads: [{ x: 0, z: 2, w: 34, d: 5, kind: 'stone', color: 0xa59c8a }, { x: 0, z: 8, w: 4, d: 16 }],
    props: [
      { type: 'hanok', x: 0, z: -6, tile: true, scale: 1.6, name: 'post' },
      { type: 'flagpole', x: 4, z: -4.5, color: 0xd9a441 },
      { type: 'wall', x: -6.5, z: -8.4, w: 5, h: 2.2, solid: false }, { type: 'wall', x: 6.5, z: -8.4, w: 5, h: 2.2, solid: false },
      { type: 'shop', x: -11.5, z: -4.6, w: 5, awning: 0x8a2f24 }, { type: 'shop', x: 11.5, z: -4.6, w: 5, sign: '지물포', awning: 0x6b5a3a, seed: 3 },
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
    // 길 위 안내판 대신 건물 간판(C-03): 우정총국 처마 아래 「우정총국」, 서쪽 가게 처마 아래 「포목점」. 안내판 대사는 관리·김옥균 대사로 옮겼다
    signs: [{ id: 'signPost', title: '우정총국', x: 0, z: -1.6, plaque: { y: 3.55, back: 1.4 } }, { id: 'signShop', title: '포목점', x: -11.5, z: -1.6, plaque: { y: 2.75, back: 1.2 } }],
    scatter: [{ kind: 'pine', count: 30, area: { x0: -60, x1: 60, z0: -40, z1: -14 }, seed: 211 }],
  },
  parts: [
    { type: 'scene', title: script.night.title, goal: script.goals[2], mood: NIGHT_MOOD, play: ctx => nightWalk(ctx) },
    { ...reform, goal: script.goals[3], arena: STREETS, from: [0, 8], intro: meet('kimokgyun', '김옥균과 이야기하기', reform.intro),
      bins: reform.bins.map(b => ({ ...b, ...PLACES[b.id] })),
      before: ctx => { beaconOff = nextPlaceBeacon(ctx); }, after: () => { beaconOff?.(); beaconOff = null; } },
    { type: 'scene', title: '청의 군대가 몰려와요', goal: script.goals[4], intro: meet('kimokgyun', '김옥균과 이야기하기', script.parts.palace.intro), play: ctx => qingWalk(ctx) },
    { type: 'scene', title: '갑신정변 뒤 한성 거리', play: ctx => qingStreetScene(ctx) }, // 끝 해설 장면(D-58)
  ],
  decorate(world) { // 큰길 어귀 나무 문과 「우정총국 앞 큰길」 이름판(S51). 문짝은 굳히기에 합쳐지지 않게 돌려준다
    const gate = gateLeaves(world.level, { x: 0, z: GATE_Z, width: 4, height: 2.6, inward: -1 });
    nameBoard(world.level, '우정총국 앞 큰길', 3.2, GATE_Z - 1.6);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return { gate };
  },
});

// 장 도입(D-30 C-03): ① 새로 지은 우정총국 앞: 관리들이 나와 서지만 큰길 가게들은 예전 그대로 한산하다(개화 정책의 성과가 뚜렷하지 않음)
// ② 청 군사들이 줄지어 큰길을 지나가고, 거리 사람들이 길가로 비켜선다(청의 간섭). 끝나면 더한 것을 치운다
function introScene(ctx) {
  const { world } = ctx, L = world.level;
  const add = (look, x, z, ry) => { const p = makePerson(LOOKS[look]); p.position.set(x, 0, z); p.rotation.y = ry; L.add(p); return p; };
  const officials = [add('joseonOfficial', -1.6, -2.6, 0), add('joseonOfficial', 1.6, -2.6, 0)];
  const cart = new THREE.Group(); BUILD.cart(cart, {}); cart.position.set(-5.5, 0, -0.6); cart.rotation.y = 0.4; L.add(cart);
  const folk = [add('commoner', -2, 0.1, Math.PI * 0.9), add('peasant', 3, 0.3, Math.PI)];
  const qing = Array.from({ length: 8 }, (_, i) => { const p = add('qingSoldier', 16 + Math.floor(i / 2) * 1.6, i % 2 ? 0.9 : 2.1, -Math.PI / 2); p.visible = false; return p; });
  let off = null;
  const run = fn => { off?.(); let t = 0; off = world.onUpdate(dt => { t += dt; fn(t); }); };
  return {
    shots: [
      { cam: [0.3, 2.4, 5], look: [0, 2.4, -5], to: { cam: [0.2, 2.3, 2.6], look: [0, 2.4, -5] },
        act: () => run(u => { officials.forEach((p, i) => { p.position.z = -2.6 + Math.min(1, u / 2) * 1.6; p.rotation.y = i ? -0.3 : 0.3; }); }) },
      { cam: [-7, 2.3, 6.2], look: [5, 1.5, 1.5], to: { cam: [-7.5, 2.2, 5.6], look: [2, 1.5, 1.5] },
        act: () => {
          qing.forEach(p => { p.visible = true; }); officials.forEach(p => { p.visible = false; });
          const kim = world.npcs.get('kimokgyun'); if (kim) kim.mesh.visible = false; // 큰길가의 김옥균이 행렬을 가리지 않게(끝나면 다시)
          run(u => {
            qing.forEach((p, i) => { p.position.x = 16 + Math.floor(i / 2) * 1.6 - u * 3.4; });
            folk.forEach((p, i) => { p.position.z = (i ? 0.3 : 0.1) - Math.min(1, u / 1.2) * 1.4; p.rotation.y = i ? Math.PI * 0.4 : Math.PI * 0.6; }); // 길가로 비켜서서 청 군사를 본다
          });
        } },
    ],
    done: () => { off?.(); off = null; const kim = world.npcs.get('kimokgyun'); if (kim) kim.mesh.visible = true; for (const o of [...officials, ...folk, ...qing, cart]) o.removeFromParent(); },
  };
}

export const villageTalk = (id, heard) => anyOrderTalk(script, PEOPLE, id, heard);
export const devScene = () => scene; // 개발용(사진 찍기)

export default {
  ...base,
  anyOrder: true, // 거리 사람은 아무 차례로(차례 전 대사 tooEarly가 없다, tests/quest.test.js)
  introScene,
  stories: { qingStreet: qingStreetScene }, // 이야기 장면(D-58)
  portal: { at: [0, 0.5], ry: 0 }, // 미니게임 뒤 빛나는 문(C-02): 돌아온 학생(spot) 바로 앞 큰길 가운데, 앞면은 학생(남쪽) 쪽
  buildScene(world) { scene = base.buildScene(world); return scene; },
  enterStage(ctx, stage) { scene.gate.setOpen(0); ctx.world.closeView = true; base.enterStage(ctx, stage); },
  explore(ctx) { return walkInAndTalk(ctx, script, { people: PEOPLE, final: 'kimokgyun', gate: scene.gate, from: INTRO_FROM, to: base.layout.start }); },
  // 공용 kit 미니게임을 그대로 돌리되, { meet } 줄에서는 김옥균에게 말을 걸 때까지 기다리고(C-05), { doc } 줄에서는 붙인 개혁안을 두루마리로 본다(G-03)
  async minigame(ctx) {
    const d = ctx.dialogue, say = d.say;
    d.say = line => (line && line.meet ? meetPerson(ctx, line.meet) : line && line.doc ? (d.close(), docLine(ctx, line)) : say.call(d, line));
    try { return await base.minigame(ctx); } finally { d.say = say; beaconOff?.(); beaconOff = null; ctx.setGoal(null); } // 퀴즈 목표는 빛나는 문이 대신(C-01)
  },
};
