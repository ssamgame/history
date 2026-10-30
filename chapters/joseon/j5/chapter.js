// 조선편 5장 「병자호란과 남한산성」(D-26): 서문으로 들어와 병사·창고지기 이야기(아무 차례) → 행궁 앞 김상헌·최명길의 의논 →
// 신하를 같은 생각의 대신 곁으로 데려가기 → 장작을 들고 화톳불 켜기 → 인조를 따라 서문을 나서 삼전도까지 → 삼궤구고두례 → 퀴즈.
import { buildJ5Scene, addJoints } from './scene.js';
import { showHowTo } from '../../../core/minigame.js';
import { PLAY, buildArena, labelSprite } from '../../kit/play.js';
import { waitInteract } from '../../../core/portal.js';
import * as THREE from 'three';
import { mat, makePerson, setCarry } from '../../../core/people.js';
import { roam } from '../../../core/flow.js';
import { enterThroughGate, closeGate } from '../../kit/gate.js';
import { leadWalk } from '../../kit/lead.js';
import { LOOKS } from '../../../content/characters.js';
import { sayAll, placePlayer, tryPart, sumParts } from '../common.js';
import script from './script.js';
import { hostageScene } from './story.js';

// 행궁 마당(마을에서 떨어진 x 400): 왼쪽에 김상헌(척화), 오른쪽에 최명길(주화). 말을 그 생각을 한 사람에게 가져간다.
const HALL = {
  origin: [400, 0], ground: 'stone', groundColor: 0xd8dade, bounds: { x0: -18, x1: 18, z0: -12, z1: 14 },
  props: [
    { type: 'hanok', x: 0, z: -14, tile: true, scale: 1.6 },
    { type: 'crowd', x: -10, z: -8.5, n: 1, looks: ['kimsangheon'] }, { type: 'crowd', x: 10, z: -8.5, n: 1, looks: ['choemyeonggil'] },
  ],
};
// 신하를 데려갈 자리(대신 앞)와 신하가 처음 서 있는 자리
export const SIDES = { cheok: { x: -10, z: -5 }, ju: { x: 10, z: -5 } };
const OFFICIAL_SPOTS = [{ x: -5, z: 5 }, { x: 6, z: 7 }, { x: -12, z: 8 }, { x: 13, z: 3 }];

export const PEOPLE = ['soldier', 'keeper'];
const MINISTERS = ['kimsangheon', 'choemyeonggil'];
const SPOT = [0, -3], END = [0, 5.5]; // END: 미니게임이 끝나 마을로 돌아온 자리(앞에 빛나는 문)
let scene = null;

export const PLAYER = { robe: 0x4a556a, hat: 'jeollip', gear: 'spear', trim: 0xd8d0bc, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } };

// 어깨에 메는 장작 한 묶음
function woodBundle() {
  const g = new THREE.Group(); g.rotation.z = Math.PI / 2;
  for (let k = 0; k < 5; k++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.0, 6), mat(0x6b4a32, 'wood')); m.position.set((k % 3) * 0.14 - 0.14, 0, Math.floor(k / 3) * 0.13); g.add(m); }
  const rope = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 5, 12), mat(0xc8b48a)); rope.rotation.y = Math.PI / 2; g.add(rope);
  return g;
}

