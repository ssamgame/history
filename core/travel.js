// 타임머신 이동 장면(2026-11-10 선생님 시안): 장에서 장으로는 「연표 길」(그 편 여섯 장의 연도가 놓인 길 위를 날아 다음 정거장으로, 약 3.5초),
// 편에서 편으로는 「시간 터널」(빛 고리 속을 날며 연도가 크게 넘어가고 새 편 제목이 뜬다, 약 5.5초). 화면을 누르거나 키를 누르면 건너뛴다.
// 게임 장면을 비우고 같은 렌더러로 그린다(장을 시작하면 world.setMood·clearLevel이 원래대로 돌린다).
import * as THREE from 'three';
import { makeTimeMachine } from './timemachine.js';
import { textSprite } from './portal.js';

export const yearOf = meta => parseInt(String(meta?.years || '').match(/\d{3,4}/)?.[0] || '0', 10);
const ease = k => k * k * (3 - 2 * k);
const basic = (c, o = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: o < 1, opacity: o });
const NIGHT = 0x1b2440; // 쪽빛 밤하늘(게임의 한지·단청 빛깔과 어울리게 너무 까맣지 않게)

function stage(world) {
  world.clearLevel(); world.player.visible = false;
  world.scene.background = new THREE.Color(NIGHT); world.scene.fog = new THREE.Fog(NIGHT, 60, 220);
  const g = new THREE.Group(); world.level.add(g);
  const n = 260, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 140; pos[i * 3 + 1] = (Math.random() - 0.5) * 80; pos[i * 3 + 2] = -20 - Math.random() * 120; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xfff3cf, size: 0.5, fog: false })));
  return g;
}
function overlay(ui, html) {
  const el = document.createElement('div'); el.className = 'travel'; el.innerHTML = `${html}<div class="travel-skip">눌러서 건너뛰기</div>`;
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

// 연표 길: chapters(그 편의 장 목록)에서 from → to로 한 칸(또는 여러 칸) 난다
async function timeline(ctx, { course, from, to }) {
  const { world, ui } = ctx, g = stage(world), list = course.chapters, n = list.length;
  const X = i => (i - (n - 1) / 2) * 4.3, Y = -2.0;
  const line = new THREE.Mesh(new THREE.BoxGeometry(X(n - 1) - X(0) + 8, 0.12, 0.12), basic(0xe0b043)); line.position.set(0, Y, 0); g.add(line);
  const a = list.indexOf(from), b = list.indexOf(to);
  list.forEach((c, i) => {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(i === b ? 0.5 : 0.36, 16, 12), basic(i === b ? 0xd9482f : i <= a ? 0x5aa06a : 0x8f97b3)); dot.position.set(X(i), Y, 0); g.add(dot);
    const y = textSprite(String(c.years || '').replace(/[~·].*/, ''), { size: 1.15, color: i === b ? '#ffe08a' : '#fff6d8', bg: 'rgba(0,0,0,0)', border: 'rgba(0,0,0,0)' }); y.position.set(X(i), Y - 1.1, 0); g.add(y);
    const s = textSprite(`${c.no}장 ${c.short || c.title}`, { size: 0.62, color: i > b ? '#aab2cc' : '#fff6d8', bg: 'rgba(0,0,0,0)', border: 'rgba(0,0,0,0)' }); s.position.set(X(i), Y - 2.05, 0); g.add(s);
  });
  const head = textSprite(`${course.era}편 · ${course.title}`, { size: 0.85, bg: 'rgba(40,20,12,0.85)' }); head.position.set(0, 4.6, 0); g.add(head);
  const tm = makeTimeMachine({ scale: 0.36 }); g.add(tm.group); tm.setFlame(1);
  const puffs = [...Array(7)].map((_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.14 + i * 0.03, 8, 8), basic(0xffd9a0, 0.8 - i * 0.09)); g.add(m); return m; });
  world.setFixedCamera([0, 0.4, 15.5], [0, 0.4, 0]);
  const el = overlay(ui, `<div class="travel-line">${from.no}장 ▸ <b>${to.no}장 ${to.short || to.title}</b></div>`);
  const x0 = X(a), x1 = X(b), trail = [];
  await run(world, 3.5, (k, t) => {
    const e = ease(Math.min(1, k / 0.85)), x = x0 + (x1 - x0) * e, land = Math.max(0, (k - 0.85) / 0.15);
    const y = Y + 1.0 + Math.sin(e * Math.PI) * 2.4 * (1 - land) + 0;
    const tilt = -Math.PI / 2 * (1 - land) * Math.min(1, e * 6); // 떠나면 눕고, 닿으면 선다
    tm.group.position.set(x, y - 1.0 * land + 0.35, 0.4); tm.group.rotation.z = tilt; tm.setFlame(1 - land); tm.tick(t);
    trail.unshift([x, y + 1.0]); trail.length = Math.min(trail.length, 40);
    puffs.forEach((m, i) => { const q = trail[Math.min(trail.length - 1, 4 + i * 4)]; m.position.set(q[0] - 1.6 * (1 - land), q[1], 0.4); m.visible = land < 0.5; });
  });
  el.remove();
}

