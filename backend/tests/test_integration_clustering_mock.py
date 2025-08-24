import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
from services.clustering_service import GeohashClusteringService


class TestClusteringIntegrationMock:
    """Integration tests for clustering service using realistic mocked data"""
    
    def setup_method(self):
        """Set up test environment"""
        self.clustering_service = GeohashClusteringService()
    
    @patch('services.clustering_service.SignificantFloodPoint')
    def test_realistic_flood_clustering_workflow(self, mock_flood_point):
        """Test complete clustering workflow with realistic UK flood data"""
        
        # Create realistic flood points across UK regions
        mock_points = [
            # London cluster - high risk (20-year return period)
            Mock(lat=51.5074, lon=-0.1278, forecast_value=0.85, return_period='20-year', valid_for_date='2024-01-17'),
            Mock(lat=51.5085, lon=-0.1285, forecast_value=0.92, return_period='20-year', valid_for_date='2024-01-17'),
            Mock(lat=51.4994, lon=-0.1245, forecast_value=0.78, return_period='5-year', valid_for_date='2024-01-17'),
            
            # Manchester cluster - medium risk (5-year return period)
            Mock(lat=53.4808, lon=-2.2426, forecast_value=0.65, return_period='5-year', valid_for_date='2024-01-17'),
            Mock(lat=53.4834, lon=-2.2451, forecast_value=0.71, return_period='2-year', valid_for_date='2024-01-17'),
            
            # Edinburgh cluster - low risk (2-year return period)
            Mock(lat=55.9533, lon=-3.1883, forecast_value=0.55, return_period='2-year', valid_for_date='2024-01-17'),
            
            # Birmingham cluster - high risk (20-year return period)
            Mock(lat=52.4862, lon=-1.8904, forecast_value=0.88, return_period='20-year', valid_for_date='2024-01-17'),
            Mock(lat=52.4875, lon=-1.8912, forecast_value=0.82, return_period='20-year', valid_for_date='2024-01-17'),
        ]
        
        # Mock database query to return our test points
        mock_flood_point.objects.return_value = mock_points
        
        # Test clustering at city level (zoom 8)
        clusters = self.clustering_service.cluster_points_by_zoom(
            zoom_level=8,
            time='2024-01-17'
        )
        
        # Verify clustering results
        assert len(clusters) >= 3, f"Expected at least 3 clusters (cities), got {len(clusters)}"
        
        # Check cluster structure
        for cluster in clusters:
            assert 'geohash' in cluster
            assert 'center_lat' in cluster
            assert 'center_lon' in cluster
            assert 'point_count' in cluster
            assert 'avg_forecast' in cluster
            assert 'max_forecast' in cluster
            assert 'min_forecast' in cluster
            assert 'risk_level' in cluster
            assert cluster['point_count'] > 0
            
            # Verify coordinates are within UK bounds
            assert 50.0 <= cluster['center_lat'] <= 60.0, f"Latitude {cluster['center_lat']} outside UK"
            assert -8.0 <= cluster['center_lon'] <= 2.0, f"Longitude {cluster['center_lon']} outside UK"
        
        # Find cluster with highest point count
        largest_cluster = max(clusters, key=lambda c: c['point_count'])
        assert largest_cluster['point_count'] >= 1, "Should cluster at least one point"
        
        # Verify we have some high-risk clusters (20-year return period)
        high_risk_clusters = [c for c in clusters if c['risk_level'] == 'high']
        assert len(high_risk_clusters) > 0, "Should have some high-risk clusters with 20-year return periods"
        
        print(f"✅ Successfully clustered {len(mock_points)} points into {len(clusters)} clusters")
        for i, cluster in enumerate(clusters):
            print(f"   Cluster {i+1}: {cluster['point_count']} points, {cluster['risk_level']} risk")
    
    @patch('services.clustering_service.SignificantFloodPoint')
    def test_clustering_with_time_filtering(self, mock_flood_point):
        """Test that time filtering works correctly in clustering"""
        
        # Create points for different dates
        old_points = [
            Mock(lat=51.5074, lon=-0.1278, forecast_value=0.85, return_period='20-year', valid_for_date='2024-01-15'),
            Mock(lat=51.5085, lon=-0.1285, forecast_value=0.92, return_period='20-year', valid_for_date='2024-01-15'),
        ]
        
        current_points = [
            Mock(lat=51.5074, lon=-0.1278, forecast_value=0.75, return_period='5-year', valid_for_date='2024-01-17'),
            Mock(lat=53.4808, lon=-2.2426, forecast_value=0.65, return_period='2-year', valid_for_date='2024-01-17'),
        ]
        
        # Test filtering for current date only
        mock_flood_point.objects.return_value = current_points
        
        clusters = self.clustering_service.cluster_points_by_zoom(
            zoom_level=8,
            time='2024-01-17'
        )
        
        # Should only cluster current points
        total_points = sum(c['point_count'] for c in clusters)
        assert total_points == 2, f"Expected 2 points clustered, got {total_points}"
        
        # Verify the query was called with time filter
        mock_flood_point.objects.assert_called_with(valid_for_date='2024-01-17')
    
    @patch('services.clustering_service.SignificantFloodPoint')
    def test_clustering_performance_with_large_dataset(self, mock_flood_point):
        """Test clustering performance with a large number of points"""
        
        # Create 1000 mock points across UK
        import random
        random.seed(42)  # For reproducible tests
        
        mock_points = []
        for i in range(1000):
            lat = random.uniform(50.0, 60.0)  # UK latitude range
            lon = random.uniform(-8.0, 2.0)   # UK longitude range
            forecast = random.uniform(0.3, 1.0)
            
            # Assign return periods based on forecast value
            if forecast > 0.8:
                return_period = '20-year'
            elif forecast > 0.6:
                return_period = '5-year'
            else:
                return_period = '2-year'
            
            mock_points.append(
                Mock(lat=lat, lon=lon, forecast_value=forecast, return_period=return_period, valid_for_date='2024-01-17')
            )
        
        mock_flood_point.objects.return_value = mock_points
        
        # Test clustering performance
        import time
        start_time = time.time()
        
        clusters = self.clustering_service.cluster_points_by_zoom(
            zoom_level=6,  # Regional level
            time='2024-01-17'
        )
        
        clustering_time = time.time() - start_time
        
        # Performance assertions
        assert clustering_time < 2.0, f"Clustering 1000 points took {clustering_time:.2f}s, should be <2s"
        assert len(clusters) > 0, "Should create clusters from 1000 points"
        # At zoom level 6, each point might create its own cluster if spread out
        assert len(clusters) <= 1000, f"Cannot have more clusters ({len(clusters)}) than points (1000)"
        
        # Verify all points were processed
        total_clustered_points = sum(c['point_count'] for c in clusters)
        assert total_clustered_points == 1000, f"Expected 1000 points clustered, got {total_clustered_points}"
        
        print(f"✅ Clustered 1000 points into {len(clusters)} clusters in {clustering_time:.3f}s")
    
    def test_geohash_encoding_accuracy(self):
        """Test geohash encoding accuracy with known coordinates"""
        
        # Test known UK locations
        test_locations = [
            {'name': 'London', 'lat': 51.5074, 'lon': -0.1278},
            {'name': 'Edinburgh', 'lat': 55.9533, 'lon': -3.1883},
            {'name': 'Manchester', 'lat': 53.4808, 'lon': -2.2426},
            {'name': 'Cardiff', 'lat': 51.4816, 'lon': -3.1791},
        ]
        
        for location in test_locations:
            for zoom in [3, 6, 9, 12]:
                geohash = self.clustering_service.get_geohash_prefix(
                    location['lat'], location['lon'], zoom
                )
                
                # Verify geohash properties
                assert isinstance(geohash, str), f"Geohash should be string for {location['name']}"
                assert len(geohash) > 0, f"Geohash should not be empty for {location['name']}"
                
                # Higher zoom should give longer geohash (more precision)
                if zoom > 3:
                    longer_geohash = self.clustering_service.get_geohash_prefix(
                        location['lat'], location['lon'], zoom + 3
                    )
                    assert len(longer_geohash) >= len(geohash), \
                        f"Higher zoom should give longer geohash for {location['name']}"
    
    def test_risk_level_distribution(self):
        """Test risk level calculation across different forecast values"""
        
        # Test all risk levels
        test_cases = [
            # Low risk (<= 0.3)
            (0.1, 'low'), (0.2, 'low'), (0.3, 'low'),
            # Medium risk (0.3 < x <= 0.6)
            (0.4, 'medium'), (0.5, 'medium'), (0.6, 'medium'),
            # High risk (0.6 < x <= 0.8)
            (0.7, 'high'), (0.8, 'high'),
            # Extreme risk (> 0.8)
            (0.9, 'extreme'), (0.95, 'extreme'),
        ]
        
        for forecast_value, expected_risk in test_cases:
            actual_risk = self.clustering_service.determine_risk_level(forecast_value)
            assert actual_risk == expected_risk, \
                f"Forecast {forecast_value} should be {expected_risk}, got {actual_risk}"
    
    @patch('services.clustering_service.SignificantFloodPoint')
    def test_empty_result_handling(self, mock_flood_point):
        """Test clustering handles empty database gracefully"""
        
        # Mock empty database
        mock_flood_point.objects.return_value = []
        
        clusters = self.clustering_service.cluster_points_by_zoom(
            zoom_level=8,
            time='2024-01-17'
        )
        
        # Should return empty list, not crash
        assert clusters == [], "Empty database should return empty cluster list"
    
    @patch('services.clustering_service.SignificantFloodPoint')
    def test_clustering_edge_cases(self, mock_flood_point):
        """Test clustering with edge case data"""
        
        # Test with extreme coordinates
        edge_points = [
            # Northern Scotland
            Mock(lat=58.9699, lon=-3.3018, forecast_value=0.6, return_period='5-year', valid_for_date='2024-01-17'),
            # Southern England  
            Mock(lat=50.7184, lon=-1.8794, forecast_value=0.8, return_period='20-year', valid_for_date='2024-01-17'),
            # Western Wales
            Mock(lat=52.9548, lon=-4.0762, forecast_value=0.5, return_period='2-year', valid_for_date='2024-01-17'),
            # Eastern England
            Mock(lat=52.6309, lon=1.2974, forecast_value=0.9, return_period='20-year', valid_for_date='2024-01-17'),
        ]
        
        mock_flood_point.objects.return_value = edge_points
        
        clusters = self.clustering_service.cluster_points_by_zoom(
            zoom_level=5,  # Country level
            time='2024-01-17'
        )
        
        # Should handle extreme coordinates without errors
        assert len(clusters) > 0, "Should cluster edge case coordinates"
        
        for cluster in clusters:
            # Verify all coordinates are valid
            assert -90 <= cluster['center_lat'] <= 90, "Invalid latitude"
            assert -180 <= cluster['center_lon'] <= 180, "Invalid longitude"
            assert 0 <= cluster['avg_forecast'] <= 1, "Invalid forecast value"
            assert cluster['risk_level'] in ['low', 'medium', 'high', 'extreme'], "Invalid risk level"
