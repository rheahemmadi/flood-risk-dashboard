export interface FloodAlert {
  id: string;
  latitude: number;
  longitude: number;
  location: string;
  riskLevel: 'high' | 'medium' | 'low';
  returnPeriod: string;
  trend: 'rising' | 'falling' | 'stable';
  date: string;
  riverName?: string;
  description?: string;
}

export interface FloodPoint {
  id: string;
  latitude: number;
  longitude: number;
  riskLevel: 'high' | 'medium' | 'low';
  riverName?: string;
  segmentId?: string; // To group points that form a river segment
}

export interface FloodSegment {
  id: string;
  points: FloodPoint[];
  riverName?: string;
  riskLevel: 'high' | 'medium' | 'low';
}

export interface FloodForecast {
  date: string;
  alerts: FloodAlert[];
}

export type RiskLevel = 'high' | 'medium' | 'low'; 