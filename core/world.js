// 3D 무대: 렌더러, 분위기(하늘·안개·빛), 따라가는 카메라, 플레이어, 인물, 충돌, 목표 화살표.
import * as THREE from 'three';
import { QUALITY } from './quality.js';
import { makePerson, animateWalk, animateWalkers, markerSprite } from './people.js';
import { animateHorses } from './horse.js';
import { LOOKS } from '../content/characters.js';

// 장면 분위기. 2~6장 값은 다음 계획에서 채운다.
export const MOODS = {
  sunset: {
    skyTop: 0x4a5a86, skyHorizon: 0xf2b072, skyBottom: 0x8a7a62,
    fog: [0xe7b48c, 45, 150],
    sun: { color: 0xffcf9a, intensity: 1.7, dir: [-34, 22, -20] },
    hemi: [0xffd9b8, 0x4e5a48, 0.7], // 2026-10-25: 담판 장면 얼굴이 그늘지지 않게 조금 밝게
    particles: 'embers',
  },
  // 겨울 해 질 녘: 노을 하늘은 두고 하늘빛·해를 밝혀 흙 마을이 갈색으로 뭉치지 않게 (근대 2장 1884년 12월 갑신정변)
  winterDusk: {
    skyTop: 0x4f5f8a, skyHorizon: 0xf0b88a, skyBottom: 0x8a8070,
    fog: [0xe0c0a4, 45, 150],
    sun: { color: 0xffdcb8, intensity: 1.75, dir: [-34, 30, -16] },
    hemi: [0xffe8d4, 0x7a7466, 1.0],
    particles: null, clouds: 0.35,
  },
  snow: {
    skyTop: 0x8494a8, skyHorizon: 0xc4cdd8, skyBottom: 0x9aa3a8,
    fog: [0xc6ced8, 30, 120],
    sun: { color: 0xe8eef5, intensity: 0.8, dir: [20, 30, 10] },
    hemi: [0xeef3f8, 0x7a8088, 0.75], // 2026-10-25: 흰 눈·성벽·하늘이 한 덩어리로 보이지 않게 조금 낮춤
    particles: 'snow',
  },
  storm: {
    skyTop: 0x3b4652, skyHorizon: 0x76828c, skyBottom: 0x4a5258,
    fog: [0x5f6b74, 20, 90],
    sun: { color: 0xc8d2dc, intensity: 0.7, dir: [10, 30, 20] },
    hemi: [0xb4c0cc, 0x3a4038, 0.9],
    particles: 'rain',
  },
  overcast: {
    skyTop: 0x6f7a86, skyHorizon: 0xb9c0c4, skyBottom: 0x7a7f78,
    fog: [0xaeb5b8, 35, 130],
    sun: { color: 0xeceeec, intensity: 1.25, dir: [15, 30, 20] },
    hemi: [0xe4e8ea, 0x747a6a, 1.08], // 2026-10-25: 다섯 장이 54~69로 어두워 밝힘
    particles: null,
  },
  morning: {
    skyTop: 0x7fa8d0, skyHorizon: 0xf4e3c2, skyBottom: 0x8a9a7a,
    fog: [0xe8e2cf, 40, 140],
    sun: { color: 0xfff0d0, intensity: 1.5, dir: [30, 25, 10] },
    hemi: [0xf4f1e8, 0x5d6b48, 0.8],
    particles: null,
  },
  // 맑은 가을: 높은 하늘과 따뜻한 햇빛 (조선편 6장)
  autumn: {
    skyTop: 0x5f93c8, skyHorizon: 0xf0dcb4, skyBottom: 0x9a8a62,
    fog: [0xead9b4, 45, 150],
    sun: { color: 0xffe2b0, intensity: 1.55, dir: [-25, 30, 15] },
    hemi: [0xf6ead2, 0x6a5a38, 0.8],
    particles: null, clouds: 0.35,
  },
  // 장맛비: 폭풍보다 밝은 잿빛 초록, 낮게 깔린 구름 (조선편 1장)
  monsoon: {
    skyTop: 0x5f6e78, skyHorizon: 0xa9b4b0, skyBottom: 0x5e6a60,
    fog: [0x8f9b98, 28, 115],
    sun: { color: 0xd8e0e0, intensity: 0.75, dir: [10, 30, 20] },
    hemi: [0xcfd8d8, 0x5a6454, 0.9],
    particles: 'rain', clouds: 0.85, cloud: 0xb0b8b8,
  },
  // 봄: 옅은 하늘과 부드러운 햇살 (조선 2장 경복궁)
  spring: {
    skyTop: 0x8ab4dc, skyHorizon: 0xf6e8e0, skyBottom: 0x93a07c,
    fog: [0xeee6dc, 45, 150],
    sun: { color: 0xfff2dc, intensity: 1.45, dir: [25, 30, 15] },
    hemi: [0xf8f0ea, 0x63704c, 0.85],
    particles: null, clouds: 0.25,
  },
  // 한여름: 높고 짙은 하늘, 강한 햇빛과 짧은 그림자 (조선 3장 한양, 현대 1장 광복)
  summer: {
    skyTop: 0x4f8fd0, skyHorizon: 0xe6eef0, skyBottom: 0x7f9a6a,
    fog: [0xdfe8e4, 50, 160],
    sun: { color: 0xfff8e6, intensity: 1.7, dir: [12, 40, 10] },
    hemi: [0xf2f6f4, 0x5a6a44, 0.75],
    particles: null, clouds: 0.3,
  },
  // 한낮의 도시: 맑고 담백한 빛 (근대 5장 전찻길, 현대 6장 서울)
  noon: {
    skyTop: 0x6f9ed0, skyHorizon: 0xe8e6de, skyBottom: 0x8a8a80,
    fog: [0xe2e0d8, 45, 150],
    sun: { color: 0xfffaf0, intensity: 1.55, dir: [18, 38, 14] },
    hemi: [0xf2f2ee, 0x6a6a60, 0.8],
    particles: null, clouds: 0.2,
  },
  // 이른 봄: 차갑고 맑은 3월 아침 (일제 2장 3·1 운동)
  earlySpring: {
    skyTop: 0x7aa2cc, skyHorizon: 0xe4e8ea, skyBottom: 0x8a8c80,
    fog: [0xdfe3e4, 40, 140],
    sun: { color: 0xf6f4ec, intensity: 1.35, dir: [28, 26, 12] },
    hemi: [0xeef1f2, 0x6a6a5a, 0.85],
    particles: null, clouds: 0.3,
  },
  // 숲·산골: 나무 사이로 드는 초록빛, 옅은 산안개 (고려 5장 해인사, 일제 4장 만주)
  forest: {
    skyTop: 0x7aa0b8, skyHorizon: 0xe6ebe2, skyBottom: 0x5f7454,
    fog: [0xd8ddd0, 30, 120],
    sun: { color: 0xfff2d6, intensity: 1.35, dir: [-20, 32, 12] },
    hemi: [0xe6efe2, 0x56684a, 0.9],
    particles: null, clouds: 0.4,
  },
  // 옅은 안개: 조금 가라앉은 잿빛 낮(너무 어둡지 않게) (일제 5장 경성, 6장 충칭)
  haze: {
    skyTop: 0x8a96a2, skyHorizon: 0xd8d4c8, skyBottom: 0x80806e,
    fog: [0xcfcbc0, 30, 120],
    sun: { color: 0xf4ead6, intensity: 1.15, dir: [22, 30, 16] },
    hemi: [0xe8e4da, 0x5e5e50, 0.95],
    particles: null, clouds: 0.6, cloud: 0xd8d4cc,
  },
  sea: {
    skyTop: 0x5d8fc4, skyHorizon: 0xd8eef5, skyBottom: 0x2f6f8f,
    fog: [0xcfe4ec, 60, 220],
    sun: { color: 0xfff6e0, intensity: 1.6, dir: [25, 35, 15] },
    hemi: [0xeaf4fa, 0x2f5f75, 0.8],
    particles: null,
  },
};

