/* Google Sheets link + robust SPA navigation + admin file review */
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
        if (page === 'admin') setTimeout(decorateAdminFiles, 30);
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

  /* ---------------- Admin: file inspection / approval ---------------- */
  const reviewStyle = `
    .nited-review-actions{display:flex;gap:7px;align-items:center;justify-content:flex-end;flex-wrap:wrap}
    .nited-review-btn{border:0;border-radius:10px;padding:8px 11px;cursor:pointer;font:inherit;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:6px;transition:.15s;box-shadow:0 1px 2px rgba(0,0,0,.06)}
    .nited-review-btn:hover{transform:translateY(-1px)}
    .nited-review-view{background:#eef4ff;color:#175cd3}
    .nited-review-approve{background:#e9f8ef;color:#15803d}
    .nited-review-reject{background:#fff0f0;color:#dc2626}
    .nited-review-pending{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:#fff7df;color:#a16207;font-weight:700;font-size:12px}
    .nited-review-approved{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:#eaf8ef;color:#15803d;font-weight:700;font-size:12px}
    .nited-review-rejected{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:#fff0f0;color:#dc2626;font-weight:700;font-size:12px}
    .nited-review-title{display:flex;align-items:center;gap:10px;margin:0 0 12px;font-size:15px;font-weight:800}
    .nited-review-count{display:inline-flex;min-width:24px;height:24px;padding:0 7px;border-radius:999px;align-items:center;justify-content:center;background:#fff0cf;color:#a16207;font-size:12px}
  `;

  function installReviewStyle() {
    if (document.getElementById('nited-review-style')) return;
    const style = document.createElement('style');
    style.id = 'nited-review-style';
    style.textContent = reviewStyle;
    document.head.appendChild(style);
  }

  function escReview(v) {
    const d = document.createElement('div');
    d.textContent = v == null ? '' : String(v);
    return d.innerHTML;
  }

  function reviewStatus(status) {
    const s = String(status || '').trim();
    if (s === 'ผ่าน' || s === 'อนุมัติ' || s === 'อนุมัติแล้ว') return '<span class="nited-review-approved"><i class="fas fa-check-circle"></i> ผ่าน</span>';
    if (s === 'ไม่ผ่าน' || s === 'ไม่อนุมัติ' || s === 'ปฏิเสธ') return '<span class="nited-review-rejected"><i class="fas fa-times-circle"></i> ไม่ผ่าน</span>';
    return '<span class="nited-review-pending"><i class="fas fa-clock"></i> รอตรวจสอบ</span>';
  }

  function fileViewUrl(file) {
    return file && (file.fileUrl || file.driveFileUrl || file.url || file.link || '');
  }

  function fileDisplayName(file) {
    return file && (file.fileName || file.name || file.fileType || 'ไฟล์งาน');
  }

  function findFile(id) {
    if (typeof allFiles === 'undefined' || !Array.isArray(allFiles)) return null;
    return allFiles.find(function (f) { return String(f.id) === String(id); }) || null;
  }

  async function updateFileReview(id, status) {
    const file = findFile(id);
    if (!file) return showToast('ไม่พบข้อมูลไฟล์ในระบบ', 'error');
    const message = status === 'ผ่าน'
      ? 'ยืนยันอนุมัติไฟล์นี้ใช่หรือไม่?'
      : 'ยืนยันว่าไฟล์นี้ไม่ผ่านการตรวจสอบใช่หรือไม่?';
    if (!window.confirm(message)) return;

    try {
      const result = await apiPost('updateFileStatus', { id: id, status: status });
      if (!result || !result.success) throw new Error((result && (result.error || result.message)) || 'บันทึกสถานะไม่สำเร็จ');
      file.status = status;
      if (typeof setLocalData === 'function') setLocalData('files', allFiles);
      if (typeof loadMyFiles === 'function') loadMyFiles();
      if (typeof loadDashboard === 'function') loadDashboard();
      decorateAdminFiles();
      showToast(status === 'ผ่าน' ? 'อนุมัติไฟล์เรียบร้อยแล้ว' : 'บันทึกผลไม่ผ่านเรียบร้อยแล้ว', status === 'ผ่าน' ? 'success' : 'info');
    } catch (err) {
      showToast('บันทึกผลตรวจสอบไม่สำเร็จ: ' + err.message, 'error');
    }
  }

  function renderAdminFileRows() {
    const tbody = document.getElementById('adminFiles');
    if (!tbody || typeof allFiles === 'undefined' || !Array.isArray(allFiles)) return;

    const rows = allFiles.slice().reverse();
    const pendingCount = rows.filter(function (f) { return !['ผ่าน','อนุมัติ','อนุมัติแล้ว','ไม่ผ่าน','ไม่อนุมัติ','ปฏิเสธ'].includes(String(f.status || '').trim()); }).length;

    let section = document.getElementById('nited-file-review-summary');
    if (!section) {
      section = document.createElement('div');
      section.id = 'nited-file-review-summary';
      section.style.cssText = 'padding:16px 20px 0;';
      tbody.closest('.card')?.insertBefore(section, tbody.closest('.card').querySelector('.card-body'));
    }
    section.innerHTML = '<div class="nited-review-title"><i class="fas fa-shield-check"></i> ตรวจสอบไฟล์งาน <span class="nited-review-count">' + pendingCount + ' รอตรวจสอบ</span></div>';

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;">ยังไม่มีไฟล์งาน</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(function (f) {
      const id = escReview(f.id);
      const url = fileViewUrl(f);
      const safeUrl = escReview(url);
      const name = escReview(fileDisplayName(f));
      const status = String(f.status || 'รอตรวจสอบ').trim();
      const pending = !['ผ่าน','อนุมัติ','อนุมัติแล้ว','ไม่ผ่าน','ไม่อนุมัติ','ปฏิเสธ'].includes(status);
      const actions = `
        <div class="nited-review-actions">
          ${url ? `<a class="nited-review-btn nited-review-view" href="${safeUrl}" target="_blank" rel="noopener noreferrer"><i class="fas fa-eye"></i> ดูไฟล์</a>` : ''}
          ${pending ? `<button type="button" class="nited-review-btn nited-review-approve" data-review-action="approve" data-file-id="${id}"><i class="fas fa-check"></i> อนุมัติ</button><button type="button" class="nited-review-btn nited-review-reject" data-review-action="reject" data-file-id="${id}"><i class="fas fa-times"></i> ไม่อนุมัติ</button>` : ''}
        </div>`;
      return `<tr><td>${typeof formatDate==='function' ? formatDate(f.timestamp) : escReview(f.timestamp)}</td><td>${escReview(f.teacherName)}</td><td>${escReview(f.fileType)}</td><td>${url ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer"><i class="fas fa-file"></i> ${name}</a>` : name}</td><td>${reviewStatus(status)}</td><td>${actions}</td></tr>`;
    }).join('');
  }

  function decorateAdminFiles() {
    const adminPage = document.getElementById('page-admin');
    const tbody = document.getElementById('adminFiles');
    if (!adminPage || !tbody) return;
    if (typeof allFiles === 'undefined') return;
    renderAdminFileRows();
  }

  function installReviewHandlers() {
    document.addEventListener('click', function (event) {
      const btn = event.target.closest('[data-review-action]');
      if (!btn) return;
      event.preventDefault();
      const id = btn.getAttribute('data-file-id');
      const action = btn.getAttribute('data-review-action');
      updateFileReview(id, action === 'approve' ? 'ผ่าน' : 'ไม่ผ่าน');
    });

    const observer = new MutationObserver(function () {
      if (document.getElementById('page-admin')?.classList.contains('active')) {
        clearTimeout(window.__nitedReviewTimer);
        window.__nitedReviewTimer = setTimeout(decorateAdminFiles, 30);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function installAdminLoaderHook() {
    if (window.__nitedAdminReviewHook) return;
    if (typeof window.loadAdminData !== 'function') return;
    const original = window.loadAdminData;
    window.loadAdminData = async function () {
      const result = original.apply(this, arguments);
      try { if (result && typeof result.then === 'function') await result; } catch (e) { console.error('[NITED admin loader]', e); }
      setTimeout(decorateAdminFiles, 30);
      setTimeout(decorateAdminFiles, 250);
      setTimeout(decorateAdminFiles, 800);
      return result;
    };
    window.__nitedAdminReviewHook = true;
  }

  function startAdminReview() {
    installReviewStyle();
    installReviewHandlers();
    installAdminLoaderHook();
    setTimeout(installAdminLoaderHook, 100);
    setTimeout(installAdminLoaderHook, 500);
    setTimeout(decorateAdminFiles, 500);
    setTimeout(decorateAdminFiles, 1500);
  }

  const observer = new MutationObserver(addSheetsButton);
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', function () {
    addSheetsButton();
    startNavigationFix();
    loadCrossPageLinker();
    startAdminReview();
  });
  setTimeout(addSheetsButton, 500);
  setTimeout(addSheetsButton, 1500);
  setTimeout(addSheetsButton, 3000);
  startNavigationFix();
  setTimeout(loadCrossPageLinker, 100);
  setTimeout(startAdminReview, 200);
})();
