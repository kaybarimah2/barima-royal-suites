// ==================== PASSWORD VISIBILITY TOGGLE ====================
function togglePasswordVisibility() {
  const passwordInput = document.getElementById('adminPassword');
  const toggleIcon = document.getElementById('togglePasswordIcon');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleIcon.setAttribute('data-lucide', 'eye-off');
  } else {
    passwordInput.type = 'password';
    toggleIcon.setAttribute('data-lucide', 'eye');
  }
  
  // Refresh lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }
}

// ==================== LOADING INDICATOR ====================
function showLoadingIndicator() {
  const indicator = document.getElementById('admin-loading-indicator');
  if (indicator) {
    indicator.style.display = 'block';
  }
}

function hideLoadingIndicator() {
  const indicator = document.getElementById('admin-loading-indicator');
  if (indicator) {
    indicator.style.display = 'none';
  }
}

// ==================== CONFIG & DATA ====================
const ROOM_TEMPLATES = [
  { type: 'Single', price: 129, emoji: '🛏️', capacity: 1, image: 'https://images.pexels.com/photos/15230252/pexels-photo-15230252.jpeg?auto=compress&cs=tinysrgb&w=1920' },
  { type: 'Double', price: 199, emoji: '🛏️🛏️', capacity: 2, image: 'https://images.pexels.com/photos/5883728/pexels-photo-5883728.jpeg?auto=compress&cs=tinysrgb&w=1920' },
  { type: 'Deluxe', price: 299, emoji: '👑', capacity: 2, image: 'https://images.pexels.com/photos/13008559/pexels-photo-13008559.jpeg?auto=compress&cs=tinysrgb&w=1920' },
  { type: 'Suite', price: 499, emoji: '🏰', capacity: 4, image: 'https://images.pexels.com/photos/18285946/pexels-photo-18285946.jpeg?auto=compress&cs=tinysrgb&w=1920' }
];

const heroBackgrounds = [
  'linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url("https://images.pexels.com/photos/271667/pexels-photo-271667.jpeg") center/cover no-repeat',
  'linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url("https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg") center/cover no-repeat',
  'linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url("https://images.pexels.com/photos/164558/pexels-photo-164558.jpeg") center/cover no-repeat',
  'linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url("https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg") center/cover no-repeat'
];

let currentSlide = 0;
let allReservations = [];
let currentUser = null;
let reservationSearchTerm = '';
let isAutoLogout = false; // Flag to prevent double logout messages


// ==================== API CONFIG ====================
const API_BASE_URL = 'http://localhost:3000/api';

// ==================== INITIALIZATION ====================
async function initializeApp() {
  try {
    // Initialize Element SDK (if available)
    if (window.elementSdk) {
      const config = {
        hotel_name: 'Barima Royal Suites',
        hotel_tagline: 'Where Luxury Meets Comfort',
        hotel_location: '123 Ocean Drive, Miami Beach',
        contact_phone: '+1 (800) 555-0190',
        contact_email: 'reservations@barimaroyalsuites.com'
      };

      window.elementSdk.init({
        defaultConfig: config,
        onConfigChange: async (cfg) => {
          document.getElementById('nav-hotel-name').textContent = cfg.hotel_name;
          document.getElementById('home-hotel-name').textContent = cfg.hotel_name;
          document.getElementById('home-tagline').textContent = `"${cfg.hotel_tagline}"`;
          document.getElementById('contact-location').textContent = cfg.hotel_location;
          document.getElementById('contact-phone').textContent = cfg.contact_phone;
          document.getElementById('contact-email').textContent = cfg.contact_email;
          document.getElementById('footer-hotel-name').textContent = cfg.hotel_name;
        },
        mapToCapabilities: () => ({
          recolorables: [],
          borderables: [],
          fontEditable: undefined,
          fontSizeable: undefined
        }),
        mapToEditPanelValues: (cfg) => new Map([
          ['hotel_name', cfg.hotel_name],
          ['hotel_tagline', cfg.hotel_tagline],
          ['hotel_location', cfg.hotel_location],
          ['contact_phone', cfg.contact_phone],
          ['contact_email', cfg.contact_email]
        ])
      });
    }

    // Initialize hero slideshow
    initHeroSlideshow();
    renderRoomsGrid();
    renderFeaturedRooms();
    
    // Load data from backend API
    await loadAllData();
    await loadAdminStats();
    
    lucide.createIcons();
  } catch (err) {
    console.error('Init error:', err);
    showToast('Error loading data from server', 'error');
  }
}

