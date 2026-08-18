/*
 * Takbai Internal Supervision API - Google Apps Script
 * Sheets: 1e5530q7hRUdR6pNIx6tAv4JjNKadFibg7GE5ohuq4xU
 * Drive : 1wVAG7EETgBcv5ftOFLLzdX-wbDEK95Dw
 *
 * Non-destructive setup creates every sheet required by the website.
 * Teacher directory is stored in Teachers and can be managed by Admin.
 */
const SPREADSHEET_ID='1e5530q7hRUdR6pNIx6tAv4JjNKadFibg7GE5ohuq4xU';
const DRIVE_FOLDER_ID='1wVAG7EETgBcv5ftOFLLzdX-wbDEK95Dw';
const APP_NAME='Takbai Internal Supervision API';
const VERSION='2026-08-18-sheets-complete-v4';
const SESSION_TTL=21600;

const TEACHER_SEED=[
 ['นางสาว','วัลภา','มะเอียด'],['ว่าที่ ร.อ.','สามารถ','นุธรรมโชติ'],['นางสาว','ซูเลียนา','บือซา'],['นางสาว','นาซีรา','หะยีนอ'],
 ['นาง','ลออ','คงเจริญ'],['นางสาว','นูรุลอัยน์','มีซอ'],['นาย','อภิชาติ','รักเถาว์'],['นาย','จินดา','คงเจริญ'],
 ['นางสาว','มาห์มูด๊ะ','มอลอ'],['นาย','ภูริวัฒน์','อมรชาติ'],['นางสาว','ปราณี','บัวแก้ว'],['นาง','พเยาว์','ประสิทธิชัยวุฒิ'],
 ['นาง','นภาเพ็ญ','ทองจินดา'],['นาง','สาลินี','อารอมะ'],['นางสาว','ฮาฟีดะห์','สะนิบากอ'],['นาง','นภัสลักษณ์','พจน์เพริศ'],
 ['นาย','วัฒนา','จินดาเพ็ชร'],['นาง','นุชนาฏ','เข็มทอง'],['นางสาว','เกณิกา','เมฆเจริญวิวัฒนา'],['นางสาว','จีรวรรณ','ทองชาติ'],
 ['นาง','อรอุมา','แววภักดี'],['นางสาว','ซากีหย๊ะ','เด็งจิ'],['นาย','ธนภัทร์','ปั้นแก้ว'],['นางสาว','กุลธิดา','ศรีดำ'],
 ['นาย','อารีฟิน','มูซอ'],['นางสาว','ซูไมย๊ะ','บูกุ'],['นางสาว','ฮัสมารีซา','ยะโก๊ะ'],['นาย','มูหัมมัด','แวยุนุ'],
 ['นางสาว','สูรียานา','สือนิ'],['นางสาว','พรพิมล','สุขศรีแดง'],['นางสาว','สุลนา','เสาร์พูล'],['นาย','สุวัฒน์','จีนขุ้ย'],
 ['นางสาว','สมฤดี','แดงเตี้ย'],['นาย','แวอิสมาแอ','บินแวอูมา']
];
const AREA_SEED=['ภาษาไทย','คณิตศาสตร์','วิทยาศาสตร์และเทคโนโลยี','สังคมศึกษา ศาสนาและวัฒนธรรม','สุขศึกษาและพลศึกษา','ศิลปะ ดนตรี นาฏศิลป์','การงานอาชีพ','ภาษาต่างประเทศ','อื่นๆ'];

function doGet(e){const p=(e&&e.parameter)||{};try{return output_(routeGet_(p),p.callback);}catch(err){return output_({success:false,error:errorMessage_(err)},p.callback);}}
function doPost(e){try{return output_(routePost_(parsePost_(e)),null);}catch(err){return output_({success:false,error:errorMessage_(err)},null);}}
function output_(obj,callback){const json=JSON.stringify(obj==null?{}:obj);if(callback&&/^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(String(callback)))return ContentService.createTextOutput(String(callback)+'('+json+');').setMimeType(ContentService.MimeType.JAVASCRIPT);return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);}
function parsePost_(e){if(!e)return{};if(e.parameter&&Object.keys(e.parameter).length)return Object.assign({},e.parameter);if(e.postData&&e.postData.contents){try{return JSON.parse(String(e.postData.contents));}catch(_){return{};}}return{};}

