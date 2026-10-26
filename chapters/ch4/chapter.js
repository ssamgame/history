// 고려 새 5장(장 id ch4) 「몽골의 침입과 처인성·충주성」(2026-10-26 새로 만들기, docs/superpowers/specs/2026-10-26-ch5-spec.md):
// 출정 카드 → 저고여 사건 컷 → 개경 탐험(관리 말풍선) → 도읍 연출(지도판, 강화도 앞 바다에서 멈춤) → 놀이 「처인성 당겨 쏘기」(chapters/kit/pullshot.js, 3무리)
// → 김윤후 컷(백성·승려 사이, 몽골 깃발이 물러감) → 충주성 컷(노비 문서) → 퀴즈 → 도장 · 지혜 카드.
// 장 id·폴더·저장은 예전 4장 그대로(ch4). 편 안 번호(5장)는 장 구성 변경 때 chapters/index.js에서 바꾼다.
import { buildCh4Scene } from './scene.js';
import { roam } from '../../core/flow.js';
import { showHowTo } from '../../core/minigame.js';
import { GUARDIAN_LOOKS, guardianLook } from '../../core/figures.js';
import { runRounds, opsGauge, talk, popText, finale, pickGuardian, savedGuardian, usePlayerFigure } from '../kit/ops.js';
import { pullshot } from '../kit/pullshot.js';
import script from './script.js';

const GUARDIAN_KEY = 'goryeo-game:guardian'; // 1~4장과 같은 저장 항목(지킴이 생김새)
// 첫 시도 점수: 처음 한 번에 통과한 무리 수(셋 중 2 이상이면 2)
export const WAVE_FIRST = clean => Math.min(2, clean);
let scene = null;
const anchors = world => ({ minister: world.npcs.get('minister')?.mesh, kimyunhu: world.npcs.get('kimyunhu')?.mesh });

async function sayAll(dialogue, lines) { for (const l of lines) await dialogue.say(l); }

function placePlayer(world, [x, z], ry = Math.PI) {
  world.player.visible = true;
  world.player.position.set(x, 0, z); world.player.rotation.y = ry;
  world.camMode = 'follow'; world.snapCamera();
}

// 화면 위 자막 한 줄(대화 줄이 아니라 연출 글자): 몇 초 보였다가 사라진다
function caption(ctx, text, ms = 3200) {
  const el = document.createElement('div');
  el.className = 'ops-caption';
  el.style.cssText = 'position:fixed;z-index:24;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);max-width:calc(100% - 32px);padding:10px 18px;border-radius:14px;background:rgba(27,31,29,.88);color:#fff6c8;font:700 18px var(--font-ui);text-align:center;pointer-events:none';
  el.textContent = text; ctx.ui.append(el);
  return ctx.wait(ms).then(() => el.remove());
}

// 도읍 연출: 지도판 위로 몽골 기병 화살표가 세 곳으로 가다가 강화도 앞 바다에서 멈춘다(놀이 아님, 옳고 그름 없음)
async function capitalScene(ctx) {
  const { world } = ctx, M = scene.areas.capitalMap;
  await ctx.fade(true);
  world.player.visible = false;
  world.setFixedCamera(M.cam.pos, M.cam.target);
  await ctx.fade(false);
  ctx.audio?.play('whoosh');
  await M.play();
  await caption(ctx, script.capital.done[0].text);
  await ctx.fade(true);
  M.group.visible = false;
  world.setFixedCamera(scene.areas.ganghwa.cam.pos, scene.areas.ganghwa.cam.target);
  await ctx.fade(false);
  await ctx.wait(1500);
}

