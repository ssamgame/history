// 1장 「서희의 외교 담판」(2026-10-26 새로 만들기, docs/superpowers/specs/2026-10-26-ch1-spec.md):
// 출정 카드 → 지킴이 고르기(처음 한 번) → 작전 준비(진영 탐험, 머리 위 말풍선) → 담판: 말 받아치기(2판, chapters/kit/rally.js)
// → 거란군 물러남 · 강동 6주 기둥이 차례로 올라옴(연출) → 퀴즈 → 도장 · 지혜 카드.
import { buildCh1Scene } from './scene.js';
import { roam } from '../../core/flow.js';
import { showHowTo } from '../../core/minigame.js';
import { GUARDIAN_LOOKS, guardianLook } from '../../core/figures.js';
import { runRounds, opsGauge, talk, finale, pickGuardian, savedGuardian, usePlayerFigure } from '../kit/ops.js';
import { rally } from '../kit/rally.js';
import script from './script.js';

// 2장과 같은 저장 항목(지킴이 생김새). 1장이 편의 첫 장이라 여기서 먼저 고른다(2장 파일은 가져오지 않는다)
export const GUARDIAN_KEY = 'goryeo-game:guardian';
const START = [0, 19];
export const FERRY_RETURN = [8, -12.2];
const SEOHUI_HOME = [-11, 1.3, 0.15];
// 담판 2판: 1판은 말 공이 끝까지 오지 않고(읽을 시간), 2판은 12초에 걸쳐 온다
const ROUNDS = [{ q: 'q1', seconds: null }, { q: 'q2', seconds: 12 }];

let scene = null;
const anchors = world => Object.fromEntries(['soldier', 'seohui', 'officer', 'archer'].map(id => [id, world.npcs.get(id)?.mesh]));

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
  for (const p of scene.pillars) p.set(1);
  scene.gangdongPillars.visible = true;
  world.moveNpc('seohui', ...SEOHUI_HOME);
}

// 담판 화면: 서희와 소손녕이 마주 서고, 노을 해를 등진 카메라가 두 얼굴을 크게 담는다. 학생은 카메라 뒤(서희 곁의 젊은 병사)
export function negotiationView(ctx) {
  const { world } = ctx, spot = scene.negotiationSpot, c = spot.cam;
  world.moveNpc('seohui', spot.seohui[0], spot.seohui[1], spot.seohui[2]);
  world.player.position.set(spot.player[0], 0, spot.player[1]); world.player.rotation.y = spot.player[2];
  world.setGoal(null);
  const dir = c.pos.map((v, i) => v - c.target[i]);
  world.fitFixedCamera(c.target, dir, c.points, c.margin);
}

// 서희가 고개를 끄덕인다(맞는 대답). 칼·활 없이 손짓·끄덕임만
function nod(world) {
  const head = world.npcs.get('seohui')?.mesh.userData.head;
  if (!head) return;
  let t = 0;
  const off = world.onUpdate(dt => {
    t += dt; head.rotation.x = Math.sin(Math.min(1, t / 0.7) * Math.PI * 2) * 0.22;
    if (t >= 0.7) { head.rotation.x = 0; off(); }
  });
}

// 강동 6주 기둥이 하나씩 땅에서 올라온다
async function raisePillars(ctx) {
  scene.gangdongPillars.visible = true;
  for (const p of scene.pillars) p.set(0);
  for (const p of scene.pillars) {
    let k = 0;
    const off = ctx.world.onUpdate(dt => { k = Math.min(1, k + dt * 2.5); p.set(k); if (k >= 1) off(); });
    ctx.audio?.play('tap');
    await ctx.wait(420);
  }
  await ctx.wait(400);
  for (const p of scene.pillars) p.set(1);
}

