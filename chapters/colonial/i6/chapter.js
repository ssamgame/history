// 일제 강점기편 6장 「한인 애국단과 한국광복군」(D-46): 1940년대 중국 충칭의 한국광복군 훈련장.
// 「한국광복군 훈련장」 문으로 들어와 광복군 대원·광복군 지휘관·임시 정부 요원 이야기를 아무 차례로 듣고(모두 들어야 김구),
// 김구에게 가면 학생의 결심 → 대원들이 탁자 위 태극기 여백에 이름과 각오를 적고 들어 펼쳐 만세 →
// ① 풀밭에 엎드려 움직이는 과녁 쏘기 ② 김구에게 말을 걸면 한인 애국단에서 한국광복군까지 걷기.
import * as THREE from 'three';
import { makeKitChapter } from '../../kit/chapter.js';
import { buildArena } from '../../kit/play.js';
import { taegukgiTexture } from '../../kit/town.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { walkInAndTalk, anyOrderTalk } from '../../kit/talk.js';
import { wait, person, ease, face, stationMarks, walkStations, sayer, meet, minigameWithMeet, facingShare } from '../../kit/walk.js';
import { mat } from '../../../core/people.js';
import { LOOKS } from '../../../content/characters.js';
import { placePlayer } from '../../joseon/common.js';
import script from './script.js';

const PEOPLE = ['soldier', 'officer', 'staff'];
const GATE_Z = 14.5, INTRO_FROM = [0, 17.5], SPOT = [0, 7];
const YOUTH = { ...LOOKS.gentleman, hat: null, face: { ...LOOKS.gentleman.face, beard: null } }; // 한인 애국단의 젊은이(양복)
const USARMY = { ...LOOKS.unSoldier, robe: 0x7a7458, trim: 0x4a4636 }; // 함께 계획을 세운 미군
const AIM = (x, z) => ({ x, z, ry: Math.atan2(-x, -2 - z), look: 'gwangbokgun', band: false }); // 사격장 앞쪽(과녁 길)을 겨눈다
const SHOOTERS = [AIM(-6, 8.4), AIM(-3.6, 9.2), AIM(3.6, 9.2), AIM(6, 8.4)]; // 가운데는 비워 과녁 길이 보이게
// 만세: 두 팔을 앞으로 번쩍 들었다 내린다(k 0~1, 팔은 앞으로 rotation.x 음수, D-45)
const cheerPose = (p, k) => { const a = p.userData.arms; if (!a) return; const u = Math.sin(k * Math.PI); a[1].rotation.x = -Math.PI * 0.95 * u; a[0].rotation.x = -Math.PI * 0.95 * u; };
const blk = (g, w, h, d, color, x, y, z, kind = 'wood') => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, kind)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
// 흰 연기(폭탄이 터진 자리). 커지며 옅어지다 사라진다
function puff(world, g, x, y, z) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), new THREE.MeshBasicMaterial({ color: 0xe8e4da, transparent: true, opacity: 0.7, depthWrite: false }));
  m.position.set(x, y, z); g.add(m);
  return wait(world, 1.6, k => { m.scale.setScalar(1 + k * 2); m.position.y = y + k; m.material.opacity = 0.7 * (1 - k); }).then(() => m.removeFromParent());
}
// 던진 것이 둥글게 날아간다(검은 작은 공)
async function toss(world, g, from, to) {
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshLambertMaterial({ color: 0x2b2826 })); g.add(b);
  await wait(world, 0.7, k => b.position.set(from[0] + (to[0] - from[0]) * k, 1.6 + Math.sin(k * Math.PI) * 2.2 + (to[1] - 1.6) * k, from[2] + (to[2] - from[2]) * k));
  b.removeFromParent();
}
const fall = (world, people, side = 1) => wait(world, 0.7, k => people.forEach((p, i) => { const u = Math.min(1, Math.max(0, k * 1.5 - i * 0.15)); p.rotation.z = (i % 2 ? side : -side) * Math.PI / 2 * u * u; })); // 옆으로 쓰러진다(피는 없다, D-45)

