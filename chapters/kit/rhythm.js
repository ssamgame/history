// 놀이 부품 「노 젓기 박자」(2026-10-26, 고려 새 6장 삼별초 바닷길에서 처음 씀). 장 데이터만 바꿔 다른 장에서도 쓴다.
// 화면 아래 왼 노 · 오른 노 단추. 박자(beatSeconds)마다 그 박자 쪽 단추 위 고리가 줄어들어 단추 테두리에 닿는 순간이 박자다(왼 → 오른 → 왼…).
// 박자 ±windowSec 안에 알맞은 쪽을 누르면 배가 한 번 크게 나아가고, 반대쪽을 누르면 조금만 나아가며 배가 옆으로 돈다(실패 아님).
// 박자를 놓쳐도 배는 멈추지 않고 느려질 뿐이다. strokes번 만큼 나아가면 도착(성공), seconds 안에 못 가면 실패({ ok: false, why: 'time' }).
// easy면 장이 박자·창·시간을 넓혀 준다(값은 장이 정한다). 키보드 ← → 또는 A D.
// 3D 연출은 장이 넘겨 준 scene({ progress(0~1), stroke(side, good) })가 맡는다. 글은 장이 준다.
const CSS = `
.row-btn { position: fixed; z-index: 25; bottom: calc(14px + env(safe-area-inset-bottom, 0px)); width: 132px; height: 92px; border-radius: 22px; border: 3px solid var(--hanji, #f2ead9);
  background: radial-gradient(circle at 35% 30%, #4f7f9c, #24465c 72%); color: #fff6c8; font: 800 20px var(--font-ui); box-shadow: 0 6px 0 #14283a, 0 10px 18px #0006;
  touch-action: manipulation; user-select: none; -webkit-user-select: none; cursor: pointer; }
.row-btn.l { left: calc(50% - 150px); } .row-btn.r { left: calc(50% + 18px); }
.row-btn.hit { background: radial-gradient(circle at 35% 30%, #8cc4e0, #3b7396 72%); }
.row-btn .ring { position: absolute; inset: -6px; border-radius: 26px; border: 4px solid #f2c14a; pointer-events: none; opacity: 0; transform-origin: 50% 50%; }
.row-btn .ring.on { opacity: 1; }
.row-btn.easy .ring.on { border-width: 6px; }
.row-pop { position: fixed; z-index: 26; left: 50%; transform: translateX(-50%); bottom: calc(118px + env(safe-area-inset-bottom, 0px)); padding: 4px 12px; border-radius: 10px;
  background: rgba(27,31,29,.85); color: #fff6c8; font: 800 16px var(--font-ui); pointer-events: none; white-space: nowrap; }
.row-pop[hidden] { display: none; }
@media (max-height: 430px) { .row-btn { height: 70px; width: 116px; font-size: 17px; } .row-btn.l { left: calc(50% - 130px); } .row-pop { bottom: 92px; } }
`;
function ensureStyle() {
  if (document.getElementById('kit-rhythm-style')) return;
  const s = document.createElement('style'); s.id = 'kit-rhythm-style'; s.textContent = CSS; document.head.appendChild(s);
}
export const SIDES = ['left', 'right'];

export function rhythm(ctx, { beatSeconds = 1, windowSec = 0.25, strokes = 12, seconds = 30, easy = false, scene = {}, texts = {}, lead = 1.2 } = {}) {
  ensureStyle();
  const { ui, world, hud } = ctx;
  return new Promise(resolve => {
    const mk = (side, label) => { const b = document.createElement('button'); b.type = 'button'; b.className = `row-btn ${side[0]}${easy ? ' easy' : ''}`; b.dataset.side = side; b.innerHTML = '<span class="ring"></span><span class="t"></span>'; b.querySelector('.t').textContent = label; b.addEventListener('pointerdown', e => { e.preventDefault?.(); press(side); }); b.addEventListener('click', e => { if (e.detail === 0) press(side); }); return b; };
    const L = mk('left', texts.left || '왼 노'), R = mk('right', texts.right || '오른 노');
    const pop = document.createElement('div'); pop.className = 'row-pop'; pop.hidden = true;
    ui.append(L, R, pop);
    let t = 0, made = 0, used = new Set(), done = false, popT = 0;
    const beatAt = k => lead + k * beatSeconds, sideOf = k => SIDES[k % 2];
    const nearest = () => Math.max(0, Math.round((t - lead) / beatSeconds));
    const say = text => { pop.textContent = text || ''; pop.hidden = !text; popT = text ? 0.7 : 0; };
    const hooks = () => {
      if (!ctx.testHooks) return;
      let k = nearest(); if (used.has(k) || beatAt(k) < t - windowSec) k += 1;
      ctx.testHooks.rhythm = done ? null : { side: sideOf(k), dt: beatAt(k) - t, window: windowSec, made, strokes };
    };
    const finish = (ok, why) => {
      if (done) return; done = true;
      off(); removeEventListener('keydown', onKey);
      L.remove(); R.remove(); pop.remove(); hud?.setTimer?.(null); hud?.setCounter?.(null);
      if (ctx.testHooks) ctx.testHooks.rhythm = null;
      resolve({ ok, why, made, time: t });
    };
    function press(side) {
      if (done) return;
      const k = nearest(), off2 = Math.abs(t - beatAt(k)), btn = side === 'left' ? L : R;
      btn.classList.add('hit'); setTimeout(() => btn.classList.remove('hit'), 120);
      if (off2 > windowSec || used.has(k) || t < lead - windowSec) { say(texts.wait || '박자를 기다려요'); return; }
      used.add(k);
      const good = side === sideOf(k);
      made += good ? 1 : 0.5;
      ctx.audio?.play(good ? 'tap' : 'wrong');
      say(good ? (texts.good || '좋아요!') : (texts.same || '번갈아 저어요'));
      scene.stroke?.(side, good);
      scene.progress?.(Math.min(1, made / strokes));
      hud?.setCounter?.(`${texts.counter || '노 젓기'} ${Math.floor(made)} / ${strokes}`);
      if (made >= strokes) finish(true, 'arrive');
      else hooks();
    }
    const onKey = e => { if (e.repeat) return; if (e.code === 'ArrowLeft' || e.code === 'KeyA') press('left'); else if (e.code === 'ArrowRight' || e.code === 'KeyD') press('right'); };
    addEventListener('keydown', onKey);
    scene.progress?.(0);
    hud?.setCounter?.(`${texts.counter || '노 젓기'} 0 / ${strokes}`);
    const off = world.onUpdate(dt => {
      if (done) return;
      t += dt;
      if (popT > 0) { popT -= dt; if (popT <= 0) pop.hidden = true; }
      hud?.setTimer?.(Math.max(0, seconds - t));
      // 다가오는 박자 쪽 단추 위 고리가 줄어든다
      let k = nearest(); if (used.has(k) || beatAt(k) < t - windowSec) k += 1;
      const rem = beatAt(k) - t, side = sideOf(k);
      for (const [b, s] of [[L, 'left'], [R, 'right']]) {
        const ring = b.querySelector('.ring'), on = s === side && rem < beatSeconds;
        ring.classList.toggle('on', on);
        if (on) ring.style.transform = `scale(${(1 + Math.max(0, rem) / beatSeconds * 0.9).toFixed(3)})`;
      }
      if (t >= seconds) return finish(false, 'time');
      hooks();
    });
    hooks();
  });
}
