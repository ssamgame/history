// 서비스 워커가 처음 설치될 때 기기에 저장해 둘 파일 목록. 장을 추가하면 여기에도 넣는다.
import { DIST_FIRST } from '../dist/manifest.js';
export const CACHE = 'goryeo-v100'; // 배포할 때마다 올린다 (학생 기기에 새 판이 반영되도록)

export const PRECACHE = [
  'index.html', 'styles.css', 'vendor/three.module.min.js', 'content/sources.js', 'content/review.js',
  'core/main.js', 'core/avatar-ui.js', 'core/arrival.js', 'core/timemachine.js', 'core/travel.js', 'content/avatar.js', 'content/qr.js', 'content/growth.js', 'core/growth-ui.js', 'core/progress-code.js', 'core/bake.js', 'core/perf.js', 'core/fire.js', 'core/storage.js', 'core/save.js', 'core/content.js', 'core/dialogue.js', 'core/input.js',
  'core/quality.js', 'core/audio.js', 'core/world.js', 'core/people.js', 'core/screens.js', 'core/flow.js', 'core/portal.js', 'core/intro.js',
  'core/precache.js', 'core/facebuild.js', 'core/hairstyle.js', 'core/motion.js', 'core/horse.js', 'core/interact.js', 'chapters/kit/story.js',
  'core/minigame.js', 'core/weather.js', 'core/faces.js', 'core/music.js', 'core/textures.js', 'core/props.js', 'core/sea.js', 'core/body.js', 'core/gait.js', 'vendor/jsm/loaders/GLTFLoader.js', 'vendor/jsm/utils/BufferGeometryUtils.js', 'vendor/jsm/utils/SkeletonUtils.js', 'assets/models/body.glb', 'content/characters.js', 'content/glyphs.js',
  'core/quizview.js', 'content/roles.js',
  'chapters/index.js', 'chapters/ch1/chapter.js', 'chapters/ch1/scene.js', 'chapters/ch1/script.js', 'chapters/ch1/story.js',
  'chapters/ch2/chapter.js', 'chapters/ch2/scene.js', 'chapters/ch2/script.js', 'chapters/ch2/story.js',
  'chapters/ch3/chapter.js', 'chapters/ch3/scene.js', 'chapters/ch3/script.js', 'chapters/ch3/story.js',
  'chapters/ch4/chapter.js', 'chapters/ch4/scene.js', 'chapters/ch4/script.js', 'chapters/ch4/story.js',
  'chapters/ch5/chapter.js', 'chapters/ch5/scene.js', 'chapters/ch5/script.js', 'chapters/ch5/story.js', 'chapters/ch5/work.js',
  'chapters/ch6/chapter.js', 'chapters/ch6/scene.js', 'chapters/ch6/script.js', 'chapters/ch6/story.js',
  'chapters/joseon/common.js', 'chapters/joseon/landmarks.js', 'core/signs.js',
  'chapters/joseon/j1/chapter.js', 'chapters/joseon/j1/scene.js', 'chapters/joseon/j1/script.js', 'chapters/joseon/j1/story.js',
  'chapters/joseon/j2/chapter.js', 'chapters/joseon/j2/scene.js', 'chapters/joseon/j2/script.js', 'chapters/joseon/j2/story.js',
  'chapters/joseon/j3/chapter.js', 'chapters/joseon/j3/scene.js', 'chapters/joseon/j3/script.js',
  'chapters/joseon/j4/chapter.js', 'chapters/joseon/j4/scene.js', 'chapters/joseon/j4/script.js', 'chapters/joseon/j4/story.js',
  'chapters/joseon/j5/chapter.js', 'chapters/joseon/j5/scene.js', 'chapters/joseon/j5/script.js', 'chapters/joseon/j5/story.js',
  'chapters/joseon/j6/chapter.js', 'chapters/joseon/j6/scene.js', 'chapters/joseon/j6/script.js', 'chapters/joseon/j6/story.js', 'chapters/joseon/j6/hold.js',
  'chapters/kit/chapter.js', 'chapters/kit/town.js', 'chapters/kit/play.js', 'chapters/kit/buildings.js', 'chapters/kit/terrain.js', 'chapters/kit/gate.js', 'chapters/kit/lead.js', 'chapters/kit/talk.js', 'chapters/kit/fire.js', 'chapters/kit/diorama.js', 'chapters/kit/walk.js', 'chapters/kit/warmap.js', 'chapters/kit/army.js', 'chapters/kit/row.js', 'chapters/kit/clash.js', 'chapters/joseon/ships.js', 'chapters/joseon/j2/pictures.js', 'chapters/modern/pictures.js', 'chapters/modern/dioramas.js',
  'chapters/modern/k1/chapter.js', 'chapters/modern/k1/script.js', 'chapters/modern/k1/story.js',
  'chapters/modern/k2/chapter.js', 'chapters/modern/k2/script.js', 'chapters/modern/k2/story.js',
  'chapters/modern/k3/chapter.js', 'chapters/modern/k3/script.js', 'chapters/modern/k3/stage.js',
  'chapters/modern/k4/chapter.js', 'chapters/modern/k4/script.js',
  'chapters/modern/k5/chapter.js', 'chapters/modern/k5/script.js',
  'chapters/modern/k6/chapter.js', 'chapters/modern/k6/script.js',
  'chapters/colonial/i1/chapter.js', 'chapters/colonial/i1/script.js',
  'chapters/colonial/i2/chapter.js', 'chapters/colonial/i2/script.js',
  'chapters/colonial/i3/chapter.js', 'chapters/colonial/i3/script.js',
  'chapters/colonial/i4/chapter.js', 'chapters/colonial/i4/script.js',
  'chapters/colonial/i5/chapter.js', 'chapters/colonial/i5/script.js',
  'chapters/colonial/i6/chapter.js', 'chapters/colonial/i6/script.js',
  'chapters/present/h1/chapter.js', 'chapters/present/h1/script.js',
  'chapters/present/h2/chapter.js', 'chapters/present/h2/script.js',
  'chapters/present/h3/chapter.js', 'chapters/present/h3/script.js',
  'chapters/present/h4/chapter.js', 'chapters/present/h4/script.js',
  'chapters/present/h5/chapter.js', 'chapters/present/h5/script.js',
  'chapters/present/h6/chapter.js', 'chapters/present/h6/script.js',
];

