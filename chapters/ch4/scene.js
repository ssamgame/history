// 4장 장면: 흐린 하늘 아래 다섯 구역 — 압록강 가(저고여 사건), 개경 궁궐 앞, 강화도 해협, 처인성, 충주성. 안개가 서로를 가린다.
import * as THREE from 'three';
import { curvedHipRoof, tree, wall, hanok, boat, straw, woodpile } from '../kit/buildings.js';
import { backdropMountains } from '../kit/terrain.js';
import { groundMaterial } from '../../core/textures.js';
import { mat, makePerson } from '../../core/people.js';
import { scatter } from '../../core/props.js';
import { LOOKS } from '../../content/characters.js';

const JEOGO_X = -78, PALACE_X = 0, GANGHWA_X = 160, MAP_X = 240, CHEOIN_X = 320, CHUNGJU_X = 480;
const CHEOIN_R = 12;     // 처인성 토성 반지름
const SPAWN_R = 34;      // 몽골군이 나타나는 거리
// 당겨 쏘기 갈래(성 가운데에서 본 각도): 0 왼쪽 · 1 가운데(북쪽) · 2 오른쪽 — 남쪽에서 내려다보는 카메라 기준
export const CHEOIN_LANES = [Math.PI * 1.5 - 0.62, Math.PI * 1.5, Math.PI * 1.5 + 0.62];

// 글씨 그림(지도판 이름표·연도)
function labelSprite(text, { size = 46, color = '#2a1e14', bg = 'rgba(242,234,217,.92)', w = 3.6 } = {}) {
  const cv = document.createElement('canvas'), c = cv.getContext('2d');
  c.font = `800 ${size}px sans-serif`;
  cv.width = Math.ceil(c.measureText(text).width) + 40; cv.height = size + 30;
  c.fillStyle = bg; c.fillRect(0, 0, cv.width, cv.height);
  c.font = `800 ${size}px sans-serif`; c.fillStyle = color; c.textBaseline = 'middle'; c.textAlign = 'center'; c.fillText(text, cv.width / 2, cv.height / 2 + 2);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, fog: false }));
  sp.scale.set(w, w * cv.height / cv.width, 1); sp.renderOrder = 5;
  return sp;
}

function seeded(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }

