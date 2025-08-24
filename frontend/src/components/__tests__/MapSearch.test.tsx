import { render, screen, fireEvent, waitFor, act } from '../../test-utils'
import MapSearch from '../MapSearch'
import { getAutocompleteSuggestions } from '../../lib/utils/search'
import userEvent from '@testing-library/user-event'

// Mock the search utility
jest.mock('../../lib/utils/search', () => ({
  getAutocompleteSuggestions: jest.fn(),
}))

const mockGetAutocompleteSuggestions = getAutocompleteSuggestions as jest.MockedFunction<typeof getAutocompleteSuggestions>

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
    text: 'New York',
    place_name: 'New York, New York, United States',
    center: [-74.006, 40.7128] as [number, number],
  },
  {
    id: 'place.3',
    text: 'Paris',
    place_name: 'Paris, France',
    center: [2.3522, 48.8566] as [number, number],
  },
]

describe('MapSearch', () => {
  const mockOnLocationSelect = jest.fn()
  const mockOnSearchChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAutocompleteSuggestions.mockResolvedValue(mockSuggestions)
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  it('renders with default placeholder', () => {
    render(<MapSearch onLocationSelect={mockOnLocationSelect} />)
    
    expect(screen.getByPlaceholderText('Search locations worldwide...')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders with custom placeholder', () => {
    render(
      <MapSearch 
        onLocationSelect={mockOnLocationSelect} 
        placeholder="Find a place..." 
      />
    )
    
    expect(screen.getByPlaceholderText('Find a place...')).toBeInTheDocument()
  })

  it('renders with initial value', () => {
    render(
      <MapSearch 
        onLocationSelect={mockOnLocationSelect} 
        initialValue="London" 
      />
    )
    
    expect(screen.getByDisplayValue('London')).toBeInTheDocument()
  })

  it('updates when initialValue prop changes', () => {
    const { rerender } = render(
      <MapSearch 
        onLocationSelect={mockOnLocationSelect} 
        initialValue="London" 
      />
    )
    
    expect(screen.getByDisplayValue('London')).toBeInTheDocument()
    
    rerender(
      <MapSearch 
        onLocationSelect={mockOnLocationSelect} 
        initialValue="Paris" 
      />
    )
    
    expect(screen.getByDisplayValue('Paris')).toBeInTheDocument()
  })

  it('calls onSearchChange when input changes', async () => {
    const user = userEvent.setup()
    
    render(
      <MapSearch 
        onLocationSelect={mockOnLocationSelect}
        onSearchChange={mockOnSearchChange}
      />
    )
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'London')
    
    expect(mockOnSearchChange).toHaveBeenCalledWith('L')
    expect(mockOnSearchChange).toHaveBeenCalledWith('Lo')
    expect(mockOnSearchChange).toHaveBeenCalledWith('Lon')
    expect(mockOnSearchChange).toHaveBeenCalledWith('Lond')
    expect(mockOnSearchChange).toHaveBeenCalledWith('Londo')
    expect(mockOnSearchChange).toHaveBeenCalledWith('London')
  })

  it('does not search for queries shorter than 2 characters', async () => {
    const user = userEvent.setup()
    
    render(<MapSearch onLocationSelect={mockOnLocationSelect} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'L')
    
    // Wait a bit to ensure no search is triggered
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 400))
    })
    
    expect(mockGetAutocompleteSuggestions).not.toHaveBeenCalled()
  })

  it('searches with debounce when typing', async () => {
    const user = userEvent.setup()
    
    render(<MapSearch onLocationSelect={mockOnLocationSelect} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'London')
    
    // Search should be debounced - not called immediately
    expect(mockGetAutocompleteSuggestions).not.toHaveBeenCalled()
    
    // Wait for debounce
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 350))
    })
    
    expect(mockGetAutocompleteSuggestions).toHaveBeenCalledWith('London')
  })

  it('triggers search after debounce delay', async () => {
    const user = userEvent.setup()
    
    render(<MapSearch onLocationSelect={mockOnLocationSelect} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'London')
    
    // Should not search immediately
    expect(mockGetAutocompleteSuggestions).not.toHaveBeenCalled()
    
    // Wait for debounce
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 350))
    })
    
    // Should have triggered search
    expect(mockGetAutocompleteSuggestions).toHaveBeenCalledWith('London')
    
    // Should show suggestions after search completes
    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument()
    })
  })

  it('displays search suggestions', async () => {
    const user = userEvent.setup()
    
    render(<MapSearch onLocationSelect={mockOnLocationSelect} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'London')
    
    // Wait for search to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 350))
    })
    
    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument()
      expect(screen.getByText('United Kingdom')).toBeInTheDocument()
      expect(screen.getByText('New York')).toBeInTheDocument()
      expect(screen.getByText('New York, United States')).toBeInTheDocument()
      expect(screen.getByText('Paris')).toBeInTheDocument()
      expect(screen.getByText('France')).toBeInTheDocument()
    })
  })

  it('calls onLocationSelect when suggestion is clicked', async () => {
    const user = userEvent.setup()
    
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
  })

  it('updates input value when suggestion is selected', async () => {
    const user = userEvent.setup()
    
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
    
    expect(input).toHaveValue('London, United Kingdom')
  })

  it('hides dropdown after suggestion selection', async () => {
    const user = userEvent.setup()
    
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
    
    // Dropdown should be hidden
    await waitFor(() => {
      expect(screen.queryByText('New York')).not.toBeInTheDocument()
    })
  })

  it('shows clear button when input has value', async () => {
    const user = userEvent.setup()
    
    render(<MapSearch onLocationSelect={mockOnLocationSelect} />)
    
    const input = screen.getByRole('textbox')
    
    // No clear button initially
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    
    await user.type(input, 'London')
    
    // Clear button should appear
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('clears input when clear button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <MapSearch 
        onLocationSelect={mockOnLocationSelect}
        onSearchChange={mockOnSearchChange}
      />
    )
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'London')
    
    expect(input).toHaveValue('London')
    
    const clearButton = screen.getByRole('button')
    await user.click(clearButton)
    
    expect(input).toHaveValue('')
    expect(mockOnSearchChange).toHaveBeenCalledWith('')
  })

  it('focuses input after clearing', async () => {
    const user = userEvent.setup()
    
    render(<MapSearch onLocationSelect={mockOnLocationSelect} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'London')
    
    const clearButton = screen.getByRole('button')
    await user.click(clearButton)
    
    expect(input).toHaveFocus()
  })

  it('shows dropdown on focus if suggestions exist', async () => {
    const user = userEvent.setup()
    
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
    
    // Blur and focus again
    fireEvent.blur(input)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 250)) // Wait for blur timeout
    })
    
    fireEvent.focus(input)
    
    // Dropdown should show again
    expect(screen.getByText('London')).toBeInTheDocument()
  })

  it('hides dropdown on blur with delay', async () => {
    const user = userEvent.setup()
    
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
    
    fireEvent.blur(input)
    
    // Dropdown should still be visible immediately
    expect(screen.getByText('London')).toBeInTheDocument()
    
    // Wait for blur delay
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 250))
    })
    
    // Dropdown should be hidden now
    expect(screen.queryByText('London')).not.toBeInTheDocument()
  })

  it('handles search errors gracefully', async () => {
    const user = userEvent.setup()
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    mockGetAutocompleteSuggestions.mockRejectedValue(new Error('API Error'))
    
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

  it('applies custom className', () => {
    render(
      <MapSearch 
        onLocationSelect={mockOnLocationSelect}
        className="custom-search-class"
      />
    )
    
    // The className is applied to the outermost div
    const container = screen.getByRole('textbox').closest('div')?.parentElement
    expect(container).toHaveClass('relative', 'custom-search-class')
  })

  it('has proper accessibility attributes', () => {
    render(<MapSearch onLocationSelect={mockOnLocationSelect} />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('placeholder', 'Search locations worldwide...')
    
    // Search icon should be decorative
    const searchIcon = screen.getByRole('textbox').parentElement?.querySelector('svg')
    expect(searchIcon).toBeInTheDocument()
  })

  it('prevents default on suggestion mouseDown', async () => {
    const user = userEvent.setup()
    
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
    
    const londonSuggestion = screen.getByText('London')
    const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    const preventDefaultSpy = jest.spyOn(mouseDownEvent, 'preventDefault')
    
    fireEvent(londonSuggestion, mouseDownEvent)
    
    expect(preventDefaultSpy).toHaveBeenCalled()
  })
})
