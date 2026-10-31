// 2장 「양규와 흥화진」(D-8): 성문을 열고 들어옴 → 병사·백성 이야기를 듣고 양규에게 → 양규를 따라 성벽에 올라
// 양규가 가리킨 사다리를 밀어냄(같은 장면) → 백성 구출(구한 백성이 따라와 성으로 들어옴) → 퀴즈.
import { buildCh2Scene, setGauge, WALL_TOP, WALK_Z } from './scene.js';
import { roam } from '../../core/flow.js';
import { showHowTo, runWithRetries } from '../../core/minigame.js';
import { enterThroughGate } from '../kit/gate.js';
import { waitInteract } from '../../core/portal.js';
import { labelSprite } from '../kit/play.js';
import script from './script.js';
import { setStyle } from '../../core/motion.js';
import { strike } from '../../core/interact.js';
import { gwakjuScene, lastStandScene } from './story.js';
import * as THREE from 'three';

const EXPLORE_BOUNDS = { x0: -10.5, x1: 10.5, z0: -10.5, z1: 7 };
export const INTRO_FROM = [0, 22]; // 장 시작 장면: 남쪽 성문 밖 길
const PEOPLE = ['soldier', 'villager']; // 이야기를 들어 볼 차례(병사 → 백성), 그다음 양규
const RETURN_AT = [0, 6];           // 구출을 마치고 성안으로 돌아온 학생 자리
const STAND = [0, WALK_Z];          // 성벽 위 학생이 설 자리(계단 바로 위)
const YG_POST = [1.4, WALK_Z];      // 성벽 위 양규 자리
const LEAD_PATH = [[0, -6.4], [0, -11.9], [0.3, WALK_Z], YG_POST];
const LEAD_SPEED = 3.6, WAIT_FAR = 5, WAIT_NEAR = 3.2;
const WALL_BOUNDS = { x0: -11.5, x1: 11.5, z0: WALK_Z - 0.35, z1: WALK_Z + 0.35 };
const PUSH_R = 1.4;      // 사다리 자리에서 이만큼 가까이 가면 밀어낸다
const NEED_PUSH = 10;    // 이만큼 밀어내면 바로 성공
const RAISE_SECONDS = 0.8; // 거란 병사가 사다리를 세우는 시간
const RAISE_LEAN = 1.1;    // 세우기 전 사다리가 뒤로 눕혀진 각도(라디안)
const FALL_SECONDS = 0.7;  // 밀린 사다리가 뒤로 넘어가는 시간
const GATHER_Z = -16.3;    // 성 밖 거란군이 사다리 아래 모이는 줄(사다리 밑동 -14.5보다 바깥)
const BACK_Z = -25;        // 사다리가 밀려나면 이만큼 물러났다가 다시 다가온다
const PUSH_BACK_R = 3.6;   // 밀린 사다리 밑동에서 이만큼 안의 군사가 함께 밀려난다

let scene = null;
let rescued = []; // 구한 백성 무리(구한 차례). 학생을 줄지어 따라온다

async function sayAll(dialogue, lines) { for (const l of lines) await dialogue.say(l); }
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// 양규의 첫 말(D-8/D-30): 모두 듣기 전에는 마저 듣고 오라 하고(막히지 않고 다시 찾아오면 된다),
// 모두 들었으면 들은 사람의 말을 차례로 이어받아 '이곳이 무너지면 안 된다'로 모은다
export function yanggyuTalk(heard) {
  const n = script.npc.yanggyu;
  if (PEOPLE.some(id => !heard.has(id))) return n.wait; // 모두 들어야 진행(D-30)
  return [...n.greet, ...PEOPLE.filter(id => heard.has(id)).map(id => n.heard[id]), ...n.land, ...n.go];
}