// 처인성 놀이 화면: 성 위에서 비스듬히, 지킴이는 북쪽 성벽 발판(활 자리)에
function cheoinView(ctx) {
  const { world } = ctx, C = scene.areas.cheoin, f = C.fit;
  world.fitFixedCamera(f.target, f.dir, f.points);
  world.scene.fog.near = 120; world.scene.fog.far = 400; // 멀리 있는 몽골군이 안개에 묻히지 않게
  const [bx, by, bz] = C.bow;
  scene.archers.forEach((a, i) => { a.group.visible = i !== 2; a.group.position.y = a.baseY; a.group.rotation.y = a.rest; });
  world.player.visible = true; world.player.position.set(bx, by, bz); world.player.rotation.y = Math.PI;
}

// 김윤후 컷: 성 안 북쪽, 백성·승려 사이. 몽골 장수 쪽 깃발 무리가 북쪽으로 물러간다
function yunhuScene(ctx) {
  const { world } = ctx, C = scene.areas.cheoin, [x, z, ry] = C.kimyunhu;
  world.player.visible = false;
  world.moveNpc('kimyunhu', x, z, ry);
  world.setFixedCamera(C.yunhuCam.pos, C.yunhuCam.target);
  const g = C.commanderFlag; g.visible = true; g.position.z = -36;
  let t = 0;
  const off = world.onUpdate(dt => { t += dt; g.position.z = -36 - t * 3; if (t > 9) { off(); g.visible = false; } });
}

function showChungju(ctx) {
  const C = scene.areas.chungju;
  ctx.world.player.visible = false;
  ctx.world.setFixedCamera(C.cam.pos, C.cam.target);
  ctx.world.moveNpc('kimyunhu', C.kimyunhu[0], C.kimyunhu[1], C.kimyunhu[2]);
}

