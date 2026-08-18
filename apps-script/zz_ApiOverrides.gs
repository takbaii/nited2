/*
 * Takbai Internal Supervision - API overrides.
 * This file is intentionally last and makes the Supervision workflow compatible
 * with both the older Code.gs and the v8 supervision backend.
 */

const SUPERVISION_HEADERS_V9_ = [
  'Timestamp','Supervision Type','Supervisor Name','Teacher Name','Subject Group',
  'Grade Level','Period','Teaching Date','Topic','Teaching Techniques','Scores JSON',
  'Total Score','Percent','Quality Level','Strengths','Improvements','Suggestions',
  'Evidence File URL','Evidence Drive File ID','Evidence File Name','Status',
  'ReviewedAt','ReviewedBy','ReviewComment','ID'
];
const SUPERVISION_DETAIL_HEADERS_V9_ = [
  'Timestamp','Supervision ID','Question No','Category','Item','Score',
  'Teacher Name','Supervisor Name','Teaching Date','Status'
];
const SUPERVISION_CRITERIA_V9_ = [
  ['ด้านการเตรียมการสอน',['จัดทำแผนการเรียนรู้ครบองค์ประกอบ','จัดเตรียมวัสดุ-อุปกรณ์ สื่อ นวัตกรรม กิจกรรมตามแผนฯ']],
  ['ด้านการจัดกิจกรรมการเรียนรู้',['มีวิธีการนำเข้าสู่บทเรียนที่น่าสนใจ แจ้งวัตถุประสงค์การเรียนรู้','ใช้เทคนิคการสอนที่หลากหลาย เน้นผู้เรียนเป็นสำคัญ','จัดกิจกรรมที่ส่งเสริมให้ค้นคว้าหาคำตอบด้วยตนเอง','จัดกิจกรรมที่ตอบสนองความแตกต่างระหว่างบุคคล','จัดกิจกรรมที่เน้นกระบวนการคิด (วิเคราะห์ สังเคราะห์ สร้างสรรค์)','จัดกิจกรรมให้ผู้เรียนมีส่วนร่วมและแสดงความคิดเห็นเสรี','มีการสอดแทรกคุณธรรม จริยธรรมและคุณลักษณะอันพึงประสงค์','มีการเสริมแรงเมื่อนักเรียนปฏิบัติหรือตอบถูกต้อง','มีการสรุปประเด็น สาระ เนื้อหาในกิจกรรมการเรียนรู้','มอบหมายงานเหมาะสมตามศักยภาพผู้เรียนและเอาใจใส่ดูแล','ใช้เวลาสอนเหมาะสมกับเวลาที่กำหนด']],
  ['ด้านสื่อ นวัตกรรม แหล่งเรียนรู้',['ใช้สื่อที่เหมาะสมกับกิจกรรมและศักยภาพของผู้เรียน','ใช้สื่อ แหล่งการเรียนรู้อย่างหลากหลาย']],
  ['ด้านการวัดและประเมินผล',['สอดคล้องและครอบคลุมจุดประสงค์','ประเมินผลอย่างหลากหลายและครบทั้ง 3 ด้าน (K.P.A.)']],
  ['ด้านสภาพทั่วไป',['การตรงต่อเวลา','การควบคุมความเป็นระเบียบในชั้นเรียน','การจัดบรรยากาศในชั้นเรียน (การจัดห้อง, ความสะอาด)']],
  ['ด้านบุคลิกภาพ',['แต่งกายสุภาพ สะอาดเรียบร้อย เหมาะสมกับกาลเทศะ','ใช้ถ้อยคำสุภาพ ถูกต้อง ระดับเสียงดังชัดเจน','ยิ้มแย้มแจ่มใส และควบคุมอารมณ์ในระหว่างสอนได้ดี','เคลื่อนไหวและแสดงท่าทางในการสอนอย่างมีจุดหมาย','แสดงความรัก ความเมตตา กรุณา เอื้ออาทรต่อศิษย์']]
];

