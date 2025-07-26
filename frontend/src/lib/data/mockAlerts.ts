import { FloodAlert, FloodPoint, FloodSegment } from '@/lib/types/flood';

// Mock flood points data - representing river segments
export const mockFloodPoints: FloodPoint[] = [
  // River Thames segment 1 (High risk) - London area
  { id: 'fp-1', latitude: 51.5074, longitude: -0.1278, riskLevel: 'high', riverName: 'River Thames', segmentId: 'thames-1' },
  { id: 'fp-2', latitude: 51.5080, longitude: -0.1285, riskLevel: 'high', riverName: 'River Thames', segmentId: 'thames-1' },
  { id: 'fp-3', latitude: 51.5085, longitude: -0.1290, riskLevel: 'high', riverName: 'River Thames', segmentId: 'thames-1' },
  { id: 'fp-4', latitude: 51.5090, longitude: -0.1295, riskLevel: 'high', riverName: 'River Thames', segmentId: 'thames-1' },
  { id: 'fp-5', latitude: 51.5095, longitude: -0.1300, riskLevel: 'high', riverName: 'River Thames', segmentId: 'thames-1' },
  
  // River Thames segment 2 (Medium risk) - Upstream
  { id: 'fp-6', latitude: 51.5100, longitude: -0.1305, riskLevel: 'medium', riverName: 'River Thames', segmentId: 'thames-2' },
  { id: 'fp-7', latitude: 51.5105, longitude: -0.1310, riskLevel: 'medium', riverName: 'River Thames', segmentId: 'thames-2' },
  { id: 'fp-8', latitude: 51.5110, longitude: -0.1315, riskLevel: 'medium', riverName: 'River Thames', segmentId: 'thames-2' },
  { id: 'fp-9', latitude: 51.5115, longitude: -0.1320, riskLevel: 'medium', riverName: 'River Thames', segmentId: 'thames-2' },
  
  // River Severn segment (High risk) - Birmingham area
  { id: 'fp-10', latitude: 52.4862, longitude: -1.8904, riskLevel: 'high', riverName: 'River Severn', segmentId: 'severn-1' },
  { id: 'fp-11', latitude: 52.4868, longitude: -1.8910, riskLevel: 'high', riverName: 'River Severn', segmentId: 'severn-1' },
  { id: 'fp-12', latitude: 52.4874, longitude: -1.8916, riskLevel: 'high', riverName: 'River Severn', segmentId: 'severn-1' },
  { id: 'fp-13', latitude: 52.4880, longitude: -1.8922, riskLevel: 'high', riverName: 'River Severn', segmentId: 'severn-1' },
  { id: 'fp-14', latitude: 52.4886, longitude: -1.8928, riskLevel: 'high', riverName: 'River Severn', segmentId: 'severn-1' },
  
  // River Trent segment (Low risk) - Nottingham area
  { id: 'fp-15', latitude: 52.9548, longitude: -1.1581, riskLevel: 'low', riverName: 'River Trent', segmentId: 'trent-1' },
  { id: 'fp-16', latitude: 52.9554, longitude: -1.1587, riskLevel: 'low', riverName: 'River Trent', segmentId: 'trent-1' },
  { id: 'fp-17', latitude: 52.9560, longitude: -1.1593, riskLevel: 'low', riverName: 'River Trent', segmentId: 'trent-1' },
  { id: 'fp-18', latitude: 52.9566, longitude: -1.1599, riskLevel: 'low', riverName: 'River Trent', segmentId: 'trent-1' },
  
  // River Clyde segment (Medium risk) - Glasgow area
  { id: 'fp-19', latitude: 55.8642, longitude: -4.2518, riskLevel: 'medium', riverName: 'River Clyde', segmentId: 'clyde-1' },
  { id: 'fp-20', latitude: 55.8648, longitude: -4.2524, riskLevel: 'medium', riverName: 'River Clyde', segmentId: 'clyde-1' },
  { id: 'fp-21', latitude: 55.8654, longitude: -4.2530, riskLevel: 'medium', riverName: 'River Clyde', segmentId: 'clyde-1' },
  { id: 'fp-22', latitude: 55.8660, longitude: -4.2536, riskLevel: 'medium', riverName: 'River Clyde', segmentId: 'clyde-1' },
  
  // River Mersey segment (High risk) - Liverpool area
  { id: 'fp-23', latitude: 53.4084, longitude: -2.9916, riskLevel: 'high', riverName: 'River Mersey', segmentId: 'mersey-1' },
  { id: 'fp-24', latitude: 53.4090, longitude: -2.9922, riskLevel: 'high', riverName: 'River Mersey', segmentId: 'mersey-1' },
  { id: 'fp-25', latitude: 53.4096, longitude: -2.9928, riskLevel: 'high', riverName: 'River Mersey', segmentId: 'mersey-1' },
  { id: 'fp-26', latitude: 53.4102, longitude: -2.9934, riskLevel: 'high', riverName: 'River Mersey', segmentId: 'mersey-1' },
  
  // River Tyne segment (Medium risk) - Newcastle area
  { id: 'fp-27', latitude: 54.9783, longitude: -1.6178, riskLevel: 'medium', riverName: 'River Tyne', segmentId: 'tyne-1' },
  { id: 'fp-28', latitude: 54.9789, longitude: -1.6184, riskLevel: 'medium', riverName: 'River Tyne', segmentId: 'tyne-1' },
  { id: 'fp-29', latitude: 54.9795, longitude: -1.6190, riskLevel: 'medium', riverName: 'River Tyne', segmentId: 'tyne-1' },
  
  // River Avon segment (Low risk) - Bristol area
  { id: 'fp-30', latitude: 51.4545, longitude: -2.5879, riskLevel: 'low', riverName: 'River Avon', segmentId: 'avon-1' },
  { id: 'fp-31', latitude: 51.4551, longitude: -2.5885, riskLevel: 'low', riverName: 'River Avon', segmentId: 'avon-1' },
  { id: 'fp-32', latitude: 51.4557, longitude: -2.5891, riskLevel: 'low', riverName: 'River Avon', segmentId: 'avon-1' },
];

