# wotigot. - Home Inventory Management System

## Overview
wotigot. is a fullstack home inventory management application designed to help users catalog and track items within their homes. Its core functionality includes AI-powered image recognition (Google Gemini) for automatic item identification and pricing. The project aims to provide a robust, user-friendly system for home inventory management, enabling users to efficiently organize and prove ownership of their belongings.

## User Preferences
- No specific preferences documented yet

## System Architecture

### UI/UX Decisions
The application features a complete redesign utilizing a Material Design component library named "Tutti Frutti". This design system employs hierarchy-based colors (green for Portfolio, yellow for Property, orange for Room-Item) and Material motion with an emphasized easing curve (`Easing.bezier(0.2, 0, 0, 1)`). 

**UI Components:**
- `NoticeBanner` - Light background notifications for hierarchy levels (tap to navigate)
- `PageHeader` - Colored headers with back button, title, subtitle, and action icons (supports `actionIcon` and `onActionPress` for header actions like delete)
- `Avatar` - User profile circles with image/initials/icon fallback
- `IconCircle` - Circular icons with hierarchy coloring
- `OnboardingSlide` / `OnboardingPagination` - Onboarding wizard components
- `TextInput` / `PrimaryButton` / `SecondaryButton` / `AuthToggleLink` - Form controls
- `DenseCard` (list view) - With outlined value badges
- `SimpleCard` (grid view) - With solid icon backgrounds and value badges
- `SelectorCard` (batch operations)
- `CardList` (with search, filters, and view toggle)
- `AddressVerification` - Address input with Google geolocation verification states (Unverified/Verifying/Verified/Error)
- `ConfirmationModal` - Reusable modal for confirmations with destructive variant (red styling for delete actions)
- `AnalyzingOverlay` - Full-screen overlay with animated scanner for AI processing states (used during re-estimation)

**Typography:** Uses Poppins for headlines/titles and DM Sans for body text and smaller. Fonts are loaded via `@expo-google-fonts/poppins` and `@expo-google-fonts/dm-sans` packages with `expo-font` useFonts hook. CSS font-display: block is set in `+html.tsx` to prevent Flash of Unstyled Text (FOUT).

### Technical Implementations
- **Lazy Database Initialization**: Implemented for compatibility with Neon Autoscale, preventing deployment timeouts. The HTTP server starts immediately, while the database connects asynchronously with continuous retry logic. This results in API requests receiving 503 Service Unavailable during the initial ~5-30 seconds after Neon wakes from suspension.
- **Production Deployment**: Configured for Replit autoscale, with the NestJS backend serving both the API and the static Expo web app on port 5000. Database migrations are manual in production to avoid race conditions.
- **Authentication**: JWT-based authentication with bcrypt for password hashing. Token refresh mechanisms include robust error handling to prevent infinite loops.
- **Admin User Seeding**: Automatic admin user creation on first production startup if the user doesn't exist.
- **S3 Media Storage**: Secure storage for images.
- **Page Transitions**: Material Design horizontal shared-axis transitions via `useSharedAxisTransition` hooks in `app/hooks/useSharedAxisTransition.ts`:
  - `useSharedAxisTransitionRoute` - For tab/route screens (uses `useFocusEffect`, requires navigation context)
  - `useSharedAxisTransition` - For overlays/modals/non-route components (uses `useEffect`, safe outside navigation)
  - Both use: 300px offset, 300ms duration, emphasized easing, `ReduceMotion.Never`
  - Wrap screens in `<Animated.View style={[styles.animatedContainer, screenAnimatedStyle]}>`, use `animatedBack()` for back navigation, `animatedExit(callback)` for custom exits

### Feature Specifications
- **House & Room Management**: Organize items by logical hierarchy (house > room).
- **AI Item Recognition**: Automated item identification from uploaded photos using Google Gemini.
- **Price Estimation**: AI-powered price estimation, specifically tailored for the South African market.
- **User Management**: Support for multiple users with distinct roles (e.g., admin).
- **Location Tracking**: GPS coordinates for items and spaces.
- **Data Export**: Excel export functionality for inventory data.
- **Multiple Photos per Item**: Each item supports multiple photos via `ItemImage` entity, with one marked as primary and individual geolocation coordinates per image (supports cascade delete).

