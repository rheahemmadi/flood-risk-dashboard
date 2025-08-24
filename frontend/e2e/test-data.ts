// Test data and utilities for E2E tests

export const mockFloodPoints = [
  {
    id: 'london-flood-1',
    lat: 51.5074,
    lon: -0.1278,
    forecast_value: 0.85,
    return_period: '20-year',
    time: '2024-01-16T10:00:00Z',
    forecast_run_date: '2024-01-16'
  },
  {
    id: 'manchester-flood-1',
    lat: 53.4808,
    lon: -2.2426,
    forecast_value: 0.65,
    return_period: '5-year',
    time: '2024-01-16T10:00:00Z',
    forecast_run_date: '2024-01-16'
  },
  {
    id: 'birmingham-flood-1',
    lat: 52.4862,
    lon: -1.8904,
    forecast_value: 0.45,
    return_period: '2-year',
    time: '2024-01-16T10:00:00Z',
    forecast_run_date: '2024-01-16'
  }
];

export const mockSearchResults = {
  london: {
    features: [{
      id: 'place.london',
      text: 'London',
      place_name: 'London, United Kingdom',
      center: [-0.1278, 51.5074],
      bbox: [-0.489, 51.28, 0.236, 51.686]
    }]
  },
  manchester: {
    features: [{
      id: 'place.manchester',
      text: 'Manchester',
      place_name: 'Manchester, United Kingdom',
      center: [-2.2426, 53.4808]
    }]
  },
  paris: {
    features: [{
      id: 'place.paris',
      text: 'Paris',
      place_name: 'Paris, France',
      center: [2.3522, 48.8566]
    }]
  }
};

export const mockLocationNames = {
  '51.5074,-0.1278': 'London, United Kingdom',
  '53.4808,-2.2426': 'Manchester, United Kingdom',
  '52.4862,-1.8904': 'Birmingham, United Kingdom'
};

export const mockAIInsights = {
  critical: 'Critical flood warning for this area. Immediate evacuation may be required. Monitor local emergency services for updates.',
  moderate: 'Moderate flood risk detected. Residents should prepare emergency supplies and stay informed about local conditions.',
  low: 'Low flood risk in this area. Continue monitoring conditions and follow local guidance.'
};

// Helper function to set up API mocking
export async function setupAPIMocking(page: any) {
  // Mock flood points API
  await page.route('**/api/flood-points**', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          points: mockFloodPoints,
          total: mockFloodPoints.length,
          has_more: false
        }
      })
    });
  });

  // Mock geocoding API
  await page.route('**/geocoding/**', async (route: any) => {
    const url = route.request().url();
    
    if (url.includes('London')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSearchResults.london)
      });
    } else if (url.includes('Manchester')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSearchResults.manchester)
      });
    } else if (url.includes('Paris')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSearchResults.paris)
      });
    } else {
      await route.continue();
    }
  });

  // Mock location name API
  await page.route('**/api/location-name**', async (route: any) => {
    const url = new URL(route.request().url());
    const lat = url.searchParams.get('lat');
    const lon = url.searchParams.get('lon');
    const key = `${lat},${lon}`;
    
    const locationName = mockLocationNames[key as keyof typeof mockLocationNames] || 'Unknown Location';
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        location_name: locationName
      })
    });
  });

  // Mock AI insight API
  await page.route('**/api/generate-insight**', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        insight: mockAIInsights.critical,
        generated_at: new Date().toISOString(),
        model: 'gemini-1.5-flash'
      })
    });
  });
}

// Helper function to simulate API errors
export async function setupAPIErrors(page: any) {
  await page.route('**/api/**', async (route: any) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    });
  });
}

// Helper function to simulate slow API responses
export async function setupSlowAPIs(page: any, delay: number = 2000) {
  await page.route('**/api/**', async (route: any) => {
    await page.waitForTimeout(delay);
    await route.continue();
  });
}