// ── 무대(마을에서 떨어진 x 400) ──
// 사격장: 앞쪽(-z)으로 과녁 길 두 줄, 엎드린 대원들 뒤 낮은 곳에서 본다
const RANGE = { edge: { style: 'camp', seed: 216 }, center: [{ type: 'sandbags', x: -14, z: 6, w: 4 }, { type: 'rifles', x: 14, z: 6 }, { type: 'sandbags', x: 14, z: 14, w: 4 }, { type: 'cargo', x: -15, z: 15, kind: 'crate', n: 3 }],
  origin: [400, 0], ground: 'earth', groundColor: 0x8a7a5a, bounds: { x0: -26, x1: 26, z0: -22, z1: 22 },
  roads: [{ x: 0, z: 0, w: 52, d: 3, color: 0x7a6a50 }, { x: 0, z: -4.5, w: 52, d: 3, color: 0x7a6a50 }],
  props: [
    { type: 'wall', x: 0, z: -9, w: 30, h: 2.2, color: 0xa08a62 }, // 과녁 뒤 흙둑
    { type: 'tent', x: -15, z: 18, color: 0x6b6a4a }, { type: 'tent', x: 15, z: 18, color: 0x6b6a4a },
    { type: 'flagpole', x: -18, z: -15 }, { type: 'flagpole', x: 18, z: -15 },
  ],
};
// 태극기에 각오 적기(탐험 끝 장면): 훈련장 막사 앞 탁자
export const FLAGROOM = { edge: { style: 'camp', seed: 787 },
  origin: [400, 0], ground: 'earth', groundColor: 0x9a8a6a, bounds: { x0: -14, x1: 14, z0: -14, z1: 12 },
  props: [{ type: 'barracks', x: 0, z: -10, w: 10, color: 0x7a6a52 }, { type: 'flagpole', x: -6, z: -6 }, { type: 'flagpole', x: 6, z: -6 }, { type: 'tent', x: -10, z: 4, color: 0x6b6a4a }, { type: 'tent', x: 10, z: 4, color: 0x6b6a4a }],
};
// 한인 애국단에서 한국광복군까지: 남쪽에서 북쪽으로 곧은 길. 한인 애국단(상하이) → 도쿄 → 훙커우 공원 → 충칭
export const ROAD = { edge: { style: 'modern', seed: 466 },
  origin: [400, 0], ground: 'stone', groundColor: 0x9a948a, bounds: { x0: -18, x1: 18, z0: -36, z1: 32 },
  roads: [{ x: 0, z: -2, w: 4, d: 68, color: 0x8a8070 }, { x: 0, z: 3.5, w: 36, d: 3.4, color: 0x8a8070 }],
  props: [
    { type: 'lanehouse', x: -11, z: 21, n: 2, ry: Math.PI / 2 }, { type: 'flagpole', x: -6, z: 17 }, // 상하이 골목
    { type: 'western', x: -11, z: 9, w: 6, d: 4, h: 5, color: 0x8a5a4a, ry: Math.PI / 2 }, { type: 'western', x: 11, z: 9, w: 6, d: 4, h: 5, color: 0xb8a070, ry: -Math.PI / 2 }, { type: 'lamp', x: -4, z: 6 }, { type: 'lamp', x: 4, z: 1 }, // 도쿄 거리
    { type: 'stage', x: 8, z: -12 }, { type: 'tree', x: 13, z: -6, kind: 'willow' }, { type: 'tree', x: -10, z: -14, kind: 'willow' }, // 훙커우 공원 행사장
    { type: 'tent', x: -9, z: -28, color: 0x6b6a4a }, { type: 'tent', x: 10, z: -31, color: 0x6b6a4a }, { type: 'flagpole', x: -3.5, z: -33 }, // 충칭
  ],
  from: [0, 29], carriage: [[-16, 3.5], [16, 3.5]], thrower: [-5, 6.2], stage: [8, -12], yun: [4.6, -8.4], desk: [6, -25],
  stations: [{ x: -3, z: 19.5 }, { x: 4.6, z: 7.8 }, { x: -3, z: -9.6 }, { x: 6, z: -21.6 }],
};

