// ==================== CONFIG & CONSTANTS ====================
const API_BASE = '/api'; // Change to your Render backend URL in production

const ROOM_TEMPLATES = [
  { type: 'Single', price: 129, desc: 'Cozy room with queen bed', amenities: ['WiFi', 'AC', 'TV'] },
  { type: 'Double', price: 199, desc: 'Spacious room with two double beds', amenities: ['WiFi', 'AC', 'TV', 'Mini Bar'] },
  { type: 'Deluxe', price: 299, desc: 'Luxury room with city view', amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony'] },
  { type: 'Suite', price: 499, desc: 'Premium suite with living area', amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony', 'Jacuzzi'] }
];

let allReservations = [];
let allRooms = [];
let allPayments = [];
let adminLoggedIn = false;
let currentUser = null;

// ==================== SDK INITIALIZATION ====================
async function initializeSDKs() {
  // Element SDK initialization
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
      onConfigChange: updateConfigDisplay,
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

  // Data SDK initialization
  if (window.dataSdk) {
    const handler = {
      onDataChanged(data) {
        processDataSDKRecords(data);
      }
    };
    const result = await window.dataSdk.init(handler);
    if (result.isOk) {
      console.log('✓ Data SDK initialized');
    } else {
      console.error('Data SDK init failed:', result.error);
    }
  }
}

function updateConfigDisplay(config) {
  if (config.hotel_name) {
    document.getElementById('nav-hotel-name').textContent = config.hotel_name.split(' ')[0];
    document.getElementById('home-hotel-name').textContent = config.hotel_name;
    document.getElementById('footer-hotel-name').textContent = config.hotel_name;
  }
  if (config.hotel_tagline) {
    document.getElementById('home-tagline').textContent = `"${config.hotel_tagline}"`;
  }
  if (config.hotel_location) {
    document.getElementById('contact-location').textContent = config.hotel_location;
  }
  if (config.contact_phone) {
    document.getElementById('contact-phone').textContent = config.contact_phone;
  }
  if (config.contact_email) {
    document.getElementById('contact-email').textContent = config.contact_email;
  }
}

function processDataSDKRecords(data) {
  allReservations = data.filter(r => r.record_type === 'reservation');
  allRooms = data.filter(r => r.record_type === 'room');
  allPayments = data.filter(r => r.record_type === 'payment');
  
  if (adminLoggedIn) {
    renderAdminDashboard();
  }
}

// ==================== UI NAVIGATION ====================
function showPage(pageName) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + pageName).classList.add('active');
  
  document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
  const navLink = document.getElementById('nav-' + pageName);
  if (navLink && !navLink.classList.contains('btn-gold')) {
    navLink.classList.add('active');
  }

  if (pageName === 'home') {
    initSlideshow();
    renderFeaturedRooms();
  } else if (pageName === 'rooms') {
    renderRoomsPage();
  } else if (pageName === 'admin' && !adminLoggedIn) {
    showAdminLogin();
  }

  closeMobileMenu();
  window.scrollTo(0, 0);
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('open');
}

function closeMobileMenu() {
  document.getElementById('mobileMenu').classList.remove('open');
}

// ==================== HERO SLIDESHOW ====================
const heroBackgrounds = [
  'linear-gradient(135deg, rgba(102, 126, 234, 0.8), rgba(118, 75, 162, 0.8)), url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 600%22%3E%3Crect fill=%22%231a1a2e%22 width=%221200%22 height=%22600%22/%3E%3Cpath d=%22M0 300 Q300 200 600 300 T1200 300%22 stroke=%22rgba(201,168,76,0.1)%22 stroke-width=%222%22 fill=%22none%22/%3E%3C/svg%3E")',
  'linear-gradient(135deg, rgba(79, 172, 254, 0.8), rgba(0, 242, 254, 0.8)), url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 600%22%3E%3Crect fill=%221a1a2e%22 width=%221200%22 height=%22600%22/%3E%3Ccircle cx=%22200%22 cy=%22150%22 r=%2250%22 fill=%22rgba(201,168,76,0.1)%22/%3E%3Ccircle cx=%221000%22 cy=%22450%22 r=%2280%22 fill=%22rgba(201,168,76,0.1)%22/%3E%3C/svg%3E")',
  'linear-gradient(135deg, rgba(168, 85, 247, 0.8), rgba(219, 39, 119, 0.8)), url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 600%22%3E%3Crect fill=%221a1a2e%22 width=%221200%22 height=%22600%22/%3E%3Crect x=%22100%22 y=%22100%22 width=%22200%22 height=%22200%22 fill=%22rgba(201,168,76,0.1)%22/%3E%3C/svg%3E")',
];

