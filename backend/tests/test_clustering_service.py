import pytest
from services.clustering_service import GeohashClusteringService


class TestGeohashClusteringService:
    """Test class for GeohashClusteringService"""
    
    def setup_method(self):
        """Setup method called before each test"""
        self.service = GeohashClusteringService()
    
    def test_get_geohash_prefix(self):
        """Test that get_geohash_prefix returns correct geohash for known coordinates"""
        # Test coordinates for London, UK (approximately)
        lat = 51.5074
        lon = -0.1278
        zoom_level = 3  # State level precision (4 characters)
        
        # Get the geohash prefix
        result = self.service.get_geohash_prefix(lat, lon, zoom_level)
        
        # Assertions
        assert isinstance(result, str), "Result should be a string"
        assert len(result) == 4, f"Expected 4 characters for zoom level 3, got {len(result)}"
        assert result == "gcpv", f"Expected 'gcpv' for London coordinates, got '{result}'"
        
        # Test another location - New York City
        lat_nyc = 40.7128
        lon_nyc = -74.0060
        zoom_level_nyc = 2  # Large region level precision (3 characters)
        
        result_nyc = self.service.get_geohash_prefix(lat_nyc, lon_nyc, zoom_level_nyc)
        
        assert isinstance(result_nyc, str), "Result should be a string"
        assert len(result_nyc) == 3, f"Expected 3 characters for zoom level 2, got {len(result_nyc)}"
        assert result_nyc == "dr5", f"Expected 'dr5' for NYC coordinates, got '{result_nyc}'"
    
    def test_determine_risk_level(self):
        """Test that determine_risk_level returns correct risk levels for different forecast values"""
        
        # Test low risk (forecast <= 0.3)
        low_forecast = 0.2
        result_low = self.service.determine_risk_level(low_forecast)
        assert result_low == 'low', f"Expected 'low' for forecast {low_forecast}, got '{result_low}'"
        
        # Test boundary case for low risk
        boundary_low = 0.3
        result_boundary_low = self.service.determine_risk_level(boundary_low)
        assert result_boundary_low == 'low', f"Expected 'low' for forecast {boundary_low}, got '{result_boundary_low}'"
        
        # Test medium risk (0.3 < forecast <= 0.6)
        medium_forecast = 0.5
        result_medium = self.service.determine_risk_level(medium_forecast)
        assert result_medium == 'medium', f"Expected 'medium' for forecast {medium_forecast}, got '{result_medium}'"
        
        # Test boundary case for medium risk
        boundary_medium = 0.6
        result_boundary_medium = self.service.determine_risk_level(boundary_medium)
        assert result_boundary_medium == 'medium', f"Expected 'medium' for forecast {boundary_medium}, got '{result_boundary_medium}'"
        
        # Test high risk (0.6 < forecast <= 0.8)
        high_forecast = 0.75
        result_high = self.service.determine_risk_level(high_forecast)
        assert result_high == 'high', f"Expected 'high' for forecast {high_forecast}, got '{result_high}'"
        
        # Test boundary case for high risk
        boundary_high = 0.8
        result_boundary_high = self.service.determine_risk_level(boundary_high)
        assert result_boundary_high == 'high', f"Expected 'high' for forecast {boundary_high}, got '{result_boundary_high}'"
        
        # Test extreme risk (forecast > 0.8)
        extreme_forecast = 1.2
        result_extreme = self.service.determine_risk_level(extreme_forecast)
        assert result_extreme == 'extreme', f"Expected 'extreme' for forecast {extreme_forecast}, got '{result_extreme}'"
        
        # Test edge case - very high value
        very_high_forecast = 5.0
        result_very_high = self.service.determine_risk_level(very_high_forecast)
        assert result_very_high == 'extreme', f"Expected 'extreme' for forecast {very_high_forecast}, got '{result_very_high}'"
