import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

process.on('SIGHUP', () => {});
process.on('uncaughtException', () => {});

const webDir = path.resolve(process.argv[2]);
const portFile = process.argv[3];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  try {
    res.on('error', () => {});
    const rawUrl = (req.url || '/').split('?')[0];
    let urlPath = '/';
    try { urlPath = decodeURIComponent(rawUrl); } catch (_) { urlPath = rawUrl; }
    const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(webDir, safePath === '/' ? 'stage.html' : safePath);

    if (!filePath.startsWith(webDir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const stat = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const range = req.headers.range;

    if (range && stat.size > 0) {
      const [s, e] = range.replace(/bytes=/, '').split('-');
      let start = s ? parseInt(s, 10) : 0;
      let end = e ? parseInt(e, 10) : stat.size - 1;
      if (Number.isNaN(start) || start < 0) start = 0;
      if (Number.isNaN(end) || end >= stat.size || end < start) end = stat.size - 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': type,
      });
      const stream = fs.createReadStream(filePath, { start, end });
      stream.on('error', () => res.end());
      res.on('close', () => stream.destroy());
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Accept-Ranges': 'bytes',
        'Content-Type': type,
      });
      const stream = fs.createReadStream(filePath);
      stream.on('error', () => res.end());
      res.on('close', () => stream.destroy());
      stream.pipe(res);
    }
  } catch (_) {
    if (!res.headersSent) res.writeHead(500);
    res.end();
  }
});

server.listen(0, '127.0.0.1', () => {
  const { port } = server.address();
  fs.writeFileSync(portFile, String(port));
});
