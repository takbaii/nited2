/* Takbai Internal Supervision - Teacher Directory */
(function () {
  'use strict';

  const TEACHERS = [
    ['นางสาว','วัลภา','มะเอียด'],['ว่าที่ ร.อ.','สามารถ','นุธรรมโชติ'],['นางสาว','ซูเลียนา','บือซา'],['นางสาว','นาซีรา','หะยีนอ'],
    ['นาง','ลออ','คงเจริญ'],['นางสาว','นูรุลอัยน์','มีซอ'],['นาย','อภิชาติ','รักเถาว์'],['นาย','จินดา','คงเจริญ'],
    ['นางสาว','มาห์มูด๊ะ','มอลอ'],['นาย','ภูริวัฒน์','อมรชาติ'],['นางสาว','ปราณี','บัวแก้ว'],['นาง','พเยาว์','ประสิทธิชัยวุฒิ'],
    ['นาง','นภาเพ็ญ','ทองจินดา'],['นาง','สาลินี','อารอมะ'],['นางสาว','ฮาฟีดะห์','สะนิบากอ'],['นาง','นภัสลักษณ์','พจน์เพริศ'],
    ['นาย','วัฒนา','จินดาเพ็ชร'],['นาง','นุชนาฏ','เข็มทอง'],['นางสาว','เกณิกา','เมฆเจริญวิวัฒนา'],['นางสาว','จีรวรรณ','ทองชาติ'],
    ['นาง','อรอุมา','แววภักดี'],['นางสาว','ซากีหย๊ะ','เด็งจิ'],['นาย','ธนภัทร์','ปั้นแก้ว'],['นางสาว','กุลธิดา','ศรีดำ'],
    ['นาย','อารีฟิน','มูซอ'],['นางสาว','ซูไมย๊ะ','บูกุ'],['นางสาว','ฮัสมารีซา','ยะโก๊ะ'],['นาย','มูหัมมัด','แวยุนุ'],
    ['นางสาว','สูรียานา','สือนิ'],['นางสาว','พรพิมล','สุขศรีแดง'],['นางสาว','สุลนา','เสาร์พูล'],['นาย','สุวัฒน์','จีนขุ้ย'],
    ['นางสาว','สมฤดี','แดงเตี้ย'],['นาย','แวอิสมาแอ','บินแวอูมา']
  ].map(([prefix, firstName, lastName]) => ({prefix, firstName, lastName, fullName:`${prefix} ${firstName} ${lastName}`}));

  window.NITED_TEACHERS = TEACHERS;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function makeSelect(input, placeholder) {
    if (!input || input.dataset.teacherDirectory === 'true') return;
    const select = document.createElement('select');
    for (const attr of ['id','name','required','disabled','class','style','autocomplete']) {
      if (!input.hasAttribute(attr)) continue;
      if (attr === 'required' || attr === 'disabled') select[attr] = input[attr];
      else select.setAttribute(attr, input.getAttribute(attr));
    }
    select.dataset.teacherDirectory = 'true';
    select.innerHTML = `<option value="">${placeholder}</option>` + TEACHERS.map(t => `<option value="${escapeHtml(t.fullName)}">${escapeHtml(t.fullName)}</option>`).join('');
    if (input.value) select.value = input.value;
    input.replaceWith(select);
  }

  function apply() {
    makeSelect(document.getElementById('bookTeacher'), '— เลือกชื่อครู —');
    makeSelect(document.getElementById('evalTeacher'), '— เลือกชื่อครู —');
    makeSelect(document.getElementById('fileTeacher'), '— เลือกชื่อครู —');
    makeSelect(document.getElementById('acc_teacherName'), '— เลือกชื่อครู —');
  }

  document.addEventListener('DOMContentLoaded', () => {
    apply();
    setTimeout(apply, 300);
    setTimeout(apply, 1000);
    setTimeout(apply, 2000);
  });

  const observer = new MutationObserver(apply);
  observer.observe(document.body, {childList:true, subtree:true});
})();