// 서명이 늘어나는 태극기 그림(가운데 태극기, 둘레 흰 여백에 붓글씨)
function signedFlag() {
  const cv = document.createElement('canvas'); cv.width = 384; cv.height = 280; const c = cv.getContext('2d');
  c.fillStyle = '#f7f4ec'; c.fillRect(0, 0, 384, 280);
  c.drawImage(taegukgiTexture().image, 96, 70, 192, 128);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  // 여백 자리(위·아래·왼쪽·오른쪽)를 돌아가며 세로 붓글씨 한 줄씩
  const slots = []; for (let i = 0; i < 6; i++) slots.push([24 + i * 62, 8], [24 + i * 62, 210]); for (let j = 0; j < 2; j++) slots.push([14 + j * 34, 74], [314 + j * 34, 74]);
  let n = 0, r = 7;
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const sign = () => {
    const [x0, y0] = slots[n % slots.length]; n += 1;
    c.strokeStyle = '#1e1c1a'; c.lineWidth = 3; c.lineCap = 'round';
    for (let k = 0; k < 4; k++) { // 글자 넷
      const y = y0 + k * 15, x = x0 + rnd() * 4;
      c.beginPath(); c.moveTo(x, y + 2); c.lineTo(x + 10, y + 2 + rnd() * 3); c.moveTo(x + 4, y); c.lineTo(x + 3, y + 12); c.moveTo(x + 9, y + 4); c.lineTo(x + 12, y + 11); c.stroke();
    }
    tex.needsUpdate = true;
  };
  return { tex, sign, get count() { return n; } };
}

