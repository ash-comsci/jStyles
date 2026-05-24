// script.js

// Simple fade-in animation for product cards

const cards = document.querySelectorAll('.product-card');

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

// Optional future interactive features can go here
console.log("j-Swag site loaded successfully.");

window.addEventListener("scroll", () => {
 const nav = document.querySelector(".navbar");
 nav.classList.toggle("scrolled", window.scrollY > 40);
});
// ✅ ADDED: highlight active nav link
function setActiveNav() {
  const links = document.querySelectorAll('.nav-menu a');
  let currentPage = window.location.pathname.split('/').pop();

  // ✅ Handles homepage (/ = index.html)
  if (currentPage === "") {
    currentPage = "index.html";
  }

  links.forEach(link => {
    const linkPage = link.getAttribute('href');

    // ✅ Only match file names (ignores ../ etc.)
    if (linkPage && currentPage && linkPage.includes(currentPage)) {
      link.classList.add('active');
    }
  });
}

// ✅ ADDED: run after page loads
window.addEventListener("DOMContentLoaded", setActiveNav);
