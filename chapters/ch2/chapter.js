// 2장 「양규와 흥화진」: 성안 탐험 → 성벽 방어 → 백성 구출 → 퀴즈.
import { buildCh2Scene } from './scene.js';
import { roam } from '../../core/flow.js';
import { showHowTo, runWithRetries, createTapTargets } from '../../core/minigame.js';
import script from './script.js';

const EXPLORE_BOUNDS = { x0: -10.5, x1: 10.5, z0: -10.5, z1: 7 };
let scene = null;

async function sayAll(dialogue, lines) { for (const l of lines) await dialogue.say(l); }

function setStep(ctx, n) {
  const { world } = ctx;
  ctx.setGoal(script.goals[n]);
  world.npcs.get('soldier').mark.visible = n === 0;
  world.npcs.get('yanggyu').mark.visible = n === 1;
  scene.ring.visible = n === 2;
  const targets = [world.npcs.get('soldier').mesh.position, world.npcs.get('yanggyu').mesh.position, scene.stairs];
  world.setGoal(targets[n] ? { x: targets[n].x, z: targets[n].z } : null);
}

function placePlayer(world, [x, z], ry = Math.PI) {
  world.player.visible = true;
  world.player.position.set(x, 0, z); world.player.rotation.y = ry;
  world.camMode = 'follow'; world.snapCamera();
}

const RAISE_SECONDS = 0.8; // 거란 병사가 사다리를 세우는 시간
const RAISE_LEAN = 1.1;    // 세우기 전 사다리가 뒤로 눕혀진 각도(라디안)

function resetLadders() {
  for (const l of scene.ladders) {
    l.group.visible = false; l.pivot.rotation.x = l.tilt;
    l.climber.visible = false; l.carrier.visible = false;
  }
}

// 성벽 방어 한 번: 45초 버티면 성공, 사다리 3개가 올라오면 실패. 시간은 월드 시계로 잰다.
function wallDefense(ctx, easy) {
  const { world, hud, audio } = ctx;
  ctx.testHooks.wallAttempts = (ctx.testHooks.wallAttempts || 0) + 1;
  const spawnEvery = easy ? 3.5 : 2.2, climbTime = easy ? 5.6 : 4, duration = 45;
  const taps = createTapTargets(ctx);
  resetLadders();
  let t = 0, nextSpawn = 0.8, blocked = 0, breaches = 0, slotSeed = 5, done = false;
  const active = new Map();
  return new Promise(resolve => {
    const finish = ok => {
      if (done) return; done = true;
      off(); taps.dispose(); resetLadders();
      hud.setTimer(null); hud.setCounter(null);
      resolve(ok);
    };
    const off = world.onUpdate(dt => {
      if (done) return;
      t += dt;
      hud.setTimer(duration - t);
      hud.setCounter(`막은 사다리 ${blocked} · 올라온 사다리 ${breaches}/3`);
      if (t >= nextSpawn) {
        nextSpawn = t + spawnEvery;
        const free = scene.ladders.filter(l => !active.has(l));
        if (free.length) {
          slotSeed = (slotSeed * 16807) % 2147483647;
          const l = free[slotSeed % free.length];
          l.group.visible = true; l.carrier.visible = true; l.climber.visible = false;
          l.pivot.rotation.x = l.tilt - RAISE_LEAN;
          const a = { t: 0 };
          a.target = taps.add(l.top, {
            label: '밀기',
            onTap() { blocked += 1; audio.play('tap'); active.delete(l); taps.remove(a.target); l.group.visible = false; },
          });
          active.set(l, a);
        }
      }
      for (const [l, a] of active) {
        a.t += dt;
        if (a.t < RAISE_SECONDS) {
          // 사다리를 세우는 중: 뒤로 눕혀 있던 사다리가 성벽 쪽으로 일어선다
          const r = a.t / RAISE_SECONDS;
          l.pivot.rotation.x = l.tilt - RAISE_LEAN * (1 - r * r * (3 - 2 * r));
          continue;
        }
        l.pivot.rotation.x = l.tilt;
        l.climber.visible = true;
        const k = Math.min(1, (a.t - RAISE_SECONDS) / climbTime);
        l.climber.position.set(0, k * (l.len - 1.2), 0.25);
        a.target.btn.style.setProperty('--p', k.toFixed(3)); // 버튼 테두리가 올라온 만큼 차오른다
        if (a.t >= RAISE_SECONDS + climbTime) {
          breaches += 1; audio.play('wrong');
          taps.remove(a.target); active.delete(l); l.group.visible = false;
          if (breaches >= 3) return finish(false);
        }
      }
      if (t >= duration) finish(true);
    });
  });
}