// 탐험 목표(D-30): 아직 안 들은 사람 모두에게 느낌표, 화살표는 그중 첫째. 모두 들었으면 양규에게만
function setStep(ctx, n, heard = new Set(PEOPLE)) {
  const { world, hud } = ctx;
  ctx.setGoal(script.goals[n]);
  const left = PEOPLE.filter(id => !heard.has(id));
  for (const id of PEOPLE) world.npcs.get(id).mark.visible = n === 0 && left.includes(id);
  world.npcs.get('yanggyu').mark.visible = n === 1;
  const next = n === 0 ? left[0] : n === 1 ? 'yanggyu' : null;
  const t = next && world.npcs.get(next).mesh.position;
  world.setGoal(t ? { x: t.x, z: t.z } : null);
  hud.setCounter(n === 0 ? `들은 이야기 ${heard.size}/${PEOPLE.length}` : null);
}

function placePlayer(world, [x, z], ry = Math.PI, y = 0) {
  world.player.visible = true;
  world.player.position.set(x, y, z); world.player.rotation.y = ry;
  world.camMode = 'follow'; world.snapCamera();
}

// 성벽 계단: 계단(가운데 너비 3)은 z -7.2에서 북쪽으로 한 칸 0.8씩 오른다. 성벽 위는 WALL_TOP
const onWall = p => p.z < -11.9;
const onStairs = p => !onWall(p) && Math.abs(p.x) < 1.5 && p.z < -7.2;
function heightAt(p) {
  if (onWall(p)) return WALL_TOP;
  if (onStairs(p)) return Math.min(WALL_TOP, 0.7 * (Math.floor((-7.2 - p.z) / 0.8) + 1));
  return 0;
}
// 학생 자리에 따라 걷는 곳을 바꾼다(성안 땅 / 계단 / 성벽 위). 계단 옆에서 계단으로 올라서지는 못한다
function climbBounds(p) {
  if (onWall(p)) return { ...WALL_BOUNDS, z1: Math.abs(p.x) < 1.4 ? 7 : WALL_BOUNDS.z1 };
  if (onStairs(p)) return { x0: -1.4, x1: 1.4, z0: WALL_BOUNDS.z0, z1: 7 };
  const b = { ...EXPLORE_BOUNDS };
  if (Math.abs(p.x) < 1.4) b.z0 = WALL_BOUNDS.z0;
  else if (p.z < -7.2) { if (p.x > 0) b.x0 = 1.5; else b.x1 = -1.5; }
  return b;
}
function setYanggyu(world, x, z, ry) {
  world.moveNpc('yanggyu', x, z, ry);
  const m = world.npcs.get('yanggyu').mesh.position;
  m.y = heightAt(m);
}

// 양규가 앞장서 계단을 올라 성벽 위를 걷고 학생이 따라간다(1장 서희 따라 걷기와 같은 방식).
// 학생이 멀어지면 양규가 멈춰 돌아보며 기다린다. 양규가 자리에 서면 학생 자리에 빛나는 원이 뜬다.
export function followYanggyu(ctx) {
  const { world, input } = ctx;
  const yg = world.npcs.get('yanggyu'), m = yg.mesh.position;
  yg.collider.r = 0; // 좁은 성벽 위에서 학생 길을 막지 않게
  let i = 0, waiting = false;
  for (const id of [...PEOPLE, 'yanggyu']) world.npcs.get(id).mark.visible = false;
  ctx.setGoal(script.goals[2]);
  scene.ring.position.set(STAND[0], WALL_TOP + 0.05, STAND[1]);
  input.enabled = true;
  return new Promise(resolve => {
    const off = world.onUpdate(dt => {
      const p = world.player.position;
      world.bounds = climbBounds(p);
      p.y += (heightAt(p) - p.y) * Math.min(1, dt * 14);
      if (i < LEAD_PATH.length) {
        const dp = Math.hypot(p.x - m.x, p.z - m.z);
        if (waiting ? dp < WAIT_NEAR : dp > WAIT_FAR) waiting = !waiting;
        if (waiting) yg.mesh.rotation.y = Math.atan2(p.x - m.x, p.z - m.z);
        else {
          let dx = LEAD_PATH[i][0] - m.x, dz = LEAD_PATH[i][1] - m.z;
          const d = Math.hypot(dx, dz), step = LEAD_SPEED * dt;
          if (d <= step) { setYanggyu(world, LEAD_PATH[i][0], LEAD_PATH[i][1], yg.mesh.rotation.y); i += 1; }
          else { dx /= d; dz /= d; setYanggyu(world, m.x + dx * step, m.z + dz * step, Math.atan2(dx, dz)); }
          if (i === LEAD_PATH.length) { yg.mesh.rotation.y = -Math.PI / 2; scene.ring.visible = true; } // 학생 쪽을 보고 선다
        }
        world.setGoal({ x: m.x, z: m.z });
        return;
      }
      world.setGoal({ x: STAND[0], z: STAND[1] });
      if (onWall(p) && Math.hypot(p.x - STAND[0], p.z - STAND[1]) < 1.6) {
        off(); input.enabled = false; scene.ring.visible = false; world.setGoal(null);
        p.set(STAND[0], WALL_TOP, STAND[1]); world.player.rotation.y = Math.PI;
        resolve();
      }
    });
  });
}

