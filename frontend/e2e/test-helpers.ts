import { Page } from '@playwright/test';

/**
 * Sets up API mocking for all E2E tests to prevent timeout issues
 */
export async function setupApiMocking(page: Page) {
  // Set up mock environment variables for search functionality
  await page.addInitScript(() => {
    // Mock the Mapbox token so search functions don't return early
    window.process = window.process || {};
    window.process.env = window.process.env || {};
    window.process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'mock-token-for-testing';
  });

  // Mock Mapbox geocoding API with better pattern matching
  await page.route('**/geocoding/v5/mapbox.places/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        features: [
          {
            id: 'place.1',
            text: 'London',
            place_name: 'London, United Kingdom',
            center: [-0.1278, 51.5074],
            bbox: [-0.5, 51.2, 0.2, 51.8]
          }
        ]
      }),
    });
  });

  // Mock flood points summary endpoint
  await page.route('**/api/flood-points/summary*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        unique_dates: ['2024-01-16', '2024-01-17'],
        risk_breakdown: { high: 5, medium: 10, low: 15 }
      }),
    });
  });
  
  // Mock other API calls with appropriate responses
  await page.route('**/api/**', async (route, request) => {
    const url = request.url();
    
    if (url.includes('/api/flood-clusters')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          clusters: [
            {
              id: 'cluster-1',
              zoom_level: 4,
              geohash: 'gcpv',
              lat: 51.5074,
              lon: -0.1278,
              time: '2024-01-16T10:00:00Z',
              point_count: 1,
              avg_forecast: 0.85,
              max_forecast: 0.85,
              min_forecast: 0.85,
              risk_level: 'high'
            }
          ], 
          total: 1 
        }),
      });
    } else if (url.includes('/api/flood-points')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          points: [
            {
              id: 'point-1',
              time: '2024-01-16T10:00:00Z',
              forecast_run_date: '2024-01-16',
              lat: 51.5074,
              lon: -0.1278,
              forecast_value: 0.85,
              return_period: '20-year'
            }
          ], 
          total: 1 
        }),
      });
    } else if (url.includes('/api/location-name')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ location_name: 'London, United Kingdom' }),
      });
    } else if (url.includes('/api/generate-insight')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          insight: 'Critical flood warning for the area. Immediate evacuation recommended.',
          generated_at: new Date().toISOString(),
          model: 'gemini-1.5-flash'
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    }
  });
}

/**
 * Gets the search input using a unique selector to avoid strict mode violations
 */
export function getSearchInput(page: Page) {
  return page.getByRole('textbox', { name: 'Search locations worldwide...' });
}

/**
 * Gets the main map container using a specific selector
 */
export function getMapContainer(page: Page) {
  return page.getByRole('region', { name: 'Map' });
}

/**
 * Waits for the app to load completely
 */
export async function waitForAppToLoad(page: Page) {
  // Wait for essential elements to be present
  await page.getByRole('heading', { name: 'The Alert Engine' }).waitFor();
  await page.getByText('Risk Level:').waitFor();
  await page.waitForTimeout(1000); // Give components time to settle
}