const SPEED = 6.5;
const PLAYER_R = 0.4;
const CAM_OFFSET = new THREE.Vector3(0, 8.5, 12);
const CAM_LOW = new THREE.Vector3(0, 6, 9); // 가까운 시점(D-5): 조금 낮은 카메라
const FOV = 50; // 가까운 시점: 대화 때는 화각을 좁혀(talkFov) 얼굴을 크게
const LOOK_AHEAD = -4; // 카메라는 플레이어보다 조금 앞(북쪽)을 본다

// 하늘: 위·지평선·아래 세 색의 그러데이션 + 해 둘레의 빛 + 천천히 흐르는 구름(화질 낮음에서는 구름을 끈다)
function skyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, bottom: { value: new THREE.Color() },
      sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunColor: { value: new THREE.Color() },
      cloudAmt: { value: 0.5 }, cloudColor: { value: new THREE.Color(1, 1, 1) }, time: { value: 0 },
    },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; uniform vec3 sunDir; uniform vec3 sunColor;
      uniform float cloudAmt; uniform vec3 cloudColor; uniform float time; varying vec3 vP;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
      void main(){
        vec3 d = normalize(vP); float h = d.y;
        vec3 c = h > 0.0 ? mix(horizon, top, pow(h, 0.55)) : mix(horizon, bottom, pow(-h, 0.4));
        float s = max(dot(d, normalize(sunDir)), 0.0);
        c += sunColor * (pow(s, 12.0) * 0.3 + pow(s, 600.0) * 0.8);
        if (h > 0.0 && cloudAmt > 0.0) {
          vec2 uv = d.xz / (h + 0.2) * 1.5 + vec2(time * 0.01, time * 0.003);
          float n = noise(uv) * 0.55 + noise(uv * 2.3) * 0.3 + noise(uv * 5.1) * 0.15;
          float cl = smoothstep(0.5, 0.78, n) * cloudAmt * smoothstep(0.0, 0.3, h);
          c = mix(c, cloudColor * (0.82 + 0.18 * n), cl);
        }
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}