let currentSlide = 0;

function initSlideshow() {
  const container = document.getElementById('heroSlideshow');
  if (container.children.length > 0) return;

  heroBackgrounds.forEach((bg, index) => {
    const slide = document.createElement('div');
    slide.className = 'slide-bg' + (index === 0 ? ' active' : '');
    slide.style.background = bg;
    container.appendChild(slide);
  });

  setInterval(nextSlide, 6000);
}

function nextSlide() {
  const slides = document.querySelectorAll('.slide-bg');
  slides[currentSlide].classList.remove('active');
  currentSlide = (currentSlide + 1) % slides.length;
  slides[currentSlide].classList.add('active');
}

// ==================== ROOMS PAGE ====================
function renderRoomsPage() {
  const grid = document.getElementById('rooms-grid');
  grid.innerHTML = '';

  ROOM_TEMPLATES.forEach(template => {
    const availRooms = allRooms.filter(r => r.room_type === template.type && r.room_status === 'Available');
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding: 2rem; margin-bottom: 2rem;';

    const img = document.createElement('div');
    img.style.cssText = `height: 280px; background: linear-gradient(135deg, ${['#667eea', '#764ba2', '#f093fb', '#4facfe'][ROOM_TEMPLATES.indexOf(template)]}, ${['#764ba2', '#667eea', '#00f2fe', '#00f2fe'][ROOM_TEMPLATES.indexOf(template)]}); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 4rem; color: white;`;
    img.innerHTML = ['🛏️', '🛏️🛏️', '👑', '✨'][ROOM_TEMPLATES.indexOf(template)];

    const content = document.createElement('div');
    content.innerHTML = `
      <h3 class="font-display" style="font-size: 2rem; margin: 0 0 0.5rem; font-weight: 400;">${template.type}</h3>
      <p style="color: var(--gold); font-size: 1.3rem; font-weight: 600; margin: 0 0 1rem;">$${template.price}/night</p>
      <p style="color: var(--muted); font-size: 0.9rem; line-height: 1.6; margin: 0 0 1.25rem;">${template.desc}</p>
      <div style="margin-bottom: 1.5rem;">
        <p style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin: 0 0 0.5rem; font-weight: 600;">Amenities</p>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
          ${template.amenities.map(a => `<span style="display: inline-block; background: rgba(201,168,76,0.1); color: var(--gold); padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 500;">${a}</span>`).join('')}
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid #f1f0ed;">
        <span style="font-size: 0.85rem; color: var(--muted);"><strong>${availRooms.length}</strong> available</span>
        <button class="btn-gold" onclick="showPage('booking')" style="padding: 0.6rem 1.5rem; border-radius: 2px; font-size: 0.75rem;">Book Now</button>
      </div>
    `;

    card.appendChild(img);
    card.appendChild(content);
    grid.appendChild(card);
  });
}

