// 작전 부품 상자(2026-10-26, 고려 2장 시범에서 처음 씀). 장 데이터만 바꿔 다른 장·편에서도 그대로 쓴다.
//  - runRounds: 여러 판(파)을 차례로, 실패하면 그 판만 다시, 몇 번 실패하면 저절로 쉬워진다
//  - commandBoard: 지휘판(구역 칸에 병사 말을 끌어 놓아 몰려오는 위협을 막는다). 3D 연출은 장이 넘겨 준 scene 함수가 맡는다
//  - escort: 호위(무리에 다가가면 뒤를 따라오고, 막힌 길을 피해 안전선까지 데려간다)
//  - talk: 머리 위 말풍선 대사(지금 대화창을 말하는 사람 머리 위로 옮겨 띄운다. 역사 수첩 기록은 그대로)
//  - opsGauge, popText, finale(도장과 지혜 카드), pickGuardian(지킴이 고르기), usePlayerFigure·useNpcFigure(새 사람 모양), flatten(합쳐 그리기)
// 놀이 규칙(병사 배치·호위 등)은 게임 장치다. 사실 문장은 장의 script에서만 가져오고 여기서는 만들지 않는다.
import * as THREE from 'three';
import { createGauge, stampSeal } from '../../core/hud-ops.js';
import { makeFigure } from '../../core/figures.js';

