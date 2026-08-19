// 1. KHỞI TẠO STATE (Luôn đọc từ ổ cứng đầu tiên)
let loans = JSON.parse(localStorage.getItem('myLoans')) || [];
let currentLang = localStorage.getItem('appLang') || 'vi';

// 2. TỪ ĐIỂN
const dict = {
  vi: {
    appTitle: "Quản Lý Lãi Suất", btnNotify: "Bật Thông Báo",
    statPrincipal: "Tổng Vốn Cho Vay", statInterest: "Dự Kiến Lãi Tháng Này", statPeople: "Số Hợp Đồng Hiện Tại",
    formTitle: "+ Thêm Hợp Đồng Mới", lbName: "Tên người vay", phName: "VD: Nguyễn Văn A",
    lbAmount: "Số tiền gốc (VNĐ)", phAmount: "VD: 10,000,000", lbRate: "Lãi suất tháng (%)", phRate: "VD: 2.5",
    lbDay: "Ngày đóng (1-31)", phDay: "VD: 15", btnSave: "Lưu Hợp Đồng",
    tableTitle: "Danh Sách Theo Dõi", thName: "Họ Tên", thPrincipal: "Tiền Gốc", thRate: "Lãi Suất",
    thInterest: "Tiền Lãi/Tháng", thDate: "Ngày Thu", thStatus: "Trạng Thái", thAction: "Thao Tác",
    emptyState: "Chưa có dữ liệu. Hãy thêm hợp đồng mới ở form phía trên.", btnDelete: "Xóa",
    txtToday: "Hôm nay đến hạn!", txtOverdue: "Quá hạn", txtDays: "ngày", txtLeft: "Còn",
    msgAlert: "Vui lòng nhập đúng và đầy đủ thông tin!", msgDelete: "Xác nhận xóa hợp đồng này?"
  },
  en: {
    appTitle: "Interest Manager", btnNotify: "Enable Alerts",
    statPrincipal: "Total Principal Lent", statInterest: "Expected Monthly Interest", statPeople: "Active Contracts",
    formTitle: "+ Add New Contract", lbName: "Borrower Name", phName: "Ex: John Doe",
    lbAmount: "Principal Amount", phAmount: "Ex: 10,000", lbRate: "Monthly Rate (%)", phRate: "Ex: 2.5",
    lbDay: "Repayment Day (1-31)", phDay: "Ex: 15", btnSave: "Save Contract",
    tableTitle: "Tracking List", thName: "Name", thPrincipal: "Principal", thRate: "Rate",
    thInterest: "Monthly Interest", thDate: "Due Date", thStatus: "Status", thAction: "Action",
    emptyState: "No data available. Add a new contract above.", btnDelete: "Delete",
    txtToday: "Due Today!", txtOverdue: "Overdue by", txtDays: "days", txtLeft: "In",
    msgAlert: "Please fill in all fields correctly!", msgDelete: "Are you sure you want to delete this?"
  }
};

const t = (key) => dict[currentLang][key];

// 3. UI & RENDER LOGIC
function applyLanguage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[currentLang][key]) el.innerHTML = dict[currentLang][key];
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (dict[currentLang][key]) el.placeholder = dict[currentLang][key];
  });
  document.getElementById('btn-vi').classList.toggle('active', currentLang === 'vi');
  document.getElementById('btn-en').classList.toggle('active', currentLang === 'en');
  renderTable(); 
}

function setLang(lang) {
  currentLang = lang; 
  localStorage.setItem('appLang', lang); 
  applyLanguage();
}

function formatMoneyInput(input) {
  let val = input.value.replace(/[^0-9]/g, '');
  if(val) input.value = parseInt(val).toLocaleString('vi-VN');
  else input.value = '';
}

const formatCurrency = (num) => {
  return currentLang === 'vi' ? num.toLocaleString('vi-VN') + ' đ' : '$' + num.toLocaleString('en-US');
};

function updateDashboard() {
  const totalP = loans.reduce((sum, l) => sum + l.amount, 0);
  const totalI = loans.reduce((sum, l) => sum + l.monthlyInterest, 0);
  document.getElementById('totalPrincipal').textContent = formatCurrency(totalP);
  document.getElementById('totalInterest').textContent = formatCurrency(totalI);
  document.getElementById('totalPeople').textContent = loans.length;
}