// ==================== HERO SLIDESHOW ====================
function initHeroSlideshow() {
  const slideshow = document.getElementById('heroSlideshow');
  slideshow.innerHTML = '';

  heroBackgrounds.forEach((bg, idx) => {
    const slide = document.createElement('div');
    slide.className = 'slide-bg' + (idx === 0 ? ' active' : '');
    slide.style.background = bg;
    slideshow.appendChild(slide);
  });

  setInterval(() => {
    const slides = document.querySelectorAll('.slide-bg');
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
  }, 5000);
}

// ==================== ROOM RENDERING ====================
function renderRoomsGrid() {
  const grid = document.getElementById('rooms-grid');
  grid.innerHTML = ROOM_TEMPLATES.map(room => `
    <div class="card" style="display:flex;border-radius:4px;overflow:hidden;margin-bottom:2rem;">
      <div style="flex:0 0 40%;height:auto;min-height:100%;">
        <img src="${room.image}" style="width:100%;height:100%;object-fit:cover;display:block;">
      </div>
      <div style="flex:1;padding:2rem;display:flex;flex-direction:column;justify-content:center;text-align:center;">
        <div style="font-size:3rem;margin-bottom:1rem;">${room.emoji}</div>
        <h3 class="font-display" style="font-size:1.6rem;margin:0 0 0.5rem;font-weight:400;">${room.type} Room</h3>
        <div class="section-divider" style="margin:1rem auto;"></div>
        <ul style="list-style:none;padding:0;margin:0 0 1.5rem;color:var(--muted);font-size:0.85rem;line-height:1.8;">
          <li><i data-lucide="check" style="width:16px;height:16px;display:inline;margin-right:0.5rem;color:var(--gold);vertical-align:middle;"></i>Capacity: ${room.capacity} ${room.capacity > 1 ? 'guests' : 'guest'}</li>
          <li><i data-lucide="check" style="width:16px;height:16px;display:inline;margin-right:0.5rem;color:var(--gold);vertical-align:middle;"></i>Premium amenities</li>
          <li><i data-lucide="check" style="width:16px;height:16px;display:inline;margin-right:0.5rem;color:var(--gold);vertical-align:middle;"></i>Free WiFi included</li>
          <li><i data-lucide="check" style="width:16px;height:16px;display:inline;margin-right:0.5rem;color:var(--gold);vertical-align:middle;"></i>Daily housekeeping</li>
        </ul>
        <div style="background:#f8f5ee;border-radius:2px;padding:1rem;text-align:center;margin-bottom:1.5rem;">
          <p style="color:var(--muted);font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 0.25rem;">Starting from</p>
          <p class="font-display" style="color:var(--gold);font-size:1.8rem;margin:0;font-weight:600;">$${room.price}</p>
          <p style="color:var(--muted);font-size:0.75rem;margin:0;">per night</p>
        </div>
        <button class="btn-gold" style="width:100%;padding:0.85rem;border-radius:2px;border:none;cursor:pointer;font-weight:600;transition:all 0.3s ease;" onclick="showPage('booking');document.getElementById('roomType').value='${room.type}';">Book Now</button>
      </div>
    </div>
  `).join('');
  lucide.createIcons();
}

