(() => {
  const faNumber = value => new Intl.NumberFormat('fa-IR').format(value);
  const price = value => `${faNumber(value)} تومان`;
  const toast = document.querySelector('[data-toast]');
  let toastTimer;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
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

  function productCard(product) {
    return `
      <article class="product-card reveal">
        <a class="product-media" href="${product.href}" aria-label="مشاهده ${product.title}">
          <img src="${product.image}" alt="${product.title}" width="700" height="800" loading="lazy">
          ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
          <button class="quick-add" type="button" data-add-to-cart="${product.id}" aria-label="افزودن ${product.title} به سبد">+</button>
        </a>
        <div class="product-info">
          <span class="product-category">${product.categoryLabel}</span>
          <h3><a href="${product.href}">${product.title}</a></h3>
          <div class="product-meta">
            <span class="product-price">${price(product.price)}</span>
            <span class="product-colors" aria-hidden="true"><i></i><i></i><i></i></span>
          </div>
        </div>
      </article>`;
  }

  function renderFeatured() {
    const grid = document.querySelector('[data-featured-products]');
    if (!grid || !window.ARIHA_PRODUCTS) return;
    grid.innerHTML = window.ARIHA_PRODUCTS.slice(0, 4).map(productCard).join('');
  }

  function renderProducts() {
    const grid = document.querySelector('[data-products-grid]');
    if (!grid || !window.ARIHA_PRODUCTS) return;

    const search = document.querySelector('[data-product-search]');
    const count = document.querySelector('[data-results-count]');
    const chips = [...document.querySelectorAll('[data-filter]')];
    const params = new URLSearchParams(location.search);
    let active = params.get('category') || 'all';

    if (!chips.some(chip => chip.dataset.filter === active)) active = 'all';

    const apply = () => {
      const term = (search?.value || '').trim().toLocaleLowerCase('fa-IR');
      const items = window.ARIHA_PRODUCTS.filter(item => {
        const categoryMatch = active === 'all' || item.category === active;
        const searchMatch = !term || `${item.title} ${item.categoryLabel}`.toLocaleLowerCase('fa-IR').includes(term);
        return categoryMatch && searchMatch;
      });
      grid.innerHTML = items.length ? items.map(productCard).join('') : '<div class="empty-state">محصولی با این مشخصات پیدا نشد.</div>';
      if (count) count.textContent = `${faNumber(items.length)} محصول`;
      chips.forEach(chip => chip.classList.toggle('is-active', chip.dataset.filter === active));
      observeReveals();
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

  const menuButton = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    menu?.classList.toggle('is-open', !open);
    document.body.classList.toggle('menu-open', !open);
  });
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    menu?.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  }));

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
    showToast('ممنون! این فرم فعلاً نمایشی است و بعداً به بک‌اند متصل می‌شود.');
  }));

  document.querySelectorAll('[data-faq-button]').forEach(button => button.addEventListener('click', () => {
    const item = button.closest('.faq-item');
    const open = item.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(open));
  }));

  const mainGallery = document.querySelector('[data-gallery-main]');
  document.querySelectorAll('[data-gallery-thumb]').forEach(button => button.addEventListener('click', () => {
    if (!mainGallery) return;
    mainGallery.src = button.dataset.galleryThumb;
    mainGallery.alt = button.querySelector('img')?.alt || 'تصویر محصول';
    document.querySelectorAll('[data-gallery-thumb]').forEach(item => item.classList.remove('is-active'));
    button.classList.add('is-active');
  }));

  document.querySelectorAll('[data-option]').forEach(option => option.addEventListener('click', () => {
    const group = option.parentElement;
    group.querySelectorAll('[data-option]').forEach(item => item.classList.remove('is-selected'));
    option.classList.add('is-selected');
  }));

  function observeReveals() {
    const elements = document.querySelectorAll('.reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window)) {
      elements.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const delay = Number(entry.target.dataset.delay || 0) * 90;
      setTimeout(() => entry.target.classList.add('is-visible'), delay);
      observer.unobserve(entry.target);
    }), { threshold: .08 });
    elements.forEach(el => observer.observe(el));
  }

  document.querySelectorAll('[data-year]').forEach(el => el.textContent = faNumber(new Date().getFullYear()));
  renderFeatured();
  renderProducts();
  updateCartCount();
  observeReveals();
})();
