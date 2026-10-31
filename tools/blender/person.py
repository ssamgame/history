# 블렌더로 인물 몸(뼈대·살붙이기·움직임)을 만들어 GLB로 내보낸다(2026-10-31 시범: 선생님 "블렌더로 인물의 모양·움직임 완성도").
# 실행(창 없이): <블렌더 파이썬> tools/blender/person.py assets/models/person.glb && python3 tools/blender/glb2js.py assets/models/person.glb assets/models/person.js
#   (게임은 person.js를 불러온다: GLB를 base64로 담은 모듈)
#   블렌더는 PyPI의 bpy(블렌더 5.2를 파이썬 모듈로 만든 것)로 돌린다: python3.13 -m venv bl && bl/bin/pip install bpy
# 몸 크기는 게임의 인물(core/people.js)과 같게 둔다: 다리 관절 높이 0.55, 몸통 관절(허리) 1.05, 어깨 1.65(좌우 ±0.5), 팔 길이 0.78, 머리 자리 2.1.
# 얼굴·머리카락·모자는 넣지 않는다: 게임이 지금처럼 코드로 그린 머리(core/people.js의 headGroup)를 이 몸의 head 뼈에 붙인다.
# 뼈 이름은 점 없이(thigh_L): glTF 불러오기가 이름의 점을 지운다. 재질 이름(robe·trim·sleeve·skin·leg·shoe)으로 게임이 생김새마다 색을 바꾼다. 앞은 게임과 같이 +z(블렌더 -Y로 만들면 glTF가 +Z로 바꾼다).
import sys, math
import bpy, bmesh
from mathutils import Vector

out = sys.argv[-1] if sys.argv[-1].endswith('.glb') else 'person.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene
scn.render.fps = 24

def material(name, rgb):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF'); b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = 0.85
    return m
MAT = {k: material(k, c) for k, c in {
    'robe': (0.55, 0.45, 0.32), 'trim': (0.17, 0.14, 0.11), 'sleeve': (0.55, 0.45, 0.32), 'skin': (0.93, 0.78, 0.64), 'leg': (0.17, 0.14, 0.11), 'shoe': (0.12, 0.10, 0.09)}.items()}

parts = []  # (오브젝트, 뼈 이름 또는 None(옷자락처럼 높이로 나눔), 묶음 이름)
GROUP = ['body']  # 지금 만드는 조각이 들어갈 묶음: body(늘 보임) · robe_s/robe_l(옷 길이) · sleeve_n/sleeve_w(소매 폭). 게임이 생김새에 맞는 묶음만 보인다
def add(obj, mat, bone):
    obj.data.materials.append(MAT[mat]); parts.append((obj, bone, GROUP[0])); return obj
def smooth(obj, angle=50):
    for p in obj.data.polygons: p.use_smooth = True
    obj.data.set_sharp_from_angle(angle=math.radians(angle)) if hasattr(obj.data, 'set_sharp_from_angle') else None
def cyl(name, r1, r2, z0, z1, x=0.0, y=0.0, seg=12):
    bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=r1, radius2=r2, depth=z1 - z0, location=(x, y, (z0 + z1) / 2))
    o = bpy.context.object; o.name = name; return o
def box(name, sx, sy, sz, x, y, z, bevel=0.03):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z)); o = bpy.context.object; o.name = name; o.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        m = o.modifiers.new('bevel', 'BEVEL'); m.width = bevel; m.segments = 2
        bpy.ops.object.modifier_apply(modifier='bevel')
    return o
def ball(name, r, x, y, z, sx=1, sy=1, sz=1, seg=12, rings=8):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=r, location=(x, y, z)); o = bpy.context.object; o.name = name; o.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(scale=True); return o

# ── 몸 ── (블렌더 좌표: x 왼쪽(+)/오른쪽(-), -y 앞, z 위)
for side, sx in (('L', 0.16), ('R', -0.16)):
    smooth(add(cyl(f'thigh_{side}', 0.11, 0.10, 0.27, 0.56, sx), 'leg', f'thigh_{side}'))
    smooth(add(cyl(f'shin_{side}', 0.10, 0.085, 0.05, 0.29, sx), 'leg', f'shin_{side}'))
    smooth(add(ball(f'shoe.{side}', 0.12, sx, -0.05, 0.055, 1.0, 1.55, 0.55), 'shoe', f'foot_{side}'))
