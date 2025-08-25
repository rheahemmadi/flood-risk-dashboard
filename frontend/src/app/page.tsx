'use client'

import React, { useState, useRef, useEffect } from 'react';
import FloodMap from '@/components/FloodMap';
import DashboardHeader from '@/components/DashboardHeader';
import AlertInfoPanel from '@/components/AlertInfoPanel';
import { FloodAlert } from '@/lib/types/flood';
import { SearchSuggestion, flyToLocation } from '@/lib/utils/search';


import { FloodService } from '@/lib/services/floodService';



const Index = () => {
  const [selectedAlert, setSelectedAlert] = useState<FloodAlert | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [riskFilter, setRiskFilter] = useState<string[]>(['high', 'medium', 'low']);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [alertCounts, setAlertCounts] = useState({ high: 0, medium: 0, low: 0 });
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch dates first
        const summaryAll = await FloodService.getFloodPointsSummary();
        const dates = summaryAll.unique_dates || [];
        setAvailableDates(dates);
        
        // Select the first available date and fetch its counts
        if (dates.length > 0) {
          setSelectedDate(dates[0]);
          const summaryForFirst = await FloodService.getFloodPointsSummary(dates[0]);
          const rb = summaryForFirst.risk_breakdown || {} as Record<string, number>;
          setAlertCounts({
            high: rb.high || 0,
            medium: rb.medium || 0,
            low: rb.low || 0,
          });
        } else {
          setAlertCounts({ high: 0, medium: 0, low: 0 });
        }
      } catch (error) {
        console.error('Error loading summary data:', error);
        setAvailableDates([]);
        setAlertCounts({ high: 0, medium: 0, low: 0 });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Update alert counts when the date changes
  useEffect(() => {
    const loadCountsForDate = async () => {
      if (!selectedDate) return;
      try {
        const summary = await FloodService.getFloodPointsSummary(selectedDate);
        const rb = summary.risk_breakdown || {} as Record<string, number>;
        setAlertCounts({
          high: rb.high || 0,
          medium: rb.medium || 0,
          low: rb.low || 0,
        });
      } catch (error) {
        console.error('Error loading per-day counts:', error);
        setAlertCounts({ high: 0, medium: 0, low: 0 });
      }
    };
    loadCountsForDate();
  }, [selectedDate]);

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
      {/* Header receives the data */}
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
        {/* FloodMap receives the data */}
        <FloodMap
          ref={mapRef}
          onAlertClick={handleAlertClick}
          selectedDate={selectedDate}
          riskFilter={riskFilter}
        />

        {/* Info Panel*/}
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