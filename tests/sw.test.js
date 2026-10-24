import { test, eq, ok } from './harness.js';
import { PRECACHE, CACHE, networkFirst } from '../core/precache.js';

const MUST = [
  'index.html', 'styles.css', 'vendor/three.module.min.js', 'content/sources.js',
  'core/main.js', 'core/storage.js', 'core/save.js', 'core/content.js', 'core/dialogue.js', 'core/input.js',
  'core/quality.js', 'core/audio.js', 'core/world.js', 'core/people.js', 'core/screens.js', 'core/flow.js',
  'chapters/index.js', 'chapters/ch1/chapter.js', 'chapters/ch1/scene.js', 'chapters/ch1/script.js',
];

test('sw: cache name is versioned', () => eq(CACHE, 'goryeo-v61'));

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

import { precacheRequests } from '../core/precache.js';
test('sw: install fetches fresh files, not the browser HTTP cache', () => {
  const reqs = precacheRequests();
  eq(reqs.length, PRECACHE.length);
  ok(reqs.every(r => r.cache === 'reload'), 'cache: reload');
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
