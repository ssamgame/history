// 4장 「강화도 천도와 처인성·충주성」(D-13): 저고여 사건 → 개경 궁궐 앞 문을 열고 들어옴 → 백성·관리 이야기 → 도읍 고르기 → 강화도 →
// 김윤후를 따라 처인성 성벽에 올라 가리킨 곳으로 걸어가 막기 → 김윤후를 따라 충주성 관청 마당에서 노비 문서를 가져다 놓기(불꽃·연기·재, 만세, D-14) → 퀴즈.
import * as THREE from 'three';
import { buildCh4Scene, cheoinPlace, cheoinHeight, CHEOIN, fieldH } from './scene.js';
import { mount } from '../../core/horse.js';
import { roam } from '../../core/flow.js';
import { showHowTo, runWithRetries, pickOnMap } from '../../core/minigame.js';
import { enterThroughGate } from '../kit/gate.js';
import { labelSprite } from '../kit/play.js';
import { leadWalk } from '../kit/lead.js';
import { setCarry } from '../../core/people.js';
import { waitInteract } from '../../core/portal.js';
import script from './script.js';
import { capitalScene } from './story.js';

let scene = null;
const PEOPLE = ['villager']; // 이야기를 들어 볼 사람(백성), 그다음 관리

async function sayAll(dialogue, lines) { for (const l of lines) await dialogue.say(l); }

function placePlayer(world, [x, z], ry = Math.PI) {
  world.player.visible = true;
  world.player.position.set(x, 0, z); world.player.rotation.y = ry;
  world.camMode = 'follow'; world.snapCamera();
}

// 관리의 첫 말(D-13): 백성 이야기를 안 들었으면 먼저 들어 보라 하고(막히지 않고 다시 찾아오면 된다),
// 들었으면 백성의 말을 이어받아 '도읍을 옮겨 오래 맞서자'로 모아 도읍 고르기로 잇는다
export function ministerTalk(heard) {
  const n = script.npc.minister;
  if (!PEOPLE.some(id => heard.has(id))) return [...n.tooEarly];
  return [...n.heard, ...n.land, ...n.go];
}

function setStep(ctx, n, heard) {
  const { world } = ctx;
  ctx.setGoal(script.goals[n]);
  const next = n === 0 ? PEOPLE.find(id => !heard.has(id)) : n === 1 ? 'minister' : null;
  for (const id of [...PEOPLE, 'minister']) world.npcs.get(id).mark.visible = id === next;
  const t = next && world.npcs.get(next).mesh.position;
  world.setGoal(t ? { x: t.x, z: t.z } : null);
}

// 김윤후 머리 위 짧은 외침("저기다!")
let callLabel = null;
function kimLabel(world) {
  if (!callLabel) {
    callLabel = labelSprite(script.cheoin.point, { size: 0.9 });
    callLabel.position.set(0, 3.2, 0); callLabel.visible = false;
    world.npcs.get('kimyunhu').mesh.add(callLabel);
  }
  return callLabel;
}

// 처인성에서는 학생이 비탈과 성벽 위만 걷는다(성벽 높이에 선다). 놀이 중 카메라는 조금 높고 멀리서 들판을 내려다본다(2장 성벽과 같은 예외)
export const CHEOIN_CAM = { offset: [0, 8, 12], lookY: 0 };
let cheoinOff = null;
function cheoinOn(ctx, on) {
  const { world } = ctx;
  if (cheoinOff) { cheoinOff(); cheoinOff = null; }
  if (!on) { world.followOffset = null; world.followLookY = null; return; }
  const [cx] = scene.areas.cheoin.center;
  world.bounds = { x0: cx - 16, x1: cx + 16, z0: -16, z1: 16 };
  cheoinOff = world.onUpdate(() => { const p = world.player.position; p.y = cheoinPlace(p); });
}

