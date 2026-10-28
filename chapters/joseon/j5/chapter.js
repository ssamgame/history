// 조선편 5장 「병자호란과 남한산성」(D-26): 서문으로 들어와 병사·창고지기 이야기(아무 차례) → 행궁 앞 김상헌·최명길의 의논 →
// 신하를 같은 생각의 대신 곁으로 데려가기 → 장작을 들고 화톳불 켜기 → 인조를 따라 서문을 나서 삼전도까지 → 삼궤구고두례 → 퀴즈.
import { buildJ5Scene } from './scene.js';
import { showHowTo } from '../../../core/minigame.js';
import { PLAY, buildArena } from '../../kit/play.js';
import * as THREE from 'three';
import { mat, makePerson, setCarry } from '../../../core/people.js';
import { roam } from '../../../core/flow.js';
import { enterThroughGate, closeGate } from '../../kit/gate.js';
import { leadWalk } from '../../kit/lead.js';
import { LOOKS } from '../../../content/characters.js';
import { sayAll, placePlayer, tryPart, sumParts } from '../common.js';
import script from './script.js';

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

const PEOPLE = ['soldier', 'keeper'], MINISTERS = ['kimsangheon', 'choemyeonggil'];
const SPOT = [0, -3];
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
function lightFires(ctx, easy) {
  const { world, hud, audio } = ctx;
  const duration = easy ? 110 : 75;
  scene.resetFires();
  placePlayer(world, SPOT);
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
  ctx.setGoal(script.goals[4]);
  await sayAll(dialogue, script.walk.start); dialogue.close();
  const b0 = world.bounds; world.bounds = { ...b0, x0: gx - 6 }; // 서문 밖까지 걸을 수 있게
  scene.gate.setOpen(1);
  await leadWalk(ctx, { id: 'injo', path: [[-4, -3], [-12, 0], [gx + 1, 0], [gx - 4, 0]], stand: [gx + 1.5, 0], face: -Math.PI / 2 });
  world.bounds = b0;
}

// 무릎 꿇고 머리를 조아리는 몸짓(D-26 선생님: 자연스럽게). k: 무릎 꿇기 0~1, b: 머리 조아리기 0~1.
// 몸이 내려가며 다리(종아리)가 뒤로 접혀 땅에 닿고, 두 손은 무릎 위에 있다가 조아릴 때 앞으로 땅을 짚는다.
// 몸은 엉덩이(다리 시작점, 높이 0.55)를 축으로 앞으로 숙이고, 다리는 그만큼 되돌려 늘 땅에 붙어 있다
const ease = t => t * t * (3 - 2 * t);
const HIP = 0.55;
export function kowtowPose(holder, k, b) {
  const p = holder.userData.body, u = p.userData;
  const lean = 0.06 * k + 0.45 * b; // 넓은 도포가 엎드린 것처럼 눕지 않게 몸은 조금만 숙이고 고개와 팔로 조아린다
  p.rotation.x = lean;
  p.position.set(0, -0.5 * k + HIP * (1 - Math.cos(lean)), -HIP * Math.sin(lean)); // 도포 끝자락이 땅에 닿게 앉는다
  if (u.legs) u.legs.forEach(l => { l.rotation.x = 1.45 * k - lean; const kn = l.userData.knee; if (kn) kn.rotation.x = 0; });
  if (u.arms) u.arms.forEach((a, i) => { a.rotation.x = -0.4 * k - 1.0 * b; a.rotation.z = (i ? -1 : 1) * 0.1 * b; });
  if (u.head) u.head.rotation.x = 0.7 * b; // 이마가 땅 쪽으로
}

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
  for (const [x, z] of [[-1.3, -7], [1.3, -7], [-1.3, -5], [1.3, -5]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 6), mat(0x8a2f24)); p.position.set(x, top + 1.3, z); g.add(p); }
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1.0, 4), mat(0xd9a441, 'cloth')); canopy.rotation.y = Math.PI / 4; canopy.position.set(0, top + 3.0, -6); g.add(canopy);
  const emperor = makePerson({ robe: 0xd9a441, hat: 'qing', trim: 0x8a2f24, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'mustache' } });
  emperor.position.set(0, top - 0.35, -6.2); emperor.userData.noWalk = true; g.add(emperor);
  for (const sd of [-1, 1]) for (let i = 0; i < 5; i++) {
    const q = makePerson(LOOKS.qingSoldier); q.position.set(sd * (9 + (i % 2) * 1.4), 0, -4 + i * 2.6); q.rotation.y = -sd * Math.PI / 2; q.userData.noWalk = true; g.add(q);
    if (i % 2 === 0) { const f = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6).translate(0.6, 0, 0), new THREE.MeshLambertMaterial({ color: i % 4 ? 0x3c5a7a : 0xd9a441, side: THREE.DoubleSide })); f.position.set(sd * 11.2, 3.4, -4 + i * 2.6); g.add(f); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.2, 5), mat(0x5a3f2a)); pole.position.set(sd * 11.2, 2.1, -4 + i * 2.6); g.add(pole); }
  }
  // 인조(쪽빛 옷)와 뒤따르는 세자·신하들: 사람마다 바깥 묶음(자리·방향) 안에 몸을 두고, 몸이 엉덩이를 축으로 숙인다
  const holder = (look, off) => { const h = new THREE.Group(); h.rotation.y = Math.PI; h.userData.off = off; const p = makePerson(look); p.userData.noWalk = true; p.userData.manual = true; h.add(p); h.userData.body = p; g.add(h); return h; };
  const injo = holder({ ...LOOKS.injo, robe: 0x3c4a6a }, [0, 0]);
  const follow = [[-1.4, 2.2], [1.4, 2.2], [-2.6, 3.6], [0, 3.6], [2.6, 3.6]].map(([x, z], i) => holder(i === 0 ? { ...LOOKS.injo, robe: 0x4a556a, hat: 'official' } : LOOKS.joseonOfficial, [x, z]));
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
  world.setFixedCamera([O.x - 7.6, 2.8, O.z + 5], [O.x + 0.4, 0.8, O.z + 2.2]); // 왼쪽 옆에서 낮게 보아 몸짓이 잘 보이게(뒤따르는 학생이 가리지 않게)
  await dialogue.say(L[1]); dialogue.close();
  await dialogue.say(L[2]); dialogue.close();
  // 세 번 무릎 꿇고, 꿇을 때마다 세 번 머리를 조아린다. 사람마다 0.08초씩 늦게 따라 해 한 몸처럼 딱딱하지 않게
  const done = { kneels: 0, bows: 0 };
  const all = (sec, f) => anim(sec + 0.08 * bowers.length, t => bowers.forEach((h, i) => { const lt = Math.min(1, Math.max(0, (t * (sec + 0.08 * bowers.length) - 0.08 * i) / sec)); f(h, ease(lt)); }));
  for (let k = 0; k < 3; k++) {
    await all(0.9, (h, e) => kowtowPose(h, e, 0)); done.kneels += 1;                // 천천히 무릎을 꿇는다
    for (let b = 0; b < 3; b++) {
      await all(0.55, (h, e) => kowtowPose(h, 1, e));                                // 두 손을 짚으며 머리를 땅에 조아리고
      await ctx.wait(150);
      await all(0.5, (h, e) => kowtowPose(h, 1, 1 - e)); done.bows += 1;             // 다시 몸을 든다
    }
    await all(0.8, (h, e) => kowtowPose(h, 1 - e, 0));                                // 일어선다
  }
  ctx.testHooks.samjeondo = done;
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

