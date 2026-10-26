// 고려 새 4장 「윤관과 별무반」(장 id ch7, 2026-10-26, docs/superpowers/specs/2026-10-26-ch7-spec.md):
// 출정 카드 → 첫 장면(말 탄 여진 군사에 고려 보병이 물러남) → 작전 준비(마을 탐험, 윤관 말풍선) → 놀이 「별무반 갈림길」(chapters/kit/switch.js, 3무리)
// → 진군 · 성 9개 연출 → 퀴즈 → 도장 · 지혜 카드.
// 아직 장 목록(chapters/index.js)에 넣지 않는다(고려편 5 · 6장 구성 변경 때 no: 4로). 그때까지는 PREVIEW_META로 직접 돌린다.
import { buildCh7Scene, playOpening, playMarch } from './scene.js';
import { roam } from '../../core/flow.js';
import { showHowTo } from '../../core/minigame.js';
import { GUARDIAN_LOOKS, guardianLook } from '../../core/figures.js';
import { runRounds, opsGauge, talk, popText, finale, pickGuardian, savedGuardian, usePlayerFigure, useNpcFigure } from '../kit/ops.js';
import { switchLanes } from '../kit/switch.js';
import { LOOKS } from '../../content/characters.js';
import script from './script.js';

const GUARDIAN_KEY = 'goryeo-game:guardian'; // 1~3장과 같은 저장 항목(지킴이 생김새)
// 목록에 넣기 전 개발·시험용 장 정보(목록에 넣을 때 chapters/index.js의 항목으로 옮긴다)
export const PREVIEW_META = { id: 'ch7', no: 4, session: 1, title: '윤관과 별무반', years: '1104~1109', event: '여진 정벌', place: '고려 동북쪽', mapXY: [52, 12] };
// 첫 시도 점수: 처음 한 번에 틀림 없이 끝낸 무리 수(셋 중 2 이상이면 2)
export const WAVE_FIRST = clean => Math.min(2, clean);

let scene = null;
const anchors = world => ({ yungwan: world.npcs.get('yungwan')?.mesh, villager: world.npcs.get('villager')?.mesh });

function placePlayer(world, [x, z], ry = Math.PI) {
  world.player.visible = true;
  world.player.position.set(x, 0, z); world.player.rotation.y = ry;
  world.camMode = 'follow'; world.snapCamera();
}
function laneView(ctx) {
  const { world } = ctx, f = scene.laneFit;
  scene.field.visible = false;
  world.bounds = scene.explore;
  placePlayer(world, [scene.fork.x - 2.2, scene.fork.z + 2.2], 0); // 지킴이는 갈림길 옆에서 사람들을 맞는다
  world.fitFixedCamera(f.target, f.dir, f.points, f.margin);
}
function showAftermath(ctx) {
  const { world } = ctx;
  scene.field.visible = false; scene.prepare([]); scene.setTroops({});
  scene.marchers.visible = false;
  scene.castles.visible = true; scene.setCastles(9);
  world.bounds = scene.explore;
  placePlayer(world, [scene.fork.x + 1, scene.fork.z + 4]);
  ctx.setGoal(script.goals[3]);
}

