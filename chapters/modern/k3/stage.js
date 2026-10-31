// 근대편 3장 장면 도구(D-31): 횃불·농기구, 뒤따르는 농민에게 농기구 들리기, 밤 분위기, 달리기, 언덕, 전봉준을 따라 걷기.
// 공용 파일을 고치지 않으려고 이 장 폴더 안에 둔다.
import * as THREE from 'three';
import { buildArena } from '../../kit/play.js';
import { nameBoard } from '../../kit/gate.js';
import { leadWalk } from '../../kit/lead.js';
import { makePerson, animateWalk, setCarry, mat } from '../../../core/people.js';
import { MOODS } from '../../../core/world.js';
import { LOOKS } from '../../../content/characters.js';
import { placePlayer } from '../../joseon/common.js';

// 횃불 행진의 밤(k2 밤처럼 장 안에서 공용 분위기 목록에 더한다). 얼굴이 어둠에 묻히지 않게 하늘빛은 조금 남긴다
export const NIGHT_MOOD = 'k3Night';
MOODS[NIGHT_MOOD] ??= {
  skyTop: 0x0c1428, skyHorizon: 0x3a3656, skyBottom: 0x1a1a22,
  fog: [0x262636, 38, 125],
  sun: { color: 0xb8c4e8, intensity: 0.8, dir: [20, 40, 18] }, // 달빛
  hemi: [0xb0b4d4, 0x4a4238, 1.0],
  particles: null, clouds: 0.15, cloud: 0x4a5070,
};

export const wait = (world, sec, f) => new Promise(res => { let t = 0; const off = world.onUpdate(dt => { t = Math.min(sec, t + dt); f?.(t / sec, dt); if (t >= sec) { off(); res(); } }); });
export const person = (g, look, x, z, ry = 0) => { const p = makePerson(typeof look === 'string' ? LOOKS[look] : look); p.position.set(x, 0, z); p.rotation.y = ry; g.add(p); return p; };
export const JAPAN = { ...LOOKS.gendarme, gear: 'rifle' }; // 1894년 일본군(국방색 군복·모자)

// 횃불: 나무 자루 끝의 불꽃. 불꽃은 빛 계산 없이 스스로 빛나는 재질(가볍다). 손에 쥐는 곳이 원점
export function makeTorch() {
  const g = new THREE.Group(); g.name = 'tool:torch';
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.2, 6), mat(0x5a3f2a, 'wood', 'object')); stick.position.y = 0.15; g.add(stick);
  const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.18, 8), mat(0x3a2a1e)); wrap.position.y = 0.76; g.add(wrap);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.42, 8), new THREE.MeshBasicMaterial({ color: 0xff8a2a })); flame.name = 'flame'; flame.position.y = 1.04; g.add(flame);
  const core = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.24, 6), new THREE.MeshBasicMaterial({ color: 0xffe08a })); core.position.y = 0.98; g.add(core);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffa050, transparent: true, opacity: 0.14, depthWrite: false })); halo.position.y = 1.0; g.add(halo);
  g.userData.flame = flame; g.userData.halo = halo;
  return g;
}
// 농기구: 죽창(대나무를 비스듬히 깎은 창)·낫. 손에 쥐는 곳이 원점
export function makeTool(i = 0) {
  const g = new THREE.Group();
  if (i % 2 === 0) {
    g.name = 'tool:spear';
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 2.5, 6), mat(0xb8a860, 'wood', 'object')); pole.position.y = 0.45; g.add(pole);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.32, 5), mat(0xd0c27a)); tip.position.y = 1.86; g.add(tip);
    for (const y of [-0.2, 0.5, 1.2]) { const knot = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 6), mat(0x8a7a40)); knot.position.y = y; g.add(knot); } // 대나무 마디
  } else {
    g.name = 'tool:sickle';
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.5, 6), mat(0x6b4a32, 'wood', 'object')); handle.position.y = 0.1; g.add(handle);
    const blade = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 4, 10, Math.PI * 0.9), mat(0x9aa0a4)); blade.position.set(0.18, 0.36, 0); blade.rotation.z = Math.PI * 0.1; g.add(blade);
  }
  return g;
}
// 불꽃 깜박임(횃불 여럿을 한 번에). 돌려주는 함수로 멈춘다
export function flicker(world, torches) {
  return world.onUpdate((dt, t = 0) => torches.forEach((o, i) => {
    const k = Math.sin(t * 13 + i * 1.7) * 0.5 + Math.sin(t * 7.3 + i) * 0.5;
    o.userData.flame.scale.set(1 + k * 0.08, 1 + k * 0.18, 1 + k * 0.08);
    o.userData.halo.material.opacity = 0.13 + k * 0.04;
  }));
}
// 횃불 둘레를 밝히는 점광 수: 화질 '보통·높음'에서만(무거운 효과), '낮음'은 불꽃 재질만
export const torchLights = world => ((world.quality?.particles ?? 0.9) >= 0.9 ? 2 : 0);
export function addTorchLight(torch) {
  const l = new THREE.PointLight(0xffa050, 7, 11, 1.4); l.position.y = 1.1; torch.add(l); return l;
}

// 뒤따르는 사람에게 물건 들리기(D-31): 공용 놀이(drive)가 world.level에 새로 세우는 따라오는 사람(사람 하나뿐인 묶음)을 찾아
// 농기구(또는 횃불)를 오른손에 쥐여 주고, 가는 쪽을 보게 한다. 걸음은 공용 걷기(animateWalkers)가 맡는다. 돌려주는 함수로 멈춘다
export function equipFollowers(world, { torch = false } = {}) {
  const known = new Set(world.level.children);
  let n = 0;
  const off = world.onUpdate(() => {
    for (const o of world.level.children) {
      if (known.has(o)) continue;
      known.add(o);
      const p = o.isGroup && o.children.length === 1 && o.children[0].userData.legs ? o.children[0] : null;
      if (!p) continue;
      p.rotation.y = 0;
      setCarry(p, torch ? makeTorch() : makeTool(n), 'side');
      n += 1;
    }
  });
  return off;
}

