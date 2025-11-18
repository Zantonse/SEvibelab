/**
 * Backend Server for Task List App
 * 
 * Handles Google Calendar integration via OAuth 2.0
 * Provides API endpoint for creating calendar events from tasks
 */

import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load OAuth credentials
let credentials;
try {
  const credentialsPath = join(__dirname, 'gcp-oauth.keys.json');
  const credentialsFile = readFileSync(credentialsPath, 'utf8');
  credentials = JSON.parse(credentialsFile);
} catch (error) {
  console.error('Failed to load OAuth credentials:', error.message);
  process.exit(1);
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite default port
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// OAuth2 Client Setup
const oauth2Client = new google.auth.OAuth2(
  credentials.installed.client_id,
  credentials.installed.client_secret,
  credentials.installed.redirect_uris[0]
);

// Token storage file path
const TOKENS_FILE = join(__dirname, 'google-tokens.json');

// Token management - persist to file for persistence across server restarts
const saveTokens = (tokens) => {
  try {
    writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
    console.log('✅ Google tokens saved to file');
  } catch (error) {
    console.error('❌ Failed to save tokens:', error.message);
  }
};

const loadTokens = () => {
  try {
    if (existsSync(TOKENS_FILE)) {
      const tokensData = readFileSync(TOKENS_FILE, 'utf8');
      const tokens = JSON.parse(tokensData);
      console.log('✅ Google tokens loaded from file');
      return tokens;
    }
  } catch (error) {
    console.error('❌ Failed to load tokens:', error.message);
  }

  // Fallback to environment variables
  const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (accessToken) {
    console.log('ℹ️  Using tokens from environment variables');
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: process.env.GOOGLE_TOKEN_EXPIRY ? parseInt(process.env.GOOGLE_TOKEN_EXPIRY) : null
    };
  }

  return null;
};

// Set tokens if available
const tokens = loadTokens();
if (tokens) {
  oauth2Client.setCredentials(tokens);

  // Auto-refresh token before expiry
  oauth2Client.on('tokens', (newTokens) => {
    if (newTokens.refresh_token) {
      console.log('New refresh token received');
    }
    console.log('Access token refreshed');

    // Save updated tokens
    const updatedTokens = { ...oauth2Client.credentials };
    saveTokens(updatedTokens);
  });
} else {
  console.warn('⚠️  No OAuth tokens found. Use the /api/auth/url and /api/auth/token endpoints to set them up.');
}

/**
 * Validate calendar event request data
 */
const validateEventRequest = (req, res, next) => {
  const { summary, start, end } = req.body;
  
  if (!summary || typeof summary !== 'string' || summary.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'summary is required and must be a non-empty string'
    });
  }
  
  if (!start || typeof start !== 'string') {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'start date is required and must be a string (YYYY-MM-DD format)'
    });
  }
  
  if (!end || typeof end !== 'string') {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'end date is required and must be a string (YYYY-MM-DD format)'
    });
  }
  
  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(start)) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'start date must be in YYYY-MM-DD format'
    });
  }
  
  if (!dateRegex.test(end)) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'end date must be in YYYY-MM-DD format'
    });
  }
  
  next();
};

/**
 * POST /api/calendar/create-event
 * Creates a Google Calendar event from task data
 */
app.post('/api/calendar/create-event', validateEventRequest, async (req, res) => {
  try {
    const { calendarId = 'primary', summary, description, start, end, timeZone } = req.body;
    
    // Check if OAuth client has credentials
    if (!oauth2Client.credentials.access_token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'OAuth token not configured. Please set GOOGLE_ACCESS_TOKEN environment variable or complete OAuth flow.'
      });
    }
    
    // Initialize Calendar API
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Prepare event data
    const event = {
      summary: summary.trim(),
      description: description || '',
      start: {
        date: start, // All-day event format
        timeZone: timeZone || 'America/Los_Angeles'
      },
      end: {
        date: end, // All-day event format
        timeZone: timeZone || 'America/Los_Angeles'
      }
    };
    
    console.log(`Creating calendar event: ${summary} on ${start}`);
    
    // Create the event
    const response = await calendar.events.insert({
      calendarId: calendarId,
      resource: event,
      sendUpdates: 'none' // Don't send email notifications
    });
    
    console.log(`✅ Calendar event created: ${response.data.id}`);
    
    // Return success response matching frontend expectations
    res.json({
      id: response.data.id,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      success: true
    });
    
  } catch (error) {
    console.error('❌ Error creating calendar event:', error);
    
    // Handle specific Google API errors
    if (error.code === 401 || error.response?.status === 401) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'OAuth token expired or invalid. Please refresh your token.'
      });
    }
    
    if (error.code === 403 || error.response?.status === 403) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions to create calendar events. Please check OAuth scopes.'
      });
    }
    
    if (error.code === 404 || error.response?.status === 404) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Calendar not found. Please check the calendarId.'
      });
    }
    
    // Generic error response
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to create calendar event'
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasOAuthToken: !!oauth2Client.credentials.access_token
  });
});

/**
 * GET /api/auth/status
 * Check Google Calendar connection status
 */
app.get('/api/auth/status', (req, res) => {
  const hasCredentials = !!oauth2Client.credentials.access_token;
  const expiry = oauth2Client.credentials.expiry_date;
  const isExpired = expiry && Date.now() > expiry;

  res.json({
    connected: hasCredentials && !isExpired,
    hasAccessToken: !!oauth2Client.credentials.access_token,
    hasRefreshToken: !!oauth2Client.credentials.refresh_token,
    expiry: expiry ? new Date(expiry).toISOString() : null,
    isExpired: !!isExpired
  });
});

/**
 * GET /api/auth/url
 * Get OAuth authorization URL (for initial setup)
 */
app.get('/api/auth/url', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar.events'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // Force consent screen to get refresh token
  });

  res.json({
    authUrl,
    message: 'Visit this URL to authorize the application, then use the code to get tokens'
  });
});

/**
 * POST /api/auth/token
 * Exchange authorization code for tokens (for initial setup)
 */
app.post('/api/auth/token', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Authorization code is required'
      });
    }
    
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save tokens to file for persistence
    saveTokens(tokens);

    res.json({
      success: true,
      message: 'Google Calendar connected successfully! Tokens saved.',
      tokens: {
        GOOGLE_ACCESS_TOKEN: tokens.access_token,
        GOOGLE_REFRESH_TOKEN: tokens.refresh_token,
        GOOGLE_TOKEN_EXPIRY: tokens.expiry_date?.toString()
      }
    });
  } catch (error) {
    console.error('Error exchanging token:', error);
    res.status(500).json({
      error: 'Failed to exchange token',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📅 Calendar API endpoint: http://localhost:${PORT}/api/calendar/create-event`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Auth status: http://localhost:${PORT}/api/auth/status`);

  if (!oauth2Client.credentials.access_token) {
    console.log(`\n⚠️  OAuth Setup Required:`);
    console.log(`   1. Visit: http://localhost:${PORT}/api/auth/url`);
    console.log(`   2. Authorize and get the code`);
    console.log(`   3. POST code to: http://localhost:${PORT}/api/auth/token`);
    console.log(`   Or use the Settings modal in your React app!`);
    console.log(`   Tokens will be saved automatically.\n`);
  } else {
    console.log(`\n✅ Google Calendar is connected!\n`);
  }
});