// ==================== HOME PAGE - FEATURED ROOMS ====================
function renderFeaturedRooms() {
  const grid = document.getElementById('home-rooms-grid');
  grid.innerHTML = '';

  const featured = ROOM_TEMPLATES.slice(0, 4);
  const availCount = allRooms.filter(r => r.room_status === 'Available').length;

  document.querySelector('#available-rooms-counter span').textContent = availCount;

  featured.forEach((room, idx) => {
    const occupiedCount = allRooms.filter(r => r.room_type === room.type && r.room_status === 'Occupied').length;
    const isBooked = occupiedCount > 0;

    const card = document.createElement('div');
    card.className = 'room-card-home';
    card.innerHTML = `
      <div class="room-card-home-img ${isBooked ? 'booked' : ''}" style="background: linear-gradient(135deg, ${['#667eea', '#764ba2', '#f093fb', '#4facfe'][idx]}, ${['#764ba2', '#667eea', '#00f2fe', '#00f2fe'][idx]});">
        <div style="font-size: 3.5rem;">${['🛏️', '🛏️🛏️', '👑', '✨'][idx]}</div>
        ${isBooked ? `<div class="room-card-home-overlay"></div>` : ''}
        <span class="room-card-home-status">
          <span class="status-badge ${isBooked ? 'room-occupied' : 'room-available'}">${isBooked ? 'Occupied' : 'Available'}</span>
        </span>
      </div>
      <div class="room-card-home-content">
        <p class="room-card-home-type">${room.type}</p>
        <p class="room-card-home-price">$${room.price}/night</p>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ==================== BOOKING PAGE ====================
function submitBooking(event) {
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

  if (allReservations.length >= 999) {
    document.getElementById('booking-limit-warning').style.display = 'block';
    showToast('Maximum booking limit reached', 'error');
    return;
  }

  const btn = document.getElementById('bookingSubmitBtn');
  btn.disabled = true;

  submitBookingToDataSDK(name, email, phone, nationalId, roomType, checkIn, checkOut, paymentMethod, btn);
}

async function submitBookingToDataSDK(name, email, phone, nationalId, roomType, checkIn, checkOut, paymentMethod, btn) {
  try {
    const guestId = 'G-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const reservationId = 'RES-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const paymentId = 'PAY-' + Math.random().toString(36).substr(2, 6).toUpperCase();

    // Create guest record
    const guestResult = await window.dataSdk.create({
      record_type: 'guest',
      guest_id: guestId,
      full_name: name,
      phone_number: phone,
      email: email,
      national_id: nationalId
    });

    if (guestResult.isError) throw new Error(guestResult.error.message);

    // Calculate total amount
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    const template = ROOM_TEMPLATES.find(t => t.type === roomType);
    const amount = nights * template.price;

    // Find available room
    const availRoom = allRooms.find(r => r.room_type === roomType && r.room_status === 'Available');
    const roomNumber = availRoom ? availRoom.room_number : 'ROOM-TBD';

    // Create reservation record
    const resResult = await window.dataSdk.create({
      record_type: 'reservation',
      reservation_id: reservationId,
      guest_id: guestId,
      room_number: roomNumber,
      room_type: roomType,
      check_in_date: checkIn,
      check_out_date: checkOut,
      reservation_date: new Date().toISOString().split('T')[0],
      reservation_status: 'Confirmed'
    });

    if (resResult.isError) throw new Error(resResult.error.message);

    // Create payment record
    const payResult = await window.dataSdk.create({
      record_type: 'payment',
      payment_id: paymentId,
      reservation_id: reservationId,
      guest_id: guestId,
      payment_amount: amount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: paymentMethod,
      payment_status: 'Fully Paid'
    });

    if (payResult.isError) throw new Error(payResult.error.message);

    // Update room status if found
    if (availRoom) {
      const roomUpdateResult = await window.dataSdk.update({
        ...availRoom,
        room_status: 'Occupied'
      });
      if (roomUpdateResult.isError) console.error('Room update error:', roomUpdateResult.error);
    }

    // Show confirmation
    document.getElementById('conf-resid').textContent = reservationId;
    document.getElementById('conf-name').textContent = name;
    document.getElementById('conf-room').textContent = `${roomType} (Rm ${roomNumber})`;
    document.getElementById('conf-checkin').textContent = formatDate(checkIn);
    document.getElementById('conf-checkout').textContent = formatDate(checkOut);
    document.getElementById('conf-amount').textContent = `$${amount.toLocaleString()}`;

    document.getElementById('booking-form-container').style.display = 'none';
    document.getElementById('booking-confirmation').style.display = 'block';

    showToast('✓ Reservation created successfully!', 'success');

  } catch (err) {
    showToast('Error: ' + err.message, 'error');
    console.error('Booking error:', err);
  } finally {
    btn.disabled = false;
  }
}

function resetBookingForm() {
  document.getElementById('bookingForm').reset();
  document.getElementById('booking-form-container').style.display = 'block';
  document.getElementById('booking-confirmation').style.display = 'none';
  document.getElementById('booking-price-preview').style.display = 'none';
}

// Price preview
document.addEventListener('DOMContentLoaded', () => {
  const roomTypeSelect = document.getElementById('roomType');
  const checkInInput = document.getElementById('checkIn');
  const checkOutInput = document.getElementById('checkOut');

  const updatePrice = () => {
    const roomType = roomTypeSelect.value;
    const checkIn = checkInInput.value;
    const checkOut = checkOutInput.value;

    if (roomType && checkIn && checkOut) {
      const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
      const template = ROOM_TEMPLATES.find(t => t.type === roomType);
      const amount = nights * template.price;

      if (nights > 0) {
        document.getElementById('nights-label').textContent = `${nights} night${nights > 1 ? 's' : ''}`;
        document.getElementById('total-price').textContent = `$${amount.toLocaleString()}`;
        document.getElementById('booking-price-preview').style.display = 'block';
      } else {
        document.getElementById('booking-price-preview').style.display = 'none';
      }
    }
  };

  roomTypeSelect.addEventListener('change', updatePrice);
  checkInInput.addEventListener('change', updatePrice);
  checkOutInput.addEventListener('change', updatePrice);
});

// ID validation
function validateIdInput() {
  const input = document.getElementById('guestNationalId');
  const error = document.getElementById('idError');
  const value = input.value.toUpperCase();
  const pattern = /^GHA-[A-Z0-9]{9}-[0-9]$/;
  if (value && !pattern.test(value)) {
    error.style.display = 'block';
  } else {
    error.style.display = 'none';
  }
}

function validateIdFormat() {
  validateIdInput();
}

// ==================== MY RESERVATION PAGE ====================
function lookupReservation(event) {
  event.preventDefault();
  const resId = document.getElementById('lookupId').value.trim().toUpperCase();
  const email = document.getElementById('lookupEmail').value.trim().toLowerCase();
  const errorDiv = document.getElementById('lookup-error');

  const reservation = allReservations.find(r => r.reservation_id === resId);
  if (!reservation) {
    errorDiv.textContent = 'Reservation not found. Please check your ID.';
    errorDiv.style.display = 'block';
    return;
  }

  const guest = {}; // In real app, fetch guest by guest_id
  const payment = allPayments.find(p => p.reservation_id === resId);

  document.getElementById('res-id-display').textContent = `ID: ${resId}`;
  document.getElementById('res-guest-name').textContent = reservation.full_name || 'Guest';
  document.getElementById('res-guest-email').textContent = email;
  document.getElementById('res-guest-phone').textContent = reservation.phone_number || 'N/A';
  document.getElementById('res-room').textContent = reservation.room_type;
  document.getElementById('res-room-num').textContent = reservation.room_number;
  document.getElementById('res-checkin').textContent = formatDate(reservation.check_in_date);
  document.getElementById('res-checkout').textContent = formatDate(reservation.check_out_date);
  document.getElementById('res-amount').textContent = `$${(payment?.payment_amount || 0).toLocaleString()}`;
  document.getElementById('res-payment-id').textContent = payment?.payment_id || 'N/A';

  const statusBadge = document.getElementById('res-status-badge');
  statusBadge.textContent = reservation.reservation_status;
  statusBadge.className = `status-badge status-${reservation.reservation_status.toLowerCase()}`;

  errorDiv.style.display = 'none';
  document.getElementById('reservation-details').style.display = 'block';
}

// ==================== CONTACT PAGE ====================
function sendContactMsg(event) {
  event.preventDefault();
  const name = document.getElementById('cName').value.trim();
  const email = document.getElementById('cEmail').value.trim();
  const message = document.getElementById('cMessage').value.trim();

  if (!name || !email || !message) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  // Simulate sending message
  document.getElementById('contactForm').reset();
  document.getElementById('contact-success').style.display = 'block';
  showToast('✓ Message sent! We\'ll be in touch.', 'success');

  setTimeout(() => {
    document.getElementById('contact-success').style.display = 'none';
  }, 4000);
}

// ==================== ADMIN SECTION ====================
function handleAdminClick() {
  showPage('admin');
}

function showAdminLogin() {
  document.getElementById('admin-login-container').style.display = 'flex';
  document.getElementById('admin-dashboard-container').style.display = 'none';
}

function adminLogin(event) {
  event.preventDefault();
  const username = document.getElementById('adminUsername').value.trim();
  const password = document.getElementById('adminPassword').value.trim();
  const errorDiv = document.getElementById('admin-login-error');

  // Simple hardcoded credentials (in production, use backend auth)
  if (username === 'admin' && password === 'admin123') {
    adminLoggedIn = true;
    currentUser = username;
    document.getElementById('admin-login-container').style.display = 'none';
    document.getElementById('admin-dashboard-container').style.display = 'block';
    document.getElementById('adminLoginForm').reset();
    errorDiv.style.display = 'none';
    renderAdminDashboard();
    showToast('✓ Admin access granted', 'success');
  } else {
    errorDiv.textContent = 'Invalid username or password';
    errorDiv.style.display = 'block';
  }
}

function adminLogout() {
  adminLoggedIn = false;
  currentUser = null;
  showAdminLogin();
  showToast('Logged out successfully', 'success');
}

function renderAdminDashboard() {
  renderAdminStats();
  renderReservationsTable();
  renderRoomManagement();
}

function renderAdminStats() {
  const statsDiv = document.getElementById('admin-stats');
  statsDiv.innerHTML = '';

  const totalRes = allReservations.length;
  const activeBookings = allReservations.filter(r => r.reservation_status === 'Confirmed').length;
  const totalRevenue = allPayments.reduce((sum, p) => sum + (p.payment_amount || 0), 0);
  const occupiedRooms = allRooms.filter(r => r.room_status === 'Occupied').length;

  const stats = [
    { label: 'Total Reservations', value: totalRes, icon: 'calendar' },
    { label: 'Active Bookings', value: activeBookings, icon: 'check-circle' },
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: 'dollar-sign' },
    { label: 'Occupied Rooms', value: `${occupiedRooms}/25`, icon: 'door-open' }
  ];

  stats.forEach(stat => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'padding: 1.5rem;';
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
        <div>
          <p style="color: var(--muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">${stat.label}</p>
          <p class="font-display" style="font-size: 1.8rem; font-weight: 600; color: var(--gold); margin: 0.5rem 0 0;">${stat.value}</p>
        </div>
        <i data-lucide="${stat.icon}" style="width: 28px; height: 28px; color: var(--gold); opacity: 0.5;"></i>
      </div>
    `;
    statsDiv.appendChild(card);
  });

  lucide.createIcons();
}

