// 2장 「양규와 흥화진」(2026-10-26 시범): 출정 카드 → 작전 준비(성안 탐험, 지휘판 연습) → 작전(성벽 지휘판 3파 · 백성 구출 호위)
// → 지킴 확인(퀴즈) → 도장·지혜 카드. 놀이 뼈대는 chapters/kit/ops.js(다른 장도 데이터만 바꿔 쓴다), 이 파일은 2장 데이터와 순서만.
import { buildCh2Scene, boardScene, escortScene, raiseFlag } from './scene.js';
import { roam } from '../../core/flow.js';
import { showHowTo } from '../../core/minigame.js';
import { GUARDIAN_LOOKS, guardianLook } from '../../core/figures.js';
import { runRounds, commandBoard, escort, opsGauge, talk, finale, pickGuardian, savedGuardian, usePlayerFigure } from '../kit/ops.js';
import script from './script.js';

export const GUARDIAN_KEY = 'goryeo-game:guardian'; // 기기 안 저장에 새로 더한 한 항목(지킴이 생김새). 없으면 'a'
// 성벽 지휘판 3파: 1파는 한 구역씩 느리게, 2파는 두 구역 동시, 3파는 세 구역 동시(큰 사다리는 병사 둘)
export const WAVES = [
  { units: 3, threats: [{ at: 0.5, zone: 0 }, { at: 6.5, zone: 2 }, { at: 12.5, zone: 1 }, { at: 18.5, zone: 0 }], timing: { climb: 6 } },
  { units: 3, threats: [{ at: 0.5, zone: 0 }, { at: 0.5, zone: 2 }, { at: 9, zone: 1 }, { at: 9, zone: 0 }, { at: 17.5, zone: 2 }, { at: 17.5, zone: 1 }] },
  { units: 4, threats: [{ at: 0.5, zone: 0 }, { at: 0.5, zone: 1, need: 2 }, { at: 0.5, zone: 2 }, { at: 10, zone: 2 }, { at: 10, zone: 0, need: 2 }, { at: 10, zone: 1 }] },
];
// 호위: 무리 2개(가운데 길 막힘) → 4개(가운데만 열림) → 마지막 큰 무리(가운데 막힘)
export const ESCORT_WAVES = [{ groups: [0, 1], blocked: [1] }, { groups: [2, 3, 4, 5], blocked: [0, 2] }, { groups: [6], blocked: [1] }];

let scene = null;
const anchors = world => ({ soldier: world.npcs.get('soldier')?.mesh, yanggyu: world.npcs.get('yanggyu')?.mesh, villager: world.npcs.get('villager')?.mesh });
const zones = () => script.wall.zones.map((label, i) => ({ id: i, label, anchor: scene.zones[i] }));

function setStep(ctx, n) {
  const { world } = ctx;
  ctx.setGoal(script.goals[n]);
  world.npcs.get('soldier').mark.visible = n === 0;
  world.npcs.get('yanggyu').mark.visible = n === 1;
  const t = [world.npcs.get('soldier').mesh.position, world.npcs.get('yanggyu').mesh.position][n];
  world.setGoal(t ? { x: t.x, z: t.z } : null);
}
function placePlayer(world, [x, z], ry = Math.PI) {
  world.player.visible = true;
  world.player.position.set(x, 0, z); world.player.rotation.y = ry;
  world.camMode = 'follow'; world.snapCamera();
}
function townPeople(world, on) { for (const id of ['soldier', 'yanggyu', 'villager']) { const n = world.npcs.get(id); if (n) n.mesh.visible = on; } }
async function wallView(ctx) {
  const { world } = ctx, f = scene.wallFit;
  world.player.visible = false; townPeople(world, false);
  world.fitFixedCamera(f.target, f.dir, f.points, f.margin);
}
function showAftermath(ctx) {
  const { world } = ctx;
  for (const c of scene.captives) c.root.visible = false;
  for (const g of scene.guards) g.visible = false;
  for (const l of scene.ladders) l.group.visible = false;
  for (const d of scene.defenders) d.visible = false;
  scene.field.visible = false; scene.khitanCrowd.visible = false;
  scene.waveFlags.forEach(f => { f.visible = true; f.scale.y = 1; }); // 세 파를 다 막았다
  townPeople(world, true);
  world.bounds = scene.explore;
  placePlayer(world, scene.start);
  ctx.setGoal(script.goals[5]);
}
// 거란군이 물러간다(3파 뒤): 성 밖 무리가 북쪽으로 걸어가며 사라진다
function retreat(ctx) {
  const g = scene.khitanCrowd, { world } = ctx;
  return new Promise(resolve => {
    let t = 0;
    const off = world.onUpdate(dt => {
      t += dt; g.position.z -= 3 * dt;
      if (t >= 1.6) { off(); g.visible = false; g.position.z = 0; resolve(); }
    });
  });
}

