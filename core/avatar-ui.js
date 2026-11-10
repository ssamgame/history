// 시간 여행자 등록(캐릭터 만들기, 2026-11-09 선생님): 왼쪽에 내 캐릭터가 고려편 병사 차림으로 천천히 돌고, 가운데 부위마다 ◀ ▶,
// 오른쪽에 탐험대원증(얼굴·이름·출발 2026년·도장 자리). 「무작위」. { avatar, name }으로 끝난다. 3D 미리보기는 따로 작은 renderer를 쓰고 끝나면 지운다.
import * as THREE from 'three';
import { makePerson } from './people.js';
import { portraitURL } from './faces.js';
import { AVATAR_PARTS, AVATAR_TABS, DEFAULT_AVATAR, cycleAvatar, randomAvatar, travelerLook, normalizeAvatar, labelOf, isAvatar } from '../content/avatar.js';

const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v); }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  return el;
};

// 미리보기 인물: 고려편 학생 역할(병사) 옷에 내 얼굴. preview: false면(테스트) 3D를 만들지 않는다
export function showAvatarMaker(root, { avatar = null, name = '', firstStop = '993년 고려', preview = true, title = '나를 만들어요' } = {}) {
  return new Promise(resolve => {
    let a = isAvatar(avatar) ? normalizeAvatar(avatar) : { ...DEFAULT_AVATAR }, tab = AVATAR_TABS[0][0];
    const input = h('input', { id: 'avatar-name', type: 'text', placeholder: '이름 또는 번호', autocomplete: 'off', maxlength: '30' }); input.value = name || '';
    const portrait = h('div', { class: 'av-portrait' });
    const values = {};
    const rows = AVATAR_PARTS.map(p => {
      const val = p.swatch
        ? h('span', { class: 'av-val av-swatch' }, p.options.map(([v]) => h('button', { type: 'button', class: 'av-dot', 'data-key': p.key, 'data-value': v, style: `background:${p.swatch[v]}`, 'aria-label': labelOf(p.key, v), onclick: () => set({ ...a, [p.key]: v }) })))
        : p.key === 'sex'
          ? h('span', { class: 'av-val av-seg' }, p.options.map(([v, l]) => h('button', { type: 'button', class: 'av-seg-btn', 'data-key': p.key, 'data-value': v, onclick: () => set({ ...a, [p.key]: v }) }, l)))
          : h('span', { class: 'av-val' }, '');
      values[p.key] = val;
      const arrows = !p.swatch && p.key !== 'sex';
      return h('div', { class: `av-row${p.swatch ? ' av-row-swatch' : ''}`, 'data-part': p.key, 'data-tab': p.tab },
        h('span', { class: 'av-key' }, p.label),
        arrows ? h('button', { type: 'button', class: 'av-arrow', 'data-prev': p.key, 'aria-label': `${p.label} 이전`, onclick: () => set(cycleAvatar(a, p.key, -1)) }, '◀') : h('span'),
        val,
        arrows ? h('button', { type: 'button', class: 'av-arrow', 'data-next': p.key, 'aria-label': `${p.label} 다음`, onclick: () => set(cycleAvatar(a, p.key, 1)) }, '▶') : h('span'));
    });
    // 묶음 탭(얼굴·꾸미기·머리·옷): 한 번에 한 묶음의 줄만 보인다
    const tabs = AVATAR_TABS.map(([id, label]) => h('button', { type: 'button', class: 'av-tab', 'data-tab': id, onclick: () => { tab = id; showTab(); } }, label));
    const showTab = () => { tabs.forEach(b => b.classList.toggle('on', b.dataset.tab === tab)); rows.forEach(r => { r.hidden = r.dataset.tab !== tab; }); };
    const look = () => travelerLook(a); // 2026년 여행자 차림(투구가 없어 얼굴·머리가 잘 보인다)
    let scene = null, cam = null, renderer = null, person = null, raf = 0;
    const canvas = h('canvas', { class: 'av-canvas', width: 420, height: 600 });
    const rebuild = () => {
      if (!scene) return;
      if (person) { scene.remove(person); person.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
      person = makePerson(look(), { track: false, stable: true }); person.rotation.y = 0.4; scene.add(person);
    };
    const refresh = () => {
      for (const p of AVATAR_PARTS) {
        if (p.swatch || p.key === 'sex') values[p.key].querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.value === a[p.key]));
        else values[p.key].textContent = labelOf(p.key, a[p.key]);
      }
      portrait.style.backgroundImage = `url(${portraitURL(look())})`;
      rebuild();
    };
    const set = next => { a = next; refresh(); };
    const done = () => { cancelAnimationFrame(raf); renderer?.dispose(); el.remove(); resolve({ avatar: a, name: input.value.trim() }); };
    const el = h('section', { class: 'screen avatar-maker' },
      h('div', { class: 'av-inner' },
        h('div', { class: 'av-head' }, h('div', { class: 'eyebrow' }, '출발 2026년 · 시간 여행자 등록'), h('h2', {}, title)),
        h('div', { class: 'av-stage' }, canvas, h('div', { class: 'av-turn' }, '↻ 천천히 돌아요'), h('div', { class: 'av-cap' }, '2026년 차림 · 시대에 도착하면 그 시대 옷으로 변장해요')),
        h('div', { class: 'av-rows' }, h('div', { class: 'av-tabs' }, tabs), rows),
        h('div', { class: 'av-acts' },
          h('button', { type: 'button', class: 'btn av-random', onclick: () => set(randomAvatar()) }, '🎲 무작위'),
          h('button', { type: 'button', class: 'btn primary av-go', onclick: done }, '대원증 받고 출발 ▸')),
        h('div', { class: 'av-card' },
          h('div', { class: 'av-card-title' }, '시간 여행 탐험대원증'),
          portrait,
          h('label', { class: 'av-card-name', for: 'avatar-name' }, input),
          h('div', { class: 'av-card-line' }, h('span', {}, '출발'), h('b', {}, '2026년')),
          h('div', { class: 'av-card-line' }, h('span', {}, '첫 도착'), h('b', {}, firstStop)),
          h('div', { class: 'av-stamps' }, [1, 2, 3, 4, 5, 6].map(() => h('i'))),
          h('div', { class: 'av-card-hint' }, '장을 마칠 때마다 도장이 찍혀요'),
          h('div', { class: 'av-seal' }, '발급'))));
    root.appendChild(el);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') done(); });
    if (preview) {
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); renderer.setPixelRatio(1);
        scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(30, 420 / 600, 0.1, 50); cam.position.set(1.0, 1.7, 5.4); cam.lookAt(0, 1.1, 0); // 머리부터 발까지, 얼굴이 잘 보이게
        scene.add(new THREE.HemisphereLight(0xfff4e0, 0x44403a, 1.1)); const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(2, 4, 3); scene.add(sun);
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.06, 32), new THREE.MeshLambertMaterial({ color: 0x3a4a44 })); disc.position.y = -0.03; scene.add(disc);
        let last = performance.now();
        const tick = now => { const dt = Math.min(0.1, (now - last) / 1000); last = now; if (person) person.rotation.y += dt * 0.5; renderer.render(scene, cam); raf = requestAnimationFrame(tick); };
        raf = requestAnimationFrame(tick);
      } catch (e) { console.warn('미리보기를 그릴 수 없어 얼굴 그림만 보인다', e); scene = null; }
    }
    refresh(); showTab();
    setTimeout(() => input.focus?.(), 50);
  });
}
