'use client';

import { useState } from 'react';

interface MapProps {
  className?: string;
}

// Sample flood risk data
const floodRiskData = [
  {
    id: 1,
    name: 'River Thames - London',
    position: [51.5074, -0.1278] as [number, number],
    riskLevel: 'high',
    description: 'High flood risk due to heavy rainfall',
    waterLevel: '2.3m above normal',
  },
  {
    id: 2,
    name: 'River Severn - Gloucester',
    position: [51.8642, -2.2380] as [number, number],
    riskLevel: 'medium',
    description: 'Moderate flood risk, monitoring required',
    waterLevel: '1.8m above normal',
  },
  {
    id: 3,
    name: 'River Trent - Nottingham',
    position: [52.9548, -1.1581] as [number, number],
    riskLevel: 'low',
    description: 'Low flood risk, normal conditions',
    waterLevel: '0.5m above normal',
  },
];

const getRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'high':
      return '#ef4444';
    case 'medium':
      return '#f59e0b';
    case 'low':
      return '#10b981';
    default:
      return '#6b7280';
  }
};

export function Map({ className = '' }: MapProps) {
  const [selectedLocation, setSelectedLocation] = useState<typeof floodRiskData[0] | null>(null);

  return (
    <div className={className}>
      <div className="relative w-full h-full rounded-lg border border-gray-200 overflow-hidden">
        {/* OpenStreetMap iframe */}
        <iframe
          src="https://www.openstreetmap.org/export/embed.html?bbox=-2.5,51.0,1.5,54.0&layer=mapnik&marker=52.3555,-1.1743&zoom=7&center=52.3555,-1.1743"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          title="Flood Risk Map"
        />
        


        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3">
          <h4 className="font-medium text-sm mb-2">Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-xs">High Risk</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-xs">Medium Risk</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs">Low Risk</span>
            </div>
          </div>
        </div>

        {/* Detailed popup for selected location */}
        {selectedLocation && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-lg">{selectedLocation.name}</h3>
              <button
                onClick={() => setSelectedLocation(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-600 mb-3">{selectedLocation.description}</p>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Water Level:</span> 
                <span className="text-blue-600 ml-1">{selectedLocation.waterLevel}</span>
              </p>
              <div className="flex items-center space-x-2">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  selectedLocation.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                  selectedLocation.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {selectedLocation.riskLevel.toUpperCase()} RISK
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 