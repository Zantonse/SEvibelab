# Backend Server Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm run start:server
   # or
   npm run dev:server
   ```

3. **Set up OAuth tokens** (first time only):
   - Visit: `http://localhost:3001/api/auth/url`
   - Authorize the application in your browser
   - Copy the authorization code from the redirect URL
   - POST the code to `http://localhost:3001/api/auth/token`:
     ```bash
     curl -X POST http://localhost:3001/api/auth/token \
       -H "Content-Type: application/json" \
       -d '{"code":"YOUR_CODE_HERE"}'
     ```
   - Copy the tokens from the response and set them as environment variables:
     ```bash
     export GOOGLE_ACCESS_TOKEN="your_access_token"
     export GOOGLE_REFRESH_TOKEN="your_refresh_token"
     export GOOGLE_TOKEN_EXPIRY="your_expiry_timestamp"
     ```

4. **Restart the server** with tokens set

## Environment Variables

Create a `.env` file (or set environment variables):

```bash
GOOGLE_ACCESS_TOKEN=your_access_token
GOOGLE_REFRESH_TOKEN=your_refresh_token
GOOGLE_TOKEN_EXPIRY=your_expiry_timestamp
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## Running Both Frontend and Backend

**Terminal 1 (Backend):**
```bash
npm run start:server
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

## API Endpoints

- `POST /api/calendar/create-event` - Create calendar event
- `GET /api/health` - Health check
- `GET /api/auth/url` - Get OAuth authorization URL
- `POST /api/auth/token` - Exchange code for tokens

## Troubleshooting

### 401 Unauthorized
- Make sure OAuth tokens are set correctly
- Tokens may have expired - refresh them

### 404 Not Found
- Check that the server is running on port 3001
- Verify the frontend is calling the correct endpoint

### CORS Errors
- Ensure `FRONTEND_URL` matches your Vite dev server URL (default: http://localhost:5173)


