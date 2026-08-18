/*
 * Takbai Internal Supervision - API overrides for Files workflow.
 * Keep this file last in the Apps Script project.
 * IMPORTANT: Supervision is handled by the v8 backend in Code-v8-supervision.gs.
 */
function routeGet_(p){
  const a=String(p.action||'');
  switch(a){
    case'health':case'debug':return health_();
    case'setup':return setup_();
    case'seedUsers':return seedUsers_();
    case'login':return login_(p);
    case'getBookings':return list_('Booking');
    case'getFiles':return getFilesForRequest_();
    case'getEvaluations':return list_('Supervision');
    case'getUsers':return users_(p.authToken);
    case'getTeachers':return getTeachersForRequest_(p.authToken);
    case'getLearningAreas':return list_('LearningAreas');
    case'getDashboard':return dashboard_();
    case'addTeacher':case'updateTeacher':case'deleteTeacher':return adminWrite_(a,p);
    default:return{success:false,error:'Unknown GET action: '+a};
  }
}

function routePost_(d){
  const a=String(d.action||'');
  switch(a){
    case'health':return health_();
    case'setup':return setup_();
    case'seedUsers':return seedUsers_();
    case'login':return login_(d);
    case'addBooking':return addBooking_(d);
    case'updateBookingStatus':return adminUpdateBooking_(d);
    case'deleteBooking':return del_('Booking',d.id);
    case'updateBooking':return update_('Booking',d.id,d);
    case'addFile':return addFile_(d);
    case'updateFileStatus':return reviewFile_(d);
    case'updateFile':return update_('Files',d.id,d);
    case'deleteFile':return adminDelete_(d,'Files');
    case'uploadFileToDrive':return uploadFile_(d);
    case'uploadEvidence':return uploadEvidence_(d);

    // CRITICAL: evaluation form writes to Supervision + SupervisionDetails.
    case'saveSupervisionData':
    case'addEvaluation':return saveSupervision_(d);
    case'updateSupervisionStatus':return reviewSupervision_(d);
    case'updateEvaluation':return reviewSupervision_(d);
    case'deleteEvaluation':return adminDelete_(d,'Supervision');

    case'addUser':case'updateUser':case'deleteUser':
    case'addTeacher':case'updateTeacher':case'deleteTeacher':return adminWrite_(d);
    default:return{success:false,error:'Unknown POST action: '+a};
  }
}

function getFilesForRequest_(){
  try{
    const setup=setup_();
    const r=list_('Files');
    if(!r.success)return r;
    const data=(r.data||[]).map(function(f){
      return {id:f.id||'',timestamp:f.timestamp||'',teacherName:f.teacherName||'',fileType:f.fileType||'',fileUrl:f.fileUrl||'',driveFileId:f.driveFileId||'',fileName:f.fileName||'',status:f.status||'รอตรวจสอบ'};
    });
    return {success:true,data:data,count:data.length,sheet:'Files',sheets:setup.sheets};
  }catch(e){return{success:false,data:[],error:errorMessage_(e)};}
}

function updateFileStatusDirect_(d){
  const id=String(d.id||'').trim();
  const status=String(d.status||'รอตรวจสอบ').trim();
  if(!id)return{success:false,error:'ไม่พบ ID ไฟล์'};
  const sh=ensure_('Files',H.Files);
  const rows=sh.getLastRow();
  if(rows<2)return{success:false,error:'ยังไม่มีข้อมูลใน Files'};
  const values=sh.getRange(2,1,rows-1,H.Files.length).getValues();
  const idCol=H.Files.indexOf('ID');
  const statusCol=H.Files.indexOf('Status');
  for(var i=0;i<values.length;i++){
    if(String(values[i][idCol])===id){
      sh.getRange(i+2,statusCol+1).setValue(status);
      return{success:true,id:id,status:status};
    }
  }
  return{success:false,error:'ไม่พบไฟล์ ID: '+id};
}

function updateFileDirect_(d){
  const id=String(d.id||'').trim();
  if(!id)return{success:false,error:'ไม่พบ ID ไฟล์'};
  const sh=ensure_('Files',H.Files),headers=H.Files,rows=sh.getLastRow();
  if(rows<2)return{success:false,error:'ยังไม่มีข้อมูลใน Files'};
  const values=sh.getRange(2,1,rows-1,headers.length).getValues(),idCol=headers.indexOf('ID');
  for(var i=0;i<values.length;i++){
    if(String(values[i][idCol])!==id)continue;
    const row=i+2;
    const map={timestamp:'Timestamp',teacherName:'Teacher Name',fileType:'File Type',fileUrl:'File URL/Link',driveFileId:'Drive File ID',fileName:'File Name',status:'Status'};
    Object.keys(map).forEach(function(k){if(d[k]!==undefined){const c=headers.indexOf(map[k]);if(c>=0)sh.getRange(row,c+1).setValue(d[k]);}});
    return{success:true,id:id};
  }
  return{success:false,error:'ไม่พบไฟล์ ID: '+id};
}

function deleteFileDirect_(d){
  const id=String(d.id||'').trim();
  if(!id)return{success:false,error:'ไม่พบ ID ไฟล์'};
  const sh=ensure_('Files',H.Files),headers=H.Files,rows=sh.getLastRow();
  if(rows<2)return{success:false,error:'ยังไม่มีข้อมูลใน Files'};
  const values=sh.getRange(2,1,rows-1,headers.length).getValues(),idCol=headers.indexOf('ID'),driveCol=headers.indexOf('Drive File ID');
  for(var i=0;i<values.length;i++){
    if(String(values[i][idCol])!==id)continue;
    const driveId=String(values[i][driveCol]||'');
    if(String(d.deleteDriveFile||'').toLowerCase()==='true' && driveId){try{DriveApp.getFileById(driveId).setTrashed(true);}catch(_){}}
    sh.deleteRow(i+2);
    return{success:true,id:id};
  }
  return{success:false,error:'ไม่พบไฟล์ ID: '+id};
}

function getTeachersForRequest_(token){
  const setup=setup_();
  const r=list_('Teachers');
  if(!r.success)return r;
  const auth=token?auth_(token,true):{ok:false};
  return{success:true,data:auth.ok?(r.data||[]):(r.data||[]).filter(function(x){return String(x.active).toLowerCase()!=='false';}),sheets:setup.sheets};
}
