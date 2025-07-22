import type { Coordinates, GloFASAlert, RiskLevel, InundationData } from '../types';

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Find nearest neighbor for Google Flood Hub integration
export function findNearestGauge(
  alertCoordinates: Coordinates, 
  gauges: InundationData[], 
  maxDistance: number = 50 // km
): InundationData | null {
  let nearest: InundationData | null = null;
  let minDistance = maxDistance;

  for (const gauge of gauges) {
    const distance = calculateDistance(alertCoordinates, gauge.coordinates);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = gauge;
    }
  }

  return nearest;
}

// Get risk level color for UI
export function getRiskLevelColor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'red':
      return '#ef4444';
    case 'amber':
      return '#f59e0b';
    case 'green':
      return '#10b981';
    default:
      return '#6b7280';
  }
}

// Get risk level label
export function getRiskLevelLabel(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'red':
      return 'High Risk';
    case 'amber':
      return 'Medium Risk';
    case 'green':
      return 'Low Risk';
    default:
      return 'Unknown';
  }
}

// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Generate mock data for development
export function generateMockAlerts(count: number = 50): GloFASAlert[] {
  const alerts: GloFASAlert[] = [];
  const riskLevels: RiskLevel[] = ['red', 'amber', 'green'];
  const trends = ['rising', 'falling', 'stable'];
  const returnPeriods = [5, 10, 20, 50];

  for (let i = 0; i < count; i++) {
    const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
    const trend = trends[Math.floor(Math.random() * trends.length)] as 'rising' | 'falling' | 'stable';
    const returnPeriod = returnPeriods[Math.floor(Math.random() * returnPeriods.length)];

    alerts.push({
      id: `alert-${i + 1}`,
      coordinates: {
        lat: 20 + Math.random() * 50, // Roughly between 20-70 degrees latitude
        lng: -180 + Math.random() * 360 // Full longitude range
      },
      riskLevel,
      returnPeriod,
      forecastDate: new Date(Date.now() + Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
      trend,
      dischargeValue: 100 + Math.random() * 1000,
      thresholdValue: 50 + Math.random() * 500
    });
  }

  return alerts;
}

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for map interactions
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
} 