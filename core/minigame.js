// 미니게임 공통 부품: 방법 카드, 다시 하기·쉬운 모드, 화면 위 누르기 목표, 큰 행동 버튼.
import * as THREE from 'three';
import { MAP_OUTLINE } from './screens.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
// 카드 놀이에서 틀렸을 때: 처음부터 다시가 아니라 카드 안에 해설을 보여 주고 맞는 답을 이어서 고르게 한다.
// 끝까지 하면 한 번이라도 틀린 놀이는 'missed'(성공이지만 첫 시도 성공은 아님)로 끝난다.
function missNote(card) {
  const why = el('p', 'card-why'); why.hidden = true; why.setAttribute('role', 'status'); card.append(why);
  return text => { why.textContent = text; why.hidden = false; };
}
const result = missed => (missed ? 'missed' : true);
const DEFAULT_HINT = '해설을 떠올려 보고 다시 골라 봐요.';

// 조작(키보드·터치) 줄은 보이지 않는다(D-11-2: 첫 화면에서 한 번만 안내). 설명은 두 줄(할 일 + 성공 조건)로 쓴다.
export function showHowTo(ui, { title, steps }) {
  return new Promise(resolve => {
    const screen = el('section', 'screen howto');
    const card = el('div', 'card');
    card.append(el('div', 'eyebrow', '방법'), el('h2', null, title));
    const ol = el('ol', 'howto-steps');
    for (const s of steps) ol.append(el('li', null, s));
    const go = el('button', 'btn primary', '시작');
    go.type = 'button';
    go.addEventListener('click', () => { screen.remove(); resolve(); });
    card.append(ol, go);
    screen.append(card);
    ui.append(screen);
  });
}

// 실패하면 안내를 보여 주고 다시. 세 번째 실패 뒤부터는 쉬운 모드로 시도한다.
export async function runWithRetries(ctx, attempt, { failHint }) {
  let fails = 0, easyModeUsed = false;
  for (;;) {
    const easy = fails >= 3;
    if (easy) easyModeUsed = true;
    const ok = await attempt(easy);
    if (ok) return { easyModeUsed, first: fails === 0 && ok === true }; // first: 첫 시도에 틀림 없이 해냈나('missed'는 아님)
    fails += 1;
    const hint = typeof failHint === 'function' ? failHint() : failHint;
    await ctx.dialogue.say({ who: 'guide', text: fails === 3 ? `${hint} 이번에는 조금 쉽게 해 볼게요.` : hint });
    ctx.dialogue.close();
  }
}

// 3D 물체 위에 떠 있는 누르기 버튼. 한 번 누르면 바로 꺼져서 두 번 세지지 않는다.
export function createTapTargets(ctx) {
  const targets = new Set();
  const v = new THREE.Vector3();
  const off = ctx.world.onUpdate(() => {
    ctx.world.camera.updateMatrixWorld(); // 고정 카메라로 막 바뀐 경우에도 위치가 맞도록
    for (const t of targets) {
      t.obj.getWorldPosition(v).project(ctx.world.camera);
      const inside = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
      t.btn.hidden = !inside || t.used;
      // 버튼 반지름(약 40px)만큼 화면 안쪽으로 붙잡아 가장자리에서 잘리지 않게 한다
      const W = innerWidth, H = innerHeight;
      t.btn.style.left = `${Math.min(W - 44, Math.max(44, ((v.x + 1) / 2) * W))}px`;
      t.btn.style.top = `${Math.min(H - 44, Math.max(44, ((1 - v.y) / 2) * H))}px`;
    }
  });
  const api = {
    add(obj, { label, onTap }) {
      const btn = el('button', 'tap-target', label);
      btn.type = 'button';
      const t = { obj, btn, used: false };
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (t.used) return;
        t.used = true; btn.hidden = true;
        onTap();
      });
      ctx.ui.append(btn);
      targets.add(t);
      return t;
    },
    remove(t) { t.btn.remove(); targets.delete(t); },
    clear() { for (const t of targets) t.btn.remove(); targets.clear(); },
    dispose() { api.clear(); off(); },
  };
  return api;
}

