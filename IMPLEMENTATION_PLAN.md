# wotigot. Redesign Implementation Plan

**Project**: Transform ScanSure into wotigot. with new brand, UI, and features  
**Created**: 2025-11-26  
**Status**: In Progress

---

## Overview

Complete UI/UX redesign based on HTML prototypes in `design_prototypes/` folder. This is a multi-day effort broken into phases with checkpoint reviews after each screen.

---

## Phase 0: Design Foundation (Day 1)
*Goal: Create single source of truth for all design tokens and animations*

### 0.1 Design Tokens File
Create `app/constants/DesignTokens.ts`:
- [ ] Colors (Tutti Frutti palette)
  - bg-canvas: #FFFDF9
  - text-dark: #2D3436
  - text-grey: #95A5A6
  - green: #00B894, green-soft: #E0F9F4
  - yellow: #F7B731, yellow-soft: #FFF5D8
  - orange: #FA8231, orange-soft: #FFF0E6
  - danger: #FF7675
- [ ] Border Radii (12, 16, 18, 20, 24, 32, 44, 100)
- [ ] Shadows (card, float, toolbar)
- [ ] Typography (Poppins weights: 400, 500, 600, 700, 800)
- [ ] Spacing scale

### 0.2 Motion Contract
Create `app/constants/MotionContract.ts`:
- [ ] Document all animations with duration, easing, triggers
- [ ] Onboarding slide: 500ms, cubic-bezier(0.2, 0.8, 0.2, 1)
- [ ] Floating icon: 5s infinite, ease-in-out
- [ ] Auth screen slide: 500ms, translateY
- [ ] Modal sheet: 300ms, cubic-bezier(0.2, 0.8, 0.2, 1)
- [ ] Loader bar fill: 2000ms, linear
- [ ] Screen transitions: 300ms, translateX

### 0.3 Install Dependencies
- [ ] expo-font (Poppins)
- [ ] @expo/vector-icons (Material Icons)
- [ ] react-native-reanimated (if not present)

**Checkpoint**: Review tokens match prototype CSS variables

---

## Phase 1: Component Library (Day 1-2)
*Goal: Build reusable primitives in isolation before screens*

### 1.1 Core Components
- [ ] `RichCard` - List item with thumbnail, title, subtitle, badge
- [ ] `HeaderBlock` - Colored header (green/yellow/orange variants)
- [ ] `InputCard` - White card input with icon
- [ ] `ActionCard` - Grid action button with icon box
- [ ] `Badge` - Value badge (colored pill)
- [ ] `DotIndicator` - Onboarding dots
- [ ] `IconCircle` - Floating animated icon

### 1.2 Navigation Components
- [ ] `SmartToolbar` - Dark pill with icon groups
- [ ] `SmartFAB` - Center FAB with canvas border cutout
- [ ] `BottomSheet` - Modal sheet with backdrop blur

### 1.3 Form Components
- [ ] `AuthInput` - Login/register input cards
- [ ] `PrimaryButton` - Dark/colored full-width buttons
- [ ] `PhotoUploadArea` - Dashed border upload zone

**Checkpoint**: Screenshot each component, compare to prototype

---

## Phase 2: Onboarding Flow (Day 2-3)
*Goal: Splash → Slides → Login → Register → Your Details*

### 2.1 Screens
- [ ] `SplashScreen` - wotigot. logo, funky image, "Let's Go" button
- [ ] `OnboardingSlide` - Reusable slide with icon, title, description
- [ ] `OnboardingFlow` - Container managing 3 slides + navigation
- [ ] `LoginScreen` - Email/password + Google button
- [ ] `RegisterScreen` - Full form (name, phone, address, email, password)
- [ ] `YourDetailsScreen` - Post-Google-auth detail collection

### 2.2 Animations
- [ ] Slide transitions (translateX + opacity)
- [ ] Floating icon animation
- [ ] Dot indicator transitions
- [ ] Auth screen slide-up

### 2.3 Backend
- [ ] `POST /api/auth/register` - New registration endpoint
- [ ] `POST /api/auth/google` - Google OAuth endpoint
- [ ] User model: add firstName, lastName, phone, address fields
- [ ] Database migration for new user fields

**Checkpoint**: Record video of flow, compare to HTML prototype interactions

---

## Phase 3: Core Navigation & Dashboard (Day 3-4)
*Goal: New toolbar + Portfolio dashboard*

### 3.1 Navigation Structure
- [ ] Replace tab bar with SmartToolbar
- [ ] Implement 5 nav destinations: Portfolio, Items, (FAB), Analytics, Settings
- [ ] FAB opens BottomSheet modal

### 3.2 Portfolio Dashboard (Green)
- [ ] Green HeaderBlock with total value
- [ ] "PROPERTIES" section label
- [ ] RichCard list for properties (thumbnail, name, room count, value badge)
- [ ] Navigation to Property Detail

### 3.3 Property Detail (Yellow)
- [ ] Yellow HeaderBlock with back arrow, name, address
- [ ] "ROOMS" section label
- [ ] RichCard list for rooms (icon thumbnail, name, item count, value badge)
- [ ] Navigation to Room Detail

### 3.4 Room Detail (Orange)
- [ ] Orange HeaderBlock with back arrow, name, item count
- [ ] RichCard list for items (photo thumbnail, name, category, price badge)

**Checkpoint**: Screenshot each screen at each hierarchy level

---

