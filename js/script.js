// ✅ LOAD SHARED NAVBAR + ALL FEATURES
async function loadNav() {
  const navbarContainer = document.getElementById('navbar');

  // ✅ Only run if page actually has a navbar
  if (!navbarContainer) return;

  const res = await fetch('../../nav.html');
  const data = await res.text();
  navbarContainer.innerHTML = data;

  // ✅ ACTIVE PAGE HIGHLIGHT
  const links = document.querySelectorAll('.nav-menu a');
  let currentPage = window.location.pathname.split('/').pop();

  if (currentPage === "") currentPage = "index.html";

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.includes(currentPage)) {
      link.classList.add('active');
    }
  });

  // ✅ MOBILE MENU TOGGLE
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".nav-menu");

  if (toggle) {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("open");
      toggle.classList.toggle("open");
    });
  }
}

// ✅ RUN NAV LOADER AFTER PAGE LOADS
document.addEventListener("DOMContentLoaded", loadNav);



// ✅ EXISTING SCROLL EFFECT (SAFE VERSION)
window.addEventListener("scroll", () => {
  const nav = document.querySelector(".navbar");
  if (nav) {
    nav.classList.toggle("scrolled", window.scrollY > 40);
  }
});


// ✅ EXISTING PRODUCT CARD ANIMATION
//const cards = document.querySelectorAll('.product-card');
const cards = document.querySelectorAll('.card');
if (cards.length > 0) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        entry.target.classList.add('show');
      }
    });
  }, {
    threshold: 0.2
  });

  cards.forEach(card => {
    observer.observe(card);
  });
}

console.log("jStyles site loaded successfully.");
