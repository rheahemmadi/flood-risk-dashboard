from mongoengine import Document, StringField, FloatField, IntField, ListField, DictField
from datetime import datetime

class SignificantFloodPoint(Document):
    time = StringField(required=True)  # ISO date string, e.g., '2025-06-26'
    lat = FloatField(required=True)
    lon = FloatField(required=True)
    forecast_value = FloatField(required=True)
    
    meta = {
        'collection': 'significant_flood_points',
        'indexes': [
            # Geospatial index for efficient location-based queries
            [('lat', 1), ('lon', 1)],
            # Compound index for time + location queries
            [('time', 1), ('lat', 1), ('lon', 1)],
            # Index for forecast value filtering
            [('forecast_value', 1)]
        ]
    }

class FloodCluster(Document):
    """Clustered flood data for different zoom levels"""
    zoom_level = IntField(required=True)  # 0-20 zoom levels
    geohash = StringField(required=True)  # Geohash prefix for this cluster
    center_lat = FloatField(required=True)  # Center point of cluster
    center_lon = FloatField(required=True)
    time = StringField(required=True)  # Date this cluster represents
    
    # Aggregated statistics
    point_count = IntField(required=True)  # Number of points in cluster
    avg_forecast = FloatField(required=True)  # Average forecast value
    max_forecast = FloatField(required=True)  # Maximum forecast value
    min_forecast = FloatField(required=True)  # Minimum forecast value
    
    # Risk level categorization
    risk_level = StringField(required=True)  # 'low', 'medium', 'high', 'extreme'
    
    meta = {
        'collection': 'flood_clusters',
        'indexes': [
            # Compound index for efficient zoom + time + location queries
            [('zoom_level', 1), ('time', 1), ('geohash', 1)],
            # Geospatial index for bounding box queries
            [('center_lat', 1), ('center_lon', 1)],
            # Index for risk level filtering
            [('risk_level', 1)]
        ]
    } 