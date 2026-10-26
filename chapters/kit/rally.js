// 놀이 부품 「말 받아치기」(2026-10-26, 고려 1장 서희의 담판에서 처음 씀). 장 데이터만 바꿔 다른 장에서도 쓴다.
// 상대가 말풍선으로 묻고 '말 공'이 우리 쪽으로 날아온다. 아래 '대답 구슬' 가운데 알맞은 것을 쏘아 올려 받아친다.
//  - 맞는 구슬: 말 공이 되튕겨 상대에게 돌아가고, 상대 말풍선이 흔들리고(얼굴은 그대로), 게이지가 우리 쪽으로, 우리 쪽 사람이 대답(reply) 한마디
//  - 틀린 구슬: 말 공이 우리 앞에서 터지며(먼지·글자 튐, 불길 없음) 게이지가 상대 쪽으로. 돌려주는 hint로 장이 같은 판을 다시 낸다(runRounds)
//  - seconds: 말 공이 닿는 시간(없으면 중간에 멈춰 기다린다). 닿기 전에 못 고르면 틀린 것과 같다. easy면 틀린 구슬 하나가 흐려지고 시간 제한이 없다
//  - 고르는 법: 구슬을 누르기 · 위로 끌어 올리기 · 키보드 1·2·3(세 방법 다 같은 동작)
// 놀이 규칙(공 주고받기)은 게임 장치다. 글(물음·대답·힌트)은 장의 script에서만 가져오고 여기서는 사실 문장을 만들지 않는다.
// 기존 부품 상자(ops.js)는 고치지 않고 가져다 쓴다.
import * as THREE from 'three';
import { talk, popText, shake } from './ops.js';

const CSS = `
.rally-board { position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(10px + env(safe-area-inset-bottom, 0px)); z-index: 25;
  width: min(920px, calc(100% - 16px)); box-sizing: border-box; display: flex; gap: 10px; justify-content: center; align-items: stretch; pointer-events: none; }
.rally-orb { pointer-events: auto; position: relative; flex: 1 1 0; min-width: 0; max-width: 300px; min-height: 66px; margin: 0; padding: 8px 14px 8px 52px; box-sizing: border-box;
  border-radius: 34px; border: 3px solid #3b2f22; background: radial-gradient(circle at 26% 22%, #fffdf6 0, #f2ead9 38%, #dccca6 100%); color: #2b241c;
  font: 800 16px/1.3 var(--font-ui); text-align: left; box-shadow: 0 4px 0 #3b2f22, 0 8px 16px #0005; touch-action: none; cursor: grab; transition: transform .15s ease-out, opacity .2s; }
.rally-orb::before { content: ''; position: absolute; left: 18%; top: 7px; width: 34%; height: 7px; border-radius: 4px; background: #ffffffaa; pointer-events: none; }
.rally-orb .n { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center;
  background: radial-gradient(circle at 35% 30%, #74b9a7, #2f6b5e 70%); color: #fff; font: 800 18px var(--font-ui); border: 2px solid #1b3a33; pointer-events: none; }
.rally-orb .t { pointer-events: none; }
.rally-orb:hover:not(.off) { transform: translateY(-3px); }
.rally-orb.off { opacity: .32; filter: grayscale(1); cursor: not-allowed; box-shadow: none; }
.rally-orb.dragging { transition: none; z-index: 2; cursor: grabbing; }
.rally-orb.fired { opacity: .25; }
.rally-board.busy .rally-orb { pointer-events: none; }
@media (max-width: 620px) and (orientation: portrait) {
  .rally-board { flex-direction: column; align-items: stretch; width: calc(100% - 24px); gap: 8px; }
  .rally-orb { flex: none; max-width: none; min-height: 56px; }
}
.rally-say { position: fixed; z-index: 24; left: 50%; top: 40%; transform: translate(-50%, -100%); width: min(400px, calc(100% - 24px)); box-sizing: border-box;
  background: var(--hanji, #f2ead9); border: 2px solid #3b2f22; border-radius: 16px; padding: 7px 14px 9px; font: 600 17px/1.45 var(--font-ui); color: #2b241c;
  box-shadow: 0 6px 14px #0006; pointer-events: none; }
.rally-say b { display: block; font: 800 14px var(--font-ui); color: #7a2a1e; }
.rally-say::after { content: ''; position: absolute; left: var(--tail, 50%); bottom: -13px; margin-left: -11px; border: 11px solid transparent; border-bottom: 0; border-top-color: #3b2f22; }
/* 낮은 가로 화면(목표 상자·게이지·구슬이 위아래로 꽉 차는 태블릿 가로): 말풍선을 납작하게 해 게이지와 구슬 사이에 들어가게 */
@media (max-height: 430px) {
  .rally-say { font-size: 14px; line-height: 1.3; padding: 5px 12px 7px; width: min(360px, calc(100% - 24px)); }
  .rally-say b { display: none; }
}
.rally-say.shake { animation: rally-shake .5s ease-in-out; }
@keyframes rally-shake { 0%,100% { margin-left: 0; } 20% { margin-left: -9px; } 40% { margin-left: 8px; } 60% { margin-left: -5px; } 80% { margin-left: 3px; } }
.rally-ball { position: fixed; z-index: 26; left: 0; top: 0; width: 50px; height: 50px; margin: -25px 0 0 -25px; border-radius: 50%; box-sizing: border-box;
  background: radial-gradient(circle at 34% 28%, #ffe7cc 0, #d08a55 48%, #7a3b2e 100%); border: 3px solid #3b2f22; display: grid; place-items: center;
  font: 800 22px var(--font-display); color: #fff; text-shadow: 0 1px 2px #000; pointer-events: none; box-shadow: 0 4px 10px #0006; }
.rally-ball.back { transition: left .5s ease-in, top .5s ease-in, transform .5s ease-in, opacity .5s ease-in; transform: scale(.55); opacity: 0; }
.rally-shot { position: fixed; z-index: 27; width: 40px; height: 40px; margin: -20px 0 0 -20px; border-radius: 50%; box-sizing: border-box; pointer-events: none;
  background: radial-gradient(circle at 35% 30%, #fffdf6, #d9a441 70%); border: 3px solid #3b2f22; box-shadow: 0 0 14px #ffe9a8; transition: left .3s ease-out, top .3s ease-out; }
.rally-burst { position: fixed; z-index: 27; left: 0; top: 0; pointer-events: none; }
.rally-burst i { position: absolute; left: -12px; top: -12px; width: 24px; height: 24px; border-radius: 50%; background: #cfc6b4; opacity: .9; animation: rally-fly .75s ease-out forwards; }
.rally-burst span { position: absolute; left: -10px; top: -14px; font: 800 22px var(--font-display); color: #fff3df; text-shadow: 0 1px 2px #000; animation: rally-fly .75s ease-out forwards; }
@keyframes rally-fly { to { transform: translate(var(--dx), var(--dy)) rotate(var(--r, 0deg)) scale(.4); opacity: 0; } }
`;
function ensureStyle() {
  if (document.getElementById('kit-rally-style')) return;
  const s = document.createElement('style'); s.id = 'kit-rally-style'; s.textContent = CSS; document.head.appendChild(s);
}

