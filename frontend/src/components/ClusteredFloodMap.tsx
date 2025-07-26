'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { FloodService, FloodCluster, ViewportBounds } from '@/lib/services/floodService';
import { useToast } from '@/hooks/use-toast';

interface ClusteredFloodMapProps {
  selectedDate?: string;
  selectedRiskLevel?: 'low' | 'medium' | 'high' | 'extreme';
  className?: string;
}

const ClusteredFloodMap: React.FC<ClusteredFloodMapProps> = ({
  selectedDate,
  selectedRiskLevel,
  className = ''
}) => {
  const [clusters, setClusters] = useState<FloodCluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(5);
  const [bounds, setBounds] = useState<ViewportBounds | null>(null);
  const { toast } = useToast();

  // Risk level colors
  const riskColors = {
    low: '#10b981',      // Green
    medium: '#f59e0b',   // Amber
    high: '#ef4444',     // Red
    extreme: '#7c2d12'   // Dark red
  };

  // Get cluster size based on point count
  const getClusterSize = (pointCount: number, zoomLevel: number): number => {
    const baseSize = Math.max(8, Math.min(20, Math.log(pointCount + 1) * 3));
    const zoomFactor = Math.max(0.5, zoomLevel / 10);
    return baseSize * zoomFactor;
  };

  // Get cluster color based on risk level and forecast value
  const getClusterColor = (cluster: FloodCluster): string => {
    return riskColors[cluster.risk_level] || '#6b7280';
  };

  // Fetch clusters for current viewport and zoom
  const fetchClusters = useCallback(async () => {
    if (!bounds) return;

    setLoading(true);
    try {
      const clusterData = await FloodService.getFloodClusters({
        zoom_level: zoomLevel,
        time: selectedDate,
        bounds,
        risk_level: selectedRiskLevel
      });
      setClusters(clusterData.clusters);
    } catch (error) {
      console.error('Error fetching clusters:', error);
      toast({
        title: "Error",
        description: "Failed to load flood data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [bounds, zoomLevel, selectedDate, selectedRiskLevel, toast]);

  // Handle map viewport changes
  const handleViewportChanged = useCallback((event: any) => {
    const map = event.target;
    const newZoom = Math.floor(map.getZoom());
    const newBounds = map.getBounds();
    
    setZoomLevel(newZoom);
    setBounds({
      north: newBounds.getNorth(),
      south: newBounds.getSouth(),
      east: newBounds.getEast(),
      west: newBounds.getWest()
    });
  }, []);

  // Fetch clusters when dependencies change
  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  // Handle map zoom and move events
  const handleMapZoom = useCallback((event: any) => {
    const map = event.target;
    const newZoom = Math.floor(map.getZoom());
    const newBounds = map.getBounds();
    
    setZoomLevel(newZoom);
    setBounds({
      north: newBounds.getNorth(),
      south: newBounds.getSouth(),
      east: newBounds.getEast(),
      west: newBounds.getWest()
    });
  }, []);

  // Format forecast value for display
  const formatForecast = (value: number): string => {
    return value.toFixed(2);
  };

  // Format cluster info for popup
  const getClusterInfo = (cluster: FloodCluster): string => {
    return `
      <div class="cluster-info">
        <h3 class="font-semibold text-lg mb-2">Flood Risk Cluster</h3>
        <div class="space-y-1 text-sm">
          <p><strong>Points:</strong> ${cluster.point_count.toLocaleString()}</p>
          <p><strong>Risk Level:</strong> <span class="capitalize">${cluster.risk_level}</span></p>
          <p><strong>Average Risk:</strong> ${formatForecast(cluster.avg_forecast)}</p>
          <p><strong>Max Risk:</strong> ${formatForecast(cluster.max_forecast)}</p>
          <p><strong>Min Risk:</strong> ${formatForecast(cluster.min_forecast)}</p>
          <p><strong>Date:</strong> ${cluster.time}</p>
        </div>
      </div>
    `;
  };

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium">Loading flood data...</span>
          </div>
        </div>
      )}
      
      <MapContainer
        center={[50.0, 10.0]} // Center of Europe
        zoom={5}
        className="h-full w-full"
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        boxZoom={true}
        keyboard={true}
        dragging={true}
        ref={(map) => {
          if (map) {
            map.on('zoomend moveend', handleMapZoom);
          }
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {clusters.map((cluster) => (
          <CircleMarker
            key={cluster.id}
            center={[cluster.lat, cluster.lon]}
            radius={getClusterSize(cluster.point_count, zoomLevel)}
            fillColor={getClusterColor(cluster)}
            color={getClusterColor(cluster)}
            weight={2}
            opacity={0.8}
            fillOpacity={0.6}
          >
            <Popup>
              <div dangerouslySetInnerHTML={{ __html: getClusterInfo(cluster) }} />
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      
      {/* Zoom level indicator */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
        <div className="text-sm font-medium">
          Zoom: {zoomLevel} | Clusters: {clusters.length}
        </div>
      </div>
    </div>
  );
};

export default ClusteredFloodMap; 