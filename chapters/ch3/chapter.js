// 3장 「강감찬과 귀주 대첩」(2026-10-26 새로 만들기, docs/superpowers/specs/2026-10-26-ch3-spec.md):
// 출정 카드 → 작전 준비(진영 탐험, 머리 위 말풍선, 쇠가죽 6묶음 줍기) → 놀이 ① 둑 수위 조절(chapters/kit/damflow.js)
// → 물결 연출 → 놀이 ② 귀주 신호(chapters/kit/signal.js) → 귀주 대첩 연출 → 퀴즈 → 도장 · 지혜 카드.
// 둑(흥화진 앞 냇물, 1018년 12월)과 귀주(1019년 2월)는 다른 때·곳이다: 화면을 바꿔(fade) 귀주 벌판으로 넘어간다.
import { buildCh3Scene } from './scene.js';
import { roam } from '../../core/flow.js';
import { showHowTo } from '../../core/minigame.js';
import { GUARDIAN_LOOKS, guardianLook } from '../../core/figures.js';
import { runRounds, talk, popText, finale, pickGuardian, savedGuardian, usePlayerFigure } from '../kit/ops.js';
import { damflow } from '../kit/damflow.js';
import { signal } from '../kit/signal.js';
import script from './script.js';

const GUARDIAN_KEY = 'goryeo-game:guardian'; // 1·2장과 같은 저장 항목(지킴이 생김새)
const EXPLORE_BOUNDS = { x0: -28, x1: 28, z0: -3.5, z1: 14 };
export const CROSS_SECONDS = 12; // 물 모으는 시간이 필요해서 10 → 12초
export const DAM_LEVEL = { normal: 2 / 3, easy: 1 / 3 }; // 터뜨릴 때 있어야 하는 물 높이(3칸 중 2칸, 쉬운 모드 1칸)
let scene = null;
const anchors = world => ({ gangamchan: world.npcs.get('gangamchan')?.mesh, soldier: world.npcs.get('soldier')?.mesh });
// 개발용: ?debug=ch3-minigame&part=1 이면 놀이 ② 귀주 신호부터
const debugPart = () => { try { const q = new URLSearchParams(location.search); return q.get('debug') ? +(q.get('part') || 0) : 0; } catch { return 0; } };

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
  else world.setGoal(null);
}

// 쇠가죽 6개를 주워 둑으로 가져간다(작전 준비, 실패는 없다).
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
function hidesBuilt() {
  for (const h of scene.hides) { h.taken = true; h.mesh.visible = false; }
  scene.damWall.visible = true; scene.ring.visible = false;
}

// 거란군이 냇물 한가운데에 왔을 때 둑을 터뜨린다. 진행도 k에서 거란군 무리(앞줄·뒷줄)의 가운데가 냇물 한가운데에 오는 때는 k≈0.67,
// 무리 전체가 물속에 있는 때는 k≈0.56~0.78이다. 판정 칸은 그 둘레(0.5~0.82, 쉬운 모드 0.42~0.88)로 화면에 보이는 모습과 맞춘다.
export const DAM_WINDOW = { normal: [0.5, 0.82], easy: [0.42, 0.88] };
const damScene = () => ({
  reset() { scene.river.army.visible = true; scene.river.army.position.y = 0; scene.wave.visible = false; scene.damWall.visible = true; },
  cross: k => scene.river.setCross(k),
  level: v => scene.setLevel(v),
});
const DAM_HINT = { early: () => script.dam.early, overflow: () => script.dam.over, late: () => script.dam.late, low: () => script.dam.low };

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

