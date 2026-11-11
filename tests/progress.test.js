// 진행 코드(2026-11-11 선생님): 손으로 적어 다른 태블릿으로 옮기는 짧은 코드
import { test, eq, ok } from './harness.js';
import { encodeProgress, decodeProgress } from '../core/progress-code.js';
import { showProgressCode, showTitle, showSessionCard } from '../core/screens.js';
import { DEFAULT_AVATAR, isAvatar } from '../content/avatar.js';
import { ALL_CHAPTERS, COURSES } from '../chapters/index.js';
import { tmParts } from '../content/growth.js';
import { memSave } from './bot.js';

const root = () => { const el = document.createElement('div'); document.body.appendChild(el); return el; };
const btn = (el, text) => [...el.querySelectorAll('button')].find(b => b.textContent.includes(text));
const sample = () => {
  const s = memSave(); s.setName('김여행'); s.setAvatar({ ...DEFAULT_AVATAR, sex: 'f', eye: 'round', glasses: 'square', hair: 'curly', topColor: 'pink', band: 'purple' }); s.setCourse('joseon');
  for (const [id, stars] of [['ch1', 3], ['ch2', 1], ['ch3', 2], ['ch4', 3], ['ch5', 3], ['ch6', 2], ['j1', 3], ['h6', 1]]) s.finishChapter(id, { stars, quizCorrect: 2, quizTotal: 2, seconds: 500, wrongQuizzes: [{ question: 'q' }] });
  s.addLetter('ch1'); s.addLetter('j1'); s.readLetter('ch1'); s.setTmOff([2]);
  return s;
};

test('progress: 코드는 짧고(50자 안쪽) 헷갈리는 글자가 없으며, 넣으면 캐릭터·마친 장과 별·편지·타임머신 부품·고른 편이 되살아난다', () => {
  const s = sample(), code = encodeProgress(s.data);
  ok(/^[0-9A-HJKMNP-TV-Z-]+$/.test(code) && code.replaceAll('-', '').length <= 50, `코드 ${code}`); ok(code.split('-').every(g => g.length <= 4));
  const d = decodeProgress(code);
  eq(d.avatar, s.data.avatar); ok(isAvatar(d.avatar));
  eq(Object.fromEntries(Object.entries(d.chapters).map(([k, r]) => [k, r.stars])), { ch1: 3, ch2: 1, ch3: 2, ch4: 3, ch5: 3, ch6: 2, j1: 3, h6: 1 });
  eq(d.letters, { ch1: true, j1: true }); eq(d.lettersRead, { ch1: true }); eq(d.tmOff, [2]); eq(d.course, 'joseon');
  ok(Object.values(d.chapters).every(r => r.quizTotal === 0 && r.seconds === 0 && r.wrongQuizzes.length === 0), '자세한 기록은 담지 않는다');
  // 새 태블릿에 되살리기: 저장했다 다시 읽어도 그대로, 얻은 부품과 편지도 그대로
  const t = memSave(); t.restore(d, '김여행'); t.load();
  eq(t.data.name, '김여행'); eq(Object.keys(t.data.chapters).length, 8); eq(tmParts(t), [1]); ok(t.hasLetter('j1') && t.unreadLetters(['ch1', 'j1']) === 1); eq(t.data.current, null);
  eq(encodeProgress(t.data), code, '되살린 기록의 코드는 같다');
  // 기록이 없는 처음 상태도 오가고, 서른 장을 모두 마친 기록도 오간다
  eq(decodeProgress(encodeProgress(memSave().data)).chapters, {}); eq(decodeProgress(encodeProgress(memSave().data)).course, null);
  const all = memSave(); for (const c of ALL_CHAPTERS) all.finishChapter(c.id, { stars: 3 }); all.setCourse(COURSES[4].id);
  eq(Object.keys(decodeProgress(encodeProgress(all.data)).chapters).length, 30);
});

test('progress: 잘못 적은 코드는 받지 않고, 소문자·띄어쓰기·O/I/L은 바로잡는다', () => {
  const code = encodeProgress(sample().data);
  ok(decodeProgress(code.toLowerCase().replaceAll('-', ' ')), '소문자·띄어쓰기');
  ok(decodeProgress(code.replaceAll('0', 'O').replaceAll('1', 'l')), 'O·l로 적어도');
  eq(decodeProgress(''), null); eq(decodeProgress('ABCD-1234'), null); eq(decodeProgress(code.slice(0, -1)), null);
  let caught = 0; const raw = code.replaceAll('-', '');
  for (let i = 0; i < raw.length; i++) { const ch = raw[i] === '7' ? '8' : '7'; if (decodeProgress(raw.slice(0, i) + ch + raw.slice(i + 1)) === null) caught += 1; }
  ok(caught >= raw.length - 1, `한 글자 틀린 코드 ${raw.length}가지 가운데 ${caught}가지를 걸러 낸다`);
});

test('progress: 첫 화면 「진행 코드」 — 내 코드 보기, 틀린 코드는 알림, 기록이 있으면 한 번 더 묻고 바꾼다', async () => {
  const ui = root();
  try {
    const p0 = showTitle(ui, { hasProgress: true, savedName: '김여행', storageOk: true, onCode: true }); btn(ui, '진행 코드').click(); eq((await p0).action, 'code');
    const p1 = showTitle(ui, { hasProgress: false, savedName: '', storageOk: true }); ok(!btn(ui, '진행 코드'), 'onCode가 없으면 단추도 없다'); ui.querySelector('.screen').remove(); void p1;
    const s = sample(), code = encodeProgress(s.data);
    const p = showProgressCode(ui, { code, decode: decodeProgress, hasProgress: true, name: '김여행' });
    eq(ui.querySelector('.code-show').textContent, code);
    const input = ui.querySelector('.code-input'), type = v => { input.value = v; input.dispatchEvent(new Event('input')); };
    type('1234-ABCD'); btn(ui, '이 코드로').click(); ok(ui.textContent.includes('코드가 맞지 않아요'));
    type(code.toLowerCase()); btn(ui, '이 코드로').click(); ok(ui.textContent.includes('지금 기록은 지워지고'), '덮어쓰기 전에 한 번 더'); ok(ui.querySelector('.codescreen'));
    for (const b of ui.querySelectorAll('button')) { const r = b.getBoundingClientRect(); ok(r.width >= 44 && r.height >= 40 && r.bottom <= innerHeight + 1, `단추 ${b.textContent}`); }
    btn(ui, '이 코드로').click(); const r = await p; eq(r.name, '김여행'); eq(Object.keys(r.data.chapters).length, 8);
    const q = showProgressCode(ui, { decode: decodeProgress }); ok(!ui.querySelector('.code-show'), '기록이 없으면 내 코드는 없다'); btn(ui, '닫기').click(); eq(await q, null);
    // 되살린 기록으로 시간 여행 일지가 열린다(자세한 기록이 없어도), 「선생님께 보여 주세요」 글은 없다
    const t = memSave(); t.restore(r.data, r.name);
    const card = showSessionCard(ui, 1, t, ALL_CHAPTERS); ok(ui.querySelector('.screen') && !ui.textContent.includes('선생님') && !ui.textContent.includes('NaN')); ui.querySelector('.screen').remove(); void card;
  } finally { ui.remove(); }
});
