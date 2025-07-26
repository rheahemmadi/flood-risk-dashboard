// Mapbox configuration
export const MAPBOX_CONFIG = {
  // Replace with your actual Mapbox access token
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'your_mapbox_token_here',
  
  // Default map style - changed to streets-v12 (default)
  mapStyle: 'mapbox://styles/mapbox/streets-v12',
  
  // Default viewport - focused on Northern Europe (where your flood data is located)
  defaultViewport: {
    latitude: 70.5,  // Northern Europe center latitude (Norway/Sweden/Finland area)
    longitude: 26.0, // Northern Europe center longitude
    zoom: 4          // Zoom to show the region clearly
  },
  
  // Map options
  mapOptions: {
    maxZoom: 18,
    minZoom: 3,      // Prevent zooming out too far
    pitch: 0,
    bearing: 0
  }
};

// Helper function to get marker color based on risk level
export const getMarkerColor = (riskLevel: string): string => {
  switch (riskLevel) {
    case 'high':
      return '#dc2626'; // Red for critical
    case 'medium':
      return '#f59e0b'; // Amber for medium
    case 'low':
      return '#10b981'; // Green for low
    default:
      return '#6b7280'; // Gray for unknown
  }
};

// Helper function to get marker size based on risk level
export const getMarkerSize = (riskLevel: string): number => {
  switch (riskLevel) {
    case 'high':
      return 20; // Much larger for 5km areas
    case 'medium':
      return 16; // Larger for medium risk
    case 'low':
      return 12; // Larger for low risk
    default:
      return 12;
  }
};

// Helper function to get flood point marker size (for 5km areas)
export const getFloodPointSize = (riskLevel: string): number => {
  switch (riskLevel) {
    case 'high':
      return 24; // Very large for high risk 5km areas
    case 'medium':
      return 20; // Large for medium risk
    case 'low':
      return 16; // Medium for low risk
    default:
      return 16;
  }
};
