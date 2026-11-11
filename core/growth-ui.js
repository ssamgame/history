// 성장 화면들(2026-11-10·11 선생님, content/growth.js): 역사 인물의 편지와 편지함, 타임머신 꾸미기(부품 떼었다 붙이기), 타임머신에 새 부품이 붙었을 때.
import * as THREE from 'three';
import { portraitURL } from './faces.js';
import { makeTimeMachine } from './timemachine.js';
import { LETTERS, TM_STAGES, letterParts, tmLevel, tmParts, finishedCount } from '../content/growth.js';

const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v); }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  return el;
};

function letterCard(id, L, name) {
  const body = h('p', { class: 'letter-body' }, letterParts(L.body).map(p => (p.strong ? h('b', {}, p.text) : p.text)));
  const pt = h('div', { class: 'letter-face' }); pt.style.backgroundImage = `url(${portraitURL(L.from)})`;
  return h('div', { class: 'letter', 'data-letter': id },
    pt, h('div', { class: 'letter-to' }, name ? `시간 여행자 ${name}에게` : '시간 여행자에게'), h('h3', {}, `${L.name}의 편지`),
    body, h('div', { class: 'letter-sign' }, `— ${L.when}, ${L.name}`), h('div', { class: 'letter-seal', 'aria-hidden': 'true' }, L.seal));
}
// 편지 한 통: 놀이를 마치고 복습 퀴즈를 풀기 전에 받는다. have/total: 이 편에서 모은 편지 수
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
// 편지함: 받은 편지를 다시 읽는다(장 고르기와 게임 중 메뉴). chapters: 장 정보, save.hasLetter: 받은 편지만 열린다
export function showLetterBox(root, chapters, save) {
  return new Promise(resolve => {
    const got = chapters.filter(c => LETTERS[c.id] && save.hasLetter(c.id));
    let k = 0;
    const slot = h('div', { class: 'letter-slot' });
    const tabs = chapters.filter(c => LETTERS[c.id]).map(c => {
      const has = got.includes(c);
      return h('button', { class: 'btn letter-tab', type: 'button', disabled: !has, 'data-letter-tab': c.id, onclick: () => { k = got.indexOf(c); show(); } }, has ? `${c.no}장 ${LETTERS[c.id].name}` : `${c.no}장 ?`);
    });
    const show = () => {
      const c = got[k];
      tabs.forEach(b => b.classList.toggle('on', !!c && b.dataset.letterTab === c.id));
      slot.replaceChildren(c ? letterCard(c.id, LETTERS[c.id], save.data.name) : h('p', { class: 'letter-empty' }, '아직 받은 편지가 없어요. 놀이를 마치면 그 시대 사람이 편지를 보내 줘요.'));
    };
    const el = h('section', { class: 'screen letter-screen' },
      h('div', { class: 'letter-wrap' },
        h('div', { class: 'eyebrow' }, `편지함 ${got.length}/${tabs.length}`),
        h('div', { class: 'letter-tabs' }, tabs), slot,
        h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { el.remove(); resolve(); } }, '닫기'))));
    root.append(el); show();
  });
}

// 타임머신이 천천히 도는 작은 3D 그림(새 부품 알림·꾸미기 화면). far: 물러서는 정도(0 몸통만, 1 날개, 2 모두)
function machinePreview(canvas, parts, far) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff, 0x556050, 1.4)); const sun = new THREE.DirectionalLight(0xfff2d0, 1.5); sun.position.set(4, 8, 7); sc.add(sun);
  const cam = new THREE.PerspectiveCamera(32, canvas.width / canvas.height, 0.1, 100); cam.position.set(0, 3.6, [11, 13.5, 15.5][far]); cam.lookAt(0, far === 2 ? 2.9 : 2.3, 0);
  const tm = makeTimeMachine({ parts }); sc.add(tm.group); tm.setFlame(0.35);
  let t = 0, last = performance.now(), raf = 0;
  const loop = now => { const dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt; tm.group.rotation.y = t * 0.6; tm.tick(t); renderer.render(sc, cam); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
  return { tm, stop() { cancelAnimationFrame(raf); tm.dispose(); renderer.dispose(); } };
}

