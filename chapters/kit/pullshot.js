// 놀이 부품 「당겨 쏘기」(2026-10-26, 고려 새 5장 처인성에서 처음 씀). 장 데이터만 바꿔 다른 장에서도 쓴다.
// 성벽 위 활(bow)에서 들판으로 화살을 쏜다. 적은 몇 갈래(lanes: 성 가운데에서 본 각도)에서 성으로 걸어 온다.
// 아래 활 단추를 눌러 뒤로 끌면 조준선이 나타나고(끈 방향의 반대쪽으로 날아간다), 끈 길이가 힘. 손을 놓으면 쏜다.
// 키보드: ← → 조준, 스페이스를 누르고 있으면 당겨지고 떼면 쏜다. 당기는 데 최소 minPull초(그보다 짧으면 쏘지 않는다).
// 맞음: 힘이 minPower 이상이면 화살은 들판 끝(range)까지 날아가고, 조준선 옆 radius 안에 있는 가장 가까운 적이 맞는다.
// 힘이 모자라면 화살이 앞에 떨어진다(texts.weak). 맞은 적은 방패에 맞아 주춤하고 뒤로 물러난다(쓰러지지 않는다).
// 적 breachMax명이 성벽에 닿으면 실패({ ok: false, why: 'breach' }), 모두 막으면 성공.
// easy: 맞음 반경 easyRadius, 필요한 힘 easyPower, 적 속도 0.8배, 조준선이 가까운 적 쪽으로 약하게 끌린다.
// 3D: field({ center:[x,z], wallR, spawnR, bow:[x,y,z] }), enemies(적 묶음 Object3D 배열, 돌려 쓴다), arrows(화살 Object3D 배열). 글은 장이 준다.
import * as THREE from 'three';

const CSS = `
.pull-pad { position: fixed; z-index: 25; left: 50%; transform: translateX(-50%); bottom: calc(12px + env(safe-area-inset-bottom, 0px)); width: 112px; height: 112px;
  border-radius: 50%; border: 3px solid var(--hanji, #f2ead9); background: radial-gradient(circle at 35% 30%, #8a6a44, #4e3620 72%); box-shadow: 0 6px 0 #2b1d10, 0 10px 18px #0006;
  touch-action: none; user-select: none; -webkit-user-select: none; cursor: grab; display: flex; align-items: center; justify-content: center; flex-direction: column; color: #fff6c8; font: 800 14px var(--font-ui); }
.pull-pad svg { width: 62px; height: 62px; }
.pull-pad.down { cursor: grabbing; box-shadow: 0 0 0 4px var(--gold, #d9a441), 0 10px 18px #0006; }
.pull-power { position: fixed; z-index: 25; left: calc(50% + 70px); bottom: calc(18px + env(safe-area-inset-bottom, 0px)); width: 22px; height: 100px; border-radius: 11px;
  background: #2b241c; border: 2px solid var(--hanji, #f2ead9); overflow: hidden; pointer-events: none; }
.pull-power .fill { position: absolute; left: 0; right: 0; bottom: 0; height: 0; background: linear-gradient(#f2c14a, #b8452f); }
.pull-power .need { position: absolute; left: 0; right: 0; height: 0; border-top: 3px dashed #fff6c8; }
.pull-power.ok .fill { background: linear-gradient(#ffe27a, #d9a441); }
.pull-hint { position: fixed; z-index: 26; left: 50%; transform: translateX(-50%); bottom: calc(136px + env(safe-area-inset-bottom, 0px)); padding: 6px 14px; border-radius: 12px;
  background: rgba(27,31,29,.88); color: #fff6c8; font: 700 16px var(--font-ui); white-space: nowrap; pointer-events: none; }
.pull-hint[hidden] { display: none; }
@media (max-height: 430px) { .pull-pad { width: 88px; height: 88px; font-size: 12px; } .pull-pad svg { width: 46px; height: 46px; } .pull-power { height: 78px; left: calc(50% + 58px); } .pull-hint { bottom: 108px; font-size: 14px; } }
`;
function ensureStyle() {
  if (document.getElementById('kit-pullshot-style')) return;
  const s = document.createElement('style'); s.id = 'kit-pullshot-style'; s.textContent = CSS; document.head.appendChild(s);
}
const BOW_SVG = '<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M10 14 C30 2 50 14 50 14" fill="none" stroke="#fff6c8" stroke-width="5" stroke-linecap="round"/><path class="str" d="M10 14 L30 30 L50 14" fill="none" stroke="#f2ead9" stroke-width="2"/><path d="M30 30 V54" stroke="#fff6c8" stroke-width="3"/><path d="M30 8 L25 17 H35 Z" fill="#fff6c8"/></svg>';

