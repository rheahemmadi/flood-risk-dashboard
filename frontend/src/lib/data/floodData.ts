import { FloodService, FloodCluster, ViewportBounds } from '@/lib/services/floodService';

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

  // Check if there's actually an overlap
  if (overlapNorth <= overlapSouth || overlapEast <= overlapWest) {
    return false;
  }

  // Calculate overlap area
  const overlapArea = (overlapNorth - overlapSouth) * (overlapEast - overlapWest);
  
  // Calculate areas of both bounds
  const area1 = (bounds1.north - bounds1.south) * (bounds1.east - bounds1.west);
  const area2 = (bounds2.north - bounds2.south) * (bounds2.east - bounds2.west);
  
  // Check if overlap is >50% of either area
  return overlapArea > 0.5 * Math.min(area1, area2);
};

// Simple cache implementation
class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private maxAge = 5 * 60 * 1000; // 5 minutes
  private maxSize = 50; // Maximum number of cached items

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: T): void {
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Create cache instance
const floodDataCache = new SimpleCache<any>();

// Generic cached fetch function
async function cachedFetch<T>(
  cache: SimpleCache<T>,
  operation: string,
  params: Record<string, any>,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Create cache key from operation and params
  const processedParams = { ...params };
  
  // Quantize bounds if present for better cache hits
  if (processedParams.bounds && processedParams.zoomLevel) {
    processedParams.bounds = quantizeBounds(
      processedParams.bounds as ViewportBounds, 
      processedParams.zoomLevel as number
    );
  }
  
  const cacheKey = `${operation}:${JSON.stringify(processedParams)}`;
  
  // Try to get from cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Enhanced cache lookup for viewport-based queries
  if (operation.includes('Viewport') && processedParams.bounds && processedParams.zoomLevel) {
    const targetBounds = processedParams.bounds as ViewportBounds;
    const targetZoom = processedParams.zoomLevel as number;
    
    // Look for cached data that could satisfy this request
    for (const [key, entry] of (cache as any).cache.entries()) {
      if (!key.startsWith(operation)) continue;
      
      try {
        const keyParts = key.split(':');
        if (keyParts.length < 2) continue;
        const cachedParams = JSON.parse(keyParts[1]);
        if (!cachedParams.bounds || !cachedParams.zoomLevel) continue;
        
        const cachedBounds = cachedParams.bounds as ViewportBounds;
        const cachedZoom = cachedParams.zoomLevel as number;
        
        // If cached data has higher zoom level and overlaps significantly, we can use it
        if (cachedZoom > targetZoom && boundsOverlapSignificantly(targetBounds, cachedBounds)) {
          console.log('Cache hit: Using higher zoom data for lower zoom request');
          return entry.data;
        }
        
        // If cached data has lower zoom level and contains our bounds, we can use it
        if (cachedZoom < targetZoom && boundsContains(cachedBounds, targetBounds)) {
          console.log('Cache hit: Using lower zoom data for higher zoom request');
          return entry.data;
        }
      } catch (e) {
        // Skip malformed cache entries
        continue;
      }
    }
  }
  
  // Fetch fresh data
  const data = await fetchFn();
  cache.set(cacheKey, data);
  return data;
}

// Convert FloodCluster to frontend format
export const convertToFloodCluster = (cluster: FloodCluster) => ({
  id: cluster.id,
  lat: cluster.lat,
  lon: cluster.lon,
  count: cluster.point_count,
  risk_level: cluster.risk_level,
  avg_forecast: cluster.avg_forecast,
  max_forecast: cluster.max_forecast,
  min_forecast: cluster.min_forecast,
  zoom_level: cluster.zoom_level,
  time: cluster.time
});

// Cached fetch flood clusters for viewport
export const fetchFloodClustersForViewport = async (
  zoomLevel: number,
  bounds: ViewportBounds,
  time?: string,
  riskLevel?: 'low' | 'medium' | 'high' | 'extreme'
) => {
  return cachedFetch(
    floodDataCache,
    'fetchFloodClustersForViewport',
    { zoomLevel, bounds, time, riskLevel },
    async () => {
      const response = await FloodService.getFloodClusters({
        zoom_level: zoomLevel,
        bounds,
        time,
        risk_level: riskLevel
      });
      return response.clusters.map(convertToFloodCluster);
    }
  );
};