// 3단계(2026-10-25) 대사·역사책 글 검사 — 개발 팀원 담당
// 고칠 목록: docs/superpowers/specs/2026-10-25-stage3-plan.md (대사 D1~D53, 역사책 B1~B30)
import { test, eq, ok } from './harness.js';

const DIRS = {
  ...Object.fromEntries([1, 2, 3, 4, 5, 6].map(n => [`ch${n}`, `ch${n}`])),
  ...Object.fromEntries([['j', 'joseon'], ['k', 'modern'], ['i', 'colonial'], ['h', 'present']]
    .flatMap(([p, d]) => [1, 2, 3, 4, 5, 6].map(n => [`${p}${n}`, `${d}/${p}${n}`]))),
};
const cache = {};
async function load(id) { return cache[id] ||= (await import(`../chapters/${DIRS[id]}/script.js`)).default; }
// 장 안의 모든 대사 줄({ who, text, src })
function lines(o, out = []) {
  if (Array.isArray(o)) { o.forEach(v => lines(v, out)); return out; }
  if (!o || typeof o !== 'object') return out;
  if (typeof o.text === 'string' && typeof o.who === 'string') out.push(o);
  for (const v of Object.values(o)) lines(v, out);
  return out;
}
// 장 안의 모든 글자(문자열)
function strings(o, out = []) {
  if (typeof o === 'string') out.push(o);
  else if (o && typeof o === 'object') for (const v of Object.values(o)) strings(v, out);
  return out;
}
const bare = s => s.replace(/\s/g, '');

test('stage3-text: D20 가져다 놓기 안내 10곳이 짧고 같은 꼴이다', async () => {
  let n = 0;
  for (const id of ['k1', 'k5', 'k6', 'i1', 'i3', 'i5', 'i6', 'h1', 'h2', 'h6']) {
    const s = await load(id);
    for (const p of Object.values(s.parts)) {
      if (p.type !== 'deliver' || !/^머리 위의/.test(p.howto) || /가져가요\.$/.test(p.howto)) continue;
      n += 1;
      ok(!p.howto.includes('놓으면 처음 자리로 돌아와'), `${id}: 옛 안내 그대로 "${p.howto}"`);
      ok(/안에 들어가 잠깐 서 있어요\. 그러면 처음 자리에서 다음 \S+ 들어요\.$/.test(p.howto), `${id}: 같은 꼴이 아님 "${p.howto}"`);
      ok(bare(p.howto).length <= 70, `${id}: 안내가 김 ${bare(p.howto).length}자`);
    }
  }
  eq(n, 4, '가져다 놓기 안내 수'); // k1은 D-28에 물건을 안고 가는 안내로, k6은 D-35에 두 갈래 길 체험으로, i1은 D-36에 시대별 체험 걷기로, i3은 D-41에 청사 걷기로, i5는 D-44에 민족 문화 걷기로, i6은 D-46에 한인 애국단에서 한국광복군까지 걷기로 바뀜
});

test('stage3-text: D21 전차 놀이 안내가 짧다', async () => {
  const h = (await load('k5')).parts.tram.howto;
  ok(!h.includes('남은 초가'), h);
  ok(bare(h).length <= 65, `${bare(h).length}자: ${h}`);
});

