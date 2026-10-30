// 모든 장을 잠깐씩 열어 콘솔 오류·실패한 요청을 모은다: node tools/e2e-scan.cjs <장 id들 쉼표> <결과 json> [단계 explore|minigame] [초]
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [ids, out, stage = 'explore', sec = '25', port = '9150'] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const res = {};
  for (const id of ids.split(',')) {
    const p = await b.newPage({ viewport: { width: 1000, height: 560 } });
    const errs = [], failed = [];
    p.on('pageerror', e => errs.push('pageerror ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
    p.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });
    const t0 = Date.now();
    try {
      await p.goto(`http://localhost:${port}/index.html?e2e=1&debug=${id}-${stage}`);
      await p.waitForFunction(() => window.__ctx, null, { timeout: 60000 });
      const ready = Date.now() - t0;
      await p.addScriptTag({ url: '/tools/e2e-bot.js', type: 'module' });
      await p.waitForTimeout(+sec * 1000);
      const st = await p.evaluate(() => ({ q: document.querySelector('.hud-quest, .quest')?.textContent?.slice(0, 40), c: document.querySelector('.hud-chapter')?.textContent }));
      res[id] = { ready, errs, failed, st };
    } catch (e) { res[id] = { fail: e.message.slice(0, 200), errs, failed }; }
    console.log(id, JSON.stringify(res[id]).slice(0, 300));
    await p.close();
  }
  fs.writeFileSync(out, JSON.stringify(res, null, 1));
  await b.close();
})();
