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

export interface FloodForecast {
  date: string;
  alerts: FloodAlert[];
}

export type RiskLevel = 'high' | 'medium' | 'low'; 