// 개발자용 성능 측정(?perf=1): 숫자 모으기, 장면별 진입·안정 구분, 측정판(학생에게는 안 보임), 역사책 그림 미리 찍기, 측정 페이지
import { test, eq, ok } from './harness.js';
import { createPerfStats, createPerfPanel, perfEnabled, LONG_MS } from '../core/perf.js';
import { readBook } from '../core/minigame.js';
import { sleep } from './bot.js';

test('perf: ?perf=1 일 때만 켜진다(학생 주소에는 나오지 않음)', () => {
  eq(perfEnabled(''), false); eq(perfEnabled('?debug=k3-scene'), false); eq(perfEnabled('?perf=0'), false);
  eq(perfEnabled('?perf=1'), true); eq(perfEnabled('?debug=k3-explore&perf=1'), true);
});

test('perf: FPS·5초 평균·멈칫 프레임을 세고, 장면마다 진입 직후(3초)와 안정 뒤를 나눈다', () => {
  let t = 0; const s = createPerfStats({ now: () => t });
  s.setQuality('medium'); s.segment('k3 탐험');
  for (let i = 0; i < 60; i++) { t += 40; s.frame(40, 5, { calls: 300, triangles: 90000 }); } // 진입 2.4초: 25fps
  t += 120; s.frame(120, 6); // 멈칫 한 번
  for (let i = 0; i < 120; i++) { t += 20; s.frame(20, 4, { calls: 280, triangles: 85000 }); } // 안정: 50fps
  const c = s.current();
  ok(Math.abs(c.fps - 50) < 0.5, `지금 FPS ${c.fps}`);
  ok(c.fps5 > 25 && c.fps5 < 50, `5초 평균 ${c.fps5}`);
  eq(c.long, 1, '멈칫 1번');
  const seg = s.segments()[0];
  ok(seg.entry.n > 0 && seg.stable.n > 0, '진입·안정 모두 있다');
  ok(Math.abs(1000 / (seg.stable.ms / seg.stable.n) - 50) < 1, '안정 50fps');
  eq(seg.calls, 300); eq(seg.worst, 120); eq(seg.quality, 'medium');
  s.hidden(); t += 4000; s.frame(4000, null); eq(s.current().long, 1, '탭을 숨겼다 돌아온 긴 공백은 빼고 센다');
  t += 4000; s.frame(4000, null); eq(s.current().long, 2, '화면이 보이는데 4초 멈춘 프레임은 센다');
  ok(LONG_MS === 50);
});

test('perf: 결과 글에는 잰 것만 숫자로 쓰고, 못 잰 것은 "측정 안 됨"으로 쓴다', () => {
  let t = 0; const s = createPerfStats({ now: () => t });
  s.segment('h5 무대'); t += 16; s.frame(16, null);
  s.time('역사책 첫 그림', 412.3, '처음(렌더러 준비 포함)');
  const txt = s.text({ 'CPU 코어': 8, 'GPU': null });
  ok(txt.includes('h5 무대') && txt.includes('역사책 첫 그림: 412ms'), txt);
  ok(txt.includes('GPU: 알 수 없음'), '모르는 기기 정보는 알 수 없음');
  ok(txt.includes('측정 안 됨'), 'render 시간·그리기 수를 못 쟀으면 측정 안 됨');
  ok(txt.includes('아직 안정 구간 없음'), '3초가 안 지났으면 안정 FPS를 만들어 내지 않는다');
});

test('perf: 측정판은 접혀 있다가 펼치면 장면별 표·복사·파일로 저장·화질 단추가 보이고, 화면 가장자리에 작게 붙는다', async () => {
  const ui = document.createElement('div'); document.body.append(ui);
  const s = createPerfStats(); s.segment('k5 무대'); s.frame(16, 2);
  let q = null;
  const p = createPerfPanel(ui, s, { onQuality: lv => { q = lv; }, getQuality: () => 'medium' });
  p.tick(1e9);
  const body = ui.querySelector('.perf-body');
  ok(body.hidden, '처음에는 접혀 있다');
  ok(/FPS/.test(ui.querySelector('.perf-head').textContent));
  ui.querySelector('.perf-head').click();
  ok(!body.hidden && ui.querySelector('.perf-text').textContent.includes('k5 무대'));
  const labels = [...ui.querySelectorAll('.perf-btn')].map(b => b.textContent);
  for (const l of ['복사', '파일로 저장', '낮음', '보통', '높음']) ok(labels.includes(l), l);
  [...ui.querySelectorAll('.perf-btn')].find(b => b.textContent === '낮음').click(); eq(q, 'low');
  const r = ui.querySelector('.perf-head').getBoundingClientRect();
  ok(r.width < 320 && r.height < 60, `접힌 판은 작다 ${Math.round(r.width)}×${Math.round(r.height)}`);
  p.dispose(); ui.remove();
});

