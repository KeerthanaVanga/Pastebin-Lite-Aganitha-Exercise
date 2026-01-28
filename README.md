# Pastebin-Lite

A lightweight pastebin application that allows users to create text pastes and share them via unique URLs. Pastes can optionally expire after a certain time (TTL) or after a maximum number of views.

## Features

- Create text pastes with optional constraints:
  - Time-based expiry (TTL)
  - View-count limit
- Share pastes via unique URLs
- View pastes in HTML format
- RESTful API for programmatic access

## How to Run Locally


### Prerequisites

- Node.js (v18 or higher)
- Redis instance (local or cloud-based like Upstash)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd Paste
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `src` directory:
```env
REDIS_URL=redis://localhost:6379
PORT=3000
TEST_MODE=0
```

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Verifying Redis storage

You can confirm that data is stored in Redis in two ways:

1. **Run the verification script** (no server needed):
   ```bash
   npm run verify-redis
   ```
   Or: `node scripts/verify-redis.js`  
   This writes a test key to Redis, reads it back, and prints success or failure. Ensure `REDIS_URL` is set (e.g. in `src/.env`).

2. **Enable in-code verification** when creating pastes:  
   In `src/.env` add:
   ```env
   VERIFY_REDIS_STORAGE=1
   ```
   Then create a paste via the API or UI. The server will read back from Redis after each write and log `[Redis] Verified: paste stored successfully` if storage succeeded; if verification fails, the create request will return an error.

## Persistence Layer

This application uses **Redis** as the persistence layer. Redis is used to store paste data with the following structure:

- **Key format**: `paste:<id>`
- **Value**: JSON stringified paste object containing:
  - `id`: Unique paste identifier
  - `content`: Paste content
  - `createdAtMs`: Creation timestamp in milliseconds
  - `expiresAtMs`: Expiration timestamp (null if no TTL)
  - `maxViews`: Maximum view count (null if unlimited)
  - `viewsUsed`: Current view count

**Why Redis?**
- Fast key-value storage suitable for serverless environments
- Built-in TTL support for automatic expiration
- Atomic operations for view counting (using WATCH/MULTI/EXEC)
- Works well with platforms like Vercel when using services like Upstash

## API Endpoints

### Health Check
- `GET /api/healthz` - Returns application health status

### Create Paste
- `POST /api/pastes` - Create a new paste
  - Request body: `{ "content": "string", "ttl_seconds": 60, "max_views": 5 }`
  - Response: `{ "id": "string", "url": "https://your-app.vercel.app/p/<id>" }`

### Get Paste (API)
- `GET /api/pastes/:id` - Retrieve paste data (increments view count)
  - Response: `{ "content": "string", "remaining_views": 4, "expires_at": "2026-01-01T00:00:00.000Z" }`

### View Paste (HTML)
- `GET /p/:id` - View paste in HTML format (increments view count)

## Design Decisions

1. **Atomic View Counting**: Uses Redis WATCH/MULTI/EXEC to ensure view counts are incremented atomically, preventing race conditions in concurrent scenarios.

2. **Separate Consume/Peek Functions**: 
   - `consume()`: Used for API and HTML views, increments view count
   - `peek()`: Originally intended for non-counting views, but HTML views should count per requirements

3. **Deterministic Time Testing**: Supports `TEST_MODE=1` environment variable with `x-test-now-ms` header for automated testing of TTL functionality.

4. **Error Handling**: All errors return consistent JSON format with appropriate HTTP status codes (4xx for client errors, 404 for unavailable pastes).

5. **Security**: Paste content is escaped using `escape-html` library to prevent XSS attacks in HTML views.

6. **URL Generation**: Uses `x-forwarded-proto` and `x-forwarded-host` headers to generate correct URLs in production (Vercel/behind proxy).

## Testing

The application supports deterministic time testing for TTL validation:

```bash
TEST_MODE=1
```

When enabled, send requests with the `x-test-now-ms` header to simulate different times:
```bash
curl -H "x-test-now-ms: 1735689600000" http://localhost:3000/api/pastes/<id>
```

## Deployment

This application is designed to be deployed on Vercel or similar serverless platforms. Ensure:

1. Redis connection string is set in environment variables
2. `REDIS_URL` points to a persistent Redis instance (e.g., Upstash)
3. No hardcoded localhost URLs in the codebase
4. All dependencies are listed in `package.json`
