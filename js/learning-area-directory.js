/* Takbai Internal Supervision - Learning Area Directory */
(function () {
  'use strict';

  const LEARNING_AREAS = [
    'ภาษาไทย',
    'คณิตศาสตร์',
    'วิทยาศาสตร์และเทคโนโลยี',
    'สังคมศึกษา ศาสนาและวัฒนธรรม',
    'สุขศึกษาและพลศึกษา',
    'ศิลปะ ดนตรี นาฏศิลป์',
    'การงานอาชีพ',
    'ภาษาต่างประเทศ',
    'อื่นๆ'
  ];

  window.NITED_LEARNING_AREAS = LEARNING_AREAS;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function makeSelect(input, placeholder) {
    if (!input || input.dataset.learningAreaDirectory === 'true') return;

    const select = document.createElement('select');
    for (const attr of ['id', 'name', 'required', 'disabled', 'class', 'style', 'autocomplete']) {
      if (!input.hasAttribute(attr)) continue;
      if (attr === 'required' || attr === 'disabled') select[attr] = input[attr];
      else select.setAttribute(attr, input.getAttribute(attr));
    }

    select.dataset.learningAreaDirectory = 'true';
    const current = input.value || '';
    select.innerHTML = `<option value="">${placeholder}</option>` +
      LEARNING_AREAS.map(area => `<option value="${escapeHtml(area)}">${escapeHtml(area)}</option>`).join('');

    if (current && !LEARNING_AREAS.includes(current)) {
      select.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(current)}">${escapeHtml(current)}</option>`);
    }
    select.value = current;
    input.replaceWith(select);
  }

  function apply() {
    makeSelect(document.getElementById('bookDepartment'), '— เลือกกลุ่มสาระการเรียนรู้ —');
    makeSelect(document.getElementById('newDepartment'), '— เลือกกลุ่มสาระ/หน่วยงาน —');
    makeSelect(document.getElementById('acc_department'), '— เลือกกลุ่มสาระการเรียนรู้ —');
  }

  // Safety repair: keep every page visible when it is the active page.
  // This protects the UI from malformed/legacy DOM or a stale cached stylesheet.
  function repairPageLayout() {
    document.querySelectorAll('.page').forEach(page => {
      if (page.classList.contains('active')) {
        page.style.display = 'block';
        page.style.visibility = 'visible';
        page.style.opacity = '1';
      } else {
        page.style.display = 'none';
      }
    });

    const booking = document.getElementById('page-booking');
    if (!booking) return;
    booking.querySelectorAll(':scope > .card').forEach(card => {
      card.style.display = 'block';
      card.style.visibility = 'visible';
      card.style.opacity = '1';
    });

    // Fallback for an old cached/malformed index.html where the booking cards were lost.
    if (!booking.querySelector(':scope > .card')) {
      booking.insertAdjacentHTML('afterbegin', `
        <div class="card">
          <div class="card-header"><h3><i class="fas fa-calendar-plus"></i> จองวันนิเทศ</h3></div>
          <div class="card-body">
            <form id="bookingForm"><div class="form-row">
              <div class="form-group"><label>วันที่</label><input type="date" id="bookDate" required></div>
              <div class="form-group"><label>เวลา</label><input type="time" id="bookTime" required></div>
              <div class="form-group"><label>ชื่อครู</label><input id="bookTeacher" required></div>
              <div class="form-group"><label>กลุ่มสาระการเรียนรู้</label><select id="bookDepartment" required><option value="">— เลือกกลุ่มสาระการเรียนรู้ —</option></select></div>
              <div class="form-group"><label>คาบ</label><input id="bookPeriod"></div>
              <div class="form-group"><label>วิชา</label><input id="bookSubject"></div>
              <div class="form-group"><label>รหัสวิชา</label><input id="bookSubjectCode"></div>
              <div class="form-group"><label>ระดับชั้น</label><input id="bookClassLevel"></div>
              <div class="form-group"><label>ห้อง</label><input id="bookRoom" required></div>
            </div><button class="btn btn-primary" type="submit"><i class="fas fa-save"></i> บันทึกการจอง</button></form>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3><i class="fas fa-calendar"></i> ปฏิทินการนิเทศ</h3></div>
          <div class="card-body"><div id="bookingCalendar"></div></div>
        </div>
        <div class="card">
          <div class="card-header"><h3>รายการจองของฉัน</h3></div>
          <div class="card-body table-responsive"><table><thead><tr><th>วันที่</th><th>เวลา</th><th>กลุ่มสาระ</th><th>วิชา</th><th>ชั้น</th><th>ห้อง</th><th>สถานะ</th><th></th></tr></thead><tbody id="myBookings"></tbody></table></div>
        </div>`);

      apply();
      if (typeof initBookingForm === 'function') initBookingForm();
      if (typeof loadMyBookings === 'function') loadMyBookings();
      if (typeof initCalendars === 'function') setTimeout(() => initCalendars(), 50);
    }
  }

  function runRepair() {
    apply();
    repairPageLayout();
  }

  document.addEventListener('DOMContentLoaded', () => {
    runRepair();
    [300, 700, 1200, 2000].forEach(ms => setTimeout(runRepair, ms));
  });

  // Run safely after body exists; never let this helper break the main application.
  function observeBody() {
    if (!document.body) return;
    const observer = new MutationObserver(() => {
      try { runRepair(); } catch (_) {}
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) observeBody();
  else document.addEventListener('DOMContentLoaded', observeBody, { once: true });
})();