function renderReservationsTable() {
  const tbody = document.getElementById('reservations-tbody');
  const noRes = document.getElementById('no-reservations');
  tbody.innerHTML = '';

  if (allReservations.length === 0) {
    noRes.style.display = 'block';
    return;
  }
  noRes.style.display = 'none';

  allReservations.forEach(res => {
    const payment = allPayments.find(p => p.reservation_id === res.reservation_id);
    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid #f1f0ed';
    row.innerHTML = `
      <td style="padding: 0.75rem 1rem; font-size: 0.8rem; font-weight: 600; color: var(--gold);">${res.reservation_id}</td>
      <td style="padding: 0.75rem 1rem; font-size: 0.82rem;">${res.full_name || 'Guest'}</td>
      <td style="padding: 0.75rem 1rem; font-size: 0.82rem;">${res.room_type} (${res.room_number})</td>
      <td style="padding: 0.75rem 1rem; font-size: 0.82rem; white-space: nowrap;">${formatDate(res.check_in_date)}</td>
      <td style="padding: 0.75rem 1rem; font-size: 0.82rem; white-space: nowrap;">${formatDate(res.check_out_date)}</td>
      <td style="padding: 0.75rem 1rem; font-size: 0.82rem;">$${(payment?.payment_amount || 0).toLocaleString()}</td>
      <td style="padding: 0.75rem 1rem;"><span class="status-badge status-${res.reservation_status.toLowerCase()}">${res.reservation_status}</span></td>
      <td style="padding: 0.75rem 1rem;">
        <button class="btn-outline" style="padding: 0.4rem 0.8rem; border-radius: 2px; font-size: 0.7rem; margin-right: 0.25rem;" onclick="editReservation('${res.reservation_id}')">Edit</button>
        <button class="btn-outline" style="padding: 0.4rem 0.8rem; border-radius: 2px; font-size: 0.7rem; color: #991b1b; border-color: #991b1b;" onclick="deleteReservation('${res.reservation_id}', '${res.room_number}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  lucide.createIcons();
}

function renderRoomManagement() {
  const grid = document.getElementById('admin-rooms-grid');
  grid.innerHTML = '';

  if (allRooms.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: var(--muted); grid-column: 1/-1;">No rooms configured</p>';
    return;
  }

  allRooms.forEach(room => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'padding: 1.5rem;';
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
        <div>
          <p style="font-weight: 600; margin: 0; font-size: 1.1rem;">${room.room_number}</p>
          <p style="color: var(--muted); font-size: 0.82rem; margin: 0.25rem 0 0;">${room.room_type}</p>
        </div>
        <span class="status-badge ${room.room_status === 'Available' ? 'room-available' : 'room-occupied'}">${room.room_status}</span>
      </div>
      <p style="color: var(--gold); font-size: 0.9rem; font-weight: 600; margin: 1rem 0;">$${room.price_per_night}/night</p>
      <select onchange="updateRoomStatus('${room.room_number}', this.value)" style="width: 100%; border: 1px solid #e2e8f0; border-radius: 2px; padding: 0.5rem; font-size: 0.8rem; margin-top: 1rem;">
        <option value="Available" ${room.room_status === 'Available' ? 'selected' : ''}>Available</option>
        <option value="Occupied" ${room.room_status === 'Occupied' ? 'selected' : ''}>Occupied</option>
        <option value="Maintenance" ${room.room_status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
      </select>
    `;
    grid.appendChild(card);
  });
}

