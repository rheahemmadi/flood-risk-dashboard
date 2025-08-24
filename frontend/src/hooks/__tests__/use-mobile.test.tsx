import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '../use-mobile'

// Mock window.matchMedia
const mockMatchMedia = jest.fn()
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  value: 1024, // Default desktop width
})

describe('useIsMobile', () => {
  let mockMediaQueryList: {
    matches: boolean
    addEventListener: jest.Mock
    removeEventListener: jest.Mock
  }

  beforeEach(() => {
    mockMediaQueryList = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    mockMatchMedia.mockReturnValue(mockMediaQueryList)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns false for desktop width initially', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024 })
    
    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(false)
  })

  it('returns true for mobile width initially', () => {
    Object.defineProperty(window, 'innerWidth', { value: 600 })
    
    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(true)
  })

  it('returns false for exactly 768px width (breakpoint)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768 })
    
    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(false)
  })

  it('returns true for 767px width (just below breakpoint)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 767 })
    
    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(true)
  })

  it('sets up media query listener with correct breakpoint', () => {
    renderHook(() => useIsMobile())
    
    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)')
    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('updates when media query changes', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024 })
    
    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(false)
    
    // Simulate window resize to mobile
    Object.defineProperty(window, 'innerWidth', { value: 600 })
    
    // Get the change handler that was registered
    const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0][1]
    
    act(() => {
      changeHandler()
    })
    
    expect(result.current).toBe(true)
  })

  it('updates when window resizes from mobile to desktop', () => {
    Object.defineProperty(window, 'innerWidth', { value: 600 })
    
    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(true)
    
    // Simulate window resize to desktop
    Object.defineProperty(window, 'innerWidth', { value: 1024 })
    
    // Get the change handler that was registered
    const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0][1]
    
    act(() => {
      changeHandler()
    })
    
    expect(result.current).toBe(false)
  })

  it('cleans up media query listener on unmount', () => {
    const { unmount } = renderHook(() => useIsMobile())
    
    expect(mockMediaQueryList.removeEventListener).not.toHaveBeenCalled()
    
    unmount()
    
    expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('handles multiple renders correctly', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024 })
    
    const { result, rerender } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(false)
    
    rerender()
    
    expect(result.current).toBe(false)
    // matchMedia is called once during the effect, not on every render
    expect(mockMatchMedia).toHaveBeenCalledTimes(1)
  })

  it('returns boolean false for undefined initial state', () => {
    // Test the !!isMobile conversion
    Object.defineProperty(window, 'innerWidth', { value: 1024 })
    
    const { result } = renderHook(() => useIsMobile())
    
    // Should return false (boolean) not undefined
    expect(result.current).toBe(false)
    expect(typeof result.current).toBe('boolean')
  })

  it('handles edge case widths correctly', () => {
    const testCases = [
      { width: 0, expected: true },
      { width: 320, expected: true }, // Small mobile
      { width: 480, expected: true }, // Large mobile
      { width: 767, expected: true }, // Just below breakpoint
      { width: 768, expected: false }, // Exactly at breakpoint
      { width: 1024, expected: false }, // Tablet
      { width: 1920, expected: false }, // Desktop
    ]

    testCases.forEach(({ width, expected }) => {
      Object.defineProperty(window, 'innerWidth', { value: width })
      
      const { result, unmount } = renderHook(() => useIsMobile())
      
      expect(result.current).toBe(expected)
      
      unmount()
    })
  })
})