export default {
  id: 'ch2',
  mood: 'snow',
  script,
  quizzes: script.quizzes,

  buildScene(world) {
    scene = buildCh2Scene(world);
    usePlayerFigure(world, guardianLook(savedGuardian(GUARDIAN_KEY, 'a'), 'soldier'));
    return scene;
  },

  enterStage(ctx, stage) {
    if (stage === 'minigame') { ctx.world.bounds = scene.explore; placePlayer(ctx.world, scene.start); }
    if (stage === 'quiz') showAftermath(ctx);
  },

  async explore(ctx) {
    const { world, dialogue } = ctx;
    world.bounds = scene.explore;
    placePlayer(world, scene.start);
    // 지킴이 고르기(처음 한 번, 건너뛸 수 있다)
    if (!savedGuardian(GUARDIAN_KEY, null)) {
      const id = await pickGuardian(ctx, { key: GUARDIAN_KEY, ...script.guardian,
        options: Object.entries(GUARDIAN_LOOKS).map(([id, g], i) => ({ id, name: `지킴이 ${'가나다'[i]}`, color: `#${g.sleeve.toString(16).padStart(6, '0')}` })) });
      usePlayerFigure(world, guardianLook(id, 'soldier'));
    }
    let step = 0;
    setStep(ctx, 0);
    await talk(ctx, script.start);
    dialogue.close();
    ctx.input.enabled = true;
    const a = anchors(world);
    await new Promise(resolve => {
      const stop = roam(ctx, {
        async onTalk(id) {
          const n = script.npc[id];
          if (id === 'soldier') {
            await talk(ctx, step === 0 ? n.first : n.later, a);
            if (step === 0) { step = 1; setStep(ctx, 1); }
          } else if (id === 'yanggyu') {
            if (step === 0) await talk(ctx, n.tooEarly, a);
            else { await talk(ctx, n.first, a); step = 2; stop(); resolve(); }
          } else await talk(ctx, n.always, a);
        },
      });
    });
    // 지휘판 연습: 세 구역에 병사를 하나씩(틀려도 불이익 없음)
    ctx.input.enabled = false;
    ctx.setGoal(script.goals[2]); world.setGoal(null);
    await ctx.fade(true);
    await wallView(ctx);
    await ctx.fade(false);
    await showHowTo(ctx.ui, script.practice.howto);
    await commandBoard(ctx, { zones: zones(), units: 3, practice: true, scene: boardScene(scene), label: '작전 준비' });
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    input.enabled = false;
    ctx.setGoal(script.goals[3]); world.setGoal(null);
    await ctx.fade(true);
    await wallView(ctx);
    scene.khitanCrowd.visible = true;
    await ctx.fade(false);
    await showHowTo(ctx.ui, script.wall.howto);
    const gauge = opsGauge(ctx, { value: 0.5 });
    ctx.testHooks.wallAttempts = 0; ctx.testHooks.wallEasy = [];
    const a = await runRounds(ctx, WAVES, (w, { index, easy }) => {
      ctx.testHooks.wallAttempts += 1; ctx.testHooks.wallEasy.push(easy);
      return commandBoard(ctx, { zones: zones(), units: w.units, threats: w.threats, timing: w.timing, easy, scene: boardScene(scene), gauge, label: script.wall.waveLabels[index] })
        .then(ok => { if (ok) { raiseFlag(scene, index, world); ctx.audio?.play('correct'); } return ok; });
    }, { failHint: script.wall.failHint, easyAfter: 2 });
    gauge.set(1);
    await retreat(ctx);
    await talk(ctx, script.wall.done);
    dialogue.close();
    gauge.dispose();

    // 백성 구출 호위
    await ctx.fade(true);
    for (const d of scene.defenders) d.visible = false;
    scene.field.visible = true;
    ctx.setGoal(script.goals[4]);
    const f = scene.escortField;
    world.bounds = f.bounds; placePlayer(world, f.start);
    await ctx.fade(false);
    await showHowTo(ctx.ui, script.rescue.howto);
    input.enabled = true;
    const b = await runRounds(ctx, [null], (_, { easy }) => {
      ctx.testHooks.escortEasy = easy;
      return escort(ctx, { field: f, lanes: scene.guards.map(g => ({ x: g.position.x })), waves: ESCORT_WAVES, groups: scene.captives, guards: scene.guards, need: 4, seconds: 120, easy, scene: escortScene(scene) });
    }, { failHint: script.rescue.failHint, easyAfter: 2 });
    input.enabled = false;
    await ctx.fade(true);
    showAftermath(ctx); // 들판에 멈춰 선 백성·호위병을 치우고 성안으로(퀴즈 배경)
    await ctx.fade(false);
    await talk(ctx, script.rescue.done);
    await talk(ctx, script.result);
    ctx.setGoal(script.goals[5]);
    return { firstTryCorrect: [a, b].filter(x => x.first).length, firstTryTotal: 2, easyModeUsed: a.easyModeUsed || b.easyModeUsed };
  },

  // 장 끝(퀴즈 뒤): 도장 쾅과 지혜 카드 한 장. 별은 지금 computeStars 그대로
  async finale(ctx, result) {
    await finale(ctx, { stamp: script.finale.stamp, sub: script.finale.sub, stars: result.stars, card: script.wall.done[0] });
  },
};
