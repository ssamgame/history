// 3장 「강감찬과 귀주 대첩」(D-10): 진영 남문을 열고 들어옴 → 병사·척후병 이야기를 듣고 강감찬에게 → 쇠가죽 모으기 →
// 강감찬을 따라 둑 위로 올라 "지금이다!" 하면 둑 마개로 걸어가 터뜨림 → 강감찬을 따라 귀주로 걸어가 깃발이 바뀌면 신호 북으로 → 퀴즈.
// 화면을 어둡게 넘기거나 고정 카메라로 바꾸지 않고, 낮은 따라가기 카메라(closeView) 그대로 한 장면에서 이어진다.
import { buildCh3Scene, BANK, BANK_TOP, HILL_H, bankHeight } from './scene.js';
import { leadWalk } from '../kit/lead.js';
import { roam } from '../../core/flow.js';
import { showHowTo, runWithRetries } from '../../core/minigame.js';
import { enterThroughGate } from '../kit/gate.js';
import { labelSprite } from '../kit/play.js';
import script from './script.js';

const EXPLORE_BOUNDS = { x0: -28, x1: 28, z0: -3.5, z1: 14 };
export const INTRO_FROM = [0, 31]; // 장 시작 장면: 남문 밖 길
const PEOPLE = ['soldier', 'scout']; // 이야기를 들어 볼 차례(병사 → 척후병), 그다음 강감찬
const CROSS_SECONDS = { normal: 10, easy: 14 }; // 거란군이 냇물을 다 건너는 시간(쉬운 방식은 더 천천히)
const LABEL_SECONDS = 1.6;
const SIDE_R = 1.9; // 강감찬 곁: 신호는 학생이 이 안에서 기다릴 때만 난다(D-12)
let scene = null;

async function sayAll(dialogue, lines) { for (const l of lines) await dialogue.say(l); }

function placePlayer(world, [x, z], ry = Math.PI) {
  world.player.visible = true;
  world.player.position.set(x, 0, z); world.player.rotation.y = ry;
  world.camMode = 'follow'; world.snapCamera();
}

// 강감찬의 첫 말(D-10): 아무 이야기도 안 들었으면 먼저 들어 보라 하고(막히지 않고 다시 찾아오면 된다),
// 들었으면 들은 사람의 말을 차례로 이어받아 '쇠가죽으로 물을 막아 두자'로 모은다
export function gangamchanTalk(heard) {
  const n = script.npc.gangamchan;
  if (!PEOPLE.some(id => heard.has(id))) return [...n.greet, ...n.tooEarly];
  return [...n.greet, ...PEOPLE.filter(id => heard.has(id)).map(id => n.heard[id]), ...n.plan, ...n.go];
}

// 탐험 목표: 아직 이야기를 안 들은 다음 사람에게 느낌표와 화살표, 다 들었으면 강감찬
function setStep(ctx, n, heard = new Set(PEOPLE)) {
  const { world } = ctx;
  ctx.setGoal(script.goals[n]);
  const next = n === 0 ? PEOPLE.find(id => !heard.has(id)) : n === 1 ? 'gangamchan' : null;
  for (const id of [...PEOPLE, 'gangamchan']) world.npcs.get(id).mark.visible = id === next;
  const t = next && world.npcs.get(next).mesh.position;
  if (t) world.setGoal({ x: t.x, z: t.z });
  else if (n === 3) world.setGoal({ x: scene.dam.x, z: scene.dam.z });
  else world.setGoal(null);
  scene.ring.visible = n === 3;
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
function collectHides(ctx) {
  const { world, hud, audio } = ctx;
  const gc = world.npcs.get('gangamchan'), m = gc.mesh.position, post = scene.bankPath[0];
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
          if (d < 1.4) { h.taken = true; h.mesh.visible = false; audio.play('tap'); continue; }
          left += 1;
          if (d < nd) { nd = d; nearest = h; }
        }
        hud.setCounter(`쇠가죽 ${6 - left}/6`);
        if (nearest) world.setGoal({ x: nearest.x, z: nearest.z });
        else { carrying = true; setStep(ctx, 3); }
      } else if (Math.hypot(p.x - scene.dam.x, p.z - scene.dam.z) < scene.dam.r) {
        done = true; off(); hud.setCounter(null); world.setGoal(null);
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
  const gc = world.npcs.get('gangamchan'); gc.collider.r = 0;
  world.moveNpc('gangamchan', scene.gangOnBank[0], scene.gangOnBank[1], Math.PI); // 냇물 건너 거란군을 바라본다
  gc.mesh.position.y = BANK_TOP;
  world.bounds = BANK_BOUNDS;
  placePlayer(world, [scene.stand.x, scene.stand.z]);
  world.player.position.y = BANK_TOP;
}