// ── 탐험 끝 장면: 대원들이 탁자 위 태극기 여백에 이름과 각오를 적고, 들어 펼쳐 만세 ──
export async function flagScene(ctx) {
  const { world, dialogue } = ctx;
  const L = script.flag.lines, A = FLAGROOM, say = sayer(ctx);
  ctx.setGoal(script.goals[2]);
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  const hook = ctx.testHooks.flag = { signers: 0, written: 0, lifted: false, cheers: 0, facing: 0 };
  // 탁자와 그 위에 펼친 커다란 태극기
  blk(g, 4, 0.12, 2.6, 0x7a5a3c, 0, 0.84, 0);
  for (const [lx, lz] of [[-1.8, -1.1], [1.8, -1.1], [-1.8, 1.1], [1.8, 1.1]]) blk(g, 0.12, 0.8, 0.12, 0x5e432c, lx, 0.4, lz);
  const F = signedFlag();
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 2.4), new THREE.MeshLambertMaterial({ map: F.tex, side: THREE.DoubleSide }));
  flag.rotation.x = -Math.PI / 2; flag.position.set(0, 0.92, 0); g.add(flag);
  // 탁자 건너편과 양옆에 둘러선 대원들(모두 탁자와 카메라 쪽을 본다)
  const spots = [[-1.5, -1.9], [-0.5, -2.0], [0.5, -2.0], [1.5, -1.9], [-2.6, -0.8], [-2.7, 0.4], [2.6, -0.8], [2.7, 0.4]];
  const team = spots.map(([x, z]) => { const p = person(g, 'gwangbokgun', x, z, 0); face(p, x * 0.3, 3); return p; });
  hook.signers = team.length;
  const kim = person(g, 'kimgu', -3.3, 1.4, Math.PI * 0.6);
  const P0 = a.at(3.6, 0.6), C = a.at(0.2, 6.2), T = a.at(0, -1.2);
  placePlayer(world, [P0.x, P0.z], -Math.PI / 2); // 학생은 탁자 오른쪽 끝(카메라를 가리지 않게)
  const view = () => world.setFixedCamera([C.x, 4.4, C.z], [T.x, 1.0, T.z]); // 탁자 앞(남쪽) 높은 곳에서 대원들을 마주 본다
  const C2 = a.at(0.2, 8.6), T2 = a.at(0, -2);
  const wide = () => world.setFixedCamera([C2.x, 2.4, C2.z], [T2.x, 2.0, T2.z]); // 펼친 태극기와 대원들의 얼굴이 함께 보이게 조금 물러나 낮게
  const write = async (p, arm = p.userData.arms?.[1]) => { // 몸을 숙이고 붓을 움직이면 여백에 이름이 하나 늘어난다
    await wait(world, 0.55, k => { p.rotation.x = 0.25 * Math.sin(k * Math.PI); if (arm) arm.rotation.x = -0.9 - 0.25 * Math.sin(k * Math.PI * 4); });
    if (arm) arm.rotation.x = 0;
    F.sign(); hook.written = F.count; ctx.audio?.play?.('tap');
  };
  try {
    view();
    await ctx.fade?.(false);
    await dialogue.say(L[0]);
    dialogue.close();
    const signing = (async () => { for (const p of team) await write(p); })();
    await dialogue.say(L[1]);
    await signing;
    dialogue.close();
    await say(L[2], team[1]);
    dialogue.close();
    view();
    await write(world.player); // 학생도 적는다
    await dialogue.say(L[3]);
    await say(L[4], kim);
    dialogue.close();
    // 두 대원이 태극기를 들어 사람들 뒤에 세워 펼친다
    const holders = [team[0], team[3]], h0 = holders.map(p => p.position.clone());
    const hTo = [new THREE.Vector3(-1.75, 0, -3.1), new THREE.Vector3(1.75, 0, -3.1)];
    wide();
    await wait(world, 1.6, k => {
      const e = ease(k);
      flag.position.set(0, 0.92 + (3.25 - 0.92) * e, -3.2 * e); flag.rotation.x = -Math.PI / 2 * (1 - e); // 머리 위로 높이 들어 사람들 뒤에 펼친다
      holders.forEach((p, i) => { p.position.lerpVectors(h0[i], hTo[i], e); const ar = p.userData.arms; if (ar) { ar[0].rotation.x = -Math.PI * 0.95 * e; ar[1].rotation.x = -Math.PI * 0.95 * e; } });
    });
    hook.lifted = flag.position.y > 3 && Math.abs(flag.rotation.x) < 0.1;
    const cheer = team.filter(p => !holders.includes(p));
    const cw = C2.x - a.at(0, 0).x, cz = C2.z - a.at(0, 0).z;
    team.forEach(p => face(p, cw, cz)); // 모두 카메라 쪽을 본다(D-45)
    hook.facing = facingShare(world, team);
    for (let n = 0; n < 3; n++) {
      ctx.audio?.play?.('correct');
      await wait(world, 0.9, k => cheer.forEach((p, i) => cheerPose(p, Math.min(1, Math.max(0, k * 1.15 - (i % 3) * 0.05)))));
      hook.cheers += 1;
      if (n === 0) { await dialogue.say(L[5]); dialogue.close(); wide(); }
    }
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

// ── 한인 애국단에서 한국광복군까지 걷기 ──
const ACT = {
  async aegukdan({ st, say, set }) { // 김구 곁에 한인 애국단의 젊은이들
    await say(st.lines[0], set.kim);
    await say(st.lines[1], set.kim);
  },
  async tokyo({ ctx, a, g, st, hook, set }) { // 일본 왕이 탄 마차가 지나가고, 이봉창이 폭탄을 던진다
    const { world, dialogue } = ctx;
    const [[ax, az], [bx, bz]] = ROAD.carriage, M = a.at(0, 3.5);
    world.setFixedCamera([M.x + 8, 3.8, M.z], [M.x - 3, 1, M.z + 1]); // 길 동쪽 끝에서 길을 따라 다가오는 마차와 길가의 이봉창을 본다
    set.carriage.visible = true; hook.carriage = true;
    await wait(world, 2.4, k => set.carriage.position.set(ax + (bx - ax) * 0.5 * k, 0, az)); // 마차가 길 가운데로 온다
    const c = set.carriage.position, [tx, tz] = ROAD.thrower;
    face(set.lee, c.x, c.z);
    await toss(world, g, [tx, 0, tz], [c.x, 1.2, c.z]);
    ctx.audio?.play?.('shot');
    puff(world, g, c.x, 1.2, c.z);
    set.guards.forEach(p => face(p, tx, tz));
    await dialogue.say(st.lines[0]);
    await dialogue.say(st.lines[1]);
    set.carriage.visible = false; // 다음 자리 장면을 가리지 않게
  },
  async hongkou({ ctx, a, g, st, say, hook, set }) { // 일본군 행사장 단상에 폭탄이 떨어지고 단상의 일본군이 쓰러진다
    const { world, dialogue } = ctx;
    const S = a.at(...ROAD.stage);
    world.setFixedCamera([S.x - 9.5, 4.2, S.z + 8], [S.x - 1, 1.4, S.z]); // 행사장 남서쪽에서 단상과 윤봉길을 함께 본다
    hook.stage = true;
    const [yx, yz] = ROAD.yun, [sx, sz] = ROAD.stage;
    face(set.yun, sx, sz);
    await wait(world, 0.8);
    await toss(world, g, [yx, 0, yz], [sx, 1.4, sz]);
    ctx.audio?.play?.('shot');
    puff(world, g, sx, 1.6, sz);
    await fall(world, set.onStage);
    hook.fallen = set.onStage.length;
    await dialogue.say(st.lines[0]);
    dialogue.close();
    await say(st.lines[1], set.kim2);
  },
  async chongqing({ ctx, a, st, say, hook, set }) { // 지도를 펼친 책상 둘레에 광복군과 미군
    const { world, dialogue } = ctx;
    hook.allies = set.allies.length;
    await say(st.lines[0], set.officer);
    await say(st.lines[1], set.officer);
    dialogue.close();
    const D = a.at(...ROAD.desk);
    world.setFixedCamera([D.x + 1.2, 3.2, D.z + 6], [D.x, 1.2, D.z - 0.8]);
    await dialogue.say(st.lines[2]);
  },
};

export async function roadWalk(ctx) {
  const { world, hud } = ctx;
  const P = script.parts.road, A = ROAD;
  world.closeView = true;
  await ctx.fade?.(true);
  const a = buildArena(world, A), g = a.group;
  const hook = ctx.testHooks.road = { used: [], pressed: 0, carriage: false, stage: false, fallen: 0, allies: 0 };
  // 한인 애국단: 김구와 젊은이 둘
  const kim = person(g, 'kimgu', -6.2, 20.2, Math.PI / 2);
  [[-6.6, 18.6], [-5.6, 21.8]].forEach(([x, z]) => person(g, YOUTH, x, z, Math.PI / 2));
  // 도쿄: 마차(검은 칸을 얹은 수레), 길가의 경찰, 이봉창
  const carriage = new THREE.Group(); g.add(carriage); carriage.visible = false;
  blk(carriage, 1.6, 0.14, 2.6, 0x2b2826, 0, 0.8, 0); blk(carriage, 1.5, 1.2, 1.6, 0x1e1c1a, 0, 1.5, -0.2);
  for (const sx of [-1, 1]) for (const sz of [-0.8, 0.8]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.06, 6, 14), mat(0x3a2c20, 'wood')); w.position.set(sx * 0.85, 0.42, sz); w.rotation.y = Math.PI / 2; carriage.add(w); }
  carriage.rotation.y = Math.PI / 2; carriage.position.set(A.carriage[0][0], 0, A.carriage[0][1]);
  const guards = [[-8, 1.4], [-1.5, 0.8], [-8.5, 6.4]].map(([x, z]) => person(g, 'gendarme', x, z, 0));
  const lee = person(g, YOUTH, ...A.thrower, Math.PI);
  // 훙커우 공원: 단상 위 일본군, 둘레의 사람들, 윤봉길. 의거 뒤 김구가 말한다
  const [sx, sz] = A.stage;
  const onStage = [-1.5, -0.5, 0.5, 1.5].map(dx => { const p = person(g, 'gendarme', sx + dx, sz - 0.4, 0); p.position.y = 0.8; return p; });
  [[3.6, -11], [3.4, -12.4], [12.4, -11], [12.6, -12.4]].forEach(([x, z]) => { const p = person(g, 'gendarme', x, z, 0); face(p, sx, sz); }); // 단상 양옆에 선 일본군
  const yun = person(g, YOUTH, ...A.yun, Math.PI);
  const kim2 = person(g, 'kimgu', -4.8, -12, Math.PI / 2);
  // 충칭: 지도를 펼친 책상 둘레의 광복군과 미군
  const [dx, dz] = A.desk;
  blk(g, 2.4, 0.1, 1.4, 0x6b4a32, dx, 0.82, dz); blk(g, 2, 0.02, 1.1, 0xe6dcc3, dx, 0.88, dz, 'cloth'); // 지도
  const officer = person(g, 'gwangbokgun', dx - 1.7, dz - 1.1, 0); // 모두 책상 북쪽에 서서 남쪽(학생·카메라)을 본다
  const allies = [officer, person(g, 'gwangbokgun', dx - 0.6, dz - 1.3, 0), person(g, USARMY, dx + 0.6, dz - 1.3, 0), person(g, USARMY, dx + 1.7, dz - 1.1, 0)];
  const marks = stationMarks(a, g, P.stations, A.stations);
  const p0 = a.at(...A.from); placePlayer(world, [p0.x, p0.z], Math.PI);
  const set = { kim, carriage, guards, lee, onStage, yun, kim2, officer, allies };
  const say = sayer(ctx);
  try {
    await ctx.fade?.(false);
    await walkStations(ctx, {
      stations: P.stations, marks, counter: '돌아본 곳',
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
  id: 'i6', mood: 'haze', script,
  player: { robe: 0x6b6a4a, hat: 'cap', gear: 'rifle', trim: 0xa8392b, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } },
  order: ['soldier', 'officer', 'staff', 'kimgu'],
  spot: SPOT, // 놀이를 마치면 훈련장 문 앞에서 북쪽(빛나는 문)을 보고 선다
  layout: {
    // 1940년대 중국 충칭의 훈련장: 언덕이 많은 땅, 흙 연병장에 줄지어 선 대원들과 태극기, 나무 막사와 천막, 장작
    ground: 'earth', groundColor: 0x9a8a6a, bounds: { x0: -16, x1: 16, z0: -8, z1: 11 }, start: [0, 9], hill: 1.9,
    props: [
      { type: 'flagpole', x: 0, z: -7 }, { type: 'flagpole', x: -5, z: -7 }, { type: 'flagpole', x: 5, z: -7 },
      { type: 'crowd', x: -8, z: -3, n: 10, cols: 5, looks: ['gwangbokgun'], face: 0 },
      { type: 'crowd', x: 8, z: -3, n: 10, cols: 5, looks: ['gwangbokgun'], face: 0 },
      { type: 'tent', x: -13, z: 8, color: 0x8a8a6a }, { type: 'tent', x: 13, z: 8, color: 0x8a8a6a }, { type: 'tent', x: -13.5, z: 1, color: 0x8a8a6a },
      { type: 'barracks', x: 11, z: -11, w: 9 }, { type: 'barracks', x: -11, z: -11, w: 9, color: 0x7a6a52 },
      { type: 'woodpile', x: 16, z: 2 }, { type: 'tree', x: -17.5, z: -4 }, { type: 'tree', x: 17.5, z: -6, color: 0x5a7a40 },
      { type: 'wall', x: -8.5, z: GATE_Z, w: 13, h: 1.8, color: 0x8a6a48, solid: false }, { type: 'wall', x: 8.5, z: GATE_Z, w: 13, h: 1.8, color: 0x8a6a48, solid: false }, // 훈련장 어귀 목책과 문
    ],
    npcs: [
      { id: 'soldier', look: 'gwangbokgun', x: -5, z: 6, ry: Math.PI * 0.8 },
      { id: 'officer', look: 'gwangbokgun', x: 7, z: 5, ry: -Math.PI * 0.6 },
      { id: 'staff', look: 'gentleman', x: -9.5, z: 4, ry: Math.PI / 2 },
      { id: 'kimgu', look: 'kimgu', x: 0, z: -3, ry: 0 },
    ],
    // 길 위 안내판 대신 막사 간판(C-03): 「한국광복군 총사령부」·「대한민국 임시 정부」. 안내판 글(광복군 태극기·태평양 전쟁)은 사람 대사·장면으로 옮겼다
    signs: [{ id: 'signHq', title: '한국광복군 총사령부', x: 11, z: -8.5, ry: 0, plaque: { y: 2.55, back: 0.45 } },
      { id: 'signGov', title: '대한민국 임시 정부', x: -11, z: -8.5, ry: 0, plaque: { y: 2.55, back: 0.45 } }],
  },
  parts: [
    { ...script.parts.shoot, goal: script.goals[3], arena: RANGE, camera: { pos: [0.5, 4, 16.5], target: [0, 0.9, -2] }, paths: [[[-30, 0], [30, 0]], [[30, -4.5], [-30, -4.5]]], zones: [{ x: 0, z: 0, r: 4 }, { x: 0, z: -4.5, r: 4 }], shooters: SHOOTERS }, // 엎드린 대원들 등 뒤 낮은 곳에서 과녁 길을 본다
    { ...script.parts.road, goal: script.goals[4], intro: meet('kimgu', '김구와 이야기하기', script.parts.road.intro), play: ctx => roadWalk(ctx) },
  ],
  // 훈련장 문과 「한국광복군 훈련장」 이름판은 굳히기에 합쳐지지 않게 돌려준다
  decorate(world) {
    const gate = gateLeaves(world.level, { x: 0, z: GATE_Z, width: 4, height: 2.6, inward: -1 });
    const board = nameBoard(world.level, '한국광복군 훈련장', 3.2, GATE_Z - 1.6);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return { gate, board };
  },
});

