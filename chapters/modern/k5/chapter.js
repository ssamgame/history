// 근대편 5장 「근대 문물과 달라진 생활」(D-34): 전차가 다니는 1900년 무렵 한성 큰길, 전봇대, 성당과 학교, 양화점.
// 마을 어귀 문으로 들어와 양복 신사·전차 탄 아주머니·학교 앞 학생 이야기를 아무 차례로 듣고(모두 들어야 전차 운전수),
// 운전수에게 가면 학생의 결심 → 해가 지며 전등·가로등이 하나씩 켜지는 밤 장면 →
// ① 근대 문물 가져다 놓기 ② 운전수에게 말을 걸면 전차 몰기 ③ 학생에게 말을 걸면 문물 체험 걷기
// (전신 보내기·전화 걸기·전깃불 켜기·학교 들어가기·양화점, 자리마다 대화 버튼으로 직접 써 본다).
import * as THREE from 'three';
import { makeKitChapter } from '../../kit/chapter.js';
import { buildArena, labelSprite } from '../../kit/play.js';
import { BUILD } from '../../kit/town.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { walkInAndTalk, anyOrderTalk } from '../../kit/talk.js';
import { makePerson, setCarry, mat } from '../../../core/people.js';
import { waitInteract } from '../../../core/portal.js';
import { MOODS } from '../../../core/world.js';
import { LOOKS } from '../../../content/characters.js';
import { placePlayer } from '../../joseon/common.js';
import script from './script.js';

const PEOPLE = ['gentleman', 'woman', 'student'];
const GATE_Z = 14.5, INTRO_FROM = [0, 17.5], SPOT = [0, 7];
const xy = (list, pts) => list.map((it, i) => ({ ...it, ...pts[i] }));
const wait = (world, sec, f) => new Promise(res => { let t = 0; const off = world.onUpdate(dt => { t = Math.min(sec, t + dt); f?.(t / sec, dt); if (t >= sec) { off(); res(); } }); });
const person = (g, look, x, z, ry = 0) => { const p = makePerson(typeof look === 'string' ? LOOKS[look] : look); p.position.set(x, 0, z); p.rotation.y = ry; g.add(p); return p; };
const ease = k => k * k * (3 - 2 * k);
const heavyFx = world => (world.quality?.particles ?? 0.9) >= 0.9; // 점광 같은 무거운 효과는 화질 '보통·높음'에서만

// 밤(가로등이 켜진 거리): 얼굴이 어둠에 묻히지 않게 하늘빛을 조금 남긴다
export const NIGHT_MOOD = 'k5Night';
MOODS[NIGHT_MOOD] ??= {
  skyTop: 0x0c1428, skyHorizon: 0x2e3656, skyBottom: 0x1a1a22,
  fog: [0x22263a, 40, 130],
  sun: { color: 0xb8c4e8, intensity: 0.75, dir: [20, 40, 18] }, // 달빛
  hemi: [0xa8b0d4, 0x4a4238, 0.95],
  particles: null, clouds: 0.12, cloud: 0x4a5070,
};
// 해 질 녘에서 밤으로 천천히 바꾼다(두 분위기의 색을 섞은 임시 분위기를 매 프레임 적용)
const BLEND = 'k5Blend';
function blendMood(a, b, k) {
  const c = (x, y) => new THREE.Color(x).lerp(new THREE.Color(y), k).getHex(), n = (x, y) => x + (y - x) * k;
  return {
    skyTop: c(a.skyTop, b.skyTop), skyHorizon: c(a.skyHorizon, b.skyHorizon), skyBottom: c(a.skyBottom, b.skyBottom),
    fog: [c(a.fog[0], b.fog[0]), n(a.fog[1], b.fog[1]), n(a.fog[2], b.fog[2])],
    sun: { color: c(a.sun.color, b.sun.color), intensity: n(a.sun.intensity, b.sun.intensity), dir: a.sun.dir.map((v, i) => n(v, b.sun.dir[i])) },
    hemi: [c(a.hemi[0], b.hemi[0]), c(a.hemi[1], b.hemi[1]), n(a.hemi[2], b.hemi[2])],
    particles: null, clouds: n(a.clouds ?? 0.5, b.clouds ?? 0.5), cloud: c(a.cloud ?? 0xffffff, b.cloud ?? 0xffffff),
  };
}