const CSS = `
.ops-board { position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(8px + env(safe-area-inset-bottom, 0px)); z-index: 25;
  width: min(820px, calc(100% - 16px)); box-sizing: border-box; display: flex; flex-wrap: wrap; gap: 8px; align-items: stretch; justify-content: center;
  padding: 8px; border-radius: 12px; background: rgba(27,31,29,.78); border: 2px solid var(--gold, #d9a441); box-shadow: 0 8px 20px #0006; font-family: var(--font-ui); touch-action: none; }
.ops-tray { display: flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 10px; background: #f2ead922; min-height: 64px; }
.ops-tray-label { font: 800 14px var(--font-ui); color: var(--hanji, #f2ead9); writing-mode: horizontal-tb; margin-right: 2px; }
.ops-token { width: 56px; height: 60px; padding: 0; border-radius: 10px; border: 2px solid #3b2f22; background: var(--hanji, #f2ead9); display: grid; place-items: center;
  box-shadow: 0 3px 0 #3b2f22; touch-action: none; cursor: grab; }
.ops-token svg { width: 44px; height: 44px; pointer-events: none; }
.ops-token.picked { outline: 4px solid var(--gold, #d9a441); transform: translateY(-4px); }
.ops-token { position: relative; }
.ops-token .rest { display: none; position: absolute; left: 50%; bottom: -2px; transform: translateX(-50%); white-space: nowrap; font: 800 11px var(--font-ui); color: #3b2f22; background: #f2ead9; border-radius: 6px; padding: 0 4px; }
.ops-token.resting { opacity: .45; }
.ops-token.resting .rest { display: block; }
.ops-token.back { animation: ops-back .3s ease-out; }
@keyframes ops-back { 50% { transform: scale(1.18); } }
.ops-token[hidden] { display: none; }
.ops-zones { display: flex; gap: 8px; flex: 1 1 380px; min-width: 0; }
.ops-zone { flex: 1 1 0; min-width: 0; min-height: 64px; border-radius: 10px; border: 2px solid #3b2f22; background: #e6dcc3; color: #2b241c; padding: 4px 4px 2px;
  display: flex; flex-direction: column; align-items: center; justify-content: space-between; box-shadow: 0 3px 0 #3b2f22; touch-action: none; position: relative; }
.ops-zone .nm { font: 800 15px var(--font-ui); }
.ops-zone .units { display: flex; gap: 3px; min-height: 26px; align-items: center; }
.ops-zone .units i { width: 22px; height: 22px; border-radius: 50%; background: #2f6b5e; border: 2px solid #1b3a33; display: block; }
.ops-zone .need { font: 700 12px var(--font-ui); color: #7a2a1e; min-height: 15px; }
.ops-zone.cursor { outline: 4px solid #ffffffcc; }
.ops-zone.picked { outline: 4px solid var(--gold, #d9a441); }
.ops-zone.danger { background: #f3c7b6; animation: ops-blink .7s ease-in-out infinite alternate; }
.ops-zone.safe { background: #cfe3d6; }
@keyframes ops-blink { to { background: #e89c84; } }
.ops-tag { position: fixed; z-index: 24; transform: translate(-50%, -100%); padding: 2px 10px; border-radius: 12px; background: #1b1f1dcc; color: var(--hanji, #f2ead9);
  font: 800 14px var(--font-ui); pointer-events: none; white-space: nowrap; border: 2px solid transparent; }
.ops-tag.danger { background: #b8452fee; border-color: #fff; animation: ops-blink-tag .7s ease-in-out infinite alternate; }
@keyframes ops-blink-tag { to { transform: translate(-50%, -100%) scale(1.12); } }
.ops-ghost { position: fixed; z-index: 70; width: 52px; height: 56px; margin: -28px 0 0 -26px; pointer-events: none; opacity: .9; }
.ops-pop { position: fixed; z-index: 65; transform: translate(-50%, -50%); font: 800 24px var(--font-display); color: #fff; pointer-events: none; white-space: nowrap;
  text-shadow: 0 2px 0 #1b1f1d, 0 0 8px #000a; animation: ops-up 1s ease-out both; }
.ops-pop.bad { color: #ffb4a0; } .ops-pop.good { color: #f6e7b8; }
@keyframes ops-up { 0% { transform: translate(-50%, -20%) scale(.5); opacity: 0; } 25% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; } 100% { transform: translate(-50%, -140%) scale(1); opacity: 0; } }
.dlg.ops-bubble { bottom: auto; width: min(440px, calc(100% - 24px)); transform: translate(-50%, calc(-100% - 16px)); padding: 10px 14px 8px; border-radius: 16px; gap: 2px 10px; }
.dlg.ops-bubble .dlg-portrait { width: 42px; height: 42px; font-size: 20px; }
.dlg.ops-bubble .dlg-name { font-size: 15px; }
.dlg.ops-bubble .dlg-text { font-size: 17px; line-height: 1.45; min-height: 0; }
.dlg.ops-bubble .dlg-next { font-size: 12px; }
.dlg.ops-bubble::after { content: ''; position: absolute; left: var(--tail, 50%); bottom: -14px; margin-left: -12px; border: 12px solid transparent; border-bottom: 0; border-top-color: #3b2f22; }
.screen.ops-pick { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; background: rgba(27,31,29,.6); }
.ops-pick .card { background: var(--hanji, #f2ead9); border: 2px solid #3b2f22; border-radius: 12px; padding: 16px 18px; width: min(560px, calc(100% - 24px)); box-sizing: border-box; text-align: center; }
.ops-pick h2 { margin: 0 0 4px; font: 800 22px var(--font-display); }
.ops-pick p { margin: 0 0 12px; }
.ops-pick .row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 12px; }
.ops-pick .opt { width: 120px; min-height: 120px; border-radius: 12px; border: 3px solid #3b2f22; background: #fffaf0; color: #2b241c; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; font: 800 16px var(--font-ui); }
.ops-pick .opt.on { border-color: var(--gold, #d9a441); box-shadow: 0 0 0 3px var(--gold, #d9a441); }
.ops-pick .sw { width: 56px; height: 56px; border-radius: 50%; border: 3px solid #3b2f22; }
.ops-pick .btns { display: flex; gap: 10px; justify-content: center; }
.ops-pick .btns button { min-height: 48px; min-width: 120px; font: 800 17px var(--font-ui); border-radius: 10px; border: 2px solid #3b2f22; }
.ops-pick .btns .primary { background: #2f6b5e; color: #fff; }
.ops-wisdom { position: absolute; left: 50%; top: calc(50% + 150px); transform: translateX(-50%); width: min(420px, calc(100% - 32px)); box-sizing: border-box; z-index: 61;
  background: var(--hanji, #f2ead9); border: 2px solid #3b2f22; border-radius: 10px; padding: 10px 14px; box-shadow: 0 8px 18px #0006; font: 600 16px var(--font-ui); color: #2b241c;
  animation: ops-up-in .4s .5s ease-out both; pointer-events: none; }
.ops-wisdom b { display: block; font: 800 13px var(--font-ui); color: #7a2a1e; margin-bottom: 2px; }
@keyframes ops-up-in { from { opacity: 0; transform: translate(-50%, 16px); } to { opacity: 1; transform: translate(-50%, 0); } }
`;
function ensureStyle() {
  if (document.getElementById('kit-ops-style')) return;
  const s = document.createElement('style'); s.id = 'kit-ops-style'; s.textContent = CSS; document.head.appendChild(s);
}
const SOLDIER = '<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="22" r="10" fill="#f2c9a0" stroke="#3a2a1c" stroke-width="2.5"/><path d="M19 20 C19 8 41 8 41 20 Z" fill="#7d8ea0" stroke="#3a2a1c" stroke-width="2.5"/><path d="M15 56 C15 38 45 38 45 56 Z" fill="#2f6b5e" stroke="#3a2a1c" stroke-width="2.5"/><path d="M50 6 V56" stroke="#8a5a38" stroke-width="3"/><path d="M50 2 L54 10 H46 Z" fill="#cfd5da" stroke="#3a2a1c" stroke-width="1.5"/></svg>';
const v3 = new THREE.Vector3();
function toScreen(world, obj, dy = 0) {
  obj.getWorldPosition(v3); v3.y += dy;
  world.camera.updateMatrixWorld(); v3.project(world.camera);
  return { x: (v3.x + 1) / 2 * innerWidth, y: (1 - v3.y) / 2 * innerHeight, front: v3.z < 1 };
}