// 화면 아래 가운데 큰 버튼. 클릭이나 E·스페이스(행동 키)로 누른다. parent를 주면 그 안(카드 아래)에 놓는다.
export function actionButton(ctx, label, parent = ctx.ui) {
  const btn = el('button', 'big-action', label);
  btn.type = 'button';
  if (parent !== ctx.ui) btn.classList.add('in-card');
  parent.append(btn);
  let resolveFn = null;
  const press = () => { if (resolveFn) { const r = resolveFn; resolveFn = null; r(); } };
  btn.addEventListener('click', press);
  const unbind = ctx.onAction(press);
  return {
    wait() { return new Promise(r => { resolveFn = r; }); },
    remove() { unbind(); btn.remove(); resolveFn = null; },
  };
}

// 카드 순서 맞추기: 섞인 카드를 정답 순서대로 누른다. 틀리면 해설(hint)을 보여 주고, 다음 카드가 빛나 이어서 고른다.
// easy이면 처음부터 다음에 눌러야 할 카드가 빛난다. 카드는 글자이거나, 그림이 있는 { text, figure(SVG 글) }(그림 카드).
export function orderCards(ctx, { title, cards, easy = false, hint = DEFAULT_HINT }) {
  return new Promise(resolve => {
    const screen = el('section', 'screen order');
    const card = el('div', 'card wide');
    const slots = el('ol', 'order-slots');
    const pile = el('div', 'order-pile');
    card.append(el('div', 'eyebrow', '순서 맞추기'), el('h2', null, title), pile, slots); // 카드 더미가 위: 놓은 카드 줄이 늘어도 더미가 밀려 내려가지 않는다
    const note = missNote(card);
    screen.append(card);
    ctx.ui.append(screen);
    const order = shuffledOrder(cards).map(c => ({ c }));
    const txt = c => (typeof c === 'string' ? c : c.text);
    const fill = (b, c, mark = '') => { // 카드 안: 그림(있으면)과 글
      b.replaceChildren();
      if (typeof c !== 'string' && c.figure) { const f = el('span', 'order-pic'); f.innerHTML = c.figure; b.append(f); }
      b.append(el('span', 'order-text', mark + txt(c)));
    };
    if (cards.some(c => typeof c !== 'string')) card.classList.add('pics');
    let next = 0, missed = false;
    const buttons = order.map(({ c }) => {
      const b = el('button', 'order-card'); b.type = 'button'; fill(b, c);
      b.addEventListener('click', () => {
        if (c === cards[next]) {
          slots.append(el('li', null, `○ ${txt(c)}`)); b.disabled = true; b.classList.add('placed'); next += 1; // 자리는 남겨 두어 옆 카드가 움직이지 않게
          if (next === cards.length) { setTimeout(() => { screen.remove(); resolve(result(missed)); }, 300); return; }
          glow();
        } else if (!b.classList.contains('wrong')) {
          missed = true;
          b.classList.add('wrong'); fill(b, c, '× '); // 색과 함께 × 표시
          note(`× 「${txt(c)}」은(는) 아직 차례가 아니에요. ${hint} 빛나는 카드가 다음 차례예요.`);
          glow();
          setTimeout(() => { b.classList.remove('wrong'); fill(b, c); }, 900);
        }
      });
      pile.append(b);
      return b;
    });
    const glow = () => { if (easy || missed) buttons.forEach((b, k) => b.classList.toggle('hint', order[k].c === cards[next])); };
    glow();
  });
}

