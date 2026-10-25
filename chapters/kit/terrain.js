// 마을·미니게임 무대의 땅: 학생이 걷는 곳(bounds)은 평평하게(높이 0) 두어 이동·충돌·미니게임이 예전 그대로 되게 하고,
// 그 바깥은 언덕으로 솟아 공간감이 나게 한다. 물(water) 아래는 움푹, 바깥에 놓인 건물 자리는 평평하게 다진다.
// 멀리에는 안개에 흐려지는 산줄기를 둘러 원근감을 준다. 모두 무대 기준 좌표(local).
import * as THREE from 'three';
import { groundMaterial } from '../../core/textures.js';
import { merge, hanok, tree } from './buildings.js';

function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function noise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return (a * (1 - sx) + b * sx) * (1 - sz) + (c * (1 - sx) + d * sx) * sz;
}
const fbm = (x, z) => noise(x, z) * 0.6 + noise(x * 2.1, z * 2.1) * 0.3 + noise(x * 4.3, z * 4.3) * 0.1;
const smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
// 직사각형 밖으로 얼마나 떨어졌나(안이면 0)
const rectDist = (x, z, r) => Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.z0 - z, 0, z - r.z1));

// spec: { bounds, props, roads, size, flatMargin, hill } → { heightAt(x, z), flatAt(x,z) }
export function terrainField({ bounds, props = [], margin = 5, hill = 1 }) {
  const flat = { x0: bounds.x0 - margin, x1: bounds.x1 + margin, z0: bounds.z0 - margin, z1: bounds.z1 + margin };
  const waters = props.filter(p => p.type === 'water').map(p => {
    const w = (p.w || 200) / 2, d = (p.d || 60) / 2, c = Math.cos(p.ry || 0), s = Math.sin(p.ry || 0);
    return { p, w, d, c, s };
  });
  const pads = props.filter(p => p.type !== 'water' && p.type !== 'crowd' && rectDist(p.x, p.z, flat) > 0)
    .map(p => ({ x: p.x, z: p.z, r: (p.type === 'western' ? Math.max(p.w || 8, p.d || 5) * 0.75 : 4.5) * (p.scale || 1) + 3 }));
  const inWater = (x, z) => waters.some(({ p, w, d, c, s }) => { const dx = x - p.x, dz = z - p.z, lx = dx * c - dz * s, lz = dx * s + dz * c; return Math.abs(lx) < w + 2 && Math.abs(lz) < d + 2; });
  const heightAt = (x, z) => {
    const d = rectDist(x, z, flat);
    if (d <= 0) return 0;
    if (inWater(x, z)) return -1.4;
    let h = smooth(d / 26) * (2.5 + 9 * fbm(x * 0.03 + 7, z * 0.03 + 3)) * hill + smooth(d / 6) * (fbm(x * 0.12, z * 0.12) - 0.3) * 0.9;
    for (const pd of pads) { const k = Math.hypot(x - pd.x, z - pd.z) / pd.r; if (k < 1.6) h *= smooth((k - 1) / 0.6); }
    return Math.max(h, 0);
  };
  return { heightAt, flat, inWater };
}

// 땅 메시: 꼭짓점 색에 높이·잡음에 따른 얼룩, 길 가장자리는 흙빛으로 닳은 듯이
export function terrainMesh(field, { color = 0x5f7a4c, kind = 'grass', roads = [], size = 220, seg = 64, center = [0, 0] } = {}) {
  const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2); g.translate(center[0], 0, center[1]);
  const p = g.attributes.position, cols = [], base = new THREE.Color(color), c = new THREE.Color();
  const hsl = {}; base.getHSL(hsl);
  const high = new THREE.Color().setHSL(hsl.h, hsl.s * 0.6, Math.max(0.08, hsl.l * 0.78)); // 언덕 위: 조금 어둡고 덜 진하게
  const worn = new THREE.Color(0x8f7a5c);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), h = field.heightAt(x, z);
    p.setY(i, h);
    const n = fbm(x * 0.08, z * 0.08);
    c.copy(base).multiplyScalar(0.88 + n * 0.22);
    if (h > 0.5) c.lerp(high, Math.min(1, h / 9));
    if (h < -0.5) c.lerp(worn, 0.5); // 물가 진흙
    for (const r of roads) {
      const dx = Math.max(Math.abs(x - r.x) - r.w / 2, 0), dz = Math.max(Math.abs(z - r.z) - r.d / 2, 0), dd = Math.hypot(dx, dz);
      if (!r.ry && dd < 1.6) c.lerp(worn, (1 - dd / 1.6) * 0.45);
    }
    cols.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, groundMaterial(kind)); m.receiveShadow = true;
  return m;
}

