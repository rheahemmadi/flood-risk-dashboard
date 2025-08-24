import { renderHook, act } from '@testing-library/react'
import { useToast, toast, reducer } from '../use-toast'

// Mock timers
jest.useFakeTimers()

describe('useToast', () => {
  beforeEach(() => {
    // Clear any existing toasts
    jest.clearAllTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.useFakeTimers()
  })

  it('returns initial empty state', () => {
    const { result } = renderHook(() => useToast())
    
    expect(result.current.toasts).toEqual([])
    expect(typeof result.current.toast).toBe('function')
    expect(typeof result.current.dismiss).toBe('function')
  })

  it('adds a toast', () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      result.current.toast({
        title: 'Test Toast',
        description: 'This is a test toast',
      })
    })
    
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0]).toMatchObject({
      title: 'Test Toast',
      description: 'This is a test toast',
      open: true,
    })
    expect(result.current.toasts[0].id).toBeDefined()
  })

  it('adds multiple toasts but respects limit', () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      result.current.toast({ title: 'Toast 1' })
      result.current.toast({ title: 'Toast 2' })
      result.current.toast({ title: 'Toast 3' })
    })
    
    // Should only keep the most recent toast due to TOAST_LIMIT = 1
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].title).toBe('Toast 3')
  })

  it('dismisses a specific toast', () => {
    const { result } = renderHook(() => useToast())
    
    let toastId: string
    
    act(() => {
      const toastResult = result.current.toast({ title: 'Test Toast' })
      toastId = toastResult.id
    })
    
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].open).toBe(true)
    
    act(() => {
      result.current.dismiss(toastId)
    })
    
    expect(result.current.toasts[0].open).toBe(false)
  })

  it('dismisses all toasts when no ID provided', () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      result.current.toast({ title: 'Toast 1' })
    })
    
    expect(result.current.toasts[0].open).toBe(true)
    
    act(() => {
      result.current.dismiss()
    })
    
    expect(result.current.toasts[0].open).toBe(false)
  })

  it('removes toast after delay when dismissed', () => {
    const { result } = renderHook(() => useToast())
    
    let toastId: string
    
    act(() => {
      const toastResult = result.current.toast({ title: 'Test Toast' })
      toastId = toastResult.id
    })
    
    expect(result.current.toasts).toHaveLength(1)
    
    act(() => {
      result.current.dismiss(toastId)
    })
    
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].open).toBe(false)
    
    // Fast-forward time to trigger removal
    act(() => {
      jest.advanceTimersByTime(1000000)
    })
    
    expect(result.current.toasts).toHaveLength(0)
  })

  it('returns toast control functions', () => {
    const { result } = renderHook(() => useToast())
    
    let toastControls: any
    
    act(() => {
      toastControls = result.current.toast({ title: 'Test Toast' })
    })
    
    expect(toastControls).toHaveProperty('id')
    expect(toastControls).toHaveProperty('dismiss')
    expect(toastControls).toHaveProperty('update')
    expect(typeof toastControls.dismiss).toBe('function')
    expect(typeof toastControls.update).toBe('function')
  })

  it('updates toast using returned update function', () => {
    const { result } = renderHook(() => useToast())
    
    let toastControls: any
    
    act(() => {
      toastControls = result.current.toast({ title: 'Original Title' })
    })
    
    expect(result.current.toasts[0].title).toBe('Original Title')
    
    act(() => {
      toastControls.update({ title: 'Updated Title' })
    })
    
    expect(result.current.toasts[0].title).toBe('Updated Title')
  })

  it('dismisses toast using returned dismiss function', () => {
    const { result } = renderHook(() => useToast())
    
    let toastControls: any
    
    act(() => {
      toastControls = result.current.toast({ title: 'Test Toast' })
    })
    
    expect(result.current.toasts[0].open).toBe(true)
    
    act(() => {
      toastControls.dismiss()
    })
    
    expect(result.current.toasts[0].open).toBe(false)
  })

  it('handles onOpenChange callback', () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      result.current.toast({ title: 'Test Toast' })
    })
    
    const toast = result.current.toasts[0]
    expect(toast.open).toBe(true)
    
    act(() => {
      toast.onOpenChange?.(false)
    })
    
    expect(result.current.toasts[0].open).toBe(false)
  })

  it('synchronizes state across multiple hook instances', () => {
    const { result: result1 } = renderHook(() => useToast())
    const { result: result2 } = renderHook(() => useToast())
    
    act(() => {
      result1.current.toast({ title: 'Shared Toast' })
    })
    
    expect(result1.current.toasts).toHaveLength(1)
    expect(result2.current.toasts).toHaveLength(1)
    expect(result1.current.toasts[0].id).toBe(result2.current.toasts[0].id)
  })
})