// ==================== FEATURED ROOMS (HOME PAGE) ====================
function renderFeaturedRooms() {
  const homeGrid = document.getElementById('home-rooms-grid');
  if (homeGrid) {
    homeGrid.innerHTML = ROOM_TEMPLATES.map(template => `
      <div class="room-card-home card" style="border-radius:4px;overflow:hidden;display:flex;flex-direction:column;transition:all 0.3s ease;cursor:pointer;" onclick="showPage('rooms')">
        <div class="room-card-home-img" style="width:100%;height:220px;position:relative;overflow:hidden;">
          <img src="${template.image}" style="width:100%;height:100%;object-fit:cover;display:block;">
          <div class="room-card-home-overlay" style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.15);"></div>
        </div>
        <div class="room-card-home-content" style="padding:1.75rem;text-align:center;flex:1;display:flex;flex-direction:column;justify-content:center;background:white;">
          <div style="font-size:2.5rem;margin-bottom:1rem;">${template.emoji}</div>
          <p class="room-card-home-type" style="font-weight:600;margin:0 0 0.5rem;font-size:1.1rem;">${template.type} Room</p>
          <p style="color:var(--muted);font-size:0.85rem;margin:0 0 1rem;">Capacity: ${template.capacity} ${template.capacity > 1 ? 'guests' : 'guest'}</p>
          <p class="room-card-home-price" style="color:var(--gold);font-weight:600;margin:0;font-size:1.3rem;">$${template.price}<span style="font-size:0.8rem;font-weight:400;">/night</span></p>
        </div>
      </div>
    `).join('');
    lucide.createIcons();
  }
}

async function loadAllData() {
  try {
    showLoadingIndicator();
    
    // Fetch rooms from backend
    const roomsResponse = await fetch(`${API_BASE_URL}/rooms`);
    if (!roomsResponse.ok) throw new Error('Failed to load rooms');
    const rooms = await roomsResponse.json();

    // Fetch reservations from backend
    const resResponse = await fetch(`${API_BASE_URL}/reservations`);
    if (!resResponse.ok) throw new Error('Failed to load reservations');
    allReservations = await resResponse.json();

    renderAllData(rooms);
  } catch (err) {
    console.error('Error loading data:', err);
    showToast('Error loading data', 'error');
  } finally {
    hideLoadingIndicator();
  }
}

function renderAllData(rooms) {
  // Update home rooms counter
  const available = rooms.filter(r => r.status === 'Available').length;
  document.getElementById('available-rooms-counter').innerHTML = `Available Rooms: <span style="font-size:1.1rem;">${available}</span> / 25`;

  // Render featured rooms
  renderFeaturedRooms();

  // Admin rooms grid
  const adminGrid = document.getElementById('admin-rooms-grid');
  if (adminGrid) {
    adminGrid.innerHTML = rooms.map(room => `
      <div class="card" style="padding:1.5rem;border-radius:4px;">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:1rem;">
          <div>
            <p style="font-weight:600;margin:0 0 0.25rem;font-size:0.9rem;">Room ${room.room_number}</p>
            <p style="color:var(--muted);font-size:0.8rem;margin:0;">${room.room_type}</p>
          </div>
          <span class="status-badge ${room.status === 'Available' ? 'room-available' : 'room-occupied'}">${room.status}</span>
        </div>
        <p style="color:var(--muted);font-size:0.75rem;margin:0.5rem 0;"><strong>Rate:</strong> $${room.price}/night</p>
        <button class="btn-outline" style="width:100%;padding:0.6rem;border-radius:2px;margin-top:1rem;font-size:0.8rem;border:1px solid #e2e8f0;" onclick="updateRoomStatus('${room.room_number}', '${room.status === 'Available' ? 'Occupied' : 'Available'}')">
          Mark as ${room.status === 'Available' ? 'Occupied' : 'Available'}
        </button>
      </div>
    `).join('');
    lucide.createIcons();
  }
}

