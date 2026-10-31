// 한 장을 단계(해설 → 탐험 → 미니게임 → 퀴즈) 순서로 실행하고, 단계마다 체크포인트를 남긴다.
import { setHairEra, eraOfChapter } from './hairstyle.js';
import { computeStars } from './save.js';
import { bakeLevel } from './bake.js';
import { showQuizView, endQuizView } from './quizview.js';
import { portalStage } from './portal.js';
import { playIntro } from './intro.js';
import { setRigHook, POST_POSE } from './people.js';
import { bodyOn, loadBody, attachBody, updateBodies, resetBodies, setBodyView } from './body.js';

export const STAGES = ['intro', 'explore', 'minigame', 'quiz'];
// 공통 뼈대 몸: 켜져 있으면(bodyOn) body.glb를 불러 makePerson 끝에 뼈대를 붙이게 하고, 매 프레임 동작을 갱신한다. 못 불러오면 예전 인물로 한다
async function prepareBodies(ctx) {
  setRigHook(null);
  if (!bodyOn()) return;
  try {
    await loadBody();
    resetBodies(); setRigHook(attachBody); POST_POSE.add(updateBodies); setBodyView(ctx.world); // 멀리 있는 사람은 가볍게
    if (ctx.world?.playerLookArgs) ctx.world.setPlayerLook(...ctx.world.playerLookArgs); // 학생도 뼈대 몸으로
  } catch (e) { console.warn('뼈대 몸(body.glb)을 불러오지 못해 예전 인물로 한다', e); }
}

// next: 다음 장 { title }(사건 이름) 또는 다음 편 { era } — 장 모듈에 portal이 있으면 퀴즈 전에 그쪽으로 가는 빛나는 문을 세운다(C-02)
export async function runChapter(meta, chapter, ctx, save, { resumeStage = 'intro', next = null } = {}) {
  const t0 = performance.now();
  const from = Math.max(0, STAGES.indexOf(resumeStage));
  const result = { firstTryCorrect: 0, firstTryTotal: 0, easyModeUsed: false, quizCorrect: 0, quizTotal: 0, wrongQuizzes: [] };
  const cur = save.data.current;
  if (from === 3 && cur && cur.id === meta.id && cur.carry) Object.assign(result, cur.carry); // 미니게임 결과를 되살린다
  // 걸린 시간: 이어하기 전에 쓴 시간(elapsed)에 이어서 센다. 체크포인트와 화면을 떠날 때마다 저장한다.
  const base = from > 0 && cur && cur.id === meta.id && Number.isFinite(cur.elapsed) ? cur.elapsed : 0;
  const spent = () => base + (performance.now() - t0) / 1000;
  const stamp = () => { const c = save.data.current; if (c && c.id === meta.id) { c.elapsed = Math.round(spent()); save.persist(); } };
  const checkpoint = (stage, carry) => { save.checkpoint(meta.id, stage, carry); stamp(); };
  const onHide = () => { if (document.visibilityState === 'hidden') stamp(); };
  const tick = setInterval(stamp, 15000);
  addEventListener('pagehide', stamp); document.addEventListener('visibilitychange', onHide);
  const level = l => { if (ctx.music) ctx.music.setLevel(l); }; // 배경음악: 탐험은 잔잔하게, 미니게임 전투는 세게
  level('calm');
  try {
    // 장 도입(C-03): introScene이 있는 장은 장면을 먼저 지은 뒤 해설을 자막으로 띄우며 3D로 재현한다. 없는 장은 예전 해설 카드
    const film = !!(chapter.introScene && ctx.world && ctx.ui);
    if (from === 0) {
      checkpoint('intro');
      if (!film) await ctx.screens.showIntroCard(meta, chapter.script.intro);
    }
    const perf = ctx.world?.perf, t1 = performance.now(); // perf: 개발용 성능 측정(?perf=1)일 때만 있다
    setHairEra(eraOfChapter(chapter.id || meta?.id || ''), chapter.id || meta?.id || ''); // 이 장의 시대 머리 모양으로 인물을 짓는다(D-56)
    await prepareBodies(ctx); // 공통 뼈대 몸(core/body.js): 켜져 있으면 이 장에서 만드는 사람은 뼈대와 동작 묶음으로 움직인다
    const built = chapter.buildScene(ctx.world, ctx);
    const t2 = performance.now();
    if (chapter.bake !== false && ctx.world?.level && ctx.world.npcs) bakeLevel(ctx.world, built); // 움직이지 않는 조각을 재질별로 합쳐 태블릿에서 가볍게
    ctx.world?.applyDecor?.(); // 화질에 따라 먼 장식 켜고 끄기
    if (perf) { perf.time('장면 짓기', t2 - t1, meta.id); perf.time('장면 굳히기', performance.now() - t2, meta.id); }
    if (from > 0) chapter.enterStage?.(ctx, STAGES[from]);
    if (from === 0 && film) await playIntro(ctx, meta, chapter.script.intro, chapter.introScene(ctx));

    if (from <= 1) {
      checkpoint('explore'); perf?.segment(`${meta.id} 탐험`);
      await chapter.explore(ctx);
    }
    if (from <= 2) {
      checkpoint('minigame'); perf?.segment(`${meta.id} 미니게임`);
      level('battle');
      const mg = await chapter.minigame(ctx);
      Object.assign(result, { firstTryCorrect: mg.firstTryCorrect, firstTryTotal: mg.firstTryTotal, easyModeUsed: mg.easyModeUsed });
    }

    level('calm'); perf?.segment(`${meta.id} 퀴즈`);
    checkpoint('quiz', { firstTryCorrect: result.firstTryCorrect, firstTryTotal: result.firstTryTotal, easyModeUsed: result.easyModeUsed });
    // 퀴즈는 저절로 시작하지 않는다: 마을의 빛나는 문 앞에서 E를 눌러야 시작(C-02)
    if (chapter.portal && ctx.world && ctx.ui) await portalStage(ctx, chapter, next);
    // 배운 내용 확인: 일어난 차례(year)대로 묻고, 문제마다 관련된 장면을 뒤에 비춘다. 틀리면 해설을 듣고 다시 고른다.
    const quizzes = [...chapter.quizzes].sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
    for (const [k, q] of quizzes.entries()) {
      const hide = ctx.world && ctx.ui ? showQuizView(ctx, chapter, q, k) : () => {}; // 3D 장면이 없는 시험용 ctx에서는 배경 없이
      const { correct } = await ctx.dialogue.quiz(q).finally(hide);
      result.quizTotal += 1;
      if (correct) result.quizCorrect += 1;
      else result.wrongQuizzes.push({ question: q.question, answer: q.options[q.answer], explain: q.explain });
    }
    ctx.dialogue.close();
    if (ctx.world) endQuizView(ctx);
  } finally { clearInterval(tick); removeEventListener('pagehide', stamp); document.removeEventListener('visibilitychange', onHide); }

  result.seconds = Math.round(spent());
  result.stars = computeStars(result);
  save.finishChapter(meta.id, result);
  return result;
}

