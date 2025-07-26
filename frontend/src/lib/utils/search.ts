import { MAPBOX_CONFIG } from '@/lib/config/mapbox';

export interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
  bbox?: [number, number, number, number];
  relevance: number;
}

export interface SearchSuggestion {
  id: string;
  text: string;
  place_name: string;
  center: [number, number];
  bbox?: [number, number, number, number];
}

// Search for locations using Mapbox Geocoding API
export const searchLocations = async (query: string): Promise<SearchResult[]> => {
  if (!query.trim() || !MAPBOX_CONFIG.accessToken || MAPBOX_CONFIG.accessToken === 'your_mapbox_token_here') {
    return [];
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_CONFIG.accessToken}&types=place,locality,neighborhood&limit=5&language=en`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.features || [];
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
};

// Get autocomplete suggestions
export const getAutocompleteSuggestions = async (query: string): Promise<SearchSuggestion[]> => {
  if (!query.trim() || !MAPBOX_CONFIG.accessToken || MAPBOX_CONFIG.accessToken === 'your_mapbox_token_here') {
    return [];
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_CONFIG.accessToken}&types=place,locality,neighborhood&autocomplete=true&limit=5&language=en`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.features?.map((feature: any) => ({
      id: feature.id,
      text: feature.text,
      place_name: feature.place_name,
      center: feature.center,
      bbox: feature.bbox
    })) || [];
  } catch (error) {
    console.error('Error getting autocomplete suggestions:', error);
    return [];
  }
};

// Fly to location on map
export const flyToLocation = (
  mapRef: any,
  center: [number, number],
  bbox?: [number, number, number, number]
) => {
  if (!mapRef?.current) return;

  if (bbox) {
    // Fit to bounding box if available
    mapRef.current.fitBounds(bbox, {
      padding: 50,
      duration: 1000
    });
  } else {
    // Fly to center point
    mapRef.current.flyTo({
      center,
      zoom: 10,
      duration: 1000
    });
  }
}; 