// ==================== RESERVATIONS TABLE ====================
function renderReservationsTable() {
  const tbody = document.getElementById('reservations-tbody');
  const noReservations = document.getElementById('no-reservations');

  let filtered = allReservations;
  if (reservationSearchTerm) {
    const term = reservationSearchTerm.toLowerCase();
    filtered = allReservations.filter(r =>
      r.full_name?.toLowerCase().includes(term) ||
      r.reservation_id?.toLowerCase().includes(term) ||
      r.email?.toLowerCase().includes(term)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    noReservations.style.display = 'block';
    return;
  }

  noReservations.style.display = 'none';
  tbody.innerHTML = filtered.map(res => `
    <tr style="border-bottom:1px solid #f1f0ed;">
      <td style="padding:0.75rem 1rem;font-size:0.8rem;font-weight:600;color:var(--gold);">${res.reservation_id || 'N/A'}</td>
      <td style="padding:0.75rem 1rem;"><p style="margin:0;font-size:0.85rem;font-weight:500;">${res.full_name || 'N/A'}</p><p style="margin:0;font-size:0.75rem;color:var(--muted);">${res.email || 'N/A'}</p></td>
      <td style="padding:0.75rem 1rem;font-size:0.85rem;">${res.room_type || 'N/A'}</td>
      <td style="padding:0.75rem 1rem;font-size:0.85rem;white-space:nowrap;">${formatDate(res.check_in_date)}</td>
      <td style="padding:0.75rem 1rem;font-size:0.85rem;white-space:nowrap;">${formatDate(res.check_out_date)}</td>
      <td style="padding:0.75rem 1rem;font-size:0.85rem;font-weight:600;color:var(--gold);">$${res.payment_amount || '0'}</td>
      <td style="padding:0.75rem 1rem;"><span class="status-badge status-${res.reservation_status?.toLowerCase() || 'pending'}">${res.reservation_status || 'Pending'}</span></td>
      <td style="padding:0.75rem 1rem;"><button class="btn-outline" style="padding:0.4rem 0.75rem;font-size:0.75rem;border:1px solid #e2e8f0;border-radius:2px;cursor:pointer;" onclick="openConfirmDelete('${res.__backendId}', 'reservation')"><i data-lucide="trash-2" style="width:14px;height:14px;display:inline;"></i></button></td>
    </tr>
  `).join('');
  lucide.createIcons();
}

function filterReservations() {
  const searchInput = document.getElementById('searchInput');
  reservationSearchTerm = searchInput.value;
  renderReservationsTable();
}

// ==================== ADMIN FUNCTIONS ====================
async function loadAdminStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/stats`);
    if (!response.ok) throw new Error('Failed to load stats');
    const stats = await response.json();
    renderAdminStats(stats);
  } catch (err) {
    console.error('Error loading stats:', err);
    renderAdminStats({ totalReservations: 0, availableRooms: 0, totalRevenue: 0 });
  }
}

function renderAdminStats(data = {}) {
  const stats = document.getElementById('admin-stats');
  if (stats) {
    const totalRes = data.totalReservations || 0;
    const availRooms = data.availableRooms || 0;
    const revenue = data.totalRevenue || 0;
    
    stats.innerHTML = `
      <div class="card" style="padding:1.5rem;text-align:center;border-radius:4px;">
        <p class="font-display" style="color:var(--gold);font-size:2rem;margin:0;font-weight:600;">${totalRes}</p>
        <p style="color:var(--muted);font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;margin:0.5rem 0 0;">Total Reservations</p>
      </div>
      <div class="card" style="padding:1.5rem;text-align:center;border-radius:4px;">
        <p class="font-display" style="color:var(--gold);font-size:2rem;margin:0;font-weight:600;">${availRooms}</p>
        <p style="color:var(--muted);font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;margin:0.5rem 0 0;">Available Rooms</p>
      </div>
      <div class="card" style="padding:1.5rem;text-align:center;border-radius:4px;">
        <p class="font-display" style="color:var(--gold);font-size:2rem;margin:0;font-weight:600;">$${revenue.toLocaleString()}</p>
        <p style="color:var(--muted);font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;margin:0.5rem 0 0;">Total Revenue</p>
      </div>
    `;
  }
}

// ==================== ROOM MANAGEMENT ====================
async function updateRoomStatus(roomNumber, newStatus) {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomNumber}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) throw new Error('Failed to update room');
    
    showToast(`Room ${roomNumber} marked as ${newStatus}`, 'success');
    await loadAllData();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

// ==================== BOOKING FORM ====================
async function submitBooking(event) {
  event.preventDefault();

  const name = document.getElementById('guestName').value.trim();
  const email = document.getElementById('guestEmail').value.trim();
  const phone = document.getElementById('guestPhone').value.trim();
  const nationalId = document.getElementById('guestNationalId').value.trim();
  const roomType = document.getElementById('roomType').value;
  const checkIn = document.getElementById('checkIn').value;
  const checkOut = document.getElementById('checkOut').value;
  const paymentMethod = document.getElementById('paymentMethod').value;

  if (!name || !email || !phone || !nationalId || !roomType || !checkIn || !checkOut || !paymentMethod) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  const btn = document.getElementById('bookingSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Processing...';

  try {
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    const template = ROOM_TEMPLATES.find(t => t.type === roomType);
    const amount = nights * template.price;

    // Create guest first
    const guestResponse = await fetch(`${API_BASE_URL}/guests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: name,
        email: email,
        phone_number: phone,
        national_id: nationalId
      })
    });

    if (!guestResponse.ok) throw new Error('Failed to create guest');
    const guestData = await guestResponse.json();
    const guestId = guestData.guest_id;

    // Create reservation
    const resResponse = await fetch(`${API_BASE_URL}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guest_id: guestId,
        room_type: roomType,
        check_in_date: checkIn,
        check_out_date: checkOut,
        payment_method: paymentMethod,
        payment_amount: amount
      })
    });

    if (!resResponse.ok) throw new Error('Failed to create reservation');
    const resData = await resResponse.json();
    const resId = resData.reservation_id;

    // Show confirmation
    document.getElementById('conf-resid').textContent = resId;
    document.getElementById('conf-name').textContent = name;
    document.getElementById('conf-room').textContent = roomType;
    document.getElementById('conf-checkin').textContent = formatDate(checkIn);
    document.getElementById('conf-checkout').textContent = formatDate(checkOut);
    document.getElementById('conf-amount').textContent = `$${amount.toLocaleString()}`;

    document.getElementById('booking-form-container').style.display = 'none';
    document.getElementById('booking-confirmation').style.display = 'block';
    showToast('✓ Reservation created successfully!', 'success');
    
    // Refresh admin portal data if admin is logged in
    if (currentUser) {
      setTimeout(() => {
        loadAllData();
        loadAdminStats();
      }, 1000);
    }

  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirm Reservation';
  }
}

function resetBookingForm() {
  document.getElementById('bookingForm').reset();
  document.getElementById('booking-form-container').style.display = 'block';
  document.getElementById('booking-confirmation').style.display = 'none';
}

// ==================== LOOKUP RESERVATION ====================
async function lookupReservation(event) {
  event.preventDefault();
  const resId = document.getElementById('lookupId').value.trim();
  const email = document.getElementById('lookupEmail').value.trim();
  const lookupForm = event.target;
  const searchBtn = lookupForm.querySelector('button[type="submit"]');
  
  // Show loading state
  const originalText = searchBtn.textContent;
  searchBtn.disabled = true;
  searchBtn.textContent = 'Searching...';

  try {
    const response = await fetch(`${API_BASE_URL}/reservations/lookup/${resId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Reservation not found');
    }

    const found = await response.json();

    // Verify email matches
    if (found.email !== email) {
      document.getElementById('lookup-error').textContent = 'Email does not match this reservation.';
      document.getElementById('lookup-error').style.display = 'block';
      document.getElementById('reservation-details').style.display = 'none';
      return;
    }

    document.getElementById('lookup-error').style.display = 'none';
    document.getElementById('res-id-display').textContent = found.reservation_id;
    document.getElementById('res-guest-name').textContent = found.full_name;
    document.getElementById('res-guest-email').textContent = found.email;
    document.getElementById('res-guest-phone').textContent = found.phone_number;
    document.getElementById('res-room').textContent = found.room_type;
    document.getElementById('res-room-num').textContent = found.room_number || 'TBA';
    document.getElementById('res-checkin').textContent = formatDate(found.check_in_date);
    document.getElementById('res-checkout').textContent = formatDate(found.check_out_date);
    document.getElementById('res-amount').textContent = `$${found.payment_amount || '0'}`;
    document.getElementById('res-payment-id').textContent = found.payment_id || 'N/A';

    const badge = document.getElementById('res-status-badge');
    badge.textContent = found.reservation_status || 'Pending';
    badge.className = 'status-badge status-' + (found.reservation_status?.toLowerCase() || 'pending');

    document.getElementById('reservation-details').style.display = 'block';
    showToast('✓ Reservation found!', 'success');
  } catch (err) {
    document.getElementById('lookup-error').textContent = 'Reservation not found. Please check your ID and email.';
    document.getElementById('lookup-error').style.display = 'block';
    document.getElementById('reservation-details').style.display = 'none';
    showToast('Error: ' + err.message, 'error');
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = originalText;
  }
}