// 백성 구출 한 번: 90초 안에 네 무리 이상 구하면 성공.
function rescue(ctx, easy) {
  const { world, hud, audio } = ctx;
  const speed = easy ? 0.3 : 0.6, duration = 90, need = 4, f = scene.field;
  const groups = scene.captives.map(c => {
    c.group.visible = true; c.escort.visible = true;
    c.group.position.set(c.start[0], 0, c.start[1]);
    return { c, state: 'walking', fade: 0 };
  });
  world.bounds = f.bounds;
  placePlayer(world, f.start, Math.PI);
  let t = 0, saved = 0, done = false;
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
      hud.setCounter(`구한 백성 ${saved}/${need}무리`);
      const p = world.player.position;
      let nearest = null, nd = Infinity;
      for (const g of groups) {
        const gp = g.c.group.position;
        if (g.state === 'walking') {
          gp.z -= speed * dt;
          const d = Math.hypot(p.x - gp.x, p.z - gp.z);
          if (d < 2.0) { g.state = 'saved'; saved += 1; g.c.escort.visible = false; audio.play('correct'); }
          else if (gp.z < f.lostZ) { g.state = 'lost'; g.c.group.visible = false; }
          else if (d < nd) { nd = d; nearest = gp; }
        } else if (g.state === 'saved') {
          gp.z += 1.5 * dt; g.fade += dt;
          if (g.fade > 2.5) { g.state = 'home'; g.c.group.visible = false; }
        }
      }
      world.setGoal(nearest ? { x: nearest.x, z: nearest.z } : null);
      if (saved >= need) return finish(true);
      if (t >= duration || !groups.some(g => g.state === 'walking')) finish(false);
    });
  });
}

function showAftermath(ctx) {
  for (const c of scene.captives) c.group.visible = false;
  scene.khitan.visible = false;
  ctx.world.bounds = scene.field.bounds;
  placePlayer(ctx.world, scene.field.start);
  ctx.setGoal(script.goals[5]);
}

export default {
  id: 'ch2',
  mood: 'snow',
  script,
  quizzes: script.quizzes,

  buildScene(world) { scene = buildCh2Scene(world); return scene; },

  enterStage(ctx, stage) {
    if (stage === 'minigame') { ctx.world.bounds = EXPLORE_BOUNDS; placePlayer(ctx.world, [0, -6]); }
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
          if (id === 'soldier') {
            if (step === 0) { await sayAll(dialogue, n.first); step = 1; setStep(ctx, 1); }
            else await sayAll(dialogue, n.later);
          } else if (id === 'yanggyu') {
            if (step === 0) await sayAll(dialogue, n.tooEarly);
            else if (step === 1) { await sayAll(dialogue, n.first); step = 2; setStep(ctx, 2); }
            else await sayAll(dialogue, n.later);
          } else await sayAll(dialogue, n.always);
        },
        zones: [{ ...scene.stairs, active: () => step === 2, onEnter() { stop(); resolve(); } }],
      });
    });
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    input.enabled = false;
    setStep(ctx, 3);
    scene.ring.visible = false;
    await ctx.fade(true);
    world.player.visible = false;
    world.fitFixedCamera(scene.wallFit.target, scene.wallFit.dir, scene.wallFit.points); // 어떤 화면 비율에서도 사다리가 다 보이게
    scene.khitan.visible = false; // 카메라와 성벽 사이의 거란 진영(줄·천막)이 사다리를 가리지 않게
    await ctx.fade(false);
    await showHowTo(ctx.ui, script.wall.howto);
    const a = await runWithRetries(ctx, easy => wallDefense(ctx, easy), { failHint: script.wall.failHint });
    await sayAll(dialogue, script.wall.done);
    dialogue.close();

    await ctx.fade(true);
    scene.khitan.visible = false;
    ctx.setGoal(script.goals[4]);
    placePlayer(world, scene.field.start);
    await ctx.fade(false);
    await sayAll(dialogue, script.rescue.intro);
    dialogue.close();
    await showHowTo(ctx.ui, script.rescue.howto);
    input.enabled = true;
    const b = await runWithRetries(ctx, easy => rescue(ctx, easy), { failHint: script.rescue.failHint });
    input.enabled = false;
    await ctx.fade(true);
    showAftermath(ctx); // 구출이 끝나면 들판에 멈춰 선 백성·거란 병사를 치운다(퀴즈 내내 서 있지 않게)
    await ctx.fade(false);
    await sayAll(dialogue, script.rescue.done);
    await sayAll(dialogue, script.result);
    ctx.setGoal(script.goals[5]);
    return { firstTryCorrect: [a, b].filter(x => x.first).length, firstTryTotal: 2, easyModeUsed: a.easyModeUsed || b.easyModeUsed };
  },
};
