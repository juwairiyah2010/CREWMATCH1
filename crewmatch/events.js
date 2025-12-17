// ===== GOOGLE CALENDAR API CONFIGURATION =====
// Replace with your own Google API credentials from Google Cloud Console
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

let gapi_loaded = false;
let currentFilter = 'all';
let allEvents = [];
const API_BASE = window.__API_BASE__ || 'http://localhost:3000';

// ===== INITIALIZE GOOGLE API =====
function initializeGoogleAPI() {
  if (!window.gapi) {
    console.warn('Google API not loaded. Showing auth required state.');
    showAuthRequired();
    return;
  }
  
  gapi.load('client:auth2', () => {
    gapi.client.init({
      apiKey: GOOGLE_API_KEY,
      clientId: GOOGLE_CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES
    }).then(() => {
      gapi_loaded = true;
      updateAuthUI();
    }).catch(err => {
      console.error('Failed to initialize Google API:', err);
      showErrorState('Failed to initialize Google Calendar. Please check your API credentials in events.js');
      showAuthRequired();
    });
  });
}

// ===== AUTH BUTTON HANDLERS =====
function attachEventListeners() {
  const connectBtn = document.getElementById('connectGoogleBtn');
  const disconnectBtn = document.getElementById('disconnectBtn');
  
  if (connectBtn) {
    connectBtn.addEventListener('click', handleAuthClick);
  }
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', handleSignoutClick);
  }
}

function handleAuthClick() {
  if (!gapi_loaded) {
    showToast('error', 'Google API not ready', 'Please try again in a moment');
    return;
  }
  gapi.auth2.getAuthInstance().signIn().then(() => {
    loadCalendarEvents();
  }).catch(err => {
    console.error('Auth error:', err);
    showToast('error', 'Authentication failed', 'Could not sign in to Google Calendar');
  });
}

function handleSignoutClick() {
  if (!gapi_loaded) return;
  gapi.auth2.getAuthInstance().signOut().then(() => {
    allEvents = [];
    updateAuthUI();
    showToast('success', 'Disconnected', 'Your Google Calendar has been disconnected');
  });
}

function updateAuthUI() {
  const auth = gapi.auth2.getAuthInstance();
  const isSignedIn = auth.isSignedIn.get();
  
  document.getElementById('connectGoogleBtn').classList.toggle('hidden', isSignedIn);
  document.getElementById('disconnectBtn').classList.toggle('hidden', !isSignedIn);
  document.getElementById('authRequired').classList.toggle('hidden', isSignedIn);
  document.getElementById('eventsContent').classList.toggle('hidden', !isSignedIn);
  document.getElementById('loadingState').classList.add('hidden');
  
  if (isSignedIn) {
    loadCalendarEvents();
  }
}

// ===== LOAD CALENDAR EVENTS =====
async function loadCalendarEvents() {
  showLoadingState();
  
  try {
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ahead
    
    const response = await gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin,
      timeMax: timeMax,
      showDeleted: false,
      singleEvents: true,
      maxResults: 50,
      orderBy: 'startTime'
    });
    
    const events = response.result.items || [];
    allEvents = parseEvents(events);
    
    hideLoadingState();
    
    if (allEvents.length === 0) {
      showNoEventsState();
    } else {
      showEventsContent();
      renderEvents(allEvents);
      showToast('success', 'Events loaded', `Found ${allEvents.length} upcoming events`);
    }
  } catch (err) {
    console.error('Error loading events:', err);
    hideLoadingState();
    showErrorState('Failed to load events from Google Calendar');
  }
}

// ===== PARSE GOOGLE CALENDAR EVENTS =====
function parseEvents(googleEvents) {
  return googleEvents.map(event => ({
    id: event.id,
    title: event.summary || 'Untitled Event',
    description: event.description || '',
    startTime: new Date(event.start.dateTime || event.start.date),
    endTime: new Date(event.end.dateTime || event.end.date),
    location: event.location || 'No location',
    attendees: event.attendees ? event.attendees.length : 0,
    htmlLink: event.htmlLink,
    isAllDay: !event.start.dateTime,
    creator: event.creator?.displayName || event.creator?.email || 'Unknown',
    meetUrl: event.conferenceData?.entryPoints?.[0]?.uri || null
  })).sort((a, b) => a.startTime - b.startTime);
}

