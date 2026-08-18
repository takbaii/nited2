/*
 * Takbai Internal Supervision - Google Apps Script Backend
 * Spreadsheet: 1e5530q7hRUdR6pNIx6tAv4JjNKadFibg7GE5ohuq4xU
 * Drive folder: 1wVAG7EETgBcv5ftOFLLzdX-wbDEK95Dw
 *
 * IMPORTANT:
 * 1) Paste/deploy this file in the Apps Script project used by your Web App.
 * 2) Deploy -> Manage deployments -> Edit -> New version -> Deploy.
 * 3) Execute as: Me, Who has access: Anyone.
 * 4) Run setup_() once from the Apps Script editor to create the sheets/admin user.
 */

const SPREADSHEET_ID = '1e5530q7hRUdR6pNIx6tAv4JjNKadFibg7GE5ohuq4xU';
const DRIVE_FOLDER_ID = '1wVAG7EETgBcv5ftOFLLzdX-wbDEK95Dw';
const APP_NAME = 'Takbai Internal Supervision API';

function doGet(e) {
  const p = (e && e.parameter) ? e.parameter : {};
  try {
    return output_(routeGet_(p), p.callback);
  } catch (err) {
    return output_({ success: false, error: errorMessage_(err) }, p.callback);
  }
}

function doPost(e) {
  try {
    const data = parsePost_(e);
    return output_(routePost_(data), null);
  } catch (err) {
    return output_({ success: false, error: errorMessage_(err) }, null);
  }
}

/* ContentService.TextOutput DOES NOT support setHeader().
 * Keep this function limited to createTextOutput + setMimeType. */
function output_(obj, callback) {
  const json = JSON.stringify(obj == null ? {} : obj);
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(String(callback))) {
    return ContentService
      .createTextOutput(String(callback) + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function parsePost_(e) {
  if (!e) return {};
  if (e.parameter && Object.keys(e.parameter).length) return Object.assign({}, e.parameter);
  if (e.postData && e.postData.contents) {
    const text = String(e.postData.contents);
    try { return JSON.parse(text); } catch (_) { return {}; }
  }
  return {};
}

function routeGet_(p) {
  const action = String(p.action || 'health');
  switch (action) {
    case 'health':
    case 'debug':
      return health_();
    case 'setup':
      return setup_();
    case 'seedUsers':
      return seedUsers_();
    case 'login':
      return login_(p);
    case 'getBookings':
      return getSheetObjects_('Booking', bookingHeaders_());
    case 'getFiles':
      return getSheetObjects_('Files', fileHeaders_());
    case 'getEvaluations':
      return getSheetObjects_('Supervision', evaluationHeaders_());
    case 'getUsers':
      return getSheetObjects_('Users', userHeaders_());
    case 'getDashboard':
      return dashboard_();
    default:
      return { success: false, error: 'Unknown GET action: ' + action };
  }
}

function routePost_(d) {
  const action = String(d.action || '');
  switch (action) {
    case 'health':
      return health_();
    case 'setup':
      return setup_();
    case 'seedUsers':
      return seedUsers_();
    case 'login':
      return login_(d);
    case 'addBooking':
      return addBooking_(d);
    case 'updateBookingStatus':
      return updateById_('Booking', d.id, { status: d.status });
    case 'deleteBooking':
      return deleteById_('Booking', d.id);
    case 'updateBooking':
      return updateById_('Booking', d.id, d);
    case 'addFile':
      return addFile_(d);
    case 'updateFileStatus':
      return updateById_('Files', d.id, { status: d.status });
    case 'deleteFile':
      return deleteById_('Files', d.id);
    case 'updateFile':
      return updateById_('Files', d.id, d);
    case 'uploadFileToDrive':
      return uploadFile_(d);
    case 'addEvaluation':
      return addEvaluation_(d);
    case 'updateEvaluation':
      return updateById_('Supervision', d.id, d);
    case 'deleteEvaluation':
      return deleteById_('Supervision', d.id);
    case 'addUser':
      return addUser_(d);
    case 'updateUser':
      return updateById_('Users', d.id, d);
    case 'deleteUser':
      return deleteById_('Users', d.id);
    default:
      return { success: false, error: 'Unknown POST action: ' + action };
  }
}

function health_() {
  const result = {
    success: true,
    service: APP_NAME,
    version: '2026-08-18-safe-api-v2',
    spreadsheetId: SPREADSHEET_ID,
    driveFolderId: DRIVE_FOLDER_ID,
    timestamp: new Date().toISOString()
  };
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    result.spreadsheetName = ss.getName();
    result.spreadsheetAccessible = true;
  } catch (err) {
    result.spreadsheetAccessible = false;
    result.spreadsheetError = errorMessage_(err);
  }
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    result.driveFolderName = folder.getName();
    result.driveAccessible = true;
  } catch (err) {
    result.driveAccessible = false;
    result.driveError = errorMessage_(err);
  }
  return result;
}