// 획 따라 그리기: 획마다 점을 순서대로 지나가면 그 획이 새겨진다. 손을 떼면 그 획만 처음부터.
// outlines(획 모양 SVG 경로, 1024 격자·y 위로)가 있으면 글꼴 대신 실제 획 모양을 흐리게 깔고, 새긴 획을 진하게 채운다.
export function traceGlyph(ctx, { glyph, strokes, outlines = null, reading = '', easy = false }) {
  return new Promise(resolve => {
    const NS = 'http://www.w3.org/2000/svg';
    const screen = el('section', 'screen trace');
    const card = el('div', 'card');
    const board = el('div', 'trace-board');
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 100 100');
    const shapes = [];
    if (outlines) {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('transform', `translate(0 ${900 * 100 / 1024}) scale(${100 / 1024} ${-100 / 1024})`);
      for (const d of outlines) {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d); p.setAttribute('class', 'trace-outline');
        g.append(p); shapes.push(p);
      }
      svg.append(g);
    } else {
      const bg = document.createElementNS(NS, 'text');
      bg.setAttribute('x', '50'); bg.setAttribute('y', '58'); bg.setAttribute('text-anchor', 'middle'); bg.setAttribute('dominant-baseline', 'middle');
      bg.setAttribute('class', 'trace-glyph'); bg.textContent = glyph;
      svg.append(bg);
    }
    board.append(svg);
    const count = el('p', 'trace-count');
    const info = el('div', 'trace-info');
    info.append(el('div', 'eyebrow', '글자 새기기'), el('h2', null, `'${glyph}'${reading ? `(${reading})` : ''} 자를 새겨 보아요`), el('p', null, '빛나는 점을 1번부터 차례로 지나가도록 끌어요.'), count);
    card.append(info, board);
    screen.append(card); ctx.ui.append(screen);

    // 점 판정 반경. 점을 세 번 놓치면(시작점을 못 누르거나 획 도중에 손을 떼면) 쉬운 모드로 넓힌다.
    let R = easy ? 0.11 : 0.07, misses = 0;
    const miss = () => { misses += 1; if (misses >= 3 && R < 0.11) { R = 0.11; board.dataset.easy = '1'; } };
    if (easy) board.dataset.easy = '1';
    let s = 0, progress = 0, active = null;
    const dots = [];
    const drawDots = () => {
      dots.forEach(d => d.remove()); dots.length = 0;
      count.textContent = `${Math.min(s + 1, strokes.length)} / ${strokes.length}획`;
      shapes.forEach((p, i) => p.classList.toggle('now', i === s));
      if (s >= strokes.length) return;
      strokes[s].forEach(([x, y], i) => {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', x * 100); c.setAttribute('cy', y * 100); c.setAttribute('r', i === 0 ? 4.5 : 3.2);
        c.setAttribute('class', `trace-dot${i < progress ? ' passed' : ''}${i === 0 ? ' first' : ''}`);
        svg.append(c); dots.push(c);
        if (i < progress) { // 지나간 점에는 색과 함께 ✓ 표시 (색만으로 구분하지 않게)
          const m = document.createElementNS(NS, 'text');
          m.setAttribute('x', x * 100); m.setAttribute('y', y * 100 + 1.6); m.setAttribute('class', 'dot-check');
          m.textContent = '✓';
          svg.append(m); dots.push(m);
        }
      });
    };
    const pos = e => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
    const near = ([x, y], [px, py]) => Math.hypot(x - px, y - py) < R;
    const finishStroke = () => {
      if (shapes[s]) shapes[s].classList.add('done');
      else {
        const line = document.createElementNS(NS, 'polyline');
        line.setAttribute('points', strokes[s].map(([x, y]) => `${x * 100},${y * 100}`).join(' '));
        line.setAttribute('class', 'stroke-done');
        svg.append(line);
      }
      s += 1; progress = 0;
      if (s === strokes.length) { drawDots(); setTimeout(() => { screen.remove(); resolve(true); }, 400); }
      else drawDots();
    };
    board.addEventListener('pointerdown', e => {
      if (s >= strokes.length) return;
      if (!near(strokes[s][0], pos(e))) { miss(); return; }
      active = e.pointerId; progress = 1; last = pos(e);
      try { board.setPointerCapture(e.pointerId); } catch { /* 합성 이벤트 */ }
      drawDots();
    });
    // 손가락을 빨리 움직이면 두 위치 사이를 건너뛴다. 그 사이 선분 위를 촘촘히 따라가며 점을 지났는지 본다.
    let last = null;
    board.addEventListener('pointermove', e => {
      if (e.pointerId !== active || s >= strokes.length) return;
      const now = pos(e);
      const steps = Math.max(1, Math.ceil(Math.hypot(now[0] - last[0], now[1] - last[1]) / (R / 2)));
      for (let k = 1; k <= steps && active !== null; k++) {
        const p = [last[0] + (now[0] - last[0]) * k / steps, last[1] + (now[1] - last[1]) * k / steps];
        if (near(strokes[s][progress], p)) {
          progress += 1;
          if (progress === strokes[s].length) { active = null; finishStroke(); } else drawDots();
        }
      }
      last = now;
    });
    const lift = e => { if (e.pointerId !== active) return; active = null; progress = 0; miss(); drawDots(); };
    board.addEventListener('pointerup', lift);
    board.addEventListener('pointercancel', lift);
    drawDots();
  });
}