function routeGet_(p){const a=String(p.action||'health');switch(a){
 case'health':case'debug':return health_();
 case'setup':return setup_();
 case'seedUsers':return seedUsers_();
 case'login':return login_(p);
 case'getBookings':return getSheetObjects_('Booking',bookingHeaders_());
 case'getFiles':return getSheetObjects_('Files',fileHeaders_());
 case'getEvaluations':return getSheetObjects_('Supervision',evaluationHeaders_());
 case'getUsers':return getUsers_(p.authToken);
 case'getTeachers':return getTeachers_();
 case'getLearningAreas':return getLearningAreas_();
 case'getDashboard':return dashboard_();
 default:return{success:false,error:'Unknown GET action: '+a};}}
function routePost_(d){const a=String(d.action||'');switch(a){
 case'health':return health_();case'setup':return setup_();case'seedUsers':return seedUsers_();case'login':return login_(d);
 case'addBooking':return addBooking_(d);case'updateBookingStatus':return updateById_('Booking',d.id,{status:d.status});case'deleteBooking':return deleteById_('Booking',d.id);case'updateBooking':return updateById_('Booking',d.id,d);
 case'addFile':return addFile_(d);case'updateFileStatus':return updateById_('Files',d.id,{status:d.status});case'deleteFile':return deleteById_('Files',d.id);case'updateFile':return updateById_('Files',d.id,d);case'uploadFileToDrive':return uploadFile_(d);
 case'addEvaluation':return addEvaluation_(d);case'updateEvaluation':return updateById_('Supervision',d.id,d);case'deleteEvaluation':return deleteById_('Supervision',d.id);
 case'addUser':case'updateUser':case'deleteUser':case'addTeacher':case'updateTeacher':case'deleteTeacher':return adminWrite_(a,d);
 default:return{success:false,error:'Unknown POST action: '+a};}}

function allSheetDefs_(){return{
 Booking:bookingHeaders_(),Files:fileHeaders_(),Supervision:evaluationHeaders_(),Users:userHeaders_(),Teachers:teacherHeaders_(),LearningAreas:areaHeaders_(),AuditLog:auditHeaders_(),SystemConfig:configHeaders_()
};}
function health_(){const r={success:true,service:APP_NAME,version:VERSION,spreadsheetId:SPREADSHEET_ID,driveFolderId:DRIVE_FOLDER_ID,timestamp:new Date().toISOString()};try{const ss=SpreadsheetApp.openById(SPREADSHEET_ID);r.spreadsheetName=ss.getName();r.spreadsheetAccessible=true;const setup=setup_();r.sheets=setup.sheets;}catch(e){r.spreadsheetAccessible=false;r.spreadsheetError=errorMessage_(e);}try{const f=DriveApp.getFolderById(DRIVE_FOLDER_ID);r.driveFolderName=f.getName();r.driveAccessible=true;}catch(e){r.driveAccessible=false;r.driveError=errorMessage_(e);}return r;}
function bookingHeaders_(){return['Timestamp','Date','Time','Teacher Name','Department','Period','Subject Name','Subject Code','Class Level','Room','Status','ID'];}
function fileHeaders_(){return['Timestamp','Teacher Name','File Type','File URL/Link','Drive File ID','File Name','Status','ID'];}
function evaluationHeaders_(){return['Timestamp','Teacher Name','Supervision Date','Strengths','Improvements','Suggestions','Summary','ID'];}
function userHeaders_(){return['Username','Password','Role','FullName','Department','Active','ID'];}
function teacherHeaders_(){return['ID','Prefix','FirstName','LastName','FullName','Active','UpdatedAt'];}
function areaHeaders_(){return['ID','Name','Active','UpdatedAt'];}
function auditHeaders_(){return['Timestamp','Username','Action','Entity','EntityID','Details'];}
function configHeaders_(){return['Key','Value','UpdatedAt'];}
function headersFor_(n){const d=allSheetDefs_();if(!d[n])throw new Error('Unknown sheet: '+n);return d[n];}
function ensureSheet_(name,headers){const ss=SpreadsheetApp.openById(SPREADSHEET_ID);let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);if(sh.getLastRow()===0){sh.getRange(1,1,1,headers.length).setValues([headers]);}else{const current=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),headers.length)).getValues()[0];const missing=headers.some((h,i)=>String(current[i]||'')!==h);if(missing)sh.getRange(1,1,1,headers.length).setValues([headers]);}sh.setFrozenRows(1);return sh;}
function setup_(){const defs=allSheetDefs_(),ss=SpreadsheetApp.openById(SPREADSHEET_ID),created=[];Object.keys(defs).forEach(n=>{const before=ss.getSheetByName(n);ensureSheet_(n,defs[n]);if(!before)created.push(n);});seedTeachers_();seedAreas_();seedAdmin_();return{success:true,message:'ฐานข้อมูลพร้อมใช้งาน',spreadsheetId:SPREADSHEET_ID,sheets:Object.keys(defs),created:created};}
function seedAdmin_(){const sh=ensureSheet_('Users',userHeaders_());if(sh.getLastRow()<2)sh.appendRow(['admin','Admin@123','admin','ผู้ดูแลระบบ','-',true,'u_admin']);}
function seedUsers_(){seedAdmin_();return{success:true,message:'Admin user ready'};}
function seedTeachers_(){const sh=ensureSheet_('Teachers',teacherHeaders_());if(sh.getLastRow()>=2)return;TEACHER_SEED.forEach((t,i)=>{const id='t_'+String(i+1).padStart(3,'0');sh.appendRow([id,t[0],t[1],t[2],t.join(' '),true,new Date()]);});}
function seedAreas_(){const sh=ensureSheet_('LearningAreas',areaHeaders_());if(sh.getLastRow()>=2)return;AREA_SEED.forEach((n,i)=>sh.appendRow(['a_'+String(i+1).padStart(2,'0'),n,true,new Date()]));}