// 오프라인에서 폴더 주소(…/game/)로 들어오는 화면 요청은 저장해 둔 index.html로 연다.
export function cacheKeyFor(url, mode, swUrl) {
  if (mode !== 'navigate') return null;
  const u = new URL(url), base = new URL('./', swUrl);
  return u.pathname === base.pathname || u.pathname === `${base.pathname}index.html` ? 'index.html' : null;
}

// 여러 명이 한꺼번에 접속할 때(2026-11-12 선생님: 20명 넘게 켜면 접속이 잘 안 된다): 한 교실에서 요청이 몰리지 않게 한다.
// ① 설치할 때는 모든 장에 공통인 파일만 미리 받는다(장마다의 파일은 그 장에 들어갈 때 받아 저장) ② 한꺼번에가 아니라 네 개씩 차례로,
// 못 받은 파일은 건너뛴다(나중에 쓰일 때 다시 받는다) ③ 한 번 저장한 파일은 서버에 묻지 않고 바로 쓴다(cacheFirst) — 새 판은 CACHE 번호가
// 바뀌어 통째로 새로 받으므로 옛 파일이 섞이지 않는다. 고친 내용은 다음에 열 때 보인다.
const PER_CHAPTER = /^chapters\/(ch\d|joseon\/j\d|modern\/k\d|colonial\/i\d|present\/h\d)\//;
export const INSTALL = PRECACHE.filter(u => !PER_CHAPTER.test(u));
// 학생 주소에서는 묶은 판(dist/, tools/build.cjs)을 쓴다: 첫 화면에 필요한 묶음 몇 개와 화면·모델 파일만 미리 받는다
export const INSTALL_DIST = ['index.html', 'styles.css', 'assets/models/body.glb', ...DIST_FIRST];
// 서버에 바뀌었는지 물어 받는다(브라우저가 방금 받은 파일이면 '그대로'라는 짧은 답만 온다). bundled: 묶은 판을 쓰는 곳인지
export function precacheRequests(bundled = false) {
  return (bundled ? INSTALL_DIST : INSTALL).map(u => new Request(u, { cache: 'no-cache' }));
}
// 목록을 size개씩 차례로 받아 저장한다. 실패한 것은 세어만 두고 넘어간다. 돌려주는 값: 저장한 수
export async function precacheGently(reqs, { fetch, put, size = 4 }) {
  let saved = 0;
  for (let i = 0; i < reqs.length; i += size) {
    await Promise.all(reqs.slice(i, i + size).map(async r => { try { const res = await fetch(r); if (res && res.ok) { await put(r, res); saved += 1; } } catch { /* 건너뛴다 */ } }));
  }
  return saved;
}
// 저장본이 있으면 바로 쓰고, 없을 때만 서버에서 받아 저장한다
export function cacheFirst({ fetch, match, put }) {
  return match().then(hit => hit || Promise.resolve().then(fetch).then(r => { if (r && r.ok) put(r.clone()); return r; }));
}

// 학생 주소가 아닌 곳(미리보기)에서 쓰는 방식: 인터넷이 되면 언제나 새 파일을 쓰고 저장본도 바꾼다.
// 끊겼거나 timeoutMs 안에 오지 않으면 저장본을 쓴다(교실 와이파이가 느릴 때). 저장본이 없으면 새 파일을 끝까지 기다린다.
export function networkFirst({ fetch, match, put, timeoutMs = 4000 }) {
  const fresh = Promise.resolve().then(fetch).then(r => { if (r && r.ok) put(r.clone()); return r; });
  return match().then(hit => {
    if (!hit) return fresh;
    const late = new Promise(ok => setTimeout(() => ok(hit), timeoutMs));
    return Promise.race([fresh.catch(() => hit), late]);
  });
}