// 서양식 건물 앞면 창 자리(chapters/kit/buildings.js western과 같은 셈): 불 켜진 창을 그 위에 겹친다
function frontWindows(cx, cz, { w, d, h }) {
  const floors = Math.max(1, Math.floor(h / 2.4)), cols = Math.max(1, Math.floor((w - 1) / 1.6)), out = [];
  for (let f = 0; f < floors; f++) for (let i = 0; i < cols; i++) {
    const x = -((cols - 1) * 1.6) / 2 + i * 1.6;
    if (!(f === 0 && Math.abs(x) < 0.9)) out.push([cx + x, 1.5 + f * 2.2, cz + d / 2 + 0.085]);
  }
  return out;
}
let litMat = null;
const litWindow = (g, [x, y, z]) => { litMat ||= new THREE.MeshBasicMaterial({ color: 0xffd98a }); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.1), litMat); m.position.set(x, y, z); g.add(m); return m; };
function litLamp(g, x, z, light) {
  const lg = new THREE.Group(); lg.position.set(x, 0, z); BUILD.lamp(lg, { lit: true }); g.add(lg);
  if (light) { const l = new THREE.PointLight(0xffd98a, 6, 11, 1.4); l.position.set(0.42, 2.9, 0); lg.add(l); }
  return lg;
}

// ── 마을 ──
const CHURCH = { x: -9, z: -9, w: 8, d: 6, h: 6 }, SCHOOL = { x: 10, z: -9, w: 9, d: 5, h: 6 };
const LAMPS = [[-8, 3.4], [8, 3.4], [0, -3.4]];

// ── 무대(마을에서 떨어진 x 400) ──
const STALLS = { edge: { style: 'modern', seed: 529 }, center: [{ type: 'lamp', x: -10, z: 6 }, { type: 'lamp', x: 10, z: 6 }, { type: 'cargo', x: 17, z: 8, kind: 'crate', n: 4 }], // 가로등·선로·전신주·전화가 놓인 거리
  origin: [400, 0], ground: 'stone', groundColor: 0x9a948a, bounds: { x0: -20, x1: 20, z0: -14, z1: 14 },
  props: [
    { type: 'flagpole', x: -15, z: -10, color: 0xf2e6b0 }, { type: 'tram', x: -5, z: -9, ry: Math.PI / 2, track: 10 },
    { type: 'poles', x: 3, z: -12, n: 2, gap: 4 }, { type: 'desk', x: 15, z: -10 },
  ],
};
const LINE = { edge: { style: 'modern', seed: 896 }, center: [{ type: 'lamp', x: -6, z: 20 }, { type: 'lamp', x: 6, z: -3 }, { type: 'cargo', x: -6, z: -24, kind: 'crate', n: 3 }], // 서대문(남쪽)에서 청량리(북쪽)로 뻗은 선로
  origin: [400, 0], ground: 'stone', groundColor: 0x9a948a, bounds: { x0: -8, x1: 8, z0: -40, z1: 40 },
  roads: [{ x: 0, z: 0, w: 1.6, d: 80, color: 0x6b6862, y: 0.05 }],
  props: [
    { type: 'western', x: -9, z: 25, w: 5, d: 5, h: 4, color: 0x8a4a3a }, { type: 'hanok', x: 9, z: 12, tile: true }, { type: 'hanok', x: -9, z: -2 },
    { type: 'gate', x: 0, z: -20, label: '興仁之門', wing: 8 }, { type: 'western', x: 10, z: -30, w: 5, d: 5, h: 5, color: 0x9a948a },
    { type: 'poles', x: 6.6, z: -38, n: 13, gap: 6.4, ry: -Math.PI / 2 },
  ],
};
// 문물 체험 걷기: 남쪽에서 들어와 전신국 → 전화 → 성당 → 학교 → 양화점을 한 바퀴 돈다. 가운데 마당은 비워 둔다(학교 교실을 잠깐 세운다)
const M_CHURCH = { x: 5, z: -10, w: 7, d: 5, h: 6 };
export const MUNMUL = { edge: { style: 'modern', seed: 317 },
  origin: [400, 0], ground: 'stone', groundColor: 0x9a948a, bounds: { x0: -17, x1: 17, z0: -14, z1: 14 },
  roads: [{ x: 0, z: 9, w: 4, d: 10, color: 0x8a8070 }],
  props: [
    { type: 'western', x: -13, z: 3, w: 4, d: 5, h: 4, ry: Math.PI / 2, color: 0x8a5a4a },  // 전신국(앞이 동쪽)
    { type: 'desk', x: -8.6, z: 3, ry: Math.PI / 2 },
    { type: 'poles', x: -9.5, z: 0.2, n: 3, gap: 6, ry: Math.PI / 2 },                     // 전신국에서 북쪽으로 뻗은 전깃줄
    { type: 'western', ...M_CHURCH, tower: true, color: 0x8a4a3a },                       // 성당(뾰족탑)
    { type: 'western', x: 13.5, z: 2, w: 6, d: 5, h: 5, ry: -Math.PI / 2, color: 0x9a6a4a }, // 학교(앞이 서쪽)
    { type: 'shop', x: 6, z: 11, w: 5, ry: Math.PI, sign: '양화점', seed: 1, awning: 0x2f6b5e },
    { type: 'lamp', x: -2.5, z: -7 }, { type: 'lamp', x: 11, z: 7 }, { type: 'tree', x: -14, z: 11 }, { type: 'tree', x: 15, z: -11 },
  ],
  from: [0, 12],
  // 걸어가 서는 자리(script.parts.munmul.stations 차례)
  stations: [{ x: -6.8, z: 3 }, { x: -5, z: -4.8 }, { x: 5, z: -5 }, { x: 9, z: 2 }, { x: 6, z: 6.6 }],
  phone: [-5, -7.2], clerk: [-9.7, 3], shopkeeper: [6, 8.7], table: [8.4, 8.1],
};

