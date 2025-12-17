// ===== GOOGLE CALENDAR CONFIGURATION =====
// Replace with your own Google API credentials from Google Cloud Console
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

let googleAPIReady = false;
let googleAuthReady = false;

// Initialize Google API
function initializeHomeGoogleAPI() {
  if (!window.gapi) return;
  
  gapi.load('client:auth2', () => {
    gapi.client.init({
      apiKey: GOOGLE_API_KEY,
      clientId: GOOGLE_CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES
    }).then(() => {
      googleAPIReady = true;
      googleAuthReady = true;
      loadHomeCalendarEvents();
      
      // Listen for auth state changes
      gapi.auth2.getAuthInstance().isSignedIn.listen(isSignedIn => {
        if (isSignedIn) {
          loadHomeCalendarEvents();
        } else {
          showDefaultEvents();
        }
      });
    }).catch(err => {
      console.error('Failed to initialize Google API:', err);
      showDefaultEvents();
    });
  });
}

// Load calendar events for home page
function loadHomeCalendarEvents() {
  if (!googleAPIReady || !gapi.auth2.getAuthInstance().isSignedIn.get()) {
    showDefaultEvents();
    return;
  }
  
  try {
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin,
      timeMax: timeMax,
      showDeleted: false,
      singleEvents: true,
      maxResults: 4,
      orderBy: 'startTime'
    }).then(response => {
      const events = response.result.items || [];
      
      if (events.length === 0) {
        showDefaultEvents();
        return;
      }
      
      renderHomeCalendarEvents(events);
    }).catch(err => {
      console.error('Error loading calendar events:', err);
      showDefaultEvents();
    });
  } catch (err) {
    console.error('Calendar error:', err);
    showDefaultEvents();
  }
}

// Render Google Calendar events on home page
function renderHomeCalendarEvents(googleEvents) {
  const carousel = document.getElementById('eventsCarousel');
  const statusText = document.getElementById('eventsStatusText');
  const connectBtn = document.getElementById('connectGoogleHomeBtn');
  
  if (!carousel) return;
  
  carousel.innerHTML = '';
  
  googleEvents.forEach((event, index) => {
    const startTime = new Date(event.start.dateTime || event.start.date);
    const endTime = new Date(event.end.dateTime || event.end.date);
    const formattedDate = formatEventDate(startTime);
    const formattedTime = formatEventTime(startTime, endTime, !event.start.dateTime);
    const description = event.description ? event.description.substring(0, 80) : event.summary.substring(0, 80);
    const eventId = `home-event-${index}`;
    
    const eventCard = document.createElement('div');
    eventCard.className = 'event-card';
    eventCard.style.cursor = 'pointer';
    eventCard.id = eventId;
    eventCard.innerHTML = `
      <div class="event-image" style="background: linear-gradient(135deg, #7c3aed, #06b6d4);"></div>
      <h3>${event.summary || 'Untitled Event'}</h3>
      <p class="event-date">📅 ${formattedDate}</p>
      <p class="event-time" style="color: #6b7280; font-size: 0.9rem;">⏰ ${formattedTime}</p>
      <p class="event-description">${description}${description.length > 80 ? '...' : ''}</p>
      <button class="event-btn" onclick="event.stopPropagation(); window.open('${event.htmlLink}', '_blank')">View Event</button>
    `;
    
    // Add click handler to open event details
    eventCard.addEventListener('click', () => {
      openHomeEventModal(event);
    });
    
    carousel.appendChild(eventCard);
  });
  
  statusText.textContent = '✅ ' + googleEvents.length + ' real event' + (googleEvents.length !== 1 ? 's' : '') + ' from your Google Calendar';
  connectBtn.style.display = 'none';
}

