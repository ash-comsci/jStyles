'use strict';

const CONTACT_EMAIL = 'jstyles.pro@gmail.com';

async function loadNav() {
  const navbarContainer = document.getElementById('navbar');
  if (!navbarContainer) return;

  const possibleNavPaths = ['/nav.html', '../nav.html', './nav.html'];

  for (const path of possibleNavPaths) {
    try {
      const response = await fetch(path, { cache: 'no-cache' });
      if (!response.ok) continue;
      navbarContainer.innerHTML = await response.text();
      setupNav(navbarContainer);
      return;
    } catch (error) {
      // Try the next path before using the fallback navigation.
    }
  }

  navbarContainer.innerHTML = fallbackNavMarkup();
  setupNav(navbarContainer);
}

function fallbackNavMarkup() {
  return `
    <header class="navbar">
      <div class="nav-container">
        <a class="nav-logo" href="/index.html">
          <img src="/images/jstyles_logo.png" alt="jStyles Logo" onerror="this.style.display='none'" />
          <strong>J<span>STYLES</span></strong>
        </a>
        <button class="nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false"><span></span></button>
        <nav aria-label="Main navigation">
          <ul class="nav-menu">
            <li><a href="/index.html">Home</a></li>
            <li><a href="/WOS/index.html">Fan Gear</a></li>
            <li><a href="/tournament/index.html">Tournament MERCH</a></li>
            <li><a href="/custom/index.html">Custom MERCH</a></li>
            <li><a href="mailto:${CONTACT_EMAIL}">Contact</a></li>
          </ul>
        </nav>
      </div>
    </header>
  `;
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

    const linkPath = new URL(href, window.location.origin).pathname.replace(/\/$/, '/index.html');
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

  if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
}

function updateScrolledNav() {
  const nav = document.querySelector('.navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
}

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const menu = document.querySelector('.nav-menu');
  const toggle = document.querySelector('.nav-toggle');
  if (!menu || !toggle) return;
  menu.classList.remove('open');
  toggle.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
});

document.addEventListener('DOMContentLoaded', loadNav);
window.addEventListener('scroll', updateScrolledNav, { passive: true });
