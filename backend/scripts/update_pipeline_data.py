import sys
import os
import xarray as xr
import cdsapi
from dask.distributed import Client
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Use your project's existing config and schemas
from config.database import connect_to_mongo
from schemas.significant_flood_point import SignificantFloodPoint

def run_global_pipeline():
    """
    Fetches global forecast data, compares against the 20-year return
    period threshold, and saves significant points to the database.
    """
    client = Client()
    print(f"✅ Dask client started. Dashboard at: {client.dashboard_link}")

    # --- 1. CONFIGURATION ---
    THRESHOLD_FILE = "THRESHOLD_FILE.nc"  # Assumes this file is in the same scripts/ folder
    FORECAST_DATE = "2025-07-31"
    MINIMUM_DISCHARGE = 10.0

    # --- 2. FETCH FORECAST DATA ---
    print("\n🚀 Step 1: Fetching forecast data...")
    grib_file_path = "live_forecast.grib"
    
    c = cdsapi.Client()
    c.retrieve(
        "cems-glofas-forecast",
        {
            "system_version": ["operational"], "hydrological_model": ["lisflood"],
            "product_type": ["control_forecast"], "variable": "river_discharge_in_the_last_24_hours",
            "year": ["2025"], "month": ["07"], "day": ["31"],
            "leadtime_hour": ["24"], "format": "grib2",
        },
        grib_file_path
    )
    print(f"✅ Using forecast file: {grib_file_path}")

    # --- 3. PREPARE AND ALIGN DATASETS ---
    print("\n🚀 Step 2: Preparing and aligning datasets...")
    forecast_ds = xr.open_dataset(grib_file_path, engine="cfgrib", chunks="auto").rename({'latitude': 'lat', 'longitude': 'lon'})
    threshold_ds = xr.open_dataset(THRESHOLD_FILE, chunks="auto")
    aligned_threshold = threshold_ds.reindex_like(forecast_ds, method="nearest", tolerance=0.05)
    
    # --- 4. LAZY COMPARISON (Single Threshold for now) ---
    print("\n🚀 Step 3: Defining lazy comparison...")
    significant_alerts = forecast_ds['dis24'].where(
        (forecast_ds['dis24'] > aligned_threshold['rl_20.0']) &
        (forecast_ds['dis24'] > MINIMUM_DISCHARGE)
    )

    # --- 5. COMPUTE AND SAVE IN BATCHES ---
    print("\n🚀 Step 4: Computing and saving results...")
    connect_to_mongo()
    SignificantFloodPoint.objects.delete() # Clear old data using the schema
    points_saved_total = 0

    for lat_val in significant_alerts.lat.values:
        computed_slice = significant_alerts.sel(lat=lat_val).compute()
        
        points_in_slice = 0
        for point in computed_slice.dropna('lon'):
            lon_val = point.lon.item()
            value = point.item()
            
            # Create a document using your existing schema
            alert_doc = SignificantFloodPoint(
                time=FORECAST_DATE,
                lat=float(lat_val),
                lon=float(lon_val),
                forecast_value=float(value)
            )
            alert_doc.save()
            points_in_slice += 1
        
        if points_in_slice > 0:
            print(f"   ✅ Found and saved {points_in_slice} alerts for latitude {lat_val:.2f}")
            points_saved_total += points_in_slice

    print(f"\n🏁 Finished! Found and stored a total of {points_saved_total} significant alerts.")
    client.close()
    os.remove(grib_file_path)

if __name__ == '__main__':
    run_global_pipeline()