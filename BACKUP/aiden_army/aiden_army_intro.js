'use strict';

/*
  Aiden's Army opening screen.
  The logo settles in over about 1.7 seconds, then holds for 5 seconds
  before the fundraiser order page opens automatically.
*/
const ORDER_PAGE = './aiden_army_order.html';
const INTRO_DURATION_MS = 1700;
const HOLD_DURATION_MS = 3000;
const REDUCED_MOTION_DELAY_MS = 900;

function openOrderPage() {
  if (document.body.classList.contains('is-leaving')) return;

  document.body.classList.add('is-leaving');
  window.setTimeout(() => {
    window.location.assign(ORDER_PAGE);
  }, 380);
}

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const totalDuration = prefersReducedMotion
    ? REDUCED_MOTION_DELAY_MS
    : INTRO_DURATION_MS + HOLD_DURATION_MS;

  // Keyboard shortcut remains available even though no visual text is shown.
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') openOrderPage();
  });

  window.setTimeout(openOrderPage, totalDuration);
});
