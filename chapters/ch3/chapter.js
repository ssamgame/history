// 3장 「강감찬과 귀주 대첩」(D-10): 진영 남문을 열고 들어옴 → 병사·척후병 이야기를 듣고 강감찬에게 → 쇠가죽 모으기 →
// 강감찬을 따라 둑 위로 올라 "지금이다!" 하면 둑 마개로 걸어가 터뜨림 → 강감찬을 따라 귀주로 걸어가 깃발이 바뀌면 신호 북으로 → 퀴즈.
// 화면을 어둡게 넘기거나 고정 카메라로 바꾸지 않고, 낮은 따라가기 카메라(closeView) 그대로 한 장면에서 이어진다.
import { buildCh3Scene, BANK, BANK_TOP, HILL_H, bankHeight } from './scene.js';
import { leadWalk } from '../kit/lead.js';
import { roam } from '../../core/flow.js';
import { showHowTo, runWithRetries } from '../../core/minigame.js';
import { enterThroughGate } from '../kit/gate.js';
import { waitInteract } from '../../core/portal.js';
import { labelSprite, toast } from '../kit/play.js';
import { setCarry, mat } from '../../core/people.js';
import * as THREE from 'three';
import { strike, block } from '../../core/interact.js';
import script from './script.js';
import { retreatScene } from './story.js';

const EXPLORE_BOUNDS = { x0: -28, x1: 28, z0: -3.5, z1: 14 };
export const INTRO_FROM = [0, 31]; // 장 시작 장면: 남문 밖 길
const RETURN_AT = [0, 10];          // 싸움이 끝난 뒤 진영으로 돌아온 학생 자리
const PEOPLE = ['soldier', 'scout']; // 이야기를 들어 볼 차례(병사 → 척후병), 그다음 강감찬
const CROSS_SECONDS = { normal: 9, easy: 14 }; // 거란군이 냇물을 다 건너는 시간(쉬운 방식은 더 천천히)
const LABEL_SECONDS = 1.6;
const SIDE_R = 1.9; // 강감찬 곁: 신호는 학생이 이 안에서 기다릴 때만 난다(D-12)
let scene = null;

async function sayAll(dialogue, lines) { for (const l of lines) await dialogue.say(l); }

function placePlayer(world, [x, z], ry = Math.PI) {
  world.player.visible = true;
  world.player.position.set(x, 0, z); world.player.rotation.y = ry;
  world.camMode = 'follow'; world.snapCamera();
}

// 강감찬의 첫 말(D-10/D-30): 모두 듣기 전에는 마저 듣고 오라 하고(막히지 않고 다시 찾아오면 된다),
// 모두 들었으면 들은 사람의 말을 차례로 이어받아 '쇠가죽으로 물을 막아 두자'로 모은다
export function gangamchanTalk(heard) {
  const n = script.npc.gangamchan;
  if (PEOPLE.some(id => !heard.has(id))) return n.wait; // 모두 들어야 진행(D-30)
  return [...n.greet, ...PEOPLE.filter(id => heard.has(id)).map(id => n.heard[id]), ...n.plan, ...n.go];
}

// 탐험 목표(D-30): 아직 안 들은 사람 모두에게 느낌표, 화살표는 그중 첫째. 모두 들었으면 강감찬에게만
function setStep(ctx, n, heard = new Set(PEOPLE)) {
  const { world, hud } = ctx;
  ctx.setGoal(script.goals[n]);
  const left = PEOPLE.filter(id => !heard.has(id));
  for (const id of PEOPLE) world.npcs.get(id).mark.visible = n === 0 && left.includes(id);
  world.npcs.get('gangamchan').mark.visible = n === 1;
  const next = n === 0 ? left[0] : n === 1 ? 'gangamchan' : null;
  const t = next && world.npcs.get(next).mesh.position;
  if (t) world.setGoal({ x: t.x, z: t.z });
  else if (n === 3) world.setGoal({ x: scene.dam.x, z: scene.dam.z });
  else world.setGoal(null);
  scene.ring.visible = n === 3;
  hud.setCounter(n === 0 ? `들은 이야기 ${heard.size}/${PEOPLE.length}` : null);
}

