'use client'

import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus, AlertTriangle, Droplets, Brain } from 'lucide-react';
import { FloodAlert } from '@/lib/types/flood';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AlertInfoPanelProps {
  alert: FloodAlert | null;
  onClose: () => void;
}

const AlertInfoPanel = ({ alert, onClose }: AlertInfoPanelProps) => {
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  if (!alert) return null;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'flood-high';
      case 'medium': return 'flood-medium';
      case 'low': return 'flood-low';
      default: return 'muted';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="h-4 w-4 text-destructive" />;
      case 'falling': return <TrendingDown className="h-4 w-4 text-green-600" />;
      case 'stable': return <Minus className="h-4 w-4 text-muted-foreground" />;
      default: return null;
    }
  };

  const generateAIInsight = async () => {
    if (alert.riskLevel !== 'high') return;
    
    setLoadingInsight(true);
    
    // Simulate AI API call
    setTimeout(() => {
      const insights = [
        `High flood risk detected for ${alert.location}. The ${alert.riverName || 'river system'} is expected to exceed ${alert.returnPeriod} return period levels. Current weather patterns show increased precipitation in the upstream watershed. Residents in low-lying areas should prepare for potential evacuation. Emergency services are on standby.`,
        `Critical flood warning for ${alert.location}. River discharge models indicate water levels will surpass historical ${alert.returnPeriod} thresholds within 24-48 hours. The confluence of multiple tributaries upstream is contributing to elevated risk. Local authorities recommend immediate preparation of emergency supplies and monitoring official evacuation notices.`,
        `Severe flood alert active for ${alert.location}. Hydrological models show ${alert.trend} water levels with peak expected in the next 2-3 days. The ${alert.riverName || 'main river channel'} is experiencing increased flow due to recent heavy rainfall. Urban drainage systems may be overwhelmed. Citizens should avoid flood-prone areas and stay informed through official channels.`
      ];
      
      setAiInsight(insights[Math.floor(Math.random() * insights.length)]);
      setLoadingInsight(false);
    }, 2000);
  };

  return (
    <div className="absolute top-0 right-0 w-full sm:w-96 h-full bg-dashboard-panel border-l border-dashboard-border shadow-xl z-40 overflow-y-auto">
      <Card className="h-full rounded-none border-none">
        <CardHeader className="pb-4 bg-ifrc-red-light/10 border-b border-dashboard-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-ifrc-red" />
              <CardTitle className="text-lg font-bold text-foreground">Emergency Alert Details</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-ifrc-red/10">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 p-4 sm:p-6">
          {/* Alert Summary Card */}
          <div className="bg-card border border-dashboard-border rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-foreground mb-1">Affected Area</h3>
                <p className="font-semibold text-lg truncate">{alert.location}</p>
                {alert.riverName && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <Droplets className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{alert.riverName}</span>
                  </p>
                )}
              </div>
              <Badge 
                variant="secondary" 
                className={`px-3 py-1 font-bold text-xs ml-2 flex-shrink-0 ${
                  alert.riskLevel === 'high' ? 'bg-status-critical text-white' :
                  alert.riskLevel === 'medium' ? 'bg-status-medium text-white' :
                  'bg-status-low text-white'
                }`}
              >
                {alert.riskLevel === 'high' ? 'CRITICAL' : alert.riskLevel.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Emergency Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card border border-dashboard-border rounded-lg p-4">
              <h4 className="font-semibold text-xs text-muted-foreground mb-2 uppercase tracking-wider">Return Period</h4>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{alert.returnPeriod}</span>
              </div>
            </div>
            <div className="bg-card border border-dashboard-border rounded-lg p-4">
              <h4 className="font-semibold text-xs text-muted-foreground mb-2 uppercase tracking-wider">Trend</h4>
              <div className="flex items-center gap-2">
                {getTrendIcon(alert.trend)}
                <span className="capitalize font-semibold text-sm">{alert.trend}</span>
              </div>
            </div>
          </div>

          {/* Technical Information */}
            <div className="bg-muted/30 border border-dashboard-border rounded-lg p-4">
            <h4 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-ifrc-red rounded-full"></span>
              Technical Details
            </h4>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Forecast Date:</span>
                  <span className="text-xs sm:text-sm">{new Date(alert.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coordinates:</span>
                  <span className="text-xs sm:text-sm">{alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Forecasted Discharge (m/s):</span>
                  <span className="text-xs sm:text-sm">{alert.forecastValue?.toFixed(2)}</span>
                </div>
            </div>
          </div>

          {/* AI Emergency Analysis for Critical Alerts */}
          {alert.riskLevel === 'high' && (
            <div className="bg-ifrc-red-light/5 border border-ifrc-red/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Brain className="h-4 w-4 text-ifrc-red" />
                  Emergency AI Analysis
                </h4>
                {!aiInsight && (
                  <Button 
                    size="sm" 
                    onClick={generateAIInsight}
                    disabled={loadingInsight}
                    className="bg-ifrc-red hover:bg-ifrc-red-dark text-white text-xs"
                  >
                    {loadingInsight ? 'Analyzing...' : 'Generate Analysis'}
                  </Button>
                )}
              </div>
              
              {aiInsight && (
                <div className="bg-card border border-dashboard-border p-4 rounded-lg">
                  <p className="text-sm leading-relaxed text-foreground">{aiInsight}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertInfoPanel;
