// 올리기 전 묶기(2026-11-12 선생님: 여러 명이 한꺼번에 처음 접속해도 잘 열리게): 게임 코드 60여 개를 dist/ 의 파일 몇 개로 묶는다.
// 쓰는 법: node tools/build.cjs   (esbuild는 npx로 받아 쓴다. 저장소에 설치하지 않는다)
// 학생 주소(github.io)에서만 index.html이 dist/main.js를 읽고, 개발·미리보기·테스트는 원본(core/main.js)을 그대로 읽는다.
// 원본을 고치고 묶지 않은 채 올리면 tests/sw.test.js 의 'dist가 원본과 같은 판' 검사가 실패한다(SRC_HASH).
const { execFileSync } = require('child_process'); const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..'), out = path.join(root, 'dist'), meta = path.join(require('os').tmpdir(), `history-meta-${process.pid}.json`);
fs.rmSync(out, { recursive: true, force: true });
execFileSync('npx', ['--yes', 'esbuild@0.28.2', 'core/main.js', '--bundle', '--splitting', '--format=esm', '--minify-whitespace', '--minify-syntax', '--target=es2020', '--log-level=warning',
  '--alias:three=./vendor/three.module.min.js', '--entry-names=main', '--chunk-names=c-[hash]', '--outdir=dist', `--metafile=${meta}`], { cwd: root, stdio: 'inherit' }); // 이름은 바꾸지 않는다(--minify-identifiers 없음): 함수·클래스 이름에 기대는 코드가 깨지지 않게
const m = JSON.parse(fs.readFileSync(meta, 'utf8')); fs.rmSync(meta);
const first = new Set(); (function walk(f) { if (first.has(f)) return; first.add(f); for (const i of m.outputs[f].imports) if (i.kind === 'import-statement') walk(i.path); })('dist/main.js'); // 첫 화면에 꼭 필요한 묶음(장마다의 묶음은 들어갈 때 받는다)
const src = Object.keys(m.inputs).sort(), h = crypto.createHash('sha256');
for (const f of src) { h.update(f + '\n'); h.update(fs.readFileSync(path.join(root, f))); }
fs.writeFileSync(path.join(out, 'manifest.js'), `// tools/build.cjs가 만든다. 손으로 고치지 않는다.\nexport const DIST_FIRST = ${JSON.stringify([...first])};\nexport const DIST_ALL = ${JSON.stringify(Object.keys(m.outputs).sort())};\nexport const SRC_FILES = ${JSON.stringify(src)};\nexport const SRC_HASH = '${h.digest('hex')}';\n`);
console.log(`dist: 묶음 ${Object.keys(m.outputs).length}개, 첫 화면 ${first.size}개(${Math.round([...first].reduce((a, f) => a + m.outputs[f].bytes, 0) / 1024)}KB), 원본 ${src.length}개`);