let scene = null;

// ── 탐험 끝 밤 장면: 해가 지고 하늘이 밤빛으로 바뀌면 가로등이 하나씩 켜지고, 서양식 건물 창에 전깃불이 들어오고, 사람들이 밤길을 다닌다 ──
export async function nightScene(ctx) {
  const { world, dialogue } = ctx;
  const L = script.night.lines, heavy = heavyFx(world);
  ctx.setGoal(script.goals[2]);
  world.closeView = true;
  await ctx.fade?.(true);
  const g = new THREE.Group(); g.name = 'k5Night'; world.level.add(g);
  const dusk = MOODS.sunset, night = MOODS[NIGHT_MOOD];
  world.setMood('sunset');
  placePlayer(world, [-2.5, 7.5], Math.PI - 0.2);
  const wide = () => world.setFixedCamera([-1, 5.4, 13.5], [0, 2.2, -4]);
  const hook = ctx.testHooks.night = { mood: null, lit: 0, windows: 0, walkers: 0, lights: 0 };
  const walkers = [];
  let offWalk = null;
  try {
    wide();
    await ctx.fade?.(false);
    await dialogue.say(L[0]); dialogue.close();
    await wait(world, 2.4, k => { MOODS[BLEND] = blendMood(dusk, night, ease(k)); world.setMood(BLEND); });
    world.setMood(NIGHT_MOOD); hook.mood = world.moodName;
    for (const [i, [x, z]] of LAMPS.entries()) { // 가로등이 하나씩 켜진다(점광은 화질 보통·높음에서 앞의 둘만)
      litLamp(g, x, z, heavy && i < 2); hook.lit += 1; if (heavy && i < 2) hook.lights += 1;
      ctx.audio?.play?.('tap');
      await wait(world, 0.55);
    }
    for (const b of [CHURCH, SCHOOL]) for (const p of frontWindows(b.x, b.z, b)) { litWindow(g, p); hook.windows += 1; }
    // 밤길을 다니는 사람들(큰길 앞쪽을 가로질러 걷는다, 다리는 공용 걷기가 움직인다)
    [['citizen', -15, 2.4, 1], ['schoolgirl', 15, 2.9, -1], ['commoner', -18, 3.3, 1]].forEach(([look, x, z, dir]) => {
      const p = person(g, look, x, z, dir > 0 ? Math.PI / 2 : -Math.PI / 2); p.userData.dir = dir; walkers.push(p);
    });
    hook.walkers = walkers.length;
    offWalk = world.onUpdate(dt => walkers.forEach(p => { p.position.x += p.userData.dir * dt * 1.6; }));
    await dialogue.say(L[1]); dialogue.close();
    const woman = world.npcs.get('woman'), driver = world.npcs.get('driver');
    const talk = async (n, line) => { const m = n.mesh.position, pp = world.player.position; n.mesh.rotation.y = Math.atan2(pp.x - m.x, pp.z - m.z); world.setTalkCamera(n.mesh); await dialogue.say(line); };
    await talk(woman, L[2]);
    await talk(driver, L[3]);
    await dialogue.say(L[4]);
    dialogue.close();
  } finally {
    await ctx.fade?.(true);
    offWalk?.();
    g.removeFromParent();
    world.setMood(base.mood);
    placePlayer(world, SPOT);
    world.camMode = 'follow'; world.snapCamera();
    ctx.input.enabled = false;
    await ctx.fade?.(false);
  }
}