// 강감찬 머리 위 짧은 외침("지금이다!", "아직이다!" 등). 놀이를 멈추지 않는다
const labels = new Map();
function shout(world, text) {
  if (!labels.has(text)) {
    const s = labelSprite(text, { size: 0.9 }); s.position.set(0, 3.2, 0); s.visible = false;
    world.npcs.get('gangamchan').mesh.add(s); labels.set(text, s);
  }
  for (const [k, s] of labels) s.visible = k === text;
  return labels.get(text);
}
function hush() { for (const s of labels.values()) s.visible = false; }
function byGang(world) { const p = world.player.position, m = world.npcs.get('gangamchan').mesh.position; return Math.hypot(p.x - m.x, p.z - m.z) < SIDE_R; }

// 강감찬이 앞장서 걷고 학생이 따라간다(공용 leadWalk, 1·2장과 같은 방식). 둑 위에서는 둑 높이에 선다
async function followGangamchan(ctx, { path, stand, bounds, face }) {
  ctx.world.bounds = bounds;
  await leadWalk(ctx, { id: 'gangamchan', path, stand, ring: scene.ring, face, heightAt: bankHeight });
  ctx.world.player.rotation.y = Math.PI;
}

// 장 시작 장면(상시 규칙): 진영 남문의 문짝이 열리고 학생이 문 밖 길에서 걸어 들어온다(약 4초). 누르면 건너뛴다.
export function introWalk(ctx) {
  ctx.world.bounds = EXPLORE_BOUNDS;
  return enterThroughGate(ctx, { from: INTRO_FROM, to: scene.start, gate: scene.gate, speed: 1 });
}

// 쇠가죽 6개를 주워 둑으로 가져간다. 실패는 없다. 그동안 강감찬은 둑 옆으로 걸어가 기다린다.
// 주운 쇠가죽은 접어서 어깨에 메고 다닌다(D-18): 한 장 주울 때마다 묶음이 두툼해진다
function hideBundle() {
  const g = new THREE.Group(); g.name = 'hideBundle';
  for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.07, 0.5), mat([0x8a5a3a, 0x7a4e32, 0x94643f][k % 3])); m.position.y = k * 0.07; m.rotation.y = (k % 2) * 0.25; m.visible = false; m.castShadow = true; g.add(m); }
  return g;
}
export function collectHides(ctx) {
  const { world, hud, audio } = ctx;
  const gc = world.npcs.get('gangamchan'), m = gc.mesh.position, post = scene.bankPath[0];
  const bundle = hideBundle();
  return new Promise(resolve => {
    let carrying = false, done = false;
    const off = world.onUpdate(dt => {
      if (done) return;
      const gx = post[0] - m.x, gz = post[1] - m.z, gd = Math.hypot(gx, gz);
      if (gd > 0.05) { const st = Math.min(gd, 3 * dt); world.moveNpc('gangamchan', m.x + gx / gd * st, m.z + gz / gd * st, Math.atan2(gx, gz)); }
      const p = world.player.position;
      if (!carrying) {
        let nearest = null, nd = Infinity, left = 0;
        for (const h of scene.hides) {
          if (h.taken) continue;
          const d = Math.hypot(p.x - h.x, p.z - h.z);
          if (d < 1.4) {
            h.taken = true; h.mesh.visible = false; audio.play('tap');
            bundle.children[scene.hides.filter(x => x.taken).length - 1].visible = true;
            if (world.player.userData.carry?.obj !== bundle) setCarry(world.player, bundle, 'shoulder');
            continue;
          }
          left += 1;
          if (d < nd) { nd = d; nearest = h; }
        }
        hud.setCounter(`쇠가죽 ${6 - left}/6`);
        if (nearest) world.setGoal({ x: nearest.x, z: nearest.z });
        else { carrying = true; setStep(ctx, 3); }
      } else if (Math.hypot(p.x - scene.dam.x, p.z - scene.dam.z) < scene.dam.r) {
        done = true; off(); hud.setCounter(null); world.setGoal(null);
        setCarry(world.player, null); // 둑에 내려놓는다
        world.moveNpc('gangamchan', post[0], post[1], Math.atan2(p.x - post[0], p.z - post[1]));
        scene.ring.visible = false; scene.damWall.visible = true; audio.play('correct');
        resolve();
      }
    });
  });
}

