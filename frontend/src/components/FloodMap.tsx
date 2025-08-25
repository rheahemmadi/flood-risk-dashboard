'use client'

import React, { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FloodAlert, FloodSegment } from '@/lib/types/flood';
import { FloodService, FloodCluster } from '@/lib/services/floodService';
import { fetchFloodClustersForViewport } from '@/lib/data/floodData';
import { MAPBOX_CONFIG, getMarkerColor, getFloodPointSize } from '@/lib/config/mapbox';
import { AlertTriangle } from 'lucide-react';

interface FloodMapProps {
  onAlertClick: (alert: FloodAlert) => void;
  selectedDate: string;
  riskFilter: string[];
  floodSegments?: FloodSegment[];
}

const FloodMap = forwardRef<any, FloodMapProps>(({ 
  onAlertClick, 
  selectedDate, 
  riskFilter, 
  floodSegments = []
}, ref) => {
  const [popupInfo, setPopupInfo] = useState<FloodAlert | null>(null);
  const [viewState, setViewState] = useState(MAPBOX_CONFIG.defaultViewport);
  const [isClient, setIsClient] = useState(false);

  const [floodClusters, setFloodClusters] = useState<FloodCluster[]>([]);
  const [viewportFloodPoints, setViewportFloodPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [lastFetchParams, setLastFetchParams] = useState<string>('');
  const [lastPointFetchParams, setLastPointFetchParams] = useState<string>('');
  const mapRef = useRef<any>(null);

  useImperativeHandle(ref, () => mapRef.current);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch clustered flood data when viewport or filters change
  const fetchClusters = useCallback(async (force = false) => {
    console.log('fetchClusters called with force:', force, 'selectedDate:', selectedDate);
    if (!mapRef.current) {
      console.log('No map ref, returning early');
      return;
    }
    
    const map = mapRef.current;
    const zoom = Math.floor(map.getZoom());
    const bounds = map.getBounds();
    
    // Create a unique key for this fetch request
    const fetchKey = `${zoom}-${selectedDate}-${riskFilter.join(',')}-${bounds.getNorth().toFixed(2)}-${bounds.getSouth().toFixed(2)}-${bounds.getEast().toFixed(2)}-${bounds.getWest().toFixed(2)}`;
    console.log('Fetch key:', fetchKey);
    console.log('Last fetch params:', lastFetchParams);

    // Skip if we've already fetched this exact data (unless forced)
    if (!force && fetchKey === lastFetchParams) {
      console.log('Skipping fetch - same data already fetched');
      return;
    }
    
    setLoading(true);
    try {
      console.log("zoom level", map.getZoom());
      
      const clusters = await fetchFloodClustersForViewport(
        zoom,
        {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        },
        selectedDate,
        riskFilter.length === 1 ? riskFilter[0] as any : undefined
      );
      

      if (zoom <= 7) {
        setFloodClusters(clusters);
      }
      setLastFetchParams(fetchKey);
    } catch (error) {
      console.error('Error fetching clusters:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, riskFilter, lastFetchParams]);

  // Fetch flood points for current viewport when zoomed in
  const fetchViewportPoints = useCallback(async (force = false) => {
    if (!mapRef.current || viewState.zoom <= 9) return;
    
    const map = mapRef.current;
    const bounds = map.getBounds();
    
    // Create a unique key for this fetch request
    const fetchKey = `${viewState.zoom}-${selectedDate}-${riskFilter.join(',')}-${bounds.getNorth().toFixed(2)}-${bounds.getSouth().toFixed(2)}-${bounds.getEast().toFixed(2)}-${bounds.getWest().toFixed(2)}`;
    
    // Skip if we've already fetched this exact data (unless forced)
    if (!force && fetchKey === lastPointFetchParams) {
      return;
    }
    
    setLoadingPoints(true);
    try {
      console.log('Fetching viewport points for zoom:', viewState.zoom);
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
      
      console.log('Received viewport points:', pointData.points.length);
      setViewportFloodPoints(pointData.points);
      setLastPointFetchParams(fetchKey);
    } catch (error) {
      console.error('Error fetching viewport points:', error);
    } finally {
      setLoadingPoints(false);
    }
  }, [viewState.zoom, selectedDate, riskFilter]); // Removed lastPointFetchParams from dependencies

  // Force refresh viewport points when filters or date change
  useEffect(() => {
    console.log('Date/Risk filter changed for viewport points - selectedDate:', selectedDate, 'zoom:', viewState.zoom);
    if (isClient && viewState.zoom > 9) {
      console.log('Triggering viewport points fetch due to date/risk change');
      fetchViewportPoints(true);
    }
  }, [selectedDate, riskFilter, isClient]); // Removed fetchViewportPoints from dependencies

  // Fetch clusters when dependencies change
  useEffect(() => {
    console.log('Date/Risk filter changed - selectedDate:', selectedDate, 'riskFilter:', riskFilter);
    if (isClient) {
      console.log('Triggering cluster fetch due to date/risk change');
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





  // Filter flood segments based on risk filter
  const filteredFloodSegments = floodSegments.filter(segment => 
    riskFilter.includes(segment.riskLevel)
  );

  // Convert flood clusters to GeoJSON for rendering
  const filteredFloodClusters = floodClusters.filter(c => {
    const mapped = c.risk_level === 'extreme' ? 'high' : c.risk_level;
    return riskFilter.includes(mapped);
  });
  
  const floodClustersGeoJSON = {
    type: 'FeatureCollection' as const,
    features: filteredFloodClusters.map(cluster => ({
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

  const computeTrend = (series: { time: string; forecast_value: number }[], currentDate: string): 'rising' | 'falling' | 'stable' => {
    if (!series || series.length === 0) return 'stable';
    // Ensure sorted by time asc
    const sorted = [...series].sort((a, b) => a.time.localeCompare(b.time));
    const idx = sorted.findIndex(s => s.time === currentDate);
    if (idx === -1) return 'stable';

    const value = sorted[idx].forecast_value;
    const prev = sorted[idx - 1]?.forecast_value;
    const next = sorted[idx + 1]?.forecast_value;

    const within1 = (a: number, b: number) => Math.abs(a - b) <= 1.0;

    // If first day (no prev)
    if (prev === undefined && next !== undefined) {
      const next2 = sorted[idx + 2]?.forecast_value; // might be undefined
      // Compare to both next days if available
      if (next2 !== undefined) {
        if (value > next && value > next2 && !within1(value, next) && !within1(value, next2)) return 'falling';
        if (value < next && value < next2 && !within1(value, next) && !within1(value, next2)) return 'rising';
        // Mixed direction: compare to immediate next
        if (!within1(value, next)) return value < next ? 'rising' : 'falling';
        return 'stable';
      }
      // Only one future day
      if (!within1(value, next)) return value < next ? 'rising' : 'falling';
      return 'stable';
    }

    // If last day (no next)
    if (next === undefined && prev !== undefined) {
      if (!within1(value, prev)) return value > prev ? 'rising' : 'falling';
      return 'stable';
    }

    // Middle day
    if (prev !== undefined && next !== undefined) {
      const bothHigher = prev > value && next > value && !within1(prev, value) && !within1(next, value);
      const bothLower = prev < value && next < value && !within1(prev, value) && !within1(next, value);
      if (bothHigher) return 'rising';
      if (bothLower) return 'falling';
      // Mixed: weigh towards next day
      if (!within1(value, next)) return value < next ? 'rising' : 'falling';
      // All within 1 m/s
      if (within1(value, prev) && within1(value, next)) return 'stable';
      return 'stable';
    }

    return 'stable';
  };

  const onMarkerClick = useCallback(async (alert: FloodAlert) => {
    try {
      const ts = await FloodService.getPointTimeSeries(alert.latitude, alert.longitude);
      const trend = computeTrend(ts.series, alert.date);
      const updated = { ...alert, trend } as FloodAlert;
      setPopupInfo(updated);
      onAlertClick(updated);
    } catch (e) {
      // Fallback to existing alert if time series fails
      setPopupInfo(alert);
      onAlertClick(alert);
    }
  }, [onAlertClick]);

  const onMapClick = useCallback(() => {
    setPopupInfo(null);
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



  // Handle map move to refetch clusters and points
  const handleMapMove = useCallback((evt: any) => {
    setViewState(evt.viewState);
    
    // Debounced fetch to prevent continuous movement
    clearTimeout((window as any).clusterTimeout);
    (window as any).clusterTimeout = setTimeout(() => {
      fetchClusters(false);
    }, 1000);
    
    // Separate timeout for viewport points with longer delay
    if (evt.viewState.zoom > 9) {
      clearTimeout((window as any).viewportTimeout);
      (window as any).viewportTimeout = setTimeout(() => {
        fetchViewportPoints(false);
      }, 1500); // Slightly longer delay for viewport points
    }
  }, [fetchClusters, fetchViewportPoints]);

  // Handle initial map load
  const handleMapLoad = useCallback(() => {
    // Fetch clusters immediately when map loads
    fetchClusters(true);
  }, [fetchClusters]);

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
      {(loading || loadingPoints) && (
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
        onLoad={handleMapLoad}
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
        {floodClusters.length > 0 && viewState.zoom <= 9 && (
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
        {viewState.zoom > 9 && viewportFloodPoints.map((point) => {
           let riskLevel: 'high' | 'medium' | 'low' = 'low';
           if (point.return_period === '20-year') {
             riskLevel = 'high';
           } else if (point.return_period === '5-year') {
             riskLevel = 'medium';
           } else if (point.return_period === '2-year') {
             riskLevel = 'low';
           }
           if (!riskFilter.includes(riskLevel)) {
             return null;
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


      </Map>
    </div>
  );
});

export default FloodMap;
