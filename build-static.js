// Builds a static copy of the preview in veltexra-preview/dist, ready for any static host (Vercel).
// Photos are resized for the web so pages load fast. The site asks search engines not to index it,
// so the preview never competes with the real Shopify store in Google.
//
// Run from a folder where `sharp` is installed:   node <path>/build-static.js
const fs = require('fs');
const path = require('path');
const sharp = require(require.resolve('sharp', { paths: [process.cwd()] }));
const { ROOT, IMAGES, buildData } = require('./catalog-data.js');

const DIST = path.join(__dirname, 'dist');
const THEME_ASSETS = path.join(ROOT, 'veltexra-theme', 'assets');

async function main() {
  // Clear the previous build but keep .vercel, which links this folder to the Vercel project
  fs.mkdirSync(DIST, { recursive: true });
  for (const entry of fs.readdirSync(DIST)) {
    if (entry !== '.vercel') fs.rmSync(path.join(DIST, entry), { recursive: true, force: true });
  }
  for (const dir of ['img', 'photo', 'theme']) fs.mkdirSync(path.join(DIST, dir), { recursive: true });

  // Page, script and data
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
    .replace('<meta name="viewport"', '<meta name="robots" content="noindex, nofollow">\n<meta name="viewport"');
  fs.writeFileSync(path.join(DIST, 'index.html'), html);
  fs.copyFileSync(path.join(__dirname, 'app.js'), path.join(DIST, 'app.js'));
  const data = buildData();
  fs.writeFileSync(path.join(DIST, 'data.js'), `window.VX = ${JSON.stringify({ products: data })};`);

  // Theme stylesheet and logo files
  for (const f of ['base.css', 'veltexra-wordmark.png', 'veltexra-logo.png', 'veltexra-icon.png', 'veltexra-favicon.png']) {
    fs.copyFileSync(path.join(THEME_ASSETS, f), path.join(DIST, 'theme', f));
  }

  // Product photos: 1200px is plenty for tiles and the product gallery
  const used = new Set(data.flatMap((p) => p.images.map((src) => path.basename(src))));
  let bytes = 0;
  for (const file of used) {
    const out = path.join(DIST, 'img', file);
    await sharp(path.join(IMAGES, file)).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true }).toFile(out);
    bytes += fs.statSync(out).size;
  }

  // Banner and editorial photo
  await sharp(path.join(ROOT, 'veltexra-store-images', 'hero.jpg')).resize(2400).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(DIST, 'photo', 'hero.jpg'));
  await sharp(path.join(ROOT, 'A+ perfumes', 'Tom Ford.jpeg')).resize(1600).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(DIST, 'photo', 'tomford.jpg'));

  // Never upload local env/token files that `vercel link` may create
  fs.writeFileSync(path.join(DIST, '.vercelignore'), '.env*\n.vercel\n.gitignore\n');

  // Hosting settings: no search indexing, and let browsers cache images for a day
  fs.writeFileSync(path.join(DIST, 'vercel.json'), JSON.stringify({
    headers: [
      { source: '/(.*)', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/(img|photo|theme)/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }] },
    ],
  }, null, 2) + '\n');

  const total = (dir) => fs.readdirSync(dir, { withFileTypes: true }).reduce((sum, e) => {
    const p = path.join(dir, e.name);
    return sum + (e.isDirectory() ? total(p) : fs.statSync(p).size);
  }, 0);
  console.log(`${used.size} product photos (${(bytes / 1048576).toFixed(1)} MB), site total ${(total(DIST) / 1048576).toFixed(1)} MB in ${DIST}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
