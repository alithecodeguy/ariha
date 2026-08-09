(() => {
  const faNumber = value => new Intl.NumberFormat('fa-IR').format(value);
  const price = value => `${faNumber(value)} تومان`;
  const isNestedProduct = location.pathname.includes('/products/');
  const rootPrefix = isNestedProduct ? '../' : '';
  const toast = document.querySelector('[data-toast]');
  let toastTimer;

  function installPersianFont() {
    if (!document.querySelector('link[data-ariha-font]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap';
      link.dataset.arihaFont = '';
      document.head.appendChild(link);
    }
    const style = document.createElement('style');
    style.textContent = 'html,body,button,input,textarea,select{font-family:"Noto Sans Arabic",Tahoma,Arial,sans-serif!important}';
    document.head.appendChild(style);
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }

  function getCart() {
    try { return JSON.parse(localStorage.getItem('ariha-cart') || '[]'); }
    catch { return []; }
  }

  function updateCartCount() {
    const count = getCart().length;
    document.querySelectorAll('[data-cart-count]').forEach(el => el.textContent = faNumber(count));
  }

  function addToCart(id) {
    const cart = getCart();
    cart.push(id);
    localStorage.setItem('ariha-cart', JSON.stringify(cart));
    updateCartCount();
    showToast('محصول به سبد نمونه اضافه شد.');
  }

  function ensureMarketplaceSearch() {
    const headerInner = document.querySelector('.site-header .header-inner');
    if (!headerInner || headerInner.querySelector('[data-global-search]')) return;
    const form = document.createElement('form');
    form.className = 'market-search';
    form.dataset.globalSearch = '';
    form.setAttribute('role', 'search');
    form.innerHTML = `<label class="sr-only" for="global-search-auto">جستجو در آریها</label><input id="global-search-auto" type="search" placeholder="دنبال چه لوازم‌التحریری هستید؟"><button type="submit" aria-label="جستجو">⌕</button>`;
    headerInner.querySelector('.brand')?.after(form);
  }

  function bindSearchForms() {
    document.querySelectorAll('[data-global-search], [data-hero-search]').forEach(form => {
      form.addEventListener('submit', event => {
        event.preventDefault();
        const input = form.querySelector('input[type="search"], input[name="q"], input');
        const term = input?.value.trim() || '';
        const url = new URL(`${rootPrefix}products.html`, location.href);
        if (term) url.searchParams.set('q', term);
        location.href = url.href;
      });
    });
  }

  function productCard(product) {
    return `
      <article class="product-card">
        <a class="product-media" href="${product.href}" aria-label="مشاهده ${product.title}">
          <img src="${product.image}" alt="${product.title}" width="700" height="700" loading="lazy">
          ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
          <button class="quick-add" type="button" data-add-to-cart="${product.id}" aria-label="افزودن ${product.title} به سبد">+</button>
        </a>
        <div class="product-info">
          <span class="product-category">${product.categoryLabel}</span>
          <h3><a href="${product.href}">${product.title}</a></h3>
          <span class="product-price">${price(product.price)}</span>
          <span class="product-min">حداقل سفارش: ${product.minOrder || '۱ عدد'}</span>
          <div class="product-supplier"><span class="verified-dot">✓</span><span>${product.supplier || 'فروشنده منتخب آریها'}</span></div>
          <div class="product-rating">★ ${product.rating || '۴.۸'} · ${product.sold || '۱۲۰+'} سفارش</div>
        </div>
      </article>`;
  }

  function renderFeatured() {
    const grid = document.querySelector('[data-featured-products]');
    if (!grid || !window.ARIHA_PRODUCTS) return;
    grid.innerHTML = window.ARIHA_PRODUCTS.slice(0, 10).map(productCard).join('');
  }

  function renderProducts() {
    const grid = document.querySelector('[data-products-grid]');
    if (!grid || !window.ARIHA_PRODUCTS) return;
    const search = document.querySelector('[data-product-search]');
    const count = document.querySelector('[data-results-count]');
    const chips = [...document.querySelectorAll('[data-filter]')];
    const params = new URLSearchParams(location.search);
    let active = params.get('category') || 'all';
    const initialQuery = params.get('q') || '';
    if (search && initialQuery) search.value = initialQuery;
    if (!chips.some(chip => chip.dataset.filter === active)) active = 'all';

    const apply = () => {
      const term = (search?.value || '').trim().toLocaleLowerCase('fa-IR');
      const items = window.ARIHA_PRODUCTS.filter(item => {
        const categoryMatch = active === 'all' || item.category === active;
        const haystack = `${item.title} ${item.categoryLabel} ${item.supplier || ''}`.toLocaleLowerCase('fa-IR');
        return categoryMatch && (!term || haystack.includes(term));
      });
      grid.innerHTML = items.length ? items.map(productCard).join('') : '<div class="empty-state">محصولی با این مشخصات پیدا نشد.</div>';
      if (count) count.textContent = `${faNumber(items.length)} محصول پیدا شد`;
      chips.forEach(chip => chip.classList.toggle('is-active', chip.dataset.filter === active));
    };

    chips.forEach(chip => chip.addEventListener('click', () => {
      active = chip.dataset.filter;
      const url = new URL(location.href);
      if (active === 'all') url.searchParams.delete('category'); else url.searchParams.set('category', active);
      history.replaceState({}, '', url);
      apply();
    }));
    search?.addEventListener('input', apply);
    apply();
  }

  function renderDynamicProduct() {
    const mount = document.querySelector('[data-dynamic-product]');
    if (!mount || !window.ARIHA_PRODUCTS) return;
    const id = new URLSearchParams(location.search).get('id');
    const product = window.ARIHA_PRODUCTS.find(item => item.id === id);
    if (!product) {
      mount.innerHTML = `<div class="container empty-state"><h1>محصول پیدا نشد</h1><p>لینک محصول معتبر نیست یا محصول حذف شده است.</p><a class="button button-primary" href="products.html">بازگشت به محصولات</a></div>`;
      document.title = 'محصول پیدا نشد | آریها';
      return;
    }

    const categoryCopy = {
      notebook: 'مناسب یادداشت، مطالعه و برنامه‌ریزی روزمره با کیفیت ساخت قابل قبول.',
      writing: 'نوشت‌افزاری کاربردی برای استفاده روزانه، مدرسه، دانشگاه و محیط کار.',
      art: 'ابزار طراحی و رنگ برای تمرین، کلاس هنر و پروژه‌های خلاقانه.',
      accessory: 'اکسسوری کاربردی برای مرتب‌تر شدن میز، کیف و فضای کار.'
    };
    const fallback = {
      notebook: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1100&q=82',
      writing: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1100&q=82',
      art: 'https://images.unsplash.com/photo-1615285427806-5cea6af60c0a?auto=format&fit=crop&w=1100&q=82',
      accessory: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=1100&q=82'
    };
    const alt = 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1100&q=82';
    const images = [product.image, fallback[product.category], alt];

    document.title = `${product.title} | آریها`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = `${product.title} از ${product.supplier}؛ قیمت و مشخصات فعلی نمونه هستند.`;

    mount.innerHTML = `
      <section class="product-detail"><div class="container">
        <nav class="breadcrumbs"><a href="index.html">خانه</a><span>/</span><a href="products.html">محصولات</a><span>/</span><span>${product.title}</span></nav>
        <div class="detail-grid">
          <div class="gallery">
            <div class="gallery-thumbs">
              ${images.map((img,i)=>`<button class="thumb ${i===0?'is-active':''}" type="button" data-gallery-thumb="${img}"><img src="${img}" alt="${product.title} - تصویر ${faNumber(i+1)}"></button>`).join('')}
            </div>
            <div class="gallery-main"><img data-gallery-main src="${images[0]}" alt="${product.title}"></div>
          </div>
          <div class="detail-copy">
            <span class="product-label">${product.categoryLabel}${product.badge ? ` · ${product.badge}` : ''}</span>
            <h1>${product.title}</h1>
            <p class="lead">${categoryCopy[product.category]}</p>
            <div class="detail-price">${price(product.price)}</div>
            <div class="detail-note"><strong>حداقل سفارش:</strong><span>${product.minOrder}</span></div>
            <div class="detail-note"><strong>فروشنده:</strong><span>${product.supplier}</span></div>
            <div class="detail-note"><strong>امتیاز:</strong><span>★ ${product.rating} · ${product.sold} سفارش</span></div>
            <div class="detail-actions"><button class="button button-primary" type="button" data-add-to-cart="${product.id}">افزودن به سبد نمونه</button><a class="button button-secondary" href="contact.html">درخواست قیمت عمده</a></div>
            <div class="product-description"><h2>درباره محصول</h2><p>این محصول و مشخصات آن در حال حاضر داده نمونه هستند. بعداً قیمت، موجودی، برند، تصاویر و مشخصات دقیق با اطلاعات واقعی جایگزین می‌شوند.</p></div>
          </div>
        </div>
      </div></section>`;
    bindGallery();
  }

  function bindGallery() {
    const mainGallery = document.querySelector('[data-gallery-main]');
    document.querySelectorAll('[data-gallery-thumb]').forEach(button => button.addEventListener('click', () => {
      if (!mainGallery) return;
      mainGallery.src = button.dataset.galleryThumb;
      mainGallery.alt = button.querySelector('img')?.alt || 'تصویر محصول';
      document.querySelectorAll('[data-gallery-thumb]').forEach(item => item.classList.remove('is-active'));
      button.classList.add('is-active');
    }));
  }

  installPersianFont();
  ensureMarketplaceSearch();
  bindSearchForms();

  const menuButton = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    menu?.classList.toggle('is-open', !open);
    document.body.classList.toggle('menu-open', !open);
  });

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-add-to-cart]');
    if (!trigger) return;
    event.preventDefault();
    event.stopPropagation();
    addToCart(trigger.dataset.addToCart);
  });

  document.querySelectorAll('[data-demo-form]').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    form.reset();
    showToast('این بخش فعلاً نمایشی است و بعداً به بک‌اند متصل می‌شود.');
  }));

  document.querySelectorAll('[data-faq-button]').forEach(button => button.addEventListener('click', () => {
    const item = button.closest('.faq-item');
    const open = item.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(open));
  }));

  document.querySelectorAll('[data-option]').forEach(option => option.addEventListener('click', () => {
    option.parentElement.querySelectorAll('[data-option]').forEach(item => item.classList.remove('is-selected'));
    option.classList.add('is-selected');
  }));

  document.querySelectorAll('[data-year]').forEach(el => el.textContent = faNumber(new Date().getFullYear()));
  renderDynamicProduct();
  bindGallery();
  renderFeatured();
  renderProducts();
  updateCartCount();
})();