// 조선편 6장 「영조·정조와 수원 화성」: 공사장 탐험(관리·일꾼·정약용·정조) → 도르래 실험 → 거중기로 성벽 빈자리 채우기 → 퀴즈.
import { buildJ6Scene, GAPS } from './scene.js';
import { showHowTo, chooseCards } from '../../../core/minigame.js';
import { LOOKS } from '../../../content/characters.js';
import { sayAll, placePlayer, talkInOrder, setTalkStep, tryPart, sumParts, timingPress } from '../common.js';
import script from './script.js';

const ORDER = ['official', 'worker', 'jeongyakyong', 'jeongjo'];
const SPOT = [-2, -2];
let scene = null;

// 도르래 세 가지: 가(없음), 나(움직도르래 1), 다(움직도르래 2). 같은 돌, 위 들보에서 줄을 당긴다.
export function pulleySVG() {
  const setup = (cx, n, label) => {
    let s = `<text x="${cx}" y="172" font-size="18" font-weight="700" text-anchor="middle">${label}</text>`;
    const stoneY = 128;
    s += `<rect x="${cx - 26}" y="${stoneY}" width="52" height="30" fill="#c9c2b4" stroke="#6b6152"/>`;
    if (n === 0) {
      s += `<line x1="${cx}" y1="22" x2="${cx}" y2="${stoneY}" stroke="#8a6a45" stroke-width="3"/><text x="${cx + 10}" y="70" font-size="20">✋</text>`;
    } else {
      for (let k = 0; k < n; k++) {
        const py = 104 - k * 34, off = (k % 2 ? -1 : 1) * 4;
        s += `<circle cx="${cx + off}" cy="${py}" r="11" fill="#8a6a45" stroke="#3a2c20" stroke-width="2"/>`;
        s += `<line x1="${cx + off - 11}" y1="22" x2="${cx + off - 11}" y2="${py}" stroke="#8a6a45" stroke-width="2.5"/><line x1="${cx + off + 11}" y1="22" x2="${cx + off + 11}" y2="${py}" stroke="#8a6a45" stroke-width="2.5"/>`;
      }
      s += `<line x1="${cx}" y1="${104 + 11}" x2="${cx}" y2="${stoneY}" stroke="#8a6a45" stroke-width="2.5"/><text x="${cx + 18}" y="42" font-size="20">✋</text>`;
    }
    return s;
  };
  return `<svg viewBox="0 0 330 180" role="img" aria-label="도르래 세 가지"><rect x="10" y="12" width="310" height="10" fill="#6b4a32"/>${setup(60, 0, '가')}${setup(165, 1, '나')}${setup(270, 2, '다')}</svg>`;
}

// 돌 하나 내리기: 돌이 왼쪽에서 오른쪽으로 지나가고, i번째 빈자리 위(±창)에서 누르면 성공
// 돌 하나: 거중기가 돌 더미에서 돌을 집어 올린 뒤(인형뽑기처럼) 왼쪽에서 오른쪽으로 옮긴다. i번째 빈자리 위(±창)에서 누르면
// 줄을 풀어 돌을 빈자리에 내려놓는다.
async function dropStone(ctx, i, easy, fail) {
  const k0 = scene.kOf(GAPS[i]), w = easy ? 0.075 : 0.055;
  await scene.pickUp();
  scene.showGap(i);
  const ok = await timingPress(ctx, { label: '내리기', seconds: easy ? 7.5 : 6, set: scene.setSlide, window: [k0 - w, k0 + w], fail });
  scene.showGap(null);
  if (ok) { ctx.audio.play('tap'); await scene.placeAt(i); }
  return ok;
}

export default {
  id: 'j6',
  mood: 'autumn',
  player: LOOKS.worker,
  script,
  quizzes: script.quizzes,

  buildScene(world) { scene = buildJ6Scene(world); return scene; },

  enterStage(ctx, stage) {
    if (stage === 'minigame' || stage === 'quiz') placePlayer(ctx.world, SPOT);
    if (stage === 'quiz') { GAPS.forEach((_, i) => scene.fill(i)); ctx.setGoal(script.goals[5]); }
  },

  explore(ctx) { return talkInOrder(ctx, script, ORDER, scene.start); },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    input.enabled = false;
    setTalkStep(ctx, script, ORDER, 4);
    world.setGoal(null);
    await showHowTo(ctx.ui, {
      title: '거중기로 성 쌓기',
      steps: ['도르래 세 가지 중에서 가장 적은 힘으로 돌을 드는 것을 골라요.', '거중기가 돌을 옆으로 옮겨요. 돌이 빛나는 빈자리 바로 위에 오면 \'내리기\'를 눌러요.', '빈자리 세 곳을 모두 채우면 성공이에요.'],
      keyboard: '카드와 버튼을 마우스로, 내리기는 E·스페이스도 돼요', touch: '카드와 화면 아래 큰 버튼을 손가락으로 눌러요',
    });
    const parts = [];
    parts.push(await tryPart(ctx, easy => chooseCards(ctx, { title: script.pulley.title, prompt: script.pulley.prompt, figure: pulleySVG(), cards: script.pulley.cards, easy, hint: script.pulley.fail }), script.pulley.fail));
    await sayAll(dialogue, script.pulley.done); dialogue.close();

    await ctx.fade(true);
    world.fitFixedCamera(scene.wallFit.target, scene.wallFit.dir, scene.wallFit.points, scene.wallFit.margin);
    world.player.visible = false;
    const blockers = ['jeongyakyong', 'worker'].map(id => world.npcs.get(id).mesh); // 성벽 앞을 가리지 않게 잠시 비켜 둔다
    blockers.forEach(m => { m.visible = false; });
    GAPS.forEach((_, i) => scene.fill(i, false));
    await ctx.fade(false);
    await sayAll(dialogue, script.wall.howto); dialogue.close();
    const fail = {};
    parts.push(await tryPart(ctx, async easy => {
      GAPS.forEach((_, i) => scene.fill(i, false));
      for (let i = 0; i < GAPS.length; i++) if (!await dropStone(ctx, i, easy, fail)) return false;
      return true;
    }, () => (fail.why === 'early' ? script.wall.early : script.wall.late)));
    blockers.forEach(m => { m.visible = true; });
    await sayAll(dialogue, script.wall.done);
    await sayAll(dialogue, script.result);
    dialogue.close();

    await ctx.fade(true);
    placePlayer(world, SPOT);
    await ctx.fade(false);
    ctx.setGoal(script.goals[5]);
    return sumParts(parts);
  },
};
