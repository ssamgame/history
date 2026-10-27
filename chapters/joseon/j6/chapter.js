// 조선편 6장 「영조·정조와 수원 화성」: 공사장 탐험(관리·일꾼·정약용·정조) → 도르래 해설 → 놀이 「흔들리는 거중기」(chapters/kit/crane.js, 2026-10-27) → 퀴즈.
import { buildJ6Scene, GAPS } from './scene.js';
import { showHowTo } from '../../../core/minigame.js';
import { crane } from '../../kit/crane.js';
import { popText } from '../../kit/ops.js';
import { LOOKS } from '../../../content/characters.js';
import { sayAll, placePlayer, talkInOrder, setTalkStep, tryPart, sumParts } from '../common.js';
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
    await showHowTo(ctx.ui, script.wall.howtoCard);
    await sayAll(dialogue, script.pulley.done); dialogue.close(); // 도르래의 원리(해설)

    await ctx.fade(true);
    world.fitFixedCamera(scene.wallFit.target, scene.wallFit.dir, scene.wallFit.points, scene.wallFit.margin);
    world.player.visible = false;
    const blockers = ['jeongyakyong', 'worker'].map(id => world.npcs.get(id).mesh); // 성벽 앞을 가리지 않게 잠시 비켜 둔다
    blockers.forEach(m => { m.visible = false; });
    GAPS.forEach((_, i) => scene.fill(i, false));
    await ctx.fade(false);
    await sayAll(dialogue, script.wall.howto); dialogue.close();
    // 놀이 「흔들리는 거중기」(2026-10-27): 돌이 좌우로 오가고 칸마다 빨라진다. 빈자리 위에서 '내리기'
    const parts = [await tryPart(ctx, async easy => {
      GAPS.forEach((_, i) => scene.fill(i, false));
      const r = await crane(ctx, { gaps: GAPS.length, easy, label: '내리기',
        scene: { set: scene.setSlide, kOf: i => scene.kOf(GAPS[i]), pickUp: () => scene.pickUp(), place: i => scene.placeAt(i), showGap: i => scene.showGap(i) },
        onMiss: () => popText(ctx, script.wall.miss, null, 'bad') });
      return r.ok ? (r.wrong ? 'missed' : true) : false;
    }, script.wall.fail)];
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
