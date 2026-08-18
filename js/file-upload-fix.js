// Override the legacy upload handler with a Drive+Sheets transaction.
document.addEventListener('DOMContentLoaded',()=>{
  const form=document.getElementById('fileForm');
  if(!form)return;
  form.onsubmit=async e=>{
    e.preventDefault();
    const id=crypto.randomUUID();
    const base={action:'addFile',id,teacherName:val('fileTeacher'),fileType:val('fileType'),status:'รอตรวจสอบ',submittedBy:currentUser?.username||''};
    try{
      if(base.fileType==='คลิปวิดีโอ'){
        base.fileUrl=val('fileLink');
        const ok=await postAndConfirm(base,'files',id);
        toast(ok?'ส่งงานแล้ว รอผู้ดูแลตรวจสอบ':'บันทึกไฟล์ไม่สำเร็จ',ok?'success':'error');
        if(ok)form.reset();
        return;
      }
      const f=document.getElementById('fileInput')?.files[0];
      if(!f)throw new Error('กรุณาเลือกไฟล์');
      if(f.size>10*1024*1024)throw new Error('ไฟล์เกิน 10 MB');
      const data=await readBase64(f);
      await postForm({action:'uploadFileToDrive',id,teacherName:base.teacherName,fileType:base.fileType,fileName:f.name,mimeType:f.type,fileData:data,status:base.status,submittedBy:base.submittedBy});
      await new Promise(r=>setTimeout(r,700));
      await loadData();
      const ok=state.files.some(x=>String(x.id)===String(id));
      toast(ok?'ส่งงานแล้ว รอผู้ดูแลตรวจสอบ':'อัปโหลดไม่สำเร็จ',ok?'success':'error');
      if(ok)form.reset();
    }catch(err){toast(err.message||'ส่งไฟล์ไม่สำเร็จ','error');}
  };
});
