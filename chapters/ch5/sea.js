// 고려 새 6장 삼별초 마무리의 바다 무대(2026-10-26, docs/superpowers/specs/2026-10-26-ch6-spec.md 2-5·2-6).
// 작업장(가운데)과 떨어진 x 400에 짓는다: 강화도 포구(남쪽 +z) → 진도(용장성 성벽, 가운데) → 제주(항파두리 흙성, 북쪽 -z).
// 노 젓는 배 한 척(삼별초 군사·백성, 앞에 삼별초 지휘관). 옛 6장 장면(chapters/ch6/scene.js)의 배·섬 모양을 참고해 새로 지었다(옛 파일은 그대로).
// 처음엔 숨겨 두고, 삼별초 마무리 때만 보인다(show). 불길·피 없음.
import * as THREE from 'three';
import { mat, makePerson } from '../../core/people.js';
import { LOOKS } from '../../content/characters.js';
import { flatten } from '../kit/ops.js';

export const SEA_X = 400;
const PORT = [0, 40], JINDO = [-6, 2], JEJU = [4, -46];

export function buildSea(world) {
  const root = new THREE.Group(); root.name = 'seaStage'; root.position.x = SEA_X; root.visible = false; world.level.add(root);
  const statics = new THREE.Group(); root.add(statics); // 움직이지 않는 것(섬·성벽·부두·바위)은 끝에 재질별로 합친다
  const mk = (geo, color, x, y, z, parent = statics) => { const m = new THREE.Mesh(geo, mat(color)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  // 바다(물결)
  const seaGeo = new THREE.PlaneGeometry(260, 260, 40, 40); seaGeo.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(seaGeo, new THREE.MeshPhongMaterial({ color: 0x2f7fa6, shininess: 40, flatShading: true }));
  sea.position.y = 0.3; sea.receiveShadow = true; root.add(sea);
  // 강화도 포구: 땅과 나무 부두
  mk(new THREE.BoxGeometry(70, 1.4, 24), 0x6f8a5a, PORT[0], 0, PORT[1] + 14);
  mk(new THREE.BoxGeometry(4, 0.3, 10), 0x8a6a45, PORT[0] + 5, 0.75, PORT[1] + 2);
  // 진도: 섬과 용장성 돌 성벽
  const isl = (x, z, r, h, sx = 1.2, sz = 1) => { const m = mk(new THREE.ConeGeometry(r, h, 12), 0x5a7a4a, x, h / 2 - 1, z); m.scale.set(sx, 1, sz); return m; };
  isl(JINDO[0] - 16, JINDO[1] - 4, 11, 8);
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const s = mk(new THREE.BoxGeometry(2.4, 1.6, 0.9), 0x8c8577, JINDO[0] - 16 + Math.cos(a) * 5, 4.4, JINDO[1] - 4 + Math.sin(a) * 4.5); s.rotation.y = -a + Math.PI / 2; }
  mk(new THREE.BoxGeometry(10, 0.3, 3), 0x8a6a45, JINDO[0] - 7, 0.7, JINDO[1]); // 진도 나루
  // 제주: 큰 섬과 항파두리 흙성
  isl(JEJU[0], JEJU[1] - 26, 30, 11, 1.6, 0.9);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const s = mk(new THREE.BoxGeometry(2.6, 1.4, 1.1), 0x8a7356, JEJU[0] + Math.cos(a) * 8, 6.4, JEJU[1] - 24 + Math.sin(a) * 5); s.rotation.y = -a + Math.PI / 2; }
  for (const [x, z] of [[-16, 12], [14, 20], [-12, -20], [18, -14]]) mk(new THREE.DodecahedronGeometry(1.8, 0), 0x6b6862, x, 0.6, z); // 바위
  // 포구에 남은 사람들(군사·백성), 함께 움직이지 않으니 한 덩어리로
  { const g = new THREE.Group(); for (let i = 0; i < 5; i++) { const p = makePerson(i % 2 ? LOOKS.villager : LOOKS.sambyeolcho); p.position.set(-6 + i * 3, 0.7, PORT[1] + 6 + (i % 2)); p.rotation.y = Math.PI; g.add(p); } statics.add(g); }
  flatten(statics);

  // 노 젓는 배: 몸통 · 돛 · 노 넷(양쪽 둘씩) · 노 젓는 사람 넷 · 앞의 삼별초 지휘관
  const boat = new THREE.Group(); boat.name = 'rowBoat'; root.add(boat);
  const body = new THREE.Group(); boat.add(body);
  mk(new THREE.BoxGeometry(2.4, 0.5, 6.2), 0x6b4a32, 0, 0.1, 0, body);
  for (const sx of [-1, 1]) mk(new THREE.BoxGeometry(0.18, 0.9, 6.8), 0x6b4a32, sx * 1.3, 0.45, 0, body).rotation.z = sx * -0.15;
  mk(new THREE.BoxGeometry(2.7, 0.9, 0.2), 0x6b4a32, 0, 0.45, -3.4, body).rotation.x = 0.5;
  mk(new THREE.BoxGeometry(2.4, 0.1, 6), 0x8a6a45, 0, 0.6, 0, body);
  mk(new THREE.CylinderGeometry(0.09, 0.11, 4.6, 6), 0x5a3f2a, 0, 2.9, -0.6, body);
  { const s = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.6), new THREE.MeshLambertMaterial({ color: 0xe8e2d6, side: THREE.DoubleSide })); s.position.set(0, 3.4, -0.5); body.add(s); }
  for (let i = 0; i < 4; i++) { const p = makePerson(i === 1 ? LOOKS.villager : LOOKS.sambyeolcho); p.scale.setScalar(0.75); p.position.set(i % 2 ? 0.55 : -0.55, 0.6, 1.8 - Math.floor(i / 2) * 1.6); p.rotation.y = Math.PI; p.userData.noWalk = true; body.add(p); }
  flatten(body);
  const leader = makePerson(LOOKS.baejungson); leader.scale.setScalar(0.8); leader.position.set(0, 0.6, -2.2); leader.rotation.y = Math.PI; leader.userData.noWalk = true; boat.add(leader);
  const oars = [];
  for (const sx of [-1, 1]) for (const z of [1.8, 0.2]) {
    const pivot = new THREE.Group(); pivot.position.set(sx * 1.4, 0.8, z); boat.add(pivot);
    const oar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 3.2), mat(0x8a6a45)); oar.position.set(sx * 1.2, -0.3, 0); oar.rotation.z = sx * 0.45; pivot.add(oar);
    oars.push({ pivot, side: sx < 0 ? 'left' : 'right' });
  }
  const spray = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 6), new THREE.MeshLambertMaterial({ color: 0xf2f8fa, transparent: true, opacity: 0, depthWrite: false }));
  spray.position.set(0, 0.5, -3.6); boat.add(spray);

  // 구간: 강화도 → 진도, 진도 → 제주 (무대 안 좌표)
  const legs = [{ from: [PORT[0] + 5, PORT[1] - 4], to: [JINDO[0] - 4, JINDO[1] + 3] }, { from: [JINDO[0] - 2, JINDO[1] - 3], to: [JEJU[0], JEJU[1] + 4] }];
  let leg = legs[0], k = 0, shown = 0, turn = 0, wob = 0;
  const strokeT = { left: 1, right: 1 };
  const place = () => {
    const x = leg.from[0] + (leg.to[0] - leg.from[0]) * shown, z = leg.from[1] + (leg.to[1] - leg.from[1]) * shown;
    boat.position.set(x, 0.35, z);
    boat.rotation.y = Math.atan2(-(leg.to[0] - leg.from[0]), -(leg.to[1] - leg.from[1])) + turn; // 뱃머리(-z)가 가는 쪽을 본다
  };
  const cam = () => {
    const p = boat.position;
    world.setFixedCamera([SEA_X + p.x + 9, 7, p.z + 11], [SEA_X + p.x - 1, 1, p.z - 6]);
  };
  const sp = seaGeo.attributes.position;
  let active = false;
  world.onUpdate((dt, t) => {
    if (!root.visible) return;
    if (world.quality.water === 'waves') { for (let i = 0; i < sp.count; i++) sp.setY(i, Math.sin(sp.getX(i) * 0.15 + t * 1.2) * 0.18 + Math.cos(sp.getZ(i) * 0.2 + t) * 0.12); sp.needsUpdate = true; }
    if (!active) return;
    shown += (k - shown) * Math.min(1, dt * 3);
    turn *= Math.max(0, 1 - dt * 1.5);
    wob += dt;
    for (const o of oars) { strokeT[o.side] = Math.min(1, strokeT[o.side] + dt * 1.6); o.pivot.rotation.y = (o.side === 'left' ? 1 : -1) * Math.sin(strokeT[o.side] * Math.PI) * 0.6; }
    spray.material.opacity = Math.max(0, spray.material.opacity - dt * 1.2);
    place(); boat.position.y = 0.35 + Math.sin(wob * 2) * 0.08;
    cam();
  });
  return {
    root, boat, leader, legs,
    show(on) { root.visible = on; active = on; },
    setLeg(i) { leg = legs[i]; k = 0; shown = 0; turn = 0; place(); cam(); },
    progress(p) { k = p; },
    stroke(side, good) { strokeT[side] = 0; if (!good) turn += side === 'left' ? 0.18 : -0.18; else spray.material.opacity = 0.7; },
    arrive(i) { leg = legs[i]; k = shown = 1; turn = 0; place(); cam(); },
    // 진도 · 제주 컷 카메라
    jindoCam: { pos: [SEA_X + JINDO[0] - 2, 9, JINDO[1] + 14], target: [SEA_X + JINDO[0] - 16, 3, JINDO[1] - 4] },
    jejuCam: { pos: [SEA_X + JEJU[0] + 9, 15, JEJU[1] - 6], target: [SEA_X + JEJU[0], 5, JEJU[1] - 23] }, // 항파두리 흙성이 크게
  };
}