// ── 문물 체험 걷기: 자리마다 대화 버튼으로 직접 써 보는 짧은 장면 ──
function telegraphKey(g, x, z) { // 책상 위 전신 단추(놋쇠 받침과 누르는 막대)
  const k = new THREE.Group(); k.position.set(x, 0.8, z); g.add(k);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.22), mat(0x6b4a32, 'wood', 'object')); base.position.y = 0.03; k.add(base);
  const lever = new THREE.Group(); lever.position.set(-0.1, 0.1, 0); k.add(lever);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.025, 0.04), mat(0xc9a040)); bar.position.x = 0.12; lever.add(bar);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 10), mat(0x1e1c1a)); knob.position.set(0.24, 0.03, 0); lever.add(knob);
  return lever;
}
function spark() {
  const s = new THREE.Group();
  s.add(new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff2a8 })));
  s.add(new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.35, depthWrite: false })));
  return s;
}
function shoeBox() { // 구두 한 켤레가 든 상자
  const b = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.36), mat(0xd8cdb0, 'grain', 'object')); box.position.y = 0.11; b.add(box);
  for (const s of [-1, 1]) { const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.12), mat(0x2a1e18)); shoe.position.set(s * 0.14, 0.27, 0); b.add(shoe); }
  return b;
}
function goodsTable(g, x, z) { // 양화점 앞 진열대: 구두·모자·외국 식료품 병과 깡통
  const t = new THREE.Group(); t.position.set(x, 0, z); g.add(t);
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.8), mat(0x7a5a3c, 'wood', 'object')); top.position.y = 0.85; t.add(top);
  for (const [sx, sz] of [[-0.8, -0.33], [0.8, -0.33], [-0.8, 0.33], [0.8, 0.33]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.85, 0.07), mat(0x5a3f2a, 'wood', 'object')); l.position.set(sx, 0.42, sz); t.add(l); }
  for (const i of [0, 1, 2]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.11), mat(i === 1 ? 0x6b3a22 : 0x2a1e18)); s.position.set(-0.65 + i * 0.3, 0.95, 0.12); t.add(s); }
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 14), mat(0x3a3530)); brim.position.set(0.25, 0.9, -0.1); t.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.14, 12), mat(0x3a3530)); crown.position.set(0.25, 0.98, -0.1); t.add(crown);
  for (const i of [0, 1, 2]) { const j = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8), mat([0x8a2f24, 0x2f6b5e, 0xc9a040][i])); j.position.set(0.55 + i * 0.13, 1.0, 0.12); t.add(j); }
  return t;
}
function classroom(g) { // 학교 교실: 가운데 마당에 잠깐 세운다(앞은 열려 카메라가 들여다본다)
  const c = new THREE.Group(); c.position.set(0, 0, 1); g.add(c);
  const box = (w, h, d, color, x, y, z, kind = 'wood') => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, kind)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; c.add(m); return m; };
  box(10, 0.1, 8, 0x8a6a48, 0, 0.05, 0);
  box(10, 3.6, 0.2, 0xe6dcc3, 0, 1.8, -4, 'stone'); box(0.2, 3.6, 8, 0xe6dcc3, -5, 1.8, 0, 'stone'); box(0.2, 3.6, 8, 0xe6dcc3, 5, 1.8, 0, 'stone');
  box(3.6, 1.4, 0.06, 0x24382e, 0, 2.0, -3.86, 'grain'); // 칠판
  box(1.2, 0.8, 0.6, 0x6b4a32, 0, 0.4, -2.6);           // 선생님 책상
  const teacher = person(c, 'scholarModern', 0.9, -3.1, 0);
  const kids = [];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
    const x = -2.7 + i * 1.8, z = -0.6 + r * 1.9;
    box(1.2, 0.7, 0.5, 0x7a5a3c, x, 0.35, z - 0.55);
    kids.push(person(c, i % 2 ? 'schoolgirl' : 'student', x, z, Math.PI));
  }
  return { group: c, teacher, kids, seat: [2.6, 3.4] };
}