### Database Schema Notes
- **Item**: Has `description` field for item name/title (e.g., "Smeg Electric Kettle"), separate from brand/model. Category is free-form text for item type.
- **ItemImage**: Stores multiple images per item with `url`, `thumbnail_url`, `is_primary`, `location_lat`, `location_long`, `created_at`. Foreign key to `item` with cascade delete.
- **API Endpoints for Images**: GET/POST/DELETE/PUT at `/api/items/:id/images` with proper authorization (verifies image belongs to the item).

### Image Optimization
- **Client-side Compression**: Images are compressed before upload using Canvas API (web) or expo-image-manipulator (native). Max dimension 1600px, 80% JPEG quality.
- **Thumbnail Generation**: 256px thumbnails generated client-side and uploaded alongside original images for faster list views.
- **Progressive Loading**: `ImageWithLoader` component shows thumbnail first, then swaps to full resolution once loaded.
- **DenseCard/Item Lists**: Uses `thumbnail_url` for list thumbnails with progressive loading to full image.

### Production Deployment

**Build Configuration:**
- `build.sh` - Builds both frontend (Expo web) and backend (NestJS)
- Frontend build sets `EXPO_PUBLIC_API_URL=/api` at build time (required for API routing)
- Backend build compiles TypeScript

**Runtime Configuration:**
- `start-prod.sh` - Starts the NestJS server in production mode
- Sets `BASE_PATH=/api` so all API routes are prefixed with `/api`
- NestJS serves both the API and static Expo web app on port 5000
- SPA fallback route serves index.html for all non-API routes (enables deep links)

**Database Migrations (IMPORTANT):**
Migrations are NOT run automatically during build to avoid race conditions.
Run manually before each deployment:
```bash
cd api && DEV_DATABASE_URL="$PROD_DATABASE_URL" npm run migration:run
```

### Database Configuration (IMPORTANT)

**This app uses Neon PostgreSQL exclusively. It does NOT use the Replit database.**

⚠️ **CRITICAL WARNING FOR DEBUGGING:**
- Replit's built-in database tool (`execute_sql_tool`) connects to the **Replit database** (via PG* env vars)
- The app connects to the **Neon database** (via DEV_DATABASE_URL / PROD_DATABASE_URL)
- These are **TWO DIFFERENT DATABASES** - data in one won't appear in the other!

**To query the actual app database, use:**
```bash
cd api && npm run db:query -- "SELECT * FROM house"
```

**Environment Variables:**
- `DEV_DATABASE_URL` - Required for development (Neon development branch)
- `PROD_DATABASE_URL` - Required for production (Neon production branch)
- `PG*` variables (PGHOST, PGPORT, etc.) - **IGNORED** by this app, only used by Replit tools

The app will fail to start if the appropriate Neon URL is not set.

### System Design Choices
The project is structured as a monorepo:
- **Backend**: NestJS (TypeScript) REST API.
- **Frontend**: Expo + React Native for Web.
- **Database**: PostgreSQL (Neon only - no Replit DB fallback), with separate development and production branches.
- **Storage**: AWS S3.
- **AI**: Google Gemini.
- **Authentication**: JWT-based.

### Directory Structure
- `api/`: NestJS backend (auth, database, items, media, users modules, migrations).
- `app/`: Expo/React Native frontend (Expo Router pages, UI components, design system, API client, types).
- `start.sh`: Script to start both frontend and backend.

## External Dependencies
- **PostgreSQL**: Neon (serverless database)
- **AWS S3**: Cloud storage for media uploads
- **Google Gemini**: AI for image recognition and item pricing
- **Google Maps Geocoding API**: Address verification and coordinate lookup (requires `GOOGLE_MAPS_API_KEY` secret)
- **@expo/vector-icons**: For MaterialCommunityIcons
- **@expo-google-fonts/poppins**: For headline/title typography
- **@expo-google-fonts/dm-sans**: For body text typography

### Address Geocoding
- Uses **Google Maps Geocoding API** for address verification when adding/editing properties
- API key stored securely as `GOOGLE_MAPS_API_KEY` secret (server-side only, never exposed to browser)
- Backend endpoint: `POST /api/geocode` (public, no auth required)
- Returns formatted address and lat/lng coordinates
- Frontend uses `AddressVerification` component with verification states (Unverified/Verifying/Verified/Error)