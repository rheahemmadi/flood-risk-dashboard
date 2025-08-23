from fastapi import FastAPI, Query, BackgroundTasks, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from datetime import datetime, timedelta, timezone
import pytz
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from config.database import connect_to_mongo
from schemas.significant_flood_point import SignificantFloodPoint, FloodCluster
from services.clustering_service import GeohashClusteringService
# Import the functions from your scripts
from scripts.update_pipeline_data import update_raw_points_for_run_date
from scripts.generate_clusters import generate_clusters

app = FastAPI()

# Configure Gemini API - try both possible environment variable names
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
print(f"🔑 GEMINI_API_KEY loaded: {'Yes' if GEMINI_API_KEY else 'No'}")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print("✅ Gemini API configured successfully")
else:
    print("❌ WARNING: GEMINI_API_KEY not found in environment")

# Initialize the scheduler
scheduler = AsyncIOScheduler()

class FloodAlertData(BaseModel):
    location: str
    riskLevel: str
    returnPeriod: str
    date: str
    latitude: float
    longitude: float
    forecastValue: Optional[float] = None
    riverName: Optional[str] = None

class AIInsightRequest(BaseModel):
    alert: FloodAlertData
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "https://flood-risk-dashboard.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_db_client():
    connect_to_mongo()
    # Start the scheduler
    # scheduler.start()
    # print("🚀 Scheduler started - Daily pipeline will run at 2am UK time")

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()
    print("🛑 Scheduler stopped")

@app.get("/")
def read_root():
    return {"message": "Flood Risk Dashboard Backend is running"}

# --- MODIFIED ENDPOINT ---
# In main.py, REPLACE your existing get_flood_points function with this one

@app.get("/api/flood-points")
async def get_flood_points(
    limit: int = Query(default=2000, le=10000),
    skip: int = Query(default=0),
    time: Optional[str] = Query(None, description="Filter by valid_for_date (YYYY-MM-DD)"),
    # Add the bounding box parameters to the function signature
    north: Optional[float] = Query(None),
    south: Optional[float] = Query(None),
    east: Optional[float] = Query(None),
    west: Optional[float] = Query(None)
):
    """Get flood points, now filtering by date AND geographic bounds."""
    try:
        query_filters = {}
        
        if time:
            query_filters['valid_for_date'] = time
        
        # *** THIS IS THE CRITICAL NEW LOGIC ***
        # If bounds are provided, add them to the MongoDB query
        if all(coord is not None for coord in [north, south, east, west]):
            query_filters['lat__gte'] = south
            query_filters['lat__lte'] = north
            query_filters['lon__gte'] = west
            query_filters['lon__lte'] = east
        
        points = SignificantFloodPoint.objects(**query_filters).skip(skip).limit(limit)
        
        result = []
        for point in points:
            result.append({
                'id': str(point.id),
                'time': point.valid_for_date,
                'forecast_run_date': point.forecast_run_date,
                'lat': point.lat,
                'lon': point.lon,
                'forecast_value': point.forecast_value,
                'return_period': point.return_period
            })
        
        total_count = SignificantFloodPoint.objects(**query_filters).count()
        return {"points": result, "total": total_count}
    except Exception as e:
        return {"error": str(e)}