function updateRoomStatus(roomNumber, newStatus) {
  const room = allRooms.find(r => r.room_number === roomNumber);
  if (room) {
    const updatedRoom = { ...room, room_status: newStatus };
    window.dataSdk.update(updatedRoom).then(result => {
      if (result.isOk) {
        showToast(`✓ Room ${roomNumber} updated to ${newStatus}`, 'success');
      } else {
        showToast('Error updating room', 'error');
      }
    });
  }
}

function editReservation(resId) {
  showToast('Edit functionality to be implemented', 'info');
}

function deleteReservation(resId, roomNumber) {
  showConfirm(`Are you sure you want to delete reservation ${resId}?`, () => {
    const reservation = allReservations.find(r => r.reservation_id === resId);
    if (reservation && reservation.__backendId) {
      window.dataSdk.delete(reservation).then(result => {
        if (result.isOk) {
          // Mark room as available
          const room = allRooms.find(r => r.room_number === roomNumber);
          if (room && room.__backendId) {
            window.dataSdk.update({ ...room, room_status: 'Available' });
          }
          showToast('✓ Reservation deleted', 'success');
          renderReservationsTable();
        } else {
          showToast('Error deleting reservation', 'error');
        }
      });
    }
  });
}

function filterReservations() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const rows = document.querySelectorAll('#reservations-tbody tr');

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