// ==================== LOGIN & LOGOUT ====================
async function adminLogin(event) {
  event.preventDefault();
  const username = document.getElementById('adminUsername').value.trim();
  const password = document.getElementById('adminPassword').value.trim();
  const loginBtn = event.target.querySelector('button[type="submit"]');
  const originalText = loginBtn.textContent;

  if (username === 'admin' && password === 'admin123') {
    try {
      loginBtn.disabled = true;
      loginBtn.textContent = 'Loading...';
      showLoadingIndicator();
      
      currentUser = username;
      document.getElementById('admin-login-container').style.display = 'none';
      document.getElementById('admin-dashboard-container').style.display = 'block';
      
      // Load fresh data from backend
      await loadAllData();
      await loadAdminStats();
      renderReservationsTable();
      
      showToast('✓ Admin login successful', 'success');
    } catch (err) {
      showToast('Error loading dashboard data', 'error');
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = originalText;
      hideLoadingIndicator();
    }
  } else {
    document.getElementById('admin-login-error').textContent = 'Invalid username or password';
    document.getElementById('admin-login-error').style.display = 'block';
    showToast('Login failed', 'error');
  }
}

function adminLogout() {
  currentUser = null;
  document.getElementById('adminUsername').value = '';
  document.getElementById('adminPassword').value = '';
  document.getElementById('admin-login-container').style.display = 'flex';
  document.getElementById('admin-dashboard-container').style.display = 'none';
  isAutoLogout = false;
  showToast('Logged out', 'success');
}

