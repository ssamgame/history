// D-72(2026-11-05 선생님 현대편 수정 목록): 넓은 교실, 글씨체 하나(옛 문서만 명조), 끝 대사 두 번 없음, 투표·전쟁 지도·탱크·상륙정·말뚝 줄·할아버지·보따리·밀면·성화대 등.
import { test, ok, eq } from './harness.js';
import * as THREE from 'three';
import { classroom, ROOM, bottari } from '../chapters/kit/walk.js';
import { warMap } from '../chapters/kit/warmap.js';
import { LOOKS } from '../content/characters.js';
import { RETREAT } from '../chapters/present/h3/chapter.js';
import { CHINA_PUSH } from '../chapters/present/h4/chapter.js';
import h2script from '../chapters/present/h2/script.js';
import h4script from '../chapters/present/h4/script.js';
import h5script from '../chapters/present/h5/script.js';

test('d72: 교실이 넓고(12×10) 책상 사이 통로가 넉넉하며 교단·칠판이 크다', () => {
  const g = new THREE.Group(), r = classroom(g, 0, 0, { seated: true });
  ok(ROOM.w >= 12 && ROOM.d >= 10, `교실 ${ROOM.w}×${ROOM.d}`);
  const xs = [...new Set(r.kids.map(k => +k.position.x.toFixed(2)))].sort((a, b) => a - b);
  ok(xs.every((x, i) => !i || x - xs[i - 1] >= 2.6), `책상 줄 사이 ${xs}`);
  const front = Math.min(...r.kids.map(k => k.position.z));
  ok(front - r.teacher.position.z >= 3.5, `교단과 앞줄 사이 ${(front - r.teacher.position.z).toFixed(2)}`);
  let board = 0; g.traverse(o => { if (o.geometry?.parameters?.width >= 5 && o.geometry.parameters.height >= 1.8) board += 1; }); ok(board >= 1, '큰 칠판');
});

test('d72: 화면 글씨는 고딕 하나, 옛 문서·시 종이 안 글씨만 명조', async () => {
  const css = await (await fetch('../styles.css')).text();
  ok(/--font-display:\s*var\(--font-ui\)/.test(css), '제목 글씨도 고딕');
  for (const sel of ['.scroll-sheet ol {', '.doc-paper ol {']) ok(css.split(sel)[1].split('}')[0].includes('var(--font-doc)'), `${sel} 명조`);
  for (const f of ['../core/signs.js', '../core/portal.js', '../chapters/kit/play.js']) ok(!(await (await fetch(f)).text()).includes('Nanum Myeongjo'), `${f} 고딕`);
});

test('d72: 놀이가 끝 대사를 무대 안에서 직접 하면 장 진행이 또 하지 않는다(ownDone)', async () => {
  for (const id of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
    const mod = (await import(`../chapters/present/${id}/chapter.js`)).default, src = await (await fetch(`../chapters/present/${id}/chapter.js`)).text();
    const kit = await (await fetch('../chapters/kit/chapter.js')).text();
    ok(kit.includes('!part.ownDone'), 'kit은 ownDone이면 done을 건너뛴다');
    for (const p of mod.parts || []) {
      if (!p.done || !p.play) continue;
      const fn = p.play.toString().match(/(\w+Play)\(/)?.[1], body = fn ? src.split(`export async function ${fn}(`)[1]?.split('\nexport ')[0] || '' : '';
      const says = /for \(const l of P\.done\)|P\.done\[/.test(body);
      eq(!!p.ownDone, says, `${id} ${p.title}: 놀이 안에서 끝 대사 ${says ? '함' : '안 함'} → ownDone ${!!p.ownDone}`);
    }
  }
});

test('d72: 투표 — 명부 직원 없이 투표용지부터, 후보는 지어낸 성씨 이름', () => {
  const v = h2script.parts.vote;
  eq(v.steps.map(s => s.id), ['paper', 'booth', 'box']);
  ok(v.candidates.every(c => /^\d번 [가-힣]○○$/.test(c)), v.candidates.join(','));
  ok(!v.done, '투표 뒤 기자 말은 다음 놀이 안내가 이어 한다');
  eq(h2script.parts.law.done.length, 1, '제헌 헌법 해설은 한 번');
});

test('d72: 전쟁 지도 — 남침에서 낙동강까지, 중국군이 밀고 내려온 길', () => {
  const ui = document.createElement('div'); document.body.appendChild(ui);
  try {
    const m = warMap(ui, { stops: RETREAT }); m.to(RETREAT.length - 1);
    eq(ui.querySelectorAll('circle').length, RETREAT.length, '들른 곳마다 점');
    ok(ui.textContent.includes('낙동강') && ui.textContent.includes('38도선'), '낙동강·38도선');
    m.remove();
    const c = warMap(ui, { stops: CHINA_PUSH, river: null }); c.to(CHINA_PUSH.length - 1);
    ok(ui.textContent.includes('압록강') && ui.textContent.includes('서울'), '압록강 → 서울'); c.remove();
  } finally { ui.remove(); }
});

test('d72: 이웃·피란민 할아버지는 할아버지 모습(흰 머리·수염), 보따리는 천으로 싼 짐', () => {
  ok(LOOKS.grandpa.face.age === 'old' && LOOKS.grandpa.face.beard, '할아버지 얼굴');
  eq(h4script.speakers.grandpa.look, 'grandpa'); eq(h5script.speakers.grandpa.look, 'grandpa');
  const b = bottari(); ok(b.children.length >= 4, '몸·띠·매듭');
});

test('d72: 경제 성장 — 수출 상자에 작은 영어 글씨 없음, 차·트럭은 앞이 가는 쪽', async () => {
  const src = await (await fetch('../chapters/present/h6/chapter.js')).text();
  ok(!src.includes('MADE IN KOREA'), '수출 글자만');
  ok(/c\.rotation\.y = Math\.PI; g\.add\(c\); BUILD\.truck/.test(src), '개통 날 차들');
  ok(/truck\.rotation\.y = Math\.PI; g\.add\(truck\)/.test(src), '수출 트럭');
  ok(!/holdFlag\(p\)\);\n/.test(src.split('function introScene')[1] || ''), '첫 장면은 태극기 대신 일하는 모습');
});
