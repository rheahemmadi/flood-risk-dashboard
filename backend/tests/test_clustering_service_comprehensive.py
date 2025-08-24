import pytest
from unittest.mock import Mock, patch, MagicMock
from services.clustering_service import GeohashClusteringService
from schemas.significant_flood_point import SignificantFloodPoint, FloodCluster


class TestGeohashClusteringServiceComprehensive:
    """Comprehensive test class for GeohashClusteringService with mocking"""
    
    def setup_method(self):
        """Setup method called before each test"""
        self.service = GeohashClusteringService()
    
    # ===== GEOHASH ENCODING TESTS =====
    
    def test_encode_geohash_basic(self):
        """Test basic geohash encoding functionality"""
        # Test London coordinates
        result = self.service.encode_geohash(51.5074, -0.1278, precision=6)
        assert isinstance(result, str)
        assert len(result) == 6
        assert result.startswith('gcpv')
    
    def test_encode_geohash_different_precisions(self):
        """Test geohash encoding with different precision levels"""
        lat, lon = 40.7128, -74.0060  # NYC coordinates
        
        # Test different precision levels
        for precision in [1, 3, 5, 7, 9]:
            result = self.service.encode_geohash(lat, lon, precision)
            assert len(result) == precision
            assert isinstance(result, str)
    
    def test_encode_geohash_edge_cases(self):
        """Test geohash encoding with edge case coordinates"""
        # Test coordinates at boundaries
        edge_cases = [
            (90.0, 180.0),   # Max lat, max lon
            (-90.0, -180.0), # Min lat, min lon
            (0.0, 0.0),      # Origin
            (45.0, 90.0),    # Mid-range
        ]
        
        for lat, lon in edge_cases:
            result = self.service.encode_geohash(lat, lon, precision=5)
            assert isinstance(result, str)
            assert len(result) == 5
    
    # ===== GEOHASH DECODING TESTS =====
    
    def test_decode_geohash_bounds(self):
        """Test geohash decoding to bounding box"""
        geohash = "gcpv"  # London area
        bounds = self.service.decode_geohash_bounds(geohash)
        
        assert isinstance(bounds, dict)
        assert 'south' in bounds
        assert 'north' in bounds
        assert 'west' in bounds
        assert 'east' in bounds
        
        # Bounds should be valid
        assert bounds['south'] < bounds['north']
        assert bounds['west'] < bounds['east']
        assert bounds['south'] >= -90.0
        assert bounds['north'] <= 90.0
        assert bounds['west'] >= -180.0
        assert bounds['east'] <= 180.0
    
    def test_decode_geohash_consistency(self):
        """Test that encode and decode are consistent"""
        original_lat, original_lon = 51.5074, -0.1278
        geohash = self.service.encode_geohash(original_lat, original_lon, precision=6)
        bounds = self.service.decode_geohash_bounds(geohash)
        
        # The original coordinates should be within the decoded bounds
        assert bounds['south'] <= original_lat <= bounds['north']
        assert bounds['west'] <= original_lon <= bounds['east']
    
    # ===== ZOOM LEVEL MAPPING TESTS =====
    
    def test_zoom_to_precision_mapping(self):
        """Test zoom level to precision mapping"""
        expected_mappings = {
            0: 1,  # Continent level
            1: 2,  # Country level
            2: 3,  # Large region level
            3: 4,  # State level
            4: 5,  # Large city level
        }
        
        for zoom_level, expected_precision in expected_mappings.items():
            precision = self.service.ZOOM_TO_PRECISION.get(zoom_level, 6)
            assert precision == expected_precision
    
    def test_get_geohash_prefix_zoom_levels(self):
        """Test get_geohash_prefix with different zoom levels"""
        lat, lon = 51.5074, -0.1278
        
        for zoom_level in [0, 1, 2, 3, 4]:
            prefix = self.service.get_geohash_prefix(lat, lon, zoom_level)
            expected_length = self.service.ZOOM_TO_PRECISION[zoom_level]
            assert len(prefix) == expected_length
    
    # ===== RISK LEVEL DETERMINATION TESTS =====
    
    def test_determine_risk_level_all_categories(self):
        """Test risk level determination for all categories"""
        test_cases = [
            (0.1, 'low'),
            (0.3, 'low'),      # Boundary
            (0.4, 'medium'),
            (0.6, 'medium'),   # Boundary
            (0.7, 'high'),
            (0.8, 'high'),     # Boundary
            (0.9, 'extreme'),
            (1.5, 'extreme'),
        ]
        
        for forecast_value, expected_risk in test_cases:
            result = self.service.determine_risk_level(forecast_value)
            assert result == expected_risk, f"Expected {expected_risk} for {forecast_value}, got {result}"
    
    def test_determine_risk_level_edge_cases(self):
        """Test risk level determination with edge cases"""
        # Test negative values (should still work)
        assert self.service.determine_risk_level(-0.5) == 'low'
        
        # Test very large values
        assert self.service.determine_risk_level(1000.0) == 'extreme'
        
        # Test zero
        assert self.service.determine_risk_level(0.0) == 'low'
    
    # ===== CLUSTERING TESTS WITH MOCKING =====
    
    @patch('services.clustering_service.SignificantFloodPoint')
    def test_cluster_points_by_zoom_no_points(self, mock_significant_flood_point):
        """Test clustering when no points are found"""
        # Mock empty query result
        mock_significant_flood_point.objects.return_value = []
        
        result = self.service.cluster_points_by_zoom(zoom_level=3, time="2024-01-16")
        
        assert result == []
        mock_significant_flood_point.objects.assert_called_once_with(valid_for_date="2024-01-16")
    
    @patch('services.clustering_service.SignificantFloodPoint')
    @patch('services.clustering_service.FloodCluster')
    def test_cluster_points_by_zoom_with_points(self, mock_flood_cluster, mock_significant_flood_point):
        """Test clustering with mock points"""
        # Create mock points
        mock_point1 = Mock()
        mock_point1.lat = 51.5074
        mock_point1.lon = -0.1278
        mock_point1.forecast_value = 0.75
        mock_point1.return_period = "20-year"
        
        mock_point2 = Mock()
        mock_point2.lat = 51.5075
        mock_point2.lon = -0.1279
        mock_point2.forecast_value = 0.85
        mock_point2.return_period = "20-year"
        
        # Mock the query to return our test points
        mock_significant_flood_point.objects.return_value = [mock_point1, mock_point2]
        
        # Mock FloodCluster constructor
        mock_cluster_instance = Mock()
        mock_flood_cluster.return_value = mock_cluster_instance
        
        result = self.service.cluster_points_by_zoom(zoom_level=3, time="2024-01-16")
        
        # Verify the query was called correctly
        mock_significant_flood_point.objects.assert_called_once_with(valid_for_date="2024-01-16")
        
        # Verify FloodCluster was created
        assert mock_flood_cluster.called
    
    @patch('services.clustering_service.SignificantFloodPoint')
    def test_cluster_points_by_zoom_without_time_filter(self, mock_significant_flood_point):
        """Test clustering without time filter"""
        # Mock empty result
        mock_significant_flood_point.objects.return_value = []
        
        self.service.cluster_points_by_zoom(zoom_level=3)
        
        # Should call without time filter
        mock_significant_flood_point.objects.assert_called_once_with()
    
    # ===== SUB-CLUSTERS TESTS =====
    
    @patch('services.clustering_service.SignificantFloodPoint')
    def test_get_sub_clusters(self, mock_significant_flood_point):
        """Test getting sub-clusters within parent bounds"""
        # Mock the cluster_points_by_zoom method
        with patch.object(self.service, 'cluster_points_by_zoom') as mock_cluster_method:
            mock_cluster_method.return_value = []
            
            result = self.service.get_sub_clusters(
                parent_geohash="gcpv",
                parent_zoom_level=2,
                child_zoom_level=3,
                time="2024-01-16"
            )
            
            assert result == []
            mock_cluster_method.assert_called_once()
    
    # ===== VIEWPORT CLUSTERS TESTS =====
    
    @patch('services.clustering_service.FloodCluster')
    def test_get_clusters_for_viewport(self, mock_flood_cluster):
        """Test getting clusters for a specific viewport"""
        # Mock cluster objects
        mock_cluster1 = Mock()
        mock_cluster1.id = "cluster_1"
        mock_cluster1.zoom_level = 3
        mock_cluster1.geohash = "gcpv"
        mock_cluster1.center_lat = 51.5074
        mock_cluster1.center_lon = -0.1278
        mock_cluster1.time = "2024-01-16"
        mock_cluster1.point_count = 25
        mock_cluster1.avg_forecast = 0.65
        mock_cluster1.max_forecast = 0.85
        mock_cluster1.min_forecast = 0.45
        mock_cluster1.risk_level = "high"
        
        mock_cluster2 = Mock()
        mock_cluster2.id = "cluster_2"
        mock_cluster2.zoom_level = 3
        mock_cluster2.geohash = "gcpvx"
        mock_cluster2.center_lat = 51.5075
        mock_cluster2.center_lon = -0.1279
        mock_cluster2.time = "2024-01-16"
        mock_cluster2.point_count = 15
        mock_cluster2.avg_forecast = 0.55
        mock_cluster2.max_forecast = 0.75
        mock_cluster2.min_forecast = 0.35
        mock_cluster2.risk_level = "medium"
        
        # Mock the objects method to return our test clusters
        mock_flood_cluster.objects.return_value = [mock_cluster1, mock_cluster2]
        
        bounds = {
            'south': 51.5,
            'north': 51.6,
            'west': -0.13,
            'east': -0.12
        }
        
        result = self.service.get_clusters_for_viewport(
            zoom_level=3,
            bounds=bounds,
            time="2024-01-16"
        )
        
        # Verify the query was called with correct parameters
        mock_flood_cluster.objects.assert_called_once_with(
            zoom_level=3,
            time="2024-01-16",
            center_lat__gte=51.5,
            center_lat__lte=51.6,
            center_lon__gte=-0.13,
            center_lon__lte=-0.12
        )
        
        # Verify result structure
        assert len(result) == 2
        assert result[0]['id'] == "cluster_1"
        assert result[1]['id'] == "cluster_2"
        assert result[0]['zoom_level'] == 3
        assert result[0]['risk_level'] == "high"
    
    @patch('services.clustering_service.FloodCluster')
    def test_get_clusters_for_viewport_no_bounds(self, mock_flood_cluster):
        """Test getting clusters without viewport bounds"""
        mock_flood_cluster.objects.return_value = []
        
        result = self.service.get_clusters_for_viewport(zoom_level=3, bounds=None)
        
        # Should call without bounds parameters
        mock_flood_cluster.objects.assert_called_once_with(zoom_level=3)
        assert result == []
    
    # ===== INTEGRATION TESTS =====
    
    def test_full_clustering_workflow_mock(self):
        """Test the full clustering workflow with mocked data"""
        with patch('services.clustering_service.SignificantFloodPoint') as mock_significant_flood_point, \
             patch('services.clustering_service.FloodCluster') as mock_flood_cluster:
            
            # Create realistic mock data
            mock_points = []
            for i in range(5):  # 5 points in the same geohash area
                mock_point = Mock()
                mock_point.lat = 51.5074 + (i * 0.001)  # Slightly different lats
                mock_point.lon = -0.1278 + (i * 0.001)  # Slightly different lons
                mock_point.forecast_value = 0.6 + (i * 0.1)  # Different forecast values
                mock_point.return_period = "20-year" if i > 2 else "5-year"
                mock_points.append(mock_point)
            
            mock_significant_flood_point.objects.return_value = mock_points
            
            # Mock cluster instance
            mock_cluster_instance = Mock()
            mock_flood_cluster.return_value = mock_cluster_instance
            
            # Run clustering
            result = self.service.cluster_points_by_zoom(zoom_level=3, time="2024-01-16")
            
            # Verify cluster was created with correct parameters
            mock_flood_cluster.assert_called_once()
            call_args = mock_flood_cluster.call_args[1]
            assert call_args['zoom_level'] == 3
            assert call_args['time'] == "2024-01-16"
            assert call_args['point_count'] == 5
            assert call_args['risk_level'] == 'high'  # Because some points have 20-year return period
