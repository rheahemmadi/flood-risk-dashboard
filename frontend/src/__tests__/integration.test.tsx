import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '../test-utils'
import MapSearch from '../components/MapSearch'
import AlertInfoPanel from '../components/AlertInfoPanel'
import { getAutocompleteSuggestions } from '../lib/utils/search'
import { FloodService } from '../lib/services/floodService'
import userEvent from '@testing-library/user-event'

// Mock the search utility
jest.mock('../lib/utils/search', () => ({
  getAutocompleteSuggestions: jest.fn(),
}))

// Mock the FloodService
jest.mock('../lib/services/floodService', () => ({
  FloodService: {
    getLocationName: jest.fn(),
    generateAiInsight: jest.fn(),
  },
}))

const mockGetAutocompleteSuggestions = getAutocompleteSuggestions as jest.MockedFunction<typeof getAutocompleteSuggestions>
const mockFloodService = FloodService as jest.Mocked<typeof FloodService>

// Mock search suggestions
const mockSuggestions = [
  {
    id: 'place.1',
    text: 'London',
    place_name: 'London, United Kingdom',
    center: [-0.1278, 51.5074] as [number, number],
    bbox: [-0.489, 51.28, 0.236, 51.686] as [number, number, number, number],
  },
  {
    id: 'place.2',
    text: 'Paris',
    place_name: 'Paris, France',
    center: [2.3522, 48.8566] as [number, number],
  },
]

// Mock flood alert data
const mockFloodAlert = {
  id: 'test-alert-1',
  riskLevel: 'high' as const,
  returnPeriod: '20-year',
  riverName: 'Thames',
  location: 'London, United Kingdom',
  trend: 'rising' as const,
  date: '2024-01-16',
  forecastValue: 0.85,
  latitude: 51.5074,
  longitude: -0.1278,
}