// 이어하기로 미니게임부터 시작할 때: 학생과 양규를 성벽 위에 세운다
function putOnWall(world) {
  const yg = world.npcs.get('yanggyu');
  yg.collider.r = 0;
  setYanggyu(world, YG_POST[0], YG_POST[1], Math.PI);
  world.bounds = WALL_BOUNDS;
  placePlayer(world, STAND, Math.PI, WALL_TOP);
}

// 장 시작 장면(상시 규칙): 남쪽 성문의 문짝이 열리고 학생이 성 밖 길에서 걸어 들어온다(약 4초). 누르면 건너뛴다.
export function introWalk(ctx) {
  ctx.world.bounds = EXPLORE_BOUNDS;
  return enterThroughGate(ctx, { from: INTRO_FROM, to: scene.start, gate: scene.gate });
}

function resetLadders() {
  for (const l of scene.ladders) {
    l.group.visible = false; l.pivot.rotation.x = l.tilt;
    l.climber.visible = false; l.carrier.visible = false;
  }
  for (const r of scene.wallRings) r.visible = false;
  for (const g of scene.wallGauges) { g.visible = false; setGauge(g, 0); }
}

// 성 밖 거란군 무리(D-32): 사다리 아래로 걸어와 모이고, 세운 사다리 아래에 몰리며, 사다리가 밀려나면 함께 물러났다가 다시 다가온다.
// 걸음은 자리가 바뀌면 다리·무릎·팔이 저절로 움직인다(core/people.js). 사람마다 빠르기가 조금씩 다르다.
function makeHorde(active) {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const hs = scene.horde.map(k => {
    k.position.copy(k.userData.home); k.visible = true;
    return { k, state: 'come', tx: 0, tz: 0, wait: 0, speed: 1.2 + rnd() * 0.5, ladder: null };
  });
  const aim = (h, l) => {
    h.ladder = l; h.state = 'come';
    h.tx = clamp(l.x + (rnd() - 0.5) * 2.6, -11, 11); h.tz = GATHER_Z - rnd() * 1.8;
  };
  const pick = h => {
    const busy = [...active.keys()].filter(l => hs.filter(o => o.ladder === l).length < 5);
    aim(h, busy.length && rnd() < 0.75 ? busy[Math.floor(rnd() * busy.length)] : scene.ladders[Math.floor(rnd() * scene.ladders.length)]);
  };
  hs.forEach(pick);
  const near = (h, l) => Math.hypot(h.k.position.x - l.x, h.k.position.z + 15.5) < PUSH_BACK_R;
  return {
    raised(l) { // 사다리를 세우면 가까운 군사 몇이 그 아래로 몰려온다
      const free = hs.filter(h => h.state !== 'back').sort((a, b) => Math.abs(a.k.position.x - l.x) - Math.abs(b.k.position.x - l.x));
      for (const h of free.slice(0, 4)) aim(h, l);
    },
    pushed(l) { // 사다리와 함께 밀려나 물러난다
      for (const h of hs) if (near(h, l) || (h.ladder === l && h.state === 'wait')) {
        h.state = 'back'; h.tx = clamp(h.k.position.x + (rnd() - 0.5) * 3, -16, 16); h.tz = BACK_Z - rnd() * 4;
      }
    },
    update(dt) {
      for (const h of hs) {
        const p = h.k.position;
        if (h.state === 'wait') {
          h.wait -= dt;
          if (h.wait <= 0 && !active.has(h.ladder)) pick(h); // 이 사다리가 서 있지 않으면 다른 사다리 쪽으로
          continue;
        }
        let dx = h.tx - p.x, dz = h.tz - p.z;
        const d = Math.hypot(dx, dz), step = (h.state === 'back' ? 3.4 : h.speed) * dt;
        if (d <= step) {
          p.x = h.tx; p.z = h.tz;
          if (h.state === 'back') pick(h);
          else { h.state = 'wait'; h.wait = 2 + rnd() * 3; h.k.rotation.y = (rnd() - 0.5) * 0.4; } // 성벽을 올려다본다
          continue;
        }
        dx /= d; dz /= d;
        p.x += dx * step; p.z += dz * step;
        h.k.rotation.y = Math.atan2(dx, dz);
      }
    },
    reset() { for (const h of hs) { h.k.position.copy(h.k.userData.home); h.k.rotation.y = 0; } },
  };
}

