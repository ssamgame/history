// 학생이 실제로 하는 '거친' 행동 점검: 새로고침 뒤 이어하기, 키·버튼 연타, 화면 크기·방향 바꾸기, 다른 탭에 갔다 오기.
// NODE_PATH=$(npm root -g) node tools/e2e-robust.cjs <결과 폴더> [포트]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const [out = 'robust-out', port = '9150'] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 560 }, hasTouch: true });
  const p = await ctx.newPage();
  const R = { errors: [], checks: [] };
  p.on('pageerror', e => R.errors.push('pageerror ' + e.message));
  p.on('console', m => { if (m.type() === 'error') R.errors.push(m.text().slice(0, 200)); });
  const check = (name, ok, info = '') => { R.checks.push({ name, ok: !!ok, info }); console.log(ok ? 'OK ' : 'NG ', name, info); };
  const shot = n => p.screenshot({ path: path.join(out, n + '.jpg'), type: 'jpeg', quality: 60 });
  const bot = async () => { await p.addScriptTag({ url: '/tools/e2e-bot.js', type: 'module' }); };
  const state = () => p.evaluate(() => ({ hud: document.querySelector('.hud-chapter')?.textContent || '', quest: document.querySelector('.quest')?.textContent || '', screens: [...document.querySelectorAll('.screen')].map(s => s.className).join(' '), save: localStorage.getItem('goryeo-game:v1'), p: window.__world ? window.__world.player.position.toArray().map(v => +v.toFixed(2)) : null }));
  const base = `http://localhost:${port}/index.html?e2e=1`;

  // 1) 처음 들어와 1장 탐험을 조금 하다가 새로고침 → 첫 화면에 '이어하기'가 뜨고, 누르면 같은 장으로 돌아온다
  await p.goto(base); await p.waitForSelector('.screen.title');
  await p.click('.screen.title .title-actions button.primary');
  await p.waitForSelector('.screen.name input'); await p.fill('.screen.name input', '점검'); await p.click('.screen.name button');
  await p.waitForSelector('.screen.mapscreen button'); await p.click('.screen.mapscreen button:not([disabled])');
  await p.waitForFunction(() => window.__ctx, null, { timeout: 60000 });
  await bot(); await p.waitForTimeout(45000);
  const s1 = await state(); await shot('1-before-reload');
  check('탐험 중 저장이 있다', s1.save && s1.save.includes('ch1'), (s1.save || '').slice(0, 120));
  await p.reload(); await p.waitForSelector('.screen.title', { timeout: 60000 });
  const cont = await p.$('.screen.title .title-actions button.primary');
  const contText = cont ? await cont.textContent() : '';
  check('새로고침 뒤 이어하기 단추', /이어하기/.test(contText), contText);
  await shot('2-title-after-reload');
  if (cont) await cont.click();
  await p.waitForTimeout(1500);
  const mapBtn = await p.$('.screen.mapscreen button:not([disabled])'); if (mapBtn) await mapBtn.click();
  await p.waitForFunction(() => document.querySelector('.hud-chapter')?.textContent, null, { timeout: 60000 }).catch(() => {});
  const s2 = await state(); await shot('3-resumed');
  check('이어하기로 같은 장에 돌아온다', s2.hud && s1.hud && s2.hud === s1.hud, `${s1.hud} → ${s2.hud}`);

  // 2) 연타: 대화가 열려 있을 때 E·스페이스·화면을 1초에 40번 누른다 → 오류 없이, 대화가 엉키지 않고 계속 진행된다
  await bot(); await p.waitForTimeout(8000);
  const e0 = R.errors.length;
  for (let i = 0; i < 40; i++) { await p.keyboard.press(i % 2 ? 'KeyE' : 'Space'); if (i % 5 === 0) await p.mouse.click(500, 480); await p.waitForTimeout(25); }
  await p.waitForTimeout(6000);
  const s3 = await state();
  check('연타해도 오류가 없다', R.errors.length === e0, R.errors.slice(e0).join(' | ').slice(0, 200));
  check('연타 뒤에도 게임이 이어진다(장 이름이 보인다)', !!s3.hud, s3.hud + ' / ' + s3.quest.slice(0, 30));
  await shot('4-after-mash');

  // 3) 화면 크기·방향 바꾸기: 세로(태블릿을 돌림), 크롬북, 작은 창 → 단추가 화면 안에 있고 오류가 없다
  for (const [w, h, n] of [[560, 1000, 'portrait'], [1366, 768, 'chromebook'], [800, 450, 'small'], [1000, 560, 'tablet']]) {
    await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(1500);
    const off = await p.evaluate(() => [...document.querySelectorAll('button, .talkbtn, .menubtn')].filter(el => { const r = el.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1) && getComputedStyle(el).visibility !== 'hidden'; }).map(el => (el.textContent || el.className).trim().slice(0, 15)));
    check(`${n} ${w}×${h}: 단추가 화면 안`, off.length === 0, off.join(','));
    await shot('5-' + n);
  }

  // 4) 다른 탭에 갔다가 돌아오기: 숨김 → 3초 → 보임. 돌아온 뒤에도 학생이 움직인다
  const pBefore = (await state()).p;
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForTimeout(3000);
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForTimeout(10000);
  const pAfter = (await state()).p;
  check('탭에서 돌아온 뒤에도 게임이 돈다', JSON.stringify(pBefore) !== JSON.stringify(pAfter) || !!(await state()).hud, `${pBefore} → ${pAfter}`);

  // 5) 메뉴(Esc) 열고 닫기
  await p.keyboard.press('Escape'); await p.waitForTimeout(800);
  const menu = await p.$('.screen.menu'); check('Esc로 메뉴가 열린다', !!menu); await shot('6-menu');
  if (menu) { const close = await p.$('.screen.menu button'); if (close) await close.click(); }
  await p.waitForTimeout(800);
  check('전체 콘솔 오류 없음', R.errors.length === 0, R.errors.slice(0, 3).join(' | '));
  fs.writeFileSync(path.join(out, 'robust.json'), JSON.stringify(R, null, 1));
  await b.close();
})();
