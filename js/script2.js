// Load the shared navbar, highlight the active page, and run small page effects.
async function loadNav() {
  const navbarContainer = document.getElementById('navbar');
  if (!navbarContainer) return;

  try {
    const res = await fetch('/nav.html');
    if (!res.ok) throw new Error('Could not load nav.html');

    const data = await res.text();
    navbarContainer.innerHTML = data;

    const nav = navbarContainer.querySelector('.navbar');
    const toggle = navbarContainer.querySelector('.nav-toggle');
    const menu = navbarContainer.querySelector('.nav-menu');
    const links = navbarContainer.querySelectorAll('.nav-menu a');

    // Better active-page matching
    let currentPath = window.location.pathname;

    if (currentPath.endsWith('/')) {
      currentPath += 'index.html';
    }

    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      const linkPath = new URL(href, window.location.origin).pathname;

      if (linkPath === currentPath) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Mobile menu
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        const isOpen = menu.classList.toggle('open');
        toggle.classList.toggle('open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
      });
    }

    // Scroll effect
    window.addEventListener('scroll', () => {
      if (nav) {
        nav.classList.toggle('scrolled', window.scrollY > 40);
      }
    });

  } catch (err) {
    console.error('Navbar failed to load:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadNav);



    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.nav-menu');

    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        const isOpen = menu.classList.toggle('open');
        toggle.classList.toggle('open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
      });
    }
  } catch (error) {
    console.warn(error);
  }
}

function setScrolledNav() {
  const nav = document.querySelector('.navbar');
  if (nav) {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }
}

function revealCards() {
  const cards = document.querySelectorAll('.card, .quick-card');
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
  }, { threshold: 0.15 });

  cards.forEach(card => observer.observe(card));
}

document.addEventListener('DOMContentLoaded', () => {
  loadNav();
  revealCards();
  setScrolledNav();
});

window.addEventListener('scroll', setScrolledNav, { passive: true });

console.log('jStyles site loaded successfully.');