// Function to generate thousands of flood points for testing clustering
export const generateMassiveFloodPoints = (): FloodPoint[] => {
  const points: FloodPoint[] = [];
  let idCounter = 1;

  // Major UK cities and their surrounding areas
  const areas = [
    { name: 'London', lat: 51.5074, lng: -0.1278, riskLevel: 'high' as const },
    { name: 'Birmingham', lat: 52.4862, lng: -1.8904, riskLevel: 'high' as const },
    { name: 'Manchester', lat: 53.4808, lng: -2.2426, riskLevel: 'medium' as const },
    { name: 'Liverpool', lat: 53.4084, lng: -2.9916, riskLevel: 'high' as const },
    { name: 'Leeds', lat: 53.8008, lng: -1.5491, riskLevel: 'medium' as const },
    { name: 'Sheffield', lat: 53.3811, lng: -1.4701, riskLevel: 'medium' as const },
    { name: 'Glasgow', lat: 55.8642, lng: -4.2518, riskLevel: 'medium' as const },
    { name: 'Edinburgh', lat: 55.9533, lng: -3.1883, riskLevel: 'low' as const },
    { name: 'Bristol', lat: 51.4545, lng: -2.5879, riskLevel: 'low' as const },
    { name: 'Newcastle', lat: 54.9783, lng: -1.6178, riskLevel: 'medium' as const },
    { name: 'Nottingham', lat: 52.9548, lng: -1.1581, riskLevel: 'low' as const },
    { name: 'Cardiff', lat: 51.4816, lng: -3.1791, riskLevel: 'medium' as const },
    { name: 'Belfast', lat: 54.5973, lng: -5.9301, riskLevel: 'medium' as const },
    { name: 'Aberdeen', lat: 57.1497, lng: -2.0943, riskLevel: 'low' as const },
    { name: 'Plymouth', lat: 50.3755, lng: -4.1427, riskLevel: 'low' as const },
  ];

  areas.forEach((area, areaIndex) => {
    // Generate 200-500 points around each major city
    const pointCount = 200 + Math.floor(Math.random() * 300);
    
    for (let i = 0; i < pointCount; i++) {
      // Random offset within ~50km radius
      const latOffset = (Math.random() - 0.5) * 0.5; // ~50km
      const lngOffset = (Math.random() - 0.5) * 0.5; // ~50km
      
      // Vary risk levels around the base risk
      const riskVariations = ['high', 'medium', 'low'] as const;
      const riskLevel = Math.random() > 0.7 ? riskVariations[Math.floor(Math.random() * 3)] : area.riskLevel;
      
      points.push({
        id: `fp-massive-${idCounter++}`,
        latitude: area.lat + latOffset,
        longitude: area.lng + lngOffset,
        riskLevel,
        riverName: `River near ${area.name}`,
        segmentId: `area-${areaIndex}`
      });
    }
  });

  return points;
};

// Use the massive dataset for testing clustering
export const mockFloodPointsMassive = generateMassiveFloodPoints();

// Group flood points into segments
export const mockFloodSegments: FloodSegment[] = [
  {
    id: 'thames-1',
    points: mockFloodPoints.filter(p => p.segmentId === 'thames-1'),
    riverName: 'River Thames',
    riskLevel: 'high'
  },
  {
    id: 'thames-2',
    points: mockFloodPoints.filter(p => p.segmentId === 'thames-2'),
    riverName: 'River Thames',
    riskLevel: 'medium'
  },
  {
    id: 'severn-1',
    points: mockFloodPoints.filter(p => p.segmentId === 'severn-1'),
    riverName: 'River Severn',
    riskLevel: 'high'
  },
  {
    id: 'trent-1',
    points: mockFloodPoints.filter(p => p.segmentId === 'trent-1'),
    riverName: 'River Trent',
    riskLevel: 'low'
  },
  {
    id: 'clyde-1',
    points: mockFloodPoints.filter(p => p.segmentId === 'clyde-1'),
    riverName: 'River Clyde',
    riskLevel: 'medium'
  },
  {
    id: 'mersey-1',
    points: mockFloodPoints.filter(p => p.segmentId === 'mersey-1'),
    riverName: 'River Mersey',
    riskLevel: 'high'
  },
  {
    id: 'tyne-1',
    points: mockFloodPoints.filter(p => p.segmentId === 'tyne-1'),
    riverName: 'River Tyne',
    riskLevel: 'medium'
  },
  {
    id: 'avon-1',
    points: mockFloodPoints.filter(p => p.segmentId === 'avon-1'),
    riverName: 'River Avon',
    riskLevel: 'low'
  }
];

// Helper functions for date and alert management
export const getAvailableDates = (): string[] => {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates.reverse();
};

export const getAlertCounts = (alerts: FloodAlert[], selectedDate: string) => {
  const dateAlerts = alerts.filter(alert => alert.date === selectedDate);
  
  return {
    high: dateAlerts.filter(alert => alert.riskLevel === 'high').length,
    medium: dateAlerts.filter(alert => alert.riskLevel === 'medium').length,
    low: dateAlerts.filter(alert => alert.riskLevel === 'low').length
  };
}; 