const ACT = {
  async tele({ ctx, a, g, st, say, hook, set }) {
    const { world } = ctx;
    await say(st.lines[0], set.clerk);
    ctx.dialogue.close();
    const W = (x, y, z) => { const p = a.at(x, z); return [p.x, y, p.z]; };
    world.setFixedCamera(W(-3.2, 4.4, 9.4), W(-9.2, 2.8, -1.5)); // 책상 위 전신 단추와 북쪽으로 뻗은 전깃줄이 함께 보이게
    world.player.rotation.y = -Math.PI / 2;
    for (let i = 0; i < 4; i++) { ctx.audio?.play?.('tap'); await wait(world, 0.28, k => { set.key.rotation.z = -0.25 * Math.sin(k * Math.PI); }); }
    const s = spark(); g.add(s);
    const pts = [[-8.35, 1.0, 3.45], [-8.96, 5.7, 0.2], [-8.96, 5.7, -11.8]].map(p => new THREE.Vector3(...p));
    await wait(world, 3.2, k => { const u = k * 2, i = Math.min(1, Math.floor(u)); s.position.lerpVectors(pts[i], pts[i + 1], u - i); });
    hook.signal = true; s.removeFromParent();
    await say(st.lines[1]); await say(st.lines[2]);
  },
  async phone({ ctx, a, st, say, hook, set }) {
    const { world } = ctx;
    const ph = set.phone, P = a.at(...MUNMUL.phone);
    world.player.rotation.y = Math.PI;
    world.setFixedCamera([P.x + 2.4, 2.3, P.z + 3.6], [P.x, 1.5, P.z]);
    ctx.audio?.play?.('tap');
    await wait(world, 1.2, k => { ph.rotation.z = Math.sin(k * 60) * 0.05 * (1 - k); }); // 손잡이를 돌리면 종이 울린다
    ph.rotation.z = 0; hook.rang = true;
    for (const l of st.lines) await say(l);
  },
  async church({ ctx, a, g, st, say, hook }) {
    const { world } = ctx;
    const C = a.at(M_CHURCH.x, M_CHURCH.z);
    world.player.rotation.y = Math.PI;
    world.setFixedCamera([C.x + 1.5, 2.6, C.z + 10.5], [C.x, 3.6, C.z]);
    await wait(world, 0.4);
    for (const p of frontWindows(M_CHURCH.x, M_CHURCH.z, M_CHURCH)) { litWindow(g, p); hook.litWindows += 1; ctx.audio?.play?.('tap'); await wait(world, 0.16); }
    for (const l of st.lines) await say(l);
  },
  async school({ ctx, a, g, st, say, hook }) {
    const { world } = ctx;
    await ctx.fade?.(true);
    const room = classroom(g), O = a.at(0, 0);
    const seat = a.at(room.seat[0], room.seat[1] + 1);
    placePlayer(world, [seat.x, seat.z], Math.PI);
    hook.classroom = room.kids.length;
    world.setFixedCamera([O.x - 1.2, 5.6, O.z + 8], [O.x, 1.3, O.z - 2.6]); // 학생들 머리 너머로 선생님과 칠판이 보이게
    await ctx.fade?.(false);
    await say(st.lines[0], room.teacher);
    world.setFixedCamera([O.x - 1.2, 5.6, O.z + 8], [O.x, 1.3, O.z - 2.6]); // 학생들 머리 너머로 선생님과 칠판이 보이게
    await say(st.lines[1]);
    ctx.dialogue.close();
    await ctx.fade?.(true);
    room.group.removeFromParent();
    const back = a.at(MUNMUL.stations[3].x, MUNMUL.stations[3].z);
    placePlayer(world, [back.x, back.z], -Math.PI / 2);
    await ctx.fade?.(false);
  },
  async shoes({ ctx, a, st, say, hook, set }) {
    const { world } = ctx;
    await say(st.lines[0], set.shopkeeper);
    const box = shoeBox(); setCarry(world.player, box, 'arms'); hook.carried = true; // 받아 든 구두 상자(두 팔로 받친다)
    ctx.audio?.play?.('correct');
    const T = a.at(...MUNMUL.table), pp = world.player.position;
    world.player.rotation.y = 0.35;
    world.setFixedCamera([pp.x - 1.6, 2.4, pp.z - 3.6], [(pp.x + T.x) / 2, 1.2, (pp.z + T.z) / 2]);
    await say(st.lines[1]);
    setCarry(world.player, null);
  },
};

