// 터치만 쓰는 학생처럼 게임을 진행하는 테스트용 봇과 준비 도구. 모든 장 테스트가 같이 쓴다.
import { createWorld } from '../core/world.js';
import { createHud } from '../core/screens.js';
import { createInput } from '../core/input.js';
import { createDialogue } from '../core/dialogue.js';
import { createStorage } from '../core/storage.js';
import { createSave } from '../core/save.js';

export const sleep = ms => new Promise(r => setTimeout(r, ms));

export function fakeRenderer() {
  let ratio = 1;
  return {
    domElement: document.createElement('canvas'), shadowMap: { enabled: false, type: null },
    setPixelRatio(r) { ratio = r; }, getPixelRatio() { return ratio; }, setSize() {}, render() {}, dispose() {}, forceContextLoss() {},
  };
}
export function testWorld(quality = 'medium') {
  return createWorld(document.getElementById('sandbox'), { quality, renderer: fakeRenderer() });
}
export function memSave() {
  const m = new Map();
  return createSave(createStorage({ getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) }));
}

export function touchSetup(speakers) {
  const w = testWorld();
  const ui = document.createElement('div'); document.body.appendChild(ui);
  const hud = createHud(ui, { touch: true });
  hud.attachCamera(w.camera);
  const input = createInput({ target: window, joyZone: hud.joyZone, actionButton: hud.talkBtn });
  const dialogue = createDialogue(ui, speakers, { typeMs: 1 });
  const actions = new Set();
  input.onAction(() => { if (dialogue.isOpen()) { if (!dialogue.isChoosing()) dialogue.advance(); return; } actions.forEach(f => f()); });
  const ctx = {
    world: w, input, hud, dialogue, ui, testHooks: {}, audio: { play() {} },
    setGoal: t => hud.setGoal(t), wait: ms => sleep(Math.min(ms, 30)), fade: async () => {},
    onAction(fn) { actions.add(fn); return () => actions.delete(fn); },
    screens: { showIntroCard: async () => {} },
  };
  hud.joyZone.hidden = false; hud.talkBtn.hidden = false;
  Object.assign(hud.joyZone.style, { width: '300px', height: '300px', left: '0', top: '0', bottom: 'auto' });
  return { w, ui, hud, input, dialogue, ctx, done() { input.dispose(); dialogue.dispose(); ui.remove(); w.dispose(); } };
}

