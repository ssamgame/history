// 조선편 4장 「임진왜란과 한산도 대첩」: 포구 탐험(수군·백성·이순신) → 미끼 배로 적 끌어내기 → 학익진 배치 → 공격 신호 → 퀴즈.
import { buildJ4Scene, STRAIT_Z } from './scene.js';
import { showHowTo } from '../../../core/minigame.js';
import { formation } from '../../kit/formation.js';
import { LOOKS } from '../../../content/characters.js';
import { sayAll, placePlayer, talkInOrder, setTalkStep, tryPart, sumParts, timingPress } from '../common.js';
import script from './script.js';

const ORDER = ['navy', 'commoner', 'yisunsin'];
const SPOT = [-8, 7];
let scene = null;

// 학익진 판: 아래(남쪽)로 둥글게 휜 다섯 자리가 날개, 곧은 뒷줄 세 자리는 틀린 자리
export default {
  id: 'j4',
  mood: 'sea',
  player: LOOKS.navy,
  script,
  quizzes: script.quizzes,

  buildScene(world) { scene = buildJ4Scene(world); return scene; },

  enterStage(ctx, stage) {
    if (stage === 'minigame') placePlayer(ctx.world, SPOT);
    if (stage === 'quiz') { scene.setStage('won'); placePlayer(ctx.world, SPOT); ctx.setGoal(script.goals[4]); }
  },

  explore(ctx) { return talkInOrder(ctx, script, ORDER, scene.start); },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    input.enabled = false;
    setTalkStep(ctx, script, ORDER, 3);
    world.setGoal(null);
    await showHowTo(ctx.ui, {
      title: '한산도 앞바다',
      steps: ['미끼 배가 견내량 입구(빛나는 원)에 닿으면 \'배를 돌려라\'를 눌러요.', '바다 판에서 왼 날개 · 오른 날개 끝(노란 손잡이)을 끌어 적을 감싸요. 두 끝이 표시 원에 들어가면 성공! 날개 단추를 눌러도 돼요.', '날개를 다 펴면 적이 날개 안으로 들어오고, 공격 신호가 올라가요.'],
      keyboard: '배를 돌려라는 E·스페이스, 날개는 ← →', touch: '큰 버튼을 누르고, 날개 손잡이를 끌어요',
    });
    await ctx.fade(true);
    world.fitFixedCamera(scene.seaFit.target, scene.seaFit.dir, scene.seaFit.points, scene.seaFit.margin);
    world.player.visible = false;
    scene.setStage('lure');
    await ctx.fade(false);
    await sayAll(dialogue, script.lure.howto); dialogue.close();
    const parts = [];

    // 1) 미끼 배: 견내량 입구에 닿았을 때 돌린다 (진행도 0.8~0.95, 쉬우면 0.74~0.98)
    const lureFail = {};
    parts.push(await tryPart(ctx, easy => {
      scene.setStage('lure');
      scene.goalRing.position.set(0, 0.1, STRAIT_Z + 2); scene.goalRing.visible = true;
      return timingPress(ctx, { label: '배를 돌려라', seconds: easy ? 9 : 7, set: scene.setLure, window: easy ? [0.74, 0.98] : [0.8, 0.95], fail: lureFail });
    }, () => (lureFail.why === 'early' ? script.lure.early : script.lure.late)));
    scene.goalRing.visible = false;
    await new Promise(resolve => { // 적이 쫓아 넓은 바다로 나온다
      let k = 0;
      const off = world.onUpdate(dt => { k = Math.min(1, k + dt * 0.3); scene.setChase(k); if (k >= 1) { off(); resolve(); } });
    });
    await sayAll(dialogue, script.lure.done); dialogue.close();

    // 2) 학익진 날개 펴기(2026-10-27, 배치판 대신): 두 날개 끝을 끌어 적을 감싼다
    const W = script.wing;
    parts.push(await tryPart(ctx, easy => formation(ctx, { seconds: easy ? 40 : 25, easy, title: W.title, prompt: W.prompt, hint: W.fail }).then(r => r.ok), W.fail));
    scene.setStage('wing');
    await sayAll(dialogue, W.done); dialogue.close();

    // 3) 공격(연출): 적이 날개 안으로 들어오면 공격 신호
    await sayAll(dialogue, script.attack.howto); dialogue.close();
    await new Promise(resolve => { let k = 0; const off = world.onUpdate(dt => { k = Math.min(1, k + dt / 4); scene.setAdvance(k * 0.85); if (k >= 1) { off(); resolve(); } }); });
    ctx.audio.play('whoosh');
    world.fitFixedCamera([0, 0, -38], [0.9, 1.25, 0.45], [[-16, 0, -31], [16, 0, -31], [-6, 0, -49], [6, 0, -49]], 0.9); // 싸움을 옆에서 가까이
    ctx.testHooks.sunk = await scene.playBattle(ctx.audio); // 포를 쏘아 일본 배를 가라앉힌다
    world.fitFixedCamera(scene.seaFit.target, scene.seaFit.dir, scene.seaFit.points, scene.seaFit.margin);
    scene.setStage('won');
    await ctx.wait(600);
    await sayAll(dialogue, script.result); dialogue.close();

    await ctx.fade(true);
    placePlayer(world, SPOT);
    await ctx.fade(false);
    ctx.setGoal(script.goals[4]);
    return sumParts(parts);
  },
};
