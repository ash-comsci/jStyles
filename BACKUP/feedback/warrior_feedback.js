'use strict';

/*
  Paste your deployed Google Apps Script Web App URL below.
  It should end in /exec, not /dev.
*/
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyLwJeRItjDlTmWshUh4O50Uz2POmMNGeZCXSklRlEgDEBS3r6XmtIl-0hqGicnDx9F/exec';
const CONTACT_EMAIL = 'jstyles.pro@gmail.com';

const RATING_QUESTIONS = [
  { name: 'productQuality', title: 'Product Quality', description: 'Material, comfort, print quality, and overall finish.' },
  { name: 'logoDesign', title: 'Logo & Design', description: 'The tournament logo, placement, size, and overall appearance.' },
  { name: 'pricing', title: 'Pricing', description: 'Value received compared with the price paid.' },
  { name: 'service', title: 'Customer Service', description: 'Communication, helpfulness, and response time.' },
  { name: 'orderingProcess', title: 'Ordering Process', description: 'Ease of selecting products, sizes, and submitting the order.' },
  { name: 'pickupShipping', title: 'Pickup or Shipping', description: 'Convenience, timing, packaging, and delivery experience.' },
  { name: 'overallExperience', title: 'Overall Experience', description: 'Your complete experience ordering through jStyles.' }
];

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent'
};

function renderRatingQuestions() {
  const container = document.getElementById('ratingQuestions');
  if (!container) return;

  container.innerHTML = RATING_QUESTIONS.map(question => `
    <fieldset class="rating-question">
      <legend>
        <strong>${question.title}</strong>
        <span>${question.description}</span>
      </legend>
      <div class="rating-options" aria-label="${question.title} rating">
        ${[1, 2, 3, 4, 5].map(value => `
          <label>
            <input type="radio" name="${question.name}" value="${value}" required />
            <span class="rating-number">${value}</span>
            <small>${RATING_LABELS[value]}</small>
          </label>
        `).join('')}
      </div>
    </fieldset>
  `).join('');
}

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
      // Try the next path.
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
            <li><a href="/tournament/index.html">Tournament Merch</a></li>
            <li><a href="/custom/index.html">Custom Merch</a></li>
            <li><a href="mailto:${CONTACT_EMAIL}">Contact</a></li>
          </ul>
        </nav>
      </div>
    </header>
  `;
}

function setupNav(navbarContainer) {
  const toggle = navbarContainer.querySelector('.nav-toggle');
  const menu = navbarContainer.querySelector('.nav-menu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }
}

function collectFormData(form) {
  const formData = new FormData(form);
  const response = {
    submittedAt: new Date().toISOString(),
    tournament: 'Warrior Classic',
    name: formData.get('name')?.trim() || 'Anonymous',
    email: formData.get('email')?.trim() || '',
    team: formData.get('team')?.trim() || '',
    location: formData.get('location')?.trim() || '',
    bestPart: formData.get('bestPart')?.trim() || '',
    improvements: formData.get('improvements')?.trim() || '',
    orderAgain: formData.get('orderAgain') || '',
    recommend: formData.get('recommend') || '',
    pageUrl: window.location.href,
    userAgent: navigator.userAgent
  };

  RATING_QUESTIONS.forEach(question => {
    response[question.name] = Number(formData.get(question.name) || 0);
  });

  return response;
}

function validateConfiguration() {
  return GOOGLE_SCRIPT_URL &&
    GOOGLE_SCRIPT_URL.startsWith('https://script.google.com/macros/s/') &&
    GOOGLE_SCRIPT_URL.endsWith('/exec');
}

async function submitFeedback(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const submitBtn = document.getElementById('submitBtn');

  if (!form.checkValidity()) {
    form.reportValidity();
    showToast('Please complete all required questions.', true);
    return;
  }

  if (!validateConfiguration()) {
    showToast('Add your Google Apps Script Web App URL in warrior_feedback.js first.', true);
    return;
  }

  const payload = collectFormData(form);
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    form.hidden = true;
    document.getElementById('successCard').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    console.error(error);
    showToast('The survey could not be submitted. Please try again.', true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Feedback →';
  }
}

function resetSurvey() {
  const form = document.getElementById('feedbackForm');
  form.reset();
  form.hidden = false;
  document.getElementById('successCard').hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');

  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 4200);
}

document.addEventListener('DOMContentLoaded', () => {
  renderRatingQuestions();
  loadNav();
  document.getElementById('feedbackForm')?.addEventListener('submit', submitFeedback);
  document.getElementById('newResponseBtn')?.addEventListener('click', resetSurvey);
});