// Open event modal on home page
function openHomeEventModal(event) {
  const startTime = new Date(event.start.dateTime || event.start.date);
  const endTime = new Date(event.end.dateTime || event.end.date);
  const formattedDate = formatEventDate(startTime);
  const formattedTime = formatEventTime(startTime, endTime, !event.start.dateTime);
  
  // Create modal if it doesn't exist
  let modal = document.getElementById('homeEventModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'homeEventModal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(modal);
  }
  
  const meetingLink = event.conferenceData?.entryPoints?.[0]?.uri 
    ? `<div style="margin: 1rem 0; padding: 1rem; background: rgba(124, 58, 237, 0.05); border-left: 3px solid #7c3aed; border-radius: 8px;">
        <strong style="color: #2c3e50;">🎥 Meeting Link</strong>
        <p style="color: #6b7280; margin-top: 0.3rem;"><a href="${event.conferenceData.entryPoints[0].uri}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed;">${event.conferenceData.entryPoints[0].uri}</a></p>
      </div>`
    : '';
  
  modal.innerHTML = `
    <div style="background: white; padding: 2rem; border-radius: 16px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); position: relative;">
      <span style="position: absolute; top: 1rem; right: 1rem; font-size: 1.5rem; cursor: pointer; color: #6b7280;" onclick="document.getElementById('homeEventModal').remove();">✕</span>
      
      <h2 style="font-size: 1.8rem; color: #2c3e50; margin-bottom: 1rem;">${event.summary || 'Untitled Event'}</h2>
      
      <div style="margin: 1rem 0; padding: 1rem; background: rgba(124, 58, 237, 0.05); border-left: 3px solid #7c3aed; border-radius: 8px;">
        <strong style="color: #2c3e50;">📅 Date & Time</strong>
        <p style="color: #6b7280; margin-top: 0.3rem;">${formattedDate} - ${formattedTime}</p>
      </div>
      
      <div style="margin: 1rem 0; padding: 1rem; background: rgba(124, 58, 237, 0.05); border-left: 3px solid #7c3aed; border-radius: 8px;">
        <strong style="color: #2c3e50;">📍 Location</strong>
        <p style="color: #6b7280; margin-top: 0.3rem;">${event.location || 'No location specified'}</p>
      </div>
      
      ${event.description ? `<div style="margin: 1rem 0; padding: 1rem; background: rgba(124, 58, 237, 0.05); border-left: 3px solid #7c3aed; border-radius: 8px;">
        <strong style="color: #2c3e50;">📝 Description</strong>
        <p style="color: #6b7280; margin-top: 0.3rem;">${event.description}</p>
      </div>` : ''}
      
      ${meetingLink}
      
      <div style="display: flex; gap: 1rem; margin-top: 2rem;">
        <button onclick="window.open('${event.htmlLink}', '_blank')" style="flex: 1; padding: 0.9rem; background: linear-gradient(135deg, #7c3aed, #06b6d4); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">📅 Open in Google Calendar</button>
        <button onclick="document.getElementById('homeEventModal').remove()" style="flex: 1; padding: 0.9rem; background: rgba(107, 114, 128, 0.1); color: #6b7280; border: 1px solid rgba(107, 114, 128, 0.3); border-radius: 8px; cursor: pointer; font-weight: 600;">Close</button>
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
  modal.addEventListener('click', (e) => {
    if (e.target.id === 'homeEventModal') {
      modal.remove();
    }
  });
}

// Show default events when Google Calendar is not connected
function showDefaultEvents() {
  const carousel = document.getElementById('eventsCarousel');
  const statusText = document.getElementById('eventsStatusText');
  const connectBtn = document.getElementById('connectGoogleHomeBtn');
  
  if (!carousel) return;
  
  carousel.innerHTML = `
    <div class="event-card">
      <div class="event-image coding"></div>
      <h3>Hackathon 2025</h3>
      <p class="event-date">📅 Dec 15-17, 2025</p>
      <p class="event-description">24-hour coding marathon. Build innovative solutions and win prizes!</p>
      <button class="event-btn">Join Now</button>
    </div>

    <div class="event-card">
      <div class="event-image design"></div>
      <h3>Design Challenge</h3>
      <p class="event-date">📅 Dec 22, 2025</p>
      <p class="event-description">Showcase your UI/UX skills. Design the next big thing.</p>
      <button class="event-btn">Join Now</button>
    </div>

    <div class="event-card">
      <div class="event-image sports"></div>
      <h3>Sports Tournament</h3>
      <p class="event-date">📅 Jan 5, 2026</p>
      <p class="event-description">Team up for basketball, volleyball, and esports competitions.</p>
      <button class="event-btn">Join Now</button>
    </div>

    <div class="event-card">
      <div class="event-image startup"></div>
      <h3>Startup Pitch</h3>
      <p class="event-date">📅 Jan 20, 2026</p>
      <p class="event-description">Pitch your startup idea and find co-founders and investors.</p>
      <button class="event-btn">Join Now</button>
    </div>
  `;
  
  statusText.textContent = 'Sample events - Connect your Google Calendar to see your real events';
  connectBtn.style.display = 'inline-block';
}

// Connect to Google Calendar from home page
function connectGoogleFromHome() {
  if (!googleAPIReady) {
    alert('Google API not ready. Please refresh the page.');
    return;
  }
  gapi.auth2.getAuthInstance().signIn().then(() => {
    loadHomeCalendarEvents();
  }).catch(err => {
    console.error('Auth error:', err);
    alert('Could not sign in to Google Calendar');
  });
}

// Format event date
function formatEventDate(date) {
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Format event time
function formatEventTime(startTime, endTime, isAllDay) {
  if (isAllDay) return 'All Day';
  const options = { hour: 'numeric', minute: '2-digit', hour12: true };
  return startTime.toLocaleTimeString('en-US', options);
}

// ===== Smooth Scroll for Navigation Links =====

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ===== Navbar Background Change on Scroll =====
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    // use darker translucent background on scroll to fit dark theme
    if (window.scrollY > 60) {
      navbar.style.background = 'linear-gradient(90deg, rgba(10,8,25,0.95), rgba(20,10,45,0.95))';
      navbar.style.boxShadow = '0 6px 22px rgba(138,43,226,0.12)';
    } else {
      navbar.style.background = 'rgba(15, 15, 30, 0.65)';
      navbar.style.boxShadow = 'none';
    }
  });
}

// ===== Ripple Effect for Buttons =====
document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', function (e) {
    const circle = document.createElement('span');
    const diameter = Math.max(this.clientWidth, this.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.offsetX - radius}px`;
    circle.style.top = `${e.offsetY - radius}px`;
    circle.classList.add('ripple');

    const ripple = this.querySelector('.ripple');
    if (ripple) ripple.remove();

    this.appendChild(circle);
  });
});

