// ===== AI MATCHING LOGIC =====

// Sample database of potential teammates
const teammateCandidates = [
  {
    id: 1,
    name: "Aarav Sharma",
    branch: "cse",
    skills: ["coding", "problem-solving", "leadership"],
    traits: { trait1: "extrovert", trait2: "analytical", trait3: "flexible", trait4: "collaborative" },
    goal: "hackathon",
    bio: "Passionate full-stack developer with 2 years of experience. Love participating in hackathons!"
  },
  {
    id: 2,
    name: "Priya Desai",
    branch: "design",
    skills: ["design", "communication", "creativity"],
    traits: { trait1: "extrovert", trait2: "creative", trait3: "flexible", trait4: "collaborative" },
    goal: "startup",
    bio: "UI/UX designer focused on creating beautiful and intuitive experiences. Startup enthusiast!"
  },
  {
    id: 3,
    name: "Vikram Patel",
    branch: "cse",
    skills: ["coding", "research", "problem-solving"],
    traits: { trait1: "introvert", trait2: "analytical", trait3: "organized", trait4: "independent" },
    goal: "learning",
    bio: "AI/ML enthusiast. Always eager to learn new technologies and solve complex problems."
  },
  {
    id: 4,
    name: "Neha Singh",
    branch: "business",
    skills: ["marketing", "communication", "leadership"],
    traits: { trait1: "extrovert", trait2: "creative", trait3: "organized", trait4: "collaborative" },
    goal: "startup",
    bio: "Business strategist with a passion for entrepreneurship. Let's build something big!"
  },
  {
    id: 5,
    name: "Arjun Kumar",
    branch: "cse",
    skills: ["coding", "project-management", "leadership"],
    traits: { trait1: "extrovert", trait2: "analytical", trait3: "organized", trait4: "collaborative" },
    goal: "competition",
    bio: "Full-stack developer and tech lead. Competitive spirit with a focus on quality code."
  },
  {
    id: 6,
    name: "Ritika Gupta",
    branch: "ece",
    skills: ["research", "problem-solving", "communication"],
    traits: { trait1: "introvert", trait2: "analytical", trait3: "flexible", trait4: "independent" },
    goal: "learning",
    bio: "Electronics engineer interested in IoT and embedded systems. Love collaborating on research projects."
  }
];

// Global variable to store user profile
let userProfile = null;
const API_BASE = window.__API_BASE__ || 'http://localhost:3000';

// ===== Profile button helper (updates nav label) =====
function updateProfileButtonMatching() {
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

window.addEventListener('storage', (e) => {
  if (e.key === 'crewmatchProfile') updateProfileButtonMatching();
});

// Navbar dark-scroll effect for matching page
const mNavbar = document.querySelector('.navbar');
if (mNavbar) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      mNavbar.style.background = 'linear-gradient(90deg, rgba(10,8,25,0.95), rgba(20,10,45,0.95))';
      mNavbar.style.boxShadow = '0 6px 22px rgba(138,43,226,0.12)';
    } else {
      mNavbar.style.background = 'rgba(15, 15, 30, 0.65)';
      mNavbar.style.boxShadow = 'none';
    }
  });
}

// Groups button on matching page
const groupsBtn = document.querySelector('.groups-btn');
if (groupsBtn) {
  groupsBtn.addEventListener('click', () => {
    window.location.href = 'groups.html';
  });
}

