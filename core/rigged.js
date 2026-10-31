// 블렌더 몸 시험(2026-10-31 선생님: 블렌더로 인물 모양·움직임 완성도, 먼저 한 장에 써 보기).
// assets/models/person.glb(tools/blender/person.py가 만든 뼈대·살붙인 몸)를 사람(core/people.js의 makePerson) 안에 넣고,
// 지금의 네모난 몸통 조각(다리·신·긴 옷·소매·손·허리띠)만 숨긴다. 얼굴·머리·모자·무기·갑옷·흉배·든 물건은 그대로 둔다.
// 움직임은 지금 게임의 움직임 코드(core/motion.js 걷기·뛰기·대화 손짓, core/interact.js 악수·건네기·집기…)가 사람의 관절을 움직이고,
// 뼈대 몸은 매 프레임 그 관절을 따라간다(관절 → 뼈). 그래서 지금 되는 동작이 모두 그대로 되고, 몸 모양과 관절의 이음새만 매끄러워진다.
// 긴 옷(기본·갑옷 밑옷·단령·델·장삼·도포·전복)을 입은 생김새만 바꾼다. 시험은 켤 때만(?rig=1 또는 저장된 설정 goryeo-rig=1).
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from '../vendor/jsm/utils/SkeletonUtils.js';
import { setRigHook, POST_POSE, mat } from './people.js';

const LONG = new Set(['danryeong', 'jangsam', 'deel', 'dopo']); // 발등 가까이까지 오는 긴 옷(core/people.js와 같다)
const WIDE = new Set(['dopo', 'danryeong']);                   // 넓은 소매
const ROBES = new Set([null, undefined, 'armor', 'jeonbok', ...LONG]); // 긴 옷 꼴(core/people.js의 마지막 else 갈래)
const HIDE = new Set(['thigh', 'shin', 'shoe', 'robe', 'hem', 'belt', 'hand']); // 뼈대 몸이 대신하는 조각
const KEEP = new Set(['spear', 'sword', 'rifle', 'bow', 'headGroup']);          // 그대로 두는 묶음(무기·머리)
let base = null;

export function rigTrialOn() {
  try { if (new URLSearchParams(location.search).get('rig') === '1') return true; return localStorage.getItem('goryeo-rig') === '1'; } catch { return false; }
}
export async function loadRig(url = new URL('../assets/models/person.glb', import.meta.url).href) {
  if (!base) base = await new GLTFLoader().loadAsync(url);
  return base;
}
export const canRig = look => !!base && ROBES.has(look.outfit ?? null) && !look.royal;

// makePerson 다음에 불린다(setRigHook): 바꿀 수 있는 생김새면 뼈대 몸을 넣고 같은 사람(g)을 돌려준다
export function rigPerson(g, look) {
  if (!canRig(look)) return g;
  const u = g.userData, body = cloneSkinned(base.scene); body.name = 'rigBody';
  const outfit = look.outfit ?? null, long = LONG.has(outfit), wide = WIDE.has(outfit);
  const robe = g.getObjectByName('robe')?.material?.color?.getHex() ?? look.robe ?? 0x8a7350;
  const sleeveMesh = u.arms[1].children.find(c => c.isMesh && c.name !== 'hand');
  const color = { robe, sleeve: sleeveMesh?.material?.color?.getHex() ?? robe, trim: look.trim ?? 0x2b241c, leg: 0x2b241c, shoe: 0x1e1a16, skin: g.getObjectByName('hand')?.material?.color?.getHex() ?? 0xedc7a3 };
  const MAT = {}; // 같은 사람 안에서 재질을 나눠 쓴다(무늬는 지금 게임과 같은 mat())
  body.traverse(o => {
    if (o.isSkinnedMesh || o.isMesh) {
      const k = o.material?.name; if (color[k] != null) o.material = MAT[k] || (MAT[k] = mat(color[k], k === 'skin' ? null : undefined, 'object'));
      o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
    }
  });
  for (const [key, on] of [['robe_s', !long], ['robe_l', long], ['sleeve_n', !wide], ['sleeve_w', wide]]) { const o = body.getObjectByName(key); if (o) o.visible = on; }
  // 지금의 몸통 조각을 숨긴다(무기·머리 묶음 속은 건드리지 않는다). 팔 속의 이름 없는 상자는 소매와 소맷부리다
  const keep = o => { for (let q = o; q && q !== g; q = q.parent) if (KEEP.has(q.name)) return true; return false; };
  const inArm = o => { for (let q = o; q && q !== g; q = q.parent) if (u.arms.includes(q)) return true; return false; };
  g.traverse(o => { if (o.isMesh && !keep(o) && (HIDE.has(o.name) || (inArm(o) && !o.name))) o.visible = false; });
  g.add(body);
  // 관절 → 뼈. 사람은 +z를 보고 왼쪽이 +x(블렌더 _L): 다리 [0]은 x -0.16(오른쪽), [1]은 +0.16(왼쪽). 팔도 같다
  const B = n => body.getObjectByName(n);
  const pairs = [['spine', u.upper], ['chest', u.upper], ['neck', u.upper],
    ['thigh_R', u.legs[0]], ['shin_R', u.legs[0].userData.knee], ['foot_R', u.legs[0].userData.knee],
    ['thigh_L', u.legs[1]], ['shin_L', u.legs[1].userData.knee], ['foot_L', u.legs[1].userData.knee],
    ['upperarm_R', u.arms[0]], ['forearm_R', u.arms[0]], ['upperarm_L', u.arms[1]], ['forearm_L', u.arms[1]]]
    .map(([n, src]) => ({ bone: B(n), src }));
  if (pairs.some(p => !p.bone || !p.src)) throw new Error('rig: missing bone ' + pairs.filter(p => !p.bone).map(p => p.src?.name).join(','));
  // 쉬는 자세에서 둘의 차이를 적어 둔다: 뼈의 세계 회전 = 관절의 세계 회전 × C
  g.updateMatrixWorld(true);
  const q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion();
  for (const p of pairs) p.C = p.src.getWorldQuaternion(q1).clone().invert().multiply(p.bone.getWorldQuaternion(q2));
  u.rig = { body, pairs };
  return g;
}

// 매 프레임: 걸음·동작 코드가 관절을 다 움직인 뒤 뼈를 맞춘다(부모 뼈부터 차례로)
const want = new THREE.Quaternion(), par = new THREE.Quaternion(), tmp = new THREE.Quaternion();
function follow(g) {
  const R = g.userData.rig; if (!R || !g.parent) return;
  for (let q = g; q; q = q.parent) if (!q.visible) return; // 숨긴 사람은 맞추지 않는다
  g.updateMatrixWorld(true);
  for (const p of R.pairs) {
    want.copy(p.src.getWorldQuaternion(tmp)).multiply(p.C);
    p.bone.parent.getWorldQuaternion(par);
    p.bone.quaternion.copy(par.invert().multiply(want));
    p.bone.updateMatrixWorld(true);
  }
}
const rigged = new Set();
const sync = () => { for (const g of rigged) follow(g); };

// 켜기·끄기: 켜면 그 뒤 만드는 사람부터 뼈대 몸이 된다(이미 있는 사람은 그대로)
export function enableRig(on) {
  if (!on) { setRigHook(null); return; }
  rigged.clear(); // 장마다 새로(지난 장의 사람은 잊는다)
  setRigHook((g, look) => { const r = rigPerson(g, look); if (r.userData.rig) rigged.add(r); return r; });
  POST_POSE.add(sync);
}
export const riggedPeople = () => [...rigged];
