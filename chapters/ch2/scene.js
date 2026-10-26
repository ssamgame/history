// 2장 장면(2026-10-26 시범): 승인된 시안 세트(chapters/goryeo/set.js)와 새 사람(core/figures.js)으로 지은 눈 덮인 흥화진.
// 성안(탐험) · 북쪽 성벽과 사다리 셋(지휘판) · 성 북쪽 눈밭과 세 갈래 길목(호위).
// 움직이는 것(사다리·오르는 거란 병사·성벽 위 병사·구출 무리·호위병·깃발)만 돌려준다. 나머지는 장면 굳히기(core/bake.js)로 합쳐진다.
import * as THREE from 'three';
import { makeSign } from '../../core/signs.js';
import { mat, markerSprite } from '../../core/people.js';
import { LOOKS } from '../../content/characters.js';
import { makeFigure, setAction, FIGURE_LOOKS, crowdLook } from '../../core/figures.js';
import { buildHeunghwaSet, ladder as setLadder, flag as setFlag } from '../goryeo/set.js';
import { useNpcFigure, flatten } from '../kit/ops.js';
import { cart as kitCart, straw as kitStraw } from '../kit/buildings.js';

export const HALF = 12, WALL_H = 4.2;
export const ZONE_X = [8, 0, -8];          // 성벽 지휘판 구역: 성 밖 북쪽에서 볼 때 화면 왼쪽·가운데·오른쪽(카메라가 남쪽을 보므로 +x가 왼쪽)
const LEN = 6.4, TILT = 0.32;
const BASE_Z = -HALF - 1.7 - LEN * Math.sin(TILT);
export const LANE_X = [-6, 0, 6];          // 호위 길목 세 갈래
// 성벽에서 조금 떨어진 눈밭(따라가기 카메라에 성벽·깃발이 걸리지 않게)
const FIELD = { bounds: { x0: -8.5, x1: 8.5, z0: -43.8, z1: -27 }, start: [0, -27.8], safeZ: -29.4, lostZ: -43.2, band: [-36.5, -31] };