// 처인성에 학생과 김윤후를 세운다(비탈 아래, 장면 전환 뒤)
export function setupCheoin(ctx) {
  const { world } = ctx;
  const A = scene.areas.cheoin;
  world.setMood('overcast');
  world.scene.fog.near = 120; world.scene.fog.far = 400; // 멀리 있는 몽골군이 안개에 묻히지 않게
  cheoinOn(ctx, true);
  world.moveNpc('kimyunhu', A.kimyunhu[0], A.kimyunhu[1], CHEOIN.rampA + Math.PI / 2);
  placePlayer(world, A.start, Math.PI);
  world.player.position.y = cheoinPlace(world.player.position);
  world.snapCamera();
}
// 성벽 위 자리(김윤후가 이끈 끝)에 바로 세운다(다시 하기·시험)
export function putOnCheoinWall(ctx) {
  const { world } = ctx;
  const A = scene.areas.cheoin, last = A.leadPath[A.leadPath.length - 1];
  if (!cheoinOff) setupCheoin(ctx);
  world.moveNpc('kimyunhu', last[0], last[1], Math.PI);
  world.npcs.get('kimyunhu').mesh.position.y = CHEOIN.top;
  world.player.position.set(A.stand[0], CHEOIN.top, A.stand[1]);
  world.player.position.y = cheoinPlace(world.player.position);
  world.followOffset = new THREE.Vector3(...CHEOIN_CAM.offset); world.followLookY = CHEOIN_CAM.lookY;
  world.camMode = 'follow'; world.snapCamera();
}

// 처인성 방어 한 번(D-13, 버튼 없음): 40초 버티면 성공, 몽골군 3명이 성벽에 닿으면 실패.
// 몽골군이 들판에서 다가오면 김윤후가 가장 급한 적 쪽 성벽 위 자리를 "저기다!" 하고 가리키고(빛나는 원·화살표),
// 학생이 그 자리에 가까이 가면 가장 가까운 궁수가 화살을 쏜다. 맞은 몽골군은 뒤로 쓰러진다.
// 쉬운 방식은 몽골군이 느리게 오고, 가리킨 자리가 학생 가까이에 나온다.
// 말 탄 몽골군이 화살을 맞으면: 기수는 뒤로 넘어가며 말에서 떨어져 땅에 눕고, 말은 놀라 들판 쪽으로 달아난다(피는 넣지 않는다, D-45)
function fallFromHorse(m, dt) {
  const r = m.rider, h = m.horse, g = m.group;
  if (r.parent !== g) { // 말에서 떼어 무리(group)에 둔다: 안장 자리에서 시작
    const p = new THREE.Vector3(); r.getWorldPosition(p); g.worldToLocal(p);
    g.add(r); r.position.copy(p); r.rotation.set(0, 0, 0); r.scale.setScalar(1); r.userData.from = p.clone();
    r.rotation.order = 'YXZ';
  }
  const k = m.fall, f = r.userData.from;
  r.position.set(f.x, f.y * (1 - k) * (1 - k) + 0.1 * k, f.z - 1.1 * k); // 뒤로 넘어가며 내려온다
  r.rotation.x = -1.45 * k;
  // 말: 몸을 돌려 성에서 멀어진다
  h.rotation.y += (Math.PI - h.rotation.y) * Math.min(1, dt * 3);
  h.position.z -= Math.cos(h.rotation.y) * dt * 3.2; h.position.x -= Math.sin(h.rotation.y) * dt * 3.2;
}
function unfall(m) {
  const r = m.rider, h = m.horse;
  h.position.set(0, 0, 0); h.rotation.set(0, 0, 0);
  if (r.parent !== h.userData.body) { r.rotation.set(0, 0, 0); r.rotation.order = 'XYZ'; mount(h, r); }
}

