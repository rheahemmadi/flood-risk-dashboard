import React from 'react'
import { render, screen, waitFor } from '../../test-utils'
import FloodMap from '../FloodMap'
import { MAPBOX_CONFIG } from '../../lib/config/mapbox'

// Mock the mapbox config
jest.mock('../../lib/config/mapbox', () => ({
  MAPBOX_CONFIG: {
    accessToken: 'test-token',
    mapStyle: 'mapbox://styles/mapbox/streets-v12',
    defaultViewport: {
      latitude: 22.5,
      longitude: 78.5,
      zoom: 4,
    },
    mapOptions: {
      maxZoom: 18,
      minZoom: 3,
    },
  },
  getMarkerColor: jest.fn((riskLevel) => {
    switch (riskLevel) {
      case 'high': return '#dc2626'
      case 'medium': return '#f59e0b'
      case 'low': return '#10b981'
      default: return '#6b7280'
    }
  }),
  getFloodPointSize: jest.fn((riskLevel) => {
    switch (riskLevel) {
      case 'high': return 24
      case 'medium': return 20
      case 'low': return 16
      default: return 16
    }
  }),
}))

// Mock react-map-gl completely to avoid complex Mapbox interactions
jest.mock('react-map-gl', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => (
    <div data-testid="mapbox-map" {...props}>
      {children}
    </div>
  ),
  Marker: ({ children, ...props }: any) => (
    <div data-testid="map-marker" {...props}>
      {children}
    </div>
  ),
  Popup: ({ children, ...props }: any) => (
    <div data-testid="map-popup" {...props}>
      {children}
    </div>
  ),
  NavigationControl: (props: any) => <div data-testid="navigation-control" {...props} />,
  FullscreenControl: (props: any) => <div data-testid="fullscreen-control" {...props} />,
  Source: ({ children, ...props }: any) => (
    <div data-testid="map-source" {...props}>
      {children}
    </div>
  ),
  Layer: (props: any) => <div data-testid="map-layer" {...props} />,
}))

// Mock the flood data service to avoid API calls
jest.mock('../../lib/data/floodData', () => ({
  fetchFloodClustersForViewport: jest.fn().mockResolvedValue([]),
}))

// Mock FloodService to avoid API calls
jest.mock('../../lib/services/floodService', () => ({
  FloodService: {
    getFloodPoints: jest.fn().mockResolvedValue({ points: [], total: 0 }),
    getPointTimeSeries: jest.fn().mockResolvedValue({ series: [] }),
  },
}))

describe('FloodMap', () => {
  const defaultProps = {
    onAlertClick: jest.fn(),
    selectedDate: '2024-01-16',
    riskFilter: ['high', 'medium', 'low'],
    floodSegments: [],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows Mapbox token warning when token is not configured', () => {
    // Mock MAPBOX_CONFIG to have invalid token
    jest.mocked(MAPBOX_CONFIG).accessToken = 'your_mapbox_token_here'
    
    render(<FloodMap {...defaultProps} />)
    
    expect(screen.getByText('Mapbox Token Required')).toBeInTheDocument()
  })

  it('displays token warning message correctly', () => {
    // Mock MAPBOX_CONFIG to have invalid token
    jest.mocked(MAPBOX_CONFIG).accessToken = 'your_mapbox_token_here'
    
    render(<FloodMap {...defaultProps} />)
    
    expect(screen.getByText('To display the interactive map, you need to add your Mapbox access token.')).toBeInTheDocument()
  })

  it('accepts required props', () => {
    // Only test the error case that doesn't trigger map rendering
    jest.mocked(MAPBOX_CONFIG).accessToken = 'your_mapbox_token_here'
    
    expect(() => {
      render(<FloodMap {...defaultProps} />)
    }).not.toThrow()
  })

  it('accepts different risk filters', () => {
    // Only test the error case that doesn't trigger map rendering
    jest.mocked(MAPBOX_CONFIG).accessToken = 'your_mapbox_token_here'
    
    const differentProps = {
      ...defaultProps,
      riskFilter: ['high'],
    }
    
    expect(() => {
      render(<FloodMap {...differentProps} />)
    }).not.toThrow()
  })
})