// ===== FORM SUBMISSION =====
document.getElementById('profileForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  // Validate skills selection
  const selectedSkills = Array.from(document.querySelectorAll('input[name="skills"]:checked')).map(el => el.value);
  if (selectedSkills.length < 3) {
    showError('⚠️ Please select at least 3 skills');
    return;
  }

  // Collect form data
  userProfile = {
    fullName: document.getElementById('fullName').value,
    email: document.getElementById('email').value,
    branch: document.getElementById('branch').value,
    skills: selectedSkills,
    traits: {
      trait1: document.querySelector('input[name="trait1"]:checked')?.value || '',
      trait2: document.querySelector('input[name="trait2"]:checked')?.value || '',
      trait3: document.querySelector('input[name="trait3"]:checked')?.value || '',
      trait4: document.querySelector('input[name="trait4"]:checked')?.value || ''
    },
    goal: document.getElementById('goal').value,
    bio: document.getElementById('bio').value,
    locationPreference: document.querySelector('input[name="locationPreference"]:checked')?.value || 'remote',
    selectedLocation: document.getElementById('selectedLocation').value || ''
  };

  // Save to localStorage immediately
  localStorage.setItem('crewmatchProfile', JSON.stringify(userProfile));

  // Try to save to server (non-blocking) — fall back silently
  (async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/profile`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userProfile)
      });
      if (resp.ok) showSuccess('✅ Profile saved to server');
    } catch (err) {
      showInfo('Saved locally — server not reachable');
    }
  })();

  // Show matching section
  showMatchingSection();
});

// ===== SHOW MATCHING SECTION =====
function showMatchingSection() {
  // Hide profile section
  document.getElementById('profileSection').classList.remove('active');
  
  // Show matching section
  document.getElementById('matchingSection').classList.add('active');

  // Display profile summary
  displayProfileSummary();

  // Generate and display matches
  setTimeout(() => {
    generateMatches();
  }, 1500);
}

// ===== DISPLAY PROFILE SUMMARY =====
function displayProfileSummary() {
  const summaryDiv = document.getElementById('profileSummary');
  
  summaryDiv.innerHTML = `
    <div class="summary-item">
      <span class="summary-label">👤 Name</span>
      <span class="summary-value">${userProfile.fullName}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">🎓 Branch</span>
      <span class="summary-value">${formatBranchName(userProfile.branch)}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">💡 Skills</span>
      <div style="margin-top: 0.5rem;">
        ${userProfile.skills.map(skill => `<span class="skill-tag">${formatSkillName(skill)}</span>`).join('')}
      </div>
    </div>
    <div class="summary-item">
      <span class="summary-label">🎯 Goal</span>
      <span class="summary-value">${formatGoalName(userProfile.goal)}</span>
    </div>
    ${userProfile.location ? `
    <div class="summary-item">
      <span class="summary-label">📍 Location</span>
      <span class="summary-value">${userProfile.location}</span>
    </div>
    ` : ''}
    <div class="summary-item">
      <span class="summary-label">🔄 Location Preference</span>
      <span class="summary-value">${formatLocationPreference(userProfile.locationPreference)}</span>
    </div>
    ${userProfile.selectedLocation ? `
    <div class="summary-item">
      <span class="summary-label">📌 Meeting Location</span>
      <span class="summary-value">${userProfile.selectedLocation}</span>
    </div>
    ` : ''}
    <div class="summary-item">
      <span class="summary-label">✨ Personality</span>
      <span class="summary-value">${formatTraitName(userProfile.traits.trait1)}</span>
    </div>
  `;
}

// ===== CALCULATE COMPATIBILITY SCORE =====
function calculateCompatibility(candidate) {
  let score = 0;
  let reasons = [];

  // Skill matching (40 points)
  const commonSkills = userProfile.skills.filter(skill => candidate.skills.includes(skill));
  const skillScore = (commonSkills.length / Math.max(userProfile.skills.length, candidate.skills.length)) * 40;
  score += skillScore;
  if (commonSkills.length > 0) {
    reasons.push(`✓ ${commonSkills.length} shared skills`);
  }

  // Goal matching (30 points)
  if (userProfile.goal === candidate.goal) {
    score += 30;
    reasons.push('✓ Same goal');
  } else {
    score += 10; // Partial credit
  }

  // Personality compatibility (20 points)
  let traitMatches = 0;
  for (let i = 1; i <= 4; i++) {
    const traitKey = `trait${i}`;
    if (userProfile.traits[traitKey] === candidate.traits[traitKey]) {
      traitMatches++;
    }
  }
  const traitScore = (traitMatches / 4) * 20;
  score += traitScore;
  if (traitMatches > 0) {
    reasons.push(`✓ ${traitMatches} matching traits`);
  }

  // Branch diversity bonus (10 points)
  if (userProfile.branch !== candidate.branch) {
    score += 5;
    reasons.push('✓ Brings diverse perspective');
  }

  return {
    score: Math.round(score),
    reasons: reasons.slice(0, 2) // Show top 2 reasons
  };
}

// ===== GENERATE AND DISPLAY MATCHES =====
async function generateMatches() {
  // Remove loading message
  document.querySelector('.ai-message').innerHTML = `
    <div class="message-content">
      <p>🎯 Perfect matches found!</p>
      <p style="font-size: 0.9em; color: #b0b0d0; margin-top: 0.5em;">Based on your personality, skills, and goals</p>
    </div>
  `;

  let matchesWithScore = [];
  // try server-side matches first
  if (userProfile && userProfile.email) {
    try {
      const resp = await fetch(`${API_BASE}/api/matches?email=${encodeURIComponent(userProfile.email)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.matches && data.matches.length) {
          matchesWithScore = data.matches.map(c => ({
            id: c.id,
            name: c.name,
            branch: c.branch,
            skills: c.skills || [],
            traits: c.traits || {},
            goal: c.goal,
            bio: c.bio,
            compatibility: calculateCompatibility(c)
          }));
        }
      }
    } catch (e) {
      // server not available — fall back to local
      console.warn('server matches not available', e);
    }
  }

  // fallback to client-side list if server didn't return results
  if (!matchesWithScore || matchesWithScore.length === 0) {
    matchesWithScore = teammateCandidates.map(candidate => ({
      ...candidate,
      compatibility: calculateCompatibility(candidate)
    }));
  }

  // Sort by compatibility score (descending)
  matchesWithScore.sort((a, b) => b.compatibility.score - a.compatibility.score);

  // Display top matches
  const matchesContainer = document.getElementById('matchesContainer');
  matchesContainer.innerHTML = '';

  matchesWithScore.slice(0, 4).forEach(match => {
    const matchCard = createMatchCard(match);
    matchesContainer.appendChild(matchCard);
  });
}