// 지도에서 고르기: 고려 지도 위의 장소 버튼 중 하나를 누르면 그 id를 돌려준다.
export function pickOnMap(ctx, { title, places }) {
  return new Promise(resolve => {
    const screen = el('section', 'screen pickmap');
    const card = el('div', 'card');
    const map = el('div', 'map pick');
    map.innerHTML = `<svg viewBox="0 0 300 400" aria-hidden="true"><polygon points="${MAP_OUTLINE}" class="land"/><ellipse cx="120" cy="388" rx="16" ry="8" class="land"/></svg>`;
    for (const p of places) {
      const b = el('button', 'map-place', p.label); b.type = 'button';
      b.dataset.place = p.id;
      // 위치는 작은 점으로, 버튼은 점 옆(labelAt)에 놓아 가까운 장소끼리 겹치지 않게 한다
      const [lx, ly] = p.labelAt || p.xy;
      b.style.left = `${lx}%`; b.style.top = `${ly}%`;
      b.addEventListener('click', () => { screen.remove(); resolve(p.id); });
      const dot = el('span', 'map-dot'); dot.style.left = `${p.xy[0]}%`; dot.style.top = `${p.xy[1]}%`;
      if (p.labelAt) {
        const line = el('span', 'map-line');
        const dx = (lx - p.xy[0]) * 3, dy = (ly - p.xy[1]) * 4; // 지도 비율 300×400
        line.style.left = `${p.xy[0]}%`; line.style.top = `${p.xy[1]}%`;
        line.style.width = `${Math.hypot(dx, dy) / 3}%`;
        line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
        map.append(line);
      }
      map.append(dot, b);
    }
    card.append(el('div', 'eyebrow', '지도에서 고르기'), el('h2', null, title), map);
    screen.append(card);
    ctx.ui.append(screen);
  });
}

// 카드 고르기: 맞는 카드(correct)를 모두 누르면 성공. 틀린 카드를 누르면 해설(hint)을 보여 주고 그 카드만 지운 채 이어서 고른다.
// easy이면 맞는 카드가 빛난다. figure(SVG 글)가 있으면 카드 위에 그림을 보여 준다.
export function chooseCards(ctx, { title, prompt = '', cards, figure = null, easy = false, hint = DEFAULT_HINT }) {
  return new Promise(resolve => {
    const screen = el('section', 'screen order choose');
    const card = el('div', 'card wide');
    const need = cards.filter(c => c.correct).length;
    if (ctx.testHooks) ctx.testHooks.chooseAnswer = cards.filter(c => c.correct).map(c => c.text); // 테스트 봇용
    const count = el('p', 'choose-count');
    const pile = el('div', 'order-pile');
    card.append(el('div', 'eyebrow', '카드 고르기'), el('h2', null, title));
    if (prompt) card.append(el('p', null, prompt));
    if (figure) { const f = el('div', 'choose-figure'); f.innerHTML = figure; card.append(f); } // 그림(SVG 글): 해시계, 측우기 등
    card.append(count, pile);
    const note = missNote(card);
    screen.append(card); ctx.ui.append(screen);
    let got = 0, over = false, missed = false;
    const show = () => { count.textContent = `고른 카드 ${got} / ${need}`; };
    const buttons = cards.map(c => {
      const b = el('button', `order-card${easy && c.correct ? ' hint' : ''}${[...c.text].length <= 2 ? ' big' : ''}`, c.text); b.type = 'button'; // 글자 하나·둘(자음·모음·낱말)은 크게
      b.addEventListener('click', () => {
        if (over || b.disabled) return;
        if (c.correct) {
          got += 1; b.disabled = true; b.classList.remove('hint'); b.classList.add('picked'); b.textContent = `○ ${c.text}`; show();
          if (got === need) { over = true; setTimeout(() => { screen.remove(); resolve(result(missed)); }, 400); }
        } else {
          missed = true; b.disabled = true; b.classList.add('wrong'); b.textContent = `× ${c.text}`;
          note(`× 「${c.text}」은(는) 맞지 않아요. ${hint} 남은 카드에서 다시 골라 봐요.`);
        }
      });
      pile.append(b);
      return b;
    });
    show();
  });
}

