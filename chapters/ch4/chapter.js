// 4장 「강화도 천도와 처인성·충주성」: 저고여 사건 → 개경 → 도읍 고르기 → 강화도 → 처인성 방어 → 충주성(노비 문서 불태우기) → 퀴즈.
import * as THREE from 'three';
import { buildCh4Scene } from './scene.js';
import { roam } from '../../core/flow.js';
import { showHowTo, runWithRetries, createTapTargets, pickOnMap } from '../../core/minigame.js';
import script from './script.js';

let scene = null;

async function sayAll(dialogue, lines) { for (const l of lines) await dialogue.say(l); }

function placePlayer(world, [x, z], ry = Math.PI) {
  world.player.visible = true;
  world.player.position.set(x, 0, z); world.player.rotation.y = ry;
  world.camMode = 'follow'; world.snapCamera();
}

// 처인성 방어 한 번: 40초 버티면 성공, 몽골군 3명이 성벽에 닿으면 실패.
// 성벽 위로 고려 궁수들이 올라오고, 몽골군을 누르면 가장 가까운 궁수가 화살을 쏜다. 맞은 몽골군은 뒤로 쓰러진다.
const FLY = 0.85, FALL = 0.5, LIE = 1.0, RISE = 0.6; // 화살 나는 시간, 쓰러지는 시간, 누워 있는 시간, 궁수가 올라오는 시간
export function cheoinDefense(ctx, easy) {
  const { world, hud, audio } = ctx;
  const A = scene.areas.cheoin, [cx] = A.center;
  const spawnEvery = easy ? 2.6 : 1.6, speed = easy ? 1.4 : 2.4, duration = 40;
  const travel = A.spawnR - A.radius - 1;
  const taps = createTapTargets(ctx);
  const reset = () => {
    for (const m of scene.mongols) { m.group.visible = false; m.group.rotation.x = 0; }
    for (const ar of scene.arrows) ar.visible = false;
    for (const ar of scene.archers) { ar.group.visible = false; ar.group.position.y = 0; ar.group.rotation.y = ar.rest; }
  };
  reset();
  for (const ar of scene.archers) ar.group.visible = true;
  let t = 0, nextSpawn = 0.6, stopped = 0, breaches = 0, seed = 9, done = false;
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
  return new Promise(resolve => {
    const finish = ok => {
      if (done) return; done = true;
      off(); taps.dispose(); reset();
      hud.setTimer(null); hud.setCounter(null); resolve(ok);
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
          const a = { d: 0 };
          m.group.visible = true; m.group.rotation.x = 0;
          a.target = taps.add(m.top, {
            label: '활',
            onTap() { stopped += 1; audio.play('tap'); active.delete(m); taps.remove(a.target); shoot(m); },
          });
          active.set(m, a);
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
        a.target.btn.style.setProperty('--p', Math.min(1, a.d / travel).toFixed(3));
        if (a.d >= travel) {
          breaches += 1; audio.play('wrong');
          taps.remove(a.target); active.delete(m); m.group.visible = false;
          if (breaches >= 3) return finish(false);
        }
      }
      if (t >= duration) finish(true);
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

  buildScene(world) { scene = buildCh4Scene(world); return scene; },

  enterStage(ctx, stage) {
    const P = scene.areas.palace;
    if (stage === 'minigame') { ctx.world.bounds = P.bounds; placePlayer(ctx.world, P.start); }
    if (stage === 'quiz') { showChungju(ctx); scene.burnt(); ctx.setGoal(script.goals[4]); }
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
    // 저고여 사건: 압록강 가 길을 걷던 몽골 사신이 쓰러진다
    const J = scene.areas.jeogo;
    world.player.visible = false;
    world.setFixedCamera(J.cam.pos, J.cam.target);
    await sayAll(dialogue, script.jeogo.before);
    dialogue.close();
    await J.play();
    await sayAll(dialogue, script.jeogo.after);
    dialogue.close();
    await ctx.fade(true);
    world.bounds = P.bounds;
    placePlayer(world, P.start);
    await ctx.fade(false);
    ctx.setGoal(script.goals[0]);
    const minister = world.npcs.get('minister');
    minister.mark.visible = true;
    world.setGoal({ x: minister.mesh.position.x, z: minister.mesh.position.z });
    await sayAll(dialogue, script.start);
    dialogue.close();
    ctx.input.enabled = true;
    await new Promise(resolve => {
      const stop = roam(ctx, {
        async onTalk(id) {
          if (id !== 'minister') return;
          await sayAll(dialogue, script.npc.minister.first);
          minister.mark.visible = false; world.setGoal(null);
          stop(); resolve();
        },
      });
    });
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    input.enabled = false;
    // 1. 도읍을 어디로?
    ctx.setGoal(script.goals[1]);
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

    // 2. 처인성 방어
    ctx.setGoal(script.goals[2]);
    await ctx.fade(true);
    const f = scene.areas.cheoin.fit;
    world.fitFixedCamera(f.target, f.dir, f.points);
    world.scene.fog.near = 120; world.scene.fog.far = 400; // 멀리 있는 몽골군이 안개에 묻히지 않게
    await ctx.fade(false);
    await sayAll(dialogue, script.cheoin.intro);
    dialogue.close();
    await showHowTo(ctx.ui, script.cheoin.howto);
    const b = await runWithRetries(ctx, easy => cheoinDefense(ctx, easy), { failHint: script.cheoin.failHint });
    await sayAll(dialogue, script.cheoin.done);
    dialogue.close();

    // 3. 충주성
    world.setMood('overcast'); // 안개를 원래대로
    ctx.setGoal(script.goals[3]);
    await ctx.fade(true);
    showChungju(ctx);
    await ctx.fade(false);
    await dialogue.say(script.chungju[0]);
    const C = scene.areas.chungju;
    world.setFixedCamera(C.burnCam.pos, C.burnCam.target); // 노비 문서 가까이
    await dialogue.say(script.chungju[1]);
    dialogue.close();
    ctx.audio.play('whoosh');
    await scene.burnDocuments(); // 노비 문서가 활활 타서 재가 된다
    world.setFixedCamera(C.cam.pos, C.cam.target);
    for (const l of script.chungju.slice(2)) await dialogue.say(l);
    ctx.setGoal(script.goals[4]);
    return { firstTryCorrect: (a.firstTry ? 1 : 0) + (b.first ? 1 : 0), firstTryTotal: 2, easyModeUsed: b.easyModeUsed };
  },
};