// ===== CREATE MATCH CARD =====
function createMatchCard(match) {
  const card = document.createElement('div');
  card.className = 'match-card';

  const skillsHTML = match.skills.map(skill => 
    `<span class="match-skill-tag">${formatSkillName(skill)}</span>`
  ).join('');

  const reasonsHTML = match.compatibility.reasons
    .map(reason => `<p style="margin: 0.3rem 0;">${reason}</p>`)
    .join('');

  card.innerHTML = `
    <div class="match-header">
      <div>
        <div class="match-name">${match.name}</div>
        <div class="match-info">
          <span>🎓 ${formatBranchName(match.branch)}</span>
          <span>🎯 ${formatGoalName(match.goal)}</span>
        </div>
      </div>
      <div class="match-compatibility">${match.compatibility.score}% Match</div>
    </div>

    <div class="match-skills">
      <span class="match-skills-label">SKILLS</span>
      <div class="match-skill-tags">
        ${skillsHTML}
      </div>
    </div>

    <div class="match-reason">
      ${reasonsHTML}
    </div>

    <div class="match-info" style="font-size: 0.85rem; margin-bottom: 1rem;">
      <span style="font-style: italic;">"${match.bio}"</span>
    </div>

    <div class="match-actions">
      <button class="match-btn match-btn-primary" onclick="connectWithMatch('${match.name}')">Connect</button>
      <button class="match-btn match-btn-secondary" onclick="viewProfile('${match.name}')">View</button>
    </div>
  `;

  return card;
}

// ===== ACTION FUNCTIONS =====
function connectWithMatch(name) {
  showSuccess(`✨ You've connected with ${name}! Check your messages to start chatting.`);
}

