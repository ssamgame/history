import { test, eq, ok } from './harness.js';
import * as THREE from 'three';
import { LOOKS } from '../content/characters.js';
import { portraitURL, faceTexture, FACE_LAYOUT, faceTheta } from '../core/faces.js';
import { makePerson } from '../core/people.js';
import { createDialogue } from '../core/dialogue.js';
import ch1 from '../chapters/ch1/script.js';
import ch2 from '../chapters/ch2/script.js';
import ch3 from '../chapters/ch3/script.js';

test('faces: every character look has robe, hat and face', () => {
  for (const id of ['player', 'soldier', 'archer', 'officer', 'seohui', 'sonn', 'yanggyu', 'gangamchan', 'villager', 'khitan']) {
    const l = LOOKS[id];
    ok(l && typeof l.robe === 'number' && l.face, id);
  }
});

test('faces: every speaking person in chapters 1-3 has a known look', () => {
  for (const s of [ch1, ch2, ch3]) {
    for (const [id, sp] of Object.entries(s.speakers)) {
      if (id === 'guide') continue;
      ok(sp.look && LOOKS[sp.look], `${id} → ${sp.look}`);
    }
  }
});

test('faces: portraits are images and differ between characters', () => {
  const a = portraitURL('seohui'), b = portraitURL('sonn');
  ok(a.startsWith('data:image/png'), 'png data url');
  ok(a !== b, 'different faces');
  eq(portraitURL('seohui'), a, 'cached');
});

test('faces: a person gets a drawn face on a round head', () => {
  const p = makePerson(LOOKS.seohui);
  const face = p.getObjectByName('face');
  ok(face && face.material.map, 'face mesh with texture');
  ok(p.getObjectByName('head').geometry.type === 'SphereGeometry', 'round head');
  eq(faceTexture(LOOKS.seohui.face), faceTexture(LOOKS.seohui.face), 'texture cached');
});

test('faces: dialogue shows the speaker face, and the narrator keeps its mark', async () => {
  const root = document.createElement('div'); document.body.appendChild(root);
  const d = createDialogue(root, ch1.speakers, { typeMs: 0 });
  d.say({ who: 'seohui', text: '가' });
  const pic = root.querySelector('.dlg-portrait');
  ok(pic.style.backgroundImage.includes('data:image/png'), 'face image');
  eq(pic.textContent, '');
  d.advance();
  d.say({ who: 'narr', text: '나' });
  eq(pic.textContent, '史');
  eq(pic.style.backgroundImage, '');
  d.dispose(); root.remove();
});

test('faces: heads are drawn larger, cartoon style', () => {
  const p = makePerson(LOOKS.soldier);
  const hg = p.getObjectByName('headGroup');
  ok(hg && (hg.scale.x + hg.scale.y) / 2 >= 1.15, 'head group scaled up'); // D-54: 사람마다 얼굴 넓이·길이가 조금씩 다르다
  ok(hg.getObjectByName('face'), 'face inside the head group');
});

test('faces: every character looks solemn (no smile, no open mouth, no smiling eyes, no blush)', () => {
  for (const [id, l] of Object.entries(LOOKS)) {
    eq(l.face.mouth, 'flat', `${id} mouth`);
    eq(l.face.eyes, 'stern', `${id} eyes`);
    eq(l.face.brows, 'stern', `${id} brows`);
    ok(!l.face.blush, `${id} no blush`);
  }
});

// 고증에 가까운 얼굴: 널리 알려진 사진·초상화의 특징을 그린다
test('faces: 김구는 동그란 안경, 짧게 깎은 희끗한 머리, 둥근 얼굴, 두루마기', () => {
  const k = LOOKS.kimgu;
  eq(k.face.glasses, 'round'); eq(k.hat, 'buzz'); eq(k.face.shape, 'round'); eq(k.face.age, 'old');
  const p = makePerson(k);
  ok(p.getObjectByName('glasses'), '3D 안경');
  ok(p.getObjectByName('hat:buzz'), '짧게 깎은 머리');
});