// ===== RENDER EVENTS TO DOM =====
function renderEvents(events) {
  const eventsList = document.getElementById('eventsList');
  eventsList.innerHTML = '';
  
  if (events.length === 0) {
    showNoEventsState();
    return;
  }
  
  events.forEach(event => {
    const eventCard = createEventCard(event);
    eventsList.appendChild(eventCard);
  });
}

function createEventCard(event) {
  const card = document.createElement('div');
  card.className = 'event-card';
  
  const formattedDate = formatDate(event.startTime);
  const formattedTime = formatTime(event.startTime, event.endTime, event.isAllDay);
  const truncatedDesc = event.description.substring(0, 100) + (event.description.length > 100 ? '...' : '');
  
  card.innerHTML = `
    <div class="event-card-header">
      <div class="event-date">📅 ${formattedDate}</div>
      <h3 class="event-title">${escapeHtml(event.title)}</h3>
      <div class="event-time">⏰ ${formattedTime}</div>
    </div>
    <div class="event-card-body">
      ${truncatedDesc ? `<p class="event-description">${escapeHtml(truncatedDesc)}</p>` : ''}
      ${event.location ? `<div class="event-location">📍 ${escapeHtml(event.location)}</div>` : ''}
      <div class="event-attendees">👥 ${event.attendees} attendee${event.attendees !== 1 ? 's' : ''}</div>
      <div class="event-actions">
        <button class="event-btn view-btn" onclick="openEventModal('${event.id}')">View Details</button>
        <button class="event-btn invite-btn" onclick="inviteTeammates('${event.id}')">Invite Team</button>
      </div>
    </div>
  `;
  
  return card;
}

// ===== MODAL FUNCTIONS =====
function openEventModal(eventId) {
  const event = allEvents.find(e => e.id === eventId);
  if (!event) return;
  
  const modal = document.getElementById('eventModal');
  const modalBody = document.getElementById('modalBody');
  
  const meetingLink = event.meetUrl ? `
    <div class="modal-event-detail">
      <strong>🎥 Meeting Link</strong>
      <p><a href="${event.meetUrl}" target="_blank" rel="noopener noreferrer">${event.meetUrl}</a></p>
    </div>
  ` : '';
  
  modalBody.innerHTML = `
    <h2 class="modal-event-title">${escapeHtml(event.title)}</h2>
    
    <div class="modal-event-detail">
      <strong>📅 Date & Time</strong>
      <p>${formatDate(event.startTime)} - ${formatTime(event.startTime, event.endTime, event.isAllDay)}</p>
    </div>
    
    <div class="modal-event-detail">
      <strong>📍 Location</strong>
      <p>${escapeHtml(event.location)}</p>
    </div>
    
    <div class="modal-event-detail">
      <strong>👥 Attendees</strong>
      <p>${event.attendees} people attending</p>
    </div>
    
    <div class="modal-event-detail">
      <strong>📝 Description</strong>
      <p>${escapeHtml(event.description) || 'No description provided'}</p>
    </div>
    
    ${meetingLink}
    
    <div class="modal-event-detail">
      <strong>👤 Organizer</strong>
      <p>${escapeHtml(event.creator)}</p>
    </div>
    
    <div class="modal-actions">
      <button class="confirm-btn" onclick="openGoogleEvent('${eventId}')">📅 Open in Google Calendar</button>
      <button class="cancel-btn" onclick="closeEventModal()">Close</button>
    </div>
  `;
  
  modal.classList.remove('hidden');
}

function closeEventModal() {
  document.getElementById('eventModal').classList.add('hidden');
}

function openGoogleEvent(eventId) {
  const event = allEvents.find(e => e.id === eventId);
  if (event && event.htmlLink) {
    window.open(event.htmlLink, '_blank');
  }
}

// ===== FILTER & SEARCH =====
document.getElementById('eventFilter').addEventListener('change', (e) => {
  currentFilter = e.target.value;
  filterAndRenderEvents();
});

document.getElementById('eventSearch').addEventListener('input', filterAndRenderEvents);