// 둑 위에 학생과 강감찬을 세운다(놀이 2의 시작 자리, 다시 하기 때마다)
const BANK_BOUNDS = { x0: BANK.x0 + 0.6, x1: BANK.x1 - 2.6, z0: -4.2, z1: -3.0 };
export function setupDam(ctx) {
  const { world } = ctx;
  scene.damWall.visible = true;
  for (const h of scene.hides) { h.taken = true; h.mesh.visible = false; }
  const gc = world.npcs.get('gangamchan');
  world.moveNpc('gangamchan', scene.gangOnBank[0], scene.gangOnBank[1], Math.PI); // 냇물 건너 거란군을 바라본다
  gc.collider.r = 0.45; // 둑 위에서는 학생이 몸을 지나가지 않게
  gc.mesh.position.y = BANK_TOP;
  world.bounds = BANK_BOUNDS;
  placePlayer(world, [scene.stand.x, scene.stand.z]);
  world.player.position.y = BANK_TOP;
}

// 둑 터뜨리기 한 번(D-10, 버튼 없음): 거란군이 냇물을 건넌다. 무리가 냇물 한가운데에 오면(진행도 lo~hi) 강감찬이 "지금이다!" 하고
// 둑 마개(빛나는 원)를 가리키고, 학생이 마개에 가까이 가면 막은 물이 쏟아진다. 그 전에 가면 마개는 반응하지 않고 강감찬이 "아직이다!".
// 진행도 k에서 무리 가운데가 냇물 한가운데에 오는 때는 k≈0.67, 무리 전체가 물속에 있는 때는 k≈0.56~0.78이다.
export const DAM_WINDOW = { normal: [0.6, 0.86], easy: [0.45, 0.9] }; // 2026-11-05 조금 더 어렵게: 무리가 많이 들어온 뒤에 신호, 짧은 틈
// 지금 냇물(두 둑 사이) 안에 있는 거란군 수. 많이 들어왔을 때 터뜨릴수록 많이 휩쓸린다(2026-11-05 선생님)
export function riverCount() {
  const { army, zNorth, zSouth } = scene.river;
  return army.children.filter(k => { const z = army.position.z + k.position.z; return z >= zNorth && z <= zSouth; }).length;
}
const meter = (n, all) => `냇물 속 거란군 ${'■'.repeat(n)}${'□'.repeat(all - n)} ${n}/${all}`;
export function damAttempt(ctx, easy, fail) {
  const { world, audio, hud } = ctx;
  const [lo, hi] = easy ? DAM_WINDOW.easy : DAM_WINDOW.normal, T = easy ? CROSS_SECONDS.easy : CROSS_SECONDS.normal;
  const plug = scene.plug, gc = world.npcs.get('gangamchan');
  scene.river.army.visible = true; scene.river.army.position.y = 0; scene.flood.hide();
  for (const k of scene.river.army.children) { k.visible = true; k.userData.swept = null; k.position.copy(k.userData.home); k.rotation.set(0, 0, 0); } // 쓸려 간 군사를 제자리로(다시 하기)
  scene.river.setCross(0); plug.ring.visible = false; hush(); world.setGoal(null);
  ctx.testHooks.damNow = false;
  let t = 0, done = false, near = false, labelT = 0;
  return new Promise(resolve => {
    const finish = ok => {
      if (done) return; done = true;
      off(); plug.ring.visible = false; hush(); world.setGoal(null); ctx.testHooks.damNow = false; hud.setCounter(null);
      resolve(ok);
    };
    const off = world.onUpdate(dt => {
      if (done) return;
      t += dt;
      const k = Math.min(1, t / T);
      scene.river.setCross(k);
      hud.setCounter(meter(riverCount(), scene.river.army.children.length));
      const p = world.player.position, open = k >= lo && k <= hi;
      const at = Math.hypot(p.x - plug.x, p.z - plug.z) < plug.r, beside = byGang(world);
      if (open && !ctx.testHooks.damNow && beside) { // 강감찬이 마개 쪽을 보고 "지금이다!"
        ctx.testHooks.damNow = true; plug.ring.visible = true;
        shout(world, script.dam.now); labelT = 99;
        gc.mesh.rotation.y = Math.atan2(plug.x - gc.mesh.position.x, plug.z - gc.mesh.position.z);
        world.setGoal({ x: plug.x, z: plug.z });
      }
      if (at && ctx.testHooks.damNow) { ctx.testHooks.damCaught = riverCount(); audio.play('water'); return finish(true); }
      if (at && !near && !ctx.testHooks.damNow) { // 신호 전에 마개로 오면: "내 곁에서 기다려라" 하고 강감찬 곁으로 화살표
        ctx.testHooks.damTooEarly = (ctx.testHooks.damTooEarly || 0) + 1; shout(world, script.dam.wait); labelT = 99;
        world.setGoal({ x: scene.stand.x, z: scene.stand.z });
      }
      if (!ctx.testHooks.damNow && beside && labelT > 50) { hush(); labelT = 0; world.setGoal(null); } // 곁으로 돌아왔다
      near = at;
      labelT -= dt; if (labelT <= 0) hush();
      if (k > hi) { fail.why = 'late'; finish(false); }
    });
  });
}