export async function munmulWalk(ctx) {
  const { world, dialogue, hud } = ctx;
  const P = script.parts.munmul, A = MUNMUL, n = P.stations.length;
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  nameBoard(g, '한성 거리', 3, 12.6);
  const key = telegraphKey(g, -8.35, 3.45);
  const clerk = person(g, 'citizen', ...A.clerk, Math.PI / 2);
  const [phx, phz] = A.phone;
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.2, 0.12), mat(0x6b4a32, 'wood', 'object')); post.position.set(phx, 1.1, phz - 0.2); g.add(post);
  const phone = new THREE.Group(); phone.position.set(phx, 1.5, phz); BUILD.telephone(phone); g.add(phone);
  world.addCollider({ ...a.at(phx, phz), r: 0.5 }); // 무대를 치우면 함께 치운다
  const shopkeeper = person(g, 'citizen', ...A.shopkeeper, Math.PI);
  goodsTable(g, ...A.table);
  const marks = P.stations.map((st, i) => {
    const S = A.stations[i];
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(S.x, 0.09, S.z); g.add(ring);
    const lab = labelSprite(st.label, { size: 0.85 }); lab.position.set(S.x, 4.1, S.z); g.add(lab); // 자리 이름은 처음부터 모두 보인다
    return { ring, lab, pos: a.at(S.x, S.z) };
  });
  const p0 = a.at(...A.from); placePlayer(world, [p0.x, p0.z]);
  const hook = ctx.testHooks.munmul = { used: [], pressed: 0, signal: false, rang: false, litWindows: 0, classroom: 0, carried: false };
  const set = { key, clerk, phone, shopkeeper };
  const say = async (line, who = null) => {
    if (who) { const m = who.getWorldPosition(new THREE.Vector3()), pp = world.player.position; who.rotation.y = Math.atan2(pp.x - m.x, pp.z - m.z); world.setTalkCamera({ position: m }); } // 말하는 사람 얼굴을 정면에서
    await dialogue.say(line);
  };
  try {
    await ctx.fade?.(false);
    for (const [i, st] of P.stations.entries()) {
      hud.setCounter(`써 본 문물 ${i}/${n}`);
      marks.forEach((m, j) => { m.ring.visible = j === i; });
      await waitInteract(ctx, { pos: marks[i].pos, label: st.act, mark: true, markY: 3.2 });
      hook.pressed += 1;
      ctx.input.enabled = false;
      marks[i].ring.visible = false;
      marks.forEach(m => { m.lab.visible = false; }); // 장면 동안 이름표는 숨긴다(카메라를 가리지 않게)
      await ACT[st.id]({ ctx, a, g, st, say, hook, set });
      dialogue.close();
      setCarry(world.player, null);
      world.camMode = 'follow';
      marks.forEach(m => { m.lab.visible = true; });
      marks[i].lab.material.opacity = 0.45; // 써 본 곳은 이름표를 흐리게
      hook.used.push(st.id);
    }
    hud.setCounter(`써 본 문물 ${n}/${n}`);
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
  id: 'k5', mood: 'noon', script,
  player: { robe: 0x22262e, hat: 'cap', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['gentleman', 'woman', 'student', 'driver'],
  spot: SPOT, // 놀이를 마치면 큰길 앞에서 북쪽(빛나는 문·전찻길)을 보고 선다
  layout: {
    // 1900년 무렵 한성 큰길: 가운데 전찻길과 전봇대, 길가의 가게와 가로등, 뒤로 뾰족탑 성당과 학교, 멀리 도성의 기와지붕
    ground: 'earth', groundColor: 0x9a8a6a, bounds: { x0: -16, x1: 16, z0: -6, z1: 11 }, start: [0, 9], hill: 1.3,
    skyline: { style: 'hanok', color: 0x4a4e4c, arc: [Math.PI * 0.6, Math.PI * 1.4] },
    roads: [{ x: 0, z: 0, w: 60, d: 6, color: 0x9a8a72 }, { x: 0, z: 7, w: 4, d: 14 }],
    props: [
      { type: 'tram', x: 0, z: 0, ry: Math.PI / 2, track: 60, solid: false, name: 'tram' },
      { type: 'poles', x: -15, z: -3.6, n: 6, gap: 6 },
      { type: 'western', x: CHURCH.x, z: CHURCH.z, w: CHURCH.w, d: CHURCH.d, h: CHURCH.h, tower: true, color: 0x8a4a3a },
      { type: 'western', x: SCHOOL.x, z: SCHOOL.z, w: SCHOOL.w, d: SCHOOL.d, h: SCHOOL.h, color: 0x9a6a4a },
      { type: 'shop', x: -13, z: 8.5, w: 5, ry: Math.PI, sign: '양화점', seed: 1, awning: 0x2f6b5e }, { type: 'shop', x: 13, z: 8.5, w: 5, ry: Math.PI, sign: '잡화점', seed: 4, awning: 0x8a2f24 },
      { type: 'stall', x: -17.5, z: 3.5, ry: Math.PI / 2, seed: 5 },
      ...LAMPS.map(([x, z]) => ({ type: 'lamp', x, z })),
      { type: 'desk', x: 6, z: -5 }, { type: 'tree', x: 17, z: 11 },
      { type: 'wall', x: -8.5, z: GATE_Z, w: 13, h: 1.8, solid: false }, { type: 'wall', x: 8.5, z: GATE_Z, w: 13, h: 1.8, solid: false }, // 마을 어귀 담
    ],
    npcs: [
      { id: 'gentleman', look: 'gentleman', x: -5, z: 5, ry: Math.PI * 0.8 },
      { id: 'woman', look: 'woman', x: 6, z: 4.5, ry: -Math.PI * 0.7 },
      { id: 'student', look: 'student', x: 8, z: -2.5, ry: 0 },
      { id: 'driver', look: 'teacherUniform', x: -11, z: 3.2, ry: Math.PI * 0.75 },
    ],
    // 길 위 안내판 대신 건물 간판(C-03): 뾰족탑 건물 「성당」, 오른쪽 서양식 건물 「학교」. 안내판 글(전차·서양식 건물·달라진 생활)은 사람 대사로 옮겼다
    signs: [{ id: 'signChurch', title: '성당', x: CHURCH.x, z: CHURCH.z + CHURCH.d / 2 + 0.5, ry: 0, plaque: { y: 5.25, back: 0.42 } },
      { id: 'signSchool', title: '학교', x: SCHOOL.x + 1.6, z: SCHOOL.z + SCHOOL.d / 2 + 0.5, ry: 0, plaque: { y: 5.25, back: 0.42 } }],
  },
  parts: [
    { ...script.parts.match, goal: script.goals[3], arena: STALLS, from: [0, 11], bins: xy(script.parts.match.bins, [{ x: -14, z: -4 }, { x: -5, z: -3 }, { x: 4, z: -5 }, { x: 14, z: -4 }]) },
    { ...script.parts.tram, goal: script.goals[4], intro: meet('driver', '전차 운전수와 이야기하기', script.parts.tram.intro), arena: LINE, from: [0, 37],
      route: xy(script.parts.tram.route, [{ x: 0, z: 30 }, { x: 0, z: 8 }, { x: 0, z: -14 }, { x: 0, z: -35 }]),
      hazards: [{ x: -7, z: 19, to: [7, 19], kind: 'cart', r: 1.4, speed: 0.6 }, { x: 7, z: -3, to: [-7, -3], kind: 'cart', r: 1.4, speed: 0.7 }, { x: -7, z: -25, to: [7, -25], kind: 'cart', r: 1.4, speed: 0.65 }] },
    { ...script.parts.munmul, goal: script.goals[5], intro: meet('student', '학생과 이야기하기', script.parts.munmul.intro), play: ctx => munmulWalk(ctx) },
  ],
  // 전차가 선로 위를 천천히 오간다. 마을 어귀 나무 문과 「한성」 이름판(S51)은 굳히기에 합쳐지지 않게 돌려준다
  decorate(world, built) {
    const car = built.named.tram && built.named.tram.userData.car;
    if (car) world.onUpdate((dt, t) => { car.position.z = Math.sin(t * 0.15) * 22; });
    const gate = gateLeaves(world.level, { x: 0, z: GATE_Z, width: 4, height: 2.6, inward: -1 });
    const board = nameBoard(world.level, '한성', 3.2, GATE_Z - 1.6);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return { gate, board };
  },
});