test('faces: 이승만은 뒤로 넘긴 흰머리, 갸름한 얼굴, 양복과 넥타이', () => {
  const r = LOOKS.syngmanrhee;
  eq(r.hat, 'swept'); eq(r.outfit, 'suit'); eq(r.face.shape, 'long'); eq(r.face.age, 'old');
  ok(/^#[c-f]/i.test(r.hairColor), `흰머리 ${r.hairColor}`);
  const p = makePerson(r);
  ok(p.getObjectByName('tie'), '넥타이');
  ok(!p.getObjectByName('collar'), '한복 깃 대신 셔츠');
  const head = p.getObjectByName('headGroup');
  ok(head.scale.y > head.scale.x, '갸름한(긴) 얼굴');
});

test('faces: 콧수염·안경·주름이 들어간 얼굴은 서로 다르게 그려지고, 모든 인물에 코와 귀가 있다', () => {
  const ids = ['kimgu', 'syngmanrhee', 'ahnjunggeun', 'hongbeomdo', 'yugwansun', 'sejong', 'gojong', 'daewongun'];
  const urls = ids.map(id => portraitURL(id));
  eq(new Set(urls).size, ids.length, '초상화가 모두 다르다');
  for (const id of Object.keys(LOOKS)) {
    const p = makePerson(LOOKS[id]);
    ok(p.getObjectByName('ears'), `${id} 귀`);
    ok(p.getObjectByName('nose'), `${id} 코`);
  }
  eq(LOOKS.ahnjunggeun.face.beard, 'thick'); eq(LOOKS.hongbeomdo.face.beard, 'walrus');
});

// 2026-10-26 선생님: 투구·모자·갓 등에 얼굴이 가리면 안 된다. 눈썹·눈 자리를 앞(대화 카메라)과 비스듬히 위(탐험 카메라)에서 겨눠
// 맨 먼저 맞는 것이 얼굴이어야 한다(모자 아래 끝이 눈썹보다 위).
export function faceBlockers(look) {
  const p = makePerson(look, { track: false, stable: true });
  p.updateMatrixWorld(true);
  const hg = p.getObjectByName('headGroup');
  const meshes = []; p.traverse(o => { if (o.isMesh && !['glasses', 'ears', 'nose'].includes(o.parent?.name) && o.name !== 'nose') meshes.push(o); });
  const ray = new THREE.Raycaster(), bad = [];
  // 얼굴 무늬의 눈썹(위 끝)·눈 높이를 머리 곡면 위 각도로 옮긴다(D-55: 배치는 core/faces.js FACE_LAYOUT, phi 폭 2.3)
  const { cy, R } = FACE_LAYOUT;
  const spots = [['눈썹', cy - 0.38 * R], ['눈', cy - 0.06 * R]];
  for (const [what, py] of spots) for (const sx of [-1, 1]) {
    const theta = faceTheta(py), phi = sx * (0.33 * R) * 2.3;
    const local = new THREE.Vector3(0.326 * Math.sin(theta) * Math.sin(phi), 0.326 * Math.cos(theta), 0.326 * Math.sin(theta) * Math.cos(phi));
    const target = hg.localToWorld(local.clone());
    for (const [cam, down] of [['대화', 0.16], ['탐험', 0.5]]  /* 대화: 높이 2.9에서 3.8m, 탐험: 8.5 위 12 뒤(27도) */) {
      const dir = new THREE.Vector3(0, -Math.sin(down), -Math.cos(down)).normalize();
      ray.set(target.clone().addScaledVector(dir, -4), dir);
      const hit = ray.intersectObjects(meshes, false)[0];
      if (hit && hit.object.name !== 'face' && hit.distance < 4 - 0.02) bad.push(`${what}(${cam}): ${hit.object.parent?.name || ''}/${hit.object.geometry.type} y${hg.worldToLocal(hit.point.clone()).y.toFixed(3)} z${hg.worldToLocal(hit.point.clone()).z.toFixed(3)}`);
    }
  }
  return bad;
}

test('faces: 모자·투구·갓을 쓴 모든 인물의 눈썹과 눈이 대화·탐험 카메라에서 가리지 않는다', () => {
  const bad = [];
  // D-55: 기본 얼굴(0)과 군중 얼굴 여섯(1~6) 모두 얼굴형·이목구비 자리가 달라서 다 본다
  for (const [id, look] of Object.entries(LOOKS)) for (let n = 0; n <= 6; n++) { const b = faceBlockers({ ...look, _n: n }); if (b.length) { bad.push(`${id}:${n}(${look.hat}): ${b[0]}`); break; } }
  eq(bad.length, 0, bad.join(' | '));
});

// D-11-1: 모든 인물의 걸음(1장 물러나는 거란군과 같은 걸음): 다리 크게 앞뒤, 팔은 반대로, 걸음마다 몸이 들썩, 사람마다 박자가 다르다
import { animateWalk, gaitPose } from '../core/people.js';
test('walk D-11: walking people swing legs wide with arms opposite, bob, and keep their own beat', () => {
  const a = makePerson(LOOKS.soldier), b = makePerson(LOOKS.villager);
  let maxLeg = 0, opposite = true, minY = Infinity, maxY = -Infinity, differ = false;
  for (let i = 0; i < 80; i++) {
    a.position.x += 1.5 / 30; b.position.x += 1.5 / 30; // 2026-10-30: 걸음은 실제로 간 거리만큼(제자리 걸음은 하지 않는다)
    animateWalk(a, true, 1 / 30); animateWalk(b, true, 1 / 30);
    const u = a.userData;
    if (i > 20) {
      maxLeg = Math.max(maxLeg, Math.abs(u.legs[0].rotation.x));
      if (Math.abs(u.legs[0].rotation.x) > 0.2 && Math.sign(u.legs[0].rotation.x) === Math.sign(u.arms[0].rotation.x)) opposite = false;
      minY = Math.min(minY, a.position.y); maxY = Math.max(maxY, a.position.y);
      if (Math.abs(a.userData.legs[0].rotation.x - b.userData.legs[0].rotation.x) > 0.3) differ = true;
    }
  }
  ok(maxLeg > 0.6, `legs swing wide (${maxLeg.toFixed(2)})`);
  ok(opposite, 'arm swings against the leg on the same side');
  ok(maxY - minY > 0.04, `body bobs (${(maxY - minY).toFixed(3)})`);
  ok(differ, 'two people do not step in lockstep');
  for (let i = 0; i < 60; i++) animateWalk(a, false, 1 / 30);
  ok(Math.abs(a.position.y) < 0.005, `bob settles back when stopping (${a.position.y})`);
  ok(Math.abs(a.userData.legs[0].rotation.x) < 0.05, 'legs settle when stopping');
});
test('walk D-11: a chapter that sets the height each frame keeps its height (bob does not pile up)', () => {
  const a = makePerson(LOOKS.soldier);
  for (let i = 0; i < 200; i++) { a.position.y = 2; animateWalk(a, true, 1 / 30); ok(Math.abs(a.position.y - 2) < 0.1, `y ${a.position.y}`); }
});
test('walk D-11: gaitPose bends knees only on people that have knees', () => {
  const a = makePerson(LOOKS.soldier);
  const h = gaitPose(a, 1.2);
  ok(h >= 0 && h <= 0.081, 'bob height');
  eq(a.userData.legs[0].rotation.x !== 0, true);
});