// 물결이 둑에서 하류로 쏟아지고 거란군이 휩쓸린다. 물살에 닿은 군사는 하나씩 아래쪽으로 떠밀려 가며 뒹굴다 물속으로 사라진다(D-62, 2026-10-31 선생님)
export function playFlood(ctx) {
  const { world } = ctx;
  scene.damWall.visible = false;
  const army = scene.river.army, a0 = army.position.clone(), SPEED = 9, { zNorth, zSouth } = scene.river;
  for (const k of army.children) { const z = army.position.z + k.position.z; k.userData.dry = z < zNorth || z > zSouth; } // 둑 밖(물 밖)에 있던 군사는 휩쓸리지 않는다
  const caught = army.children.filter(k => k.visible && !k.userData.dry).length, all = army.children.length;
  toast(ctx, caught >= all ? `대성공! 거란군 ${caught}명이 모두 물에 휩쓸린다!` : `거란군 ${caught}명이 물에 휩쓸린다!`, 'good'); ctx.testHooks.floodToast = caught; // 물이 쏟아지는 동안(대화창이 열리기 전) 보인다
  return new Promise(resolve => {
    let t = 0, pushed = 0;
    const off = world.onUpdate(dt => {
      t += dt;
      const front = scene.damX + 1 + t * SPEED;
      scene.flood.show(front, 1 + Math.min(1, t / 2.4) * 0.35, t);
      // 물살 앞이 닿은 군사부터 아래쪽(+x)으로 빨라지며 떠밀리고, 뒹굴며 가라앉다가 화면 밖에서 사라진다
      army.children.forEach((k, i) => {
        if (!k.visible || k.userData.dry) return;
        const wx = army.position.x + k.position.x;
        if (!k.userData.swept && front > wx - 0.5) { k.userData.swept = { v: 2, t: 0, spin: (i % 2 ? 1 : -1) * (2 + (i % 3)) }; }
        const w = k.userData.swept; if (!w) return;
        w.t += dt; w.v = Math.min(SPEED * 1.1, w.v + dt * 7);
        k.position.x += w.v * dt; k.position.z += Math.sin(t * 3 + i) * 0.6 * dt;
        k.rotation.x = Math.min(1.4, w.t * 1.6); k.rotation.z = Math.sin(w.t * w.spin) * 0.5; k.rotation.y += dt * w.spin * 0.6; // 넘어져 뒹군다
        k.position.y = -Math.min(1.6, w.t * 0.55) + Math.sin(w.t * 5) * 0.08; // 물에 잠긴다
        if (w.t > 2.2 || k.position.x - k.userData.home.x > 16) { k.visible = false; pushed++; } // 쓸려 가 사라진다
      });
      if (t > 3.4 || (t > 1 && army.children.every(k => !k.visible || k.userData.dry))) { off(); scene.flood.hide(); army.children.forEach(k => { k.visible = false; }); resolve(); }
    });
  });
}