// ── 여러 판을 차례로: 실패하면 그 판만 다시. easyAfter번 실패하면 그 뒤로는 쉬운 모드(장 쪽에서 정한다, 기본 2) ──
// play(round, { index, easy }) → true(성공)/false. 돌려주는 것: { first(한 번도 안 틀림), easyModeUsed, fails }
export async function runRounds(ctx, rounds, play, { easyAfter = 2, failHint = '다시 해 봐요.' } = {}) {
  let fails = 0, easyModeUsed = false;
  for (let i = 0; i < rounds.length; i++) {
    for (;;) {
      const easy = fails >= easyAfter;
      if (easy) easyModeUsed = true;
      if (await play(rounds[i], { index: i, easy })) break;
      fails += 1;
      const hint = typeof failHint === 'function' ? failHint(rounds[i], i) : failHint;
      await ctx.dialogue.say({ who: 'guide', text: fails === easyAfter ? `${hint} 이번에는 조금 쉽게 해 볼게요.` : hint });
      ctx.dialogue.close();
    }
  }
  return { first: fails === 0, easyModeUsed, fails };
}

// ── 지킴 게이지(위 가운데) ──
// 위 가운데가 목표 상자와 겹치면 목표 상자 오른쪽으로, 그래도 모자라면 목표 상자 아래로 비킨다
export function opsGauge(ctx, opts = {}) {
  const g = createGauge(ctx.ui, { value: 0.5, ...opts });
  const place = () => {
    const el = g.el; el.style.left = ''; el.style.top = ''; el.style.transform = '';
    const box = ctx.ui.querySelector('.hud:not([hidden])')?.getBoundingClientRect(), r = el.getBoundingClientRect();
    if (!box || !box.width || box.right + 8 <= r.left || box.bottom + 4 <= r.top) return;
    const right = innerWidth - 84; // 오른쪽 위 메뉴 단추 자리
    if (box.right + 12 + r.width <= right) { el.style.left = `${box.right + 12}px`; el.style.transform = 'none'; }
    else el.style.top = `${Math.round(box.bottom + 8)}px`;
  };
  place(); addEventListener('resize', place);
  const hudEl = ctx.ui.querySelector('.hud'), ro = hudEl && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(place) : null; // 목표 글이 바뀌어 상자 크기가 달라지면 다시
  ro?.observe(hudEl);
  const dispose = g.dispose; g.dispose = () => { removeEventListener('resize', place); ro?.disconnect(); dispose(); };
  return g;
}

// ── 화면 위로 튀어 오르는 글자(성공·실패) ──
export function popText(ctx, text, at, kind = 'good') {
  ensureStyle();
  const el = document.createElement('div'); el.className = `ops-pop ${kind}`; el.textContent = text;
  const p = at && at.isObject3D ? toScreen(ctx.world, at, 2.5) : at || { x: innerWidth / 2, y: innerHeight * 0.4 };
  el.style.left = `${Math.min(innerWidth - 60, Math.max(60, p.x))}px`; el.style.top = `${Math.max(90, p.y)}px`;
  ctx.ui.append(el); setTimeout(() => el.remove(), 1000);
}
export function shake(ctx) { const r = ctx.ui; r.classList.remove('ops-shake'); void r.offsetWidth; r.classList.add('ops-shake'); setTimeout(() => r.classList.remove('ops-shake'), 340); }