// 뛰기: 몸을 조금 숙이고 to까지 sec초 동안(공용 걷기, 박자는 실제 빠르기에서). 끝나면 자세를 되돌린다
export function runTo(world, mesh, to, sec = 2, { lean = 0.25, speed = 2.2, heightAt = null } = {}) { // heightAt(x, z): 언덕을 오르내리는 높이
  const u = mesh.userData, p0 = mesh.position.clone(), order = mesh.rotation.order;
  u.manual = true; mesh.rotation.order = 'YXZ';
  const ry = Math.atan2(to.x - p0.x, to.z - p0.z);
  return new Promise(res => {
    let t = 0;
    const off = world.onUpdate(dt => {
      t = Math.min(sec, t + dt);
      const f = t / sec;
      mesh.position.set(p0.x + (to.x - p0.x) * f, p0.y, p0.z + (to.z - p0.z) * f);
      if (heightAt) mesh.position.y = heightAt(mesh.position.x, mesh.position.z);
      mesh.rotation.y = ry; mesh.rotation.x = lean * Math.min(1, t / 0.25);
      animateWalk(mesh, true, dt); // 걸음 박자는 실제 빠르기에서(2026-10-31 선생님: 다리만 빨리 돌려 종종걸음처럼 보였다). speed는 예전 호출 호환용으로 받기만 한다
      if (t >= sec) {
        off(); mesh.rotation.x = 0; mesh.rotation.order = order; u.manual = false;
        for (const l of u.legs || []) l.rotation.x = 0;
        res();
      }
    });
  });
}

// 낮은 언덕(황토현·우금치): 반구를 납작하게. top(dx, dz)은 그 자리 언덕 높이(언덕 위에 사람을 세울 때)
export function mound(g, x, z, { r = 6, h = 2.4, sx = 1, color = 0x8a7a4a } = {}) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(color, 'grass'));
  m.scale.set(sx, h / r, 1); m.position.set(x, 0, z); m.receiveShadow = true; g.add(m);
  const top = (px, pz) => { const d = Math.hypot((px - x) / sx, pz - z) / r; return d >= 1 ? 0 : h * Math.sqrt(1 - d * d); };
  return { mesh: m, top };
}

// 전봉준을 따라 걷기(k2 김옥균 밤길과 같은 방식): 전봉준이 path를 따라 앞장서고, 멈춘 곳(stand)의 빛나는 원에 서면 그곳 일이 장면으로(show) 나타난다.
// 전봉준 대사는 얼굴을 정면에서, 해설은 장면을 보는 카메라(st.view)로. lines[i] = { label, talk }
export async function followJeon(ctx, { arena, stops, lines, stage, start, jeonAt, spot, onEnd = null }) {
  const { world, dialogue } = ctx;
  const jeon = world.npcs.get('jeonbongjun'), home = { x: jeon.mesh.position.x, z: jeon.mesh.position.z, ry: jeon.mesh.rotation.y, r: jeon.collider.r };
  await ctx.fade?.(true);
  const a = buildArena(world, arena), g = a.group;
  for (const n of arena.names || []) nameBoard(g, n.text, n.x, n.z, { ry: n.ry || 0 });
  const j0 = a.at(...jeonAt), s0 = a.at(...start);
  world.moveNpc('jeonbongjun', j0.x, j0.z, Math.PI);
  placePlayer(world, [s0.x, s0.z]);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.05, 28), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.visible = false; world.level.add(ring);
  const st = stage({ ctx, a, g, jeon });
  await ctx.fade?.(false);
  const face = who => {
    const m = who.getWorldPosition(new THREE.Vector3()), pp = world.player.position;
    who.rotation.y = Math.atan2(pp.x - m.x, pp.z - m.z);
    world.setTalkCamera({ position: m });
  };
  const say = async list => {
    for (const l of list) {
      if (l.who === 'jeonbongjun' && jeon.mesh.visible) face(jeon.mesh); else st.view?.();
      await dialogue.say(l);
    }
  };
  try {
    for (const [i, stop] of stops.entries()) {
      ctx.hud.setCounter(`${i + 1}/${stops.length} ${lines[i].label}`);
      const stand = a.at(...stop.stand);
      await leadWalk(ctx, { id: 'jeonbongjun', path: stop.path.map(q => { const w = a.at(...q); return [w.x, w.z]; }), stand: [stand.x, stand.z], ring, face: stop.face ?? Math.PI, speed: 3.4 });
      st.view = null;
      await stop.show(st);
      await say(lines[i].talk);
      dialogue.close(); world.camMode = 'follow';
      await st.afterTalk?.(i);
    }
    if (onEnd) { await say(onEnd); dialogue.close(); }
  } finally {
    ctx.hud.setCounter(null);
    await ctx.fade?.(true);
    st.dispose?.();
    world.level.remove(ring); a.dispose();
    world.moveNpc('jeonbongjun', home.x, home.z, home.ry); jeon.collider.r = home.r; jeon.mesh.visible = true; jeon.mesh.rotation.x = 0;
    setCarry(jeon.mesh, null);
    placePlayer(world, spot);
    world.camMode = 'follow'; world.snapCamera();
    ctx.input.enabled = false;
    if (!st.keepDark) await ctx.fade?.(false);
  }
}