// 화톳불 켜기 한 번: 시간 안에 여섯 개 모두 켜면 성공. 꺼진 불 가까이(2.2 안)에서 대화 버튼을 누르면 켜진다.
// 화살표는 가장 가까운 꺼진 불을 가리킨다.
function lightFires(ctx, easy, { stay = false } = {}) {
  const { world, hud, audio } = ctx;
  const duration = easy ? 110 : 75;
  scene.resetFires();
  if (!stay) placePlayer(world, SPOT);
  ctx.input.enabled = true;
  let t = 0, done = false, near = null, carrying = false, atWood = false;
  const bundle = woodBundle();
  return new Promise(resolve => {
    const finish = ok => {
      if (done) return; done = true;
      off(); unbind(); hud.setTimer(null); hud.setCounter(null); world.setGoal(null); hud.setPrompt?.(null); hud.setTalkEnabled?.(false); ctx.input.enabled = false;
      setCarry(world.player, null); if (bundle.parent) bundle.parent.remove(bundle);
      resolve(ok);
    };
    const unbind = ctx.onAction(() => {
      if (done) return;
      if (!carrying && atWood) { carrying = true; setCarry(world.player, bundle, 'shoulder'); audio.play('tap'); ctx.dialogue.say(script.fires.pick).then(() => ctx.dialogue.close()); return; } // 장작을 어깨에 멘다(D-18 들기)
      if (!near) return;
      scene.light(near); audio.play('correct'); near = null;
    });
    const off = world.onUpdate(dt => {
      if (done) return;
      t += dt;
      const p = world.player.position;
      let nearest = null, nd = Infinity;
      near = null;
      atWood = !carrying && Math.hypot(p.x - scene.wood.x, p.z - scene.wood.z) < 2.2;
      if (!carrying) { // 먼저 장작더미로
        hud.setTalkEnabled?.(atWood); hud.setPrompt?.(atWood ? new THREE.Vector3(scene.wood.x, 0, scene.wood.z) : null);
        world.setGoal({ x: scene.wood.x, z: scene.wood.z }); hud.setTimer(duration - t); hud.setCounter('장작을 들자');
        if (t >= duration) finish(false);
        return;
      }
      for (const f of scene.fires) {
        if (f.lit) continue;
        const d = Math.hypot(p.x - f.x, p.z - f.z);
        if (d < 2.2 && (!near || d < Math.hypot(p.x - near.x, p.z - near.z))) near = f;
        if (d < nd) { nd = d; nearest = f; }
      }
      hud.setTalkEnabled?.(!!near);
      hud.setPrompt?.(near ? new THREE.Vector3(near.x, 0, near.z) : null);
      const lit = scene.fires.filter(f => f.lit).length;
      hud.setTimer(duration - t);
      hud.setCounter(`켠 화톳불 ${lit}/${scene.fires.length}`);
      world.setGoal(nearest ? { x: nearest.x, z: nearest.z } : null);
      if (lit === scene.fires.length) return finish(true);
      if (t >= duration) finish(false);
    });
  });
}

// 인조를 따라 서문을 나선다(D-26): 행궁 앞에 나온 인조가 앞장서 서문으로 걷고, 학생이 따라 걷는다
async function followInjo(ctx) {
  const { world, dialogue } = ctx;
  const n = world.npcs.get('injo'), [gx, gz] = scene.westGate;
  n.mesh.visible = true; n.collider.r = 0.5; world.moveNpc('injo', 0, -7.6, 0);
  // 다가가서 말을 걸어야 떠난다(C-05): 출발 전 인조의 하소연(N-04)
  n.mark.visible = true;
  await waitInteract(ctx, { pos: n.mesh.position, quest: script.goals[5], label: '인조와 이야기하기', mark: false });
  n.mark.visible = false;
  ctx.input.enabled = false;
  world.setTalkCamera(n.mesh);
  await sayAll(dialogue, script.npc.injo.first);
  world.camMode = 'follow';
  ctx.setGoal(script.goals[6]);
  await sayAll(dialogue, script.walk.start); dialogue.close();
  const b0 = world.bounds; world.bounds = { ...b0, x0: gx - 6 }; // 서문 밖까지 걸을 수 있게
  scene.gate.setOpen(1);
  ctx.testHooks.ledBy = 'injo';
  await leadWalk(ctx, { id: 'injo', path: [[-4, -3], [-12, 0], [gx + 1, 0], [gx - 4, 0]], stand: [gx + 1.5, 0], face: -Math.PI / 2 });
  world.bounds = b0;
}

