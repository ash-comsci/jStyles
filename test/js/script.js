/* ============================================================
   script.js  —  jStyles shared JavaScript
   ============================================================ */

/* ── Navbar: add .scrolled class when user scrolls ── */
(function () {
  const nav = document.querySelector(".navbar");
  if (!nav) return;

  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll(); // run once on load in case page is already scrolled
})();

/* ── Card entrance: fade cards in as they scroll into view ── */
(function () {
  const cards = document.querySelectorAll(".card");
  if (!cards.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        observer.unobserve(entry.target); // animate once
      }
    });
  }, { threshold: 0.12 });

  cards.forEach(card => observer.observe(card));
})();

/* ── Mark the active nav link based on current page ── */
(function () {
  const links = document.querySelectorAll(".nav-menu a");
  const path  = window.location.pathname.split("/").pop();
  links.forEach(link => {
    if (link.getAttribute("href") === path ||
        link.getAttribute("href") === "./" + path) {
      link.classList.add("active");
    }
  });
})();

console.log("jStyles loaded.");
