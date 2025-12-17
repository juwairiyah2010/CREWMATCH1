// Groups & Chat UI logic — client-side + localStorage + BroadcastChannel sync

const CHANNEL_NAME = 'crewmatch-chat-channel';
const bc = ('BroadcastChannel' in window) ? new BroadcastChannel(CHANNEL_NAME) : null;
const STORAGE_GROUPS_KEY = 'crewmatchGroups';
const STORAGE_MESSAGES_KEY = 'crewmatchMessages';

let profile = null;
let currentRoom = 'community';
let groups = [];
let messages = {}; // { roomId: [msg,...] }

// Utilities
function id() { return 'r' + Math.random().toString(36).slice(2,9); }
function now() { return new Date().toISOString(); }

function loadProfileLocal() {
  const saved = localStorage.getItem('crewmatchProfile');
  if (!saved) return { fullName: 'Guest', email: 'guest@local', branch: '', skills: [] };
  try { return JSON.parse(saved); } catch (e) { return { fullName: 'Guest', email: 'guest@local' }; }
}

function loadGroups() {
  const raw = localStorage.getItem(STORAGE_GROUPS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch(e) { return []; }
}

function saveGroups() {
  localStorage.setItem(STORAGE_GROUPS_KEY, JSON.stringify(groups));
}

function loadMessages() {
  const raw = localStorage.getItem(STORAGE_MESSAGES_KEY);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch(e) { return {}; }
}

function saveMessages() {
  localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(messages));
}

// Initialization
function initGroupsUI() {
  profile = loadProfileLocal();
  groups = loadGroups();
  messages = loadMessages();

  // ensure default rooms exist
  if (!groups.some(g => g.id === 'community')) {
    groups.unshift({ id: 'community', name: 'Community', description: 'Announcements, events and open conversation — everyone', isPrivate: false, members: [], created_at: now() });
  }
  if (!groups.some(g => g.id === 'general')) {
    groups.unshift({ id: 'general', name: 'General (Matches)', description: 'Chat with your matched teammates and other community members', isPrivate: false, members: [], created_at: now() });
  }

  // persist default groups if none
  saveGroups();

  // wire buttons and inputs
  document.getElementById('newGroupBtn').addEventListener('click', () => openModal(true));
  document.getElementById('createGroupCancel').addEventListener('click', () => closeModal());
  document.getElementById('createGroupConfirm').addEventListener('click', createGroupFromModal);
  document.getElementById('sendMsg').addEventListener('click', sendMessageHandler);
  document.getElementById('messageInput').addEventListener('keypress', e => { if (e.key === 'Enter') sendMessageHandler(); });
  document.getElementById('groupSearch').addEventListener('input', handleSearch);
  document.getElementById('inviteBtn').addEventListener('click', inviteHandler);
  document.getElementById('leaveRoomBtn').addEventListener('click', leaveRoomHandler);

  // populate lists
  renderRoomLists();
  joinRoom('community');

  // BroadcastChannel to sync messages/groups across tabs
  if (bc) {
    bc.onmessage = (ev) => {
      const { type, payload } = ev.data || {};
      if (type === 'message') {
        if (!messages[payload.room]) messages[payload.room] = [];
        messages[payload.room].push(payload);
        saveMessages();
        if (payload.room === currentRoom) renderMessages(currentRoom, true);
      } else if (type === 'group-created') {
        groups.unshift(payload);
        saveGroups();
        renderRoomLists();
      }
    };
  }

  // storage events sync
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_MESSAGES_KEY) {
      messages = loadMessages();
      renderMessages(currentRoom);
    }
    if (e.key === STORAGE_GROUPS_KEY) {
      groups = loadGroups();
      renderRoomLists();
    }
    if (e.key === 'crewmatchProfile') {
      profile = loadProfileLocal();
      updateProfileBtn();
    }
  });

  // profile button on page
  updateProfileBtn();
}

function updateProfileBtn() {
  const btn = document.getElementById('profileBtn');
  if (!btn) return;
  btn.textContent = profile?.fullName || 'Profile';
  btn.onclick = () => { window.location.href = 'profile.html'; };
}

// Rooms / Groups rendering
function renderRoomLists(filter = '') {
  const roomList = document.getElementById('roomList');
  const privateList = document.getElementById('privateGroupsList');
  roomList.innerHTML = '';
  privateList.innerHTML = '';
  
  const normalized = filter.trim().toLowerCase();

  groups.forEach(g => {
    if (normalized && !g.name.toLowerCase().includes(normalized) && !(g.description||'').toLowerCase().includes(normalized)) return;
    const li = document.createElement('li');
    li.style.listStyle = 'none';
    li.style.cursor = 'pointer';
    li.innerHTML = `<div style="padding:0.7rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
      <div style='display:flex; flex-direction:column;'>
        <strong style='color:#fff;'>${g.name}</strong>
        <small style='color:#b0b0d0;'>${g.description || ''}</small>
      </div>
      <div style='text-align:right;'>${g.isPrivate ? '<small style="color:#8a2be2;">Private</small>' : '<small style="color:#59d4ff;">Public</small>'}
      </div>
    </div>`;
    li.addEventListener('click', () => joinRoom(g.id));

    if (g.isPrivate) privateList.appendChild(li); else roomList.appendChild(li);
  });
}