// 무릎 꿇고 머리를 조아리는 몸짓(D-26, D-30 N-05 선생님: 관절과 고개를 자연스럽게, 순서 있게). k: 무릎 꿇기 0~1, b: 머리 조아리기 0~1.
// 무릎 꿇기: 먼저 무릎을 굽혀 몸을 낮추고(쪼그림), 무릎이 땅에 닿으면 종아리를 뒤로 눕혀 발뒤꿈치 위에 앉는다. 두 손은 허벅지 위.
// 조아리기: 손이 먼저 앞으로 나가 땅을 짚고, 이어 허리가 굽고, 마지막에 고개가 숙여진다(일어날 때는 거꾸로).
// 몸은 엉덩이(다리 시작점, 높이 0.55)를 축으로 숙이고, 다리는 그만큼 되돌려 늘 땅에 붙어 있다
const ease = t => t * t * (3 - 2 * t);
const ss = (a, b, x) => ease(Math.min(1, Math.max(0, (x - a) / (b - a))));
const HIP = 0.55;
export function kowtowPose(holder, k, b) {
  const p = holder.userData.body, u = p.userData;
  addJoints(p);
  const k1 = ss(0, 0.55, k), k2 = ss(0.45, 1, k);          // 쪼그려 내려가기 → 무릎 대고 뒤로 앉기
  const ba = ss(0, 0.6, b), bb = ss(0.15, 0.85, b), bh = ss(0.4, 1, b); // 손 → 허리 → 고개
  const lean = 0.12 * k1 - 0.07 * k2 + 0.7 * bb;
  const drop = 0.25 * k1 + 0.06 * k2;
  p.rotation.x = lean;
  p.position.set(0, -drop + HIP * (1 - Math.cos(lean)), -HIP * Math.sin(lean)); // 도포 끝자락이 땅에 닿게 앉는다
  const thigh = 1.0 * k1 + 0.5 * k2, knee = 2.0 * k1 + 1.05 * k2;
  u.legs.forEach(l => { l.rotation.x = -thigh - lean; l.userData.knee.rotation.x = knee; });
  u.arms.forEach((a, i) => {
    a.rotation.x = -0.5 * k - 1.25 * ba;                   // 허벅지 위 → 앞으로 뻗어 땅 짚기
    a.rotation.z = (i ? -1 : 1) * 0.12 * ba;
    a.userData.elbow.rotation.x = -0.55 * k + 0.45 * ba;   // 허벅지 위에서는 굽히고, 땅을 짚을 때 편다
  });
  u.head.rotation.x = 0.15 * k + 0.65 * bh;                 // 이마가 땅 쪽으로
}

// 삼전도의 옷 색(N-05): 인조는 짙은 남색 옷으로 세자(짙은 초록)·신하(회갈색)와 뚜렷이 다르게
export const BOW_LOOKS = {
  king: { ...LOOKS.injo, robe: 0x1f2f86, trim: 0xd9a441 },
  prince: { ...LOOKS.injo, robe: 0x4a6a58, trim: 0x2b241c, hat: 'official' },
  official: { ...LOOKS.joseonOfficial, robe: 0x6b5d4f },
};

