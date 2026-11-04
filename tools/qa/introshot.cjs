// 장 도입 장면의 n번째 화면 한 장: NODE_PATH=$(npm root -g) node tools/qa/introshot.cjs k1 0 2 out.jpg
// usage: node introshot.cjs k1 shotIndex sec out.jpg
const { chromium } = require('playwright'); const { serve } = require('./serve.cjs');
(async () => { const [ch, si, sec, out] = process.argv.slice(2); const port = 9800 + Math.floor(Math.random() * 100), srv = await serve(port);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 1000, height: 560 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(`http://localhost:${port}/index.html?debug=${ch}-scene`); await p.waitForFunction(() => window.__world, null, { timeout: 60000 }); await p.waitForTimeout(3000);
  await p.evaluate(async ([ch, si]) => { const m = (await import(`/chapters/index.js`)).ALL_CHAPTERS.find(c => c.id === ch); const mod = (await m.load()).default; const w = window.__world;
    w.level.traverse(o => { if (o.userData.passer) o.visible = false; }); const film = mod.introScene({ world: w }); for (let j = 0; j < +si; j++) film.shots[j].act?.({ world: w }); const sh = film.shots[+si]; w.setFixedCamera(sh.to?.cam || sh.cam, sh.to?.look || sh.look); sh.act?.({ world: w }); }, [ch, si]);
  await p.waitForTimeout(+sec * 1000); await p.screenshot({ path: out }); await b.close(); srv.close(); })();
