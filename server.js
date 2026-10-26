// Local preview of the Veltexra store, using the real theme styles and the catalog data.
// Start:  node veltexra-preview/server.js   then open http://127.0.0.1:4173
const http = require('http');
const fs = require('fs');
const path = require('path');
const { ROOT, IMAGES, buildData } = require('./catalog-data.js');

const PORT = 4173;
const data = buildData();

const routes = {
  '/theme/': path.join(ROOT, 'veltexra-theme', 'assets'),
  '/img/': IMAGES,
};
const files = {
  '/': path.join(__dirname, 'index.html'),
  '/index.html': path.join(__dirname, 'index.html'),
  '/app.js': path.join(__dirname, 'app.js'),
  '/photo/hero.jpg': path.join(ROOT, 'veltexra-store-images', 'hero.jpg'),
  '/photo/tomford.jpg': path.join(ROOT, 'A+ perfumes', 'Tom Ford.jpeg'),
};
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

http
  .createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    if (url === '/data.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
      res.end(`window.VX = ${JSON.stringify({ products: data })};`);
      return;
    }
    let file = files[url];
    for (const [prefix, dir] of Object.entries(routes)) {
      if (!file && url.startsWith(prefix)) {
        const candidate = path.join(dir, url.slice(prefix.length));
        if (candidate.startsWith(dir)) file = candidate; // no path traversal
      }
    }
    if (!file || !fs.existsSync(file)) {
      res.writeHead(404).end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, '127.0.0.1', () => console.log(`Veltexra preview running at http://127.0.0.1:${PORT}`));
