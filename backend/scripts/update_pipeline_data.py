import sys
import os
import xarray as xr
import cdsapi
from dask.distributed import Client
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import connect_to_mongo
from schemas.significant_flood_point import SignificantFloodPoint

def run_global_pipeline():
    client = Client()
    print(f"✅ Dask client started. Dashboard at: {client.dashboard_link}")

    # --- 1. CONFIGURATION ---
    # Define filenames for all three thresholds
    THRESHOLD_20_YR_FILE = "flood_threshold_glofas_v4_rl_20.0.nc"
    THRESHOLD_5_YR_FILE = "flood_threshold_glofas_v4_rl_5.0.nc"
    THRESHOLD_2_YR_FILE = "flood_threshold_glofas_v4_rl_2.0.nc"
    
    FORECAST_DATE = "2025-08-07"
    MINIMUM_DISCHARGE = 10.0

    # --- 2. FETCH FORECAST DATA ---
    print("\n🚀 Step 1: Fetching forecast data...")
    grib_file_path = "live_forecast.grib"
    c = cdsapi.Client()
    c.retrieve("cems-glofas-forecast", {
        "system_version": ["operational"], "hydrological_model": ["lisflood"],
        "product_type": ["control_forecast"], "variable": "river_discharge_in_the_last_24_hours",
        "year": ["2025"], "month": ["08"], "day": ["07"],
        "leadtime_hour": ["24"], "format": "grib2",
    }, grib_file_path)
    print(f"✅ Using forecast file: {grib_file_path}")

    # --- 3. PREPARE AND ALIGN DATASETS ---
    print("\n🚀 Step 2: Preparing and aligning all datasets...")
    forecast_ds = xr.open_dataset(grib_file_path, engine="cfgrib", chunks="auto").rename({'latitude': 'lat', 'longitude': 'lon'})
    
    # Load and align all three threshold files
    t20_ds = xr.open_dataset(THRESHOLD_20_YR_FILE, chunks="auto").reindex_like(forecast_ds, method="nearest", tolerance=0.05)
    t5_ds = xr.open_dataset(THRESHOLD_5_YR_FILE, chunks="auto").reindex_like(forecast_ds, method="nearest", tolerance=0.05)
    t2_ds = xr.open_dataset(THRESHOLD_2_YR_FILE, chunks="auto").reindex_like(forecast_ds, method="nearest", tolerance=0.05)
    
    # --- 4. CONNECT TO DB AND CLEAR OLD DATA ---
    connect_to_mongo()
    SignificantFloodPoint.objects.delete()
    print("\n🚀 Step 3: Cleared old data and connected to DB.")

    # --- 5. COMPUTE AND SAVE IN BATCHES ---
    print("\n🚀 Step 4: Computing and saving results for all thresholds...")
    points_saved_total = 0

    for lat_val in forecast_ds.lat.values:
        # Load one slice of all relevant data into memory
        forecast_slice = forecast_ds['dis24'].sel(lat=lat_val).compute()
        t20_slice = t20_ds['rl_20.0'].sel(lat=lat_val).compute()
        t5_slice = t5_ds['rl_5.0'].sel(lat=lat_val).compute()
        t2_slice = t2_ds['rl_2.0'].sel(lat=lat_val).compute()

        points_in_slice = 0
        for lon_val in forecast_slice.lon.values:
            forecast_value = forecast_slice.sel(lon=lon_val).item()

            if forecast_value < MINIMUM_DISCHARGE:
                continue

            # Check against thresholds from highest to lowest severity
            return_period_found = None
            if forecast_value > t20_slice.sel(lon=lon_val).item():
                return_period_found = "20-year"
            elif forecast_value > t5_slice.sel(lon=lon_val).item():
                return_period_found = "5-year"
            elif forecast_value > t2_slice.sel(lon=lon_val).item():
                return_period_found = "2-year"

            # If a threshold was crossed, save the document
            if return_period_found:
                point = SignificantFloodPoint(
                    time=FORECAST_DATE,
                    lat=float(lat_val),
                    lon=float(lon_val),
                    forecast_value=float(forecast_value),
                    return_period=return_period_found
                )
                point.save()
                points_in_slice += 1
        
        if points_in_slice > 0:
            print(f"   ✅ Found and saved {points_in_slice} alerts for latitude {lat_val:.2f}")
            points_saved_total += points_in_slice

    print(f"\n🏁 Finished! Found and stored a total of {points_saved_total} significant alerts.")
    client.close()
    os.remove(grib_file_path)

if __name__ == '__main__':
    run_global_pipeline()