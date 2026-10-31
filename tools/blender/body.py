# 공통 뼈대 몸(2026-10-31 선생님 지시: "공통 뼈대 + 코드 옷 입히기"): 모든 인물이 함께 쓰는 기본 몸 하나와 뼈대, 동작 묶음을 만들어 body.glb로 내보낸다.
# 옷·모자·얼굴·머리·무기·소품은 게임(core/people.js의 makePerson)이 지금처럼 코드로 만들어 이 뼈에 붙인다(core/body.js).
# 실행(창 없이): <블렌더 5.2 파이썬> tools/blender/body.py assets/models/body.glb
#   블렌더는 PyPI의 bpy(블렌더 5.2를 파이썬 모듈로 만든 것): python3.13 -m venv bl && bl/bin/pip install bpy
#
# 크기는 게임 인물과 같다: 다리 관절 0.55(좌우 ±0.16), 몸통 관절(허리) 1.05, 어깨 1.65(좌우 ±0.5), 어깨~손 가운데 0.78, 머리 자리 2.1.
# 블렌더 좌표: x(+가 x+쪽 팔·다리, 이름 _L), -y가 앞, z가 위. glTF로 내보내면 앞이 +z, 위가 +y가 된다(게임과 같다).
# 뼈 이름에 점을 쓰지 않는다(glTF 불러오기가 이름의 점을 지운다).
# 돌리는 방향(확인함): 아래로 뻗은 뼈(팔·다리)는 X가 −이면 앞으로, +이면 뒤로. 위로 뻗은 뼈(허리·가슴·머리)는 X가 +이면 앞으로 숙인다.
#   Z는 x+쪽 팔에서 +가 안쪽, x−쪽 팔에서 −가 안쪽(아래 inward()).
# 몸 메시는 옷 속에 들어가는 가는 몸(옷이 굽는 팔꿈치·무릎 사이가 비어 보이지 않게 채운다). 재질 이름으로 게임이 옷 색을 칠한다:
#   b_torso(몸판 색) · b_arm(소매 색) · b_leg(바지 색) · b_skin(살색)
import sys, math
import bpy
from mathutils import Vector

out = sys.argv[-1] if sys.argv[-1].endswith('.glb') else 'body.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.fps = 24
SIDES = (('L', 1), ('R', -1))

# ── 뼈대(20개) ──
bpy.ops.object.armature_add(location=(0, 0, 0)); rig = bpy.context.object; rig.name = 'skeleton'
bpy.ops.object.mode_set(mode='EDIT')
eb = rig.data.edit_bones; eb.remove(eb[0])
def bone(n, h, t, p=None):
    b = eb.new(n); b.head = Vector(h); b.tail = Vector(t); b.roll = 0
    if p: b.parent = eb[p]; b.use_connect = False
bone('root', (0, 0, 0), (0, 0.3, 0))
bone('hips', (0, 0, 0.55), (0, 0, 1.05), 'root')
bone('spine', (0, 0, 1.05), (0, 0, 1.35), 'hips')
bone('chest', (0, 0, 1.35), (0, 0, 1.65), 'spine')
bone('neck', (0, 0, 1.65), (0, 0, 1.95), 'chest')
bone('head', (0, 0, 1.95), (0, 0, 2.45), 'neck')
for s, x in SIDES:
    bone(f'shoulder_{s}', (0.15 * x, 0, 1.62), (0.5 * x, 0, 1.65), 'chest')
    bone(f'upperarm_{s}', (0.5 * x, 0, 1.65), (0.5 * x, 0, 1.27), f'shoulder_{s}')
    bone(f'forearm_{s}', (0.5 * x, 0, 1.27), (0.5 * x, 0, 0.91), f'upperarm_{s}')
    bone(f'hand_{s}', (0.5 * x, 0, 0.91), (0.5 * x, 0, 0.79), f'forearm_{s}')
    bone(f'thigh_{s}', (0.16 * x, 0, 0.55), (0.16 * x, 0, 0.29), 'hips')
    bone(f'shin_{s}', (0.16 * x, 0, 0.29), (0.16 * x, 0, 0.06), f'thigh_{s}')
    bone(f'foot_{s}', (0.16 * x, 0, 0.06), (0.16 * x, -0.18, 0.04), f'shin_{s}')
bpy.ops.object.mode_set(mode='OBJECT')

# ── 옷 속의 가는 몸 ──
def material(name, rgb):
    m = bpy.data.materials.new(name); b = m.node_tree.nodes.get('Principled BSDF') if m.node_tree else None
    if b: b.inputs['Base Color'].default_value = (*rgb, 1)
    m.diffuse_color = (*rgb, 1); return m