// 장 도입(C-03): ① 감시를 피해 짐을 싸서 옮겨 다니는 임시 정부 사람들 ② 충칭 연병장에서 줄지어 훈련하는 광복군. 끝나면 더한 것을 치운다
function introScene(ctx) {
  const { world } = ctx, L = world.level;
  const movers = [['gentleman', -0.8, 6.5], ['kimgu', 0.8, 7.2], ['woman', -0.2, 8.4], ['gentleman', 1.2, 9]].map(([look, x, z]) => { const p = person(L, look, x, z, Math.PI); p.visible = false; return p; });
  const drill = [];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) { const p = person(L, 'gwangbokgun', -2.4 + i * 1.6, 0 + r * 1.5, 0); p.visible = false; drill.push(p); }
  let off = null;
  const run = fn => { off?.(); let t = 0; off = world.onUpdate(dt => { t += dt; fn(t, dt); }); };
  const hide = on => { for (const id of [...PEOPLE, 'kimgu']) { const n = world.npcs.get(id); if (n) n.mesh.visible = on; } };
  return {
    shots: [
      { cam: [3.4, 2.4, 12.5], look: [0, 1.4, 6.5], to: { cam: [2.8, 2.3, 11.8], look: [0, 1.4, 6] },
        act: () => { hide(false); movers.forEach(p => { p.visible = true; }); run((t, dt) => movers.forEach(p => { p.position.z -= dt * 0.9; })); } }, // 감시를 피해 옮겨 다니는 사람들
      { cam: [5.5, 2.6, 6.5], look: [0, 1.3, 0.8], to: { cam: [4.8, 2.5, 5.8], look: [0, 1.3, 0.8] },
        act: () => { off?.(); off = null; movers.forEach(p => { p.visible = false; }); drill.forEach(p => { p.visible = true; }); } }, // 연병장에 줄지어 선 대원들
    ],
    done: () => { off?.(); off = null; hide(true); for (const o of [...movers, ...drill]) o.removeFromParent(); },
  };
}