function callLabel(world) { // 양규 머리 위 "저기다!"
  if (!scene.callLabel) {
    scene.callLabel = labelSprite(script.wall.point, { size: 0.9 });
    scene.callLabel.position.set(0, 3.2, 0); scene.callLabel.visible = false;
    world.npcs.get('yanggyu').mesh.add(scene.callLabel);
  }
  return scene.callLabel;
}

// 성벽 방어 한 번(D-8): 학생은 성벽 위를 걷는다. 거란 병사가 사다리를 세우면 양규가 "저기다!" 하고 그쪽을 가리키고
// (성벽 위 빛나는 원·화살표), 학생이 그 자리에 가까이 가면 사다리를 밀어낸다. 버튼도 멈춤도 없다.
// 성공: 사다리 10개를 밀어내거나 45초 버티기. 실패: 사다리 3개가 꼭대기까지 올라옴. 시간은 월드 시계로 잰다.
const KEEP_CLEAR = 0.9, RUN_NEAR = 2.5, RUN_SPEED = 7; // 양규와 학생 사이를 이만큼 띄운다(몸이 겹치지 않게). 학생이 이만큼 가까이 따라오면 이 빠르기로 뛴다
function wallDefense(ctx, easy) {
  const { world, hud, audio } = ctx;
  ctx.testHooks.wallAttempts = (ctx.testHooks.wallAttempts || 0) + 1;
  const spawnEvery = easy ? 5 : 3.6, climbTime = easy ? 10 : 7, duration = 45;
  resetLadders();
  world.bounds = WALL_BOUNDS;
  const p = world.player.position;
  p.set(clamp(p.x, WALL_BOUNDS.x0, WALL_BOUNDS.x1), WALL_TOP, WALK_Z);
  const yg = world.npcs.get('yanggyu'), m = yg.mesh.position, label = callLabel(world);
  let t = 0, nextSpawn = 1, blocked = 0, breaches = 0, slotSeed = 5, done = false, pointed = null, callT = 0;
  const active = new Map(), falling = new Map(), horde = makeHorde(active);
  const gauge = l => scene.wallGauges[scene.ladders.indexOf(l)];
  return new Promise(resolve => {
    const finish = ok => {
      if (done) return; done = true;
      off(); resetLadders(); horde.reset(); label.visible = false;
      hud.setTimer(null); hud.setCounter(null); world.setGoal(null);
      resolve(ok);
    };
    const push = l => {
      blocked += 1; ctx.testHooks.wallPushed = (ctx.testHooks.wallPushed || 0) + 1;
      audio.play('tap'); active.delete(l); falling.set(l, { k: 0, from: l.pivot.rotation.x });
      scene.wallRings[scene.ladders.indexOf(l)].visible = false;
      gauge(l).visible = false; horde.pushed(l);
      if (!world.player.userData.act) strike(world.player, 'push'); // 두 손으로 사다리를 밀어낸다(준비 → 밀기 → 돌아오기, 2026-10-30 움직임 개선)
    };
    const off = world.onUpdate(dt => {
      if (done) return;
      t += dt;
      hud.setTimer(duration - t);
      hud.setCounter(`밀어낸 사다리 ${blocked}/${NEED_PUSH} · 올라온 사다리 ${breaches}/3`);
      if (t >= nextSpawn) {
        nextSpawn = t + spawnEvery;
        const free = scene.ladders.filter(l => !active.has(l) && !falling.has(l) && Math.abs(l.x - p.x) >= PUSH_R + 0.6);
        if (free.length) {
          slotSeed = (slotSeed * 16807) % 2147483647;
          const l = free[slotSeed % free.length];
          l.group.visible = true; l.carrier.visible = true; l.climber.visible = false;
          l.pivot.rotation.x = l.tilt - RAISE_LEAN;
          active.set(l, { t: 0 });
          scene.wallRings[scene.ladders.indexOf(l)].visible = true;
          setGauge(gauge(l), 0); gauge(l).visible = true; horde.raised(l);
        }
      }
      for (const l of active.keys()) if (Math.abs(p.x - l.x) < PUSH_R) push(l); // 가까이 가면 밀어낸다
      horde.update(dt);
      for (const [l, a] of active) {
        a.t += dt;
        setGauge(gauge(l), a.t / (RAISE_SECONDS + climbTime)); // 다 차는 순간 이 사다리로 적이 올라온다
        if (a.t < RAISE_SECONDS) { // 사다리를 세우는 중: 뒤로 눕혀 있던 사다리가 성벽 쪽으로 일어선다
          const r = a.t / RAISE_SECONDS;
          l.pivot.rotation.x = l.tilt - RAISE_LEAN * (1 - r * r * (3 - 2 * r));
          continue;
        }
        l.pivot.rotation.x = l.tilt;
        l.climber.visible = true;
        const k = Math.min(1, (a.t - RAISE_SECONDS) / climbTime);
        l.climber.position.set(0, k * (l.len - 0.3), 0.25); // 끝에 다다르면 성가퀴 위로 몸이 드러난다
        if (a.t >= RAISE_SECONDS + climbTime) {
          breaches += 1; audio.play('wrong'); ctx.testHooks.wallBreaches = (ctx.testHooks.wallBreaches || 0) + 1;
          active.delete(l); l.group.visible = false;
          scene.wallRings[scene.ladders.indexOf(l)].visible = false; gauge(l).visible = false;
          if (breaches >= 3) return finish(false);
        }
      }
      for (const [l, f] of falling) { // 밀린 사다리는 오르던 병사와 함께 뒤로 넘어간다
        f.k += dt / FALL_SECONDS;
        l.pivot.rotation.x = f.from - 1.3 * Math.min(1, f.k * f.k);
        if (f.k >= 1) { falling.delete(l); l.group.visible = false; l.climber.visible = false; l.carrier.visible = false; }
      }
      // 양규는 가장 급한 사다리를 가리킨다: 그 사다리 너머로 걸어가 그쪽을 보고 "저기다!"
      let target = null;
      for (const [l, a] of active) if (!target || a.t > active.get(target).t) target = l;
      if (target !== pointed) {
        pointed = target;
        if (target) { callT = 1.6; ctx.testHooks.pointed = (ctx.testHooks.pointed || 0) + 1; }
      }
      callT -= dt; label.visible = callT > 0;
      // 양규는 학생 몸을 지나가지 않고(학생이 길에 있으면 그 앞에서 멈춘다), 학생이 걸어 들어오면 성벽을 따라 비켜선다(2026-10-31 자동 점검: 둘이 겹쳐 섰다)
      // 학생이 바로 뒤에 따라오거나 걸어 들어오면 학생(6.5m/s)보다 빨리 뛰어 앞서 간다(좁은 성벽이라 비켜설 곳이 없다)
      const close = Math.abs(m.x - p.x) < RUN_NEAR, run = RUN_SPEED * dt;
      let nx = m.x;
      if (target) {
        const gx = clamp(target.x + (p.x <= target.x ? 1.6 : -1.6), WALL_BOUNDS.x0, WALL_BOUNDS.x1), dx = gx - m.x, away = Math.sign(dx) === Math.sign(m.x - p.x);
        const step = (close && away ? RUN_SPEED : 3.2) * dt;
        if (Math.abs(dx) > step) nx = m.x + Math.sign(dx) * step; else nx = gx;
        if (nx !== m.x && Math.sign(nx - m.x) === Math.sign(p.x - m.x) && Math.abs(nx - p.x) < KEEP_CLEAR) nx = m.x;
      }
      if (Math.abs(m.x - p.x) < KEEP_CLEAR) { const away = Math.sign(m.x - p.x) || 1; nx = clamp(m.x + away * run, WALL_BOUNDS.x0, WALL_BOUNDS.x1); }
      if (nx !== m.x) setYanggyu(world, nx, WALK_Z, nx > m.x ? Math.PI / 2 : -Math.PI / 2);
      else if (target) yg.mesh.rotation.y = Math.atan2(target.x - m.x, -14 - m.z);
      world.setGoal(target ? { x: target.x, z: WALK_Z } : null);
      if (blocked >= NEED_PUSH || t >= duration) finish(true);
    });
  });
}

