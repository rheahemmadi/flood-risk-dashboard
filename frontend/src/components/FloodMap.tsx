'use client'

import React, { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FloodAlert, FloodPoint, FloodSegment } from '@/lib/types/flood';
import { FloodService, FloodCluster } from '@/lib/services/floodService';
import { MAPBOX_CONFIG, getMarkerColor, getMarkerSize, getFloodPointSize } from '@/lib/config/mapbox';
import { AlertTriangle } from 'lucide-react';
import { SearchSuggestion, flyToLocation } from '@/lib/utils/search';

interface FloodMapProps {
  alerts: FloodAlert[];
  onAlertClick: (alert: FloodAlert) => void;
  selectedDate: string;
  riskFilter: string[];
  searchQuery?: string;
  floodPoints?: FloodPoint[];
  floodSegments?: FloodSegment[];
}

const FloodMap = forwardRef<any, FloodMapProps>(({ 
  alerts, 
  onAlertClick, 
  selectedDate, 
  riskFilter, 
  searchQuery,
  floodPoints = [],
  floodSegments = []
}, ref) => {
  const [popupInfo, setPopupInfo] = useState<FloodAlert | null>(null);
  const [viewState, setViewState] = useState(MAPBOX_CONFIG.defaultViewport);
  const [isClient, setIsClient] = useState(false);
  const [clusterInfo, setClusterInfo] = useState<any>(null);
  const [floodClusters, setFloodClusters] = useState<FloodCluster[]>([]);
  const [viewportFloodPoints, setViewportFloodPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetchParams, setLastFetchParams] = useState<string>('');
  const [lastPointFetchParams, setLastPointFetchParams] = useState<string>('');
  const mapRef = useRef<any>(null);

  // Expose map ref to parent component
  useImperativeHandle(ref, () => mapRef.current);

  // Ensure component is mounted on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch clustered flood data when viewport or filters change
  const fetchClusters = useCallback(async (force = false) => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    const zoom = Math.floor(map.getZoom());
    const bounds = map.getBounds();
    
    // Create a unique key for this fetch request
    const fetchKey = `${zoom}-${selectedDate}-${riskFilter.join(',')}-${bounds.getNorth().toFixed(2)}-${bounds.getSouth().toFixed(2)}-${bounds.getEast().toFixed(2)}-${bounds.getWest().toFixed(2)}`;
    
    // Skip if we've already fetched this exact data (unless forced)
    if (!force && fetchKey === lastFetchParams) {
      return;
    }
    
    setLoading(true);
    try {
      const clusterData = await FloodService.getFloodClusters({
        zoom_level: zoom,
        time: selectedDate,
        bounds: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        },
        risk_level: riskFilter.length === 1 ? riskFilter[0] as any : undefined
      });
      
      setFloodClusters(clusterData.clusters);
      setLastFetchParams(fetchKey);
    } catch (error) {
      console.error('Error fetching clusters:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, riskFilter, lastFetchParams]);

  // Fetch flood points for current viewport when zoomed in
  const fetchViewportPoints = useCallback(async (force = false) => {
    if (!mapRef.current || viewState.zoom <= 8) return;
    
    const map = mapRef.current;
    const bounds = map.getBounds();
    
    // Create a unique key for this fetch request
    const fetchKey = `${viewState.zoom}-${selectedDate}-${riskFilter.join(',')}-${bounds.getNorth().toFixed(2)}-${bounds.getSouth().toFixed(2)}-${bounds.getEast().toFixed(2)}-${bounds.getWest().toFixed(2)}`;
    
    // Skip if we've already fetched this exact data (unless forced)
    if (!force && fetchKey === lastPointFetchParams) {
      return;
    }
    
    try {
      const pointData = await FloodService.getFloodPoints({
        limit: 2000,
        time: selectedDate,
        bounds: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        }
      });
      
      setViewportFloodPoints(pointData.points);
      setLastPointFetchParams(fetchKey);
    } catch (error) {
      console.error('Error fetching viewport points:', error);
    }
  }, [viewState.zoom, selectedDate, riskFilter, lastPointFetchParams]);

  // Fetch clusters when dependencies change
  useEffect(() => {
    if (isClient) {
      fetchClusters(true); // Force fetch when filters change
    }
  }, [selectedDate, riskFilter, isClient]);

  // Auto-center map only on initial load (commented out to prevent continuous movement)
  // useEffect(() => {
  //   if (floodClusters.length > 0 && mapRef.current) {
  //     const bounds = getDataBounds(floodClusters);
  //     if (bounds) {
  //       mapRef.current.fitBounds(bounds, {
  //         padding: 50,
  //         duration: 1000
  //       });
  //     }
  //   }
  // }, [floodClusters]);

  // Helper function to calculate bounds from clusters
  const getDataBounds = (clusters: FloodCluster[]) => {
    if (clusters.length === 0) return null;
    
    const lats = clusters.map(c => c.lat);
    const lngs = clusters.map(c => c.lon);
    
    return [
      [Math.min(...lngs), Math.min(...lats)], // Southwest
      [Math.max(...lngs), Math.max(...lats)]  // Northeast
    ];
  };

  // Filter alerts based on selected filters
  const filteredAlerts = alerts.filter(alert => 
    riskFilter.includes(alert.riskLevel) && 
    alert.date === selectedDate
  );

  // Filter flood segments based on risk filter
  const filteredFloodSegments = floodSegments.filter(segment => 
    riskFilter.includes(segment.riskLevel)
  );

  // Convert flood clusters to GeoJSON for rendering
  const floodClustersGeoJSON = {
    type: 'FeatureCollection' as const,
    features: floodClusters.map(cluster => ({
      type: 'Feature' as const,
      properties: {
        id: cluster.id,
        point_count: cluster.point_count,
        avg_forecast: cluster.avg_forecast,
        max_forecast: cluster.max_forecast,
        min_forecast: cluster.min_forecast,
        risk_level: cluster.risk_level,
        time: cluster.time
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [cluster.lon, cluster.lat]
      }
    }))
  };

  // Convert flood segments to GeoJSON for line rendering
  const floodSegmentsGeoJSON = {
    type: 'FeatureCollection' as const,
    features: filteredFloodSegments.map(segment => ({
      type: 'Feature' as const,
      properties: {
        id: segment.id,
        riverName: segment.riverName,
        riskLevel: segment.riskLevel
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: segment.points.map(point => [point.longitude, point.latitude])
      }
    }))
  };

  const onMarkerClick = useCallback((alert: FloodAlert) => {
    setPopupInfo(alert);
    onAlertClick(alert);
  }, [onAlertClick]);

  const onMapClick = useCallback(() => {
    setPopupInfo(null);
    setClusterInfo(null);
  }, []);

  const handleLocationSelect = useCallback((suggestion: SearchSuggestion) => {
    flyToLocation(mapRef, suggestion.center, suggestion.bbox);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    // This will be connected to the header search if needed
  }, []);

  // Handle cluster click
  const handleClusterClick = useCallback((event: any) => {
    const feature = event.features[0];
    if (!feature.properties.cluster_id) return;
    
    const clusterId = feature.properties.cluster_id;
    const mapboxSource = mapRef.current.getSource('flood-clusters');
    
    mapboxSource.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
      if (err) return;
      
      mapRef.current.easeTo({
        center: feature.geometry.coordinates,
        zoom: zoom
      });
    });
  }, []);

  // Handle cluster mouse enter
  const handleClusterMouseEnter = useCallback((event: any) => {
    const feature = event.features[0];
    if (!feature.properties.point_count) return;
    
    const pointCount = feature.properties.point_count;
    const coordinates = feature.geometry.coordinates.slice();
    const riskLevel = feature.properties.risk_level;
    
    setClusterInfo({
      coordinates,
      pointCount,
      riskLevel,
      avgForecast: feature.properties.avg_forecast,
      maxForecast: feature.properties.max_forecast
    });
  }, []);

  // Handle cluster mouse leave
  const handleClusterMouseLeave = useCallback(() => {
    setClusterInfo(null);
  }, []);

  // Handle map move to refetch clusters and points
  const handleMapMove = useCallback((evt: any) => {
    setViewState(evt.viewState);
    
    // More aggressive debounced fetch to prevent continuous movement
    clearTimeout((window as any).clusterTimeout);
    (window as any).clusterTimeout = setTimeout(() => {
      fetchClusters(false);
      fetchViewportPoints(false);
    }, 1000);
  }, [fetchClusters, fetchViewportPoints]);

  // Check if Mapbox token is configured
  if (!MAPBOX_CONFIG.accessToken || MAPBOX_CONFIG.accessToken === 'your_mapbox_token_here') {
    return (
      <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Mapbox Token Required</h3>
          <p className="text-sm text-gray-600 mb-4">
            To display the interactive map, you need to add your Mapbox access token.
          </p>
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              1. Get a free token from <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">mapbox.com</a>
            </p>
            <p className="text-xs text-gray-500">
              2. Create a <code className="bg-gray-100 px-1 rounded">.env.local</code> file in your frontend directory
            </p>
            <p className="text-xs text-gray-500">
              3. Add: <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render map until client-side
  if (!isClient) {
    return (
      <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ifrc-red mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium">Loading flood data...</span>
          </div>
        </div>
      )}
      
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleMapMove}
        onClick={(event) => {
          const features = event.features || [];
          const clusterFeature = features.find(f => f.properties?.cluster_id);
          
          if (clusterFeature) {
            handleClusterClick({ features: [clusterFeature] });
          } else {
            onMapClick();
          }
        }}
        onMouseEnter={(event) => {
          const features = event.features || [];
          const clusterFeature = features.find(f => f.properties?.point_count);
          
          if (clusterFeature) {
            handleClusterMouseEnter({ features: [clusterFeature] });
          }
        }}
        onMouseLeave={handleClusterMouseLeave}
        mapStyle={MAPBOX_CONFIG.mapStyle}
        mapboxAccessToken={MAPBOX_CONFIG.accessToken}
        style={{ width: '100%', height: '100%' }}
        maxZoom={MAPBOX_CONFIG.mapOptions.maxZoom}
        minZoom={MAPBOX_CONFIG.mapOptions.minZoom}
      >
        {/* Navigation controls */}
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {/* Flood River Segments (Lines) */}
        {filteredFloodSegments.length > 0 && (
          <Source id="flood-segments" type="geojson" data={floodSegmentsGeoJSON}>
            {/* Background line for better visibility */}
            <Layer
              id="flood-segments-lines-bg"
              type="line"
              paint={{
                'line-color': '#ffffff',
                'line-width': [
                  'case',
                  ['==', ['get', 'riskLevel'], 'high'], 12,
                  ['==', ['get', 'riskLevel'], 'medium'], 10,
                  8
                ],
                'line-opacity': 0.9
              }}
            />
            {/* Main colored line */}
            <Layer
              id="flood-segments-lines"
              type="line"
              paint={{
                'line-color': [
                  'case',
                  ['==', ['get', 'riskLevel'], 'high'], '#dc2626',
                  ['==', ['get', 'riskLevel'], 'medium'], '#f59e0b',
                  '#10b981'
                ],
                'line-width': [
                  'case',
                  ['==', ['get', 'riskLevel'], 'high'], 8,
                  ['==', ['get', 'riskLevel'], 'medium'], 6,
                  4
                ],
                'line-opacity': 0.9
              }}
            />
          </Source>
        )}

        {/* Clustered Flood Points */}
        {floodClusters.length > 0 && (
          <Source 
            id="flood-clusters" 
            type="geojson" 
            data={floodClustersGeoJSON}
            cluster={true}
            clusterMaxZoom={12}
            clusterRadius={80}
          >
            {/* Clusters */}
            <Layer
              id="clusters"
              type="circle"
              filter={['all', ['has', 'point_count'], ['>=', ['get', 'point_count'], 5]]}
              paint={{
                'circle-color': '#2563eb', // Fixed blue color
                'circle-radius': 18, // Fixed radius
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
              }}
            />
            
          
            
            {/* Unclustered points - only show individual points at high zoom levels */}
            <Layer
              id="unclustered-point"
              type="circle"
              filter={['!', ['has', 'point_count']]}
              paint={{
                'circle-color': [
                  'case',
                  ['==', ['get', 'risk_level'], 'extreme'], '#7c2d12',
                  ['==', ['get', 'risk_level'], 'high'], '#dc2626',
                  ['==', ['get', 'risk_level'], 'medium'], '#f59e0b',
                  '#10b981'
                ],
                'circle-radius': [
                  'case',
                  ['==', ['get', 'risk_level'], 'extreme'], 12,
                  ['==', ['get', 'risk_level'], 'high'], 10,
                  ['==', ['get', 'risk_level'], 'medium'], 8,
                  6
                ],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
              }}
            />
          </Source>
        )}

        {/* Flood Alert Markers - Show individual points when zoomed in (no clusters) */}
        {viewState.zoom > 8 && viewportFloodPoints.map((point) => {
           let riskLevel: 'high' | 'medium' | 'low' = 'low';
           if (point.return_period === '20-year') {
             riskLevel = 'high';
           } else if (point.return_period === '5-year') {
             riskLevel = 'medium';
           } else if (point.return_period === '2-year') {
             riskLevel = 'low';
           }
          // const riskLevel = point.forecast_value >= 5.0 ? 'high' : 
          //                  point.forecast_value >= 2.0 ? 'medium' : 'low';
          return (
            <Marker
              key={point.id}
              latitude={point.lat}
              longitude={point.lon}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                // Create a FloodAlert object for the popup
                const alert: FloodAlert = {
                  id: point.id,
                  latitude: point.lat,
                  longitude: point.lon,
                  location: `Flood Point ${point.id}`,
                  riskLevel,
                  returnPeriod: point.return_period,
                  trend: 'stable',
                  date: point.forecast_run_date || point.time,
                  forecastValue: point.forecast_value,
                  riverName: `Flood Point ${point.id}`,
                  description: `Flood risk point with forecast value: ${point.forecast_value}`
                };
                onMarkerClick(alert);
              }}
            >
              <div
                className="cursor-pointer transform hover:scale-110 transition-transform duration-200"
                style={{
                  width: getFloodPointSize(riskLevel),
                  height: getFloodPointSize(riskLevel),
                  backgroundColor: getMarkerColor(riskLevel),
                  border: '3px solid white',
                  borderRadius: '50%',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.8)'
                }}
                title={`Flood Point ${point.id} - ${riskLevel} risk (${point.forecast_value})`}
              />
            </Marker>
          );
        })}

        {/* Popup for selected marker */}
        {popupInfo && (
          <Popup
            anchor="bottom"
            latitude={popupInfo.latitude}
            longitude={popupInfo.longitude}
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            closeOnClick={false}
            maxWidth="300px"
          >
            <div className="p-2">
              <h3 className="font-semibold text-sm">{popupInfo.location}</h3>
              <p className="text-xs text-gray-600 mb-1">
                {popupInfo.riverName && `${popupInfo.riverName} • `}
                {popupInfo.riskLevel.toUpperCase()} Risk
              </p>
              <p className="text-xs text-gray-500">
                Return Period: {popupInfo.returnPeriod} • Trend: {popupInfo.trend}
              </p>
            </div>
          </Popup>
        )}

        {/* Cluster info popup */}
        {clusterInfo && (
          <Popup
            anchor="bottom"
            latitude={clusterInfo.coordinates[1]}
            longitude={clusterInfo.coordinates[0]}
            onClose={() => setClusterInfo(null)}
            closeButton={false}
            closeOnClick={false}
            maxWidth="200px"
          >
            <div className="p-2">
              <h3 className="font-semibold text-sm">{clusterInfo.pointCount} Flood Points</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{
                      backgroundColor: clusterInfo.riskLevel === 'extreme' ? '#7c2d12' :
                                     clusterInfo.riskLevel === 'high' ? '#dc2626' :
                                     clusterInfo.riskLevel === 'medium' ? '#f59e0b' : '#10b981'
                    }}
                  ></div>
                  <span className="capitalize">{clusterInfo.riskLevel} Risk</span>
                </div>
                <p>Avg: {clusterInfo.avgForecast?.toFixed(2)}</p>
                <p>Max: {clusterInfo.maxForecast?.toFixed(2)}</p>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
});

export default FloodMap;
