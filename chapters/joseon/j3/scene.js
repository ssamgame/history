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
  const dial = angbuilgu(); dial.position.set(-8, 0, 5); L.add(dial);
  world.addCollider({ x: -8, z: 5, r: 1.3 });

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
  const gauge = cheugugi(); gauge.position.set(-7, 0, -8); L.add(gauge);
  world.addCollider({ x: -7, z: -8, r: 0.9 });
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
    { id: 'signGauge', title: '측우기', x: -9.5, z: -4.5 },
  ]);

  world.addNpc('commoner', LOOKS.commoner, -5.6, 6.2, Math.PI * 0.8);
  world.addNpc('jangyeongsil', LOOKS.jangyeongsil, 3, -2, -Math.PI / 2);
  world.addNpc('crownPrince', LOOKS.crownPrince, -5, -6, -Math.PI * 0.4);

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
  return {
    start: [0, 9], dial, gauge, clock,
    setRain(on) { rain.points.visible = on; },
    ringClock() { ring = 3; },
  };
}
