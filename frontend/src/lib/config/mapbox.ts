// Mapbox configuration
export const MAPBOX_CONFIG = {
  // Replace with your actual Mapbox access token
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'your_mapbox_token_here',
  
  // Default map style - changed to streets-v12 (default)
  mapStyle: 'mapbox://styles/mapbox/streets-v12',
  
  // Default viewport - focused on UK
  defaultViewport: {
    latitude: 54.0,  // UK center latitude
    longitude: -2.0, // UK center longitude
    zoom: 5          // Closer zoom to show UK clearly
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
      return 12; // Larger for critical alerts
    case 'medium':
      return 10; // Medium size
    case 'low':
      return 8; // Smaller for low risk
    default:
      return 8;
  }
};
