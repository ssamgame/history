// 서비스 워커가 처음 설치될 때 기기에 저장해 둘 파일 목록. 장을 추가하면 여기에도 넣는다.
export const CACHE = 'goryeo-v64'; // 배포할 때마다 올린다 (학생 기기에 새 판이 반영되도록)

export const PRECACHE = [
  'index.html', 'styles.css', 'vendor/three.module.min.js', 'content/sources.js',
  'core/main.js', 'core/notebook.js', 'core/bake.js', 'core/perf.js', 'core/fire.js', 'core/storage.js', 'core/save.js', 'core/content.js', 'core/dialogue.js', 'core/input.js',
  'core/quality.js', 'core/audio.js', 'core/world.js', 'core/people.js', 'core/screens.js', 'core/flow.js',
  'core/precache.js',
  'core/minigame.js', 'core/weather.js', 'core/faces.js', 'core/music.js', 'core/textures.js', 'core/props.js', 'content/characters.js', 'content/glyphs.js',
  'core/quizview.js', 'content/roles.js', 'chapters/ch5/pictures.js',
  'chapters/index.js', 'chapters/ch1/chapter.js', 'chapters/ch1/scene.js', 'chapters/ch1/script.js',
  'chapters/ch2/chapter.js', 'chapters/ch2/scene.js', 'chapters/ch2/script.js',
  'chapters/ch3/chapter.js', 'chapters/ch3/scene.js', 'chapters/ch3/script.js',
  'chapters/ch4/chapter.js', 'chapters/ch4/scene.js', 'chapters/ch4/script.js',
  'chapters/ch5/chapter.js', 'chapters/ch5/scene.js', 'chapters/ch5/script.js',
  'chapters/ch6/chapter.js', 'chapters/ch6/scene.js', 'chapters/ch6/script.js',
  'chapters/joseon/common.js', 'chapters/joseon/landmarks.js', 'core/signs.js',
  'chapters/joseon/j1/chapter.js', 'chapters/joseon/j1/scene.js', 'chapters/joseon/j1/script.js',
  'chapters/joseon/j2/chapter.js', 'chapters/joseon/j2/scene.js', 'chapters/joseon/j2/script.js',
  'chapters/joseon/j3/chapter.js', 'chapters/joseon/j3/scene.js', 'chapters/joseon/j3/script.js',
  'chapters/joseon/j4/chapter.js', 'chapters/joseon/j4/scene.js', 'chapters/joseon/j4/script.js',
  'chapters/joseon/j5/chapter.js', 'chapters/joseon/j5/scene.js', 'chapters/joseon/j5/script.js',
  'chapters/joseon/j6/chapter.js', 'chapters/joseon/j6/scene.js', 'chapters/joseon/j6/script.js',
  'chapters/kit/chapter.js', 'chapters/kit/town.js', 'chapters/kit/play.js', 'chapters/kit/buildings.js', 'chapters/kit/terrain.js', 'chapters/kit/diorama.js', 'chapters/joseon/ships.js', 'chapters/joseon/j2/pictures.js', 'chapters/modern/pictures.js', 'chapters/modern/dioramas.js',
  'chapters/modern/k1/chapter.js', 'chapters/modern/k1/script.js',
  'chapters/modern/k2/chapter.js', 'chapters/modern/k2/script.js',
  'chapters/modern/k3/chapter.js', 'chapters/modern/k3/script.js',
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

// 설치할 때는 브라우저 HTTP 캐시를 거치지 않고 서버에서 새로 받는다 (옛 파일이 새 판에 섞이지 않게)
export function precacheRequests() {
  return PRECACHE.map(u => new Request(u, { cache: 'reload' }));
}

// 파일 받기: 인터넷이 되면 언제나 새 파일을 쓰고(고친 내용이 바로 보이게) 저장본도 바꾼다.
// 끊겼거나 timeoutMs 안에 오지 않으면 저장본을 쓴다(교실 와이파이가 느릴 때). 저장본이 없으면 새 파일을 끝까지 기다린다.
export function networkFirst({ fetch, match, put, timeoutMs = 4000 }) {
  const fresh = Promise.resolve().then(fetch).then(r => { if (r && r.ok) put(r.clone()); return r; });
  return match().then(hit => {
    if (!hit) return fresh;
    const late = new Promise(ok => setTimeout(() => ok(hit), timeoutMs));
    return Promise.race([fresh.catch(() => hit), late]);
  });
}
