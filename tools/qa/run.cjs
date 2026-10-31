// 실제 브라우저 자동 점검(시각 오류): 게임이나 개발 마당을 띄우고, 화면 속 오류 감지기(tools/qa/probe.js)를 넣어
// 사진(일정 간격 + 새 오류가 날 때마다)·콘솔 오류·감지 기록·(원하면) 영상을 장면 이름·시각과 함께 남긴다.
//   NODE_PATH=$(npm root -g) node tools/qa/run.cjs [대상...] [--suite motion|smoke|all] [--sec 40] [--every 3] [--video] [--out qa-out] [--port 8190]
// 대상:  motion:<act>[&키=값]   개발 마당 tools/motion-gallery.html?act=<act> (걷기·말·노 젓기 … 한 동작씩, 끝나면 멈춘다)
//        game:<debug>[+bot]     실제 게임 index.html?debug=<debug>(예: ch4-minigame). +bot이면 점검 봇(tools/e2e-bot.js)이 학생처럼 진행한다
// 결과:  <out>/<시각>/summary.md·summary.json, 대상마다 폴더(report.md, events.json, console.json, shots/*.jpg, video.webm)
// 서버는 스스로 띄운다(저장소 맨 위를 그대로, 캐시 없이). 학생 화면 코드는 바꾸지 않고 점검 코드는 페이지에 넣어서만 돈다.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { serve } = require('./serve.cjs');
const root = path.resolve(__dirname, '..', '..');

const SUITES = {
  motion: ['walk', 'turn', 'weapons', 'carry', 'handshake', 'give', 'escort', 'strike', 'horse', 'rider', 'row'].map(a => `motion:${a}`),
  smoke: ['game:ch4-minigame+bot', 'game:ch5-minigame+bot', 'game:j1-quiz', 'game:ch6-minigame+bot'],
};
SUITES.all = [...SUITES.motion, ...SUITES.smoke];

function args() {
  const a = process.argv.slice(2), o = { targets: [], sec: 40, every: 3, video: false, out: 'qa-out', port: 8190, maxShots: 40 };
  for (let i = 0; i < a.length; i++) {
    const k = a[i];
    if (k === '--suite') o.targets.push(...(SUITES[a[++i]] || []));
    else if (k === '--sec') o.sec = +a[++i];
    else if (k === '--every') o.every = +a[++i];
    else if (k === '--video') o.video = true;
    else if (k === '--out') o.out = a[++i];
    else if (k === '--port') o.port = +a[++i];
    else if (k === '--max-shots') o.maxShots = +a[++i];
    else o.targets.push(k);
  }
  if (!o.targets.length) o.targets = ['motion:walk'];
  return o;
}

const slug = s => String(s || '').replace(/[^\w가-힣]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);

