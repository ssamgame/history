// 1장 「서희의 외교 담판」: 진영 탐험 → 소손녕과의 담판 → 거란군 철수와 강동 6주 → 퀴즈.
import { buildCh1Scene } from './scene.js';
import { roam } from '../../core/flow.js';
import script from './script.js';

const START = [0, 19];
const FERRY_RETURN = [8, -12.2];
const SEOHUI_HOME = [-11, 1.3, 0.15];

let scene = null;

// 시점 시험판(D-2): 주소에 ?view=b(1인칭) 또는 ?view=c(어깨 너머)가 있을 때만 1장 탐험에서 켠다.
export function readView(search) {
  const v = new URLSearchParams(search || '').get('view');
  return v === 'b' || v === 'c' ? v : null;
}

async function sayAll(dialogue, lines) { for (const l of lines) await dialogue.say(l); }

function setStep(ctx, n) {
  const { world } = ctx;
  ctx.setGoal(script.goals[n]);
  world.npcs.get('soldier').mark.visible = n === 0;
  world.npcs.get('seohui').mark.visible = n === 1;
  scene.ring.visible = n === 2;
  const targets = [world.npcs.get('soldier').mesh.position, world.npcs.get('seohui').mesh.position, scene.ferry];
  world.setGoal(targets[n] ? { x: targets[n].x, z: targets[n].z } : null);
}

function placePlayer(world, [x, z], ry = Math.PI) {
  world.player.position.set(x, 0, z); world.player.rotation.y = ry;
  world.camMode = 'follow'; world.snapCamera();
}

function showAftermath(world) {
  scene.khitanGroup.visible = false;
  scene.gangdongPillars.visible = true;
  world.moveNpc('seohui', ...SEOHUI_HOME);
}

export default {
  id: 'ch1',
  mood: 'sunset',
  script,
  quizzes: script.quizzes,

  buildScene(world) { scene = buildCh1Scene(world); return scene; },

  // 이어하기로 중간 단계부터 시작할 때 장면을 그 단계에 맞춘다.
  enterStage(ctx, stage) {
    if (stage === 'minigame') placePlayer(ctx.world, FERRY_RETURN);
    if (stage === 'quiz') { showAftermath(ctx.world); placePlayer(ctx.world, FERRY_RETURN); ctx.setGoal(script.goals[4]); }
  },

  async explore(ctx) {
    const { world, dialogue } = ctx;
    world.viewMode = readView(typeof location !== 'undefined' ? location.search : '');
    placePlayer(world, START);
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
          } else if (id === 'seohui') {
            if (step === 0) await sayAll(dialogue, n.tooEarly);
            else if (step === 1) { await sayAll(dialogue, n.first); step = 2; setStep(ctx, 2); }
            else await sayAll(dialogue, n.later);
          } else await sayAll(dialogue, n.always);
        },
        zones: [{ ...scene.ferry, active: () => step === 2, onEnter() { stop(); resolve(); } }],
      });
    });
    world.viewMode = null; world.player.visible = true; // 미니게임부터는 지금 카메라 그대로
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    const spot = scene.negotiationSpot;
    input.enabled = false;
    setStep(ctx, 3);
    await ctx.fade(true);
    world.moveNpc('seohui', spot.seohui[0], spot.seohui[1], spot.seohui[2]);
    world.player.position.set(spot.player[0], 0, spot.player[1]); world.player.rotation.y = spot.player[2];
    world.setFixedCamera(spot.cam.pos, spot.cam.target);
    await ctx.fade(false);

    await sayAll(dialogue, script.negotiation.opening);
    const a = await dialogue.ask(script.negotiation.q1);
    const b = await dialogue.ask(script.negotiation.q2);
    await sayAll(dialogue, script.negotiation.closing);
    dialogue.close();

    await ctx.fade(true);
    world.moveNpc('seohui', ...SEOHUI_HOME);
    placePlayer(world, FERRY_RETURN);
    scene.retreating = true;
    await ctx.fade(false);
    ctx.audio.play('whoosh');
    await ctx.wait(1800);
    scene.gangdongPillars.visible = true;
    await sayAll(dialogue, script.retreat);
    ctx.setGoal(script.goals[4]);
    return { firstTryCorrect: Number(a.firstTry) + Number(b.firstTry), firstTryTotal: 2, easyModeUsed: false };
  },
};
