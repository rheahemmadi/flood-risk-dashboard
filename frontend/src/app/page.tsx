'use client'

import React, { useState, useMemo } from 'react';
import FloodMap from '@/components/FloodMap';
import DashboardHeader from '@/components/DashboardHeader';
import AlertInfoPanel from '@/components/AlertInfoPanel';
import { FloodAlert } from '@/lib/types/flood';
import { mockFloodAlerts, getAvailableDates, getAlertCounts } from '@/lib/data/mockAlerts';

const Index = () => {
  const [selectedAlert, setSelectedAlert] = useState<FloodAlert | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(getAvailableDates()[0]);
  const [riskFilter, setRiskFilter] = useState<string[]>(['high', 'medium', 'low']);

  const availableDates = getAvailableDates();

  // Filter alerts based on search query
  const filteredAlerts = useMemo(() => {
    if (!searchQuery) return mockFloodAlerts;
    return mockFloodAlerts.filter(alert =>
      alert.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.riverName && alert.riverName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  // Get alert counts for the selected date
  const alertCounts = useMemo(() => 
    getAlertCounts(filteredAlerts, selectedDate), 
    [filteredAlerts, selectedDate]
  );

  const handleAlertClick = (alert: FloodAlert) => {
    setSelectedAlert(alert);
  };

  const handleClosePanel = () => {
    setSelectedAlert(null);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <DashboardHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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
          alerts={filteredAlerts}
          onAlertClick={handleAlertClick}
          selectedDate={selectedDate}
          riskFilter={riskFilter}
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
