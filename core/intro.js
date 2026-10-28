// 장 도입 장면(C-03, 2026-10-28 선생님): 예전 해설 카드 대신, 해설 문장을 화면 아래 자막으로 띄우며 그 장면을 3D로 재현한다.
// 장 모듈의 introScene(ctx)이 { shots, done? }를 돌려준다. shots[i]는 해설 i번째 문장의 장면:
//   { cam: [x,y,z], look: [x,y,z], to?: { cam, look } (그 문장 동안 카메라가 천천히 옮겨 감), act?(ctx) (그 문장이 시작될 때 인물을 움직임), ms? }
// 문장보다 장면이 많으면 남은 장면은 자막 없이 이어 보인다. 화면을 누르면 다음 문장, '건너뛰기'는 바로 끝.
import * as THREE from 'three';

const h = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); } e.append(...kids.filter(k => k != null)); return e; };

// 장면이 없는 장의 기본 재현: 학생이 들어올 곳 둘레를 하늘에서 천천히 돈다
export function orbitShots(center, lines, { r = 26, y = 14 } = {}) {
  return lines.map((_, i) => {
    const a0 = Math.PI * 0.75 + i * 0.9, a1 = a0 + 0.8;
    const at = a => [center[0] + Math.sin(a) * r, y, center[1] + Math.cos(a) * r];
    return { cam: at(a0), look: [center[0], 1.5, center[1]], to: { cam: at(a1), look: [center[0], 1.5, center[1]] } };
  });
}

export function playIntro(ctx, meta, lines, scene) {
  const { world, ui } = ctx;
  const shots = scene?.shots?.length ? scene.shots : orbitShots([world.player.position.x, world.player.position.z], lines);
  const n = Math.max(lines.length, shots.length);
  const wasVisible = world.player.visible, wasInput = ctx.input?.enabled;
  world.player.visible = false;
  if (ctx.input) ctx.input.enabled = false;
  const sub = h('p', { class: 'intro-sub-text' });
  const skip = h('button', { class: 'btn intro-skip', type: 'button' }, '건너뛰기 ▸▸');
  const el = h('div', { class: 'intro-film', role: 'dialog', 'aria-label': `${meta.no}장 시작` },
    h('div', { class: 'intro-bar top' }), h('div', { class: 'intro-bar bottom' }),
    h('div', { class: 'intro-title' }, h('div', { class: 'eyebrow' }, `${meta.no}장 · ${meta.years} · ${meta.event}`), h('h2', {}, meta.title)),
    h('div', { class: 'intro-sub' }, sub, h('span', { class: 'intro-tap' }, '눌러서 계속 ▸')), skip);
  ui.appendChild(el);
  ui.classList.add('filming'); // 퀘스트·메뉴 칸을 장면 동안 숨긴다
  const cam = new THREE.Vector3(), look = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), la = new THREE.Vector3(), lb = new THREE.Vector3();
  let k = -1, t = 0, dur = 1, shot = null, finish = null;
  const ease = x => x * x * (3 - 2 * x);
  const go = i => {
    k = i; t = 0;
    if (k >= n) { finish?.(); return; }
    shot = shots[Math.min(k, shots.length - 1)];
    const line = lines[k];
    sub.textContent = line ? line.text : '';
    sub.parentElement.hidden = !line;
    dur = shot.ms ?? Math.max(5200, (line ? [...line.text].length : 20) * 95);
    a.set(...shot.cam); la.set(...shot.look);
    b.set(...(shot.to?.cam || shot.cam)); lb.set(...(shot.to?.look || shot.look));
    try { shot.act?.(ctx); } catch (e) { console.warn('intro act', e); }
  };
  const off = world.onUpdate(dt => {
    if (k < 0 || k >= n) return;
    t += dt * 1000;
    const e = ease(Math.min(1, t / dur));
    cam.lerpVectors(a, b, e); look.lerpVectors(la, lb, e);
    world.setFixedCamera(cam.toArray(), look.toArray());
    if (t >= dur + 600) go(k + 1); // 다 읽을 시간을 조금 더 주고 다음 장면
  });
  let onKey = null;
  return new Promise(resolve => {
    finish = () => {
      finish = null; off(); el.remove(); ui.classList.remove('filming'); removeEventListener('keydown', onKey);
      try { scene?.done?.(ctx); } catch (e) { console.warn('intro done', e); }
      world.player.visible = wasVisible;
      if (ctx.input) ctx.input.enabled = wasInput;
      world.camMode = 'follow'; world.snapCamera?.();
      resolve();
    };
    el.addEventListener('click', e => { if (e.target === skip) return; if (t > 400) go(k + 1); });
    skip.addEventListener('click', e => { e.stopPropagation(); finish?.(); });
    onKey = e => { if (!finish) return; if (e.code === 'Escape') finish(); else if ((e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') && t > 400) go(k + 1); };
    addEventListener('keydown', onKey);
    ctx.testHooks && (ctx.testHooks.intro = { skip: () => finish?.(), next: () => go(k + 1) });
    go(0);
  });
}
