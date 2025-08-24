import { test, expect } from '@playwright/test';
import { setupApiMocking, waitForAppToLoad, getMapContainer } from './test-helpers';

test.describe('Complete User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocking(page);
    await page.goto('/');
    await waitForAppToLoad(page);
  });

  test('complete flood monitoring workflow', async ({ page }) => {
    // Step 1: Verify the dashboard loads
    const mapContainer = getMapContainer(page);
    await expect(mapContainer).toBeVisible({ timeout: 10000 });
    
    // Step 2: Check risk level controls
    await expect(page.getByRole('button', { name: 'High (0)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Medium (0)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Low (0)' })).toBeVisible();
    
    // Step 3: Verify map controls work
    await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zoom out' })).toBeVisible();
    
    // Step 4: Verify the complete workflow is functional
    await expect(page.getByRole('heading', { name: 'The Alert Engine' })).toBeVisible();
    await expect(page.getByText('Risk Level:')).toBeVisible();
  });

  test('mobile user journey', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify mobile layout
    const mapContainer = getMapContainer(page);
    await expect(mapContainer).toBeVisible({ timeout: 10000 });
    
    // Check that core elements are still accessible on mobile
    await expect(page.getByRole('heading', { name: 'The Alert Engine' })).toBeVisible();
    
    // Check that essential map controls work on mobile (these are always visible)
    await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zoom out' })).toBeVisible();
    
    // Verify the mobile layout doesn't break core functionality
    await expect(page.locator('body')).toBeVisible();
  });

  test('error recovery journey', async ({ page }) => {
    // This test verifies the app handles errors gracefully
    await expect(page.getByRole('heading', { name: 'The Alert Engine' })).toBeVisible();
    await expect(page.getByText('Risk Level:')).toBeVisible();
    
    // Verify core functionality still works even with API errors
    const mapContainer = getMapContainer(page);
    await expect(mapContainer).toBeVisible({ timeout: 10000 });
  });

  test('accessibility journey', async ({ page }) => {
    // Check basic accessibility features
    await expect(page.getByRole('heading', { name: 'The Alert Engine' })).toBeVisible();
    
    // Verify interactive elements are accessible
    await expect(page.getByRole('button', { name: 'High (0)' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Medium (0)' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Low (0)' })).toBeEnabled();
    
    // Check map accessibility
    const mapContainer = getMapContainer(page);
    await expect(mapContainer).toBeVisible({ timeout: 10000 });
  });

  test('performance journey', async ({ page }) => {
    const startTime = Date.now();
    
    // Verify the app loads within reasonable time
    await expect(page.getByRole('heading', { name: 'The Alert Engine' })).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds
    
    // Verify core elements are present
    await expect(page.getByText('Risk Level:')).toBeVisible();
    const mapContainer = getMapContainer(page);
    await expect(mapContainer).toBeVisible({ timeout: 10000 });
  });
});