function key_(h){const m={'Timestamp':'timestamp','Date':'date','Time':'time','Teacher Name':'teacherName','Department':'department','Period':'period','Subject Name':'subjectName','Subject Code':'subjectCode','Class Level':'classLevel','Room':'room','Status':'status','ID':'id','File Type':'fileType','File URL/Link':'fileUrl','Drive File ID':'driveFileId','File Name':'fileName','Supervision Date':'supervisionDate','Strengths':'strengths','Improvements':'improvements','Suggestions':'suggestions','Summary':'summary','Username':'username','Password':'password','Role':'role','FullName':'fullName','Active':'active','Prefix':'prefix','FirstName':'firstName','LastName':'lastName','UpdatedAt':'updatedAt','Name':'name','Key':'key','Value':'value'};return m[h]||h;}
function normalizeValue_(v){return v instanceof Date?v.toISOString():v;}
function getSheetObjects_(name,headers){try{const sh=ensureSheet_(name,headers),lr=sh.getLastRow();if(lr<2)return{success:true,data:[]};const vals=sh.getRange(1,1,lr,headers.length).getValues();return{success:true,data:vals.slice(1).map(r=>{const o={};headers.forEach((h,i)=>o[key_(h)]=normalizeValue_(r[i]));return o;})};}catch(e){return{success:false,error:errorMessage_(e),data:[]};}}
function getUsers_(token){const r=getSheetObjects_('Users',userHeaders_());if(!r.success)return r;const auth=requireAdmin_(token);if(auth.ok)return r;return{success:true,data:r.data.map(u=>({id:u.id,username:u.username,role:u.role,fullName:u.fullName,department:u.department,active:u.active}))};}
function getTeachers_(){const r=getSheetObjects_('Teachers',teacherHeaders_());return{success:r.success,data:(r.data||[]).filter(x=>String(x.active).toLowerCase()!=='false')};}
function getLearningAreas_(){const r=getSheetObjects_('LearningAreas',areaHeaders_());return{success:r.success,data:(r.data||[]).filter(x=>String(x.active).toLowerCase()!=='false')};}
function id_(){return Utilities.getUuid();}

