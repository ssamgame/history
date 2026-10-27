// 1장 「서희의 외교 담판」: 진영 사람들 이야기 → 서희를 따라 걸어가 소손녕과 담판(D-6) → 거란군 철수와 강동 6주 → 퀴즈.
import { buildCh1Scene } from './scene.js';
import { roam } from '../../core/flow.js';
import script from './script.js';
import { enterThroughGate } from '../kit/gate.js';
import * as THREE from 'three';

export const START = [0, 19];
export const INTRO_FROM = [0, 36]; // 장 시작 장면: 진영 밖 길(걷는 곳 z1=22 바깥)
const FERRY_RETURN = [8, -12.2];
const SEOHUI_HOME = [-11, 1.3, 0.15];
const PEOPLE = ['soldier', 'officer', 'archer']; // 이야기를 들어 볼 차례
const LEAD_SPEED = 4.2, WAIT_FAR = 5, WAIT_NEAR = 3.2; // 서희 걸음, 학생이 이만큼 멀어지면 멈춰 기다리고 이만큼 오면 다시 걷는다

let scene = null;

async function sayAll(dialogue, lines) { for (const l of lines) await dialogue.say(l); }

// 서희의 첫 말(D-6): 병사 이야기를 아직 안 들었으면 먼저 들어 보라 하고, 들었으면 들은 사람의 말을 차례로 받아 '땅을 내줄 수 없다'로 모은다
export function seohuiTalk(heard) {
  const n = script.npc.seohui;
  if (!heard.has('soldier')) return n.tooEarly;
  return [...n.greet, ...PEOPLE.filter(id => heard.has(id)).map(id => n.heard[id]), ...n.land, ...n.go];
}

// 탐험 목표: 아직 이야기를 안 들은 다음 사람(차례대로)에게 느낌표와 화살표, 다 들었으면 서희
function setStep(ctx, n, heard) {
  const { world } = ctx;
  ctx.setGoal(script.goals[n]);
  const next = n === 0 ? PEOPLE.find(id => !heard.has(id)) : n === 1 ? 'seohui' : null;
  for (const id of [...PEOPLE, 'seohui']) world.npcs.get(id).mark.visible = id === next;
  const t = next && world.npcs.get(next).mesh.position;
  world.setGoal(t ? { x: t.x, z: t.z } : null);
}

// 강을 건널 수 있는 곳은 널다리뿐: 학생 자리에 따라 걷는 곳을 바꾼다(진영 / 다리 위 / 강 건너)
function walkBounds(p) {
  const c = scene.campBounds, br = scene.bridge, far = { x0: -6, x1: 12, z0: -34.5 };
  const onLine = Math.abs(p.x - br.x) < br.half;
  if (p.z >= c.z0 - 0.05) return { ...c, z0: onLine ? far.z0 : c.z0 }; // 진영(강가까지)
  if (p.z > br.z1) return { x0: br.x - br.half, x1: br.x + br.half, z0: far.z0, z1: c.z1 };
  return { ...far, z1: onLine ? c.z1 : br.z1 };
}

// 서희가 앞장서 걷고 학생이 뒤따른다(D-6). 학생이 멀어지면 서희가 멈춰 돌아보며 기다린다.
// 서희가 소손녕 앞에 서면 학생 자리에 빛나는 원이 뜨고, 학생이 오면 둘이 나란히 소손녕과 마주 선다(화면 전환 없음).
export function followSeohui(ctx) {
  const { world, input } = ctx;
  const sh = world.npcs.get('seohui'), m = sh.mesh.position, path = scene.leadPath, sp = scene.negotiationSpot;
  let i = 0, waiting = false;
  for (const id of [...PEOPLE, 'seohui']) world.npcs.get(id).mark.visible = false;
  ctx.setGoal(script.goals[2]);
  input.enabled = true;
  return new Promise(resolve => {
    const off = world.onUpdate(dt => {
      const p = world.player.position;
      world.bounds = walkBounds(p);
      if (i < path.length) {
        const dp = Math.hypot(p.x - m.x, p.z - m.z);
        if (waiting ? dp < WAIT_NEAR : dp > WAIT_FAR) waiting = !waiting;
        if (waiting) sh.mesh.rotation.y = Math.atan2(p.x - m.x, p.z - m.z);
        else {
          let dx = path[i][0] - m.x, dz = path[i][1] - m.z;
          const d = Math.hypot(dx, dz), step = LEAD_SPEED * dt;
          if (d <= step) { world.moveNpc('seohui', path[i][0], path[i][1], sh.mesh.rotation.y); i += 1; }
          else { dx /= d; dz /= d; world.moveNpc('seohui', m.x + dx * step, m.z + dz * step, Math.atan2(dx, dz)); }
          if (i === path.length) { sh.mesh.rotation.y = sp.seohui[2]; scene.ring.visible = true; }
        }
        world.setGoal({ x: m.x, z: m.z });
        return;
      }
      world.setGoal({ x: sp.player[0], z: sp.player[1] });
      if (Math.hypot(p.x - sp.player[0], p.z - sp.player[1]) < 1.6) {
        off(); input.enabled = false; scene.ring.visible = false; world.setGoal(null);
        p.set(sp.player[0], 0, sp.player[1]); world.player.rotation.y = sp.player[2];
        resolve();
      }
    });
  });
}

function placePlayer(world, [x, z], ry = Math.PI) {
  world.player.position.set(x, 0, z); world.player.rotation.y = ry;
  world.camMode = 'follow'; world.snapCamera();
}