// 귀주 신호: 지원군이 먼저 도착하고(신호 1) 1~1.5초 뒤 깃발이 북쪽으로 휘날린다(신호 2, 비바람이 남쪽에서 분다). 두 신호가 같이 켜진 동안 공격 신호
let gujuSeed = 7;
function gujuLights() {
  gujuSeed = (gujuSeed * 16807) % 2147483647;
  const arrive = 3 + (gujuSeed % 1500) / 1000, flag = arrive + 1 + ((gujuSeed >> 4) % 500) / 1000;
  return [{ label: script.guju.lights[0], at: arrive }, { label: script.guju.lights[1], at: flag }];
}
function gujuScene(ctx, lights) {
  scene.setFlags(false);
  scene.reinforcements.visible = true; scene.reinforcements.position.x = 30;
  return {
    update: t => { scene.reinforcements.position.x = Math.max(14, 30 - (t / lights[0].at) * 16); },
    on: i => {
      if (i === 0) popText(ctx, script.guju.arrive, null, 'good');
      if (i === 1) scene.setFlags(true);
    },
  };
}
const GUJU_HINT = { early: () => script.guju.early, one: () => script.guju.one, late: () => script.guju.late };

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
      scene.reinforcements.rotation.y = -e * 0.6; // 무리째 고려군 쪽으로 돈다
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
  scene.river.army.visible = false; scene.guju.visible = true;
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

  buildScene(world) {
    scene = buildCh3Scene(world);
    usePlayerFigure(world, guardianLook(savedGuardian(GUARDIAN_KEY, 'a'), 'soldier'));
    return scene;
  },

  enterStage(ctx, stage) {
    if (stage === 'minigame') { ctx.world.bounds = EXPLORE_BOUNDS; placePlayer(ctx.world, scene.start); hidesBuilt(); }
    if (stage === 'quiz') showAftermath(ctx);
  },

  async explore(ctx) {
    const { world, dialogue, input } = ctx;
    world.bounds = EXPLORE_BOUNDS;
    placePlayer(world, scene.start);
    // 지킴이는 1장에서 고른다. 저장이 없을 때만(건너뛰었거나 3장부터 한 기기) 여기서 고른다
    if (!savedGuardian(GUARDIAN_KEY, null)) {
      const id = await pickGuardian(ctx, { key: GUARDIAN_KEY, ...script.guardian,
        options: Object.entries(GUARDIAN_LOOKS).map(([id, g], i) => ({ id, name: `지킴이 ${'가나다'[i]}`, color: `#${g.sleeve.toString(16).padStart(6, '0')}` })) });
      usePlayerFigure(world, guardianLook(id, 'soldier'));
    }
    let step = 0;
    setStep(ctx, 0);
    dialogue.close();
    input.enabled = true;
    const a = anchors(world);
    await new Promise(resolve => {
      const stop = roam(ctx, {
        async onTalk(id) {
          const n = script.npc[id];
          if (id === 'gangamchan') {
            await talk(ctx, step === 0 ? n.first : n.later, a);
            if (step === 0) { step = 1; setStep(ctx, 1); }
          } else if (step === 0) await talk(ctx, n.tooEarly, a);
          else { await talk(ctx, n.first, a); stop(); resolve(); }
        },
      });
    });
    // 쇠가죽 모으기(작전 준비)
    input.enabled = false;
    setStep(ctx, 2);
    for (const k of ['gangamchan', 'soldier']) world.npcs.get(k).mark.visible = false;
    await showHowTo(ctx.ui, script.hides.howto);
    input.enabled = true;
    await collectHides(ctx);
    input.enabled = false;
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    input.enabled = false;
    const part = debugPart();
    let a = { first: true, easyModeUsed: false };
    if (part < 1) {
      // 놀이 ① 둑 수위 조절
      setStep(ctx, 4);
      await ctx.fade(true);
      world.player.visible = false;
      const f = scene.damFit; world.fitFixedCamera(f.target, f.dir, f.points, f.margin);
      await ctx.fade(false);
      await showHowTo(ctx.ui, script.dam.howto);
      let why = 'early';
      ctx.testHooks.damEasy = [];
      a = await runRounds(ctx, [null], (_, { easy }) => {
        ctx.testHooks.damEasy.push(easy);
        return damflow(ctx, { window: DAM_WINDOW.normal, easyWindow: DAM_WINDOW.easy, crossSeconds: CROSS_SECONDS, minLevel: DAM_LEVEL.normal, easyMinLevel: DAM_LEVEL.easy,
          easy, scene: damScene(), label: script.dam.button }).then(r => { why = r.why; return r.ok; });
      }, { failHint: () => DAM_HINT[why](), easyAfter: 2 });
      await playFlood(ctx);
      scene.setLevel(0);
      await talk(ctx, script.dam.done);
      dialogue.close();
    }

    // 놀이 ② 귀주 신호(다른 때·곳: 화면을 바꿔 귀주 벌판으로)
    setStep(ctx, 5);
    await ctx.fade(true);
    world.player.visible = false;
    scene.river.army.visible = false; scene.guju.visible = true;
    world.setFixedCamera(scene.gujuCam.pos, scene.gujuCam.target);
    await ctx.fade(false);
    await showHowTo(ctx.ui, script.guju.howto);
    let why2 = 'early';
    const b = await runRounds(ctx, [null], (_, { easy }) => {
      const lights = gujuLights();
      return signal(ctx, { lights, open: 3, easyOpen: 5, easy, scene: gujuScene(ctx, lights), label: script.guju.button }).then(r => { why2 = r.why; return r.ok; });
    }, { failHint: () => GUJU_HINT[why2](), easyAfter: 2 });
    await talk(ctx, script.guju.charge); dialogue.close();
    await playGujuBattle(ctx); // 깃발이 북쪽으로 휘날리자 고려군이 몰아쳐 이긴다
    for (const k of scene.gujuKhitan) k.visible = false;
    await talk(ctx, script.guju.done);
    await talk(ctx, script.result);
    showAftermath(ctx);
    return { firstTryCorrect: [a, b].filter(x => x.first).length, firstTryTotal: 2, easyModeUsed: a.easyModeUsed || b.easyModeUsed };
  },

  // 장 끝(퀴즈 뒤): 도장 쾅과 지혜 카드 한 장(귀주 대첩 문장). 별은 지금 computeStars 그대로
  async finale(ctx, result) {
    await finale(ctx, { stamp: script.finale.stamp, sub: script.finale.sub, stars: result.stars, card: script.result[0] });
  },
};