describe('Component Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAutocompleteSuggestions.mockResolvedValue(mockSuggestions)
    mockFloodService.getLocationName.mockResolvedValue({ location_name: 'London, United Kingdom' })
    mockFloodService.generateAiInsight.mockResolvedValue({
      insight: 'Critical flood warning for London area.',
      generated_at: '2024-01-16T10:00:00Z',
      model: 'gemini-1.5-flash'
    })
  })

  describe('MapSearch and Location Selection', () => {
    it('allows searching and selecting a location', async () => {
      const user = userEvent.setup()
      const mockOnLocationSelect = jest.fn()
      
      render(<MapSearch onLocationSelect={mockOnLocationSelect} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'London')
      
      // Wait for search to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350))
      })
      
      await waitFor(() => {
        expect(screen.getByText('London')).toBeInTheDocument()
      })
      
      // Click on the London suggestion
      const londonSuggestion = screen.getByText('London')
      fireEvent.mouseDown(londonSuggestion)
      
      expect(mockOnLocationSelect).toHaveBeenCalledWith(mockSuggestions[0])
      expect(input).toHaveValue('London, United Kingdom')
    })

    it('handles search errors gracefully', async () => {
      const user = userEvent.setup()
      const mockOnLocationSelect = jest.fn()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      mockGetAutocompleteSuggestions.mockRejectedValue(new Error('Search API Error'))
      
      render(<MapSearch onLocationSelect={mockOnLocationSelect} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'London')
      
      // Wait for search to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350))
      })
      
      // Should not show any suggestions
      expect(screen.queryByText('London')).not.toBeInTheDocument()
      expect(consoleSpy).toHaveBeenCalledWith('Search error:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('AlertInfoPanel Integration', () => {
    it('displays alert information and fetches location', async () => {
      const mockOnClose = jest.fn()
      
      render(<AlertInfoPanel alert={mockFloodAlert} onClose={mockOnClose} />)
      
      // Check basic alert info
      expect(screen.getByText('Emergency Alert Details')).toBeInTheDocument()
      expect(screen.getByText('20-year')).toBeInTheDocument()
      expect(screen.getByText('0.85')).toBeInTheDocument()
      
      // Wait for location to load
      await waitFor(() => {
        expect(screen.getByText('London, United Kingdom')).toBeInTheDocument()
      })
      
      expect(mockFloodService.getLocationName).toHaveBeenCalledWith(51.5074, -0.1278)
    })

    it('handles location fetch failure gracefully', async () => {
      const mockOnClose = jest.fn()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      mockFloodService.getLocationName.mockRejectedValue(new Error('Location API Error'))
      
      render(<AlertInfoPanel alert={mockFloodAlert} onClose={mockOnClose} />)
      
      // Should fall back to original location
      await waitFor(() => {
        expect(screen.getByText('London, United Kingdom')).toBeInTheDocument()
      })
      
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching location name:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('generates AI insight when requested', async () => {
      const mockOnClose = jest.fn()
      
      render(<AlertInfoPanel alert={mockFloodAlert} onClose={mockOnClose} />)
      
      // Find and click the AI insight button
      const aiButton = screen.getByText('Generate Analysis')
      fireEvent.click(aiButton)
      
      // Wait for insight to load
      await waitFor(() => {
        expect(screen.getByText(/Critical flood warning for London/)).toBeInTheDocument()
      })
      
      expect(mockFloodService.generateAiInsight).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 51.5074,
          longitude: -0.1278,
          location: 'London, United Kingdom',
        })
      )
    })
  })

  describe('Cross-Component Data Flow', () => {
    it('maintains consistent location data across components', async () => {
      const user = userEvent.setup()
      
      // Test that location data flows correctly between components
      const TestIntegrationComponent = () => {
        const [selectedLocation, setSelectedLocation] = React.useState<any>(null)
        const [alert, setAlert] = React.useState<any>(null)
        
        const handleLocationSelect = (suggestion: any) => {
          setSelectedLocation(suggestion)
          // Simulate creating an alert for the selected location
          setAlert({
            ...mockFloodAlert,
            latitude: suggestion.center[1],
            longitude: suggestion.center[0],
            location: suggestion.place_name,
          })
        }
        
        return (
          <div>
            <MapSearch onLocationSelect={handleLocationSelect} />
            {alert && (
              <AlertInfoPanel 
                alert={alert} 
                onClose={() => setAlert(null)} 
              />
            )}
          </div>
        )
      }
      
      render(<TestIntegrationComponent />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'Paris')
      
      // Wait for search to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350))
      })
      
      await waitFor(() => {
        expect(screen.getByText('Paris')).toBeInTheDocument()
      })
      
      // Click on Paris suggestion
      const parisSuggestion = screen.getByText('Paris')
      fireEvent.mouseDown(parisSuggestion)
      
      // Should show alert panel with Paris location
      await waitFor(() => {
        expect(screen.getByText('Emergency Alert Details')).toBeInTheDocument()
      })
      
      // Location service should be called with Paris coordinates
      expect(mockFloodService.getLocationName).toHaveBeenCalledWith(48.8566, 2.3522)
    })
  })

  describe('Error Handling Integration', () => {
    it('handles multiple API failures gracefully', async () => {
      const user = userEvent.setup()
      const mockOnClose = jest.fn()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock all services to fail
      mockGetAutocompleteSuggestions.mockRejectedValue(new Error('Search failed'))
      mockFloodService.getLocationName.mockRejectedValue(new Error('Location failed'))
      mockFloodService.generateAiInsight.mockRejectedValue(new Error('AI failed'))
      
      // Render both components
      const TestErrorComponent = () => {
        return (
          <div>
            <MapSearch onLocationSelect={() => {}} />
            <AlertInfoPanel alert={mockFloodAlert} onClose={mockOnClose} />
          </div>
        )
      }
      
      render(<TestErrorComponent />)
      
      // Try to search
      const input = screen.getByRole('textbox')
      await user.type(input, 'London')
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350))
      })
      
      // Should not show search suggestions
      expect(screen.queryByText('London')).not.toBeInTheDocument()
      
      // Alert panel should still show fallback location
      await waitFor(() => {
        expect(screen.getByText('London, United Kingdom')).toBeInTheDocument()
      })
      
      // Try to generate AI insight
      const aiButton = screen.getByText('Generate Analysis')
      fireEvent.click(aiButton)
      
      // Should show fallback insight
      await waitFor(() => {
        expect(screen.getByText(/Critical flood warning for London/)).toBeInTheDocument()
      })
      
      // All errors should be logged
      expect(consoleSpy).toHaveBeenCalledWith('Search error:', expect.any(Error))
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching location name:', expect.any(Error))
      expect(consoleSpy).toHaveBeenCalledWith('Error generating AI insight:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('User Experience Integration', () => {
    it('provides smooth user experience with loading states', async () => {
      const user = userEvent.setup()
      const mockOnLocationSelect = jest.fn()
      
      // Mock delayed responses to test loading states
      mockGetAutocompleteSuggestions.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockSuggestions), 100))
      )
      
      render(<MapSearch onLocationSelect={mockOnLocationSelect} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'London')
      
      // Should not show results immediately
      expect(screen.queryByText('London')).not.toBeInTheDocument()
      
      // Wait for debounce and results
      await waitFor(() => {
        expect(screen.getByText('London')).toBeInTheDocument()
      }, { timeout: 2000 })
      
      // Should be able to interact with results
      const londonSuggestion = screen.getByText('London')
      fireEvent.mouseDown(londonSuggestion)
      
      expect(mockOnLocationSelect).toHaveBeenCalled()
    })
  })
})
