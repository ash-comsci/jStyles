/* =============================================
   TOURNAMENT GEAR — script.js
   Tab switching logic
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {

  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels  = document.querySelectorAll('.tab-panel');

  function activateTab(targetId) {
    // Deactivate all buttons and panels
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabPanels.forEach(panel => {
      panel.classList.remove('active');
      panel.style.display = 'none';
    });

    // Activate the clicked button
    const activeBtn = document.querySelector(`.tab-btn[data-tab="${targetId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Activate the matching panel
    const activePanel = document.getElementById(targetId);
    if (activePanel) {
      activePanel.style.display = 'block';
      // Trigger reflow so the animation restarts
      void activePanel.offsetWidth;
      activePanel.classList.add('active');
    }

    // Update URL hash without jumping
    history.replaceState(null, '', `#${targetId}`);
  }

  // Attach click listeners
  tabButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const targetId = this.getAttribute('data-tab');
      activateTab(targetId);
    });
  });

  // On load: check for a hash in the URL, otherwise default to first tab
  const initialHash = window.location.hash.replace('#', '');
  const validIds = Array.from(tabPanels).map(p => p.id);

  if (initialHash && validIds.includes(initialHash)) {
    activateTab(initialHash);
  } else {
    // Default: show the first tab
    const firstId = tabButtons[0]?.getAttribute('data-tab');
    if (firstId) activateTab(firstId);
  }

});
