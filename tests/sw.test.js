import { test, eq, ok } from './harness.js';
import { PRECACHE, CACHE, networkFirst } from '../core/precache.js';

const MUST = [
  'index.html', 'styles.css', 'vendor/three.module.min.js', 'content/sources.js',
  'core/main.js', 'core/storage.js', 'core/save.js', 'core/content.js', 'core/dialogue.js', 'core/input.js',
  'core/quality.js', 'core/audio.js', 'core/world.js', 'core/people.js', 'core/screens.js', 'core/flow.js',
  'chapters/index.js', 'chapters/ch1/chapter.js', 'chapters/ch1/scene.js', 'chapters/ch1/script.js',
];

test('sw: cache name is versioned', () => eq(CACHE, 'goryeo-v103'));

test('sw: PRECACHE lists every file the game imports for ch1', () => {
  for (const f of MUST) ok(PRECACHE.includes(f), `missing ${f}`);
});

test('sw: every PRECACHE file exists on the server', async () => {
  for (const f of PRECACHE) {
    const r = await fetch(`../${f}`, { cache: 'no-store' });
    ok(r.ok, `${f} → ${r.status}`);
  }
});
import { cacheKeyFor } from '../core/precache.js';

test('sw: opening the folder address offline uses the cached index.html', () => {
  eq(cacheKeyFor('https://example.org/game/', 'navigate', 'https://example.org/game/sw.js'), 'index.html');
  eq(cacheKeyFor('https://example.org/game/?debug=x', 'navigate', 'https://example.org/game/sw.js'), 'index.html');
  eq(cacheKeyFor('https://example.org/game/core/main.js', 'cors', 'https://example.org/game/sw.js'), null);
});

