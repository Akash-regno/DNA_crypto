/* ================================================================
   DNA Crypto Medical — sender-dashboard.js
   Healthcare Provider Dashboard Logic
   ================================================================ */

const API = 'http://localhost:5000/api';
let currentMasterKey = null;
let currentReportData = null;

// ── Initialize ───────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initHelixCanvas();
  initDragDrop();
  loadUserInfo();
});

// ── Check Authentication ─────────────────────────────────────────
function checkAuth() {
  const user = local
/* ================================================================
   DNA Crypto Medical — sender-dashboard.js
   Healthcare Provider Dashboard Logic
   ================================================================ */

const API = 'http://localhost:5000/api';
let currentMasterKey = null;
let currentReportData = null;

// ── Initialize ───────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initHelixCanvas();
  initDragDrop();
  loadUserInfo();
});

// ── Check Authentication ─────────────────────────────────────────
function checkAuth() {
  const user = localStorage.getItem('dna_crypto_user');
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  
  const userData = JSON.parse(user);
  if (userData.role !== 'sender') {
    window.location.href = 'receiver-dashboard.html';
  }
}

// ── Load User Info ───────────────────────────────────────────────
function loadUserInfo() {
  const user = JSON.parse(localStorage.getItem('dna_crypto_user'));
  document.getElementById('userName').textContent = user.name;
}

// ── Logout ───────────────────────────────────────────────────────
function logout() {
  localStorage.removeItem('dna_crypto_user');
  window.location.href = 'login.html';
}

// ── Preview Report ───────────────────────────────────────────────
function previewReport(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = ev => {
    const preview = document.getElementById('reportPreview');
    const content = document.getElementById('reportDropContent');
    preview.src = ev.target.result;
    preview.classList.remove('hidden');
    content.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

// ── Encrypt Report ───────────────────────────────────────────────
async function encryptReport() {
  const patientName = document.getElementById('patientName').value.trim();
  const patientEmail = document.getElementById('patientEmail').value.trim();
  const reportType = document.getElementById('reportType').value;
  const reportNotes = document.getElementById('reportNotes').value.trim();
  const fileInput = document.getElementById('reportInput');
  
  if (!patientName) {
    toast('Please enter patient name', 'error');
    return;
  }
  
  if (!patientEmail) {
    toast('Please enter patient email', 'error');
    return;
  }
  
  if (!fileInput.files.length) {
    toast('Please upload a report', 'error');
    return;
  }
  
  const btn = document.getElementById('encryptReportBtn');
  btn.disabled = true;
  showLoading('🧬 Encrypting medical report...');
  
  try {
    // Auto-generate secure master key
    const key = generateSecureKey();
    currentMasterKey = key;
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('key', key);
    
    const res = await fetch(`${API}/encrypt/image`, {
      method: 'POST',
      body: formData
    });
    
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    
    currentReportData = {
      ...json.data,
      patientName,
      patientEmail,
      reportType,
      reportNotes,
      masterKey: key,
      timestamp: new Date().toISOString()
    };
    
    // Display master key
    document.getElementById('masterKeyDisplay').textContent = key;
    document.getElementById('encryptResult').classList.remove('hidden');
    
    // Add to recent reports
    addToRecentReports(patientName, reportType);
    
    toast('✅ Report encrypted successfully!', 'success');
  } catch (err) {
    console.error(err);
    toast('Encryption failed: ' + err.message, 'error');
  } finally {
    hideLoading();
    btn.disabled = false;
  }
}

// ── Copy Key ─────────────────────────────────────────────────────
function copyKey() {
  if (!currentMasterKey) return;
  
  navigator.clipboard.writeText(currentMasterKey).then(() => {
    toast('Master key copied to clipboard!', 'success');
  });
}

// ── Send Key to Patient ──────────────────────────────────────────
function sendKeyToPatient() {
  if (!currentMasterKey || !currentReportData) return;
  
  const subject = encodeURIComponent('Your Medical Report - Secure Access Key');
  const body = encodeURIComponent(
    `Dear ${currentReportData.patientName},\n\n` +
    `Your medical report (${currentReportData.reportType}) is ready for viewing.\n\n` +
    `To access your report securely:\n` +
    `1. Visit: ${window.location.origin}/receiver-dashboard.html\n` +
    `2. Enter this master key: ${currentMasterKey}\n\n` +
    `This key is encrypted and secure. Do not share it with anyone.\n\n` +
    `Best regards,\n` +
    `${JSON.parse(localStorage.getItem('dna_crypto_user')).name}`
  );
  
  window.location.href = `mailto:${currentReportData.patientEmail}?subject=${subject}&body=${body}`;
  toast('Email client opened', 'info');
}

// ── Add to Recent Reports ────────────────────────────────────────
function addToRecentReports(patientName, reportType) {
  const reportsList = document.getElementById('reportsList');
  const emptyState = reportsList.querySelector('.empty-state');
  if (emptyState) emptyState.classList.add('hidden');
  
  const reportItem = document.createElement('div');
  reportItem.className = 'report-item';
  reportItem.innerHTML = `
    <div class="report-icon">🩺</div>
    <div class="report-info">
      <div class="report-name">${reportType} - ${patientName}</div>
      <div class="report-date">Just now</div>
    </div>
    <div class="report-status">✅ Sent</div>
  `;
  
  reportsList.insertBefore(reportItem, reportsList.firstChild);
}

// ── Drag & Drop ──────────────────────────────────────────────────
function initDragDrop() {
  const dropEl = document.getElementById('reportDrop');
  if (!dropEl) return;
  
  dropEl.addEventListener('dragover', e => {
    e.preventDefault();
    dropEl.style.borderColor = 'var(--c-accent)';
  });
  
  dropEl.addEventListener('dragleave', () => {
    dropEl.style.borderColor = '';
  });
  
  dropEl.addEventListener('drop', e => {
    e.preventDefault();
    dropEl.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    const input = document.getElementById('reportInput');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    
    previewReport({ target: input });
  });
}

// ── Generate Secure Key ──────────────────────────────────────────
function generateSecureKey() {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const length = 24;
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  let key = '';
  for (let i = 0; i < length; i++) {
    key += charset[array[i] % charset.length];
  }
  
  return key;
}

// ── Show/Hide Loading ────────────────────────────────────────────
function showLoading(msg = 'Processing…') {
  document.getElementById('loadingMsg').textContent = msg;
  document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}

// ── Toast ────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: '💬' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(t);
  setTimeout(() => t.remove(), 3200);
}