async function runTarget(browser, spec, o, base, outDir) {
  const [kind, rest] = spec.split(/:(.*)/s), bot = /\+bot$/.test(rest), name = rest.replace(/\+bot$/, '');
  const url = kind === 'motion' ? `${base}/tools/motion-gallery.html?act=${name}` : `${base}/index.html?e2e=1&debug=${name}`;
  const dir = path.join(outDir, slug(spec)), shots = path.join(dir, 'shots');
  fs.mkdirSync(shots, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 560 }, hasTouch: true, ...(o.video ? { recordVideo: { dir, size: { width: 1000, height: 560 } } } : {}) });
  await ctx.addInitScript(() => { window.__qaAuto = true; });
  const page = await ctx.newPage();
  const R = { target: spec, url, console: [], pageErrors: [], failed: [], shots: [], events: [], stats: {}, startedAt: new Date().toISOString() };
  page.on('console', m => { if (m.type() === 'error') R.console.push(m.text().slice(0, 300)); });
  page.on('pageerror', e => R.pageErrors.push(String(e.message).slice(0, 300)));
  page.on('requestfailed', r => R.failed.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on('response', r => { if (r.status() >= 400) R.failed.push(`${r.status()} ${r.url()}`); });
  const t0 = Date.now();
  let n = 0;
  const shot = async (why, label) => {
    if (R.shots.length >= o.maxShots) return null;
    const t = ((Date.now() - t0) / 1000).toFixed(1), f = `${String(++n).padStart(3, '0')}-${t}s-${slug(why)}-${slug(label)}.jpg`;
    try { await page.screenshot({ path: path.join(shots, f), type: 'jpeg', quality: 70, timeout: 30000 }); } catch { return null; }
    R.shots.push({ file: `shots/${f}`, t: +t, why, label });
    return `shots/${f}`;
  };
  try {
    await page.goto(url);
    await page.waitForFunction(() => window.__world, null, { timeout: 120000 });
    await page.addScriptTag({ url: '/tools/qa/probe.js', type: 'module' }); // 감지기는 점검 때만 페이지에 넣는다
    await page.waitForFunction(() => window.__qa?.ready, null, { timeout: 30000 });
    if (bot) await page.addScriptTag({ url: '/tools/e2e-bot.js', type: 'module' });
    await shot('start', '');
    let lastShot = Date.now(), done = 0, seenEvents = 0, lastEventShot = 0;
    while (Date.now() - t0 < o.sec * 1000) {
      await page.waitForTimeout(500);
      const st = await page.evaluate(() => ({ events: window.__qa.events.length, label: (window.__qa.probe && (window.__phase !== undefined ? `${window.__phase}` : document.querySelector('.hud-chapter')?.textContent || '')) || '', phase: window.__phase, newEvents: window.__qa.events.slice(-5).map(({ snap, ...e }) => e) })).catch(() => null);
      if (!st) continue;
      if (st.events > seenEvents && Date.now() - lastEventShot > 1000) { // 새 오류가 난 그때의 화면
        const e = st.newEvents[st.newEvents.length - 1];
        const f = await shot(`${e.kind}`, e.scene || st.label); lastEventShot = Date.now();
        if (f) R.events.push({ shotFor: e, file: f });
        seenEvents = st.events;
      } else if (Date.now() - lastShot > o.every * 1000) { await shot('every', st.label); lastShot = Date.now(); }
      if (kind === 'motion' && st.phase === '끝') { if (!done) done = Date.now(); else if (Date.now() - done > 1200) break; }
    }
    await shot('end', '');
    const q = await page.evaluate(() => ({ events: window.__qa.events, stats: window.__qa.stats }));
    // 사진이 붙은 사건은 그 사진 파일을 이어 둔다
    for (const e of q.events) { const s = R.events.find(x => x.shotFor && x.shotFor.kind === e.kind && x.shotFor.who === e.who && x.shotFor.t === e.t); if (s) e.shot = s.file; }
    // 감지기가 그 순간에 떠 둔 3D 화면을 파일로(페이지 사진은 조금 늦게 찍혀 장면이 지나갔을 수 있다)
    const snaps = path.join(dir, 'snaps'); let k = 0;
    for (const e of q.events) if (e.snap) { fs.mkdirSync(snaps, { recursive: true }); const f = `snaps/${String(++k).padStart(2, '0')}-${e.t}s-${slug(e.kind)}-${slug(e.who)}.jpg`; fs.writeFileSync(path.join(dir, f), Buffer.from(e.snap.split(',')[1], 'base64')); e.snap = f; }
    R.events = q.events; R.stats = q.stats;
  } catch (e) { R.pageErrors.push('runner: ' + e.message.split('\n')[0]); await shot('runner-error', ''); }
  R.sec = +((Date.now() - t0) / 1000).toFixed(1);
  const video = page.video();
  await ctx.close();
  if (video) { try { const vp = await video.path(); fs.renameSync(vp, path.join(dir, 'video.webm')); R.video = 'video.webm'; } catch { /* 영상 없음 */ } }
  fs.writeFileSync(path.join(dir, 'events.json'), JSON.stringify(R.events, null, 1));
  fs.writeFileSync(path.join(dir, 'console.json'), JSON.stringify({ console: R.console, pageErrors: R.pageErrors, failed: R.failed }, null, 1));
  fs.writeFileSync(path.join(dir, 'report.md'), reportMd(R));
  return R;
}