// 장 시작 장면(D-5): 남쪽 성문의 문짝이 열리고 학생 병사가 진영 밖 길에서 걸어 들어온다(약 4초). 누르거나 키를 누르면 건너뛴다.
export function introWalk(ctx) { return enterThroughGate(ctx, { from: INTRO_FROM, to: START, gate: scene && scene.gate }); }

// 따라가기 카메라에서 담판 카메라로 1초쯤 부드럽게 옮겨 간 뒤 고정한다(같은 장면에서 이어지게)
function glideTo(world, pos, target) {
  const cam = world.camera, from = cam.position.clone(), look0 = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).multiplyScalar(8).add(from);
  const P = new THREE.Vector3(...pos), T = new THREE.Vector3(...target), look = new THREE.Vector3();
  world.camMode = 'fixed';
  let t = 0;
  const off = world.onUpdate(dt => {
    t = Math.min(1, t + dt / 1.1);
    const e = t * t * (3 - 2 * t);
    cam.position.lerpVectors(from, P, e); cam.lookAt(look.lerpVectors(look0, T, e));
    if (t >= 1) { off(); world.setFixedCamera(pos, target); }
  });
}

function showAftermath(world) {
  scene.khitanGroup.visible = false;
  scene.gangdongPillars.visible = true;
  world.moveNpc('seohui', ...SEOHUI_HOME);
}

export default {
  id: 'ch1',
  mood: 'sunset',
  script,
  quizzes: script.quizzes,

  buildScene(world) { scene = buildCh1Scene(world); return scene; },

  // 이어하기로 중간 단계부터 시작할 때 장면을 그 단계에 맞춘다.
  enterStage(ctx, stage) {
    if (stage === 'quiz') { showAftermath(ctx.world); placePlayer(ctx.world, FERRY_RETURN); ctx.setGoal(script.goals[4]); }
  },

  async explore(ctx) {
    const { world, dialogue } = ctx;
    world.closeView = true; // 낮은 카메라·정면 대화(D-5)
    await introWalk(ctx);
    const heard = new Set();
    let step = 0;
    setStep(ctx, 0, heard);
    await sayAll(dialogue, script.start);
    dialogue.close();
    ctx.input.enabled = true;
    await new Promise(resolve => {
      const stop = roam(ctx, {
        async onTalk(id) {
          const n = script.npc[id];
          if (PEOPLE.includes(id)) {
            const isNew = !heard.has(id);
            await sayAll(dialogue, isNew || !n.later ? (n.first || n.always) : n.later);
            if (!isNew || step !== 0) return;
            heard.add(id);
            const next = PEOPLE.find(k => !heard.has(k)) || 'seohui';
            await dialogue.say(script.next[next]);
            if (next === 'seohui') step = 1;
            setStep(ctx, step, heard);
          } else if (id === 'seohui') {
            await sayAll(dialogue, seohuiTalk(heard));
            if (!heard.has('soldier')) return;
            await sayAll(dialogue, script.follow);
            stop(); setTimeout(resolve, 0); // roam이 대화를 닫고 입력을 정리한 뒤에 따라 걷기를 시작한다
          } else await sayAll(dialogue, n.always);
        },
      });
    });
    await followSeohui(ctx);
    world.closeView = false;
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    const spot = scene.negotiationSpot;
    input.enabled = false;
    setStep(ctx, 3, new Set(PEOPLE));
    // 서희를 따라 걸어온 그 자리 그대로(이어하기로 들어왔을 때만 자리를 맞춘다). 화면을 어둡게 바꾸지 않는다
    world.bounds = { ...scene.campBounds, z0: -34.5 };
    world.moveNpc('seohui', spot.seohui[0], spot.seohui[1], spot.seohui[2]);
    world.player.position.set(spot.player[0], 0, spot.player[1]); world.player.rotation.y = spot.player[2];
    scene.sonn.rotation.y = 0;
    glideTo(world, spot.cam.pos, spot.cam.target); // 두 사람 뒤에서 소손녕 얼굴을 정면으로

    await sayAll(dialogue, script.negotiation.opening);
    const a = await dialogue.ask(script.negotiation.q1);
    const b = await dialogue.ask(script.negotiation.q2);
    await sayAll(dialogue, script.negotiation.closing);
    dialogue.close();

    // 거란군이 진영을 걷고 줄지어 물러난다(D-7). 서희와 학생은 다리 건너편에 나란히 서서 그 뒷모습을 바라본다
    await ctx.fade(true);
    world.bounds = { ...scene.campBounds, z0: -34.5 };
    world.moveNpc('seohui', -1.5, -30, Math.PI);
    world.player.position.set(1.5, 0, -30); world.player.rotation.y = Math.PI;
    scene.startRetreat();
    world.setFixedCamera([-5.5, 4.6, -23.5], [2.5, 1, -45]); // 두 사람 뒤 조금 왼쪽 위에서 비스듬히 물러가는 대열을 내려다본다(깃발·말 탄 소손녕이 보이게)
    await ctx.fade(false);
    ctx.audio.play('whoosh');
    await ctx.wait(3200);
    scene.gangdongPillars.visible = true;
    await sayAll(dialogue, script.retreat);
    ctx.setGoal(script.goals[4]);
    return { firstTryCorrect: Number(a.firstTry) + Number(b.firstTry), firstTryTotal: 2, easyModeUsed: false };
  },
};
