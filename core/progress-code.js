// 진행 코드(2026-11-11 선생님): 다른 태블릿으로 옮길 때 손으로 적어 가는 짧은 코드(영문·숫자 40자쯤, 네 글자씩 끊어 보인다).
// 담는 것: 내 캐릭터, 마친 장과 별, 받은·읽은 편지, 떼어 둔 타임머신 부품, 고른 편. 이름과 자세한 기록(퀴즈 점수·틀린 문제·걸린 시간)은 담지 않는다.
// 서버로 보내지 않는다 — 글자만으로 되살린다. 장 수나 캐릭터 부위가 바뀌면 VERSION을 올린다(옛 코드는 '맞지 않아요').
import { AVATAR_PARTS, DEFAULT_AVATAR, normalizeAvatar } from '../content/avatar.js';
import { ALL_CHAPTERS, COURSES } from '../chapters/index.js';

const ABC = '0123456789ABCDEFGHJKMNPQRSTVWXYZ', VERSION = 1, SUM_BITS = 10; // 헷갈리는 글자(I·L·O·U)는 쓰지 않는다
const width = n => Math.max(1, Math.ceil(Math.log2(n)));
const sum = bits => bits.reduce((a, b, i) => (a * 31 + b * (i % 7 + 1) + 7) % (1 << SUM_BITS), 5);
// 차례: [값, 비트 수]
const layout = () => [3, ...AVATAR_PARTS.map(p => width(p.options.length)), ...ALL_CHAPTERS.flatMap(() => [2, 1, 1]), 9, 3];

export function encodeProgress(data) {
  const av = normalizeAvatar(data.avatar) || DEFAULT_AVATAR, off = data.tmOff || [];
  const vals = [VERSION, ...AVATAR_PARTS.map(p => Math.max(0, p.options.findIndex(([v]) => v === av[p.key]))),
    ...ALL_CHAPTERS.flatMap(c => { const r = data.chapters?.[c.id]; return [r ? Math.min(3, Math.max(1, r.stars || 1)) : 0, data.letters?.[c.id] ? 1 : 0, data.lettersRead?.[c.id] ? 1 : 0]; }),
    off.reduce((a, n) => a | (1 << (n - 1)), 0) & 511, Math.max(0, COURSES.findIndex(c => c.id === data.course)) + (data.course ? 0 : 7)];
  const bits = []; layout().forEach((w, i) => { for (let k = w - 1; k >= 0; k--) bits.push((vals[i] >> k) & 1); });
  const s = sum(bits); for (let k = SUM_BITS - 1; k >= 0; k--) bits.push((s >> k) & 1);
  while (bits.length % 5) bits.push(0);
  let out = ''; for (let i = 0; i < bits.length; i += 5) out += ABC[bits.slice(i, i + 5).reduce((a, b) => a * 2 + b, 0)];
  return out.match(/.{1,4}/g).join('-');
}

// 코드 → 저장할 기록(이름 없음). 틀린 코드면 null. 잘못 읽기 쉬운 글자는 바로잡는다(O→0, I·L→1, 소문자, 띄어쓰기·줄표)
export function decodeProgress(text) {
  const s = String(text || '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1').replace(/[^0-9A-Z]/g, '');
  const L = layout(), need = L.reduce((a, b) => a + b, 0);
  if (!s || [...s].some(ch => !ABC.includes(ch)) || s.length !== Math.ceil((need + SUM_BITS) / 5)) return null;
  const bits = [...s].flatMap(ch => { const v = ABC.indexOf(ch); return [16, 8, 4, 2, 1].map(m => (v & m ? 1 : 0)); });
  const body = bits.slice(0, need), check = bits.slice(need, need + SUM_BITS).reduce((a, b) => a * 2 + b, 0);
  if (check !== sum(body)) return null;
  let at = 0; const vals = L.map(w => { let v = 0; for (let k = 0; k < w; k++) v = v * 2 + body[at++]; return v; });
  if (vals[0] !== VERSION) return null;
  let i = 1; const avatar = {};
  for (const p of AVATAR_PARTS) { const o = p.options[vals[i++]]; if (!o) return null; avatar[p.key] = o[0]; }
  const chapters = {}, letters = {}, lettersRead = {};
  for (const c of ALL_CHAPTERS) {
    const stars = vals[i++], got = vals[i++], read = vals[i++];
    if (stars) chapters[c.id] = { stars, quizCorrect: 0, quizTotal: 0, firstTryCorrect: 0, firstTryTotal: 0, seconds: 0, wrongQuizzes: [], restored: true }; // 자세한 기록은 옮겨지지 않는다
    if (got) letters[c.id] = true; if (read) lettersRead[c.id] = true;
  }
  const offBits = vals[i++], ci = vals[i++];
  return { avatar, chapters, letters, lettersRead, tmOff: [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => offBits & (1 << (n - 1))), course: COURSES[ci]?.id || null };
}
