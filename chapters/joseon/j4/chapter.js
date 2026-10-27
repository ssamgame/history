// 조선편 4장 「임진왜란과 한산도 대첩」: 포구 탐험(수군·백성·이순신) → 미끼 배로 적 끌어내기 → 학익진 배치 → 공격 신호 → 퀴즈.
import { buildJ4Scene, STRAIT_Z } from './scene.js';
import { showHowTo, placeOnBoard } from '../../../core/minigame.js';
import { LOOKS } from '../../../content/characters.js';
import { sayAll, placePlayer, talkInOrder, setTalkStep, tryPart, sumParts, timingPress } from '../common.js';
import script from './script.js';
import { PANOK_ICON } from '../ships.js';

const ORDER = ['navy', 'commoner', 'yisunsin'];
const SPOT = [-8, 7];
let scene = null;

// 학익진 판: 아래(남쪽)로 둥글게 휜 다섯 자리가 날개, 곧은 뒷줄 세 자리는 틀린 자리
export const WING_BOARD = {
  items: Array.from({ length: 5 }, () => ({ id: 'ship', label: '판옥선', icon: PANOK_ICON })),
  slots: [
    { id: 'w1', xy: [14, 24], answer: 'ship' }, { id: 'w2', xy: [29, 46], answer: 'ship' }, { id: 'w3', xy: [50, 58], answer: 'ship' },
    { id: 'w4', xy: [71, 46], answer: 'ship' }, { id: 'w5', xy: [86, 24], answer: 'ship' },
    { id: 'b1', xy: [27, 80], answer: null }, { id: 'b2', xy: [50, 80], answer: null }, { id: 'b3', xy: [73, 80], answer: null },
  ],
  decor: [{ label: '▼▼ 쫓아오는 일본 배 ▼▼', xy: [50, 8] }, { label: '한산도 ▸', xy: [11, 62] }, { label: '↓ 남쪽', xy: [92, 93] }],
};

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
      steps: ['미끼 배가 견내량 입구(빛나는 원)에 닿으면 \'배를 돌려라\'를 눌러요.', '학이 날개를 편 모양으로 우리 배를 늘어세워요.', '적의 배가 날개 안으로 다 들어오면 \'공격 신호\'를 눌러요.'],
      keyboard: '버튼을 마우스로 누르거나 E·스페이스', touch: '화면 아래 큰 버튼과 자리를 손가락으로 눌러요',
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

    // 2) 학익진 배치
    parts.push(await tryPart(ctx, easy => placeOnBoard(ctx, { title: script.wing.title, ...WING_BOARD, easy, hint: script.wing.fail }), script.wing.fail));
    scene.setStage('wing');
    await sayAll(dialogue, script.wing.done); dialogue.close();

    // 3) 공격 신호: 적이 날개 안에 들어왔을 때 (진행도 0.72~0.95, 쉬우면 0.64~0.98)
    await sayAll(dialogue, script.attack.howto); dialogue.close();
    const atkFail = {};
    parts.push(await tryPart(ctx, easy => {
      scene.goalRing.position.set(0, 0.1, -40); scene.goalRing.scale.setScalar(2.2); scene.goalRing.visible = true;
      return timingPress(ctx, { label: '공격 신호', seconds: easy ? 10 : 8, set: scene.setAdvance, window: easy ? [0.64, 0.98] : [0.72, 0.95], fail: atkFail });
    }, () => (atkFail.why === 'early' ? script.attack.early : script.attack.late)));
    scene.goalRing.visible = false;
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
