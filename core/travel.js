// 타임머신 이동 장면(2026-11-10 선생님 시안): 장에서 장으로는 「한지 두루마리」(먹으로 그은 연표 길 위를 날아 다음 정거장에 도장, 약 4초),
// 편에서 편으로는 「큰 시계 속으로」(시계판 고리 속을 돌며 날고 연도가 크게 넘어가며 새 편 제목이 뜬다, 약 6초). 화면을 누르거나 키를 누르면 건너뛴다.
// 게임 장면을 비우고 같은 렌더러로 그린다(장을 시작하면 world.setMood·clearLevel이 원래대로 돌린다).
import * as THREE from 'three';
import { makeTimeMachine } from './timemachine.js';
import { textSprite } from './portal.js';

export const yearOf = meta => parseInt(String(meta?.years || '').match(/\d{3,4}/)?.[0] || '0', 10);
const ease = k => k * k * (3 - 2 * k);
const clamp = k => Math.min(1, Math.max(0, k));
const basic = (c, o = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: o < 1, opacity: o, fog: false });
const INK = 0x2b2622, SEAL = 0xb3271e, PAPER = 0xefe4c8, GOLD = 0xe0b043;
const plain = { bg: 'rgba(0,0,0,0)', border: 'rgba(0,0,0,0)' };

function stage(world, color) {
  world.clearLevel(); world.player.visible = false;
  world.scene.background = new THREE.Color(color); world.scene.fog = null;
  const g = new THREE.Group(); world.level.add(g);
  g.add(new THREE.AmbientLight(0xffffff, 1.5)); // 앞 장의 분위기(해 질 녘·밤)가 어두워도 타임머신이 또렷하게
  return g;
}
function overlay(ui, html, cls = '') {
  const el = document.createElement('div'); el.className = `travel ${cls}`; el.innerHTML = `${html}<div class="travel-skip">눌러서 건너뛰기</div>`;
  ui.append(el); return el;
}
// seconds 동안 step(k, t, dt)을 돌린다. 0.4초 뒤부터 누르면 건너뛴다
function run(world, seconds, step) {
  return new Promise(resolve => {
    let t = 0, off = null;
    const end = () => { if (!off) return; off(); off = null; removeEventListener('pointerdown', skip, true); removeEventListener('keydown', skip, true); resolve(); };
    const skip = () => { if (t > 0.4) end(); };
    off = world.onUpdate(dt => { t += dt; step(Math.min(1, t / seconds), t, dt); if (t >= seconds) end(); });
    addEventListener('pointerdown', skip, true); addEventListener('keydown', skip, true);
  });
}

