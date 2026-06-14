// ════════════════════════════════════════════════════
// SHARED NAVBAR LOADER
// Loads nav.html from the root folder.
// This works from /test/pages/custom_MERCH.html or /test/testing/custom_MERCH.html.
// ════════════════════════════════════════════════════
async function loadNav() {
  const navbarContainer = document.getElementById('navbar');
  if (!navbarContainer) return;

  const fallbackNav = `
    <header class="navbar">
      <div class="nav-container">
        <a class="nav-logo" href="/index.html" aria-label="jStyles home">
          <img src="/images/jstyles_logo.png" alt="jStyles logo" onerror="this.remove()" />
          <strong>J<span>STYLES</span></strong>
        </a>
        <button class="nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false"><span></span></button>
        <nav aria-label="Main navigation">
          <ul class="nav-menu">
            <li><a href="/index.html">Home</a></li>
            <li><a href="/test/pages/wos_GEAR.html">Fan Gear</a></li>
            <li><a href="/test/pages/tournament_MERCH.html">Tournament Merch</a></li>
            <li><a href="/test/pages/custom_MERCH.html">Custom Merch</a></li>
            <li><a href="/test/pages/contact.html">Contact</a></li>
          </ul>
        </nav>
      </div>
    </header>
  `;

  try {
    const res = await fetch('/nav.html');
    if (!res.ok) throw new Error('Shared nav was not found.');
    navbarContainer.innerHTML = await res.text();
  } catch (error) {
    console.warn('Navbar was not loaded from /nav.html. Using built-in fallback navbar:', error);
    navbarContainer.innerHTML = fallbackNav;
  }

  const links = document.querySelectorAll('.nav-menu a');
  let currentPage = window.location.pathname.split('/').pop();
  if (currentPage === '') currentPage = 'index.html';

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.toLowerCase().includes(currentPage.toLowerCase())) {
      link.classList.add('active');
    }
  });

  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('open');
      toggle.classList.toggle('open');
      toggle.setAttribute('aria-expanded', menu.classList.contains('open'));
    });
  }
}

window.addEventListener('scroll', () => {
  const nav = document.querySelector('.navbar');
  if (nav) {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }
});

document.addEventListener('DOMContentLoaded', loadNav);
