# ScanSure Design Handoff Specification

Use this spec when creating designs in Gemini Design Mode to ensure smooth implementation into the ScanSure app.

---

## 1. Project Context

### Tech Stack
- **Framework**: Expo + React Native for Web
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form
- **Icons**: @expo/vector-icons (MaterialCommunityIcons)
- **Styling**: Inline styles (no CSS files, no styled-components)

### Platform Target
- Primary: Web (React Native Web)
- Secondary: iOS/Android (React Native)
- All designs must work on both web and mobile

---

## 2. Color System

Use these exact color tokens. Provide hex codes if you want different colors.

```
Primary:         #5D5252  (brown-gray, used for buttons, active tabs)
Background:      #ffffff  (white)
Background Dark: #0000000D (light gray overlay, ~5% black)
Tabs Background: #F3F1F1  (light warm gray)
Tabs Active:     #5D5252  (same as primary)
Tabs Inactive:   #C4BBBB  (muted gray)
Text:            #000000  (black)
Text Secondary:  #00000080 (50% black)
Border:          #0000001A (10% black)
Error:           #FF0000  (red)
```

### If Proposing New Colors
Provide:
- Hex code
- Token name (e.g., "success", "warning", "accent")
- Where it should be used

---

## 3. Typography

Font sizes vary by component (no global type scale):

| Usage | Size | Example Location |
|-------|------|------------------|
| Theme base | 12px | `useTheme().fontSize` |
| List item title | 14px | `ListItemWithImage` |
| List item subtitle | 11px | `ListItemWithImage` |
| Suffix/badge text | 11px | `ListItemWithImage` |
| Error messages | 10px | `TextInput` |
| General text | System default | `Text` component |

**Font weights used**: 400 (normal), 600 (semi-bold for badges/suffixes)

### If Proposing Typography Changes
Specify:
- Font sizes in pixels
- Font weights (400, 600, 700)
- Which component/screen it applies to

---

## 4. Spacing System

Current spacing uses multiples of 4px:
- **Container padding**: 8px
- **Component gaps**: 4px, 6px, 8px
- **List item height**: 60px
- **Input height**: 32px
- **Image thumbnails**: 32x32px
- **FAB position**: 16px from bottom-right

---

## 5. Existing Components

These components already exist. Reference them by name in your design notes.

### Layout Components
| Component | Description | Props |
|-----------|-------------|-------|
| `Container` | Page wrapper with padding | `useScrollView?: boolean` |
| `ListLoadingState` | Skeleton loader for lists | - |
| `EmptyState` | Empty list message | `title: string` |

### Form Components
| Component | Description | Props |
|-----------|-------------|-------|
| `TextInput` | Form text input | `name, control, placeholder, prefix?, rules?, rootStyle?` |
| `ImageInput` | Image picker | `name, control` |
| `Button` | Standard button (wraps React Native Button) | Inherits all `ButtonProps`: `title, onPress, disabled?, color?` |
| `AsyncSelect` | Dropdown selector | `name, control, endpoint, titleField, keyField` |

**AsyncSelect Example:**
```tsx
<AsyncSelect
  name="house_id"
  control={control}
  endpoint="/houses"      // API endpoint to fetch options
  titleField="name"       // Field to display as label
  keyField="id"           // Field to use as value
/>
```

### Interactive Components
| Component | Description | Props |
|-----------|-------------|-------|
| `FabButton` | Floating action button | `title?, onPress` |
| `ListItemWithImage` | List row with image | `title, subTitle?, suffix?, image?, onPress` |

### Specialized Components
| Component | Description |
|-----------|-------------|
| `HouseItem` | House list row |
| `RoomItem` | Room list row |
| `ItemInline` | Inventory item row |
| `UserItem` | User list row |
| `LoginForm` | Login screen form |

---

## 6. Data Types

When designing screens, these are the data structures available:

### House
```typescript
{
  id: number
  name: string
  address: string
  image?: string  // S3 URL
  location_lat?: number
  location_long?: number
}
```

### Room
```typescript
{
  id: number
  name: string
  house_id: number
  image?: string
  location_lat?: number
  location_long?: number
}
```

### Item (Inventory)
```typescript
{
  id: number
  brand: string
  model: string
  price?: number
  price_type: 'AI' | 'user' | 'invoice'
  category?: string
  serial_number?: string
  image?: string
  room_id: number
  house_id: number
  amount: number
  location_lat?: number
  location_long?: number
}
```

### User
```typescript
{
  id: number
  name: string
  role: 'admin' | 'user'
  user_name: string
}
```

---

## 7. Existing Screens

Reference these when describing which screen to modify or replace.