export default {
  id: 'ch1',
  mood: 'sunset',
  script,
  quizzes: script.quizzes,

  buildScene(world) {
    scene = buildCh1Scene(world);
    usePlayerFigure(world, guardianLook(savedGuardian(GUARDIAN_KEY, 'a'), 'soldier'));
    return scene;
  },

  // 이어하기로 중간 단계부터 시작할 때 장면을 그 단계에 맞춘다.
  enterStage(ctx, stage) {
    if (stage === 'minigame') placePlayer(ctx.world, FERRY_RETURN);
    if (stage === 'quiz') { showAftermath(ctx.world); placePlayer(ctx.world, FERRY_RETURN); ctx.setGoal(script.goals[4]); }
  },

  async explore(ctx) {
    const { world, dialogue } = ctx;
    placePlayer(world, START);
    // 지킴이 고르기(편의 첫 장, 처음 한 번, 건너뛸 수 있다)
    if (!savedGuardian(GUARDIAN_KEY, null)) {
      const id = await pickGuardian(ctx, { key: GUARDIAN_KEY, ...script.guardian,
        options: Object.entries(GUARDIAN_LOOKS).map(([id, g], i) => ({ id, name: `지킴이 ${'가나다'[i]}`, color: `#${g.sleeve.toString(16).padStart(6, '0')}` })) });
      usePlayerFigure(world, guardianLook(id, 'soldier'));
    }
    let step = 0;
    setStep(ctx, 0);
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
          } else if (id === 'seohui') {
            if (step === 0) await talk(ctx, n.tooEarly, a);
            else if (step === 1) { await talk(ctx, n.first, a); step = 2; setStep(ctx, 2); }
            else await talk(ctx, n.later, a);
          } else await talk(ctx, n.always, a);
        },
        zones: [{ ...scene.ferry, active: () => step === 2, onEnter() { stop(); resolve(); } }],
      });
    });
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    input.enabled = false;
    setStep(ctx, 3);
    await ctx.fade(true);
    negotiationView(ctx);
    await ctx.fade(false);

    await talk(ctx, script.negotiation.opening);
    dialogue.close();
    await showHowTo(ctx.ui, script.rally.howto);
    const gauge = opsGauge(ctx, { value: 0.5, title: script.rally.gauge });
    const tries = ROUNDS.map(() => 0);
    let firstTryCorrect = 0, lastHint = null;
    const seohui = world.npcs.get('seohui').mesh;
    const r = await runRounds(ctx, ROUNDS, (round, { index, easy }) => {
      const q = script.negotiation[round.q];
      return rally(ctx, { prompt: q.prompt, options: q.options, speaker: script.speakers.sonn.name, speakerAnchor: scene.sonn, targetAnchor: seohui,
        gauge, easy, seconds: round.seconds, timeoutHint: script.rally.timeoutHint, scene: { answer: ok => { if (ok) nod(world); } } })
        .then(res => {
          if (tries[index]++ === 0 && res.ok) firstTryCorrect += 1; // 판마다 첫 고르기에서 맞았는지
          lastHint = res.hint;
          return res.ok;
        });
    }, { failHint: () => lastHint, easyAfter: 2 });
    gauge.set(1);
    await talk(ctx, script.negotiation.closing);
    dialogue.close();
    gauge.dispose();

    // 거란군이 물러나고 강동 6주 기둥이 차례로 올라온다(놀이 아님, 자동)
    await ctx.fade(true);
    world.moveNpc('seohui', ...SEOHUI_HOME);
    placePlayer(world, FERRY_RETURN);
    scene.retreating = true;
    await ctx.fade(false);
    ctx.audio.play('whoosh');
    await ctx.wait(1800);
    await raisePillars(ctx);
    await talk(ctx, script.retreat);
    ctx.setGoal(script.goals[4]);
    return { firstTryCorrect, firstTryTotal: 2, easyModeUsed: r.easyModeUsed };
  },

  // 장 끝(퀴즈 뒤): 도장 쾅과 지혜 카드 한 장(강동 6주 문장). 별은 지금 computeStars 그대로
  async finale(ctx, result) {
    await finale(ctx, { stamp: script.finale.stamp, sub: script.finale.sub, stars: result.stars, card: script.retreat[0] });
  },
};
