/* Takbai Internal Supervision - Admin Control Center */
(function(){
  'use strict';
  const q = s => document.querySelector(s);
  const escA = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2));
  const val = id => (document.getElementById(id)?.value ?? '').trim();
  const notify = (m,t='success') => { if(typeof showToast==='function') showToast(m,t); else alert(m); };
  let refreshTimer = null;

  const schemas = {
    bookings:{title:'การจอง',actionAdd:'addBooking',actionUpdate:'updateBooking',actionDelete:'deleteBooking',load:'getBookings',fields:[['date','วันที่','date'],['time','เวลา','time'],['teacherName','ชื่อครู','text'],['department','กลุ่มสาระ','text'],['period','คาบ','text'],['subjectName','วิชา','text'],['subjectCode','รหัสวิชา','text'],['classLevel','ระดับชั้น','text'],['room','ห้อง','text'],['status','สถานะ','text']]},
    files:{title:'ไฟล์งาน',actionAdd:'addFile',actionUpdate:'updateFile',actionDelete:'deleteFile',load:'getFiles',fields:[['teacherName','ชื่อครู','text'],['fileType','ประเภทไฟล์','text'],['fileName','ชื่อไฟล์','text'],['fileUrl','ลิงก์ไฟล์','url'],['driveFileId','Drive File ID','text'],['status','สถานะ','text']]},
    evaluations:{title:'ผลการประเมิน',actionAdd:'addEvaluation',actionUpdate:'updateEvaluation',actionDelete:'deleteEvaluation',load:'getEvaluations',fields:[['teacherName','ชื่อครู','text'],['supervisionDate','วันที่นิเทศ','date'],['strengths','จุดเด่น','textarea'],['improvements','สิ่งที่ควรพัฒนา','textarea'],['suggestions','ข้อเสนอแนะ','textarea'],['summary','สรุปผล','textarea']]},
    users:{title:'ผู้ใช้งาน',actionAdd:'addUser',actionUpdate:'updateUser',actionDelete:'deleteUser',load:'getUsers',fields:[['username','ชื่อผู้ใช้','text'],['password','รหัสผ่าน','password'],['role','สิทธิ์','role'],['fullName','ชื่อ-นามสกุล','text'],['department','กลุ่มสาระ/หน่วยงาน','text'],['active','สถานะบัญชี','active']]}
  };
  let data={bookings:[],files:[],evaluations:[],users:[]},currentTab='bookings';

  function isAdmin(){const nav=q('#navAdmin');return !!(nav && nav.style.display!=='none' && nav.offsetParent!==null);}
  function setSyncState(text,ok=true){const el=q('#accSyncState');if(el){el.innerHTML='<i class="fas fa-circle"></i> '+escA(text);el.classList.toggle('ok',ok);}}
  async function loadAll(){
    if(!isAdmin()||typeof apiCall!=='function')return;
    setSyncState('กำลังอ่านข้อมูลจาก Google Sheets...',true);
    const pairs=await Promise.all(Object.entries(schemas).map(async([k,s])=>{try{const r=await apiCall(s.load,{_ts:Date.now()});return[k,r&&r.success?(r.data||[]):[]];}catch(_){return[k,[]];}}));
    pairs.forEach(([k,v])=>data[k]=v);render();
    setSyncState('เชื่อมต่อ Google Sheets แล้ว • '+new Date().toLocaleTimeString('th-TH'),true);
  }
  function render(){
    const host=q('#adminControlCenter');if(!host)return;const s=schemas[currentTab],rows=data[currentTab]||[];
    host.innerHTML=`<div class="admin-cc-head"><div><div class="admin-cc-kicker"><i class="fas fa-shield-halved"></i> ADMIN CONTROL CENTER</div><h2>ศูนย์จัดการข้อมูล</h2><p>ข้อมูลในหน้านี้อ่านและบันทึกกับ Google Sheets โดยตรง</p></div><div class="admin-cc-head-actions"><span class="admin-cc-db"><i class="fas fa-database"></i> Google Sheets</span><span id="accSyncState" class="acc-sync-state"><i class="fas fa-circle"></i> กำลังอ่านข้อมูล...</span><button class="admin-cc-refresh" id="accRefresh"><i class="fas fa-rotate"></i> รีเฟรช</button></div></div><div class="admin-cc-stats">${Object.entries(schemas).map(([k,x])=>`<button class="acc-stat ${k===currentTab?'active':''}" data-acc-tab="${k}"><span>${escA(x.title)}</span><strong>${data[k].length}</strong></button>`).join('')}</div><div class="admin-cc-toolbar"><div><h3>${escA(s.title)}</h3><small>ข้อมูลจาก Google Sheets ทั้งหมด ${rows.length} รายการ</small></div><div class="admin-cc-actions"><input id="accSearch" class="acc-search" placeholder="ค้นหาข้อมูล..." aria-label="ค้นหา"><button id="accAdd" class="btn btn-primary"><i class="fas fa-plus"></i> เพิ่ม${escA(s.title)}</button></div></div><div class="admin-cc-table-wrap"><table class="admin-cc-table"><thead><tr>${s.fields.map(f=>`<th>${escA(f[1])}</th>`).join('')}<th>จัดการ</th></tr></thead><tbody id="accBody"></tbody></table></div>`;
    host.querySelectorAll('[data-acc-tab]').forEach(b=>b.addEventListener('click',()=>{currentTab=b.dataset.accTab;render();}));
    q('#accRefresh').onclick=loadAll;q('#accAdd').onclick=()=>openEditor(null);q('#accSearch').oninput=e=>renderRows(e.target.value);renderRows('');
  }
  function display(v,type){
    if(type==='active')return String(v).toLowerCase()==='false'?'<span class="acc-badge off">ปิดใช้งาน</span>':'<span class="acc-badge on">ใช้งาน</span>';
    if(type==='role')return String(v)==='admin'?'<span class="acc-badge admin">ผู้ดูแล</span>':'<span class="acc-badge user">ผู้ใช้</span>';
    if(type==='password')return '<span class="acc-secret">••••••••</span>';
    if(type==='url'&&v)return `<a class="acc-link" href="${escA(v)}" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> เปิด</a>`;
    const text=String(v??'');return escA(text.length>80?text.slice(0,80)+'…':text)||'<span class="acc-empty">—</span>';
  }
  function renderRows(filter){
    const s=schemas[currentTab],body=q('#accBody');if(!body)return;const needle=String(filter||'').toLowerCase();const rows=(data[currentTab]||[]).filter(r=>!needle||s.fields.some(f=>String(r[f[0]]??'').toLowerCase().includes(needle)));
    body.innerHTML=rows.length?rows.map(r=>`<tr>${s.fields.map(f=>`<td>${display(r[f[0]],f[2])}</td>`).join('')}<td class="acc-actions"><button class="acc-edit" data-id="${escA(r.id)}" title="แก้ไข"><i class="fas fa-pen"></i></button><button class="acc-delete" data-id="${escA(r.id)}" title="ลบ"><i class="fas fa-trash"></i></button></td></tr>`).join(''):`<tr><td colspan="${s.fields.length+1}" class="acc-no-data"><i class="fas fa-inbox"></i><div>ยังไม่มีข้อมูล</div></td></tr>`;
    body.querySelectorAll('.acc-edit').forEach(b=>b.onclick=()=>openEditor(rows.find(x=>String(x.id)===String(b.dataset.id))));body.querySelectorAll('.acc-delete').forEach(b=>b.onclick=()=>removeRow(b.dataset.id));
  }
  function openEditor(row){
    const s=schemas[currentTab],edit=!!row,title=edit?'แก้ไขข้อมูล':'เพิ่มข้อมูลใหม่';
    const form=s.fields.map(f=>{const id='acc_'+f[0],v=row?.[f[0]]??(f[0]==='active'?true:(f[0]==='status'?(currentTab==='bookings'?'รอดำเนินการ':'รอตรวจสอบ'):''));if(f[2]==='textarea')return `<div class="form-group acc-field"><label>${escA(f[1])}</label><textarea id="${id}" rows="3">${escA(v)}</textarea></div>`;if(f[2]==='role')return `<div class="form-group acc-field"><label>${escA(f[1])}</label><select id="${id}"><option value="user" ${v==='user'?'selected':''}>ผู้ใช้</option><option value="admin" ${v==='admin'?'selected':''}>ผู้ดูแลระบบ</option></select></div>`;if(f[2]==='active')return `<div class="form-group acc-field"><label>${escA(f[1])}</label><select id="${id}"><option value="true" ${String(v)!=='false'?'selected':''}>ใช้งาน</option><option value="false" ${String(v)==='false'?'selected':''}>ปิดใช้งาน</option></select></div>`;return `<div class="form-group acc-field"><label>${escA(f[1])}</label><input id="${id}" type="${f[2]}" value="${escA(v)}" ${f[0]==='username'&&edit?'readonly':''}></div>`;}).join('');
    let modal=q('#accModal');if(!modal){modal=document.createElement('div');modal.id='accModal';modal.className='acc-modal';document.body.appendChild(modal);}
    modal.innerHTML=`<div class="acc-modal-backdrop"></div><div class="acc-modal-card"><div class="acc-modal-head"><div><span>จัดการข้อมูล</span><h3>${escA(title)}</h3></div><button id="accClose" class="acc-close"><i class="fas fa-xmark"></i></button></div><form id="accForm"><div class="acc-form-grid">${form}</div><div class="acc-modal-foot"><button type="button" id="accCancel" class="btn btn-light">ยกเลิก</button><button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> ${edit?'บันทึกการแก้ไข':'เพิ่มข้อมูล'}</button></div></form></div>`;modal.classList.add('show');
    const close=()=>modal.classList.remove('show');q('#accClose').onclick=close;q('#accCancel').onclick=close;q('.acc-modal-backdrop').onclick=close;
    q('#accForm').onsubmit=async e=>{e.preventDefault();const payload={id:row?.id||uid()};s.fields.forEach(f=>{let x=val('acc_'+f[0]);if(f[2]==='active')x=x==='true';payload[f[0]]=x;});if(currentTab==='users'&&!payload.password&&edit)delete payload.password;if(currentTab==='users'&&!payload.username)return notify('กรุณาระบุชื่อผู้ใช้','error');if(typeof apiPost!=='function')return notify('ไม่พบ API','error');const r=await apiPost(edit?s.actionUpdate:s.actionAdd,payload);if(r&&r.success===false)return notify(r.error||'บันทึกไม่สำเร็จ','error');close();await loadAll();notify(edit?'แก้ไขข้อมูลสำเร็จ':'เพิ่มข้อมูลสำเร็จ');};
  }
  async function removeRow(id){if(!confirm('ยืนยันการลบข้อมูลรายการนี้? ข้อมูลจะถูกลบจาก Google Sheets'))return;const s=schemas[currentTab];if(typeof apiPost!=='function')return notify('ไม่พบ API','error');const r=await apiPost(s.actionDelete,{id});if(r&&r.success===false)return notify(r.error||'ลบข้อมูลไม่สำเร็จ','error');await loadAll();notify('ลบข้อมูลแล้ว');}
  function boot(){
    if(!isAdmin())return;const page=q('#page-admin');if(!page)return;let host=q('#adminControlCenter');if(!host){host=document.createElement('div');host.id='adminControlCenter';page.insertBefore(host,page.firstElementChild);}loadAll();
    clearInterval(refreshTimer);refreshTimer=setInterval(()=>{if(isAdmin()&&q('#page-admin')?.classList.contains('active'))loadAll();},30000);
  }
  window.addEventListener('load',()=>setTimeout(boot,500));
  if(typeof window.navigateTo==='function'){const oldNavigate=window.navigateTo;window.navigateTo=function(page){const r=oldNavigate.apply(this,arguments);if(page==='admin')setTimeout(boot,250);return r;};}
})();
