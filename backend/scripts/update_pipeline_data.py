import sys
import os
import xarray as xr
import cdsapi
import glob
import numpy as np
from dask.distributed import Client
from datetime import datetime, timedelta
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import connect_to_mongo
from schemas.significant_flood_point import SignificantFloodPoint

def update_raw_points_for_run_date(run_date: datetime):
    """
    Fetches a 3-day forecast for a specific run_date, compares against 3
    thresholds, and saves the data to MongoDB using a safe update method.
    """
    client = Client()
    print(f"✅ Dask client started. Dashboard at: {client.dashboard_link}")

    # --- 1. CONFIGURATION ---
    run_date_str = run_date.strftime("%Y-%m-%d")
    scripts_dir = os.path.dirname(__file__)
    # Correctly defines the full path to the threshold files
    THRESHOLD_20_YR_FILE = os.path.join(scripts_dir, "flood_threshold_glofas_v4_rl_20.0.nc")
    THRESHOLD_5_YR_FILE = os.path.join(scripts_dir, "flood_threshold_glofas_v4_rl_5.0.nc")
    THRESHOLD_2_YR_FILE = os.path.join(scripts_dir, "flood_threshold_glofas_v4_rl_2.0.nc")
    MINIMUM_DISCHARGE = 10.0

    # --- 2. FETCH FORECAST DATA ---
    print(f"\n🚀 Fetching 3-day forecast for run date: {run_date_str}...")
    grib_file_path = "live_forecast.grib"
    c = cdsapi.Client()
    c.retrieve("cems-glofas-forecast", {
        "system_version": ["operational"], "hydrological_model": ["lisflood"],
        "product_type": ["control_forecast"], "variable": "river_discharge_in_the_last_24_hours",
        "year": [run_date.strftime("%Y")], "month": [run_date.strftime("%m")], "day": [run_date.strftime("%d")],
        "leadtime_hour": ["24", "48", "72"], "format": "grib2",
    }, grib_file_path)

    # --- 3. PREPARE AND ALIGN DATASETS ---
    print("\n🚀 Preparing and aligning all datasets...")
    forecast_ds = xr.open_dataset(grib_file_path, engine="cfgrib", chunks="auto").rename({'latitude': 'lat', 'longitude': 'lon'})
    
    t20_ds = xr.open_dataset(THRESHOLD_20_YR_FILE, chunks="auto").reindex_like(forecast_ds, method="nearest")
    t5_ds = xr.open_dataset(THRESHOLD_5_YR_FILE, chunks="auto").reindex_like(forecast_ds, method="nearest")
    t2_ds = xr.open_dataset(THRESHOLD_2_YR_FILE, chunks="auto").reindex_like(forecast_ds, method="nearest")
    
    # --- 4. CONNECT TO DB & PERFORM SAFE DELETE ---
    connect_to_mongo()
    SignificantFloodPoint.objects(forecast_run_date=run_date_str).delete()
    print(f"\n🚀 Cleared old data for run date {run_date_str}.")

    # --- 5. COMPUTE AND SAVE IN BATCHES ---
    print("\n🚀 Computing and saving results for all thresholds...")
    points_saved_total = 0
    
    for step in forecast_ds.step.values:
        lead_time_hours = int(step / np.timedelta64(1, 'h'))
        valid_for_date = run_date + timedelta(hours=lead_time_hours)
        valid_for_date_str = valid_for_date.strftime("%Y-%m-%d")
        
        print(f"\n--- Processing Lead Time: {lead_time_hours} hours (Valid for: {valid_for_date_str}) ---")
        forecast_for_step = forecast_ds['dis24'].sel(step=step)

        for lat_val in forecast_for_step.lat.values:
            forecast_slice = forecast_for_step.sel(lat=lat_val).compute()
            t20_slice = t20_ds['rl_20.0'].sel(lat=lat_val).compute()
            t5_slice = t5_ds['rl_5.0'].sel(lat=lat_val).compute()
            t2_slice = t2_ds['rl_2.0'].sel(lat=lat_val).compute()

            points_in_slice = 0
            for lon_val in forecast_slice.lon.values:
                forecast_value = forecast_slice.sel(lon=lon_val).item()

                if forecast_value < MINIMUM_DISCHARGE:
                    continue

                return_period_found = None
                if forecast_value > t20_slice.sel(lon=lon_val).item():
                    return_period_found = "20-year"
                elif forecast_value > t5_slice.sel(lon=lon_val).item():
                    return_period_found = "5-year"
                elif forecast_value > t2_slice.sel(lon=lon_val).item():
                    return_period_found = "2-year"

                if return_period_found:
                    point = SignificantFloodPoint(
                        forecast_run_date=run_date_str,
                        valid_for_date=valid_for_date_str,
                        lat=float(lat_val),
                        lon=float(lon_val),
                        forecast_value=float(forecast_value),
                        return_period=return_period_found
                    )
                    point.save()
                    points_in_slice += 1
            
            if points_in_slice > 0:
                points_saved_total += points_in_slice

    print(f"\n🏁 Finished! Stored a total of {points_saved_total} alerts across all lead times.")
    client.close()
    
    os.remove(grib_file_path)
    for idx_file in glob.glob(f"{grib_file_path}*.idx"):
        os.remove(idx_file)