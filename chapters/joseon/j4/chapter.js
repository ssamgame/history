// 조선편 4장 「임진왜란과 한산도 대첩」(D-25): 포구 문으로 들어와 수군·백성의 이야기(아무 차례) → 이순신의 출전 명령 →
// 판옥선을 몰아 견내량 입구까지 가서 적을 꾀어내고 넓은 바다로 달아나기 → 펼쳐진 학익진의 빈자리로 배를 몰아 넣기 →
// 거북선이 앞장서 나서고(S43) 한꺼번에 공격 → 퀴즈.
import * as THREE from 'three';
import { buildJ4Scene, STRAIT_Z } from './scene.js';
import { roam } from '../../../core/flow.js';
import { showHowTo } from '../../../core/minigame.js';
import { LOOKS } from '../../../content/characters.js';
import { enterThroughGate, closeGate } from '../../kit/gate.js';
import { sayAll, placePlayer, tryPart, sumParts } from '../common.js';
import script from './script.js';

const PEOPLE = ['navy', 'commoner'];
const SPOT = [-8, 7];
const SAIL_CAM = { offset: [0, 6, 11], lookY: 3 }; // 배 바로 뒤 낮은 시점(고려 6장과 같은 방식, 판옥선이 커서 조금 뒤로)
export const LURE = { start: [0, -30], mouth: { x: 0, z: STRAIT_Z + 4, r: 3.5 }, open: { x: 0, z: -52, r: 4 } };
const CATCH = 5;
let scene = null;

function markPort(ctx, heard) {
  const { world, hud } = ctx;
  PEOPLE.forEach(id => { world.npcs.get(id).mark.visible = !heard.has(id); });
  world.npcs.get('yisunsin').mark.visible = heard.size > 0;
  const next = world.npcs.get(PEOPLE.find(id => !heard.has(id)) || 'yisunsin').mesh.position;
  world.setGoal({ x: next.x, z: next.z });
  ctx.setGoal(script.goals[heard.size === PEOPLE.length ? 1 : 0]);
  hud.setCounter(`들은 이야기 ${heard.size}/${PEOPLE.length}`);
}
export function portTalk(id, heard) {
  const n = script.npc[id];
  if (heard.has(id)) return n.later;
  return PEOPLE.some(k => k !== id && heard.has(k)) ? [n.bridge, ...n.first] : n.first;
}

// 판옥선에 태운다: 학생 몸은 숨고 배가 따라가며, 카메라는 배 바로 뒤 낮게
function board(ctx, [x, z]) {
  const { world } = ctx;
  world.closeView = false; world.bounds = scene.seaBounds;
  world.followOffset = new THREE.Vector3(...SAIL_CAM.offset); world.followLookY = SAIL_CAM.lookY;
  placePlayer(world, [x, z]); scene.myShip.visible = true; world.player.visible = false;
}
function unboard(ctx) {
  const { world } = ctx;
  scene.myShip.visible = false; world.followOffset = null; world.followLookY = null; world.closeView = true;
}

// 원에 닿을 때까지 몬다: 닿으면 true. chase가 있으면 매 프레임 부르고, false를 돌려주면(잡힘) 실패
function sailTo(ctx, ring, chase = null) {
  const { world } = ctx;
  scene.goalRing.position.set(ring.x, 0.1, ring.z); scene.goalRing.scale.setScalar(ring.r / 4.5); scene.goalRing.visible = true;
  world.setGoal({ x: ring.x, z: ring.z });
  ctx.input.enabled = true;
  return new Promise(resolve => {
    const off = world.onUpdate(dt => {
      const p = world.player.position;
      if (chase && chase(dt) === false) { done(false); return; }
      if (Math.hypot(p.x - ring.x, p.z - ring.z) < ring.r) done(true);
    });
    const done = ok => { off(); scene.goalRing.visible = false; world.setGoal(null); ctx.input.enabled = false; ctx.input.releaseJoystick?.(); resolve(ok); };
  });
}

