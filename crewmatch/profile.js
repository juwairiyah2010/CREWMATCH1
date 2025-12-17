// Profile page logic — load/save profile to localStorage
const API_BASE = window.__API_BASE__ || 'http://localhost:3000';

function loadProfile() {
  const saved = localStorage.getItem('crewmatchProfile');
  if (!saved) return;
  try {
    const p = JSON.parse(saved);
    document.getElementById('fullName').value = p.fullName || '';
    document.getElementById('email').value = p.email || '';
    document.getElementById('branch').value = p.branch || '';
    document.getElementById('goal').value = p.goal || '';
    document.getElementById('bio').value = p.bio || '';
    document.getElementById('location').value = p.location || '';

    // skills checkboxes
    const skills = p.skills || [];
    document.querySelectorAll('.skills-grid input[type="checkbox"]').forEach(cb => {
      cb.checked = skills.includes(cb.value);
    });

    // traits radio groups
    for (let i = 1; i <= 4; i++) {
      const val = p.traits?.[`trait${i}`] || '';
      if (val) {
        const el = document.querySelector(`input[name="trait${i}"][value="${val}"]`);
        if (el) el.checked = true;
      }
    }
  } catch (e) {
    console.warn('Failed to load profile', e);
  }
}

function collectProfileFromForm() {
  const fullName = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const branch = document.getElementById('branch').value;
  const goal = document.getElementById('goal').value;
  const bio = document.getElementById('bio').value.trim();
  const location = document.getElementById('location').value.trim();

  const skills = Array.from(document.querySelectorAll('.skills-grid input[type="checkbox"]:checked')).map(i => i.value);

  const traits = {};
  for (let i = 1; i <= 4; i++) {
    traits[`trait${i}`] = (document.querySelector(`input[name="trait${i}"]:checked`)?.value) || '';
  }

  return { fullName, email, branch, goal, bio, skills, traits, location };
}

function validateProfile(profile) {
  if (!profile.fullName) return 'Please enter your full name.';
  if (!profile.email) return 'Please enter your email.';
  if (profile.skills.length < 3) return 'Please select at least 3 skills.';
  return null;
}

async function saveProfile(e) {
  if (e) e.preventDefault();

  const profile = collectProfileFromForm();
  const error = validateProfile(profile);
  if (error) {
    showError('⚠️ ' + error);
    return;
  }

  // Save locally first
  localStorage.setItem('crewmatchProfile', JSON.stringify(profile));

  // try to save to server if available
  try {
    const res = await fetch(`${API_BASE}/api/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (res.ok) {
      showSuccess('✅ Profile saved to server');
    } else {
      showInfo('Saved locally — server responded with an error');
    }
  } catch (err) {
    showInfo('✅ Profile saved locally (server not available)');
  }

  // update nav button text immediately (if present)
  const profileBtn = document.getElementById('profileBtn');
  if (profileBtn) profileBtn.textContent = profile.fullName;
}

function cancelEdit() {
  // restore current saved data
  loadProfile();
}

async function startMatchingFromProfile() {
  // Save then go to matching
  const profile = collectProfileFromForm();
  const err = validateProfile(profile);
  if (err) { showError('⚠️ ' + err); return; }
  localStorage.setItem('crewmatchProfile', JSON.stringify(profile));
  try {
    const resp = await fetch(`${API_BASE}/api/profile`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile)
    });
    if (resp.ok) showSuccess('✅ Saved profile and starting matching');
  } catch (err) {
    showInfo('Saved locally — starting matching (server not reachable)');
  }
  // ensure profile button updates if present
  const profileBtn = document.getElementById('profileBtn');
  if (profileBtn) profileBtn.textContent = profile.fullName;

  window.location.href = 'matching.html';
}

function goBack() {
  // go back to previous page if available, otherwise home
  if (document.referrer && document.referrer.includes(window.location.hostname)) {
    window.history.back();
  } else {
    window.location.href = 'index.html';
  }
}

function goHome() {
  window.location.href = 'index.html';
}

// Wire up buttons
window.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  document.getElementById('saveBtn').addEventListener('click', saveProfile);
  document.getElementById('cancelBtn').addEventListener('click', cancelEdit);
  document.getElementById('goMatching').addEventListener('click', startMatchingFromProfile);
  // navbar dark scroll behavior
  const navBar = document.querySelector('.navbar');
  if (navBar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        navBar.style.background = 'linear-gradient(90deg, rgba(10,8,25,0.95), rgba(20,10,45,0.95))';
        navBar.style.boxShadow = '0 6px 22px rgba(138,43,226,0.12)';
      } else {
        navBar.style.background = 'rgba(15, 15, 30, 0.65)';
        navBar.style.boxShadow = 'none';
      }
    });
  }
});
