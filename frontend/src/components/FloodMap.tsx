'use client'

import React, { useState, useCallback, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FloodAlert } from '@/lib/types/flood';
import { MAPBOX_CONFIG, getMarkerColor, getMarkerSize } from '@/lib/config/mapbox';
import { AlertTriangle } from 'lucide-react';

interface FloodMapProps {
  alerts: FloodAlert[];
  onAlertClick: (alert: FloodAlert) => void;
  selectedDate: string;
  riskFilter: string[];
}

const FloodMap = ({ alerts, onAlertClick, selectedDate, riskFilter }: FloodMapProps) => {
  const [popupInfo, setPopupInfo] = useState<FloodAlert | null>(null);
  const [viewState, setViewState] = useState(MAPBOX_CONFIG.defaultViewport);
  const [isClient, setIsClient] = useState(false);

  // Ensure component is mounted on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Filter alerts based on selected filters
  const filteredAlerts = alerts.filter(alert => 
    riskFilter.includes(alert.riskLevel) && 
    alert.date === selectedDate
  );

  const onMarkerClick = useCallback((alert: FloodAlert) => {
    setPopupInfo(alert);
    onAlertClick(alert);
  }, [onAlertClick]);

  const onMapClick = useCallback(() => {
    setPopupInfo(null);
  }, []);

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
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={onMapClick}
        mapStyle={MAPBOX_CONFIG.mapStyle}
        mapboxAccessToken={MAPBOX_CONFIG.accessToken}
        style={{ width: '100%', height: '100%' }}
        maxZoom={MAPBOX_CONFIG.mapOptions.maxZoom}
        minZoom={MAPBOX_CONFIG.mapOptions.minZoom}
      >
        {/* Navigation controls */}
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {/* Flood Alert Markers */}
        {filteredAlerts.map((alert) => (
          <Marker
            key={alert.id}
            latitude={alert.latitude}
            longitude={alert.longitude}
            anchor="bottom"
            onClick={e => {
              e.originalEvent.stopPropagation();
              onMarkerClick(alert);
            }}
          >
            <div
              className="cursor-pointer transform hover:scale-110 transition-transform duration-200"
              style={{
                width: getMarkerSize(alert.riskLevel),
                height: getMarkerSize(alert.riskLevel),
                backgroundColor: getMarkerColor(alert.riskLevel),
                border: '2px solid white',
                borderRadius: '50%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
              title={`${alert.location} - ${alert.riskLevel} risk`}
            />
          </Marker>
        ))}

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
      </Map>
    </div>
  );
};

export default FloodMap;