describe('toast function', () => {
  beforeEach(() => {
    jest.clearAllTimers()
  })

  it('can be called independently', () => {
    const toastResult = toast({ title: 'Independent Toast' })
    
    expect(toastResult).toHaveProperty('id')
    expect(toastResult).toHaveProperty('dismiss')
    expect(toastResult).toHaveProperty('update')
  })

  it('generates unique IDs', () => {
    const toast1 = toast({ title: 'Toast 1' })
    const toast2 = toast({ title: 'Toast 2' })
    
    expect(toast1.id).not.toBe(toast2.id)
  })
})

describe('reducer', () => {
  const initialState = { toasts: [] }

  it('adds toast to empty state', () => {
    const toast = {
      id: '1',
      title: 'Test Toast',
      open: true,
    }

    const newState = reducer(initialState, {
      type: 'ADD_TOAST',
      toast,
    })

    expect(newState.toasts).toHaveLength(1)
    expect(newState.toasts[0]).toEqual(toast)
  })

  it('respects toast limit when adding', () => {
    const existingToast = { id: '1', title: 'Existing Toast', open: true }
    const state = { toasts: [existingToast] }
    
    const newToast = { id: '2', title: 'New Toast', open: true }

    const newState = reducer(state, {
      type: 'ADD_TOAST',
      toast: newToast,
    })

    // Should only keep the new toast due to limit
    expect(newState.toasts).toHaveLength(1)
    expect(newState.toasts[0]).toEqual(newToast)
  })

  it('updates existing toast', () => {
    const existingToast = { id: '1', title: 'Original', open: true }
    const state = { toasts: [existingToast] }

    const newState = reducer(state, {
      type: 'UPDATE_TOAST',
      toast: { id: '1', title: 'Updated' },
    })

    expect(newState.toasts[0]).toEqual({
      id: '1',
      title: 'Updated',
      open: true,
    })
  })

  it('dismisses specific toast', () => {
    const toast1 = { id: '1', title: 'Toast 1', open: true }
    const toast2 = { id: '2', title: 'Toast 2', open: true }
    const state = { toasts: [toast1, toast2] }

    const newState = reducer(state, {
      type: 'DISMISS_TOAST',
      toastId: '1',
    })

    expect(newState.toasts[0].open).toBe(false)
    expect(newState.toasts[1].open).toBe(true)
  })

  it('dismisses all toasts when no ID provided', () => {
    const toast1 = { id: '1', title: 'Toast 1', open: true }
    const toast2 = { id: '2', title: 'Toast 2', open: true }
    const state = { toasts: [toast1, toast2] }

    const newState = reducer(state, {
      type: 'DISMISS_TOAST',
    })

    expect(newState.toasts[0].open).toBe(false)
    expect(newState.toasts[1].open).toBe(false)
  })

  it('removes specific toast', () => {
    const toast1 = { id: '1', title: 'Toast 1', open: true }
    const toast2 = { id: '2', title: 'Toast 2', open: true }
    const state = { toasts: [toast1, toast2] }

    const newState = reducer(state, {
      type: 'REMOVE_TOAST',
      toastId: '1',
    })

    expect(newState.toasts).toHaveLength(1)
    expect(newState.toasts[0].id).toBe('2')
  })

  it('removes all toasts when no ID provided', () => {
    const toast1 = { id: '1', title: 'Toast 1', open: true }
    const toast2 = { id: '2', title: 'Toast 2', open: true }
    const state = { toasts: [toast1, toast2] }

    const newState = reducer(state, {
      type: 'REMOVE_TOAST',
    })

    expect(newState.toasts).toHaveLength(0)
  })
})