const FLY = 0.85, FALL = 0.5, LIE = 1.0, RISE = 0.6; // 화살 나는 시간, 쓰러지는 시간, 누워 있는 시간, 궁수가 올라오는 시간
const SPOT_R = 1.6;
const KEEP_CLEAR = 0.9, RUN_NEAR = 2.5, RUN_SPEED = 7; // 김윤후와 학생 사이를 이만큼 띄운다(몸이 겹치지 않게). 학생이 이만큼 가까이 따라오면 이 빠르기로 뛴다
const angleOf = (p, cx) => { let a = Math.atan2(p.z, p.x - cx); if (a < 0) a += Math.PI * 2; return a; };
export function cheoinDefense(ctx, easy) {
  const { world, hud, audio } = ctx;
  const A = scene.areas.cheoin, [cx] = A.center, R = A.radius;
  const spawnEvery = easy ? 3.6 : 2.6, speed = easy ? 1.3 : 2.0, duration = 40;
  const travel = A.spawnR - A.radius - 1;
  ctx.testHooks.cheoinAttempts = (ctx.testHooks.cheoinAttempts || 0) + 1;
  const kim = world.npcs.get('kimyunhu'), km = kim.mesh.position, label = kimLabel(world), ring = scene.spotRing;
  const reset = () => {
    for (const m of scene.mongols) { m.group.visible = false; m.group.rotation.x = 0; m.fall = 0; if (m.horse) unfall(m); }
    for (const ar of scene.arrows) ar.visible = false;
    for (const ar of scene.archers) { ar.group.visible = false; ar.group.position.y = 0; ar.group.rotation.y = ar.rest; }
    ring.visible = false; label.visible = false;
  };
  reset();
  for (const ar of scene.archers) ar.group.visible = true;
  let t = 0, nextSpawn = 0.6, stopped = 0, breaches = 0, seed = 9, done = false, pointed = null, callT = 0;
  const active = new Map(), hit = new Map(); // hit: 화살을 맞는 중이거나 쓰러진 몽골군 → { t, arrow, from, to }
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const shoot = m => {
    const archer = scene.archers.reduce((b, ar) => (Math.abs(ar.angle - m.angle) < Math.abs(b.angle - m.angle) ? ar : b));
    const g = archer.group, p = m.group.position;
    g.rotation.y = Math.atan2(p.x - g.position.x, p.z - g.position.z); // 몽골군 쪽으로 돌아선다
    const arrow = scene.arrows.find(a => !a.visible) || scene.arrows[0];
    arrow.visible = true;
    hit.set(m, { t: 0, arrow, from: v(g.position.x, g.position.y + 2.2, g.position.z), to: v(p.x, p.y + (m.horse ? 3.3 : 2.2), p.z) }); // 말 탄 사람은 더 높이
    audio.play('whoosh');
  };
  const spotAngle = m => { // 가리킬 성벽 위 자리의 각도
    let a = m.angle;
    if (easy) { const pa = angleOf(world.player.position, cx); a = pa + Math.max(-0.35, Math.min(0.35, a - pa)); }
    return Math.max(CHEOIN.arc[0] + 0.05, Math.min(CHEOIN.arc[1] - 0.05, a));
  };
  return new Promise(resolve => {
    const finish = ok => {
      if (done) return; done = true;
      off(); reset();
      hud.setTimer(null); hud.setCounter(null); world.setGoal(null); resolve(ok);
    };
    const pos = new THREE.Vector3(), ahead = new THREE.Vector3();
    // 김윤후를 성벽 위 각도 na로 옮긴다: 걸으면 가는 쪽을, 서 있으면 가리킨 적 쪽(sa) 들판을 본다
    const moveKim = (na, sa) => { const ka = angleOf(km, cx), ox = km.x, oz = km.z; km.set(cx + Math.cos(na) * R, CHEOIN.top, Math.sin(na) * R); if (Math.abs(na - ka) > 1e-6) kim.mesh.rotation.y = Math.atan2(km.x - ox, km.z - oz); else if (sa != null) kim.mesh.rotation.y = Math.atan2(Math.cos(sa), Math.sin(sa)); };
    const off = world.onUpdate(dt => {
      if (done) return;
      t += dt;
      hud.setTimer(duration - t);
      hud.setCounter(`막은 몽골군 ${stopped} · 성벽에 닿은 적 ${breaches}/3`);
      const rise = Math.min(1, t / RISE); // 궁수가 발판 위로 올라온다
      for (const ar of scene.archers) ar.group.position.y = ar.baseY * (1 - (1 - rise) * (1 - rise));
      if (t >= nextSpawn) {
        nextSpawn = t + spawnEvery;
        const free = scene.mongols.filter(m => !active.has(m) && !hit.has(m));
        if (free.length) {
          seed = (seed * 16807) % 2147483647;
          const m = free[seed % free.length];
          m.group.visible = true; m.group.rotation.x = 0; m.fall = 0; if (m.horse) unfall(m);
          active.set(m, { d: 0, spot: spotAngle(m) });
        }
      }
      // 화살이 날아가 맞고, 맞은 몽골군은 뒤로 쓰러졌다가 치워진다
      for (const [m, h] of hit) {
        h.t += dt;
        if (h.t < FLY) {
          const k = h.t / FLY, arc = Math.sin(Math.PI * k) * 2.5;
          pos.lerpVectors(h.from, h.to, k).y += arc;
          ahead.lerpVectors(h.from, h.to, Math.min(1, k + 0.05)); ahead.y += Math.sin(Math.PI * Math.min(1, k + 0.05)) * 2.5;
          h.arrow.position.copy(pos); h.arrow.lookAt(ahead);
        } else {
          h.arrow.visible = false;
          m.fall = Math.min(1, (h.t - FLY) / FALL);
          if (m.horse) fallFromHorse(m, dt); else m.group.rotation.x = -1.45 * m.fall;
          if (h.t >= FLY + FALL + LIE) { m.group.visible = false; m.group.rotation.x = 0; if (m.horse) unfall(m); hit.delete(m); }
        }
      }
      for (const [m, a] of active) {
        a.d += speed * dt;
        const r = A.spawnR - a.d;
        { const x = cx + Math.cos(m.angle) * r, z = Math.sin(m.angle) * r; m.group.position.set(x, fieldH(x, z), z); } // 들판 높이 위에(발굽·발이 땅에 묻히지 않게)
        m.group.rotation.y = Math.atan2(-Math.cos(m.angle), -Math.sin(m.angle)); // 성 쪽을 바라본다
        if (a.d >= travel) {
          breaches += 1; audio.play('wrong');
          active.delete(m); m.group.visible = false;
          if (breaches >= 3) return finish(false);
        }
      }
      // 김윤후는 가장 급한(성에 가장 가까운) 적 쪽 성벽 위 자리를 가리킨다
      let target = null;
      for (const [m, a] of active) if (!target || a.d > active.get(target).d) target = m;
      if (target !== pointed) { pointed = target; if (target) { callT = 1.6; ctx.testHooks.pointed = (ctx.testHooks.pointed || 0) + 1; } }
      callT -= dt; label.visible = callT > 0;
      const p = world.player.position;
      if (target) {
        const sa = active.get(target).spot, sx = cx + Math.cos(sa) * R, sz = Math.sin(sa) * R;
        ring.position.set(sx, CHEOIN.top + 0.06, sz); ring.visible = true;
        world.setGoal({ x: sx, z: sz });
        ctx.testHooks.spot = { x: sx, z: sz };
        if (Math.hypot(p.x - sx, p.z - sz) < SPOT_R) { // 가리킨 자리에 왔다: 궁수가 쏜다
          stopped += 1; ctx.testHooks.cheoinShot = (ctx.testHooks.cheoinShot || 0) + 1; audio.play('tap');
          active.delete(target); shoot(target); ring.visible = false; pointed = null;
        }
        // 김윤후는 성벽 위를 걸어 그 자리 곁(학생 반대쪽)으로 가서 적 쪽을 본다
        const ka = angleOf(km, cx), pa = angleOf(p, cx), goal = sa + (pa < sa ? 0.16 : -0.16), da = goal - ka;
        const st = (Math.abs(ka - pa) * R < RUN_NEAR && Math.sign(da) === Math.sign(ka - pa) ? RUN_SPEED : 3) / R * dt; // 학생이 바로 뒤에 따라오면 학생보다 빨리 뛰어 앞서 간다
        let na = Math.abs(da) > st ? ka + Math.sign(da) * st : goal;
        if (na !== ka && Math.sign(na - ka) === Math.sign(pa - ka) && Math.abs(na - pa) * R < KEEP_CLEAR) na = ka; // 학생 몸을 지나가지 않는다(길에 있으면 그 앞에서 멈춘다)
        moveKim(na, sa);
      } else { ring.visible = false; world.setGoal(null); }
      { const ka = angleOf(km, cx), pa = angleOf(p, cx); if (Math.abs(ka - pa) * R < KEEP_CLEAR && Math.abs(p.y - km.y) < 1) { const st = RUN_SPEED / R * dt, away = Math.sign(ka - pa) || 1; moveKim(Math.max(CHEOIN.arc[0], Math.min(CHEOIN.arc[1], ka + away * st)), null); } } // 학생이 걸어 들어오면 성벽을 따라 비켜선다(2026-10-31 자동 점검: 둘이 겹쳐 섰다)
      kim.collider.x = 1e5; // 좁은 성벽 위에서 학생 길을 막지 않게(대신 김윤후가 비켜서고 앞서 뛴다)
      if (t >= duration) finish(true);
    });
  });
}