// answers: 정답 문장 집합. wrongFirst: 처음 한 번은 일부러 틀릴 정답 문장.
// noTaps(): true인 동안 화면 위 누르기 목표를 누르지 않는다. pressEarlyOnce: 큰 버튼을 준비 전에 한 번 누른다.
export function touchBot(s, { answers, wrongFirst = new Set(), noTaps = () => false, pressEarlyOnce = false, mapPicks = [], orders = [], holdStill = () => false, cardPicks = new Set(), places = {}, sortPicks = {}, fits = {} } = {}) {
  const picks = [...mapPicks];
  let tracing = false;
  const { w, hud, dialogue, input, ui, ctx } = s;
  const wrongUsed = new Set(), seenAt = new Map();
  const zone = hud.joyZone;
  const pe = (type, x, y) => zone.dispatchEvent(new PointerEvent(type, { pointerId: 3, clientX: x, clientY: y, bubbles: true }));
  let dragging = false, stopped = false, taps = 0, earlyPressed = !pressEarlyOnce;
  let damEarlyUsed = !pressEarlyOnce;
  const release = () => { if (dragging) { pe('pointerup', 100, 100); dragging = false; } };
  // 사람 손가락처럼 누른다: 버튼 한가운데 맨 위에 그 버튼이 있어야 한다(다른 화면이 덮고 있으면 기록해 두었다가 끝에 실패)
  const covered = [];
  const tap = b => {
    b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const r = b.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (!top || !(top === b || b.contains(top))) { const m = `"${b.textContent.trim().slice(0, 20)}" is covered by ${top ? (top.className || top.tagName) : 'nothing'}`; if (!covered.includes(m)) covered.push(m); }
    b.click();
  };
  const tick = () => {
    if (stopped) return;
    const start = [...ui.querySelectorAll('.screen button')].find(b => b.textContent === '시작');
    if (start) { tap(start); return; }
    const bookNext = ui.querySelector('.screen.book .book-next') || ui.querySelector('.screen.doc .doc-ok'); // 역사책 넘기기·문서 읽기
    if (bookNext) { tap(bookNext); return; }
    // 지도에서 고르기: mapPicks 순서대로 누르고, 마지막 것은 계속 누른다
    const place = picks.length && ui.querySelector(`.map-place[data-place="${picks[0]}"]`);
    if (place) { if (picks.length > 1) picks.shift(); tap(place); return; }
    // 카드 나누기: 지금 카드 글에 맞는 바구니를 sortPicks에서 찾아 누른다
    const sortNow = ui.querySelector('.sort-now');
    if (sortNow) {
      const key = Object.keys(sortPicks).find(k => sortNow.textContent.includes(k));
      const bin = key && ui.querySelector(`.sort-bin[data-bin="${sortPicks[key]}"]:not([disabled])`);
      if (bin) tap(bin);
      return;
    }
    // 인물 넣기: 인물을 하나 고르고(fits: 인물 id → 원 id) 그 원을 누른다
    if (ui.querySelector('.screen.fit')) {
      const picked = ui.querySelector('.fit-figure.picked');
      if (picked) { const c = ui.querySelector(`.fit-circle[data-circle="${fits[picked.dataset.figure]}"]`); if (c) tap(c); }
      else { const f = ui.querySelector('.fit-figure:not([disabled])'); if (f) tap(f); }
      return;
    }
    // 카드 고르기: cardPicks에 든 카드만 누른다
    if (ui.querySelector('.screen.choose')) {
      const open = [...ui.querySelectorAll('.screen.choose .order-card:not([disabled])')];
      const wrong = ctx.testHooks.chooseWrongOnce && open.find(b => b.textContent === ctx.testHooks.chooseWrongOnce);
      if (wrong) { ctx.testHooks.chooseWrongOnce = null; tap(wrong); return; } // 시험: 한 번만 일부러 틀린 카드
      const want = cardPicks.size ? cardPicks : new Set(ctx.testHooks.chooseAnswer || []); // cardPicks를 안 주면 놀이가 알려 준 정답
      const pick = open.find(b => want.has(b.textContent));
      if (pick) tap(pick);
      return;
    }
    // 자리 놓기: 지금 놓을 물건 이름으로 places에서 자리를 찾아 누른다
    const now = ui.querySelector('.place-now');
    if (now) {
      const label = Object.keys(places).find(k => now.textContent.includes(k));
      const slot = label && [].concat(places[label]).map(id => ui.querySelector(`.place-slot[data-slot="${id}"]:not([disabled])`)).find(Boolean); // 같은 물건이 여럿이면 자리 목록 중 빈 곳
      if (slot) tap(slot);
      return;
    }
    // 카드 순서 맞추기: 이미 놓은 카드 수로 다음 카드를 찾아 누른다
    const cards = [...ui.querySelectorAll('.order-card:not([disabled])')];
    if (cards.length) {
      const placed = ui.querySelectorAll('.order-slots li').length;
      const texts = cards.map(b => b.textContent);
      const order = orders.find(o => texts.every(t => o.includes(t)));
      const next = order && cards.find(b => b.textContent === order[placed]);
      if (next) tap(next);
      return;
    }
    // 획 따라 그리기: 지금 획의 점을 차례로 지나가도록 손가락을 끈다
    const board = ui.querySelector('.trace-board');
    if (board) {
      if (tracing) return;
      const dots = [...board.querySelectorAll('.trace-dot')];
      if (!dots.length) return;
      tracing = true;
      const r = board.querySelector('svg').getBoundingClientRect();
      const at = (type, d) => board.dispatchEvent(new PointerEvent(type, { pointerId: 4, bubbles: true, clientX: r.left + d.getAttribute('cx') / 100 * r.width, clientY: r.top + d.getAttribute('cy') / 100 * r.height }));
      const pts = dots.map(d => d);
      at('pointerdown', pts[0]);
      for (const d of pts.slice(1)) at('pointermove', d);
      at('pointerup', pts[pts.length - 1]);
      tracing = false;
      return;
    }
    // 작전 지휘판(chapters/kit/ops.js): 병사가 모자란 구역 칸을 누른다(대기 병사가 바로 간다)
    const opsBoard = !dialogue.isOpen() && ui.querySelector('.ops-board');
    if (opsBoard && !noTaps()) {
      const want = [...opsBoard.querySelectorAll('.ops-zone')].find(z => +z.dataset.short > 0);
      if (want && [...opsBoard.querySelectorAll('.ops-token')].some(t => !t.hidden && !t.disabled)) tap(want);
    }
    // 둑 수위 조절(chapters/kit/damflow.js): 놀이가 알려 준 때(testHooks.dam)에 큰 단추를 누르고 있다가 뗀다.
    // pressEarlyOnce면 처음 한 번은 바로 눌렀다 떼어 일찍 터뜨린다
    const damBtn = !dialogue.isOpen() && !noTaps() && ui.querySelector('.dam-btn'), dh = ctx.testHooks.dam;
    if (damBtn && dh) {
      const pev = type => damBtn.dispatchEvent(new PointerEvent(type, { pointerId: 6, bubbles: true }));
      if (!damEarlyUsed) { damEarlyUsed = true; tap(damBtn); pev('pointerdown'); pev('pointerup'); }
      else if (!damBtn.classList.contains('down') && dh.press && !dh.release) pev('pointerdown');
      else if (damBtn.classList.contains('down') && dh.release) pev('pointerup');
    }
    // 말 받아치기(chapters/kit/rally.js): 정답 구슬을 누른다. wrongFirst에 든 정답이면 그 판(소손녕의 말)마다 처음 한 번은 다른 구슬
    const rallyOrbs = !dialogue.isOpen() && !noTaps() && !ui.querySelector('.rally-board.busy') && [...ui.querySelectorAll('.rally-orb:not([disabled])')];
    if (rallyOrbs && rallyOrbs.length) {
      const key = ui.querySelector('.rally-say')?.textContent || '';
      const right = rallyOrbs.find(o => answers.has(o.dataset.text) || o.dataset.text === ctx.testHooks.rally?.answer);
      let pick = right;
      if (right && wrongFirst.has(right.dataset.text) && !wrongUsed.has(key)) { wrongUsed.add(key); pick = rallyOrbs.find(o => o !== right); }
      if (pick) tap(pick);
    }
    // 경판 공방(chapters/kit/conveyor.js): 고른 판의 다음 작업대를 누른다
    const cv = !dialogue.isOpen() && !noTaps() && ctx.testHooks.conveyor;
    if (cv && cv.ready) { const st = ui.querySelector(`.conv-st[data-st="${cv.answer}"]:not([disabled])`); if (st) tap(st); }
    // 노 젓기 박자(chapters/kit/rhythm.js): 박자 순간 가까이에서 알맞은 쪽 노를 누른다
    const rh = !dialogue.isOpen() && !noTaps() && ctx.testHooks.rhythm;
    if (rh && Math.abs(rh.dt) < Math.min(0.08, rh.window)) { const rb = ui.querySelector(`.row-btn[data-side="${rh.side}"]`); if (rb) tap(rb); }
    // 획 새기기(선택)를 묻는 화면: 건너뛴다
    const skipCarve = ui.querySelector('.screen.carve-ask .skip');
    if (skipCarve) { tap(skipCarve); return; }
    // 처인성 당겨 쏘기(chapters/kit/pullshot.js): 활 단추를 눌러 놀이가 알려 준 적 쪽(aim)의 반대로 끝까지 끌었다가, 충분히 당기면 놓는다
    const ph = !dialogue.isOpen() && !noTaps() && ctx.testHooks.pullshot, pad = ph && ui.querySelector('.pull-pad');
    if (pad) {
      const r = pad.getBoundingClientRect(), px = r.left + r.width / 2, py = r.top + r.height / 2;
      const at = (el, type, x, y) => el.dispatchEvent(new PointerEvent(type, { pointerId: 7, bubbles: true, clientX: x, clientY: y }));
      const x = px - Math.sin(ph.aim) * 140, y = py + Math.cos(ph.aim) * 140;
      if (ph.ready) {
        const top = document.elementFromPoint(px, py);
        if (!top || !(top === pad || pad.contains(top))) { const m = `"pull pad" is covered by ${top ? (top.className || top.tagName) : 'nothing'}`; if (!covered.includes(m)) covered.push(m); }
        at(pad, 'pointerdown', px, py);
      } else if (ph.pulling) { at(window, 'pointermove', x, y); if (ph.held >= ph.minPull + 0.1) at(window, 'pointerup', x, y); }
    }
    // 별무반 갈림길(chapters/kit/switch.js): 놀이가 알려 준 맞는 길 단추를 누른다
    const lh = !dialogue.isOpen() && !noTaps() && ctx.testHooks.lanes;
    if (lh && lh.ready) { const lb = ui.querySelector(`.switch-lane[data-lane="${lh.answer}"]:not([disabled])`); if (lb) tap(lb); }
    if (dialogue.isOpen()) {
      release();
      if (dialogue.isChoosing()) {
        const buttons = [...ui.querySelectorAll('.dlg-choices button')];
        const texts = buttons.map(b => b.querySelector('.txt').textContent);
        let i = ctx.testHooks.choice != null ? ctx.testHooks.choice : texts.findIndex(t => answers.has(t)); // 놀이가 알려 준 답(맞다/아니다 고르기)
        const key = texts.join('|');
        if (!seenAt.has(key)) seenAt.set(key, performance.now());
        if (performance.now() - seenAt.get(key) < 300) return; // 열린 직후의 탭은 대화창이 무시한다
        if (wrongFirst.has(texts[i]) && !wrongUsed.has(key)) { wrongUsed.add(key); i = (i + 1) % buttons.length; }
        tap(buttons[i]);
        seenAt.delete(key);
      } else ui.querySelector('.dlg').click();
    } else {
      const target = !noTaps() && [...ui.querySelectorAll('.tap-target')].find(b => !b.hidden);
      if (target) tap(target);
      const big = ui.querySelector('.big-action');
      if (big && (ctx.testHooks.ready || (!earlyPressed && ctx.testHooks.armed !== false))) { earlyPressed = true; tap(big); }
      const g = w.getGoal() || ctx.testHooks.walkTo; // 정답 자리를 화살표로 알려 주지 않는 놀이는 봇에게만 따로 알려 준다
      if (g && w.camMode === 'follow' && !holdStill()) {
        const p = w.player.position, dx = g.x - p.x, dz = g.z - p.z, d = Math.hypot(dx, dz);
        if (d > 1.2) {
          if (!dragging) { pe('pointerdown', 100, 100); dragging = true; }
          pe('pointermove', 100 + (dx / d) * 40, 100 + (dz / d) * 40);
        } else {
          release();
          if (!hud.talkBtn.disabled) { hud.talkBtn.click(); taps += 1; }
        }
      } else release();
    }
    w.step(1 / 20, dialogue.isOpen() ? { x: 0, z: 0 } : input.move());
  };
  const timer = setInterval(tick, 15);
  return { stop() { stopped = true; clearInterval(timer); release(); if (covered.length) throw new Error(`buttons a finger could not reach: ${covered.join('; ')}`); }, get taps() { return taps; }, covered };
}
