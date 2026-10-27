// 1장 「서희의 외교 담판」: 진영 탐험 → 소손녕과의 담판 → 거란군 철수와 강동 6주 → 퀴즈.
import { buildCh1Scene } from './scene.js';
import { roam } from '../../core/flow.js';
import script from './script.js';

export const START = [0, 19];
export const INTRO_FROM = [0, 36]; // 장 시작 장면: 진영 밖 길(걷는 곳 z1=22 바깥)
const FERRY_RETURN = [8, -12.2];
const SEOHUI_HOME = [-11, 1.3, 0.15];

let scene = null;

// 시험판(D-4): 주소에 ?try=1이 있을 때만 1장 탐험에서 낮은 카메라·대화 때 얼굴 크게·시작 장면을 켠다.
export function readTry(search) { return new URLSearchParams(search || '').get('try') === '1'; }

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

// 장 시작 장면(D-4 ㉱): 학생 병사가 진영 밖 길에서 걸어 들어온다(약 3.7초). 그동안 입력을 막고, 누르거나 키를 누르면 건너뛴다.
export function introWalk(ctx) {
  const { world, input } = ctx;
  const b0 = world.bounds, s0 = world.speedScale;
  input.enabled = false;
  world.bounds = { ...b0, z1: INTRO_FROM[1] };
  placePlayer(world, INTRO_FROM);
  world.speedScale = 0.7; world.autoMove = { x: 0, z: -1 };
  return new Promise(resolve => {
    let off = null;
    const end = e => {
      if (!off) return;
      off(); off = null;
      removeEventListener('keydown', end, true); removeEventListener('pointerdown', end, true);
      world.autoMove = null; world.speedScale = s0; world.bounds = b0;
      world.player.position.set(START[0], 0, START[1]);
      if (e) world.snapCamera(); // 건너뛰면 카메라도 바로 제자리로
      resolve();
    };
    off = world.onUpdate(() => { if (world.player.position.z <= START[1]) end(); });
    addEventListener('keydown', end, true); addEventListener('pointerdown', end, true);
  });
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
    world.tryMode = readTry(typeof location !== 'undefined' ? location.search : '');
    if (world.tryMode) await introWalk(ctx); else placePlayer(world, START);
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
    world.tryMode = false; // 미니게임부터는 지금 카메라 그대로
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
