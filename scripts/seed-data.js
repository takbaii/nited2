const https = require('https');
const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = '1e5530q7hRUdR6pNIx6tAv4JjNKadFibg7GE5ohuq4xU';

// Read OAuth token from clasp
const tokenPath = path.join(process.env.USERPROFILE || process.env.HOME, '.clasprc.json');
let token, clientId, clientSecret, refreshToken;
try {
  const rc = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const t = rc.tokens.default;
  token = t.access_token;
  refreshToken = t.refresh_token;
  clientId = t.client_id;
  clientSecret = t.client_secret;
} catch (e) {
  console.error('Cannot read clasp token:', e.message);
  process.exit(1);
}

function apiCall(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'sheets.googleapis.com',
      path: urlPath,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
    }, (res) => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        try { resolve(JSON.parse(text)); } catch(e) { resolve(text); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function refreshAccessToken() {
  return new Promise((resolve, reject) => {
    if (!refreshToken) {
      return reject(new Error('No refresh token available'));
    }
    const postData = [
      'client_id=' + encodeURIComponent(clientId),
      'client_secret=' + encodeURIComponent(clientSecret),
      'refresh_token=' + encodeURIComponent(refreshToken),
      'grant_type=refresh_token',
    ].join('&');

    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }, (res) => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const result = JSON.parse(Buffer.concat(chunks).toString());
        if (result.access_token) {
          const rc = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
          rc.tokens.default.access_token = result.access_token;
          fs.writeFileSync(tokenPath, JSON.stringify(rc, null, 2));
          token = result.access_token;
          console.log('Token refreshed successfully');
          resolve();
        } else {
          reject(new Error('Token refresh failed: ' + JSON.stringify(result)));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function ensureSheet(name, headers) {
  // Check if sheet exists
  const meta = await apiCall('GET', `/v4/spreadsheets/${SPREADSHEET_ID}`);
  const sheet = meta.sheets ? meta.sheets.find(s => s.properties.title === name) : null;
  
  if (!sheet) {
    // Add sheet
    console.log(`Creating sheet: ${name}`);
    const addResp = await apiCall('POST', `/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`, {
      requests: [{ addSheet: { properties: { title: name } } }]
    });
    if (addResp.error) {
      console.error('Error creating sheet:', JSON.stringify(addResp));
      return;
    }
  }

  // Write headers
  await apiCall('PUT', `/v4/spreadsheets/${SPREADSHEET_ID}/values/${name}!A1:${String.fromCharCode(64+headers.length)}1?valueInputOption=USER_ENTERED`, {
    values: [headers]
  });
  console.log(`Headers written to ${name}`);
}

async function appendRows(sheetName, rows) {
  const range = `${sheetName}!A:${String.fromCharCode(64 + rows[0].length)}`;
  const resp = await apiCall('POST', `/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`, {
    values: rows
  });
  if (resp.error) {
    console.error(`Error appending to ${sheetName}:`, JSON.stringify(resp));
  } else {
    console.log(`Appended ${rows.length} rows to ${sheetName}`);
  }
}

async function main() {
  try {
    // Test token first
    const test = await apiCall('GET', `/v4/spreadsheets/${SPREADSHEET_ID}?fields=spreadsheetId`);
    if (test.error && test.error.code === 401) {
      console.log('Token expired, refreshing...');
      await refreshAccessToken();
    }
  } catch(e) {
    console.error('Auth test failed:', e.message);
    await refreshAccessToken();
  }

  console.log('Token OK. Seeding data...\n');

  // === BOOKINGS ===
  const bookingHeaders = ['Timestamp', 'Date', 'Time', 'Teacher Name', 'Department', 'Period', 'Subject Name', 'Subject Code', 'Class Level', 'Room', 'Status', 'ID'];
  await ensureSheet('Booking', bookingHeaders);

  const now = new Date().toISOString();
  const bookings = [
    [now, '2026-07-15', '08:30', 'สมชาย วงศ์สุข', 'คณิตศาสตร์', 'ภาคเรียนที่ 1', 'คณิตศาสตร์พื้นฐาน', 'ค21101', 'ม.3/1', 'ห้อง 301', 'นิเทศแล้ว', 'b001'],
    [now, '2026-07-16', '09:00', 'สมหญิง แก้วมณี', 'วิทยาศาสตร์', 'ภาคเรียนที่ 1', 'วิทยาศาสตร์พื้นฐาน', 'ว21101', 'ม.2/2', 'ห้อง 202', 'ยืนยันแล้ว', 'b002'],
    [now, '2026-07-17', '10:00', 'อรุณ สุขสวัสดิ์', 'ภาษาไทย', 'ภาคเรียนที่ 1', 'ภาษาไทย', 'ท21101', 'ม.1/1', 'ห้อง 101', 'รอดำเนินการ', 'b003'],
    [now, '2026-07-18', '08:30', 'พิมพ์ใจ แสนสุข', 'สังคมศึกษา', 'ภาคเรียนที่ 1', 'สังคมศึกษา', 'ส21101', 'ม.3/2', 'ห้อง 302', 'นิเทศแล้ว', 'b004'],
    [now, '2026-07-21', '09:00', 'มุสลิม ดอเลาะ', 'ศาสนา', 'ภาคเรียนที่ 1', 'อิสลามศึกษา', 'อ21101', 'ม.2/1', 'ห้อง 201', 'ยืนยันแล้ว', 'b005'],
    [now, '2026-07-22', '10:30', 'รอฮานี หะยีซา', 'ภาษาอังกฤษ', 'ภาคเรียนที่ 1', 'ภาษาอังกฤษ', 'อ21201', 'ม.1/2', 'ห้อง 102', 'รอดำเนินการ', 'b006'],
    [now, '2026-07-23', '08:30', 'ซาการียา แมะอุ', 'คณิตศาสตร์', 'ภาคเรียนที่ 1', 'คณิตศาสตร์เพิ่มเติม', 'ค21102', 'ม.3/1', 'ห้อง 301', 'รอดำเนินการ', 'b007'],
    [now, '2026-07-24', '09:00', 'นุร๊าะ ดอเลาะ', 'วิทยาศาสตร์', 'ภาคเรียนที่ 1', 'วิทยาศาสตร์เพิ่มเติม', 'ว21102', 'ม.2/3', 'ห้อง 203', 'รอดำเนินการ', 'b008'],
    [now, '2026-07-25', '10:00', 'ฟาติมะห์ ยูโซะ', 'ภาษาอังกฤษ', 'ภาคเรียนที่ 1', 'ภาษาอังกฤษ', 'อ21201', 'ม.3/3', 'ห้อง 303', 'ยืนยันแล้ว', 'b009'],
    [now, '2026-07-28', '08:30', 'สุไลมาน ดอเลาะ', 'สังคมศึกษา', 'ภาคเรียนที่ 1', 'หน้าที่พลเมือง', 'ส21102', 'ม.1/3', 'ห้อง 103', 'รอดำเนินการ', 'b010'],
    [now, '2026-07-29', '09:00', 'รอซานี หะยีแน', 'คณิตศาสตร์', 'ภาคเรียนที่ 1', 'คณิตศาสตร์พื้นฐาน', 'ค21101', 'ม.1/1', 'ห้อง 101', 'รอดำเนินการ', 'b011'],
    [now, '2026-07-30', '10:00', 'อับดุลเลาะ ซูหะ', 'วิทยาศาสตร์', 'ภาคเรียนที่ 1', 'วิทยาศาสตร์พื้นฐาน', 'ว21101', 'ม.3/2', 'ห้อง 302', 'รอดำเนินการ', 'b012'],
    [now, '2026-07-15', '13:00', 'สมชาย วงศ์สุข', 'คณิตศาสตร์', 'ภาคเรียนที่ 1', 'คณิตศาสตร์พื้นฐาน', 'ค21102', 'ม.3/2', 'ห้อง 302', 'นิเทศแล้ว', 'b013'],
    [now, '2026-07-17', '13:00', 'สมหญิง แก้วมณี', 'วิทยาศาสตร์', 'ภาคเรียนที่ 1', 'วิทยาศาสตร์พื้นฐาน', 'ว21102', 'ม.1/1', 'ห้อง 101', 'ยืนยันแล้ว', 'b014'],
    [now, '2026-07-20', '08:30', 'อรุณ สุขสวัสดิ์', 'ภาษาไทย', 'ภาคเรียนที่ 1', 'ภาษาไทย', 'ท21102', 'ม.2/1', 'ห้อง 201', 'รอดำเนินการ', 'b015'],
  ];
  await appendRows('Booking', bookings);

  // === FILES ===
  const fileHeaders = ['Timestamp', 'Teacher Name', 'File Type', 'File URL/Link', 'Drive File ID', 'File Name', 'Status', 'ID'];
  await ensureSheet('Files', fileHeaders);

  const files = [
    [now, 'สมชาย วงศ์สุข', 'แผนการสอน', '', 'fid001', 'แผนการสอน_ค3_ม.3_เทอม1.docx', 'ตรวจสอบแล้ว', 'f001'],
    [now, 'สมหญิง แก้วมณี', 'แผนการสอน', '', 'fid002', 'แผนการสอน_วิทย์_ม.2_เทอม1.docx', 'ตรวจสอบแล้ว', 'f002'],
    [now, 'อรุณ สุขสวัสดิ์', 'แผนการสอน', '', 'fid003', 'แผนการสอน_ไทย_ม.1_เทอม1.docx', 'รอตรวจสอบ', 'f003'],
    [now, 'พิมพ์ใจ แสนสุข', 'แผนการสอน', '', 'fid004', 'แผนการสอน_สังคม_ม.3_เทอม1.docx', 'ตรวจสอบแล้ว', 'f004'],
    [now, 'มุสลิม ดอเลาะ', 'แผนการสอน', '', 'fid005', 'แผนการสอน_อิสลาม_ม.2_เทอม1.docx', 'รอตรวจสอบ', 'f005'],
    [now, 'สมชาย วงศ์สุข', 'สื่อการสอน', '', 'fid006', 'สื่อ_คณิต_พีทาโกรัส.pptx', 'ตรวจสอบแล้ว', 'f006'],
    [now, 'สมหญิง แก้วมณี', 'สื่อการสอน', '', 'fid007', 'สื่อ_วิทย์_เซลล์.pptx', 'รอตรวจสอบ', 'f007'],
    [now, 'อรุณ สุขสวัสดิ์', 'เอกสารประกอบ', '', 'fid008', 'แบบฝึกหัด_ไทย_วรรณคดี.pdf', 'รอตรวจสอบ', 'f008'],
    [now, 'รอฮานี หะยีซา', 'แผนการสอน', '', 'fid009', 'แผนการสอน_English_m1.docx', 'รอตรวจสอบ', 'f009'],
    [now, 'สุไลมาน แมะอุ', 'แผนการสอน', '', 'fid010', 'แผนการสอน_ค3_เพิ่มเติม_m3.docx', 'รอตรวจสอบ', 'f010'],
  ];
  await appendRows('Files', files);

  // === SUPERVISION ===
  const evalHeaders = ['Timestamp', 'Teacher Name', 'Supervision Date', 'Strengths', 'Improvements', 'Suggestions', 'Summary', 'ID'];
  await ensureSheet('Supervision', evalHeaders);

  const evals = [
    [now, 'สมชาย วงศ์สุข', '2026-07-15', 'มีความรู้ Subject Matter ดีมาก สอนเข้าใจง่าย มีการยกตัวอย่างที่ดี นักเรียนมีส่วนร่วมในชั้นเรียนสูง', 'ควรจัดกิจกรรมกลุ่มให้มากขึ้น เพื่อให้นักเรียนได้แลกเปลี่ยนเรียนรู้ร่วมกัน', 'ควรใช้สื่อดิจิทัลเสริมการสอน เช่น Kahoot หรือ Quizizz', 'ผู้สอนมีความรู้ดี สอนได้ดีมาก ควรพัฒนาเทคนิคการจัดการชั้นเรียนเพิ่มเติม', 'e001'],
    [now, 'พิมพ์ใจ แสนสุข', '2026-07-18', 'มีการเตรียมสื่อการสอนดี นักเรียนสนใจเนื้อหา มีการใช้คำถามกระตุ้นการคิด', 'ควรปรับจังหวะการสอนให้เหมาะสมกับระดับนักเรียน', 'ควรเพิ่มแบบฝึกหัดท้ายบทสำหรับทบทวน', 'ผู้สอนเตรียมสื่อดี ควรปรับจังหวะให้ลื่นไหลขึ้น', 'e002'],
    [now, 'สมหญิง แก้วมณี', '2026-07-16', 'สอนวิทยาศาสตร์ได้ดี มีการสาธิต experiment จริง นักเรียนตื่นเต้นและสนใจ', 'ควรเชื่อมโยงเนื้อหากับชีวิตจริงให้มากขึ้น', 'ควรจัด Lab ให้นักเรียนได้ทดลองเอง', 'ผู้สอนมีทักษะสาธิตดี ควรเพิ่มกิจกรรม hands-on', 'e003'],
    [now, 'มุสลิม ดอเลาะ', '2026-07-21', 'สอนอิสลามศึกษาได้อย่างน่าเชื่อถือ มีความรู้ลึกซึ้ง นักเรียนให้ความเคารพ', 'ควรเพิ่มกิจกรรมอภิปรายในชั้นเรียน', 'ควรนำประวัติศาสตร์ท้องถิ่นมาเชื่อมโยง', 'ผู้สอนมีความรู้ดีมาก ควรพัฒนาเทคนิคการสอนเพิ่มเติม', 'e004'],
    [now, 'อรุณ สุขสวัสดิ์', '2026-07-17', 'สอนภาษาไทยได้อย่างมีชีวิตชีวา มีการเล่านิทานประกอบ นักเรียนเพลิดเพลิน', 'ควรให้นักเรียนฝึกเขียนมากขึ้น', 'ควรใช้บทเพลงไทยเดิมในการสอน', 'ผู้สอนมีเทคนิคเล่าเรื่องดี ควรเน้นทักษะการเขียนเพิ่ม', 'e005'],
    [now, 'รอฮานี หะยีซา', '2026-07-22', 'สอนภาษาอังกฤษได้ดี มีการใช้ TPR และเพลง นักเรียนสนุกกับการเรียน', 'ควรปรับระดับภาษาให้เหมาะสมกับชั้นเรียน', 'ควรจัดกิจกรรม role play มากขึ้น', 'ผู้สอนใช้เทคนิค TPR ได้ดี ควรเพิ่มกิจกรรมสื่อสาร', 'e006'],
  ];
  await appendRows('Supervision', evals);

  console.log('\n=== SEED COMPLETE ===');
  console.log('Bookings: ' + bookings.length);
  console.log('Files: ' + files.length);
  console.log('Evaluations: ' + evals.length);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
