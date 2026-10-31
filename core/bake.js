// 장면 굳히기(태블릿 성능): 장면을 다 지은 뒤, 움직이지 않는 조각들을 재질별로 한 덩어리씩 합쳐 그리기 횟수를 줄인다.
// 그대로 두는 것: 장면이 돌려준 물건(나중에 장 코드가 움직이거나 숨긴다), 사람·안내판, 잠깐 돌려 보았을 때 움직이거나 바뀐 것,
// 꼭짓점 색을 쓰는 땅, 스프라이트·점·인스턴스(풀·나무 흩뿌리기)처럼 합칠 수 없는 것.
import * as THREE from 'three';

function merge(geos) {
  const pos = [], nor = [], uv = [], idx = [];
  let base = 0;
  for (const g of geos) {
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0); }
    if (g.index) for (let i = 0; i < g.index.count; i++) idx.push(g.index.getX(i) + base);
    else for (let i = 0; i < p.count; i++) idx.push(i + base);
    base += p.count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  return out;
}

// 합칠 수 있는 조각인가: 보통 메시이고, 재질이 하나이고, 꼭짓점 색·변형이 없다
const mergeable = o => o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && !Array.isArray(o.material) && !o.material.vertexColors
  && !o.geometry.attributes.color && !o.geometry.morphAttributes?.position && o.geometry.attributes.position.count < 20000;
const odd = o => o.isSprite || o.isPoints || o.isLine || o.isLight || o.isInstancedMesh || o.isSkinnedMesh;

