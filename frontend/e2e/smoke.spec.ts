import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('application loads successfully', async ({ page }) => {
    // Mock API responses so the app can load
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
    
    // Also mock any other potential API calls
    await page.route('**/api/**', async (route, request) => {
      const url = request.url();
      console.log('Intercepted API call:', url);

      if (url.includes('/api/flood-clusters')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ clusters: [], total: 0 }),
        });
      } else if (url.includes('/api/flood-points')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ points: [], total: 0 }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}),
        });
      }
    });

    await page.goto('/');
    
    // Check that the page loads and has expected title
    await expect(page).toHaveTitle(/The Alert Engine/i);
    
    // Wait for the app to fully load - check that essential elements are present
    try {
      await expect(page.getByText('Loading dashboard data...')).toBeVisible({ timeout: 2000 });
      await expect(page.getByText('Loading dashboard data...')).not.toBeVisible({ timeout: 10000 });
    } catch {
      // Loading was too fast, continue to content check
    }
    
    // Check that the page has loaded by verifying key unique elements exist
    await expect(page.getByRole('heading', { name: 'The Alert Engine' })).toBeAttached();
    await expect(page.getByRole('textbox', { name: 'Search locations worldwide...' })).toBeVisible();
    await expect(page.getByText('Risk Level:')).toBeVisible();
    await expect(page.getByRole('button', { name: 'High (0)' })).toBeVisible();
    
    // Check that no critical errors occurred
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit for any console errors to appear
    await page.waitForTimeout(2000);
    
    // Filter out known development warnings
    const criticalErrors = errors.filter(error => 
      !error.includes('Warning:') && 
      !error.includes('act(...)')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('page is accessible', async ({ page }) => {
    // Mock API responses
    await page.route('**/api/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          unique_dates: ['2024-01-16', '2024-01-17'],
          risk_breakdown: { high: 5, medium: 10, low: 15 }
        }),
      });
    });

    await page.goto('/');
    
    // Wait for app to load - try loading text first, then fallback to content
    try {
      await expect(page.getByText('Loading dashboard data...')).not.toBeVisible({ timeout: 5000 });
    } catch {
      // Loading was too fast, continue to content check
    }
    
    // Wait for actual content to be visible (not just present)
    await page.waitForTimeout(1000); // Give the app time to render
    
    // Check for basic accessibility features
    await expect(page.locator('body')).toBeVisible();
    
    // Look for any interactive or heading elements that should be visible
    const visibleContent = page.locator('h1:visible, h2:visible, h3:visible, button:visible, [role="button"]:visible');
    await expect(visibleContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('page is responsive on mobile', async ({ page }) => {
    // Mock API responses
    await page.route('**/api/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          unique_dates: ['2024-01-16', '2024-01-17'],
          risk_breakdown: { high: 5, medium: 10, low: 15 }
        }),
      });
    });

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Wait for app to load
    try {
      await expect(page.getByText('Loading dashboard data...')).not.toBeVisible({ timeout: 5000 });
    } catch {
      // Loading was too fast, continue
    }
    
    // Wait for content to render
    await page.waitForTimeout(1000);
    
    // Check that the page renders correctly on mobile
    await expect(page.locator('body')).toBeVisible();
    
    // Check that content is not horizontally scrollable
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    expect(bodyBox?.width).toBeLessThanOrEqual(375);
  });
});
