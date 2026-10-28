// 조선편 3장 장면: 여름날 한양. 남쪽 길가의 앙부일구(해시계), 동쪽 보루각의 자격루(물시계), 북서쪽 서운관 마당의 측우기와 관천대.
import * as THREE from 'three';
import { surroundings } from '../../kit/terrain.js';
import { curvedHipRoof, hanok, tree, jars } from '../../kit/buildings.js';
import { sceneGround } from '../../kit/terrain.js';
import { mat } from '../../../core/people.js';
import { scatter } from '../../../core/props.js';
import { LOOKS } from '../../../content/characters.js';
import { createWeather } from '../../../core/weather.js';
import { angbuilgu, jagyeongnu, cheugugi, jongmyo } from '../landmarks.js';
import { addSigns } from '../common.js';
import { gateLeaves, nameBoard } from '../../kit/gate.js';
import { labelSprite } from '../../kit/play.js';

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
  const dial = angbuilgu(); dial.position.set(DIAL[0], 0, DIAL[1]); dial.scale.setScalar(2); L.add(dial);
  world.addCollider({ x: DIAL[0], z: DIAL[1], r: 2.4 });
  const shadow = new THREE.Group(); shadow.position.set(0, 1.62, 0); dial.add(shadow);
  { const m = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.02, 0.72), new THREE.MeshBasicMaterial({ color: 0x0c0a08, transparent: true, opacity: 0.9 })); m.position.z = 0.38; m.rotation.x = -0.5; shadow.add(m); } // 바깥쪽 끝이 그릇 벽을 따라 올라간다

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
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 1, 16), new THREE.MeshLambertMaterial({ color: 0x7cc3ea }));
  water.position.set(0, 1.0, 0); water.scale.y = 0.001; water.visible = false; gauge.add(water);
  const ruler = new THREE.Group(); ruler.visible = false; ruler.position.set(0.34, 0, 0); gauge.add(ruler);
  { const st = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.8, 0.03), new THREE.MeshLambertMaterial({ color: 0xd8c9a0 })); st.position.y = 1.38; ruler.add(st);
    for (let n = 1; n <= 6; n++) {
      const tk = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, 0.035), new THREE.MeshBasicMaterial({ color: 0x3a3028 })); tk.position.set(-0.02, 1.0 + n * 0.12, 0.01); ruler.add(tk);
      const lab = labelSprite(String(n), { size: 0.13 }); lab.position.set(0.13, 1.0 + n * 0.12, 0.02); ruler.add(lab);
    } }
  const ironMats = new Map();
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

  // 안내판(볼거리)
  addSigns(world, [
    { id: 'signJongmyo', title: '종묘', x: -21, z: 1.5 },
    { id: 'signDial', title: '앙부일구', x: -11.5, z: 7.5 },
    { id: 'signClock', title: '자격루', x: 2.5, z: -6.5 },
    { id: 'signGauge', title: '측우기', x: -1, z: -10 },
  ]);

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
    start: [0, 9], introFrom: [0, 15], gate, dial, gauge, clock, shadow,
    dialAt: DIAL, gaugeAt: GAUGE, gaugeStand: [GAUGE[0], GAUGE[1] + 7],
    setRain(on) { rain.points.visible = on; },
    ringClock() { ring = 3; },
    // 해가 움직여 그림자가 tile(동물 자리) 쪽을 가리키게 된다
    moveShadow(tile) {
      const a0 = shadow.rotation.y, a1 = Math.atan2(tile.x - DIAL[0], tile.z - DIAL[1]);
      shadow.userData.target = a1;
      return tween(1.2, k => { shadow.rotation.y = a0 + (a1 - a0) * k * k * (3 - 2 * k); });
    },
    showGauge(on) {
      gauge.scale.setScalar(on ? 3 : 1); water.visible = ruler.visible = on;
      if (!on) water.scale.y = 0.001;
      gauge.traverse(o => {
        if (!o.isMesh || o === water || o.parent === ruler || o.parent?.parent === ruler || o.position.y < 1) return;
        if (on && !ironMats.has(o)) { ironMats.set(o, o.material); o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.5; }
        if (!on && ironMats.has(o)) { o.material = ironMats.get(o); ironMats.delete(o); }
      });
    },
    // 빗물이 lv 눈금까지 차오른다(처음부터)
    fillGauge(lv) {
      gauge.userData.level = lv;
      return tween(2, k => { const h = Math.max(0.001, lv * 0.12 * k); water.scale.y = h; water.position.y = 1.0 + h / 2; });
    },
  };
}