test('perf: 역사책은 글을 먼저 보이고 그림은 곧바로 이어 그리며, 읽는 동안 다음 쪽 그림을 미리 찍는다', async () => {
  const ui = document.createElement('div'); document.body.append(ui);
  const drawn = [], timing = [];
  const pages = [1, 2, 3].map(i => ({ title: `쪽${i}`, lines: [{ text: `글${i}` }], scene: { i } }));
  const done = readBook({ ui }, { title: '책', pages, render: p => { drawn.push(p.title); return 'data:image/jpeg;base64,AA=='; }, onTiming: (label, ms) => timing.push(label) });
  ok(ui.querySelector('.book-text h3')?.textContent === '쪽1', '글은 바로');
  for (let i = 0; i < 50 && !ui.querySelector('img.book-diorama'); i++) await sleep(20);
  ok(ui.querySelector('img.book-diorama'), '그림이 이어서 나온다');
  for (let i = 0; i < 50 && !drawn.includes('쪽2'); i++) await sleep(20);
  ok(drawn.includes('쪽2'), '다음 쪽 그림을 미리 찍는다');
  ok(timing.length >= 1, '그림 시간 기록');
  ui.querySelector('.book-next').click(); await sleep(300);
  ok(ui.querySelector('img.book-diorama'), '넘긴 쪽은 그림이 바로');
  ui.querySelector('.book-next').click(); await sleep(300); ui.querySelector('.book-next').click(); await done; ui.remove();
});

test('perf: 역사책 앞의 안내 대사를 읽는 동안 첫 쪽 그림을 미리 찍어 둔다', async () => {
  const { bookWarmup } = await import('../chapters/kit/chapter.js');
  const calls = [];
  const cancel = bookWarmup({ title: '책', pages: [{ title: '가', pic: 'gobu' }, { title: '나', pic: 'tram' }] }, (spec, key) => { calls.push(key); return 'x'; }, 10);
  await sleep(60);
  eq(calls, ['책|가'], '첫 쪽만, 책이 쓰는 이름 그대로');
  const c2 = []; const stop = bookWarmup({ title: '책', pages: [{ title: '가', pic: 'gobu' }] }, (s, k) => { c2.push(k); }, 30); stop(); await sleep(60);
  eq(c2.length, 0, '책이 먼저 열리면 미리 찍기를 그만둔다');
  cancel();
});

test('perf: 측정 페이지(tools/perf-bench.html)가 우선 장면 넷을 세 화질로 재고 결과 글을 만든다', async () => {
  const frame = document.createElement('iframe');
  frame.src = '../tools/perf-bench.html?fast=1&auto=1'; frame.style.cssText = 'width:1000px;height:560px;position:fixed;left:-3000px;top:0;border:0';
  document.body.appendChild(frame);
  try {
    await new Promise(r => frame.addEventListener('load', r));
    const d = frame.contentDocument;
    for (let i = 0; i < 1500 && d.title !== 'done'; i++) await sleep(40);
    eq(d.title, 'done', '끝까지 잰다');
    const txt = d.querySelector('#result').textContent;
    for (const name of ['근대 3장 동학 마을', '근대 5장 전차 길', '현대 5장 피란민 마을', '역사책 첫 쪽']) ok(txt.includes(name), name);
    for (const q of ['low', 'medium', 'high']) ok(txt.includes(`| ${q} |`), q);
    ok(txt.includes('역사책 첫 그림'), '역사책 그림 시간');
  } finally { frame.remove(); }
}, { timeout: 120000 });

test('perf: 미니게임 무대가 열리면 화질 자동 조절이 다시 잰다(마을보다 무거운 무대에서도 느리면 한 단계 낮춘다)', async () => {
  const { buildArena } = await import('../chapters/kit/play.js');
  const { testWorld } = await import('./bot.js');
  const world = testWorld(); let n = 0; world.remeasure = () => { n++; };
  const a = buildArena(world, { origin: [400, 0], ground: 'earth', bounds: { x0: -10, x1: 10, z0: -10, z1: 10 }, props: [] });
  eq(n, 1, '무대를 지으면 다시 재기'); a.dispose();
  buildArena(world, null).dispose(); eq(n, 1, '무대 없는 놀이는 그대로');
});

test('perf: 몇 분 하면서 1분마다 평균 FPS·멈칫·메모리를 남긴다(발열·장시간 저하 보기). 브라우저가 안 알려 주는 메모리는 "알 수 없음"', () => {
  let t = 0; const s = createPerfStats({ now: () => t });
  s.segment('k3 무대');
  for (let i = 0; i < 3000; i++) { t += 20; s.frame(20, 2); } // 1분: 50fps
  s.sampleMemory({ geometries: 120, textures: 30, heapMB: null });
  for (let i = 0; i < 2000; i++) { t += 30; s.frame(30, 2); } // 둘째 분: 33fps(뜨거워져 느려진 것처럼)
  s.sampleMemory({ geometries: 125, textures: 30, heapMB: 88.4 });
  const m = s.minutes();
  eq(m.length, 2);
  ok(Math.abs(m[0].fps - 50) < 1 && Math.abs(m[1].fps - 33.3) < 1, `${m[0].fps} ${m[1].fps}`);
  eq(m[1].geometries, 125);
  const txt = s.text({});
  ok(txt.includes('1분마다') && txt.includes('88') && txt.includes('알 수 없음'), txt);
});

test('perf: 측정 페이지의 오래 하기(?long=분)가 무대를 걸으며 1분마다 기록을 남긴다', async () => {
  const frame = document.createElement('iframe');
  frame.src = '../tools/perf-bench.html?long=0.05&auto=1'; frame.style.cssText = 'width:1000px;height:560px;position:fixed;left:-3000px;top:0;border:0';
  document.body.appendChild(frame);
  try {
    await new Promise(r => frame.addEventListener('load', r));
    const d = frame.contentDocument;
    for (let i = 0; i < 1000 && d.title !== 'done'; i++) await sleep(40);
    const txt = d.querySelector('#result').textContent;
    ok(txt.includes('오래 하기') && txt.includes('1분마다'), txt.slice(0, 400));
  } finally { frame.remove(); }
}, { timeout: 90000 });
