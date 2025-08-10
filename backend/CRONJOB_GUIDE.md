# Cronjob Pipeline Guide

## Overview

The flood risk dashboard now uses an automated cronjob system instead of manual API triggers. The pipeline runs automatically every day at 2:00 AM UK time.

## How It Works

### Automatic Scheduling
- **Schedule**: Daily at 2:00 AM UK time (Europe/London timezone)
- **Function**: `run_full_pipeline()` 
- **Scheduler**: APScheduler with AsyncIOScheduler

### What the Pipeline Does
1. **Data Update**: Fetches new 3-day flood forecast data
2. **Clustering**: Generates hierarchical clusters for map visualization
3. **Cleanup**: Removes old data (keeps 2 days of runs)
4. **Logging**: Provides detailed console output for monitoring

## API Endpoints

### Pipeline Status
```http
GET /api/pipeline-status
```
Returns the current status of the scheduled pipeline:
```json
{
  "status": "scheduled",
  "next_run": "2024-01-15 02:00:00 GMT",
  "schedule": "Daily at 2:00 AM UK time"
}
```

### Manual Trigger (Emergency/Testing)
```http
POST /api/trigger-pipeline
Headers: X-API-Key: your_pipeline_api_key
```
Manually triggers the pipeline for testing or emergency situations.

## Testing

### Test the Pipeline Function
```bash
cd backend
python scripts/test_cronjob.py
```

### Check Scheduler Status
```bash
curl http://localhost:8000/api/pipeline-status
```

## Configuration

### Environment Variables
- `PIPELINE_API_KEY`: Required for manual trigger endpoint

### Dependencies
- `apscheduler`: For cronjob scheduling
- `pytz`: For timezone handling

## Monitoring

### Console Output
The scheduler provides detailed logging:
- 🚀 Startup: "Scheduler started - Daily pipeline will run at 2am UK time"
- 🕐 Runtime: Timestamp when pipeline starts
- ✅ Success: Confirmation of completed steps
- ❌ Errors: Detailed error messages

### Log Files
Monitor your application logs for pipeline execution status and any errors.

## Troubleshooting

### Common Issues
1. **Timezone Issues**: Ensure your server is configured for the correct timezone
2. **Database Connection**: Pipeline requires active MongoDB connection
3. **API Key**: Manual triggers require valid `PIPELINE_API_KEY`

### Manual Override
If the automatic pipeline fails, you can:
1. Check the status: `GET /api/pipeline-status`
2. Manually trigger: `POST /api/trigger-pipeline` (with API key)
3. Test directly: `python scripts/test_cronjob.py`

## Deployment Notes

- The scheduler starts automatically when the FastAPI application starts
- The scheduler shuts down gracefully when the application stops
- Jobs are persistent across application restarts (if using persistent job store)
- Monitor server timezone settings to ensure 2am UK time is correct
