# Map Search Feature

## Overview

The flood risk dashboard now includes integrated search functionality that allows users to search for locations on both the Mapbox-based FloodMap and the OpenStreetMap-based Map components.

## Features

### 🔍 **Autocomplete Search**
- Real-time location suggestions as you type
- Debounced search (300ms delay) to prevent excessive API calls
- Keyboard navigation support (arrow keys, enter, escape)
- Global location search (no geographic restrictions)

### 🗺️ **Map Integration**
- **FloodMap**: Uses Mapbox GL JS with smooth fly-to animations
- **Map**: Uses OpenStreetMap iframe with URL-based navigation
- Both maps automatically center on selected locations

### 🔗 **Header Integration**
- **Integrated into DashboardHeader**: Search is now part of the main header, not overlaid on the map
- **Clean map view**: No search overlay blocking the map interface
- **Bidirectional communication**: Search in header controls map navigation
- **Consistent search experience** across the application

## Components

### MapSearch Component
Located at `src/components/MapSearch.tsx`

**Props:**
- `onLocationSelect`: Callback when a location is selected
- `placeholder`: Search input placeholder text
- `className`: Additional CSS classes
- `initialValue`: Initial search query (syncs with header)
- `onSearchChange`: Callback for search query changes

**Features:**
- Autocomplete dropdown with location suggestions
- Loading states with spinner
- Clear button to reset search
- Keyboard navigation (↑↓ arrows, Enter, Escape)

### Search Utilities
Located at `src/lib/utils/search.ts`

**Functions:**
- `searchLocations()`: Full location search
- `getAutocompleteSuggestions()`: Autocomplete suggestions
- `flyToLocation()`: Map navigation helper

## API Integration

### Mapbox Geocoding API
- Uses Mapbox's geocoding service for location search
- **Global search**: No geographic restrictions, searches worldwide
- Searches places, localities, and neighborhoods
- Requires valid Mapbox access token

### Configuration
Set your Mapbox token in `.env.local`:
```
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

## Usage

### Basic Implementation
```tsx
import MapSearch from '@/components/MapSearch';

<MapSearch
  onLocationSelect={(suggestion) => {
    // Handle location selection
    flyToLocation(mapRef, suggestion.center, suggestion.bbox);
  }}
  placeholder="Search locations worldwide..."
  initialValue={searchQuery}
  onSearchChange={setSearchQuery}
/>
```

### With FloodMap
```tsx
<FloodMap
  alerts={filteredAlerts}
  onAlertClick={handleAlertClick}
  selectedDate={selectedDate}
  riskFilter={riskFilter}
  searchQuery={searchQuery} // Syncs with header search
/>
```

## Keyboard Shortcuts

- **↑/↓**: Navigate through suggestions
- **Enter**: Select highlighted suggestion
- **Escape**: Close suggestions dropdown
- **Tab**: Move focus between elements

## Styling

The search component uses Tailwind CSS classes and integrates with the existing design system:
- Consistent with dashboard theme
- Responsive design for mobile and desktop
- Proper z-index layering for dropdowns
- Smooth animations and transitions

## Error Handling

- Graceful fallback when Mapbox token is missing
- Network error handling with user feedback
- Empty state handling for no results
- Loading states for better UX

## Future Enhancements

Potential improvements:
- Search history
- Favorite locations
- Advanced filters (by region, risk level)
- Voice search integration
- Offline search capabilities 