export const PULL = { minPull: 0.5, fly: 0.8, range: 36, radius: 2.0, easyRadius: 3.0, minPower: 0.6, easyPower: 0.4, maxAim: 1.1, pullPx: 130 };

// wave: { lanes: [lane 번호...], count, speed(m/s), gap(초) } — 적 i는 1 + i×gap초에 lanes[i % 길이] 갈래에서 나온다
export function pullshot(ctx, { field, lanes, wave, enemies, arrows = [], easy = false, gauge = null, breachMax = 3, texts = {}, onHit = null } = {}) {
  ensureStyle();
  const { ui, world, hud } = ctx;
  const radius = easy ? PULL.easyRadius : PULL.radius, need = easy ? PULL.easyPower : PULL.minPower, speed = wave.speed * (easy ? 0.8 : 1);
  const [cx, cz] = field.center, [bx, by, bz] = field.bow;
  return new Promise(resolve => {
    const pad = document.createElement('button'); pad.type = 'button'; pad.className = 'pull-pad'; pad.innerHTML = `${BOW_SVG}<span>${texts.label || '끌어서 당기기'}</span>`;
    const bar = document.createElement('div'); bar.className = 'pull-power'; bar.innerHTML = `<div class="fill"></div><div class="need" style="bottom:${need * 100}%"></div>`;
    const hint = document.createElement('div'); hint.className = 'pull-hint'; hint.hidden = true;
    ui.append(pad, bar, hint);
    const fill = bar.querySelector('.fill');
    // 조준선: 활에서 땅 위로 뻗는 띠
    const aimMat = new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.75, depthWrite: false });
    const aimLine = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1).translate(0, 0.5, 0).rotateX(-Math.PI / 2), aimMat);
    aimLine.visible = false; world.level.add(aimLine);

    const foes = []; // { obj, lane, r, state: walk|hit|back|gone, t }
    let t = 0, spawned = 0, hits = 0, breaches = 0, done = false;
    let aim = 0, power = 0, pulling = null, pullT = 0, keyAim = 0, hintT = 0;
    const flights = [];
    const pos = f => ({ x: cx + Math.cos(lanes[f.lane]) * f.r, z: cz + Math.sin(lanes[f.lane]) * f.r });
    const aimAt = f => { const p = pos(f); return Math.atan2(p.x - bx, -(p.z - bz)); }; // 0 = 북쪽(-z), +는 오른쪽(+x)
    const walking = () => foes.filter(f => f.state === 'walk' && !f.marked);
    const front = () => walking().sort((a, b) => a.r - b.r)[0];
    const setHint = text => { hint.textContent = text || ''; hint.hidden = !text; hintT = text ? 1.8 : 0; };
    const counter = () => hud?.setCounter?.(`${texts.counter || '물러난 적'} ${hits} · ${texts.breach || '성벽에 닿은 적'} ${breaches}/${breachMax}`);
    const hooks = () => {
      if (!ctx.testHooks) return;
      const f = front();
      ctx.testHooks.pullshot = done ? null : { ready: !!f && !pulling, pulling: !!pulling, held: pullT, aim: f ? aimAt(f) : 0, need, minPull: PULL.minPull, easy };
    };
    const showAim = () => {
      if (!pulling) { aimLine.visible = false; fill.style.height = '0'; bar.classList.remove('ok'); return; }
      const len = Math.max(1, power >= need ? PULL.range : power * PULL.range);
      aimLine.visible = true; aimLine.position.set(bx, 0.15, bz); aimLine.rotation.y = -aim; aimLine.scale.set(1, 1, len);
      aimMat.color.set(power >= need ? 0xffe27a : 0x9a9a9a);
      fill.style.height = `${Math.round(power * 100)}%`; bar.classList.toggle('ok', power >= need);
    };
    // 쉬운 모드: 조준이 가까운 적 쪽으로 약하게 끌린다
    const assist = a => { if (!easy) return a; const f = walking().map(aimAt).sort((p, q) => Math.abs(p - a) - Math.abs(q - a))[0]; return f != null && Math.abs(f - a) < 0.4 ? a + (f - a) * 0.6 : a; };
    const release = () => {
      if (!pulling) return;
      const held = pullT; pulling = null; pad.classList.remove('down');
      const a = assist(aim), p = power;
      power = 0; pullT = 0; showAim();
      if (held < PULL.minPull) { hooks(); return; }
      ctx.audio?.play('whoosh');
      const dx = Math.sin(a), dz = -Math.cos(a), reach = p >= need ? PULL.range : p * PULL.range; // 점선을 넘게 당기면 들판 끝까지 간다
      let target = null, best = Infinity;
      if (p >= need) for (const f of walking()) {
        const q = pos(f), ex = q.x - bx, ez = q.z - bz, along = ex * dx + ez * dz, side = Math.abs(ex * dz - ez * dx);
        if (along > 0 && along <= reach + radius && side <= radius && along < best) { best = along; target = f; }
      }
      const land = target ? pos(target) : { x: bx + dx * reach, z: bz + dz * reach };
      const arrow = arrows.find(o => !o.visible) || arrows[0];
      if (arrow) arrow.visible = true;
      if (target) target.marked = true;
      flights.push({ t: 0, arrow, from: new THREE.Vector3(bx, by + 1.6, bz), to: new THREE.Vector3(land.x, 1.6, land.z), target });
      if (!target) setHint(p < need ? texts.weak || '더 끌어당겨요' : texts.miss || '');
      hooks();
    };
    const finish = (ok, why) => {
      if (done) return; done = true;
      off(); removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp);
      removeEventListener('keydown', onKey); removeEventListener('keyup', onKeyUp);
      pad.remove(); bar.remove(); hint.remove(); world.level.remove(aimLine); aimLine.geometry.dispose(); aimMat.dispose();
      for (const o of enemies) { o.visible = false; o.rotation.x = 0; }
      for (const o of arrows) o.visible = false;
      hud?.setCounter?.(null);
      if (ctx.testHooks) ctx.testHooks.pullshot = null;
      resolve({ ok, why, hits, breaches });
    };
    // 끌기: 활 단추를 누르고 끈다
    pad.addEventListener('pointerdown', e => { if (done || pulling) return; e.preventDefault?.(); const r = pad.getBoundingClientRect(); pulling = { id: e.pointerId, x: r.left + r.width / 2, y: r.top + r.height / 2 }; pullT = 0; power = 0; pad.classList.add('down'); ctx.audio?.play('tap'); hooks(); });
    const onMove = e => {
      if (!pulling || pulling.id !== e.pointerId) return;
      const dx = e.clientX - pulling.x, dy = e.clientY - pulling.y;
      power = Math.min(1, Math.hypot(dx, dy) / PULL.pullPx);
      aim = Math.max(-PULL.maxAim, Math.min(PULL.maxAim, Math.atan2(-dx, Math.max(dy, 1))));
      showAim();
    };
    const onUp = e => { if (pulling && pulling.id === e.pointerId) release(); };
    addEventListener('pointermove', onMove); addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);
    const onKey = e => {
      if (e.code === 'ArrowLeft') keyAim = -1; else if (e.code === 'ArrowRight') keyAim = 1;
      else if (e.code === 'Space' && !e.repeat && !pulling && !done) { e.preventDefault?.(); pulling = { id: 'key' }; pullT = 0; power = 0; pad.classList.add('down'); hooks(); }
    };
    const onKeyUp = e => {
      if ((e.code === 'ArrowLeft' && keyAim < 0) || (e.code === 'ArrowRight' && keyAim > 0)) keyAim = 0;
      if (e.code === 'Space' && pulling?.id === 'key') release();
    };
    addEventListener('keydown', onKey); addEventListener('keyup', onKeyUp);

    for (const o of enemies) o.visible = false;
    counter(); hooks();
    const tmp = new THREE.Vector3(), ahead = new THREE.Vector3();
    const off = world.onUpdate(dt => {
      if (done) return;
      t += dt;
      if (keyAim) { aim = Math.max(-PULL.maxAim, Math.min(PULL.maxAim, aim + keyAim * 1.2 * dt)); if (!pulling) { aimLine.visible = true; aimLine.position.set(bx, 0.15, bz); aimLine.rotation.y = -aim; aimLine.scale.set(1, 1, 8); aimMat.color.set(0x9a9a9a); } }
      if (pulling) { pullT += dt; if (pulling.id === 'key') power = Math.min(1, pullT / 1.0); showAim(); }
      if (hintT > 0) { hintT -= dt; if (hintT <= 0) hint.hidden = true; }
      // 새 적
      while (spawned < wave.count && t >= 1 + spawned * wave.gap) {
        const obj = enemies.find(o => !o.visible && !foes.some(f => f.obj === o && f.state !== 'gone'));
        if (!obj) break;
        const f = { obj, lane: wave.lanes[spawned % wave.lanes.length], r: field.spawnR, state: 'walk', t: 0 };
        obj.visible = true; obj.rotation.x = 0; foes.push(f); spawned += 1;
      }
      for (const f of foes) {
        const o = f.obj, a = lanes[f.lane];
        if (f.state === 'walk') {
          f.r -= speed * dt;
          if (f.r <= field.wallR + 1) {
            f.state = 'gone'; o.visible = false; breaches += 1; ctx.audio?.play('wrong'); counter();
            gauge?.set(Math.max(0, gauge.value - 0.15));
            if (breaches >= breachMax) return finish(false, 'breach');
          }
          o.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)); // 성 쪽을 본다
        } else if (f.state === 'hit') {
          f.t += dt; o.rotation.x = -0.35 * Math.sin(Math.min(1, f.t / 0.4) * Math.PI); // 방패에 맞아 주춤
          if (f.t >= 0.5) { f.state = 'back'; f.t = 0; }
        } else if (f.state === 'back') {
          f.t += dt; f.r += 4 * dt; o.rotation.y = Math.atan2(Math.cos(a), Math.sin(a)); // 돌아서 물러난다
          if (f.t >= 1.6) { f.state = 'gone'; o.visible = false; }
        }
        if (f.state !== 'gone') { const p = pos(f); o.position.set(p.x, 0, p.z); }
      }
      // 날아가는 화살
      for (let i = flights.length - 1; i >= 0; i--) {
        const h = flights[i];
        h.t += dt;
        if (h.target && h.target.state === 'walk') { const p = pos(h.target); h.to.set(p.x, 1.6, p.z); }
        const k = Math.min(1, h.t / PULL.fly), arc = Math.sin(Math.PI * k) * 3;
        if (h.arrow) {
          tmp.lerpVectors(h.from, h.to, k); tmp.y += arc;
          const k2 = Math.min(1, k + 0.05); ahead.lerpVectors(h.from, h.to, k2); ahead.y += Math.sin(Math.PI * k2) * 3;
          h.arrow.position.copy(tmp); if (k < 1) h.arrow.lookAt(ahead);
        }
        if (k >= 1) {
          flights.splice(i, 1);
          if (h.arrow) h.arrow.visible = false;
          if (h.target && h.target.state === 'walk') {
            h.target.state = 'hit'; h.target.t = 0; hits += 1; counter(); ctx.audio?.play('correct');
            gauge?.set(Math.min(1, gauge.value + 0.5 / wave.count));
            onHit?.(h.target.obj);
          }
          hooks();
        }
      }
      if (spawned >= wave.count && foes.every(f => f.state === 'gone' || f.state === 'back') && !flights.length) return finish(true, 'clear');
      hooks();
    });
  });
}