// 때 맞춰 누르기(막대): 표시가 막대 위를 왼쪽에서 오른쪽으로 움직인다. 빛나는 칸(zone, 0~1) 안에서 큰 버튼을 누르면 true.
// 너무 이르거나 늦으면 false. 시간은 월드 시계로 재서 메뉴를 열면 멈춘다. 처음 0.4초의 누름은 무시한다.
export function timingBar(ctx, { title, prompt = '', label = '지금!', zone: [lo, hi], seconds = 4, easy = false }) {
  const pad = easy ? 0.04 : 0;
  const [a, b] = [Math.max(0, lo - pad), Math.min(1, hi + pad)];
  const screen = el('section', 'screen gauge');
  const card = el('div', 'card wide');
  const bar = el('div', 'gauge-bar');
  const zoneEl = el('div', 'gauge-zone'); zoneEl.style.left = `${a * 100}%`; zoneEl.style.width = `${(b - a) * 100}%`;
  const mark = el('div', 'gauge-mark');
  bar.append(zoneEl, mark);
  card.append(el('div', 'eyebrow', '때 맞춰 누르기'), el('h2', null, title));
  if (prompt) card.append(el('p', null, prompt));
  card.append(bar);
  screen.append(card); ctx.ui.append(screen);
  const btn = actionButton(ctx, label, card); // 화면 판이 큰 버튼을 덮지 않게 카드 안에 둔다
  let t = 0, done = false;
  ctx.testHooks.armed = false;
  return new Promise(resolve => {
    const finish = ok => {
      if (done) return; done = true;
      off(); btn.remove(); ctx.testHooks.ready = false; ctx.testHooks.armed = undefined;
      mark.classList.add(ok ? 'hit' : 'miss');
      setTimeout(() => { screen.remove(); resolve(ok); }, 500);
    };
    const press = () => btn.wait().then(() => {
      if (done) return;
      if (t < 0.4) return press();
      const k = t / seconds;
      finish(k >= a && k <= b);
    });
    press();
    const off = ctx.world.onUpdate(dt => {
      if (done) return;
      t += dt;
      const k = Math.min(1, t / seconds);
      mark.style.left = `${k * 100}%`;
      ctx.testHooks.ready = k >= a + 0.02 && k <= b - 0.02;
      ctx.testHooks.armed = t >= 0.4;
      if (k >= 1) finish(false);
    });
  });
}

// 카드 나누기: 카드가 한 장씩 나오면 알맞은 바구니(bins)를 누른다. 틀리면 해설(hint)을 보여 주고 맞는 바구니가 빛나 다시 고른다.
// easy이면 처음부터 맞는 바구니가 빛난다.
export function sortCards(ctx, { title, bins, cards, easy = false, hint = DEFAULT_HINT }) {
  return new Promise(resolve => {
    const screen = el('section', 'screen order sort');
    const card = el('div', 'card wide');
    const now = el('p', 'sort-now');
    const row = el('div', 'sort-bins');
    card.append(el('div', 'eyebrow', '카드 나누기'), el('h2', null, title), now, row);
    const note = missNote(card);
    screen.append(card); ctx.ui.append(screen);
    let i = 0, over = false, lockUntil = 0, missed = false, glowNow = false; // 카드가 바뀐 직후 잠깐(0.25초)은 누름을 받지 않는다(태블릿 두 번 누르기)
    const counts = bins.map(() => 0);
    const buttons = bins.map((b, k) => {
      const btn = el('button', 'sort-bin', ''); btn.type = 'button'; btn.dataset.bin = b.id;
      const show = () => { btn.textContent = `${b.label} (${counts[k]})`; };
      show();
      btn.addEventListener('click', () => {
        if (over || performance.now() < lockUntil) return;
        if (cards[i].bin === b.id) {
          counts[k] += 1; show(); i += 1; lockUntil = performance.now() + 250;
          if (i === cards.length) { over = true; setTimeout(() => { screen.remove(); resolve(result(missed)); }, 400); } else { glowNow = false; ask(); }
        } else {
          missed = true; glowNow = true; lockUntil = performance.now() + 250;
          btn.classList.add('wrong'); setTimeout(() => btn.classList.remove('wrong'), 900);
          note(`× 「${cards[i].text}」은(는) ${b.label}이(가) 아니에요. ${hint} 빛나는 곳을 눌러 봐요.`);
          ask();
        }
      });
      row.append(btn);
      return btn;
    });
    const ask = () => {
      now.textContent = `“${cards[i].text}” (${i + 1} / ${cards.length})`;
      buttons.forEach((x, k) => x.classList.toggle('hint', (easy || glowNow) && bins[k].id === cards[i].bin));
    };
    ask();
  });
}