// 장 → 장 「한지 두루마리」(2026-11-10 선생님 시안 A): 한지 위 먹으로 그은 길을 타임머신이 날아가고, 지나간 길은 먹이 번지듯 그려지며,
// 다음 장 정거장에 내려앉으면 붉은 도장이 쾅 찍힌다. 움직임이 잘 보이게: 떠나기 전 떨림 → 솟구침 → 가는 쪽으로 기울어 날기 → 먹 자국 꼬리 → 내려앉기.
async function timeline(ctx, { course, from, to }) {
  const { world, ui } = ctx, g = stage(world, PAPER), list = course.chapters, n = list.length;
  const X = i => (i - (n - 1) / 2) * 4.3, Y = -2.0, a = list.indexOf(from), b = list.indexOf(to);
  const mesh = (geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
  for (const sy of [-1, 1]) { mesh(new THREE.BoxGeometry(44, 0.9, 1), basic(0x6b4a32), 0, sy * 6.7, 0.5); mesh(new THREE.BoxGeometry(44, 0.16, 1.1), basic(GOLD), 0, sy * 6.18, 0.6); } // 두루마리 위아래 축
  const clouds = [[-11, 4.2, 1.2], [8, 4.7, 1.5], [12.5, 1.6, 0.9], [-3, 4.9, 0.8], [-14, -4.6, 1.1], [5, -5.0, 1.0]].map(([x, y, sz]) => { // 옅은 구름 무늬
    const c = new THREE.Group(); c.position.set(x, y, -1); g.add(c);
    for (const [dx, dy, r0] of [[0, 0, 1], [1.1, -0.1, 0.75], [-1.1, -0.15, 0.7], [0.4, 0.5, 0.6]]) { const o = new THREE.Mesh(new THREE.CircleGeometry(r0 * sz, 20), basic(0xd9cba6, 0.8)); o.position.set(dx * sz, dy * sz, 0); c.add(o); }
    return c; });
  // 먹으로 그은 길: 정거장 사이를 물결처럼 잇는다. 아직 안 간 길은 옅게, 간 길은 진하게. 이번에 가는 길은 날아가는 만큼 진하게 그려진다
  const seg = i => new THREE.CatmullRomCurve3([new THREE.Vector3(X(i), Y, 0), new THREE.Vector3((X(i) + X(i + 1)) / 2, Y + (i % 2 ? -0.5 : 0.5), 0), new THREE.Vector3(X(i + 1), Y, 0)]);
  const lo = Math.min(a, b), hi = Math.max(a, b), inked = [];
  for (let i = 0; i < n - 1; i++) {
    mesh(new THREE.TubeGeometry(seg(i), 20, 0.05, 6), basic(0xa99d86));
    if (i < lo) mesh(new THREE.TubeGeometry(seg(i), 20, 0.11, 6), basic(INK), 0, 0, 0.1);
    else if (i < hi) { const m = mesh(new THREE.TubeGeometry(seg(i), 20, 0.11, 6), basic(INK), 0, 0, 0.1); m.geometry.setDrawRange(0, 0); inked.push(m); }
  }
  const dots = list.map((c, i) => {
    const dot = mesh(new THREE.CircleGeometry(i === b ? 0.6 : 0.42, 24), basic(i <= lo ? INK : 0xb9ad96), X(i), Y, 0.5);
    const y = textSprite(String(c.years || '').replace(/[~·].*/, ''), { size: 1.1, color: '#2b2622', ...plain }); y.position.set(X(i), Y - 1.15, 0.6); g.add(y);
    const s = textSprite(`${c.no}장 ${c.short || c.title}`, { size: 0.6, color: i > hi ? '#8c8172' : '#4a4038', ...plain }); s.position.set(X(i), Y - 2.05, 0.6); g.add(s);
    return dot; });
  const stamp = mesh(new THREE.RingGeometry(0.74, 0.88, 32), basic(SEAL, 0.99), X(b), Y, 0.7); stamp.visible = false; // 붉은 도장 테두리
  const head = textSprite(`${course.era}편 · ${course.title}`, { size: 1.15, color: '#2b2622', ...plain }); head.position.set(0, 4.9, 0.6); g.add(head);
  const tm = makeTimeMachine({ scale: 0.46, parts: ctx.tmParts || [] }); g.add(tm.group);
  const puffs = [...Array(16)].map(() => { const m = mesh(new THREE.CircleGeometry(0.3, 12), basic(INK, 0.5), 0, 0, 1); m.visible = false; m.userData.age = 9; return m; }); // 먹 자국 꼬리
  const lines = [...Array(4)].map((_, i) => { const m = mesh(new THREE.BoxGeometry(1.6 + i * 0.5, 0.05, 0.02), basic(INK, 0.35), 0, 0, 1.2); m.visible = false; return m; });   // 빠르기 줄
  world.warm?.();
  const el = overlay(ui, `<div class="travel-line">${from.no}장 ▸ <b>${to.no}장 ${to.short || to.title}</b></div>`, 'paper');
  const x0 = X(a), x1 = X(b), dir = Math.sign(x1 - x0) || 1, FOOT = 0.42;
  // 떠나기 전 0~0.14(떨림) → 날기 0.14~0.86 → 내려앉기 0.86~1
  const at = f => new THREE.Vector2(x0 + (x1 - x0) * f, Y + FOOT + Math.sin(f * Math.PI) * 3.0 + Math.sin(f * Math.PI * 3) * 0.25);
  let puffT = 0, landed = false;
  await run(world, 4.2, (k, t, dt) => {
    const f = ease(clamp((k - 0.14) / 0.72)), p = at(f), q = at(Math.min(1, f + 0.01)), flying = k > 0.14 && f < 1;
    const ang = flying ? Math.atan2(q.y - p.y, q.x - p.x) - Math.PI / 2 : 0; // 가는 쪽으로 코를 돌린다
    const shake = k < 0.14 ? Math.sin(t * 70) * 0.05 * (k / 0.14) : 0;
    tm.group.position.set(p.x + shake, p.y, 0.9);
    tm.group.rotation.z += (ang - tm.group.rotation.z) * Math.min(1, dt * 9);
    tm.setFlame(k < 0.14 ? 0.3 + k * 6 : flying ? 1.15 : Math.max(0, 0.6 - (k - 0.86) * 6)); tm.tick(t);
    inked.forEach((m, i) => { const part = clamp(f * inked.length - (dir > 0 ? i : inked.length - 1 - i)); m.geometry.setDrawRange(0, Math.floor(part * 20) * 36); });
    for (const c of clouds) { c.position.x -= dt * 0.5 * dir; if (Math.abs(c.position.x) > 19) c.position.x = 19 * dir; }
    puffT -= dt;
    if (flying && puffT <= 0) { puffT = 0.05; const m = puffs.reduce((o, c) => (c.userData.age > o.userData.age ? c : o)); m.userData.age = 0; m.position.set(p.x - Math.cos(ang + Math.PI / 2) * 0.9, p.y - Math.sin(ang + Math.PI / 2) * 0.9, 1); m.visible = true; }
    for (const m of puffs) { m.userData.age += dt; const u = m.userData.age / 0.8; if (u >= 1) m.visible = false; else { m.scale.setScalar(0.5 + u * 1.6); m.material.opacity = 0.5 * (1 - u); } }
    lines.forEach((m, i) => { m.visible = flying && f > 0.08 && f < 0.92; m.position.set(p.x - Math.cos(ang + Math.PI / 2) * (1.8 + i * 0.5) + Math.sin(t * 40 + i) * 0.1, p.y - Math.sin(ang + Math.PI / 2) * (1.8 + i * 0.5) + (i - 1.5) * 0.28, 1.2); m.rotation.z = ang + Math.PI / 2; });
    const s = clamp((k - 0.88) / 0.08); // 도장 찍기: 큰 테두리가 줄어들며 쾅
    if (s > 0) { stamp.visible = true; stamp.scale.setScalar(2.6 - 1.6 * ease(s)); if (s >= 1 && !landed) { landed = true; dots[b].material.color.set(SEAL); ctx.audio?.play?.('stamp'); } }
    const jolt = landed ? Math.max(0, 1 - (k - 0.96) / 0.04) * 0.12 * Math.sin(t * 90) : 0;
    world.setFixedCamera([0, 0.4 + jolt, 15.5], [0, 0.4 + jolt, 0]);
  });
  el.remove();
}

// 편 → 편 「큰 시계 속으로」(시안 C): 시계판 고리가 엇갈려 돌며 밀려오고 톱니바퀴가 스쳐 가는 속을, 타임머신이 나사처럼 돌며 빨려 들어간다.
// 빠르기 줄이 뒤로 흐르고 연도가 넘어가다가, 끝에서 환하게 번쩍이며 새 편 제목이 뜬다.
async function tunnel(ctx, { fromYear, toYear, title, sub }) {
  const { world, ui } = ctx, g = stage(world, 0x1b1430);
  const lit = c => new THREE.MeshLambertMaterial({ color: c, flatShading: true, fog: false });
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c2 = cv.getContext('2d'), gr = c2.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,243,196,1)'); gr.addColorStop(0.3, 'rgba(233,184,90,0.9)'); gr.addColorStop(0.7, 'rgba(122,63,42,0.5)'); gr.addColorStop(1, 'rgba(27,20,48,0)'); c2.fillStyle = gr; c2.fillRect(0, 0, 256, 256);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), fog: false, depthWrite: false })); glow.position.set(0, 0.4, -110); glow.scale.set(150, 150, 1); g.add(glow);
  const R = 6.5, GAP = 11, N = 9, rings = [];
  for (let i = 0; i < N; i++) { // 시계판 고리: 금빛 테와 눈금 열둘(3·6·9·12는 붉고 굵게)
    const r = new THREE.Group(); r.position.set(0, 0.4, -i * GAP); r.rotation.z = i * 0.35; r.userData.spin = i % 2 ? 0.9 : -0.6; g.add(r); rings.push(r);
    r.add(new THREE.Mesh(new THREE.TorusGeometry(R, 0.28, 8, 60), lit(GOLD)));
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, t = new THREE.Mesh(new THREE.BoxGeometry(k % 3 ? 0.18 : 0.34, k % 3 ? 0.9 : 1.5, 0.2), lit(k % 3 ? 0xf6f1e2 : SEAL)); t.position.set(Math.cos(a) * (R - 0.9), Math.sin(a) * (R - 0.9), 0); t.rotation.z = a + Math.PI / 2; r.add(t); }
  }
  const gears = [[-5, 3, 1.3], [5.5, -2.5, 1.6], [-6, -3, 1.2], [4.5, 3.6, 1.0]].map(([x, y, sz], i) => { // 톱니바퀴
    const w = new THREE.Group(); w.position.set(x, y, -14 - i * 22); g.add(w);
    w.add(new THREE.Mesh(new THREE.CylinderGeometry(sz, sz, 0.3, 20).rotateX(Math.PI / 2), lit(0x8a6a3a)));
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, t = new THREE.Mesh(new THREE.BoxGeometry(0.4 * sz, 0.5 * sz, 0.3), lit(0x8a6a3a)); t.position.set(Math.cos(a) * sz * 1.15, Math.sin(a) * sz * 1.15, 0); t.rotation.z = a + Math.PI / 2; w.add(t); }
    return w; });
  const streaks = [...Array(36)].map((_, i) => { const a = i * 2.4, rr = 2.6 + (i % 5) * 0.8, m = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 5), basic(0xfff3cf, 0.7)); m.position.set(Math.cos(a) * rr, 0.4 + Math.sin(a) * rr, -i * 2.6); g.add(m); return m; }); // 빠르기 줄
  const spin = new THREE.Group(); g.add(spin);
  const tm = makeTimeMachine({ scale: 0.78, parts: ctx.tmParts || [] }); tm.group.rotation.set(-1.25, 0, 0); spin.add(tm.group);
  world.warm?.();
  const el = overlay(ui, `<div class="travel-flash"></div><div class="travel-year"><span class="travel-from">${fromYear}년</span> ▸▸ <b class="travel-to">${fromYear}년</b></div><div class="travel-title">${title}</div><div class="travel-sub">${sub}</div>`);
  const yearEl = el.querySelector('.travel-to'), titleEl = el.querySelector('.travel-title'), flash = el.querySelector('.travel-flash');
  await run(world, 6, (k, t, dt) => {
    const v = 16 + 44 * ease(clamp(k / 0.25)) * (1 - 0.7 * ease(clamp((k - 0.8) / 0.2))); // 점점 빨라졌다가 끝에서 늦춘다
    for (const r of rings) { r.position.z += dt * v; if (r.position.z > 5) r.position.z -= N * GAP; r.rotation.z += dt * r.userData.spin * (0.5 + v / 40); }
    for (const [i, w] of gears.entries()) { w.position.z += dt * v * 0.8; if (w.position.z > 4) w.position.z -= 88; w.rotation.z += dt * (i % 2 ? 2.2 : -1.6); }
    for (const m of streaks) { m.position.z += dt * v * 2.2; if (m.position.z > 4) m.position.z -= 94; m.scale.z = 0.4 + v / 40; }
    // 나사처럼 돌며 앞뒤로 치고 나간다
    const a = t * 2.6, rad = 1.5 - 0.7 * ease(clamp((k - 0.75) / 0.25));
    spin.position.set(Math.cos(a) * rad, 0.4 + Math.sin(a) * rad * 0.75, -9.5 + Math.sin(t * 1.3) * 1.6 - 6 * ease(clamp((k - 0.85) / 0.15)));
    spin.rotation.z = -Math.cos(a) * 0.5; tm.group.rotation.y = t * 3.2; // 가는 쪽으로 기울고 몸통이 돈다
    tm.setFlame(0.9 + 0.4 * Math.sin(t * 5) + v / 120); tm.tick(t * 3);
    glow.scale.setScalar(150 * (1 + 0.06 * Math.sin(t * 6)));
    const sh = 0.05 * (v / 60); world.setFixedCamera([Math.sin(t * 23) * sh, 0.5 + Math.cos(t * 19) * sh, 3], [0, 0.4, -20]);
    yearEl.textContent = `${Math.round(fromYear + (toYear - fromYear) * ease(clamp(k / 0.75)))}년`;
    titleEl.classList.toggle('on', k > 0.6);
    flash.style.opacity = String(clamp((k - 0.9) / 0.1));
  });
  el.remove();
}

// from·to: 장 정보(chapters/index.js). courseOf(id) → 그 장의 편. 3D 장면이 없는 시험용 ctx에서는 아무것도 하지 않는다
export async function playTravel(ctx, { from, to, courseOf }) {
  if (!ctx.world?.scene || !ctx.ui || !from || !to) return;
  const a = courseOf(from.id), b = courseOf(to.id);
  ctx.testHooks.travel = a === b ? 'timeline' : 'tunnel';
  const sky = ctx.world.scene.children.find(o => o.isMesh && o.material?.uniforms?.horizon); // 낮 하늘 반구는 잠깐 숨긴다(밤하늘 바탕)
  if (sky) sky.visible = false;
  try {
    if (a === b) await timeline(ctx, { course: a, from, to });
    else await tunnel(ctx, { fromYear: yearOf(from), toYear: yearOf(to), title: `${b.era}편 · ${b.title}`, sub: `${to.no}장 ${to.short || to.title}` });
  } catch (e) { console.warn('이동 장면', e); }
  if (sky) sky.visible = true;
  ctx.ui.querySelectorAll('.travel').forEach(e => e.remove());
}
