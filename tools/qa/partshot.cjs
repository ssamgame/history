// 놀이·장면 중 대화창에 글이 뜨는 순간 한 장: NODE_PATH=$(npm root -g) node tools/qa/partshot.cjs k5-minigame "자리에 앉아" out.jpg 260
// usage: node partshot.cjs <debug> <regex of dialog text to capture> out.jpg [maxSec]
const { chromium } = require('playwright'); const { serve } = require('./serve.cjs');
(async () => { const [dbg, re, out, max = 200] = process.argv.slice(2); const port = 9700 + Math.floor(Math.random() * 90), srv = await serve(port);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const ctx = await b.newContext({ viewport: { width: 1000, height: 560 }, hasTouch: true });
  await ctx.addInitScript(() => { window.__qaAuto = true; }); const p = await ctx.newPage();
  await p.goto(`http://localhost:${port}/index.html?e2e=1&debug=${dbg}`); await p.waitForFunction(() => window.__world, null, { timeout: 60000 });
  await p.addScriptTag({ url: '/tools/e2e-bot.js', type: 'module' }); const t0 = Date.now(); const R = new RegExp(re);
  while (Date.now() - t0 < max * 1000) { const t = await p.evaluate(() => [...document.querySelectorAll('.dlg')].filter(e => e.getClientRects().length).map(e => e.innerText).join(' ')); if (R.test(t)) { await p.waitForTimeout(700); await p.screenshot({ path: out }); console.log('shot', ((Date.now() - t0) / 1000).toFixed(0)); break; } await p.waitForTimeout(250); }
  await b.close(); srv.close(); })();