// 둑 터뜨리기 한 번(D-10, 버튼 없음): 거란군이 냇물을 건넌다. 무리가 냇물 한가운데에 오면(진행도 lo~hi) 강감찬이 "지금이다!" 하고
// 둑 마개(빛나는 원)를 가리키고, 학생이 마개에 가까이 가면 막은 물이 쏟아진다. 그 전에 가면 마개는 반응하지 않고 강감찬이 "아직이다!".
// 진행도 k에서 무리 가운데가 냇물 한가운데에 오는 때는 k≈0.67, 무리 전체가 물속에 있는 때는 k≈0.56~0.78이다.
export const DAM_WINDOW = { normal: [0.5, 0.82], easy: [0.42, 0.88] };
export function damAttempt(ctx, easy, fail) {
  const { world, audio } = ctx;
  const [lo, hi] = easy ? DAM_WINDOW.easy : DAM_WINDOW.normal, T = easy ? CROSS_SECONDS.easy : CROSS_SECONDS.normal;
  const plug = scene.plug, gc = world.npcs.get('gangamchan');
  scene.river.army.visible = true; scene.river.army.position.y = 0; scene.flood.hide();
  scene.river.setCross(0); plug.ring.visible = false; hush(); world.setGoal(null);
  ctx.testHooks.damNow = false;
  let t = 0, done = false, near = false, labelT = 0;
  return new Promise(resolve => {
    const finish = ok => {
      if (done) return; done = true;
      off(); plug.ring.visible = false; hush(); world.setGoal(null); ctx.testHooks.damNow = false;
      resolve(ok);
    };
    const off = world.onUpdate(dt => {
      if (done) return;
      t += dt;
      const k = Math.min(1, t / T);
      scene.river.setCross(k);
      const p = world.player.position, open = k >= lo && k <= hi;
      const at = Math.hypot(p.x - plug.x, p.z - plug.z) < plug.r, beside = byGang(world);
      if (open && !ctx.testHooks.damNow && beside) { // 강감찬이 마개 쪽을 보고 "지금이다!"
        ctx.testHooks.damNow = true; plug.ring.visible = true;
        shout(world, script.dam.now); labelT = 99;
        gc.mesh.rotation.y = Math.atan2(plug.x - gc.mesh.position.x, plug.z - gc.mesh.position.z);
        world.setGoal({ x: plug.x, z: plug.z });
      }
      if (at && ctx.testHooks.damNow) { audio.play('water'); return finish(true); }
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

// 물결이 둑에서 하류로 쏟아지고 거란군이 휩쓸린다.
function playFlood(ctx) {
  const { world } = ctx;
  scene.damWall.visible = false;
  const army = scene.river.army, a0 = army.position.clone(), SPEED = 9;
  return new Promise(resolve => {
    let t = 0, pushed = 0;
    const off = world.onUpdate(dt => {
      t += dt;
      const front = scene.damX + 1 + t * SPEED;
      scene.flood.show(front, 1 + Math.min(1, t / 2.4) * 0.35, t);
      // 물살이 거란군 무리에 닿으면 무리가 물에 밀려 아래쪽으로 떠밀리며 북쪽 강둑으로 물러난다(땅속으로 사라지지 않는다)
      if (front > a0.x - 4.4) {
        pushed = Math.min(1, pushed + dt / 1.8);
        const e = pushed * (2 - pushed);
        army.position.set(a0.x + e * 7, 0, a0.z + (scene.river.zNorth - 3 - a0.z) * e);
        army.children.forEach((k, i) => { k.rotation.x = Math.sin(pushed * Math.PI) * -0.35; k.rotation.z = Math.sin(t * 6 + i) * 0.12 * (1 - pushed); });
      }
      if (t > 3.4) { off(); scene.flood.hide(); army.children.forEach(k => { k.rotation.x = 0; k.rotation.z = 0; }); resolve(); }
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
      scene.reinforcements.position.x = Math.max(9, 30 - (t / arriveAt) * 21);
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

// 귀주 대첩: 공격 신호 뒤 고려군과 김종현의 지원군이 바람을 등지고 몰아쳐, 부딪친 거란군이 쓰러지고 나머지는 북쪽으로 달아난다(약 7초).
export function playGujuBattle(ctx) {
  const { world, audio } = ctx;
  const Z = scene.gujuZ;
  const go = scene.gujuGoryeo.map(p => p.position.clone()), kh = scene.gujuKhitan.map(p => p.position.clone());
  const rf = scene.reinforcements.position.clone();
  const CHARGE = go[0].z - kh[0].z - 3.2; // 언덕 아래 고려군이 들판을 가로질러 거란군 진까지 몰아친다(D-12: 두 군대가 멀리 떨어져 대치)
  return new Promise(resolve => {
    let t = 0, clashed = false;
    const off = world.onUpdate(dt => {
      t += dt;
      const adv = Math.min(1, t / 2.2), e = adv * adv * (3 - 2 * adv); // 돌격
      scene.gujuGoryeo.forEach((p, i) => {
        const jit = t > 2.2 && t < 4.4 ? Math.sin(t * 18 + i) * 0.25 : 0; // 맞붙어 싸운다
        p.position.set(go[i].x + jit, 0, go[i].z - e * CHARGE - Math.max(0, t - 4.4) * 1.5);
      });
      scene.reinforcements.position.set(rf.x - e * 10, 0, rf.z - e * 14); // 지원군은 옆에서 들이친다
      scene.reinforcements.children.forEach(p => { p.rotation.y = -Math.PI / 2 - e * 0.6; });
      if (t > 2.2 && !clashed) { clashed = true; audio.play('whoosh'); scene.dust.forEach(d => { d.visible = true; }); }
      scene.dust.forEach(d => {
        const k = Math.max(0, Math.min(1, (t - 2.2) / 3));
        d.material.opacity = k > 0 && k < 1 ? Math.sin(Math.PI * k) * 0.55 : 0;
        d.scale.setScalar(0.6 + k * 1.6 + Math.sin(t * 3 + d.userData.ph) * 0.15);
      });
      scene.gujuKhitan.forEach((q, i) => {
        if (t < 2.2) { q.position.z = kh[i].z + e * 1.2; return; } // 버티며 조금 나선다
        if (i % 2 === 0) q.rotation.x = -1.45 * Math.min(1, (t - 2.6 - (i % 4) * 0.2) / 0.5) * (t > 2.6 + (i % 4) * 0.2 ? 1 : 0); // 쓰러진다
        else if (t > 3.6) { q.rotation.y = Math.PI; q.position.z -= dt * 7; if (q.position.z < Z - 40) q.visible = false; } // 달아난다
      });
      if (t >= 7.2) {
        off();
        scene.dust.forEach(d => { d.visible = false; });
        resolve();
      }
    });
  });
}

function showAftermath(ctx) {
  const { world } = ctx;
  for (const h of scene.hides) { h.taken = true; h.mesh.visible = false; }
  scene.damWall.visible = true;
  scene.river.army.visible = false; scene.campEdge.visible = false;
  scene.guju.visible = true;
  for (const k of scene.gujuKhitan) k.visible = false;
  scene.reinforcements.visible = true; scene.reinforcements.position.x = 9;
  scene.setFlags(true);
  world.moveNpc('gangamchan', scene.gangAtGuju[0], scene.gangAtGuju[1], Math.PI);
  world.bounds = scene.gujuBounds;
  placePlayer(world, scene.gujuStand);
  ctx.setGoal(script.goals[7]);
}

export default {
  id: 'ch3',
  mood: 'storm',
  script,
  quizzes: script.quizzes,

  buildScene(world) {
    scene = buildCh3Scene(world); labels.clear();
    world.closeView = true; // 낮은 카메라·정면 대화(상시 규칙). 장이 끝나면 world.clearLevel이 끈다
    return scene;
  },

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
            const next = PEOPLE.find(k => !heard.has(k)) || 'gangamchan';
            await dialogue.say(script.next[next]);
            if (next === 'gangamchan') step = 1;
            setStep(ctx, step, heard);
          } else if (id === 'gangamchan') {
            await sayAll(dialogue, gangamchanTalk(heard));
            if (!PEOPLE.some(k => heard.has(k))) return;
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

    // 2. 둑 터뜨리기: 강감찬을 따라 둑 위로 올라가(같은 장면) 신호에 맞춰 마개로 걸어간다
    await sayAll(dialogue, script.dam.lead);
    dialogue.close();
    ctx.setGoal(script.goals[4]);
    await followGangamchan(ctx, { path: scene.bankPath.slice(1), stand: [scene.stand.x, scene.stand.z], bounds: { ...EXPLORE_BOUNDS, z0: BANK_BOUNDS.z0 }, face: Math.PI });
    setupDam(ctx);
    ctx.setGoal(script.goals[5]);
    await sayAll(dialogue, script.dam.start);
    dialogue.close();
    await showHowTo(ctx.ui, script.dam.howto);
    const damFail = { why: '' };
    const a = await runWithRetries(ctx, easy => { setupDam(ctx); input.enabled = true; return damAttempt(ctx, easy, damFail).finally(() => { input.enabled = false; }); }, {
      failHint: () => script.dam.late,
    });
    await playFlood(ctx);
    await sayAll(dialogue, script.dam.done);

    // 3. 귀주의 바람(D-12): 짧게 어두워졌다 밝아지며 귀주 언덕으로. 강감찬 곁에서 들판 건너 거란군 진을 내려다본다
    await sayAll(dialogue, script.guju.lead);
    dialogue.close();
    await ctx.fade(true);
    setupGuju(ctx, false);
    scene.reinforcements.visible = false;
    ctx.setGoal(script.goals[6]);
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
    for (const k of scene.gujuKhitan) k.visible = false;
    await sayAll(dialogue, script.guju.done);
    await sayAll(dialogue, script.result);
    showAftermath(ctx);
    return { firstTryCorrect: [a, b].filter(x => x.first).length, firstTryTotal: 2, easyModeUsed: a.easyModeUsed || b.easyModeUsed };
  },
};