// ===== Auto Carousel for Events Section =====
const carousel = document.querySelector('.events-carousel');
if (carousel) {
  let scrollAmount = 0;
  setInterval(() => {
    scrollAmount += 300;
    if (scrollAmount >= carousel.scrollWidth - carousel.clientWidth) {
      scrollAmount = 0;
    }
    carousel.scrollTo({
      left: scrollAmount,
      behavior: 'smooth'
    });
  }, 4000);
}

// ===== Floating Shape Animation on Mouse Move =====
const shapes = document.querySelectorAll('.hero-background div');
if (shapes.length > 0) {
  document.addEventListener('mousemove', e => {
    shapes.forEach((shape, i) => {
      const speed = (i + 1) * 0.03;
      const x = (window.innerWidth / 2 - e.pageX) * speed;
      const y = (window.innerHeight / 2 - e.pageY) * speed;
      shape.style.transform = `translate(${x}px, ${y}px)`;
    });
  });
}

// ===== Scroll Reveal Animation =====
const revealElements = document.querySelectorAll('.feature-card, .step-card, .event-card');
const revealOnScroll = () => {
  const triggerBottom = window.innerHeight * 0.85;
  revealElements.forEach(el => {
    const boxTop = el.getBoundingClientRect().top;
    if (boxTop < triggerBottom) {
      el.classList.add('show');
    } else {
      el.classList.remove('show');
    }
  });
};
window.addEventListener('scroll', revealOnScroll);
revealOnScroll();

// ===== Modal (Get Started Button) =====
const modal = document.getElementById("get-started-modal");
const openBtns = document.querySelectorAll(".cta-btn, .hero-cta, .cta-large-btn");
const closeBtn = document.querySelector(".close-btn");

if (modal && closeBtn) {
  openBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      modal.style.display = "flex";
    });
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", e => {
    if (e.target === modal) modal.style.display = "none";
  });
}

// ===== Scroll to Top Button =====
const scrollTopBtn = document.getElementById("scrollTopBtn");

if (scrollTopBtn) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      scrollTopBtn.style.display = "block";
    } else {
      scrollTopBtn.style.display = "none";
    }
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ===== Dummy Form Submissions =====
document.querySelectorAll("form").forEach(form => {
  form.addEventListener("submit", e => {
    e.preventDefault();
    showSuccess("✅ Thank you! Your submission has been received.");
    form.reset();
    if (modal && modal.style.display === "flex") modal.style.display = "none";
  });
});

// ===== Nav Buttons: Groups & Profile =====
const groupsBtn = document.querySelector('.groups-btn');
if (groupsBtn) {
  groupsBtn.addEventListener('click', () => {
    window.location.href = 'groups.html';
  });
}

const profileBtn = document.getElementById('profileBtn');
function updateProfileButton() {
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
  }
}

if (profileBtn) {
  profileBtn.addEventListener('click', () => {
    window.location.href = 'profile.html';
  });
}

updateProfileButton();

// Update button if profile changes in another tab
window.addEventListener('storage', (e) => {
  if (e.key === 'crewmatchProfile') updateProfileButton();
});

// Connect Google Calendar from home page
const connectGoogleHomeBtn = document.getElementById('connectGoogleHomeBtn');
if (connectGoogleHomeBtn) {
  connectGoogleHomeBtn.addEventListener('click', connectGoogleFromHome);
}

// Initialize Google API when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeHomeGoogleAPI();
});
