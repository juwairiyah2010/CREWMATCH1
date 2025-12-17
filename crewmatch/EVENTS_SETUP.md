# Upcoming Events - Google Calendar Integration Setup

## 📋 Overview
The new Upcoming Events page allows users to connect their Google Calendar and view all upcoming events. Team members can then find teammates attending the same events and collaborate.

## 📁 Files Created
- `events.html` - Main page for viewing upcoming events
- `events.css` - Styling for the events page
- `events.js` - JavaScript logic for Google Calendar API integration

## 🔧 Setup Instructions

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click on the project dropdown and select "New Project"
3. Give it a name like "CrewMatch Events" and click Create
4. Wait for the project to be created

### Step 2: Enable Google Calendar API
1. In the left sidebar, go to **APIs & Services** > **Library**
2. Search for "Google Calendar API"
3. Click on it and press **Enable**

### Step 3: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**
3. You may need to create a consent screen first:
   - Click **Create OAuth consent screen**
   - Choose **External** for User Type
   - Fill in the required fields (App name, User support email, Developer contact)
   - Click Save and Continue
   - Skip optional scopes, click Save and Continue
   - Review and click Create
4. After consent screen is created, go back to **Credentials**
5. Click **Create Credentials** > **OAuth 2.0 Client ID**
6. Select **Web application**
7. Under "Authorized redirect URIs", add:
   - `http://localhost:3000`
   - `http://localhost:5500` (if using Live Server)
   - Your production domain when deployed
8. Click Create

### Step 4: Add Credentials to Your Project
1. Copy your **Client ID** from the Google Cloud Console
2. Open `events.js` in your editor
3. Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID (line ~5)
4. Go back to Google Cloud Console and copy your **API Key**
5. Replace `YOUR_GOOGLE_API_KEY` with your actual API Key (line ~6)

### Step 5: Update Navigation
The events link has been added to the main navigation menu in `index.html` with a button that routes to `events.html`.

## 🎯 Features

### For Users
- **Connect Google Calendar**: One-click authentication with Google
- **View All Events**: See all upcoming events for the next 30 days
- **Filter Events**: Filter by Today, This Week, or This Month
- **Search Events**: Search events by title, description, or location
- **Event Details**: View full event details including:
  - Date and time
  - Location
  - Number of attendees
  - Description
  - Meeting links (if available)
  - Organizer information
- **Invite Teammates**: Find and invite team members attending the same events
- **Open in Google Calendar**: Direct link to edit events

### For Developers
- Clean, modular code structure
- Error handling for API failures
- Toast notifications for user feedback
- Responsive design for mobile devices
- Secure credential handling

## 🔐 Security Best Practices

1. **Never commit credentials to version control**
   - Keep API keys in environment variables
   - Create a `.env` file:
     ```
     GOOGLE_CLIENT_ID=your_client_id
     GOOGLE_API_KEY=your_api_key
     ```

2. **Use environment-based configuration**
   - Load credentials from environment on server startup
   - Serve credentials through a backend API endpoint

3. **Restrict API Key usage**
   - In Google Cloud Console, restrict your API key to:
     - Only Google Calendar API
     - Only HTTP referrers (your domain)
     - Only specific IPs if applicable

## 📱 API Endpoints Used
- `calendar.events.list` - Fetch upcoming events
- `calendar.events.get` - Fetch individual event details

## 🎨 Customization

### Change the number of days to look ahead
In `events.js`, line ~120:
```javascript
const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Change 30 to desired days
```

### Modify filter options
Edit the `filter-section` in `events.html` to add/remove filter options

### Change styling
All CSS is in `events.css` - customize colors, sizes, and layouts there

## 🐛 Troubleshooting

### "Failed to initialize Google API"
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_API_KEY` are correctly set
- Ensure Google Calendar API is enabled in Google Cloud Console
- Check browser console for detailed error messages

### "Request had insufficient authentication scopes"
- Make sure `SCOPES` is set to `'https://www.googleapis.com/auth/calendar.readonly'`
- Re-authenticate after changing scopes

### "No events showing up"
- Check that you have upcoming events in your Google Calendar
- Verify the date range in the `loadCalendarEvents()` function
- Check browser console for API errors

### Events not filtering correctly
- Clear browser cache and reload the page
- Check that event dates are within the 30-day window

## 🚀 Deployment

When deploying to production:

1. Update your Google Cloud credentials with production domain
2. Move API credentials to environment variables
3. Create a backend endpoint to securely provide credentials to frontend
4. Update `GOOGLE_CLIENT_ID` and `GOOGLE_API_KEY` references to pull from environment

## 📚 Resources
- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google API Client Library for JavaScript](https://github.com/googleapis/google-api-javascript-client)

## 🔄 Future Enhancements
- [ ] Add ability to sync events to database
- [ ] Show team members attending the same event
- [ ] Create event-based teams automatically
- [ ] Send notifications for events with matching teammates
- [ ] Calendar view with drag-and-drop team invitations
- [ ] Event RSVP functionality
- [ ] Recurring event support
