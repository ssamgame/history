// 조선편 3장 장면: 여름날 한양. 남쪽 길가의 앙부일구(해시계), 동쪽 보루각의 자격루(물시계), 북서쪽 서운관 마당의 측우기와 관천대.
import * as THREE from 'three';
import { surroundings } from '../../kit/terrain.js';
import { curvedHipRoof, hanok, tree, jars } from '../../kit/buildings.js';
import { sceneGround } from '../../kit/terrain.js';
import { mat } from '../../../core/people.js';
import { scatter } from '../../../core/props.js';
import { LOOKS } from '../../../content/characters.js';
import { createWeather } from '../../../core/weather.js';
import { angbuilgu, jagyeongnu, cheugugi, jongmyo, hourAngle, bowlPoint, ANGBU_HOURS } from '../landmarks.js';
import { addSigns } from '../common.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { labelSprite } from '../../kit/play.js';

// 12지신 동물 그림 아래에 괄호로 작게 시각 이름(2026-10-29 선생님). 좁은 네모 표라 이웃 칸과 겹치지 않는다
const HOUR_TAGS = [['🐰', '묘시'], ['🐲', '진시'], ['🐍', '사시'], ['🐴', '오시'], ['🐑', '미시'], ['🐵', '신시'], ['🐔', '유시']];
function hourTag([emoji, name]) {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 140;
  const c = cv.getContext('2d');
  c.fillStyle = 'rgba(239,227,198,0.95)'; c.fillRect(0, 0, 128, 140);
  c.strokeStyle = '#6b4a32'; c.lineWidth = 6; c.strokeRect(3, 3, 122, 134);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = '68px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif'; c.fillText(emoji, 64, 56);
  c.font = 'bold 28px "Nanum Myeongjo", Batang, serif'; c.fillStyle = '#231c14'; c.fillText(`(${name})`, 64, 118);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sp.scale.set(0.2, 0.22, 1); return sp;
}