function markFort(ctx, heard) {
  const { world, hud } = ctx;
  PEOPLE.forEach(id => { world.npcs.get(id).mark.visible = !heard.has(id); });
  MINISTERS.forEach(id => { world.npcs.get(id).mark.visible = heard.size > 0; });
  const next = world.npcs.get(PEOPLE.find(id => !heard.has(id)) || 'kimsangheon').mesh.position;
  world.setGoal({ x: next.x, z: next.z });
  ctx.setGoal(script.goals[heard.size === PEOPLE.length ? 1 : 0]);
  hud.setCounter(`들은 이야기 ${heard.size}/${PEOPLE.length}`);
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

  buildScene(world) {
    scene = buildJ5Scene(world);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    world.npcs.get('injo').collider.r = 0;
    return scene;
  },

  enterStage(ctx, stage) {
    scene.gate.setOpen(0);
    if (stage === 'minigame' || stage === 'quiz') placePlayer(ctx.world, SPOT);
    if (stage === 'quiz') { scene.allLit(); ctx.setGoal(script.goals[5]); }
  },

  async explore(ctx) {
    const { world, dialogue, hud } = ctx;
    world.closeView = true;
    placePlayer(world, scene.introFrom, -Math.PI / 2);
    await enterThroughGate(ctx, { from: scene.introFrom, to: scene.start, gate: scene.gate, speed: 1 });
    closeGate(world, scene.gate);
    const heard = new Set();
    markFort(ctx, heard);
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
            heard.add(id); markFort(ctx, heard);
            if (isNew && heard.size < PEOPLE.length) await dialogue.say(script.more);
            return;
          }
          if (!MINISTERS.includes(id)) { await sayAll(dialogue, n.always); return; } // 유적 옆 안내판
          if (!heard.size) { await sayAll(dialogue, script.npc.kimsangheon.wait); return; }
          // 행궁 앞의 의논: 김상헌과 최명길이 차례로 말한다
          [...PEOPLE, ...MINISTERS].forEach(k => { world.npcs.get(k).mark.visible = false; });
          world.setGoal(null); hud.setCounter(null);
          ctx.setGoal(script.goals[1]);
          world.setTalkCamera(world.npcs.get('kimsangheon').mesh);
          await sayAll(dialogue, script.npc.kimsangheon.first);
          world.setTalkCamera(world.npcs.get('choemyeonggil').mesh);
          await sayAll(dialogue, script.npc.choemyeonggil.first);
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
    // 2) 장작을 들고 화톳불 켜기
    ctx.setGoal(script.goals[3]);
    await ctx.fade(true); placePlayer(world, SPOT); await ctx.fade(false);
    await sayAll(dialogue, script.fires.howto); dialogue.close();
    await showHowTo(ctx.ui, script.fires.card);
    parts.push(await tryPart(ctx, easy => lightFires(ctx, easy), script.fires.fail));
    await sayAll(dialogue, script.fires.done);
    await sayAll(dialogue, script.result.slice(0, 1)); dialogue.close(); // 강화도 함락 → 항복하기로
    // 3) 인조를 따라 서문을 나서 삼전도로(삼궤구고두례)
    await followInjo(ctx);
    await samjeondo(ctx);
    await sayAll(dialogue, script.result.slice(2)); // 볼모
    dialogue.close();
    placePlayer(world, SPOT);
    ctx.setGoal(script.goals[5]);
    return sumParts(parts);
  },
};
