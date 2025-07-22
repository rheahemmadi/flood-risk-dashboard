'use client';

import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map').then(mod => ({ default: mod.Map })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-4xl mb-4">🗺️</div>
        <p className="text-gray-500 text-lg font-medium">Loading map...</p>
      </div>
    </div>
  ),
});

export default function MapViewer() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header currentPage="map" />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Flood Risk Dashboard
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Real-time flood risk monitoring and visualization using data from GloFAS and Google Flood Hub for better decision making
          </p>
        </div>

        {/* Map Header */}
        <div className="flex items-center justify-between mb-4 px-4" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}>
          <h3 className="text-xl font-semibold text-gray-900">Live Flood Risk Map</h3>
          <div className="flex space-x-3">
            <Button variant="secondary" size="sm">
              Layer Controls
            </Button>
            <Button variant="primary" size="sm">
              Full Screen
            </Button>
          </div>
        </div>

        {/* Map Container */}
        <div className="px-4 mb-6" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}>
          {/* Map Display Area */}
          <div className="relative">
            <div className="w-full h-[600px] rounded-lg border border-gray-200 overflow-hidden">
              <Map className="w-full h-full" />
            </div>
            
            {/* Map Controls Overlay */}
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-sm mb-3 text-gray-900">FLOOD RISK</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="high-risk" className="rounded" defaultChecked />
                  <label htmlFor="high-risk" className="text-sm font-medium">High</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="medium-risk" className="rounded" defaultChecked />
                  <label htmlFor="medium-risk" className="text-sm font-medium">Medium</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="low-risk" className="rounded" defaultChecked />
                  <label htmlFor="low-risk" className="text-sm font-medium">Low</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="text-center mb-8">
          <div className="text-sm text-gray-500">
            <span>Data sources: GloFAS (ECMWF) • Google Flood Hub</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 