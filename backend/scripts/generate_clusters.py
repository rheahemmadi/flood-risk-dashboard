import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import connect_to_mongo
from services.clustering_service import GeohashClusteringService

def generate_clusters(time: str = None):
    """Generate clustered data for all zoom levels"""
    try:
        # Connect to MongoDB
        connect_to_mongo()
        print("Connected to MongoDB")
        
        # Initialize clustering service
        clustering_service = GeohashClusteringService()
        
        # Generate clusters for all zoom levels
        clustering_service.generate_all_zoom_clusters(time)
        
        print("Cluster generation completed successfully!")
        
    except Exception as e:
        print(f"Error generating clusters: {e}")
        sys.exit(1)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate clustered flood data for all zoom levels')
    parser.add_argument('--time', type=str, help='Specific date to cluster (YYYY-MM-DD format)')
    
    args = parser.parse_args()
    
    generate_clusters(args.time) 