// 굳히기(core/bake.js)는 보통 객체·배열만 들여다본다. 프로토타입 없는 객체에 담은 것은 '돌려준 물건'으로 치지 않는다
const hidden = o => ({ fx: Object.assign(Object.create(null), o) });
function seeded(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const smooth = r => r * r * (3 - 2 * r);

export function buildCh2Scene(world) {
  const L = world.level, rand = seeded(11);
  const set = buildHeunghwaSet(world, { ladders: false, northFlags: false });
  world.bounds = { x0: -10.5, x1: 10.5, z0: -10.5, z1: 7 };
  // 성안 부딪힘(집·소품 자리는 시안 세트와 같다)
  for (const [x, z, r] of [[-7, 3, 2.4], [7, -2, 2.4], [-6, -5, 2.4], [8, 7, 2.4], [3.4, 3.3, 0.8], [-2, 8.2, 1.2], [-9.6, 0.6, 1.0], [9.8, -6.5, 1.0], [-1.5, -2.6, 0.9], [5, 0.5, 1.0]]) world.addCollider({ x, z, r });
  const camp = L.getObjectByName('camp'); if (camp) camp.position.z = -12; // 거란 천막을 조금 물려 눈밭(호위 길목)을 비운다
  const fig = (look, x, y, z, ry = 0, parent = L, action = 'idle') => { const f = makeFigure(look); f.position.set(x, y, z); f.rotation.y = ry; setAction(f, action); parent.add(f); return f; };

  // 말 거는 사람: 위치·충돌은 지금 2장 그대로, 몸만 새 사람으로
  world.addNpc('soldier', LOOKS.soldier, 5, 4.5, Math.PI * 0.8); useNpcFigure(world, 'soldier', FIGURE_LOOKS.soldier);
  world.addNpc('yanggyu', LOOKS.yanggyu, -3, -7, 0); useNpcFigure(world, 'yanggyu', { ...LOOKS.yanggyu, job: 'soldier', add: ['armor'] });
  world.addNpc('villager', LOOKS.villager, -8, 5.5, Math.PI * 0.6); useNpcFigure(world, 'villager', FIGURE_LOOKS.commoner);
  world.addSpot('signHeunghwa', makeSign('흥화진'), 0.5, 2);
  world.addSpot('signNaju', makeSign('현종의 피란'), 3, -5.5);
  // 서 있는 사람(굳혀진다): 성안 백성·일꾼, 성벽 위 망보는 병사
  fig(crowdLook('commonerWoman', 1), -3.5, 0, 4.2, 0.4); fig(crowdLook('artisan', 1), 2.4, 0, 6.2, -0.6);
  fig(crowdLook('soldier', 3), -HALF - 0.8, WALL_H + 0.14, -4, -Math.PI / 2); fig(crowdLook('soldier', 4), HALF + 0.8, WALL_H + 0.14, -6, Math.PI / 2);

  // ── 지휘판: 구역 글자 자리, 성벽 위 병사 넷, 구역마다 사다리(보통·큰 것)와 세우는·오르는 거란 병사 ──
  const zones = ZONE_X.map(x => { const a = new THREE.Object3D(); a.position.set(x, WALL_H + 0.4, -HALF - 1.2); L.add(a); return a; });
  // 움직이는 사람도 팔다리 대신 몸 전체로 움직이므로(밀 때 앞으로 기울기·오를 때 오르내림) 조각을 합쳐 그리기 수를 줄인다(flatten)
  const defenders = [1, 2, 3, 4].map(i => { const f = flatten(fig(crowdLook('soldier', i), 0, WALL_H + 0.14, -HALF - 0.6, Math.PI)); f.visible = false; return f; });
  const ladders = ZONE_X.map((x, i) => {
    const group = new THREE.Group(); group.name = `ladder${i}`; group.position.set(x, 0, BASE_Z); group.visible = false; L.add(group);
    const pivot = new THREE.Group(); pivot.rotation.x = TILT; group.add(pivot);
    const normal = setLadder({ len: LEN }); pivot.add(normal);
    const big = setLadder({ len: LEN }); big.scale.x = 1.8; big.visible = false; pivot.add(big);
    const top = new THREE.Object3D(); top.position.set(0, LEN - 0.3, 0); pivot.add(top);
    const climber = flatten(fig(crowdLook('khitan', 6), 0, 0, 0.3, 0, pivot, 'walk')); climber.visible = false;
    const climber2 = flatten(fig(crowdLook('khitan', 4), 0.4, 0, 0.3, 0, pivot, 'walk')); climber2.visible = false;
    const carrier = flatten(fig(crowdLook('khitan', 2), 1.0, 0, -0.6, 0, group, 'push'));
    const dust = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 1), new THREE.MeshLambertMaterial({ color: 0xdfe3e6, transparent: true, opacity: 0, depthWrite: false }));
    dust.position.set(0, 0.5, 0.2); group.add(dust);
    // 사람·축(pivot)은 굳히기가 들여다보지 않는 상자(hidden)에 둔다: 그러면 굳히기가 사람마다 재질별로 합쳐 그리기 수를 줄인다(움직임은 통째로)
    return { x, group, normal, big, top, dust, len: LEN, tilt: TILT, ...hidden({ pivot, climber, climber2, carrier }) };
  });
  // 파마다 오르는 성벽 위 깃발(처음에는 내려 있다)
  const waveFlags = [-11, 0, 11].map((x, i) => { const f = setFlag({ color: i === 1 ? 0xd9a441 : 0xb8452f }); f.position.set(x, WALL_H + 0.2, -HALF + 0.2); f.scale.y = 0.05; f.visible = false; L.add(f); return f; });
  world.onUpdate((dt, t) => { for (const f of waveFlags) if (f.visible) f.userData.update(dt, t); });
  // 성 밖에 몰려온 거란군(3파 뒤 물러간다)
  const khitanCrowd = new THREE.Group(); khitanCrowd.name = 'khitanCrowd'; L.add(khitanCrowd);
  [[-16, -21], [-19, -23.5], [-14.5, -25], [16, -21], [19, -23.5], [-4, -24.5], [4, -25], [-17.5, -27.5]].forEach(([x, z], i) => fig(crowdLook('khitan', i + 1), x, 0, z, 0, khitanCrowd));
  flatten(khitanCrowd); khitanCrowd.visible = false; // 함께 물러가는 무리: 통째로 한 벌

  // ── 호위 눈밭: 길목 둘(바위·나무 울타리)로 나뉜 세 갈래 길, 안전선 깃발, 길목 호위병, 구출 무리 일곱 ──
  const field = new THREE.Group(); field.name = 'escortField'; L.add(field);
  {
    const [a, b] = FIELD.band;
    for (const bx of [-2.9, 2.9]) {
      for (let z = b; z >= a; z -= 0.9) {
        const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55 + rand() * 0.25, 0), mat(0x9aa0a6, 'stone')); r.position.set(bx + (rand() - 0.5) * 0.3, 0.3, z); r.castShadow = true; field.add(r);
        world.addCollider({ x: bx, z, r: 0.75 });
      }
      for (let z = b; z >= a; z -= 1.8) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.3, 0.16), mat(0x6b4a32, 'wood')); p.position.set(bx, 0.65, z); field.add(p); }
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, a - b + 0.4).translate(0, 0, 0), mat(0x6b4a32, 'wood')); rail.position.set(bx, 1.05, (a + b) / 2); field.add(rail);
    }
    for (const x of [-8.2, 8.2]) { const f = setFlag({ color: 0x2f6b5e, h: 3.4, w: 1.0, ch: 1.3 }); f.position.set(x, 0, FIELD.safeZ); field.add(f); }
    // 들판 가장자리(걷는 곳 밖): 눈 덮인 소나무 줄, 버려진 수레·짚더미, 뒤쪽 거란 진영 나무 울타리. 한데 모아 합쳐 그린다(flatten)
    const deco = new THREE.Group(); field.add(deco);
    const at = (o, x, z, ry = 0) => { o.position.set(x, 0, z); o.rotation.y = ry; deco.add(o); return o; };
    for (const sx of [-1, 1]) for (let z = -27.5; z >= -47; z -= 2.6 + rand() * 1.2) {
      const x = sx * (11 + rand() * 3.5), h = 0.85 + rand() * 0.4, pine = new THREE.Group();
      const c = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.6, 6), mat(0x3e5f4a, 'grass')); c.position.y = 2.4; c.castShadow = true;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.2, 6), mat(0xf2f5f7, 'grain')); cap.position.y = 3.9;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.9, 6), mat(0x6b4a32, 'wood')); trunk.position.y = 0.45;
      pine.add(c, cap, trunk); pine.scale.setScalar(h); at(pine, x, z, rand() * 3);
    }
    for (const [x, z, ry] of [[-10.2, -33.5, 0.5], [10.4, -38, -0.7]]) { const g = new THREE.Group(); kitCart(g, { load: true }); at(g, x, z, ry); }
    for (const [x, z] of [[10.2, -31], [-10.6, -40.5], [9.8, -44]]) { const g = new THREE.Group(); kitStraw(g); g.scale.setScalar(0.8); at(g, x, z); }
    for (let x = -13; x <= 13; x += 1.3) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 1.5, 5), mat(0x6b4a32, 'wood')); p.position.set(x, 0.75, -46.5); p.rotation.z = (rand() - 0.5) * 0.25; p.castShadow = true; deco.add(p);
    }
    { const r = new THREE.Mesh(new THREE.BoxGeometry(26.5, 0.1, 0.1), mat(0x6b4a32, 'wood')); r.position.set(0, 1.1, -46.5); deco.add(r); }
    flatten(deco);
    const line = new THREE.Mesh(new THREE.PlaneGeometry(17, 0.35).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x2f6b5e, transparent: true, opacity: 0.55, depthWrite: false })); line.position.set(0, 0.04, FIELD.safeZ); field.add(line);
  }
  field.visible = false;
  const guards = LANE_X.map(x => {
    const g = flatten(fig(crowdLook('khitan', 3), x, 0, (FIELD.band[0] + FIELD.band[1]) / 2, 0)); g.visible = false;
    const m = markerSprite('✕', '#b8452f'); m.position.set(0, 3.6, 0); m.scale.setScalar(0.9); g.add(m);
    return g;
  });
  const starts = [[-6, -39], [6, -39.5], [-6.5, -38.8], [-2, -40], [2, -39.2], [6.5, -40.2], [0, -39.2]];
  const captives = starts.map((start, i) => {
    const root = new THREE.Group(); root.name = `captives${i}`; root.visible = false; L.add(root);
    const n = i === 6 ? 5 : 3;
    const members = [];
    for (let k = 0; k < n; k++) {
      const look = crowdLook(k % 2 ? 'commonerWoman' : 'commoner', i + k + 1);
      members.push(fig(look, ((k % 3) - 1) * 0.85, 0, Math.floor(k / 3) * 0.9 + (k % 2) * 0.35, 0, root, 'walk'));
    }
    const body = new THREE.Group(); // 무리 전체를 한 벌로: 사람들을 body 묶음에 모아 합친다(무리는 통째로 걷는다)
    for (const m of members) body.add(m);
    root.add(body); flatten(body);
    return { root, start, big: i === 6, ...hidden({ body }) };
  });
  // 몸 전체 움직임: 밀 때 앞으로 기울기, 걷고 오를 때 살짝 오르내림
  world.onUpdate((dt, t) => {
    for (const f of defenders) if (f.visible) { const lean = f.userData.action === 'push' ? -0.32 : 0; f.rotation.x += (lean - f.rotation.x) * Math.min(1, dt * 12); }
    for (const l of ladders) if (l.group.visible) l.fx.carrier.position.y = l.fx.carrier.userData.action === 'carry' ? Math.abs(Math.sin(t * 9)) * 0.08 : 0;
  });

  return {
    set, zones, defenders, ladders, waveFlags, khitanCrowd, field, guards, captives,
    escortField: FIELD,
    // 지휘판 카메라: 성 밖 북쪽에서 성벽을 낮게 비스듬히 본다(사다리가 서 보이고 사람이 크게). 아래쪽 지휘판(화면 아래 약 1/4)에 가리지 않게 아래로 빈 점을 하나 더 넣는다
    wallFit: {
      target: [0, 2.4, -15], dir: [0.3, 0.75, -1],
      points: [[-11, WALL_H + 1.2, -12.4], [11, WALL_H + 1.2, -12.4], ...ZONE_X.flatMap(x => [[x, 0, BASE_Z - 0.6], [x, 0, BASE_Z - 4.2], [x, WALL_H + 2.5, -HALF - 0.6]]), [0, -3, -19]],
      margin: 0.92,
    },
    start: [0, 6],
    explore: { x0: -10.5, x1: 10.5, z0: -10.5, z1: 7 },
  };
}