// 삼전도: 수항단 위의 청 태종, 단 아래로 걸어 나온 인조가 세 번 무릎 꿇고 아홉 번 머리를 조아린다(뒤의 세자·신하들도 함께)
const SAMJEON = {
  origin: [400, 220], ground: 'earth', groundColor: 0xcfd5dc, bounds: { x0: -16, x1: 16, z0: -12, z1: 14 },
  props: [{ type: 'water', x: 0, z: -30, w: 200, d: 24, color: 0x5a7a8a }],
};
async function samjeondo(ctx) {
  const { world, dialogue } = ctx;
  const L = script.samjeondo;
  await ctx.fade(true);
  world.npcs.get('injo').mesh.visible = false;
  const arena = buildArena(world, SAMJEON), g = arena.group, O = arena.at(0, 0);
  // 아홉 층 단과 노란 차양, 단 위에 앉은 청 태종
  for (let i = 0; i < 9; i++) { const w = 9 - i * 0.7; const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.32, w * 0.8), mat(0xc2baa8, 'stone')); m.position.set(0, 0.16 + i * 0.32, -6); m.castShadow = m.receiveShadow = true; g.add(m); }
  const top = 9 * 0.32;
  for (const [x, z] of [[-1.5, -7.4], [1.5, -7.4], [-1.5, -5], [1.5, -5]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.5, 6), mat(0x8a2f24)); p.position.set(x, top + 1.75, z); g.add(p); } // 의자 위로 높이 친 차양
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(2.5, 1.0, 4), mat(0xd9a441, 'cloth')); canopy.rotation.y = Math.PI / 4; canopy.position.set(0, top + 3.95, -6.2); g.add(canopy);
  // 황제의 자리: 붉은 칠에 금테를 두른 넓은 의자(높은 등받이·팔걸이·발받침, 등받이 위 금장식)에 앉아 있다
  const throne = new THREE.Group(); throne.position.set(0, top, -6.4); g.add(throne);
  const RED = 0x8a1f1a, GOLD = 0xd9a441, part = (geo, c, x, y, z, kind) => { const m = new THREE.Mesh(geo, mat(c, kind)); m.position.set(x, y, z); m.castShadow = true; throne.add(m); return m; };
  part(new THREE.BoxGeometry(1.9, 0.18, 0.9), RED, 0, 0.12, 0.65);                 // 발받침
  part(new THREE.BoxGeometry(1.7, 0.55, 1.1), RED, 0, 0.28, 0);                    // 앉는 자리 아래
  part(new THREE.BoxGeometry(1.75, 0.08, 1.15), GOLD, 0, 0.58, 0);                  // 금테
  part(new THREE.BoxGeometry(1.6, 0.12, 1.0), 0xc8a050, 0, 0.66, 0.02, 'cloth');   // 방석
  part(new THREE.BoxGeometry(1.8, 1.9, 0.18), RED, 0, 1.4, -0.52);                  // 높은 등받이
  part(new THREE.BoxGeometry(1.5, 1.55, 0.04), GOLD, 0, 1.42, -0.42, 'cloth');      // 등받이 앞 금빛 판
  for (const sx of [-1, 1]) {
    part(new THREE.BoxGeometry(0.2, 0.55, 1.05), RED, sx * 0.88, 0.95, 0);          // 팔걸이
    part(new THREE.BoxGeometry(0.26, 0.08, 1.1), GOLD, sx * 0.88, 1.24, 0);
    part(new THREE.SphereGeometry(0.14, 10, 8), GOLD, sx * 0.88, 1.3, 0.5);          // 팔걸이 끝 금구슬
    part(new THREE.CylinderGeometry(0.1, 0.12, 0.5, 8), GOLD, sx * 0.95, 2.5, -0.52); // 등받이 양 끝 금장식
    part(new THREE.SphereGeometry(0.16, 10, 8), GOLD, sx * 0.95, 2.8, -0.52);
  }
  const crest = part(new THREE.ConeGeometry(0.32, 0.5, 6), GOLD, 0, 2.62, -0.52); crest.rotation.y = Math.PI / 6; // 등받이 가운데 꼭대기 장식
  const emperor = makePerson({ robe: 0xd9a441, hat: 'qing', trim: 0x8a2f24, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'mustache' } }, { track: false });
  emperor.userData.noWalk = true; emperor.userData.manual = true;
  emperor.position.set(0, top + 0.18, -6.1); // 엉덩이(0.55)가 방석 위에 오도록 앉는다
  // 황제만 다리에 무릎 관절을 넣어 앉힌다: 허벅지는 앞으로 눕고, 무릎에서 종아리가 아래로 내려와 발이 발받침에 닿는다
  emperor.userData.legs.forEach(l => {
    l.clear();
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.34, 0.24), mat(0x2b241c)); thigh.position.y = -0.17; l.add(thigh);
    const knee = new THREE.Group(); knee.position.y = -0.34; l.add(knee);
    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.42, 0.22), mat(0x2b241c)); shin.position.y = -0.21; knee.add(shin);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.34), mat(0x1e1a16, 'grain')); shoe.position.set(0, -0.45, 0.05); knee.add(shoe);
    l.rotation.x = -1.5; knee.rotation.x = 1.5; l.userData.knee = knee;           // 허벅지는 앞으로, 종아리는 아래로
  });
  emperor.userData.arms.forEach((a, i) => { a.rotation.x = -0.55; a.rotation.z = (i ? -1 : 1) * 0.18; }); // 두 팔을 팔걸이에
  g.add(emperor);
  for (const sd of [-1, 1]) for (let i = 0; i < 5; i++) {
    const q = makePerson(LOOKS.qingSoldier); q.position.set(sd * (9 + (i % 2) * 1.4), 0, -4 + i * 2.6); q.rotation.y = -sd * Math.PI / 2; q.userData.noWalk = true; g.add(q);
    if (i % 2 === 0) { const f = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6).translate(0.6, 0, 0), new THREE.MeshLambertMaterial({ color: i % 4 ? 0x3c5a7a : 0xd9a441, side: THREE.DoubleSide })); f.position.set(sd * 11.2, 3.4, -4 + i * 2.6); g.add(f); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.2, 5), mat(0x5a3f2a)); pole.position.set(sd * 11.2, 2.1, -4 + i * 2.6); g.add(pole); }
  }
  // 인조(쪽빛 옷)와 뒤따르는 세자·신하들: 사람마다 바깥 묶음(자리·방향) 안에 몸을 두고, 몸이 엉덩이를 축으로 숙인다
  const holder = (look, off) => { const h = new THREE.Group(); h.rotation.y = Math.PI; h.userData.off = off; const p = makePerson(look); p.userData.noWalk = true; p.userData.manual = true; h.add(p); h.userData.body = p; g.add(h); return h; };
  const injo = holder(BOW_LOOKS.king, [0, 0]);
  const follow = [[-1.4, 2.2], [1.4, 2.2], [-2.6, 3.6], [0, 3.6], [2.6, 3.6]].map(([x, z], i) => holder(i === 0 ? BOW_LOOKS.prince : BOW_LOOKS.official, [x, z]));
  const bowers = [injo, ...follow];
  const place = z => bowers.forEach(h => h.position.set(h.userData.off[0], 0, z + h.userData.off[1]));
  place(12);
  // 학생은 행렬 맨 뒤에서 따라 걷는다(낮은 카메라로 뒤에서 본다)
  const me = arena.at(0, 13.6); placePlayer(world, [me.x, me.z]); world.player.visible = true;
  world.closeView = true;
  await ctx.fade(false);
  await dialogue.say(L[0]); dialogue.close();
  const anim = (sec, fn) => new Promise(resolve => { let t = 0; const off = world.onUpdate(dt => { t = Math.min(1, t + dt / sec); fn(t); if (t >= 1) { off(); resolve(); } }); });
  // 행렬이 단 아래까지 걸어가고 학생도 함께 걷는다(걷는 몸짓)
  bowers.forEach(h => { h.userData.body.userData.manual = false; h.userData.body.userData.noWalk = false; });
  world.autoMove = { x: 0, z: -1 }; world.speedScale = 0.3;
  await anim(3.2, k => place(12 - k * 10));
  world.autoMove = null; world.speedScale = 1;
  bowers.forEach(h => { const b = h.userData.body; b.userData.manual = true; b.userData.noWalk = true; });
  world.setFixedCamera([O.x - 7.2, 3.0, O.z - 3.2], [O.x + 0.5, 0.6, O.z + 3.4]); // 카메라 예외: 앞 왼쪽에서 비스듬히 보아 맨 앞 인조와 뒤 세자·신하들의 몸짓이 함께 보이게(D-30 N-05)
  await dialogue.say(L[1]); dialogue.close();
  await dialogue.say(L[2]); dialogue.close();
  // 세 번 무릎 꿇고, 꿇을 때마다 세 번 머리를 조아린다. 인조가 먼저 하고 세자·신하들이 0.25초 뒤부터 0.08초씩 늦게 따라 한다(N-05 순서)
  const done = { kneels: 0, bows: 0 };
  const lag = bowers.map((_, i) => (i ? 0.25 + 0.08 * (i - 1) : 0)), tail = lag[lag.length - 1];
  const all = (sec, f) => anim(sec + tail, t => bowers.forEach((h, i) => f(h, Math.min(1, Math.max(0, (t * (sec + tail) - lag[i]) / sec)))));
  for (let k = 0; k < 3; k++) {
    await all(1.4, (h, e) => kowtowPose(h, e, 0)); done.kneels += 1;                 // 천천히 무릎을 꿇는다
    for (let b = 0; b < 3; b++) {
      await all(0.9, (h, e) => kowtowPose(h, 1, e));                                 // 손을 짚고, 허리를 굽히고, 머리를 조아린다
      await ctx.wait(200);
      await all(0.8, (h, e) => kowtowPose(h, 1, 1 - e)); done.bows += 1;              // 다시 몸을 든다
      ctx.hud?.setCounter?.(`무릎 꿇기 ${done.kneels}/3 · 머리 조아리기 ${done.bows}/9`); // 말없이 길게 이어지는 의식이 멈춘 것처럼 보이지 않게(2026-10-30 점검)
    }
    await all(1.2, (h, e) => kowtowPose(h, 1 - e, 0));                                 // 일어선다
  }
  ctx.testHooks.samjeondo = done;
  ctx.hud?.setCounter?.(null);
  await ctx.wait(500);
  await ctx.fade(true);
  arena.dispose();
  placePlayer(world, SPOT);
  await ctx.fade(false);
}