function addBooking_(d){const sh=ensureSheet_('Booking',bookingHeaders_()),id=d.id||id_();sh.appendRow([new Date(),d.date||'',d.time||'',d.teacherName||'',d.department||'',d.period||'',d.subjectName||'',d.subjectCode||'',d.classLevel||'',d.room||'',d.status||'รอดำเนินการ',id]);audit_(d,'add','Booking',id);return{success:true,id:id};}
function addFile_(d){const sh=ensureSheet_('Files',fileHeaders_()),id=d.id||id_();sh.appendRow([new Date(),d.teacherName||'',d.fileType||'',d.fileUrl||'',d.driveFileId||'',d.fileName||'',d.status||'รอตรวจสอบ',id]);audit_(d,'add','Files',id);return{success:true,id:id};}
function addEvaluation_(d){const sh=ensureSheet_('Supervision',evaluationHeaders_()),id=d.id||id_();sh.appendRow([new Date(),d.teacherName||'',d.supervisionDate||'',d.strengths||'',d.improvements||'',d.suggestions||'',d.summary||'',id]);audit_(d,'add','Supervision',id);return{success:true,id:id};}

function adminWrite_(action,d){const auth=requireAdmin_(d.authToken);if(!auth.ok)return auth.result;if(action==='addUser')return addUser_(d);if(action==='updateUser')return updateUser_(d);if(action==='deleteUser')return deleteUser_(d);if(action==='addTeacher')return addTeacher_(d);if(action==='updateTeacher')return updateTeacher_(d);if(action==='deleteTeacher')return deleteTeacher_(d);}
function addUser_(d){const username=String(d.username||'').trim(),password=String(d.password||'');if(!username||!password)return{success:false,error:'กรุณาระบุชื่อผู้ใช้และรหัสผ่าน'};const sh=ensureSheet_('Users',userHeaders_()),lr=sh.getLastRow(),rows=lr>1?sh.getRange(2,1,lr-1,7).getValues():[];if(rows.some(r=>String(r[0]).trim().toLowerCase()===username.toLowerCase()))return{success:false,error:'ชื่อผู้ใช้นี้มีอยู่แล้ว'};const id=d.id||id_(),role=String(d.role||'user')==='admin'?'admin':'user',active=d.active===undefined||String(d.active).toLowerCase()!=='false';sh.appendRow([username,password,role,String(d.fullName||''),String(d.department||'-'),active,id]);audit_(d,'add','Users',id);return{success:true,id:id};}
function findRow_(sh,id){if(!id||sh.getLastRow()<2)return-1;const col=sh.getLastColumn(),vals=sh.getRange(2,col,sh.getLastRow()-1,1).getValues();for(let i=0;i<vals.length;i++)if(String(vals[i][0])===String(id))return i+2;return-1;}
function countAdmins_(sh){if(sh.getLastRow()<2)return 0;return sh.getRange(2,3,sh.getLastRow()-1,1).getValues().filter(r=>String(r[0])==='admin').length;}
function updateUser_(d){const sh=ensureSheet_('Users',userHeaders_()),row=findRow_(sh,d.id);if(row<0)return{success:false,error:'ไม่พบผู้ใช้'};const old=sh.getRange(row,1,1,7).getValues()[0],username=d.username===undefined?String(old[0]):String(d.username).trim();if(!username)return{success:false,error:'ชื่อผู้ใช้ห้ามว่าง'};const rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,7).getValues():[];if(rows.some((r,i)=>i+2!==row&&String(r[0]).trim().toLowerCase()===username.toLowerCase()))return{success:false,error:'ชื่อผู้ใช้นี้มีอยู่แล้ว'};const role=d.role===undefined?String(old[2]):String(d.role)==='admin'?'admin':'user',active=d.active===undefined?old[5]:String(d.active).toLowerCase()!=='false';if(String(old[2])==='admin'&&role!=='admin'&&countAdmins_(sh)<=1)return{success:false,error:'ต้องมีผู้ดูแลระบบอย่างน้อย 1 คน'};const values=[username,d.password===undefined||String(d.password)===''?old[1]:String(d.password),role,d.fullName===undefined?old[3]:String(d.fullName),d.department===undefined?old[4]:String(d.department),active,d.id];sh.getRange(row,1,1,7).setValues([values]);audit_(d,'update','Users',d.id);return{success:true,id:d.id};}
function deleteUser_(d){const sh=ensureSheet_('Users',userHeaders_()),row=findRow_(sh,d.id);if(row<0)return{success:false,error:'ไม่พบผู้ใช้'};const target=sh.getRange(row,1,1,7).getValues()[0],auth=requireAdmin_(d.authToken);if(String(target[6])===String(auth.user.id))return{success:false,error:'ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่'};if(String(target[2])==='admin'&&countAdmins_(sh)<=1)return{success:false,error:'ต้องมีผู้ดูแลระบบอย่างน้อย 1 คน'};sh.deleteRow(row);audit_(d,'delete','Users',d.id);return{success:true,id:d.id};}