export default {
  id: 'ch4',
  mood: 'overcast',
  script,
  quizzes: script.quizzes,

  buildScene(world) {
    scene = buildCh4Scene(world);
    usePlayerFigure(world, guardianLook(savedGuardian(GUARDIAN_KEY, 'a'), 'soldier'));
    return scene;
  },

  enterStage(ctx, stage) {
    const P = scene.areas.palace;
    if (stage === 'minigame') { ctx.world.bounds = P.bounds; placePlayer(ctx.world, P.start); }
    if (stage === 'quiz') { showChungju(ctx); scene.burnt(); ctx.setGoal(script.goals[4]); }
  },

  // 배운 내용 확인 배경: 강화도 문제는 강화도 해협을, 처인성·충주성 문제는 처인성을 비춘다
  quizView(ctx, q) {
    const { world } = ctx;
    world.player.visible = false;
    if (q.question.includes('강화도')) { world.setFixedCamera(scene.areas.ganghwa.cam.pos, scene.areas.ganghwa.cam.target); return { name: '강화도' }; }
    const c = scene.areas.cheoin.center[0];
    world.setFixedCamera([c + 6, 16, 26], [c, 0, -2]);
    return { name: '처인성' };
  },

  async explore(ctx) {
    const { world, dialogue } = ctx;
    const P = scene.areas.palace;
    ctx.input.enabled = false;
    // 지킴이는 1장에서 고른다. 저장이 없을 때만 여기서 고른다
    if (!savedGuardian(GUARDIAN_KEY, null)) {
      const id = await pickGuardian(ctx, { key: GUARDIAN_KEY, ...script.guardian,
        options: Object.entries(GUARDIAN_LOOKS).map(([id, g], i) => ({ id, name: `지킴이 ${'가나다'[i]}`, color: `#${g.sleeve.toString(16).padStart(6, '0')}` })) });
      usePlayerFigure(world, guardianLook(id, 'soldier'));
    }
    // 저고여 사건: 압록강 가 길을 걷던 몽골 사신이 쓰러진다
    const J = scene.areas.jeogo;
    world.player.visible = false;
    world.setFixedCamera(J.cam.pos, J.cam.target);
    await sayAll(dialogue, script.jeogo.before);
    dialogue.close();
    await J.play();
    await talk(ctx, script.jeogo.after);
    dialogue.close();
    await ctx.fade(true);
    world.bounds = P.bounds;
    placePlayer(world, P.start);
    await ctx.fade(false);
    ctx.setGoal(script.goals[0]);
    const minister = world.npcs.get('minister');
    minister.mark.visible = true;
    world.setGoal({ x: minister.mesh.position.x, z: minister.mesh.position.z });
    ctx.input.enabled = true;
    const a = anchors(world);
    await new Promise(resolve => {
      const stop = roam(ctx, {
        async onTalk(id) {
          if (id !== 'minister') return;
          await talk(ctx, script.npc.minister.first, a);
          minister.mark.visible = false; world.setGoal(null);
          stop(); resolve();
        },
      });
    });
    ctx.input.enabled = false;
  },

  async minigame(ctx) {
    const { world, dialogue, input } = ctx;
    input.enabled = false;
    // 1. 도읍 연출
    ctx.setGoal(script.goals[1]); world.setGoal(null);
    await capitalScene(ctx);

    // 2. 처인성 당겨 쏘기(3무리)
    const C = script.cheoin;
    ctx.setGoal(script.goals[2]);
    await ctx.fade(true);
    cheoinView(ctx);
    await ctx.fade(false);
    await talk(ctx, C.intro, anchors(world));
    dialogue.close();
    await showHowTo(ctx.ui, C.howto);
    const gauge = opsGauge(ctx, { value: 0.5, ...C.gauge });
    const A = scene.areas.cheoin;
    let clean = 0;
    ctx.testHooks.waveTries = C.waves.map(() => 0);
    const res = await runRounds(ctx, C.waves, (w, { index, easy }) => {
      ctx.testHooks.wave = index; ctx.testHooks.pullEasy = easy;
      const tries = (ctx.testHooks.waveTries[index] += 1);
      popText(ctx, C.waveLabels[index], null, 'good');
      gauge.set(0.5);
      return pullshot(ctx, { field: { center: A.center, wallR: A.radius, spawnR: A.spawnR, bow: A.bow }, lanes: A.lanes, wave: w, easy,
        enemies: scene.mongols.map(m => m.group), arrows: scene.arrows, gauge, texts: C.texts })
        .then(r => {
          if (r.ok) { if (tries === 1) clean += 1; popText(ctx, `${C.texts.counter} ${r.hits}명`, null, 'good'); }
          return r.ok;
        });
    }, { failHint: C.failHint, easyAfter: 2 });
    gauge.set(1);
    await ctx.wait(600);
    gauge.dispose();
    world.setMood('overcast'); // 안개를 원래대로

    // 3. 김윤후 컷
    yunhuScene(ctx);
    await talk(ctx, C.done);
    dialogue.close();

    // 4. 충주성
    ctx.setGoal(script.goals[3]);
    await ctx.fade(true);
    showChungju(ctx);
    await ctx.fade(false);
    await talk(ctx, script.chungju.slice(0, 1));
    dialogue.close();
    const Ch = scene.areas.chungju;
    world.setFixedCamera(Ch.burnCam.pos, Ch.burnCam.target); // 노비 문서 가까이
    ctx.audio?.play('whoosh');
    await scene.burnDocuments(); // 노비 문서가 타서 재가 된다(불꽃은 작게, 연기 위주)
    world.setFixedCamera(Ch.cam.pos, Ch.cam.target);
    await talk(ctx, script.chungju.slice(1));
    dialogue.close();
    ctx.setGoal(script.goals[4]);
    return { firstTryCorrect: WAVE_FIRST(clean), firstTryTotal: 2, easyModeUsed: res.easyModeUsed };
  },

  // 장 끝(퀴즈 뒤): 도장 쾅과 지혜 카드 한 장(피란 온 백성과 승려가 함께). 별은 지금 computeStars 그대로
  async finale(ctx, result) {
    await finale(ctx, { stamp: script.finale.stamp, sub: script.finale.sub, stars: result.stars, card: script.cheoin.done[0] });
  },
};