// ── 지휘판 한 판 ──
// zones: [{ id, label, anchor?: Object3D(위 글자 자리) }], units: 병사 말 수,
// threats: [{ at: 나타나는 때(초), zone: 구역 번호, need: 막는 데 드는 병사 수(큰 사다리 2) }]
// practice: true면 위협 없이 '모든 구역에 병사를 하나씩' 놓으면 끝(연습)
// scene: 3D 연출(장이 준다). spawn(th)→handle, update(handle, phase('warn'|'raise'|'climb'|'push'), k), end(handle, 'blocked'|'breach'), defenders(counts, pushing)
// timing: { warn, raise, climb, push, rest } 초. easy면 오르는 시간이 길어지고 큰 사다리도 병사 하나로 막는다
// 돌려주는 것: Promise<boolean>. 사다리(위협)가 maxBreach개 꼭대기에 닿으면 false
export function commandBoard(ctx, { zones, units = 3, threats = [], practice = false, easy = false, maxBreach = 3, scene = {}, gauge = null,
  timing = {}, label = '', texts = {} }) {
  ensureStyle();
  const { world, hud, audio } = ctx;
  const T = { warn: 1.6, raise: 0.8, climb: 5, push: 0.6, rest: 0.8, ...timing };
  if (easy) { T.climb *= 1.6; T.rest = Math.min(T.rest, 0.4); } // 쉬운 모드: 밀어낸 병사가 더 빨리 돌아온다
  const tx = { tray: '대기', rest: '쉬는 중', need: n => `병사 ${n}명 필요`, blocked: '막았다!', breach: '올라왔다!', ...texts };
  const unitZone = Array(units).fill(null), restUntil = Array(units).fill(0);
  let t = 0, picked = null, pickedZone = null, cursor = Math.floor(zones.length / 2), blocked = 0, breaches = 0, done = false;
  const live = threats.map(th => ({ ...th, need: easy ? 1 : (th.need || 1), state: 'wait', t: 0, h: null }));
  ctx.testHooks.board = { live, unitZone };

  const board = document.createElement('div'); board.className = 'ops-board';
  const tray = document.createElement('div'); tray.className = 'ops-tray'; tray.innerHTML = `<span class="ops-tray-label">${tx.tray}</span>`;
  const tokens = unitZone.map((_, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ops-token'; b.dataset.unit = i; b.innerHTML = `${SOLDIER}<span class="rest">${tx.rest}</span>`; b.setAttribute('aria-label', `병사 ${i + 1}`);
    tray.append(b); return b;
  });
  const zoneBox = document.createElement('div'); zoneBox.className = 'ops-zones';
  const zoneEls = zones.map((z, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ops-zone'; b.dataset.zone = i;
    b.innerHTML = `<span class="nm">${z.label}</span><span class="units"></span><span class="need"></span>`;
    zoneBox.append(b); return b;
  });
  board.append(tray, zoneBox); ctx.ui.append(board);
  // 3D 성벽 위 구역 이름표(지휘판 칸과 같은 이름): 위협이 오면 빨갛게 깜박인다
  const tags = zones.map(z => { if (!z.anchor) return null; const d = document.createElement('div'); d.className = 'ops-tag'; d.textContent = z.label; ctx.ui.append(d); return d; });
  const placeTags = () => tags.forEach((d, i) => {
    if (!d) return;
    const p = toScreen(world, zones[i].anchor, 0);
    d.hidden = !p.front; d.style.left = `${p.x}px`; d.style.top = `${p.y}px`;
    d.classList.toggle('danger', zoneEls[i].classList.contains('danger'));
  });

  const count = z => unitZone.filter(u => u === z).length;
  const active = z => live.find(th => th.zone === z && ['warn', 'raise', 'climb'].includes(th.state));
  const free = () => unitZone.findIndex((u, i) => u === null && restUntil[i] <= t);
  const render = () => {
    tokens.forEach((b, i) => {
      const was = b.classList.contains('resting'), now = restUntil[i] > t;
      if (was && !now) { b.classList.remove('back'); void b.offsetWidth; b.classList.add('back'); } // 쉬는 시간이 끝나면 톡 커졌다 돌아온다
      b.hidden = unitZone[i] !== null; b.classList.toggle('resting', now); b.classList.toggle('picked', picked === i); b.disabled = restUntil[i] > t; });
    zoneEls.forEach((b, z) => {
      const n = count(z), th = active(z), need = th ? th.need : practice ? 1 : 0, short = Math.max(0, need - n);
      b.querySelector('.units').innerHTML = '<i></i>'.repeat(n);
      b.querySelector('.need').textContent = th ? tx.need(th.need) : practice && !n ? tx.need(1) : '';
      b.dataset.short = short; b.dataset.count = n;
      b.classList.toggle('danger', !!th && short > 0); b.classList.toggle('safe', !!th && short === 0);
      b.classList.toggle('cursor', cursor === z); b.classList.toggle('picked', pickedZone === z);
    });
    scene.defenders?.(zones.map((_, z) => count(z)));
  };
  const place = (u, z) => {
    if (u == null || u < 0 || restUntil[u] > t) return false;
    unitZone[u] = z; picked = null; pickedZone = null; audio?.play('tap'); render(); return true;
  };
  const tapZone = z => {
    if (picked != null) { place(picked, z); return; }
    if (pickedZone != null && pickedZone !== z) { const u = unitZone.findIndex(x => x === pickedZone); pickedZone = null; place(u, z); return; }
    const f = free();
    if (f >= 0) { place(f, z); return; } // 대기 병사가 있으면 바로 보낸다(누르기 한 번)
    pickedZone = count(z) ? (pickedZone === z ? null : z) : null; render();
  };
  // 끌어 놓기·누르기: 말을 누르면 고르고, 구역을 누르면 그리로 보낸다. 끌어서 구역 위에 놓아도 된다
  let drag = null;
  const onDown = e => {
    const tok = e.target.closest('.ops-token'), zb = e.target.closest('.ops-zone');
    if (!tok && !zb) return;
    const u = tok ? +tok.dataset.unit : null, z = zb ? +zb.dataset.zone : null;
    if (tok && tok.disabled) return;
    drag = { u, z, x: e.clientX, y: e.clientY, moved: false, ghost: null, id: e.pointerId };
  };
  const onMove = e => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 10) {
      if (drag.u == null && !count(drag.z)) { drag = null; return; }
      drag.moved = true; drag.ghost = document.createElement('div'); drag.ghost.className = 'ops-ghost'; drag.ghost.innerHTML = SOLDIER; document.body.append(drag.ghost);
    }
    if (drag.ghost) { drag.ghost.style.left = `${e.clientX}px`; drag.ghost.style.top = `${e.clientY}px`; }
  };
  const onUp = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    if (!d.moved) return; // 그냥 누르기는 click이 맡는다
    d.ghost.remove();
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('.ops-zone');
    if (!target) return;
    const z = +target.dataset.zone, u = d.u != null ? d.u : unitZone.findIndex(x => x === d.z);
    place(u, z);
    board._dragged = performance.now();
  };
  const onClick = e => {
    if (board._dragged && performance.now() - board._dragged < 300) return; // 끌어 놓은 뒤 따라오는 click은 무시
    const tok = e.target.closest('.ops-token'), zb = e.target.closest('.ops-zone');
    if (tok && !tok.disabled) { const u = +tok.dataset.unit; picked = picked === u ? null : u; pickedZone = null; render(); }
    else if (zb) tapZone(+zb.dataset.zone);
  };
  // 키보드: ←→(또는 1·2·3)로 구역을 고르고 스페이스·엔터로 병사를 보낸다(대기 병사가 없으면 위협 없는 구역의 병사를 옮긴다)
  const onKey = e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') { cursor = Math.max(0, cursor - 1); render(); e.preventDefault(); }
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') { cursor = Math.min(zones.length - 1, cursor + 1); render(); e.preventDefault(); }
    else if (/^Digit[1-9]$/.test(e.code) && +e.code.slice(5) <= zones.length) { cursor = +e.code.slice(5) - 1; render(); }
  };
  const sendToCursor = () => {
    let u = free();
    if (u < 0) { // 위협 없는 구역(병사가 가장 많은 곳)에서 한 명을 데려온다
      const from = zones.map((_, z) => z).filter(z => z !== cursor && count(z) && (!active(z) || count(z) > active(z).need)).sort((a, b) => count(b) - count(a))[0];
      if (from != null) u = unitZone.findIndex(x => x === from);
    }
    place(u, cursor);
  };
  board.addEventListener('pointerdown', onDown); addEventListener('pointermove', onMove); addEventListener('pointerup', onUp);
  board.addEventListener('click', onClick); addEventListener('keydown', onKey);
  const unbind = ctx.onAction ? ctx.onAction(sendToCursor) : () => {};
  render();

  const zoneAt = z => zoneEls[z].getBoundingClientRect();
  const popAt = (z, text, kind) => { const r = zoneAt(z), a = zones[z].anchor; popText(ctx, text, a || { x: r.left + r.width / 2, y: r.top - 30 }, kind); };
  return new Promise(resolve => {
    const finish = ok => {
      if (done) return; done = true;
      off(); unbind(); removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp); removeEventListener('keydown', onKey);
      board.remove(); tags.forEach(d => d?.remove()); hud?.setCounter(null);
      for (const th of live) if (th.h && th.state !== 'gone') { scene.end?.(th.h, 'clear'); th.state = 'gone'; }
      ctx.testHooks.board = null;
      resolve(ok);
    };
    const status = () => hud?.setCounter(practice ? `${label}` : `${label} 막은 사다리 ${blocked} · 올라온 사다리 ${breaches}/${maxBreach}`.trim());
    status();
    const off = world.onUpdate(dt => {
      if (done) return;
      t += dt; placeTags();
      let restChanged = false;
      for (let i = 0; i < units; i++) if (restUntil[i] && restUntil[i] <= t) { restUntil[i] = 0; restChanged = true; }
      if (practice) { render(); if (zones.every((_, z) => count(z) > 0)) finish(true); return; }
      let changed = restChanged;
      for (const th of live) {
        if (th.state === 'wait') { if (t >= th.at) { th.state = 'warn'; th.t = 0; th.h = scene.spawn?.(th); changed = true; } continue; }
        if (th.state === 'gone') continue;
        th.t += dt;
        if (th.state === 'push') {
          scene.update?.(th.h, 'push', Math.min(1, th.t / T.push));
          if (th.t >= T.push) {
            th.state = 'gone'; scene.end?.(th.h, 'blocked'); blocked += 1; audio?.play('correct'); popAt(th.zone, tx.blocked, 'good');
            gauge?.set(gauge.value + 0.05); changed = true; status();
          }
          continue;
        }
        // 막을 만큼 병사가 있으면 밀어낸다(밀어낸 병사는 숨을 고르러 대기 자리로 돌아온다)
        if (th.state !== 'warn' && count(th.zone) >= th.need) {
          th.state = 'push'; th.t = 0; changed = true;
          let k = th.need; for (let i = 0; i < units && k; i++) if (unitZone[i] === th.zone) { unitZone[i] = null; restUntil[i] = t + T.push + T.rest; k--; }
          scene.push?.(th.zone, T.push);
          continue;
        }
        if (th.state === 'warn') { scene.update?.(th.h, 'warn', Math.min(1, th.t / T.warn)); if (th.t >= T.warn) { th.state = 'raise'; th.t = 0; changed = true; } }
        else if (th.state === 'raise') { scene.update?.(th.h, 'raise', Math.min(1, th.t / T.raise)); if (th.t >= T.raise) { th.state = 'climb'; th.t = 0; } }
        else if (th.state === 'climb') {
          const k = Math.min(1, th.t / T.climb);
          scene.update?.(th.h, 'climb', k);
          if (k >= 1) {
            th.state = 'gone'; scene.end?.(th.h, 'breach'); breaches += 1; audio?.play('wrong'); popAt(th.zone, tx.breach, 'bad'); shake(ctx);
            gauge?.set(gauge.value - 0.1); changed = true; status();
            if (breaches >= maxBreach) return finish(false);
          }
        }
      }
      if (changed) render();
      if (live.every(th => th.state === 'gone')) finish(true);
    });
  });
}