| Screen | File | Description |
|--------|------|-------------|
| Login | `app/index.tsx` | Login form with username/password |
| Houses (Home) | `app/(tabs)/index.tsx` | List of houses with FAB |
| House Detail | `app/(tabs)/house.tsx` | Single house with its rooms |
| Rooms | `app/(tabs)/rooms.tsx` | List of all rooms |
| Room Detail | `app/(tabs)/room.tsx` | Single room with its items |
| Items | `app/(tabs)/items.tsx` | List of all items |
| Item Detail | `app/(tabs)/item.tsx` | Single item details |
| Add Item | `app/(tabs)/addItem.tsx` | 3-step flow (see sub-steps below) |
| Edit Item | `app/(tabs)/editItem.tsx` | Edit item form with AI price lookup |
| Add House | `app/(tabs)/addHouse.tsx` | New house form |
| Add Room | `app/(tabs)/addRoom.tsx` | New room form |
| Users | `app/(tabs)/users.tsx` | Admin: user list |
| Add User | `app/(tabs)/addUser.tsx` | Admin: create/edit user |
| Settings | `app/(tabs)/settings.tsx` | User info and logout |

### Add Item Flow (3 Steps)
The Add Item screen is a multi-step wizard with these sub-components:

| Step | Component | Description |
|------|-----------|-------------|
| 1. Photo | `components/addItem/makePhotoStep.tsx` | Take photo or upload image |
| 2. Recognition | `components/addItem/recognizeItemStep.tsx` | AI processing with loading indicator |
| 3. Form | `components/addItem/addItemFormStep.tsx` | Edit AI results, select room, save |

**Step 1 (Photo)**: Two large tap areas - "Take a photo" and "Upload an image"

**Step 2 (Recognition)**: Shows image at 20% opacity with centered loading spinner

**Step 3 (Form)**: Pre-filled form with AI results, room selector, price with "Search again" button

---

## 8. Design Deliverables Checklist

When you share a design, please provide:

### Required
- [ ] **Screenshot(s)** of the design
- [ ] **Screen name** - which existing screen to modify OR "new screen"
- [ ] **Layout structure** - what goes where (header, content, footer, etc.)

### For New Screens
- [ ] **Route/URL** - where should this screen live (e.g., `/dashboard`)
- [ ] **Navigation** - how users get to this screen
- [ ] **Data needed** - which data types from section 6 are displayed

### For Styling Changes
- [ ] **Color changes** - list any new colors with hex codes
- [ ] **Spacing changes** - specific pixel values
- [ ] **New components** - describe what they do and look like

### For Interactions
- [ ] **Button actions** - what happens on tap/click
- [ ] **Form behavior** - validation rules, submit actions
- [ ] **Animations** - describe any transitions (optional)

---

## 9. Code Handoff (Advanced)

If Gemini generates code, share it in this format:

### HTML Structure
```html
<!-- Paste the HTML here -->
<!-- Label sections with comments -->
```

### CSS/Styles
```css
/* Paste styles here */
/* I'll convert to React Native inline styles */
```

### Component Mapping
Tell me how HTML elements map to the app:

| HTML Element | Should Become |
|--------------|---------------|
| `<div class="card">` | New `Card` component |
| `<button class="primary">` | Use existing `Button` |
| `<input type="text">` | Use existing `TextInput` |

---

## 10. Handoff Template

Copy and fill this out when sharing each design:

```
## Design Handoff

**Screen**: [existing screen name] OR [new screen at /route]

**What this changes/adds**:
[Brief description]

**Layout**:
[Describe the structure - header, main content areas, footer]

**New colors** (if any):
- [color name]: #hexcode - [where used]

**New components** (if any):
- [Component name]: [what it does]

**Interactions**:
- [Element]: [what happens when clicked]

**Data displayed**:
- Uses: House / Room / Item / User data
- Fields shown: [list specific fields]

**Screenshots attached**: Yes/No

**Code attached**: Yes/No
```

---

## 11. Example Handoff

Here's an example of a well-structured design handoff:

```
## Design Handoff

**Screen**: New screen at /dashboard

**What this changes/adds**:
A dashboard showing summary stats for the home inventory

**Layout**:
- Header: "Dashboard" title
- Stats row: 3 cards showing total houses, rooms, items
- Recent activity: List of last 5 added items
- Quick actions: FAB with "Add Item" shortcut

**New colors**:
- success: #22C55E - for positive stats
- cardBackground: #F8F8F8 - for stat cards

**New components**:
- StatCard: Shows icon, number, and label in a rounded card

**Interactions**:
- Stat cards: Tap to navigate to that section (houses/rooms/items)
- Recent items: Tap to open item detail
- FAB: Opens add item flow

**Data displayed**:
- Uses: House, Room, Item counts
- Recent Items: image, brand, model, price

**Screenshots attached**: Yes

**Code attached**: No
```

---

## Quick Reference Card

**Colors**: primary=#5D5252, bg=#ffffff, text=#000000, border=#0000001A

**Sizes**: padding=8px, gap=4-8px, input=32px height, thumbnail=32x32px

**Components**: Container, TextInput, Button, FabButton, ListItemWithImage, EmptyState

**Icons**: MaterialCommunityIcons (e.g., "plus", "chevron-right", "home")

---

*Last updated: November 25, 2025*
