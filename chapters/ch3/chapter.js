// 3장 「강감찬과 귀주 대첩」: 진영 탐험 → 쇠가죽 모으기 → 둑 터뜨리기 → 귀주의 바람 → 퀴즈.
import { buildCh3Scene } from './scene.js';
import { roam } from '../../core/flow.js';
import { showHowTo, runWithRetries, actionButton } from '../../core/minigame.js';
import script from './script.js';

const EXPLORE_BOUNDS = { x0: -28, x1: 28, z0: -3.5, z1: 14 };
const CROSS_SECONDS = 10;
let scene = null;

async function sayAll(dialogue, lines) { for (const l of lines) await dialogue.say(l); }

function placePlayer(world, [x, z], ry = Math.PI) {
  world.player.visible = true;
  world.player.position.set(x, 0, z); world.player.rotation.y = ry;
  world.camMode = 'follow'; world.snapCamera();
}

function setStep(ctx, n) {
  const { world } = ctx;
  ctx.setGoal(script.goals[n]);
  world.npcs.get('gangamchan').mark.visible = n === 0;
  world.npcs.get('soldier').mark.visible = n === 1;
  scene.ring.visible = n === 3;
  const t = [world.npcs.get('gangamchan').mesh.position, world.npcs.get('soldier').mesh.position][n];
  if (t) world.setGoal({ x: t.x, z: t.z });
  else if (n === 3) world.setGoal({ x: scene.dam.x, z: scene.dam.z });
}

// 쇠가죽 6개를 주워 둑으로 가져간다. 실패는 없다.
function collectHides(ctx) {
  const { world, hud, audio } = ctx;
  return new Promise(resolve => {
    let carrying = false, done = false;
    const off = world.onUpdate(() => {
      if (done) return;
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
        scene.ring.visible = false; scene.damWall.visible = true; audio.play('correct');
        resolve();
      }
    });
  });
}

// 거란군이 냇물 한가운데에 왔을 때 둑을 터뜨린다. 진행도 k에서 거란군 무리(앞줄·뒷줄)의 가운데가 냇물 한가운데에 오는 때는 k≈0.67,
// 무리 전체가 물속에 있는 때는 k≈0.56~0.78이다. 판정 칸은 그 둘레(0.5~0.82, 쉬운 모드 0.42~0.88)로 화면에 보이는 모습과 맞춘다.
export const DAM_WINDOW = { normal: [0.5, 0.82], easy: [0.42, 0.88] };
function damAttempt(ctx, easy, fail) {
  const { world, audio } = ctx;
  const [lo, hi] = easy ? DAM_WINDOW.easy : DAM_WINDOW.normal;
  scene.river.army.visible = true; scene.river.army.position.y = 0; scene.wave.visible = false;
  scene.river.setCross(0);
  const btn = actionButton(ctx, '둑 터뜨리기');
  let t = 0, done = false;
  return new Promise(resolve => {
    const finish = ok => {
      if (done) return; done = true;
      off(); btn.remove(); ctx.testHooks.ready = false;
      resolve(ok);
    };
    btn.wait().then(() => {
      if (done) return;
      const k = t / CROSS_SECONDS;
      if (k < lo) { fail.why = 'early'; return finish(false); }
      if (k > hi) { fail.why = 'late'; return finish(false); }
      audio.play('water');
      finish(true);
    });
    const off = world.onUpdate(dt => {
      if (done) return;
      t += dt;
      const k = Math.min(1, t / CROSS_SECONDS);
      scene.river.setCross(k);
      ctx.testHooks.ready = k >= lo + 0.03 && k <= hi - 0.03;
      if (k >= 1) { fail.why = 'late'; finish(false); }
    });
  });
}

// 물결이 둑에서 하류로 쏟아지고 거란군이 휩쓸린다.
function playFlood(ctx) {
  const { world } = ctx;
  scene.damWall.visible = false;
  scene.wave.visible = true; scene.wave.position.x = scene.dam.x;
  return new Promise(resolve => {
    let t = 0;
    const off = world.onUpdate(dt => {
      t += dt;
      scene.wave.position.x = scene.dam.x + t * 30;
      scene.river.army.position.y = -t * 1.2;
      if (t > 1.6) { off(); scene.wave.visible = false; scene.river.army.visible = false; resolve(); }
    });
  });
}

// 귀주: 지원군이 오고 깃발이 북쪽으로 휘날리는 동안(3초, 쉬운 모드 5초) 공격 신호를 보낸다.
let gujuSeed = 7;
function gujuAttempt(ctx, easy, fail) {
  const { world, hud, audio } = ctx;
  gujuSeed = (gujuSeed * 16807) % 2147483647;
  const arriveAt = 3 + (gujuSeed % 3000) / 1000, open = easy ? 5 : 3;
  scene.setFlags(false);
  scene.reinforcements.visible = true; scene.reinforcements.position.x = 30;
  const btn = actionButton(ctx, '공격 신호');
  let t = 0, done = false, announced = false;
  return new Promise(resolve => {
    const finish = ok => {
      if (done) return; done = true;
      off(); btn.remove(); hud.setCounter(null); ctx.testHooks.ready = false;
      resolve(ok);
    };
    btn.wait().then(() => {
      if (done) return;
      if (t < arriveAt) { fail.why = 'early'; return finish(false); }
      audio.play('whoosh');
      finish(true);
    });
    const off = world.onUpdate(dt => {
      if (done) return;
      t += dt;
      scene.reinforcements.position.x = Math.max(14, 30 - (t / arriveAt) * 16);
      if (t >= arriveAt && !announced) { announced = true; scene.setFlags(true); hud.setCounter(script.guju.arrive); }
      ctx.testHooks.ready = t >= arriveAt + 0.2 && t <= arriveAt + open - 0.2;
      if (t > arriveAt + open) { fail.why = 'late'; scene.setFlags(false); finish(false); }
    });
  });
}

