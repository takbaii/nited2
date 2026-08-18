/* Open Google Sheets button for Admin Control Center */
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

  const observer = new MutationObserver(addSheetsButton);
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('DOMContentLoaded', addSheetsButton);
  setTimeout(addSheetsButton, 500);
  setTimeout(addSheetsButton, 1500);
  setTimeout(addSheetsButton, 3000);
})();
