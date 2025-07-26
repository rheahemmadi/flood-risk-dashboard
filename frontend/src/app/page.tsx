'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react';
import FloodMap from '@/components/FloodMap';
import DashboardHeader from '@/components/DashboardHeader';
import AlertInfoPanel from '@/components/AlertInfoPanel';
import { FloodAlert } from '@/lib/types/flood';
import { 
  fetchFloodPoints, 
  fetchFloodPointsByDate, 
  getAvailableDates, 
  getAlertCounts 
} from '@/lib/data/floodData';
import { SearchSuggestion, flyToLocation } from '@/lib/utils/search';

const Index = () => {
  const [selectedAlert, setSelectedAlert] = useState<FloodAlert | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [riskFilter, setRiskFilter] = useState<string[]>(['high', 'medium', 'low']);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [floodPoints, setFloodPoints] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<FloodAlert[]>([]);
  const [alertCounts, setAlertCounts] = useState({ high: 0, medium: 0, low: 0 });
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<any>(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Get available dates
        const dates = await getAvailableDates();
        setAvailableDates(dates);
        
        if (dates.length > 0) {
          setSelectedDate(dates[0]);
          
          // Load flood points and alerts for the first date
          const points = await fetchFloodPoints(1000);
          setFloodPoints(points);
          
          const datePoints = await fetchFloodPointsByDate(dates[0], 1000);
          const dateAlerts: FloodAlert[] = datePoints.map((point, index) => ({
            id: `alert-${index}`,
            latitude: point.latitude,
            longitude: point.longitude,
            location: point.riverName || 'Flood Alert',
            riskLevel: point.riskLevel,
            returnPeriod: `${Math.floor(Math.random() * 50) + 5}-year return period`,
            trend: ['rising', 'falling', 'stable'][Math.floor(Math.random() * 3)] as 'rising' | 'falling' | 'stable',
            date: dates[0],
            riverName: point.riverName,
            description: `Flood risk alert for ${point.riverName || 'this area'}`
          }));
          setAlerts(dateAlerts);
          
          // Get alert counts
          const counts = await getAlertCounts(dates[0]);
          setAlertCounts(counts);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load data when selected date changes
  useEffect(() => {
    if (selectedDate) {
      const loadDateData = async () => {
        try {
          const datePoints = await fetchFloodPointsByDate(selectedDate, 1000);
          const dateAlerts: FloodAlert[] = datePoints.map((point, index) => ({
            id: `alert-${index}`,
            latitude: point.latitude,
            longitude: point.longitude,
            location: point.riverName || 'Flood Alert',
            riskLevel: point.riskLevel,
            returnPeriod: `${Math.floor(Math.random() * 50) + 5}-year return period`,
            trend: ['rising', 'falling', 'stable'][Math.floor(Math.random() * 3)] as 'rising' | 'falling' | 'stable',
            date: selectedDate,
            riverName: point.riverName,
            description: `Flood risk alert for ${point.riverName || 'this area'}`
          }));
          setAlerts(dateAlerts);
          
          const counts = await getAlertCounts(selectedDate);
          setAlertCounts(counts);
        } catch (error) {
          console.error('Error loading date data:', error);
        }
      };

      loadDateData();
    }
  }, [selectedDate]);

  // Filter alerts based on search query
  const filteredAlerts = useMemo(() => {
    if (!searchQuery) return alerts;
    return alerts.filter(alert =>
      alert.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.riverName && alert.riverName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, alerts]);

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
          <p className="text-muted-foreground">Loading flood data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
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
        {/* Map */}
        <FloodMap
          ref={mapRef}
          alerts={filteredAlerts}
          onAlertClick={handleAlertClick}
          selectedDate={selectedDate}
          riskFilter={riskFilter}
          searchQuery={searchQuery}
          floodPoints={floodPoints}
          floodSegments={[]}
        />

        {/* Info Panel */}
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
