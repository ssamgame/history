// 학생처럼 한 장을 끝까지(점검 봇): 0.4초마다 화면(qa-out/play/<장>-<시작>/0001.jpg…)과 보이는 대사·목표·감지기 기록(log.txt). 사용: NODE_PATH=$(npm root -g) node tools/qa/play.cjs k1 900 intro
// usage: node play.cjs k1 [maxSec] [start=scene]
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
const { serve } = require('./serve.cjs');
(async () => {
  const [ch, maxSec = 900, start = 'scene'] = process.argv.slice(2);
  const out = path.join(__dirname, '..', '..', 'qa-out', 'play', `${ch}-${start}`); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const port = 9300 + Math.floor(Math.random() * 500), srv = await serve(port);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 560 }, hasTouch: true });
  await ctx.addInitScript(() => { window.__qaAuto = true; });
  const p = await ctx.newPage(); const log = [];
  const t0 = Date.now(), T = () => ((Date.now() - t0) / 1000).toFixed(1);
  p.on('pageerror', e => log.push(`${T()} PAGEERR ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') log.push(`${T()} CONSOLE ${m.text().slice(0, 200)}`); });
  await p.goto(`http://localhost:${port}/index.html?e2e=1&debug=${ch}-${start}`);
  await p.waitForFunction(() => window.__world, null, { timeout: 120000 });
  await p.addScriptTag({ url: '/tools/qa/probe.js', type: 'module' });
  await p.waitForFunction(() => window.__qa?.ready, null, { timeout: 30000 });
  await p.addScriptTag({ url: '/tools/e2e-bot.js', type: 'module' });
  let n = 0, last = '', seenEv = 0, quietSince = Date.now(), lastF = 0, chap0 = '';
  const cdp = await ctx.newCDPSession(p);
  cdp.on('Page.screencastFrame', async f => { cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); if (Date.now() - lastF < 400) return; lastF = Date.now(); fs.writeFileSync(path.join(out, `${String(++n).padStart(4, '0')}.jpg`), Buffer.from(f.data, 'base64')); });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 55, maxWidth: 1000, maxHeight: 560 });
  while ((Date.now() - t0) / 1000 < +maxSec) {
    await p.waitForTimeout(300);
    const s = await p.evaluate(() => {
      const t = sel => { const e = [...document.querySelectorAll(sel)].find(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).opacity !== '0'); return (e?.innerText || '').replace(/\s+/g, ' ').trim(); };
      const ev = window.__qa?.events || [];
      return { dlg: t('.dlg'), goal: t('.hud-goal') || t('.goal'), toast: t('.toast'), card: t('.card, .screen, .howto, .doc, .book'), ev: ev.length, evs: ev.slice(-5).map(e => `${e.severity} ${e.kind} ${e.who || ''} ${e.scene || ''}`), stage: window.__phase || '', chap: (document.querySelector('.hud-chapter')?.textContent || '') };
    }).catch(() => null);
    if (!s) continue;
    const key = [s.dlg, s.goal, s.toast, s.card].join('|');
    if (key !== last) { log.push(`${T()} [${n + 1}] 목표:${s.goal} | 대사:${s.dlg} | 알림:${s.toast} | 화면:${s.card.slice(0, 160)}`); last = key; quietSince = Date.now(); }
    if (s.ev > seenEv) { log.push(`${T()} 감지 ${s.evs.slice(-(s.ev - seenEv)).join(' / ')}`); seenEv = s.ev; }
    if (!chap0 && s.chap) chap0 = s.chap.slice(0, 3); else if (chap0 && s.chap && !s.chap.startsWith(chap0)) { log.push(`${T()} 다음 장으로 넘어감: ${s.chap}`); break; }
    if (Date.now() - quietSince > 90000) { log.push(`${T()} 90초 동안 아무 변화 없음 — 막힘?`); break; }
    const fin = await p.evaluate(() => (window.__e2e?.log || []).slice(-3).join(' ; ')).catch(() => '');
    if (/장 끝|결과 카드|chapter done/.test(fin)) { log.push(`${T()} 봇: ${fin}`); break; }
  }
  log.push(`봇 기록: ${(await p.evaluate(() => (window.__e2e?.log || []).join('\n')).catch(() => ''))}`);
  fs.writeFileSync(path.join(out, 'log.txt'), log.join('\n'));
  console.log(`frames ${n}, ${T()}s → ${out}`);
  await b.close(); srv.close();
})();
