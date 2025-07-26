# Flood Data Clustering System

## Overview

This system handles large flood datasets (300k+ points) efficiently by implementing server-side clustering based on zoom levels. Instead of loading all individual points, the system pre-computes aggregated clusters for different zoom levels, dramatically improving performance.

## How It Works

### 1. **Geohash-Based Clustering**
- Uses geohash encoding to group nearby points into spatial clusters
- Different precision levels for different zoom levels
- Higher zoom = higher precision = smaller clusters = more detail

### 2. **Zoom Level Resolution**
- **Zoom 0-5**: Continent/Country level (~100-500 clusters)
- **Zoom 6-10**: Region/City level (~1k-10k clusters)  
- **Zoom 11-15**: District/Neighborhood level (~10k-100k clusters)
- **Zoom 16+**: Street/Building level (individual points)

### 3. **Data Aggregation**
Each cluster contains:
- **Center coordinates** (average of all points in cluster)
- **Point count** (number of individual points)
- **Risk statistics** (min, max, average forecast values)
- **Risk level** (low, medium, high, extreme)

## Setup Instructions

### 1. **Import Raw Data**
```bash
cd backend
python scripts/import_csv.py
```

### 2. **Generate Clusters**
```bash
# Generate clusters for all dates
python scripts/generate_clusters.py

# Generate clusters for specific date
python scripts/generate_clusters.py --time 2025-06-26
```

### 3. **Start Backend Server**
```bash
cd backend
uvicorn main:app --reload
```

## API Endpoints

### Get Clustered Data
```
GET /api/flood-clusters?zoom_level=5&time=2025-06-26&north=60&south=40&east=20&west=-10
```

**Parameters:**
- `zoom_level` (required): 0-20
- `time` (optional): Specific date (YYYY-MM-DD)
- `north/south/east/west` (optional): Bounding box
- `risk_level` (optional): low, medium, high, extreme

### Generate Clusters
```
POST /api/generate-clusters?time=2025-06-26
```

### Get Cluster Summary
```
GET /api/flood-clusters/summary
```

## Frontend Integration

### Using ClusteredFloodMap Component
```tsx
import ClusteredFloodMap from '@/components/ClusteredFloodMap';

<ClusteredFloodMap
  selectedDate="2025-06-26"
  selectedRiskLevel="high"
  className="h-96 w-full"
/>
```

### Using FloodService
```tsx
import { FloodService } from '@/lib/services/floodService';

// Get clusters for viewport
const clusters = await FloodService.getClustersForViewport(
  zoomLevel,
  { north: 60, south: 40, east: 20, west: -10 },
  "2025-06-26"
);

// Get clusters by risk level
const highRiskClusters = await FloodService.getClustersByRiskLevel(
  zoomLevel,
  "high",
  "2025-06-26"
);
```

## Performance Benefits

### Before Clustering
- **300k individual points** loaded for Europe
- **Slow rendering** and interaction
- **High memory usage**
- **Poor user experience**

### After Clustering
- **~500-1000 clusters** for continent view (zoom 0-5)
- **~1k-10k clusters** for country view (zoom 6-10)
- **Fast rendering** and smooth interaction
- **Low memory usage**
- **Excellent user experience**

## Database Schema

### SignificantFloodPoint (Raw Data)
```python
{
  "time": "2025-06-26",
  "lat": 52.5200,
  "lon": 13.4050,
  "forecast_value": 0.75
}
```

### FloodCluster (Aggregated Data)
```python
{
  "zoom_level": 5,
  "geohash": "u33",
  "center_lat": 52.5200,
  "center_lon": 13.4050,
  "time": "2025-06-26",
  "point_count": 156,
  "avg_forecast": 0.68,
  "max_forecast": 0.95,
  "min_forecast": 0.45,
  "risk_level": "high"
}
```

## Risk Level Thresholds

- **Low**: 0.0 - 0.3
- **Medium**: 0.3 - 0.6
- **High**: 0.6 - 0.8
- **Extreme**: 0.8 - 1.0

## Maintenance

### Regenerating Clusters
When new data is imported, regenerate clusters:
```bash
python scripts/generate_clusters.py
```

### Monitoring Performance
Check cluster statistics:
```bash
curl http://localhost:8000/api/flood-clusters/summary
```

## Troubleshooting

### Common Issues

1. **No clusters showing**: Run `generate_clusters.py` first
2. **Slow cluster generation**: Process runs once, then cached
3. **Memory issues**: Clusters are much smaller than raw data
4. **Zoom level issues**: Ensure zoom level is 0-20

### Performance Tips

1. **Use appropriate zoom levels** for your use case
2. **Filter by bounding box** for large areas
3. **Filter by risk level** to focus on important data
4. **Cache cluster data** in frontend for better UX

## Future Enhancements

1. **Real-time clustering** for new data
2. **Advanced clustering algorithms** (DBSCAN, K-means)
3. **Time-series clustering** for temporal patterns
4. **Custom risk thresholds** per region
5. **Cluster heatmaps** for better visualization 