# --- MODIFIED ENDPOINT ---
@app.get("/api/flood-clusters")
async def get_flood_clusters(
    zoom_level: int = Query(..., ge=0, le=20),
    time: Optional[str] = Query(None, description="Filter by valid_for_date (YYYY-MM-DD)"),
    north: Optional[float] = Query(None),
    south: Optional[float] = Query(None),
    east: Optional[float] = Query(None),
    west: Optional[float] = Query(None)
):
    """Get clustered flood data for a specific zoom level and viewport."""
    try:
        query_filters = {'zoom_level': zoom_level}
        if time:
            # Note: This should match the field in your FloodCluster model
            query_filters['time'] = time 
        
        if all(coord is not None for coord in [north, south, east, west]):
            query_filters['center_lat__gte'] = south
            query_filters['center_lat__lte'] = north
            query_filters['center_lon__gte'] = west
            query_filters['center_lon__lte'] = east
        
        clusters = FloodCluster.objects(**query_filters)
        
        # --- KEY CHANGE: Manually build the result list ---
        result = []
        for cluster in clusters:
            result.append({
                'id': str(cluster.id), # Explicitly convert ObjectId to string
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
        
        return {"clusters": result}
        
    except Exception as e:
        return {"error": str(e)}
    
    # In your main.py file, add this new endpoint:

# In main.py, REPLACE your /api/flood-points/summary function with this one

@app.get("/api/flood-points/summary")
async def get_flood_summary(time: Optional[str] = Query(None, description="Filter by valid_for_date (YYYY-MM-DD) for per-day counts")):
    """
    Get a complete summary of all raw data points, including unique dates
    and a breakdown of points by risk level (return_period).
    This is the single source of truth for the dashboard header.
    """
    try:
        # A $facet pipeline lets us run multiple aggregations in one stage
        match_stage = {"$match": {"valid_for_date": time}} if time else None

        pipeline = []
        if match_stage:
            pipeline.append(match_stage)

        pipeline.append({
            "$facet": {
                # First aggregation: calculate overall stats and get dates
                "overall_stats": [
                    {
                        "$group": {
                            "_id": None,
                            "total_points": {"$sum": 1},
                            "unique_dates": {"$addToSet": "$valid_for_date"}
                        }
                    }
                ],
                # Second aggregation: get the counts for each risk level
                "risk_breakdown": [
                    { "$group": { "_id": "$return_period", "count": {"$sum": 1} } }
                ]
            }
        })

        result = list(SignificantFloodPoint.objects.aggregate(*pipeline))

        if not result or not result[0]['overall_stats']:
            # Handle case with no data
            return { "unique_dates": [], "risk_breakdown": {} }

        # --- Process the results ---
        
        # Process overall stats and dates
        stats = result[0]['overall_stats'][0]
        sorted_dates = sorted([d for d in stats.get("unique_dates", []) if d])

        # Process the risk breakdown
        risk_data = result[0]['risk_breakdown']
        risk_counts = { "high": 0, "medium": 0, "low": 0 }
        
        # Map the database return periods to our frontend risk levels
        for item in risk_data:
            if item['_id'] == '20-year':
                risk_counts['high'] = item.get('count', 0)
            elif item['_id'] == '5-year':
                risk_counts['medium'] = item.get('count', 0)
            elif item['_id'] == '2-year':
                risk_counts['low'] = item.get('count', 0)
        
        # Build the final JSON object with everything the frontend needs
        return {
            "unique_dates": sorted_dates,
            "risk_breakdown": risk_counts
        }

    except Exception as e:
        print(f"Error in /api/flood-points/summary: {e}")
        raise HTTPException(status_code=500, detail="Error fetching summary data.")

# --- NEW: Time series for a specific coordinate ---
@app.get("/api/flood-points/timeseries")
async def get_point_timeseries(
    lat: float = Query(..., description="Latitude of the point"),
    lon: float = Query(..., description="Longitude of the point")
):
    """Return forecast values across available valid_for_date for a given coordinate."""
    try:
        points = (
            SignificantFloodPoint
            .objects(lat=lat, lon=lon)
            .only('valid_for_date', 'forecast_value')
        )
        # Build list and sort by valid_for_date (YYYY-MM-DD)
        series = [
            {
                'time': p.valid_for_date,
                'forecast_value': p.forecast_value,
            }
            for p in points
        ]
        series.sort(key=lambda x: x['time'])
        return { 'series': series }
    except Exception as e:
        print(f"Error in /api/flood-points/timeseries: {e}")
        raise HTTPException(status_code=500, detail="Error fetching point time series.")

@app.post("/api/generate-insight")
async def generate_ai_insight(request: AIInsightRequest):
    print(f"🤖 AI Insight request received for {request.alert.location}")
    print(f"🔍 Return Period: {request.alert.returnPeriod}")
    print(f"🔑 API Key available: {'Yes' if GEMINI_API_KEY else 'No'}")
    
    if not GEMINI_API_KEY:
        print("❌ No GEMINI_API_KEY found in environment")
        raise HTTPException(status_code=503, detail="AI service is not configured.")
    
    if request.alert.returnPeriod != "20-year":
        raise HTTPException(status_code=400, detail="AI insights only available for 20-year return period alerts.")
    
    try:
        print("🔄 Calling Gemini API...")
        
        # Create the prompt
        forecast_text = f"{request.alert.forecastValue:.2f}" if request.alert.forecastValue else "N/A"
        prompt = f"""You are an emergency advisor. Based on these coordinates {request.alert.latitude:.4f}, {request.alert.longitude:.4f}, identify the specific area/region and create a critical flood warning.

Data: 20-year return period flood, discharge {forecast_text} m³/s, forecast date {request.alert.date}

Write exactly 2-3 sentences: First sentence identifies the area and severity, second sentence gives timeline and impact, third sentence provides immediate action. Be urgent and specific about the location."""

        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        print("✅ Gemini API response received")
        
        if not response.text:
            raise HTTPException(status_code=500, detail="Failed to generate AI insight")
        
        return {
            "insight": response.text.strip(),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "model": "gemini-1.5-flash"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in /api/generate-insight: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while generating AI insights")

# --- NEW: Orchestrator and Secure Trigger Endpoint ---

PIPELINE_API_KEY = os.getenv("PIPELINE_API_KEY")

async def run_full_pipeline():
    """The orchestrator that runs the full daily update process."""
    try:
        print(f"🕐 Starting scheduled pipeline run at {datetime.now(pytz.timezone('Europe/London')).strftime('%Y-%m-%d %H:%M:%S %Z')}")
        
        # 1. Set Date: Use yesterday's date for the new forecast run
        now_utc = datetime.now(timezone.utc)
        run_date = now_utc - timedelta(days=1)
        
        # 2. Run Pipeline: Fetch and save the new 3-day forecast
        print("--- Starting background pipeline run ---")
        update_raw_points_for_run_date(run_date)
        
        # 3. Generate Clusters: Run clustering for each of the next 3 days
        print("--- Starting background cluster generation ---")
        FloodCluster.objects.delete()
        print("✅ Cleared all existing clusters.")

        for i in range(3):
            cluster_date = run_date + timedelta(days=i+1)
            cluster_date_str = cluster_date.strftime("%Y-%m-%d")
            generate_clusters(time=cluster_date_str)

        print("\n🏁 Hierarchical cluster generation complete for all dates!")
        
        # 4. Clean up old data (Keep 2 days of runs)
        print("--- Cleaning up old data ---")
        cutoff_date = run_date - timedelta(days=1)
        cutoff_date_str = cutoff_date.strftime("%Y-%m-%d")
        
        SignificantFloodPoint.objects(forecast_run_date__lt=cutoff_date_str).delete()
        FloodCluster.objects(time__lt=cutoff_date_str).delete()
        
        print("--- 🎉 Full background process complete! ---")
    except Exception as e:
        print(f"❌ Background pipeline failed: {e}")

# Schedule the daily pipeline to run at 2am UK time
scheduler.add_job(
    run_full_pipeline,
    CronTrigger(hour=2, minute=0, timezone=pytz.timezone('Europe/London')),
    id='daily_pipeline',
    name='Daily Flood Pipeline',
    replace_existing=True
)


@app.post("/api/trigger-pipeline")
async def trigger_pipeline_manual(
    background_tasks: BackgroundTasks,
    x_api_key: Optional[str] = Header(None)
):
    # """Manual trigger endpoint for testing or emergency runs."""
    # if not PIPELINE_API_KEY or x_api_key != PIPELINE_API_KEY:
    #     raise HTTPException(status_code=401, detail="Invalid API Key")
    
    background_tasks.add_task(run_full_pipeline)
    return {"message": "Manual pipeline run accepted and started in the background."}