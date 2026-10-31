// 화면 속 시각 오류 감지기(개발·점검용, 학생 화면에는 들어가지 않는다).
// 실제 게임의 장면(world.level)을 그대로 읽어 매 프레임 사람·말·든 물건·화면 단추를 살피고, 이상한 점을 events에 남긴다.
// - tools/qa/run.cjs가 페이지에 넣어 쓴다(window.__qaAuto = true면 window.__world를 찾아 스스로 돈다. 결과는 window.__qa)
// - tests/qa-probe.test.js는 createProbe(world)를 직접 불러 일부러 만든 오류를 잡는지 확인한다
// 감지 항목(kind): torso·head(몸통·머리가 비어 투명해 보임) · seeThrough(반투명 재질) · sunk(발이 땅에 묻힘) · overlap(사람끼리 겹침)
//   · horseOverlap · rider(기수가 안장에서 벗어남) · hand(든 물건이 손에서 떨어짐) · glide(다리를 움직이지 않고 미끄러져 감)
//   · jump(한 프레임에 크게 순간이동) · nan(위치·각도가 숫자가 아님) · uiOff(단추가 화면 밖) · uiCovered(단추가 다른 판에 덮임)
// 무게(severity): error(그대로 보이면 틀린 화면) · warn(장면 연출일 수도 있어 사람이 사진으로 본다: 순간이동·겹침·묻힘·미끄러짐·화면 단추)
// 판정은 일부러 넉넉하게 잡는다: 걸음·카메라·조명에 따른 정상적인 흔들림은 잡지 않고, 눈에 띄는 오류만 잡는다.
// 걸음의 자연스러움·악수의 어색함 같은 것은 숫자로 판정하지 않는다(사진·영상을 사람이 본다).
import * as THREE from 'three';

const ARM_LEN = 0.78; // core/interact.js와 같은 팔 길이(어깨에서 손끝까지, 사람 크기 1일 때)
export const LIMITS = { sunk: 0.12, handSec: 1, overlap: 0.42, horseOverlap: 0.9, riderOff: 0.35, hand: 0.6, glideSpeed: 0.35, glideSec: 0.6, jumpSpeed: 25, jumpDist: 2.5, riderSec: 0.6 };

const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), box = new THREE.Box3(), down = new THREE.Vector3(0, -1, 0);
const shown = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
export const SEVERITY = { torso: 'error', head: 'error', seeThrough: 'error', nan: 'error', rider: 'error', hand: 'error' }; // 나머지는 warn
const isPerson = o => !!(o.userData && o.userData.legs && o.userData.arms && o.userData.upper);
const bad = v => !Number.isFinite(v.x) || !Number.isFinite(v.y) || !Number.isFinite(v.z);