// 구한 백성 무리는 앞사람(첫 무리는 학생)을 줄지어 따라 걷는다
function followChain(world, dt) {
  let lead = world.player.position;
  for (const c of rescued) {
    const gp = c.group.position, dx = lead.x - gp.x, dz = lead.z - gp.z, d = Math.hypot(dx, dz);
    if (d > 2.2) {
      const step = Math.min(d - 2.2, Math.min(8, 2 + (d - 2.2) * 2) * dt);
      gp.x += dx / d * step; gp.z += dz / d * step;
      c.group.rotation.y = Math.atan2(dx, dz) - Math.PI; // 무리 안 사람들은 -z를 보고 서 있다
    }
    lead = gp;
  }
}

// 백성 구출 한 번: 90초 안에 네 무리 이상 구하면 성공. 구한 무리는 사라지지 않고 학생을 따라온다(D-8).
function rescue(ctx, easy) {
  const { world, hud, audio } = ctx;
  const speed = easy ? 0.3 : 0.6, duration = 90, need = 4, f = scene.field;
  rescued = [];
  const groups = scene.captives.map(c => {
    c.group.visible = true; c.escort.visible = true; c.group.children.forEach(v => setStyle(v, v === c.escort ? 'guard' : 'captive')); // 다시 하기 때 다시 끌려가는 걸음으로
    c.group.position.set(c.start[0], 0, c.start[1]); c.group.rotation.y = 0;
    return { c, state: 'walking' };
  });
  world.bounds = f.bounds;
  placePlayer(world, f.start, Math.PI);
  let t = 0, done = false;
  return new Promise(resolve => {
    const finish = ok => {
      if (done) return; done = true;
      off(); hud.setTimer(null); hud.setCounter(null); world.setGoal(null);
      resolve(ok);
    };
    const off = world.onUpdate(dt => {
      if (done) return;
      t += dt;
      hud.setTimer(duration - t);
      hud.setCounter(`구한 백성 ${rescued.length}/${need}무리`);
      const p = world.player.position;
      let nearest = null, nd = Infinity;
      for (const g of groups) {
        if (g.state !== 'walking') continue;
        const gp = g.c.group.position;
        gp.z -= speed * dt;
        const d = Math.hypot(p.x - gp.x, p.z - gp.z);
        if (d < 2.0) { g.state = 'saved'; rescued.push(g.c); g.c.escort.visible = false; g.c.group.children.forEach(v => setStyle(v, 'weary')); audio.play('correct'); } // 풀려난 백성은 지친 걸음으로 따라온다
        else if (gp.z < f.lostZ) { g.state = 'lost'; g.c.group.visible = false; }
        else if (d < nd) { nd = d; nearest = gp; }
      }
      followChain(world, dt);
      world.setGoal(nearest ? { x: nearest.x, z: nearest.z } : null);
      if (rescued.length >= need) return finish(true);
      if (t >= duration || !groups.some(g => g.state === 'walking')) finish(false);
    });
  });
}

