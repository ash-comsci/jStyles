'use strict';

const tournamentLogo = document.querySelector('.tournament-logo');
const logoPlaceholder = document.querySelector('.logo-placeholder');

function showLogoPlaceholder() {
  if (!tournamentLogo || !logoPlaceholder) return;

  tournamentLogo.classList.add('is-hidden');
  logoPlaceholder.classList.add('is-visible');
  logoPlaceholder.setAttribute('aria-hidden', 'false');
}

function hideLogoPlaceholder() {
  if (!tournamentLogo || !logoPlaceholder) return;

  tournamentLogo.classList.remove('is-hidden');
  logoPlaceholder.classList.remove('is-visible');
  logoPlaceholder.setAttribute('aria-hidden', 'true');
}

if (tournamentLogo) {
  tournamentLogo.addEventListener('load', hideLogoPlaceholder);
  tournamentLogo.addEventListener('error', showLogoPlaceholder);

  const logoPath = tournamentLogo.getAttribute('src');

  if (!logoPath || logoPath.trim() === '') {
    showLogoPlaceholder();
  }

  if (tournamentLogo.complete && tournamentLogo.naturalWidth === 0) {
    showLogoPlaceholder();
  }
}
