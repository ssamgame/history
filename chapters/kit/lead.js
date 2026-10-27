// 인물을 따라 걷기(고려 1~4장 공용, D-13): 인물(id)이 path를 따라 앞장서 걷고 학생이 뒤따른다.
// 학생이 멀어지면(waitFar) 인물이 멈춰 돌아보며 기다리고, 가까이 오면(waitNear) 다시 걷는다.
// 인물이 끝에 서면 face 쪽을 보고, 학생 자리(stand)에 빛나는 원(ring)이 뜬다. 학생이 그 자리에 오면 끝난다.
// heightAt(x, z)가 있으면 인물을 그 높이에 세운다(둑·성벽 위). 학생 높이는 장면이 맞춘다.
export function leadWalk(ctx, { id, path, stand, ring = null, face = Math.PI, speed = 4.2, waitFar = 5, waitNear = 3.2, heightAt = null, reach = 1.6 }) {
  const { world, input } = ctx;
  const n = world.npcs.get(id), m = n.mesh.position;
  n.collider.r = 0; // 좁은 곳에서 학생 길을 막지 않게
  n.mark.visible = false;
  let i = 0, waiting = false;
  input.enabled = true;
  const setY = () => { if (heightAt) m.y = heightAt(m.x, m.z); };
  return new Promise(resolve => {
    const off = world.onUpdate(dt => {
      const p = world.player.position;
      if (i < path.length) {
        const dp = Math.hypot(p.x - m.x, p.z - m.z);
        if (waiting ? dp < waitNear : dp > waitFar) waiting = !waiting;
        if (waiting) n.mesh.rotation.y = Math.atan2(p.x - m.x, p.z - m.z);
        else {
          let dx = path[i][0] - m.x, dz = path[i][1] - m.z;
          const d = Math.hypot(dx, dz), step = speed * dt;
          if (d <= step) { world.moveNpc(id, path[i][0], path[i][1], n.mesh.rotation.y); i += 1; }
          else { dx /= d; dz /= d; world.moveNpc(id, m.x + dx * step, m.z + dz * step, Math.atan2(dx, dz)); }
          setY();
          if (i === path.length) {
            n.mesh.rotation.y = face;
            if (ring) { ring.position.set(stand[0], (heightAt ? heightAt(stand[0], stand[1]) : 0) + 0.08, stand[1]); ring.visible = true; }
          }
        }
        world.setGoal({ x: m.x, z: m.z });
        return;
      }
      world.setGoal({ x: stand[0], z: stand[1] });
      if (Math.hypot(p.x - stand[0], p.z - stand[1]) < reach) {
        off(); input.enabled = false; if (ring) ring.visible = false; world.setGoal(null);
        resolve();
      }
    });
  });
}