// 시간 터널: 빛 고리(단청 빛깔) 속을 날며 연도가 넘어간다
async function tunnel(ctx, { fromYear, toYear, title, sub }) {
  const { world, ui } = ctx, g = stage(world);
  const cols = [0xe0b043, 0xd9482f, 0x3f8f8a, 0x5a7ac0], rings = [];
  for (let i = 0; i < 16; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(7 + (i % 2), 0.2, 8, 48), basic(cols[i % 4])); r.position.set(0, 0, -i * 9); r.rotation.z = i * 0.3; g.add(r); rings.push(r); }
  const clocks = [...Array(8)].map((_, i) => { // 떠다니는 시계
    const c = new THREE.Group(); c.position.set((i % 2 ? 1 : -1) * (4.2 + i % 3), 3 - (i * 1.7) % 6, -10 - i * 12); c.rotation.set(0.2, (i % 2 ? -1 : 1) * 0.7, i); g.add(c);
    const f = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.1, 20), basic(0xf6f1e2)); f.rotation.x = Math.PI / 2; c.add(f);
    c.add(new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.09, 8, 20), basic(0xe0b043)));
    const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.6, 0.05), basic(0x3a3530)); h1.position.set(0, 0.28, 0.08); c.add(h1);
    return c; });
  const tm = makeTimeMachine({ scale: 0.6 }); tm.group.rotation.set(-1.25, 0.25, 0.12); g.add(tm.group); tm.setFlame(1.1);
  world.setFixedCamera([0, 0.4, 2], [0, -0.2, -20]);
  const el = overlay(ui, `<div class="travel-year"><span class="travel-from">${fromYear}년</span> ▸▸ <b class="travel-to">${fromYear}년</b></div><div class="travel-title">${title}</div><div class="travel-sub">${sub}</div>`);
  const yearEl = el.querySelector('.travel-to'), titleEl = el.querySelector('.travel-title');
  await run(world, 5.5, (k, t, dt) => {
    for (const r of rings) { r.position.z += dt * 34; if (r.position.z > 6) r.position.z -= 144; r.rotation.z += dt * 0.5; }
    for (const c of clocks) { c.position.z += dt * 26; if (c.position.z > 4) c.position.z -= 100; c.rotation.z += dt; }
    tm.group.position.set(0.3 + Math.sin(t * 1.7) * 0.5, 0.2 + Math.sin(t * 2.3) * 0.3, -9); tm.tick(t);
    yearEl.textContent = `${Math.round(fromYear + (toYear - fromYear) * ease(Math.min(1, k / 0.75)))}년`;
    titleEl.classList.toggle('on', k > 0.55);
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