// 구출을 마치면 구한 백성들이 학생을 따라 줄지어 성문으로 걸어 들어온다(약 4초)
async function walkHome(ctx) {
  const { world, dialogue } = ctx;
  await ctx.fade(true);
  for (const c of scene.captives) if (!rescued.includes(c)) c.group.visible = false;
  scene.gate.setOpen(1);
  world.bounds = { x0: -24, x1: 24, z0: 0, z1: 72 };
  placePlayer(world, [0, 26], Math.PI);
  rescued.forEach((c, i) => { c.group.visible = true; c.group.position.set(0, 0, 28.4 + i * 2.3); c.group.rotation.y = 0; });
  ctx.setGoal(script.goals[5]);
  await ctx.fade(false);
  await sayAll(dialogue, script.rescue.home);
  dialogue.close();
  const s0 = world.speedScale;
  world.speedScale = 0.8; world.autoMove = { x: 0, z: -1 };
  await new Promise(resolve => {
    let t = 0;
    const off = world.onUpdate(dt => {
      t += dt;
      if (world.autoMove && world.player.position.z <= 7) world.autoMove = null;
      followChain(world, dt);
      if ((!world.autoMove && t > 4.6) || t > 8) { off(); resolve(); }
    });
  });
  world.autoMove = null; world.speedScale = s0;
}