export default {
  id: 'ch7',
  mood: 'morning',
  script,
  quizzes: script.quizzes,

  buildScene(world) {
    scene = buildCh7Scene(world);
    useNpcFigure(world, 'yungwan', { ...LOOKS.yungwan, job: 'official', add: ['dallyeong', 'wideSleeves'] }); // 문신: 단령 깃과 넓은 소매, 칼 없음
    usePlayerFigure(world, guardianLook(savedGuardian(GUARDIAN_KEY, 'a'), 'soldier'));
    return scene;
  },

  enterStage(ctx, stage) {
    if (stage === 'minigame') { scene.field.visible = false; ctx.world.bounds = scene.explore; placePlayer(ctx.world, [scene.fork.x - 2.2, scene.fork.z + 2.2]); }
    if (stage === 'quiz') showAftermath(ctx);
  },

  async explore(ctx) {
    const { world, dialogue, input } = ctx;
    input.enabled = false;
    // 지킴이는 1장에서 고른다. 저장이 없을 때만 여기서 고른다
    if (!savedGuardian(GUARDIAN_KEY, null)) {
      const id = await pickGuardian(ctx, { key: GUARDIAN_KEY, ...script.guardian,
        options: Object.entries(GUARDIAN_LOOKS).map(([id, g], i) => ({ id, name: `지킴이 ${'가나다'[i]}`, color: `#${g.sleeve.toString(16).padStart(6, '0')}` })) });
      usePlayerFigure(world, guardianLook(id, 'soldier'));
    }
    // 첫 장면: 말 탄 여진 군사에 고려 보병 줄이 물러난다(말 없이)
    world.player.visible = false;
    world.setFixedCamera(scene.fieldCam.pos, scene.fieldCam.target);
    ctx.audio?.play('whoosh');
    await playOpening(world, scene);
    await ctx.fade(true);
    scene.field.visible = false;
    world.bounds = scene.explore;
    placePlayer(world, scene.start);
    await ctx.fade(false);

    ctx.setGoal(script.goals[0]);
    const yg = world.npcs.get('yungwan');
    yg.mark.visible = true; world.setGoal({ x: yg.mesh.position.x, z: yg.mesh.position.z });
    world.npcs.get('villager').mark.visible = false;
    dialogue.close();
    input.enabled = true;
    const a = anchors(world);
    await new Promise(resolve => {
      const stop = roam(ctx, {
        async onTalk(id) {
          const n = script.npc[id];
          if (id === 'yungwan') { await talk(ctx, n.first, a); stop(); resolve(); }
          else await talk(ctx, n.always, a);
        },
      });
    });
    yg.mark.visible = false; world.setGoal(null);
    input.enabled = false;
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    input.enabled = false;
    ctx.setGoal(script.goals[1]); world.setGoal(null);
    await ctx.fade(true);
    laneView(ctx);
    await ctx.fade(false);
    await talk(ctx, script.switch.before);
    dialogue.close();
    await showHowTo(ctx.ui, script.switch.howto);

    const S = script.switch, waves = S.waves, total = waves.reduce((n, w) => n + w.people.length, 0);
    const gauge = opsGauge(ctx, { value: 0, ...S.gauge });
    const base = { cav: 0, inf: 0, monk: 0 };
    let clean = 0, sentBefore = 0;
    ctx.testHooks.waveTries = waves.map(() => 0);
    const res = await runRounds(ctx, waves, (w, { index, easy }) => {
      ctx.testHooks.wave = index;
      const tries = (ctx.testHooks.waveTries[index] += 1);
      const now = { ...base };
      let sent = 0;
      scene.prepare(w.people); scene.setTroops(base);
      popText(ctx, S.waveLabels[index], null, 'good');
      const lanes = {
        line: q => scene.line(q),
        send: (i, lane) => { now[lane] += 1; sent += 1; gauge.set((sentBefore + sent) / total); return scene.send(i, lane).then(() => scene.setTroops(now)); },
        wrong: i => scene.wrong(i),
      };
      return switchLanes(ctx, { lanes: S.lanes, people: w.people, rule: S.rule, hints: S.hints, easy, gap: w.gap ?? null, scene: lanes, name: p => p.name })
        .then(r => {
          if (r.ok) { Object.assign(base, now); sentBefore += sent; if (tries === 1 && r.wrong === 0) clean += 1; }
          else { scene.setTroops(base); gauge.set(sentBefore / total); }
          return r.ok;
        });
    }, { failHint: S.failHint, easyAfter: 2 });
    gauge.set(1);
    popText(ctx, S.done, null, 'good');
    ctx.audio?.play('correct');
    await ctx.wait(700);
    gauge.dispose();

    // 진군 · 성 9개
    ctx.setGoal(script.goals[2]);
    await ctx.fade(true);
    scene.prepare([]); scene.setTroops({});
    world.player.visible = false;
    { const f = scene.marchFit; world.fitFixedCamera(f.target, f.dir, f.points, f.margin); }
    await ctx.fade(false);
    await playMarch(world, scene, () => ctx.audio?.play('tap'));
    await talk(ctx, script.march);
    await talk(ctx, script.result);
    dialogue.close();
    await ctx.fade(true);
    showAftermath(ctx);
    await ctx.fade(false);
    return { firstTryCorrect: WAVE_FIRST(clean), firstTryTotal: 2, easyModeUsed: res.easyModeUsed };
  },

  // 장 끝(퀴즈 뒤): 도장 쾅과 지혜 카드 한 장(별무반 문장). 별은 지금 computeStars 그대로
  async finale(ctx, result) {
    await finale(ctx, { stamp: script.finale.stamp, sub: script.finale.sub, stars: result.stars, card: script.switch.before[0] });
  },
};
