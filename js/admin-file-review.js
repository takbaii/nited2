/* Admin Files: live sync + open + approve/reject + delete */
(function(){
  'use strict';
  if(window.__nitedAdminFileReviewReady)return;
  window.__nitedAdminFileReviewReady=true;

  const FINAL=['ผ่าน','อนุมัติ','อนุมัติแล้ว','ไม่ผ่าน','ไม่อนุมัติ','ปฏิเสธ'];
  let timer=null,poll=null,signature='';

  function esc(v){const d=document.createElement('div');d.textContent=v==null?'':String(v);return d.innerHTML;}
  function files(){return Array.isArray(window.allFiles)?window.allFiles:[];}
  function pending(f){return !FINAL.includes(String(f.status||'รอตรวจสอบ').trim());}
  function url(f){return f?.fileUrl||f?.fileUrlLink||f?.url||f?.link||'';}
  function name(f){return f?.fileName||f?.name||'ไฟล์งาน';}
  function badge(s){s=String(s||'รอตรวจสอบ').trim();if(['ผ่าน','อนุมัติ','อนุมัติแล้ว'].includes(s))return '<span class="nfa-ok">✓ ผ่าน</span>';if(['ไม่ผ่าน','ไม่อนุมัติ','ปฏิเสธ'].includes(s))return '<span class="nfa-no">✕ ไม่ผ่าน</span>';return '<span class="nfa-wait">◷ รอตรวจสอบ</span>';}

  function styles(){
    if(document.getElementById('nfa-style'))return;
    const s=document.createElement('style');s.id='nfa-style';s.textContent=`
      .nfa-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 20px 8px;font-weight:800;font-size:18px}
      .nfa-count{font-size:12px;padding:6px 10px;border-radius:999px;background:#fff7df;color:#9a6700}
      .nfa-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
      .nfa-btn{border:0;border-radius:9px;padding:8px 11px;cursor:pointer;font:inherit;font-size:12px;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:6px}
      .nfa-view{background:#eef4ff;color:#175cd3}.nfa-approve{background:#eaf8ef;color:#15803d}.nfa-reject{background:#fff0f0;color:#dc2626}.nfa-delete{background:#f3f4f6;color:#374151}
      .nfa-ok,.nfa-no,.nfa-wait{display:inline-flex;padding:6px 10px;border-radius:999px;font-weight:700;font-size:12px}.nfa-ok{background:#eaf8ef;color:#15803d}.nfa-no{background:#fff0f0;color:#dc2626}.nfa-wait{background:#fff7df;color:#a16207}
      .nfa-refresh{background:#fff;border:1px solid #e5e7eb;color:#374151}
    `;document.head.appendChild(s);
  }

  async function refreshFromServer(){
    if(!window.isAdmin || typeof window.apiCall!=='function')return;
    try{
      const r=await window.apiCall('getFiles',{_t:Date.now()});
      if(r&&r.success&&Array.isArray(r.data)){
        window.allFiles=r.data;
        if(typeof window.setLocalData==='function')window.setLocalData('files',window.allFiles);
        if(typeof window.loadDashboard==='function')window.loadDashboard();
        if(typeof window.loadMyFiles==='function')window.loadMyFiles();
        render(true);
      }
    }catch(e){console.warn('[NITED Files] refresh failed',e);}
  }

  function render(force){
    const page=document.getElementById('page-admin'),body=document.getElementById('adminFiles');
    if(!page||!body||!page.classList.contains('active'))return;
    const list=files().slice().reverse();
    const sig=JSON.stringify(list.map(f=>[f.id,f.status,f.fileName,f.fileUrl,f.timestamp]));
    if(!force&&sig===signature&&body.dataset.nfa==='1')return;signature=sig;
    let head=document.getElementById('nfa-head');
    if(!head){head=document.createElement('div');head.id='nfa-head';head.className='nfa-head';const card=body.closest('.card');if(card)card.insertBefore(head,card.querySelector('.card-body'));}
    const wait=list.filter(pending).length;
    head.innerHTML='<span><i class="fas fa-clipboard-check"></i> ตรวจสอบไฟล์งาน <span class="nfa-count">'+wait+' รายการรอตรวจสอบ</span></span><button class="nfa-btn nfa-refresh" type="button" data-nfa-refresh><i class="fas fa-sync"></i> รีเฟรช</button>';
    if(!list.length){body.innerHTML='<tr><td colspan="6" style="text-align:center;padding:42px">ยังไม่มีไฟล์งาน</td></tr>';body.dataset.nfa='1';return;}
    body.innerHTML=list.map(f=>{
      const id=esc(f.id),u=esc(url(f)),n=esc(name(f));
      let actions='';
      if(url(f))actions+='<a class="nfa-btn nfa-view" href="'+u+'" target="_blank" rel="noopener noreferrer"><i class="fas fa-eye"></i> เปิดไฟล์</a>';
      if(pending(f))actions+='<button class="nfa-btn nfa-approve" type="button" data-nfa-action="approve" data-id="'+id+'"><i class="fas fa-check"></i> อนุมัติ</button><button class="nfa-btn nfa-reject" type="button" data-nfa-action="reject" data-id="'+id+'"><i class="fas fa-times"></i> ไม่อนุมัติ</button>';
      actions+='<button class="nfa-btn nfa-delete" type="button" data-nfa-action="delete" data-id="'+id+'"><i class="fas fa-trash"></i> ลบ</button>';
      const date=typeof window.formatDate==='function'?window.formatDate(f.timestamp):esc(f.timestamp);
      return '<tr><td>'+date+'</td><td>'+esc(f.teacherName)+'</td><td>'+esc(f.fileType)+'</td><td>'+(url(f)?'<a href="'+u+'" target="_blank" rel="noopener noreferrer"><i class="fas fa-file"></i> '+n+'</a>':n)+'</td><td>'+badge(f.status)+'</td><td><div class="nfa-actions">'+actions+'</div></td></tr>';
    }).join('');
    body.dataset.nfa='1';
  }

  async function action(id,kind){
    const f=files().find(x=>String(x.id)===String(id));if(!f)return window.showToast?.('ไม่พบไฟล์','error');
    if(kind==='delete'){
      if(!confirm('ยืนยันลบรายการไฟล์นี้?\nหมายเหตุ: จะลบรายการออกจากชีต Files'))return;
      const r=await window.apiPost('deleteFile',{id:id});if(!r?.success)return window.showToast?.(r?.error||'ลบไฟล์ไม่สำเร็จ','error');
      window.allFiles=files().filter(x=>String(x.id)!==String(id));
      if(typeof window.setLocalData==='function')window.setLocalData('files',window.allFiles);
      window.showToast?.('ลบรายการไฟล์แล้ว');render(true);window.loadDashboard?.();return;
    }
    const status=kind==='approve'?'ผ่าน':'ไม่ผ่าน';
    let note='';
    if(status==='ไม่ผ่าน'){note=prompt('ระบุเหตุผลที่ไม่อนุมัติ (ถ้ามี):','')||'';}
    if(!confirm(status==='ผ่าน'?'ยืนยันอนุมัติไฟล์นี้ใช่หรือไม่?':'ยืนยันไม่อนุมัติไฟล์นี้ใช่หรือไม่?'))return;
    const r=await window.apiPost('updateFileStatus',{id:id,status:status});
    if(!r?.success)return window.showToast?.(r?.error||'บันทึกสถานะไม่สำเร็จ','error');
    f.status=status;f.reviewNote=note;
    if(typeof window.setLocalData==='function')window.setLocalData('files',window.allFiles);
    render(true);window.loadDashboard?.();window.loadMyFiles?.();
    window.showToast?.(status==='ผ่าน'?'อนุมัติไฟล์เรียบร้อยแล้ว':'บันทึกไฟล์ไม่ผ่านแล้ว',status==='ผ่าน'?'success':'info');
  }

  document.addEventListener('click',function(e){
    const b=e.target.closest('[data-nfa-action]');if(b){e.preventDefault();action(b.dataset.id,b.dataset.nfaAction);return;}
    if(e.target.closest('[data-nfa-refresh]')){e.preventDefault();refreshFromServer();}
  });

  function schedule(){clearTimeout(timer);timer=setTimeout(()=>render(false),80);}
  document.addEventListener('DOMContentLoaded',()=>{styles();schedule();setTimeout(refreshFromServer,400);setTimeout(schedule,700);});
  const obs=new MutationObserver(()=>{if(document.getElementById('page-admin')?.classList.contains('active'))schedule();});
  obs.observe(document.body,{childList:true,subtree:true});
  setInterval(()=>{if(document.getElementById('page-admin')?.classList.contains('active'))refreshFromServer();},10000);
  styles();
})();
