import { render, screen } from '../../test-utils'
import DashboardHeader from '../DashboardHeader'

// Mock the search utility
jest.mock('../../lib/utils/search', () => ({
  getAutocompleteSuggestions: jest.fn().mockResolvedValue([]),
}))

describe('DashboardHeader', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: jest.fn(),
    onLocationSelect: jest.fn(),
    selectedDate: '2024-01-16',
    onDateChange: jest.fn(),
    availableDates: ['2024-01-16', '2024-01-15', '2024-01-14'],
    riskFilter: ['high', 'medium', 'low'],
    onRiskFilterChange: jest.fn(),
    alertCounts: {
      high: 5,
      medium: 10,
      low: 3,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    expect(() => {
      render(<DashboardHeader {...defaultProps} />)
    }).not.toThrow()
  })

  it('displays the title', () => {
    render(<DashboardHeader {...defaultProps} />)
    
    // Should render title (appears in both mobile and desktop versions)
    expect(screen.getAllByText('The Alert Engine').length).toBeGreaterThan(0)
  })

  it('displays the subtitle', () => {
    render(<DashboardHeader {...defaultProps} />)
    
    expect(screen.getAllByText('Emergency Response • Real-time flood forecasting').length).toBeGreaterThan(0)
  })

  it('renders search input', () => {
    render(<DashboardHeader {...defaultProps} />)
    
    // Should have search inputs
    const searchInputs = screen.getAllByRole('textbox')
    expect(searchInputs.length).toBeGreaterThan(0)
  })

  it('renders with different props', () => {
    const differentProps = {
      ...defaultProps,
      searchQuery: 'test search',
      selectedDate: '2024-01-15',
      riskFilter: ['high'],
      alertCounts: {
        high: 0,
        medium: 0,
        low: 0,
      },
    }
    
    expect(() => {
      render(<DashboardHeader {...differentProps} />)
    }).not.toThrow()
  })

  it('handles empty available dates', () => {
    const propsWithEmptyDates = {
      ...defaultProps,
      availableDates: [],
      selectedDate: '',
    }
    
    expect(() => {
      render(<DashboardHeader {...propsWithEmptyDates} />)
    }).not.toThrow()
  })
})