// ── 지휘판 3D 연출(ops.commandBoard의 scene) ──
export function boardScene(sc) {
  const slots = z => [ZONE_X[z] - 0.65, ZONE_X[z] + 0.65];
  let pushing = new Set();
  return {
    spawn(th) {
      const l = sc.ladders[th.zone];
      l.group.visible = true; l.normal.visible = th.need < 2; l.big.visible = th.need >= 2;
      l.fx.pivot.rotation.x = l.tilt - 1.1; l.fx.climber.visible = false; l.fx.climber2.visible = false; l.fx.carrier.visible = true; l.fx.carrier.position.z = -6;
      setAction(l.fx.carrier, 'carry');
      return { l, need: th.need };
    },
    update(h, phase, k) {
      const l = h.l;
      if (phase === 'warn') { l.fx.carrier.position.z = -6 + 5.4 * smooth(k); l.dust.material.opacity = 0; }
      else if (phase === 'raise') { setAction(l.fx.carrier, 'push'); l.fx.pivot.rotation.x = l.tilt - 1.1 * (1 - smooth(k)); }
      else if (phase === 'climb') {
        l.fx.pivot.rotation.x = l.tilt; l.fx.carrier.visible = false; // 세운 병사는 물러나고 한 명이 오른다
        l.fx.climber.visible = true; l.fx.climber.position.set(0, k * (l.len - 1.6), 0.3); setAction(l.fx.climber, 'walk');
        if (h.need >= 2) { l.fx.climber2.visible = true; l.fx.climber2.position.set(0.45, Math.max(0, k * (l.len - 1.6) - 1.2), 0.3); setAction(l.fx.climber2, 'walk'); }
      } else if (phase === 'push') {
        l.fx.pivot.rotation.x = l.tilt - 1.0 * smooth(k);                 // 사다리가 뒤로 넘어간다
        l.fx.climber.position.y = Math.max(0, l.fx.climber.position.y - 0.12); l.fx.climber2.position.y = Math.max(0, l.fx.climber2.position.y - 0.12); // 오르던 병사는 내려간다(떨어지지 않는다)
        l.dust.material.opacity = 0.5 * (1 - k); l.dust.scale.setScalar(1 + k * 1.6);
        setAction(l.fx.carrier, 'surprise');
      }
    },
    end(h, how) {
      const l = h.l;
      l.group.visible = false; l.fx.climber.visible = false; l.fx.climber2.visible = false; l.dust.material.opacity = 0; l.dust.scale.setScalar(1);
      if (how === 'breach') for (const d of sc.defenders) if (d.visible) setAction(d, 'surprise');
    },
    push(zone) {
      pushing.add(zone);
      setTimeout(() => pushing.delete(zone), 700);
    },
    defenders(counts) {
      let i = 0;
      for (const d of sc.defenders) d.visible = false;
      counts.forEach((n, z) => {
        for (let k = 0; k < n && i < sc.defenders.length; k++, i++) {
          const d = sc.defenders[i]; d.visible = true; d.position.x = slots(z)[k % 2]; setAction(d, pushing.has(z) ? 'push' : 'idle');
        }
      });
    },
  };
}

// 구출 무리 움직임(ops.escort의 scene)
export function escortScene(sc) {
  return {
    animate(i, state, dt) {
      const c = sc.captives[i];
      c.t = (c.t || 0) + dt;
      const moving = state === 'walking' || state === 'follow' || state === 'saved';
      c.fx.body.position.y = moving ? Math.abs(Math.sin(c.t * (state === 'walking' ? 5 : 9))) * 0.07 : 0; // 걸음에 맞춰 오르내린다
    },
    saved() {},
  };
}

// 파 하나를 이겼을 때: 그 파의 깃발이 오른다
export function raiseFlag(sc, i, world) {
  const f = sc.waveFlags[i]; if (!f) return;
  f.visible = true;
  let t = 0;
  const off = world.onUpdate(dt => { t += dt; f.scale.y = 0.05 + 0.95 * smooth(Math.min(1, t / 0.8)); if (t >= 0.8) off(); });
}
