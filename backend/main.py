from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict
from config.database import connect_to_mongo
from schemas.significant_flood_point import SignificantFloodPoint, FloodCluster
from services.clustering_service import GeohashClusteringService

app = FastAPI()

# Add CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_db_client():
    connect_to_mongo()

@app.get("/")
def read_root():
    return {"message": "Flood Risk Dashboard Backend is running"}

@app.get("/api/flood-points")
async def get_flood_points(
    limit: int = Query(default=1000, le=10000, description="Number of points to return (max 10000)"),
    skip: int = Query(default=0, description="Number of points to skip"),
    min_forecast: Optional[float] = Query(default=None, description="Minimum forecast value filter"),
    max_forecast: Optional[float] = Query(default=None, description="Maximum forecast value filter"),
    time: Optional[str] = Query(default=None, description="Filter by specific date (YYYY-MM-DD)"),
    north: Optional[float] = Query(default=None, description="North boundary"),
    south: Optional[float] = Query(default=None, description="South boundary"),
    east: Optional[float] = Query(default=None, description="East boundary"),
    west: Optional[float] = Query(default=None, description="West boundary")
):
    """Get flood points with pagination and filtering"""
    try:
        # Build query filters
        query_filters = {}
        
        if min_forecast is not None:
            query_filters['forecast_value__gte'] = min_forecast
            
        if max_forecast is not None:
            query_filters['forecast_value__lte'] = max_forecast
            
        if time:
            query_filters['time'] = time
        
        # Add bounding box filter if provided
        if all(coord is not None for coord in [north, south, east, west]):
            query_filters['lat__gte'] = south
            query_filters['lat__lte'] = north
            query_filters['lon__gte'] = west
            query_filters['lon__lte'] = east
        
        # Execute query with pagination
        points = SignificantFloodPoint.objects(**query_filters).skip(skip).limit(limit)
        
        # Convert to list of dictionaries
        result = []
        for point in points:
            result.append({
                'id': str(point.id),
                'time': point.time,
                'lat': point.lat,
                'lon': point.lon,
                'forecast_value': point.forecast_value,
                'return_period': point.return_period
            })
        
        # Get total count for pagination info
        total_count = SignificantFloodPoint.objects(**query_filters).count()
        
        return {
            "points": result,
            "total": total_count,
            "limit": limit,
            "skip": skip,
            "has_more": (skip + limit) < total_count
        }
        
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/flood-clusters")
async def get_flood_clusters(
    zoom_level: int = Query(..., ge=0, le=20, description="Zoom level (0-20)"),
    time: Optional[str] = Query(default=None, description="Filter by specific date (YYYY-MM-DD)"),
    north: Optional[float] = Query(default=None, description="North boundary"),
    south: Optional[float] = Query(default=None, description="South boundary"),
    east: Optional[float] = Query(default=None, description="East boundary"),
    west: Optional[float] = Query(default=None, description="West boundary"),
    risk_level: Optional[str] = Query(default=None, description="Filter by risk level (low, medium, high, extreme)"),
    parent_geohash: Optional[str] = Query(default=None, description="Parent cluster geohash to get sub-clusters")
):
    """Get clustered flood data for a specific zoom level and viewport"""
    try:
        # If parent_geohash is provided, use the sub-clustering method
        if parent_geohash:
            clustering_service = GeohashClusteringService()
            result = clustering_service.get_sub_clusters(
                parent_geohash=parent_geohash,
                parent_zoom_level=zoom_level - 1,  # Parent was at previous zoom level
                child_zoom_level=zoom_level,
                time=time
            )
            
            # Apply additional filters if provided
            if risk_level:
                result = [cluster for cluster in result if cluster['risk_level'] == risk_level]
            
            return {
                "clusters": result,
                "total": len(result),
                "zoom_level": zoom_level,
                "parent_geohash": parent_geohash
            }
        
        # Build query filters for regular clustering
        query_filters = {'zoom_level': zoom_level}
        
        if time:
            query_filters['time'] = time
            
        if risk_level:
            query_filters['risk_level'] = risk_level
        
        # Add bounding box filter if provided
        bounds = None
        if all(coord is not None for coord in [north, south, east, west]):
            bounds = {
                'north': north,
                'south': south,
                'east': east,
                'west': west
            }
            query_filters['center_lat__gte'] = south
            query_filters['center_lat__lte'] = north
            query_filters['center_lon__gte'] = west
            query_filters['center_lon__lte'] = east
        
        # Execute query
        clusters = FloodCluster.objects(**query_filters)
        
        # Convert to list of dictionaries
        result = []
        for cluster in clusters:
            result.append({
                'id': str(cluster.id),
                'zoom_level': cluster.zoom_level,
                'geohash': cluster.geohash,
                'lat': cluster.center_lat,
                'lon': cluster.center_lon,
                'time': cluster.time,
                'point_count': cluster.point_count,
                'avg_forecast': cluster.avg_forecast,
                'max_forecast': cluster.max_forecast,
                'min_forecast': cluster.min_forecast,
                'risk_level': cluster.risk_level
            })
        
        # Get total count
        total_count = FloodCluster.objects(**query_filters).count()
        
        return {
            "clusters": result,
            "total": total_count,
            "zoom_level": zoom_level,
            "bounds": bounds
        }
        
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/flood-clusters/sub-clusters")
async def get_sub_clusters(
    parent_geohash: str = Query(..., description="Parent cluster geohash"),
    parent_zoom_level: int = Query(..., ge=0, le=19, description="Parent zoom level (0-19)"),
    child_zoom_level: int = Query(..., ge=1, le=20, description="Child zoom level (1-20)"),
    time: Optional[str] = Query(default=None, description="Filter by specific date (YYYY-MM-DD)"),
    risk_level: Optional[str] = Query(default=None, description="Filter by risk level (low, medium, high, extreme)")
):
    """Get sub-clusters within a parent cluster's bounds"""
    try:
        if child_zoom_level <= parent_zoom_level:
            return {"error": "Child zoom level must be greater than parent zoom level"}
        
        clustering_service = GeohashClusteringService()
        result = clustering_service.get_sub_clusters(
            parent_geohash=parent_geohash,
            parent_zoom_level=parent_zoom_level,
            child_zoom_level=child_zoom_level,
            time=time
        )
        
        # Apply risk level filter if provided
        if risk_level:
            result = [cluster for cluster in result if cluster['risk_level'] == risk_level]
        
        return {
            "clusters": result,
            "total": len(result),
            "parent_geohash": parent_geohash,
            "parent_zoom_level": parent_zoom_level,
            "child_zoom_level": child_zoom_level
        }
        
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/generate-clusters")
async def generate_clusters_endpoint(
    time: Optional[str] = None
):
    """Generate clustered data for all zoom levels"""
    try:
        clustering_service = GeohashClusteringService()
        clustering_service.generate_all_zoom_clusters(time)
        
        return {
            "message": "Clusters generated successfully",
            "time": time or "all times"
        }
        
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/flood-points/summary")
async def get_flood_points_summary():
    """Get summary statistics for the GLOBAL flood points."""
    try:
        total_count = SignificantFloodPoint.objects.count()
        unique_dates = SignificantFloodPoint.objects.distinct('time')
        
        # --- NEW: Aggregation pipeline to count by return_period ---
        pipeline = [
            {"$group": {"_id": "$return_period", "count": {"$sum": 1}}}
        ]
        risk_breakdown_raw = list(SignificantFloodPoint.objects.aggregate(pipeline))
        
        # Convert the result into a simple dictionary
        risk_breakdown = {item['_id']: item['count'] for item in risk_breakdown_raw}

        return {
            "total_points": total_count,
            "unique_dates": sorted(unique_dates),
            "risk_breakdown": risk_breakdown # e.g., {"20-year": 123, "5-year": 456}
        }
    except Exception as e:
        return {"error": str(e)}