function viewProfile(name) {
  showInfo(`📋 Viewing full profile of ${name}...`);
}

function refineMatching() {
  showInfo('🔄 Refining matches based on your preferences...');
  generateMatches();
}

function viewMoreMatches() {
  const matchesContainer = document.getElementById('matchesContainer');
  
  // Calculate compatibility for all candidates
  const matchesWithScore = teammateCandidates.map(candidate => ({
    ...candidate,
    compatibility: calculateCompatibility(candidate)
  }));

  // Sort by compatibility score
  matchesWithScore.sort((a, b) => b.compatibility.score - a.compatibility.score);

  // Add remaining matches
  matchesWithScore.slice(4).forEach(match => {
    const matchCard = createMatchCard(match);
    matchesContainer.appendChild(matchCard);
  });

  // Disable button
  event.target.disabled = true;
  event.target.textContent = '✓ All matches loaded';
}

function startMessaging() {
  showInfo('💬 Opening messaging interface...\n\nStart conversations with your matches!');
}

// ===== HELPER FUNCTIONS =====
function formatBranchName(branch) {
  const branchMap = {
    'cse': 'Computer Science & Engineering',
    'ece': 'Electronics & Communication',
    'mech': 'Mechanical Engineering',
    'civil': 'Civil Engineering',
    'design': 'Design & UI/UX',
    'business': 'Business & Management',
    'other': 'Other'
  };
  return branchMap[branch] || branch;
}

function formatSkillName(skill) {
  const skillMap = {
    'leadership': '👥 Leadership',
    'coding': '💻 Coding',
    'design': '🎨 Design',
    'communication': '💬 Communication',
    'problem-solving': '🧩 Problem Solving',
    'research': '🔬 Research',
    'marketing': '📱 Marketing',
    'project-management': '📊 Project Management'
  };
  return skillMap[skill] || skill;
}

function formatGoalName(goal) {
  const goalMap = {
    'hackathon': 'Hackathon Participation',
    'startup': 'Startup Building',
    'learning': 'Learning & Growth',
    'competition': 'Competition',
    'project': 'Project Development',
    'networking': 'Networking'
  };
  return goalMap[goal] || goal;
}

function formatTraitName(trait) {
  const traits = {
    'introvert': '🤫 Introvert',
    'extrovert': '🎉 Extrovert',
    'analytical': '🧠 Analytical',
    'creative': '✨ Creative',
    'organized': '📋 Organized',
    'flexible': '🌊 Flexible',
    'collaborative': '🤝 Collaborative',
    'independent': '🦸 Independent'
  };
  return traits[trait] || trait;
}

// ===== LOCATION DATA & GOOGLE MAPS =====
const campusLocations = [
  { name: 'Main Campus', lat: 28.6139, lng: 77.2090, address: 'New Delhi, India', distance: '0 km' },
  { name: 'Tech Hub - Central', lat: 28.5244, lng: 77.1855, address: 'Delhi, India', distance: '8.5 km' },
  { name: 'Innovation Center', lat: 28.6329, lng: 77.2197, address: 'Delhi, India', distance: '2.1 km' },
  { name: 'Startup Incubator', lat: 28.5494, lng: 77.2068, address: 'Delhi, India', distance: '5.3 km' },
  { name: 'Research Lab', lat: 28.6532, lng: 77.2313, address: 'Delhi, India', distance: '7.8 km' },
  { name: 'Collaboration Hub', lat: 28.5667, lng: 77.1843, address: 'Delhi, India', distance: '3.2 km' }
];

let locationMap = null;
let selectedLocationMarker = null;
let locationMarkers = [];

function showCampusLocations() {
  const container = document.getElementById('locationMapContainer');
  const inPersonInput = document.querySelector('input[value="in-person"]');
  
  if (inPersonInput.checked) {
    container.style.display = 'block';
    setTimeout(initializeLocationMap, 100);
  } else {
    container.style.display = 'none';
  }
}