function counts(events) { const c = {}; for (const e of events) { const k = `${e.severity === 'error' ? '!' : ''}${e.kind}`; c[k] = (c[k] || 0) + 1; } return c; } // !가 붙은 것은 error
function reportMd(R) {
  const c = counts(R.events), lines = [`# ${R.target}`, '', `- 주소: ${R.url}`, `- 시작: ${R.startedAt}, 걸린 시간 ${R.sec}초, 프레임 ${R.stats.frames || 0}, 사람 최대 ${R.stats.people || 0}, 말 최대 ${R.stats.horses || 0}`,
    `- 콘솔 오류 ${R.console.length}, 페이지 오류 ${R.pageErrors.length}, 실패한 요청 ${R.failed.length}`, `- 감지한 오류(사람·종류마다 한 번): ${Object.entries(c).map(([k, v]) => `${k} ${v}`).join(', ') || '없음'}`, ''];
  if (R.events.length) { lines.push('| 초 | 장면 | 무게 | 종류 | 누구 | 위치 | 내용 | 횟수 | 그 순간 | 페이지 사진 |', '|---|---|---|---|---|---|---|---|---|---|'); for (const e of R.events.slice(0, 200)) lines.push(`| ${e.t} | ${e.scene} | ${e.severity} | ${e.kind} | ${e.who} | ${e.at ? e.at.join(',') : ''} | ${e.detail} | ${e.count} | ${e.snap ? `[보기](${e.snap})` : ''} | ${e.shot ? `[보기](${e.shot})` : ''} |`); lines.push(''); }
  for (const x of [...R.pageErrors, ...R.console, ...R.failed].slice(0, 30)) lines.push(`- 오류: ${x}`);
  lines.push('', '## 사진', ...R.shots.map(s => `- ${s.t}초 ${s.why} ${s.label}: [${s.file}](${s.file})`));
  if (R.video) lines.push('', `영상: [video.webm](video.webm)`);
  return lines.join('\n') + '\n';
}

(async () => {
  const o = args();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19), outDir = path.resolve(o.out, stamp);
  fs.mkdirSync(outDir, { recursive: true });
  const server = await serve(o.port), base = `http://localhost:${o.port}`;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const all = [];
  for (const t of o.targets) { const r = await runTarget(browser, t, o, base, outDir); all.push(r); const c = counts(r.events); console.log(`${t}: ${r.sec}s, 오류 ${r.pageErrors.length + r.console.length}, 감지 ${JSON.stringify(c)}`); }
  await browser.close(); server.close();
  const rows = all.map(r => `| [${r.target}](${slug(r.target)}/report.md) | ${r.sec} | ${r.stats.people || 0}/${r.stats.horses || 0} | ${r.pageErrors.length + r.console.length + r.failed.length} | ${Object.entries(counts(r.events)).map(([k, v]) => `${k} ${v}`).join(', ') || '-'} | ${r.shots.length} |`);
  fs.writeFileSync(path.join(outDir, 'summary.md'), ['# 자동 점검 결과', '', `실행: ${stamp}`, '', '| 대상 | 초 | 사람/말 | 오류 | 감지 | 사진 |', '|---|---|---|---|---|---|', ...rows, ''].join('\n'));
  fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(all.map(r => ({ target: r.target, sec: r.sec, stats: r.stats, errors: [...r.pageErrors, ...r.console, ...r.failed], events: counts(r.events) })), null, 1));
  console.log('결과:', path.relative(process.cwd(), outDir) + '/summary.md');
  process.exit(all.some(r => r.pageErrors.length || r.console.length) ? 1 : 0);
})();
