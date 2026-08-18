/*
 * Takbai Internal Supervision - API overrides for Files workflow.
 * Keep this file last in the Apps Script project.
 * It makes the Files sheet the single source of truth for upload/review/delete.
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
    case'updateFileStatus':return updateById_('Files',d.id,{status:d.status||'รอตรวจสอบ'});
    case'updateFile':return updateById_('Files',d.id,d);
    case'deleteFile':return deleteById_('Files',d.id);
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
      return {
        id:f.id||'',
        timestamp:f.timestamp||'',
        teacherName:f.teacherName||'',
        fileType:f.fileType||'',
        fileUrl:f.fileUrl||'',
        driveFileId:f.driveFileId||'',
        fileName:f.fileName||'',
        status:f.status||'รอตรวจสอบ'
      };
    });
    return {success:true,data:data,count:data.length,sheet:'Files',sheets:setup.sheets};
  }catch(e){
    return {success:false,data:[],error:errorMessage_(e)};
  }
}

function getTeachersForRequest_(token){
  const setup=setup_();
  const r=getSheetObjects_('Teachers',teacherHeaders_());
  if(!r.success)return r;
  const auth=token?requireAdmin_(token):{ok:false};
  return{success:true,data:auth.ok?(r.data||[]):(r.data||[]).filter(x=>String(x.active).toLowerCase()!=='false'),sheets:setup.sheets};
}
