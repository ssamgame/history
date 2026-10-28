// 타오르는 불(공용, D-16): core/fire.js의 불(겹친 불꽃·빛·불티·연기)을 쓰고, 불의 세기(level 0~1)로 붙고 → 타오르고 → 잦아드는 것을 맡는다.
// 장면이 매 프레임 따로 돌리지 않아도 된다(world.onUpdate로 스스로 깜박인다). 불티(무거운 입자)는 화질 '보통·높음'에서만 보인다.
// 잔혹한 표현 없이 불꽃과 연기만. 쓰는 곳: 고려 4장 노비 문서 태우기·처인성 몽골 진영, 3장 귀주 거란 진영, 2장 흥화진 밖 거란 진영.
// burning(world, { parent, x, y, z, size, level }) → { group, setLevel(v), level() }. y는 땅 높이(불 바닥). level 0이면 숨는다.
import { makeFire } from '../../core/fire.js';

export function burning(world, { parent = world.level, x = 0, y = 0, z = 0, size = 1, level = 1 } = {}) {
  const detail = world.quality?.particles ?? 0.9;
  const f = makeFire({ size, detail });
  const group = f.group; group.name = 'fire'; group.userData.live = true;
  group.position.set(x, y + 0.55 * size, z); parent.add(group);
  const embers = group.children.find(o => o.isPoints);
  let lv = -1;
  const setLevel = v => {
    v = Math.max(0, Math.min(1, v));
    if (v === lv) return;
    lv = v;
    const on = lv > 0.02;
    if (on !== f.lit) f.setLit(on);
    group.visible = on;
    group.scale.setScalar(Math.max(0.05, lv));
    if (embers) embers.visible = on && (world.quality?.particles ?? 0.9) > 0.5 && lv > 0.3;
  };
  setLevel(level);
  world.onUpdate((dt, t) => { if (group.visible) f.update(dt, t); });
  return { group, setLevel, level: () => lv };
}