// 충주성 관청 마당에 학생과 김윤후를 세운다(장면 전환 뒤)
export function setupChungju(ctx) {
  const { world } = ctx;
  const C = scene.areas.chungju;
  cheoinOn(ctx, false);
  world.setMood('overcast');
  world.bounds = C.bounds;
  world.moveNpc('kimyunhu', C.kimStart[0], C.kimStart[1], Math.PI);
  placePlayer(world, C.start, Math.PI);
}

// 노비 문서를 가져다 놓는다(D-13, 실패 없음): 상 앞(빛나는 원)에 가면 김윤후가 두루마리 묶음을 건네고,
// 학생이 옆구리에 끼고 문서 더미(빛나는 원)로 가져가 놓는다. 세 묶음을 다 놓으면 끝.
export function carryDocuments(ctx) {
  const { world, hud, audio } = ctx;
  const C = scene.areas.chungju, T = scene.table, tr = scene.tableRing, pr = scene.pileRing;
  const take = [T[0] - 1.2, T[1] + 0.4], pile = C.pile;
  tr.position.set(take[0], 0.08, take[1]); pr.position.set(pile[0], 0.08, pile[1] + 1.2);
  let n = 0, carried = null, done = false;
  scene.pileUp(0);
  return new Promise(resolve => {
    const show = () => {
      tr.visible = !carried; pr.visible = !!carried;
      world.setGoal(carried ? { x: pr.position.x, z: pr.position.z } : { x: take[0], z: take[1] });
      hud.setCounter(`가져다 놓은 문서 ${n}/3`);
    };
    show();
    const off = world.onUpdate(() => {
      if (done) return;
      const p = world.player.position;
      if (!carried && Math.hypot(p.x - take[0], p.z - take[1]) < 1.4) { // 김윤후가 두루마리를 건넨다
        carried = scene.bundles[n];
        carried.scale.setScalar(1.2); carried.rotation.set(0, 0, 0);
        setCarry(world.player, carried, 'side'); // 두루마리를 옆구리에 끼고 걷는다(D-18)
        audio.play('tap'); show();
      } else if (carried && Math.hypot(p.x - pr.position.x, p.z - pr.position.z) < 1.4) { // 문서 더미에 놓는다
        setCarry(world.player, null); carried.visible = false; carried = null;
        n += 1; scene.pileUp(n); audio.play('correct');
        if (n >= 3) { done = true; off(); tr.visible = pr.visible = false; hud.setCounter(null); world.setGoal(null); resolve(); return; }
        show();
      }
    });
  });
}