## Phase 4: Smart Add Flow (Day 4-5)
*Goal: Context-aware FAB → Modal → Capture → AI → Review*

### 4.1 Add Modal (BottomSheet)
- [ ] "ADD NEW" header
- [ ] Context card (current room/property) with "Change" button
- [ ] 3 action cards: Property, Room, Scan
- [ ] Context-aware logic:
  - From Portfolio: Show property/room selector (default last edited)
  - From Property: Room scoped to property
  - From Room: Skip modal, go direct to capture

### 4.2 Context Selector
- [ ] Property picker (if needed)
- [ ] Room picker (scoped to selected property)
- [ ] "Last edited" default logic

### 4.3 Capture Choice Screen
- [ ] "How to add?" header with close button
- [ ] "Take Photo" card (dark, prominent)
- [ ] "Upload" card (light)

### 4.4 AI Loader Screen
- [ ] Dark background (rgba 0,0,0,0.9)
- [ ] auto_awesome icon
- [ ] "Analyzing..." text
- [ ] Progress bar with fill animation

### 4.5 Review Screen
- [ ] Hero image area (captured photo)
- [ ] Form card overlapping hero (-32px margin)
- [ ] "AI Match Found" badge
- [ ] Pre-filled name input with AI icon
- [ ] Price input with green border + refresh icon
- [ ] "Save Item" button

### 4.6 Backend Updates
- [ ] Track "last edited room" per user
- [ ] Return room context in API responses

**Checkpoint**: Test full flow from each context (Portfolio, Property, Room)

---

## Phase 5: Manual Entry Forms (Day 5)
*Goal: Add Property and Add Room screens*

### 5.1 Add Property Form (Yellow theme)
- [ ] Header with close button, "New Property" title
- [ ] Name input with home icon
- [ ] Address input with place icon (future: Google Maps integration)
- [ ] Photo upload area
- [ ] "Save Property" button

### 5.2 Add Room Form (Orange theme)
- [ ] Header with close button, "New Room" title
- [ ] Location selector (property) with "Change" link
- [ ] Name input with edit icon
- [ ] Photo upload area
- [ ] "Save Room" button

**Checkpoint**: Compare forms side-by-side with prototype

---

## Phase 6: Settings & Profile (Day 5-6)
*Goal: Rich profile/settings screen*

### 6.1 Settings Screen
- [ ] Profile header with user avatar, name, email
- [ ] Account section (Edit Profile, Change Password)
- [ ] App section (Notifications, Theme, Language)
- [ ] Support section (Help, Privacy, Terms)
- [ ] Logout button
- [ ] Danger zone (Delete Account)

### 6.2 Edit Profile Screen
- [ ] Avatar upload
- [ ] First name, Last name inputs
- [ ] Phone, Address inputs
- [ ] Save button

**Checkpoint**: Review settings against common app patterns

---

## Phase 7: Analytics Placeholder (Day 6)
*Goal: Placeholder screen for future analytics*

- [ ] Header with "Analytics" title
- [ ] "Coming Soon" message
- [ ] Teaser content (chart icons, feature preview)

---

## Phase 8: Polish & Integration (Day 6-7)
*Goal: Final integration and testing*

### 8.1 Integration Testing
- [ ] Full onboarding flow (new user)
- [ ] Login flow (existing user)
- [ ] Google OAuth flow
- [ ] Add item from each context
- [ ] Navigation between all screens
- [ ] Data persistence verification

### 8.2 Animation Polish
- [ ] Verify all animation timings
- [ ] Test on device (not just web)
- [ ] Performance optimization if needed

### 8.3 Cleanup
- [ ] Remove old screens/components
- [ ] Update DESIGN_HANDOFF_SPEC.md with new components
- [ ] Update replit.md with new architecture

---

## Phase 9: Google OAuth Setup (When Ready)
*Requires: Google Cloud Console credentials from user*

- [ ] Receive GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- [ ] Install passport-google-oauth20
- [ ] Configure NestJS Passport strategy
- [ ] Create OAuth callback routes
- [ ] Test full Google sign-in flow
- [ ] Handle "Your Details" redirect for new Google users

---

## Review Checkpoints Summary

| Phase | Checkpoint | Approval Required |
|-------|------------|-------------------|
| 0 | Tokens match CSS variables | Yes |
| 1 | Each component matches prototype | Yes |
| 2 | Onboarding flow video | Yes |
| 3 | Dashboard hierarchy screenshots | Yes |
| 4 | Add flow from each context | Yes |
| 5 | Manual entry forms | Yes |
| 6 | Settings screen | Yes |
| 7 | Analytics placeholder | Yes |
| 8 | Full integration test | Yes |

---

## Files to Create/Modify

### New Files
- `app/constants/DesignTokens.ts`
- `app/constants/MotionContract.ts`
- `app/components/design/*.tsx` (new component library)
- `app/app/onboarding/*.tsx` (onboarding screens)
- `app/app/auth/*.tsx` (auth screens)
- `api/src/auth/google.strategy.ts`

### Modified Files
- `app/constants/Colors.ts` → Replace with new palette
- `app/app/(tabs)/_layout.tsx` → New toolbar navigation
- `api/src/users/user.entity.ts` → New profile fields
- `api/src/auth/auth.controller.ts` → Register + Google endpoints

---

## Notes

- Each phase has explicit checkpoints requiring user approval
- Screenshots/videos will be provided for comparison
- No phase proceeds until previous is approved
- Google OAuth credentials needed before Phase 9