// 말투 섞임(D28~D45) — 옛 문장이 그 장에서 사라졌다
const GONE = [
  ['h4', '중국군이 내려온대요. 서울을 떠나야 해요!'], ['h4', '사람들 틈에서 아이들 손을 놓쳤어요. 제발 같이 찾아 주세요!'],
  ['h4', '휴, 무사히 강을 건넜어요. 아이들은 어디 있을까요?'], ['h4', '아이들을 모두 찾았어요. 정말 고마워요!'],
  ['h4', '1951년 1월 4일, 서울을 다시 빼앗기고 피란길에 올랐어요.'],
  ['k3', '농민들이 얼마나 힘든지 먼저 그들에게 직접 들어 보게.'], ['k3', '혼자서는 아무것도 바꿀 수 없네. 마을을 돌며 뜻을 함께할 농민들을 모아 주게.'],
  ['k3', '모두 모였구나. 이제 고부 관아로 가자!'],
  ['i1', '일제가 쌀 생산을 늘리는 산미 증식 계획을 세웠지만, 늘어난 것보다 더 많은 쌀이 일본으로 빠져나가.'],
  ['i1', '늘어난 쌀보다 더 많은 쌀이 배에 실려 갔소.'],
  ['i1', '오늘도 쌀가마를 가득 실은 기차가 항구로 가오. 그동안 무슨 일이 있었는지 역사책으로 넘겨 보시오.'],
  ['h5', '우리 마을 어른들이 어떻게 사시는지 먼저 들어 봐.'],
  ['j2', '오른쪽 집현전에 학자님들이 계셔. 가 봐.'],
  ['k2', '오늘 밤 우정총국에서 무슨 일이 열리는지부터 알아보고 오게.'],
  ['i3', '임시 정부가 어떤 나라를 꿈꾸는지 안창호 선생께 먼저 듣고 오게.'],
  ['i6', '대원들이 왜 여기까지 왔는지 그들에게 먼저 들어 보게.'],
  ['i6', '우리 손으로 나라를 되찾을 날을 준비해야 하오. 지휘관에게 훈련 이야기도 들어 보게.'],
  ['h1', '오늘 시민들이 무엇을 느끼는지 먼저 들어 보게.'],
  ['h2', '이승만 박사의 생각을 먼저 들어 보게. 그래야 내 생각과 견주어 볼 수 있지.'],
  ['k1', '서양 나라들이 교류하자고 했지만 모두 거절하셨어.'], ['k1', '흥선 대원군께서 하신 일을 기억하느냐? 알맞은 쪽으로 가져가 보거라.'],
  ['k5', '전화기도 들여와서 소식을 빠르게 주고받을 수 있지요.'], ['k5', '전화기로 소식을 빠르게 주고받을 수 있지요.'],
  ['i2', '오늘 이 공원에 무슨 일이 있는지, 저기 학생들에게 먼저 들어 보게.'],
  ['i4', '봉오동에서 이긴 홍범도 장군께 먼저 인사드리고 오게.'],
  ['k6', '무기를 든 의병들은 무엇을 지키려 하는지, 그 이야기부터 듣고 오게.'],
  ['i6', '훈련 이야기는 나중에 하지. 김구 선생님께 먼저 인사드리게.'],
  ['h3', '작전 이야기 전에, 유엔군 병사에게 어떤 나라들이 왔는지 들어 보게.'],
  ['j5', '성벽 아래의 병사에게 먼저 가 보거라.'],
  ['ch6', '배가 준비됐어요! 배중손 님께 먼저 말씀드려요.'],
];
test('stage3-text: D28~D45 말투 섞임 문장을 그 사람 말투로 맞췄다', async () => {
  const left = [];
  for (const [id, text] of GONE) if (lines(await load(id)).some(l => l.text === text)) left.push(`${id} "${text}"`);
  ok(!left.length, `남은 것 ${left.length}: ${left.join(' / ')}`);
});

test('stage3-text: D48~D50·D53 맞춤법(살길·뿌리뽑다·여쭈어보다·글자나 숫자)', async () => {
  const bad = [['i1', '살 길'], ['i1', '뿌리 뽑'], ['j6', '여쭈어 보'], ['k1', '여쭈어 보'], ['k5', '문자나 숫자']];
  for (const [id, w] of bad) ok(!strings(await load(id)).some(s => s.includes(w)), `${id}: "${w}"`);
});

test('stage3-text: D13 사실을 말하는 대사에 출처가 달렸다', async () => {
  const need = [
    ['ch2', '거란 왕이 직접 대군을 이끌고 왔대!', 'S3'],
    ['h3', '인천 앞바다는 밀물과 썰물의 차이가 아주 크다', 'S57'],
    ['i6', '한국광복군은 충칭에서 만든 임시 정부의 군대다', 'S51'],
    ['i4', '봉오동에서 진 일본군이 더 많은 군대를 이끌고 다시 쳐들어온다', 'S51'],
  ];
  for (const [id, t, s] of need) {
    const l = lines(await load(id)).filter(x => x.text.includes(t));
    ok(l.length, `${id}: "${t}" 없음`);
    for (const x of l) ok(x.src?.includes(s), `${id}: "${x.text}" 출처 ${JSON.stringify(x.src)}`);
  }
});

test('stage3-text: B14·B15 역사책 앞뒤 말이 역사책 쪽 글을 그대로 되풀이하지 않는다', async () => {
  const k4 = await load('k4'), i2 = await load('i2');
  const norm = t => t.replace(/[\s,.()·]/g, '');
  const k4Pages = (k4.parts.flow?.pages || []).flatMap(p => p.lines.map(l => norm(l.text))); // D-33: 근대 4장은 역사책을 뺐다(만민 공동회로)
  for (const l of k4.parts.flow?.done || []) {
    ok(!k4Pages.some(t => t.includes(norm(l.text).slice(10, 30))), `k4 done: ${l.text}`);
  }
  const i2Pages = (i2.parts.flow?.pages || []).flatMap(p => p.lines.map(l => bare(l.text))); // D-39: 일제 2장은 역사책을 뺐다(만세의 흐름 걷기로)
  for (const l of i2.parts.march.done || []) ok(!i2Pages.includes(bare(l.text)), `i2 march.done: ${l.text}`);
});

