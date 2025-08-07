from mongoengine import Document, StringField, FloatField, IntField

class SignificantFloodPoint(Document):
    time = StringField(required=True)
    lat = FloatField(required=True)
    lon = FloatField(required=True)
    forecast_value = FloatField(required=True)
    return_period = StringField(required=True)

    meta = {
        'collection': 'significant_flood_points',
        'indexes': [
            [('lat', 1), ('lon', 1)],
            [('time', 1), ('lat', 1), ('lon', 1)],
            [('forecast_value', 1)],
            [('return_period', 1)] # Added index for the new field
        ]
    }

# The FloodCluster model can remain unchanged for now
class FloodCluster(Document):
    zoom_level = IntField(required=True)
    geohash = StringField(required=True)
    center_lat = FloatField(required=True)
    center_lon = FloatField(required=True)
    time = StringField(required=True)
    point_count = IntField(required=True)
    avg_forecast = FloatField(required=True)
    max_forecast = FloatField(required=True)
    min_forecast = FloatField(required=True)
    risk_level = StringField(required=True)
    
    meta = {
        'collection': 'flood_clusters',
        'indexes': [
            [('zoom_level', 1), ('time', 1), ('geohash', 1)],
            [('center_lat', 1), ('center_lon', 1)],
            [('risk_level', 1)]
        ]
    }