// 자리 놓기: 판 위의 자리(slots) 중에서 지금 물건(items 차례대로)이 들어갈 자리를 누른다.
// 틀린 자리를 누르면 해설(hint)을 보여 주고 맞는 자리가 빛나 다시 고른다. decor는 판 위의 이름표(산, 강 등). easy이면 처음부터 맞는 자리가 빛난다.
// boardClass 'map'이면 판을 지도처럼 그린다(북쪽 산).
export function placeOnBoard(ctx, { title, items, slots, decor = [], easy = false, boardClass = '', hint = DEFAULT_HINT }) {
  return new Promise(resolve => {
    const screen = el('section', 'screen order place');
    const card = el('div', 'card wide');
    const now = el('p', 'place-now');
    const board = el('div', `place-board ${boardClass}`);
    for (const d of decor) { const t = el('span', `place-decor ${d.cls || ''}`, d.label); t.style.left = `${d.xy[0]}%`; t.style.top = `${d.xy[1]}%`; board.append(t); }
    card.append(el('div', 'eyebrow', '자리 놓기'), el('h2', null, title), now, board);
    const note = missNote(card);
    screen.append(card); ctx.ui.append(screen);
    let i = 0, over = false, missed = false, glowNow = false;
    const buttons = slots.map(s => {
      const b = el('button', 'place-slot', s.label || '?'); b.type = 'button'; b.dataset.slot = s.id;
      b.style.left = `${s.xy[0]}%`; b.style.top = `${s.xy[1]}%`;
      b.addEventListener('click', () => {
        if (over || b.disabled) return;
        const item = items[i];
        if (s.answer === item.id) {
          b.disabled = true; b.classList.add("filled"); // 놓은 물건 이름을 크게, 칸의 설명은 작게 (칸이 길어져 판 밖으로 나가지 않게)
          if (item.icon) { b.classList.add('icon'); b.innerHTML = item.icon; if (s.label) b.append(el('small', null, s.label)); } // 그림이 있는 물건(판옥선 등)은 그림으로 놓인다
          else b.replaceChildren(`○ ${item.label}`, ...(s.label ? [el('small', null, s.label)] : []));
          i += 1;
          if (i === items.length) { over = true; setTimeout(() => { screen.remove(); resolve(result(missed)); }, 500); } else { glowNow = false; ask(); }
        } else {
          missed = true; glowNow = true;
          b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 900);
          note(`× 「${item.label}」은(는) 그 자리가 아니에요. ${hint} 빛나는 자리를 눌러 봐요.`);
          ask();
        }
      });
      board.append(b);
      return b;
    });
    const ask = () => {
      const pic = items[i].icon ? Object.assign(el('span', 'place-icon'), { innerHTML: items[i].icon }) : null;
      now.replaceChildren('놓을 것: ', ...(pic ? [pic] : []), el('b', 'place-item', items[i].label), ` (${i + 1} / ${items.length})`);
      buttons.forEach((b, k) => b.classList.toggle('hint', (easy || glowNow) && !b.disabled && slots[k].answer === items[i].id));
    };
    ask();
  });
}

// 정답 순서도, 그 반대 순서도 아니게 섞는다 (고정된 씨앗이라 화면이 매번 같다).
export function shuffledOrder(cards) {
  let seed = 11 + cards.length;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const same = (a, b) => a.every((x, i) => x === b[i]);
  const rev = [...cards].reverse();
  for (;;) {
    const a = [...cards];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    if (!same(a, cards) && !same(a, rev)) return a;
  }
}

