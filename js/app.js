/* ========== CONFIGURATION ========== */
const CONFIG = {
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyR0E8VU5HJp9Vz5YDdZDjctau0tuDeHGWUN_0SESxT7klSKORN/exec',
    SPREADSHEET_ID: '1e5530q7hRUdR6pNIx6tAv4JjNKadFibg7GE5ohuq4xU',
    DRIVE_FOLDER_ID: '1wVAG7EETgBcv5ftOFLLzdX-wbDEK95Dw',
    ADMIN_PASSWORD: 'admin123',
    ADMIN_USERNAME: 'admin'
};

/* ========== GLOBAL STATE ========== */
let currentUser = null;
let isAdmin = false;
let allBookings = [];
let allFiles = [];
let allEvaluations = [];
let calendarInstances = {};

/* ========== INIT ========== */
document.addEventListener('DOMContentLoaded', () => {
    initLogin();
    initNavigation();
    initSidebarToggle();
    initBookingForm();
    initFileForm();
    initEvaluationForm();
    initAdminTabs();
    initUploadArea();
    initReportButtons();
    setTodayDate();
});

/* ========== API HELPER ========== */
async function apiCall(action, data = {}) {
    try {
        const params = new URLSearchParams({ action, ...data });
        const response = await fetch(`${CONFIG.SCRIPT_URL}?${params.toString()}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: error.message };
    }
}

async function apiPost(action, data = {}) {
    try {
        const response = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...data })
        });
        return { success: true };
    } catch (error) {
        console.error('API Post Error:', error);
        return { success: false, error: error.message };
    }
}

/* ========== LOCAL STORAGE HELPER ========== */
function getLocalData(key) {
    try {
        const data = localStorage.getItem(`nited2_${key}`);
        return data ? JSON.parse(data) : [];
    } catch { return []; }
}

function setLocalData(key, data) {
    localStorage.setItem(`nited2_${key}`, JSON.stringify(data));
}

/* ========== LOGIN ========== */
function initLogin() {
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const errorEl = document.getElementById('loginError');

        if (username === CONFIG.ADMIN_USERNAME && password === CONFIG.ADMIN_PASSWORD) {
            currentUser = username;
            isAdmin = true;
            errorEl.style.display = 'none';
            showMainApp();
        } else {
            errorEl.textContent = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
            errorEl.style.display = 'block';
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        currentUser = null;
        isAdmin = false;
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('loginForm').reset();
    });
}

function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';
    document.getElementById('currentUserName').textContent = currentUser;
    if (isAdmin) {
        document.getElementById('navAdmin').style.display = 'block';
    }
    loadAllData();
    initCalendars();
}

/* ========== NAVIGATION ========== */
function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
}

function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    const pageEl = document.getElementById(`page-${page}`);
    if (navItem) navItem.classList.add('active');
    if (pageEl) pageEl.classList.add('active');

    const titles = {
        dashboard: 'แดชบอร์ด',
        booking: 'จองวันนิเทศ',
        files: 'ส่งงาน/ไฟล์',
        evaluation: 'ประเมินผลการนิเทศ',
        admin: 'ผู้ดูแลระบบ'
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;

    if (page === 'dashboard') loadDashboard();
    if (page === 'admin') loadAdminData();
    if (page === 'booking') loadMyBookings();
    if (page === 'files') loadMyFiles();
    if (page === 'evaluation') loadEvaluationData();

    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');
}

function initSidebarToggle() {
    document.getElementById('sidebarToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
}

/* ========== TODAY DATE ========== */
function setTodayDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    document.getElementById('todayDate').textContent = now.toLocaleDateString('th-TH', options);
}

/* ========== TOAST ========== */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

/* ========== MODAL ========== */
function showModal(title, body, footer = '') {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    document.getElementById('modalFooter').innerHTML = footer;
    document.getElementById('modal').style.display = 'flex';
    document.getElementById('modalClose').onclick = closeModal;
    document.querySelector('.modal-overlay').onclick = closeModal;
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

/* ========== DATA LOADING ========== */
async function loadAllData() {
    await Promise.all([
        loadBookingsData(),
        loadFilesData(),
        loadEvaluationsData()
    ]);
    loadDashboard();
}

async function loadBookingsData() {
    const result = await apiCall('getBookings');
    if (result && result.success && Array.isArray(result.data)) {
        allBookings = result.data;
    } else {
        allBookings = getLocalData('bookings');
    }
    setLocalData('bookings', allBookings);
}

async function loadFilesData() {
    const result = await apiCall('getFiles');
    if (result && result.success && Array.isArray(result.data)) {
        allFiles = result.data;
    } else {
        allFiles = getLocalData('files');
    }
    setLocalData('files', allFiles);
}

async function loadEvaluationsData() {
    const result = await apiCall('getEvaluations');
    if (result && result.success && Array.isArray(result.data)) {
        allEvaluations = result.data;
    } else {
        allEvaluations = getLocalData('evaluations');
    }
    setLocalData('evaluations', allEvaluations);
}

/* ========== DASHBOARD ========== */
function loadDashboard() {
    const totalBookings = allBookings.length;
    const completed = allBookings.filter(b => b.status === 'นิเทศแล้ว').length;
    const pending = allBookings.filter(b => b.status === 'รอดำเนินการ').length;
    const totalFiles = allFiles.length;

    document.getElementById('statTotalBookings').textContent = totalBookings;
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statFiles').textContent = totalFiles;

    loadLatestBookings();
    loadLatestFiles();
    loadDeptChart();
    loadDashboardCalendar();
}

function loadLatestBookings() {
    const tbody = document.getElementById('latestBookings');
    const recent = allBookings.slice(-5).reverse();
    tbody.innerHTML = recent.length ? recent.map(b => `
        <tr>
            <td>${formatDate(b.date)}</td>
            <td>${b.teacherName || '-'}</td>
            <td>${b.department || '-'}</td>
            <td>${getStatusBadge(b.status)}</td>
        </tr>
    `).join('') : '<tr><td colspan="4" class="text-center">ยังไม่มีข้อมูล</td></tr>';
}

function loadLatestFiles() {
    const tbody = document.getElementById('latestFiles');
    const recent = allFiles.slice(-5).reverse();
    tbody.innerHTML = recent.length ? recent.map(f => `
        <tr>
            <td>${formatDate(f.timestamp)}</td>
            <td>${f.teacherName || '-'}</td>
            <td>${f.fileType || '-'}</td>
            <td>${getStatusBadge(f.status)}</td>
        </tr>
    `).join('') : '<tr><td colspan="4" class="text-center">ยังไม่มีข้อมูล</td></tr>';
}

function loadDeptChart() {
    const ctx = document.getElementById('deptChart');
    if (!ctx) return;
    if (calendarInstances.deptChart) calendarInstances.deptChart.destroy();

    const deptCounts = {};
    allBookings.forEach(b => {
        const dept = b.department || 'ไม่ระบุ';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    const labels = Object.keys(deptCounts);
    const data = Object.values(deptCounts);
    const colors = ['#E6A817', '#D32F2F', '#1A1A2E', '#FF9800', '#4CAF50', '#2196F3', '#9C27B0', '#00BCD4', '#795548'];

    calendarInstances.deptChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'จำนวนการจอง',
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

function loadDashboardCalendar() {
    const container = document.getElementById('dashboardCalendar');
    if (!container) return;
    if (calendarInstances.dashboard) calendarInstances.dashboard.destroy();

    const events = allBookings.map(b => ({
        title: `${b.teacherName || ''} - ${b.department || ''}`,
        date: b.date,
        color: getEventColor(b.status),
        extendedProps: { status: b.status }
    }));

    calendarInstances.dashboard = new FullCalendar.Calendar(container, {
        initialView: 'dayGridMonth',
        locale: 'th',
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth' },
        events: events,
        height: 'auto',
        eventDisplay: 'block'
    });
    calendarInstances.dashboard.render();
}

/* ========== BOOKING ========== */
function initBookingForm() {
    const form = document.getElementById('bookingForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const booking = {
            date: document.getElementById('bookDate').value,
            time: document.getElementById('bookTime').value,
            teacherName: document.getElementById('bookTeacher').value.trim(),
            department: document.getElementById('bookDepartment').value,
            period: document.getElementById('bookPeriod').value,
            subjectName: document.getElementById('bookSubject').value.trim(),
            subjectCode: document.getElementById('bookSubjectCode').value.trim(),
            classLevel: document.getElementById('bookClassLevel').value,
            room: document.getElementById('bookRoom').value.trim(),
            status: 'รอดำเนินการ',
            timestamp: new Date().toISOString()
        };

        const conflict = allBookings.find(b =>
            b.date === booking.date && b.time === booking.time && b.status !== 'ปฏิเสธ'
        );

        if (conflict) {
            showToast('วันและเวลานี้ถูกจองแล้ว กรุณาเลือกเวลาอื่น', 'error');
            return;
        }

        const result = await apiPost('addBooking', booking);

        booking.id = Date.now().toString();
        allBookings.push(booking);
        setLocalData('bookings', allBookings);

        form.reset();
        showToast('จองวันนิเทศสำเร็จ! รอการยืนยันจากผู้ดูแล');
        loadMyBookings();
        loadDashboard();
        refreshCalendars();
    });
}

function loadMyBookings() {
    const tbody = document.getElementById('myBookings');
    const myBookings = allBookings.filter(b => {
        return isAdmin || true;
    }).reverse();

    tbody.innerHTML = myBookings.length ? myBookings.map(b => `
        <tr>
            <td>${formatDate(b.date)}</td>
            <td>${b.time || '-'}</td>
            <td>${b.department || '-'}</td>
            <td>${b.subjectName || '-'}</td>
            <td>${b.classLevel || '-'}</td>
            <td>${b.room || '-'}</td>
            <td>${getStatusBadge(b.status)}</td>
            <td>
                ${b.status === 'รอดำเนินการ' ? `<button class="btn btn-danger btn-sm" onclick="cancelBooking('${b.id || ''}')"><i class="fas fa-times"></i></button>` : ''}
            </td>
        </tr>
    `).join('') : '<tr><td colspan="8" class="text-center">ยังไม่มีรายการจอง</td></tr>';
}

function cancelBooking(id) {
    if (!confirm('ต้องการยกเลิกการจองนี้ใช่หรือไม่?')) return;
    const idx = allBookings.findIndex(b => b.id === id);
    if (idx !== -1) {
        allBookings.splice(idx, 1);
        setLocalData('bookings', allBookings);
        apiPost('deleteBooking', { id });
        showToast('ยกเลิกการจองแล้ว');
        loadMyBookings();
        loadDashboard();
        refreshCalendars();
    }
}

/* ========== FILES ========== */
function initFileForm() {
    const form = document.getElementById('fileForm');
    const fileType = document.getElementById('fileType');

    fileType.addEventListener('change', () => {
        const val = fileType.value;
        document.getElementById('fileUploadSection').style.display =
            (val === 'คลิปวิดีโอ') ? 'none' : 'block';
        document.getElementById('fileLinkSection').style.display =
            (val === 'คลิปวิดีโอ') ? 'block' : 'none';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = document.getElementById('fileType').value;
        const teacher = document.getElementById('fileTeacher').value.trim();

        let fileData = {
            teacherName: teacher,
            fileType: type,
            status: 'รอตรวจสอบ',
            timestamp: new Date().toISOString()
        };

        if (type === 'คลิปวิดีโอ') {
            fileData.fileUrl = document.getElementById('fileLink').value.trim();
        } else {
            const fileInput = document.getElementById('fileInput');
            if (!fileInput.files.length) {
                showToast('กรุณาเลือกไฟล์', 'error');
                return;
            }
            fileData.fileName = fileInput.files[0].name;
            fileData.fileUrl = 'pending_upload';
        }

        const result = await apiPost('addFile', fileData);
        fileData.id = Date.now().toString();
        allFiles.push(fileData);
        setLocalData('files', allFiles);

        form.reset();
        document.getElementById('fileUploadSection').style.display = 'none';
        document.getElementById('fileLinkSection').style.display = 'none';
        document.getElementById('filePreview').style.display = 'none';
        document.getElementById('uploadProgress').style.display = 'none';
        showToast('ส่งไฟล์งานสำเร็จ!');
        loadMyFiles();
    });
}

function initUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) handleFileSelect(fileInput.files[0]);
    });

    document.getElementById('removeFile').addEventListener('click', () => {
        document.getElementById('fileInput').value = '';
        document.getElementById('filePreview').style.display = 'none';
        document.getElementById('uploadArea').style.display = 'block';
    });
}

function handleFileSelect(file) {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast('ไฟล์มีขนาดใหญ่เกิน 10MB', 'error');
        return;
    }
    document.getElementById('fileName').textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    document.getElementById('filePreview').style.display = 'flex';
    document.getElementById('uploadArea').style.display = 'none';
}

function loadMyFiles() {
    const tbody = document.getElementById('myFiles');
    const recent = allFiles.slice(-10).reverse();
    tbody.innerHTML = recent.length ? recent.map(f => `
        <tr>
            <td>${formatDate(f.timestamp)}</td>
            <td>${f.teacherName || '-'}</td>
            <td>${f.fileType || '-'}</td>
            <td>${f.fileName || (f.fileUrl ? '<a href="' + f.fileUrl + '" target="_blank"><i class="fas fa-external-link-alt"></i> เปิดลิงก์</a>' : '-')}</td>
            <td>${getStatusBadge(f.status)}</td>
        </tr>
    `).join('') : '<tr><td colspan="5" class="text-center">ยังไม่มีไฟล์งาน</td></tr>';
}

/* ========== EVALUATION ========== */
function initEvaluationForm() {
    const form = document.getElementById('evaluationForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const evalData = {
            teacherName: document.getElementById('evalTeacher').value,
            supervisionDate: document.getElementById('evalDate').value,
            strengths: document.getElementById('evalStrengths').value.trim(),
            improvements: document.getElementById('evalImprovements').value.trim(),
            suggestions: document.getElementById('evalSuggestions').value.trim(),
            summary: document.getElementById('evalSummary').value,
            timestamp: new Date().toISOString()
        };

        const result = await apiPost('addEvaluation', evalData);
        evalData.id = Date.now().toString();
        allEvaluations.push(evalData);
        setLocalData('evaluations', allEvaluations);

        form.reset();
        showToast('บันทึกผลการประเมินสำเร็จ!');
        loadEvaluationList();
    });
}

function loadEvaluationData() {
    populateTeacherDropdown('evalTeacher');
    loadEvaluationList();
}

function loadEvaluationList() {
    const tbody = document.getElementById('evaluations');
    const recent = allEvaluations.slice(-10).reverse();
    tbody.innerHTML = recent.length ? recent.map(e => `
        <tr>
            <td>${formatDate(e.timestamp)}</td>
            <td>${e.teacherName || '-'}</td>
            <td>${formatDate(e.supervisionDate)}</td>
            <td>${truncate(e.strengths, 40)}</td>
            <td>${truncate(e.improvements, 40)}</td>
            <td>${getLevelBadge(e.summary)}</td>
        </tr>
    `).join('') : '<tr><td colspan="6" class="text-center">ยังไม่มีผลการประเมิน</td></tr>';
}

function populateTeacherDropdown(selectId) {
    const select = document.getElementById(selectId);
    const teachers = [...new Set(allBookings.map(b => b.teacherName).filter(Boolean))];
    select.innerHTML = '<option value="">-- เลือกครู --</option>' +
        teachers.map(t => `<option value="${t}">${t}</option>`).join('');

    if (selectId === 'reportTeacher') {
        const reportSelect = document.getElementById('reportTeacher');
        if (reportSelect) {
            reportSelect.innerHTML = '<option value="">-- เลือกครู --</option>' +
                teachers.map(t => `<option value="${t}">${t}</option>`).join('');
        }
    }
}

/* ========== CALENDAR ========== */
function initCalendars() {
    const bookingCal = document.getElementById('bookingCalendar');
    if (bookingCal) {
        if (calendarInstances.booking) calendarInstances.booking.destroy();
        calendarInstances.booking = new FullCalendar.Calendar(bookingCal, {
            initialView: 'dayGridMonth',
            locale: 'th',
            headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth' },
            events: allBookings.map(b => ({
                title: `${b.teacherName || ''} (${b.time || ''})`,
                date: b.date,
                color: getEventColor(b.status)
            })),
            height: 'auto',
            dateClick: function(info) {
                document.getElementById('bookDate').value = info.dateStr;
            }
        });
        calendarInstances.booking.render();
    }
}

function refreshCalendars() {
    initCalendars();
    loadDashboardCalendar();
}

function getEventColor(status) {
    switch (status) {
        case 'ยืนยันแล้ว': return '#4CAF50';
        case 'นิเทศแล้ว': return '#2196F3';
        case 'ปฏิเสธ': return '#F44336';
        default: return '#E6A817';
    }
}

/* ========== ADMIN ========== */
function initAdminTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
}

function loadAdminData() {
    loadAdminBookings();
    loadAdminFiles();
    loadAdminEvaluations();
    populateTeacherDropdown('reportTeacher');
}

function loadAdminBookings() {
    const tbody = document.getElementById('adminBookings');
    let filtered = [...allBookings].reverse();

    const filterDate = document.getElementById('adminFilterDate').value;
    const filterStatus = document.getElementById('adminFilterStatus').value;
    if (filterDate) filtered = filtered.filter(b => b.date === filterDate);
    if (filterStatus) filtered = filtered.filter(b => b.status === filterStatus);

    tbody.innerHTML = filtered.length ? filtered.map((b, i) => `
        <tr>
            <td>${formatDate(b.date)}</td>
            <td>${b.time || '-'}</td>
            <td>${b.teacherName || '-'}</td>
            <td>${b.department || '-'}</td>
            <td>${b.subjectName || '-'}</td>
            <td>${b.classLevel || '-'}/${b.room || '-'}</td>
            <td>${getStatusBadge(b.status)}</td>
            <td>
                <div class="btn-group">
                    ${b.status === 'รอดำเนินการ' ? `
                        <button class="btn btn-success btn-sm" onclick="updateBookingStatus(${i}, 'ยืนยันแล้ว')"><i class="fas fa-check"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="updateBookingStatus(${i}, 'ปฏิเสธ')"><i class="fas fa-times"></i></button>
                    ` : ''}
                    ${b.status === 'ยืนยันแล้ว' ? `
                        <button class="btn btn-info btn-sm" onclick="updateBookingStatus(${i}, 'นิเทศแล้ว')"><i class="fas fa-check-double"></i></button>
                    ` : ''}
                    <button class="btn btn-secondary btn-sm" onclick="deleteBooking(${i})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="8" class="text-center">ไม่มีข้อมูล</td></tr>';

    // Populate filter dates
    const dates = [...new Set(allBookings.map(b => b.date).filter(Boolean))].sort();
    const dateSelect = document.getElementById('adminFilterDate');
    const currentVal = dateSelect.value;
    dateSelect.innerHTML = '<option value="">ทุกวันที่</option>' +
        dates.map(d => `<option value="${d}" ${d === currentVal ? 'selected' : ''}>${formatDate(d)}</option>`).join('');

    dateSelect.onchange = loadAdminBookings;
    document.getElementById('adminFilterStatus').onchange = loadAdminBookings;
}

function updateBookingStatus(index, status) {
    const reversedIdx = allBookings.length - 1 - index;
    const realIdx = allBookings.length - 1 - [...allBookings].reverse().findIndex((b, i) => i === index);
    const booking = [...allBookings].reverse()[index];
    const originalIdx = allBookings.findIndex(b => b.id === booking.id);
    if (originalIdx !== -1) {
        allBookings[originalIdx].status = status;
        setLocalData('bookings', allBookings);
        apiPost('updateBookingStatus', { id: booking.id, status });
        showToast(`อัพเดตสถานะเป็น "${status}" แล้ว`);
        loadAdminBookings();
        loadDashboard();
        refreshCalendars();
    }
}

function deleteBooking(index) {
    if (!confirm('ต้องการลบการจองนี้ใช่หรือไม่?')) return;
    const booking = [...allBookings].reverse()[index];
    const originalIdx = allBookings.findIndex(b => b.id === booking.id);
    if (originalIdx !== -1) {
        allBookings.splice(originalIdx, 1);
        setLocalData('bookings', allBookings);
        apiPost('deleteBooking', { id: booking.id });
        showToast('ลบการจองแล้ว');
        loadAdminBookings();
        loadDashboard();
        refreshCalendars();
    }
}

function loadAdminFiles() {
    const tbody = document.getElementById('adminFiles');
    const recent = [...allFiles].reverse();
    tbody.innerHTML = recent.length ? recent.map((f, i) => `
        <tr>
            <td>${formatDate(f.timestamp)}</td>
            <td>${f.teacherName || '-'}</td>
            <td>${f.fileType || '-'}</td>
            <td>${f.fileName || (f.fileUrl ? '<a href="' + f.fileUrl + '" target="_blank"><i class="fas fa-external-link-alt"></i></a>' : '-')}</td>
            <td>${getStatusBadge(f.status)}</td>
            <td>
                <div class="btn-group">
                    ${f.status !== 'ผ่าน' ? `<button class="btn btn-success btn-sm" onclick="updateFileStatus(${i}, 'ผ่าน')"><i class="fas fa-check"></i></button>` : ''}
                    ${f.status !== 'ปรับปรุง' ? `<button class="btn btn-warning btn-sm" onclick="updateFileStatus(${i}, 'ปรับปรุง')"><i class="fas fa-exclamation-triangle"></i></button>` : ''}
                </div>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="6" class="text-center">ไม่มีไฟล์งาน</td></tr>';
}

function updateFileStatus(index, status) {
    const file = [...allFiles].reverse()[index];
    const originalIdx = allFiles.findIndex(f => f.id === file.id);
    if (originalIdx !== -1) {
        allFiles[originalIdx].status = status;
        setLocalData('files', allFiles);
        apiPost('updateFileStatus', { id: file.id, status });
        showToast(`อัพเดตสถานะไฟล์เป็น "${status}" แล้ว`);
        loadAdminFiles();
    }
}

function loadAdminEvaluations() {
    const tbody = document.getElementById('adminEvaluations');
    const recent = [...allEvaluations].reverse();
    tbody.innerHTML = recent.length ? recent.map(e => `
        <tr>
            <td>${formatDate(e.timestamp)}</td>
            <td>${e.teacherName || '-'}</td>
            <td>${formatDate(e.supervisionDate)}</td>
            <td>${truncate(e.strengths, 40)}</td>
            <td>${truncate(e.improvements, 40)}</td>
            <td>${truncate(e.suggestions, 40)}</td>
            <td>${getLevelBadge(e.summary)}</td>
        </tr>
    `).join('') : '<tr><td colspan="7" class="text-center">ไม่มีผลการประเมิน</td></tr>';
}

/* ========== REPORTS ========== */
function initReportButtons() {
    document.getElementById('printIndividualReport')?.addEventListener('click', printIndividualReport);
    document.getElementById('printDeptReport')?.addEventListener('click', printDeptReport);
}

function printIndividualReport() {
    const teacher = document.getElementById('reportTeacher').value;
    if (!teacher) { showToast('กรุณาเลือกครู', 'error'); return; }

    const bookings = allBookings.filter(b => b.teacherName === teacher);
    const evaluations = allEvaluations.filter(e => e.teacherName === teacher);
    const files = allFiles.filter(f => f.teacherName === teacher);

    const reportContent = document.getElementById('reportContent');
    const reportBody = document.getElementById('reportBody');
    reportContent.style.display = 'block';

    reportBody.innerHTML = `
        <div class="print-report-title">รายงานผลการนิเทศ โรงเรียนตากใบ</div>
        <div class="print-report-sub">ชื่อครู: ${teacher} | วันที่ออกรายงาน: ${formatDate(new Date().toISOString())}</div>

        <h4 style="margin: 16px 0 8px; color: var(--primary);">ประวัติการจองนิเทศ (${bookings.length} ครั้ง)</h4>
        <table class="data-table" style="margin-bottom: 20px;">
            <thead>
                <tr><th>วันที่</th><th>เวลา</th><th>วิชา</th><th>ชั้น/ห้อง</th><th>สถานะ</th></tr>
            </thead>
            <tbody>
                ${bookings.map(b => `
                    <tr>
                        <td>${formatDate(b.date)}</td>
                        <td>${b.time || '-'}</td>
                        <td>${b.subjectName || '-'}</td>
                        <td>${b.classLevel || '-'}/${b.room || '-'}</td>
                        <td>${getStatusBadge(b.status)}</td>
                    </tr>
                `).join('') || '<tr><td colspan="5">-</td></tr>'}
            </tbody>
        </table>

        <h4 style="margin: 16px 0 8px; color: var(--primary);">ผลการประเมิน (${evaluations.length} ครั้ง)</h4>
        <table class="data-table" style="margin-bottom: 20px;">
            <thead>
                <tr><th>วันที่นิเทศ</th><th>จุดเด่น</th><th>จุดพัฒนา</th><th>ระดับ</th></tr>
            </thead>
            <tbody>
                ${evaluations.map(e => `
                    <tr>
                        <td>${formatDate(e.supervisionDate)}</td>
                        <td>${e.strengths || '-'}</td>
                        <td>${e.improvements || '-'}</td>
                        <td>${getLevelBadge(e.summary)}</td>
                    </tr>
                `).join('') || '<tr><td colspan="4">-</td></tr>'}
            </tbody>
        </table>

        <h4 style="margin: 16px 0 8px; color: var(--primary);">ไฟล์งาน (${files.length} ไฟล์)</h4>
        <table class="data-table">
            <thead>
                <tr><th>วันที่</th><th>ประเภท</th><th>ไฟล์</th><th>สถานะ</th></tr>
            </thead>
            <tbody>
                ${files.map(f => `
                    <tr>
                        <td>${formatDate(f.timestamp)}</td>
                        <td>${f.fileType || '-'}</td>
                        <td>${f.fileName || '-'}</td>
                        <td>${getStatusBadge(f.status)}</td>
                    </tr>
                `).join('') || '<tr><td colspan="4">-</td></tr>'}
            </tbody>
        </table>

        <div style="margin-top: 30px; text-align: right;">
            <button class="btn btn-primary" onclick="window.print()"><i class="fas fa-print"></i> พิมพ์รายงาน</button>
        </div>
    `;
}

function printDeptReport() {
    const dept = document.getElementById('reportDepartment').value;
    if (!dept) { showToast('กรุณาเลือกกลุ่มสาระ', 'error'); return; }

    const bookings = allBookings.filter(b => b.department === dept);
    const evaluations = allEvaluations.filter(e => {
        return bookings.some(b => b.teacherName === e.teacherName);
    });

    const reportContent = document.getElementById('reportContent');
    const reportBody = document.getElementById('reportBody');
    reportContent.style.display = 'block';

    const teachers = [...new Set(bookings.map(b => b.teacherName))];

    reportBody.innerHTML = `
        <div class="print-report-title">รายงานกลุ่มสาระการเรียนรู้: ${dept}</div>
        <div class="print-report-sub">โรงเรียนตากใบ | วันที่ออกรายงาน: ${formatDate(new Date().toISOString())}</div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin: 20px 0;">
            <div class="stat-card stat-yellow" style="margin:0;">
                <div class="stat-info"><h3>${bookings.length}</h3><p>การจองทั้งหมด</p></div>
            </div>
            <div class="stat-card stat-red" style="margin:0;">
                <div class="stat-info"><h3>${bookings.filter(b=>b.status==='นิเทศแล้ว').length}</h3><p>นิเทศแล้ว</p></div>
            </div>
            <div class="stat-card stat-dark" style="margin:0;">
                <div class="stat-info"><h3>${teachers.length}</h3><p>จำนวนครู</p></div>
            </div>
        </div>

        <h4 style="margin: 16px 0 8px; color: var(--primary);">รายชื่อครูและจำนวนการจอง</h4>
        <table class="data-table" style="margin-bottom: 20px;">
            <thead>
                <tr><th>ลำดับ</th><th>ชื่อครู</th><th>จำนวนครั้งที่จอง</th><th>นิเทศแล้ว</th></tr>
            </thead>
            <tbody>
                ${teachers.map((t, i) => {
                    const tBookings = bookings.filter(b => b.teacherName === t);
                    return `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${t}</td>
                            <td>${tBookings.length}</td>
                            <td>${tBookings.filter(b => b.status === 'นิเทศแล้ว').length}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>

        <div style="margin-top: 30px; text-align: right;">
            <button class="btn btn-primary" onclick="window.print()"><i class="fas fa-print"></i> พิมพ์รายงาน</button>
        </div>
    `;
}

/* ========== HELPERS ========== */
function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return dateStr; }
}

function truncate(str, len) {
    if (!str) return '-';
    return str.length > len ? str.substring(0, len) + '...' : str;
}

function getStatusBadge(status) {
    const map = {
        'รอดำเนินการ': 'badge-pending',
        'ยืนยันแล้ว': 'badge-confirmed',
        'ปฏิเสธ': 'badge-rejected',
        'นิเทศแล้ว': 'badge-completed',
        'รอตรวจสอบ': 'badge-review',
        'ผ่าน': 'badge-approved',
        'ปรับปรุง': 'badge-pending'
    };
    return `<span class="badge ${map[status] || 'badge-pending'}">${status || '-'}</span>`;
}

function getLevelBadge(level) {
    const map = {
        'ดีมาก': 'badge-very-good',
        'ดี': 'badge-good',
        'พอใช้': 'badge-average',
        'ปรับปรุง': 'badge-need-improve'
    };
    return `<span class="badge ${map[level] || ''}">${level || '-'}</span>`;
}
