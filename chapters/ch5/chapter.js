// 5장 「팔만대장경」: 1번~4번 장인의 이야기를 차례로 → 경판 만드는 순서 그림 카드 → 글자 새기기 → 퀴즈.
import { buildCh5Scene } from './scene.js';
import { roam } from '../../core/flow.js';
import { runWithRetries, traceGlyph, showHowTo, orderCards } from '../../core/minigame.js';
import { labelSprite } from '../../core/people.js';
import { MAKING_PICTURES } from './pictures.js';
import script from './script.js';

// 경판 만드는 차례 카드: 글과 그 일을 그린 그림을 함께 보여 준다
export const MAKING_CARDS = script.making.cards.map((text, i) => ({ text, figure: MAKING_PICTURES[i] }));

const ARTISANS = ['artisan1', 'artisan2', 'artisan3', 'artisan4'];
let scene = null;

async function sayAll(dialogue, lines) { for (const l of lines) await dialogue.say(l); }

function placePlayer(world, [x, z], ry = Math.PI) {
  world.player.visible = true;
  world.player.position.set(x, 0, z); world.player.rotation.y = ry;
  world.camMode = 'follow'; world.snapCamera();
}

// 지금 차례(step)인 장인에게만 느낌표와 화살표. 장인 머리 위에는 늘 번호 이름표가 있다.
function markNext(ctx, step) {
  const { world } = ctx;
  ARTISANS.forEach((id, i) => { world.npcs.get(id).mark.visible = i === step; });
  const n = ARTISANS[step] && world.npcs.get(ARTISANS[step]);
  world.setGoal(n ? { x: n.mesh.position.x, z: n.mesh.position.z } : null);
  ctx.hud.setCounter(`들은 이야기 ${step}/4`);
}
function addNumberTags(world) {
  ARTISANS.forEach((id, i) => {
    const m = world.npcs.get(id).mesh;
    if (m.getObjectByName('numTag')) return;
    const tag = labelSprite(`${i + 1}번 장인`); tag.name = 'numTag'; tag.scale.set(2.6, 0.75, 1); tag.position.set(0, 4.3, 0); m.add(tag);
  });
}

export default {
  id: 'ch5',
  mood: 'forest',
  script,
  quizzes: script.quizzes,

  buildScene(world) { scene = buildCh5Scene(world); addNumberTags(world); return scene; },

  enterStage(ctx, stage) {
    if (stage === 'minigame') placePlayer(ctx.world, scene.start);
    if (stage === 'quiz') { scene.library.visible = true; placePlayer(ctx.world, scene.start); ctx.setGoal(script.goals[3]); }
  },

  async explore(ctx) {
    const { world, dialogue } = ctx;
    placePlayer(world, scene.start);
    ctx.setGoal(script.goals[0]);
    let step = 0; // 1번 장인부터 차례로만 이야기를 들을 수 있다
    markNext(ctx, step);
    await sayAll(dialogue, script.start);
    dialogue.close();
    ctx.input.enabled = true;
    await new Promise(resolve => {
      const stop = roam(ctx, {
        async onTalk(id) {
          const i = ARTISANS.indexOf(id);
          if (i > step) { await sayAll(dialogue, script.tooEarly(step + 1)); return; }
          await sayAll(dialogue, script.npc[id]);
          if (i === step) step += 1;
          markNext(ctx, step);
          if (step === ARTISANS.length) { ctx.hud.setCounter(null); stop(); resolve(); }
        },
      });
    });
  },

  async minigame(ctx) {
    const { dialogue, input } = ctx;
    input.enabled = false;
    ctx.setGoal(script.goals[1]);
    await showHowTo(ctx.ui, {
      title: '경판 만들기',
      steps: ['그림 카드 여섯 장을 경판 만드는 차례대로 눌러요.', '1번 장인부터 4번 장인까지 들은 이야기를 떠올려요.', '차례가 틀리면 해설을 보고, 빛나는 카드를 눌러 이어서 해요.'],
      keyboard: '카드를 마우스로 눌러요', touch: '카드를 손가락으로 눌러요',
    });
    await sayAll(dialogue, [{ who: 'monk', text: '몽골군이 불태운 대장경을 다시 만들어야 하오. 장인들에게 들은 순서대로 일을 놓아 보시오.' }]); dialogue.close();
    const a = await runWithRetries(ctx, easy => orderCards(ctx, { title: script.making.title, cards: MAKING_CARDS, easy, hint: script.making.failHint }), { failHint: script.making.failHint });
    ctx.audio.play('correct');

    ctx.setGoal(script.goals[2]);
    await sayAll(dialogue, script.carving.intro);
    dialogue.close();
    for (const g of script.carving.glyphs) await traceGlyph(ctx, g);
    ctx.audio.play('correct');

    await ctx.fade(true);
    scene.library.visible = true;
    placePlayer(ctx.world, scene.start);
    await ctx.fade(false);
    await sayAll(dialogue, script.result);
    ctx.setGoal(script.goals[3]);
    return { firstTryCorrect: a.first ? 1 : 0, firstTryTotal: 1, easyModeUsed: a.easyModeUsed };
  },
};
