import math
from typing import List, Dict, Tuple
from schemas.significant_flood_point import SignificantFloodPoint, FloodCluster

class GeohashClusteringService:
    """Service for clustering flood points using geohash-based approach"""
    
    # Geohash precision levels for different zoom levels
    # Higher precision = smaller clusters = more detailed view
    ZOOM_TO_PRECISION = {
        0: 1,   # Continent level (~5000km)
        1: 2,   # Country level (~1250km)
        2: 3,   # Large region level (~1250km)
        3: 4,   # State level (~156km)
        4: 5,   # Large city level (~156km)
        # 5: 4,   # City level (~19.5km)
        # 6: 4,   # District level (~19.5km)
        # 7: 5,   # Neighborhood level (~2.4km)
        # 8: 5,   # Street level (~2.4km)
        # 9: 6,   # Block level (~610m)
        # 10: 6,  # Building level (~610m)
        # 11: 7,  # Building level (~76m)
        # 12: 7,  # Building level (~76m)
        # 13: 8,  # Building level (~9.5m)
        # 14: 8,  # Building level (~9.5m)
        # 15: 9,  # Building level (~1.2m)
        # 16: 9,  # Building level (~1.2m)
        # 17: 10, # Building level (~15cm)
        # 18: 10, # Building level (~15cm)
        # 19: 11, # Building level (~2cm)
        # 20: 11, # Building level (~2cm)
    }
    
    # Risk level thresholds
    RISK_THRESHOLDS = {
        'low': 0.3,
        'medium': 0.6,
        'high': 0.8,
        'extreme': 1.0
    }
    
    def __init__(self):
        self.geohash_base32 = '0123456789bcdefghjkmnpqrstuvwxyz'
    
    def encode_geohash(self, lat: float, lon: float, precision: int = 9) -> str:
        """Encode lat/lon to geohash string"""
        lat_min, lat_max = -90.0, 90.0
        lon_min, lon_max = -180.0, 180.0
        
        geohash = []
        bit = 0
        ch = 0
        
        while len(geohash) < precision:
            if bit % 2 == 0:
                mid = (lon_min + lon_max) / 2
                if lon >= mid:
                    ch |= (1 << (4 - bit % 5))
                    lon_min = mid
                else:
                    lon_max = mid
            else:
                mid = (lat_min + lat_max) / 2
                if lat >= mid:
                    ch |= (1 << (4 - bit % 5))
                    lat_min = mid
                else:
                    lat_max = mid
            
            bit += 1
            if bit % 5 == 0:
                geohash.append(self.geohash_base32[ch])
                ch = 0
        
        return ''.join(geohash)
    
    def decode_geohash_bounds(self, geohash: str) -> Dict[str, float]:
        """Decode geohash to get its bounding box"""
        lat_min, lat_max = -90.0, 90.0
        lon_min, lon_max = -180.0, 180.0
        
        even_bit = True
        for char in geohash:
            idx = self.geohash_base32.index(char)
            for i in range(4, -1, -1):
                bit = (idx >> i) & 1
                if even_bit:
                    mid = (lon_min + lon_max) / 2
                    if bit:
                        lon_min = mid
                    else:
                        lon_max = mid
                else:
                    mid = (lat_min + lat_max) / 2
                    if bit:
                        lat_min = mid
                    else:
                        lat_max = mid
                even_bit = not even_bit
        
        return {
            'south': lat_min,
            'north': lat_max,
            'west': lon_min,
            'east': lon_max
        }

    def get_geohash_prefix(self, lat: float, lon: float, zoom_level: int) -> str:
        """Get geohash prefix for given zoom level"""
        precision = self.ZOOM_TO_PRECISION.get(zoom_level, 6)
        return self.encode_geohash(lat, lon, precision)
    
    def determine_risk_level(self, forecast_value: float) -> str:
        """Determine risk level based on forecast value"""
        if forecast_value <= self.RISK_THRESHOLDS['low']:
            return 'low'
        elif forecast_value <= self.RISK_THRESHOLDS['medium']:
            return 'medium'
        elif forecast_value <= self.RISK_THRESHOLDS['high']:
            return 'high'
        else:
            return 'extreme'
    