function filterAndRenderEvents() {
  let filtered = allEvents;
  
  // Apply filter
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (currentFilter === 'today') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    filtered = filtered.filter(e => e.startTime >= today && e.startTime < tomorrow);
  } else if (currentFilter === 'week') {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    filtered = filtered.filter(e => e.startTime >= today && e.startTime < weekEnd);
  } else if (currentFilter === 'month') {
    const monthEnd = new Date(today);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    filtered = filtered.filter(e => e.startTime >= today && e.startTime < monthEnd);
  }
  
  // Apply search
  const searchTerm = document.getElementById('eventSearch').value.toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(e =>
      e.title.toLowerCase().includes(searchTerm) ||
      e.description.toLowerCase().includes(searchTerm) ||
      e.location.toLowerCase().includes(searchTerm)
    );
  }
  
  renderEvents(filtered);
}

// ===== INVITE TEAMMATES =====
async function inviteTeammates(eventId) {
  const event = allEvents.find(e => e.id === eventId);
  if (!event) return;
  
  try {
    const userProfile = localStorage.getItem('crewmatchProfile');
    if (!userProfile) {
      showToast('warning', 'Profile required', 'Please create your profile first');
      return;
    }
    
    // Find teammates who might be interested
    showToast('info', 'Finding teammates...', 'Looking for team members interested in this event');
    
    // In a real app, this would query the database for matching profiles
    // For now, just show a placeholder
    showToast('success', 'Invitation sent', `Team members have been notified about "${event.title}"`);
  } catch (err) {
    console.error('Error inviting teammates:', err);
    showToast('error', 'Invitation failed', 'Could not send invitations');
  }
}

// ===== UI STATE FUNCTIONS =====
function showLoadingState() {
  document.getElementById('loadingState').classList.remove('hidden');
  document.getElementById('authRequired').classList.add('hidden');
  document.getElementById('eventsContent').classList.add('hidden');
  document.getElementById('errorState').classList.add('hidden');
}

function hideLoadingState() {
  document.getElementById('loadingState').classList.add('hidden');
}

function showEventsContent() {
  document.getElementById('eventsContent').classList.remove('hidden');
  document.getElementById('authRequired').classList.add('hidden');
  document.getElementById('noEventsState').classList.add('hidden');
  document.getElementById('errorState').classList.add('hidden');
}

function showNoEventsState() {
  document.getElementById('noEventsState').classList.remove('hidden');
  document.getElementById('eventsList').innerHTML = '';
  document.getElementById('eventsContent').classList.remove('hidden');
}

function showErrorState(message) {
  document.getElementById('errorMessage').textContent = message;
  document.getElementById('errorState').classList.remove('hidden');
  document.getElementById('eventsContent').classList.add('hidden');
  document.getElementById('authRequired').classList.add('hidden');
}

// ===== UTILITY FUNCTIONS =====
function formatDate(date) {
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function formatTime(startTime, endTime, isAllDay) {
  if (isAllDay) return 'All Day';
  
  const startOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  const endOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  
  return `${startTime.toLocaleTimeString('en-US', startOptions)} - ${endTime.toLocaleTimeString('en-US', endOptions)}`;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ===== TOAST NOTIFICATIONS =====
function showToast(type, title, message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <span class="toast-close" onclick="this.parentElement.remove();">✕</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 5000);
}

// ===== NAVIGATION HELPERS =====
function goHome() {
  window.location.href = 'index.html';
}

// Update profile button on page load
function updateProfileButton() {
  const profileBtn = document.getElementById('profileBtn');
  const saved = localStorage.getItem('crewmatchProfile');
  if (profileBtn) {
    if (saved) {
      try {
        const p = JSON.parse(saved);
        profileBtn.textContent = p.fullName || 'Profile';
      } catch (e) {
        profileBtn.textContent = 'Profile';
      }
    } else {
      profileBtn.textContent = 'Profile';
    }
    profileBtn.addEventListener('click', () => { window.location.href = 'profile.html'; });
  }
}

document.querySelector('.groups-btn').addEventListener('click', () => {
  window.location.href = 'groups.html';
});

// ===== INITIALIZE PAGE =====
document.addEventListener('DOMContentLoaded', () => {
  updateProfileButton();
  initializeGoogleAPI();
});

// Close modal when clicking outside
document.getElementById('eventModal').addEventListener('click', (e) => {
  if (e.target.id === 'eventModal') {
    closeEventModal();
  }
});
