# ระบบนิเทศภายในโรงเรียนตากใบ

เว็บไซต์: https://takbaii.github.io/nited2/
Branch: `main`

## การเชื่อมต่อข้อมูล

- Google Sheets: `1e5530q7hRUdR6pNIx6tAv4JjNKadFibg7GE5ohuq4xU`
- Google Drive: `1wVAG7EETgBcv5ftOFLLzdX-wbDEK95Dw`
- Apps Script Web App: configured in `js/app.js`

## โครงสร้าง

- `index.html` — GitHub Pages frontend
- `js/app.js` — frontend/API client; ไม่มี CORS `fetch()`
- `css/style.css` — styles
- `apps-script/Code.gs` — Google Apps Script backend
- `apps-script/appsscript.json` — Apps Script manifest

## สำคัญ: Deploy Apps Script

GitHub ไม่สามารถอัปเดต Deployment ของ Google Apps Script โดยอัตโนมัติ ดังนั้นหลังแก้ `apps-script/Code.gs` ต้องนำโค้ดไปอัปเดตในโปรเจกต์ Apps Script ที่ต้องการใช้ แล้วสร้าง version ใหม่ของ Web App deployment

ตั้งค่า Web App:

- Execute as: Me / User deploying
- Who has access: Anyone

จากนั้นตรวจสอบ:

`https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec?action=health&callback=test`

ควรได้ JavaScript JSONP ที่ขึ้นต้นด้วย `test(` และมี `"success":true`

## ตั้งค่าฐานข้อมูลครั้งแรก

รันฟังก์ชัน `setup_()` หรือ `setup()` ใน Apps Script (ถ้าใช้โค้ดเวอร์ชันนี้ให้ใช้ `setup_`) หนึ่งครั้ง เพื่อสร้างชีต:

- `Booking`
- `Files`
- `Supervision`
- `Users`

บัญชีเริ่มต้น:

- Username: `admin`
- Password: `Admin@123`

ควรเปลี่ยนรหัสผ่านทันทีหลังติดตั้งจริง

## หมายเหตุเรื่องไฟล์

การอัปโหลดไฟล์จาก GitHub Pages จะส่งข้อมูลผ่าน Apps Script ไปยัง Google Drive folder ที่กำหนดไว้ โดย frontend จำกัดขนาดไฟล์ไว้ที่ 10 MB ต่อไฟล์

## แก้ Failed to fetch

Frontend ไม่ใช้ `fetch()` ข้าม origin สำหรับ API แล้ว:

- GET ใช้ JSONP
- POST ใช้ HTML form ไปยัง Apps Script

ดังนั้นถ้ายังพบข้อความเชื่อมต่อไม่ได้ ให้ตรวจ Deployment URL/สิทธิ์ของ Web App และต้อง redeploy Apps Script version ล่าสุด