MAT = {k: material(k, c) for k, c in {'b_torso': (0.5, 0.42, 0.3), 'b_arm': (0.5, 0.42, 0.3), 'b_leg': (0.17, 0.14, 0.11), 'b_skin': (0.93, 0.78, 0.64)}.items()}
parts = []
def tube(name, mat, x, z0, z1, r0, r1, rings, seg=8, weights=None):
    """z0(아래)~z1(위) 원통. rings개의 마디로 나눠 마디마다 weights(z) → {뼈: 무게}로 살을 붙인다"""
    bpy.ops.mesh.primitive_cylinder_add(vertices=seg, radius=1, depth=1, end_fill_type='NOTHING', location=(0, 0, 0)); o = bpy.context.object; o.name = name  # 뚜껑 없이(옷 속이라 안 보인다)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.subdivide(number_cuts=rings - 1); bpy.ops.object.mode_set(mode='OBJECT')
    for v in o.data.vertices:
        k = v.co.z + 0.5; z = z0 + (z1 - z0) * k; r = r0 + (r1 - r0) * k
        v.co.x = x + v.co.x * r; v.co.y *= r; v.co.z = z
    o.data.materials.append(MAT[mat]); parts.append((o, weights)); return o
def lerp_w(z, a, b, za, zb):  # za 아래는 a, zb 위는 b, 사이는 섞는다
    k = min(1, max(0, (z - za) / (zb - za))); return {a: 1 - k, b: k} if a != b else {a: 1}
tube('torso', 'b_torso', 0, 0.52, 1.68, 0.28, 0.28, 4, 8, lambda z, x: (lerp_w(z, 'hips', 'spine', 0.95, 1.15) if z < 1.25 else lerp_w(z, 'spine', 'chest', 1.25, 1.45)))
tube('neck', 'b_skin', 0, 1.62, 1.98, 0.11, 0.10, 2, 6, lambda z, x: lerp_w(z, 'chest', 'neck', 1.66, 1.75))
for s, sx in SIDES:
    tube(f'arm_{s}', 'b_arm', 0.5 * sx, 0.93, 1.66, 0.06, 0.07, 5, 6,  # 소매 상자(반폭 0.09) 속으로 가늘게
         lambda z, x, s=s: lerp_w(z, f'forearm_{s}', f'upperarm_{s}', 1.2, 1.34) if z < 1.5 else lerp_w(z, f'upperarm_{s}', f'shoulder_{s}', 1.56, 1.66))
    tube(f'leg_{s}', 'b_leg', 0.16 * sx, 0.08, 0.6, 0.075, 0.085, 4, 6, lambda z, x, s=s: lerp_w(z, f'shin_{s}', f'thigh_{s}', 0.24, 0.34))  # 다리 상자(반폭 0.1) 속으로
    bpy.ops.mesh.primitive_uv_sphere_add(segments=6, ring_count=5, radius=0.075, location=(0.5 * sx, -0.01, 0.86)); h = bpy.context.object; h.name = f'hand_{s}'
    h.data.materials.append(MAT['b_skin']); parts.append((h, lambda z, x, s=s: {f'hand_{s}': 1}))

for o, wfn in parts:
    o.parent = rig; m = o.modifiers.new('rig', 'ARMATURE'); m.object = rig
    groups = {}
    for v in o.data.vertices:
        for bn, w in wfn(v.co.z, v.co.x).items():
            if w <= 0: continue
            g = groups.get(bn) or o.vertex_groups.new(name=bn); groups[bn] = g; g.add([v.index], w, 'REPLACE')
bpy.ops.object.select_all(action='DESELECT')
for o, _ in parts: o.select_set(True)
bpy.context.view_layer.objects.active = parts[0][0]; bpy.ops.object.join(); body = bpy.context.object; body.name = 'body'
for p in body.data.polygons: p.use_smooth = True
tris = sum(len(p.vertices) - 2 for p in body.data.polygons)

# ── 동작 묶음 ──
P = rig.pose.bones
for pb in P: pb.rotation_mode = 'XYZ'
def inward(s, a): return a if s == 'L' else -a          # 팔을 몸 쪽으로 모으는 Z
def ramp(t, a, b): return min(1, max(0, (t - a) / (b - a)))
def smooth(k): return k * k * (3 - 2 * k)
def clip(name, frames, pose, loop=True):
    act = bpy.data.actions.new(name); rig.animation_data_create(); rig.animation_data.action = act
    for f in range(frames + 1):
        t = (f % frames) / frames if loop else f / frames
        for pb in P: pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0)
        pose(t)
        for pb in P: pb.keyframe_insert('rotation_euler', frame=f + 1)
        P['hips'].keyframe_insert('location', frame=f + 1)  # 자리 옮김은 골반(들썩임·주저앉기)만
    tr = rig.animation_data.nla_tracks.new(); tr.name = name; tr.strips.new(name, 1, act); rig.animation_data.action = None

