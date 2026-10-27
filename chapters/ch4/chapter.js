// 4장 「강화도 천도와 처인성·충주성」(D-13): 저고여 사건 → 개경 궁궐 앞 문을 열고 들어옴 → 백성·관리 이야기 → 도읍 고르기 → 강화도 →
// 김윤후를 따라 처인성 성벽에 올라 가리킨 곳으로 걸어가 막기 → 김윤후를 따라 충주성 관청 마당에서 노비 문서를 가져다 놓기(연기·재) → 퀴즈.
import * as THREE from 'three';
import { buildCh4Scene, cheoinPlace, cheoinHeight, CHEOIN } from './scene.js';
import { roam } from '../../core/flow.js';
import { showHowTo, runWithRetries, pickOnMap } from '../../core/minigame.js';
import { enterThroughGate } from '../kit/gate.js';
import { labelSprite } from '../kit/play.js';
import { leadWalk } from '../kit/lead.js';
import script from './script.js';

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
const FLY = 0.85, FALL = 0.5, LIE = 1.0, RISE = 0.6; // 화살 나는 시간, 쓰러지는 시간, 누워 있는 시간, 궁수가 올라오는 시간
const SPOT_R = 1.6;
const angleOf = (p, cx) => { let a = Math.atan2(p.z, p.x - cx); if (a < 0) a += Math.PI * 2; return a; };
export function cheoinDefense(ctx, easy) {
  const { world, hud, audio } = ctx;
  const A = scene.areas.cheoin, [cx] = A.center, R = A.radius;
  const spawnEvery = easy ? 3.6 : 2.6, speed = easy ? 1.3 : 2.0, duration = 40;
  const travel = A.spawnR - A.radius - 1;
  ctx.testHooks.cheoinAttempts = (ctx.testHooks.cheoinAttempts || 0) + 1;
  const kim = world.npcs.get('kimyunhu'), km = kim.mesh.position, label = kimLabel(world), ring = scene.spotRing;
  const reset = () => {
    for (const m of scene.mongols) { m.group.visible = false; m.group.rotation.x = 0; }
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
    hit.set(m, { t: 0, arrow, from: v(g.position.x, g.position.y + 2.2, g.position.z), to: v(p.x, 2.2, p.z) });
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
          m.group.visible = true; m.group.rotation.x = 0;
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
          m.group.rotation.x = -1.45 * Math.min(1, (h.t - FLY) / FALL);
          if (h.t >= FLY + FALL + LIE) { m.group.visible = false; m.group.rotation.x = 0; hit.delete(m); }
        }
      }
      for (const [m, a] of active) {
        a.d += speed * dt;
        const r = A.spawnR - a.d;
        m.group.position.set(cx + Math.cos(m.angle) * r, 0, Math.sin(m.angle) * r);
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
        const ka = angleOf(km, cx), pa = angleOf(p, cx), goal = sa + (pa < sa ? 0.16 : -0.16), da = goal - ka, st = 3 / R * dt;
        const na = Math.abs(da) > st ? ka + Math.sign(da) * st : goal, ox = km.x, oz = km.z;
        km.set(cx + Math.cos(na) * R, CHEOIN.top, Math.sin(na) * R);
        kim.mesh.rotation.y = Math.abs(da) > st ? Math.atan2(km.x - ox, km.z - oz) : Math.atan2(Math.cos(sa), Math.sin(sa)); // 걸을 때는 가는 쪽, 서면 들판 쪽
      } else { ring.visible = false; world.setGoal(null); }
      kim.collider.x = 1e5; // 좁은 성벽 위에서 학생 길을 막지 않게
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
        const ks = world.player.scale.y || 1;
        world.player.add(carried); carried.position.set(0.42 / ks, 1.25 / ks, 0.35 / ks); carried.scale.setScalar(1.2 / ks); carried.rotation.set(0, 0, 0);
        audio.play('tap'); show();
      } else if (carried && Math.hypot(p.x - pr.position.x, p.z - pr.position.z) < 1.4) { // 문서 더미에 놓는다
        world.player.remove(carried); carried.visible = false; carried = null;
        n += 1; scene.pileUp(n); audio.play('correct');
        if (n >= 3) { done = true; off(); tr.visible = pr.visible = false; hud.setCounter(null); world.setGoal(null); resolve(); return; }
        show();
      }
    });
  });
}