let scene = null;
export const villageTalk = (id, heard) => anyOrderTalk(script, PEOPLE, id, heard);
export const devScene = () => scene; // 개발용(사진 찍기)

export default {
  ...base,
  anyOrder: true, // 훈련장 사람은 아무 차례로(차례 전 대사 tooEarly가 없다, tests/quest.test.js)
  introScene,
  portal: { at: [0, 3.4], ry: 0 }, // 미니게임 뒤 빛나는 문(C-02): 돌아온 학생(SPOT) 바로 앞, 앞면은 학생(남쪽) 쪽
  buildScene(world) { scene = base.buildScene(world); return scene; },
  enterStage(ctx, stage) { scene.gate.setOpen(0); ctx.world.closeView = true; base.enterStage(ctx, stage); },
  // 모두 들은 뒤 김구에게 가면 학생의 결심 → 태극기에 각오 적기 장면
  async explore(ctx) {
    await walkInAndTalk(ctx, script, { people: PEOPLE, final: 'kimgu', gate: scene.gate, from: INTRO_FROM, to: base.layout.start });
    await flagScene(ctx);
  },
  // 공용 kit 미니게임을 그대로 돌리되, { meet } 줄에서는 그 사람에게 말을 걸 때까지 기다린다(C-05, chapters/kit/walk.js)
  minigame: ctx => minigameWithMeet(base, ctx),
};
