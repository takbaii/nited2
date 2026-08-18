/* ==========================================================
   ระบบนิเทศภายในโรงเรียนตากใบ - Google Apps Script Backend
   ========================================================== */

const SPREADSHEET_ID = '1e5530q7hRUdR6pNIx6tAv4JjNKadFibg7GE5ohuq4xU';
const DRIVE_FOLDER_ID = '1wVAG7EETgBcv5ftOFLLzdX-wbDEK95Dw';

/* ========== WEB APP ENTRY ========== */
function doGet(e) {
  const action = e.parameter.action;

  switch (action) {
    case 'getBookings':
      return jsonResponse(getBookings());
    case 'getFiles':
      return jsonResponse(getFiles());
    case 'getEvaluations':
      return jsonResponse(getEvaluations());
    case 'getDashboard':
      return jsonResponse(getDashboardData());
    case 'getUsers':
      return jsonResponse(getUsers());
    case 'setup':
      return jsonResponse(runSetup());
    case 'seed':
      return jsonResponse(seedData());
    case 'seedUsers':
      return jsonResponse(seedUsers());
    case 'login':
      return jsonResponse(login(e.parameter));
    default:
      return jsonResponse({ success: true, message: 'Supervision System API is running' });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    switch (action) {
      case 'addBooking':
        return jsonResponse(addBooking(data));
      case 'updateBookingStatus':
        return jsonResponse(updateBookingStatus(data));
      case 'deleteBooking':
        return jsonResponse(deleteBooking(data));
      case 'addFile':
        return jsonResponse(addFile(data));
      case 'updateFileStatus':
        return jsonResponse(updateFileStatus(data));
      case 'deleteFile':
        return jsonResponse(deleteFile(data));
      case 'updateFile':
        return jsonResponse(updateFile(data));
      case 'addEvaluation':
        return jsonResponse(addEvaluation(data));
      case 'updateEvaluation':
        return jsonResponse(updateEvaluation(data));
      case 'deleteEvaluation':
        return jsonResponse(deleteEvaluation(data));
      case 'updateBooking':
        return jsonResponse(updateBooking(data));
      case 'uploadFileToDrive':
        return jsonResponse(uploadFileToDrive(data));
      case 'login':
        return jsonResponse(login(data));
      case 'addUser':
        return jsonResponse(addUser(data));
      case 'updateUser':
        return jsonResponse(updateUser(data));
      case 'deleteUser':
        return jsonResponse(deleteUser(data));
      default:
        return jsonResponse({ success: false, message: 'Unknown action' });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ========== BOOKINGS ========== */
function getBookings() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('Booking');

    if (!sheet) {
      sheet = ss.insertSheet('Booking');
      sheet.appendRow([
        'Timestamp', 'Date', 'Time', 'Teacher Name', 'Department',
        'Period', 'Subject Name', 'Subject Code', 'Class Level', 'Room', 'Status', 'ID'
      ]);
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };

    const headers = data[0];
    const bookings = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        const key = headerToKey(h);
        obj[key] = row[i];
      });
      return obj;
    });

    return { success: true, data: bookings };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function addBooking(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('Booking');

    if (!sheet) {
      sheet = ss.insertSheet('Booking');
      sheet.appendRow([
        'Timestamp', 'Date', 'Time', 'Teacher Name', 'Department',
        'Period', 'Subject Name', 'Subject Code', 'Class Level', 'Room', 'Status', 'ID'
      ]);
    }

    const id = data.id || new Date().getTime().toString();
    sheet.appendRow([
      new Date().toISOString(),
      data.date || '',
      data.time || '',
      data.teacherName || '',
      data.department || '',
      data.period || '',
      data.subjectName || '',
      data.subjectCode || '',
      data.classLevel || '',
      data.room || '',
      data.status || 'รอดำเนินการ',
      id
    ]);

    return { success: true, message: 'Booking added', id: id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function updateBookingStatus(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Booking');
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const allData = sheet.getDataRange().getValues();
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][11] == data.id) {
        sheet.getRange(i + 1, 11).setValue(data.status);
        return { success: true, message: 'Status updated' };
      }
    }
    return { success: false, message: 'Booking not found' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteBooking(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Booking');
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const allData = sheet.getDataRange().getValues();
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][11] == data.id) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Booking deleted' };
      }
    }
    return { success: false, message: 'Booking not found' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ========== FILES ========== */
function getFiles() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('Files');

    if (!sheet) {
      sheet = ss.insertSheet('Files');
      sheet.appendRow([
        'Timestamp', 'Teacher Name', 'File Type', 'File URL/Link',
        'Drive File ID', 'File Name', 'Status', 'ID'
      ]);
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };

    const headers = data[0];
    const files = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        const key = headerToKey(h);
        obj[key] = row[i];
      });
      return obj;
    });

    return { success: true, data: files };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function addFile(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('Files');

    if (!sheet) {
      sheet = ss.insertSheet('Files');
      sheet.appendRow([
        'Timestamp', 'Teacher Name', 'File Type', 'File URL/Link',
        'Drive File ID', 'File Name', 'Status', 'ID'
      ]);
    }

    const id = data.id || new Date().getTime().toString();
    sheet.appendRow([
      new Date().toISOString(),
      data.teacherName || '',
      data.fileType || '',
      data.fileUrl || '',
      data.driveFileId || '',
      data.fileName || '',
      data.status || 'รอตรวจสอบ',
      id
    ]);

    return { success: true, message: 'File added', id: id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function updateFileStatus(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Files');
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const allData = sheet.getDataRange().getValues();
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][7] == data.id) {
        sheet.getRange(i + 1, 7).setValue(data.status);
        return { success: true, message: 'File status updated' };
      }
    }
    return { success: false, message: 'File not found' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteFile(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Files');
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const allData = sheet.getDataRange().getValues();
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][7] == data.id) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'File deleted' };
      }
    }
    return { success: false, message: 'File not found' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function updateFile(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Files');
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const allData = sheet.getDataRange().getValues();
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][7] == data.id) {
        const rowNum = i + 1;
        if (data.teacherName !== undefined) sheet.getRange(rowNum, 2).setValue(data.teacherName);
        if (data.fileType !== undefined) sheet.getRange(rowNum, 3).setValue(data.fileType);
        if (data.fileUrl !== undefined) sheet.getRange(rowNum, 4).setValue(data.fileUrl);
        if (data.driveFileId !== undefined) sheet.getRange(rowNum, 5).setValue(data.driveFileId);
        if (data.fileName !== undefined) sheet.getRange(rowNum, 6).setValue(data.fileName);
        if (data.status !== undefined) sheet.getRange(rowNum, 7).setValue(data.status);
        return { success: true, message: 'File updated' };
      }
    }
    return { success: false, message: 'File not found' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ========== EVALUATIONS ========== */
function getEvaluations() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('Supervision');

    if (!sheet) {
      sheet = ss.insertSheet('Supervision');
      sheet.appendRow([
        'Timestamp', 'Teacher Name', 'Supervision Date', 'Strengths',
        'Improvements', 'Suggestions', 'Summary', 'ID'
      ]);
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };

    const headers = data[0];
    const evals = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        const key = headerToKey(h);
        obj[key] = row[i];
      });
      return obj;
    });

    return { success: true, data: evals };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function addEvaluation(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('Supervision');

    if (!sheet) {
      sheet = ss.insertSheet('Supervision');
      sheet.appendRow([
        'Timestamp', 'Teacher Name', 'Supervision Date', 'Strengths',
        'Improvements', 'Suggestions', 'Summary', 'ID'
      ]);
    }

    const id = data.id || new Date().getTime().toString();
    sheet.appendRow([
      new Date().toISOString(),
      data.teacherName || '',
      data.supervisionDate || '',
      data.strengths || '',
      data.improvements || '',
      data.suggestions || '',
      data.summary || '',
      id
    ]);

    return { success: true, message: 'Evaluation added', id: id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function updateEvaluation(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Supervision');
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const allData = sheet.getDataRange().getValues();
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][7] == data.id) {
        const rowNum = i + 1;
        if (data.teacherName !== undefined) sheet.getRange(rowNum, 2).setValue(data.teacherName);
        if (data.supervisionDate !== undefined) sheet.getRange(rowNum, 3).setValue(data.supervisionDate);
        if (data.strengths !== undefined) sheet.getRange(rowNum, 4).setValue(data.strengths);
        if (data.improvements !== undefined) sheet.getRange(rowNum, 5).setValue(data.improvements);
        if (data.suggestions !== undefined) sheet.getRange(rowNum, 6).setValue(data.suggestions);
        if (data.summary !== undefined) sheet.getRange(rowNum, 7).setValue(data.summary);
        return { success: true, message: 'Evaluation updated' };
      }
    }
    return { success: false, message: 'Evaluation not found' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteEvaluation(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Supervision');
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const allData = sheet.getDataRange().getValues();
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][7] == data.id) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Evaluation deleted' };
      }
    }
    return { success: false, message: 'Evaluation not found' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function updateBooking(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Booking');
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const allData = sheet.getDataRange().getValues();
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][11] == data.id) {
        const rowNum = i + 1;
        if (data.date !== undefined) sheet.getRange(rowNum, 2).setValue(data.date);
        if (data.time !== undefined) sheet.getRange(rowNum, 3).setValue(data.time);
        if (data.teacherName !== undefined) sheet.getRange(rowNum, 4).setValue(data.teacherName);
        if (data.department !== undefined) sheet.getRange(rowNum, 5).setValue(data.department);
        if (data.period !== undefined) sheet.getRange(rowNum, 6).setValue(data.period);
        if (data.subjectName !== undefined) sheet.getRange(rowNum, 7).setValue(data.subjectName);
        if (data.subjectCode !== undefined) sheet.getRange(rowNum, 8).setValue(data.subjectCode);
        if (data.classLevel !== undefined) sheet.getRange(rowNum, 9).setValue(data.classLevel);
        if (data.room !== undefined) sheet.getRange(rowNum, 10).setValue(data.room);
        if (data.status !== undefined) sheet.getRange(rowNum, 11).setValue(data.status);
        return { success: true, message: 'Booking updated' };
      }
    }
    return { success: false, message: 'Booking not found' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ========== FILE UPLOAD TO DRIVE ========== */
function uploadFileToDrive(data) {
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const blob = Utilities.newBlob(
      Utilities.base64Decode(data.fileData),
      data.mimeType,
      data.fileName
    );
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();
    const fileUrl = 'https://drive.google.com/file/d/' + fileId + '/view';
    const directUrl = 'https://drive.google.com/uc?export=view&id=' + fileId;

    return {
      success: true,
      message: 'File uploaded to Drive',
      fileId: fileId,
      fileUrl: fileUrl,
      directUrl: directUrl,
      fileName: file.getName(),
      mimeType: file.getMimeType(),
      size: file.getSize()
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ========== USERS ========== */
function getUsers() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('Users');

    if (!sheet) {
      sheet = ss.insertSheet('Users');
      sheet.appendRow(['Username', 'Password', 'Role', 'FullName', 'Department', 'Active', 'ID']);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#E6A817').setFontColor('#FFFFFF');
      const defaultId = 'u_admin';
      sheet.appendRow(['admin', 'Admin@123', 'admin', 'ผู้ดูแลระบบ', '-', true, defaultId]);
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };

    const headers = data[0];
    const users = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        const key = headerToKey(h);
        obj[key] = row[i];
      });
      return obj;
    });

    return { success: true, data: users };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function login(data) {
  try {
    const result = getUsers();
    if (!result.success) return result;

    const user = result.data.find(u =>
      u.username === data.username && u.password === data.password
    );

    if (user) {
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          fullName: user.fullName,
          department: user.department
        }
      };
    }
    return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function addUser(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('Users');

    if (!sheet) {
      sheet = ss.insertSheet('Users');
      sheet.appendRow(['Username', 'Password', 'Role', 'FullName', 'Department', 'Active', 'ID']);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#E6A817').setFontColor('#FFFFFF');
    }

    const result = getUsers();
    if (result.data && result.data.some(u => u.username === data.username)) {
      return { success: false, message: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' };
    }

    const id = data.id || 'u_' + new Date().getTime().toString();
    sheet.appendRow([
      data.username || '',
      data.password || '',
      data.role || 'user',
      data.fullName || '',
      data.department || '',
      data.active !== undefined ? data.active : true,
      id
    ]);

    return { success: true, message: 'User added', id: id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function updateUser(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Users');
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const allData = sheet.getDataRange().getValues();
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][6] == data.id) {
        const rowNum = i + 1;
        if (data.username !== undefined) sheet.getRange(rowNum, 1).setValue(data.username);
        if (data.password !== undefined) sheet.getRange(rowNum, 2).setValue(data.password);
        if (data.role !== undefined) sheet.getRange(rowNum, 3).setValue(data.role);
        if (data.fullName !== undefined) sheet.getRange(rowNum, 4).setValue(data.fullName);
        if (data.department !== undefined) sheet.getRange(rowNum, 5).setValue(data.department);
        if (data.active !== undefined) sheet.getRange(rowNum, 6).setValue(data.active);
        return { success: true, message: 'User updated' };
      }
    }
    return { success: false, message: 'User not found' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteUser(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Users');
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const allData = sheet.getDataRange().getValues();
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][6] == data.id) {
        if (allData[i][0] === 'admin') {
          return { success: false, message: 'ไม่สามารถลบผู้ดูแลระบบหลักได้' };
        }
        sheet.deleteRow(i + 1);
        return { success: true, message: 'User deleted' };
      }
    }
    return { success: false, message: 'User not found' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ========== DASHBOARD ========== */
function getDashboardData() {
  try {
    const bookings = getBookings();
    const files = getFiles();
    const evals = getEvaluations();

    return {
      success: true,
      stats: {
        totalBookings: bookings.data ? bookings.data.length : 0,
        completed: bookings.data ? bookings.data.filter(b => b.status === 'นิเทศแล้ว').length : 0,
        pending: bookings.data ? bookings.data.filter(b => b.status === 'รอดำเนินการ').length : 0,
        confirmed: bookings.data ? bookings.data.filter(b => b.status === 'ยืนยันแล้ว').length : 0,
        totalFiles: files.data ? files.data.length : 0,
        totalEvaluations: evals.data ? evals.data.length : 0
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ========== HELPER ========== */
function headerToKey(header) {
  const map = {
    'Timestamp': 'timestamp',
    'Date': 'date',
    'Time': 'time',
    'Teacher Name': 'teacherName',
    'Department': 'department',
    'Period': 'period',
    'Subject Name': 'subjectName',
    'Subject Code': 'subjectCode',
    'Class Level': 'classLevel',
    'Room': 'room',
    'Status': 'status',
    'ID': 'id',
    'File Type': 'fileType',
    'File URL/Link': 'fileUrl',
    'Drive File ID': 'driveFileId',
    'File Name': 'fileName',
    'Supervision Date': 'supervisionDate',
    'Strengths': 'strengths',
    'Improvements': 'improvements',
    'Suggestions': 'suggestions',
    'Summary': 'summary',
    'Username': 'username',
    'Password': 'password',
    'Role': 'role',
    'FullName': 'fullName',
    'Department': 'department',
    'Active': 'active'
  };
  return map[header] || header.toLowerCase().replace(/\s+/g, '_');
}

/* ========== SETUP (Run once) ========== */
function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Create Booking sheet
  let bookingSheet = ss.getSheetByName('Booking');
  if (!bookingSheet) {
    bookingSheet = ss.insertSheet('Booking');
    bookingSheet.appendRow([
      'Timestamp', 'Date', 'Time', 'Teacher Name', 'Department',
      'Period', 'Subject Name', 'Subject Code', 'Class Level', 'Room', 'Status', 'ID'
    ]);
    bookingSheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#E6A817').setFontColor('#FFFFFF');
  }

  // Create Files sheet
  let filesSheet = ss.getSheetByName('Files');
  if (!filesSheet) {
    filesSheet = ss.insertSheet('Files');
    filesSheet.appendRow([
      'Timestamp', 'Teacher Name', 'File Type', 'File URL/Link',
      'Drive File ID', 'File Name', 'Status', 'ID'
    ]);
    filesSheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#E6A817').setFontColor('#FFFFFF');
  }

  // Create Supervision sheet
  let supervisionSheet = ss.getSheetByName('Supervision');
  if (!supervisionSheet) {
    supervisionSheet = ss.insertSheet('Supervision');
    supervisionSheet.appendRow([
      'Timestamp', 'Teacher Name', 'Supervision Date', 'Strengths',
      'Improvements', 'Suggestions', 'Summary', 'ID'
    ]);
    supervisionSheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#E6A817').setFontColor('#FFFFFF');
  }

  // Create Users sheet
  let usersSheet = ss.getSheetByName('Users');
  if (!usersSheet) {
    usersSheet = ss.insertSheet('Users');
    usersSheet.appendRow(['Username', 'Password', 'Role', 'FullName', 'Department', 'Active', 'ID']);
    usersSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#E6A817').setFontColor('#FFFFFF');
    usersSheet.appendRow(['admin', 'Admin@123', 'admin', 'ผู้ดูแลระบบ', '-', true, 'u_admin']);
  }

  Logger.log('Setup complete! All sheets created.');
}

/* ========== FOLDER SETUP ========== */
function setupDriveFolders() {
  const parentFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const subFolders = ['Plans', 'Media', 'Photos', 'Clips'];

  subFolders.forEach(name => {
    const existing = parentFolder.getFoldersByName(name);
    if (!existing.hasNext()) {
      parentFolder.createFolder(name);
      Logger.log('Created folder: ' + name);
    }
  });

  Logger.log('Drive folder setup complete!');
}

/* ========== SEED DATA ========== */
function seedData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const now = new Date();

  // --- BOOKINGS ---
  let bookingSheet = ss.getSheetByName('Booking');
  if (!bookingSheet) {
    bookingSheet = ss.insertSheet('Booking');
    bookingSheet.appendRow([
      'Timestamp', 'Date', 'Time', 'Teacher Name', 'Department',
      'Period', 'Subject Name', 'Subject Code', 'Class Level', 'Room', 'Status', 'ID'
    ]);
  }

  if (bookingSheet.getLastRow() > 1) {
    return { success: true, message: 'Data already seeded. Skipped.' };
  }

  bookingSheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#E6A817').setFontColor('#FFFFFF');

  const bookings = [
    ['2026-07-15', '08:30', 'สมชาย วงศ์สุข', 'คณิตศาสตร์', 'ภาคเรียนที่ 1', 'คณิตศาสตร์พื้นฐาน', 'ค21101', 'ม.3/1', 'ห้อง 301', 'นิเทศแล้ว', 'b001'],
    ['2026-07-16', '09:00', 'สมหญิง แก้วมณี', 'วิทยาศาสตร์', 'ภาคเรียนที่ 1', 'วิทยาศาสตร์พื้นฐาน', 'ว21101', 'ม.2/2', 'ห้อง 202', 'ยืนยันแล้ว', 'b002'],
    ['2026-07-17', '10:00', 'อรุณ สุขสวัสดิ์', 'ภาษาไทย', 'ภาคเรียนที่ 1', 'ภาษาไทย', 'ท21101', 'ม.1/1', 'ห้อง 101', 'รอดำเนินการ', 'b003'],
    ['2026-07-18', '08:30', 'พิมพ์ใจ แสนสุข', 'สังคมศึกษา', 'ภาคเรียนที่ 1', 'สังคมศึกษา', 'ส21101', 'ม.3/2', 'ห้อง 302', 'นิเทศแล้ว', 'b004'],
    ['2026-07-21', '09:00', 'มุสลิม ดอเลาะ', 'ศาสนา', 'ภาคเรียนที่ 1', 'อิสลามศึกษา', 'อ21101', 'ม.2/1', 'ห้อง 201', 'ยืนยันแล้ว', 'b005'],
    ['2026-07-22', '10:30', 'รอฮานี หะยีซา', 'ภาษาอังกฤษ', 'ภาคเรียนที่ 1', 'ภาษาอังกฤษ', 'อ21201', 'ม.1/2', 'ห้อง 102', 'รอดำเนินการ', 'b006'],
    ['2026-07-23', '08:30', 'ซาการียา แมะอุ', 'คณิตศาสตร์', 'ภาคเรียนที่ 1', 'คณิตศาสตร์เพิ่มเติม', 'ค21102', 'ม.3/1', 'ห้อง 301', 'รอดำเนินการ', 'b007'],
    ['2026-07-24', '09:00', 'นุร๊าะ ดอเลาะ', 'วิทยาศาสตร์', 'ภาคเรียนที่ 1', 'วิทยาศาสตร์เพิ่มเติม', 'ว21102', 'ม.2/3', 'ห้อง 203', 'รอดำเนินการ', 'b008'],
    ['2026-07-25', '10:00', 'ฟาติมะห์ ยูโซะ', 'ภาษาอังกฤษ', 'ภาคเรียนที่ 1', 'ภาษาอังกฤษ', 'อ21201', 'ม.3/3', 'ห้อง 303', 'ยืนยันแล้ว', 'b009'],
    ['2026-07-28', '08:30', 'สุไลมาน ดอเลาะ', 'สังคมศึกษา', 'ภาคเรียนที่ 1', 'หน้าที่พลเมือง', 'ส21102', 'ม.1/3', 'ห้อง 103', 'รอดำเนินการ', 'b010'],
    ['2026-07-29', '09:00', 'รอซานี หะยีแน', 'คณิตศาสตร์', 'ภาคเรียนที่ 1', 'คณิตศาสตร์พื้นฐาน', 'ค21101', 'ม.1/1', 'ห้อง 101', 'รอดำเนินการ', 'b011'],
    ['2026-07-30', '10:00', 'อับดุลเลาะ ซูหะ', 'วิทยาศาสตร์', 'ภาคเรียนที่ 1', 'วิทยาศาสตร์พื้นฐาน', 'ว21101', 'ม.3/2', 'ห้อง 302', 'รอดำเนินการ', 'b012'],
    ['2026-07-15', '13:00', 'สมชาย วงศ์สุข', 'คณิตศาสตร์', 'ภาคเรียนที่ 1', 'คณิตศาสตร์พื้นฐาน', 'ค21102', 'ม.3/2', 'ห้อง 302', 'นิเทศแล้ว', 'b013'],
    ['2026-07-17', '13:00', 'สมหญิง แก้วมณี', 'วิทยาศาสตร์', 'ภาคเรียนที่ 1', 'วิทยาศาสตร์พื้นฐาน', 'ว21102', 'ม.1/1', 'ห้อง 101', 'ยืนยันแล้ว', 'b014'],
    ['2026-07-20', '08:30', 'อรุณ สุขสวัสดิ์', 'ภาษาไทย', 'ภาคเรียนที่ 1', 'ภาษาไทย', 'ท21102', 'ม.2/1', 'ห้อง 201', 'รอดำเนินการ', 'b015'],
  ];

  bookings.forEach(b => {
    bookingSheet.appendRow([
      now.toISOString(), b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7], b[8], b[9], b[10]
    ]);
  });

  // --- FILES ---
  let filesSheet = ss.getSheetByName('Files');
  if (!filesSheet) {
    filesSheet = ss.insertSheet('Files');
    filesSheet.appendRow([
      'Timestamp', 'Teacher Name', 'File Type', 'File URL/Link',
      'Drive File ID', 'File Name', 'Status', 'ID'
    ]);
  }
  filesSheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#E6A817').setFontColor('#FFFFFF');

  const files = [
    ['สมชาย วงศ์สุข', 'แผนการสอน', '', 'fid001', 'แผนการสอน_ค3_ม.3_เทอม1.docx', 'ตรวจสอบแล้ว', 'f001'],
    ['สมหญิง แก้วมณี', 'แผนการสอน', '', 'fid002', 'แผนการสอน_วิทย์_ม.2_เทอม1.docx', 'ตรวจสอบแล้ว', 'f002'],
    ['อรุณ สุขสวัสดิ์', 'แผนการสอน', '', 'fid003', 'แผนการสอน_ไทย_ม.1_เทอม1.docx', 'รอตรวจสอบ', 'f003'],
    ['พิมพ์ใจ แสนสุข', 'แผนการสอน', '', 'fid004', 'แผนการสอน_สังคม_ม.3_เทอม1.docx', 'ตรวจสอบแล้ว', 'f004'],
    ['มุสลิม ดอเลาะ', 'แผนการสอน', '', 'fid005', 'แผนการสอน_อิสลาม_ม.2_เทอม1.docx', 'รอตรวจสอบ', 'f005'],
    ['สมชาย วงศ์สุข', 'สื่อการสอน', '', 'fid006', 'สื่อ_คณิต_พีทาโกรัส.pptx', 'ตรวจสอบแล้ว', 'f006'],
    ['สมหญิง แก้วมณี', 'สื่อการสอน', '', 'fid007', 'สื่อ_วิทย์_เซลล์.pptx', 'รอตรวจสอบ', 'f007'],
    ['อรุณ สุขสวัสดิ์', 'เอกสารประกอบ', '', 'fid008', 'แบบฝึกหัด_ไทย_วรรณคดี.pdf', 'รอตรวจสอบ', 'f008'],
    ['รอฮานี หะยีซา', 'แผนการสอน', '', 'fid009', 'แผนการสอน_English_m1.docx', 'รอตรวจสอบ', 'f009'],
    ['สุไลมาน แมะอุ', 'แผนการสอน', '', 'fid010', 'แผนการสอน_ค3_เพิ่มเติม_m3.docx', 'รอตรวจสอบ', 'f010'],
  ];

  files.forEach(f => {
    filesSheet.appendRow([
      now.toISOString(), f[0], f[1], f[2], f[3], f[4], f[5], f[6]
    ]);
  });

  // --- SUPERVISION / EVALUATIONS ---
  let evalSheet = ss.getSheetByName('Supervision');
  if (!evalSheet) {
    evalSheet = ss.insertSheet('Supervision');
    evalSheet.appendRow([
      'Timestamp', 'Teacher Name', 'Supervision Date', 'Strengths',
      'Improvements', 'Suggestions', 'Summary', 'ID'
    ]);
  }
  evalSheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#E6A817').setFontColor('#FFFFFF');

  const evals = [
    ['สมชาย วงศ์สุข', '2026-07-15', 'มีความรู้ Subject Matter ดีมาก สอนเข้าใจง่าย มีการยกตัวอย่างที่ดี นักเรียนมีส่วนร่วมในชั้นเรียนสูง', 'ควรจัดกิจกรรมกลุ่มให้มากขึ้น เพื่อให้นักเรียนได้แลกเปลี่ยนเรียนรู้ร่วมกัน', 'ควรใช้สื่อดิจิทัลเสริมการสอน เช่น Kahoot หรือ Quizizz', 'ผู้สอนมีความรู้ดี สอนได้ดีมาก ควรพัฒนาเทคนิคการจัดการชั้นเรียนเพิ่มเติม', 'e001'],
    ['พิมพ์ใจ แสนสุข', '2026-07-18', 'มีการเตรียมสื่อการสอนดี นักเรียนสนใจเนื้อหา มีการใช้คำถามกระตุ้น思考', 'ควรปรับ节奏การสอนให้เหมาะสมกับระดับนักเรียน', 'ควรเพิ่มแบบฝึกหัดท้ายบทสำหรับทบทวน', 'ผู้สอนเตรียมสื่อดี ควรปรับ节奏ให้ลื่นไหลขึ้น', 'e002'],
    ['สมหญิง แก้วมณี', '2026-07-16', 'สอนวิทยาศาสตร์ได้ดี มีการสาธิต experiment จริง นักเรียนตื่นเต้นและสนใจ', 'ควรเชื่อมโยงเนื้อหากับชีวิตจริงให้มากขึ้น', 'ควรจัด Lab ให้นักเรียนได้ทดลองเอง', 'ผู้สอนมีทักษะสาธิตดี ควรเพิ่มกิจกรรม hands-on', 'e003'],
    ['มุสลิม ดอเลาะ', '2026-07-21', 'สอนอิสลามศึกษาได้อย่างน่าเชื่อถือ มีความรู้ลึกซึ้ง นักเรียนให้ความเคารพ', 'ควรเพิ่มกิจกรรมอภิปรายในชั้นเรียน', 'ควรนำประวัติศาสตร์ท้องถิ่นมาเชื่อมโยง', 'ผู้สอนมีความรู้ดีมาก ควรพัฒนาเทคนิคการสอนเพิ่มเติม', 'e004'],
    ['อรุณ สุขสวัสดิ์', '2026-07-17', 'สอนภาษาไทยได้อย่างมีชีวิตชีวา มีการเล่านิทานประกอบ นักเรียนเพลิดเพลิน', 'ควรให้นักเรียนฝึกเขียนมากขึ้น', 'ควรใช้บทเพลงไทยเดิมในการสอน', 'ผู้สอนมีเทคนิคเล่าเรื่องดี ควรเน้นทักษะการเขียนเพิ่ม', 'e005'],
    ['รอฮานี หะยีซา', '2026-07-22', 'สอนภาษาอังกฤษได้ดี มีการใช้ TPR และเพลง นักเรียนสนุกกับการเรียน', 'ควรปรับระดับภาษาให้เหมาะสมกับชั้นเรียน', 'ควรจัดกิจกรรม role play มากขึ้น', 'ผู้สอนใช้เทคนิค TPR ได้ดี ควรเพิ่มกิจกรรมสื่อสาร', 'e006'],
  ];

  evals.forEach(ev => {
    evalSheet.appendRow([
      now.toISOString(), ev[0], ev[1], ev[2], ev[3], ev[4], ev[5], ev[6]
    ]);
  });

  return { success: true, message: 'Seeded ' + bookings.length + ' bookings, ' + files.length + ' files, ' + evals.length + ' evaluations.' };
}

/* ========== SEED USERS ========== */
function seedUsers() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('Users');

    if (!sheet) {
      sheet = ss.insertSheet('Users');
      sheet.appendRow(['Username', 'Password', 'Role', 'FullName', 'Department', 'Active', 'ID']);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#E6A817').setFontColor('#FFFFFF');
    }

    const existing = sheet.getDataRange().getValues();
    const existingUsernames = existing.slice(1).map(r => r[0]);

    const users = [
      ['admin', 'Admin@123', 'admin', 'ผู้ดูแลระบบ', '-', true, 'u_admin'],
      ['somchai', 'Somchai@1', 'user', 'สมชาย วงศ์สุข', 'คณิตศาสตร์', true, 'u_001'],
      ['somjai', 'Somjai@1', 'user', 'สมหญิง แก้วมณี', 'วิทยาศาสตร์', true, 'u_002'],
      ['arun', 'Arun@123', 'user', 'อรุณ สุขสวัสดิ์', 'ภาษาไทย', true, 'u_003'],
      ['pimjai', 'Pimjai@1', 'user', 'พิมพ์ใจ แสนสุข', 'สังคมศึกษา', true, 'u_004'],
      ['muslim', 'Muslim@1', 'user', 'มุสลิม ดอเลาะ', 'ศาสนา', true, 'u_005'],
      ['rohani', 'Rohani@1', 'user', 'รอฮานี หะยีซา', 'ภาษาอังกฤษ', true, 'u_006'],
      ['sakariya', 'Sakari@1', 'user', 'ซาการียา แมะอุ', 'คณิตศาสตร์', true, 'u_007'],
      ['nura', 'Nura@123', 'user', 'นุร๊าะ ดอเลาะ', 'วิทยาศาสตร์', true, 'u_008'],
      ['fatimah', 'Fatimah@1', 'user', 'ฟาติมะห์ ยูโซะ', 'ภาษาอังกฤษ', true, 'u_009'],
      ['sulaiman', 'Sulai@12', 'user', 'สุไลมาน ดอเลาะ', 'สังคมศึกษา', true, 'u_010'],
      ['rosani', 'Rosani@1', 'user', 'รอซานี หะยีแน', 'คณิตศาสตร์', true, 'u_011'],
      ['abdulloh', 'Abdul@12', 'user', 'อับดุลเลาะ ซูหะ', 'วิทยาศาสตร์', true, 'u_012'],
    ];

    let added = 0;
    users.forEach(u => {
      if (!existingUsernames.includes(u[0])) {
        sheet.appendRow([
          u[0], u[1], u[2], u[3], u[4], u[5], u[6]
        ]);
        added++;
      }
    });

    return { success: true, message: 'Added ' + added + ' users. Total users: ' + (sheet.getLastRow() - 1) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ========== RUN SETUP ========== */
function runSetup() {
  try {
    setupSheets();
    setupDriveFolders();
    return { success: true, message: 'Setup complete! Sheets and Drive folders created.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
