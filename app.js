/* Veltexra store preview: renders the theme's markup from the catalog data, so the real
   theme stylesheet (veltexra-theme/assets/base.css) styles it exactly as on Shopify. */
(() => {
  const { products } = window.VX;
  const byHandle = Object.fromEntries(products.map((p) => [p.handle, p]));
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => `$${n.toFixed(2)}`;
  const app = qs('[data-app]');

  // Same thin-line icons as snippets/icon.liquid
  const PATHS = {
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
    account: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c0-4.2 3.4-6.8 7.5-6.8s7.5 2.6 7.5 6.8"/>',
    bag: '<path d="M5 8h14l-1.2 13H6.2L5 8Z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/>',
    menu: '<path d="M3 9h18M3 15h18"/>',
    close: '<path d="m5.5 5.5 13 13M18.5 5.5l-13 13"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    filter: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  };
  const icon = (name) => `<svg class="icon icon-${name}" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${PATHS[name]}</svg>`;
  qsa('[data-icon]').forEach((el) => { el.insertAdjacentHTML('beforeend', icon(el.dataset.icon)); });

  // --- Collections -------------------------------------------------------------
  const FAMILIES = {
    Fresh: 'Bergamot, sea salt, clean musk. The one you can wear to work.',
    Floral: 'Jasmine, rose and gardenia, from soft to unapologetic.',
    Woody: 'Cedar, vetiver and sandalwood. Calm, dry, close to the skin.',
    'Amber & Oud': 'Vanilla, resin and smoke for cold nights and late dinners.',
  };
  const FAMILY_PHOTO = { Fresh: 'chanel-chance-eau-fraiche', Floral: 'dior-jadore', Woody: 'creed-aventus', 'Amber & Oud': 'tom-ford-tobacco-vanille' };
  const familyHandle = (f) => f.toLowerCase().replace(/\s*&\s*/g, '-').replace(/\s+/g, '-');
  const GENDERS = { 'for-her': ['her', 'For Her'], 'for-him': ['him', 'For Him'], unisex: ['unisex', 'Unisex'] };
  const brands = [...new Map(products.map((p) => [p.brandHandle, p.brand])).entries()].sort((a, b) => a[1].localeCompare(b[1]));

  function getCollection(handle) {
    if (handle === 'all') return { title: 'All fragrances', items: products };
    if (GENDERS[handle]) return { title: GENDERS[handle][1], items: products.filter((p) => p.gender === GENDERS[handle][0]) };
    const family = Object.keys(FAMILIES).find((f) => familyHandle(f) === handle);
    if (family) return { title: family, text: FAMILIES[family], items: products.filter((p) => p.family === family) };
    const brand = brands.find(([h]) => `brand-${h}` === handle);
    if (brand) return { title: brand[1], items: products.filter((p) => p.brandHandle === brand[0]) };
    return null;
  }

  // Header menus built from the data, like Shopify's navigation would be
  qs('[data-scent-dropdown]').innerHTML = Object.keys(FAMILIES)
    .map((f) => `<li><a href="#/collections/${familyHandle(f)}" class="nav__dropdown-link">${esc(f)}</a></li>`)
    .concat('<li><a href="#/collections/unisex" class="nav__dropdown-link">Unisex</a></li>').join('');
  const perColumn = Math.ceil(brands.length / 4);
  qs('[data-brand-mega]').innerHTML = [0, 1, 2, 3].map((i) => {
    const group = brands.slice(i * perColumn, (i + 1) * perColumn);
    if (!group.length) return '';
    const label = `${group[0][1][0]} – ${group[group.length - 1][1][0]}`;
    return `<div class="nav__mega-col"><span class="nav__mega-title">${label}</span><ul role="list">${group
      .map(([h, name]) => `<li><a href="#/collections/brand-${h}" class="nav__mega-link">${esc(name)}</a></li>`).join('')}</ul></div>`;
  }).join('');
  qs('[data-menu-list]').innerHTML = `
    <li><a href="#/collections/for-her" class="menu-drawer__link">For Her</a></li>
    <li><a href="#/collections/for-him" class="menu-drawer__link">For Him</a></li>
    <li><a href="#/collections/unisex" class="menu-drawer__link">Unisex</a></li>
    <li><details class="menu-drawer__details"><summary class="menu-drawer__link">Brands${icon('plus')}</summary><ul class="menu-drawer__sublist" role="list">
      ${brands.map(([h, name]) => `<li><a href="#/collections/brand-${h}" class="menu-drawer__sublink">${esc(name)}</a></li>`).join('')}</ul></details></li>
    <li><details class="menu-drawer__details"><summary class="menu-drawer__link">Scent${icon('plus')}</summary><ul class="menu-drawer__sublist" role="list">
      ${Object.keys(FAMILIES).map((f) => `<li><a href="#/collections/${familyHandle(f)}" class="menu-drawer__sublink">${esc(f)}</a></li>`).join('')}</ul></details></li>`;

  // --- Shared pieces -------------------------------------------------------------
  const heading = (title, text, sub) => `<div class="section-heading">${sub ? `<p class="eyebrow">${esc(sub)}</p>` : ''}${title ? `<h2 class="h2 section-heading__title">${esc(title)}</h2>` : ''}${text ? `<p class="section-heading__text">${esc(text)}</p>` : ''}</div>`;

  function card(p) {
    const second = p.images[1];
    return `<div class="card${second ? ' card--has-secondary' : ''}">
      <div class="card__media ratio-square is-blend">
        <a href="#/products/${p.handle}" class="card__link" tabindex="-1" aria-hidden="true">
          <img class="card__img card__img--primary" src="${p.images[0]}" alt="${esc(`${p.brand} ${p.title}`)}" width="2000" height="2000" loading="lazy">
          ${second ? `<img class="card__img card__img--secondary" src="${second}" alt="" width="2000" height="2000" loading="lazy">` : ''}
        </a>
        <div class="card__quick"><button type="button" class="card__quick-button" data-add="${p.handle}">Add to bag</button></div>
      </div>
      <div class="card__info">
        <p class="eyebrow card__vendor">${esc(p.brand)}</p>
        <h3 class="card__title"><a href="#/products/${p.handle}" class="card__title-link">${esc(p.title)}</a></h3>
        <div class="price"><span class="price__current">${money(p.price)}</span></div>
      </div>
    </div>`;
  }
  const grid = (items, columns = 4) => `<ul class="grid" style="--columns: ${columns};" role="list">${items.map((p) => `<li>${card(p)}</li>`).join('')}</ul>`;
  const newsletter = (id) => `<form class="newsletter-form" data-newsletter><div class="newsletter-form__field">
      <label for="${id}" class="visually-hidden">Email</label>
      <input id="${id}" type="email" class="newsletter-form__input" placeholder="Your email" required>
      <button type="submit" class="newsletter-form__button">Sign up</button></div></form>`;

  // --- Pages ---------------------------------------------------------------------
  function homePage() {
    const loved = ['creed-aventus', 'maison-francis-kurkdjian-baccarat-rouge-540-extrait-de-parfum', 'yves-saint-laurent-libre', 'dior-sauvage-eau-de-parfum',
      'chanel-coco-mademoiselle-intense', 'tom-ford-oud-wood', 'carolina-herrera-good-girl', 'louis-vuitton-ombre-nomade'].map((h) => byHandle[h]).filter(Boolean);
    return `
    <section class="hero hero--large hero--dark hero--middle-right hero--blend" style="--overlay: 0;">
      <div class="hero__media"><img class="hero__img" src="/photo/hero.jpg" alt="" width="2800" height="1400"></div>
      <div class="page-width hero__content hero__content--middle-right"><div class="hero__box">
        <p class="eyebrow">Veltexra Parfums</p>
        <h2 class="h0 hero__heading">The scent you keep reaching for.</h2>
        <p class="hero__text">Designer fragrances from Chanel, Dior, Creed, Tom Ford and more.</p>
        <div class="button-group"><a href="#/collections/for-her" class="button">Shop for her</a><a href="#/collections/for-him" class="button button--secondary">Shop for him</a></div>
      </div></div>
    </section>
    <div class="ticker" style="--ticker-duration: 45s;"><div class="ticker__track">${[1, 2].map((copy) => `<ul class="ticker__list" role="list"${copy === 2 ? ' aria-hidden="true"' : ''}>
      ${brands.map(([h, name]) => `<li class="ticker__item"><a href="#/collections/brand-${h}"${copy === 2 ? ' tabindex="-1"' : ''}>${esc(name)}</a></li>`).join('')}</ul>`).join('')}</div></div>
    <section class="section"><div class="page-width">
      ${heading('Most loved', 'The bottles people come back for.')}${grid(loved)}
      <div class="section__footer"><a href="#/collections/all" class="button button--secondary">View all</a></div>
    </div></section>
    <section class="section section--alt"><div class="page-width">
      ${heading('Shop by scent', 'Not sure where to start? Start with what you already like.')}
      <ul class="grid" style="--columns: 4;" role="list">${Object.keys(FAMILIES).map((f) => `<li><a href="#/collections/${familyHandle(f)}" class="collection-card">
        <div class="collection-card__media is-product is-blend"><img class="collection-card__img" src="${byHandle[FAMILY_PHOTO[f]].images[0]}" alt="" loading="lazy"></div>
        <div class="collection-card__info"><h3 class="h3 collection-card__title">${esc(f)}</h3><p class="collection-card__text">${esc(FAMILIES[f])}</p></div></a></li>`).join('')}</ul>
    </div></section>
    <section class="section"><div class="page-width image-text image-text--left">
      <div class="image-text__media" style="background: var(--color-bg-alt);"><img src="/photo/tomford.jpg" alt="" style="mix-blend-mode: multiply;" loading="lazy"></div>
      <div class="image-text__content"><h2 class="h2">Not sure which one?</h2>
        <div class="rte"><p>Tell us what you usually wear and what you like about it. We'll suggest two or three to try next.</p></div>
        <a href="#/contact" class="button button--secondary">Ask us</a></div>
    </div></section>
    <section class="section section--alt"><div class="page-width">
      ${heading('The houses')}
      <ul class="brands" role="list">${brands.map(([h, name]) => `<li><a href="#/collections/brand-${h}" class="brands__link">${esc(name)}</a></li>`).join('')}</ul>
    </div></section>
    <section class="section"><div class="page-width"><div class="rich-text rich-text--center rich-text--narrow">
      <img src="/theme/veltexra-icon.png" alt="" width="220" height="220" class="rich-text__icon">
      <p class="eyebrow">Our story</p>
      <div class="rte rich-text__body"><p>Veltexra started with a shelf of bottles and a lot of opinions.</p>
      <p>[Write one or two sentences here, in your own words, about who you are and why you started.]</p>
      <p>We don't carry everything. Every fragrance here is one we'd happily wear ourselves, and we'll tell you honestly if something isn't right for you. Ask us anything: what lasts, what projects, what to wear to a wedding in July. We answer every message ourselves.</p></div>
    </div></div></section>
    <section class="section section--alt"><div class="page-width"><div class="newsletter">
      ${heading('First to know', 'New arrivals, restocks and the occasional private sale. One email a month, never more.')}${newsletter('HomeNewsletter-email')}
    </div></div></section>`;
  }

  // Filters and sorting for collection pages
  let filterState = { key: null, gender: new Set(), family: new Set(), brand: new Set(), sort: 'featured' };
  const FILTER_GROUPS = [
    ['gender', 'For', (p) => ({ her: 'For Her', him: 'For Him', unisex: 'Unisex' }[p.gender])],
    ['family', 'Scent family', (p) => p.family],
    ['brand', 'Brand', (p) => p.brand],
  ];
  const SORTS = [['featured', 'Featured'], ['title-asc', 'Alphabetically, A–Z'], ['title-desc', 'Alphabetically, Z–A'], ['price-asc', 'Price, low to high'], ['price-desc', 'Price, high to low']];

  function filtered(items) {
    let out = items.filter((p) => FILTER_GROUPS.every(([key, , value]) => !filterState[key].size || filterState[key].has(value(p))));
    const sorters = {
      'title-asc': (a, b) => a.title.localeCompare(b.title), 'title-desc': (a, b) => b.title.localeCompare(a.title),
      'price-asc': (a, b) => a.price - b.price, 'price-desc': (a, b) => b.price - a.price,
    };
    if (sorters[filterState.sort]) out = [...out].sort(sorters[filterState.sort]);
    return out;
  }

  function collectionPage(handle) {
    const c = getCollection(handle);
    if (!c) return notFoundPage();
    if (filterState.key !== handle) filterState = { key: handle, gender: new Set(), family: new Set(), brand: new Set(), sort: 'featured' };
    const items = filtered(c.items);
    const active = FILTER_GROUPS.flatMap(([key]) => [...filterState[key]].map((v) => [key, v]));

    qs('#FacetsDrawer').innerHTML = `<form class="facets-form" data-facets-form>
      <div class="drawer__header"><h2 class="h3 drawer__title">Filter</h2><button type="button" class="drawer__close" data-drawer-close aria-label="Close">${icon('close')}</button></div>
      <div class="drawer__body">${FILTER_GROUPS.map(([key, label, value], i) => {
        const counts = {};
        c.items.forEach((p) => { counts[value(p)] = (counts[value(p)] || 0) + 1; });
        const values = Object.keys(counts).sort();
        if (values.length < 2) return '';
        return `<details class="facet"${i < 2 || filterState[key].size ? ' open' : ''}><summary class="facet__summary">${esc(label)}${icon('plus')}</summary>
          <div class="facet__content"><ul role="list">${values.map((v) => `<li><label class="checkbox"><input type="checkbox" name="${key}" value="${esc(v)}"${filterState[key].has(v) ? ' checked' : ''}>
          <span class="checkbox__box">${icon('check')}</span><span>${esc(v)} <span class="checkbox__count">(${counts[v]})</span></span></label></li>`).join('')}</ul></div></details>`;
      }).join('')}</div>
      <div class="drawer__footer facets-form__footer"><button type="button" class="button button--secondary" data-clear-filters>Clear all</button><button type="submit" class="button">Show results</button></div>
    </form>`;

    return `<div class="page-width">
      <div class="collection-hero"><h1 class="h1 collection-hero__title">${esc(c.title)}</h1>${c.text ? `<div class="rte collection-hero__text"><p>${esc(c.text)}</p></div>` : ''}</div>
      <div class="toolbar">
        <button type="button" class="toolbar__filter" data-drawer-open="FacetsDrawer">${icon('filter')}<span>Filter${active.length ? ` (${active.length})` : ''}</span></button>
        <p class="toolbar__count">${items.length} ${items.length === 1 ? 'fragrance' : 'fragrances'}</p>
        <div class="toolbar__sort"><label for="SortBy" class="toolbar__sort-label">Sort by</label>
          <select id="SortBy" class="select select--minimal" data-sort>${SORTS.map(([v, l]) => `<option value="${v}"${filterState.sort === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
      </div>
      ${active.length ? `<div class="active-filters">${active.map(([k, v]) => `<button type="button" class="active-filters__pill" data-remove-filter="${k}" data-value="${esc(v)}">${esc(v)}${icon('close')}</button>`).join('')}
        <button type="button" class="link active-filters__clear" data-clear-filters>Clear all</button></div>` : ''}
      ${items.length ? grid(items) : '<div class="empty-state"><p>No fragrances match these filters.</p><button type="button" class="button button--secondary" data-clear-filters>Clear all</button></div>'}
    </div><div class="section" aria-hidden="true"></div>`;
  }

  function notesBlock(p) {
    const tiers = [['Top', p.top], ['Heart', p.heart], ['Base', p.base]].filter(([, v]) => v);
    const details = [['Scent family', p.family], ['Concentration', p.conc]].filter(([, v]) => v);
    return `<div class="notes"><h2 class="eyebrow">The notes</h2>
      ${tiers.length ? `<dl class="notes__pyramid">${tiers.map(([l, v]) => `<div class="notes__tier"><dt>${l}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
      ${details.length ? `<dl class="notes__details">${details.map(([l, v]) => `<div><dt>${l}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}</div>`;
  }

  function productPage(handle) {
    const p = byHandle[handle];
    if (!p) return notFoundPage();
    const recs = products.filter((x) => x.family === p.family && x.handle !== p.handle).slice(0, 4);
    return `<section class="section section--product" data-product-root>
      <div class="page-width product">
        <div class="product__media"><div class="gallery is-blend" data-gallery>
          <div class="gallery__viewport" data-gallery-viewport>${p.images.map((src, i) => `<div class="gallery__slide is-blend" data-media-id="${i}">
            <img class="gallery__img" src="${src}" alt="${esc(`${p.brand} ${p.title}`)}" width="2000" height="2000"></div>`).join('')}</div>
          ${p.images.length > 1 ? `<div class="gallery__thumbs">${p.images.map((src, i) => `<button type="button" class="gallery__thumb${i ? '' : ' is-active'}" data-thumb="${i}" aria-label="Show image ${i + 1}">
            <img class="gallery__thumb-img" src="${src}" alt=""></button>`).join('')}</div>` : ''}
        </div></div>
        <div class="product__info">
          <p class="eyebrow product__vendor"><a href="#/collections/brand-${p.brandHandle}">${esc(p.brand)}</a></p>
          <h1 class="h1 product__title">${esc(p.title)}</h1>
          <div class="product__price"><div class="price price--large"><span class="price__current">${money(p.price)}</span></div>
            <p class="product__tax">Tax included. <a href="#/contact">Shipping</a> calculated at checkout.</p></div>
          <div class="variant-picker"><fieldset class="variant-option"><legend class="variant-option__legend">Size:<span>${esc(p.size)}</span></legend>
            <div class="variant-option__values"><div class="pill"><input type="radio" id="Size-1" name="size" checked><label for="Size-1" class="pill__label">${esc(p.size)}</label></div></div></fieldset></div>
          <div class="product__quantity"><label class="field__label" for="Quantity">Quantity</label>
            <div class="qty"><button type="button" class="qty__btn" data-qty-step="-1" aria-label="Decrease quantity">${icon('minus')}</button>
            <input class="qty__input" type="number" id="Quantity" value="1" min="1">
            <button type="button" class="qty__btn" data-qty-step="1" aria-label="Increase quantity">${icon('plus')}</button></div></div>
          <div class="product__buy"><button type="button" class="button button--full" data-add="${p.handle}" data-main-add>Add to bag</button></div>
          <div class="rte product__text"><p>Free shipping over $75 · Questions about this scent? <a href="#/contact">Ask us</a></p></div>
          ${notesBlock(p)}
          <div class="rte product__description"><p>${esc(p.desc)}</p></div>
          <details class="accordion"><summary class="accordion__summary">Shipping &amp; returns${icon('plus')}</summary>
            <div class="rte accordion__content"><p>Orders ship within [1–2] business days. Write your returns policy here, or choose a page below.</p></div></details>
          <details class="accordion"><summary class="accordion__summary">How to wear it${icon('plus')}</summary>
            <div class="rte accordion__content"><p>Spray on pulse points: wrists, neck and behind the ears. Let it dry instead of rubbing it in, which breaks down the top notes faster.</p></div></details>
        </div>
      </div>
      <div class="sticky-atc" data-sticky-atc aria-hidden="true"><div class="page-width sticky-atc__inner">
        <div class="sticky-atc__info"><p class="sticky-atc__title">${esc(p.title)}</p><div class="price"><span class="price__current">${money(p.price)}</span></div></div>
        <button type="button" class="button" data-add="${p.handle}" tabindex="-1">Add to bag</button></div></div>
    </section>
    ${recs.length ? `<section class="section"><div class="page-width">${heading('You may also like')}${grid(recs)}</div></section>` : ''}`;
  }

  const searchMatches = (term) => {
    const t = term.trim().toLowerCase();
    if (!t) return [];
    return products.filter((p) => [p.brand, p.title, p.top, p.heart, p.base, p.family].join(' ').toLowerCase().includes(t));
  };

  function searchPage(term) {
    const results = searchMatches(term);
    return `<div class="page-width"><div class="collection-hero"><h1 class="h1 collection-hero__title">Search</h1>
      <form class="search-page__form" data-search-page><label for="SearchPageInput" class="visually-hidden">Search</label>
        <input type="search" id="SearchPageInput" class="search-page__input" value="${esc(term)}" placeholder="Search fragrances, brands, notes">
        <button type="submit" class="search-page__submit" aria-label="Search">${icon('search')}</button></form>
      ${term ? `<p class="search-page__summary">${results.length} ${results.length === 1 ? 'result' : 'results'} for “${esc(term)}”</p>` : ''}</div>
      ${term && results.length ? grid(results) : ''}
      ${term && !results.length ? `<p class="empty-state">Nothing found for “${esc(term)}”. Try a brand or a note, like vanilla.</p>` : ''}
    </div><div class="section" aria-hidden="true"></div>`;
  }

  function accountPage() {
    return `<div class="customer customer--narrow">
      <div id="recover" class="customer__recover" tabindex="-1">
        <h1 class="h1">Reset your password</h1><p class="customer__intro">We'll send you an email to reset your password.</p>
        <form data-demo-form><div class="field"><label class="field__label" for="RecoverEmail">Email</label><input class="field__input" type="email" id="RecoverEmail" required></div>
        <button type="submit" class="button button--full">Send</button><a href="#/account" class="link customer__switch" data-hide-recover>Cancel</a></form>
      </div>
      <div id="login" class="customer__login">
        <h1 class="h1">Sign in</h1>
        <form data-demo-form>
          <div class="field"><label class="field__label" for="CustomerEmail">Email</label><input class="field__input" type="email" id="CustomerEmail" autocomplete="off" required></div>
          <div class="field"><label class="field__label" for="CustomerPassword">Password</label><input class="field__input" type="password" id="CustomerPassword" autocomplete="off" required></div>
          <a href="#/account" class="link customer__forgot" data-show-recover>Forgot your password?</a>
          <button type="submit" class="button button--full">Sign in</button>
        </form>
        <p class="customer__alt">New here? <a href="#/account" class="link">Create an account</a></p>
        <div class="customer__guest"><h2 class="h3">Continue as a guest</h2><button type="button" class="button button--secondary button--full" data-demo-message>Continue</button></div>
      </div>
    </div>`;
  }

  function contactPage() {
    return `<div class="page"><h1 class="h1 page__title">Contact</h1><div class="contact">
      ${heading('Write to us')}
      <form data-demo-form>
        <div class="address-form__row"><div class="field"><label class="field__label" for="ContactName">Name</label><input class="field__input" id="ContactName"></div>
        <div class="field"><label class="field__label" for="ContactEmail">Email</label><input class="field__input" type="email" id="ContactEmail" required></div></div>
        <div class="field"><label class="field__label" for="ContactBody">Message</label><textarea class="field__input" id="ContactBody" rows="6"></textarea></div>
        <button type="submit" class="button">Send</button>
      </form></div></div>`;
  }

  function cartPage() {
    return `<div class="page-width cart-page"><h1 class="h1 cart-page__title">Your bag</h1>
      ${cart.length ? `<div class="cart-page__grid"><div><ul class="cart-items" role="list">${cart.map(cartLine).join('')}</ul></div>
        <aside class="cart-page__summary">${freeShipping()}${totals()}<button type="button" class="button button--full" data-checkout>Checkout</button></aside></div>`
      : `<div class="empty-state"><img src="/theme/veltexra-icon.png" alt="" width="220" height="220" class="cart-empty__icon"><p>Your bag is empty.</p><a href="#/collections/all" class="button">Continue shopping</a></div>`}</div>`;
  }

  const notFoundPage = () => '<div class="not-found"><p class="eyebrow">404</p><h1 class="h1">Page not found</h1><p>The page you were looking for isn\'t here.</p><a href="#/collections/all" class="button">Continue shopping</a></div>';

  // --- Bag (cart) ------------------------------------------------------------------
  let cart = [];
  const FREE_SHIPPING = 75;
  const subtotal = () => cart.reduce((sum, line) => sum + byHandle[line.handle].price * line.qty, 0);
  const count = () => cart.reduce((sum, line) => sum + line.qty, 0);

  function freeShipping() {
    const remaining = FREE_SHIPPING - subtotal();
    const percent = Math.min(100, Math.round((subtotal() / FREE_SHIPPING) * 100));
    return `<div class="free-shipping"><p class="free-shipping__text">${remaining > 0 ? `You're <strong>${money(remaining)}</strong> away from free shipping.` : 'Your order ships free.'}</p>
      <div class="free-shipping__bar" role="presentation"><span class="free-shipping__fill" style="width: ${percent}%;"></span></div></div>`;
  }
  const totals = () => `<div class="cart-totals"><p class="cart-totals__row cart-totals__row--subtotal"><span>Subtotal</span><span>${money(subtotal())} USD</span></p>
    <p class="cart-totals__note">Taxes and shipping calculated at checkout.</p></div>`;

  function cartLine(line, i) {
    const p = byHandle[line.handle];
    return `<li class="cart-item">
      <a href="#/products/${p.handle}" class="cart-item__media is-blend" tabindex="-1" aria-hidden="true"><img class="cart-item__img" src="${p.images[0]}" alt=""></a>
      <div class="cart-item__details"><p class="eyebrow cart-item__vendor">${esc(p.brand)}</p>
        <a href="#/products/${p.handle}" class="cart-item__title">${esc(p.title)}</a><p class="cart-item__variant">${esc(p.size)}</p>
        <div class="cart-item__qty"><div class="qty qty--small">
          <button type="button" class="qty__btn" data-line="${i}" data-line-qty="${line.qty - 1}" aria-label="Decrease quantity">${icon('minus')}</button>
          <input class="qty__input" type="number" value="${line.qty}" min="0" data-line-input="${i}" aria-label="Quantity">
          <button type="button" class="qty__btn" data-line="${i}" data-line-qty="${line.qty + 1}" aria-label="Increase quantity">${icon('plus')}</button></div>
          <button type="button" class="link cart-item__remove" data-line="${i}" data-line-qty="0">Remove</button></div></div>
      <div class="cart-item__price"><span>${money(p.price * line.qty)}</span></div></li>`;
  }

  function renderCart() {
    qs('[data-cart-drawer-inner]').innerHTML = `
      <div class="drawer__header"><h2 class="h3 drawer__title">Your bag${count() ? ` <span class="drawer__count">(${count()})</span>` : ''}</h2>
        <button type="button" class="drawer__close" data-drawer-close aria-label="Close">${icon('close')}</button></div>
      ${cart.length ? `${freeShipping()}<div class="drawer__body"><ul class="cart-items" role="list">${cart.map(cartLine).join('')}</ul></div>
        <div class="drawer__footer"><details class="cart-note"><summary>Add a gift note</summary><textarea class="field__input" aria-label="Gift note"></textarea></details>
        ${totals()}<button type="button" class="button button--full" data-checkout>Checkout</button><a href="#/cart" class="link cart-drawer__view">View bag</a></div>`
      : '<div class="drawer__body cart-empty"><img src="/theme/veltexra-icon.png" alt="" width="220" height="220" class="cart-empty__icon"><p class="h3">Your bag is empty.</p><a href="#/collections/all" class="button">Continue shopping</a></div>'}`;
    qsa('[data-cart-bubble]').forEach((b) => { b.textContent = count(); b.hidden = count() === 0; });
    if (location.hash.startsWith('#/cart')) app.innerHTML = cartPage();
  }

  function addToCart(handle, qty) {
    const line = cart.find((l) => l.handle === handle);
    if (line) line.qty += qty; else cart.push({ handle, qty });
    renderCart();
    openDrawer(qs('#CartDrawer'));
  }
  function setLine(i, qty) {
    if (qty <= 0) cart.splice(i, 1); else cart[i].qty = qty;
    renderCart();
  }

  // --- Drawers (same behaviour as the theme's theme.js) ---------------------------
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  document.body.appendChild(overlay);
  let openPanel = null;
  function openDrawer(panel) {
    if (!panel) return;
    if (openPanel && openPanel !== panel) closeDrawer(true);
    openPanel = panel;
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    overlay.classList.add('is-visible');
    document.documentElement.classList.add('no-scroll');
    const target = qs('[data-autofocus]', panel);
    if (target) setTimeout(() => target.focus({ preventScroll: true }), 60);
  }
  function closeDrawer(keepOverlay) {
    if (!openPanel) return;
    openPanel.classList.remove('is-open');
    openPanel.setAttribute('aria-hidden', 'true');
    openPanel = null;
    if (keepOverlay === true) return;
    overlay.classList.remove('is-visible');
    document.documentElement.classList.remove('no-scroll');
  }
  overlay.addEventListener('click', () => closeDrawer());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  // --- Predictive search -----------------------------------------------------------
  const predictive = qs('[data-predictive-results]');
  qs('[data-predictive-input]').addEventListener('input', (e) => {
    const term = e.target.value;
    if (term.trim().length < 2) { predictive.innerHTML = ''; return; }
    const results = searchMatches(term).slice(0, 6);
    const brandHits = brands.filter(([, name]) => name.toLowerCase().includes(term.trim().toLowerCase())).slice(0, 4);
    predictive.innerHTML = results.length || brandHits.length ? `<div class="predictive__grid${brandHits.length ? '' : ' predictive__grid--single'}">
      ${brandHits.length ? `<div class="predictive__aside"><div class="predictive__group"><p class="eyebrow">Collections</p><ul class="predictive__list" role="list">
        ${brandHits.map(([h, name]) => `<li><a href="#/collections/brand-${h}">${esc(name)}</a></li>`).join('')}</ul></div></div>` : ''}
      <div class="predictive__products"><p class="eyebrow">Fragrances</p><ul class="predictive__product-list" role="list">${results.map((p) => `<li>
        <a href="#/products/${p.handle}" class="predictive__product"><span class="predictive__thumb is-blend"><img src="${p.images[0]}" alt=""></span>
        <span class="predictive__meta"><span class="eyebrow">${esc(p.brand)}</span><span class="predictive__title">${esc(p.title)}</span>
        <div class="price"><span class="price__current">${money(p.price)}</span></div></span></a></li>`).join('')}</ul></div></div>
      <a class="link predictive__all" href="#/search?q=${encodeURIComponent(term)}">View all results</a>`
      : `<p>Nothing found for “${esc(term)}”. Try a brand or a note, like vanilla.</p>`;
  });

  // --- Events ------------------------------------------------------------------------
  document.addEventListener('click', (e) => {
    const t = e.target;
    const opener = t.closest('[data-drawer-open]');
    if (opener) {
      if (opener.dataset.drawerOpen === 'CartDrawer') renderCart();
      e.preventDefault();
      openDrawer(document.getElementById(opener.dataset.drawerOpen));
      return;
    }
    if (t.closest('[data-drawer-close]')) { e.preventDefault(); closeDrawer(); return; }

    const add = t.closest('[data-add]');
    if (add) {
      const qtyInput = add.hasAttribute('data-main-add') ? qs('#Quantity') : null;
      addToCart(add.dataset.add, Math.max(1, parseInt(qtyInput ? qtyInput.value : '1', 10) || 1));
      return;
    }
    const lineControl = t.closest('[data-line-qty]');
    if (lineControl) { setLine(Number(lineControl.dataset.line), Number(lineControl.dataset.lineQty)); return; }

    const step = t.closest('[data-qty-step]');
    if (step) {
      const input = qs('input', step.closest('.qty'));
      input.value = Math.max(1, (parseInt(input.value, 10) || 1) + Number(step.dataset.qtyStep));
      return;
    }
    const thumb = t.closest('[data-thumb]');
    if (thumb) {
      const viewport = qs('[data-gallery-viewport]');
      const slide = qs(`[data-media-id="${thumb.dataset.thumb}"]`, viewport);
      viewport.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
      qsa('[data-thumb]').forEach((b) => b.classList.toggle('is-active', b === thumb));
      return;
    }
    if (t.closest('[data-clear-filters]')) {
      FILTER_GROUPS.forEach(([key]) => filterState[key].clear());
      closeDrawer();
      render();
      return;
    }
    const pill = t.closest('[data-remove-filter]');
    if (pill) { filterState[pill.dataset.removeFilter].delete(pill.dataset.value); render(); return; }

    if (t.closest('[data-show-recover]')) { e.preventDefault(); qs('#recover').style.display = 'block'; qs('#login').style.display = 'none'; return; }
    if (t.closest('[data-hide-recover]')) { e.preventDefault(); qs('#recover').style.display = ''; qs('#login').style.display = ''; return; }
    if (t.closest('[data-checkout]')) { window.alert('In your real store, this button opens Shopify checkout.'); return; }
    if (t.closest('[data-demo-message]')) { window.alert('In your real store, this continues to checkout as a guest.'); }
  });

  document.addEventListener('change', (e) => {
    if (e.target.matches('[data-sort]')) { filterState.sort = e.target.value; render(); return; }
    if (e.target.matches('[data-line-input]')) setLine(Number(e.target.dataset.lineInput), parseInt(e.target.value, 10) || 0);
  });

  document.addEventListener('submit', (e) => {
    const form = e.target;
    e.preventDefault();
    if (form.matches('[data-facets-form]')) {
      FILTER_GROUPS.forEach(([key]) => { filterState[key] = new Set(qsa(`input[name="${key}"]:checked`, form).map((i) => i.value)); });
      closeDrawer();
      render();
    } else if (form.matches('[data-search-form]')) {
      closeDrawer();
      location.hash = `#/search?q=${encodeURIComponent(qs('input', form).value)}`;
    } else if (form.matches('[data-search-page]')) {
      location.hash = `#/search?q=${encodeURIComponent(qs('input', form).value)}`;
    } else if (form.matches('[data-newsletter]')) {
      form.outerHTML = '<p class="form-message form-message--success">Thank you. You\'re on the list.</p>';
    } else if (form.matches('[data-demo-form]')) {
      form.insertAdjacentHTML('afterbegin', '<p class="form-message form-message--success">Preview only: in your real store this form is handled by Shopify.</p>');
    }
  });

  // --- Gentle fade-in, same as the theme's theme.js ----------------------------------
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealer = 'IntersectionObserver' in window && !reduceMotion
    ? new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealer.unobserve(entry.target);
    }), { rootMargin: '0px 0px -8% 0px' })
    : null;
  function reveal() {
    if (!revealer) return;
    qsa('.section-heading, .grid > li, .image-text, .rich-text, .brands, .newsletter, .collection-hero', app).forEach((el) => {
      const siblings = Array.from(el.parentElement.children);
      el.style.transitionDelay = `${(siblings.indexOf(el) % 4) * 70}ms`;
      el.classList.add('reveal');
      revealer.observe(el);
    });
  }

  // --- Router ------------------------------------------------------------------------
  function render() {
    const [pathPart, query = ''] = (location.hash.slice(1) || '/').split('?');
    const parts = pathPart.split('/').filter(Boolean);
    const pages = {
      collections: () => collectionPage(parts[1] || 'all'),
      products: () => productPage(parts[1]),
      search: () => searchPage(new URLSearchParams(query).get('q') || ''),
      cart: cartPage,
      account: accountPage,
      contact: contactPage,
    };
    app.innerHTML = parts.length ? (pages[parts[0]] || notFoundPage)() : homePage();
    reveal();

    // Sticky "Add to bag" bar on product pages
    const sticky = qs('[data-sticky-atc]');
    const mainAdd = qs('[data-main-add]');
    if (sticky && mainAdd) {
      new IntersectionObserver(([entry]) => {
        const show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        sticky.classList.toggle('is-visible', show);
      }).observe(mainAdd);
    }
  }

  let lastPath = null;
  window.addEventListener('hashchange', () => {
    closeDrawer();
    const path = location.hash.split('?')[0];
    render();
    if (path !== lastPath) window.scrollTo(0, 0);
    lastPath = path;
  });

  const header = qs('[data-header]');
  const setHeaderHeight = () => document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
  window.addEventListener('resize', setHeaderHeight);
  window.addEventListener('scroll', () => header.classList.toggle('is-scrolled', window.scrollY > 8), { passive: true });
  setHeaderHeight();
  renderCart();
  render();
})();