function bookingHeaders_() {
  return ['Timestamp','Date','Time','Teacher Name','Department','Period','Subject Name','Subject Code','Class Level','Room','Status','ID'];
}
function fileHeaders_() {
  return ['Timestamp','Teacher Name','File Type','File URL/Link','Drive File ID','File Name','Status','ID'];
}
function evaluationHeaders_() {
  return ['Timestamp','Teacher Name','Supervision Date','Strengths','Improvements','Suggestions','Summary','ID'];
}
function userHeaders_() {
  return ['Username','Password','Role','FullName','Department','Active','ID'];
}

function headersFor_(name) {
  if (name === 'Booking') return bookingHeaders_();
  if (name === 'Files') return fileHeaders_();
  if (name === 'Supervision') return evaluationHeaders_();
  if (name === 'Users') return userHeaders_();
  throw new Error('Unknown sheet: ' + name);
}

function ensureSheet_(name, headers) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  } else if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function getSheetObjects_(name, headers) {
  try {
    const sh = ensureSheet_(name, headers);
    const lastRow = sh.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };
    const values = sh.getRange(1, 1, lastRow, headers.length).getValues();
    const data = values.slice(1).map(function(row) {
      const obj = {};
      headers.forEach(function(h, i) { obj[key_(h)] = normalizeValue_(row[i]); });
      return obj;
    });
    return { success: true, data: data };
  } catch (err) {
    return { success: false, error: errorMessage_(err), data: [] };
  }
}

function key_(h) {
  const map = {
    'Timestamp':'timestamp', 'Date':'date', 'Time':'time', 'Teacher Name':'teacherName',
    'Department':'department', 'Period':'period', 'Subject Name':'subjectName',
    'Subject Code':'subjectCode', 'Class Level':'classLevel', 'Room':'room',
    'Status':'status', 'ID':'id', 'File Type':'fileType', 'File URL/Link':'fileUrl',
    'Drive File ID':'driveFileId', 'File Name':'fileName', 'Supervision Date':'supervisionDate',
    'Strengths':'strengths', 'Improvements':'improvements', 'Suggestions':'suggestions',
    'Summary':'summary', 'Username':'username', 'Password':'password', 'Role':'role',
    'FullName':'fullName', 'Active':'active'
  };
  return map[h] || h;
}

function normalizeValue_(value) {
  if (value instanceof Date) return value.toISOString();
  return value;
}

function id_() {
  return Utilities.getUuid();
}

function addBooking_(d) {
  const sh = ensureSheet_('Booking', bookingHeaders_());
  const id = d.id || id_();
  sh.appendRow([
    new Date(), d.date || '', d.time || '', d.teacherName || '', d.department || '',
    d.period || '', d.subjectName || '', d.subjectCode || '', d.classLevel || '',
    d.room || '', d.status || 'รอดำเนินการ', id
  ]);
  return { success: true, id: id };
}

function addFile_(d) {
  const sh = ensureSheet_('Files', fileHeaders_());
  const id = d.id || id_();
  sh.appendRow([
    new Date(), d.teacherName || '', d.fileType || '', d.fileUrl || '',
    d.driveFileId || '', d.fileName || '', d.status || 'รอตรวจสอบ', id
  ]);
  return { success: true, id: id };
}

function addEvaluation_(d) {
  const sh = ensureSheet_('Supervision', evaluationHeaders_());
  const id = d.id || id_();
  sh.appendRow([
    new Date(), d.teacherName || '', d.supervisionDate || '', d.strengths || '',
    d.improvements || '', d.suggestions || '', d.summary || '', id
  ]);
  return { success: true, id: id };
}

function addUser_(d) {
  const sh = ensureSheet_('Users', userHeaders_());
  const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 7).getValues() : [];
  if (rows.some(function(r) { return String(r[0]).toLowerCase() === String(d.username || '').toLowerCase(); })) {
    return { success: false, error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' };
  }
  const id = d.id || id_();
  sh.appendRow([
    d.username || '', d.password || '', d.role || 'user', d.fullName || '',
    d.department || '-', d.active === undefined ? true : d.active, id
  ]);
  return { success: true, id: id };
}