# @app.get("/api/flood-points/summary")
# async def get_flood_points_summary():
#     """Get summary statistics for flood points"""
#     try:
#         total_count = SignificantFloodPoint.objects.count()
        
#         # Get min/max forecast values
#         min_forecast = SignificantFloodPoint.objects.order_by('forecast_value').first()
#         max_forecast = SignificantFloodPoint.objects.order_by('-forecast_value').first()
        
#         # Get unique dates
#         unique_dates = SignificantFloodPoint.objects.distinct('time')
        
#         return {
#             "total_points": total_count,
#             "min_forecast": min_forecast.forecast_value if min_forecast else 0,
#             "max_forecast": max_forecast.forecast_value if max_forecast else 0,
#             "unique_dates": sorted(unique_dates),
#             "date_count": len(unique_dates)
#         }
        
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/flood-clusters/summary")
async def get_flood_clusters_summary():
    """Get summary statistics for flood clusters"""
    try:
        total_clusters = FloodCluster.objects.count()
        
        # Get breakdown by zoom level
        zoom_breakdown = {}
        for zoom_level in range(21):
            count = FloodCluster.objects(zoom_level=zoom_level).count()
            if count > 0:
                zoom_breakdown[zoom_level] = count
        
        # Get breakdown by risk level
        risk_breakdown = {}
        for risk_level in ['low', 'medium', 'high', 'extreme']:
            count = FloodCluster.objects(risk_level=risk_level).count()
            if count > 0:
                risk_breakdown[risk_level] = count
        
        # Get unique dates
        unique_dates = FloodCluster.objects.distinct('time')
        
        return {
            "total_clusters": total_clusters,
            "zoom_breakdown": zoom_breakdown,
            "risk_breakdown": risk_breakdown,
            "unique_dates": sorted(unique_dates),
            "date_count": len(unique_dates)
        }
        
    except Exception as e:
        return {"error": str(e)} 