// 탐험 중 돌아다니기: 가까운 인물에게 말 걸기와 특정 지점 도착을 처리한다.
// 반환값은 멈추는 함수. 대화 중에는 움직임을 막는다.
export function roam(ctx, { onTalk, zones = [] }) {
  const { world, input, hud, dialogue } = ctx;
  let busy = false, stopped = false;
  const inside = new Set();
  // 안내판(볼거리): 가까이 오면 '새 장소 발견'을 한 번 알리고, 읽은 수를 화면 위에 보인다
  const spots = [...world.npcs.values()].filter(n => n.spot);
  const st = ctx.spotState || (ctx.spotState = { found: new Set(), read: new Set() }), found = st.found, read = st.read; // 장마다 새로(main.js)
  const showRead = () => hud.setFound?.(spots.length ? `살펴본 안내판 ${spots.filter(n => read.has(n.id)).length} / ${spots.length}` : null);
  showRead();
  const off = world.onUpdate(() => {
    if (stopped || busy) { hud.setPrompt(null); hud.setTalkEnabled(false); return; }
    const npc = world.nearestNpc(2.8);
    hud.setPrompt(npc ? npc.mesh.position : null);
    hud.setTalkEnabled(!!npc);
    const p = world.player.position;
    for (const n of spots) {
      if (found.has(n.id) || !n.mesh.visible || n.mesh.position.distanceTo(p) > 7) continue;
      found.add(n.id); // '새 장소 발견' 알림은 뺐다(C-01: 안내는 대화와 퀘스트로만)
    }
    for (const z of zones) {
      const now = (!z.active || z.active()) && Math.hypot(p.x - z.x, p.z - z.z) < z.r; // 비활성 구역은 '안에 있음'으로 치지 않는다
      if (now && !inside.has(z)) { inside.add(z); z.onEnter(); }
      if (!now) inside.delete(z);
    }
  });
  const unbind = ctx.onAction(async () => {
    if (stopped || busy || dialogue.isOpen()) return;
    const npc = world.nearestNpc(2.8);
    if (!npc) return;
    busy = true; input.enabled = false;
    const p = npc.mesh.position;
    npc.mesh.rotation.y = Math.atan2(world.player.position.x - p.x, world.player.position.z - p.z);
    world.setTalkCamera(npc.mesh); // 대화하는 동안 인물 얼굴 가까이
    if (npc.spot) { read.add(npc.id); showRead(); }
    try { await onTalk(npc.id); } finally {
      if (world.camMode === 'talk') world.camMode = 'follow';
      dialogue.close();
      busy = false; input.enabled = !stopped;
    }
  });
  return () => { stopped = true; off(); unbind(); hud.setPrompt(null); hud.setTalkEnabled(false); hud.setFound?.(null); };
}
