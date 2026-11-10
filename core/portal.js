// 장 전환(C-02)과 '다가가서 시작하기'(C-05), 2026-10-28 선생님 지시.
// - waitInteract: 다음 놀이는 저절로 시작하지 않는다. 그 물건·사람 앞에 가서 E(대화 버튼)를 눌러야 시작한다.
// - portalStage: 미니게임이 끝나면 마을 가운데에 '○○로 가는 문'이 빛난다. 문 앞에서 E를 누르면 복습 퀴즈가 시작된다.
//   편의 마지막 장(6장)에서는 다음 편으로 가는 큰 문(돌기둥·금빛 소용돌이·빛기둥)이 선다.
import * as THREE from 'three';
import { markerSprite } from './people.js';
import { makeTimeMachine, TM_R } from './timemachine.js';

// 받침 '로/으로': 받침이 없거나 ㄹ이면 '로', 아니면 '으로'
export function withRo(word) {
  const c = String(word).trim().slice(-1).charCodeAt(0);
  if (c < 0xac00 || c > 0xd7a3) return `${word}로`;
  const jong = (c - 0xac00) % 28;
  return `${word}${jong === 0 || jong === 8 ? '로' : '으로'}`;
}
// 문 이름(2026-10-28 선생님): 장과 장 사이는 다음 장의 사건만 짧게 '위화도 회군으로 가는 문',
// 편이 바뀌면 어느 시대로 가는지만 '조선으로 가는 문'. next = { title } 또는 { era }
export function portalName(next) {
  if (!next) return '';
  return `${withRo(next.era || next.title)} 가는 문`;
}

export function textSprite(text, { size = 1, color = '#fff6d8', bg = 'rgba(60,20,10,0.88)', border = '#f2c45a' } = {}) {
  const cv = document.createElement('canvas'), c = cv.getContext('2d');
  const font = 'bold 46px "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
  c.font = font;
  const w = Math.min(1400, Math.ceil(c.measureText(text).width) + 60), h = 80;
  cv.width = w; cv.height = h;
  c.fillStyle = bg; c.fillRect(0, 0, w, h);
  c.strokeStyle = border; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6);
  c.font = font; c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, w / 2, h / 2 + 2);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.renderOrder = 11; s.scale.set((w / h) * size, size, 1);
  return s;
}

// 문 안쪽에서 빛나는 소용돌이 무늬(캔버스)
function swirlTexture(inner, outer) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(128, 128, 8, 128, 128, 128);
  g.addColorStop(0, inner); g.addColorStop(0.55, outer); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, 256, 256);
  c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 5;
  for (let k = 0; k < 4; k++) { c.beginPath(); for (let t = 0; t < 1; t += 0.02) { const a = k * Math.PI / 2 + t * 5, r = 10 + t * 105; c.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } c.stroke(); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const solid = (color, emissive = 0) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, emissive: emissive ? color : 0x000000, emissiveIntensity: emissive });
const glow = (opts) => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, ...opts });