export function buildJ3Scene(world) {
  const L = world.level;
  const mk = (geo, color, x, y, z, parent = L, cast = true) => {
    const m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
  };
  const hipRoof = (w, d, h, color, x, y, z, parent = L) => curvedHipRoof(parent, w, d, h, color, x, y, z); // 처마가 들린 곡선 기와지붕
  world.bounds = { x0: -25, x1: 15, z0: -12, z1: 11 };

  // 땅: 흙길(남쪽)과 박석 마당(북쪽)
  let hillH = () => 0;
  {
    hillH = sceneGround(L, { bounds: world.bounds, margin: 9, color: 0x5c7a4d, size: 180 }); // 바깥은 언덕과 먼 산
    mk(new THREE.BoxGeometry(34, 0.06, 16), 0xa59c8a, 0, 0.03, -8, L, false);
    mk(new THREE.BoxGeometry(50, 0.05, 5), 0x8f7556, -5, 0.025, 5, L, false); // 동서로 난 흙길(앙부일구가 선 길가)
    mk(new THREE.BoxGeometry(5, 0.05, 12), 0x8f7556, 0, 0.025, 6, L, false);
  }

  // 1) 길가의 앙부일구 (종묘 앞 길가에 두었다): 두 단 돌받침, 십자 받침, 네 다리, 시각선을 새긴 청동 그릇
  // 크게 만든 앙부일구(D-23): 그릇 안에 그림자 바늘의 그림자(검은 줄)가 시각선을 따라 움직인다
  const DIAL = [-8, 5];
  const dial = angbuilgu(); dial.position.set(DIAL[0], 0, DIAL[1]); dial.scale.setScalar(2.6); L.add(dial); // D-30 S-01: 더 크게
  world.addCollider({ x: DIAL[0], z: DIAL[1], r: 3 });
  // 그릇 테두리 안쪽의 동물 그림과 시각 이름(묘시~유시). 시각 칸을 누르는 동안에는 숨기고 누르는 단추가 그 자리에 뜬다
  const hourTags = [];
  for (let k = 0; k < ANGBU_HOURS; k++) {
    const t = hourTag(HOUR_TAGS[k]);
    const q = bowlPoint(hourAngle(k), 0.28); t.position.set(q.x * 0.86, q.y + 0.1, q.z * 0.86); dial.add(t); hourTags.push(t);
  }
  // 그림자: 그릇 바닥 가운데에서 안쪽 벽을 따라 테두리 가까이까지 뻗는 검은 띠(그룹을 돌리면 그 방위각 쪽으로). 끝으로 갈수록 넓어진다
  const shadow = new THREE.Group(); dial.add(shadow);
  { const pos = [], idx = [], N = 14;
    for (let i = 0; i <= N; i++) {
      const e = Math.PI / 2 - 0.08 - (Math.PI / 2 - 0.08 - 0.3) * (i / N), p = bowlPoint(0, e).multiplyScalar(1), half = 0.04 + 0.07 * (i / N);
      const r = 0.97; // 그릇 면보다 살짝 안쪽
      const x = p.x * r, y = 2.25 + (p.y - 2.25) * r, z = p.z * r;
      pos.push(x - half, y, z, x + half, y, z);
      if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x0c0a08, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }));
    shadow.add(m); }

  // 2) 보루각과 자격루: 물항아리 계단, 나무 인형 상자, 종과 북
  const hallG = new THREE.Group(); hallG.position.set(9, 0, -4); L.add(hallG);
  mk(new THREE.BoxGeometry(10, 0.6, 7), 0xb3ada2, 0, 0.3, 0, hallG);
  for (const dx of [-4.5, -1.5, 1.5, 4.5]) for (const dz of [-3, 3]) mk(new THREE.CylinderGeometry(0.2, 0.2, 3.4, 8), 0xa8392b, dx, 2.3, dz, hallG);
  mk(new THREE.BoxGeometry(9.8, 0.35, 6.8), 0x2f6b5e, 0, 4.1, 0, hallG);
  hipRoof(12.5, 9, 2.2, 0x3d4846, 0, 4.25, 0, hallG);
  const clock = jagyeongnu(); clock.position.set(-0.4, 0.6, 0); clock.scale.setScalar(0.95); hallG.add(clock);
  const puppets = clock.userData.puppets;
  world.addCollider({ x: 9, z: -4, r: 5.2 });

  // 3) 서운관 마당: 돌 측우대 위의 측우기, 하늘을 살피는 관천대
  const GAUGE = [-7, -8];
  const gauge = cheugugi(); gauge.position.set(GAUGE[0], 0, GAUGE[1]); L.add(gauge);
  world.addCollider({ x: GAUGE[0], z: GAUGE[1], r: 1.6 });
  // 측우기 크게 보기(D-23): 쇠 원통을 비쳐 보이게 하고, 안에 고이는 빗물과 옆의 자(눈금 1~6)를 보인다
  // D-30 S-04: 측우기 속 크게 보기 — 앞쪽 반을 잘라 낸 쇠 원통(단면), 안쪽 벽의 눈금 1~6, 차오르는 빗물
  const section = new THREE.Group(); section.visible = false; gauge.add(section);
  const ironM = new THREE.MeshLambertMaterial({ color: 0x4a4a48, side: THREE.DoubleSide });
  { const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.72, 24, 1, true, Math.PI / 2, Math.PI), ironM); shell.position.y = 1.35; section.add(shell);
    const inside = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.72, 24, 1, true, Math.PI / 2, Math.PI), new THREE.MeshLambertMaterial({ color: 0xbdb6a6, side: THREE.BackSide })); inside.position.y = 1.35; section.add(inside); // 밝은 안쪽 벽(눈금이 잘 보이게)
    for (const sx of [-1, 1]) { const cut = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.72, 0.02), ironM); cut.position.set(sx * 0.2, 1.35, 0); section.add(cut); } // 잘린 가장자리
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24, Math.PI, Math.PI), ironM); bottom.rotation.x = -Math.PI / 2; bottom.position.y = 0.995; section.add(bottom);
    for (let n = 1; n <= 6; n++) { // 눈금: 안쪽 뒷벽에 가로줄
      const tk = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.012, 0.01), new THREE.MeshBasicMaterial({ color: 0x2a221a })); tk.position.set(0, 1.0 + n * 0.12, -0.17); section.add(tk);
      for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.016, 0.03), new THREE.MeshBasicMaterial({ color: 0xf4ead2 })); e.position.set(sx * 0.215, 1.0 + n * 0.12, 0.012); section.add(e); } // 잘린 가장자리에도 눈금(물 앞에서도 보이게)
    } }
  const water = new THREE.Group(); water.visible = false; gauge.add(water);
  { const wm = new THREE.MeshLambertMaterial({ color: 0x6fb6e4, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
    const half = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1, 24, 1, false, Math.PI / 2, Math.PI), wm); half.position.y = 0.5; water.add(half);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 1), wm); face.position.y = 0.5; water.add(face); }
  water.position.y = 1.0; water.scale.y = 0.001;
  const ironHidden = [];
  mk(new THREE.BoxGeometry(3, 2.4, 3), 0x8c8577, -12, 1.2, -10);
  for (let i = 0; i < 4; i++) { const h = 0.6 * (i + 1); mk(new THREE.BoxGeometry(0.9, h, 0.6), 0xa59c8a, -10.1, h / 2, -7.3 - i * 0.6); } // 오르는 돌계단
  world.addCollider({ x: -12, z: -10, r: 2 });

  // 길가 초가와 나무(한양 길가 마을)
  for (const [x, z, ry] of [[-12, 14.5, Math.PI], [-4, 15, Math.PI], [16, 9, -Math.PI / 2], [16, 3, -Math.PI / 2]]) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; L.add(g); hanok(g, {}); }
  for (const [x, z] of [[-12, 9], [9, 10], [12, -14]]) {
    const g = new THREE.Group(); g.position.set(x, 0, z); L.add(g); tree(g, { x, z, color: 0x4f7344 });
    world.addCollider({ x, z, r: 0.5 });
  }
  { const g = new THREE.Group(); g.position.set(-15.5, 0, 13); g.rotation.y = 0.4; L.add(g); jars(g, { n: 5 }); } // 길가 집의 장독대
  scatter(world, { kind: 'pine', count: 40, area: { x0: -60, x1: 60, z0: -50, z1: -18 }, seed: 71, ground: hillH, scale: [1.1, 1.7] });
  scatter(world, { kind: 'grass', count: 80, area: { x0: -15, x1: 15, z0: 0, z1: 12 }, avoid: [{ x: -8, z: 5, r: 2 }, { x: 0, z: 6, r: 3 }, { x: 0, z: 5, r: 2.6 }, { x: -12, z: 9, r: 1.2 }, { x: 9, z: 10, r: 1.2 }], seed: 72, color: 0x7a9450 });

  // 4) 종묘 정전: 북서쪽에 남쪽을 바라보고 옆으로 길게 선 사당
  const shrine = jongmyo(13); shrine.position.set(-34, 0, -10.5); L.add(shrine);
  for (let x = -25; x <= -17; x += 2) world.addCollider({ x, z: -2, r: 1.2 });
  scatter(world, { kind: 'pine', count: 30, area: { x0: -80, x1: -50, z0: -40, z1: 40 }, seed: 73, ground: hillH, scale: [1.1, 1.7] });

  // 건물 간판(C-03): 길 위 안내판은 없애고, 보루각 처마 아래에 이름만(기둥 앞, 낮은 카메라에서 보이게)
  addSigns(world, [{ id: 'plaqueBorugak', title: '보루각', x: 9, z: 0.6, ry: 0, plaque: { y: 3.75, back: 1.12 } }]);

  // 남쪽 문(시작 장면): 짧은 담 사이 나무 문, 길옆 「한양」 이름판
  const GATE_Z = 12.2;
  for (const sx of [-1, 1]) {
    mk(new THREE.BoxGeometry(4.2, 1.1, 0.6), 0x8c8577, sx * 4.2, 0.55, GATE_Z);
    mk(new THREE.BoxGeometry(4.5, 0.22, 0.9), 0x3d4846, sx * 4.2, 1.2, GATE_Z);
    mk(new THREE.BoxGeometry(0.34, 2.4, 0.34), 0x5a3f2a, sx * 2.05, 1.2, GATE_Z);
  }
  const gate = gateLeaves(L, { x: 0, z: GATE_Z, width: 3.7, height: 2, color: 0x6b4a32, inward: 1 });
  nameBoard(L, '한양', 2.8, 10.2); // 조선의 도읍(S24)

  world.addNpc('commoner', LOOKS.commoner, -3.6, 6.8, Math.PI * 0.8);
  world.addNpc('jangyeongsil', LOOKS.jangyeongsil, 4.5, -1.5, -Math.PI / 2);
  world.addNpc('crownPrince', LOOKS.crownPrince, -3.5, -9, -Math.PI * 0.4);

  const rain = createWeather(world, 'rain', { count: 700 });
  rain.points.visible = false;
  let ring = 0;
  world.onUpdate((dt, t) => {
    if (ring > 0) {
      ring -= dt;
      puppets.forEach((p, k) => { p.position.y = 2.8 + (ring > 0 ? Math.max(0, Math.sin(t * 6 - k * 2)) * 0.25 : 0); });
    }
  });

  surroundings(world, { bounds: world.bounds, houses: 'tile', trees: ['pine', 'tree'], count: 10, seed: 13 }); // 걷는 곳 바깥에 그 장소다운 집·나무(깊이감)
  // 부드럽게 바꾸기: seconds 동안 f(k)를 0→1로 부르고 끝나면 풀리는 약속
  const tween = (seconds, f) => new Promise(resolve => { let k = 0; const off = world.onUpdate(dt => { k = Math.min(1, k + dt / seconds); f(k); if (k >= 1) { off(); resolve(); } }); });
  return {
    start: [0, 9], introFrom: [0, 15], gate, dial, gauge, clock, shadow, rain, tween,
    dialAt: DIAL, gaugeAt: GAUGE, gaugeStand: [GAUGE[0], GAUGE[1] + 4],
    // 다가가 살펴보는 자리(C-05): 앙부일구·보루각·측우기 바로 앞(학생 쪽)
    dialFront: { x: DIAL[0], z: DIAL[1] + 3.6 }, dialStand: [DIAL[0], DIAL[1] + 3.8],
    clockFront: { x: 9, z: 1.8 }, gaugeFront: { x: GAUGE[0], z: GAUGE[1] + 2.4 },
    setRain(on) { rain.points.visible = on; },
    ringClock() { ring = 3; },
    showHourTags(on) { hourTags.forEach(t => { t.visible = on; }); },
    // 시각 칸 k를 누르는 단추 자리(테두리 바로 안쪽, 세계 좌표)
    hourPoint(k) { dial.updateWorldMatrix(true, false); return dial.localToWorld(bowlPoint(hourAngle(k), 0.16)); },
    // 해가 움직여 그림자가 시각 칸 k를 가리키게 된다
    moveShadow(k) {
      const a0 = shadow.rotation.y, a1 = hourAngle(k);
      shadow.userData.hour = k;
      return tween(1.2, f => { shadow.rotation.y = a0 + (a1 - a0) * f * f * (3 - 2 * f); });
    },
    // 측우기 속 크게 보기: 커지고, 앞쪽 반을 잘라 낸 단면과 눈금이 보인다
    showGauge(on) {
      gauge.scale.setScalar(on ? 3 : 1); section.visible = water.visible = on;
      if (!on) { water.scale.y = 0.001; gauge.userData.level = 0; }
      if (on) gauge.children.forEach(o => { if (o.isMesh && o.position.y >= 0.99 && o.visible) { o.visible = false; ironHidden.push(o); } });
      else ironHidden.splice(0).forEach(o => { o.visible = true; });
    },
    // 눈금 n 옆 단추 자리(세계 좌표)
    tickPoint(n) { gauge.updateWorldMatrix(true, false); return gauge.localToWorld(new THREE.Vector3(0.42, 1.0 + n * 0.12, 0)); },
    // 빗물이 lv 눈금까지 차오른다(처음부터)
    async fillGauge(lv) {
      gauge.userData.level = lv; gauge.userData.filling = true;
      await tween(2.2, k => { water.scale.y = Math.max(0.001, lv * 0.12 * k); });
      gauge.userData.filling = false;
    },
  };
}