function addTeacher_(d){const prefix=String(d.prefix||'').trim(),first=String(d.firstName||'').trim(),last=String(d.lastName||'').trim();if(!prefix||!first||!last)return{success:false,error:'กรุณากรอกคำนำหน้า ชื่อ และนามสกุล'};const sh=ensureSheet_('Teachers',teacherHeaders_()),lr=sh.getLastRow(),full=[prefix,first,last].join(' '),rows=lr>1?sh.getRange(2,1,lr-1,7).getValues():[];if(rows.some(r=>String(r[4]).trim()===full))return{success:false,error:'มีรายชื่อนี้อยู่แล้ว'};const id=d.id||id_();sh.appendRow([id,prefix,first,last,full,d.active===undefined||String(d.active).toLowerCase()!=='false',new Date()]);audit_(d,'add','Teachers',id);return{success:true,id:id,fullName:full};}
function updateTeacher_(d){const sh=ensureSheet_('Teachers',teacherHeaders_()),row=findRowTeacher_(sh,d.id);if(row<0)return{success:false,error:'ไม่พบรายชื่อครู'};const old=sh.getRange(row,1,1,7).getValues()[0],prefix=d.prefix===undefined?old[1]:String(d.prefix).trim(),first=d.firstName===undefined?old[2]:String(d.firstName).trim(),last=d.lastName===undefined?old[3]:String(d.lastName).trim(),full=[prefix,first,last].join(' '),active=d.active===undefined?old[5]:String(d.active).toLowerCase()!=='false';if(!prefix||!first||!last)return{success:false,error:'ข้อมูลชื่อไม่ครบ'};const rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,7).getValues():[];if(rows.some((r,i)=>i+2!==row&&String(r[4]).trim()===full))return{success:false,error:'มีรายชื่อนี้อยู่แล้ว'};sh.getRange(row,1,1,7).setValues([[d.id,prefix,first,last,full,active,new Date()]]);audit_(d,'update','Teachers',d.id);return{success:true,id:d.id,fullName:full};}
function findRowTeacher_(sh,id){if(!id||sh.getLastRow()<2)return-1;const vals=sh.getRange(2,1,sh.getLastRow()-1,1).getValues();for(let i=0;i<vals.length;i++)if(String(vals[i][0])===String(id))return i+2;return-1;}
function deleteTeacher_(d){const sh=ensureSheet_('Teachers',teacherHeaders_()),row=findRowTeacher_(sh,d.id);if(row<0)return{success:false,error:'ไม่พบรายชื่อครู'};const target=sh.getRange(row,1,1,7).getValues()[0];if(String(target[5]).toLowerCase()==='false')return{success:false,error:'รายชื่อนี้ถูกปิดใช้งานอยู่แล้ว'};sh.deleteRow(row);audit_(d,'delete','Teachers',d.id);return{success:true,id:d.id};}