# 긴 옷: 가슴에서 아래로 퍼지는 몸판(옷자락은 높이에 따라 허벅지를 따라 흔들린다)과 끝단. 길이는 게임과 같게 둘: 1.25(무릎 아래) · 1.5(단령·델·장삼·도포, 발등 가까이)
for key, ln in (('robe_s', 1.25), ('robe_l', 1.5)):
    GROUP[0] = key
    bot, rb = 1.745 - ln, 0.58 + (ln - 1.25) * 0.2
    robe = cyl(key, rb, 0.38, bot, 1.745, seg=16); smooth(add(robe, 'robe', None))
    bm = bmesh.new(); bm.from_mesh(robe.data)  # 앞뒤로 조금 납작하게, 어깨 쪽은 둥글게
    for v in bm.verts:
        v.co.y *= 0.88
        if v.co.z > 1.7: v.co.x *= 0.94
    bm.to_mesh(robe.data); bm.free()
    hem = cyl(key + '_hem', rb + 0.01, rb - 0.005, bot, bot + 0.07, seg=16); smooth(add(hem, 'trim', None))
    bm = bmesh.new(); bm.from_mesh(hem.data)
    for v in bm.verts: v.co.y *= 0.88
    bm.to_mesh(hem.data); bm.free()
GROUP[0] = 'body'
smooth(add(cyl('belt', 0.405, 0.405, 1.22, 1.30, seg=16), 'trim', 'spine'))
smooth(add(cyl('collar', 0.30, 0.22, 1.70, 1.80, seg=16), 'trim', 'chest'))
smooth(add(cyl('neck', 0.13, 0.12, 1.75, 1.98, seg=10), 'skin', 'neck'))
# 소매: 보통(0.11) · 넓은 소매(단령·도포·곤룡포, 아래로 갈수록 넓게)
for key, w in (('sleeve_n', 0.0), ('sleeve_w', 0.05)):
    GROUP[0] = key
    for side, sx in (('L', 0.5), ('R', -0.5)):
        smooth(add(cyl(f'{key}.up.{side}', 0.115 + w * 0.6, 0.125, 1.26, 1.72, sx), 'sleeve', f'upperarm_{side}'))
        smooth(add(cyl(f'{key}.fore.{side}', 0.11 + w * 1.4, 0.118 + w * 0.6, 0.95, 1.28, sx), 'sleeve', f'forearm_{side}'))
        smooth(add(cyl(f'{key}.cuff.{side}', 0.12 + w * 1.5, 0.12 + w * 1.4, 0.90, 0.97, sx), 'trim', f'forearm_{side}'))
GROUP[0] = 'body'
for side, sx in (('L', 0.5), ('R', -0.5)):
    smooth(add(ball(f'hand.{side}', 0.095, sx, -0.01, 0.84, 0.9, 0.8, 1.15), 'skin', f'forearm_{side}'))

# ── 뼈대 ──
bpy.ops.object.armature_add(location=(0, 0, 0)); arm = bpy.context.object; arm.name = 'rig'
bpy.ops.object.mode_set(mode='EDIT')
eb = arm.data.edit_bones; eb.remove(eb[0])
def bone(name, head, tail, parent=None):
    b = eb.new(name); b.head = Vector(head); b.tail = Vector(tail); b.roll = 0
    if parent: b.parent = eb[parent]; b.use_connect = False
    return b
bone('root', (0, 0, 0), (0, 0.3, 0))
bone('hips', (0, 0, 0.55), (0, 0, 1.05), 'root')
bone('spine', (0, 0, 1.05), (0, 0, 1.45), 'hips')
bone('chest', (0, 0, 1.45), (0, 0, 1.75), 'spine')
bone('neck', (0, 0, 1.75), (0, 0, 1.95), 'chest')
bone('head', (0, 0, 1.95), (0, 0, 2.45), 'neck')
for side, sx in (('L', 1), ('R', -1)):
    bone(f'thigh_{side}', (0.16 * sx, 0, 0.55), (0.16 * sx, 0, 0.29), 'hips')
    bone(f'shin_{side}', (0.16 * sx, 0, 0.29), (0.16 * sx, 0, 0.06), f'thigh_{side}')
    bone(f'foot_{side}', (0.16 * sx, 0, 0.06), (0.16 * sx, -0.18, 0.04), f'shin_{side}')
    bone(f'upperarm_{side}', (0.5 * sx, 0, 1.68), (0.5 * sx, 0, 1.28), 'chest')
    bone(f'forearm_{side}', (0.5 * sx, 0, 1.28), (0.5 * sx, 0, 0.88), f'upperarm_{side}')
bpy.ops.object.mode_set(mode='OBJECT')

