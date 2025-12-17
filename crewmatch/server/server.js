require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

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

  // create table if not exists
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

// health
app.get('/health', (req, res) => res.json({ ok: true }));

initDb().then(() => {
  app.listen(PORT, () => console.log(`CrewMatch API listening on ${PORT}`));
}).catch(err => {
  console.error('Could not start server', err);
  process.exit(1);
});