// 빛나는 문 하나. 앞면(+z, ry로 돌림)에서 걸어 들어간다. grand면 다음 편으로 가는 큰 문.
export function makePortal(world, { x, z, ry = 0, name, grand = false }) {
  const g = new THREE.Group(); g.name = 'portal';
  g.position.set(x, 0, z); g.rotation.y = ry;
  const W = grand ? 6.4 : 4, H = grand ? 7.2 : 4.6, P = grand ? 0.7 : 0.32;
  const postMat = grand ? solid(0x9c9486) : solid(0xb3271e), capMat = solid(0xe0b043, grand ? 0.35 : 0.15);
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(P, H, P), postMat); post.position.set(s * W / 2, H / 2, 0); post.castShadow = true; g.add(post);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(P * 1.4, P * 0.5, P * 1.4), capMat); cap.position.set(s * W / 2, H + P * 0.25, 0); g.add(cap);
    const base = new THREE.Mesh(new THREE.BoxGeometry(P * 1.6, 0.4, P * 1.6), grand ? solid(0x7d766a) : solid(0x6b4a32)); base.position.set(s * W / 2, 0.2, 0); g.add(base);
    if (grand) for (const k of [0.3, 0.6]) { // 기둥에 감긴 금띠
      const band = new THREE.Mesh(new THREE.BoxGeometry(P * 1.08, 0.18, P * 1.08), capMat); band.position.set(s * W / 2, H * k, 0); g.add(band);
    }
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(W + P * 2.2, P * 0.7, P * 1.1), postMat); beam.position.y = H - P * 0.6; g.add(beam);
  const top = new THREE.Mesh(new THREE.BoxGeometry(W + P * 3, P * 0.5, P * 1.4), grand ? solid(0x3d4148) : postMat); top.position.y = H + P * 0.55; g.add(top);
  if (!grand) for (let i = -4; i <= 4; i++) { // 홍살문처럼 위에 세운 붉은 살
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.9, 0.07), postMat); bar.position.set(i * W / 10, H + 0.2, 0); g.add(bar);
  } else { // 큰 문: 기와지붕 모양 처마와 가운데 금빛 태극 원판
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 1, 1, 4, 1), solid(0x2f3338)); roof.scale.set((W + 3) * 0.72, 1.3, 2.2); roof.rotation.y = Math.PI / 4; roof.position.y = H + 1.3; g.add(roof);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.75, 32), solid(0xf2c45a, 0.6)); disc.position.set(0, H - P * 0.6, P * 0.6); g.add(disc);
  }
  // 문 안쪽 빛(소용돌이 두 겹이 서로 반대로 돈다)
  const tex = swirlTexture(grand ? 'rgba(255,248,210,1)' : 'rgba(255,255,230,1)', grand ? 'rgba(90,150,255,0.85)' : 'rgba(255,190,80,0.8)');
  const inner = W - P, ih = H - P * 1.2;
  const sw1 = new THREE.Mesh(new THREE.PlaneGeometry(inner, ih), glow({ map: tex, opacity: 0.9 })); sw1.position.y = ih / 2;
  const sw2 = new THREE.Mesh(new THREE.PlaneGeometry(inner * 0.8, ih * 0.8), glow({ map: tex, opacity: 0.6 })); sw2.position.set(0, ih / 2, 0.02);
  g.add(sw1, sw2);
  // 바닥 빛 고리
  const ring = new THREE.Mesh(new THREE.RingGeometry(W * 0.45, W * 0.62, 40), glow({ color: grand ? 0x8fc4ff : 0xffd27a, opacity: 0.55 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; g.add(ring);
  // 하늘로 오르는 빛 알갱이
  const N = grand ? 140 : 50, pos = new Float32Array(N * 3), seed = [];
  for (let i = 0; i < N; i++) { seed.push([Math.random() * Math.PI * 2, Math.random(), 0.4 + Math.random() * 0.8]); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: grand ? 0xcfe6ff : 0xfff0b0, size: grand ? 0.16 : 0.12, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
  g.add(pts);
  let beamCol = null;
  if (grand) { // 문 위로 솟는 빛기둥
    beamCol = new THREE.Mesh(new THREE.CylinderGeometry(W * 0.32, W * 0.42, 40, 24, 1, true), glow({ color: 0x9fd0ff, opacity: 0.18 }));
    beamCol.position.y = 20; g.add(beamCol);
  }
  const label = textSprite(name, { size: grand ? 0.95 : 0.6, bg: grand ? 'rgba(20,30,70,0.9)' : 'rgba(60,20,10,0.88)' });
  label.position.y = H + (grand ? 2.6 : 0.9); g.add(label);
  world.level.add(g);
  // 기둥에만 부딪힌다(가운데는 지나갈 수 있다)
  const c = Math.cos(ry), s = Math.sin(ry);
  for (const k of [-1, 1]) world.addCollider({ x: x + k * (W / 2) * c, z: z - k * (W / 2) * s, r: P });
  const off = world.onUpdate((dt, t) => {
    sw1.rotation.z = t * (grand ? 0.9 : 0.6); sw2.rotation.z = -t * (grand ? 1.3 : 0.9);
    sw1.material.opacity = 0.75 + 0.2 * Math.sin(t * 2.4);
    ring.scale.setScalar(1 + 0.06 * Math.sin(t * 3)); ring.material.opacity = 0.4 + 0.2 * Math.sin(t * 2);
    if (beamCol) beamCol.material.opacity = 0.14 + 0.06 * Math.sin(t * 1.7);
    for (let i = 0; i < N; i++) {
      const [a, ph, sp] = seed[i], k = (ph + t * sp * 0.25) % 1, r = (W * 0.5) * (1 - k * 0.5);
      pos[i * 3] = Math.cos(a + t * 0.5) * r; pos[i * 3 + 1] = k * (H + (grand ? 6 : 1.5)); pos[i * 3 + 2] = Math.sin(a + t * 0.5) * r * 0.5;
    }
    pg.attributes.position.needsUpdate = true;
  });
  return { group: g, x, z, ry, H, dispose() { off(); g.removeFromParent(); } };
}

// 그 자리(pos)에 가서 E를 누를 때까지 기다린다(C-05). quest: 퀘스트 목록에 띄울 글, label: 말풍선 글.
// mark: 그 자리 위에 띄울 느낌표(이미 인물 머리 위 표시가 있으면 false). 테스트 봇은 바닥 화살표(world goal)를 따라가 누른다.
export function waitInteract(ctx, { pos, quest = null, label = '시작하기', r = 2.8, mark = true, markY = 3.2 }) {
  const { world, hud } = ctx;
  if (quest) ctx.setGoal(quest);
  world.setGoal({ x: pos.x, z: pos.z });
  let sprite = null;
  if (mark) { sprite = markerSprite('!'); sprite.position.set(pos.x, markY, pos.z); world.level.add(sprite); }
  const wasInput = ctx.input.enabled;
  ctx.input.enabled = true;
  if (world.camMode !== 'follow') world.camMode = 'follow';
  const near = () => Math.hypot(world.player.position.x - pos.x, world.player.position.z - pos.z) < r;
  return new Promise(resolve => {
    let done = false;
    const off = world.onUpdate((dt, t) => {
      if (done) return;
      if (sprite) sprite.position.y = markY + Math.sin(t * 3) * 0.12;
      const busy = ctx.dialogue?.isBlocking?.() ?? ctx.dialogue?.isOpen?.();
      const ok = near() && !busy;
      hud.setPrompt(ok ? new THREE.Vector3(pos.x, 0, pos.z) : null, label);
      hud.setTalkEnabled(ok);
    });
    const unbind = ctx.onAction(() => {
      if (done || !near() || (ctx.dialogue?.isBlocking?.() ?? ctx.dialogue?.isOpen?.())) return;
      done = true; off(); unbind();
      hud.setPrompt(null); hud.setTalkEnabled(false); world.setGoal(null);
      if (sprite) sprite.removeFromParent();
      ctx.input.enabled = wasInput;
      resolve();
    });
  });
}

// 미니게임이 끝난 뒤(2026-11-10 선생님: 빛나는 문 대신 타임머신): 문 밖에 세워 둔 타임머신이 날아올라 마을 가운데(chapter.portal 또는 학생 앞)에
// 내려앉는다. 학생이 다가가 E를 누르면 복습 퀴즈를 풀고, 다 풀면 타임머신에 올라 날아오른다(ctx.boardMachine, core/flow.js가 퀴즈 뒤에 부른다).
// next: { title } 다음 장 또는 { era } 다음 편. next가 없으면(마지막 편 6장) 2026년으로 돌아간다.
export const machineLabel = next => (next ? `다음 여행지: ${next.title || `${next.era} 시대`}` : '2026년으로 돌아가기');
export async function portalStage(ctx, chapter, next) {
  const { world } = ctx;
  const p = world.player.position;
  const spec = typeof chapter.portal === 'function' ? chapter.portal(ctx) : chapter.portal;
  const at = spec?.at || [p.x, p.z - 7];
  const ry = spec?.ry ?? 0;
  let tm = ctx.timeMachine;
  if (tm?.collider) { const i = world.colliders.indexOf(tm.collider); if (i >= 0) world.colliders.splice(i, 1); tm.collider = null; }
  const parked = !!tm?.group.parent;
  if (!parked) { tm = makeTimeMachine({ level: ctx.tmLevel || 0 }); world.level.add(tm.group); world.warm?.(); tm.offTick = world.onUpdate((dt, t) => tm.tick(t)); }
  world.player.visible = true; world.closeView = true; world.camMode = 'follow';
  ctx.dialogue?.say?.({ who: 'guide', text: '타임머신을 불렀어. 다가가서 복습 퀴즈를 풀면 탈 수 있어!' });
  // 세워 둔 자리에서 솟아올랐다가(0.7초) 마을에 내려앉는다(1.3초). 이어하기로 퀴즈부터 시작하면 바로 내려앉는다
  const g = tm.group, y0 = g.position.y;
  await new Promise(resolve => {
    let t = parked ? 0 : 0.7;
    const off = world.onUpdate(dt => {
      t += dt;
      if (t < 0.7) { g.position.y = y0 + 18 * (t / 0.7) ** 2; tm.setFlame(1); return; }
      const k = Math.min(1, (t - 0.7) / 1.3), e = 1 - (1 - k) * (1 - k);
      g.position.set(at[0], 16 * (1 - e), at[1]); g.rotation.y = ry; tm.setFlame(1 - e * 0.7);
      if (k >= 1) { off(); tm.setFlame(0); resolve(); }
    });
  });
  tm.x = at[0]; tm.z = at[1]; tm.collider = world.addCollider({ x: at[0], z: at[1], r: TM_R });
  const name = machineLabel(next);
  const label = textSprite(name, { size: 0.6 }); label.position.y = 5.6 + 0.9; g.add(label); label.scale.multiplyScalar(1 / g.scale.x);
  const gate = { group: g, x: at[0], z: at[1], ry, H: tm.H, machine: tm, dispose() { tm.offTick?.(); tm.dispose(); } };
  ctx.portal = gate; ctx.timeMachine = tm; // 퀴즈 배경·테스트용
  const front = { x: at[0] + Math.sin(ry) * (TM_R + 1.1), z: at[1] + Math.cos(ry) * (TM_R + 1.1) };
  ctx.testHooks.portalAt = front;
  await waitInteract(ctx, { pos: front, quest: `타임머신으로 가자 (${name})`, label: '복습 퀴즈 풀고 타임머신 타기', mark: false, r: 3 });
  ctx.input.enabled = false;
  await ctx.fade(true);
  await ctx.fade(false);
  // 퀴즈를 다 풀면: 타임머신 앞에 서서 걸어 들어가고(보이지 않게), 불꽃을 뿜으며 날아오른다
  ctx.boardMachine = async () => {
    const pl = world.player;
    world.camMode = 'follow'; pl.visible = true;
    pl.position.set(front.x, 0, front.z); pl.rotation.y = Math.atan2(at[0] - front.x, at[1] - front.z); world.snapCamera?.();
    label.visible = false;
    // 문이 열리고, 문 안으로 걸어 들어가 보이지 않게 된 뒤 문이 닫힌다(부딪힘·걷는 곳 테두리는 잠깐 푼다)
    const i = world.colliders.indexOf(tm.collider); if (i >= 0) world.colliders.splice(i, 1);
    const b0 = world.bounds, s0 = world.speedScale;
    world.bounds = { x0: Math.min(b0.x0, at[0] - 2), x1: Math.max(b0.x1, at[0] + 2), z0: Math.min(b0.z0, at[1] - 2), z1: Math.max(b0.z1, at[1] + 2) };
    tm.setDoor(true);
    await ctx.wait(350);
    world.speedScale = 0.7; world.autoMove = { x: Math.sin(pl.rotation.y), z: Math.cos(pl.rotation.y) };
    await new Promise(resolve => { let t = 0; const off = world.onUpdate(dt => { t += dt; if (Math.hypot(pl.position.x - at[0], pl.position.z - at[1]) < 0.9 || t > 3) { off(); resolve(); } }); });
    world.autoMove = null; world.speedScale = s0; world.bounds = b0; pl.visible = false;
    tm.setDoor(false);
    await ctx.wait(300);
    await new Promise(resolve => { let t = 0; const off = world.onUpdate(dt => { t += dt; tm.setFlame(Math.min(1.3, 0.4 + t)); if (t > 0.5) g.position.y = 20 * ((t - 0.5) / 1.4) ** 2; if (t >= 1.9) { off(); resolve(); } }); });
    await ctx.fade(true);
    world.testLift = g.position.y;
    ctx.testHooks.boarded = true;
  };
  return gate;
}
