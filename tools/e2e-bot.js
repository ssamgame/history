// 자동 플레이 점검용 봇(tools/e2e.cjs가 실제 게임 화면 index.html?e2e=1 에 넣는다). 학생처럼 화면의 버튼·대화창·조이스틱만 쓴다.
// 세상(world)을 직접 움직이지 않고 게임이 스스로 돌게 둔다. 진행 정보(지금 장·대사·목표)는 window.__e2e에 모아 바깥 스크립트가 읽는다.
// 정답은 각 장 대본의 퀴즈 답과 놀이가 알려 주는 답(testHooks.choice 등)을 쓰고, 모르면 아직 안 고른 것을 차례로 골라 본다(학생이 이리저리 해 보듯).
const E = window.__e2e = { log: [], step: 0, last: '', taps: 0, covered: [] };
const ui = document.querySelector('#ui') || document.body;
const answers = new Set();
const tried = new Map(); // 질문 → 고른 번호들
async function loadAnswers() {
  const { ALL_CHAPTERS } = await import('/chapters/index.js');
  const walk = o => { if (!o || typeof o !== 'object') return; if (Array.isArray(o.options)) { if (typeof o.answer === 'number' && typeof o.options[o.answer] === 'string') answers.add(o.options[o.answer]); o.options.forEach(x => { if (x && x.correct && x.text) answers.add(x.text); }); } for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v); };
  for (const c of ALL_CHAPTERS) if (c.load) { try { walk((await c.load()).default.script); } catch (e) { E.log.push('answer load ' + c.id + ' ' + e.message); } }
}
loadAnswers();
const vis = el => el && !el.hidden && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'; // 화면 카드는 position: fixed라 offsetParent로는 알 수 없다
// 손가락처럼: 버튼 한가운데에 그 버튼이 맨 위에 있는지 보고 누른다(덮였으면 기록)
const tap = b => {
  const r = b.getBoundingClientRect(), top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  if (!top || !(top === b || b.contains(top))) { const m = `${(b.textContent || b.className).trim().slice(0, 20)} ← ${top ? (top.className || top.tagName) : 'nothing'}`; if (!E.covered.includes(m)) E.covered.push(m); }
  b.click(); E.taps += 1;
};
let dragging = false;
const zone = () => document.querySelector('.joyzone');
const pe = (type, x, y) => zone()?.dispatchEvent(new PointerEvent(type, { pointerId: 7, clientX: x, clientY: y, bubbles: true }));
const release = () => { if (dragging) { pe('pointerup', 150, 150); dragging = false; } };
const action = () => { const t = document.querySelector('.talkbtn'); if (t && !t.disabled) tap(t); else window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e' })); };
let seenDlg = 0, wander = 0;
function tick() {
  const ctx = window.__ctx, w = window.__world;
  E.step += 1;
  // 화면(카드·책·결과·편 고르기 등)
  const screen = [...ui.querySelectorAll('.screen')].filter(vis).pop();
  if (screen) {
    release();
    const trace = screen.querySelector('.trace-board');
    if (trace) { const dots = [...trace.querySelectorAll('.trace-dot')]; const r = trace.querySelector('svg').getBoundingClientRect(); const at = (t, d) => trace.dispatchEvent(new PointerEvent(t, { pointerId: 4, bubbles: true, clientX: r.left + d.getAttribute('cx') / 100 * r.width, clientY: r.top + d.getAttribute('cy') / 100 * r.height })); if (dots.length) { at('pointerdown', dots[0]); dots.slice(1).forEach(d => at('pointermove', d)); at('pointerup', dots[dots.length - 1]); } return; }
    const pick = sel => [...screen.querySelectorAll(sel)].filter(b => vis(b) && !b.disabled);
    // 정답을 아는 고르기(복습 퀴즈·카드): 답 글이 맞는 버튼
    const known = pick('button').find(b => answers.has(b.textContent.trim()) || (ctx?.testHooks?.chooseAnswer || []).includes(b.textContent.trim()));
    if (known && screen.querySelector('.review-opt, .order-card') && !screen.querySelector('.review-opt[disabled]')) { tap(known); return; }
    const p = pick('.map-place'); if (p.length) { const k = 'map:' + screen.textContent.slice(0, 40), t = tried.get(k) || []; const b = p.find(x => !t.includes(x.dataset.place)) || p[0]; t.push(b.dataset.place); tried.set(k, t); tap(b); return; }
    const order = pick('.order-card, .sort-bin, .fit-figure, .fit-circle, .place-slot'); if (order.length) { tap(order[Math.floor(Math.random() * order.length)]); return; }
    const review = pick('.review-opt'); if (review.length && !screen.querySelector('.review-opt[disabled]')) { tap(review[0]); return; }
    const go = pick('.doc-ok, .book-next, .btn.primary, button.btn'); if (go.length) { tap(go[0]); return; }
  }
  // 이름 넣기
  const name = ui.querySelector('input[type="text"]'); if (name && vis(name) && !name.value) { name.value = '점검'; name.dispatchEvent(new Event('input', { bubbles: true })); return; }
  if (!ctx || !w) return;
  const dlg = ui.querySelector('.dlg');
  if (dlg && !dlg.hidden) {
    release();
    const btns = [...dlg.querySelectorAll('.dlg-choices button')].filter(b => !b.disabled && vis(b));
    if (btns.length) {
      const texts = btns.map(b => b.querySelector('.txt')?.textContent || b.textContent), key = (dlg.querySelector('.dlg-text')?.textContent || '') + texts.join('|');
      if (!seenDlg) { seenDlg = performance.now(); return; }
      if (performance.now() - seenDlg < 350) return;
      let i = ctx.testHooks.choice != null ? ctx.testHooks.choice : texts.findIndex(t => answers.has(t));
      if (i < 0) { const t = tried.get(key) || []; i = texts.findIndex((_, k) => !t.includes(k)); if (i < 0) i = 0; t.push(i); tried.set(key, t); }
      seenDlg = 0; tap(btns[Math.min(i, btns.length - 1)]); return;
    }
    if (!seenDlg) { seenDlg = performance.now(); return; }
    if (performance.now() - seenDlg > 250) { seenDlg = 0; dlg.click(); }
    return;
  }
  seenDlg = 0;
  const tapTarget = [...ui.querySelectorAll('.tap-target, .big-action')].find(b => vis(b) && !b.disabled);
  if (tapTarget && /길게/.test(tapTarget.textContent)) { // 길게 누르기: 1.6초 동안 누르고 있다가 뗀다
    if (!E.holding) { E.holding = performance.now(); const r = tapTarget.getBoundingClientRect(); E.holdXY = [r.left + r.width / 2, r.top + r.height / 2]; tapTarget.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 9, bubbles: true, clientX: E.holdXY[0], clientY: E.holdXY[1] })); }
    else if (performance.now() - E.holding > 1600) { tapTarget.dispatchEvent(new PointerEvent('pointerup', { pointerId: 9, bubbles: true, clientX: E.holdXY[0], clientY: E.holdXY[1] })); E.holding = 0; }
    return;
  }
  if (tapTarget) { tap(tapTarget); }
  const D = ctx.testHooks.drag;
  if (D && !(ui.querySelector('.dlg') && !ui.querySelector('.dlg').hidden)) { // 매단 돌 끌기(조선 6장): 돌을 잡아 빈자리 위로 천천히 끌고 놓는다
    const pt = a => (Array.isArray(a) ? { x: a[0], y: a[1] } : a);
    const ev = (t, q) => D.el.dispatchEvent(new PointerEvent(t, { pointerId: 11, bubbles: true, clientX: q.x, clientY: q.y }));
    if (!E.drag) { const a = pt(D.stone()); E.drag = { k: 0, from: a }; ev('pointerdown', a); return; }
    const b = pt(D.target()), k = (E.drag.k += 0.08), q = { x: E.drag.from.x + (b.x - E.drag.from.x) * Math.min(1, k), y: E.drag.from.y + (b.y - E.drag.from.y) * Math.min(1, k) };
    ev('pointermove', q);
    if (k >= 1.2) { ev('pointerup', q); E.drag = null; }
    return;
  }
  E.drag = null;
  if (ctx.testHooks.pressing) { release(); action(); return; }
  const g = w.getGoal?.() || ctx.testHooks.walkTo;
  if (g && w.camMode === 'follow' && ctx.input.enabled) {
    const p = w.player.position; let dx = g.x - p.x, dz = g.z - p.z; const d = Math.hypot(dx, dz);
    if (wander > 0) { wander -= 1; const a = E.step * 0.7; dx = Math.cos(a); dz = Math.sin(a); } // 막혔으면 잠깐 옆으로 비켜 걷는다
    if (d > 1.2 || wander > 0) { const n = Math.hypot(dx, dz) || 1; if (!dragging) { pe('pointerdown', 150, 150); dragging = true; } pe('pointermove', 150 + dx / n * 40, 150 + dz / n * 40); }
    else { release(); action(); }
    // 같은 자리에 오래 머물면(막힘) 비켜 걷기
    E.pos = E.pos || { x: p.x, z: p.z, t: performance.now() };
    if (Math.hypot(p.x - E.pos.x, p.z - E.pos.z) > 0.3) E.pos = { x: p.x, z: p.z, t: performance.now() };
    else if (performance.now() - E.pos.t > 3000 && d > 1.2) { wander = 12; E.pos.t = performance.now(); E.log.push(`비켜 걷기 ${p.x.toFixed(1)},${p.z.toFixed(1)} → ${g.x.toFixed(1)},${g.z.toFixed(1)}`); }
  } else { release(); const t = document.querySelector('.talkbtn'); if (t && !t.disabled && ctx.input.enabled) action(); }
}
setInterval(() => { try { tick(); } catch (e) { E.log.push('bot ' + e.message); } }, 60);