export function createProbe(world, { ui = null, label = () => '', limits = {} } = {}) {
  const L = { ...LIMITS, ...limits };
  const events = [], seen = new Map(), ids = new WeakMap(), track = new WeakMap();
  const stats = { frames: 0, t: 0, people: 0, horses: 0, kinds: {} };
  let nid = 0, grounds = [], groundAt = -Infinity, lastLevelCount = -1, slow = 0;
  const ray = new THREE.Raycaster();

  const idOf = o => {
    if (ids.has(o)) return ids.get(o);
    let id = null;
    for (const [k, n] of world.npcs || []) if (n.mesh === o) id = k;
    if (o === world.player) id = 'player';
    id = id || `p${++nid}`; ids.set(o, id); return id;
  };
  // 같은 사람·같은 종류는 처음 한 번만 새 사건으로 남기고 그 뒤로는 횟수만 센다(사진이 쏟아지지 않게)
  const report = (kind, o, detail) => {
    const who = o ? idOf(o) : '-', key = `${kind}|${who}`;
    stats.kinds[kind] = (stats.kinds[kind] || 0) + 1;
    if (seen.has(key)) { seen.get(key).count += 1; return; }
    const p = o ? o.getWorldPosition(v1) : null;
    const e = { t: +stats.t.toFixed(2), scene: label(), kind, severity: SEVERITY[kind] || 'warn', who, at: p ? p.toArray().map(x => +x.toFixed(2)) : null, detail, count: 1 };
    seen.set(key, e); events.push(e); snap(e);
  };
  // 그 순간의 3D 화면(렌더러 캔버스)을 작게 떠 둔다. 감지기는 게임이 그린 뒤에 돌므로 방금 그린 그림이 남아 있다(글자판 같은 화면 단추는 빠진다)
  let snaps = 0;
  const snap = e => {
    const cv = world.renderer?.domElement; if (!cv || !cv.width || snaps >= 30 || typeof document === 'undefined') return;
    try { const c = document.createElement('canvas'); c.width = 500; c.height = Math.round(500 * cv.height / cv.width); c.getContext('2d').drawImage(cv, 0, 0, c.width, c.height); e.snap = c.toDataURL('image/jpeg', 0.7); snaps += 1; } catch { /* 그릴 수 없는 캔버스 */ }
  };

  // 땅으로 볼 만한 넓은 판(지형·마당·축대 윗면). 사람·말 속 조각과 InstancedMesh(풀·나무)는 뺀다. 장면이 바뀌면 다시 모은다
  const collectGrounds = () => {
    grounds = [];
    world.level.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || !shown(o)) return;
      for (let p = o; p; p = p.parent) if (isPerson(p) || p.userData?.horse) return;
      // 지형(PlaneGeometry)과 납작한 판(마당·축대 윗면)만. 여러 사람·소품을 합친 덩어리(BufferGeometry)는 땅이 아니다
      const t = o.geometry.type; box.setFromObject(o);
      if (box.max.x - box.min.x > 5 && box.max.z - box.min.z > 3 && (t === 'PlaneGeometry' || (t === 'BoxGeometry' && box.max.y - box.min.y < 1.6))) grounds.push(o);
    });
  };
  const groundY = (x, y, z) => { ray.set(v2.set(x, y + 0.6, z), down); ray.far = 3; const h = ray.intersectObjects(grounds, false)[0]; return h ? h.point.y : null; };
  // 그 점을 감싸는(보이고 불투명한) 조각이 있는가
  const covered = (root, pt, skip = null) => {
    let hit = false;
    root.traverse(o => { if (hit || !o.isMesh || (skip && skip(o)) || !shown(o)) return; const m = o.material; if (m && m.transparent && m.opacity < 0.5) return; box.setFromObject(o).expandByScalar(0.03); if (box.containsPoint(pt)) hit = true; });
    return hit;
  };
  const inside = (o, root) => { for (let p = o; p; p = p.parent) if (p === root) return true; return false; };

  function tick(dt) {
    stats.frames += 1; stats.t += dt;
    const people = [], horses = [];
    world.level.traverse(o => { if (isPerson(o) && shown(o)) people.push(o); else if (o.userData?.horse && shown(o)) horses.push(o); });
    if (world.player && shown(world.player) && !people.includes(world.player)) people.push(world.player);
    stats.people = Math.max(stats.people, people.length); stats.horses = Math.max(stats.horses, horses.length);
    const levelChanged = world.level.children.length !== lastLevelCount; lastLevelCount = world.level.children.length;
    // 매 프레임: 숫자 오류, 순간이동, 미끄러짐
    for (const p of people) {
      const u = p.userData, w = p.getWorldPosition(new THREE.Vector3());
      if (bad(w) || !Number.isFinite(p.rotation.y)) { report('nan', p, 'position/rotation'); continue; }
      const T = track.get(p);
      if (T && dt > 0 && dt < 0.1 && !levelChanged) {
        const sp = Math.hypot(w.x - T.x, w.z - T.z) / dt;
        if (sp > L.jumpSpeed && sp * dt > L.jumpDist) report('jump', p, `${(sp * dt).toFixed(2)}m in one frame`);
        else if (!u.mounted && !u.noWalk && p !== world.player) { // 걷는 다리 없이 움직이면 미끄러져 보인다
          const legsMove = (u.stride || 0) > 0.15 || !!u.act;
          T.glide = sp > L.glideSpeed && !legsMove ? (T.glide || 0) + dt : 0;
          if (T.glide > L.glideSec) report('glide', p, `${sp.toFixed(2)}m/s without stepping`);
        }
      }
      track.set(p, { x: w.x, z: w.z, glide: T?.glide || 0, hand: T?.hand || 0, ride: T?.ride || 0 });
    }
    // 4번에 한 번(무거운 검사): 몸통·머리, 땅, 겹침, 기수, 든 물건
    if ((slow = (slow + 1) % 4) !== 0) return;
    if (stats.t - groundAt > 2 || levelChanged) { collectGrounds(); groundAt = stats.t; }
    for (const p of people) {
      const u = p.userData;
      if (p === world.player && u.head?.isObject3D && (!shown(u.head) || world.camera.position.distanceTo(u.head.getWorldPosition(v1)) < 0.9)) continue; // 1인칭(몸을 숨기고 눈 자리에 카메라를 둔 학생, 고려 5장 서가)
      p.updateWorldMatrix(true, true);
      // 몸통: 가슴 높이 한 점을 덮는 조각이 있어야 한다(말 탄 사람의 몸통이 비던 오류). 팔은 빼고 본다
      const chest = u.upper.localToWorld(v1.set(0, 0.37, 0)).clone(); // 몸통 관절(허리, 1.05) 위 가슴: 앉거나(조선 2장 세종) 숙여도 따라간다
      if (!covered(p, chest, o => inside(o, u.arms[0]) || inside(o, u.arms[1]) || inside(o, u.head))) report('torso', p, 'nothing covers the chest');
      // 머리: 머리 자리를 덮는 조각(장면 굳히기가 사람 조각을 사람 바로 아래로 합친 경우도 있어 사람 전체에서 찾는다)
      if (u.head?.isObject3D) { const noArms = o => inside(o, u.arms[0]) || inside(o, u.arms[1]), hc = u.head.localToWorld(v1.set(0, 0.45, 0)).clone(), hp = u.head.getWorldPosition(new THREE.Vector3()); if (!covered(p, hc, noArms) && !covered(p, hp, noArms)) report('head', p, 'head is empty'); }
      p.traverse(o => { const m = o.material; if (o.isMesh && shown(o) && m?.transparent && m.opacity < 0.9 && m.opacity > 0 && m.type !== 'MeshBasicMaterial' && m.blending !== THREE.AdditiveBlending && m.depthWrite !== false) report('seeThrough', p, `${o.name || o.geometry.type} opacity ${o.material.opacity}`); });
      // 발: 신발 바닥이 땅보다 많이 아래면 묻힌 것(탄 사람·앉은 사람은 뺀다)
      if (!u.mounted && grounds.length) {
        let low = Infinity, sx = 0, sz = 0;
        p.traverse(o => { if (o.name === 'shoe' && shown(o)) { box.setFromObject(o); if (box.min.y < low) { low = box.min.y; sx = (box.min.x + box.max.x) / 2; sz = (box.min.z + box.max.z) / 2; } } });
        if (low < Infinity) { const gy = groundY(sx, low, sz); if (gy != null && gy - low > L.sunk) report('sunk', p, `${(gy - low).toFixed(2)}m under ground`); }
      }
      // 기수: 말 몸통 안에 있고 안장 위(말 등 높이)에 앉아 있어야 한다
      if (u.mounted) {
        const h = u.mounted, hw = h.userData.body.getWorldPosition(new THREE.Vector3()), pw = p.getWorldPosition(new THREE.Vector3());
        const up = v2.set(0, 1, 0).applyQuaternion(p.getWorldQuaternion(new THREE.Quaternion())).y;
        const T = track.get(p) || {};
        T.ride = !inside(p, h) && up > 0.8 ? (T.ride || 0) + dt * 4 : 0; // 화살 맞은 기수는 말에서 떨어지며 0.5초 안에 넘어간다(고려 4장): 그보다 오래 서 있을 때만
        if (T.ride > L.riderSec) report('rider', p, 'not attached to its horse');
        else if (inside(p, h) && Math.hypot(pw.x - hw.x, pw.z - hw.z) > L.riderOff * h.scale.x) report('rider', p, 'off the saddle');
      }
      // 든 물건: 손 가까이에 있어야 한다(어깨·등에 멘 것은 뺀다)
      const c = u.carry;
      if (c && c.obj && !['shoulder', 'back', 'flag'].includes(c.style) && !u.act) {
        const ow = c.obj.getWorldPosition(new THREE.Vector3()), s = p.getWorldScale(v2).x;
        const d = Math.min(...u.arms.map(a => a.localToWorld(new THREE.Vector3(0, -ARM_LEN, 0)).distanceTo(ow)));
        const T = track.get(p) || {};
        T.hand = d > L.hand * s + 0.3 * (c.obj.scale?.x || 1) ? (T.hand || 0) + dt * 4 : 0; // 잠깐(한두 프레임) 어긋난 것은 넘긴다
        if (T.hand > L.handSec) report('hand', p, `${d.toFixed(2)}m from the hands`);
      } else if (track.get(p)) track.get(p).hand = 0;
    }
    // 겹침: 서 있는 사람끼리, 말끼리
    const feet = people.filter(p => !p.userData.mounted).map(p => [p, p.getWorldPosition(new THREE.Vector3()), p.getWorldScale(v2).x]);
    for (let i = 0; i < feet.length; i++) for (let j = i + 1; j < feet.length; j++) {
      const [a, pa, sa] = feet[i], [b, pb, sb] = feet[j];
      if (Math.abs(pa.y - pb.y) < 1 && Math.hypot(pa.x - pb.x, pa.z - pb.z) < L.overlap * (sa + sb) / 2) report('overlap', a, `with ${idOf(b)}`);
    }
    const hs = horses.map(h => [h, h.getWorldPosition(new THREE.Vector3()), h.getWorldScale(new THREE.Vector3()).x / 1.3]); // 지도 위에 작게 줄인 말은 그만큼 가까워도 된다
    for (let i = 0; i < hs.length; i++) for (let j = i + 1; j < hs.length; j++) if (hs[i][1].distanceTo(hs[j][1]) < L.horseOverlap * Math.min(hs[i][2], hs[j][2])) report('horseOverlap', hs[i][0], `with horse ${idOf(hs[j][0])}`);
    // 화면 단추: 화면 밖으로 나갔거나 다른 판에 덮였는가(1초에 한 번쯤)
    if (ui && stats.frames % 30 === 0) checkUi();
  }

  // 내려서 볼 수 있는 판(편 고르기 화면 등) 안의 단추는 화면 밖에 있어도 손가락으로 끌어 올려 누를 수 있다
  const scrollable = el => { for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowY; if ((o === 'auto' || o === 'scroll') && p.scrollHeight > p.clientHeight + 1) return true; } return false; };
  function checkUi() {
    const W = innerWidth, H = innerHeight;
    for (const el of ui.querySelectorAll('button, .talkbtn')) {
      const r = el.getBoundingClientRect(); if (!r.width || !r.height || el.disabled || getComputedStyle(el).visibility === 'hidden' || el.closest('[hidden]')) continue;
      const name = (el.textContent || el.className).trim().slice(0, 20);
      if ((r.right > W + 1 || r.bottom > H + 1 || r.left < -1 || r.top < -1) && !scrollable(el)) { reportUi('uiOff', name, `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`); continue; }
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (top && top !== el && !el.contains(top) && !top.contains(el)) reportUi('uiCovered', name, `under ${top.className || top.tagName}`);
    }
  }
  const reportUi = (kind, name, detail) => { const key = `${kind}|${name}`; stats.kinds[kind] = (stats.kinds[kind] || 0) + 1; if (seen.has(key)) { seen.get(key).count += 1; return; } const e = { t: +stats.t.toFixed(2), scene: label(), kind, severity: 'warn', who: name, at: null, detail, count: 1 }; seen.set(key, e); events.push(e); };

  return { tick, events, stats, checkUi, limits: L };
}

