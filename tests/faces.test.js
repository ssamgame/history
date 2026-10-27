import { test, eq, ok } from './harness.js';
import { LOOKS } from '../content/characters.js';
import { portraitURL, faceTexture } from '../core/faces.js';
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
  ok(hg && hg.scale.x >= 1.25, 'head group scaled up');
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