function showAdminTab(tab) {
  document.getElementById('admin-reservations-panel').style.display = tab === 'reservations' ? 'block' : 'none';
  document.getElementById('admin-rooms-panel').style.display = tab === 'rooms' ? 'block' : 'none';

  document.querySelectorAll('.admin-tab').forEach(t => {
    t.style.color = 'var(--muted)';
    t.style.borderBottom = '2px solid transparent';
  });
  document.getElementById('tab-' + tab).style.color = 'var(--gold)';
  document.getElementById('tab-' + tab).style.borderBottom = '2px solid var(--gold)';
}

// ==================== UTILITIES ====================
function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-msg');

  msgEl.textContent = msg;
  toast.style.background = type === 'success' ? '#d1fae5' : type === 'error' ? '#fee2e2' : '#dbeafe';
  msgEl.style.color = type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : '#0c4a6e';

  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function showConfirm(msg, callback) {
  document.getElementById('confirmMsg').textContent = msg;
  document.getElementById('confirmBtn').onclick = () => {
    callback();
    closeConfirm();
  };
  document.getElementById('confirmModal').classList.add('open');
}

function closeConfirm() {
  document.getElementById('confirmModal').classList.remove('open');
}

// ==================== INITIALIZE ON PAGE LOAD ====================
window.addEventListener('DOMContentLoaded', () => {
  initializeSDKs();
  initSlideshow();
  renderFeaturedRooms();
  lucide.createIcons();
});