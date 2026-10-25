// 개발자용 성능 측정(학생 화면에는 나오지 않는다): 주소 뒤에 ?perf=1 을 붙였을 때만 켠다.
// 잴 수 있는 것만 적는다 — 프레임 간격(FPS), render() 호출에 쓴 CPU 시간, 그리기 횟수·삼각형(renderer.info), 장면 짓기·역사책 그림 시간.
// GPU가 실제로 그리는 데 걸린 시간과 기기 온도는 브라우저가 알려 주지 않아 재지 않는다.
// 매 프레임에는 숫자 몇 개만 배열에 넣고, 화면 글자는 0.5초마다, 물체 수는 2초마다 센다(측정 자체가 게임을 느리게 하지 않게).

export const LONG_MS = 50; // 이보다 긴 프레임(20fps 밑)은 '멈칫'으로 센다
export const SLOW_MS = 33; // 이보다 긴 프레임(30fps 밑)은 '느린 프레임'
export const ENTRY_S = 3; // 장면에 들어온 뒤 이 시간까지는 '진입 직후', 그 뒤는 '안정'

export function perfEnabled(search = (typeof location !== 'undefined' ? location.search : '')) {
  return new URLSearchParams(search).get('perf') === '1';
}

const avg = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const fmt = (v, d = 1) => (v == null || !Number.isFinite(v) ? '측정 안 됨' : v.toFixed(d));

