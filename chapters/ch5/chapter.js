// 고려 새 6장(장 id ch5) 「팔만대장경과 삼별초」(2026-10-26 새로 만들기, docs/superpowers/specs/2026-10-26-ch6-spec.md):
// 출정 카드 → 작업장 탐험(장인 · 스님 말풍선) → 놀이 ① 경판 공방(chapters/kit/conveyor.js, 3무리) → 획 새기기(선택, 건너뛸 수 있음)
// → 경판 완성 컷 → 삼별초 마무리(바다 무대 chapters/ch5/sea.js: 시작 해설 · 지휘관 → 놀이 ② 노 젓기 박자(chapters/kit/rhythm.js) 강화도→진도 · 진도 컷 → 진도→제주 · 제주 컷)
// → 퀴즈 → 도장 · 지혜 카드. 장 id · 폴더 · 저장은 예전 5장 그대로(ch5). 옛 6장(ch6) 폴더는 그대로 두고 목록에서만 뺐다.
import { buildCh5Scene } from './scene.js';
import { roam } from '../../core/flow.js';
import { traceGlyph, showHowTo } from '../../core/minigame.js';
import { GUARDIAN_LOOKS, guardianLook } from '../../core/figures.js';
import { runRounds, opsGauge, talk, popText, finale, pickGuardian, savedGuardian, usePlayerFigure } from '../kit/ops.js';
import { conveyor } from '../kit/conveyor.js';
import { rhythm } from '../kit/rhythm.js';
import { MAKING_PICTURES } from './pictures.js';
import script from './script.js';

const GUARDIAN_KEY = 'goryeo-game:guardian'; // 1~5장과 같은 저장 항목(지킴이 생김새)
const MOOD = 'forest';
// 공방 작업대: 이름(예전 순서 카드 문장) · 짧은 이름 · 그림
export const STATIONS = script.making.cards.map((label, i) => ({ label, short: script.making.short[i], picture: MAKING_PICTURES[i] }));
let scene = null;
const anchors = world => ({ artisan1: world.npcs.get('artisan1')?.mesh, monk: world.npcs.get('monk')?.mesh, baejungson: () => scene.sea.leader });

function placePlayer(world, [x, z], ry = Math.PI) {
  world.player.visible = true;
  world.player.position.set(x, 0, z); world.player.rotation.y = ry;
  world.camMode = 'follow'; world.snapCamera();
}
// 화면 아래 자막 한 줄(대화 줄이 아니라 연출 글자)
function caption(ctx, text, ms = 3000) {
  const el = document.createElement('div');
  el.className = 'ops-caption';
  el.style.cssText = 'position:fixed;z-index:24;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);max-width:calc(100% - 32px);padding:8px 16px;border-radius:12px;background:rgba(27,31,29,.85);color:#fff6c8;font:700 16px var(--font-ui);text-align:center;pointer-events:none';
  el.textContent = text; ctx.ui.append(el);
  return ctx.wait(ms).then(() => el.remove());
}
// 획 새기기를 할지 묻는다(카드 보기가 아니라 단추 두 개). 새겨 보기면 true
function askCarve(ctx) {
  const a = script.carving.ask;
  return new Promise(resolve => {
    const el = document.createElement('div'); el.className = 'screen carve-ask';
    el.innerHTML = '<div class="card"><h2></h2><p></p><div class="btns"><button type="button" class="skip"></button><button type="button" class="primary"></button></div></div>';
    el.querySelector('h2').textContent = a.title; el.querySelector('p').textContent = a.text;
    el.querySelector('.skip').textContent = a.no; el.querySelector('.primary').textContent = a.yes;
    el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; el.remove(); resolve(b.classList.contains('primary')); });
    ctx.ui.append(el);
  });
}
function showSea(ctx, on) {
  const { world } = ctx;
  scene.sea.show(on);
  world.setMood(on ? 'sea' : MOOD);
  if (on) world.player.visible = false;
}
function showEnd(ctx) {
  scene.fullLibrary();
  showSea(ctx, true);
  scene.sea.arrive(1);
  const c = scene.sea.jejuCam; ctx.world.setFixedCamera(c.pos, c.target);
  ctx.setGoal(script.goals[4]);
}

