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
      case 'addEvaluation':
        return jsonResponse(addEvaluation(data));
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
    'Summary': 'summary'
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
