// Risk levels for flood alerts
export type RiskLevel = 'red' | 'amber' | 'green';

// Geographic coordinates
export interface Coordinates {
  lat: number;
  lng: number;
}

// GloFAS alert data structure
export interface GloFASAlert {
  id: string;
  coordinates: Coordinates;
  riskLevel: RiskLevel;
  returnPeriod: number; // e.g., 5, 20 years
  forecastDate: string; // ISO date string
  riverName?: string;
  location?: string;
  trend: 'rising' | 'falling' | 'stable';
  dischargeValue: number;
  thresholdValue: number;
}

// Google Flood Hub inundation data
export interface InundationData {
  gaugeId: string;
  coordinates: Coordinates;
  polygon: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  confidence: number;
  forecastDate: string;
}

// Map marker cluster data
export interface MarkerCluster {
  id: string;
  coordinates: Coordinates;
  alerts: GloFASAlert[];
  count: number;
}

// AI Insight response
export interface AIInsight {
  id: string;
  alertId: string;
  summary: string;
  recommendations: string[];
  generatedAt: string;
}

// Search result for location search
export interface SearchResult {
  id: string;
  name: string;
  coordinates: Coordinates;
  country: string;
  type: 'country' | 'region' | 'city';
}

// Filter options for the map
export interface MapFilters {
  riskLevels: RiskLevel[];
  dateRange: {
    start: string;
    end: string;
  };
  regions: string[];
}

// API response types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
} 