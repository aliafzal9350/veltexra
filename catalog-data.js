// Product data for the preview, shared by the local server (server.js) and the static build (build-static.js).
const fs = require('fs');
const path = require('path');
const { products, slug } = require('../veltexra-catalog/make-catalog.js');

const ROOT = path.resolve(__dirname, '..');
const IMAGES = path.join(ROOT, 'veltexra-catalog', 'product-images');

// Example prices so the layout can be judged; the real prices come from products.csv.
const EXAMPLE_PRICE = {
  'Maison Francis Kurkdjian': 325, 'Louis Vuitton': 310, Creed: 295, 'Tom Ford': 265,
  Chanel: 165, Dior: 150, 'Yves Saint Laurent': 135, Kayali: 120, Armaf: 55,
};

function buildData() {
  return products.map((p) => {
    const handle = slug(`${p.brand} ${p.title}`);
    const images = [`/img/${handle}.jpg`];
    const second = [`${handle}-box.jpg`, `${handle}-detail.jpg`].find((f) => fs.existsSync(path.join(IMAGES, f)));
    if (second) images.push(`/img/${second}`);
    return {
      handle, brand: p.brand, brandHandle: slug(p.brand), title: p.title, conc: p.conc, size: p.size,
      gender: p.gender, family: p.family, top: p.top, heart: p.heart, base: p.base, desc: p.desc,
      price: EXAMPLE_PRICE[p.brand] || 120, images,
    };
  });
}

module.exports = { ROOT, IMAGES, buildData };
