// 얼굴 짜임(D-55): 얼굴형·눈·눈썹·코·입 유형 조합으로 인물마다 다른 얼굴, 같은 역할의 군중도 서로 다른 얼굴, 상황 표정
import { test, eq, ok } from './harness.js';
import { LOOKS } from '../content/characters.js';
import { buildFace, resolve, roleOf, SHAPES, EYES, BROWS, NOSES, MOUTHS, EXPRESSIONS, ROLES } from '../core/facebuild.js';
import { makePerson, setExpression } from '../core/people.js';

const PARTS = ['shape', 'eye', 'brow', 'nose', 'mouth'];
const differ = (a, b) => PARTS.filter(k => a[k] !== b[k]).length;

test('facebuild D-55: 대표 인물 일곱(장군·병사·농민·상인·노인·아이·학자)은 얼굴형과 이목구비가 서로 다르다', () => {
  const ids = ['yanggyu', 'soldier', 'villager', 'artisan', 'gangamchan', 'kid', 'seohui'];
  const B = ids.map(id => buildFace(LOOKS[id]));
  ok(new Set(B.map(b => b.shape)).size >= 5, `얼굴형 ${B.map(b => b.shape)}`);
  ok(new Set(B.map(b => b.eye)).size >= 5, `눈 ${B.map(b => b.eye)}`);
  ok(new Set(B.map(b => b.nose)).size >= 4, `코 ${B.map(b => b.nose)}`);
  ok(new Set(B.map(b => b.mouth)).size >= 4, `입 ${B.map(b => b.mouth)}`);
  for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) ok(differ(B[i], B[j]) >= 3, `${ids[i]}·${ids[j]}: 다른 부위 ${differ(B[i], B[j])}`);
  eq(roleOf(LOOKS.yanggyu), 'general'); eq(roleOf(LOOKS.kid), 'child'); eq(roleOf(LOOKS.gangamchan), 'elder'); eq(roleOf(LOOKS.artisan), 'merchant');
});

test('facebuild D-55: 같은 생김새의 군중 여섯은 서로 다른 얼굴형·이목구비, 같은 번호는 늘 같은 얼굴', () => {
  for (const id of ['soldier', 'villager', 'khitan', 'citizen', 'woman']) {
    const B = [1, 2, 3, 4, 5, 6].map(n => buildFace(LOOKS[id], n));
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) ok(differ(B[i], B[j]) >= 2, `${id} ${i + 1}·${j + 1}`);
    eq(buildFace(LOOKS[id], 3), buildFace(LOOKS[id], 3), '같은 번호는 같은 얼굴');
  }
});

test('facebuild D-55: 유형 표는 이름으로 관리되고, 역할마다 고르는 유형이 모두 있다', () => {
  for (const r of Object.values(ROLES)) {
    for (const s of r.shape) ok(SHAPES[s], s); for (const e of r.eye) ok(EYES[e], e); for (const b of r.brow) ok(BROWS[b], b);
    for (const n of r.nose) ok(NOSES[n], n); for (const m of r.mouth) ok(MOUTHS[m], m);
  }
  for (const L of Object.values(LOOKS)) for (const [k, T] of [['shape', SHAPES], ['eye', EYES], ['brow', BROWS], ['nose', NOSES], ['mouth', MOUTHS]]) if (L.face.build?.[k]) ok(T[L.face.build[k]], `${k} ${L.face.build[k]}`);
});

test('facebuild D-55: 얼굴형이 3D 머리 너비·길이에, 코 유형이 3D 코에 나타난다', () => {
  const wide = makePerson({ ...LOOKS.artisan }, { stable: true }), long = makePerson({ ...LOOKS.gangamchan }, { stable: true });
  const hw = wide.getObjectByName('headGroup').scale, hl = long.getObjectByName('headGroup').scale;
  ok(hw.x / hw.y > hl.x / hl.y + 0.15, `넓적한 얼굴 ${(hw.x / hw.y).toFixed(2)} > 긴 얼굴 ${(hl.x / hl.y).toFixed(2)}`);
  const tipW = p => p.getObjectByName('noseTip').scale.x;
  ok(tipW(makePerson(LOOKS.villager, { stable: true })) > tipW(makePerson(LOOKS.kid, { stable: true })), '넓적한 코 > 작은 코');
});

test('facebuild D-55: 상황 표정은 눈 크기·눈꺼풀·입까지 바꾸고, 얼굴 무늬를 갈아 끼운다', () => {
  const b = buildFace(LOOKS.villager), n = resolve(b), s = resolve(b, 'surprise'), a = resolve(b, 'anger'), j = resolve(b, 'joy');
  ok(s.eyeH > n.eyeH && s.open > 0 && s.browIn < n.browIn, '놀람: 눈이 커지고 입을 벌리고 눈썹이 올라간다');
  ok(a.squint > n.squint && a.browIn > n.browIn && a.tight, '분노: 눈을 가늘게, 미간, 앙다문 입');
  ok(j.corner < n.corner && j.squint > n.squint, '기쁨: 입꼬리가 올라가고 눈웃음');
  ok(Object.keys(EXPRESSIONS).length >= 7, '표정 일곱');
  const p = makePerson(LOOKS.villager, { stable: true }), face = p.getObjectByName('face'), m0 = face.material;
  setExpression(p, 'worry'); ok(face.material !== m0, '걱정 얼굴로 바뀜');
  setExpression(p, 'neutral'); eq(face.material, m0, '평소 얼굴로 돌아옴');
});