// 인물 넣기: 아래 줄의 인물(얼굴 카드)을 하나 골라 누르고, 그 사람이 활약한 사건의 원을 누르면 원 안에 들어간다.
// 모두 넣으면 성공. 틀린 원을 누르면 해설(hint)을 보여 주고 맞는 원이 빛나 다시 고른다(끝나면 'missed').
// figures: [{ id, name, face(그림 주소) }], circles: [{ id, label, answer(인물 id) }]. easy이면 고른 인물의 맞는 원이 처음부터 빛난다.
export function fitFigures(ctx, { title, figures, circles, easy = false, hint = DEFAULT_HINT }) {
  return new Promise(resolve => {
    const screen = el('section', 'screen order fit');
    const card = el('div', 'card wide');
    const ring = el('div', 'fit-circles');
    const row = el('div', 'fit-figures');
    const now = el('p', 'fit-now', '먼저 아래에서 인물을 한 명 골라요.');
    card.append(el('div', 'eyebrow', '인물 넣기'), el('h2', null, title), ring, now, row);
    const note = missNote(card);
    screen.append(card); ctx.ui.append(screen);
    let picked = null, placed = 0, missed = false;
    const glow = () => cBtns.forEach((b, k) => b.classList.toggle('hint', !!picked && !b.disabled && (easy || picked.glow) && circles[k].answer === picked.f.id));
    const fBtns = figures.map(f => {
      const b = el('button', 'fit-figure'); b.type = 'button'; b.dataset.figure = f.id;
      if (f.face) { const img = el('img'); img.src = f.face; img.alt = ''; b.append(img); }
      b.append(el('span', null, f.name));
      b.addEventListener('click', () => {
        if (b.disabled) return;
        picked = { f, b, glow: false };
        fBtns.forEach(x => x.classList.toggle('picked', x === b));
        now.textContent = `${f.name}: 어느 원에 넣을까요?`;
        glow();
      });
      row.append(b);
      return b;
    });
    const cBtns = circles.map(c => {
      const b = el('button', 'fit-circle'); b.type = 'button'; b.dataset.circle = c.id;
      const inside = el('span', 'fit-inside');
      b.append(inside, el('span', 'fit-label', c.label));
      b.addEventListener('click', () => {
        if (b.disabled || !picked) return;
        if (c.answer === picked.f.id) {
          b.disabled = true; b.classList.add('filled');
          inside.replaceChildren(...[...picked.b.childNodes].map(n => n.cloneNode(true))); // 원 안에 그 인물이 들어간다
          picked.b.disabled = true; picked.b.classList.remove('picked'); picked.b.classList.add('placed');
          picked = null; placed += 1; glow();
          now.textContent = placed === circles.length ? '모두 넣었어요!' : '다음 인물을 골라요.';
          if (placed === circles.length) setTimeout(() => { screen.remove(); resolve(result(missed)); }, 600);
        } else {
          missed = true; picked.glow = true;
          b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 900);
          note(`× ${picked.f.name}은(는) 「${c.label}」의 인물이 아니에요. ${hint} 빛나는 원에 넣어 봐요.`);
          glow();
        }
      });
      ring.append(b);
      return b;
    });
  });
}

