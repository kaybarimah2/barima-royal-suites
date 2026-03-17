// ==================== CONFIG & CONSTANTS ====================
const API_BASE = '/api'; 

const ROOM_TEMPLATES = [
  { type: 'Single', price: 129, desc: 'Cozy room with queen bed', amenities: ['WiFi', 'AC', 'TV'] },
  { type: 'Double', price: 199, desc: 'Spacious room with two double beds', amenities: ['WiFi', 'AC', 'TV', 'Mini Bar'] },
  { type: 'Deluxe', price: 299, desc: 'Luxury room with city view', amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony'] },
  { type: 'Suite', price: 499, desc: 'Premium suite with living area', amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony', 'Jacuzzi'] }
];

let allReservations = [];
let allRooms = [];
let currentUser = null; // Single source of truth for login

// ==================== HELPER FUNCTIONS ====================
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  if (!toast) return;
  toastMsg.textContent = message;
  toast.style.background = type === 'success' ? '#d1fae5' : '#fee2e2';
  toast.style.color = type === 'success' ? '#065f46' : '#991b1b';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==================== INITIALIZATION ====================
async function initializeApp() {
  try {
    // Fetch initial rooms to show availability on home/rooms page
    const res = await fetch('/api/rooms');
    allRooms = await res.json();
    
    renderFeaturedRooms();
    renderRoomsPage();
    lucide.createIcons();
    console.log("✓ Live data loaded from Postgres");
  } catch (err) {
    console.error("Initialization Error:", err);
  }
}

// ==================== UI NAVIGATION ====================
function showPage(pageName) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${pageName}`);
  if (target) target.classList.add('active');

  // If going to Admin and not logged in, show the login form
  if (pageName === 'admin') {
    if (!currentUser) {
      document.getElementById('admin-login-container').style.display = 'flex';
      document.getElementById('admin-dashboard-container').style.display = 'none';
    } else {
      document.getElementById('admin-login-container').style.display = 'none';
      document.getElementById('admin-dashboard-container').style.display = 'block';
      refreshAdminDashboard();
    }
  }

  closeMobileMenu();
  window.scrollTo(0, 0);
}

function toggleMobileMenu() { document.getElementById('mobileMenu').classList.toggle('open'); }
function closeMobileMenu() { document.getElementById('mobileMenu').classList.remove('open'); }

// ==================== ADMIN & LOGIN LOGIC ====================
async function adminLogin(event) {
  event.preventDefault();

  const username = document.getElementById('adminUsername').value.trim();
  const password = document.getElementById('adminPassword').value.trim();
  const errorDiv = document.getElementById('admin-login-error');

  // Clear previous error
  errorDiv.style.display = 'none';

  if (!username || !password) {
    errorDiv.textContent = 'Please enter username and password';
    errorDiv.style.display = 'block';
    return;
  }

  const btn = event.target.querySelector('button');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    const res = await fetch('/api/staff/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.success) {
      currentUser = data.user;
      document.getElementById('admin-login-container').style.display = 'none';
      document.getElementById('admin-dashboard-container').style.display = 'block';
      renderReservationsTable();
      renderAdminStats();           // ← also call this so stats load from DB
      showToast('Admin login successful', 'success');
    } else {
      errorDiv.textContent = data.message || 'Invalid username or password';
      errorDiv.style.display = 'block';
    }
  } catch (err) {
    console.error(err);
    errorDiv.textContent = 'Server error. Please try again.';
    errorDiv.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function renderAdminStats(stats) {
  const container = document.getElementById('admin-stats');
  if (!container) return;
  container.innerHTML = `
    <div class="card" style="padding:1.5rem;text-align:center;">
      <p class="font-display" style="color:var(--gold);font-size:2rem;margin:0;">${stats.total_reservations}</p>
      <p style="color:var(--muted);font-size:0.75rem;text-transform:uppercase;">Total Reservations</p>
    </div>
    <div class="card" style="padding:1.5rem;text-align:center;">
      <p class="font-display" style="color:var(--gold);font-size:2rem;margin:0;">$${stats.total_revenue.toLocaleString()}</p>
      <p style="color:var(--muted);font-size:0.75rem;text-transform:uppercase;">Total Revenue</p>
    </div>
  `;
}

function renderReservationsTable() {
  const tbody = document.getElementById('reservations-tbody');
  if (!tbody) return;
  tbody.innerHTML = allReservations.map(res => `
    <tr style="border-bottom:1px solid #f1f0ed;">
      <td style="padding:1rem; font-size:0.85rem;">${res.reservation_id}</td>
      <td style="padding:1rem; font-size:0.85rem;">${res.full_name}</td>
      <td style="padding:1rem; font-size:0.85rem;">${res.room_type} (Rm ${res.room_number})</td>
      <td style="padding:1rem; font-size:0.85rem;">$${res.payment_amount}</td>
      <td style="padding:1rem;"><span class="status-badge status-confirmed">${res.reservation_status}</span></td>
    </tr>
  `).join('');
}

function adminLogout() {
  currentUser = null;
  showPage('admin');
  showToast("Logged out successfully");
}

// ==================== BOOKING LOGIC ====================
async function submitBooking(event) {
  event.preventDefault();
  const btn = document.getElementById('bookingSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Processing...';

  const bookingData = {
    full_name: document.getElementById('guestName').value,
    email: document.getElementById('guestEmail').value,
    phone_number: document.getElementById('guestPhone').value,
    national_id: document.getElementById('guestNationalId').value.toUpperCase(),
    room_type: document.getElementById('roomType').value,
    check_in_date: document.getElementById('checkIn').value,
    check_out_date: document.getElementById('checkOut').value,
    payment_method: document.getElementById('paymentMethod').value
  };

  try {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });

    if (!res.ok) throw new Error("Booking failed");
    
    const result = await res.json();
    document.getElementById('conf-resid').textContent = result.reservation_id;
    document.getElementById('booking-form-container').style.display = 'none';
    document.getElementById('booking-confirmation').style.display = 'block';
    showToast("Reservation successful!", "success");
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirm Reservation';
  }
}

// ==================== ROOMS DISPLAY ====================
function renderRoomsPage() {
  const grid = document.getElementById('rooms-grid');
  if (!grid) return;
  grid.innerHTML = ROOM_TEMPLATES.map(t => {
    const count = allRooms.filter(r => r.room_type === t.type && r.room_status === 'Available').length;
    return `
      <div class="card" style="padding:2rem; margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h3 class="font-display" style="font-size:1.5rem; margin:0;">${t.type} Suite</h3>
          <p style="color:var(--gold); font-weight:600;">$${t.price}/night</p>
          <p style="font-size:0.8rem; color:var(--muted);">${count} rooms available</p>
        </div>
        <button class="btn-gold" onclick="showPage('booking')" style="padding:0.75rem 1.5rem;">Book Now</button>
      </div>
    `;
  }).join('');
}

function renderFeaturedRooms() { /* Similar logic for home page */ }

// Initialize on Load
document.addEventListener('DOMContentLoaded', initializeApp);