// 귀주 대첩: 공격 신호 뒤 고려군과 김종현의 지원군이 바람을 등지고 몰아쳐, 부딪친 거란군이 쓰러지고 나머지는 북쪽으로 달아난다(약 7초).
export function playGujuBattle(ctx) {
  const { world, audio } = ctx;
  const Z = scene.gujuZ;
  const go = scene.gujuGoryeo.map(p => p.position.clone()), kh = scene.gujuKhitan.map(p => p.position.clone());
  const rf = scene.reinforcements.position.clone();
  return new Promise(resolve => {
    let t = 0, clashed = false;
    const off = world.onUpdate(dt => {
      t += dt;
      const adv = Math.min(1, t / 2.2), e = adv * adv * (3 - 2 * adv); // 돌격
      scene.gujuGoryeo.forEach((p, i) => {
        const jit = t > 2.2 && t < 4.4 ? Math.sin(t * 18 + i) * 0.25 : 0; // 맞붙어 싸운다
        p.position.set(go[i].x + jit, 0, go[i].z - e * 4.8 - Math.max(0, t - 4.4) * 1.5);
      });
      scene.reinforcements.position.set(rf.x - e * 10, 0, rf.z - e * 6); // 지원군은 옆에서 들이친다
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
        else if (t > 3.6) { q.rotation.y = Math.PI; q.position.z -= dt * 7; if (q.position.z < Z - 26) q.visible = false; } // 달아난다
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
  scene.river.army.visible = false;
  for (const k of scene.gujuKhitan) k.visible = false;
  scene.reinforcements.visible = true; scene.reinforcements.position.x = 14;
  scene.setFlags(true);
  world.bounds = scene.gujuBounds;
  placePlayer(world, [0, scene.gujuBounds.z0 + 2]);
  ctx.setGoal(script.goals[6]);
}

export default {
  id: 'ch3',
  mood: 'storm',
  script,
  quizzes: script.quizzes,

  buildScene(world) { scene = buildCh3Scene(world); return scene; },

  enterStage(ctx, stage) {
    if (stage === 'minigame') { ctx.world.bounds = EXPLORE_BOUNDS; placePlayer(ctx.world, scene.start); }
    if (stage === 'quiz') showAftermath(ctx);
  },

  async explore(ctx) {
    const { world, dialogue } = ctx;
    world.bounds = EXPLORE_BOUNDS;
    placePlayer(world, scene.start);
    let step = 0;
    setStep(ctx, 0);
    await sayAll(dialogue, script.start);
    dialogue.close();
    ctx.input.enabled = true;
    await new Promise(resolve => {
      const stop = roam(ctx, {
        async onTalk(id) {
          const n = script.npc[id];
          if (id === 'gangamchan') {
            if (step === 0) { await sayAll(dialogue, n.first); step = 1; setStep(ctx, 1); }
            else await sayAll(dialogue, n.later);
          } else if (step === 0) await sayAll(dialogue, n.tooEarly);
          else { await sayAll(dialogue, n.first); stop(); resolve(); }
        },
      });
    });
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    // 1. 쇠가죽 모으기
    setStep(ctx, 2);
    for (const k of ['gangamchan', 'soldier']) world.npcs.get(k).mark.visible = false;
    await showHowTo(ctx.ui, script.hides.howto);
    input.enabled = true;
    await collectHides(ctx);
    input.enabled = false;
    await sayAll(dialogue, script.hides.built);
    dialogue.close();

    // 2. 둑 터뜨리기
    setStep(ctx, 4);
    await ctx.fade(true);
    world.player.visible = false;
    world.setFixedCamera(scene.damCam.pos, scene.damCam.target);
    await ctx.fade(false);
    await showHowTo(ctx.ui, script.dam.howto);
    const damFail = { why: '' };
    const a = await runWithRetries(ctx, easy => damAttempt(ctx, easy, damFail), {
      failHint: () => (damFail.why === 'early' ? script.dam.early : script.dam.late),
    });
    await playFlood(ctx);
    await sayAll(dialogue, script.dam.done);
    dialogue.close();

    // 3. 귀주의 바람
    setStep(ctx, 5);
    await ctx.fade(true);
    world.setFixedCamera(scene.gujuCam.pos, scene.gujuCam.target);
    await ctx.fade(false);
    await sayAll(dialogue, script.guju.intro);
    dialogue.close();
    await showHowTo(ctx.ui, script.guju.howto);
    const gujuFail = { why: '' };
    const b = await runWithRetries(ctx, easy => gujuAttempt(ctx, easy, gujuFail), {
      failHint: () => (gujuFail.why === 'early' ? script.guju.early : script.guju.late),
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