export function createWorld(container, { quality = 'medium', renderer: injected = null } = {}) {
  let renderer;
  try { renderer = injected || new THREE.WebGLRenderer({ antialias: quality !== 'low' }); }
  catch (e) { const err = new Error('WEBGL_UNAVAILABLE'); err.cause = e; throw err; }
  container.appendChild(renderer.domElement);
  // 영화 같은 색 처리: 밝은 곳이 하얗게 날아가지 않고 부드럽게 눌린다
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 400);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 12), skyMaterial());
  scene.add(sky);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
  const sun = new THREE.DirectionalLight(0xffffff, 1);
  // 해와 그림자 범위는 카메라가 보는 곳을 따라다닌다(맵 어디서나 그림자가 생긴다). 범위가 좁을수록 그림자가 또렷하다.
  Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 180 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
  const sunDir = new THREE.Vector3(0, 1, 0);
  scene.add(hemi, sun, sun.target);

  const level = new THREE.Group();
  scene.add(level);
  const player = makePerson(LOOKS.player, { track: false, stable: true });
  scene.add(player);

  const goalArrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 1, 3).rotateX(Math.PI / 2).translate(0, 0, 1.6),
    new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.85 }),
  );
  goalArrow.visible = false;
  scene.add(goalArrow);

  const camTarget = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const updaters = [];
  let goal = null, elapsed = 0, fit = null;
  const talkPos = new THREE.Vector3(), talkTarget = new THREE.Vector3(), offsetVec = new THREE.Vector3();
  const projected = new THREE.Vector3();
  let talkFov = FOV, hidForTalk = false;
  function applyFit() {
    camera.updateProjectionMatrix();
    for (let d = 8; d <= 160; d += 0.5) {
      camera.position.copy(fit.target).addScaledVector(fit.dir, d);
      camera.lookAt(fit.target);
      camera.updateMatrixWorld();
      if (fit.points.every(p => { projected.copy(p).project(camera); return Math.abs(projected.x) <= fit.margin && Math.abs(projected.y) <= fit.margin; })) break;
    }
    camTarget.copy(fit.target);
    fit.aspect = camera.aspect;
  }

  function placeSun() {
    sun.target.position.copy(camTarget);
    sun.position.copy(camTarget).addScaledVector(sunDir, 80);
  }

  const world = {
    scene, camera, renderer, level, player, goalArrow, sun,
    colliders: [], npcs: new Map(),
    bounds: { x0: -50, x1: 50, z0: -50, z1: 50 },
    camMode: 'follow',
    closeView: false, // 가까운 시점(D-5): 낮은 카메라, 대화 때 인물 얼굴을 정면에서 크게(학생 몸은 숨김). 장이 켜고 끈다
    followOffset: null, // 따라가기 카메라 자리(학생 기준 Vector3)를 장이 잠깐 바꿀 때(고려 2장 성벽 위). 없으면 보통 자리
    followLookY: null,  // 따라가기 카메라가 바라보는 높이를 장이 잠깐 바꿀 때. 없으면 closeView에 따라 1.2 또는 1
    autoMove: null, // 정해진 걸음({x,z}): 있으면 입력 대신 이 방향으로 걷는다(장 시작 장면)
    quality: QUALITY[quality],
    qualityLevel: quality,

    setMood(name) {
      const m = MOODS[name];
      sky.material.uniforms.top.value.set(m.skyTop);
      sky.material.uniforms.horizon.value.set(m.skyHorizon);
      sky.material.uniforms.bottom.value.set(m.skyBottom);
      scene.fog = new THREE.Fog(m.fog[0], m.fog[1], m.fog[2]);
      scene.background = new THREE.Color(m.fog[0]);
      sun.color.set(m.sun.color); sun.intensity = m.sun.intensity;
      sunDir.set(...m.sun.dir).normalize();
      sky.material.uniforms.sunDir.value.copy(sunDir);
      sky.material.uniforms.sunColor.value.set(m.sun.color).multiplyScalar(Math.min(1, m.sun.intensity));
      sky.material.uniforms.cloudColor.value.set(m.cloud ?? 0xffffff);
      sky.material.uniforms.cloudAmt.value = world.quality.particles > 0.3 ? (m.clouds ?? 0.5) : 0;
      placeSun();
      hemi.color.set(m.hemi[0]); hemi.groundColor.set(m.hemi[1]); hemi.intensity = m.hemi[2];
      world.mood = m; world.moodName = name; // moodName: 장면 부품이 계절에 맞는 언덕 풀빛을 고를 때 쓴다
    },
    setQuality(levelName) {
      const q = QUALITY[levelName];
      world.quality = q; world.qualityLevel = levelName;
      renderer.setPixelRatio(Math.min(q.pixelRatio, Math.max(1, window.devicePixelRatio || 1)));
      renderer.shadowMap.enabled = q.shadows !== 'off';
      renderer.shadowMap.type = q.shadows === 'soft' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
      sun.castShadow = q.shadows !== 'off';
      const ms = levelName === 'high' ? 4096 : q.shadows === 'soft' ? 2048 : 1024; // 높음은 그림자를 더 또렷하게
      if (sun.shadow.mapSize.x !== ms) { sun.shadow.mapSize.set(ms, ms); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
      if (world.mood) sky.material.uniforms.cloudAmt.value = q.particles > 0.3 ? (world.mood.clouds ?? 0.5) : 0;
      scene.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(mm => { mm.needsUpdate = true; }); });
      world.applyDecor();
      world.resize();
    },
    // 멀리 있는 덜 중요한 장식(userData.minQuality: 'medium'|'high')은 화질이 그보다 낮으면 숨긴다. 걷는 곳·사람·가운데 소품은 표시가 없어 늘 보인다
    applyDecor(root = scene) {
      const rank = { low: 0, medium: 1, high: 2 }, lv = rank[world.qualityLevel] ?? 1;
      root.traverse(o => { if (o.userData.minQuality) o.visible = lv >= rank[o.userData.minQuality]; });
    },
    resize() {
      const w = container.clientWidth || window.innerWidth, h = container.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    },
    // 장마다 학생 생김새를 바꾼다(조선편 수군·일꾼 등). 플레이어 물체는 그대로 두고 안의 몸만 바꾼다. scale: 역할의 키(아이는 작게)
    setPlayerLook(opts, scale = 1) {
      player.scale.setScalar(scale);
      const fresh = makePerson(opts, { track: false, stable: true });
      for (const c of [...player.children]) { player.remove(c); c.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
      for (const c of [...fresh.children]) player.add(c);
      player.userData = fresh.userData;
    },
    addCollider(c) { world.colliders.push(c); return c; },
    addNpc(id, opts, x, z, faceY = 0) {
      const mesh = makePerson(opts, { stable: true }); // 말을 거는 사람은 대화창 얼굴과 같은 생김새
      mesh.position.set(x, 0, z); mesh.rotation.y = faceY;
      const mark = markerSprite('!'); mark.position.set(0, 3.5, 0); mark.visible = false; mesh.add(mark);
      level.add(mesh);
      const npc = { id, mesh, mark, collider: world.addCollider({ x, z, r: 0.5 }) };
      world.npcs.set(id, npc);
      return npc;
    },
    // 사람이 아닌 '말 걸 수 있는 것'(안내판 등). 인물처럼 가까이 가서 대화 버튼으로 읽는다. 파란 'i' 표시가 늘 떠 있다.
    addSpot(id, mesh, x, z, faceY = 0) {
      mesh.position.set(x, 0, z); mesh.rotation.y = faceY;
      const mark = markerSprite('i', '#7fb3c8'); mark.position.set(0, mesh.userData.markY ?? 3.1, mesh.userData.markZ ?? 0); mark.scale.setScalar(0.6); mesh.add(mark);
      level.add(mesh);
      const spot = { id, mesh, mark, spot: true, collider: world.addCollider({ x, z, r: mesh.userData.plaque ? 0 : 0.6 }) }; // 건물 간판은 건물 앞 땅이 읽는 자리(막지 않는다)
      world.npcs.set(id, spot);
      return spot;
    },
    moveNpc(id, x, z, faceY) {
      const n = world.npcs.get(id);
      n.mesh.position.set(x, 0, z); n.mesh.rotation.y = faceY; n.collider.x = x; n.collider.z = z;
    },
    nearestNpc(maxDist) {
      let best = null, bestD = maxDist;
      for (const n of world.npcs.values()) {
        if (!n.mesh.visible) continue;
        const d = n.mesh.position.distanceTo(player.position);
        if (d < bestD) { bestD = d; best = n; }
      }
      return best;
    },
    setGoal(target) { goal = target; },
    getGoal() { return goal; },
    // 대화 카메라: 플레이어 어깨 너머로 말하는 인물의 얼굴이 보이도록 다가간다. 끝나면 camMode를 'follow'로.
    setTalkCamera(npcMesh) {
      const n = npcMesh.position, p = player.position;
      let dx = p.x - n.x, dz = p.z - n.z;
      const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
      if (world.closeView) { // 인물 정면(학생 쪽)에서 화각을 좁혀 얼굴을 화면 높이의 1/3쯤으로(얼굴은 위쪽, 대화창은 아래). 학생 몸은 대화 동안 숨긴다
        talkPos.set(n.x + dx * 3.4, 2.35, n.z + dz * 3.4);
        talkTarget.set(n.x + dx * 0.3, 2.05, n.z + dz * 0.3);
        talkFov = Math.min(FOV, Math.max(26, 2 * Math.atan(1.35 / talkPos.distanceTo(talkTarget)) * 180 / Math.PI));
      } else {
        talkPos.set(n.x + dx * 3.6 + dz * 1.3, 2.9, n.z + dz * 3.6 - dx * 1.3);
        talkTarget.set(n.x + dx * 0.5, 2.3, n.z + dz * 0.5);
      }
      player.rotation.y = Math.atan2(-dx, -dz); // 플레이어도 인물을 바라본다
      world.camMode = 'talk';
    },
    setFixedCamera(pos, target) {
      world.camMode = 'fixed'; fit = null;
      camera.position.set(...pos); camTarget.set(...target); camera.lookAt(camTarget);
    },
    // 고정 카메라를 target에서 dir 방향으로 물리며, points가 모두 화면 안(margin)에 들 때까지 거리를 늘린다.
    // 화면 비율이 바뀌면(창 크기 변경) 다음 프레임에 다시 맞춘다.
    fitFixedCamera(target, dir, points, margin = 0.85) {
      world.camMode = 'fixed';
      fit = { target: new THREE.Vector3(...target), dir: new THREE.Vector3(...dir).normalize(), points: points.map(p => new THREE.Vector3(...p)), margin, aspect: null };
      applyFit();
    },
    snapCamera() {
      camera.position.copy(player.position).add(world.camOffset());
      camTarget.copy(player.position).setY(world.followLookY ?? (world.closeView ? 1.2 : 1)); camTarget.z += LOOK_AHEAD; camera.lookAt(camTarget);
    },
    // 따로 쓰는 벡터(offsetVec)에 담는다. tmp를 같이 쓰면 'tmp.copy(p).add(camOffset())'가 '오프셋×2'가 되어 카메라가 원점 근처에 머문다.
    camOffset() { return offsetVec.copy(world.followOffset || (world.closeView ? CAM_LOW : CAM_OFFSET)).multiplyScalar(camera.aspect < 1 ? Math.min(2.1, 1.15 / camera.aspect) : 1); }, // 세로 화면은 좌우가 좁아 더 멀리서 본다
    onUpdate(fn) {
      updaters.push(fn);
      return () => { const i = updaters.indexOf(fn); if (i >= 0) updaters.splice(i, 1); };
    },
    paused: false, // 메뉴가 열려 있는 동안 true: 미니게임 시간과 움직임을 멈춘다
    step(dt, move) {
      if (world.paused) return;
      elapsed += dt;
      if (world.autoMove) move = world.autoMove;
      const len = Math.hypot(move.x, move.z), moving = len > 0.01;
      const p = player.position;
      if (moving) {
        const sp = SPEED * (world.speedScale || 1); // 배·전차 같은 탈것은 더 빠르게
        p.x += move.x * sp * dt; p.z += move.z * sp * dt;
        for (const c of world.colliders) {
          const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), min = c.r + PLAYER_R;
          if (d < min && d > 1e-6) { p.x = c.x + (dx / d) * min; p.z = c.z + (dz / d) * min; }
        }
        const b = world.bounds;
        p.x = Math.min(b.x1, Math.max(b.x0, p.x)); p.z = Math.min(b.z1, Math.max(b.z0, p.z));
        let diff = Math.atan2(move.x, move.z) - player.rotation.y;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        player.rotation.y += diff * Math.min(1, dt * 12);
      }
      animateWalk(player, moving, dt);
      for (const n of world.npcs.values()) if (n.mark.visible) n.mark.position.y = (n.spot ? (n.mesh.userData.markY ?? 3.1) : 3.5) + Math.sin(elapsed * 3) * 0.12;
      if (goal) {
        const dx = goal.x - p.x, dz = goal.z - p.z;
        goalArrow.visible = Math.hypot(dx, dz) > 3;
        goalArrow.position.set(p.x, 0.15, p.z);
        goalArrow.rotation.y = Math.atan2(dx, dz);
      } else goalArrow.visible = false;
      for (const fn of [...updaters]) fn(dt, elapsed); // 도중에 해제해도 안전하도록 복사본을 돈다
      animateWalkers(dt, scene); // 움직인 인물(따라오는 사람·감시원 등)은 다리를 흔든다
      animateHorses(dt, scene); // 말: 움직인 빠르기에 맞는 걸음새(core/horse.js)
      if (world.camMode === 'fixed' && fit && fit.aspect !== camera.aspect) applyFit();
      if (world.camMode === 'talk') {
        const a = 1 - Math.exp(-dt * (world.closeView ? 3 : 5)); // 가까운 시점은 더 천천히 다가간다
        camera.position.lerp(talkPos, a);
        camTarget.lerp(talkTarget, a);
        camera.lookAt(camTarget);
      }
      const closeTalk = world.closeView && world.camMode === 'talk';
      if (closeTalk) { if (player.visible) { player.visible = false; hidForTalk = true; } }
      else if (hidForTalk) { player.visible = true; hidForTalk = false; }
      const fov = closeTalk ? talkFov : FOV; // 가까운 시점: 대화 때 천천히 당겨 본다
      if (camera.fov !== fov) { const d = fov - camera.fov; camera.fov = Math.abs(d) < 0.05 ? fov : camera.fov + d * Math.min(1, dt * 3); camera.updateProjectionMatrix(); }
      if (world.camMode === 'follow') {
        const a = 1 - Math.exp(-dt * 4);
        camera.position.lerp(tmp.copy(p).add(world.camOffset()), a);
        camTarget.lerp(tmp.copy(p).setY(world.followLookY ?? (world.closeView ? 1.2 : 1)).setZ(p.z + LOOK_AHEAD), a);
        camera.lookAt(camTarget);
      }
      placeSun();
      sky.material.uniforms.time.value = elapsed;
      sky.position.copy(camera.position); // 하늘은 늘 카메라를 둘러싼다
    },
    clearLevel() {
      for (const o of [...level.children]) {
        level.remove(o);
        o.traverse(c => { if (c.geometry) c.geometry.dispose(); });
      }
      world.colliders.length = 0; world.npcs.clear(); updaters.length = 0; goal = null;
      world.closeView = false; world.followOffset = null; world.followLookY = null; world.autoMove = null; if (hidForTalk) { player.visible = true; hidForTalk = false; } camera.fov = FOV; camera.updateProjectionMatrix();
    },
    render() { renderer.render(scene, camera); },
    dispose() {
      world.clearLevel();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
  world.setQuality(quality);
  world.setMood('sunset');
  world.snapCamera();
  return world;
}