// 신하 데려가기(D-26): 마당의 신하에게 말을 걸면 생각을 말하고 따라온다. 같은 생각의 대신 앞(빛나는 자리)에 닿으면 그 곁에 선다.
// 다른 쪽에 데려가면 짧은 해설(옳고 그름을 매기지 않고 생각의 이름만), 신하는 계속 따라온다
async function escortOfficials(ctx, easy) {
  const { world, dialogue, hud, audio } = ctx;
  const S = script.sort;
  const arena = buildArena(world, HALL);
  const at = (x, z) => arena.at(x, z);
  const p0 = at(0, 11); placePlayer(world, [p0.x, p0.z]);
  const sides = Object.fromEntries(Object.entries(SIDES).map(([k, v]) => [k, at(v.x, v.z)]));
  const rings = Object.values(sides).map(v => { const r = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.4, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.8, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.position.set(v.x, 0.1, v.z); world.level.add(r); return r; });
  // 두 대신의 이름을 머리 위에(N-02)
  for (const [name, x] of [['김상헌', -10], ['최명길', 10]]) { const t = labelSprite(name, { size: 1.6 }); t.name = `name:${name}`; t.position.set(x, 3.3, -8.5); arena.group.add(t); }
  const officials = S.use.map((ci, i) => {
    const id = `official${i + 1}`, pos = at(OFFICIAL_SPOTS[i].x, OFFICIAL_SPOTS[i].z);
    if (!world.npcs.has(id)) world.addNpc(id, LOOKS.joseonOfficial, pos.x, pos.z, 0);
    const n = world.npcs.get(id); n.mesh.visible = true; n.collider.r = 0.5; n.mark.visible = true; world.moveNpc(id, pos.x, pos.z, 0);
    return { id, n, card: S.cards[ci], done: false };
  });
  let cur = null, near = null, missed = false, told = null;
  ctx.input.enabled = true;
  const show = () => {
    const left = officials.filter(o => !o.done).length;
    hud.setCounter(`데려간 신하 ${officials.length - left}/${officials.length}`);
    const t = cur ? sides[cur.card.bin] : officials.find(o => !o.done)?.n.mesh.position;
    ctx.testHooks.walkTo = t ? { x: t.x, z: t.z } : null;
    world.setGoal(t && (easy || missed || !cur) ? { x: t.x, z: t.z } : null);
  };
  show();
  return new Promise(resolve => {
    const finish = () => {
      off(); unbind(); rings.forEach(r => world.level.remove(r));
      officials.forEach(o => { o.n.mesh.visible = false; o.n.collider.r = 0; o.n.mark.visible = false; });
      hud.setCounter(null); hud.setTalkEnabled?.(false); hud.setPrompt?.(null); world.setGoal(null); ctx.testHooks.walkTo = null; ctx.input.enabled = false;
      arena.dispose();
      resolve(missed ? 'missed' : true);
    };
    const unbind = ctx.onAction(async () => {
      if (cur || !near || dialogue.isOpen()) return;
      const o = near; near = null;
      ctx.input.enabled = false;
      await dialogue.say({ who: 'official', text: o.card.text }); await dialogue.say(S.follow); dialogue.close();
      ctx.input.enabled = true;
      cur = o; o.n.mark.visible = false; o.n.collider.r = 0; show();
    });
    const off = world.onUpdate(dt => {
      const p = world.player.position;
      if (!cur) { // 말을 걸 신하 찾기
        near = null; let bd = 2.2;
        for (const o of officials) { if (o.done) continue; const m = o.n.mesh.position, d = Math.hypot(p.x - m.x, p.z - m.z); if (d < bd) { bd = d; near = o; } }
        hud.setTalkEnabled?.(!!near && !dialogue.isOpen()); hud.setPrompt?.(near ? near.n.mesh.position : null);
        return;
      }
      hud.setTalkEnabled?.(false); hud.setPrompt?.(null);
      // 따라오기: 학생 뒤 1.6 거리를 지킨다
      const m = cur.n.mesh.position, dx = p.x - m.x, dz = p.z - m.z, d = Math.hypot(dx, dz);
      if (d > 1.7) { const st = Math.min(d - 1.6, 7 * dt); world.moveNpc(cur.id, m.x + dx / d * st, m.z + dz / d * st, Math.atan2(dx, dz)); }
      for (const [bin, v] of Object.entries(sides)) {
        const inside = Math.hypot(p.x - v.x, p.z - v.z) < 2.4;
        if (!inside) { if (told === bin) told = null; continue; }
        if (bin === cur.card.bin) { // 같은 생각의 대신 곁에 선다
          const o = cur; cur = null; o.done = true; audio.play('correct');
          const k = officials.filter(x => x.done && x.card.bin === bin).length;
          world.moveNpc(o.id, v.x + (bin === 'cheok' ? 1 : -1) * (1.2 + k * 1.1), v.z - 2.2, Math.PI);
          o.n.mesh.visible = true;
          if (officials.every(x => x.done)) { finish(); return; }
          show(); return;
        }
        if (told === bin || dialogue.isOpen()) continue;
        told = bin; missed = true; audio.play('wrong'); show();
        dialogue.say(S.wrong).then(() => dialogue.close());
      }
    });
  });
}

