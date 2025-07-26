const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface FloodPoint {
  id: string;
  time: string;
  lat: number;
  lon: number;
  forecast_value: number;
}

export interface FloodCluster {
  id: string;
  zoom_level: number;
  geohash: string;
  lat: number;
  lon: number;
  time: string;
  point_count: number;
  avg_forecast: number;
  max_forecast: number;
  min_forecast: number;
  risk_level: 'low' | 'medium' | 'high' | 'extreme';
}

export interface FloodPointsResponse {
  points: FloodPoint[];
  total: number;
  limit: number;
  skip: number;
  has_more: boolean;
}

export interface FloodClustersResponse {
  clusters: FloodCluster[];
  total: number;
  zoom_level: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface FloodPointsSummary {
  total_points: number;
  min_forecast: number;
  max_forecast: number;
  unique_dates: string[];
  date_count: number;
}

export interface FloodClustersSummary {
  total_clusters: number;
  zoom_breakdown: Record<number, number>;
  risk_breakdown: Record<string, number>;
  unique_dates: string[];
  date_count: number;
}

export interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export class FloodService {
  static async getFloodPoints(params: {
    limit?: number;
    skip?: number;
    min_forecast?: number;
    max_forecast?: number;
    time?: string;
    bounds?: ViewportBounds;
  } = {}): Promise<FloodPointsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.skip) searchParams.append('skip', params.skip.toString());
    if (params.min_forecast) searchParams.append('min_forecast', params.min_forecast.toString());
    if (params.max_forecast) searchParams.append('max_forecast', params.max_forecast.toString());
    if (params.time) searchParams.append('time', params.time);
    
    // Add bounding box parameters if provided
    if (params.bounds) {
      searchParams.append('north', params.bounds.north.toString());
      searchParams.append('south', params.bounds.south.toString());
      searchParams.append('east', params.bounds.east.toString());
      searchParams.append('west', params.bounds.west.toString());
    }

    const response = await fetch(`${API_BASE_URL}/api/flood-points?${searchParams}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch flood points: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async getFloodClusters(params: {
    zoom_level: number;
    time?: string;
    bounds?: ViewportBounds;
    risk_level?: 'low' | 'medium' | 'high' | 'extreme';
  }): Promise<FloodClustersResponse> {
    const searchParams = new URLSearchParams();
    
    searchParams.append('zoom_level', params.zoom_level.toString());
    if (params.time) searchParams.append('time', params.time);
    if (params.risk_level) searchParams.append('risk_level', params.risk_level);
    
    // Add bounding box parameters if provided
    if (params.bounds) {
      searchParams.append('north', params.bounds.north.toString());
      searchParams.append('south', params.bounds.south.toString());
      searchParams.append('east', params.bounds.east.toString());
      searchParams.append('west', params.bounds.west.toString());
    }

    const response = await fetch(`${API_BASE_URL}/api/flood-clusters?${searchParams}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch flood clusters: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async getFloodPointsSummary(): Promise<FloodPointsSummary> {
    const response = await fetch(`${API_BASE_URL}/api/flood-points/summary`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch flood points summary: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async getFloodClustersSummary(): Promise<FloodClustersSummary> {
    const response = await fetch(`${API_BASE_URL}/api/flood-clusters/summary`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch flood clusters summary: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async generateClusters(time?: string): Promise<{ message: string; time: string }> {
    const searchParams = new URLSearchParams();
    if (time) searchParams.append('time', time);

    const response = await fetch(`${API_BASE_URL}/api/generate-clusters?${searchParams}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate clusters: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Helper method to get all points with pagination
  static async getAllFloodPoints(batchSize: number = 1000): Promise<FloodPoint[]> {
    const allPoints: FloodPoint[] = [];
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getFloodPoints({ limit: batchSize, skip });
      allPoints.push(...response.points);
      hasMore = response.has_more;
      skip += batchSize;
    }

    return allPoints;
  }

  // Helper method to get points for a specific date
  static async getFloodPointsByDate(date: string, limit: number = 1000): Promise<FloodPoint[]> {
    const response = await this.getFloodPoints({ time: date, limit });
    return response.points;
  }

  // Helper method to get high-risk points (above threshold)
  static async getHighRiskPoints(threshold: number = 5.0, limit: number = 1000): Promise<FloodPoint[]> {
    const response = await this.getFloodPoints({ min_forecast: threshold, limit });
    return response.points;
  }

  // Helper method to get clusters for a specific zoom level and viewport
  static async getClustersForViewport(
    zoomLevel: number, 
    bounds: ViewportBounds, 
    time?: string
  ): Promise<FloodCluster[]> {
    const response = await this.getFloodClusters({
      zoom_level: zoomLevel,
      bounds,
      time
    });
    return response.clusters;
  }

  // Helper method to get clusters for a specific risk level
  static async getClustersByRiskLevel(
    zoomLevel: number,
    riskLevel: 'low' | 'medium' | 'high' | 'extreme',
    time?: string
  ): Promise<FloodCluster[]> {
    const response = await this.getFloodClusters({
      zoom_level: zoomLevel,
      risk_level: riskLevel,
      time
    });
    return response.clusters;
  }
} 