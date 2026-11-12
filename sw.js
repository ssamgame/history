// 오프라인 캐시: 받은 게임 파일을 기기에 저장해 두고, 저장된 파일이 있으면 서버에 묻지 않고 바로 쓴다
// (여러 명이 한꺼번에 접속해도 요청이 몰리지 않게, core/precache.js). 새 판은 CACHE 번호가 바뀌어 새로 받는다.
import { CACHE, precacheRequests, precacheGently, cacheKeyFor, cacheFirst, networkFirst } from './core/precache.js';

// 학생 주소에서만 '저장본 먼저'와 묶은 판을 쓴다. 미리보기처럼 판 번호 없이 자주 바뀌는 곳은 예전처럼 늘 새 파일을 먼저 받는다
const LIVE = self.location.hostname.endsWith('github.io');

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => precacheGently(precacheRequests(LIVE), { fetch: r => fetch(r), put: (r, res) => c.put(r, res) })).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const key = cacheKeyFor(req.url, req.mode, self.location.href);
  e.respondWith((LIVE ? cacheFirst : networkFirst)({
    fetch: () => fetch(req, { cache: 'no-cache' }), // 저장본이 없을 때만: 브라우저 캐시의 옛 파일이 새 판에 섞이지 않게 서버에 묻는다
    match: () => caches.open(CACHE).then(c => c.match(key || req, { ignoreSearch: true })),
    put: res => caches.open(CACHE).then(c => c.put(key || req, res)),
  }));
});