function initializeLocationMap() {
  const mapContainer = document.getElementById('locationMap');
  if (!mapContainer || locationMap) return;

  // Center map on main campus
  const mapOptions = {
    zoom: 12,
    center: { lat: campusLocations[0].lat, lng: campusLocations[0].lng },
    styles: [
      {
        featureType: 'all',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#2c3e50' }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#e8f4f8' }]
      }
    ]
  };

  locationMap = new google.maps.Map(mapContainer, mapOptions);
  renderLocationsList();
  addLocationMarkers();
}

function addLocationMarkers() {
  if (!locationMap) return;

  // Clear existing markers
  locationMarkers.forEach(marker => marker.setMap(null));
  locationMarkers = [];

  const infoWindows = [];

  campusLocations.forEach((location, index) => {
    const marker = new google.maps.Marker({
      position: { lat: location.lat, lng: location.lng },
      map: locationMap,
      title: location.name,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: index === 0 ? '#7c3aed' : '#06b6d4',
        fillOpacity: 0.8,
        strokeColor: '#fff',
        strokeWeight: 2
      }
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px; color: #2c3e50; font-family: Poppins, sans-serif;">
          <strong>${location.name}</strong><br/>
          📍 ${location.address}<br/>
          📏 ${location.distance}
        </div>
      `
    });

    marker.addListener('click', () => {
      // Close all other info windows
      infoWindows.forEach(iw => iw.close());
      infoWindow.open(locationMap, marker);
      selectLocation(location);
    });

    locationMarkers.push(marker);
    infoWindows.push(infoWindow);
  });

  // Auto open first location
  if (locationMarkers.length > 0) {
    locationMarkers[0].click();
  }
}

function selectLocation(location) {
  document.getElementById('selectedLocation').value = location.name;
  
  // Update UI to show selected location
  const buttons = document.querySelectorAll('.location-option-card');
  buttons.forEach(btn => btn.classList.remove('selected'));
  
  const selectedBtn = Array.from(buttons).find(btn => 
    btn.querySelector('.location-option-card-name').textContent === location.name
  );
  if (selectedBtn) selectedBtn.classList.add('selected');
}

function renderLocationsList() {
  const container = document.getElementById('locationsList');
  container.innerHTML = campusLocations.map((location, index) => `
    <div class="location-option-card ${index === 0 ? 'selected' : ''}" onclick="event.stopPropagation(); selectLocation(${JSON.stringify(location).replace(/"/g, '&quot;')})">
      <div style="font-size: 1.5rem; margin-bottom: 0.3rem;">${index === 0 ? '🎓' : index === 1 ? '💻' : index === 2 ? '🚀' : index === 3 ? '🤝' : '🔬'}</div>
      <div class="location-option-card-name">${location.name}</div>
      <div class="location-option-card-info">${location.distance}</div>
    </div>
  `).join('');
}

function formatLocationPreference(location) {
  const locations = {
    'remote': '💻 Remote',
    'in-person': '🏢 In-Person',
    'hybrid': '🔄 Hybrid'
  };
  return locations[location] || 'Not specified';
}

// ===== NAVIGATION FUNCTIONS =====
function goHome() {
  window.location.href = 'index.html';
}

// ===== INITIALIZE =====
window.addEventListener('load', () => {
  // Check if user has an existing profile
  const savedProfile = localStorage.getItem('crewmatchProfile');
  if (savedProfile) {
    userProfile = JSON.parse(savedProfile);
    // prefer server profile if available (keeps local copy as fallback)
    (async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/profile?email=${encodeURIComponent(userProfile.email)}`);
        if (resp.ok) {
          const p = await resp.json();
          p.skills = JSON.parse(p.skills || '[]');
          p.traits = JSON.parse(p.traits || '{}');
          userProfile = p;
          localStorage.setItem('crewmatchProfile', JSON.stringify(userProfile));
        }
      } catch (err) {
        // silent fallback to local
      }
      showMatchingSection();
    })();
  }
  // update nav profile button label
  updateProfileButtonMatching();
});
