/* Google Sheets link + robust SPA navigation fix */
(function () {
  'use strict';

  const SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1e5530q7hRUdR6pNIx6tAv4JjNKadFibg7GE5ohuq4xU/edit';

  function addSheetsButton() {
    const pill = document.querySelector('#adminControlCenter .admin-cc-db');
    if (!pill || pill.tagName === 'A') return;
    const link = document.createElement('a');
    link.className = pill.className + ' admin-cc-sheets-link';
    link.href = SHEETS_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = 'เปิดฐานข้อมูล Google Sheets';
    link.innerHTML = '<i class="fas fa-table"></i> เปิด Google Sheets';
    link.style.cssText = 'display:inline-flex;align-items:center;gap:8px;color:inherit;text-decoration:none;cursor:pointer;transition:transform .15s ease,background .15s ease;';
    link.addEventListener('mouseenter', function () { link.style.transform = 'translateY(-1px)'; });
    link.addEventListener('mouseleave', function () { link.style.transform = ''; });
    pill.replaceWith(link);
  }

  function installNavigationFix() {
    if (window.__nitedNavigationFixInstalled) return true;
    if (typeof window.navigateTo !== 'function') return false;
    const originalNavigateTo = window.navigateTo;
    const titles = {dashboard:'แดชบอร์ด',booking:'จองวันนิเทศ',files:'ส่งงาน/ไฟล์',evaluation:'ประเมินผลการนิเทศ',admin:'ผู้ดูแลระบบ'};
    window.navigateTo = function (page) {
      let originalError = null;
      try { originalNavigateTo(page); } catch (err) { originalError = err; console.error('[NITED navigation]', err); }
      const apply = function () {
        document.querySelectorAll('#mainApp .page').forEach(function (section) {
          const active = section.id === 'page-' + page;
          section.classList.toggle('active', active);
          section.style.setProperty('display', active ? 'block' : 'none', 'important');
          section.setAttribute('aria-hidden', active ? 'false' : 'true');
        });
        document.querySelectorAll('#sidebar .nav-item').forEach(function (item) {
          const active = item.dataset.page === page;
          item.classList.toggle('active', active);
          const anchor = item.querySelector('a');
          if (anchor) anchor.setAttribute('aria-current', active ? 'page' : 'false');
        });
        const title = document.getElementById('pageTitle');
        if (title) title.textContent = titles[page] || page;
        if (page === 'booking' && typeof window.loadMyBookings === 'function') try { window.loadMyBookings(); } catch (e) { console.error(e); }
        if (page === 'files' && typeof window.loadMyFiles === 'function') try { window.loadMyFiles(); } catch (e) { console.error(e); }
        if (page === 'evaluation' && typeof window.loadEvaluationData === 'function') try { window.loadEvaluationData(); } catch (e) { console.error(e); }
        if (page === 'admin' && typeof window.loadAdminData === 'function') try { window.loadAdminData(); } catch (e) { console.error(e); }
        if (page === 'dashboard' && typeof window.loadDashboard === 'function') try { window.loadDashboard(); } catch (e) { console.error(e); }
      };
      apply();
      requestAnimationFrame(apply);
      setTimeout(apply, 50);
      setTimeout(apply, 250);
      setTimeout(apply, 800);
      if (originalError) throw originalError;
    };
    window.__nitedNavigationFixInstalled = true;
    return true;
  }

  function startNavigationFix() {
    if (installNavigationFix()) return;
    let tries = 0;
    const timer = setInterval(function () { tries += 1; if (installNavigationFix() || tries > 50) clearInterval(timer); }, 100);
  }

  function loadCrossPageLinker() {
    if (document.getElementById('nited-cross-page-data-link')) return;
    const s = document.createElement('script');
    s.id = 'nited-cross-page-data-link';
    s.src = 'js/cross-page-data-link.js?v=20260818-2';
    s.async = false;
    s.onload = function () { console.log('[NITED] cross-page data linking ready'); };
    s.onerror = function () { console.error('[NITED] cross-page data linker failed to load'); };
    document.head.appendChild(s);
  }

  function loadAdminReview() {
    if (document.getElementById('nited-admin-file-review')) return;
    const s = document.createElement('script');
    s.id = 'nited-admin-file-review';
    s.src = 'js/admin-file-review.js?v=20260818-2';
    s.async = false;
    s.onload = function () { console.log('[NITED] admin file review ready'); };
    s.onerror = function () { console.error('[NITED] admin file review failed to load'); };
    document.head.appendChild(s);
  }

  const observer = new MutationObserver(addSheetsButton);
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', function () { addSheetsButton(); startNavigationFix(); loadCrossPageLinker(); loadAdminReview(); });
  setTimeout(addSheetsButton, 500);
  setTimeout(addSheetsButton, 1500);
  setTimeout(addSheetsButton, 3000);
  startNavigationFix();
  setTimeout(loadCrossPageLinker, 100);
  setTimeout(loadAdminReview, 150);
})();
