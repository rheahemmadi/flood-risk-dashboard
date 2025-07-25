'use client'

import React from 'react';
import { Search, Calendar, Waves, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DashboardHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  availableDates: string[];
  riskFilter: string[];
  onRiskFilterChange: (filters: string[]) => void;
  alertCounts: {
    high: number;
    medium: number;
    low: number;
  };
}

const DashboardHeader = ({
  searchQuery,
  onSearchChange,
  selectedDate,
  onDateChange,
  availableDates,
  riskFilter,
  onRiskFilterChange,
  alertCounts
}: DashboardHeaderProps) => {
  const toggleRiskFilter = (risk: string) => {
    if (riskFilter.includes(risk)) {
      onRiskFilterChange(riskFilter.filter(r => r !== risk));
    } else {
      onRiskFilterChange([...riskFilter, risk]);
    }
  };

  return (
    <header className="bg-dashboard-nav text-dashboard-nav-foreground shadow-md border-b border-dashboard-border">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="bg-ifrc-red p-2 rounded-lg shadow-sm">
              <Waves className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">The Alert Engine</h1>
              <p className="text-xs text-muted-foreground font-medium">Emergency Response • Real-time flood forecasting</p>
            </div>
          </div>
        </div>
        
        {/* Mobile Controls */}
        <div className="px-4 pb-3 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search affected regions..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-full bg-card border-dashboard-border"
            />
          </div>

          {/* Date and Risk Controls Row */}
          <div className="flex gap-2">
            {/* Date Selector */}
            <div className="flex items-center gap-2 bg-card rounded-lg border border-dashboard-border flex-1">
              <Calendar className="h-4 w-4 text-muted-foreground ml-3" />
              <Select value={selectedDate} onValueChange={onDateChange}>
                <SelectTrigger className="border-0 bg-transparent h-10 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableDates.map((date) => (
                    <SelectItem key={date} value={date}>
                      {new Date(date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Risk:</span>
            <div className="flex gap-1 flex-1">
              <Button
                variant={riskFilter.includes('high') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleRiskFilter('high')}
                className={`font-bold text-xs px-2 py-1 h-7 ${
                  riskFilter.includes('high') 
                    ? 'bg-status-critical text-white hover:bg-status-critical/90 border-status-critical' 
                    : 'border-status-critical text-status-critical hover:bg-status-critical/10'
                }`}
              >
                H ({alertCounts.high})
              </Button>
              <Button
                variant={riskFilter.includes('medium') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleRiskFilter('medium')}
                className={`font-bold text-xs px-2 py-1 h-7 ${
                  riskFilter.includes('medium') 
                    ? 'bg-status-medium text-white hover:bg-status-medium/90 border-status-medium' 
                    : 'border-status-medium text-status-medium hover:bg-status-medium/10'
                }`}
              >
                M ({alertCounts.medium})
              </Button>
              <Button
                variant={riskFilter.includes('low') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleRiskFilter('low')}
                className={`font-bold text-xs px-2 py-1 h-7 ${
                  riskFilter.includes('low') 
                    ? 'bg-status-low text-white hover:bg-status-low/90 border-status-low' 
                    : 'border-status-low text-status-low hover:bg-status-low/10'
                }`}
              >
                L ({alertCounts.low})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex items-center px-6 py-3">
        {/* Logo and Title */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="bg-ifrc-red p-2.5 rounded-lg shadow-sm">
            <Waves className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">The Alert Engine</h1>
            <p className="text-sm text-muted-foreground font-medium">Emergency Response • Real-time flood forecasting</p>
          </div>
        </div>

        {/* Centered Controls */}
        <div className="flex items-center gap-4 mx-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search affected regions..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-72 bg-card border-dashboard-border"
            />
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-card rounded-lg border border-dashboard-border">
            <Calendar className="h-4 w-4 text-muted-foreground ml-3" />
            <Select value={selectedDate} onValueChange={onDateChange}>
              <SelectTrigger className="w-44 border-0 bg-transparent h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableDates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {new Date(date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Risk Filter */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm font-medium text-muted-foreground">Risk Level:</span>
          <div className="flex gap-2">
            <Button
              variant={riskFilter.includes('high') ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleRiskFilter('high')}
              className={`font-bold ${
                riskFilter.includes('high') 
                  ? 'bg-status-critical text-white hover:bg-status-critical/90 border-status-critical' 
                  : 'border-status-critical text-status-critical hover:bg-status-critical/10'
              }`}
            >
              High ({alertCounts.high})
            </Button>
            <Button
              variant={riskFilter.includes('medium') ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleRiskFilter('medium')}
              className={`font-bold ${
                riskFilter.includes('medium') 
                  ? 'bg-status-medium text-white hover:bg-status-medium/90 border-status-medium' 
                  : 'border-status-medium text-status-medium hover:bg-status-medium/10'
              }`}
            >
              Medium ({alertCounts.medium})
            </Button>
            <Button
              variant={riskFilter.includes('low') ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleRiskFilter('low')}
              className={`font-bold ${
                riskFilter.includes('low') 
                  ? 'bg-status-low text-white hover:bg-status-low/90 border-status-low' 
                  : 'border-status-low text-status-low hover:bg-status-low/10'
              }`}
            >
              Low ({alertCounts.low})
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