// 먼 산줄기: 안개에 흐려져 겹겹이 보인다(그림자 없음, 한 번에 그린다)
export function mountainRing(field, { center = [0, 0], color = 0x5f7a4c, radius = 120, seed = 1 } = {}) {
  const geos = [];
  const base = new THREE.Color(color), hsl = {}; base.getHSL(hsl);
  const tint = new THREE.Color().setHSL(hsl.h, hsl.s * 0.45, Math.min(0.5, hsl.l * 0.8 + 0.06));
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i, seed) * 0.3;
    const r = radius + hash(seed, i) * 25;
    const x = center[0] + Math.sin(a) * r, z = center[1] + Math.cos(a) * r;
    if (field.inWater(x, z)) continue; // 바다 쪽은 트인 수평선
    const h = 18 + hash(i * 3, seed) * 22, w = 28 + hash(i, seed * 5) * 22;
    const geo = new THREE.ConeGeometry(w, h, 7, 2);
    const pos = geo.attributes.position;
    for (let k = 0; k < pos.count; k++) { // 봉우리를 조금 비틀어 자연스럽게
      const y = pos.getY(k);
      if (y < h / 2 - 0.01) { pos.setX(k, pos.getX(k) * (0.85 + hash(k, i) * 0.3)); pos.setZ(k, pos.getZ(k) * (0.85 + hash(i, k) * 0.3)); }
    }
    geo.translate(x, h / 2 - 2, z);
    geos.push(geo);
  }
  if (!geos.length) return null;
  const m = new THREE.Mesh(merge(geos), new THREE.MeshLambertMaterial({ color: tint, flatShading: true }));
  return m;
}

// 고려·조선편처럼 장면을 손으로 만든 장에서 쓰는 땅: 건물이 선 넓은 곳(bounds + margin)은 평평, 바깥은 언덕, 멀리 산줄기.
// 높이 함수를 돌려주어 소나무 흩뿌리기(scatter)가 언덕 위에 서게 한다.
export function sceneGround(L, { bounds, margin = 12, color = 0x5f7a4c, kind = 'grass', size = 200, seg = 64, hill = 1, mountains = true }) {
  const field = terrainField({ bounds, margin, hill });
  L.add(terrainMesh(field, { color, kind, size, seg }));
  if (mountains) { const mr = mountainRing(field, { color, center: [(bounds.x0 + bounds.x1) / 2, (bounds.z0 + bounds.z1) / 2], radius: 110 }); if (mr) L.add(mr); }
  return field.heightAt;
}

// 먼 도시 모습(산줄기 대신 또는 함께): 안개 속에 겹겹이 선 지붕과 건물의 실루엣. 한 번에 그린다(그림자 없음).
// style: 'hanok'(낮은 기와지붕 줄, 개항 무렵 한성) / 'brick'(벽돌 건물과 굴뚝, 1910~40년대) / 'concrete'(네모난 빌딩, 1950~80년대)
export function skyline(field, { center = [0, 0], radius = 80, style = 'brick', color = 0x55524c, arc = [0, Math.PI * 2], seed = 3 } = {}) {
  const geos = [];
  const n = Math.round(40 * (arc[1] - arc[0]) / (Math.PI * 2)) + 6;
  for (let i = 0; i < n; i++) {
    const a = arc[0] + (i + hash(i, seed) * 0.6) / n * (arc[1] - arc[0]);
    const r = radius + hash(seed, i) * 22;
    const x = center[0] + Math.sin(a) * r, z = center[1] + Math.cos(a) * r;
    if (field.inWater(x, z)) continue;
    const ground = Math.max(0, field.heightAt(x, z)) - 0.5;
    if (style === 'hanok') {
      const w = 6 + hash(i, 2) * 5, h = 2.2 + hash(i, 4) * 1.2;
      const body = new THREE.BoxGeometry(w, h, 4); body.translate(0, h / 2, 0);
      const roof = new THREE.ConeGeometry(w * 0.72, 2.2, 4, 1); roof.rotateY(Math.PI / 4); roof.scale(1, 1, 0.55); roof.translate(0, h + 1.0, 0);
      for (const geo of [body, roof]) { geo.rotateY(a); geo.translate(x, ground, z); geos.push(geo); }
    } else {
      const w = 5 + hash(i, 2) * 7, h = style === 'concrete' ? 8 + hash(i, 4) * 22 : 5 + hash(i, 4) * 9;
      const body = new THREE.BoxGeometry(w, h, 5); body.translate(0, h / 2, 0); body.rotateY(a); body.translate(x, ground, z); geos.push(body);
      if (style === 'brick' && hash(i, 7) > 0.7) { const c = new THREE.CylinderGeometry(0.6, 0.8, 6, 6); c.translate(x + 2, ground + h + 3, z); geos.push(c); } // 공장 굴뚝
    }
  }
  if (!geos.length) return null;
  return new THREE.Mesh(merge(geos), new THREE.MeshLambertMaterial({ color, flatShading: true }));
}

