import csv
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import connect_to_mongo
from schemas.significant_flood_point import SignificantFloodPoint

def import_csv_data(csv_file_path):
    """Import data from CSV file into MongoDB"""
    try:
        # Connect to MongoDB
        connect_to_mongo()
        print("Connected to MongoDB")
        
        # Clear existing data (optional - comment out if you want to keep existing data)
        SignificantFloodPoint.objects.delete()
        print("Cleared existing data")
        
        # Read CSV and prepare data for bulk insert
        documents = []
        with open(csv_file_path, 'r') as file:
            csv_reader = csv.DictReader(file)
            
            for row in csv_reader:
                document = SignificantFloodPoint(
                    time=row['time'],
                    lat=float(row['lat']),
                    lon=float(row['lon']),
                    forecast_value=float(row['forecast_value'])
                )
                documents.append(document)
        
        # Bulk insert all documents
        if documents:
            SignificantFloodPoint.objects.insert(documents)
            print(f"Bulk inserted {len(documents)} documents")
        
        print(f"Successfully imported data from {csv_file_path}")
        
        # Print summary
        total_count = SignificantFloodPoint.objects.count()
        print(f"Total records in database: {total_count}")
        
    except Exception as e:
        print(f"Error importing data: {e}")
        sys.exit(1)

if __name__ == "__main__":
    csv_file = "significant_flood_points.csv"
    
    if not os.path.exists(csv_file):
        print(f"CSV file '{csv_file}' not found in current directory")
        print("Please make sure the CSV file is in the same directory as this script")
        sys.exit(1)
    
    import_csv_data(csv_file) 