// 타임머신에 새 부품이 붙었다: 새 모습이 천천히 돈다. parts: 붙여 둔 부품(없으면 1~level), preview: false면(테스트) 3D를 만들지 않는다
export function showMachineUpgrade(root, level, { preview = true, done = 0, parts = null } = {}) {
  const st = TM_STAGES[level], next = TM_STAGES[level + 1];
  return new Promise(resolve => {
    const canvas = h('canvas', { class: 'tmup-canvas', width: 520, height: 420 });
    let view = null;
    const close = () => { view?.stop(); el.remove(); resolve(); };
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
    try { view = machinePreview(canvas, parts || Array.from({ length: level }, (_, i) => i + 1), level >= 9 ? 2 : level >= 2 ? 1 : 0); } catch (e) { console.warn('타임머신 미리보기', e); }
  });
}

// 타임머신 꾸미기(2026-11-11 선생님: 부품을 언제든 해체하고 조립): 얻은 부품을 눌러 떼었다 붙인다. 떼어 둔 부품은 save.data.tmOff에 남고,
// 새로 얻는 부품은 늘 붙은 채로 온다. onChange: 바뀔 때마다(서 있는 타임머신에 바로 입힌다). 장 고르기 「타임머신」과 게임 중 메뉴에서 연다
export function showMachineShop(root, save, { preview = true, onChange } = {}) {
  const lv = tmLevel(finishedCount(save)), stages = TM_STAGES.slice(1);
  return new Promise(resolve => {
    const canvas = h('canvas', { class: 'tmshop-canvas', width: 520, height: 520 });
    let view = null;
    const count = h('p', { class: 'tmshop-count' });
    const setOff = list => { save.setTmOff(list); paint(); onChange?.(); };
    const toggle = n => { const off = new Set(save.data.tmOff || []); if (!off.delete(n)) off.add(n); setOff([...off].sort((a, b) => a - b)); };
    const cards = stages.map((st, i) => h('button', { class: 'tmshop-part', type: 'button', 'data-part': i + 1, disabled: i + 1 > lv, onclick: () => toggle(i + 1) }));
    const paint = () => {
      const on = tmParts(save);
      cards.forEach((b, i) => {
        const n = i + 1, has = n <= lv, fit = on.includes(n);
        b.classList.toggle('on', fit); b.setAttribute('aria-pressed', String(fit));
        b.replaceChildren(h('b', {}, stages[i].name), h('small', {}, !has ? `${stages[i].at}장을 마치면 얻어요` : fit ? '붙어 있어요 · 누르면 떼기' : '떼어 두었어요 · 누르면 붙이기'));
      });
      count.textContent = lv ? `붙인 부품 ${on.length} / 얻은 부품 ${lv}` : '아직 얻은 부품이 없어요. 3장을 마치면 첫 부품을 얻어요.';
      view?.tm.setParts(on);
    };
    const close = () => { view?.stop(); el.remove(); resolve(); };
    const el = h('section', { class: 'screen tmshop' },
      h('div', { class: 'tmshop-inner' },
        h('div', { class: 'tmshop-head' }, h('div', { class: 'eyebrow' }, '타임머신 꾸미기'), h('h2', {}, '부품을 눌러 떼었다 붙여 보세요'), count),
        canvas,
        h('div', { class: 'tmshop-parts' }, cards),
        h('div', { class: 'tmshop-foot' },
          lv > 0 && h('button', { class: 'btn', type: 'button', onclick: () => setOff([]) }, '모두 붙이기'),
          lv > 0 && h('button', { class: 'btn', type: 'button', onclick: () => setOff(Array.from({ length: lv }, (_, i) => i + 1)) }, '모두 떼기'),
          h('button', { class: 'btn primary', type: 'button', onclick: close }, '닫기'))));
    root.append(el);
    if (preview) { try { view = machinePreview(canvas, tmParts(save), 2); } catch (e) { console.warn('타임머신 미리보기', e); } }
    paint();
  });
}
