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
      LEARNING_AREAS.map(area => `<option value="${area.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}">${area}</option>`).join('');

    if (current && !LEARNING_AREAS.includes(current)) {
      select.insertAdjacentHTML('beforeend', `<option value="${current.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}">${current}</option>`);
    }
    select.value = current;
    input.replaceWith(select);
  }

  function apply() {
    makeSelect(document.getElementById('bookDepartment'), '— เลือกกลุ่มสาระการเรียนรู้ —');
    makeSelect(document.getElementById('newDepartment'), '— เลือกกลุ่มสาระ/หน่วยงาน —');
    makeSelect(document.getElementById('acc_department'), '— เลือกกลุ่มสาระการเรียนรู้ —');
  }

  document.addEventListener('DOMContentLoaded', () => {
    apply();
    [300, 700, 1200, 2000].forEach(ms => setTimeout(apply, ms));
  });

  const observer = new MutationObserver(apply);
  observer.observe(document.body, { childList: true, subtree: true });
})();