function routeGet_(p){
  const a=String(p.action||'');
  switch(a){
    case'health':case'debug':return health_();
    case'setup':return setupSupervisionV9_();
    case'seedUsers':return seedUsers_();
    case'login':return login_(p);
    case'getBookings':return list_('Booking');
    case'getFiles':return getFilesForRequest_();
    case'getEvaluations':return getEvaluationsV9_();
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
    case'setup':return setupSupervisionV9_();
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
    case'saveSupervisionData':case'addEvaluation':return saveSupervisionV9_(d);
    case'updateSupervisionStatus':case'updateEvaluation':return reviewSupervisionV9_(d);
    case'deleteEvaluation':return deleteSupervisionV9_(d);
    case'addUser':case'updateUser':case'deleteUser':
    case'addTeacher':case'updateTeacher':case'deleteTeacher':return adminWrite_(d);
    default:return{success:false,error:'Unknown POST action: '+a};
  }
}

function setupSupervisionV9_(){
  try{
    if(typeof setup_==='function')setup_();
    migrateSupervisionSchemaV9_();
    return {success:true,spreadsheetId:SPREADSHEET_ID,sheets:getSheetNamesV9_(),version:'supervision-v9'};
  }catch(e){return{success:false,error:'ตั้งค่าฐานข้อมูลไม่สำเร็จ: '+String(e.message||e)};}
}

function getSheetNamesV9_(){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheets().map(function(s){return s.getName();});
}

function supervisionSheetV9_(){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh=ss.getSheetByName('Supervision');
  if(!sh)sh=ss.insertSheet('Supervision');
  sh.setFrozenRows(1);
  sh.getRange(1,1,1,SUPERVISION_HEADERS_V9_.length).setValues([SUPERVISION_HEADERS_V9_]);
  return sh;
}

function supervisionDetailsSheetV9_(){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh=ss.getSheetByName('SupervisionDetails');
  if(!sh)sh=ss.insertSheet('SupervisionDetails');
  sh.setFrozenRows(1);
  sh.getRange(1,1,1,SUPERVISION_DETAIL_HEADERS_V9_.length).setValues([SUPERVISION_DETAIL_HEADERS_V9_]);
  return sh;
}

function migrateSupervisionSchemaV9_(){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh=ss.getSheetByName('Supervision');
  if(!sh){supervisionSheetV9_();supervisionDetailsSheetV9_();return{migrated:false};}
  const lastCol=sh.getLastColumn();
  const current=lastCol?sh.getRange(1,1,1,lastCol).getValues()[0].map(String):[];
  const isModern=current.length>=25 && current[0]==='Timestamp' && current[24]==='ID';
  if(isModern){supervisionSheetV9_();supervisionDetailsSheetV9_();return{migrated:false};}

  // Preserve the old 8-column structure instead of corrupting it.
  const stamp=Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Bangkok','yyyyMMdd_HHmmss');
  const legacyName='Supervision_Legacy_'+stamp;
  sh.setName(legacyName);
  const modern=supervisionSheetV9_();
  supervisionDetailsSheetV9_();

  const lr=sh.getLastRow();
  if(lr>=2){
    const old=sh.getRange(2,1,lr-1,Math.max(lastCol,8)).getValues();
    const out=[];
    old.forEach(function(r){
      const teacher=String(r[1]||'');
      const date=r[2]||'';
      const strengths=String(r[3]||'');
      const improvements=String(r[4]||'');
      const suggestions=String(r[5]||'');
      const summary=String(r[6]||'');
      const id=String(r[7]||id_());
      if(!teacher&&!date&&!strengths&&!improvements&&!suggestions&&!summary)return;
      out.push([r[0]||new Date(),'','',teacher,'','', '',date,summary,'','', '', '', '',strengths,improvements,suggestions,'','','','รอตรวจสอบ','','','',id]);
    });
    if(out.length)modern.getRange(2,1,out.length,SUPERVISION_HEADERS_V9_.length).setValues(out);
  }
  return{migrated:true,legacySheet:legacyName};
}

