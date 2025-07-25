import { FloodAlert } from '../types/flood';

// Mock flood alert data for demonstration
export const mockFloodAlerts: FloodAlert[] = [
  // Today
  {
    id: '1',
    latitude: 51.5074,
    longitude: -0.1278,
    location: 'London, United Kingdom',
    riverName: 'River Thames',
    riskLevel: 'high',
    returnPeriod: '20-year return period',
    trend: 'rising',
    date: new Date().toISOString().split('T')[0],
    description: 'High flood risk due to heavy rainfall upstream'
  },
  {
    id: '2',
    latitude: 52.3676,
    longitude: 4.9041,
    location: 'Amsterdam, Netherlands',
    riverName: 'Amstel River',
    riskLevel: 'medium',
    returnPeriod: '10-year return period',
    trend: 'stable',
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: '3',
    latitude: 48.8566,
    longitude: 2.3522,
    location: 'Paris, France',
    riverName: 'Seine River',
    riskLevel: 'low',
    returnPeriod: '5-year return period',
    trend: 'falling',
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: '4',
    latitude: 50.1109,
    longitude: 8.6821,
    location: 'Frankfurt, Germany',
    riverName: 'Main River',
    riskLevel: 'high',
    returnPeriod: '50-year return period',
    trend: 'rising',
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: '5',
    latitude: 41.9028,
    longitude: 12.4964,
    location: 'Rome, Italy',
    riverName: 'Tiber River',
    riskLevel: 'medium',
    returnPeriod: '10-year return period',
    trend: 'stable',
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: '6',
    latitude: 23.1291,
    longitude: 113.2644,
    location: 'Guangzhou, China',
    riverName: 'Pearl River',
    riskLevel: 'high',
    returnPeriod: '100-year return period',
    trend: 'rising',
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: '7',
    latitude: -23.5505,
    longitude: -46.6333,
    location: 'São Paulo, Brazil',
    riverName: 'Tietê River',
    riskLevel: 'medium',
    returnPeriod: '25-year return period',
    trend: 'rising',
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: '8',
    latitude: 28.7041,
    longitude: 77.1025,
    location: 'New Delhi, India',
    riverName: 'Yamuna River',
    riskLevel: 'high',
    returnPeriod: '20-year return period',
    trend: 'rising',
    date: new Date().toISOString().split('T')[0]
  },
  
  // Tomorrow
  {
    id: '9',
    latitude: 51.5074,
    longitude: -0.1278,
    location: 'London, United Kingdom',
    riverName: 'River Thames',
    riskLevel: 'medium',
    returnPeriod: '10-year return period',
    trend: 'falling',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },
  {
    id: '10',
    latitude: 40.7128,
    longitude: -74.0060,
    location: 'New York, USA',
    riverName: 'Hudson River',
    riskLevel: 'high',
    returnPeriod: '25-year return period',
    trend: 'rising',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },
  {
    id: '11',
    latitude: 35.6762,
    longitude: 139.6503,
    location: 'Tokyo, Japan',
    riverName: 'Arakawa River',
    riskLevel: 'medium',
    returnPeriod: '15-year return period',
    trend: 'stable',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },

  // Day 3
  {
    id: '12',
    latitude: -33.8688,
    longitude: 151.2093,
    location: 'Sydney, Australia',
    riverName: 'Parramatta River',
    riskLevel: 'low',
    returnPeriod: '5-year return period',
    trend: 'stable',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },
  {
    id: '13',
    latitude: -1.2921,
    longitude: 36.8219,
    location: 'Nairobi, Kenya',
    riverName: 'Nairobi River',
    riskLevel: 'high',
    returnPeriod: '30-year return period',
    trend: 'rising',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },

  // Day 4
  {
    id: '14',
    latitude: 19.4326,
    longitude: -99.1332,
    location: 'Mexico City, Mexico',
    riverName: 'Río de los Remedios',
    riskLevel: 'medium',
    returnPeriod: '20-year return period',
    trend: 'rising',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },

  // Day 5
  {
    id: '15',
    latitude: 55.7558,
    longitude: 37.6176,
    location: 'Moscow, Russia',
    riverName: 'Moskva River',
    riskLevel: 'low',
    returnPeriod: '5-year return period',
    trend: 'falling',
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }
];

// Generate available dates for the next 5 days
export const getAvailableDates = (): string[] => {
  const dates = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

// Get alert counts by risk level for a specific date
export const getAlertCounts = (alerts: FloodAlert[], date: string) => {
  const dayAlerts = alerts.filter(alert => alert.date === date);
  return {
    high: dayAlerts.filter(alert => alert.riskLevel === 'high').length,
    medium: dayAlerts.filter(alert => alert.riskLevel === 'medium').length,
    low: dayAlerts.filter(alert => alert.riskLevel === 'low').length
  };
}; 