// ── 호위: 무리에 다가가면 뒤를 따라오고, 안전선까지 데려가면 구출. 막힌 길(호위병)로 지나가면 따라오던 무리를 놓친다 ──
// field: { bounds, start:[x,z], safeZ(지킴이가 무리를 데리고 이 선을 넘으면 구출, 플레이어 출발 쪽), lostZ(무리가 이 선을 넘어가면 놓침), band:[z0,z1](길목 띠) }
// lanes: [{ x }] 길목 가운데. waves: [{ groups: [무리 번호...], blocked: [길 번호...] }]
// groups: [{ root: Object3D, start:[x,z], big? }] guards: [Object3D(길마다 하나)]
// 돌려주는 것: Promise<boolean>(시간 안에 need무리 이상). easy면 무리가 느리게 멀어지고 닿는 거리가 넓다
export function escort(ctx, { field, lanes, waves, groups, guards = [], need = 4, seconds = 120, easy = false, scene = {}, texts = {} }) {
  ensureStyle();
  const { world, hud, audio } = ctx;
  const tx = { counter: (s, n) => `구한 백성 ${s}/${n}무리`, lost: '무리를 놓쳤어요', blocked: '막힌 길이에요! 다른 길로 가요', saved: '구했다!', ...texts };
  const drift = easy ? 0.12 : 0.22, reach = easy ? 2.6 : 2.0, guardR = easy ? 1.8 : 2.4;
  const st = groups.map((g, i) => ({ g, i, state: 'idle', pos: new THREE.Vector3(g.start[0], 0, g.start[1]) }));
  for (const s of st) { s.g.root.visible = false; s.g.root.position.copy(s.pos); }
  world.bounds = field.bounds;
  const p = world.player.position;
  p.set(field.start[0], 0, field.start[1]); world.player.rotation.y = Math.PI; world.player.visible = true; world.camMode = 'follow'; world.snapCamera();
  let t = 0, saved = 0, w = -1, done = false, blocked = [];
  const [bandA, bandB] = [Math.min(...field.band), Math.max(...field.band)];
  const nextWave = () => {
    w += 1; const wave = waves[w];
    blocked = wave.blocked || [];
    guards.forEach((g, i) => { g.visible = blocked.includes(i); });
    for (const k of wave.groups) { const s = st[k]; s.state = 'walking'; s.g.root.visible = true; s.pos.set(s.g.start[0], 0, s.g.start[1]); }
    scene.wave?.(w, wave);
  };
  nextWave();
  const followers = () => st.filter(s => s.state === 'follow');
  const openLane = x => lanes.map((l, i) => ({ l, i })).filter(o => !blocked.includes(o.i)).sort((a, b) => Math.abs(a.l.x - x) - Math.abs(b.l.x - x))[0]?.l;
  // 길목 띠를 건너야 하면 열린 길 가운데를 먼저 가리킨다
  const route = target => {
    const across = (p.z > bandB && target.z < bandA) || (p.z < bandA && target.z > bandB);
    const inBand = p.z >= bandA - 0.3 && p.z <= bandB + 0.3;
    if (!across && !inBand) return target;
    const l = openLane(p.x); if (!l) return target;
    const north = target.z < p.z;
    if (inBand || Math.abs(p.x - l.x) < 1.5) return { x: l.x, z: north ? bandA - 1.5 : bandB + 1.5 }; // 길 입구에 섰으면 길을 지나 건너편으로
    return { x: l.x, z: north ? bandB + 1.0 : bandA - 1.0 };
  };
  return new Promise(resolve => {
    const finish = ok => {
      if (done) return; done = true;
      off(); hud?.setTimer(null); hud?.setCounter(null); world.setGoal(null); ctx.testHooks.walkTo = null;
      for (const g of guards) g.visible = false;
      resolve(ok);
    };
    const off = world.onUpdate(dt => {
      if (done) return;
      t += dt;
      hud?.setTimer(seconds - t); hud?.setCounter(tx.counter(saved, need));
      // 막힌 길: 호위병 가까이 가면 따라오던 무리를 놓친다(무리는 제자리에서 다시 끌려간다)
      const fl = followers();
      if (fl.length) for (const i of blocked) {
        const g = guards[i]; if (!g) continue;
        if (Math.hypot(p.x - g.position.x, p.z - g.position.z) < guardR) {
          for (const s of fl) s.state = 'walking';
          audio?.play('wrong'); popText(ctx, tx.blocked, g, 'bad'); scene.blocked?.(i);
          break;
        }
      }
      let k = 0;
      for (const s of st) {
        const gp = s.pos;
        if (s.state === 'walking') {
          gp.z -= drift * dt;
          if (Math.hypot(p.x - gp.x, p.z - gp.z) < reach) { s.state = 'follow'; audio?.play('tap'); scene.follow?.(s.i); }
          else if (gp.z < field.lostZ) { s.state = 'lost'; s.g.root.visible = false; popText(ctx, tx.lost, s.g.root, 'bad'); }
        } else if (s.state === 'follow') {
          // 플레이어 뒤로 줄지어 따라온다
          const back = new THREE.Vector3(Math.sin(world.player.rotation.y), 0, Math.cos(world.player.rotation.y)).multiplyScalar(-(1.8 + 1.5 * k++));
          const tgt = p.clone().add(back), d = tgt.sub(gp), dist = d.length();
          if (dist > 0.05) gp.addScaledVector(d.normalize(), Math.min(dist, (dist > 3 ? 6 : 3.4) * dt));
          if (p.z > field.safeZ || gp.z > field.safeZ) { s.state = 'saved'; saved += 1; audio?.play('correct'); popText(ctx, tx.saved, s.g.root, 'good'); scene.saved?.(s.i); }
        } else if (s.state === 'saved') { gp.z += 1.2 * dt; s.fade = (s.fade || 0) + dt; if (s.fade > 2) { s.state = 'home'; s.g.root.visible = false; } }
        s.g.root.position.copy(gp);
        if (s.state === 'follow' || s.state === 'walking') s.g.root.rotation.y = s.state === 'follow' ? Math.atan2(p.x - gp.x, p.z - gp.z) : Math.PI;
        scene.animate?.(s.i, s.state, dt);
      }
      // 화살표: 따라오는 무리가 있으면 안전선, 없으면 가장 가까운 끌려가는 무리(길목은 열린 길로)
      let target = null;
      if (followers().length) target = { x: p.x, z: field.safeZ + 1.2 };
      else {
        let nd = Infinity;
        for (const s of st) if (s.state === 'walking') { const d = Math.hypot(p.x - s.pos.x, p.z - s.pos.z); if (d < nd) { nd = d; target = { x: s.pos.x, z: s.pos.z }; } }
      }
      const goal = target ? route(target) : null;
      world.setGoal(goal);
      if (!waves[w].groups.some(i => ['walking', 'follow'].includes(st[i].state))) {
        if (w + 1 < waves.length) nextWave();
        else return finish(saved >= need);
      }
      if (t >= seconds) finish(saved >= need);
    });
  });
}