export const devScene = () => scene; // 개발용(사진 찍기)

// 탐험 표시: 아직 안 들은 사람에게 느낌표. 모두 들어야(C-01) 아직 안 들은 대신에게 느낌표(N-01: 두 대신 모두 들어야 진행)
function markFort(ctx, heard, said) {
  const { world, hud } = ctx;
  const all = heard.size === PEOPLE.length;
  PEOPLE.forEach(id => { world.npcs.get(id).mark.visible = !heard.has(id); });
  MINISTERS.forEach(id => { world.npcs.get(id).mark.visible = all && !said.has(id); });
  const nextId = PEOPLE.find(id => !heard.has(id)) || MINISTERS.find(id => !said.has(id)) || 'kimsangheon';
  const next = world.npcs.get(nextId).mesh.position;
  world.setGoal({ x: next.x, z: next.z });
  ctx.setGoal(script.goals[all ? 1 : 0]);
  hud.setCounter(all ? `들은 생각 ${said.size}/${MINISTERS.length}` : `들은 이야기 ${heard.size}/${PEOPLE.length}`);
}
// 대신의 말(N-01): 성안 사람들을 모두 듣기 전에는 기다리라 하고, 처음이면 자기 생각을, 다른 대신을 먼저 들었으면 끝에 정리 한 줄
export function ministerTalk(id, heard, said) {
  const n = script.npc[id];
  if (heard.size < PEOPLE.length) return n.wait;
  if (said.has(id)) return n.later;
  const other = MINISTERS.some(k => k !== id && said.has(k));
  return [...n.first, other ? script.closing : script.ministerMore];
}
export function fortTalk(id, heard) {
  const n = script.npc[id];
  if (heard.has(id)) return n.later;
  return PEOPLE.some(k => k !== id && heard.has(k)) ? [n.bridge, ...n.first] : n.first;
}

