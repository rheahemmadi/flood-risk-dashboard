'use client'

import React from 'react';
import { FloodAlert } from '@/lib/types/flood';

interface FloodMapProps {
  alerts: FloodAlert[];
  onAlertClick: (alert: FloodAlert) => void;
  selectedDate: string;
  riskFilter: string[];
}

const FloodMap = ({ alerts, onAlertClick, selectedDate, riskFilter }: FloodMapProps) => {
  // Filter alerts based on selected filters
  const filteredAlerts = alerts.filter(alert => 
    riskFilter.includes(alert.riskLevel) && 
    alert.date === selectedDate
  );

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-flood-high';
      case 'medium':
        return 'bg-flood-medium';
      case 'low':
        return 'bg-flood-low';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Placeholder Background */}
      <div 
        className="absolute inset-0 bg-white"
        style={{ 
          filter: 'hue-rotate(200deg) saturate(0.8)',
        }}
      />
      
      {/* Token input overlay for demo */}
      <div className="absolute top-4 left-4 z-10 bg-card p-4 rounded-lg shadow-lg border max-w-sm">
        <h3 className="font-semibold text-sm mb-2">Demo Mode</h3>
        <p className="text-xs text-muted-foreground mb-2">
          Add your Mapbox token to see the full interactive map.
        </p>
        <input 
          type="text"
          placeholder="Enter Mapbox token..."
          className="w-full px-2 py-1 text-xs border rounded"
        />
      </div>

      {/* Flood Alert Markers */}
      {filteredAlerts.map((alert) => (
        <div
          key={alert.id}
          onClick={() => onAlertClick(alert)}
          className={`absolute w-5 h-5 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform duration-200 ${getRiskColor(alert.riskLevel)}`}
          style={{
            left: `${((alert.longitude + 180) / 360) * 100}%`,
            top: `${((90 - alert.latitude) / 180) * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
          title={`${alert.location} - ${alert.riskLevel} risk`}
        />
      ))}
    </div>
  );
};

export default FloodMap;