// 손으로 만든 장면(고려·조선편)에 먼 산줄기만 둘러 깊이감을 준다(한 번에 그린다). 바다 쪽 등 비울 방향은 skip(라디안 [시작, 끝]).
export function backdropMountains(L, { center = [0, 0], radius = 120, color = 0x5f7a4c, skip = null, seed = 1 } = {}) {
  const inArc = a => { if (!skip) return false; const t = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); return t >= skip[0] && t <= skip[1]; };
  const field = { heightAt: () => 0, inWater: (x, z) => inArc(Math.atan2(x - center[0], z - center[1])) };
  const m = mountainRing(field, { center, color, radius, seed });
  if (m) L.add(m);
  return m;
}

// 손으로 만든 장면의 걷는 곳(bounds) 바깥에 그 장소다운 집과 나무를 둘러 세운다(걷기·놀이 자리는 건드리지 않는다).
// 높이는 장면에 깔린 땅을 위에서 비추어(레이) 찾는다. houses: 'thatch'(초가) | 'tile'(기와집) | null, trees: kind 목록, snow: 눈 덮인 지붕·잎
// 앞(+z, 카메라 쪽)은 비우고 뒤(-z)와 양옆에만 둔다.
export function surroundings(world, { bounds, houses = null, trees = ['pine'], count = 10, gap = 6, snow = false, seed = 7, back = true }) {
  const L = world.level, ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0);
  const grounds = []; L.traverse(o => { if (o.isMesh && o.geometry.attributes.position.count > 1000) grounds.push(o); });
  const heightAt = (x, z) => { ray.set(new THREE.Vector3(x, 80, z), down); const hit = ray.intersectObjects(grounds, false)[0]; return hit ? hit.point.y : 0; };
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const spots = [];
  if (back) for (let i = 0; i < count; i++) { // 뒤쪽 줄
    spots.push([bounds.x0 - 4 + (bounds.x1 - bounds.x0 + 8) * (i + rnd() * 0.5) / count, bounds.z0 - gap - rnd() * 8]);
  }
  for (let i = 0; i < Math.ceil(count / 2); i++) for (const side of [-1, 1]) { // 양옆
    spots.push([side < 0 ? bounds.x0 - gap - rnd() * 6 : bounds.x1 + gap + rnd() * 6, bounds.z0 + (bounds.z1 - bounds.z0) * (i / Math.ceil(count / 2)) * 0.8]);
  }
  spots.forEach(([x, z], i) => {
    const g = new THREE.Group(); g.position.set(x, heightAt(x, z) - 0.05, z); g.rotation.y = (rnd() - 0.5) * 0.6; L.add(g);
    if (i % 3 === 2) g.userData.minQuality = 'medium'; // 화질 '낮음'이면 셋 중 하나는 숨긴다(world.applyDecor)
    if (houses && i % 3 === 0) hanok(g, { tile: houses === 'tile', roofColor: snow && houses !== 'tile' ? 0xe6e8ec : undefined });
    else tree(g, { kind: trees[i % trees.length], x, z, color: snow ? 0x5a6e5a : undefined });
  });
}