// 귀주 벌판에 학생과 강감찬을 세운다(놀이 3의 시작 자리, 다시 하기 때마다). 쉬운 방식은 신호 북이 더 가깝다
export function setupGuju(ctx, easy) {
  const { world } = ctx;
  scene.guju.visible = true;
  scene.drum.place(easy ? 1.5 : 5);
  scene.river.army.visible = false; // 삼교천의 거란군과 진영 울타리는 귀주 장면에서 보이지 않게
  scene.campEdge.visible = false;
  world.moveNpc('gangamchan', scene.gangAtGuju[0], scene.gangAtGuju[1], Math.PI);
  world.npcs.get('gangamchan').collider.r = 0;
  world.npcs.get('gangamchan').mesh.position.y = HILL_H;
  world.bounds = scene.gujuBounds;
  placePlayer(world, scene.gujuStand);
  world.player.position.y = HILL_H;
}
// 귀주의 바람 한 번(D-10, 버튼 없음): 김종현의 지원군이 오고 깃발이 북쪽으로 휘날리는 동안(3초, 쉬운 방식 5초)
// 강감찬이 "지금이다!" 하고 신호 북(빛나는 원)을 가리키고, 학생이 북에 가까이 가면 북이 울린다. 그 전에 가면 "깃발을 보아라!".
let gujuSeed = 7;
const REINF_X = 13.5; // 지원군이 멈추는 자리: 고려군 줄(x -11~11) 오른쪽 바깥(2026-11-05 선생님: 돌격 때 고려군끼리 몸이 겹쳐 지나갔다)
export function gujuAttempt(ctx, easy, fail) {
  const { world, hud, audio } = ctx;
  gujuSeed = (gujuSeed * 16807) % 2147483647;
  const arriveAt = 3 + (gujuSeed % 3000) / 1000, open = easy ? 5 : 3, drum = scene.drum, gc = world.npcs.get('gangamchan');
  scene.setFlags(false); drum.ring.visible = false; hush(); world.setGoal(null);
  scene.reinforcements.visible = true; scene.reinforcements.position.x = 30;
  ctx.testHooks.drumNow = false;
  let t = 0, done = false, announced = false, flags = false, near = false, labelT = 0;
  return new Promise(resolve => {
    const finish = ok => {
      if (done) return; done = true;
      off(); hud.setCounter(null); drum.ring.visible = false; hush(); world.setGoal(null); ctx.testHooks.drumNow = false;
      resolve(ok);
    };
    const off = world.onUpdate(dt => {
      if (done) return;
      t += dt;
      scene.reinforcements.position.x = Math.max(REINF_X, 30 - (t / arriveAt) * (30 - REINF_X));
      if (t >= arriveAt && !flags) { flags = true; scene.setFlags(true); hud.setCounter(script.guju.arrive); }
      if (flags && !announced && byGang(world)) {
        announced = true;
        ctx.testHooks.drumNow = true; drum.ring.visible = true;
        shout(world, script.guju.now); labelT = 99;
        gc.mesh.rotation.y = Math.atan2(drum.x - gc.mesh.position.x, drum.z - gc.mesh.position.z);
        world.setGoal({ x: drum.x, z: drum.z });
      }
      const p = world.player.position, at = Math.hypot(p.x - drum.x, p.z - drum.z) < drum.r;
      if (at && announced) { audio.play('whoosh'); return finish(true); }
      if (at && !near && !announced) { // 신호 전에 북으로 오면: "깃발을 보아라. 내 곁에서 기다려라" 하고 강감찬 곁으로 화살표
        ctx.testHooks.drumTooEarly = (ctx.testHooks.drumTooEarly || 0) + 1; shout(world, script.guju.wait); labelT = 99;
        world.setGoal({ x: scene.gujuStand[0], z: scene.gujuStand[1] });
      }
      if (!announced && byGang(world) && labelT > 50) { hush(); labelT = 0; world.setGoal(null); }
      near = at;
      labelT -= dt; if (labelT <= 0) hush();
      if (flags && t > arriveAt + open) { fail.why = 'late'; scene.setFlags(false); finish(false); }
    });
  });
}