// 1) 꾀어내기: 견내량 입구까지 가면 적이 보고 쫓아온다. 잡히지 않고 넓은 바다의 원까지 가면 성공
export async function lureEnemy(ctx, easy) {
  const { world, dialogue, audio } = ctx;
  scene.setStage('sail');
  scene.enemy.position.set(0, 0, STRAIT_Z - 16); scene.enemy.rotation.y = 0; // 견내량 안에 모여 있는 적
  board(ctx, LURE.start);
  await sailTo(ctx, LURE.mouth);
  await dialogue.say(script.lure.seen); dialogue.close();
  audio.play('whoosh');
  const speed = easy ? 3 : 4.2; // 학생 배(6.5)보다 느리다: 머뭇거리면 잡힌다
  const e = scene.enemy.position;
  e.set(0, 0, STRAIT_Z - 16); scene.enemy.rotation.y = Math.PI; // 견내량 안에 있던 적이 뱃머리를 돌려 남쪽(학생 쪽)으로
  const ok = await sailTo(ctx, LURE.open, dt => {
    const p = world.player.position, lead = e.z; // 적 무리의 맨 앞 줄(남쪽을 보면 앞줄이 e.z)
    if (Math.hypot(p.x - e.x, p.z - lead) < CATCH) { audio.play('wrong'); return false; }
    const dx = p.x - e.x, dz = p.z - lead, d = Math.hypot(dx, dz) || 1;
    e.x += dx / d * speed * dt * 0.4; e.z += dz / d * speed * dt;
    return true;
  });
  return ok;
}

