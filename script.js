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