def legs(t, amp, knee, bob=0.03):
    sn, cs = math.sin(t * 2 * math.pi), math.cos(t * 2 * math.pi)
    for s, sg in SIDES:
        P[f'thigh_{s}'].rotation_euler.x = -amp * sn * sg                # 앞으로 내딛는다
        P[f'shin_{s}'].rotation_euler.x = knee * max(0, cs * sg) + 0.06    # 다리가 앞으로 나올 때 무릎을 굽힌다
        P[f'foot_{s}'].rotation_euler.x = -0.2 * max(0, cs * sg)
    P['hips'].location.y = bob * (abs(cs) - 1)                            # 다리가 곧을 때 높게(뼈 좌표 y가 위)
    P['spine'].rotation_euler.y = 0.06 * sn * (amp / 0.42)
    return sn
def swing(s, sn, sg, amp, elbow):
    P[f'upperarm_{s}'].rotation_euler.x = amp * sn * sg                   # 다리와 반대로
    P[f'upperarm_{s}'].rotation_euler.z = inward(s, -0.06)
    P[f'forearm_{s}'].rotation_euler.x = -elbow - 0.15 * max(0, -sn * sg)  # 팔꿈치를 앞으로 굽힌다

def idle(t):
    k = math.sin(t * 2 * math.pi)
    P['chest'].rotation_euler.x = 0.015 * k; P['head'].rotation_euler.z = 0.08 * math.sin(t * 2 * math.pi + 1)
    for s, _ in SIDES: P[f'upperarm_{s}'].rotation_euler.z = inward(s, -0.06); P[f'forearm_{s}'].rotation_euler.x = -0.12
def walk(t):
    sn = legs(t, 0.42, 0.75)
    for s, sg in SIDES: swing(s, sn, sg, 0.38, 0.22)
def run(t):
    sn = legs(t, 0.7, 1.3, 0.05); P['spine'].rotation_euler.x = 0.18; P['head'].rotation_euler.x = -0.12
    for s, sg in SIDES: swing(s, sn, sg, 0.75, 1.3)
def walk_spear(t):  # x+쪽(_L) 손에 창을 곧게 세워 쥔다: 팔꿈치를 굽혀 손이 가슴 앞, 손목으로 창을 세운다(창은 손 뼈에 붙는다)
    sn = legs(t, 0.38, 0.7)
    P['upperarm_L'].rotation_euler.x = -0.3; P['upperarm_L'].rotation_euler.z = inward('L', 0.05)
    P['forearm_L'].rotation_euler.x = -1.15; P['hand_L'].rotation_euler.x = 1.45 + 0.03 * sn
    swing('R', sn, -1, 0.3, 0.2)
def walk_sword(t):  # x−쪽(_R) 손을 허리 칼자루(x −0.42, 높이 1.0)에 얹는다
    sn = legs(t, 0.38, 0.7)
    P['upperarm_R'].rotation_euler.x = -0.12; P['upperarm_R'].rotation_euler.z = inward('R', 0.12)
    P['forearm_R'].rotation_euler.x = -0.6; P['hand_R'].rotation_euler.x = 0.25
    swing('L', sn, 1, 0.34, 0.2)
def walk_bow(t):  # 등에 멘 활끈을 x−쪽 손으로 잡고 걷는다
    sn = legs(t, 0.4, 0.72)
    P['upperarm_R'].rotation_euler.x = -0.15; P['upperarm_R'].rotation_euler.z = inward('R', 0.18); P['forearm_R'].rotation_euler.x = -1.25
    swing('L', sn, 1, 0.34, 0.2)
CARRY_ARM = (-0.85, -0.6, 0.28)  # 짐 안기: 위팔 앞으로, 팔꿈치 굽힘, 안쪽으로 모음 → 두 손이 가슴 앞 짐 양옆(좌우 ±0.3, 높이 1.25, 앞 0.55)
def carry(t):
    legs(t, 0.3, 0.55, 0.02)
    P['spine'].rotation_euler.x = -0.05
    for s, _ in SIDES:
        P[f'upperarm_{s}'].rotation_euler.x = CARRY_ARM[0]; P[f'forearm_{s}'].rotation_euler.x = CARRY_ARM[1]
        P[f'upperarm_{s}'].rotation_euler.z = inward(s, CARRY_ARM[2]); P[f'hand_{s}'].rotation_euler.z = inward(s, -0.35)
def give(t):  # 건네기(한 번): x−쪽 팔을 앞으로 내밀었다가 거둔다
    e = smooth(ramp(t, 0, 0.35)) * (1 - smooth(ramp(t, 0.7, 1)))
    P['chest'].rotation_euler.x = 0.1 * e
    P['upperarm_R'].rotation_euler.x = -1.25 * e; P['upperarm_R'].rotation_euler.z = inward('R', 0.15 * e); P['forearm_R'].rotation_euler.x = -0.25 * e - 0.1
    P['upperarm_L'].rotation_euler.z = inward('L', -0.06); P['forearm_L'].rotation_euler.x = -0.12