# ── 살붙이기: 조각마다 그 뼈를 따른다(로우폴리 모양 그대로). 긴 옷자락은 무릎 쪽일수록 그쪽 허벅지를 따라 걸음에 흔들린다 ──
for obj, b, _ in parts:
    obj.parent = arm
    mod = obj.modifiers.new('rig', 'ARMATURE'); mod.object = arm
    if b:
        g = obj.vertex_groups.new(name=b); g.add([v.index for v in obj.data.vertices], 1.0, 'REPLACE')
    else:
        gs = {n: obj.vertex_groups.new(name=n) for n in ('hips', 'spine', 'chest', 'thigh_L', 'thigh_R')}
        for v in obj.data.vertices:
            z, x = v.co.z, v.co.x
            if z > 1.45: gs['chest'].add([v.index], 1, 'REPLACE'); continue
            if z > 1.1: gs['spine'].add([v.index], 1, 'REPLACE'); continue
            k = min(1, max(0, (1.1 - z) / 0.55)) * 0.75  # 아래로 갈수록 허벅지를 많이 따른다
            l = min(1, max(0, 0.5 + x / 0.7))           # 왼쪽(+x)일수록 왼 허벅지
            gs['hips'].add([v.index], 1 - k, 'REPLACE'); gs['thigh_L'].add([v.index], k * l, 'REPLACE'); gs['thigh_R'].add([v.index], k * (1 - l), 'REPLACE')

# 묶음마다 한 덩어리로 합친다(그리기 횟수를 줄인다. 재질별로는 나뉜다): body · robe_s · robe_l · sleeve_n · sleeve_w
tris = 0
for key in ('body', 'robe_s', 'robe_l', 'sleeve_n', 'sleeve_w'):
    objs = [o for o, _, gk in parts if gk == key]
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join(); j = bpy.context.object; j.name = key
    tris += sum(len(p.vertices) - 2 for p in j.data.polygons)

# ── 움직임 ── 뼈의 X축 둘레로 돌리면 앞뒤로 흔든다(다리·팔이 아래를 향한 뼈라 +면 앞으로)
def action(name, frames, keys):
    a = bpy.data.actions.new(name); arm.animation_data_create(); arm.animation_data.action = a
    for pb in arm.pose.bones: pb.rotation_mode = 'XYZ'
    for f in range(frames + 1):
        t = f / frames
        for pb in arm.pose.bones: pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0)
        keys(t, arm.pose.bones)
        for pb in arm.pose.bones:
            pb.keyframe_insert('rotation_euler', frame=f + 1); pb.keyframe_insert('location', frame=f + 1)
    tr = arm.animation_data.nla_tracks.new(); tr.name = name; tr.strips.new(name, 1, a); arm.animation_data.action = None
    return a

def gait(t, P, amp, knee, arm_amp, bob, lean):
    s = math.sin(t * 2 * math.pi)
    for side, sg in (('L', 1), ('R', -1)):
        ph = s * sg
        P[f'thigh_{side}'].rotation_euler.x = -amp * ph            # 앞으로 내딛기(-x 둘레: 발이 -y(앞)로)
        c = math.cos(t * 2 * math.pi) * sg
        P[f'shin_{side}'].rotation_euler.x = knee * max(0, c) + 0.08  # 다리가 앞으로 나올 때 무릎을 굽힌다
        P[f'foot_{side}'].rotation_euler.x = -0.25 * max(0, c)
        P[f'upperarm_{side}'].rotation_euler.x = arm_amp * ph        # 팔은 반대로
        P[f'upperarm_{side}'].rotation_euler.y = 0
        P[f'forearm_{side}'].rotation_euler.x = -0.25 - 0.2 * max(0, -ph)
    P['hips'].location.y = bob * abs(math.cos(t * 2 * math.pi)) - bob   # 다리가 곧을 때 높게(뼈 좌표: y가 위)
    P['spine'].rotation_euler.x = lean; P['spine'].rotation_euler.y = 0.08 * s * (amp / 0.5)
    P['head'].rotation_euler.x = -lean * 0.6

action('idle', 48, lambda t, P: (P['chest'].rotation_euler.__setattr__('x', 0.015 * math.sin(t * 2 * math.pi)),
    P['upperarm_L'].rotation_euler.__setattr__('z', 0.06), P['upperarm_R'].rotation_euler.__setattr__('z', -0.06),
    P['forearm_L'].rotation_euler.__setattr__('x', -0.12), P['forearm_R'].rotation_euler.__setattr__('x', -0.12),
    P['head'].rotation_euler.__setattr__('z', 0.12 * math.sin(t * 2 * math.pi))))
action('walk', 24, lambda t, P: gait(t, P, 0.42, 0.75, 0.38, 0.035, 0.05))   # 한 바퀴(두 걸음) 1초 ≈ 1.1m
action('run', 14, lambda t, P: gait(t, P, 0.7, 1.3, 0.75, 0.06, 0.18))       # 한 바퀴 0.6초 ≈ 2.6m

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_animations=True, export_animation_mode='NLA_TRACKS', export_apply=False, export_yup=True, export_skins=True, export_materials='EXPORT')
print('saved', out, 'tris(all groups)', tris)