function renderTable() {
  const tbody = document.getElementById('loanTable');
  const emptyState = document.getElementById('emptyState');
  tbody.innerHTML = '';
  emptyState.style.display = loans.length === 0 ? 'block' : 'none';

  const today = new Date(); 
  const currentDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  
  let sortedLoans = [...loans].sort((a, b) => a.payDay - b.payDay);

  sortedLoans.forEach(item => {
    let actualPayDay = item.payDay > daysInMonth ? daysInMonth : item.payDay;
    let statusHtml = '';
    
    if (currentDay === actualPayDay) {
      statusHtml = `<span class="badge badge-warning">${t('txtToday')}</span>`;
    } else if (currentDay > actualPayDay) {
      statusHtml = `<span class="badge badge-danger">${t('txtOverdue')} ${currentDay - actualPayDay} ${t('txtDays')}</span>`;
    } else {
      statusHtml = `<span class="badge badge-success">${t('txtLeft')} ${actualPayDay - currentDay} ${t('txtDays')}</span>`;
    }

    const dateStr = currentLang === 'vi' ? `Ngày ${actualPayDay}` : `Day ${actualPayDay}`;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${formatCurrency(item.amount)}</td>
      <td>${item.rate}%</td>
      <td style="color: var(--success); font-weight: 600;">${formatCurrency(item.monthlyInterest)}</td>
      <td>${dateStr}</td>
      <td>${statusHtml}</td>
      <td><button class="btn-delete" onclick="deletePerson(${item.id})">${t('btnDelete')}</button></td>
    `;
    tbody.appendChild(row);
  });
}

// 4. BUSINESS LOGIC (CRUD)
function addPerson() {
  const name = document.getElementById('name').value.trim();
  let rawAmount = document.getElementById('amount').value.replace(/[^0-9]/g, '');
  const amount = parseFloat(rawAmount);
  let rawRate = document.getElementById('rate').value.replace(',', '.');
  const rate = parseFloat(rawRate);
  const payDay = parseInt(document.getElementById('payDay').value);

  if (!name || isNaN(amount) || isNaN(rate) || isNaN(payDay) || payDay < 1 || payDay > 31) {
    alert(t('msgAlert')); return;
  }
  
  const monthlyInterest = amount * (rate / 100);
  loans.push({ id: Date.now(), name, amount, rate, monthlyInterest, payDay });
  saveData(); 
  clearForm(); 
  checkTodayReminders(false);
}

function deletePerson(id) {
  if(confirm(t('msgDelete'))) { 
    loans = loans.filter(i => i.id !== id); 
    saveData(); 
  }
}

function saveData() { 
  localStorage.setItem('myLoans', JSON.stringify(loans)); 
  updateDashboard();
  renderTable();
}

function clearForm() {
  ['name', 'amount', 'rate', 'payDay'].forEach(id => document.getElementById(id).value = '');
}

// 5. NOTIFICATION LOGIC
function requestNotification() {
  if ('Notification' in window) {
    Notification.requestPermission().then(p => {
      if (p === 'granted') checkTodayReminders(true); 
      else alert('Permission Denied.');
    });
  }
}

function checkTodayReminders(forceNotify = false) {
  if (Notification.permission !== 'granted') return;
  const todayStr = new Date().toDateString();
  if (localStorage.getItem('lastNotifiedDate') === todayStr && !forceNotify) return;

  const today = new Date(); 
  const currentDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  let notifyCount = 0;

  loans.forEach(item => {
    let actualPayDay = item.payDay > daysInMonth ? daysInMonth : item.payDay;
    if (actualPayDay === currentDay) {
      new Notification(currentLang === 'vi' ? '📢 Đến hạn thu lãi!' : '📢 Interest Due!', {
        body: `${item.name}: ${formatCurrency(item.monthlyInterest)}`
      });
      notifyCount++;
    }
  });
  
  if (notifyCount > 0) localStorage.setItem('lastNotifiedDate', todayStr);
}

// 6. KHỞI CHẠY HỆ THỐNG
function initApp() {
  applyLanguage();
  updateDashboard();
  renderTable();
  setTimeout(() => checkTodayReminders(false), 2000);
}

// Gọi hàm init ngay khi script được load
initApp();