import { precacheRequests, precacheGently, cacheFirst, INSTALL } from '../core/precache.js';
// 2026-11-12 선생님: 20명 넘게 한꺼번에 켜면 접속이 잘 안 된다 → 요청이 몰리지 않게
test('sw: 설치할 때는 공통 파일만(장마다의 파일은 들어갈 때), 서버에 바뀌었는지 물어 받는다', () => {
  const reqs = precacheRequests();
  eq(reqs.length, INSTALL.length); ok(INSTALL.length < PRECACHE.length * 0.6, `${INSTALL.length}/${PRECACHE.length}`);
  ok(reqs.every(r => r.cache === 'no-cache'), '옛 파일이 섞이지 않게 서버에 묻는다');
  ok(!INSTALL.some(u => /chapters\/(ch1|joseon\/j3|modern\/k2|colonial\/i4|present\/h6)\//.test(u)), '장마다의 파일은 빼 둔다');
  for (const u of ['index.html', 'core/main.js', 'vendor/three.module.min.js', 'assets/models/body.glb', 'chapters/index.js', 'chapters/kit/play.js', 'chapters/joseon/common.js']) ok(INSTALL.includes(u), u);
});
// 묶은 판(dist/): 학생 주소에서만 쓴다. 원본을 고치고 `node tools/build.cjs`를 돌리지 않으면 이 검사가 실패한다
test('sw: dist가 원본과 같은 판이다(고친 뒤 node tools/build.cjs), 묶음 파일이 모두 있고 첫 화면 묶음은 몇 개뿐', async () => {
  const { DIST_FIRST, DIST_ALL, SRC_FILES, SRC_HASH } = await import('../dist/manifest.js');
  const { INSTALL_DIST } = await import('../core/precache.js');
  ok(DIST_FIRST.length <= 8 && DIST_FIRST.includes('dist/main.js'), `첫 화면 묶음 ${DIST_FIRST.length}개`); ok(DIST_FIRST.every(f => DIST_ALL.includes(f)));
  for (const f of DIST_ALL) ok((await fetch(`../${f}`, { method: 'HEAD' })).ok, f);
  eq(INSTALL_DIST, ['index.html', 'styles.css', 'assets/models/body.glb', ...DIST_FIRST]); eq(precacheRequests(true).length, INSTALL_DIST.length);
  ok(SRC_FILES.includes('core/main.js') && SRC_FILES.includes('chapters/present/h6/chapter.js') && SRC_FILES.includes('vendor/three.module.min.js'), '모든 장과 three가 묶였다');
  const enc = new TextEncoder(), parts = [];
  for (const f of SRC_FILES) { parts.push(enc.encode(f + '\n'), new Uint8Array(await (await fetch(`../${f}`, { cache: 'no-store' })).arrayBuffer())); }
  const all = new Uint8Array(parts.reduce((a, p) => a + p.length, 0)); let at = 0; for (const p of parts) { all.set(p, at); at += p.length; }
  const hex = [...new Uint8Array(await crypto.subtle.digest('SHA-256', all))].map(b => b.toString(16).padStart(2, '0')).join('');
  eq(hex, SRC_HASH, '원본이 바뀌었다: node tools/build.cjs 를 돌려 dist를 다시 만든다');
  const html = await (await fetch('../index.html')).text(); ok(html.includes("endsWith('github.io') ? './dist/main.js' : './core/main.js'"), '학생 주소에서만 묶은 판');
});
test('sw: 미리 받기는 네 개씩 차례로, 못 받은 파일은 건너뛰고 끝까지 간다', async () => {
  let now = 0, peak = 0; const put = [];
  const fetch = async r => { now += 1; peak = Math.max(peak, now); await new Promise(ok => setTimeout(ok, 5)); now -= 1; if (r === 'bad') throw new Error('x'); return { ok: r !== 'e404' }; };
  const n = await precacheGently(['a', 'b', 'bad', 'c', 'd', 'e404', 'e', 'f', 'g', 'h'], { fetch, put: async r => { put.push(r); } });
  eq(n, 8); eq(put.sort(), ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']); ok(peak <= 4, `한 번에 ${peak}개`);
});
test('sw: 저장본이 있으면 서버에 묻지 않고 바로 쓰고, 없을 때만 받아 저장한다', async () => {
  const R = body => ({ ok: true, body, clone() { return this; } });
  let asked = 0, saved = null;
  const hit = await cacheFirst({ fetch: async () => { asked += 1; return R('new'); }, match: async () => R('old'), put: x => { saved = x; } });
  eq(hit.body, 'old'); eq(asked, 0, '서버에 묻지 않는다');
  const miss = await cacheFirst({ fetch: async () => { asked += 1; return R('new'); }, match: async () => undefined, put: x => { saved = x; } });
  eq(miss.body, 'new'); eq(asked, 1); eq(saved.body, 'new');
  const bad = await cacheFirst({ fetch: async () => ({ ok: false, clone() { return this; } }), match: async () => undefined, put: () => { saved = 'no'; } }); ok(!bad.ok && saved !== 'no', '실패한 답은 저장하지 않는다');
});

// 업데이트 바로 보이기: 인터넷이 되면 언제나 새 파일, 안 되거나 아주 느리면 저장본
const res = body => ({ ok: true, body, clone() { return this; } });
test('sw: online, the fresh file is used even when an old copy is saved', async () => {
  let saved = null;
  const r = await networkFirst({ fetch: async () => res('new'), match: async () => res('old'), put: x => { saved = x; } });
  eq(r.body, 'new');
  eq(saved && saved.body, 'new', 'saved copy updated');
});

test('sw: offline, the saved copy is used', async () => {
  const r = await networkFirst({ fetch: async () => { throw new Error('offline'); }, match: async () => res('old'), put: () => {} });
  eq(r.body, 'old');
});

test('sw: very slow network falls back to the saved copy after the timeout', async () => {
  const r = await networkFirst({ fetch: () => new Promise(() => {}), match: async () => res('old'), put: () => {}, timeoutMs: 30 });
  eq(r.body, 'old');
});

test('sw: nothing saved yet, it waits for the network', async () => {
  const r = await networkFirst({ fetch: () => new Promise(ok => setTimeout(() => ok(res('new')), 60)), match: async () => undefined, put: () => {}, timeoutMs: 10 });
  eq(r.body, 'new');
});

// 게임이 불러오는 모든 코드 파일(import를 따라가며 모음)이 PRECACHE에 있어야 미리보기·오프라인에서 빠지지 않는다
test('sw: PRECACHE lists every module reachable by import', async () => {
  const seen = new Set(), todo = ['core/main.js'], missing = [];
  while (todo.length) {
    const f = todo.pop(); if (seen.has(f)) continue; seen.add(f);
    if (!PRECACHE.includes(f)) missing.push(f);
    const src = await (await fetch('../' + f)).text();
    for (const m of src.matchAll(/(?:from\s*|import\s*\(\s*)['"](\.{1,2}\/[^'"]+\.js)['"]/g)) todo.push(new URL(m[1], 'http://x/' + f).pathname.slice(1));
  }
  ok(seen.size > 90, `found ${seen.size}`);
  ok(!missing.length, 'missing ' + missing.join(' '));
});
