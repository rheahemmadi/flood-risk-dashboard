import pytest
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from main import app
import json


class TestAPIEndpoints:
    """Test class for API endpoints"""
    
    def setup_method(self):
        """Setup method called before each test"""
        self.client = TestClient(app)
    
    # ===== HEALTH CHECK TESTS =====
    
    def test_read_root(self):
        """Test the root endpoint"""
        response = self.client.get("/")
        assert response.status_code == 200
        assert response.json() == {"message": "Flood Risk Dashboard Backend is running"}
    
    # ===== FLOOD POINTS ENDPOINT TESTS =====
    
    @patch('main.SignificantFloodPoint')
    def test_get_flood_points_basic(self, mock_significant_flood_point):
        """Test basic flood points endpoint"""
        # Mock the query result
        mock_point = Mock()
        mock_point.id = "test_id_123"
        mock_point.valid_for_date = "2024-01-16"
        mock_point.forecast_run_date = "2024-01-15"
        mock_point.lat = 51.5074
        mock_point.lon = -0.1278
        mock_point.forecast_value = 0.75
        mock_point.return_period = "20-year"
        
        mock_significant_flood_point.objects.return_value.skip.return_value.limit.return_value = [mock_point]
        mock_significant_flood_point.objects.return_value.count.return_value = 1
        
        response = self.client.get("/api/flood-points")
        
        assert response.status_code == 200
        data = response.json()
        assert "points" in data
        assert "total" in data
        assert len(data["points"]) == 1
        assert data["points"][0]["id"] == "test_id_123"
    
    @patch('main.SignificantFloodPoint')
    def test_get_flood_points_with_filters(self, mock_significant_flood_point):
        """Test flood points endpoint with filters"""
        mock_significant_flood_point.objects.return_value.skip.return_value.limit.return_value = []
        mock_significant_flood_point.objects.return_value.count.return_value = 0
        
        response = self.client.get("/api/flood-points?time=2024-01-16&limit=100&skip=50")
        
        assert response.status_code == 200
        # Verify the query was called with correct filters (called twice - once for data, once for count)
        assert mock_significant_flood_point.objects.call_count == 2
        mock_significant_flood_point.objects.assert_called_with(valid_for_date="2024-01-16")
    
    @patch('main.SignificantFloodPoint')
    def test_get_flood_points_with_bounds(self, mock_significant_flood_point):
        """Test flood points endpoint with bounding box"""
        mock_significant_flood_point.objects.return_value.skip.return_value.limit.return_value = []
        mock_significant_flood_point.objects.return_value.count.return_value = 0
        
        response = self.client.get("/api/flood-points?north=51.6&south=51.4&east=-0.1&west=-0.2")
        
        assert response.status_code == 200
        # Verify the query was called with bounds (called twice - once for data, once for count)
        assert mock_significant_flood_point.objects.call_count == 2
        mock_significant_flood_point.objects.assert_called_with(
            lat__gte=51.4,
            lat__lte=51.6,
            lon__gte=-0.2,
            lon__lte=-0.1
        )
    
    # ===== FLOOD CLUSTERS ENDPOINT TESTS =====
    
    @patch('main.FloodCluster')
    def test_get_flood_clusters(self, mock_flood_cluster):
        """Test flood clusters endpoint"""
        # Mock cluster objects
        mock_cluster = Mock()
        mock_cluster.id = "cluster_123"
        mock_cluster.zoom_level = 3
        mock_cluster.geohash = "gcpv"
        mock_cluster.center_lat = 51.5074
        mock_cluster.center_lon = -0.1278
        mock_cluster.time = "2024-01-16"
        mock_cluster.point_count = 25
        mock_cluster.avg_forecast = 0.65
        mock_cluster.max_forecast = 0.85
        mock_cluster.min_forecast = 0.45
        mock_cluster.risk_level = "high"
        
        mock_flood_cluster.objects.return_value = [mock_cluster]
        
        response = self.client.get("/api/flood-clusters?zoom_level=3")
        
        assert response.status_code == 200
        data = response.json()
        assert "clusters" in data
        assert len(data["clusters"]) == 1
        assert data["clusters"][0]["zoom_level"] == 3
        assert data["clusters"][0]["risk_level"] == "high"
    
    @patch('main.FloodCluster')
    def test_get_flood_clusters_with_filters(self, mock_flood_cluster):
        """Test flood clusters endpoint with time and bounds filters"""
        mock_flood_cluster.objects.return_value = []
        
        response = self.client.get("/api/flood-clusters?zoom_level=3&time=2024-01-16&north=51.6&south=51.4&east=-0.1&west=-0.2")
        
        assert response.status_code == 200
        # Verify the query was called with correct filters
        mock_flood_cluster.objects.assert_called_once_with(
            zoom_level=3,
            time="2024-01-16",
            center_lat__gte=51.4,
            center_lat__lte=51.6,
            center_lon__gte=-0.2,
            center_lon__lte=-0.1
        )
    
    # ===== FLOOD SUMMARY ENDPOINT TESTS =====
    
    @patch('main.SignificantFloodPoint')
    def test_get_flood_summary(self, mock_significant_flood_point):
        """Test flood points summary endpoint"""
        # Mock aggregation result
        mock_aggregation_result = [{
            'overall_stats': [{
                '_id': None,
                'total_points': 100,
                'unique_dates': ['2024-01-16', '2024-01-17']
            }],
            'risk_breakdown': [
                {'_id': '20-year', 'count': 30},
                {'_id': '5-year', 'count': 40},
                {'_id': '2-year', 'count': 30}
            ]
        }]
        
        mock_significant_flood_point.objects.aggregate.return_value = mock_aggregation_result
        
        response = self.client.get("/api/flood-points/summary")
        
        assert response.status_code == 200
        data = response.json()
        assert "unique_dates" in data
        assert "risk_breakdown" in data
        assert data["risk_breakdown"]["high"] == 30
        assert data["risk_breakdown"]["medium"] == 40
        assert data["risk_breakdown"]["low"] == 30
    
    @patch('main.SignificantFloodPoint')
    def test_get_flood_summary_with_time_filter(self, mock_significant_flood_point):
        """Test flood points summary endpoint with time filter"""
        mock_significant_flood_point.objects.aggregate.return_value = [{
            'overall_stats': [{
                '_id': None,
                'total_points': 50,
                'unique_dates': ['2024-01-16']
            }],
            'risk_breakdown': [
                {'_id': '20-year', 'count': 20},
                {'_id': '5-year', 'count': 20},
                {'_id': '2-year', 'count': 10}
            ]
        }]
        
        response = self.client.get("/api/flood-points/summary?time=2024-01-16")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["unique_dates"]) == 1
        assert data["unique_dates"][0] == "2024-01-16"
    
    # ===== TIME SERIES ENDPOINT TESTS =====
    
    @patch('main.SignificantFloodPoint')
    def test_get_point_timeseries(self, mock_significant_flood_point):
        """Test point time series endpoint"""
        # Mock time series data
        mock_point1 = Mock()
        mock_point1.valid_for_date = "2024-01-16"
        mock_point1.forecast_value = 0.75
        
        mock_point2 = Mock()
        mock_point2.valid_for_date = "2024-01-17"
        mock_point2.forecast_value = 0.85
        
        mock_significant_flood_point.objects.return_value.only.return_value = [mock_point1, mock_point2]
        
        response = self.client.get("/api/flood-points/timeseries?lat=51.5074&lon=-0.1278")
        
        assert response.status_code == 200
        data = response.json()
        assert "series" in data
        assert len(data["series"]) == 2
        assert data["series"][0]["time"] == "2024-01-16"
        assert data["series"][0]["forecast_value"] == 0.75
    
    # ===== AI INSIGHT ENDPOINT TESTS =====
    
    @patch('main.get_location_from_coordinates')
    @patch('main.genai.GenerativeModel')
    def test_generate_ai_insight_success(self, mock_genai_model, mock_get_location):
        """Test AI insight generation endpoint"""
        with patch('main.GEMINI_API_KEY', 'test_gemini_key'), \
             patch('main.MAPBOX_ACCESS_TOKEN', 'test_token'):
            
            # Mock location resolution
            mock_get_location.return_value = "London, United Kingdom"
            
            # Mock Gemini response
            mock_response = Mock()
            mock_response.text = "Critical flood warning for London. Immediate evacuation recommended."
            mock_genai_model.return_value.generate_content.return_value = mock_response
            
            alert_data = {
                "alert": {
                    "location": "London",
                    "riskLevel": "high",
                    "returnPeriod": "20-year",
                    "date": "2024-01-16",
                    "latitude": 51.5074,
                    "longitude": -0.1278,
                    "forecastValue": 0.85,
                    "riverName": "Thames"
                }
            }
            
            response = self.client.post("/api/generate-insight", json=alert_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "insight" in data
            assert "generated_at" in data
            assert "model" in data
            assert data["model"] == "gemini-1.5-flash"
    
    def test_generate_ai_insight_no_gemini_key(self):
        """Test AI insight generation without Gemini API key"""
        with patch('main.GEMINI_API_KEY', None):
            alert_data = {
                "alert": {
                    "location": "London",
                    "riskLevel": "high",
                    "returnPeriod": "20-year",
                    "date": "2024-01-16",
                    "latitude": 51.5074,
                    "longitude": -0.1278,
                    "forecastValue": 0.85,
                    "riverName": "Thames"
                }
            }
            
            response = self.client.post("/api/generate-insight", json=alert_data)
            
            assert response.status_code == 503
            assert "AI service is not configured" in response.json()["detail"]
    
    def test_generate_ai_insight_wrong_return_period(self):
        """Test AI insight generation with wrong return period"""
        with patch('main.GEMINI_API_KEY', 'test_key'):
            alert_data = {
                "alert": {
                    "location": "London",
                    "riskLevel": "medium",
                    "returnPeriod": "5-year",  # Not 20-year
                    "date": "2024-01-16",
                    "latitude": 51.5074,
                    "longitude": -0.1278,
                    "forecastValue": 0.65,
                    "riverName": "Thames"
                }
            }
            
            response = self.client.post("/api/generate-insight", json=alert_data)
            
            assert response.status_code == 400
            assert "only available for 20-year return period" in response.json()["detail"]
    
    # ===== LOCATION NAME ENDPOINT TESTS =====
    
    @patch('main.MAPBOX_ACCESS_TOKEN', 'test_token')
    @patch('main.httpx.AsyncClient')
    def test_get_location_name_success(self, mock_async_client):
        """Test location name endpoint with successful Mapbox response"""
        # Mock successful Mapbox response
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            "features": [
                {"place_type": ["region"], "text": "California"},
                {"place_type": ["country"], "text": "United States"}
            ]
        }
        
        # Create async context manager mock using AsyncMock
        mock_client_instance = AsyncMock()
        mock_client_instance.__aenter__.return_value = mock_client_instance
        mock_client_instance.__aexit__.return_value = None
        mock_client_instance.get.return_value = mock_response
        mock_async_client.return_value = mock_client_instance
        
        response = self.client.get("/api/location-name?lat=37.7749&lon=-122.4194")
        
        assert response.status_code == 200
        data = response.json()
        assert data["location_name"] == "California, United States"
    
    @patch('main.MAPBOX_ACCESS_TOKEN', None)
    def test_get_location_name_no_token(self):
        """Test location name endpoint without Mapbox token"""
        response = self.client.get("/api/location-name?lat=37.7749&lon=-122.4194")
        
        assert response.status_code == 503
        assert "Mapbox API is not configured" in response.json()["detail"]
    
    @patch('main.MAPBOX_ACCESS_TOKEN', 'test_token')
    @patch('main.httpx.AsyncClient')
    def test_get_location_name_api_error(self, mock_async_client):
        """Test location name endpoint with Mapbox API error"""
        # Create async context manager mock with error using AsyncMock
        mock_client_instance = AsyncMock()
        mock_client_instance.__aenter__.return_value = mock_client_instance
        mock_client_instance.__aexit__.return_value = None
        mock_client_instance.get.side_effect = Exception("API Error")
        mock_async_client.return_value = mock_client_instance
        
        response = self.client.get("/api/location-name?lat=37.7749&lon=-122.4194")
        
        assert response.status_code == 500  # Should return error status
        data = response.json()
        assert "An error occurred while fetching location name" in data["detail"]
    
    # ===== ERROR HANDLING TESTS =====
    
    def test_invalid_zoom_level(self):
        """Test flood clusters endpoint with invalid zoom level"""
        response = self.client.get("/api/flood-clusters?zoom_level=25")  # Invalid zoom level
        
        assert response.status_code == 422  # Validation error
    
    def test_missing_required_parameters(self):
        """Test endpoints with missing required parameters"""
        # Test time series without coordinates
        response = self.client.get("/api/flood-points/timeseries")
        assert response.status_code == 422
        
        # Test location name without coordinates
        response = self.client.get("/api/location-name")
        assert response.status_code == 422