// messages rendering
function renderMessages(roomId, skipScroll=false) {
  const container = document.getElementById('messagesContainer');
  container.innerHTML = '';
  const arr = messages[roomId] || [];
  arr.forEach(m => {
    const el = document.createElement('div');
    el.style.padding = '10px';
    el.style.borderRadius = '10px';
    el.style.maxWidth = '80%';
    el.style.display = 'inline-block';
    el.style.wordBreak = 'break-word';
    el.dataset.id = m.id;

    const isMe = (m.senderEmail === profile.email);
    if (isMe) {
      el.style.marginLeft = 'auto';
      el.style.background = 'linear-gradient(135deg, rgba(0,191,255,0.16), rgba(138,43,226,0.12))';
    } else {
      el.style.marginRight = 'auto';
      el.style.background = 'rgba(255,255,255,0.02)';
    }

    el.innerHTML = `<div style="font-weight:700; font-size:0.92rem; color: #fff;">${m.senderName}</div>
                    <div style="margin-top:6px; color:#d9d9ea;">${escapeHtml(m.text)}</div>
                    <div style="font-size:11px; color:#9aa0c3; margin-top:6px; text-align:${isMe ? 'right' : 'left'};">${formatTime(m.ts)}</div>`;

    container.appendChild(el);
  });

  if (!skipScroll) container.scrollTop = container.scrollHeight + 200;
}

// Join room
function joinRoom(roomId) {
  currentRoom = roomId;
  const room = groups.find(r => r.id === roomId) || { id: 'community', name: 'Community', description: '' };
  document.getElementById('roomTitle').textContent = room.name;
  document.getElementById('roomSubtitle').textContent = room.description || '';

  // if private group and profile email not member, show notice
  if (room.isPrivate && !(room.members || []).includes(profile.email)) {
    showInfo('You are not a member of this private group. You can request to join or the creator can invite you.');
  }

  renderMessages(currentRoom);
}

// create group modal
function openModal(show=true) { document.getElementById('newGroupModal').style.display = show ? 'flex' : 'none'; }
function closeModal() { document.getElementById('newGroupModal').style.display = 'none'; document.getElementById('newGroupName').value = ''; document.getElementById('newGroupMembers').value = ''; }

function createGroupFromModal() {
  const name = document.getElementById('newGroupName').value.trim();
  const membersRaw = document.getElementById('newGroupMembers').value.trim();
  if (!name) { showError('Please enter group name'); return; }

  const members = membersRaw ? membersRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  // ensure creator is added
  if (!members.includes(profile.email)) members.push(profile.email);

  const groupObj = { id: 'group-' + Date.now(), name, description: `${members.length} members`, isPrivate: true, members, created_at: now() };
  groups.unshift(groupObj);
  saveGroups();

  if (!messages[groupObj.id]) messages[groupObj.id] = [];
  saveMessages();

  // broadcast creation
  if (bc) bc.postMessage({ type: 'group-created', payload: groupObj });

  showSuccess('Private group created — you were added as a member');
  closeModal();
  renderRoomLists();
  joinRoom(groupObj.id);
}

// Send message
function sendMessageHandler() {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (!text) return;

  const msg = { id: id(), room: currentRoom, senderName: profile.fullName || 'Guest', senderEmail: profile.email || 'guest@local', text, ts: now() };

  if (!messages[currentRoom]) messages[currentRoom] = [];
  messages[currentRoom].push(msg);
  saveMessages();

  // broadcast
  if (bc) bc.postMessage({ type: 'message', payload: msg });

  renderMessages(currentRoom);
  input.value = '';
}

function inviteHandler() {
  const room = groups.find(g => g.id === currentRoom);
  if (!room) return showInfo('Select a room to invite people.');
  // Provide an invite link (pseudo)
  const url = `${location.origin}${location.pathname}?invite=${room.id}`;
  navigator.clipboard?.writeText(url).then(() => {
    showSuccess('Invite link copied to clipboard — share it with teammates');
  }).catch(() => {
    showInfo('Invite link ready: ' + url);
  });
}

function leaveRoomHandler() {
  const room = groups.find(g => g.id === currentRoom);
  if (!room) return;
  if (!room.isPrivate) { showInfo('You cannot leave community or general rooms.'); return; }

  // remove user from members and update
  room.members = (room.members || []).filter(m => m !== profile.email);
  saveGroups();
  showSuccess('You left the group — it will remain for other members.');
  renderRoomLists();
  joinRoom('community');
}

// helpers
function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function formatTime(ts) { const d = new Date(ts); return d.toLocaleString(); }

function handleSearch(e) {
  const text = e.target.value || '';
  renderRoomLists(text);
}

// navigation
function goHome() { window.location.href = 'index.html'; }

// initial boot
window.addEventListener('DOMContentLoaded', () => initGroupsUI());

// Accept invite from URL: ?invite=group-id — if present, automatically join if member and open
window.addEventListener('load', () => {
  const p = new URLSearchParams(window.location.search);
  if (p.has('invite')) {
    const gid = p.get('invite');
    const g = groups.find(x => x.id === gid);
    if (g) {
      if (!g.members.includes(profile.email)) {
        showInfo('Invite received, but you are not currently a member. Ask creator to add you.');
      } else {
        joinRoom(gid);
        showSuccess('Joined group from invite — welcome!');
      }
    } else {
      showInfo('Invite link invalid or group not found.');
    }
  }
});