function login_(d){const username=String(d.username||'').trim(),password=String(d.password||'');if(!username||!password)return{success:false,message:'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'};const r=getSheetObjects_('Users',userHeaders_());if(!r.success)return r;const u=r.data.find(x=>String(x.username)===username&&String(x.password)===password);if(!u)return{success:false,message:'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'};if(String(u.active).toLowerCase()==='false')return{success:false,message:'บัญชีนี้ถูกปิดการใช้งาน'};const token=Utilities.getUuid()+'-'+Utilities.getUuid();CacheService.getScriptCache().put('auth_'+token,JSON.stringify({id:u.id,username:u.username,role:u.role,fullName:u.fullName,department:u.department}),SESSION_TTL);return{success:true,user:{id:u.id,username:u.username,role:u.role,fullName:u.fullName,department:u.department,authToken:token}};}
function requireAdmin_(token){if(!token)return{ok:false,result:{success:false,error:'ต้องเข้าสู่ระบบผู้ดูแลก่อน'}};const raw=CacheService.getScriptCache().get('auth_'+String(token));if(!raw)return{ok:false,result:{success:false,error:'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'}};try{const u=JSON.parse(raw);if(u.role!=='admin')return{ok:false,result:{success:false,error:'ไม่มีสิทธิ์ผู้ดูแลระบบ'}};return{ok:true,user:u};}catch(_){return{ok:false,result:{success:false,error:'เซสชันไม่ถูกต้อง'}};}}

function updateById_(name,id,d){if(!id)return{success:false,error:'ไม่พบ ID ของรายการ'};const headers=headersFor_(name),sh=ensureSheet_(name,headers),row=findRow_(sh,id);if(row<0)return{success:false,error:'ไม่พบรายการ ID: '+id};const map={'Date':'date','Time':'time','Teacher Name':'teacherName','Department':'department','Period':'period','Subject Name':'subjectName','Subject Code':'subjectCode','Class Level':'classLevel','Room':'room','Status':'status','File Type':'fileType','File URL/Link':'fileUrl','Drive File ID':'driveFileId','File Name':'fileName','Supervision Date':'supervisionDate','Strengths':'strengths','Improvements':'improvements','Suggestions':'suggestions','Summary':'summary'};headers.forEach((h,i)=>{const k=map[h];if(k&&d[k]!==undefined)sh.getRange(row,i+1).setValue(d[k]);});audit_(d,'update',name,id);return{success:true,id:id};}
function deleteById_(name,id){const sh=ensureSheet_(name,headersFor_(name)),row=findRow_(sh,id);if(row<0)return{success:false,error:'ไม่พบรายการ'};sh.deleteRow(row);return{success:true,id:id};}
function uploadFile_(d){try{if(!d.fileData||!d.fileName)return{success:false,error:'ข้อมูลไฟล์ไม่ครบ'};const folder=DriveApp.getFolderById(DRIVE_FOLDER_ID),bytes=Utilities.base64Decode(String(d.fileData)),blob=Utilities.newBlob(bytes,d.mimeType||'application/octet-stream',d.fileName),file=folder.createFile(blob);try{file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);}catch(_){}return{success:true,fileId:file.getId(),fileUrl:'https://drive.google.com/file/d/'+file.getId()+'/view',directUrl:'https://drive.google.com/uc?export=view&id='+file.getId(),fileName:file.getName()};}catch(e){return{success:false,error:errorMessage_(e)};}}
function dashboard_(){const b=getSheetObjects_('Booking',bookingHeaders_()).data||[],f=getSheetObjects_('Files',fileHeaders_()).data||[],e=getSheetObjects_('Supervision',evaluationHeaders_()).data||[],t=getSheetObjects_('Teachers',teacherHeaders_()).data||[],u=getSheetObjects_('Users',userHeaders_()).data||[];return{success:true,stats:{totalBookings:b.length,completed:b.filter(x=>x.status==='นิเทศแล้ว').length,pending:b.filter(x=>x.status==='รอดำเนินการ').length,confirmed:b.filter(x=>x.status==='ยืนยันแล้ว').length,totalFiles:f.length,totalEvaluations:e.length,totalTeachers:t.length,totalUsers:u.length}};}
function auditHeaders_(){return['Timestamp','Username','Action','Entity','EntityID','Details'];}
function configHeaders_(){return['Key','Value','UpdatedAt'];}
function audit_(d,action,entity,id){try{const auth=d&&d.authToken?requireAdmin_(d.authToken):null;const username=auth&&auth.ok?auth.user.username:'';ensureSheet_('AuditLog',auditHeaders_()).appendRow([new Date(),username,action,entity,id,JSON.stringify({id:id})]);}catch(_){} }
function errorMessage_(e){return e&&e.message?String(e.message):String(e);}
