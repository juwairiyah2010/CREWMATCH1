# CrewMatch - Complete Setup & Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MySQL (v5.7+)
- Google Cloud Project with Calendar API enabled
- Google OAuth 2.0 credentials

---

## 📦 Installation

### 1. Clone & Setup
```bash
cd crewmatch
npm install
cd server
npm install
cd ..
```

### 2. Database Setup

#### Option A: MySQL CLI
```bash
mysql -u root -p < db/schema.sql
```

#### Option B: MySQL Workbench
- Open db/schema.sql
- Execute it in your MySQL Workbench

### 3. Environment Configuration

Create `.env` file in `crewmatch/server/`:
```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=crewmatch

# Google Calendar API
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_API_KEY=your_api_key
```

### 4. Google API Setup

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project named "CrewMatch"
3. Enable Google Calendar API
4. Create OAuth 2.0 Client ID (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:5500`
   - `http://localhost:3000`
   - Your production domain

#### Step 2: Get Credentials
- Copy Client ID and Client Secret to `.env`
- Create API Key and add to `.env`

### 5. Start Development Server

#### Terminal 1 - Backend
```bash
cd crewmatch/server
npm start
# Server running on http://localhost:3000
```

#### Terminal 2 - Frontend
```bash
cd crewmatch
python -m http.server 5500
# or use VS Code Live Server
# Frontend running on http://localhost:5500
```

### 6. Update Frontend Config

In `crewmatch/script.js`, ensure:
```javascript
const GOOGLE_CLIENT_ID = 'your_client_id.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'your_api_key';
```

---

## 📱 Frontend Structure

### Pages
- **index.html** - Home page with events showcase
- **matching.html** - AI team matching algorithm
- **profile.html** - User profile creation/editing
- **groups.html** - Group management and chat
- **events.html** - Full event calendar view

### Key Files
- `script.js` - Home page logic & Google Calendar integration
- `matching.js` - Matching algorithm
- `profile.js` - Profile management
- `groups.js` - Groups and messaging
- `events.js` - Events page
- `api-client.js` - Centralized API client
- `style.css` - Global styles
- `matching.css` - Matching page styles
- `events.css` - Events page styles

---

## 🔧 Backend API

### Base URL
`http://localhost:3000/api`

### Core Endpoints

#### Profiles
```
GET  /api/profile?email=user@example.com
POST /api/profile
GET  /api/matches?email=user@example.com
```

#### Events
```
POST /api/events/sync
GET  /api/events?email=user@example.com
GET  /api/events/:id?email=user@example.com
GET  /api/events/:id/teammates?email=user@example.com
POST /api/events/invite
```

#### Groups
```
POST   /api/groups
GET    /api/groups?email=user@example.com
GET    /api/groups/:groupId
POST   /api/groups/:groupId/members
DELETE /api/groups/:groupId/members/:email
```

#### Messaging
```
POST /api/groups/:groupId/messages
GET  /api/groups/:groupId/messages
```

#### Connections
```
POST /api/connections
GET  /api/connections?email=user@example.com
POST /api/connections/respond
```

---

## 🗄️ Database Schema

### Tables
1. **profiles** - User profile information
2. **events** - Synced Google Calendar events
3. **event_invitations** - Team invitations to events
4. **groups** - Team group chats
5. **group_members** - Group membership
6. **messages** - Group messages
7. **connections** - User connections/friend requests

See [db/schema.sql](db/schema.sql) for full schema.

---

## 🔐 Security Checklist

- [ ] Google API keys restricted to Calendar API only
- [ ] Database credentials in .env (not committed)
- [ ] CORS properly configured for production domain
- [ ] HTTPS enabled in production
- [ ] SQL injection prevention (using parameterized queries)
- [ ] API rate limiting implemented
- [ ] User input validation on backend
- [ ] Secure session management

---

## 🧪 Testing

### Test User Accounts
Create test profiles with different skills:
```json
{
  "email": "dev1@test.com",
  "fullName": "Developer One",
  "branch": "cse",
  "skills": ["coding", "leadership"],
  "traits": {"trait1": "extrovert", "trait2": "analytical"},
  "goal": "hackathon",
  "bio": "Passionate coder"
}
```

### API Testing with cURL
```bash
# Create profile
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","fullName":"Test","branch":"cse","skills":["coding"],"goal":"hackathon"}'

# Get profile
curl http://localhost:3000/api/profile?email=test@example.com

# Get matches
curl http://localhost:3000/api/matches?email=test@example.com
```

---

## 📊 Features Overview

### ✅ Implemented
- User profiles with skills & traits
- AI-powered team matching algorithm
- Google Calendar integration (read-only)
- Event synchronization to database
- Team invitations for events
- Group chat and messaging
- Connection requests (friend system)
- Responsive design for mobile

### 🔄 Coming Soon
- Video chat for team calls
- Event creation within app
- Advanced filtering & search
- Team analytics & stats
- Notifications & reminders
- Payment integration
- Mobile app (React Native)

---

## 🚀 Production Deployment

### Heroku Deployment
```bash
# Login to Heroku
heroku login

# Create app
heroku create crewmatch-app

# Set environment variables
heroku config:set DB_HOST=your_db_host
heroku config:set DB_USER=your_db_user
heroku config:set GOOGLE_CLIENT_ID=your_id

# Push code
git push heroku main

# View logs
heroku logs --tail
```

### AWS Deployment
1. EC2 instance (t2.micro)
2. RDS MySQL database
3. Elastic IP for static IP
4. CloudFront for CDN
5. Certificate Manager for HTTPS

### Docker Deployment
```bash
# Build images
docker-compose build

# Start containers
docker-compose up -d

# Access app
# Frontend: http://localhost:80
# API: http://localhost:3000
```

---

## 📝 API Documentation

See [server/API_DOCS.md](server/API_DOCS.md) for comprehensive API documentation with examples.

---

## 🐛 Troubleshooting

### Google Calendar not loading
- Check API keys in console
- Verify CORS settings
- Check browser console for errors
- Ensure Google OAuth consent screen is configured

### Database connection failed
- Check MySQL is running: `mysql -u root -p`
- Verify .env credentials
- Check database exists: `mysql -u root -p crewmatch`

### Port already in use
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### CORS errors
- Ensure backend CORS is enabled
- Check API_BASE URL in frontend
- Verify credentials in API calls

---

## 📚 Resources

- [Google Calendar API Docs](https://developers.google.com/calendar)
- [Express.js Docs](https://expressjs.com/)
- [MySQL Docs](https://dev.mysql.com/doc/)
- [CrewMatch GitHub](https://github.com/juwairiyah2010/CREWMATCH1)

---

## 👥 Support

For issues or questions:
1. Check API logs: `npm run dev` (with nodemon)
2. Check browser console (F12)
3. Review API response in Network tab
4. Check database with: `mysql -u root -p crewmatch`

---

## 📄 License

CrewMatch © 2025. Built for students, by students.

---

## 🎯 Next Steps

1. ✅ Complete setup following this guide
2. ✅ Test all API endpoints
3. ✅ Verify Google Calendar integration
4. ✅ Create test user accounts
5. ✅ Test matching algorithm
6. ✅ Deploy to production
7. ✅ Monitor and optimize performance
