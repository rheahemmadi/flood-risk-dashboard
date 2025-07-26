import { FloodService, FloodPoint, FloodPointsSummary, ViewportBounds, FloodCluster } from '@/lib/services/floodService';

// Frontend flood point type (after conversion)
interface ConvertedFloodPoint {
  id: string;
  latitude: number;
  longitude: number;
  riskLevel: 'high' | 'medium' | 'low';
  riverName: string;
  segmentId: string;
}

// Quantization utilities for map bounds
const quantizeBounds = (bounds: ViewportBounds, zoomLevel?: number): ViewportBounds => {
  // Determine precision based on zoom level (higher zoom = more precision)
  // At low zoom levels, we want larger buckets; at high zoom, smaller buckets  
  const getPrecision = (zoom?: number): number => {
    if (!zoom) return 3; // Default precision
    if (zoom <= 5) return 2;   // Large regions
    if (zoom <= 10) return 3;  // Medium regions  
    if (zoom <= 15) return 4;  // Detailed regions
    return 5; // Very detailed
  };

  const precision = getPrecision(zoomLevel);
  const factor = Math.pow(10, precision);

  return {
    north: Math.ceil(bounds.north * factor) / factor,
    south: Math.floor(bounds.south * factor) / factor,
    east: Math.ceil(bounds.east * factor) / factor,
    west: Math.floor(bounds.west * factor) / factor
  };
};

// Check if bounds1 contains bounds2 (for hierarchical cache lookups)
const boundsContains = (larger: ViewportBounds, smaller: ViewportBounds): boolean => {
  return (
    larger.north >= smaller.north &&
    larger.south <= smaller.south &&
    larger.east >= smaller.east &&
    larger.west <= smaller.west
  );
};

// Check if bounds overlap significantly (>50% overlap)
const boundsOverlapSignificantly = (bounds1: ViewportBounds, bounds2: ViewportBounds): boolean => {
  const overlapNorth = Math.min(bounds1.north, bounds2.north);
  const overlapSouth = Math.max(bounds1.south, bounds2.south);
  const overlapEast = Math.min(bounds1.east, bounds2.east);
  const overlapWest = Math.max(bounds1.west, bounds2.west);

  if (overlapNorth <= overlapSouth || overlapEast <= overlapWest) {
    return false; // No overlap
  }

  const overlapArea = (overlapNorth - overlapSouth) * (overlapEast - overlapWest);
  const bounds1Area = (bounds1.north - bounds1.south) * (bounds1.east - bounds1.west);
  const bounds2Area = (bounds2.north - bounds2.south) * (bounds2.east - bounds2.west);
  
  const overlapRatio1 = overlapArea / bounds1Area;
  const overlapRatio2 = overlapArea / bounds2Area;
  
  return Math.max(overlapRatio1, overlapRatio2) > 0.5; // 50% overlap threshold
};

// LRU Cache implementation with hierarchical zoom-out support
class LRUCache<T> {
  private capacity: number;
  private cache: Map<string, { value: T; timestamp: number; metadata?: any }>;

  constructor(capacity: number = 50) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  private generateKey(method: string, params: any): string {
    // Create a stable cache key from method name and parameters
    const paramsObj = params || {};
    
    // Quantize bounds if present to create cache buckets
    const processedParams = { ...paramsObj };
    if (processedParams.bounds) {
      processedParams.bounds = quantizeBounds(
        processedParams.bounds, 
        processedParams.zoomLevel
      );
    }
    
    // Create a stable string representation
    const keys = Object.keys(processedParams).sort();
    const sortedData: Record<string, any> = {};
    keys.forEach(key => {
      sortedData[key] = processedParams[key];
    });
    return `${method}:${JSON.stringify(sortedData)}`;
  }

