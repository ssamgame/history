// 점검 도구용 정적 서버: 저장소 맨 위를 그대로, 캐시 없이 보낸다(tools/qa/run.cjs, baseline.cjs)
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..', '..');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
function serve(port) {
  return new Promise(r => {
    const s = http.createServer((q, res) => {
      const rel = decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '');
      let p = path.join(root, rel);
      if (!p.startsWith(root)) { res.statusCode = 403; return res.end(); }
      if (rel === 'favicon.ico') { res.statusCode = 204; return res.end(); } // 저장소에 없는 아이콘(콘솔 오류로 세지 않게)
      try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); res.setHeader('Content-Type', mime[path.extname(p)] || 'application/octet-stream'); res.setHeader('Cache-Control', 'no-store'); res.end(fs.readFileSync(p)); } catch { res.statusCode = 404; res.end(); }
    });
    s.listen(port, () => r(s));
  });
}

module.exports = { serve, root };