function getEvaluationsV9_(){
  try{
    migrateSupervisionSchemaV9_();
    const sh=supervisionSheetV9_(),lr=sh.getLastRow();
    if(lr<2)return{success:true,data:[]};
    const rows=sh.getRange(2,1,lr-1,SUPERVISION_HEADERS_V9_.length).getValues();
    const data=rows.map(function(r){
      const o={};
      ['timestamp','supervisionType','supervisorName','teacherName','subjectGroup','gradeLevel','period','teachingDate','topic','teachingTechniques','scoresJson','totalScore','percent','qualityLevel','strengths','improvements','suggestions','evidenceFileUrl','evidenceDriveFileId','evidenceFileName','status','reviewedAt','reviewedBy','reviewComment','id'].forEach(function(k,i){o[k]=r[i] instanceof Date?r[i].toISOString():r[i];});
      try{o.scores=o.scoresJson?JSON.parse(o.scoresJson):[];}catch(_){o.scores=[];}
      return o;
    });
    return{success:true,data:data};
  }catch(e){return{success:false,data:[],error:String(e.message||e)};}
}

function saveSupervisionV9_(d){
  const lock=LockService.getScriptLock();
  try{lock.waitLock(15000);}catch(e){return{success:false,error:'ระบบกำลังบันทึกข้อมูลอื่นอยู่ กรุณาลองใหม่อีกครั้ง'};}
  try{
    migrateSupervisionSchemaV9_();
    const sh=supervisionSheetV9_(),detail=supervisionDetailsSheetV9_();
    let scores=[];
    try{scores=Array.isArray(d.scores)?d.scores:JSON.parse(d.scores||'[]');}catch(_){scores=[];}
    if(!Array.isArray(scores)||scores.length!==25||scores.some(function(x){return x===null||x===undefined||String(x)===''||isNaN(Number(x))||Number(x)<0||Number(x)>4;}))return{success:false,error:'ต้องประเมินให้ครบทั้ง 25 ข้อ และคะแนนต้องอยู่ระหว่าง 0-4'};
    const supervisor=String(d.supervisorName||'').trim(),teacher=String(d.teacherName||'').trim(),group=String(d.subjectGroup||'').trim(),date=String(d.teachingDate||'').trim();
    if(!supervisor||!teacher||!group||!date)return{success:false,error:'กรุณากรอกข้อมูลผู้นิเทศ ผู้รับการนิเทศ กลุ่มสาระ และวันที่สอนให้ครบ'};
    const total=scores.reduce(function(a,b){return a+Number(b);},0),percent=Math.round(total/100*10000)/100;
    const level=total>=90?'ดีมาก':total>=80?'ดี':total>=70?'พอใช้':total>=60?'ควรปรับปรุง':'ไม่ผ่านเกณฑ์';
    const id=String(d.id||id_());
    const existing=getEvaluationsV9_().data||[];
    if(existing.some(function(x){return String(x.id)===id;}))return{success:true,id:id,totalScore:total,percent:percent,qualityLevel:level,duplicate:true};

    let ev={url:'',id:'',name:''};
    let ef=d.evidenceFile||null;
    if(typeof ef==='string'){try{ef=JSON.parse(ef);}catch(_){ef=null;}}
    if(ef&&ef.dataUrl){
      if(String(ef.dataUrl).length>7*1024*1024)return{success:false,error:'ไฟล์หลักฐานมีขนาดใหญ่เกินไป'};
      const u=uploadEvidence_({fileData:ef.dataUrl,fileName:ef.name,mimeType:ef.mimeType});
      if(!u.success)return u;
      ev={url:u.fileUrl,id:u.fileId,name:u.fileName};
    }else if(d.evidenceFileUrl){ev={url:d.evidenceFileUrl,id:d.evidenceDriveFileId||'',name:d.evidenceFileName||''};}

    const status=String(d.status||'รอตรวจสอบ');
    sh.appendRow([new Date(),d.supervisionType||'',supervisor,teacher,group,d.gradeLevel||'',d.period||'',date,d.topic||'',d.teachingTechniques||'',JSON.stringify(scores),total,percent,level,d.strengths||'',d.improvements||'',d.suggestions||'',ev.url,ev.id,ev.name,status,'','','',id]);

    const now=new Date(),detailRows=[],items=[];SUPERVISION_CRITERIA_V9_.forEach(function(g){g[1].forEach(function(item){items.push({category:g[0],item:item});});});
    items.forEach(function(q,i){detailRows.push([now,id,i+1,q.category,q.item,Number(scores[i]),teacher,supervisor,date,status]);});
    detail.getRange(detail.getLastRow()+1,1,detailRows.length,SUPERVISION_DETAIL_HEADERS_V9_.length).setValues(detailRows);
    try{audit_(d,'add','Supervision',id);}catch(_){ }
    return{success:true,id:id,totalScore:total,percent:percent,qualityLevel:level,answeredCount:25,maxScore:100,evidenceFileUrl:ev.url,evidenceDriveFileId:ev.id,evidenceFileName:ev.name};
  }catch(e){return{success:false,error:'บันทึกผลการนิเทศไม่สำเร็จ: '+String(e.message||e)};}
  finally{try{lock.releaseLock();}catch(_){}}
}

