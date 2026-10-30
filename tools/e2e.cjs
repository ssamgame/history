// 실제 게임 화면 자동 플레이 점검: 한 편(여섯 장)을 학생처럼 처음부터 끝까지 해 본다.
// NODE_PATH=$(npm root -g) node tools/e2e.cjs <시작 장 id: ch1|j1|k1|i1|h1> <결과 폴더> [최대 분] [포트]
// 저장: 결과 폴더/log.json(장마다 걸린 시간·콘솔 오류·실패한 요청·막힌 곳·덮인 버튼), 장면 사진(15초마다, 막히면 그때)
// 서버는 따로 띄워 둔다(예: python3 -m http.server 9150, 저장소 맨 위에서)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const [start = 'ch1', out = 'e2e-out', maxMin = '40', port = '9150'] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 560 } });
  const R = { start, chapters: [], errors: [], failed: [], stuck: [], covered: [], botLog: [], fps: [] };
  p.on('pageerror', e => R.errors.push(`pageerror ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') R.errors.push(`console ${m.text().slice(0, 300)}`); });
  p.on('requestfailed', r => R.failed.push(`${r.url()} ${r.failure()?.errorText}`));
  p.on('response', r => { if (r.status() >= 400) R.failed.push(`${r.status()} ${r.url()}`); });
  const t0 = Date.now();
  await p.goto(`http://localhost:${port}/index.html?e2e=1&debug=${start}-intro`);
  await p.waitForFunction(() => window.__ctx, null, { timeout: 120000 });
  await p.addScriptTag({ url: '/tools/e2e-bot.js', type: 'module' });
  await p.evaluate(() => { let n = 0; window.__fps = []; const f = () => { n += 1; requestAnimationFrame(f); }; requestAnimationFrame(f); setInterval(() => { window.__fps.push(n); n = 0; }, 5000); });
  let cur = null, sig = '', sigAt = Date.now(), shotAt = 0, n = 0;
  const shot = async name => { try { await p.screenshot({ path: path.join(out, `${String(++n).padStart(3, '0')}-${name}.jpg`), type: 'jpeg', quality: 60, timeout: 60000 }); } catch { /* 무시 */ } };
  while (Date.now() - t0 < +maxMin * 60000) {
    await p.waitForTimeout(2000);
    let st;
    try {
      st = await p.evaluate(() => {
        const t = s => document.querySelector(s)?.textContent?.trim() || '';
        const scr = [...document.querySelectorAll('.screen')].filter(x => !x.hidden).map(x => x.className).join(' ');
        const g = window.__world?.getGoal?.();
        return { chapter: t('.hud-chapter'), quest: t('.hud-quest') || t('.quest'), dlg: document.querySelector('.dlg:not([hidden]) .dlg-text')?.textContent?.slice(0, 60) || '', scr, goal: g ? `${g.x.toFixed(1)},${g.z.toFixed(1)}` : '', p: window.__world ? `${window.__world.player.position.x.toFixed(1)},${window.__world.player.position.z.toFixed(1)}` : '', counter: t('.hud-counter'), endText: t('.screen h2'), log: window.__e2e?.log.splice(0) || [], covered: window.__e2e?.covered || [] };
      });
    } catch (e) { R.errors.push('evaluate ' + e.message); continue; }
    R.botLog.push(...st.log); for (const c of st.covered) if (!R.covered.includes(c)) R.covered.push(c);
    if (st.chapter && st.chapter !== cur) { if (cur) R.chapters[R.chapters.length - 1].sec = Math.round((Date.now() - R.chapters[R.chapters.length - 1].at) / 1000); R.chapters.push({ name: st.chapter, at: Date.now() }); cur = st.chapter; await shot('start'); console.log(`${Math.round((Date.now() - t0) / 1000)}s 장: ${st.chapter}`); }
    const s = [st.chapter, st.quest, st.dlg, st.scr, st.goal, st.counter, st.p].join('|');
    if (s !== sig) { sig = s; sigAt = Date.now(); }
    else if (Date.now() - sigAt > 60000) { R.stuck.push({ chapter: st.chapter, state: s, sec: Math.round((Date.now() - t0) / 1000) }); console.log('막힘', s); await shot('stuck'); sigAt = Date.now(); }
    if (Date.now() - shotAt > 15000) { shotAt = Date.now(); await shot((st.scr.split(' ')[1] || 'play').slice(0, 12)); }
    if (/\bsession\b/.test(st.scr) && !R.sessions?.includes(st.chapter)) { (R.sessions = R.sessions || []).push(st.chapter); console.log('편 끝:', st.chapter); await shot('session'); } // 편 결과 카드(여섯 장을 마침). 게임은 다음 편으로 이어진다
    if (R.chapters.length && (R.saves = (R.saves || 0) + 1) % 8 === 0) fs.writeFileSync(path.join(out, 'log.json'), JSON.stringify(R, null, 1)); // 중간에 멈춰도 기록이 남게
  }
  if (cur && R.chapters.length) R.chapters[R.chapters.length - 1].sec = Math.round((Date.now() - R.chapters[R.chapters.length - 1].at) / 1000);
  try { R.fps = await p.evaluate(() => window.__fps); } catch { /* 무시 */ }
  R.totalSec = Math.round((Date.now() - t0) / 1000);
  fs.writeFileSync(path.join(out, 'log.json'), JSON.stringify(R, null, 1));
  console.log(JSON.stringify({ chapters: R.chapters.map(c => `${c.name} ${c.sec}s`), errors: R.errors.length, failed: R.failed.length, stuck: R.stuck.length, covered: R.covered.length }));
  await b.close();
})();
