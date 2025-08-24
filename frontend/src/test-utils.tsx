import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Toaster } from './components/ui/sonner'

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock data for testing
export const mockFloodPoint = {
  id: 'test-point-1',
  latitude: 51.5074,
  longitude: -0.1278,
  riskLevel: 'high' as const,
  riverName: 'Thames',
  segmentId: 'thames_001',
}

export const mockFloodAlert = {
  id: 'test-alert-1',
  date: '2024-01-16',
  riskLevel: 'high' as const,
  riverName: 'Thames',
  segmentId: 'thames_001',
  latitude: 51.5074,
  longitude: -0.1278,
  forecastValue: 0.85,
  location: 'London, United Kingdom',
  returnPeriod: '20-year' as const,
}

export const mockLocationSearchResult = {
  id: 'london',
  place_name: 'London, United Kingdom',
  center: [-0.1278, 51.5074] as [number, number],
  bbox: [-0.489, 51.28, 0.236, 51.686] as [number, number, number, number],
}

// Helper function to create mock API responses
export const createMockApiResponse = <T>(data: T, delay = 0) => {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

// Helper function to create mock API errors
export const createMockApiError = (message = 'API Error', delay = 0) => {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(message)), delay)
  })
}
