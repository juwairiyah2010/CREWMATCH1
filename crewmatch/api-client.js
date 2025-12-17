// ===== CREWMATCH API CLIENT =====
// Centralized API communication for all frontend components

const API_BASE = window.API_BASE || 'http://localhost:3000/api';

class CrewMatchAPI {
  constructor() {
    this.baseURL = API_BASE;
  }

  // ===== PROFILE METHODS =====
  
  async getProfile(email) {
    try {
      const response = await fetch(`${this.baseURL}/profile?email=${email}`);
      return await response.json();
    } catch (err) {
      console.error('Get profile error:', err);
      return null;
    }
  }

  async createOrUpdateProfile(profileData) {
    try {
      const response = await fetch(`${this.baseURL}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      return await response.json();
    } catch (err) {
      console.error('Save profile error:', err);
      return null;
    }
  }

  async getMatches(email) {
    try {
      const response = await fetch(`${this.baseURL}/matches?email=${email}`);
      return await response.json();
    } catch (err) {
      console.error('Get matches error:', err);
      return { matches: [] };
    }
  }

  // ===== EVENTS METHODS =====

  async storeGoogleAuth(email, accessToken, refreshToken) {
    try {
      const response = await fetch(`${this.baseURL}/google/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, accessToken, refreshToken })
      });
      return await response.json();
    } catch (err) {
      console.error('Store Google auth error:', err);
      return null;
    }
  }

  async syncEvents(email, accessToken) {
    try {
      const response = await fetch(`${this.baseURL}/events/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, accessToken })
      });
      return await response.json();
    } catch (err) {
      console.error('Sync events error:', err);
      return null;
    }
  }

  async getEvents(email) {
    try {
      const response = await fetch(`${this.baseURL}/events?email=${email}`);
      return await response.json();
    } catch (err) {
      console.error('Get events error:', err);
      return { events: [] };
    }
  }

  async getEvent(eventId, email) {
    try {
      const response = await fetch(`${this.baseURL}/events/${eventId}?email=${email}`);
      return await response.json();
    } catch (err) {
      console.error('Get event error:', err);
      return null;
    }
  }

  async getEventTeammates(eventId, email) {
    try {
      const response = await fetch(`${this.baseURL}/events/${eventId}/teammates?email=${email}`);
      return await response.json();
    } catch (err) {
      console.error('Get teammates error:', err);
      return { teammates: [] };
    }
  }

  async inviteTeammate(eventId, inviterEmail, inviteeEmail) {
    try {
      const response = await fetch(`${this.baseURL}/events/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, inviterEmail, inviteeEmail })
      });
      return await response.json();
    } catch (err) {
      console.error('Invite teammate error:', err);
      return null;
    }
  }

  async getInvitations(email) {
    try {
      const response = await fetch(`${this.baseURL}/invitations?email=${email}`);
      return await response.json();
    } catch (err) {
      console.error('Get invitations error:', err);
      return { invitations: [] };
    }
  }

  async respondToInvitation(invitationId, status) {
    try {
      const response = await fetch(`${this.baseURL}/invitations/${invitationId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return await response.json();
    } catch (err) {
      console.error('Respond to invitation error:', err);
      return null;
    }
  }

  // ===== GROUPS METHODS =====

  async createGroup(name, description, creatorEmail) {
    try {
      const response = await fetch(`${this.baseURL}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, creatorEmail })
      });
      return await response.json();
    } catch (err) {
      console.error('Create group error:', err);
      return null;
    }
  }

  async getGroups(email) {
    try {
      const response = await fetch(`${this.baseURL}/groups?email=${email}`);
      return await response.json();
    } catch (err) {
      console.error('Get groups error:', err);
      return { groups: [] };
    }
  }

  async getGroup(groupId) {
    try {
      const response = await fetch(`${this.baseURL}/groups/${groupId}`);
      return await response.json();
    } catch (err) {
      console.error('Get group error:', err);
      return null;
    }
  }

  async addGroupMember(groupId, email) {
    try {
      const response = await fetch(`${this.baseURL}/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return await response.json();
    } catch (err) {
      console.error('Add member error:', err);
      return null;
    }
  }

  async removeGroupMember(groupId, email) {
    try {
      const response = await fetch(`${this.baseURL}/groups/${groupId}/members/${email}`, {
        method: 'DELETE'
      });
      return await response.json();
    } catch (err) {
      console.error('Remove member error:', err);
      return null;
    }
  }

  // ===== MESSAGING METHODS =====

  async sendMessage(groupId, email, content) {
    try {
      const response = await fetch(`${this.baseURL}/groups/${groupId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, content })
      });
      return await response.json();
    } catch (err) {
      console.error('Send message error:', err);
      return null;
    }
  }

  async getGroupMessages(groupId, limit = 50) {
    try {
      const response = await fetch(`${this.baseURL}/groups/${groupId}/messages?limit=${limit}`);
      return await response.json();
    } catch (err) {
      console.error('Get messages error:', err);
      return { messages: [] };
    }
  }

  // ===== CONNECTION METHODS =====

  async sendConnection(user1Email, user2Email) {
    try {
      const response = await fetch(`${this.baseURL}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user1Email, user2Email })
      });
      return await response.json();
    } catch (err) {
      console.error('Send connection error:', err);
      return null;
    }
  }

  async getConnections(email) {
    try {
      const response = await fetch(`${this.baseURL}/connections?email=${email}`);
      return await response.json();
    } catch (err) {
      console.error('Get connections error:', err);
      return { connections: [] };
    }
  }

  async respondToConnection(user1Email, user2Email, status) {
    try {
      const response = await fetch(`${this.baseURL}/connections/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user1Email, user2Email, status })
      });
      return await response.json();
    } catch (err) {
      console.error('Respond to connection error:', err);
      return null;
    }
  }
}

// Create global instance
const crewmatchAPI = new CrewMatchAPI();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CrewMatchAPI;
}