// 숫자 모으기(화면 없이도 쓴다: 테스트·측정 페이지)
export function createPerfStats({ now = () => performance.now() } = {}) {
  const frames = []; // 최근 프레임 [끝난 시각 ms, 간격 ms, render ms]
  const segments = [];
  const times = []; // { label, ms, note }
  let seg = null, totalLong = 0, totalSlow = 0, quality = null, skipNext = false;
  const t0 = now(), minutes = []; let lastMinute = null; // 1분마다: 오래 하면 느려지는지(발열·메모리) 보기
  const minute = t => { const i = Math.max(0, Math.floor((t - t0) / 60000)); while (minutes.length <= i) minutes.push({ n: 0, ms: 0, long: 0, geometries: null, textures: null, heapMB: null }); return minutes[i]; };
  // 탭을 숨겼다 돌아온 첫 프레임만 뺀다(그동안은 그리지 않았으니). 화면이 보이는데 길게 멈춘 프레임은 그대로 센다
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { skipNext = true; });
  const stats = {
    // 프레임 하나: dtMs 앞 프레임과의 간격, renderMs render() 호출 시간, info { calls, triangles }
    frame(dtMs, renderMs = null, info = null) {
      if (!(dtMs > 0)) return;
      if (skipNext) { skipNext = false; if (dtMs > 500) return; }
      const t = now();
      frames.push([t, dtMs, renderMs]);
      while (frames.length && t - frames[0][0] > 5000) frames.shift();
      const mm = minute(t - dtMs); lastMinute = mm; mm.n++; mm.ms += dtMs; if (dtMs > LONG_MS) mm.long++;
      if (dtMs > LONG_MS) totalLong++;
      if (dtMs > SLOW_MS) totalSlow++;
      if (seg) {
        const part = (t - dtMs - seg.start) / 1000 < ENTRY_S ? seg.entry : seg.stable; // 프레임이 시작된 때로 나눈다(진입 직후 긴 멈춤은 진입에)
        part.n++; part.ms += dtMs; if (renderMs != null) { part.rn++; part.render += renderMs; }
        if (dtMs > LONG_MS) part.long++;
        seg.worst = Math.max(seg.worst, dtMs);
        if (info) { seg.calls = Math.max(seg.calls ?? 0, info.calls); seg.tris = Math.max(seg.tris ?? 0, info.triangles); }
      }
    },
    // 새 장면·단계·미니게임 부분이 시작될 때
    segment(label) {
      seg = { label, quality, start: now(), worst: 0, calls: null, tris: null, objects: null, entry: { n: 0, ms: 0, rn: 0, render: 0, long: 0 }, stable: { n: 0, ms: 0, rn: 0, render: 0, long: 0 } };
      segments.push(seg); if (segments.length > 60) segments.shift();
      return seg;
    },
    // 게임 중 화질이 바뀌면(자동 하향·측정판 단추) 같은 장면을 새 줄로 이어 잰다. split=false면 다음 segment()부터 적용
    setQuality(level, split = true) { quality = level; if (split && seg && seg.quality !== level) stats.segment(`${seg.label.replace(/ \(화질 바꿈\)$/, '')} (화질 바꿈)`); },
    setObjects(n) { if (seg) seg.objects = n; },
    hidden() { skipNext = true; }, // 시험용: 탭을 숨긴 것처럼
    time(label, ms, note = '') { times.push({ label, ms, note }); if (times.length > 80) times.shift(); },
    // 지금 상태: fps(최근 0.5초), fps5(최근 5초 평균), 느린·멈칫 프레임 수
    current() {
      const t = now(), recent = frames.filter(f => t - f[0] <= 500), five = frames;
      const fps = d => (d.length ? 1000 / avg(d.map(f => f[1])) : null);
      return { fps: fps(recent), fps5: fps(five), render5: avg(five.filter(f => f[2] != null).map(f => f[2])), long: totalLong, slow: totalSlow, longIn5: five.filter(f => f[1] > LONG_MS).length };
    },
    // 도형·텍스처 수(renderer.info.memory)와 JS 메모리(크롬만 알려 줌, 없으면 null). 그래픽 카드 메모리는 브라우저가 알려 주지 않는다
    sampleMemory({ geometries = null, textures = null, heapMB = null } = {}) { Object.assign(lastMinute || minute(now()), { geometries, textures, heapMB }); }, // 마지막 프레임이 든 분에
    minutes: () => minutes.map((m, i) => ({ ...m, i })).filter(m => m.n).map(m => ({ minute: m.i + 1, fps: 1000 / (m.ms / m.n), long: m.long, geometries: m.geometries, textures: m.textures, heapMB: m.heapMB })),
    segments: () => segments.slice(), times: () => times.slice(),
    // 붙여 넣기 좋은 글(표). device: 기기 정보(있는 것만)
    text(device = {}) {
      const c = stats.current(), lines = ['[역사 속으로 걸어가기 성능 측정]'];
      for (const [k, v] of Object.entries(device)) lines.push(`${k}: ${v ?? '알 수 없음'}`);
      lines.push(`지금 FPS ${fmt(c.fps, 0)} · 최근 5초 평균 ${fmt(c.fps5, 0)} · render() CPU ${fmt(c.render5, 2)}ms · 느린 프레임(>${SLOW_MS}ms) ${c.slow} · 멈칫(>${LONG_MS}ms) ${c.long}`);
      lines.push('', `장면별 (진입 직후 = 처음 ${ENTRY_S}초, 안정 = 그 뒤)`);
      lines.push('장면 | 화질 | 진입 FPS | 안정 FPS | 안정 render() ms | 멈칫(진입/안정) | 가장 긴 프레임 ms | 그리기 횟수 | 삼각형 | 물체 수');
      for (const s of segments) {
        const f = p => (p.n ? 1000 / (p.ms / p.n) : null), r = p => (p.rn ? p.render / p.rn : null);
        lines.push(`${s.label} | ${s.quality ?? '-'} | ${fmt(f(s.entry), 0)} | ${s.stable.n ? fmt(f(s.stable), 0) : '아직 안정 구간 없음'} | ${fmt(r(s.stable), 2)} | ${s.entry.long}/${s.stable.long} | ${fmt(s.worst, 0)} | ${s.calls ?? '측정 안 됨'} | ${s.tris ?? '측정 안 됨'} | ${s.objects ?? '측정 안 됨'}`);
      }
      const mins = stats.minutes();
      if (mins.length) {
        lines.push('', '1분마다 (오래 할수록 FPS가 떨어지면 발열·메모리를 의심)', '분 | 평균 FPS | 멈칫 | 도형 수 | 텍스처 수 | JS 메모리 MB(크롬 추정)');
        for (const m of mins) lines.push(`${m.minute} | ${fmt(m.fps, 0)} | ${m.long} | ${m.geometries ?? '알 수 없음'} | ${m.textures ?? '알 수 없음'} | ${m.heapMB == null ? '알 수 없음' : m.heapMB.toFixed(0)}`);
      }
      if (times.length) { lines.push('', '걸린 시간'); for (const t of times) lines.push(`${t.label}: ${t.ms.toFixed(0)}ms${t.note ? ` (${t.note})` : ''}`); }
      return lines.join('\n');
    },
  };
  return stats;
}

