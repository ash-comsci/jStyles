'use strict';

// Load the shared navbar, highlight the active page, and run navbar effects.
// If /nav.html is not available, a small fallback nav is inserted so the page still works.
async function loadNav() {
  const navbarContainer = document.getElementById('navbar');
  if (!navbarContainer) return;

  try {
    const res = await fetch('/nav.html', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Could not load nav.html: ${res.status}`);

    navbarContainer.innerHTML = await res.text();
  } catch (error) {
    console.warn('Navbar failed to load. Using fallback nav:', error);
    navbarContainer.innerHTML = `
      <nav class="navbar" aria-label="Main navigation">
        <div class="nav-container">
          <a class="nav-logo" href="/"><span>J</span>Styles</a>
          <button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false"><span></span></button>
          <ul class="nav-menu">
            <li><a href="/">Home</a></li>
            <li><a href="/WOS/">Tournament Merch</a></li>
            <li><a href="/custom/index.html">Custom Merch</a></li>
            <li><a href="mailto:jstyles.pro@gmail.com">Contact</a></li>
          </ul>
        </div>
      </nav>
    `;
  }

  setupNav(navbarContainer);
}

function setupNav(navbarContainer) {
  const nav = navbarContainer.querySelector('.navbar');
  const toggle = navbarContainer.querySelector('.nav-toggle');
  const menu = navbarContainer.querySelector('.nav-menu');
  const links = navbarContainer.querySelectorAll('.nav-menu a');

  const currentPath = window.location.pathname.replace(/\/$/, '/index.html');

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return;

    const linkPath = new URL(href, window.location.origin)
      .pathname
      .replace(/\/$/, '/index.html');

    link.classList.toggle('active', linkPath === currentPath);

    link.addEventListener('click', () => {
      if (!menu || !toggle) return;
      menu.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  if (nav) {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }
}

function setScrolledNav() {
  const nav = document.querySelector('.navbar');
  if (nav) {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }
}

function revealCards() {
  const cards = document.querySelectorAll('.card, .quick-card, .hero-panel, .contact-panel');
  if (!cards.length) return;

  if (!('IntersectionObserver' in window)) {
    cards.forEach(card => card.classList.add('show'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  cards.forEach(card => observer.observe(card));
}

function addKeyboardFocus() {
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const menu = document.querySelector('.nav-menu');
      const toggle = document.querySelector('.nav-toggle');
      if (menu && toggle) {
        menu.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadNav();
  revealCards();
  addKeyboardFocus();
  setScrolledNav();
});

window.addEventListener('scroll', setScrolledNav, { passive: true });

console.log('jStyles tournament landing page loaded.');