// world: createWorld, scene: buildScene가 돌려준 것. 돌려주는 것: { before, after } 그리기 조각 수
export function bakeLevel(world, scene, { steps = 3 } = {}) {
  const L = world.level, keep = new Set();
  // 1) 장면이 돌려준 물건(배열·객체 안까지)
  const seen = new Set();
  const visit = (v, depth) => {
    if (!v || typeof v !== 'object' || depth > 4 || seen.has(v)) return;
    seen.add(v);
    if (v.isObject3D) { keep.add(v); return; }
    if (Array.isArray(v)) v.forEach(x => visit(x, depth + 1));
    else if (v instanceof Map) for (const x of v.values()) visit(x, depth + 1);
    else if (Object.getPrototypeOf(v) === Object.prototype) for (const x of Object.values(v)) visit(x, depth + 1);
  };
  visit(scene, 0);
  // 2) 사람·안내판
  L.traverse(o => { if (o.userData.work || o.userData.minQuality) keep.add(o); }); // 일하는 동작을 하는 사람은 계속 움직이고, 화질에 따라 숨길 장식은 따로 둔다
  const npcMeshes = new Set([...world.npcs.values()].map(n => n.mesh));
  for (const m of npcMeshes) keep.add(m);
  // 3) 잠깐 돌려 보아 움직이거나 바뀐 것
  // 사람(걷기 움직임이 있는 인물)은 서 있는 자리(x, z)와 보이기만 본다: 숨쉬기처럼 몸이 살짝 오르내리는 것은 움직임이 아니다
  const state = o => o.userData.legs ? `${o.position.x.toFixed(3)},${o.position.z.toFixed(3)}|${o.visible}`
    : `${o.position.toArray()}|${o.quaternion.toArray()}|${o.scale.toArray()}|${o.visible}|${o.material && !Array.isArray(o.material) ? o.material.opacity : ''}`;
  const before = new Map(); L.traverse(o => before.set(o, state(o)));
  const wasPaused = world.paused; world.paused = false;
  for (let i = 0; i < steps; i++) world.step(1 / 30, { x: 0, z: 0 });
  world.paused = wasPaused;
  // 사람의 팔다리가 가만히 서서 살짝 움직이는 것(숨쉬기)은 움직임으로 치지 않는다: 그 자리에 서 있기만 하는 사람은 굳힌다
  const person = o => { let p = o; while (p && p !== L) { if (p.userData.legs) return p; p = p.parent; } return null; };
  L.traverse(o => { if (before.has(o) && before.get(o) === state(o)) return; const p = person(o); if (p && p !== o) return; keep.add(o); });
  // 위에서부터 내려가며: 그대로 둘 것(과 그 아래)은 건너뛰고, 나머지 보통 메시는 굳힌다(움직이는 깃발 옆의 깃대·집은 굳힌다)
  let count = 0; L.traverse(o => { if (o.isMesh || o.isSprite || o.isPoints) count++; });
  L.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(L.matrixWorld).invert(), rel = new THREE.Matrix4();
  const buckets = new Map(), done = [];
  // 장 코드가 통째로 움직이는 무리(행진하는 군대 등) 안의 사람은, 그 사람 안에서만 재질별로 합친다(사람을 돌리고 옮기는 것은 그대로 된다)
  const compact = p => {
    p.updateMatrixWorld(true);
    const pinv = new THREE.Matrix4().copy(p.matrixWorld).invert(), m4 = new THREE.Matrix4(), local = new Map(), gone = [];
    p.traverse(o => {
      if (!mergeable(o) || o.children.length) return;
      let q = o; while (q && q !== p) { if (!q.visible) return; q = q.parent; }
      const geo = o.geometry.clone().applyMatrix4(m4.multiplyMatrices(pinv, o.matrixWorld));
      if (!geo.attributes.normal) geo.computeVertexNormals();
      const key = `${o.material.uuid}|${o.castShadow}`;
      if (!local.has(key)) local.set(key, { mat: o.material, cast: o.castShadow, geos: [] });
      local.get(key).geos.push(geo); gone.push(o);
    });
    if (gone.length < 4) return;
    for (const o of gone) o.parent.remove(o);
    for (const b of local.values()) { const m = new THREE.Mesh(merge(b.geos), b.mat); m.castShadow = b.cast; m.receiveShadow = true; p.add(m); }
  };
  const compactInside = o => { for (const c of o.children) { if (keep.has(c)) continue; if (c.userData.legs) { if (!c.userData.skel) compact(c); } else if (!odd(c)) compactInside(c); } }; // 뼈대 몸(core/body.js) 사람은 조각이 뼈에 붙어 움직이므로 합치지 않는다
  const walk = o => {
    if (keep.has(o)) { if (!o.userData.legs && !npcMeshes.has(o)) compactInside(o); return; }
    if (!o.visible || odd(o)) return; // 숨긴 것은 나중에 보일 수 있으니 그대로
    if (o.userData.skel && !o.userData.skel.frozen) o.userData.skel.freeze(); // 움직이지 않는 군중의 뼈대 몸은 지금 자세로 멈추고(살붙인 몸은 숨김) 옷 조각을 예전처럼 굳힌다
    if (mergeable(o) && o.children.length === 0) {
      rel.multiplyMatrices(inv, o.matrixWorld);
      const geo = o.geometry.clone().applyMatrix4(rel);
      if (!geo.attributes.normal) geo.computeVertexNormals();
      const key = `${o.material.uuid}|${o.castShadow}|${o.receiveShadow}`;
      if (!buckets.has(key)) buckets.set(key, { mat: o.material, cast: o.castShadow, recv: o.receiveShadow, geos: [] });
      buckets.get(key).geos.push(geo);
      done.push(o);
      return;
    }
    for (const c of o.children) walk(c);
  };
  for (const top of L.children) walk(top);
  for (const o of done) o.parent.remove(o);
  for (const top of [...L.children]) { let empty = true; top.traverse(c => { if (c !== top && (c.isMesh || c.isSprite || c.isPoints)) empty = false; }); if (empty && !top.isMesh && !keep.has(top)) L.remove(top); }
  for (const b of buckets.values()) {
    const m = new THREE.Mesh(merge(b.geos), b.mat); m.castShadow = b.cast; m.receiveShadow = b.recv; m.name = 'baked'; L.add(m);
  }
  let after = 0; L.traverse(o => { if (o.isMesh || o.isSprite || o.isPoints) after++; });
  return { before: count, after };
}