function showAftermath(ctx) {
  for (const c of scene.captives) c.group.visible = false;
  scene.khitan.visible = false;
  ctx.world.bounds = EXPLORE_BOUNDS; // 구출이 끝나면 성안으로 돌아온다(빛나는 문이 선다)
  placePlayer(ctx.world, RETURN_AT);
}

export default {
  id: 'ch2',
  mood: 'snow',
  script,
  quizzes: script.quizzes,
  stories: { gwakju: gwakjuScene, lastStand: lastStandScene }, // 이야기 장면(D-58)

  buildScene(world) {
    scene = buildCh2Scene(world); rescued = [];
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙). 장이 끝나면 world.clearLevel이 끈다
    return scene;
  },

  // 장 도입(C-03): 눈 덮인 흥화진 북쪽에서 거란 대군이 성벽 쪽으로 나아온다
  introScene(ctx) {
    const { world } = ctx, f = scene.khitanFront;
    let off = null;
    return {
      shots: [
        { cam: [0, 8.5, -3], look: [0, 1.6, -30], to: { cam: [0, 7, -8.5], look: [0, 1.8, -26] },
          act: () => { off = world.onUpdate(dt => { f.position.z += dt * 1.1; }); } },
      ],
      done: () => { off?.(); f.position.z = 0; },
    };
  },
  // 미니게임 뒤 빛나는 문(C-02): 성안 눈길 가운데, 돌아온 학생(남쪽)을 본다
  portal: { at: [0.5, 1], ry: 0 },

  enterStage(ctx, stage) {
    if (stage === 'minigame') putOnWall(ctx.world);
    if (stage === 'quiz') showAftermath(ctx);
  },

  async explore(ctx) {
    const { world, dialogue } = ctx;
    world.closeView = true;
    await introWalk(ctx);
    world.bounds = EXPLORE_BOUNDS;
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
            heard.add(id);
            if (heard.size === PEOPLE.length) { step = 1; await dialogue.say(script.next.yanggyu); } else await dialogue.say(script.more);
            setStep(ctx, step, heard);
          } else if (id === 'yanggyu') {
            await sayAll(dialogue, yanggyuTalk(heard));
            if (PEOPLE.some(k => !heard.has(k))) return; // 모두 들어야 양규가 이끈다(D-30)
            await sayAll(dialogue, script.follow);
            stop(); setTimeout(resolve, 0); // roam이 대화를 닫고 입력을 정리한 뒤에 따라 걷기를 시작한다
          }
        },
      });
    });
    await followYanggyu(ctx);
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    input.enabled = false;
    if (!(world.player.position.y > WALL_TOP - 0.2)) putOnWall(world); // 성벽 위 그 자리에서 이어서(같은 장면)
    world.bounds = WALL_BOUNDS;
    // 성벽 위 카메라: 학생 뒤 조금 위에서 성가퀴 너머를 내려다본다(사다리 끝과 오르는 거란 병사가 보이게)
    world.followOffset = new THREE.Vector3(0, 7, 5.5); world.followLookY = WALL_TOP - 1;
    world.camMode = 'follow'; world.snapCamera();
    setStep(ctx, 3);
    scene.ring.visible = false;
    await sayAll(dialogue, script.wall.start);
    dialogue.close();
    await showHowTo(ctx.ui, script.wall.howto);
    input.enabled = true;
    const a = await runWithRetries(ctx, easy => wallDefense(ctx, easy), { failHint: script.wall.failHint });
    input.enabled = false;
    await sayAll(dialogue, script.wall.done);
    dialogue.close();
    world.followOffset = null; world.followLookY = null;
    await gwakjuScene(ctx); // 이야기 장면(D-58): 양규가 곽주를 되찾는다

    await ctx.fade(true);
    scene.khitan.visible = false;
    world.bounds = scene.field.bounds;
    placePlayer(world, scene.field.start);
    // 들판에서 양규가 기다린다: 다가가 말을 걸어야 구출이 시작된다(C-05)
    const yg = world.npcs.get('yanggyu');
    setYanggyu(world, scene.field.start[0] + 2.5, scene.field.start[1] - 3, Math.PI * 0.9);
    yg.mark.visible = true;
    await ctx.fade(false);
    await waitInteract(ctx, { pos: yg.mesh.position, quest: script.goals[4], label: '양규와 이야기하기', mark: false });
    yg.mark.visible = false;
    world.setTalkCamera(yg.mesh);
    await sayAll(dialogue, script.rescue.intro);
    dialogue.close(); world.camMode = 'follow';
    setYanggyu(world, YG_POST[0], YG_POST[1], Math.PI); // 양규는 성벽 위 자리로 돌아간다
    ctx.setGoal(script.goals[5]);
    await showHowTo(ctx.ui, script.rescue.howto);
    input.enabled = true;
    const b = await runWithRetries(ctx, easy => rescue(ctx, easy), { failHint: script.rescue.failHint });
    input.enabled = false;
    await walkHome(ctx);
    await ctx.fade(true);
    showAftermath(ctx); // 들판에 멈춰 선 백성·거란 병사를 치운다(퀴즈 내내 서 있지 않게)
    await ctx.fade(false);
    await sayAll(dialogue, script.rescue.done);
    dialogue.close();
    await lastStandScene(ctx); // 끝 해설 장면(D-58): 거란군이 물러가고 양규는 끝까지 싸운다
    return { firstTryCorrect: [a, b].filter(x => x.first).length, firstTryTotal: 2, easyModeUsed: a.easyModeUsed || b.easyModeUsed };
  },
};
