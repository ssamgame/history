// 성장 화면들(2026-11-10 선생님, content/growth.js): 금빛 도장(도전 쪽지 성공), 역사 인물의 편지와 편지함, 타임머신에 새 부품이 붙었을 때.
import * as THREE from 'three';
import { portraitURL } from './faces.js';
import { makeTimeMachine } from './timemachine.js';
import { LETTERS, TM_STAGES, letterParts } from '../content/growth.js';

const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v); }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  return el;
};

// 금빛 도장: 화면 가운데에 쾅 찍혔다가 1.8초 뒤 사라진다(누르지 않아도 된다)
export function showSeal(root, text, ms = 1800) {
  if (!root) return Promise.resolve();
  const el = h('div', { class: 'gold-seal', role: 'status' }, h('div', { class: 'gold-seal-mark' }, '도전', h('br'), '성공'), h('div', { class: 'gold-seal-text' }, text));
  root.append(el);
  return new Promise(r => setTimeout(() => { el.remove(); r(); }, ms));
}

function letterCard(id, L, name) {
  const body = h('p', { class: 'letter-body' }, letterParts(L.body).map(p => (p.strong ? h('b', {}, p.text) : p.text)));
  const pt = h('div', { class: 'letter-face' }); pt.style.backgroundImage = `url(${portraitURL(L.from)})`;
  return h('div', { class: 'letter', 'data-letter': id },
    pt, h('div', { class: 'letter-to' }, `시간 여행자 ${name || ''}에게`.replace('  ', ' ')), h('h3', {}, `${L.name}의 편지`),
    body, h('div', { class: 'letter-sign' }, `— ${L.when}, ${L.name}`), h('div', { class: 'letter-seal', 'aria-hidden': 'true' }, L.seal));
}
// 편지 한 통: 장을 처음 마쳤을 때. have/total: 이 편에서 모은 편지 수
export function showLetter(root, id, { name = '', have = 0, total = 0 } = {}) {
  const L = LETTERS[id];
  if (!L) return Promise.resolve(false);
  return new Promise(resolve => {
    const el = h('section', { class: 'screen letter-screen' },
      h('div', { class: 'letter-wrap' },
        h('div', { class: 'eyebrow' }, '편지가 왔어요'),
        letterCard(id, L, name),
        h('div', { class: 'row' },
          total > 0 && h('span', { class: 'letter-count' }, `편지함 ${have}/${total}`),
          h('button', { class: 'btn primary', type: 'button', onclick: () => { el.remove(); resolve(true); } }, '편지함에 넣기 ▸'))));
    root.append(el);
  });
}
// 편지함: 이 편에서 받은 편지를 다시 읽는다. chapters: 그 편의 장 정보, save: 마친 장만 편지가 있다
export function showLetterBox(root, chapters, save) {
  return new Promise(resolve => {
    const got = chapters.filter(c => LETTERS[c.id] && save.chapterResult(c.id));
    let k = 0;
    const slot = h('div', { class: 'letter-slot' });
    const tabs = chapters.filter(c => LETTERS[c.id]).map(c => {
      const has = got.includes(c);
      return h('button', { class: 'btn letter-tab', type: 'button', disabled: !has, 'data-letter-tab': c.id, onclick: () => { k = got.indexOf(c); show(); } }, has ? `${c.no}장 ${LETTERS[c.id].name}` : `${c.no}장 ?`);
    });
    const show = () => {
      const c = got[k];
      tabs.forEach(b => b.classList.toggle('on', !!c && b.dataset.letterTab === c.id));
      slot.replaceChildren(c ? letterCard(c.id, LETTERS[c.id], save.data.name) : h('p', { class: 'letter-empty' }, '아직 받은 편지가 없어요. 장을 마치면 그 시대 사람이 편지를 보내 줘요.'));
    };
    const el = h('section', { class: 'screen letter-screen' },
      h('div', { class: 'letter-wrap' },
        h('div', { class: 'eyebrow' }, `편지함 ${got.length}/${tabs.length}`),
        h('div', { class: 'letter-tabs' }, tabs), slot,
        h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { el.remove(); resolve(); } }, '닫기'))));
    root.append(el); show();
  });
}

// 타임머신에 새 부품이 붙었다: 새 모습이 천천히 돈다. preview: false면(테스트) 3D를 만들지 않는다
export function showMachineUpgrade(root, level, { preview = true, done = 0 } = {}) {
  const st = TM_STAGES[level], next = TM_STAGES[level + 1];
  return new Promise(resolve => {
    const canvas = h('canvas', { class: 'tmup-canvas', width: 520, height: 420 });
    let raf = 0, renderer = null;
    const close = () => { cancelAnimationFrame(raf); renderer?.dispose(); el.remove(); resolve(); };
    const el = h('section', { class: 'screen tmup' },
      h('div', { class: 'tmup-inner' },
        h('div', { class: 'eyebrow' }, '타임머신이 자랐어요!'),
        h('h2', {}, `새 부품 「${st.name}」`),
        canvas,
        h('p', { class: 'tmup-parts' }, st.parts),
        h('p', { class: 'tmup-next' }, next ? `다음 부품 「${next.name}」: ${next.at}장을 마치면 (지금 ${done}장)` : '모든 부품을 모았어요. 시간의 달인!'),
        h('button', { class: 'btn primary', type: 'button', onclick: close }, '멋지다! ▸')));
    root.append(el);
    if (!preview) return;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
      const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff, 0x556050, 1.4)); const sun = new THREE.DirectionalLight(0xfff2d0, 1.5); sun.position.set(4, 8, 7); sc.add(sun);
      const cam = new THREE.PerspectiveCamera(32, 520 / 420, 0.1, 100); cam.position.set(0, 3.4, level >= 2 ? 13.5 : 11); cam.lookAt(0, 2.3, 0); // 날개가 붙으면 조금 물러선다
      const tm = makeTimeMachine({ level }); sc.add(tm.group); tm.setFlame(0.35);
      let t = 0, last = performance.now();
      const loop = now => { const dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt; tm.group.rotation.y = t * 0.6; tm.tick(t); renderer.render(sc, cam); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    } catch (e) { console.warn('타임머신 미리보기', e); }
  });
}
