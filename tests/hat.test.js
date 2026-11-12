// 모자가 머리 위에 떠 있지 않다(2026-11-12 선생님: "인물들의 모자가 머리 위에 떠 있다").
// 뼈대 몸을 붙인 모든 생김새(LOOKS × 다섯 시대, 이름 없는 군중 몇 사람), 장마다 학생 역할 옷에 내 얼굴을 얹은 변장(남·여, 역할 키),
// 2026년 차림의 머리 모양을 정면·옆에서 재어, 모자 아래로 하늘이 띠처럼 보이는 틈이 1.5cm를 넘지 않는지 본다(tools/qa/hatfit.js).
// 모자는 머리 묶음(head 뼈)에 함께 붙어 있어 동작마다 같아야 한다: 모자 종류마다 한 사람은 동작 묶음의 모든 동작에서도 잰다.
import { test, ok } from './harness.js';
import * as THREE from 'three';
import { makePerson, setRigHook } from '../core/people.js';
import { LOOKS } from '../content/characters.js';
import { ROLES, roleLook } from '../content/roles.js';
import { applyAvatar, travelerLook, DEFAULT_AVATAR, AVATAR_PARTS } from '../content/avatar.js';
import { setHairEra, eraOfChapter, ERAS } from '../core/hairstyle.js';
import { loadBody, attachBody, resetBodies } from '../core/body.js';
import { hatFloat, hatName } from '../tools/qa/hatfit.js';

const MAX = 0.015;
function cases() {
  const out = [];
  for (const era of ERAS) for (const id of Object.keys(LOOKS)) for (const n of [0, 1, 2]) out.push({ name: `${era} ${id}${n ? ' 군중' + n : ''}`, era, look: LOOKS[id], opts: n ? {} : { stable: true } });
  for (const [cid, r] of Object.entries(ROLES)) for (const sex of ['m', 'f']) out.push({ name: `${cid} 학생 변장(${sex})`, era: eraOfChapter(cid), chap: cid, look: applyAvatar(roleLook(cid), { ...DEFAULT_AVATAR, sex }), opts: { track: false, stable: true }, scale: r.scale });
  for (const [hair] of AVATAR_PARTS.find(p => p.key === 'hair').options) out.push({ name: `2026년 차림 ${hair}`, era: null, look: travelerLook({ ...DEFAULT_AVATAR, hair }), opts: { track: false, stable: true } });
  return out;
}
function posesOf(g) {
  const S = g.userData.skel;
  return Object.entries(S.acts).map(([n, a]) => [n, () => { S.mixer.stopAllAction(); a.reset(); a.enabled = true; a.setEffectiveWeight(1); a.play(); a.time = a.getClip().duration * 0.5; S.mixer.update(0); }]);
}

test('hat: 모든 생김새·시대·학생 변장의 모자가 머리에 붙어 있다(모자 아래로 하늘이 보이는 띠 1.5cm 이하, 뼈대 몸, 모자 종류마다 모든 동작)', async () => {
  await loadBody(); resetBodies(); setRigHook(attachBody);
  const bad = [], posed = new Set();
  try {
    for (const c of cases()) {
      setHairEra(c.era, c.chap || '');
      const g = makePerson(c.look, c.opts); if (c.scale) g.scale.setScalar(c.scale);
      const sc = new THREE.Scene(); sc.add(g);
      ok(g.userData.skel, `${c.name}: 뼈대 몸`);
      const hat = hatName(g) || c.look.hat || '-';
      const poses = [['서 있기', () => {}], ...(posed.has(hat) ? [] : posesOf(g))]; posed.add(hat);
      for (const [pn, f] of poses) { f(); const r = hatFloat(g); if (r.gap > MAX) { bad.push(`${c.name} [${hat}] ${pn} ${r.view} ${(r.gap * 100).toFixed(1)}cm`); break; } }
      sc.remove(g);
    }
  } finally { setRigHook(null); setHairEra(null); }
  const by = {}; for (const b of bad) { const h = b.match(/\[(.*?)\]/)[1]; by[h] = (by[h] || 0) + 1; }
  ok(bad.length === 0, `떠 있는 모자 ${bad.length} (${Object.entries(by).map(([h, n]) => `${h} ${n}`).join(', ')}): ${bad.filter(b => !/\[gat\]/.test(b)).slice(0, 14).join(' / ')}`);
}, { timeout: 600000 });