export function buildCh4Scene(world) {
  const L = world.level, rand = seeded(23);
  const mk = (geo, color, x, y, z, parent = L, cast = true) => {
    const m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
  };
  const hipRoof = (w, d, h, color, x, y, z, parent = L) => curvedHipRoof(parent, w, d, h, color, x, y, z); // 처마가 들린 곡선 기와지붕

  // 넓은 풀밭 (강화도 구역은 바다)
  {
    const g = new THREE.PlaneGeometry(720, 220, 140, 44); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, cols = [], c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + 240, z = p.getZ(i);
      let h = 0.12 * Math.sin(x * 0.3) * Math.cos(z * 0.25);
      const far = Math.max(0, Math.abs(z) - 45);
      h += Math.min(far * far * 0.02, 12);
      if (Math.abs(x - GANGHWA_X) < 60 && z < 4) h = -1.2; // 해협
      if (Math.abs(x - PALACE_X) < 16 && z > -12 && z < 18) h = Math.min(h, -0.05); // 궁궐 마당은 평평하게(박석 아래)
      if (Math.abs(x - JEOGO_X) < 34 && z > -20 && z < 14) h = Math.min(h, -0.05); // 압록강 가: 강물과 길이 땅에 묻히지 않게 평평하게
      p.setX(i, x); p.setY(i, h);
      const j = rand() * 0.04;
      c.setRGB(0.36 + j, 0.47 + j, 0.3 + j);
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.computeVertexNormals();
    const t = new THREE.Mesh(g, groundMaterial('grass'));
    t.receiveShadow = true; L.add(t);
  }

  // 0) 압록강 가: 1225년 고려에 왔다가 돌아가던 몽골 사신 저고여가 강가 길에서 누군가에게 죽임을 당한다(누가 했는지는 밝혀지지 않았다).
  const jeogo = {};
  {
    const river = new THREE.Mesh(new THREE.PlaneGeometry(60, 12).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: 0x4f7488, shininess: 40, transparent: true, opacity: 0.92 }));
    river.position.set(JEOGO_X, 0.06, -10); L.add(river);
    mk(new THREE.BoxGeometry(60, 0.04, 3), 0x8f7556, JEOGO_X, 0.03, 2, L, false); // 강가 길
    scatter(world, { kind: 'grass', count: 90, area: { x0: JEOGO_X - 28, x1: JEOGO_X + 28, z0: -4.5, z1: -1 }, seed: 61, scale: [1.1, 1.8], color: 0x7a8a50 }); // 갈대(카메라 앞을 가리지 않게 키를 낮춤)
    scatter(world, { kind: 'pine', count: 14, area: { x0: JEOGO_X - 30, x1: JEOGO_X + 30, z0: 8, z1: 24 }, seed: 62, scale: [1, 1.4] });
    // 강둑의 버드나무와 바위, 강 건너 솔숲과 먼 산(국경의 강가)
    for (const [x, z] of [[-26, -3.6], [-12, -3.4], [14, -3.5], [24, -3.7], [-20, -17], [-4, -17.5], [10, -17], [26, -17.3]]) { const g = new THREE.Group(); g.position.set(JEOGO_X + x, 0, z); g.rotation.y = rand() * 3; L.add(g); tree(g, { kind: 'willow', x, z }); }
    scatter(world, { kind: 'rock', count: 16, area: { x0: JEOGO_X - 30, x1: JEOGO_X + 30, z0: -18, z1: -15 }, seed: 63, scale: [0.6, 1.4] });
    scatter(world, { kind: 'pine', count: 26, area: { x0: JEOGO_X - 40, x1: JEOGO_X + 40, z0: -40, z1: -20 }, seed: 64, scale: [1, 1.6] });
    backdropMountains(L, { center: [JEOGO_X, 0], radius: 75, color: 0x5f7050, seed: 3 });
    const ENVOY = { robe: 0x8a6a2a, hat: 'fur', trim: 0xd9a441, face: { eyes: 'stern', brows: 'stern', mouth: 'flat', beard: 'mustache' } };
    const SHADOW = { robe: 0x2a2622, hat: 'topknot', trim: 0x1e1a16, face: { eyes: 'stern', brows: 'stern', mouth: 'flat' } };
    const envoy = makePerson(ENVOY), aide = makePerson(LOOKS.mongol);
    envoy.rotation.order = aide.rotation.order = 'YXZ';
    const shadows = [0, 1, 2].map(() => { const m = makePerson(SHADOW); m.visible = false; L.add(m); return m; });
    L.add(envoy, aide);
    const reset = () => {
      envoy.position.set(JEOGO_X - 16, 0, 2); envoy.rotation.set(0, Math.PI / 2, 0);
      aide.position.set(JEOGO_X - 18, 0, 2.6); aide.rotation.set(0, Math.PI / 2, 0); aide.visible = true;
      shadows.forEach((m, i) => { m.visible = false; m.position.set(JEOGO_X + 2 + i * 1.3, 0, -3.5); });
    };
    reset();
    jeogo.cam = { pos: [JEOGO_X + 2, 5.5, 13], target: [JEOGO_X - 2, 1, -1] };
    jeogo.start = [JEOGO_X, 6];
    // 장면 한 번(약 7초): 사신이 강가 길을 걷다가, 갈대숲에서 나온 사람들에게 쓰러지고, 그 사람들은 사라진다
    jeogo.play = () => new Promise(resolve => {
      reset();
      let t = 0;
      const off = world.onUpdate(dt => {
        t += dt;
        if (t < 3.2) { envoy.position.x += dt * 3.4; aide.position.x += dt * 3.4; }
        if (t >= 2.2 && t < 3.6) shadows.forEach((m, i) => { // 갈대숲에서 뛰어나온다
          m.visible = true;
          const tx = envoy.position.x + 1.2 - i * 1.1, tz = 0.6 + i * 0.4;
          m.position.x += (tx - m.position.x) * Math.min(1, dt * 4); m.position.z += (tz - m.position.z) * Math.min(1, dt * 4);
          m.rotation.y = Math.atan2(envoy.position.x - m.position.x, envoy.position.z - m.position.z);
        });
        if (t >= 2.4 && t < 4) { aide.position.x -= dt * 7; aide.rotation.y = -Math.PI / 2; if (t > 3.6) aide.visible = false; } // 수행원은 달아난다
        if (t >= 3.6) envoy.rotation.x = -1.45 * Math.min(1, (t - 3.6) / 0.6); // 사신이 쓰러진다
        if (t >= 4.4) shadows.forEach(m => { m.rotation.y = 0; m.position.z -= dt * 6; if (m.position.z < -4) m.visible = false; }); // 갈대숲으로 사라진다
        if (t >= 6.5) { off(); resolve(); }
      });
    });
  }

  // 1) 개경 궁궐 앞: 돌기단, 단청 기둥, 큰 기와지붕
  {
    const x0 = PALACE_X;
    mk(new THREE.BoxGeometry(22, 1.2, 10), 0xa59c8a, x0, 0.6, -12);
    for (let i = 0; i < 4; i++) mk(new THREE.BoxGeometry(8, 0.3, 1), 0xb3ab99, x0, 0.15 + i * 0.3, -6.5 - i * 0.5);
    for (let dx = -9; dx <= 9; dx += 3) mk(new THREE.CylinderGeometry(0.3, 0.3, 4, 8), 0xa8392b, x0 + dx, 3.2, -9);
    mk(new THREE.BoxGeometry(21, 0.45, 8), 0x2f6b5e, x0, 5.3, -12);
    hipRoof(26, 12, 4, 0x3d4846, x0, 5.5, -12);
    world.addCollider({ x: x0 - 6, z: -12, r: 6 }); world.addCollider({ x: x0 + 6, z: -12, r: 6 }); world.addCollider({ x: x0, z: -12, r: 6 });
    for (const sx of [-1, 1]) { // 기와를 얹은 궁궐 담장
      const g = new THREE.Group(); g.position.set(x0 + sx * 15, 0, 2); g.rotation.y = Math.PI / 2; L.add(g); wall(g, { w: 30, h: 2.8, color: 0x9a8c7a });
    }
    // 박석을 깐 마당과 석등 두 개
    mk(new THREE.BoxGeometry(28.6, 0.06, 22), 0xa59c8a, x0, 0.03, 3, L, false);
    for (const sx of [-1, 1]) {
      const lx = x0 + sx * 7, lz = -1;
      mk(new THREE.CylinderGeometry(0.45, 0.55, 0.3, 8), 0xb3ab99, lx, 0.15, lz);
      mk(new THREE.CylinderGeometry(0.14, 0.14, 1.1, 8), 0xb3ab99, lx, 0.85, lz);
      mk(new THREE.BoxGeometry(0.7, 0.6, 0.7), 0xb3ab99, lx, 1.7, lz);
      const glow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 0.72), new THREE.MeshBasicMaterial({ color: 0xffd38a })); glow.position.set(lx, 1.7, lz); L.add(glow);
      const cap = mk(new THREE.ConeGeometry(0.62, 0.45, 4), 0xb3ab99, lx, 2.25, lz); cap.rotation.y = Math.PI / 4;
      world.addCollider({ x: lx, z: lz, r: 0.6 });
    }
    // 담장 뒤 소나무
    for (const [a, b, s] of [[-45, -17, 51], [17, 45, 52]]) scatter(world, { kind: 'pine', count: 22, area: { x0: x0 + a, x1: x0 + b, z0: -32, z1: 24 }, seed: s, scale: [1, 1.5] });
  }

  // 2) 강화도 해협: 바다와 건너편 섬 (장면 구경용)
  {
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(130, 60).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: 0x46708a, shininess: 30, transparent: true, opacity: 0.92 }));
    sea.position.set(GANGHWA_X, -0.5, -26); L.add(sea);
    const island = mk(new THREE.ConeGeometry(26, 9, 9), 0x4f6b4a, GANGHWA_X, 1.5, -40); island.scale.set(1.4, 1, 0.7);
    for (let i = 0; i < 6; i++) { const g = new THREE.Group(); g.position.set(GANGHWA_X - 10 + i * 4, 3.4, -34 + (i % 2) * 2); g.scale.setScalar(0.55); g.rotation.y = (i % 3 - 1) * 0.2; L.add(g); hanok(g, { tile: i === 2 }); } // 섬의 집들(도읍을 옮긴 강화도)
    for (let i = 0; i < 3; i++) { const g = new THREE.Group(); g.position.set(GANGHWA_X - 8 + i * 8, -0.7, -14 - i * 3); g.rotation.y = 0.3 * (i - 1); L.add(g); boat(g, { len: 4.6 }); }
  }
  // 강화도 섬의 소나무 (섬 원뿔 높이에 맞춰 심는다)
  {
    const islandH = (x, z) => 6 - 9 * Math.hypot((x - GANGHWA_X) / 1.4, (z + 40) / 0.7) / 26;
    scatter(world, { kind: 'pine', count: 30, area: { x0: GANGHWA_X - 34, x1: GANGHWA_X + 34, z0: -52, z1: -38 }, avoid: [{ x: GANGHWA_X, z: -34, r: 13 }], seed: 53, ground: islandH, scale: [0.9, 1.4] });
  }
  const ganghwaCam = { pos: [GANGHWA_X + 6, 7, 12], target: [GANGHWA_X, 2, -30] };

  // 2-1) 도읍 연출 지도판(놀이 아님): 바다 위 고려 땅과 강화도 섬, 개경·서경·강화도 표시. 몽골 기병 화살표 셋이 북쪽에서 내려와
  //      땅으로 이어진 두 곳에는 닿고, 강화도 앞에서는 바다에 막혀 멈춘다(S10: 쉽게 건너오지 못함). 거리·속도 숫자는 보이지 않는다
  const mapBoard = new THREE.Group(); mapBoard.name = 'capitalMap'; mapBoard.position.set(MAP_X, 0, 0); mapBoard.visible = false; L.add(mapBoard);
  const capitalMap = { group: mapBoard };
  {
    const flat = (geo, color, y) => { const m = new THREE.Mesh(geo.rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color })); m.position.y = y; mapBoard.add(m); return m; };
    flat(new THREE.PlaneGeometry(30, 22), 0x4f7c96, 0.6);
    const land = new THREE.Shape([[-7, 9], [6, 9], [8, 4], [7, -2], [5, -8], [1, -9], [-2, -7], [-3, -4.5], [-2.6, -2.5], [-4.5, 0], [-5, 3], [-8, 6]].map(([x, y]) => new THREE.Vector2(x, y)));
    flat(new THREE.ShapeGeometry(land), 0x7d9a5a, 0.65);
    const island = flat(new THREE.CircleGeometry(0.95, 16), 0x7d9a5a, 0.65); island.position.set(-4.6, 0.65, 3.4);
    // 땅 테두리(가장자리 띠)와 북쪽 산줄기 표시
    for (const [x, z] of [[-3, -6], [0, -7], [3, -6.5], [1, -4], [4, -3]]) { const m = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.9, 4), mat(0x6a8550)); m.position.set(x, 1.05, z); mapBoard.add(m); }
    const P = { gaegyeong: [-1.5, 2], seogyeong: [-3.5, -3], ganghwa: [-4.6, 3.4] };
    capitalMap.places = P;
    for (const [id, [x, z]] of Object.entries(P)) {
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.5, 10), mat(id === 'ganghwa' ? 0xd9a441 : 0xb8452f)); pin.position.set(x, 0.9, z); mapBoard.add(pin);
      const lb = labelSprite({ gaegyeong: '개경 (지금 도읍)', seogyeong: '서경 (평양)', ganghwa: '강화도' }[id], { w: id === 'gaegyeong' ? 4.4 : 3.2 });
      lb.position.set(x + (id === 'gaegyeong' ? 2.6 : id === 'ganghwa' ? -0.6 : 1.4), 2.2, z + (id === 'ganghwa' ? 1.6 : 0)); lb.name = `label-${id}`; mapBoard.add(lb);
    }
    const year = labelSprite('1232년', { size: 60, color: '#fff6c8', bg: 'rgba(43,36,28,.88)', w: 4 }); year.position.set(4.5, 3.2, -6); year.name = 'yearCaption'; mapBoard.add(year);
    // 몽골 기병 화살표 셋(북쪽 → 서경 · 개경 · 강화도 앞 바닷가)
    const shape = new THREE.Shape([[0, 0.9], [0.7, 0], [0.25, 0], [0.25, -1.4], [-0.25, -1.4], [-0.25, 0], [-0.7, 0]].map(([x, y]) => new THREE.Vector2(x, y)));
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x3a3f4a });
    const route = (from, to) => ({ from, to, mesh: (() => { const m = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), arrowMat); m.position.set(from[0], 0.8, from[1]); m.rotation.y = Math.atan2(-(to[0] - from[0]), -(to[1] - from[1])); m.scale.setScalar(1.4); mapBoard.add(m); return m; })() });
    capitalMap.routes = [route([-3.5, -9.5], [P.seogyeong[0], P.seogyeong[1] - 0.6]), route([0, -9.5], [P.gaegyeong[0], P.gaegyeong[1] - 0.6]), route([-1.8, -9.5], [-3.1, 3.1])];
    // 강화도 앞 물결 줄(멈춤 표시)과 ✕
    const stop = new THREE.Group(); stop.visible = false; mapBoard.add(stop);
    for (let i = 0; i < 3; i++) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.9 + i * 0.35, 0.05, 4, 16, Math.PI * 0.7).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf2f6f8 })); w.position.set(-3.8, 0.72, 3.3); w.rotation.y = Math.PI * 0.85; stop.add(w); }
    const xMark = labelSprite('✕', { size: 64, color: '#b8452f', bg: 'rgba(242,234,217,.0)', w: 1.4 }); xMark.position.set(-3.6, 1.8, 3.1); stop.add(xMark);
    capitalMap.stop = stop;
    capitalMap.cam = { pos: [MAP_X + 1, 22, 13], target: [MAP_X - 0.5, 0, 0.5] };
  }
  // 도읍 연출 한 번(약 4초): 화살표가 내려와 두 곳에 닿고, 강화도 앞은 바다에 막혀 멈춘다
  capitalMap.play = () => new Promise(resolve => {
    mapBoard.visible = true; capitalMap.stop.visible = false;
    for (const r of capitalMap.routes) r.mesh.position.set(r.from[0], 0.8, r.from[1]);
    let t = 0;
    const off = world.onUpdate(dt => {
      t += dt;
      const k = Math.min(1, t / 2.4), e = k * (2 - k);
      capitalMap.routes.forEach(r => r.mesh.position.set(r.from[0] + (r.to[0] - r.from[0]) * e, 0.8, r.from[1] + (r.to[1] - r.from[1]) * e));
      if (k >= 1) { capitalMap.stop.visible = true; const r = capitalMap.routes[2]; r.mesh.position.x = r.to[0] + Math.sin(t * 18) * 0.06 * Math.max(0, 1 - (t - 2.4)); }
      if (t >= 4) { off(); resolve(); }
    });
  });

  // 3) 처인성: 낮은 흙성(둥글게), 남쪽 성문, 성 안 백성과 승려, 북쪽 들판
  const cheoin = new THREE.Group(); L.add(cheoin);
  {
    const segs = 40;
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      if (Math.abs(a - Math.PI / 2) < 0.18) continue; // 남쪽(+z) 성문 자리
      const seg = mk(new THREE.BoxGeometry(2.1, 2.4, 1.4), 0x8a7356, CHEOIN_X + Math.cos(a) * CHEOIN_R, 1.2, Math.sin(a) * CHEOIN_R, cheoin);
      seg.rotation.y = -a + Math.PI / 2;
      for (const d of [-0.6, 0, 0.6]) { // 흙성 위 나무 울타리(목책)
        const st = mk(new THREE.CylinderGeometry(0.07, 0.09, 0.9, 5), 0x6b4a32, 0, 0, 0, cheoin);
        st.position.set(CHEOIN_X + Math.cos(a) * (CHEOIN_R + 0.35) - Math.sin(a) * d, 2.85, Math.sin(a) * (CHEOIN_R + 0.35) + Math.cos(a) * d);
      }
    }
    // 성 안: 피란 온 백성들의 초가와 짚더미·장작(남쪽 성문 쪽, 싸움 자리와 떨어진 곳)
    for (const [dx, dz, ry] of [[-6.2, 4.6, 0.5], [6.2, 4.4, -0.5]]) { const g = new THREE.Group(); g.position.set(CHEOIN_X + dx, 0, dz); g.rotation.y = ry; g.scale.setScalar(0.8); cheoin.add(g); hanok(g, {}); world.addCollider({ x: CHEOIN_X + dx, z: dz, r: 2 }); }
    for (const [dx, dz, fn] of [[-2.8, 8.2, straw], [3, 8.4, woodpile]]) { const g = new THREE.Group(); g.position.set(CHEOIN_X + dx, 0, dz); cheoin.add(g); fn(g); }
    for (let i = 0; i < 8; i++) {
      const a = Math.PI + 0.3 + i * 0.35;
      const who = i % 2 ? LOOKS.monk : LOOKS.villager;
      const p = makePerson(who); p.position.set(CHEOIN_X + Math.cos(a) * (CHEOIN_R - 3.4), 0, Math.sin(a) * (CHEOIN_R - 3.4)); // 성벽 가까이는 궁수 자리
      p.rotation.y = Math.atan2(Math.cos(a), Math.sin(a)); cheoin.add(p);
    }
  }
  // 다가오는 몽골군 8명 (처음엔 숨김). 들판 북쪽 반원에서 나타나 성으로 걸어온다.
  const mongols = [];
  for (let i = 0; i < 8; i++) {
    const g = new THREE.Group(); g.visible = false; g.scale.setScalar(1.6); L.add(g); // 멀리서도 보이게 크게
    g.rotation.order = 'YXZ'; // 화살을 맞으면 rotation.x로 잠깐 뒤로 젖혀졌다가 물러난다
    const p = makePerson(LOOKS.mongol); g.add(p);
    mk(new THREE.CylinderGeometry(0.05, 0.05, 3.4, 4), 0x3a2c20, 0.6, 1.7, 0, g);
    const f = mk(new THREE.PlaneGeometry(0.9, 0.7), 0x2a3550, 1.05, 3.1, 0, g); f.material = new THREE.MeshLambertMaterial({ color: 0x2a3550, side: THREE.DoubleSide });
    const sh = mk(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 10), 0x6b4a2e, -0.42, 1.35, 0.38, g); sh.rotation.x = Math.PI / 2; // 둥근 방패(화살을 막고 주춤한다)
    const top = new THREE.Object3D(); top.position.set(0, 3.6, 0); g.add(top);
    const a = Math.PI + 0.55 + (i / 7) * (Math.PI - 1.1); // 성 앞쪽(북쪽, -z) 부채꼴
    mongols.push({ group: g, top, angle: a });
  }
  // 고려 궁수 5명: 북쪽 성벽 안쪽 발판 위. 싸움이 시작되면 성벽 위로 올라와 활을 쏜다(처음엔 숨김).
  const ARCHER_Y = 1.3;
  const archers = [];
  for (let i = 0; i < 5; i++) {
    const a = Math.PI + 0.7 + i * (Math.PI - 1.4) / 4;
    const x = CHEOIN_X + Math.cos(a) * (CHEOIN_R - 1.1), z = Math.sin(a) * (CHEOIN_R - 1.1);
    mk(new THREE.BoxGeometry(1.3, ARCHER_Y, 1.3), 0x7a6449, x, ARCHER_Y / 2, z, cheoin); // 발판
    const g = new THREE.Group(); g.visible = false; g.position.set(x, 0, z); g.scale.setScalar(1.3); L.add(g);
    const p = makePerson(i % 2 ? LOOKS.monk : LOOKS.villager); g.add(p);
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 4, 14, Math.PI), mat(0x5a3f2a));
    bow.rotation.set(0, Math.PI / 2, Math.PI / 2); bow.position.set(0.42, 1.35, 0.25); g.add(bow);
    const out = Math.atan2(Math.cos(a), Math.sin(a)); // 성 밖(북쪽 들판)을 바라본다
    g.rotation.y = out;
    archers.push({ group: g, angle: a, baseY: ARCHER_Y, rest: out });
  }
  // 몽골 장수 쪽 깃발 무리(김윤후 컷에서 북쪽으로 물러간다. 장수가 쓰러지는 그림은 그리지 않는다)
  const commanderFlag = new THREE.Group(); commanderFlag.visible = false; commanderFlag.position.set(CHEOIN_X + 4, 0, -36); L.add(commanderFlag);
  mk(new THREE.CylinderGeometry(0.12, 0.12, 9, 5), 0x3a2c20, 0, 4.5, 0, commanderFlag);
  { const fl = mk(new THREE.PlaneGeometry(3, 2.2), 0x2a3550, 1.55, 7.6, 0, commanderFlag); fl.material = new THREE.MeshLambertMaterial({ color: 0x2a3550, side: THREE.DoubleSide }); }
  for (let i = 0; i < 4; i++) { const p = makePerson(LOOKS.mongol); p.position.set(-3 + i * 2, 0, 1.5); p.rotation.y = Math.PI; commanderFlag.add(p); }
  // 날아가는 화살 (돌려 쓴다)
  const arrows = [];
  // 멀리서 보는 카메라에서도 보이게: 크게 만들고, 빛을 받지 않는 밝은 색과 뒤로 끌리는 빛줄기(꼬리)를 단다
  const glow = c => new THREE.MeshBasicMaterial({ color: c, fog: false });
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group(); g.visible = false; g.scale.setScalar(4.6); L.add(g);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 5).rotateX(Math.PI / 2), glow(0xfff1c8)); g.add(shaft);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.3, 5).rotateX(Math.PI / 2), glow(0x2a2a2a)); tip.position.z = 0.8; g.add(tip);
    const fl = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.34), glow(0xd8452f)); fl.position.z = -0.6; g.add(fl);
    const trail = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.02, 2.6, 6, 1, true).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0.55, fog: false, depthWrite: false }));
    trail.position.z = -1.9; trail.name = 'trail'; g.add(trail);
    arrows.push(g);
  }

  // 처인성 둘레 풀밭(몽골군이 다가오는 들판은 낮은 풀만)과 남쪽 숲
  scatter(world, { kind: 'grass', count: 150, area: { x0: CHEOIN_X - 40, x1: CHEOIN_X + 40, z0: -40, z1: 30 }, avoid: [{ x: CHEOIN_X, z: 0, r: CHEOIN_R + 1 }], seed: 54, scale: [0.7, 1.2] });
  scatter(world, { kind: 'flower', count: 50, area: { x0: CHEOIN_X - 30, x1: CHEOIN_X + 30, z0: 14, z1: 32 }, seed: 55 });
  scatter(world, { kind: 'pine', count: 26, area: { x0: CHEOIN_X - 50, x1: CHEOIN_X + 50, z0: 22, z1: 50 }, seed: 56, scale: [1, 1.5] });
  scatter(world, { kind: 'rock', count: 12, area: { x0: CHEOIN_X - 40, x1: CHEOIN_X + 40, z0: -40, z1: 30 }, avoid: [{ x: CHEOIN_X, z: 0, r: CHEOIN_R + 2 }], seed: 57, scale: [0.5, 1.2] });
  const cheoinFit = {
    target: [CHEOIN_X, 1, -12], dir: [0, 16, 15],
    // 당겨 쏘기: 세 갈래에서 몽골군이 나타나는 곳과 성 북쪽 반, 아래 활 단추 자리만큼 성 남쪽 땅
    points: [[CHEOIN_X - CHEOIN_R, 0, 0], [CHEOIN_X + CHEOIN_R, 0, 0], [CHEOIN_X, 0, CHEOIN_R * 0.7],
      ...CHEOIN_LANES.map(a => [CHEOIN_X + Math.cos(a) * SPAWN_R, 3.6 * 1.6, Math.sin(a) * SPAWN_R])],
  };

  // 4) 충주성 마당: 성벽, 관노 문서 더미, 불
  {
    for (const [dx, dz, w, d] of [[0, -14, 30, 1.4], [-15, 0, 1.4, 28], [15, 0, 1.4, 28]]) mk(new THREE.BoxGeometry(w, 4, d), 0x8c8577, CHUNGJU_X + dx, 2, dz);
    for (let i = 0; i < 6; i++) { const r = makePerson(i % 2 ? LOOKS.villager : LOOKS.monk); r.position.set(CHUNGJU_X - 6 + i * 2.4, 0, 4 + (i % 2)); r.rotation.y = Math.PI; L.add(r); }
  }
  // 관노(관청의 노비) 문서: 이름과 붉은 도장이 찍힌 종이 묶음. 김윤후가 불태운다.
  const paperTex = (() => {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 192;
    const c = cv.getContext('2d');
    c.fillStyle = '#efe4c8'; c.fillRect(0, 0, 256, 192);
    c.strokeStyle = '#8a6a42'; c.lineWidth = 6; c.strokeRect(6, 6, 244, 180);
    c.fillStyle = '#2a1e14'; c.font = 'bold 40px "Nanum Myeongjo", Batang, serif'; c.textAlign = 'center';
    c.fillText('노비 문서', 128, 62);
    c.fillStyle = '#4a3a2a'; for (let k = 0; k < 5; k++) c.fillRect(34, 86 + k * 18, 150 - (k % 2) * 40, 5); // 적힌 이름들
    c.fillStyle = '#b8352a'; c.fillRect(186, 120, 40, 40); // 관청 도장
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const documents = new THREE.Group(); documents.position.set(CHUNGJU_X, 0, -3); L.add(documents);
  const papers = [];
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.98).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: paperTex, color: 0xffffff, side: THREE.DoubleSide, transparent: true }));
    m.position.set((i % 3 - 1) * 0.75, 0.05 + Math.floor(i / 3) * 0.05, ((i * 7) % 3 - 1) * 0.4); m.rotation.y = ((i * 0.7) % 1.2 - 0.6) * 0.5; m.rotation.x = 0.25; // 카메라 쪽으로 살짝 기울여 글씨가 보이게
    documents.add(m); papers.push({ m, delay: 0.4 + (i % 3) * 0.5 + Math.floor(i / 3) * 0.35, base: m.position.clone() }); // 한쪽부터 차례로 불이 옮겨 붙는다
  }
  // 불: 여러 겹의 불꽃과 위로 날리는 불티. 문서가 다 타면 잦아든다.
  const flames = [];
  const fireG = new THREE.Group(); fireG.position.set(CHUNGJU_X, 0, -3); fireG.visible = false; L.add(fireG);
  for (let i = 0; i < 7; i++) {
    const c = [0xd9481f, 0xf07a2a, 0xf7b740, 0xffe27a][i % 4];
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.32 + (i % 3) * 0.1, 1.3, 6), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.88 }));
    const a = i * 2.4; f.position.set(Math.cos(a) * 0.45 * (i % 2 + 0.3), 0.6, Math.sin(a) * 0.35 * (i % 2 + 0.3)); f.userData.ph = i * 1.3;
    fireG.add(f); flames.push(f);
  }
  const sparks = [];
  for (let i = 0; i < 24; i++) {
    const sp = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 3), new THREE.MeshBasicMaterial({ color: 0xffb24a })); sp.userData = { ph: i * 0.37, x: (i % 5 - 2) * 0.2, z: ((i * 3) % 5 - 2) * 0.15 };
    fireG.add(sp); sparks.push(sp);
  }
  // 연기: 회색 구름이 천천히 피어오른다
  const smoke = [];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 7, 5), new THREE.MeshLambertMaterial({ color: 0x8a8580, transparent: true, opacity: 0, depthWrite: false }));
    m.userData = { ph: i / 6, x: (i % 3 - 1) * 0.3, z: ((i * 2) % 3 - 1) * 0.25 }; fireG.add(m); smoke.push(m);
  }
  let fireLevel = 0; // 0 꺼짐 ~ 1 활활
  const burnState = { t: -1 };
  // 문서를 불태운다(약 4초): 불이 붙은 종이가 갈색 → 검게 그을리며 오그라들고 재가 되어 사라진다
  const burnDocuments = () => new Promise(resolve => { burnState.t = 0; burnState.resolve = resolve; fireG.visible = true; });
  const burnt = () => { burnState.t = -1; documents.visible = false; fireG.visible = true; fireLevel = 0.45; };
  scatter(world, { kind: 'grass', count: 60, area: { x0: CHUNGJU_X - 14, x1: CHUNGJU_X + 14, z0: -12, z1: 12 }, avoid: [{ x: CHUNGJU_X, z: -3, r: 3 }, { x: CHUNGJU_X + 4, z: 9, r: 3 }], seed: 58, scale: [0.6, 1] });
  scatter(world, { kind: 'pine', count: 20, area: { x0: CHUNGJU_X - 40, x1: CHUNGJU_X + 40, z0: -50, z1: -18 }, seed: 59, scale: [1, 1.5] });
  const chungjuCam = { pos: [CHUNGJU_X + 4, 4.5, 9], target: [CHUNGJU_X, 1.4, -3] };
  const burnCam = { pos: [CHUNGJU_X - 1.3, 2.7, 0.8], target: [CHUNGJU_X - 0.1, 0.2, -3.2] }; // 문서 더미 바로 앞(백성들 앞쪽)에서 내려다본다

  world.addNpc('minister', LOOKS.minister, PALACE_X, -3.5, 0);
  world.addNpc('kimyunhu', LOOKS.kimyunhu, CHEOIN_X, -2, Math.PI);

  const ash = new THREE.Color(0x1c1612), brown = new THREE.Color(0x8a5a2a), white = new THREE.Color(0xffffff);
  world.onUpdate((dt, t) => {
    if (burnState.t >= 0) {
      burnState.t += dt;
      const bt = burnState.t;
      fireLevel = Math.min(1, bt / 1.2) * (bt > 6.2 ? Math.max(0.45, 1 - (bt - 6.2) / 1.2) : 1);
      for (const pp of papers) {
        const k = Math.max(0, Math.min(1, (bt - pp.delay) / 3.6)); // 이 종이가 탄 정도
        const col = k < 0.5 ? white.clone().lerp(brown, k * 2) : brown.clone().lerp(ash, (k - 0.5) * 2);
        pp.m.material.color.copy(col);
        pp.m.scale.setScalar(Math.max(0.05, 1 - k * 0.85));
        pp.m.rotation.z = k * 0.9; // 오그라든다
        pp.m.position.y = pp.base.y + k * 0.25;
        pp.m.material.opacity = k > 0.8 ? 1 - (k - 0.8) * 5 : 1;
      }
      if (bt > 6.4) { documents.visible = false; }
      if (bt > 7.4 && burnState.resolve) { const r = burnState.resolve; burnState.resolve = null; burnState.t = -1; fireLevel = 0.45; r(); }
    }
    if (fireG.visible) { // 불꽃은 작게(0.55배), 연기·재 위주
      flames.forEach(f => { const s = (0.7 + Math.sin(t * 13 + f.userData.ph) * 0.2) * (0.3 + fireLevel) * 0.55; f.scale.set(s, s * (1.2 + Math.sin(t * 9 + f.userData.ph) * 0.25), s); f.position.y = 0.6 * s; });
      smoke.forEach(m => { const k = ((t * 0.25 + m.userData.ph) % 1); m.position.set(m.userData.x + k * 0.6, 0.6 + k * 4.5, m.userData.z); m.scale.setScalar(0.4 + k * 1.6); m.material.opacity = 0.5 * Math.sin(Math.PI * k) * Math.min(1, fireLevel + 0.3); });
      sparks.forEach(sp => { const k = ((t * 0.7 + sp.userData.ph) % 1); sp.visible = fireLevel > 0.2; sp.position.set(sp.userData.x * (1 + k), 0.4 + k * 3.2 * fireLevel, sp.userData.z * (1 + k)); sp.scale.setScalar(1 - k); });
    }
  });

  return {
    areas: {
      palace: { start: [PALACE_X, 8], bounds: { x0: PALACE_X - 13, x1: PALACE_X + 13, z0: -6, z1: 14 } },
      jeogo: jeogo,
      ganghwa: { cam: ganghwaCam },
      capitalMap,
      cheoin: { center: [CHEOIN_X, 0], radius: CHEOIN_R, spawnR: SPAWN_R, fit: cheoinFit, lanes: CHEOIN_LANES,
        bow: [CHEOIN_X, 1.3, -(CHEOIN_R - 1.1)], commanderFlag,
        // 김윤후 컷: 성 안 북쪽, 백성·승려 사이에 선 한 사람(높은 단·지휘봉 없음)
        kimyunhu: [CHEOIN_X + 1, -7.6, 0], yunhuCam: { pos: [CHEOIN_X + 1.6, 3.4, 0.5], target: [CHEOIN_X + 1, 2, -9] } },
      chungju: { cam: chungjuCam, burnCam, kimyunhu: [CHUNGJU_X + 1.8, -2.2, Math.PI * 0.85] },
    },
    mongols, archers, arrows, documents, flames, fire: fireG, burnDocuments, burnt, jeogo,
    start: [PALACE_X, 8],
  };
}