const v3 = new THREE.Vector3();
// 화면 위 자리: 3D 물건이면 카메라로 비추고, { x, y }(화면 비율)면 그대로, 없으면 기본 자리
function screenAt(world, a, dy, fallback) {
  if (a && a.isObject3D && world?.camera) {
    a.getWorldPosition(v3); v3.y += dy;
    world.camera.updateMatrixWorld(); v3.project(world.camera);
    if (v3.z < 1) return { x: (v3.x + 1) / 2 * innerWidth, y: (1 - v3.y) / 2 * innerHeight };
  }
  const f = a && !a.isObject3D && Number.isFinite(a.x) ? a : fallback;
  return { x: f.x * innerWidth, y: f.y * innerHeight };
}
const rectOf = (root, sel) => { const e = root.querySelector(sel); if (!e || e.hidden) return null; const r = e.getBoundingClientRect(); return r.width ? r : null; };
const hits = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

const HOLD = 0.55;       // 시간 제한이 없을 때 말 공이 멈춰 기다리는 곳(가는 길의 몫)
const HOLD_SEC = 3;      // 그곳까지 가는 시간
const SHOT_MS = 320;     // 구슬이 말 공까지 날아가는 시간

// prompt: 상대의 말(대사 한 줄), options: [{ text, correct, reply?, hint? }](글자 그대로, 순서는 섞는다)
// speakerAnchor·targetAnchor: 묻는 사람·받아치는 사람(3D 물건이나 화면 비율 { x, y }). gauge: opsGauge(맞으면 +0.25, 틀리면 −0.1)
// scene: { answer(ok) } 3D 연출(장이 준다). speaker: 말풍선 위 이름. timeoutHint: 시간이 다 됐을 때 돌려줄 안내(게임 규칙 안내)
// 돌려주는 것: Promise<{ ok, timeout, hint, pick }> — runRounds에 ok를 넘기고, hint는 장이 다시 하기 안내로 쓴다
export function rally(ctx, { prompt, options, speakerAnchor = null, targetAnchor = null, gauge = null, easy = false, seconds = null, scene = {}, speaker = '', timeoutHint = '말 공이 닿기 전에 대답 구슬을 골라 봐요.' }) {
  ensureStyle();
  const { ui, world } = ctx;
  return new Promise(resolve => {
    const order = shuffle(options.map((_, i) => i));
    let off = -1;
    if (easy) { const wrong = order.filter(i => !options[i].correct); off = wrong[Math.floor(Math.random() * wrong.length)] ?? -1; }
    const limit = easy ? null : seconds;

    const say = document.createElement('div'); say.className = 'rally-say';
    const nm = document.createElement('b'); nm.textContent = speaker; if (!speaker) nm.hidden = true;
    const tx = document.createElement('span'); tx.textContent = prompt.text;
    say.append(nm, tx);
    const ball = document.createElement('div'); ball.className = 'rally-ball'; ball.textContent = '말';
    const board = document.createElement('div'); board.className = 'rally-board';
    const btns = order.map((i, k) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'rally-orb';
      b.dataset.i = String(i); b.dataset.text = options[i].text;
      const n = document.createElement('span'); n.className = 'n'; n.textContent = String(k + 1);
      const t = document.createElement('span'); t.className = 't'; t.textContent = options[i].text;
      b.append(n, t);
      if (i === off) { b.disabled = true; b.classList.add('off'); }
      board.append(b);
      return b;
    });
    ui.append(say, ball, board);
    if (ctx.testHooks) ctx.testHooks.rally = { answer: options.find(o => o.correct)?.text, easy, off: off >= 0 ? options[off].text : null };

    let t = 0, busy = false, finished = false, ballXY = { x: 0, y: 0 }, ballFree = false;
    // 말풍선은 묻는 사람 머리 위, 말 공은 두 사람 가슴 높이로 오간다(얼굴과 말풍선 글을 가리지 않게)
    const head = () => screenAt(world, speakerAnchor, 3.3, { x: 0.66, y: 0.36 });
    const from = () => screenAt(world, speakerAnchor, 1.4, { x: 0.66, y: 0.55 }), to = () => screenAt(world, targetAnchor, 1.4, { x: 0.34, y: 0.58 });
    // 말풍선: 묻는 사람 머리 위. 위 가운데 게이지·왼쪽 위 목표 상자·아래 구슬과 겹치지 않게 비킨다
    const placeSay = () => {
      const W = innerWidth, H = innerHeight, w = say.offsetWidth || 300, h = say.offsetHeight || 70;
      const s = head();
      let x = Math.min(W - w / 2 - 8, Math.max(w / 2 + 8, s.x)), y = Math.max(h + 8, s.y - 8); // y는 말풍선 아래 끝
      // 위 가운데 게이지·왼쪽 위 목표 상자와 가로로 겹치면 그 가운데 가장 아래 끝보다 더 아래로 내린다(한 번에)
      const avoid = [rectOf(ui, '.ops-gauge'), rectOf(ui, '.hud:not([hidden])')].filter(Boolean);
      const wide = { left: x - w / 2, right: x + w / 2 };
      let floor = 0;
      for (const a of avoid) if (wide.left < a.right && a.left < wide.right) floor = Math.max(floor, a.bottom + 6 + h + 14);
      if (floor > y) y = floor;
      const orb = board.getBoundingClientRect();
      if (orb.height && y > orb.top - 6) y = orb.top - 6;
      say.style.left = `${x}px`; say.style.top = `${y}px`;
      say.style.setProperty('--tail', `${Math.min(w - 20, Math.max(20, w / 2 + s.x - x))}px`);
    };
    const placeBall = () => {
      if (ballFree) return;
      const a = from(), b = to();
      const k = limit ? Math.min(1, t / limit) : HOLD * Math.min(1, t / HOLD_SEC);
      const bob = limit ? 0 : Math.sin(t * 4) * 4 * Math.min(1, t / HOLD_SEC);
      ballXY = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k - Math.sin(k * Math.PI) * 40 + bob };
      ball.style.left = `${ballXY.x}px`; ball.style.top = `${ballXY.y}px`;
      ball.style.transform = `rotate(${t * -120}deg)`;
    };
    const off1 = world.onUpdate(dt => {
      if (finished) return;
      if (!busy) t += dt;
      placeSay(); placeBall();
      if (limit && t >= limit && !busy) miss(-1, true);
    });
    placeSay(); placeBall();

    // 고르기: 누르기·끌어 올리기·키보드
    const fire = i => {
      if (busy || finished || i === off || !options[i]) return;
      if (ctx.dialogue?.isOpen?.()) return;
      busy = true; board.classList.add('busy');
      const b = btns.find(x => +x.dataset.i === i), r = b.getBoundingClientRect();
      b.classList.add('fired'); b.style.transform = '';
      ctx.audio?.play('tap');
      const shot = document.createElement('div'); shot.className = 'rally-shot';
      shot.style.left = `${r.left + r.width / 2}px`; shot.style.top = `${r.top + r.height / 2}px`;
      ui.append(shot);
      void shot.offsetWidth;
      shot.style.left = `${ballXY.x}px`; shot.style.top = `${ballXY.y}px`;
      setTimeout(() => { shot.remove(); if (options[i].correct) hit(i); else miss(i, false); }, SHOT_MS);
    };
    let drag = null, suppress = false;
    const onDown = e => {
      const b = e.target.closest('.rally-orb'); if (!b || b.disabled || busy) return;
      drag = { b, id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 };
    };
    const onMove = e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
      if (drag.moved > 8) { drag.b.classList.add('dragging'); drag.b.style.transform = `translate(${dx * 0.3}px, ${Math.min(0, dy)}px)`; }
    };
    const onUp = e => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag; drag = null;
      d.b.classList.remove('dragging'); d.b.style.transform = '';
      if (d.moved <= 8) return; // 그냥 누르기: click이 맡는다
      suppress = true; setTimeout(() => { suppress = false; }, 0);
      if (e.clientY - d.y < -40) fire(+d.b.dataset.i);
    };
    const onClick = e => {
      const b = e.target.closest('.rally-orb'); if (!b) return;
      if (suppress) { suppress = false; return; }
      fire(+b.dataset.i);
    };
    const onKey = e => {
      const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code || ''); if (!m) return;
      const b = btns[+m[1] - 1]; if (b) fire(+b.dataset.i);
    };
    board.addEventListener('pointerdown', onDown);
    board.addEventListener('click', onClick);
    addEventListener('pointermove', onMove); addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);
    addEventListener('keydown', onKey);

    const cleanup = () => {
      finished = true; off1();
      board.removeEventListener('pointerdown', onDown); board.removeEventListener('click', onClick);
      removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp);
      removeEventListener('keydown', onKey);
      say.remove(); ball.remove(); board.remove();
      if (ctx.testHooks) delete ctx.testHooks.rally;
    };
    // 맞음: 말 공이 상대에게 되튕겨 가고, 상대 말풍선이 흔들린다. 게이지가 우리 쪽으로, 대답 한마디
    async function hit(i) {
      ballFree = true;
      const a = from();
      ball.classList.add('back'); ball.style.left = `${a.x}px`; ball.style.top = `${a.y}px`;
      say.classList.add('shake');
      gauge?.set(gauge.value + 0.25);
      popText(ctx, '받아쳤다!', ballXY, 'good');
      ctx.audio?.play('correct');
      scene.answer?.(true);
      await new Promise(r => setTimeout(r, 650));
      cleanup();
      const reply = options[i].reply;
      if (reply) { await talk(ctx, [reply], targetAnchor && targetAnchor.isObject3D ? { [reply.who]: targetAnchor } : {}); ctx.dialogue.close(); }
      resolve({ ok: true, timeout: false, hint: null, pick: i });
    }
    // 틀림·시간 다 됨: 말 공이 우리 앞에서 터진다(먼지·글자 튐). 게이지가 상대 쪽으로
    function miss(i, timeout) {
      busy = true; board.classList.add('busy'); ballFree = true;
      const at = timeout ? to() : ballXY;
      ball.remove();
      const burst = document.createElement('div'); burst.className = 'rally-burst';
      burst.style.left = `${at.x}px`; burst.style.top = `${at.y}px`;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + 0.3, d = 50 + (k % 3) * 18;
        const p = document.createElement(k % 2 ? 'i' : 'span');
        if (k % 2 === 0) p.textContent = '말';
        p.style.setProperty('--dx', `${Math.cos(a) * d}px`); p.style.setProperty('--dy', `${Math.sin(a) * d}px`); p.style.setProperty('--r', `${(k - 4) * 25}deg`);
        burst.append(p);
      }
      ui.append(burst); setTimeout(() => burst.remove(), 800);
      gauge?.set(gauge.value - 0.1);
      popText(ctx, timeout ? '늦었어요!' : '앗!', at, 'bad');
      ctx.audio?.play('wrong'); shake(ctx);
      scene.answer?.(false);
      setTimeout(() => { cleanup(); resolve({ ok: false, timeout, hint: timeout ? timeoutHint : options[i].hint || timeoutHint, pick: timeout ? null : i }); }, 700);
    }
  });
}