// 역사책 넘기기: 한 쪽마다 왼쪽에 그림, 오른쪽에 제목·해·해설(출처). '다음'을 누르면 책장이 넘어간다. 마지막 쪽에서 '다 읽었어요'.
// pages: [{ title, year?, figure(SVG 글), lines: [{ who: 'narr', text, src }] }]. 늘 true로 끝난다.
// render(page): 그 쪽의 재현 그림(데이터 주소)을 돌려주면 평면 그림 대신 보여 주고 '재현 그림'이라고 적는다(없거나 실패하면 page.figure).
// render(page) → 그림 주소(재현 그림). 그림 찍기는 무거울 수 있어서 글을 먼저 보여 주고 곧바로 이어 그리며,
// 읽는 동안 다음 쪽 그림을 미리 찍어 둔다(넘길 때 멈칫하지 않게). onTiming(이름, ms): 개발용 성능 측정
export function readBook(ctx, { title, pages, render = null, onTiming = null }) {
  return new Promise(resolve => {
    const screen = el('section', 'screen order book');
    const card = el('div', 'card wide');
    const spread = el('div', 'book-spread');
    const pic = el('div', 'book-pic'), text = el('div', 'book-text');
    spread.append(pic, text);
    const prev = el('button', 'btn book-prev', '◀ 이전 쪽'); prev.type = 'button';
    const next = el('button', 'btn primary book-next', '다음 쪽 ▶'); next.type = 'button';
    const page = el('span', 'page');
    const nav = el('div', 'book-nav'); nav.append(prev, page, next);
    card.append(el('div', 'eyebrow', '역사책 읽기'), el('h2', null, title), spread, nav);
    screen.append(card); ctx.ui.append(screen);
    let i = 0, shown = 0, closed = false;
    const ready = new Map(); // 쪽 번호 → 찍어 둔 그림 주소(null이면 못 찍음)
    const draw = k => {
      if (ready.has(k)) return ready.get(k);
      const t0 = performance.now(), url = render(pages[k]);
      onTiming?.(ready.size === 0 ? '역사책 첫 그림' : '역사책 그림', performance.now() - t0, `${k + 1}쪽`);
      ready.set(k, url); return url;
    };
    const putPic = k => {
      const p = pages[k], url = render && p.scene ? draw(k) : null;
      if (url) { const img = el('img', 'book-diorama'); img.src = url; img.alt = `${p.title} 재현 그림`; pic.replaceChildren(img, el('span', 'book-badge', '재현 그림')); }
      else pic.innerHTML = p.figure || '';
    };
    const ahead = k => { if (render && pages[k + 1]?.scene && !ready.has(k + 1)) setTimeout(() => { if (!closed) draw(k + 1); }, 900); }; // 지금 쪽 그림이 뜨고 넘기는 움직임이 끝난 뒤, 읽는 동안 다음 쪽
    const show = () => {
      const p = pages[i], k = i, token = ++shown;
      if (!render || !p.scene || ready.has(k)) { putPic(k); ahead(k); }
      else { pic.replaceChildren(el('span', 'book-wait', '그림을 펼치는 중…')); setTimeout(() => { if (!closed && token === shown) { putPic(k); ahead(k); } }, 30); } // 글이 먼저 화면에 뜨게
      text.replaceChildren(el('h3', null, p.title), ...(p.year ? [el('div', 'book-year', p.year)] : []),
        ...p.lines.map(l => { const q = el('p', null, l.text); if (l.src) q.append(' ', el('span', 'book-src', `[${l.src.join('·')}]`)); return q; }));
      page.textContent = `${i + 1} / ${pages.length}`;
      prev.disabled = i === 0;
      next.textContent = i === pages.length - 1 ? '다 읽었어요' : '다음 쪽 ▶';
    };
    const turn = d => { spread.classList.remove('turn'); void spread.offsetWidth; spread.classList.add('turn'); setTimeout(() => { i += d; show(); }, 200); };
    prev.addEventListener('click', () => { if (i > 0) turn(-1); });
    next.addEventListener('click', () => { if (i < pages.length - 1) turn(1); else { closed = true; screen.remove(); resolve(true); } });
    show();
  });
}

// 문서 보기: 한지에 적은 글(요구 사항 등)을 바로 읽는다. items: [{ text, note? }].
export function showDocument(ctx, { title, heading, intro = '', items, src = null, button = '다 읽었어요' }) {
  return new Promise(resolve => {
    const screen = el('section', 'screen order doc');
    const card = el('div', 'card wide');
    const paper = el('div', 'doc-paper');
    const ol = el('ol');
    for (const it of items) { const li = el('li', null, it.text); if (it.note) li.append(el('small', null, it.note)); ol.append(li); }
    paper.append(el('h3', null, heading), ol);
    const ok = el('button', 'btn primary doc-ok', button); ok.type = 'button';
    card.append(el('div', 'eyebrow', '문서 읽기'), el('h2', null, title), ...(intro ? [el('p', null, intro)] : []), paper, ok);
    screen.append(card); ctx.ui.append(screen);
    ok.addEventListener('click', () => { screen.remove(); resolve(true); });
  });
}
