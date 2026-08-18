/* API compatibility overrides. Filename is intentionally late in the project so this route is the final declaration. */
function routeGet_(p){
  const a=String(p.action||'health');
  switch(a){
    case'health':case'debug':return health_();
    case'setup':return setup_();
    case'seedUsers':return seedUsers_();
    case'login':return login_(p);
    case'getBookings':return getSheetObjects_('Booking',bookingHeaders_());
    case'getFiles':return getSheetObjects_('Files',fileHeaders_());
    case'getEvaluations':return getSheetObjects_('Supervision',evaluationHeaders_());
    case'getUsers':return getUsers_(p.authToken);
    case'getTeachers':return getTeachersForRequest_(p.authToken);
    case'getLearningAreas':return getLearningAreas_();
    case'getDashboard':return dashboard_();
    default:return{success:false,error:'Unknown GET action: '+a};
  }
}
function getTeachersForRequest_(token){
  const r=getSheetObjects_('Teachers',teacherHeaders_());
  if(!r.success)return r;
  const auth=token?requireAdmin_(token):{ok:false};
  return{success:true,data:auth.ok?(r.data||[]):(r.data||[]).filter(x=>String(x.active).toLowerCase()!=='false')};
}
