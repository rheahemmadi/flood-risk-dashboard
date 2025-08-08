'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react';
import FloodMap from '@/components/FloodMap';
import DashboardHeader from '@/components/DashboardHeader';
import AlertInfoPanel from '@/components/AlertInfoPanel';
import { FloodAlert } from '@/lib/types/flood';
import { SearchSuggestion, flyToLocation } from '@/lib/utils/search';

// CHANGE: Import the FloodService directly.
import { FloodService } from '@/lib/services/floodService';

// CHANGE: The old helper functions from floodData are no longer needed.
// import { 
//   fetchFloodPoints, 
//   fetchFloodPointsByDate, 
//   getAvailableDates, 
//   getAlertCounts 
// } from '@/lib/data/floodData';

const Index = () => {
  const [selectedAlert, setSelectedAlert] = useState<FloodAlert | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [riskFilter, setRiskFilter] = useState<string[]>(['high', 'medium', 'low']);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [alertCounts, setAlertCounts] = useState({ high: 0, medium: 0, low: 0 });
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<any>(null);

  // CHANGE: This single useEffect now handles all initial data loading.
  // It makes one efficient call to the backend summary endpoint.
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch ALL summary data (dates and counts) in one go.
        const summary = await FloodService.getFloodPointsSummary();
        
        const dates = summary.unique_dates || [];
        const counts = summary.risk_breakdown || { high: 0, medium: 0, low: 0 };
        
        // Set the state for the header components
        setAvailableDates(dates);
        setAlertCounts(counts);
        
        // Automatically select the first available date
        if (dates.length > 0) {
          setSelectedDate(dates[0]);
        }
      } catch (error) {
        console.error('Error loading summary data:', error);
        // In case of an error, set empty state to prevent crashes
        setAvailableDates([]);
        setAlertCounts({ high: 0, medium: 0, low: 0 });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []); // The empty array [] ensures this runs only once when the page loads.

  // CHANGE: The other useEffect hooks that fetched data are no longer needed
  // because the FloodMap component now handles its own data fetching based on
  // the 'selectedDate' and 'riskFilter' props passed to it.

  const handleAlertClick = (alert: FloodAlert) => {
    setSelectedAlert(alert);
  };

  const handleClosePanel = () => {
    setSelectedAlert(null);
  };

  const handleLocationSelect = (suggestion: SearchSuggestion) => {
    flyToLocation(mapRef, suggestion.center, suggestion.bbox);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header receives the data fetched above */}
      <DashboardHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onLocationSelect={handleLocationSelect}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        availableDates={availableDates}
        riskFilter={riskFilter}
        onRiskFilterChange={setRiskFilter}
        alertCounts={alertCounts}
      />

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* CHANGE: The FloodMap component is now self-sufficient. 
          It only needs the selectedDate and riskFilter to fetch its own map points and clusters.
          We no longer need to pass down 'alerts' or 'floodPoints' from here.
        */}
        <FloodMap
          ref={mapRef}
          alerts={[]} // The map component will handle its own popups from fetched data
          onAlertClick={handleAlertClick}
          selectedDate={selectedDate}
          riskFilter={riskFilter}
        />

        {/* Info Panel logic remains the same */}
        {selectedAlert && (
          <AlertInfoPanel
            alert={selectedAlert}
            onClose={handleClosePanel}
          />
        )}
      </div>
    </div>
  );
};

export default Index;