# GLB를 자바스크립트 모듈(export default '<base64>')로 감싼다: 모델이 다른 코드 파일처럼 불러지게(미리보기는 .glb를 올릴 수 없고, 막힌 곳에서도 따로 내려받지 않는다).
# python3 tools/blender/glb2js.py assets/models/person.glb assets/models/person.js
import base64, sys
src, dst = sys.argv[1], sys.argv[2]
data = base64.b64encode(open(src, 'rb').read()).decode()
open(dst, 'w').write("// tools/blender/person.py → glb2js.py로 만든다(손으로 고치지 않는다). 블렌더 몸 GLB를 base64로 담았다\nexport default '" + data + "';\n")
print(dst, len(data))
