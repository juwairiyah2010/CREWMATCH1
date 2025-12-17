# CrewMatch API Documentation

## Base URL
`http://localhost:3000/api`

## Authentication
All endpoints require either:
- User email in query parameter: `?email=user@example.com`
- Or bearer token (when implemented)

---

## Endpoints

### Profile Management

#### GET /profile
Get user profile by email
```
GET /api/profile?email=user@example.com
Response: { id, email, fullName, branch, skills, traits, goal, bio, created_at, updated_at }
```

#### POST /profile
Create or update user profile
```
POST /api/profile
Body: {
  email: "user@example.com",
  fullName: "John Doe",
  branch: "cse",
  skills: ["coding", "design"],
  traits: { trait1: "extrovert", trait2: "analytical" },
  goal: "hackathon",
  bio: "Passionate developer"
}
Response: { ok: true, affected: 1 }
```

#### GET /matches
Get compatible teammates based on profile
```
GET /api/matches?email=user@example.com
Response: { 
  matches: [
    { id, name, branch, skills, traits, goal, bio, compatibility: 85 }
  ]
}
```

---

### Google Calendar Integration

#### POST /google/auth
Store Google authentication tokens
```
POST /api/google/auth
Body: {
  email: "user@example.com",
  accessToken: "google_access_token",
  refreshToken: "google_refresh_token"
}
Response: { ok: true }
```

#### GET /google/token
Retrieve user's stored Google access token
```
GET /api/google/token?email=user@example.com
Response: { accessToken: "google_access_token" }
```

---

### Events Management

#### POST /events/sync
Fetch and sync events from Google Calendar
```
POST /api/events/sync
Body: {
  email: "user@example.com",
  accessToken: "google_access_token"
}
Response: { ok: true, synced: 5 }
```

#### GET /events
Get all synced events for user
```
GET /api/events?email=user@example.com
Response: {
  events: [
    {
      id,
      email,
      google_event_id,
      title,
      description,
      start_time,
      end_time,
      location,
      attendees_count,
      html_link,
      meeting_url,
      creator,
      is_all_day,
      created_at,
      updated_at
    }
  ]
}
```

#### GET /events/:eventId
Get specific event details
```
GET /api/events/123?email=user@example.com
Response: { id, title, description, start_time, end_time, ... }
```

#### GET /events/:eventId/teammates
Find teammates attending the same event
```
GET /api/events/123/teammates?email=user@example.com
Response: {
  teammates: [
    { id, email, fullName, branch, skills, traits, goal, bio }
  ]
}
```

---

### Event Invitations

#### POST /events/invite
Invite a teammate to an event
```
POST /api/events/invite
Body: {
  eventId: 123,
  inviterEmail: "user1@example.com",
  inviteeEmail: "user2@example.com"
}
Response: { ok: true }
```

#### GET /invitations
Get all invitations for a user
```
GET /api/invitations?email=user@example.com
Response: {
  invitations: [
    {
      id,
      event_id,
      inviter_email,
      invitee_email,
      status,
      title,
      start_time,
      location,
      fullName,
      branch,
      skills,
      created_at
    }
  ]
}
```

#### POST /invitations/:invitationId/respond
Accept or decline an invitation
```
POST /api/invitations/456/respond
Body: { status: "accepted" }  // or "declined"
Response: { ok: true }
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (missing parameters)
- `404` - Not Found (profile, event, etc.)
- `500` - Server Error

---

## Setup

### 1. Install Dependencies
```bash
cd crewmatch/server
npm install
```

### 2. Create .env file
```
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=your_password
DB_NAME=crewmatch
PORT=3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Initialize Database
```bash
mysql -u root -p < ../db/schema.sql
```

### 4. Start Server
```bash
npm start
```

---

## Frontend Integration

### Example: Sync Google Events
```javascript
const email = 'user@example.com';
const accessToken = 'google_access_token';

const response = await fetch('http://localhost:3000/api/events/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, accessToken })
});

const data = await response.json();
console.log(`Synced ${data.synced} events`);
```

### Example: Get User's Events
```javascript
const response = await fetch(`http://localhost:3000/api/events?email=${email}`);
const data = await response.json();
console.log(data.events);
```

### Example: Find Teammates for Event
```javascript
const response = await fetch(
  `http://localhost:3000/api/events/${eventId}/teammates?email=${email}`
);
const data = await response.json();
console.log(data.teammates);
```

### Example: Invite Teammate
```javascript
const response = await fetch('http://localhost:3000/api/events/invite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventId: 123,
    inviterEmail: 'user1@example.com',
    inviteeEmail: 'user2@example.com'
  })
});
const data = await response.json();
```

---

## Database Schema

### profiles
- Stores user profile information and Google tokens
- Primary key: email
- Tracks skills, traits, and goals

### events
- Stores synced Google Calendar events
- Links to profiles via email
- Unique constraint on (email, google_event_id)

### event_invitations
- Stores team invitations for events
- Status: pending, accepted, declined
- Links inviter and invitee profiles

---

## Testing API Endpoints

Use cURL or Postman to test:

```bash
# Create profile
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","fullName":"Test User","branch":"cse","skills":["coding"],"goal":"hackathon"}'

# Get profile
curl http://localhost:3000/api/profile?email=test@example.com

# Sync events
curl -X POST http://localhost:3000/api/events/sync \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","accessToken":"google_token"}'

# Get events
curl http://localhost:3000/api/events?email=test@example.com
```