// 2) 학익진: 우리 배들이 날개 모양으로 펼쳐지고, 학생은 날개의 빈자리로 배를 몬다(곧은 뒷줄 자리는 틀림)
export async function fillWing(ctx, easy) {
  const { world, dialogue, audio } = ctx;
  scene.setStage('wing');
  scene.enemy.position.set(0, 0, -68); scene.enemy.rotation.y = Math.PI;
  board(ctx, [0, -13]);
  await dialogue.say(script.wing.spread); dialogue.close();
  await scene.spreadFleet(easy ? 2 : 3);
  const rings = [scene.slot, ...scene.decoys].map((s, i) => {
    const r = new THREE.Mesh(new THREE.RingGeometry(1.8, 2.3, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
    r.rotation.x = -Math.PI / 2; r.position.set(s.x, 0.1, s.z); world.level.add(r); return { ...s, r, ok: i === 0 };
  });
  ctx.testHooks.walkTo = { x: scene.slot.x, z: scene.slot.z };
  let missed = false, told = new Set();
  ctx.input.enabled = true;
  if (easy) world.setGoal({ x: scene.slot.x, z: scene.slot.z });
  await new Promise(resolve => {
    const off = world.onUpdate(() => {
      if (dialogue.isOpen()) return;
      const p = world.player.position;
      for (const r of rings) {
        const inside = Math.hypot(p.x - r.x, p.z - r.z) < 2;
        if (!inside) { told.delete(r); continue; }
        if (r.ok) { off(); resolve(); return; }
        if (told.has(r)) continue;
        told.add(r); missed = true; audio.play('wrong');
        world.setGoal({ x: scene.slot.x, z: scene.slot.z });
        dialogue.say({ who: 'guide', text: script.wing.fail }).then(() => dialogue.close());
      }
    });
  });
  audio.play('correct');
  for (const r of rings) world.level.remove(r.r);
  world.setGoal(null); ctx.testHooks.walkTo = null; ctx.input.enabled = false; ctx.input.releaseJoystick?.();
  world.player.rotation.y = Math.PI; // 뱃머리를 적 쪽(북쪽)으로
  return missed ? 'missed' : true;
}

// 3) 거북선을 앞세우고 공격: 거북선을 따라 낮게 비추는 큰 장면(S43), 적이 날개 안으로 들어오면 한꺼번에 포를 쏜다
export async function turtleAndBattle(ctx) {
  const { world, dialogue } = ctx;
  scene.leadTurtle.position.set(0, -0.2, -18);
  world.player.visible = false;
  const cam = new THREE.Vector3(), tgt = new THREE.Vector3();
  const follow = world.onUpdate(() => { // 거북선 옆 뒤에서 낮게 따라간다
    const t = scene.leadTurtle.position;
    cam.set(t.x + 3, 6.5, t.z + 11); tgt.set(t.x, 1.2, t.z - 6);
    world.setFixedCamera(cam.toArray(), tgt.toArray());
  });
  await sayAll(dialogue, [script.turtle[0]]); dialogue.close();
  ctx.audio.play('whoosh');
  await scene.turtleCharge(3.5);
  await sayAll(dialogue, [script.turtle[1]]); dialogue.close();
  follow();
  await new Promise(resolve => { let k = 0; const off = world.onUpdate(dt => { k = Math.min(1, k + dt / 2.5); scene.setAdvance(k * 0.8); if (k >= 1) { off(); resolve(); } }); }); // 적이 날개 안으로
  world.fitFixedCamera([0, 0, -38], [0.9, 1.25, 0.45], [[-16, 0, -31], [16, 0, -31], [-6, 0, -49], [6, 0, -49]], 0.9); // 싸움을 옆에서 가까이
  ctx.testHooks.sunk = await scene.playBattle(ctx.audio);
  scene.setStage('won');
}

export const devScene = () => scene; // 개발용(사진 찍기)

export default {
  id: 'j4',
  mood: 'sea',
  player: LOOKS.navy,
  script,
  quizzes: script.quizzes,

  buildScene(world) {
    scene = buildJ4Scene(world);
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙)
    return scene;
  },

  enterStage(ctx, stage) {
    scene.gate.setOpen(0);
    if (stage === 'minigame') placePlayer(ctx.world, SPOT);
    if (stage === 'quiz') { scene.setStage('won'); placePlayer(ctx.world, SPOT); ctx.setGoal(script.goals[4]); }
  },

  async explore(ctx) {
    const { world, dialogue, hud } = ctx;
    world.closeView = true;
    placePlayer(world, scene.introFrom);
    await enterThroughGate(ctx, { from: scene.introFrom, to: scene.start, gate: scene.gate, speed: 1 });
    closeGate(world, scene.gate);
    const heard = new Set();
    markPort(ctx, heard);
    await sayAll(dialogue, script.start);
    dialogue.close();
    ctx.input.enabled = true;
    await new Promise(resolve => {
      const stop = roam(ctx, {
        async onTalk(id) {
          const n = script.npc[id];
          if (PEOPLE.includes(id)) {
            const isNew = !heard.has(id);
            await sayAll(dialogue, portTalk(id, heard));
            heard.add(id); markPort(ctx, heard);
            if (isNew && heard.size < PEOPLE.length) await dialogue.say(script.more);
            return;
          }
          if (id !== 'yisunsin') { await sayAll(dialogue, n.always); return; } // 배 옆 안내판
          if (!heard.size) { await sayAll(dialogue, n.wait); return; }
          await sayAll(dialogue, n.first);
          [...PEOPLE, 'yisunsin'].forEach(k => { world.npcs.get(k).mark.visible = false; });
          world.setGoal(null); hud.setCounter(null);
          stop(); setTimeout(resolve, 0);
        },
      });
    });
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    input.enabled = false;
    [...PEOPLE, 'yisunsin'].forEach(k => { world.npcs.get(k).mark.visible = false; });
    world.setGoal(null);
    const parts = [];
    // 1) 꾀어내기(바다로 짧은 장면 전환)
    ctx.setGoal(script.goals[2]);
    await showHowTo(ctx.ui, script.sail);
    await ctx.fade(true);
    scene.setStage('sail'); board(ctx, LURE.start);
    await ctx.fade(false);
    await sayAll(dialogue, script.lure.go); dialogue.close();
    parts.push(await tryPart(ctx, easy => lureEnemy(ctx, easy), script.lure.fail));
    await sayAll(dialogue, script.lure.done); dialogue.close();
    // 2) 학익진
    ctx.setGoal(script.goals[3]);
    await showHowTo(ctx.ui, script.wing.howto);
    parts.push(await tryPart(ctx, easy => fillWing(ctx, easy), script.wing.fail));
    await sayAll(dialogue, script.wing.done); dialogue.close();
    // 3) 거북선을 앞세우고 공격(큰 장면)
    unboard(ctx);
    scene.myShip.visible = true; // 학생 배는 날개 자리에 그대로 남는다
    await turtleAndBattle(ctx);
    scene.myShip.visible = false;
    await ctx.wait(600);
    await sayAll(dialogue, script.result); dialogue.close();

    await ctx.fade(true);
    world.bounds = { x0: -16, x1: 16, z0: 4.5, z1: 14 };
    placePlayer(world, SPOT);
    await ctx.fade(false);
    ctx.setGoal(script.goals[4]);
    return sumParts(parts);
  },
};
