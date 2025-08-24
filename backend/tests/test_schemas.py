import pytest
from schemas.significant_flood_point import SignificantFloodPoint, FloodCluster
from schemas.flood import FloodPoint, FloodAlert


class TestSignificantFloodPoint:
    """Test class for SignificantFloodPoint model"""
    
    def test_significant_flood_point_creation(self):
        """Test creating a SignificantFloodPoint with valid data"""
        point = SignificantFloodPoint(
            forecast_run_date="2024-01-15",
            valid_for_date="2024-01-16",
            lat=51.5074,
            lon=-0.1278,
            forecast_value=0.75,
            return_period="20-year"
        )
        
        assert point.forecast_run_date == "2024-01-15"
        assert point.valid_for_date == "2024-01-16"
        assert point.lat == 51.5074
        assert point.lon == -0.1278
        assert point.forecast_value == 0.75
        assert point.return_period == "20-year"
    
    def test_significant_flood_point_required_fields(self):
        """Test that required fields are enforced"""
        # Create point with missing required fields
        point = SignificantFloodPoint(
            # Missing required fields: forecast_run_date, valid_for_date, forecast_value, return_period
            lat=51.5074,
            lon=-0.1278
        )
        
        # MongoEngine validation happens on save, so we'll test the validate method
        with pytest.raises(Exception):  # MongoEngine will raise validation error
            point.validate()
    
    def test_significant_flood_point_meta_configuration(self):
        """Test that meta configuration is set correctly"""
        assert SignificantFloodPoint._meta['collection'] == 'significant_flood_points'
        assert 'forecast_run_date' in [idx[0] if isinstance(idx, tuple) else idx for idx in SignificantFloodPoint._meta['indexes']]
        assert 'valid_for_date' in [idx[0] if isinstance(idx, tuple) else idx for idx in SignificantFloodPoint._meta['indexes']]


class TestFloodCluster:
    """Test class for FloodCluster model"""
    
    def test_flood_cluster_creation(self):
        """Test creating a FloodCluster with valid data"""
        cluster = FloodCluster(
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
        
        assert cluster.zoom_level == 3
        assert cluster.geohash == "gcpv"
        assert cluster.center_lat == 51.5074
        assert cluster.center_lon == -0.1278
        assert cluster.time == "2024-01-16"
        assert cluster.point_count == 25
        assert cluster.avg_forecast == 0.65
        assert cluster.max_forecast == 0.85
        assert cluster.min_forecast == 0.45
        assert cluster.risk_level == "high"
    
    def test_flood_cluster_required_fields(self):
        """Test that required fields are enforced"""
        # Create cluster with missing required fields
        cluster = FloodCluster(
            # Missing required fields: center_lat, center_lon, time, point_count, avg_forecast, max_forecast, min_forecast, risk_level
            zoom_level=3,
            geohash="gcpv"
        )
        
        # MongoEngine validation happens on save, so we'll test the validate method
        with pytest.raises(Exception):  # MongoEngine will raise validation error
            cluster.validate()
    
    def test_flood_cluster_meta_configuration(self):
        """Test that meta configuration is set correctly"""
        assert FloodCluster._meta['collection'] == 'flood_clusters'
        indexes = FloodCluster._meta['indexes']
        assert any('zoom_level' in str(idx) for idx in indexes)
        assert any('center_lat' in str(idx) for idx in indexes)
        assert any('risk_level' in str(idx) for idx in indexes)


class TestFloodPoint:
    """Test class for FloodPoint Pydantic model"""
    
    def test_flood_point_creation(self):
        """Test creating a FloodPoint with valid data"""
        point = FloodPoint(
            latitude=51.5074,
            longitude=-0.1278,
            riskLevel="high",
            riverName="Thames",
            segmentId="thames_001"
        )
        
        assert point.latitude == 51.5074
        assert point.longitude == -0.1278
        assert point.riskLevel == "high"
        assert point.riverName == "Thames"
        assert point.segmentId == "thames_001"
        assert point.id is None  # Default value
    
    def test_flood_point_with_id(self):
        """Test creating a FloodPoint with an ID"""
        point = FloodPoint(
            _id="test_id_123",  # Use the alias field name
            latitude=51.5074,
            longitude=-0.1278,
            riskLevel="medium",
            riverName="Thames",
            segmentId="thames_001"
        )
        
        assert point.id == "test_id_123"
    
    def test_flood_point_validation(self):
        """Test that Pydantic validation works correctly"""
        # Test with invalid data types
        with pytest.raises(Exception):
            FloodPoint(
                latitude="invalid",  # Should be float
                longitude=-0.1278,
                riskLevel="high",
                riverName="Thames",
                segmentId="thames_001"
            )


class TestFloodAlert:
    """Test class for FloodAlert Pydantic model"""
    
    def test_flood_alert_creation(self):
        """Test creating a FloodAlert with valid data"""
        alert = FloodAlert(
            date="2024-01-16",
            riskLevel="critical",
            riverName="Thames",
            segmentId="thames_001"
        )
        
        assert alert.date == "2024-01-16"
        assert alert.riskLevel == "critical"
        assert alert.riverName == "Thames"
        assert alert.segmentId == "thames_001"
        assert alert.id is None  # Default value
    
    def test_flood_alert_with_id(self):
        """Test creating a FloodAlert with an ID"""
        alert = FloodAlert(
            _id="alert_123",  # Use the alias field name
            date="2024-01-16",
            riskLevel="critical",
            riverName="Thames",
            segmentId="thames_001"
        )
        
        assert alert.id == "alert_123"