// 귀주 대첩: 공격 신호 뒤 고려군과 김종현의 지원군이 바람을 등지고 몰아친다(약 8초 안).
// 짝지어 맞붙기(D-63, 2026-11-03 선생님: 예전엔 몸을 좌우로만 흔들었다): 고려군 하나와 거란군 하나가 마주 서서 창으로 찌르고, 막고, 되받아친다.
// 두 번째로 찔린 거란군 절반은 뒤로 쓰러지고 나머지는 돌아서 북쪽으로 달아난다. 지원군은 옆에서 들이쳐 오른쪽 거란군을 친다
export function playGujuBattle(ctx) {
  const { world, audio } = ctx;
  const Z = scene.gujuZ;
  const G = scene.gujuGoryeo, K = scene.gujuKhitan, R = scene.reinforcements.children;
  const go = G.map(p => p.position.clone()), kh = K.map(p => p.position.clone());
  const rf = scene.reinforcements.position.clone();
  const CHARGE = go[0].z - kh[0].z - 2.8; // 언덕 아래 고려군이 들판을 가로질러 짝이 된 거란군 바로 앞까지 몰아친다(D-12: 두 군대가 멀리 떨어져 대치)
  const hook = ctx.testHooks.gujuBattle = { goryeoStrikes: 0, khitanStrikes: 0, blocks: 0, reinforceStrikes: 0 };
  world.storyOn = true; world.setFixedCamera([17, 10, Z + 13], [1, 1, Z - 9]); // 보기만 하는 장면: 언덕 옆 높은 곳에서 두 군대가 맞붙는 들판을 본다(2026-11-08: 북 앞만 비추던 것)
  // 짝마다 조금씩 다른 때에(한꺼번에 똑같이 움직이지 않게): [때, 누가, 무엇]
  const plan = [];
  G.forEach((g, i) => {
    const s = (i % 4) * 0.22 + (i % 3) * 0.07, k = K[i];
    plan.push([2.3 + s, g, 'spear', 'g'], [2.36 + s, k, 'block']); // 고려군이 찌르고 거란군이 막는다
    if (i % 3 !== 1) plan.push([3.0 + s, k, 'spear', 'k'], [3.06 + s, g, 'block']); // 거란군이 되받아치고 고려군이 막는다
    plan.push([3.7 + s, g, 'spear', 'g']); // 다시 찌른다: 짝수는 쓰러지고 홀수는 달아난다
    k.userData.fallAt = i % 2 === 0 ? 3.95 + s : null; k.userData.fleeAt = i % 2 === 0 ? null : 4.2 + s;
  });
  R.forEach((r, i) => plan.push([3.2 + (i % 4) * 0.25, r, 'spear', 'r'], [4.3 + (i % 3) * 0.2, r, 'spear', 'r'])); // 지원군도 찌른다
  plan.sort((a, b) => a[0] - b[0]);
  return new Promise(resolve => {
    let t = 0, clashed = false, next = 0;
    const off = world.onUpdate(dt => {
      t += dt;
      const adv = Math.min(1, t / 2.2), e = adv * adv * (3 - 2 * adv); // 돌격
      const lunge = q => { const a = (t - (q.userData.hitAt ?? -9)) / 0.6; return a > 0 && a < 1 ? Math.sin(Math.PI * a) * 0.45 : 0; }; // 찌를 때 한 걸음 내디뎠다 돌아온다
      G.forEach((p, i) => { p.position.set(go[i].x, 0, go[i].z - e * CHARGE - Math.max(0, t - 4.6) * 1.5 - lunge(p)); }); // 앞뒤로만 나아간다(옆으로 흔들지 않는다), 거란군이 무너지면 뒤쫓는다
      scene.reinforcements.position.set(Math.max(REINF_X, rf.x - e * 10), 0, rf.z - e * 14); // 지원군은 고려군 줄 바깥에서 곧게 들이쳐 거란군 오른쪽 끝을 친다(고려군 줄을 가로지르지 않는다)
      R.forEach(p => { p.rotation.y = -Math.PI / 2 - e * (Math.PI / 2 - 0.35); }); // 옆을 보던 지원군이 앞(북쪽)으로 돌아선다
      while (next < plan.length && plan[next][0] <= t) {
        const [, who, what, side] = plan[next++];
        if (!who.visible || who.rotation.x < -0.2) continue;
        if (what === 'block') { block(who, 0.55); hook.blocks += 1; }
        else { strike(who, 'spear'); who.userData.hitAt = t; if (side === 'g') hook.goryeoStrikes += 1; else if (side === 'k') hook.khitanStrikes += 1; else hook.reinforceStrikes += 1; if (next % 3 === 0) audio.play('whoosh'); }
      }
      if (t > 2.2 && !clashed) { clashed = true; audio.play('whoosh'); scene.dust.forEach(d => { d.visible = true; }); }
      scene.gujuFires.forEach((f, i) => f.setLevel((t - 2.6 - i * 0.6) / 1.4)); // 거란 진영 천막에 불이 붙는다(D-16)
      scene.dust.forEach(d => {
        const k = Math.max(0, Math.min(1, (t - 2.2) / 3.4));
        d.material.opacity = k > 0 && k < 1 ? Math.sin(Math.PI * k) * 0.45 : 0;
        d.scale.setScalar(0.6 + k * 1.6 + Math.sin(t * 3 + d.userData.ph) * 0.15);
      });
      K.forEach((q, i) => {
        const u = q.userData;
        if (t < 2.2) { q.position.z = kh[i].z + e * 1.2; return; } // 버티며 조금 나선다
        if (u.fleeAt == null || t < u.fleeAt) q.position.z = kh[i].z + 1.2 + lunge(q); // 되받아칠 때 내디딘다
        if (u.fallAt != null && t > u.fallAt) q.rotation.x = -1.45 * Math.min(1, (t - u.fallAt) / 0.5); // 찔려 뒤로 쓰러진다
        else if (u.fleeAt != null && t > u.fleeAt) { q.rotation.y = Math.PI; q.position.z -= dt * 8; if (q.position.z < Z - 40) q.visible = false; } // 돌아서 달아난다
      });
      if (t >= 7.8) {
        off();
        scene.dust.forEach(d => { d.visible = false; });
        resolve();
      }
    });
  });
}