// 장 도입(C-03): ① 일꾼들이 큰길가에 새 전봇대를 세운다(정부가 근대 시설을 마련) ② 양복 신사·학생·아낙이 전찻길 옆 큰길을 오가고 전차가 지나간다. 끝나면 더한 것을 치운다
function introScene(ctx) {
  const { world } = ctx, L = world.level;
  const pole = new THREE.Group(); pole.position.set(3.5, 0, 6.6); L.add(pole);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 6, 6), mat(0x5a3f2a, 'wood', 'object')); shaft.position.y = 3; pole.add(shaft);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.12), mat(0x5a3f2a, 'wood', 'object')); arm.position.y = 5.6; pole.add(arm);
  pole.rotation.z = Math.PI / 2 - 0.15;
  const workers = [[2.2, 7.4, Math.PI / 2], [4.9, 7.5, -Math.PI / 2]].map(([x, z, ry]) => person(L, 'worker', x, z, ry));
  const walkers = [['gentleman', -13, 2.6, 1], ['student', -15.5, 3.1, 1], ['woman', 13, 2.9, -1]].map(([look, x, z, dir]) => { const p = person(L, look, x, z, dir > 0 ? Math.PI / 2 : -Math.PI / 2); p.visible = false; p.userData.dir = dir; return p; });
  let off = null;
  const run = fn => { off?.(); let t = 0; off = world.onUpdate(dt => { t += dt; fn(t, dt); }); };
  const hide = on => { for (const id of ['gentleman', 'woman', 'student', 'driver']) { const n = world.npcs.get(id); if (n) n.mesh.visible = on; } };
  return {
    shots: [
      { cam: [7.5, 2.4, 11.5], look: [2.5, 2.2, 4], to: { cam: [6.6, 2.6, 10.6], look: [2.5, 2.6, 4] },
        act: () => { hide(false); run(u => { pole.rotation.z = (Math.PI / 2 - 0.15) * (1 - ease(Math.min(1, u / 3.2))); }); } }, // 일꾼들이 전봇대를 일으켜 세운다
      { cam: [-3, 2.3, 8.5], look: [0, 1.6, 1.5], to: { cam: [-1.5, 2.3, 8], look: [1.5, 1.6, 1.5] },
        act: () => { pole.rotation.z = 0; walkers.forEach(p => { p.visible = true; }); run((u, dt) => walkers.forEach(p => { p.position.x += p.userData.dir * dt * 1.5; })); } }, // 새 옷차림의 사람들이 전찻길 옆을 오간다
    ],
    done: () => { off?.(); off = null; hide(true); for (const o of [pole, ...workers, ...walkers]) o.removeFromParent(); },
  };
}