// 페이지 안에서 스스로 돌기(run.cjs). 장면 이름은 개발 마당의 __phase, 게임의 장 이름·목표·하는 일에서 짓는다
export function sceneLabel() {
  const t = s => document.querySelector(s)?.textContent?.trim() || '';
  if (window.__phase !== undefined) return `${new URLSearchParams(location.search).get('act') || ''}:${window.__phase}`;
  const ctx = window.__ctx, screen = [...document.querySelectorAll('.screen')].filter(s => !s.hidden).map(s => s.className.replace('screen', '').trim()).pop() || '';
  return [t('.hud-chapter'), ctx?.testHooks?.working || '', screen, (t('.hud-quest') || t('.quest')).slice(0, 30)].filter(Boolean).join(' | ');
}

if (typeof window !== 'undefined' && window.__qaAuto && !window.__qa) {
  window.__qa = { events: [], stats: {}, ready: false };
  const start = () => {
    const world = window.__world;
    if (!world) { setTimeout(start, 200); return; }
    const probe = createProbe(world, { ui: document.body, label: sceneLabel });
    window.__qa = { events: probe.events, stats: probe.stats, ready: true, probe };
    let last = performance.now();
    const loop = now => { const dt = Math.min(0.1, (now - last) / 1000); last = now; try { probe.tick(dt); } catch (e) { probe.events.push({ t: probe.stats.t, scene: sceneLabel(), kind: 'probeError', who: '-', detail: String(e && e.message) }); } requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  };
  start();
}
