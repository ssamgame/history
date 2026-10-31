// 블렌더로 만든 뼈대 있는 인물(시범, 2026-10-31): assets/models/person.glb(tools/blender/person.py)를 불러
// 생김새마다 옷 색을 칠하고, 얼굴·머리카락·모자는 지금 게임이 코드로 그리는 머리(core/people.js의 headGroup)를 head 뼈에 붙인다.
// 걷기·달리기는 블렌더에서 만든 움직임을 실제로 간 빠르기에 맞춰 섞어 튼다(발이 미끄러지지 않게 한 바퀴에 가는 거리로 빠르기를 맞춘다).
// 아직 학생 화면에는 쓰지 않는다(개발 마당 tools/motion-gallery.html?act=rig 에서 지금 인물과 나란히 본다).
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from '../vendor/jsm/utils/SkeletonUtils.js';
import { makePerson } from './people.js';

const STRIDE = { walk: 1.1, run: 2.6 }; // 움직임 한 바퀴(두 걸음)에 가는 거리(m): tools/blender/person.py와 같다
const LEN = { walk: 1.0, run: 0.6 };    // 한 바퀴 시간(초)
let base = null;

export async function loadRig(url = new URL('../assets/models/person.glb', import.meta.url).href) {
  if (!base) base = await new GLTFLoader().loadAsync(url);
  return base;
}

// 생김새(look)로 한 사람을 만든다. 돌려주는 무리(Group)의 userData.rig로 움직임을 맡는다
export function makeRigged(look) {
  if (!base) throw new Error('loadRig() first');
  const root = cloneSkinned(base.scene);
  const color = { robe: look.robe ?? 0x8a7350, sleeve: look.sleeve ?? look.robe ?? 0x8a7350, trim: look.trim ?? 0x2b241c, leg: look.pants ?? 0x2b241c, shoe: 0x1e1a16, skin: 0xedc7a3 };
  root.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true; o.frustumCulled = false; // 움직이며 경계가 바뀌는 살붙인 몸
    const m = o.material; if (m && color[m.name] != null) { o.material = new THREE.MeshLambertMaterial({ color: color[m.name] }); o.material.name = m.name; }
  });
  // 머리: 지금 게임의 인물에서 머리 묶음을 떼어 head 뼈에 붙인다(얼굴 짜임·머리 모양·모자가 그대로)
  const coded = makePerson(look), head = coded.userData.head;
  const bone = root.getObjectByName('head');
  if (bone && head) { bone.add(head); head.position.set(0, 2.1 - 1.95, 0); head.rotation.set(0, 0, 0); }
  const mixer = new THREE.AnimationMixer(root), acts = {};
  for (const clip of base.animations) { const a = mixer.clipAction(clip); a.play(); a.weight = clip.name === 'idle' ? 1 : 0; acts[clip.name] = a; }
  const g = new THREE.Group(); g.add(root);
  g.userData.rig = { mixer, acts, last: null, speed: 0 };
  return g;
}

// 한 프레임: 실제로 움직인 빠르기에서 서기·걷기·달리기의 섞임과 박자를 정한다
const v = new THREE.Vector3();
export function animateRigged(g, dt) {
  const R = g.userData.rig; if (!R || !dt) return;
  g.getWorldPosition(v);
  const raw = R.last ? Math.min(12, Math.hypot(v.x - R.last.x, v.z - R.last.z) / dt) : 0;
  R.last = (R.last || new THREE.Vector3()).copy(v);
  R.speed += (raw - R.speed) * Math.min(1, dt * 6);
  const s = R.speed, run = Math.min(1, Math.max(0, (s - 2.2) / 1.6)), move = Math.min(1, s / 0.4);
  const { idle, walk, run: runA } = R.acts;
  idle.weight = 1 - move; walk.weight = move * (1 - run); runA.weight = move * run;
  // 발이 미끄러지지 않게: 한 바퀴에 가는 거리 = 빠르기 × 한 바퀴 시간
  walk.timeScale = s > 0.05 ? s / (STRIDE.walk / LEN.walk) : 1;
  runA.timeScale = s > 0.05 ? s / (STRIDE.run / LEN.run) : 1;
  R.mixer.update(dt);
}
