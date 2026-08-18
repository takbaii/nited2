/* Takbai Internal Supervision - Apps Script backend */
const SPREADSHEET_ID='1e5530q7hRUdR6pNIx6tAv4JjNKadFibg7GE5ohuq4xU';
const DRIVE_FOLDER_ID='1wVAG7EETgBcv5ftOFLLzdX-wbDEK95Dw';

function doGet(e){
  e=e||{parameter:{}};
  const p=e.parameter||{};
  try{
    const result=routeGet_(p);
    return output_(result,p.callback);
  }catch(err){return output_({success:false,error:String(err&&err.message||err)},p.callback);}
}
function doPost(e){
  try{
    let d={};
    if(e&&e.parameter&&Object.keys(e.parameter).length){d=Object.assign({},e.parameter);}
    else if(e&&e.postData&&e.postData.contents){d=JSON.parse(e.postData.contents);}
    const result=routePost_(d);
    return output_(result,null);
  }catch(err){return output_({success:false,error:String(err&&err.message||err)},null);}
}
function output_(obj,callback){
  const json=JSON.stringify(obj);
  if(callback && /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(callback))
    return ContentService.createTextOutput(callback+'('+json+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
function routeGet_(p){
  switch(String(p.action||'')){
    case 'health': case 'debug': return {success:true,service:'Takbai Internal Supervision API',spreadsheetId:SPREADSHEET_ID,driveFolderId:DRIVE_FOLDER_ID};
    case 'login': return login_(p);
    case 'getBookings': return getSheetObjects_('Booking',bookingHeaders_());
    case 'getFiles': return getSheetObjects_('Files',fileHeaders_());
    case 'getEvaluations': return getSheetObjects_('Supervision',evaluationHeaders_());
    case 'getUsers': return getSheetObjects_('Users',userHeaders_());
    case 'getDashboard': return dashboard_();
    case 'setup': return setup_();
    case 'seedUsers': return seedUsers_();
    default: return {success:true,message:'Takbai API is running'};
  }
}
function routePost_(d){
  switch(String(d.action||'')){
    case 'login': return login_(d);
    case 'addBooking': return addBooking_(d);
    case 'updateBookingStatus': return updateById_('Booking',d.id,{Status:d.status});
    case 'deleteBooking': return deleteById_('Booking',d.id);
    case 'updateBooking': return updateById_('Booking',d.id,d);
    case 'addFile': return addFile_(d);
    case 'updateFileStatus': return updateById_('Files',d.id,{Status:d.status});
    case 'deleteFile': return deleteById_('Files',d.id);
    case 'updateFile': return updateById_('Files',d.id,d);
    case 'uploadFileToDrive': return uploadFile_(d);
    case 'addEvaluation': return addEvaluation_(d);
    case 'updateEvaluation': return updateById_('Supervision',d.id,d);
    case 'deleteEvaluation': return deleteById_('Supervision',d.id);
    case 'addUser': return addUser_(d);
    case 'updateUser': return updateById_('Users',d.id,d);
    case 'deleteUser': return deleteById_('Users',d.id);
    default:return {success:false,error:'Unknown action: '+d.action};
  }
}
function bookingHeaders_(){return ['Timestamp','Date','Time','Teacher Name','Department','Period','Subject Name','Subject Code','Class Level','Room','Status','ID'];}
function fileHeaders_(){return ['Timestamp','Teacher Name','File Type','File URL/Link','Drive File ID','File Name','Status','ID'];}
function evaluationHeaders_(){return ['Timestamp','Teacher Name','Supervision Date','Strengths','Improvements','Suggestions','Summary','ID'];}
function userHeaders_(){return ['Username','Password','Role','FullName','Department','Active','ID'];}
function ensureSheet_(name,headers){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID); let sh=ss.getSheetByName(name);
  if(!sh){sh=ss.insertSheet(name);sh.getRange(1,1,1,headers.length).setValues([headers]);}
  return sh;
}
function getSheetObjects_(name,headers){
  try{
    const sh=ensureSheet_(name,headers), values=sh.getDataRange().getValues();
    if(values.length<2)return {success:true,data:[]};
    return {success:true,data:values.slice(1).map(r=>{const o={};headers.forEach((h,i)=>o[key_(h)]=r[i]);return o;})};
  }catch(err){return {success:false,error:err.message,data:[]};}
}
function key_(h){return {'Timestamp':'timestamp','Date':'date','Time':'time','Teacher Name':'teacherName','Department':'department','Period':'period','Subject Name':'subjectName','Subject Code':'subjectCode','Class Level':'classLevel','Room':'room','Status':'status','ID':'id','File Type':'fileType','File URL/Link':'fileUrl','Drive File ID':'driveFileId','File Name':'fileName','Supervision Date':'supervisionDate','Strengths':'strengths','Improvements':'improvements','Suggestions':'suggestions','Summary':'summary','Username':'username','Password':'password','Role':'role','FullName':'fullName','Active':'active'}[h]||h;}
function id_(){return Utilities.getUuid();}
function addBooking_(d){const sh=ensureSheet_('Booking',bookingHeaders_());const id=d.id||id_();sh.appendRow([new Date(),d.date||'',d.time||'',d.teacherName||'',d.department||'',d.period||'',d.subjectName||'',d.subjectCode||'',d.classLevel||'',d.room||'',d.status||'รอดำเนินการ',id]);return {success:true,id:id};}
function addFile_(d){const sh=ensureSheet_('Files',fileHeaders_());const id=d.id||id_();sh.appendRow([new Date(),d.teacherName||'',d.fileType||'',d.fileUrl||'',d.driveFileId||'',d.fileName||'',d.status||'รอตรวจสอบ',id]);return {success:true,id:id};}
function addEvaluation_(d){const sh=ensureSheet_('Supervision',evaluationHeaders_());const id=d.id||id_();sh.appendRow([new Date(),d.teacherName||'',d.supervisionDate||'',d.strengths||'',d.improvements||'',d.suggestions||'',d.summary||'',id]);return {success:true,id:id};}
function addUser_(d){const sh=ensureSheet_('Users',userHeaders_());const rows=sh.getDataRange().getValues();if(rows.slice(1).some(r=>String(r[0])===String(d.username)))return {success:false,error:'ชื่อผู้ใช้นี้มีอยู่แล้ว'};const id=d.id||id_();sh.appendRow([d.username||'',d.password||'',d.role||'user',d.fullName||'',d.department||'-',d.active===undefined?true:d.active,id]);return {success:true,id:id};}
function findRow_(sh,id){const v=sh.getDataRange().getValues();for(let i=1;i<v.length;i++)if(String(v[i][v[0].length-1])===String(id))return i+1;return -1;}
function updateById_(name,id,d){const headers=name==='Booking'?bookingHeaders_():name==='Files'?fileHeaders_():name==='Supervision'?evaluationHeaders_():userHeaders_();const sh=ensureSheet_(name,headers);const row=findRow_(sh,id);if(row<0)return {success:false,error:'ไม่พบรายการ'};const map={Timestamp:'timestamp',Date:'date',Time:'time','Teacher Name':'teacherName',Department:'department',Period:'period','Subject Name':'subjectName','Subject Code':'subjectCode','Class Level':'classLevel',Room:'room',Status:'status','File Type':'fileType','File URL/Link':'fileUrl','Drive File ID':'driveFileId','File Name':'fileName','Supervision Date':'supervisionDate',Strengths:'strengths',Improvements:'improvements',Suggestions:'suggestions',Summary:'summary',Username:'username',Password:'password',Role:'role',FullName:'fullName',Active:'active'};headers.forEach((h,i)=>{const k=map[h];if(k&&d[k]!==undefined&&k!=='timestamp')sh.getRange(row,i+1).setValue(d[k]);});return {success:true};}
function deleteById_(name,id){const sh=ensureSheet_(name,name==='Booking'?bookingHeaders_():name==='Files'?fileHeaders_():name==='Supervision'?evaluationHeaders_():userHeaders_());const row=findRow_(sh,id);if(row<0)return {success:false,error:'ไม่พบรายการ'};if(name==='Users'&&String(sh.getRange(row,1).getValue())==='admin')return {success:false,error:'ไม่สามารถลบผู้ดูแลระบบหลักได้'};sh.deleteRow(row);return {success:true};}
function login_(d){const r=getSheetObjects_('Users',userHeaders_());if(!r.success)return r;const u=r.data.find(x=>String(x.username)===String(d.username||'')&&String(x.password)===String(d.password||''));if(!u)return {success:false,message:'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'};if(String(u.active).toLowerCase()==='false')return {success:false,message:'บัญชีนี้ถูกปิดการใช้งาน'};return {success:true,user:{id:u.id,username:u.username,role:u.role,fullName:u.fullName,department:u.department}};}
function uploadFile_(d){try{if(!d.fileData||!d.fileName)return {success:false,error:'ข้อมูลไฟล์ไม่ครบ'};const folder=DriveApp.getFolderById(DRIVE_FOLDER_ID);const blob=Utilities.newBlob(Utilities.base64Decode(d.fileData),d.mimeType||MimeType.PLAIN_TEXT,d.fileName);const f=folder.createFile(blob);try{f.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);}catch(_){ }return {success:true,fileId:f.getId(),fileUrl:'https://drive.google.com/file/d/'+f.getId()+'/view',directUrl:'https://drive.google.com/uc?export=view&id='+f.getId(),fileName:f.getName()};}catch(err){return {success:false,error:err.message};}}
function dashboard_(){const b=getSheetObjects_('Booking',bookingHeaders_()).data||[],f=getSheetObjects_('Files',fileHeaders_()).data||[],e=getSheetObjects_('Supervision',evaluationHeaders_()).data||[];return {success:true,stats:{totalBookings:b.length,completed:b.filter(x=>x.status==='นิเทศแล้ว').length,pending:b.filter(x=>x.status==='รอดำเนินการ').length,confirmed:b.filter(x=>x.status==='ยืนยันแล้ว').length,totalFiles:f.length,totalEvaluations:e.length}};}
function setup_(){['Booking','Files','Supervision','Users'].forEach(n=>ensureSheet_(n,n==='Booking'?bookingHeaders_():n==='Files'?fileHeaders_():n==='Supervision'?evaluationHeaders_():userHeaders_()));const sh=ensureSheet_('Users',userHeaders_());if(sh.getLastRow()<2)sh.appendRow(['admin','Admin@123','admin','ผู้ดูแลระบบ','-',true,'u_admin']);return {success:true,message:'Setup complete'};}
function seedUsers_(){const sh=ensureSheet_('Users',userHeaders_());if(sh.getLastRow()<2)sh.appendRow(['admin','Admin@123','admin','ผู้ดูแลระบบ','-',true,'u_admin']);return {success:true,message:'Users ready'};}
