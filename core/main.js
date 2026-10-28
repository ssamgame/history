// 게임 부트스트랩: 저장 → 첫 화면 → 이름 → 장 지도 → 장 실행 → 결과.
import { createStorage } from './storage.js';
import { createSave } from './save.js';
import { createWorld } from './world.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createDialogue } from './dialogue.js';
import { createQualityController, guessInitialQuality } from './quality.js';
import { runChapter } from './flow.js';
import { createMusic } from './music.js';
import { REVIEW } from '../content/review.js';
import { showTitle, askName, showCourses, showMap, showIntroCard, showChapterResult, showSessionCard, showReviewQuiz, showMenu, showMessage, createHud } from './screens.js';
import { perfEnabled, createPerfStats, createPerfPanel } from './perf.js';
import { ALL_CHAPTERS, COURSES, courseById, courseOfChapter, isSessionDone } from '../chapters/index.js';
import { LOOKS } from '../content/characters.js';
import { ROLES, roleLook } from '../content/roles.js';

const PREF_QUALITY = 'goryeo-game:quality';
const PREF_MUTED = 'goryeo-game:muted';
const PREF_MUSIC = 'goryeo-game:music';

function boot() {
  const ui = document.getElementById('ui');
  const storage = createStorage();
  const save = createSave(storage);
  save.load();
  const touch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hud = createHud(ui, { touch });
  const audio = createAudio();
  audio.setMuted(storage.get(PREF_MUTED) === true);
  const music = createMusic(); // 장마다 다른 배경음악. 메뉴의 '음악 끄기'나 '소리 끄기'로 끈다
  let musicOn = storage.get(PREF_MUSIC) !== false;
  const applyMusic = () => music.setEnabled(musicOn && !audio.muted);
  applyMusic();

  const savedQuality = storage.get(PREF_QUALITY);
  const initial = savedQuality || guessInitialQuality({ dpr: devicePixelRatio, cores: navigator.hardwareConcurrency, memory: navigator.deviceMemory });
  let world;
  try { world = createWorld(document.getElementById('stage'), { quality: initial }); }
  catch {
    showMessage(ui, '3D 화면을 열 수 없어요', '이 기기나 브라우저에서는 3D 그래픽을 쓸 수 없어요. 크롬 브라우저로 다시 열어 주세요.');
    return;
  }
  addEventListener('resize', () => world.resize());
  hud.attachCamera(world.camera);
  // 개발자용 성능 측정(?perf=1일 때만, 학생 화면에는 없다): world.perf로 장면·무대·역사책 시간을 기록한다
  const perf = perfEnabled() ? createPerfStats() : null;
  const quality = createQualityController({ initial, onChange: lv => { world.setQuality(lv); perf?.setQuality(lv); } });
  if (savedQuality) quality.set(savedQuality);
  world.remeasure = () => quality.restart(); // 미니게임 무대처럼 새 장면이 열리면 다시 잰다(chapters/kit/play.js)
  let perfPanel = null;
  if (perf) {
    world.perf = perf; perf.setQuality(quality.level); perf.segment('첫 화면');
    perfPanel = createPerfPanel(ui, perf, { world, onQuality: lv => quality.set(lv), getQuality: () => quality.level }); // 측정판의 화질 단추는 저장하지 않는다
  }

  const input = createInput({ target: window, joyZone: hud.joyZone, actionButton: hud.talkBtn });
  input.enabled = false;
  const actionHandlers = new Set();
  let dialogue = null;
  let role = null; // 지금 장에서 학생이 맡은 역할(content/roles.js)
  let curMeta = null, curGoals = []; // 이 장의 목표 목록(미션 진행 표시)
  input.onAction(() => {
    if (dialogue && dialogue.isOpen()) { if (!dialogue.isChoosing()) dialogue.advance(); return; }
    actionHandlers.forEach(f => f());
  });

  let inChapter = false;
  const openMenu = async () => {
    if (!inChapter) return;
    world.paused = true; // 메뉴를 보는 동안 미니게임 시간이 흐르지 않게
    const choice = await showMenu(ui, { muted: audio.muted, music: musicOn, quality: quality.level, storageOk: storage.available }, change => {
      if ('muted' in change) { audio.setMuted(change.muted); storage.set(PREF_MUTED, change.muted); }
      if ('music' in change) { musicOn = change.music; storage.set(PREF_MUSIC, change.music); }
      applyMusic();
      if (change.quality) { quality.set(change.quality); storage.set(PREF_QUALITY, change.quality); }
    });
    world.paused = false;
    if (choice === 'map') { save.abandonCurrent(); location.reload(); } // 하던 장을 버리고 새로 열면 첫 화면 → 지도
  };
  input.onMenu(openMenu);
  hud.menuBtn.addEventListener('click', openMenu);

  const ctx = {
    world, input, audio, music, hud, ui, testHooks: {},
    screens: { showIntroCard: (meta, lines) => showIntroCard(ui, meta, lines) },
    get dialogue() { return dialogue; },
    setGoal: text => { const g = curGoals, i = g.indexOf(text); hud.setGoal(text, i >= 0 ? [i + 1, g.length] : null, g); },
    wait: ms => new Promise(r => setTimeout(r, ms)),
    fade: on => hud.fade(on),
    onAction(fn) { actionHandlers.add(fn); return () => actionHandlers.delete(fn); },
  };

  let last = performance.now(), wasTalking = false;
  const frame = now => {
    const raw = (now - last) / 1000; last = now;
    if (inChapter && world.level.children.length) quality.sample(raw); // 장면이 있을 때만 잰다
    const dt = Math.min(raw, 0.1);
    const talking = dialogue && dialogue.isOpen();
    if (talking && !wasTalking) input.releaseJoystick(); // 대화가 열리면 조이스틱을 놓는다
    wasTalking = talking;
    hud.setTouchVisible(inChapter && !talking);
    world.step(dt, talking ? { x: 0, z: 0 } : input.move());
    if (perf) { const r0 = performance.now(); world.render(); perf.frame(raw * 1000, performance.now() - r0, world.renderer.info.render); perfPanel.tick(now); }
    else world.render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  async function playChapter(meta, stage) {
    const mod = (await meta.load()).default;
    world.clearLevel();
    quality.restart();
    world.camMode = 'follow';
    world.setMood(mod.mood);
    role = ROLES[meta.id] ? { ...ROLES[meta.id], lookOpts: roleLook(meta.id, mod.player) } : null;
    world.setPlayerLook(roleLook(meta.id, mod.player), role ? role.scale : 1); // 장마다 학생 역할(고려 병사, 궁궐 심부름하는 아이 등): 생김새와 키
    curMeta = meta; curGoals = Array.isArray(mod.script.goals) ? mod.script.goals : [];
    ctx.spotState = { found: new Set(), read: new Set() }; // 새 장: 발견·읽은 안내판을 새로 센다
    dialogue = createDialogue(ui, mod.script.speakers, { reduceMotion });
    hud.show(meta);
    hud.setTouchVisible(true);
    inChapter = true; input.enabled = true;
    music.play(meta.id);
    const next = nextOf(meta);
    const result = await runChapter(meta, mod, ctx, save, { resumeStage: stage, next: next && (next.meta ? { title: next.meta.short || next.meta.title } : { era: next.course.era }) });
    music.stop();
    inChapter = false; input.enabled = false;
    input.releaseJoystick();
    hud.hide();
    dialogue.dispose(); dialogue = null;
    curMeta = null;
    await showChapterResult(ui, meta, result);
    if (isSessionDone(meta.session, save)) {
      // 편 복습 퀴즈(D-21): 마지막 장(6장)을 마쳤을 때, 또는 아직 한 번도 안 풀었을 때 결과 카드 전에
      const qs = REVIEW[meta.session];
      if (qs && (meta.no === 6 || !save.review(meta.session))) save.setReview(meta.session, await showReviewQuiz(ui, meta.session, qs));
      await showSessionCard(ui, meta.session, save, ALL_CHAPTERS);
    }
    // 빛나는 문(C-02)으로 마친 장은 문 너머 다음 장(또는 다음 편 1장)으로 바로 이어 간다
    if (!mod.portal || !next) return null;
    if (next.course) { save.setCourse(next.course.id); return next.course.chapters[0]; }
    return next.meta;
  }

  // 같은 편의 다음 장, 6장이면 다음 편 { course }
  function nextOf(meta) {
    const course = courseOfChapter(meta.id), i = course.chapters.findIndex(c => c.id === meta.id);
    if (i + 1 < course.chapters.length) return { meta: course.chapters[i + 1] };
    const ci = COURSES.indexOf(course);
    return COURSES[ci + 1] ? { course: COURSES[ci + 1] } : null;
  }

  // 편 고르기 → 그 편의 지도 → 장. 고른 편은 저장해 두어 다음에 열면 그 편 지도부터 보인다.
  const pickCourse = async () => { save.setCourse(await showCourses(ui, COURSES, save)); };

  async function mapLoop() {
    for (;;) {
      if (save.data.current) {
        const { id, stage } = save.data.current;
        const meta = ALL_CHAPTERS.find(c => c.id === id);
        if (meta && meta.load) {
          const cid = courseOfChapter(id).id;
          if (save.data.course !== cid) save.setCourse(cid); // 이어하기 뒤 '장 선택으로'는 그 편 지도로
          let nx = await playChapter(meta, stage);
          while (nx && nx.load) nx = await playChapter(nx, 'intro');
          continue;
        }
        save.data.current = null;
      }
      if (!save.data.course) await pickCourse();
      const course = courseById(save.data.course);
      music.play(`map:${course.id}`); // 시대 지도에서는 그 시대의 잔잔한 음악
      const id = await showMap(ui, course.chapters, save, {
        heading: `${course.era}편 · ${course.title}`, onCourses: true,
        onSessionCard: () => showSessionCard(ui, course.session, save, ALL_CHAPTERS),
      });
      if (id === 'courses') { await pickCourse(); continue; }
      let nx = await playChapter(ALL_CHAPTERS.find(c => c.id === id), 'intro');
      while (nx && nx.load) nx = await playChapter(nx, 'intro');
    }
  }

  async function main() {
    const debug = new URLSearchParams(location.search).get('debug');
    // 개발용: ?debug=ch2-scene 처럼 장면만 띄운다. ?debug=ch2-minigame 은 미니게임부터, ?debug=ch2-quiz 는 퀴즈부터 시작한다. 조선편은 ?debug=j1-scene, 근대·일제 강점기·현대편은 k1·i1·h1.
    const dm = /^(ch\d|[jkih]\d)-(scene|intro|explore|minigame|quiz)$/.exec(debug || ''); // intro: 도입 장면부터
    const meta = dm && ALL_CHAPTERS.find(c => c.id === dm[1] && c.load);
    if (meta) {
      window.__world = world; window.__ctx = ctx; // 개발용(?debug=…)에서만: 콘솔로 장면과 진행을 살펴본다
      if (dm[2] !== 'scene') { let nx = await playChapter(meta, dm[2]); while (nx && nx.load) nx = await playChapter(nx, 'intro'); return mapLoop(); }
      const mod = (await meta.load()).default;
      world.setMood(mod.mood); world.setPlayerLook(roleLook(meta.id, mod.player), ROLES[meta.id]?.scale ?? 1); const sc = mod.buildScene(world, ctx);
      const [sx, sz] = sc.start || [0, 19];
      world.player.position.set(sx, 0, sz); world.snapCamera(); input.enabled = true; inChapter = true;
      return;
    }
    const hasProgress = !!(save.data.name || Object.keys(save.data.chapters).length || save.data.current);
    const cur = save.data.current && courseOfChapter(save.data.current.id).id; // 하다 만 장이 있는 시대
    world.player.visible = false; // 첫 화면 글 뒤에 사람이 겹쳐 보이지 않게
    const { action, course } = await showTitle(ui, { savedName: save.data.name, hasProgress, storageOk: storage.available, courses: COURSES, save, course: cur || save.data.course });
    if (action === 'new') {
      save.reset();
      save.setName(await askName(ui, ''));
    } else if (cur && cur !== course) save.abandonCurrent(); // 다른 시대로 넘어가면 하다 만 장만 내려놓는다(마친 장과 별은 그대로)
    save.setCourse(course);
    world.player.visible = true;
    await mapLoop();
  }
  main();
}

// 오프라인 캐시는 https 배포 주소에서만 쓴다(개발 중 localhost에서는 수정이 바로 보이도록). 실패해도 게임은 그대로.
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js', { type: 'module', updateViaCache: 'none' }).catch(() => {}); // 새 판을 늘 서버에서 확인
}

boot();