# In the GeohashClusteringService class
    
    def cluster_points_by_zoom(self, zoom_level: int, time: str = None) -> List[FloodCluster]:
        """Cluster points for a specific zoom level and time (valid_for_date)."""
        query = {}
        # --- KEY CHANGE #1: Query by the new 'valid_for_date' field ---
        if time:
            query['valid_for_date'] = time

        # Use the correct model (SignificantFloodPoint)
        points = SignificantFloodPoint.objects(**query)
        
        clusters = {}
        for point in points:
            geohash_prefix = self.get_geohash_prefix(point.lat, point.lon, zoom_level)
            
            if geohash_prefix not in clusters:
                clusters[geohash_prefix] = {
                    'points': [], 'lats': [], 'lons': [], 
                    'forecast_values': [], 'return_periods': []
                }

            clusters[geohash_prefix]['points'].append(point)
            clusters[geohash_prefix]['lats'].append(point.lat)
            clusters[geohash_prefix]['lons'].append(point.lon)
            clusters[geohash_prefix]['forecast_values'].append(point.forecast_value)
            clusters[geohash_prefix]['return_periods'].append(point.return_period)
        
        flood_clusters = []
        for geohash_prefix, cluster_data in clusters.items():
            points = cluster_data['points']
            # ... (calculations for center_lat, center_lon, avg_forecast, etc. remain the same)
            lats, lons, forecast_values = cluster_data['lats'], cluster_data['lons'], cluster_data['forecast_values']
            center_lat, center_lon = sum(lats) / len(lats), sum(lons) / len(lons)
            avg_forecast, max_forecast, min_forecast = sum(forecast_values) / len(forecast_values), max(forecast_values), min(forecast_values)
            
            return_periods = cluster_data['return_periods']
            risk_level = 'low'
            if '20-year' in return_periods: risk_level = 'high'
            elif '5-year' in return_periods: risk_level = 'medium'

            cluster = FloodCluster(
                zoom_level=zoom_level, geohash=geohash_prefix,
                center_lat=center_lat, center_lon=center_lon,
                # --- KEY CHANGE #2: Assign the date to the cluster's time field ---
                time=time, 
                point_count=len(lats), avg_forecast=avg_forecast,
                max_forecast=max_forecast, min_forecast=min_forecast,
                risk_level=risk_level
            )
            flood_clusters.append(cluster)
        
        return flood_clusters

    def get_sub_clusters(self, parent_geohash: str, parent_zoom_level: int, child_zoom_level: int, time: str = None) -> List[Dict]:
        """Get sub-clusters within a parent cluster's bounds"""
        # Get the bounds of the parent cluster
        parent_bounds = self.decode_geohash_bounds(parent_geohash)
        
        # Generate clusters for the child zoom level within parent bounds
        child_clusters = self.cluster_points_by_zoom(child_zoom_level, time, parent_geohash)
        
        # Convert to dictionary format
        result = []
        for cluster in child_clusters:
            result.append({
                'id': str(cluster.id) if hasattr(cluster, 'id') else f"{cluster.geohash}_{cluster.zoom_level}",
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
        
        return result

    def generate_all_zoom_clusters(self, time: str = None):
        """
        Generates clusters for all zoom levels. If a time is specified, it runs for that
        day only. If no time is specified, it finds all unique dates in the data
        and generates clusters for each of them.
        """
        print("--- Starting Cluster Generation ---")
        
        # Clear all existing clusters before starting
        FloodCluster.objects.delete()
        print("✅ Cleared all existing clusters.")

        # Determine which dates to process
        if time:
            dates_to_process = [time]
            print(f"Targeting single date: {time}")
        else:
            print("Finding all unique dates in the source data...")
            # This fetches every unique 'time' value from your raw data
            dates_to_process = SignificantFloodPoint.objects.distinct('time')
            print(f"✅ Found {len(dates_to_process)} unique dates to process.")

        # Loop through each date and generate clusters for it
        for process_date in dates_to_process:
            print(f"\n--- Processing date: {process_date} ---")
            
            # Start with zoom level 0 for this specific date
            clusters_for_date = self.cluster_points_by_zoom(0, time=process_date)
            
            if not clusters_for_date:
                print(f"No points found for {process_date}. Skipping.")
                continue

            # Hierarchically generate clusters for other zoom levels for this date
            # (This part of your logic was specific to a single run, so we'll simplify)
            for zoom_level in sorted(self.ZOOM_TO_PRECISION.keys()):
                 print(f"   Processing zoom level {zoom_level} for {process_date}...")
                 clusters_for_zoom = self.cluster_points_by_zoom(zoom_level, time=process_date)
                 
                 if clusters_for_zoom:
                     FloodCluster.objects.insert(clusters_for_zoom)
                     print(f"   ✅ Created {len(clusters_for_zoom)} clusters for zoom {zoom_level}")

        print("\n🏁 Hierarchical cluster generation complete for all dates!")

    # def generate_all_zoom_clusters(self, time: str = None):
    #     """Generate clusters for all zoom levels hierarchically"""
    #     print(f"Generating hierarchical clusters for time: {time or 'all times'}")
        
    #     # Clear existing clusters
    #     FloodCluster.objects.delete()
    #     print("Cleared existing clusters")
        
    #     # Start with zoom level 0 - process all points
    #     print("Processing zoom level 0...")
    #     current_level_clusters = self.cluster_points_by_zoom(0, time)
        
    #     if current_level_clusters:
    #         FloodCluster.objects.insert(current_level_clusters)
    #         print(f"Created {len(current_level_clusters)} clusters for zoom level 0")
    #     else:
    #         print("No clusters created for zoom level 0")
    #         return
        
    #     # For each subsequent zoom level, generate sub-clusters from the previous level
    #     for zoom_level in range(1, 21):  # 1-20
    #         print(f"Processing zoom level {zoom_level}...")
            
    #         # Get all clusters from the previous zoom level
    #         previous_level_clusters = FloodCluster.objects(zoom_level=zoom_level-1)
    #         if time:
    #             previous_level_clusters = previous_level_clusters.filter(time=time)
            
    #         all_new_clusters = []
            
    #         # Generate sub-clusters for each parent cluster
    #         for parent_cluster in previous_level_clusters:
    #             sub_clusters = self.cluster_points_by_zoom(
    #                 zoom_level, 
    #                 time, 
    #                 parent_geohash=parent_cluster.geohash
    #             )
    #             all_new_clusters.extend(sub_clusters)
            
    #         if all_new_clusters:
    #             FloodCluster.objects.insert(all_new_clusters)
    #             print(f"Created {len(all_new_clusters)} clusters for zoom level {zoom_level}")
    #         else:
    #             print(f"No clusters created for zoom level {zoom_level}")
    #             # If no clusters were created at this level, stop generating higher levels
    #             break
        
    #     print("Hierarchical cluster generation complete!")
        
    #     # Print summary
    #     total_clusters = FloodCluster.objects.count()
    #     print(f"Total clusters in database: {total_clusters}")
        
    #     # Print breakdown by zoom level
    #     for zoom_level in range(21):
    #         count = FloodCluster.objects(zoom_level=zoom_level).count()
    #         if count > 0:
    #             print(f"Zoom {zoom_level}: {count} clusters")
    
    def get_clusters_for_viewport(self, zoom_level: int, bounds: Dict, time: str = None) -> List[Dict]:
        """Get clusters for a specific viewport and zoom level"""
        # Build query
        query = {'zoom_level': zoom_level}
        if time:
            query['time'] = time
        
        # Add bounding box filter if provided
        if bounds:
            query['center_lat__gte'] = bounds['south']
            query['center_lat__lte'] = bounds['north']
            query['center_lon__gte'] = bounds['west']
            query['center_lon__lte'] = bounds['east']
        
        clusters = FloodCluster.objects(**query)
        
        # Convert to dictionary format
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
        
        return result 