export default {
  id: 'ch5',
  mood: MOOD,
  script,
  quizzes: script.quizzes,

  buildScene(world) {
    scene = buildCh5Scene(world);
    usePlayerFigure(world, guardianLook(savedGuardian(GUARDIAN_KEY, 'a'), 'soldier'));
    return scene;
  },

  enterStage(ctx, stage) {
    if (stage === 'minigame') { scene.sea.show(false); placePlayer(ctx.world, scene.start); }
    if (stage === 'quiz') showEnd(ctx);
  },

  // 배운 내용 확인 배경: 대장경 문제는 경판 선반, 삼별초 문제는 제주 바다
  quizView(ctx, q) {
    const { world } = ctx;
    world.player.visible = false;
    if (q.question.includes('삼별초')) { showSea(ctx, true); scene.sea.arrive(1); const c = scene.sea.jejuCam; world.setFixedCamera(c.pos, c.target); return { name: '삼별초' }; }
    showSea(ctx, false); scene.fullLibrary();
    world.setFixedCamera([3, 4, 14], [0, 1.2, 6.5]);
    return { name: '팔만대장경' };
  },

  async explore(ctx) {
    const { world } = ctx;
    ctx.input.enabled = false;
    if (!savedGuardian(GUARDIAN_KEY, null)) {
      const id = await pickGuardian(ctx, { key: GUARDIAN_KEY, ...script.guardian,
        options: Object.entries(GUARDIAN_LOOKS).map(([id, g], i) => ({ id, name: `지킴이 ${'가나다'[i]}`, color: `#${g.sleeve.toString(16).padStart(6, '0')}` })) });
      usePlayerFigure(world, guardianLook(id, 'soldier'));
    }
    scene.sea.show(false);
    placePlayer(world, scene.start);
    ctx.setGoal(script.goals[0]);
    const art = world.npcs.get('artisan1');
    art.mark.visible = true; world.npcs.get('monk').mark.visible = false;
    world.setGoal({ x: art.mesh.position.x, z: art.mesh.position.z });
    ctx.input.enabled = true;
    const a = anchors(world);
    await new Promise(resolve => {
      const stop = roam(ctx, {
        async onTalk(id) {
          await talk(ctx, script.npc[id], a);
          if (id === 'artisan1') { art.mark.visible = false; world.setGoal(null); stop(); resolve(); }
        },
      });
    });
    ctx.input.enabled = false;
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    input.enabled = false;
    world.setGoal(null);
    // 1. 경판 공방(3무리)
    const M = script.making;
    ctx.setGoal(script.goals[1]);
    await ctx.fade(true);
    scene.sea.show(false);
    world.player.visible = false;
    world.setFixedCamera(scene.workCam.pos, scene.workCam.target);
    scene.shelf(0);
    await ctx.fade(false);
    await showHowTo(ctx.ui, M.howto);
    const gauge = opsGauge(ctx, { value: 0, ...M.gauge });
    const total = M.waves.reduce((n, w) => n + w.boards, 0);
    let made = 0;
    ctx.testHooks.convTries = M.waves.map(() => 0);
    const a = await runRounds(ctx, M.waves, (w, { index, easy }) => {
      ctx.testHooks.convWave = index; ctx.testHooks.convEasy = easy; ctx.testHooks.convTries[index] += 1;
      popText(ctx, M.waveLabels[index], null, 'good');
      const before = made;
      return conveyor(ctx, { stations: STATIONS, active: w.active, states: M.states, colors: M.colors, boards: Math.max(1, w.boards - (easy ? 1 : 0)), gap: w.gap, beltSeconds: w.beltSeconds, easy,
        hints: { order: M.order, miss: M.miss },
        scene: { work: i => scene.work(i), shelf: n => { gauge.set(Math.min(1, (before + n) / total)); scene.shelf(before + n); } } })
        .then(r => { if (r.ok) made = before + r.done; else { gauge.set(made / total); scene.shelf(made); } return r.ok; });
    }, { failHint: M.failHint, easyAfter: 2 });
    gauge.set(1);
    ctx.audio?.play('correct');
    await ctx.wait(500);
    gauge.dispose();

    // 2. 획 새기기(선택)
    ctx.setGoal(script.goals[2]);
    if (await askCarve(ctx)) {
      await talk(ctx, script.carving.intro);
      dialogue.close();
      for (const g of script.carving.glyphs) await traceGlyph(ctx, g);
      ctx.audio?.play('correct');
    }

    // 3. 경판 완성
    await ctx.fade(true);
    scene.fullLibrary();
    placePlayer(world, scene.start);
    await ctx.fade(false);
    await talk(ctx, script.result);
    dialogue.close();

    // 4. 삼별초 마무리: 바다 무대
    const B = script.sambyeolcho, sea = scene.sea;
    ctx.setGoal(script.goals[3]);
    await ctx.fade(true);
    showSea(ctx, true);
    sea.setLeg(0);
    await ctx.fade(false);
    await talk(ctx, B.start);
    await talk(ctx, B.leader, anchors(world));
    dialogue.close();
    await showHowTo(ctx.ui, B.howto);
    ctx.testHooks.rowTries = B.legs.map(() => 0);
    const b = await runRounds(ctx, B.legs, async (leg, { index, easy }) => {
      ctx.testHooks.rowLeg = index; ctx.testHooks.rowEasy = easy; ctx.testHooks.rowTries[index] += 1;
      sea.setLeg(index);
      const e = easy ? B.easy : {};
      const r = await rhythm(ctx, { beatSeconds: e.beat ?? leg.beat, windowSec: e.window ?? leg.window, strokes: leg.strokes, seconds: e.seconds ?? leg.seconds, easy, texts: B.texts,
        scene: { progress: p => sea.progress(p), stroke: (side, good) => sea.stroke(side, good) } });
      if (!r.ok) return false;
      sea.arrive(index);
      await ctx.wait(600);
      if (index === 0) { // 진도 컷
        const c = sea.jindoCam; world.setFixedCamera(c.pos, c.target);
        await talk(ctx, B.jindo); dialogue.close();
      }
      return true;
    }, { failHint: B.failHint, easyAfter: 2 });
    // 제주 컷과 마지막 자막
    const c = sea.jejuCam; world.setFixedCamera(c.pos, c.target);
    await talk(ctx, B.jeju); dialogue.close();
    ctx.notebook?.record?.(B.end);
    await caption(ctx, B.end.text);
    showEnd(ctx);
    return { firstTryCorrect: [a, b].filter(x => x.first).length, firstTryTotal: 2, easyModeUsed: a.easyModeUsed || b.easyModeUsed };
  },

  // 장 끝(퀴즈 뒤): 도장 쾅과 지혜 카드 한 장(8만 장이 넘는 경판). 별은 지금 computeStars 그대로
  async finale(ctx, result) {
    await finale(ctx, { stamp: script.finale.stamp, sub: script.finale.sub, stars: result.stars, card: script.result[0] });
  },
};
