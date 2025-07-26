import sys
import os
import time
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import connect_to_mongo
from schemas.significant_flood_point import SignificantFloodPoint, FloodCluster
from services.clustering_service import GeohashClusteringService

def test_clustering_performance():
    """Test clustering performance and show improvements"""
    try:
        # Connect to MongoDB
        connect_to_mongo()
        print("Connected to MongoDB")
        
        # Get raw data count
        raw_count = SignificantFloodPoint.objects.count()
        print(f"\n📊 Raw Data Statistics:")
        print(f"   Total flood points: {raw_count:,}")
        
        # Get unique dates
        unique_dates = SignificantFloodPoint.objects.distinct('time')
        print(f"   Unique dates: {len(unique_dates)}")
        print(f"   Date range: {min(unique_dates)} to {max(unique_dates)}")
        
        # Test clustering for different zoom levels
        print(f"\n🔍 Testing Clustering Performance:")
        
        clustering_service = GeohashClusteringService()
        
        # Test specific zoom levels
        test_zoom_levels = [0, 5, 10, 15]
        
        for zoom_level in test_zoom_levels:
            print(f"\n   Zoom Level {zoom_level}:")
            
            start_time = time.time()
            clusters = clustering_service.cluster_points_by_zoom(zoom_level)
            end_time = time.time()
            
            if clusters:
                # Calculate statistics
                total_points = sum(cluster.point_count for cluster in clusters)
                avg_points_per_cluster = total_points / len(clusters)
                
                print(f"     ⏱️  Processing time: {end_time - start_time:.2f}s")
                print(f"     📍 Clusters created: {len(clusters):,}")
                print(f"     📊 Points covered: {total_points:,}")
                print(f"     📈 Avg points per cluster: {avg_points_per_cluster:.1f}")
                print(f"     🎯 Compression ratio: {raw_count / len(clusters):.1f}x")
                
                # Risk level breakdown
                risk_counts = {}
                for cluster in clusters:
                    risk_counts[cluster.risk_level] = risk_counts.get(cluster.risk_level, 0) + 1
                
                print(f"     🚨 Risk levels: {risk_counts}")
            else:
                print(f"     ❌ No clusters created")
        
        # Test viewport query performance
        print(f"\n🗺️  Testing Viewport Query Performance:")
        
        # Europe bounding box
        europe_bounds = {
            'north': 70.0,
            'south': 35.0,
            'east': 40.0,
            'west': -10.0
        }
        
        for zoom_level in [5, 10]:
            print(f"\n   Zoom Level {zoom_level} (Europe viewport):")
            
            start_time = time.time()
            clusters = clustering_service.get_clusters_for_viewport(zoom_level, europe_bounds)
            end_time = time.time()
            
            print(f"     ⏱️  Query time: {end_time - start_time:.3f}s")
            print(f"     📍 Clusters returned: {len(clusters)}")
            
            if clusters:
                # Calculate coverage
                total_points = sum(cluster['point_count'] for cluster in clusters)
                print(f"     📊 Points covered: {total_points:,}")
        
        print(f"\n✅ Clustering performance test completed!")
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        sys.exit(1)

def test_cluster_quality():
    """Test the quality of clustering by examining sample clusters"""
    try:
        connect_to_mongo()
        print("\n🔬 Testing Cluster Quality:")
        
        # Get sample clusters from different zoom levels
        for zoom_level in [5, 10]:
            print(f"\n   Zoom Level {zoom_level}:")
            
            clusters = FloodCluster.objects(zoom_level=zoom_level).limit(5)
            
            for i, cluster in enumerate(clusters):
                print(f"     Cluster {i+1}:")
                print(f"       📍 Center: ({cluster.center_lat:.4f}, {cluster.center_lon:.4f})")
                print(f"       📊 Points: {cluster.point_count}")
                print(f"       🎯 Risk: {cluster.risk_level} (avg: {cluster.avg_forecast:.2f})")
                print(f"       📈 Range: {cluster.min_forecast:.2f} - {cluster.max_forecast:.2f}")
                print(f"       🔗 Geohash: {cluster.geohash}")
        
        print(f"\n✅ Cluster quality test completed!")
        
    except Exception as e:
        print(f"❌ Error during quality testing: {e}")

if __name__ == "__main__":
    print("🚀 Flood Data Clustering Performance Test")
    print("=" * 50)
    
    test_clustering_performance()
    test_cluster_quality()
    
    print(f"\n🎉 All tests completed successfully!") 