// 문서가 연기를 내며 재가 된 뒤, 마당의 노비와 백성들이 모여 줄지어 성벽으로 걸어 나간다(약 6초)
function marchToWall(ctx) {
  const { world } = ctx;
  const C = scene.areas.chungju, cx = C.pile[0];
  const plan = scene.people.map((pp, i) => ({ pp, mid: [cx - 3 + (i % 3) * 1.4, 1.6 + Math.floor(i / 3) * 1.4], end: [cx - 7 + i * 2.6, -11.2], delay: i * 0.25 }));
  return new Promise(resolve => {
    let t = 0;
    const off = world.onUpdate(dt => {
      t += dt;
      let moving = false;
      for (const q of plan) {
        if (t < q.delay) { moving = true; continue; }
        const to = t < q.delay + 2.4 ? q.mid : q.end, p = q.pp.position, dx = to[0] - p.x, dz = to[1] - p.z, d = Math.hypot(dx, dz);
        if (d > 0.05) { const st = Math.min(d, 2.6 * dt); p.x += dx / d * st; p.z += dz / d * st; q.pp.rotation.y = Math.atan2(dx, dz); moving = true; }
      }
      if ((!moving && t > 3) || t > 9) { off(); resolve(); }
    });
  });
}

function showChungju(ctx) {
  const C = scene.areas.chungju;
  ctx.world.player.visible = false;
  ctx.world.setFixedCamera(C.cam.pos, C.cam.target);
  ctx.world.moveNpc('kimyunhu', C.kimyunhu[0], C.kimyunhu[1], C.kimyunhu[2]);
}

export default {
  id: 'ch4',
  mood: 'overcast',
  script,
  quizzes: script.quizzes,

  buildScene(world) {
    scene = buildCh4Scene(world); callLabel = null; cheoinOff = null;
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙). 장이 끝나면 world.clearLevel이 끈다
    return scene;
  },

  enterStage(ctx, stage) {
    const P = scene.areas.palace;
    if (stage === 'minigame') { ctx.world.bounds = P.bounds; placePlayer(ctx.world, P.start); }
    if (stage === 'quiz') { showChungju(ctx); scene.burnt(); for (const b of scene.bundles) b.visible = false; ctx.setGoal(script.goals[script.goals.length - 1]); }
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
    // 저고여 사건: 압록강 가 길을 걷던 몽골 사신이 쓰러진다(고정 화면, 그대로)
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
    await ctx.fade(true);
    world.player.visible = false;
    world.setFixedCamera(scene.areas.ganghwa.cam.pos, scene.areas.ganghwa.cam.target);
    await ctx.fade(false);
    await sayAll(dialogue, script.capital.done);
    dialogue.close();

    // 2. 처인성: 짧은 장면 전환 뒤 김윤후를 따라 비탈을 올라 성벽 위로, 가리킨 곳으로 걸어가 막는다
    await ctx.fade(true);
    setupCheoin(ctx);
    ctx.setGoal(G[3]);
    await ctx.fade(false);
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

    // 3. 충주성: 짧은 장면 전환 뒤 김윤후를 따라 관청 마당으로, 노비 문서를 가져다 놓는다(실패 없음, 불길 없이 연기·재)
    await ctx.fade(true);
    setupChungju(ctx);
    ctx.setGoal(G[5]);
    await ctx.fade(false);
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
    ctx.audio.play('whoosh');
    await scene.burnDocuments(); // 문서 더미에서 연기가 피어오르고 재가 된다(불길 없음)
    await sayAll(dialogue, script.chungju.burn);
    dialogue.close();
    await marchToWall(ctx); // 노비와 백성들이 모여 줄지어 성벽으로 나간다
    await sayAll(dialogue, script.chungju.done);
    ctx.setGoal(G[G.length - 1]);
    return { firstTryCorrect: (a.firstTry ? 1 : 0) + (b.first ? 1 : 0), firstTryTotal: 2, easyModeUsed: b.easyModeUsed };
  },
};
