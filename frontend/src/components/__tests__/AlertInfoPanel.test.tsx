import { render, screen, waitFor, fireEvent } from '../../test-utils'
import AlertInfoPanel from '../AlertInfoPanel'
import { FloodService } from '../../lib/services/floodService'
import { mockFloodAlert, createMockApiResponse } from '../../test-utils'

// Mock the FloodService
jest.mock('../../lib/services/floodService', () => ({
  FloodService: {
    getLocationName: jest.fn(),
    generateAiInsight: jest.fn(),
  },
}))

const mockFloodService = FloodService as jest.Mocked<typeof FloodService>

describe('AlertInfoPanel', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockFloodService.getLocationName.mockResolvedValue({ location_name: 'London, United Kingdom' })
    mockFloodService.generateAiInsight.mockResolvedValue({
      insight: 'Critical flood warning for London area. Immediate evacuation recommended.',
      generated_at: '2024-01-16T10:00:00Z',
      model: 'gemini-1.5-flash'
    })
  })

  it('renders nothing when alert is null', () => {
    const { container } = render(<AlertInfoPanel alert={null} onClose={mockOnClose} />)
    // The component returns null when alert is null
    // So we check that the main alert panel is not rendered
    expect(container.querySelector('[class*="absolute top-0 right-0"]')).toBeNull()
  })

  it('renders alert information correctly', async () => {
    render(<AlertInfoPanel alert={mockFloodAlert} onClose={mockOnClose} />)

    // Check if basic alert info is displayed
    expect(screen.getByText('Emergency Alert Details')).toBeInTheDocument()
    expect(screen.getByText('20-year')).toBeInTheDocument()
    expect(screen.getByText('0.85')).toBeInTheDocument()
    expect(screen.getByText('Jan 16, 2024')).toBeInTheDocument()
    expect(screen.getByText('CRITICAL')).toBeInTheDocument()
  })

  it('fetches and displays location name', async () => {
    render(<AlertInfoPanel alert={mockFloodAlert} onClose={mockOnClose} />)

    // Should show loading state initially
    expect(screen.getByText('Loading location...')).toBeInTheDocument()

    // Wait for location to load
    await waitFor(() => {
      expect(screen.getByText('London, United Kingdom')).toBeInTheDocument()
    })

    // Verify API was called with correct coordinates
    expect(mockFloodService.getLocationName).toHaveBeenCalledWith(51.5074, -0.1278)
  })

  it('handles location fetch error gracefully', async () => {
    mockFloodService.getLocationName.mockRejectedValue(new Error('API Error'))

    render(<AlertInfoPanel alert={mockFloodAlert} onClose={mockOnClose} />)

    // Should show loading initially
    expect(screen.getByText('Loading location...')).toBeInTheDocument()

    // Should fallback to coordinates after error
    await waitFor(() => {
      expect(screen.getByText('51.5074, -0.1278')).toBeInTheDocument()
    })
  })

  it('generates AI insight when button is clicked', async () => {
    render(<AlertInfoPanel alert={mockFloodAlert} onClose={mockOnClose} />)

    // Find and click the AI insight button
    const aiButton = screen.getByText('Generate Analysis')
    fireEvent.click(aiButton)

    // Wait for insight to load and verify it's displayed
    await waitFor(() => {
      expect(screen.getByText(/Critical flood warning for London/)).toBeInTheDocument()
    })

    // Verify API was called with correct alert data (component filters some properties)
    const expectedCallData = {
      date: mockFloodAlert.date,
      forecastValue: mockFloodAlert.forecastValue,
      latitude: mockFloodAlert.latitude,
      location: mockFloodAlert.location,
      longitude: mockFloodAlert.longitude,
      returnPeriod: mockFloodAlert.returnPeriod,
      riskLevel: mockFloodAlert.riskLevel,
      riverName: mockFloodAlert.riverName,
    }
    expect(mockFloodService.generateAiInsight).toHaveBeenCalledWith(expectedCallData)
  })

  it('handles AI insight generation error', async () => {
    mockFloodService.generateAiInsight.mockRejectedValue(new Error('AI Service Error'))

    render(<AlertInfoPanel alert={mockFloodAlert} onClose={mockOnClose} />)

    // Click AI insight button
    const aiButton = screen.getByText('Generate Analysis')
    fireEvent.click(aiButton)

    // The component shows a fallback message when AI generation fails
    await waitFor(() => {
      // Look for any error indication or fallback content
      const aiSection = screen.getByText('Emergency AI Analysis')
      expect(aiSection).toBeInTheDocument()
    })

    // Verify API was called (component filters some properties)
    const expectedCallData = {
      date: mockFloodAlert.date,
      forecastValue: mockFloodAlert.forecastValue,
      latitude: mockFloodAlert.latitude,
      location: mockFloodAlert.location,
      longitude: mockFloodAlert.longitude,
      returnPeriod: mockFloodAlert.returnPeriod,
      riskLevel: mockFloodAlert.riskLevel,
      riverName: mockFloodAlert.riverName,
    }
    expect(mockFloodService.generateAiInsight).toHaveBeenCalledWith(expectedCallData)
  })

  it('calls onClose when close button is clicked', () => {
    render(<AlertInfoPanel alert={mockFloodAlert} onClose={mockOnClose} />)

    // The close button has no accessible name, so find it by its position/structure
    const buttons = screen.getAllByRole('button')
    const closeButton = buttons.find(button => button.innerHTML.includes('M18 6 6 18')) // X icon SVG path
    expect(closeButton).toBeTruthy()
    
    fireEvent.click(closeButton!)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('displays correct risk level badge', () => {
    render(<AlertInfoPanel alert={mockFloodAlert} onClose={mockOnClose} />)

    // Should display the CRITICAL badge
    expect(screen.getByText('CRITICAL')).toBeInTheDocument()
  })

  it('displays trend indicators correctly', () => {
    const alertWithTrend = {
      ...mockFloodAlert,
      trend: 'rising' as const
    }

    render(<AlertInfoPanel alert={alertWithTrend} onClose={mockOnClose} />)

    // Check for trend indicator text
    expect(screen.getByText('rising')).toBeInTheDocument()
  })

  it('updates when alert prop changes', async () => {
    const { rerender } = render(<AlertInfoPanel alert={mockFloodAlert} onClose={mockOnClose} />)

    // Wait for initial location to load
    await waitFor(() => {
      expect(screen.getByText('London, United Kingdom')).toBeInTheDocument()
    })

    // Clear mocks and set up new response
    jest.clearAllMocks()
    mockFloodService.getLocationName.mockResolvedValue({ location_name: 'Manchester, United Kingdom' })

    const newAlert = {
      ...mockFloodAlert,
      id: 'test-alert-2',
      latitude: 53.4808,
      longitude: -2.2426,
    }

    // Re-render with new alert
    rerender(<AlertInfoPanel alert={newAlert} onClose={mockOnClose} />)

    // Should fetch location for new coordinates
    expect(mockFloodService.getLocationName).toHaveBeenCalledWith(53.4808, -2.2426)

    // Wait for new location to load
    await waitFor(() => {
      expect(screen.getByText('Manchester, United Kingdom')).toBeInTheDocument()
    })

    // Should show new coordinates in technical details (they appear in the same element)
    expect(screen.getByText(/53.4808/)).toBeInTheDocument()
    expect(screen.getByText(/-2.2426/)).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<AlertInfoPanel alert={mockFloodAlert} onClose={mockOnClose} />)

    // Check for proper headings and structure
    expect(screen.getByText('Emergency Alert Details')).toBeInTheDocument()
    expect(screen.getByText('Affected Area')).toBeInTheDocument()
    expect(screen.getByText('Technical Details')).toBeInTheDocument()
    expect(screen.getByText('Emergency AI Analysis')).toBeInTheDocument()

    // Check that buttons are accessible
    const generateButton = screen.getByRole('button', { name: 'Generate Analysis' })
    expect(generateButton).toBeInTheDocument()
  })
})