  get(method: string, params: any): T | null {
    const key = this.generateKey(method, params);
    const cached = this.cache.get(key);
    
    if (cached) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, { ...cached, timestamp: Date.now() });
      return cached.value;
    }
    
    // If no exact match and this is a viewport-based request, try hierarchical lookup
    if (params.bounds && params.zoomLevel !== undefined) {
      return this.findHierarchicalMatch(method, params);
    }
    
    return null;
  }

  private findHierarchicalMatch(method: string, params: any): T | null {
    const targetBounds = params.bounds;
    const targetZoom = params.zoomLevel;
    
    // Look for cached data that might be suitable for zoom-out scenarios
    for (const [cachedKey, cachedEntry] of this.cache.entries()) {
      if (!cachedKey.startsWith(`${method}:`)) continue;
      
      const cachedMetadata = cachedEntry.metadata;
      if (!cachedMetadata || !cachedMetadata.bounds || cachedMetadata.zoomLevel === undefined) continue;
      
      const cachedBounds = cachedMetadata.bounds;
      const cachedZoom = cachedMetadata.zoomLevel;
      
      // For zoom-out: Check if cached data from higher zoom can be used
      // We want cached data that overlaps significantly with our target area
      if (cachedZoom > targetZoom && boundsOverlapSignificantly(targetBounds, cachedBounds)) {
        // Move to end (mark as recently used)
        this.cache.delete(cachedKey);
        this.cache.set(cachedKey, { ...cachedEntry, timestamp: Date.now() });
        return cachedEntry.value;
      }
      
      // For zoom-in: Check if we have data for a larger area that contains our target
      if (cachedZoom < targetZoom && boundsContains(cachedBounds, targetBounds)) {
        // Move to end (mark as recently used)
        this.cache.delete(cachedKey);
        this.cache.set(cachedKey, { ...cachedEntry, timestamp: Date.now() });
        return cachedEntry.value;
      }
    }
    
    return null;
  }

  set(method: string, params: any, value: T): void {
    const key = this.generateKey(method, params);
    
    // Remove oldest entries if at capacity
    if (this.cache.size >= this.capacity && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    // Store metadata for hierarchical lookups
    const metadata = params.bounds ? {
      bounds: params.bounds, // Store original bounds, not quantized
      zoomLevel: params.zoomLevel,
      time: params.time
    } : undefined;
    
    this.cache.set(key, { value, timestamp: Date.now(), metadata });
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean entries older than maxAge (in milliseconds)
  cleanup(maxAge: number = 5 * 60 * 1000): void { // Default 5 minutes
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > maxAge) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      capacity: this.capacity,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Global cache instances
const floodDataCache = new LRUCache<any>(100); // Larger cache for map data
const summaryCache = new LRUCache<any>(10);   // Smaller cache for summary data

// Cache cleanup interval (every 5 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    floodDataCache.cleanup();
    summaryCache.cleanup();
  }, 5 * 60 * 1000);
}

// Generic cached fetch wrapper
async function cachedFetch<T>(
  cache: LRUCache<T>,
  method: string,
  params: any,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get(method, params);
  if (cached) {
    return cached;
  }

  // Fetch and cache the result
  try {
    const result = await fetchFn();
    cache.set(method, params, result);
    return result;
  } catch (error) {
    console.error(`Error fetching ${method}:`, error);
    throw error;
  }
}

// Convert backend flood points to frontend format
export const convertToFloodPoint = (point: FloodPoint) => ({
  id: point.id,
  latitude: point.lat,
  longitude: point.lon,
  riskLevel: getRiskLevel(point.forecast_value),
  riverName: `Flood Point ${point.id}`,
  segmentId: `segment-${point.id}`
});

// Convert backend flood clusters to frontend format
export const convertToFloodCluster = (cluster: FloodCluster) => ({
  id: cluster.id,
  zoomLevel: cluster.zoom_level,
  geohash: cluster.geohash,
  latitude: cluster.lat,
  longitude: cluster.lon,
  time: cluster.time,
  pointCount: cluster.point_count,
  avgForecast: cluster.avg_forecast,
  maxForecast: cluster.max_forecast,
  minForecast: cluster.min_forecast,
  riskLevel: cluster.risk_level
});

// Determine risk level based on forecast value
const getRiskLevel = (forecastValue: number): 'high' | 'medium' | 'low' => {
  if (forecastValue >= 5.0) return 'high';
  if (forecastValue >= 2.0) return 'medium';
  return 'low';
};

// Cached fetch flood points from backend
export const fetchFloodPoints = async (limit: number = 1000) => {
  return cachedFetch(
    floodDataCache,
    'fetchFloodPoints',
    { limit },
    async () => {
      const response = await FloodService.getFloodPoints({ limit });
      return response.points.map(convertToFloodPoint);
    }
  );
};