export const villageTalk = (id, heard) => anyOrderTalk(script, PEOPLE, id, heard);
export const devScene = () => scene; // 개발용(사진 찍기)

export default {
  ...base,
  anyOrder: true, // 거리 사람은 아무 차례로(차례 전 대사 tooEarly가 없다, tests/quest.test.js)
  introScene,
  portal: { at: [0, 3.6], ry: 0 }, // 미니게임 뒤 빛나는 문(C-02): 돌아온 학생(SPOT) 바로 앞 큰길가, 앞면은 학생(남쪽) 쪽
  buildScene(world) { scene = base.buildScene(world); return scene; },
  enterStage(ctx, stage) { scene.gate.setOpen(0); ctx.world.closeView = true; base.enterStage(ctx, stage); },
  // 모두 들은 뒤 전차 운전수에게 가면 학생의 결심 → 해가 지며 가로등이 켜지는 밤 장면
  async explore(ctx) {
    await walkInAndTalk(ctx, script, { people: PEOPLE, final: 'driver', gate: scene.gate, from: INTRO_FROM, to: base.layout.start });
    await nightScene(ctx);
  },
  // 공용 kit 미니게임을 그대로 돌리되, { meet } 줄에서는 그 사람에게 말을 걸 때까지 기다린다(C-05)
  async minigame(ctx) {
    const d = ctx.dialogue, say = d.say;
    d.say = line => (line && line.meet ? meetPerson(ctx, line.meet) : say.call(d, line));
    try { return await base.minigame(ctx); } finally { d.say = say; ctx.setGoal(null); } // 퀴즈 목표는 빛나는 문이 대신(C-01)
  },
};