async function showAdminTab(tab) {
  // Show loading state and disable tabs
  const tab1 = document.getElementById('tab-reservations');
  const tab2 = document.getElementById('tab-rooms');
  tab1.disabled = true;
  tab2.disabled = true;
  showLoadingIndicator();

  try {
    // Refresh data from backend when switching tabs
    await loadAllData();
    await loadAdminStats();
    
    // Update panel visibility
    document.getElementById('admin-reservations-panel').style.display = tab === 'reservations' ? 'block' : 'none';
    document.getElementById('admin-rooms-panel').style.display = tab === 'rooms' ? 'block' : 'none';

    // Update tab highlighting
    if (tab === 'reservations') {
      tab1.style.color = 'var(--gold)';
      tab1.style.borderBottom = '2px solid var(--gold)';
      tab2.style.color = 'var(--muted)';
      tab2.style.borderBottom = '2px solid transparent';
      renderReservationsTable();
    } else {
      tab1.style.color = 'var(--muted)';
      tab1.style.borderBottom = '2px solid transparent';
      tab2.style.color = 'var(--gold)';
      tab2.style.borderBottom = '2px solid var(--gold)';
    }
  } finally {
    tab1.disabled = false;
    tab2.disabled = false;
    hideLoadingIndicator();
  }
}