function reviewSupervisionV9_(d){
  const a=auth_(d.authToken,true);if(!a.ok)return a.result;
  const sh=supervisionSheetV9_(),lr=sh.getLastRow();if(lr<2)return{success:false,error:'ยังไม่มีผลการนิเทศ'};
  const vals=sh.getRange(2,1,lr-1,SUPERVISION_HEADERS_V9_.length).getValues(),idCol=SUPERVISION_HEADERS_V9_.indexOf('ID');
  for(let i=0;i<vals.length;i++)if(String(vals[i][idCol])===String(d.id)){
    const row=i+2,status=String(d.status||'รอตรวจสอบ');
    sh.getRange(row,SUPERVISION_HEADERS_V9_.indexOf('Status')+1).setValue(status);
    sh.getRange(row,SUPERVISION_HEADERS_V9_.indexOf('ReviewedAt')+1).setValue(new Date());
    sh.getRange(row,SUPERVISION_HEADERS_V9_.indexOf('ReviewedBy')+1).setValue(a.user.fullName||a.user.username);
    sh.getRange(row,SUPERVISION_HEADERS_V9_.indexOf('ReviewComment')+1).setValue(d.comment||'');
    const ds=supervisionDetailsSheetV9_(),dl=ds.getLastRow();
    if(dl>=2){const dv=ds.getRange(2,1,dl-1,SUPERVISION_DETAIL_HEADERS_V9_.length).getValues();for(let j=0;j<dv.length;j++)if(String(dv[j][1])===String(d.id))ds.getRange(j+2,SUPERVISION_DETAIL_HEADERS_V9_.indexOf('Status')+1).setValue(status);}
    return{success:true,id:d.id,status:status};
  }
  return{success:false,error:'ไม่พบผลการนิเทศ ID: '+d.id};
}

function deleteSupervisionV9_(d){
  const a=auth_(d.authToken,true);if(!a.ok)return a.result;
  const sh=supervisionSheetV9_(),lr=sh.getLastRow();if(lr<2)return{success:false,error:'ไม่พบผลการนิเทศ'};
  const vals=sh.getRange(2,1,lr-1,SUPERVISION_HEADERS_V9_.length).getValues(),idCol=SUPERVISION_HEADERS_V9_.indexOf('ID');
  for(let i=0;i<vals.length;i++)if(String(vals[i][idCol])===String(d.id)){
    sh.deleteRow(i+2);
    const ds=supervisionDetailsSheetV9_(),dl=ds.getLastRow();if(dl>=2){const dv=ds.getRange(2,1,dl-1,SUPERVISION_DETAIL_HEADERS_V9_.length).getValues();for(let j=dv.length-1;j>=0;j--)if(String(dv[j][1])===String(d.id))ds.deleteRow(j+2);}
    return{success:true,id:d.id};
  }
  return{success:false,error:'ไม่พบผลการนิเทศ ID: '+d.id};
}

function getFilesForRequest_(){
  try{
    const r=list_('Files');
    if(!r.success)return r;
    const data=(r.data||[]).map(function(f){return{id:f.id||'',timestamp:f.timestamp||'',teacherName:f.teacherName||'',fileType:f.fileType||'',fileUrl:f.fileUrl||'',driveFileId:f.driveFileId||'',fileName:f.fileName||'',status:f.status||'รอตรวจสอบ'};});
    return{success:true,data:data,count:data.length,sheet:'Files'};
  }catch(e){return{success:false,data:[],error:String(e.message||e)};}
}

function getTeachersForRequest_(token){
  const r=list_('Teachers');
  if(!r.success)return r;
  const auth=token?auth_(token,true):{ok:false};
  return{success:true,data:auth.ok?(r.data||[]):(r.data||[]).filter(function(x){return String(x.active).toLowerCase()!=='false';})};
}