test('stage3-text: B20 긴 역사책 문장을 두 줄로 나눴다(같은 출처)', async () => {
  const pages = [['h6', 'april19', ['S58']], ['h2', 'liberation', ['S51']], ['h2', 'election', ['S51']],
    ['h5', 'peddler', ['S51']]]; // i1·i2 역사책은 D-36·D-39에 뺐다
  for (const [id, pic, src] of pages) {
    const s = await load(id);
    const pg = Object.values(s.parts).filter(p => p.type === 'book').flatMap(p => p.pages).find(p => p.pic === pic);
    ok(pg, `${id} ${pic}`);
    ok(pg.lines.length >= 2, `${id} ${pic}: ${pg.lines.length}줄`);
    for (const l of pg.lines) {
      ok(bare(l.text).length <= 50, `${id} ${pic}: ${bare(l.text).length}자 "${l.text}"`);
      for (const x of src) ok(l.src?.includes(x), `${id} ${pic}: 출처 ${JSON.stringify(l.src)}`);
    }
  }
});

// 사실 판정(검토 문서 2026-10-25-stage3-review.md)대로 고쳤다: 옛 문장이 사라지고, 새 문장에 판정한 출처가 달렸다
const FACT_GONE = [
  ['h1', '이제 우리말 신문도 마음껏 읽을 수 있겠구나. 저 앞에 김구 선생도 오셨단다.'],
  ['h1', '이 기쁨은 우리 민족이 끊임없이 독립운동을 벌인 결과이기도 하오.'],
  ['ch5', '글자를 새긴 판은 네 모서리를 구리판으로 고정하지. 이걸 마구리라고 해.'],
  ['i3', '비밀 조직으로 독립운동 자금을 모았다'], ['j3', '종이 울리면 나무 인형이 나타나 사람의 손을 거치지 않고 시간을 알렸어요.'],
  ['h4', '한편에서는 전쟁을 멈추려고 회담을 하고 있어.'], ['k3', '고부에서 시작한 우리 운동이 큰 농민 운동이 되었어.'],
  ['i2', '만세 시위가 전국으로 퍼지고 있어요. 학생, 노동자, 농민, 상인 모두가 함께해요.'],
  ['ch4', '몽골은 아시아 대부분과 유럽 일부까지 지배한 나라였어요.'], ['ch2', '거란군은 얻은 것 없이 물러갔어요.'],
  ['h5', '그래도 사람들은 서로를 적으로 여기는 교육을 강화하기도 했어요. 남과 북은 오랫동안 긴장했지요.'],
  ['i6', '그 뒤 일제의 감시가 심해져 임시 정부는 중국 여러 곳으로 옮겨 다녔소.'],
  ['j4', '거북선은 사천 바다 싸움에서 처음 싸움에 나섰어.'], ['h3', '바다로 돌아가 인천에 상륙하는 작전을 펼칠 것이다.'],
];
test('stage3-text: 사실 판정 — 옛 문장이 사라지고 새 출처(S66~S70)가 달렸다', async () => {
  const left = [];
  for (const [id, t] of FACT_GONE) if (strings(await load(id)).includes(t)) left.push(`${id} "${t}"`);
  ok(!left.length, left.join(' / '));
  for (const [id, w] of [['k4', '시해'], ['h2', '법통'], ['h2', '모든 국민이 투표한'], ['h5', '이것이 부산 밀면의 시작'], ['ch4', '국교를']])
    ok(!strings(await load(id)).some(s => s.includes(w)), `${id}: "${w}"`);
  const need = [['ch2', '현종이 거란에 직접 찾아가겠다고', 'S66'], ['h1', '김구 선생은 1945년 11월에', 'S67'], ['h1', '이승만은 10월에', 'S67'],
    ['h4', '1951년 3월 서울을 다시 되찾은 뒤', 'S68'], ['k5', '일본과 중국까지 이어지는 통신망이 생겼어요', 'S69'], ['h2', '투표할 수 있었던', 'S70']];
  for (const [id, t, s] of need) {
    const l = lines(await load(id)).filter(x => x.text.includes(t));
    ok(l.length && l.every(x => x.src?.includes(s)), `${id}: "${t}" 출처 ${s}`);
  }
  // h1 김구는 8월 15일 서울에 없었다: 마을 광장 놀이 끝 대사는 김구가 아니다
  const h1 = await load('h1');
  ok(!lines(h1.parts).some(l => l.who === 'kimgu'), 'h1 놀이에 김구 대사');
  // i5 학생: 6·10 만세 운동(1926) → 광주 학생 항일 운동(1929) 차례
  const st = (await load('i5')).npc.student.first.map(l => l.text);
  ok(st.findIndex(t => t.includes('6·10')) >= 0 && st.findIndex(t => t.includes('6·10')) < st.findIndex(t => t.includes('1929년')), st.join(' / '));
});