function findRow_(sh, id) {
  if (!id) return -1;
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return -1;
  const idCol = sh.getLastColumn();
  const values = sh.getRange(2, idCol, lastRow - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function updateById_(name, id, d) {
  if (!id) return { success: false, error: 'ไม่พบ ID ของรายการ' };
  const headers = headersFor_(name);
  const sh = ensureSheet_(name, headers);
  const row = findRow_(sh, id);
  if (row < 0) return { success: false, error: 'ไม่พบรายการ ID: ' + id };

  const map = {
    'Timestamp':'timestamp', 'Date':'date', 'Time':'time', 'Teacher Name':'teacherName',
    'Department':'department', 'Period':'period', 'Subject Name':'subjectName',
    'Subject Code':'subjectCode', 'Class Level':'classLevel', 'Room':'room',
    'Status':'status', 'File Type':'fileType', 'File URL/Link':'fileUrl',
    'Drive File ID':'driveFileId', 'File Name':'fileName', 'Supervision Date':'supervisionDate',
    'Strengths':'strengths', 'Improvements':'improvements', 'Suggestions':'suggestions',
    'Summary':'summary', 'Username':'username', 'Password':'password', 'Role':'role',
    'FullName':'fullName', 'Active':'active'
  };

  headers.forEach(function(h, i) {
    const k = map[h];
    if (k && k !== 'timestamp' && d[k] !== undefined) sh.getRange(row, i + 1).setValue(d[k]);
  });
  return { success: true, id: id };
}

function deleteById_(name, id) {
  const headers = headersFor_(name);
  const sh = ensureSheet_(name, headers);
  const row = findRow_(sh, id);
  if (row < 0) return { success: false, error: 'ไม่พบรายการ' };
  if (name === 'Users' && String(sh.getRange(row, 1).getValue()) === 'admin') {
    return { success: false, error: 'ไม่สามารถลบผู้ดูแลระบบหลักได้' };
  }
  sh.deleteRow(row);
  return { success: true, id: id };
}

function login_(d) {
  const username = String(d.username || '').trim();
  const password = String(d.password || '');
  if (!username || !password) return { success: false, message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' };

  const r = getSheetObjects_('Users', userHeaders_());
  if (!r.success) return r;
  const u = r.data.find(function(x) {
    return String(x.username) === username && String(x.password) === password;
  });
  if (!u) return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
  if (String(u.active).toLowerCase() === 'false') return { success: false, message: 'บัญชีนี้ถูกปิดการใช้งาน' };

  return {
    success: true,
    user: {
      id: u.id, username: u.username, role: u.role,
      fullName: u.fullName, department: u.department
    }
  };
}

function uploadFile_(d) {
  try {
    if (!d.fileData || !d.fileName) return { success: false, error: 'ข้อมูลไฟล์ไม่ครบ' };
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const bytes = Utilities.base64Decode(String(d.fileData));
    const blob = Utilities.newBlob(bytes, d.mimeType || 'application/octet-stream', d.fileName);
    const file = folder.createFile(blob);

    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (_) {
      // Domain/admin policies may prevent public sharing. The file is still created.
    }

    return {
      success: true,
      fileId: file.getId(),
      fileUrl: 'https://drive.google.com/file/d/' + file.getId() + '/view',
      directUrl: 'https://drive.google.com/uc?export=view&id=' + file.getId(),
      fileName: file.getName()
    };
  } catch (err) {
    return { success: false, error: errorMessage_(err) };
  }
}

function dashboard_() {
  const b = getSheetObjects_('Booking', bookingHeaders_).data || [];
  const f = getSheetObjects_('Files', fileHeaders_).data || [];
  const e = getSheetObjects_('Supervision', evaluationHeaders_).data || [];
  return {
    success: true,
    stats: {
      totalBookings: b.length,
      completed: b.filter(function(x) { return x.status === 'นิเทศแล้ว'; }).length,
      pending: b.filter(function(x) { return x.status === 'รอดำเนินการ'; }).length,
      confirmed: b.filter(function(x) { return x.status === 'ยืนยันแล้ว'; }).length,
      totalFiles: f.length,
      totalEvaluations: e.length
    }
  };
}

function setup_() {
  ensureSheet_('Booking', bookingHeaders_());
  ensureSheet_('Files', fileHeaders_());
  ensureSheet_('Supervision', evaluationHeaders_());
  const users = ensureSheet_('Users', userHeaders_());
  if (users.getLastRow() < 2) {
    users.appendRow(['admin', 'Admin@123', 'admin', 'ผู้ดูแลระบบ', '-', true, 'u_admin']);
  }
  return {
    success: true,
    message: 'Setup complete',
    spreadsheetId: SPREADSHEET_ID,
    driveFolderId: DRIVE_FOLDER_ID
  };
}

function seedUsers_() {
  const users = ensureSheet_('Users', userHeaders_());
  const lastRow = users.getLastRow();
  const exists = lastRow >= 2 && users.getRange(2, 1, lastRow - 1, 1).getValues().some(function(r) {
    return String(r[0]) === 'admin';
  });
  if (!exists) users.appendRow(['admin', 'Admin@123', 'admin', 'ผู้ดูแลระบบ', '-', true, 'u_admin']);
  return { success: true, message: 'Admin user ready' };
}

function errorMessage_(err) {
  return err && err.message ? String(err.message) : String(err);
}