// ── 머리 위 말풍선: anchors[who]가 있으면 그 사람 머리 위에, 없으면 보통 대화창(아래)에 ──
export async function talk(ctx, lines, anchors = {}) {
  ensureStyle();
  const el = ctx.ui.querySelector('.dlg');
  let anchor = null;
  const off = ctx.world.onUpdate(() => {
    if (!el || !anchor || el.hidden) return;
    const s = toScreen(ctx.world, anchor, 3.3), W = innerWidth, w = el.offsetWidth || 300, h = el.offsetHeight || 80;
    let x = Math.min(W - w / 2 - 8, Math.max(w / 2 + 8, s.x)), y = Math.min(innerHeight - 8, Math.max(h + 24, s.front ? s.y : h + 24));
    // 왼쪽 위 목표 상자(.hud)를 가리지 않게: 옆으로 비킬 자리가 있으면 오른쪽으로, 없으면 아래로
    const hud = ctx.ui.querySelector('.hud:not([hidden])')?.getBoundingClientRect();
    if (hud && hud.height && x - w / 2 < hud.right + 8 && y - h - 16 < hud.bottom + 8) {
      if (hud.right + 16 + w <= W - 8) x = hud.right + 16 + w / 2;
      else y = Math.min(innerHeight - 8, hud.bottom + 8 + h + 16);
    }
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    el.style.setProperty('--tail', `${Math.min(w - 20, Math.max(20, w / 2 + s.x - x))}px`);
  });
  try {
    for (const line of lines) {
      const a = anchors[line.who];
      anchor = typeof a === 'function' ? a() : a || null;
      if (el) {
        el.classList.toggle('ops-bubble', !!anchor);
        if (!anchor) { el.style.left = ''; el.style.top = ''; }
      }
      await ctx.dialogue.say(line);
    }
  } finally {
    off(); anchor = null;
    if (el) { el.classList.remove('ops-bubble'); el.style.left = ''; el.style.top = ''; }
  }
}

