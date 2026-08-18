/* Admin file inspection / approval module */
(function () {
  'use strict';

  if (window.__nitedAdminFileReviewReady) return;
  window.__nitedAdminFileReviewReady = true;

  const FINAL_STATUSES = ['ผ่าน','อนุมัติ','อนุมัติแล้ว','ไม่ผ่าน','ไม่อนุมัติ','ปฏิเสธ'];
  let lastSignature = '';
  let renderTimer = null;

  function style() {
    if (document.getElementById('nited-admin-review-style')) return;
    const s = document.createElement('style');
    s.id = 'nited-admin-review-style';
    s.textContent = `
      .nited-review-title{display:flex;align-items:center;gap:10px;padding:16px 20px 4px;font-weight:800;font-size:16px}
      .nited-review-count{display:inline-flex;align-items:center;justify-content:center;padding:5px 10px;border-radius:999px;background:#fff5d6;color:#9a6700;font-size:12px}
      .nited-review-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap}
      .nited-review-btn{border:0;border-radius:9px;padding:8px 11px;cursor:pointer;font:inherit;font-size:12px;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:6px}
      .nited-review-view{background:#eef4ff;color:#175cd3}
      .nited-review-approve{background:#eaf8ef;color:#15803d}
      .nited-review-reject{background:#fff0f0;color:#dc2626}
      .nited-review-pending,.nited-review-approved,.nited-review-rejected{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;font-weight:700;font-size:12px}
      .nited-review-pending{background:#fff7df;color:#a16207}
      .nited-review-approved{background:#eaf8ef;color:#15803d}
      .nited-review-rejected{background:#fff0f0;color:#dc2626}
    `;
    document.head.appendChild(s);
  }

  function esc(value) {
    const d = document.createElement('div');
    d.textContent = value == null ? '' : String(value);
    return d.innerHTML;
  }

  function getFiles() {
    try { return Array.isArray(allFiles) ? allFiles : []; } catch (_) { return []; }
  }

  function statusBadge(status) {
    const s = String(status || 'รอตรวจสอบ').trim();
    if (s === 'ผ่าน' || s === 'อนุมัติ' || s === 'อนุมัติแล้ว') return '<span class="nited-review-approved"><i class="fas fa-check-circle"></i> ผ่าน</span>';
    if (s === 'ไม่ผ่าน' || s === 'ไม่อนุมัติ' || s === 'ปฏิเสธ') return '<span class="nited-review-rejected"><i class="fas fa-times-circle"></i> ไม่ผ่าน</span>';
    return '<span class="nited-review-pending"><i class="fas fa-clock"></i> รอตรวจสอบ</span>';
  }

  function isPending(file) {
    return !FINAL_STATUSES.includes(String(file.status || 'รอตรวจสอบ').trim());
  }

  function getUrl(file) {
    return file && (file.fileUrl || file.fileUrlLink || file.url || file.link || '');
  }

  function getName(file) {
    return file && (file.fileName || file.name || file.fileType || 'ไฟล์งาน');
  }

  function signature(files) {
    return files.map(function (f) {
      return [f.id, f.timestamp, f.teacherName, f.fileName, f.fileType, f.status, f.fileUrl].join('|');
    }).join('¦');
  }

  function render() {
    const page = document.getElementById('page-admin');
    const tbody = document.getElementById('adminFiles');
    if (!page || !tbody || !page.classList.contains('active')) return;

    const files = getFiles().slice().reverse();
    const sig = signature(files);
    if (sig === lastSignature && tbody.dataset.nitedReviewRendered === '1') return;
    lastSignature = sig;

    let title = document.getElementById('nited-admin-review-title');
    if (!title) {
      title = document.createElement('div');
      title.id = 'nited-admin-review-title';
      title.className = 'nited-review-title';
      const card = tbody.closest('.card');
      if (card) card.insertBefore(title, card.querySelector('.card-body'));
    }

    const pending = files.filter(isPending).length;
    title.innerHTML = '<i class="fas fa-clipboard-check"></i> ตรวจสอบไฟล์งาน <span class="nited-review-count">' + pending + ' รายการรอตรวจสอบ</span>';

    if (!files.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;">ยังไม่มีไฟล์งาน</td></tr>';
      tbody.dataset.nitedReviewRendered = '1';
      return;
    }

    tbody.innerHTML = files.map(function (file) {
      const id = esc(file.id);
      const url = getUrl(file);
      const safeUrl = esc(url);
      const name = esc(getName(file));
      const pendingFile = isPending(file);
      const actions = '<div class="nited-review-actions">' +
        (url ? '<a class="nited-review-btn nited-review-view" href="' + safeUrl + '" target="_blank" rel="noopener noreferrer"><i class="fas fa-eye"></i> ตรวจดูไฟล์</a>' : '') +
        (pendingFile ? '<button type="button" class="nited-review-btn nited-review-approve" data-nited-file-review="approve" data-file-id="' + id + '"><i class="fas fa-check"></i> อนุมัติ</button><button type="button" class="nited-review-btn nited-review-reject" data-nited-file-review="reject" data-file-id="' + id + '"><i class="fas fa-times"></i> ไม่อนุมัติ</button>' : '') +
        '</div>';
      const date = typeof formatDate === 'function' ? formatDate(file.timestamp) : esc(file.timestamp);
      return '<tr><td>' + date + '</td><td>' + esc(file.teacherName) + '</td><td>' + esc(file.fileType) + '</td><td>' +
        (url ? '<a href="' + safeUrl + '" target="_blank" rel="noopener noreferrer"><i class="fas fa-file"></i> ' + name + '</a>' : name) +
        '</td><td>' + statusBadge(file.status) + '</td><td>' + actions + '</td></tr>';
    }).join('');

    tbody.dataset.nitedReviewRendered = '1';
  }

  async function review(id, status) {
    let file = null;
    try { file = allFiles.find(function (f) { return String(f.id) === String(id); }); } catch (_) {}
    if (!file) return showToast('ไม่พบไฟล์ที่ต้องการตรวจสอบ', 'error');

    const ok = window.confirm(status === 'ผ่าน' ? 'ยืนยันอนุมัติไฟล์นี้ใช่หรือไม่?' : 'ยืนยันว่าไฟล์นี้ไม่ผ่านการตรวจสอบใช่หรือไม่?');
    if (!ok) return;

    try {
      const result = await apiPost('updateFileStatus', { id: id, status: status });
      if (!result || !result.success) throw new Error((result && (result.error || result.message)) || 'บันทึกสถานะไม่สำเร็จ');

      file.status = status;
      if (typeof setLocalData === 'function') setLocalData('files', allFiles);
      lastSignature = '';
      render();
      if (typeof loadDashboard === 'function') loadDashboard();
      showToast(status === 'ผ่าน' ? 'อนุมัติไฟล์เรียบร้อยแล้ว' : 'บันทึกไฟล์ไม่ผ่านเรียบร้อยแล้ว', status === 'ผ่าน' ? 'success' : 'info');
    } catch (error) {
      showToast('บันทึกผลตรวจสอบไม่สำเร็จ: ' + error.message, 'error');
    }
  }

  function schedule() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(render, 60);
  }

  document.addEventListener('click', function (event) {
    const button = event.target.closest('[data-nited-file-review]');
    if (!button) return;
    event.preventDefault();
    review(button.getAttribute('data-file-id'), button.getAttribute('data-nited-file-review') === 'approve' ? 'ผ่าน' : 'ไม่ผ่าน');
  });

  document.addEventListener('DOMContentLoaded', function () {
    style();
    schedule();
    setTimeout(schedule, 300);
    setTimeout(schedule, 1000);
  });

  const observer = new MutationObserver(function () {
    if (document.getElementById('page-admin')?.classList.contains('active')) schedule();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const originalNavigate = window.navigateTo;
  if (typeof originalNavigate === 'function' && !window.__nitedAdminReviewNavigateHook) {
    window.navigateTo = function (page) {
      const result = originalNavigate.apply(this, arguments);
      if (page === 'admin') { setTimeout(schedule, 50); setTimeout(schedule, 300); }
      return result;
    };
    window.__nitedAdminReviewNavigateHook = true;
  }

  style();
  schedule();
})();