// 싸움이 끝난 뒤: 학생은 삼교천 진영으로 돌아온다(빛나는 문이 선다). 거란군은 없고 둑 쇠가죽만 남는다
function showAftermath(ctx) {
  const { world } = ctx;
  for (const h of scene.hides) { h.taken = true; h.mesh.visible = false; }
  scene.damWall.visible = true; scene.flood.hide();
  scene.river.army.visible = false; scene.campEdge.visible = true;
  scene.guju.visible = false;
  scene.setFlags(false);
  const gc = world.npcs.get('gangamchan'); gc.collider.r = 0;
  world.moveNpc('gangamchan', -8, 6.5, Math.PI * 0.2); gc.mesh.position.y = 0;
  world.bounds = EXPLORE_BOUNDS;
  placePlayer(world, RETURN_AT);
}

export default {
  id: 'ch3',
  mood: 'storm',
  script,
  quizzes: script.quizzes,
  stories: { retreat: retreatScene }, // 이야기 장면(D-58)

  buildScene(world) {
    scene = buildCh3Scene(world); labels.clear();
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙). 장이 끝나면 world.clearLevel이 끈다
    return scene;
  },

  // 장 도입(C-03): ① 비바람 속 북쪽 강둑에서 거란 대군이 냇물 쪽으로 나아오고 ② 진영의 강감찬이 맞설 채비를 한다
  introScene(ctx) {
    const { world } = ctx, r = scene.river;
    let off = null;
    return {
      shots: [
        { cam: [-9, 8.5, 5], look: [1.5, 1, -21], to: { cam: [-5, 6, 0], look: [1.5, 1.2, -17] }, // 높이서 대군 전체를
          act: () => { scene.introHost.group.visible = true; let k = 0; off = world.onUpdate(dt => { k = Math.min(0.28, k + dt * 0.03); r.setCross(k); }); } }, // 냇물 북쪽을 메운 소배압 대군(D-62)
        { cam: [-1, 2.5, 10.5], look: [-4, 2.1, 5], to: { cam: [-2.2, 2.4, 9.2], look: [-4, 2.2, 5] },
          act: () => { off?.(); off = null; r.setCross(0); } },
      ],
      done: () => { off?.(); r.setCross(0); scene.introHost.group.visible = false; },
    };
  },
  // 미니게임 뒤 빛나는 문(C-02): 진영 가운데 빈 땅, 돌아온 학생(남쪽)을 본다
  portal: { at: [0, 4], ry: 0 },
  spawn: () => ({ at: INTRO_FROM, to: scene.start, gate: scene.gate }), // 도착 연출 자리(타임머신 틀, 2026-11-09): 탐험이 시작되는 곳(문 밖 길)과 같게

  enterStage(ctx, stage) {
    if (stage === 'minigame') { ctx.world.bounds = EXPLORE_BOUNDS; placePlayer(ctx.world, scene.start); }
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
            if (heard.size === PEOPLE.length) { step = 1; await dialogue.say(script.next.gangamchan); } else await dialogue.say(script.more);
            setStep(ctx, step, heard);
          } else if (id === 'gangamchan') {
            await sayAll(dialogue, gangamchanTalk(heard));
            if (PEOPLE.some(k => !heard.has(k))) return; // 모두 들어야 강감찬이 이끈다(D-30)
            stop(); setTimeout(resolve, 0); // roam이 대화를 닫고 입력을 정리한 뒤에 넘어간다
          }
        },
      });
    });
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    world.closeView = true;
    // 1. 쇠가죽 모으기
    setStep(ctx, 2);
    for (const k of [...PEOPLE, 'gangamchan']) world.npcs.get(k).mark.visible = false;
    world.bounds = EXPLORE_BOUNDS;
    await showHowTo(ctx.ui, script.hides.howto);
    input.enabled = true;
    await collectHides(ctx);
    input.enabled = false;
    await sayAll(dialogue, script.hides.built);

    // 2. 둑 터뜨리기: 강감찬에게 말을 걸면 둑 위로 이끈다(C-05). 신호에 맞춰 마개로 걸어간다
    const gc = world.npcs.get('gangamchan'); gc.collider.r = 0; // 다가가 말을 걸 수 있게(둑 위로 이끌 때도 길을 막지 않는다)
    dialogue.close();
    gc.mark.visible = true;
    await waitInteract(ctx, { pos: gc.mesh.position, quest: script.goals[4], label: '강감찬과 이야기하기', mark: false });
    gc.mark.visible = false;
    world.setTalkCamera(gc.mesh);
    await sayAll(dialogue, script.dam.lead);
    dialogue.close(); world.camMode = 'follow';
    ctx.setGoal(script.goals[5]);
    await followGangamchan(ctx, { path: scene.bankPath.slice(1), stand: [scene.stand.x, scene.stand.z], bounds: { ...EXPLORE_BOUNDS, z0: BANK_BOUNDS.z0 }, face: Math.PI });
    setupDam(ctx);
    ctx.setGoal(script.goals[6]);
    await sayAll(dialogue, script.dam.start);
    dialogue.close();
    await showHowTo(ctx.ui, script.dam.howto);
    const damFail = { why: '' };
    const a = await runWithRetries(ctx, easy => { setupDam(ctx); input.enabled = true; return damAttempt(ctx, easy, damFail).finally(() => { input.enabled = false; }); }, {
      failHint: () => script.dam.late, easyAfter: 2,
    });
    await playFlood(ctx);
    await sayAll(dialogue, script.dam.done);

    dialogue.close();
    // 3. 귀주의 바람(D-12): 강감찬에게 말을 걸면(C-05) 짧게 어두워졌다 밝아지며 귀주 언덕으로. 강감찬 곁에서 들판 건너 거란군 진을 내려다본다
    gc.mark.visible = true;
    await waitInteract(ctx, { pos: gc.mesh.position, quest: script.goals[7], label: '강감찬과 이야기하기', mark: false });
    gc.mark.visible = false;
    world.setTalkCamera(gc.mesh);
    await sayAll(dialogue, script.guju.lead);
    dialogue.close(); world.camMode = 'follow';
    await ctx.fade(true);
    setupGuju(ctx, false);
    scene.reinforcements.visible = false;
    ctx.setGoal(script.goals[8]);
    await ctx.fade(false);
    await sayAll(dialogue, script.guju.intro);
    await sayAll(dialogue, script.guju.start);
    dialogue.close();
    await showHowTo(ctx.ui, script.guju.howto);
    const gujuFail = { why: '' };
    const b = await runWithRetries(ctx, easy => { setupGuju(ctx, easy); input.enabled = true; return gujuAttempt(ctx, easy, gujuFail).finally(() => { input.enabled = false; }); }, {
      failHint: () => script.guju.late,
    });
    await sayAll(dialogue, script.guju.charge); dialogue.close();
    await playGujuBattle(ctx); // 깃발이 북쪽으로 휘날리자 고려군이 몰아쳐 이긴다
    world.storyOn = false; world.camMode = 'follow';
    for (const k of scene.gujuKhitan) k.visible = false;
    await sayAll(dialogue, script.guju.done);
    dialogue.close();
    await retreatScene(ctx); // 이야기 장면(D-58): 물러가는 거란군과 기뻐하는 고려군
    await sayAll(dialogue, script.result);
    dialogue.close();
    await ctx.fade(true);
    showAftermath(ctx);
    await ctx.fade(false);
    return { firstTryCorrect: [a, b].filter(x => x.first).length, firstTryTotal: 2, easyModeUsed: a.easyModeUsed || b.easyModeUsed };
  },
};
