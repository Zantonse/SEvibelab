# Backend API Proxy Example

This document provides an example of how to set up a backend API proxy to connect your React app to the Google Calendar MCP server.

## Overview

The React app calls `/api/calendar/create-event` which should proxy requests to the Google Calendar MCP server. Since MCP tools are typically called server-side, you need a backend API endpoint.

## Option 1: Node.js/Express Backend

Create a simple Express server that calls the MCP tools:

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Proxy endpoint for creating calendar events
app.post('/api/calendar/create-event', async (req, res) => {
  try {
    const { calendarId, summary, description, start, end, timeZone } = req.body;

    // Call the MCP tool using the MCP server
    // Note: This is a simplified example - actual implementation depends on
    // how you access the MCP server (HTTP, stdio, etc.)
    
    // Option A: If MCP server exposes HTTP endpoint
    const mcpResponse = await fetch('http://localhost:PORT/mcp/google-calendar/create-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        calendarId: calendarId || 'primary',
        summary,
        description,
        start,
        end,
        timeZone
      })
    });

    const result = await mcpResponse.json();
    res.json(result);

  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ 
      error: 'Failed to create calendar event',
      message: error.message 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
});
```

## Option 2: Using Google Calendar API Directly

Alternatively, use the Google Calendar API directly with OAuth:

```javascript
// server.js
const express = require('express');
const { google } = require('googleapis');
const path = require('path');

const app = express();
app.use(express.json());

// Load OAuth credentials
const credentials = require('./gcp-oauth.keys.json');
const oauth2Client = new google.auth.OAuth2(
  credentials.installed.client_id,
  credentials.installed.client_secret,
  credentials.installed.redirect_uris[0]
);

// Set up OAuth token (you'll need to implement token refresh logic)
// oauth2Client.setCredentials({ access_token: 'YOUR_ACCESS_TOKEN' });

app.post('/api/calendar/create-event', async (req, res) => {
  try {
    const { calendarId, summary, description, start, end, timeZone } = req.body;

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary,
      description,
      start: {
        date: start, // For all-day events
        timeZone: timeZone
      },
      end: {
        date: end, // For all-day events
        timeZone: timeZone
      }
    };

    const response = await calendar.events.insert({
      calendarId: calendarId || 'primary',
      resource: event
    });

    res.json({
      id: response.data.id,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      success: true
    });

  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ 
      error: 'Failed to create calendar event',
      message: error.message 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
});
```

## Option 3: Vite Proxy Configuration

If you're using Vite, you can configure a proxy in `vite.config.js`:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Your backend server
        changeOrigin: true,
      }
    }
  }
});
```

## Setup Instructions

1. **Install dependencies** (if using Node.js backend):
   ```bash
   npm install express cors googleapis
   ```

2. **Create the backend server** using one of the options above

3. **Update the API endpoint** in `src/utils/mcpCalendarService.js` if your backend runs on a different port:
   ```javascript
   const apiEndpoint = options.apiEndpoint || 'http://localhost:3001/api/calendar/create-event';
   ```

4. **Start the backend server**:
   ```bash
   node server.js
   ```

5. **Start the React app** (in a separate terminal):
   ```bash
   npm run dev
   ```

## Authentication

For Option 2 (Google Calendar API), you'll need to:
1. Set up OAuth 2.0 flow to get access tokens
2. Implement token refresh logic
3. Store tokens securely (consider using environment variables or a secure storage solution)

## Testing

Test the integration by:
1. Creating a task with a due date
2. Clicking the calendar button on the task
3. Verifying the event appears in Google Calendar


