// 역사책 재현 그림: 쪽마다 게임 속 건물·인물 부품으로 작은 둥근 디오라마(모형 받침 위 장면)를 꾸며 한 번 찍은 그림.
// 실제 사진·사료와 헷갈리지 않게 책에는 '재현 그림'이라고 적는다(core/minigame.js readBook).
// spec = { base: 'grass'|'earth'|'stone'|'snow'|'sand', baseColor, r, water: [{ from }](x가 from보다 큰 쪽이 물), road: [{ x, z, w, d, color }],
//          sky: 'day'|'dusk'|'gray'|'snow'|'night', props: [{ type, x, z, ry, ... }](kit BUILD), people: [[look, x, z, ry, { flag, scale, work }]],
//          crowd: [{ x, z, n, cols, looks, face, flags }], cam: [x, y, z], at: [x, y, z] }
import * as THREE from 'three';
import { BUILD } from './town.js';
import { mat, makePerson, setWork, animateWalk } from '../../core/people.js';
import { LOOKS } from '../../content/characters.js';

const W = 560, H = 400;
const BASES = { grass: 0x6f8f55, earth: 0x9a8662, stone: 0xa59c8a, snow: 0xe8ecf0, sand: 0xcdbb8a };
const SKIES = {
  day: { hemi: [0xf4f1e8, 0x5d6b48, 1.0], sun: [0xfff0d0, 1.6], dir: [8, 14, 10] },
  dusk: { hemi: [0xffd9b8, 0x4a4038, 0.8], sun: [0xffc890, 1.5], dir: [-12, 8, 6] },
  gray: { hemi: [0xdfe4e8, 0x5a6050, 1.05], sun: [0xe6e8ea, 0.9], dir: [6, 14, 8] },
  snow: { hemi: [0xeef3f8, 0x8a9096, 1.1], sun: [0xe8eef5, 0.9], dir: [6, 14, 8] },
  night: { hemi: [0x8a9ab8, 0x2a2a30, 0.7], sun: [0xc8d4f0, 0.5], dir: [-6, 14, 6] },
};
let renderer = null;
const cache = new Map();

function getRenderer() {
  if (renderer) return renderer;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

function build(spec) {
  const scene = new THREE.Scene();
  const sky = SKIES[spec.sky || 'day'];
  scene.add(new THREE.HemisphereLight(...sky.hemi));
  const sun = new THREE.DirectionalLight(...sky.sun); sun.position.set(...sky.dir); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); const sc = sun.shadow.camera; sc.left = sc.bottom = -18; sc.right = sc.top = 18; sc.near = 1; sc.far = 60; sun.shadow.bias = -0.0008;
  scene.add(sun);
  // 모형 받침: 둥근 땅과 나무 테두리
  const r = spec.r || 13;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 56), mat(spec.baseColor ?? BASES[spec.base || 'grass'], spec.base === 'stone' ? 'stone' : spec.base === 'snow' ? 'grain' : 'earth'));
  base.position.y = -0.5; base.receiveShadow = true; scene.add(base);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.35, r + 0.6, 1.6, 56), mat(0x6b4a32, 'wood'));
  rim.position.y = -1.0; scene.add(rim);
  for (const w of spec.water || []) { // 물: 받침 가운데 x가 from보다 큰 쪽(받침 밖으로 삐져나가지 않게 원의 조각으로)
    const a = Math.acos(Math.max(-1, Math.min(1, w.from / r))), sh = new THREE.Shape();
    sh.moveTo(w.from, -Math.sin(a) * r); sh.absarc(0, 0, r - 0.05, -a, a, false); sh.lineTo(w.from, Math.sin(a) * r);
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh, 24).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: 0x4f86a6, shininess: 60 })); m.position.y = 0.04; scene.add(m);
  }
  for (const rd0 of spec.road || []) {
    const rd = { ...rd0 }, chord = off => 2 * Math.sqrt(Math.max(0, (r - 0.1) ** 2 - off * off)); // 긴 길은 받침 끝에서 자른다
    if (rd.d >= rd.w) rd.d = Math.min(rd.d, chord(Math.abs(rd.x) + rd.w / 2)); else rd.w = Math.min(rd.w, chord(Math.abs(rd.z) + rd.d / 2));
    const m = new THREE.Mesh(new THREE.BoxGeometry(rd.w, 0.05, rd.d), mat(rd.color ?? 0x9a8058, 'earth')); m.position.set(rd.x, 0.03, rd.z); m.rotation.y = rd.ry || 0; m.receiveShadow = true; scene.add(m); }
  for (const p of spec.props || []) {
    const g = new THREE.Group(); g.position.set(p.x, p.y || 0, p.z); g.rotation.y = p.ry || 0; if (p.scale) g.scale.setScalar(p.scale); scene.add(g);
    BUILD[p.type](g, p);
  }
  for (const c of spec.crowd || []) { const g = new THREE.Group(); g.position.set(c.x, 0, c.z); g.rotation.y = c.ry || 0; scene.add(g); BUILD.crowd(g, c); }
  for (const [look, x, z, ry = 0, o = {}] of spec.people || []) {
    const p = makePerson(LOOKS[look] || LOOKS.commoner, { track: false }); p.position.set(x, 0, z); p.rotation.y = ry; if (o.scale) p.scale.setScalar(o.scale);
    if (o.work) { setWork(p, o.work); for (let i = 0; i < 8; i++) animateWalk(p, false, 0.06); } // 일하는 자세로
    if (o.flag) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 5), mat(0x5a3f2a)); pole.position.set(0.5, 2.4, 0); p.add(pole); }
    scene.add(p);
  }
  scene.traverse(o => { if (o.isMesh) { o.castShadow = o !== base && o !== rim; o.receiveShadow = true; } });
  const camera = new THREE.PerspectiveCamera(30, W / H, 0.5, 200);
  const at = new THREE.Vector3(...(spec.at || [0, 1, 0])), eye = new THREE.Vector3(...(spec.cam || [0, 16, 26]));
  camera.position.copy(at).addScaledVector(eye.sub(at), spec.zoom || 1.4); camera.lookAt(at); // 둥근 받침이 다 보이게 조금 물러서 찍는다
  return { scene, camera };
}

// spec을 그림(PNG 데이터 주소)으로. 같은 그림은 한 번만 찍는다. 실패하면 null(책은 예전 평면 그림을 보여 준다).
export function renderDiorama(spec, key = null) {
  const k = key || JSON.stringify(spec);
  if (cache.has(k)) return cache.get(k);
  let url = null;
  try {
    const { scene, camera } = build(spec);
    const rd = getRenderer();
    rd.render(scene, camera);
    url = rd.domElement.toDataURL('image/png');
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); }); // 재질은 게임과 함께 쓰므로 두고, 모양만 치운다
  } catch (e) { url = null; }
  cache.set(k, url);
  return url;
}