// 문서가 다 타면 마당의 노비와 백성들이 제자리에서 두 팔을 위아래로 흔들며 만세한다(D-14, 사람마다 박자가 조금씩 다르다).
// 멈추는 함수를 돌려준다(팔은 내린 자리로 돌아간다)
export const devScene = () => scene; // 개발용(사진 찍기·콘솔): 지은 장면
export function cheer(ctx) {
  const { world } = ctx;
  const ps = scene.people;
  ps.forEach(p => { p.userData.manual = true; });
  let t = 0;
  const off = world.onUpdate(dt => {
    t += dt;
    ps.forEach((p, i) => {
      const u = p.userData, w = Math.max(0, Math.sin(t * (5.2 + (i % 3) * 0.7) + i * 1.9)); // 0 내림 ~ 1 번쩍 듦
      const up = Math.min(1, t * 3); // 처음엔 천천히 팔을 든다
      const ang = -1.1 - 1.9 * w * up;
      u.arms[0].rotation.x = ang; u.arms[1].rotation.x = ang;
      u.arms[0].rotation.z = -0.25 * w; u.arms[1].rotation.z = 0.25 * w;
      u.legs[0].rotation.x = u.legs[1].rotation.x = 0;
    });
  });
  return () => {
    off();
    ps.forEach(p => { const u = p.userData; for (const a of u.arms) a.rotation.set(0, 0, 0); u.manual = false; });
  };
}

// 그 사람(id)에게 다가가 말을 걸어야 다음 놀이가 시작된다(C-05)
async function talkTo(ctx, id, quest) {
  const { world, dialogue } = ctx, n = world.npcs.get(id);
  n.mark.visible = true;
  await waitInteract(ctx, { pos: n.mesh.position, quest, label: `${script.speakers[id].name}와 이야기하기`, mark: false });
  n.mark.visible = false;
  ctx.input.enabled = false;
  world.camMode = 'follow';
}

