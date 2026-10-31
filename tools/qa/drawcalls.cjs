// 그리기 횟수·삼각형·인물 수를 블렌더 몸 시험을 끄고/켜고 견준다(성능 비교, 그래픽 카드 없이 재므로 절대 빠르기는 태블릿에서 따로 잰다)
//   NODE_PATH=$(npm root -g) node tools/qa/drawcalls.cjs ch1-explore ch4-explore [--port 8192]
const { chromium } = require('playwright');
const { serve } = require('./serve.cjs');
(async () => {
  const argv = process.argv.slice(2), pi = argv.indexOf('--port'), port = pi >= 0 ? +argv[pi + 1] : 8192;
  const targets = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--port');
  const server = await serve(port);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const ch of targets.length ? targets : ['ch1-explore']) for (const rig of ['0', '1']) {
    const p = await b.newPage({ viewport: { width: 1000, height: 560 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(`http://localhost:${port}/index.html?debug=${ch}&rig=${rig}`);
    const ok = await p.waitForFunction(() => window.__world && document.querySelector('.hud-chapter')?.textContent, null, { timeout: 120000 }).then(() => 1).catch(() => 0);
    await p.waitForTimeout(5000);
    const r = await p.evaluate(() => { const w = window.__world, info = w.renderer.info; w.render?.(); const calls = info.render.calls, tris = info.render.triangles; let people = 0, rigged = 0; w.level.traverse(o => { if (o.userData?.legs && o.userData.upper) { people++; if (o.userData.rig) rigged++; } }); return { calls, tris, people, rigged }; }).catch(e => ({ err: e.message }));
    console.log(ch, 'rig=' + rig, ok ? '' : '(시작 안 됨)', JSON.stringify(r), errs.join('|').slice(0, 150));
    await p.close();
  }
  await b.close(); server.close();
})();
