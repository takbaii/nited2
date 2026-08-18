/*
 * Takbai Internal Supervision - API overrides for Files workflow.
 * Keep this file last in the Apps Script project.
 * Files is the single source of truth for upload/review/delete.
 */
function routeGet_(p){
  const a=String(p.action||'');
  switch(a){
    case'health':case'debug':return health_();
    case'setup':return setup_();
    case'seedUsers':return seedUsers_();
    case'login':return login_(p);
    case'getBookings':return getSheetObjects_('Booking',bookingHeaders_());
    case'getFiles':return getFilesForRequest_();
    case'getEvaluations':return getSheetObjects_('Supervision',evaluationHeaders_());
    case'getUsers':return getUsers_(p.authToken);
    case'getTeachers':return getTeachersForRequest_(p.authToken);
    case'getLearningAreas':return getLearningAreas_();
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
    case'updateBookingStatus':return updateById_('Booking',d.id,{status:d.status});
    case'deleteBooking':return deleteById_('Booking',d.id);
    case'updateBooking':return updateById_('Booking',d.id,d);
    case'addFile':return addFile_(d);
    case'updateFileStatus':return updateFileStatusDirect_(d);
    case'updateFile':return updateFileDirect_(d);
    case'deleteFile':return deleteFileDirect_(d);
    case'uploadFileToDrive':return uploadFile_(d);
    case'addEvaluation':return addEvaluation_(d);
    case'updateEvaluation':return updateById_('Supervision',d.id,d);
    case'deleteEvaluation':return deleteById_('Supervision',d.id);
    case'addUser':case'updateUser':case'deleteUser':case'addTeacher':case'updateTeacher':case'deleteTeacher':return adminWrite_(a,d);
    default:return{success:false,error:'Unknown POST action: '+a};
  }
}

function getFilesForRequest_(){
  try{
    const setup=setup_();
    const r=getSheetObjects_('Files',fileHeaders_());
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
  const sh=ensureSheet_('Files',fileHeaders_());
  const rows=sh.getLastRow();
  if(rows<2)return{success:false,error:'ยังไม่มีข้อมูลใน Files'};
  const values=sh.getRange(2,1,rows-1,sh.getLastColumn()).getValues();
  const idCol=fileHeaders_().indexOf('ID');
  const statusCol=fileHeaders_().indexOf('Status');
  for(var i=0;i<values.length;i++){
    if(String(values[i][idCol])===id){sh.getRange(i+2,statusCol+1).setValue(status);return{success:true,id:id,status:status};}
  }
  return{success:false,error:'ไม่พบไฟล์ ID: '+id};
}

function updateFileDirect_(d){
  const id=String(d.id||'').trim();
  if(!id)return{success:false,error:'ไม่พบ ID ไฟล์'};
  const sh=ensureSheet_('Files',fileHeaders_());
  const headers=fileHeaders_(),rows=sh.getLastRow();
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
  const sh=ensureSheet_('Files',fileHeaders_()),headers=fileHeaders_(),rows=sh.getLastRow();
  if(rows<2)return{success:false,error:'ยังไม่มีข้อมูลใน Files'};
  const values=sh.getRange(2,1,rows-1,headers.length).getValues(),idCol=headers.indexOf('ID'),driveCol=headers.indexOf('Drive File ID');
  for(var i=0;i<values.length;i++){
    if(String(values[i][idCol])!==id)continue;
    const driveId=String(values[i][driveCol]||'');
    /* Delete the Drive file only when explicitly requested; default removes the database row. */
    if(String(d.deleteDriveFile||'').toLowerCase()==='true' && driveId){try{DriveApp.getFileById(driveId).setTrashed(true);}catch(_){}}
    sh.deleteRow(i+2);
    return{success:true,id:id};
  }
  return{success:false,error:'ไม่พบไฟล์ ID: '+id};
}

function getTeachersForRequest_(token){
  const setup=setup_();
  const r=getSheetObjects_('Teachers',teacherHeaders_());
  if(!r.success)return r;
  const auth=token?requireAdmin_(token):{ok:false};
  return{success:true,data:auth.ok?(r.data||[]):(r.data||[]).filter(x=>String(x.active).toLowerCase()!=='false'),sheets:setup.sheets};
}
