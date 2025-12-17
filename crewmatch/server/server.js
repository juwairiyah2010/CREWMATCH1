require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

let pool;
async function initDb() {
  pool = await mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'crewmatch',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // create tables if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      fullName VARCHAR(255) NOT NULL,
      branch VARCHAR(100),
      skills JSON,
      traits JSON,
      goal VARCHAR(100),
      bio TEXT,
      google_access_token TEXT,
      google_refresh_token TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      google_event_id VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      start_time DATETIME,
      end_time DATETIME,
      location VARCHAR(255),
      attendees_count INT,
      html_link TEXT,
      meeting_url TEXT,
      creator VARCHAR(255),
      is_all_day BOOLEAN,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_event (email, google_event_id),
      FOREIGN KEY (email) REFERENCES profiles(email) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_invitations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id INT NOT NULL,
      inviter_email VARCHAR(255) NOT NULL,
      invitee_email VARCHAR(255) NOT NULL,
      status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (inviter_email) REFERENCES profiles(email) ON DELETE CASCADE,
      FOREIGN KEY (invitee_email) REFERENCES profiles(email) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

// Helper: normalize profile object for DB
function toDbProfile(obj) {
  return {
    fullName: obj.fullName || '',
    email: obj.email || '',
    branch: obj.branch || '',
    skills: JSON.stringify(obj.skills || []),
    traits: JSON.stringify(obj.traits || {}),
    goal: obj.goal || '',
    bio: obj.bio || ''
  };
}

// GET profile by email
app.get('/api/profile', async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: 'email required' });
  try {
    const [rows] = await pool.query('SELECT * FROM profiles WHERE email = ?', [email]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const profile = rows[0];
    profile.skills = JSON.parse(profile.skills || '[]');
    profile.traits = JSON.parse(profile.traits || '{}');
    res.json(profile);
  } catch (err) {
    console.error('db error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// POST create or update profile
app.post('/api/profile', async (req, res) => {
  const p = req.body;
  if (!p || !p.email || !p.fullName) {
    return res.status(400).json({ error: 'email and fullName required' });
  }
  const dbProfile = toDbProfile(p);

  try {
    // upsert
    const [result] = await pool.query(
      `INSERT INTO profiles (email, fullName, branch, skills, traits, goal, bio)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE fullName=VALUES(fullName), branch=VALUES(branch), skills=VALUES(skills), traits=VALUES(traits), goal=VALUES(goal), bio=VALUES(bio)`,
      [dbProfile.email, dbProfile.fullName, dbProfile.branch, dbProfile.skills, dbProfile.traits, dbProfile.goal, dbProfile.bio]
    );

    res.json({ ok: true, affected: result.affectedRows });
  } catch (err) {
    console.error('save error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Simple matches endpoint — for demo it uses local in-memory candidates
// In a real app you'd query DB and/or use smarter matching
app.get('/api/matches', async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: 'email required' });
  try {
    const profileRows = await pool.query('SELECT * FROM profiles WHERE email=?', [email]);
    const rows = profileRows[0] || [];
    if (rows.length === 0) return res.status(404).json({ error: 'profile not found' });
    const me = rows[0];
    me.skills = JSON.parse(me.skills || '[]');
    me.traits = JSON.parse(me.traits || '{}');

    // fetch some other profiles (limit 10)
    const [others] = await pool.query('SELECT * FROM profiles WHERE email <> ? LIMIT 10', [email]);
    // parse json columns
    const candidates = others.map(o => ({
      id: o.id,
      name: o.fullName,
      branch: o.branch,
      skills: JSON.parse(o.skills || '[]'),
      traits: JSON.parse(o.traits || '{}'),
      goal: o.goal,
      bio: o.bio
    }));

    // quick compatibility function
    function calcScore(a, b) {
      let score = 0;
      const common = a.skills.filter(s => b.skills.includes(s)).length;
      score += Math.round((common / Math.max(a.skills.length || 1, b.skills.length || 1)) * 50);
      if (a.goal && a.goal === b.goal) score += 30;
      let traitsMatch = 0;
      for (let i = 1; i <= 4; i++) if ((a.traits && a.traits[`trait${i}`]) && a.traits[`trait${i}`] === (b.traits && b.traits[`trait${i}`])) traitsMatch++;
      score += Math.round((traitsMatch/4) * 20);
      return score;
    }

    const matches = candidates.map(c => ({ ...c, compatibility: calcScore(me, c) })).sort((x, y) => y.compatibility - x.compatibility);
    res.json({ matches });
  } catch (err) {
    console.error('matching error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// ===== GOOGLE CALENDAR ENDPOINTS =====

// Store Google tokens for user
app.post('/api/google/auth', async (req, res) => {
  const { email, accessToken, refreshToken } = req.body;
  if (!email || !accessToken) {
    return res.status(400).json({ error: 'email and accessToken required' });
  }
  try {
    await pool.query(
      'UPDATE profiles SET google_access_token = ?, google_refresh_token = ? WHERE email = ?',
      [accessToken, refreshToken || null, email]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('google auth error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Get user's Google access token
app.get('/api/google/token', async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: 'email required' });
  try {
    const [rows] = await pool.query('SELECT google_access_token FROM profiles WHERE email = ?', [email]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'profile not found' });
    res.json({ accessToken: rows[0].google_access_token });
  } catch (err) {
    console.error('token fetch error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Fetch and sync events from Google Calendar
app.post('/api/events/sync', async (req, res) => {
  const { email, accessToken } = req.body;
  if (!email || !accessToken) {
    return res.status(400).json({ error: 'email and accessToken required' });
  }
  try {
    // Fetch events from Google Calendar API
    const response = await axios.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        timeMin: new Date().toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime'
      }
    });

    const googleEvents = response.data.items || [];

    // Store events in database
    for (const event of googleEvents) {
      const startTime = event.start.dateTime || event.start.date;
      const endTime = event.end.dateTime || event.end.date;
      
      await pool.query(
        `INSERT INTO events (email, google_event_id, title, description, start_time, end_time, location, attendees_count, html_link, meeting_url, creator, is_all_day)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), start_time=VALUES(start_time), end_time=VALUES(end_time), location=VALUES(location), attendees_count=VALUES(attendees_count), updated_at=CURRENT_TIMESTAMP`,
        [
          email,
          event.id,
          event.summary || 'Untitled Event',
          event.description || null,
          startTime,
          endTime,
          event.location || null,
          event.attendees ? event.attendees.length : 0,
          event.htmlLink || null,
          event.conferenceData?.entryPoints?.[0]?.uri || null,
          event.creator?.displayName || event.creator?.email || null,
          !event.start.dateTime ? 1 : 0
        ]
      );
    }

    res.json({ ok: true, synced: googleEvents.length });
  } catch (err) {
    console.error('sync error', err);
    res.status(500).json({ error: 'failed to sync events' });
  }
});

// Get user's synced events
app.get('/api/events', async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: 'email required' });
  try {
    const [events] = await pool.query(
      'SELECT * FROM events WHERE email = ? ORDER BY start_time ASC',
      [email]
    );
    res.json({ events });
  } catch (err) {
    console.error('fetch events error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Get single event by ID
app.get('/api/events/:eventId', async (req, res) => {
  const { eventId } = req.params;
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: 'email required' });
  try {
    const [rows] = await pool.query(
      'SELECT * FROM events WHERE id = ? AND email = ?',
      [eventId, email]
    );
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'event not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('fetch event error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Find teammates for an event
app.get('/api/events/:eventId/teammates', async (req, res) => {
  const { eventId } = req.params;
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: 'email required' });
  try {
    // Get the event
    const [eventRows] = await pool.query(
      'SELECT * FROM events WHERE id = ? AND email = ?',
      [eventId, email]
    );
    if (!eventRows || eventRows.length === 0) return res.status(404).json({ error: 'event not found' });
    const event = eventRows[0];

    // Find other users who have the same event
    const [teammates] = await pool.query(
      `SELECT DISTINCT p.* FROM profiles p
       INNER JOIN events e ON p.email = e.email
       WHERE e.google_event_id = ? AND p.email <> ?`,
      [event.google_event_id, email]
    );

    const parsed = teammates.map(t => ({
      ...t,
      skills: JSON.parse(t.skills || '[]'),
      traits: JSON.parse(t.traits || '{}')
    }));

    res.json({ teammates: parsed });
  } catch (err) {
    console.error('teammates error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Invite teammate to event
app.post('/api/events/invite', async (req, res) => {
  const { eventId, inviterEmail, inviteeEmail } = req.body;
  if (!eventId || !inviterEmail || !inviteeEmail) {
    return res.status(400).json({ error: 'all fields required' });
  }
  try {
    await pool.query(
      `INSERT INTO event_invitations (event_id, inviter_email, invitee_email, status)
       VALUES (?, ?, ?, 'pending')`,
      [eventId, inviterEmail, inviteeEmail]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('invite error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Get invitations for user
app.get('/api/invitations', async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: 'email required' });
  try {
    const [invitations] = await pool.query(
      `SELECT inv.*, e.title, e.start_time, e.location, p.fullName, p.branch, p.skills
       FROM event_invitations inv
       JOIN events e ON inv.event_id = e.id
       JOIN profiles p ON inv.inviter_email = p.email
       WHERE inv.invitee_email = ?
       ORDER BY inv.created_at DESC`,
      [email]
    );

    const parsed = invitations.map(inv => ({
      ...inv,
      skills: JSON.parse(inv.skills || '[]')
    }));

    res.json({ invitations: parsed });
  } catch (err) {
    console.error('fetch invitations error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Respond to invitation
app.post('/api/invitations/:invitationId/respond', async (req, res) => {
  const { invitationId } = req.params;
  const { status } = req.body;
  if (!['accepted', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'invalid status' });
  }
  try {
    await pool.query(
      'UPDATE event_invitations SET status = ? WHERE id = ?',
      [status, invitationId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('update invitation error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => res.json({ ok: true }));

initDb().then(() => {
  app.listen(PORT, () => console.log(`CrewMatch API listening on ${PORT}`));
}).catch(err => {
  console.error('Could not start server', err);
  process.exit(1);
});