// ── 장 끝: 도장 쾅 + 지혜 카드 한 장(역사 수첩에 적는다) ──
export async function finale(ctx, { stamp = '지킴', sub = '', stars = null, card = null, hold = 1600 } = {}) {
  ensureStyle();
  if (card) ctx.notebook?.record?.(card);
  const s = stars != null ? `${sub}${sub ? ' ' : ''}${'★'.repeat(stars)}${'☆'.repeat(Math.max(0, 3 - stars))}` : sub;
  let el = null;
  if (card) {
    el = document.createElement('div'); el.className = 'ops-wisdom';
    el.innerHTML = `<b>지혜 카드</b>${card.text}`;
    ctx.ui.append(el);
  }
  ctx.audio?.play('correct');
  await stampSeal(ctx.ui, { text: stamp, sub: s, hold });
  el?.remove();
}

// ── 지킴이 고르기: 옷색 셋 중 하나(건너뛰면 처음 것). 기기 안에 한 항목(key)만 새로 적는다 ──
export function savedGuardian(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } }
export function pickGuardian(ctx, { key, options, title = '나의 지킴이', text = '이 편 내내 함께할 지킴이를 골라요.' }) {
  ensureStyle();
  return new Promise(resolve => {
    let cur = savedGuardian(key, options[0].id);
    if (!options.some(o => o.id === cur)) cur = options[0].id;
    const el = document.createElement('div'); el.className = 'screen ops-pick';
    el.innerHTML = `<div class="card"><h2>${title}</h2><p>${text}</p><div class="row">${options.map(o => `<button type="button" class="opt" data-id="${o.id}"><span class="sw" style="background:${o.color}"></span>${o.name}</button>`).join('')}</div>
      <div class="btns"><button type="button" class="skip">건너뛰기</button><button type="button" class="primary">시작</button></div></div>`;
    const sync = () => el.querySelectorAll('.opt').forEach(b => b.classList.toggle('on', b.dataset.id === cur));
    el.addEventListener('click', e => {
      const o = e.target.closest('.opt');
      if (o) { cur = o.dataset.id; sync(); return; }
      const ok = e.target.closest('.primary'), skip = e.target.closest('.skip');
      if (!ok && !skip) return;
      if (ok) { try { localStorage.setItem(key, cur); } catch { /* 저장이 막힌 기기: 이번 판만 */ } }
      el.remove(); resolve(ok ? cur : savedGuardian(key, options[0].id));
    });
    sync(); ctx.ui.append(el);
  });
}

