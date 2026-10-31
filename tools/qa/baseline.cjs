// 기준 화면 비교: 개발 마당(tools/motion-gallery.html)을 고정 시계(&fixed=1)로 돌려 정한 시각마다 사진을 찍고, 저장해 둔 기준 사진과 견준다.
//   NODE_PATH=$(npm root -g) node tools/qa/baseline.cjs            견주기(결과: qa-out/baseline-<시각>/report.md, 바뀐 곳을 빨갛게 칠한 사진)
//   NODE_PATH=$(npm root -g) node tools/qa/baseline.cjs --update   지금 화면을 새 기준으로 저장(tools/qa/baseline/*.png) — 바뀐 것이 맞다고 사람이 본 뒤에만
// 판정: 1/4로 줄인 화면에서 색 차이가 큰 칸(채널 차 > 40)이 3%를 넘으면 '바뀜'. 그림자·안개 같은 작은 차이는 넘기고, 사람·말이 다른 자세나 자리면 잡힌다.
// 픽셀 차이만으로 오류라고 하지 않는다: '바뀜'은 사람이 두 사진(기준·지금·차이)을 보고 정한다.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { serve, root } = require('./serve.cjs');

// 장면마다 사진을 찍을 시각(장면 시계 초). 걷기·말·노 젓기 등 움직임이 한창인 때
const SHOTS = { walk: [2, 6, 9], horse: [2, 5, 8], rider: [2, 5, 9], row: [1, 3.5, 6], handshake: [1.5, 3], carry: [2, 5], escort: [3, 7] };
const DIR = path.join(root, 'tools', 'qa', 'baseline');
const LIMIT = 0.03;

(async () => {
  const update = process.argv.includes('--update'), only = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const acts = only.length ? only : Object.keys(SHOTS);
  const port = 8191, server = await serve(port);
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const out = path.resolve('qa-out', 'baseline-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19));
  fs.mkdirSync(update ? DIR : out, { recursive: true });
  const rows = [];
  for (const act of acts) {
    const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(`http://localhost:${port}/tools/motion-gallery.html?act=${act}&fixed=1&pauseAt=${SHOTS[act].join(',')}`);
    for (const t of SHOTS[act]) {
      await page.waitForFunction(T => window.__hold === T, t, { timeout: 120000 });
      await page.evaluate(() => document.getElementById('bar').style.visibility = 'hidden'); // 글자판은 비교에서 뺀다
      await page.waitForTimeout(150);
      const png = await page.screenshot({ type: 'png' });
      await page.evaluate(() => { document.getElementById('bar').style.visibility = ''; window.__hold = null; });
      const name = `${act}-${t}.png`, base = path.join(DIR, name);
      if (update) { fs.writeFileSync(base, png); rows.push([act, t, '저장', '']); continue; }
      if (!fs.existsSync(base)) { fs.writeFileSync(path.join(out, name), png); rows.push([act, t, '기준 없음', name]); continue; }
      // 두 사진을 페이지 안 캔버스로 견주고, 바뀐 칸을 빨갛게 칠한 사진을 만든다
      const r = await page.evaluate(async ([a, b]) => {
        const load = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.src = src; });
        const [A, B] = await Promise.all([load(a), load(b)]), w = A.width >> 2, h = A.height >> 2;
        const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
        g.drawImage(A, 0, 0, w, h); const da = g.getImageData(0, 0, w, h); g.drawImage(B, 0, 0, w, h); const db = g.getImageData(0, 0, w, h);
        let n = 0; for (let i = 0; i < da.data.length; i += 4) { const d = Math.max(Math.abs(da.data[i] - db.data[i]), Math.abs(da.data[i + 1] - db.data[i + 1]), Math.abs(da.data[i + 2] - db.data[i + 2])); if (d > 40) { n += 1; db.data[i] = 255; db.data[i + 1] = 0; db.data[i + 2] = 0; } }
        g.putImageData(db, 0, 0); return { ratio: n / (w * h), diff: c.toDataURL('image/png') };
      }, ['data:image/png;base64,' + fs.readFileSync(base).toString('base64'), 'data:image/png;base64,' + png.toString('base64')]);
      fs.writeFileSync(path.join(out, name), png);
      fs.writeFileSync(path.join(out, name.replace('.png', '-diff.png')), Buffer.from(r.diff.split(',')[1], 'base64'));
      rows.push([act, t, r.ratio > LIMIT ? '바뀜' : '같음', `${(r.ratio * 100).toFixed(1)}%`, name]);
    }
    if (errs.length) rows.push([act, '-', '페이지 오류', errs.join(' | ').slice(0, 200)]);
    await page.close();
  }
  await browser.close(); server.close();
  const md = ['# 기준 화면 비교', '', `기준: tools/qa/baseline, 판정선 ${LIMIT * 100}%`, '', '| 장면 | 초 | 결과 | 차이 | 사진 |', '|---|---|---|---|---|', ...rows.map(r => `| ${r.join(' | ')} |`), ''].join('\n');
  if (!update) fs.writeFileSync(path.join(out, 'report.md'), md);
  console.log(md);
  if (!update) console.log('결과:', path.relative(process.cwd(), out) + '/report.md');
  process.exit(rows.some(r => r[2] === '바뀜' || r[2] === '페이지 오류') ? 1 : 0);
})();