export default {
  id: 'j5',
  lightFires: (ctx, easy) => lightFires(ctx, easy), // 시험·개발용
  samjeondo: ctx => samjeondo(ctx),
  mood: 'snow',
  player: PLAYER,
  script,
  quizzes: script.quizzes,
  stories: { hostage: hostageScene }, // 이야기 장면(D-58)

  buildScene(world) {
    scene = buildJ5Scene(world);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    world.npcs.get('injo').collider.r = 0;
    return scene;
  },

  // 장 도입(C-03): ① 벌판에서 청나라 군대가 산성 쪽으로 올라온다 ② 서문이 열리고 인조와 세자·신하들이 성안으로 걸어 들어온다
  introScene(ctx) {
    const { world } = ctx, Q = scene.introQing, K = scene.introKing;
    const q0 = Q.position.clone(), k0 = K.position.clone();
    let off = null;
    const stopMove = () => { off?.(); off = null; };
    return {
      shots: [
        { cam: [10, -1.5, 24], look: [0, -7.5, 40], to: { cam: [6, -2.2, 26], look: [0, -7.8, 37] },
          act: () => { stopMove(); Q.visible = true; off = world.onUpdate(dt => { Q.position.z -= dt * 1.2; }); } },
        { cam: [-10.5, 2.4, -3.5], look: [-20, 1.2, 0], to: { cam: [-12, 2.2, -2.6], look: [-17, 1.2, 0] }, // 이름판(남한산성)의 반대쪽에서 서문을 본다
          act: () => { stopMove(); Q.visible = false; K.visible = true; scene.gate.setOpen(1); off = world.onUpdate(dt => { K.position.x = Math.min(-14, K.position.x + dt * 1.3); }); } },
      ],
      done: () => { stopMove(); Q.visible = false; K.visible = false; Q.position.copy(q0); K.position.copy(k0); scene.gate.setOpen(0); },
    };
  },
  // 미니게임 뒤 빛나는 문(C-02): 성안 가운데 빈 땅, 남쪽(돌아온 학생 쪽)을 본다
  portal: { at: [0, 1.2], ry: 0 },

  enterStage(ctx, stage) {
    scene.gate.setOpen(0);
    if (stage === 'minigame') placePlayer(ctx.world, SPOT);
    if (stage === 'quiz') { scene.allLit(); placePlayer(ctx.world, END); }
  },

  async explore(ctx) {
    const { world, dialogue, hud } = ctx;
    world.closeView = true;
    placePlayer(world, scene.introFrom, -Math.PI / 2);
    await enterThroughGate(ctx, { from: scene.introFrom, to: scene.start, gate: scene.gate, speed: 1 });
    closeGate(world, scene.gate);
    const heard = new Set(), said = new Set();
    ctx.testHooks.ministers = said;
    markFort(ctx, heard, said);
    await sayAll(dialogue, script.start);
    dialogue.close();
    ctx.input.enabled = true;
    await new Promise(resolve => {
      const stop = roam(ctx, {
        async onTalk(id) {
          const n = script.npc[id];
          if (PEOPLE.includes(id)) {
            const isNew = !heard.has(id);
            await sayAll(dialogue, fortTalk(id, heard));
            heard.add(id); markFort(ctx, heard, said);
            if (isNew && heard.size < PEOPLE.length) await dialogue.say(script.more);
            return;
          }
          if (!MINISTERS.includes(id)) { if (n && n.always) await sayAll(dialogue, n.always); return; } // 추위에 떠는 백성 등
          // 행궁 앞의 의논: 김상헌과 최명길에게 저마다 말을 걸어 두 생각을 모두 듣는다(아무 차례)
          const lines = ministerTalk(id, heard, said);
          await sayAll(dialogue, lines);
          if (lines === script.npc[id].wait || said.has(id)) return;
          said.add(id); markFort(ctx, heard, said);
          if (said.size < MINISTERS.length) return;
          [...PEOPLE, ...MINISTERS].forEach(k => { world.npcs.get(k).mark.visible = false; });
          world.setGoal(null); hud.setCounter(null);
          stop(); setTimeout(resolve, 0);
        },
      });
    });
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    input.enabled = false;
    world.closeView = true;
    [...PEOPLE, ...MINISTERS].forEach(k => { world.npcs.get(k).mark.visible = false; });
    world.setGoal(null);
    const parts = [];
    // 1) 신하 데려가기(행궁 마당, 짧은 장면 전환)
    ctx.setGoal(script.goals[2]);
    await showHowTo(ctx.ui, script.sort.howto);
    await ctx.fade(true);
    parts.push(await tryPart(ctx, async easy => { const p = escortOfficials(ctx, easy); await ctx.fade(false); return p; }, script.sort.fail));
    // 2) 성안으로 돌아와 추위에 떠는 백성에게 가서 이야기를 들어야 화톳불 켜기가 시작된다(N-03, C-05)
    await ctx.fade(true); placePlayer(world, SPOT); await ctx.fade(false);
    const folk = world.npcs.get('coldfolk');
    folk.mark.visible = true;
    await waitInteract(ctx, { pos: folk.mesh.position, quest: script.goals[3], label: '백성과 이야기하기', mark: false });
    folk.mark.visible = false;
    ctx.input.enabled = false;
    world.setTalkCamera(folk.mesh);
    await sayAll(dialogue, script.npc.coldfolk.first);
    world.camMode = 'follow';
    ctx.setGoal(script.goals[4]);
    await sayAll(dialogue, script.fires.howto); dialogue.close();
    await showHowTo(ctx.ui, script.fires.card);
    let firstFire = true;
    parts.push(await tryPart(ctx, easy => { const r = lightFires(ctx, easy, { stay: firstFire }); firstFire = false; return r; }, script.fires.fail));
    await sayAll(dialogue, script.fires.done); dialogue.close();
    // 3) 행궁 앞의 인조에게 가서 하소연을 듣고(N-04), 인조를 따라 서문을 나서 삼전도로(삼궤구고두례)
    await followInjo(ctx);
    await samjeondo(ctx);
    dialogue.close();
    await hostageScene(ctx); // 끝 해설 장면(D-58): 볼모로 끌려가는 두 왕자(result[2])
    dialogue.close();
    placePlayer(world, END);
    return sumParts(parts);
  },
};