// ==================== CONTACT FORM ====================
async function sendContactMsg(event) {
  event.preventDefault();
  const name = document.getElementById('cName').value.trim();
  const email = document.getElementById('cEmail').value.trim();
  const message = document.getElementById('cMessage').value.trim();
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  if (!name || !email || !message) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    const response = await fetch(`${API_BASE_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message })
    });

    if (!response.ok) throw new Error('Failed to send message');

    document.getElementById('contactForm').style.display = 'none';
    document.getElementById('contact-success').style.display = 'block';
    showToast('✓ Message sent successfully!', 'success');

    setTimeout(() => {
      document.getElementById('cName').value = '';
      document.getElementById('cEmail').value = '';
      document.getElementById('cMessage').value = '';
      document.getElementById('contactForm').style.display = 'block';
      document.getElementById('contact-success').style.display = 'none';
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }, 3000);
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// ==================== PAGE NAVIGATION ====================
function showPage(pageName) {
  // If leaving admin page, logout immediately
  if (pageName !== 'admin' && currentUser && !isAutoLogout) {
    isAutoLogout = true;
    adminLogout();
    showToast('Admin session ended for security', 'success');
    return;
  }
  
  isAutoLogout = false;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const targetPage = document.getElementById('page-' + pageName);
  if (targetPage) targetPage.classList.add('active');

  if (pageName === 'admin') {
    if (!currentUser) {
      // Force fresh login
      document.getElementById('admin-login-container').style.display = 'flex';
      document.getElementById('admin-dashboard-container').style.display = 'none';
      document.getElementById('adminUsername').value = '';
      document.getElementById('adminPassword').value = '';
      document.getElementById('admin-login-error').style.display = 'none';
    } else {
      // Admin logged in - show dashboard and refresh all data
      document.getElementById('admin-login-container').style.display = 'none';
      document.getElementById('admin-dashboard-container').style.display = 'block';
      loadAllData();
      loadAdminStats();
      renderReservationsTable();
    }
  }
}

function handleAdminClick() {
  showPage('admin');
  closeMobileMenu();
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('open');
}

function closeMobileMenu() {
  document.getElementById('mobileMenu').classList.remove('open');
}

// ==================== VALIDATION ====================
function validateIdInput() {
  const input = document.getElementById('guestNationalId');
  input.value = input.value.toUpperCase();
}

function validateIdFormat() {
  const id = document.getElementById('guestNationalId').value.toUpperCase();
  const idError = document.getElementById('idError');
  const pattern = /^GHA-[A-Z0-9]{9}-[0-9]$/;
  idError.style.display = pattern.test(id) ? 'none' : 'block';
}

// ==================== UTILITIES ====================
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function showToast(message, type) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  toastMsg.textContent = message;
  toast.style.background = type === 'success' ? '#d1fae5' : '#fee2e2';
  toast.style.color = type === 'success' ? '#065f46' : '#991b1b';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function openConfirmDelete(id, type) {
  const modal = document.getElementById('confirmModal');
  document.getElementById('confirmMsg').textContent = `Are you sure you want to delete this ${type}?`;
  document.getElementById('confirmBtn').onclick = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reservations/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Failed to delete');
      
      showToast(`${type} deleted successfully`, 'success');
      await loadAllData();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
    closeConfirm();
  };
  modal.classList.add('open');
}

function closeConfirm() {
  document.getElementById('confirmModal').classList.remove('open');
}

// ==================== PRICE PREVIEW ====================
document.addEventListener('DOMContentLoaded', () => {
  const roomType = document.getElementById('roomType');
  const checkIn = document.getElementById('checkIn');
  const checkOut = document.getElementById('checkOut');
  const preview = document.getElementById('booking-price-preview');
  const nightsLabel = document.getElementById('nights-label');
  const totalPrice = document.getElementById('total-price');

  if (roomType && checkIn && checkOut) {
    const updatePrice = () => {
      if (!checkIn.value || !checkOut.value || !roomType.value) {
        preview.style.display = 'none';
        return;
      }

      const nights = Math.ceil((new Date(checkOut.value) - new Date(checkIn.value)) / (1000 * 60 * 60 * 24));
      if (nights <= 0) {
        preview.style.display = 'none';
        return;
      }

      const template = ROOM_TEMPLATES.find(t => t.type === roomType.value);
      const total = nights * template.price;

      nightsLabel.textContent = nights + (nights === 1 ? ' night' : ' nights');
      totalPrice.textContent = '$' + total.toLocaleString();
      preview.style.display = 'block';
    };

    roomType.addEventListener('change', updatePrice);
    checkIn.addEventListener('change', updatePrice);
    checkOut.addEventListener('change', updatePrice);
  }

  initializeApp();
  lucide.createIcons();
});
