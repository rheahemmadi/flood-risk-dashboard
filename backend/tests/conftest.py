import pytest
from unittest.mock import Mock, patch
from schemas.significant_flood_point import SignificantFloodPoint, FloodCluster


@pytest.fixture
def sample_flood_point():
    """Fixture providing a sample flood point for testing"""
    return SignificantFloodPoint(
        forecast_run_date="2024-01-15",
        valid_for_date="2024-01-16",
        lat=51.5074,
        lon=-0.1278,
        forecast_value=0.75,
        return_period="20-year"
    )


@pytest.fixture
def sample_flood_cluster():
    """Fixture providing a sample flood cluster for testing"""
    return FloodCluster(
        zoom_level=3,
        geohash="gcpv",
        center_lat=51.5074,
        center_lon=-0.1278,
        time="2024-01-16",
        point_count=25,
        avg_forecast=0.65,
        max_forecast=0.85,
        min_forecast=0.45,
        risk_level="high"
    )


@pytest.fixture
def mock_flood_points():
    """Fixture providing mock flood points for testing"""
    points = []
    for i in range(5):
        point = Mock()
        point.id = f"point_{i}"
        point.forecast_run_date = "2024-01-15"
        point.valid_for_date = "2024-01-16"
        point.lat = 51.5074 + (i * 0.001)
        point.lon = -0.1278 + (i * 0.001)
        point.forecast_value = 0.6 + (i * 0.1)
        point.return_period = "20-year" if i > 2 else "5-year"
        points.append(point)
    return points


@pytest.fixture
def mock_flood_clusters():
    """Fixture providing mock flood clusters for testing"""
    clusters = []
    for i in range(3):
        cluster = Mock()
        cluster.id = f"cluster_{i}"
        cluster.zoom_level = 3
        cluster.geohash = f"gcpv{i}"
        cluster.center_lat = 51.5074 + (i * 0.01)
        cluster.center_lon = -0.1278 + (i * 0.01)
        cluster.time = "2024-01-16"
        cluster.point_count = 20 + (i * 5)
        cluster.avg_forecast = 0.6 + (i * 0.1)
        cluster.max_forecast = 0.8 + (i * 0.1)
        cluster.min_forecast = 0.4 + (i * 0.1)
        cluster.risk_level = "high" if i == 0 else "medium"
        clusters.append(cluster)
    return clusters


@pytest.fixture
def mock_mapbox_response():
    """Fixture providing mock Mapbox API response"""
    return {
        "features": [
            {"place_type": ["region"], "text": "California"},
            {"place_type": ["country"], "text": "United States"}
        ]
    }


@pytest.fixture
def mock_gemini_response():
    """Fixture providing mock Gemini API response"""
    response = Mock()
    response.text = "Critical flood warning for California. Immediate evacuation recommended."
    return response


@pytest.fixture(autouse=True)
def mock_database_connection():
    """Automatically mock database connections for all tests"""
    with patch('config.database.connect_to_mongo'):
        yield


@pytest.fixture(autouse=True)
def mock_environment_variables():
    """Automatically mock environment variables for testing"""
    with patch.dict('os.environ', {
        'MAPBOX_ACCESS_TOKEN': 'test_mapbox_token',
        'GEMINI_API_KEY': 'test_gemini_key',
        'PIPELINE_API_KEY': 'test_pipeline_key'
    }):
        yield