// ── 새 사람 모양(core/figures.js)으로 플레이어·말 거는 인물의 몸을 바꾼다(위치·충돌·말 걸기는 그대로) ──
function swapBody(target, look) {
  const fresh = makeFigure(look);
  for (const c of [...target.children]) if (!c.isSprite) { target.remove(c); }
  for (const c of [...fresh.children]) target.add(c);
  target.userData = { ...fresh.userData, ...(target.userData.noWalk ? { noWalk: true } : {}) };
  target.scale.copy(fresh.scale);
  return target;
}
export function usePlayerFigure(world, look) { return swapBody(world.player, look); }
export function useNpcFigure(world, id, look) { const n = world.npcs.get(id); if (n) swapBody(n.mesh, look); return n; }

// ── 합쳐 그리기: root 아래 보이는 조각을 재질별로 하나씩 합친다(팔다리 움직임 없이 통째로 움직이는 사람·무리·소품).
// 사람 하나 23조각 → 약 14조각, 함께 움직이는 무리는 사람 수와 상관없이 약 15조각. 숨긴 조각은 그대로 둔다
export function flatten(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), m4 = new THREE.Matrix4(), buckets = new Map(), gone = [];
  root.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material) || o.children.length || o.geometry.attributes.color) return;
    for (let q = o; q && q !== root; q = q.parent) if (!q.visible) return;
    const geo = o.geometry.clone();
    geo.applyMatrix4(m4.multiplyMatrices(inv, o.matrixWorld));
    const key = `${o.material.uuid}|${o.castShadow}`;
    if (!buckets.has(key)) buckets.set(key, { mat: o.material, cast: o.castShadow, geos: [] });
    buckets.get(key).geos.push(geo); gone.push(o);
  });
  for (const o of gone) o.parent.remove(o);
  for (const b of buckets.values()) {
    for (const g of b.geos) if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    const m = new THREE.Mesh(mergeGeos(b.geos), b.mat); m.castShadow = b.cast; m.receiveShadow = true; m.name = 'flat'; root.add(m);
  }
  root.userData.flat = true;
  return root;
}
function mergeGeos(geos) {
  const pos = [], nor = [], uv = [], idx = [];
  let base = 0;
  for (const g of geos) {
    if (!g.attributes.normal) g.computeVertexNormals();
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(u.getX(i), u.getY(i)); }
    if (g.index) for (let i = 0; i < g.index.count; i++) idx.push(g.index.getX(i) + base); else for (let i = 0; i < p.count; i++) idx.push(i + base);
    base += p.count; g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  return out;
}