export default {
  id: 'ch4',
  mood: 'overcast',
  script,
  quizzes: script.quizzes,
  stories: { capital: capitalScene }, // 이야기 장면(D-58)

  buildScene(world) {
    scene = buildCh4Scene(world); callLabel = null; cheoinOff = null;
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙). 장이 끝나면 world.clearLevel이 끈다
    return scene;
  },

  // 장 도입(C-03): 압록강 가 길을 걸어가는 몽골 사신 일행(복면 병사는 아직 보이지 않는다)
  introScene(ctx) {
    const { world } = ctx, J = scene.areas.jeogo, { envoy, aide, archer } = J;
    const e0 = envoy.position.clone(), a0 = aide.position.clone();
    const f0 = e0.x + 3, f1 = e0.x + 12;
    let off = null;
    return {
      shots: [{ cam: [f0 + 0.6, 3.3, 11], look: [f0, 1.0, 0.6], to: { cam: [f1 + 0.6, 3.3, 11], look: [f1, 1.0, 0.6] },
        act: () => { archer.visible = false; off = world.onUpdate(dt => { envoy.position.x += dt * 1.5; aide.position.x += dt * 1.5; }); } }],
      done: () => { off?.(); off = null; envoy.position.copy(e0); aide.position.copy(a0); archer.visible = true; },
    };
  },
  // 미니게임 뒤 빛나는 문(C-02): 개경 궁궐 마당 오른쪽 빈 땅, 학생 쪽(남쪽)을 본다
  portal: { at: [6, 5], ry: 0 },

  enterStage(ctx, stage) {
    const P = scene.areas.palace;
    if (stage === 'minigame') { ctx.world.bounds = P.bounds; placePlayer(ctx.world, P.start); }
    if (stage === 'quiz') { scene.burnt(); for (const b of scene.bundles) b.visible = false; ctx.world.bounds = P.bounds; placePlayer(ctx.world, P.start); }
  },

  // 배운 내용 확인 배경: 강화도 문제는 강화도 해협을, 처인성·충주성 문제는 처인성을 비춘다
  quizView(ctx, q) {
    const { world } = ctx;
    world.player.visible = false;
    if (q.question.includes('강화도')) { world.setFixedCamera(scene.areas.ganghwa.cam.pos, scene.areas.ganghwa.cam.target); return { name: '강화도' }; }
    const c = scene.areas.cheoin.center[0];
    world.setFixedCamera([c + 6, 16, 26], [c, 0, -2]);
    return { name: '처인성' };
  },

  async explore(ctx) {
    const { world, dialogue } = ctx;
    const P = scene.areas.palace;
    world.closeView = true;
    // 저고여 사건(D-14): 압록강 가 길을 걷던 사신이 덤불 뒤 복면 병사의 화살에 쓰러진다(카메라가 길을 따라간다)
    const J = scene.areas.jeogo;
    world.player.visible = false;
    world.setFixedCamera(J.cam.pos, J.cam.target);
    await sayAll(dialogue, script.jeogo.before);
    dialogue.close();
    await J.play();
    await sayAll(dialogue, script.jeogo.after);
    dialogue.close();
    // 짧은 장면 전환 뒤 개경: 궁궐 앞 문이 열리고 걸어 들어온다(상시 규칙, 누르면 건너뛴다)
    await ctx.fade(true);
    world.bounds = P.bounds;
    placePlayer(world, P.introFrom);
    await ctx.fade(false);
    await enterThroughGate(ctx, { from: P.introFrom, to: P.start, gate: scene.palaceGate, speed: 1 });
    world.bounds = P.bounds;
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
            await sayAll(dialogue, isNew ? n.first : n.later);
            if (!isNew || step !== 0) return;
            heard.add(id); step = 1;
            await dialogue.say(script.next.minister);
            setStep(ctx, 1, heard);
          } else if (id === 'minister') {
            await sayAll(dialogue, ministerTalk(heard));
            if (!PEOPLE.some(k => heard.has(k))) return;
            world.npcs.get('minister').mark.visible = false; world.setGoal(null);
            stop(); setTimeout(resolve, 0);
          }
        },
      });
    });
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    const G = script.goals;
    world.closeView = true;
    input.enabled = false;
    for (const id of [...PEOPLE, 'minister']) world.npcs.get(id).mark.visible = false;
    // 1. 도읍을 어디로? (지금 그대로)
    ctx.setGoal(G[2]);
    for (;;) {
      const id = await pickOnMap(ctx, script.capital);
      const place = script.capital.places.find(p => p.id === id);
      if (!place.hint) break;
      await dialogue.say({ who: 'guide', text: place.hint });
      dialogue.close();
    }
    const a = await dialogue.ask(script.capital.reason);
    dialogue.close();
    world.player.visible = false;
    await capitalScene(ctx); // 이야기 장면(D-58): 배들이 강화도로 건너가고 몽골군은 바닷가에서 멈춘다

    // 2. 처인성: 짧은 장면 전환 뒤 김윤후를 따라 비탈을 올라 성벽 위로, 가리킨 곳으로 걸어가 막는다
    await ctx.fade(true);
    setupCheoin(ctx);
    ctx.setGoal(G[3]);
    await ctx.fade(false);
    await talkTo(ctx, 'kimyunhu', G[3]); // 다가가서 말을 걸어야 시작한다(C-05)
    await sayAll(dialogue, script.cheoin.intro);
    await sayAll(dialogue, script.cheoin.lead);
    dialogue.close();
    const A = scene.areas.cheoin;
    await leadWalk(ctx, { id: 'kimyunhu', path: A.leadPath, stand: A.stand, ring: scene.standRing, face: Math.PI, heightAt: cheoinHeight });
    putOnCheoinWall(ctx); // 성벽 위 카메라(조금 높고 멀리, 놀이 동안만)
    ctx.setGoal(G[4]);
    await sayAll(dialogue, script.cheoin.start);
    dialogue.close();
    await showHowTo(ctx.ui, script.cheoin.howto);
    const b = await runWithRetries(ctx, easy => { putOnCheoinWall(ctx); input.enabled = true; return cheoinDefense(ctx, easy).finally(() => { input.enabled = false; }); }, { failHint: script.cheoin.failHint });
    await sayAll(dialogue, script.cheoin.done);
    dialogue.close();

    // 3. 충주성: 짧은 장면 전환 뒤 김윤후를 따라 관청 마당으로, 노비 문서를 가져다 놓는다(실패 없음). 문서가 불타고 노비와 백성들이 만세한다(D-14)
    await ctx.fade(true);
    setupChungju(ctx);
    ctx.setGoal(G[5]);
    await ctx.fade(false);
    await talkTo(ctx, 'kimyunhu', G[5]); // C-05
    await sayAll(dialogue, script.chungju.intro);
    await sayAll(dialogue, script.chungju.lead);
    dialogue.close();
    const C = scene.areas.chungju;
    await leadWalk(ctx, { id: 'kimyunhu', path: C.leadPath, stand: C.stand, ring: scene.standRing, face: -Math.PI / 2 });
    world.npcs.get('kimyunhu').mesh.rotation.y = Math.atan2(world.player.position.x - C.leadPath[1][0], world.player.position.z - C.leadPath[1][1]);
    ctx.setGoal(G[6]);
    await sayAll(dialogue, script.chungju.give);
    dialogue.close();
    await showHowTo(ctx.ui, script.chungju.howto);
    input.enabled = true;
    await carryDocuments(ctx);
    input.enabled = false;
    // 문서 더미 너머로 노비와 백성들이 보이는 곳에서 본다(학생은 잠깐 숨겨 앞을 가리지 않게)
    world.player.visible = false;
    world.setFixedCamera(C.cheerCam.pos, C.cheerCam.target);
    ctx.audio.play('whoosh');
    await scene.burnDocuments(); // 불꽃이 일어 문서가 타오르고, 불이 잦아들며 연기·재가 남는다(D-14)
    await sayAll(dialogue, script.chungju.burn);
    dialogue.close();
    const stopCheer = cheer(ctx); // 노비와 백성들이 제자리에서 만세
    await new Promise(r => setTimeout(r, 900));
    await sayAll(dialogue, script.chungju.done);
    dialogue.close();
    stopCheer();
    // 마을(개경 궁궐 마당)로 돌아온다: 이어서 빛나는 문이 선다(C-02)
    await ctx.fade(true);
    const P = scene.areas.palace;
    world.setMood('overcast');
    world.bounds = P.bounds;
    placePlayer(world, P.start);
    await ctx.fade(false);
    return { firstTryCorrect: (a.firstTry ? 1 : 0) + (b.first ? 1 : 0), firstTryTotal: 2, easyModeUsed: b.easyModeUsed };
  },
};
