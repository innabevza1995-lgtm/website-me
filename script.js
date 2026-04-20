const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Настройки (можно поменять под себя)
const SITE_CONFIG = {
  telegramUsername: '', // например: "bevzainessa" (без @). Тогда откроется чат с готовым текстом.
  emailTo: '', // например: "hello@example.com". Тогда откроется письмо на этот адрес.
};

function initYear() {
  const el = $('[data-year]');
  if (el) el.textContent = String(new Date().getFullYear());
}

function initMobileNav() {
  const btn = $('[data-nav-toggle]');
  const menu = $('[data-nav-menu]');
  if (!btn || !menu) return;

  const close = () => {
    menu.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  };

  const open = () => {
    menu.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
  };

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    expanded ? close() : open();
  });

  // Закрываем меню при клике по ссылкам
  $$('.nav__link, .nav__menu .button', menu).forEach((a) => a.addEventListener('click', close));

  // Закрываем по клику вне меню
  document.addEventListener('click', (e) => {
    if (!menu.classList.contains('is-open')) return;
    const target = e.target;
    if (!(target instanceof Node)) return;
    if (menu.contains(target) || btn.contains(target)) return;
    close();
  });

  // Закрываем по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

function initContactForm() {
  const form = $('[data-contact-form]');
  const out = $('[data-form-out]');
  if (!form || !out) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const contact = String(data.get('contact') || '').trim();
    const message = String(data.get('message') || '').trim();

    const text =
      `Заявка с лендинга\n` +
      `Имя: ${name}\n` +
      `Контакт: ${contact}\n` +
      `Задача: ${message}\n`;

    const tgText = encodeURIComponent(text);
    const mailSubject = encodeURIComponent('Заявка с сайта: консультация по AI');
    const mailBody = encodeURIComponent(text);
    const mailTo = SITE_CONFIG.emailTo ? encodeURIComponent(SITE_CONFIG.emailTo) : '';

    out.hidden = false;
    out.innerHTML = `
      <div style="font-weight:800; margin-bottom:8px">Готово.</div>
      <div style="color:rgba(255,255,255,.72); margin-bottom:10px">
        Выберите, как отправить сообщение — или просто скопируйте текст.
      </div>
      <div class="out-actions" style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:10px">
        ${
          SITE_CONFIG.telegramUsername
            ? `<a class="button button--primary" target="_blank" rel="noopener noreferrer"
                 href="https://t.me/${SITE_CONFIG.telegramUsername}?text=${tgText}">
                 Открыть Telegram
               </a>`
            : `<span class="chip chip--muted">Telegram: username не задан</span>`
        }
        <a class="button button--soft" href="mailto:${mailTo}?subject=${mailSubject}&body=${mailBody}">
          Открыть Email
        </a>
        <button class="button button--soft" type="button" data-copy-target="#contactText">
          Скопировать текст
        </button>
      </div>
      <pre id="contactText" style="margin:0; white-space:pre-wrap">${text}</pre>
    `;

    // активируем копирование для новой кнопки
    initCopyButtons();
  });
}

function initFaqSingleOpen() {
  const root = $('[data-faq]');
  if (!root) return;
  const items = $$('details', root);
  items.forEach((d) => {
    d.addEventListener('toggle', () => {
      if (!d.open) return;
      items.forEach((other) => {
        if (other !== d) other.open = false;
      });
    });
  });
}

function initCopyButtons() {
  const btns = $$('[data-copy-target]');
  if (btns.length === 0) return;

  btns.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const selector = btn.getAttribute('data-copy-target');
      if (!selector) return;
      const target = $(selector);
      if (!target) return;

      const text = target.textContent || '';
      const original = btn.textContent;

      try {
        await navigator.clipboard.writeText(text.trim());
        btn.textContent = 'Скопировано';
      } catch {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text.trim();
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btn.textContent = 'Скопировано';
      }

      window.setTimeout(() => {
        btn.textContent = original;
      }, 1400);
    });
  });
}

function initTocSpy() {
  const toc = $('[data-toc]');
  if (!toc) return;
  const links = $$('a[href^="#"]', toc);
  if (links.length === 0) return;

  const ids = links
    .map((a) => a.getAttribute('href'))
    .filter(Boolean)
    .map((h) => h.slice(1));

  const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
  if (sections.length === 0) return;

  const setActive = (id) => {
    links.forEach((a) => {
      const isActive = a.getAttribute('href') === `#${id}`;
      a.classList.toggle('is-active', isActive);
      if (isActive) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
      if (!visible) return;
      const id = visible.target.id;
      if (id) setActive(id);
    },
    { root: null, threshold: [0.25, 0.5, 0.75], rootMargin: '-10% 0px -60% 0px' },
  );

  sections.forEach((s) => io.observe(s));
  setActive(sections[0].id);
}

function initScrollMotion() {
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const selectors = [
    '.section__head',
    '.panel',
    '.service',
    '.price',
    '.benefit',
    '.review',
    '.gift',
    '.cta-strip',
    '.cta-big',
    '.center',
    '.photo',
    '.gsec',
    '.toc',
  ];

  const elements = selectors.flatMap((s) => $$(s));
  if (elements.length === 0) return;

  elements.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.setProperty('--delay', `${(i % 8) * 60}ms`);
  });

  if (reduceMotion) {
    elements.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -10% 0px' },
  );

  elements.forEach((el) => io.observe(el));
}

initYear();
initMobileNav();
initContactForm();
initFaqSingleOpen();
initCopyButtons();
initTocSpy();
initScrollMotion();