// Cached fetch flood points with viewport bounds
export const fetchFloodPointsForViewport = async (
  bounds: ViewportBounds,
  limit: number = 1000,
  time?: string,
  zoomLevel?: number
) => {
  return cachedFetch(
    floodDataCache,
    'fetchFloodPointsForViewport',
    { bounds, limit, time, zoomLevel },
    async () => {
      const response = await FloodService.getFloodPoints({ bounds, limit, time });
      return response.points.map(convertToFloodPoint);
    }
  );
};

// Cached fetch flood clusters for viewport
export const fetchFloodClustersForViewport = async (
  zoomLevel: number,
  bounds: ViewportBounds,
  time?: string
) => {
  return cachedFetch(
    floodDataCache,
    'fetchFloodClustersForViewport',
    { zoomLevel, bounds, time },
    async () => {
      const clusters = await FloodService.getClustersForViewport(zoomLevel, bounds, time);
      return clusters.map(convertToFloodCluster);
    }
  );
};

// Cached fetch flood points summary
export const fetchFloodPointsSummary = async (): Promise<FloodPointsSummary | null> => {
  return cachedFetch(
    summaryCache,
    'fetchFloodPointsSummary',
    {},
    async () => {
      return await FloodService.getFloodPointsSummary();
    }
  );
};

// Cached fetch flood points by date
export const fetchFloodPointsByDate = async (date: string, limit: number = 1000) => {
  return cachedFetch(
    floodDataCache,
    'fetchFloodPointsByDate',
    { date, limit },
    async () => {
      const points = await FloodService.getFloodPointsByDate(date, limit);
      return points.map(convertToFloodPoint);
    }
  );
};

// Cached fetch high-risk flood points
export const fetchHighRiskFloodPoints = async (threshold: number = 5.0, limit: number = 1000) => {
  return cachedFetch(
    floodDataCache,
    'fetchHighRiskFloodPoints',
    { threshold, limit },
    async () => {
      const points = await FloodService.getHighRiskPoints(threshold, limit);
      return points.map(convertToFloodPoint);
    }
  );
};

// Cached fetch high-risk flood points for viewport
export const fetchHighRiskFloodPointsForViewport = async (
  bounds: ViewportBounds,
  threshold: number = 5.0,
  limit: number = 1000,
  time?: string,
  zoomLevel?: number
) => {
  return cachedFetch(
    floodDataCache,
    'fetchHighRiskFloodPointsForViewport',
    { bounds, threshold, limit, time, zoomLevel },
    async () => {
      const response = await FloodService.getFloodPoints({ 
        bounds, 
        limit, 
        time, 
        min_forecast: threshold 
      });
      return response.points.map(convertToFloodPoint);
    }
  );
};

// Get available dates from summary (cached)
export const getAvailableDates = async (): Promise<string[]> => {
  try {
    const summary = await fetchFloodPointsSummary();
    return summary?.unique_dates || [];
  } catch (error) {
    console.error('Error fetching available dates:', error);
    return [];
  }
};

// Get alert counts for a specific date (cached)
export const getAlertCounts = async (selectedDate: string) => {
  return cachedFetch(
    floodDataCache,
    'getAlertCounts',
    { selectedDate },
    async () => {
      const points = await fetchFloodPointsByDate(selectedDate);
      
      return {
        high: points.filter((point: ConvertedFloodPoint) => point.riskLevel === 'high').length,
        medium: points.filter((point: ConvertedFloodPoint) => point.riskLevel === 'medium').length,
        low: points.filter((point: ConvertedFloodPoint) => point.riskLevel === 'low').length
      };
    }
  );
};

// Cache management utilities
export const cacheUtils = {
  // Clear all caches
  clearAll: () => {
    floodDataCache.clear();
    summaryCache.clear();
  },
  
  // Clear only flood data cache (keep summary cache)
  clearFloodData: () => {
    floodDataCache.clear();
  },
  
  // Get cache statistics
  getStats: () => ({
    floodData: floodDataCache.getStats(),
    summary: summaryCache.getStats()
  }),
  
  // Manual cleanup of old entries
  cleanup: () => {
    floodDataCache.cleanup();
    summaryCache.cleanup();
  }
};

// Export for debugging purposes
export { floodDataCache, summaryCache }; 