// 메모리 표본: renderer.info.memory(도형·텍스처 수)와 performance.memory(크롬의 JS 메모리, 다른 브라우저는 없음)
export function memorySample(renderer) {
  const m = renderer?.info?.memory, heap = typeof performance !== 'undefined' && performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null;
  return { geometries: m ? m.geometries : null, textures: m ? m.textures : null, heapMB: heap };
}

// 기기 정보: 브라우저가 알려 주는 것만
export function deviceInfo(renderer) {
  const n = typeof navigator !== 'undefined' ? navigator : {};
  let gpu = null;
  try { const gl = renderer?.getContext(); const ext = gl?.getExtension('WEBGL_debug_renderer_info'); gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null; } catch { gpu = null; }
  return {
    '측정 시각': new Date().toLocaleString('ko-KR'),
    '브라우저': n.userAgent,
    '화면(CSS 픽셀)': typeof innerWidth !== 'undefined' ? `${innerWidth}×${innerHeight}, devicePixelRatio ${devicePixelRatio}` : null,
    '그리는 크기(픽셀)': renderer ? `${renderer.domElement.width}×${renderer.domElement.height}` : null,
    'CPU 코어': n.hardwareConcurrency, '메모리(GB, 대략)': n.deviceMemory, 'GPU': gpu,
  };
}

// 화면 오른쪽에 작게 붙는 측정판. 접힌 채로는 FPS 한 줄만, 누르면 펼쳐 장면별 표·복사·파일 저장·화질 바꾸기.
// world: { renderer, scene }, onQuality(level): 화질 바꾸기(메뉴와 같은 길)
export function createPerfPanel(ui, stats, { world = null, onQuality = null, getQuality = () => null } = {}) {
  const box = document.createElement('section');
  box.className = 'perf-panel'; box.setAttribute('aria-label', '성능 측정(개발용)');
  const head = document.createElement('button'); head.type = 'button'; head.className = 'perf-head';
  const body = document.createElement('div'); body.className = 'perf-body'; body.hidden = true;
  const pre = document.createElement('pre'); pre.className = 'perf-text';
  const row = document.createElement('div'); row.className = 'perf-row';
  const btn = (label, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'perf-btn'; b.textContent = label; b.addEventListener('click', fn); row.append(b); return b; };
  const msg = document.createElement('span'); msg.className = 'perf-msg';
  const text = () => stats.text(deviceInfo(world?.renderer));
  btn('복사', async () => {
    const t = text();
    try { await navigator.clipboard.writeText(t); msg.textContent = '복사했어요'; }
    catch { pre.textContent = t; const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); msg.textContent = '글을 길게 눌러 복사해 주세요'; }
  });
  btn('파일로 저장', () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text()], { type: 'text/plain;charset=utf-8' }));
    a.download = `성능측정-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.txt`; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000); msg.textContent = '저장했어요';
  });
  if (onQuality) for (const [lv, label] of [['low', '낮음'], ['medium', '보통'], ['high', '높음']]) btn(label, () => { onQuality(lv); msg.textContent = `화질 ${label}`; });
  row.append(msg);
  body.append(row, pre); box.append(head, body); ui.append(box);
  head.addEventListener('click', () => { body.hidden = !body.hidden; refresh(); });
  let lastText = 0, lastCount = 0;
  const refresh = () => {
    const c = stats.current(), q = getQuality();
    head.textContent = `FPS ${fmt(c.fps, 0)} · 5초 ${fmt(c.fps5, 0)} · 멈칫 ${c.long}${q ? ` · ${q}` : ''}`;
    if (!body.hidden) pre.textContent = text();
  };
  return {
    el: box,
    // 매 프레임 불러도 가볍게: 글자는 0.5초마다, 물체 수는 2초마다
    tick(t = performance.now()) {
      if (t - lastText > 500) { lastText = t; refresh(); }
      if (world?.scene && t - lastCount > 2000) { lastCount = t; let n = 0; world.scene.traverse(o => { if (o.visible && (o.isMesh || o.isSprite || o.isPoints)) n++; }); stats.setObjects(n); stats.sampleMemory(memorySample(world.renderer)); }
    },
    refresh,
    dispose() { box.remove(); },
  };
}
