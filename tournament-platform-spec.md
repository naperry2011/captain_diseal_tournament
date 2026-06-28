# Nerd Tournament Bracket Platform - Project Specification

## Project Overview
A single-client tournament bracket web application for streaming nerd culture competitions. The platform allows tournament organizers to create and manage brackets for up to 64 competitors across anime, cartoons, and video games with integrated APIs for easy asset and metadata pulling.

---

## Core Features

### 1. Tournament Bracket Engine
- Supports single elimination brackets from 8 to 64 competitors
- Automatic bracket generation based on participant count
- Real-time bracket visualization and updates
- Match seeding and bye handling for non-power-of-two participants
- Live match score management and advancement
- Display winner advancement and bracket progression

### 2. Participant Management
- Add, edit, and remove participants pre-tournament
- Import participants in bulk via CSV or JSON
- Assign participants to bracket positions
- Randomize or manual seeding options
- Search and filter participant lists

### 3. API-Driven Asset Integration
- **Anime**: AniList GraphQL API (free, no authentication required)
  - Query 500k plus anime entries
  - Pull cover art, titles, and metadata
  - Rate limit: roughly 90 requests per minute

- **Cartoons**: TMDB API (free for non-commercial use)
  - Access TV show data, posters, and metadata
  - Query hundreds of cartoon series
  - Generous rate limits for development and streaming use

- **Video Games**: IGDB API (free for non-commercial use)
  - Access 70k plus video game entries
  - Pull game cover art, titles, and metadata
  - Requires OAuth authentication via Twitch Developer Account

### 4. Streaming Interface
- Clean, distraction-free bracket display optimized for OBS capture
- Real-time bracket updates during live stream
- Manual match result entry for streamer control
- Customizable bracket styling (colors, fonts, layout)

---

## Technical Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS for rapid UI development
- **State Management**: React Context API or Zustand for lightweight state
- **Real-time Updates**: Server-Sent Events (SSE) or WebSockets for live bracket sync
- **HTTP Client**: Fetch API or Axios for API calls

### Backend
- **Runtime**: Next.js API Routes
- **Database**: PostgreSQL or MongoDB for tournament and participant data
- **Authentication**: Simple session-based auth or JWT (single client, minimal overhead)
- **API Integrations**: Server-side proxy layer for AniList, TMDB, and IGDB calls
- **Caching**: Redis or in-memory cache for API responses to reduce rate limit hits

### Hosting & Deployment
- **Hosting**: Vercel (native Next.js deployment)
- **Version Control**: GitHub
- **Environment Variables**: Vercel environment management for API keys
- **CI/CD**: GitHub Actions for automated testing and deployment

---

## Database Schema (Conceptual)

### Core Tables
- **tournaments**: id, name, status, participant_count, created_at, updated_at
- **participants**: id, tournament_id, name, seed_position, media_type (anime/cartoon/game), media_id, image_url
- **matches**: id, tournament_id, round, position, participant_1_id, participant_2_id, winner_id, status
- **api_cache**: id, media_type, media_id, data (JSON), cached_at, expires_at

---

## API Integration Flow

### Anime Search (AniList)
1. User searches for anime title
2. Frontend sends query to Next.js API route
3. API route queries AniList GraphQL endpoint
4. Results cached in database for 24 hours
5. Return matching entries with cover art and metadata

### Cartoon Search (TMDB)
1. User searches for cartoon/TV show
2. Frontend sends query to Next.js API route
3. API route queries TMDB REST endpoint
4. Results cached in database for 24 hours
5. Return matching entries with poster art and metadata

### Game Search (IGDB)
1. User searches for game title
2. Frontend sends query to Next.js API route
3. API route authenticates via Twitch OAuth token
4. API route queries IGDB REST endpoint
5. Results cached in database for 24 hours
6. Return matching entries with cover art and metadata

---

## User Workflows

### Tournament Creation
1. Streamer clicks "Create Tournament"
2. Selects participant count (8, 16, 32, 64)
3. Inputs or imports participant list
4. For each participant, searches API and selects matching anime, cartoon, or game
5. System automatically generates bracket
6. Streamer reviews and confirms bracket layout

### Live Tournament Management
1. Streamer opens bracket display
2. As matches conclude, enters match winner
3. System automatically advances winner to next round
4. Bracket updates in real-time for OBS capture
5. Process repeats until tournament conclusion

---

## File Structure (Next.js)

```
nerd-tournament-bracket/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── tournament/
│   │   ├── [id]/
│   │   │   ├── page.tsx
│   │   │   └── bracket/
│   │   │       └── page.tsx
│   │   └── create/
│   │       └── page.tsx
│   ├── api/
│   │   ├── tournament/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── participants/
│   │   │   └── route.ts
│   │   ├── matches/
│   │   │   └── route.ts
│   │   ├── search/
│   │   │   ├── anime/
│   │   │   │   └── route.ts
│   │   │   ├── cartoon/
│   │   │   │   └── route.ts
│   │   │   └── game/
│   │   │       └── route.ts
│   │   └── cache/
│   │       └── route.ts
│   └── styles/
│       └── globals.css
├── components/
│   ├── BracketDisplay.tsx
│   ├── ParticipantForm.tsx
│   ├── MediaSearch.tsx
│   ├── MatchEntry.tsx
│   └── TournamentCreate.tsx
├── lib/
│   ├── db.ts
│   ├── anilist.ts
│   ├── tmdb.ts
│   ├── igdb.ts
│   ├── bracket-logic.ts
│   └── cache.ts
├── types/
│   └── index.ts
├── public/
├── .env.local (secrets and API keys)
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## API Keys Required

1. **TMDB API Key**: Register at https://www.themoviedb.org/settings/api
2. **AniList**: No key required (free public GraphQL API)
3. **IGDB**: Register Twitch Developer app at https://dev.twitch.tv and obtain OAuth credentials
4. **Database**: PostgreSQL connection string or MongoDB URI

---

## Development Phases

### Phase 1: Core Bracket Engine
- Bracket generation logic
- Match advancement system
- Basic UI skeleton with Tailwind CSS

### Phase 2: Participant Management
- Add/edit/remove participants
- Bulk import functionality
- Seeding and randomization

### Phase 3: API Integrations
- AniList search and caching
- TMDB search and caching
- IGDB search and caching
- Server-side proxy layer

### Phase 4: Live Streaming Interface
- Optimized bracket display for OBS
- Real-time updates (SSE or WebSockets)
- Customizable styling options

### Phase 5: Polish & Deployment
- Testing and bug fixes
- Performance optimization
- Vercel deployment configuration
- GitHub Actions CI/CD setup

---

## Deployment Checklist

- [ ] GitHub repository created and initialized
- [ ] Environment variables configured in Vercel
- [ ] Database hosted and connected
- [ ] API keys stored securely in Vercel environment
- [ ] GitHub Actions workflow for auto-deployment
- [ ] Domain configured (if applicable)
- [ ] Testing on staging environment
- [ ] Production deployment