def put_down(t):  # 내려놓기(한 번): 무릎·허리를 굽혀 두 손을 바닥 가까이 내렸다가 일어선다
    e = smooth(ramp(t, 0, 0.45)) * (1 - smooth(ramp(t, 0.65, 1)))
    P['hips'].location.y = -0.16 * e; P['spine'].rotation_euler.x = 0.55 * e; P['chest'].rotation_euler.x = 0.2 * e; P['head'].rotation_euler.x = -0.3 * e
    for s, _ in SIDES:
        P[f'thigh_{s}'].rotation_euler.x = -0.55 * e; P[f'shin_{s}'].rotation_euler.x = 0.95 * e; P[f'foot_{s}'].rotation_euler.x = -0.35 * e
        P[f'upperarm_{s}'].rotation_euler.x = CARRY_ARM[0] * (1 - e) - 0.5 * e; P[f'forearm_{s}'].rotation_euler.x = CARRY_ARM[1] * (1 - e) - 0.2 * e
        P[f'upperarm_{s}'].rotation_euler.z = inward(s, CARRY_ARM[2]); P[f'hand_{s}'].rotation_euler.z = inward(s, -0.35)
def talk(t):  # 말하기 손짓: x−쪽 팔을 앞으로 들어 손을 펴 흔들고 가볍게 끄덕인다
    k = math.sin(t * 2 * math.pi)
    P['upperarm_R'].rotation_euler.x = -0.55 + 0.1 * k; P['upperarm_R'].rotation_euler.z = inward('R', -0.15)
    P['forearm_R'].rotation_euler.x = -0.9 + 0.25 * math.sin(t * 4 * math.pi)
    P['upperarm_L'].rotation_euler.x = -0.15; P['forearm_L'].rotation_euler.x = -0.3
    P['head'].rotation_euler.x = 0.06 * max(0, math.sin(t * 4 * math.pi)); P['chest'].rotation_euler.x = 0.02
def work_hammer(t):  # 망치질: x+쪽 팔을 머리 위로 들었다가 내려친다. 다른 손은 앞을 누른다
    up = smooth(ramp(t, 0, 0.55)) * (1 - smooth(ramp(t, 0.6, 0.72)))
    P['upperarm_L'].rotation_euler.x = -0.6 - 2.0 * up; P['forearm_L'].rotation_euler.x = -0.35 - 0.5 * up
    P['upperarm_R'].rotation_euler.x = -0.7; P['forearm_R'].rotation_euler.x = -0.4
    P['spine'].rotation_euler.x = 0.12 - 0.08 * up
def work_sweep(t):  # 비질: 두 팔을 앞 아래로 모아 쥐고 좌우로 쓴다
    k = math.sin(t * 2 * math.pi)
    P['spine'].rotation_euler.x = 0.18; P['spine'].rotation_euler.y = 0.2 * k
    for s, _ in SIDES:
        P[f'upperarm_{s}'].rotation_euler.x = -0.6; P[f'upperarm_{s}'].rotation_euler.z = inward(s, 0.3) + 0.35 * k
        P[f'forearm_{s}'].rotation_euler.x = -0.3

def still(pose_fn):  # 걷는 동작의 팔 자세 그대로 서 있기(다리는 곧게)
    def f(t):
        pose_fn(0.25)
        for s, _ in SIDES:
            for b in ('thigh', 'shin', 'foot'): P[f'{b}_{s}'].rotation_euler = (0, 0, 0)
        P['hips'].location = (0, 0, 0); P['spine'].rotation_euler.y = 0; P['chest'].rotation_euler.x += 0.015 * math.sin(t * 2 * math.pi)
    return f
clip('idle', 48, idle); clip('walk', 24, walk); clip('run', 14, run)
clip('idle_spear', 48, still(walk_spear)); clip('idle_sword', 48, still(walk_sword)); clip('idle_carry', 48, still(carry))          # walk 한 바퀴(두 걸음) 1초 ≈ 1.1m, run 0.58초 ≈ 2.6m
clip('walk_spear', 24, walk_spear); clip('walk_sword', 24, walk_sword); clip('walk_bow', 24, walk_bow); clip('carry', 26, carry)
clip('give', 30, give, False); clip('put_down', 34, put_down, False)
clip('talk', 48, talk); clip('work_hammer', 24, work_hammer); clip('work_sweep', 36, work_sweep)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_animations=True, export_animation_mode='NLA_TRACKS', export_apply=False, export_yup=True, export_skins=True, export_materials='EXPORT')
print('saved', out, 'tris', tris, 'bones', len(rig.data.bones), 'clips', [t.name for t in rig.animation_data.nla_tracks])
