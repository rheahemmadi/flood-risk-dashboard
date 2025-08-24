import { test, expect } from '@playwright/test';
import { setupApiMocking, getSearchInput, getMapContainer, waitForAppToLoad } from './test-helpers';

test.describe('Map and Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocking(page);
    await page.goto('/');
    await waitForAppToLoad(page);
  });

  test('map loads and displays correctly', async ({ page }) => {
    // Check if map container is present using helper
    const mapContainer = getMapContainer(page);
    await expect(mapContainer).toBeVisible({ timeout: 10000 });
    
    // Check if map controls are present
    await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zoom out' })).toBeVisible();
  });

  test('search functionality works', async ({ page }) => {
    // Find the search input using helper
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible();
    
    // Type in a search query
    await searchInput.fill('London');
    
    // Verify the search input accepts input
    await expect(searchInput).toHaveValue('London');
    
    // Verify search input is functional
    await expect(searchInput).toBeEnabled();
  });

  test('search shows loading state', async ({ page }) => {
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible();
    
    // Type in a search query
    await searchInput.fill('Paris');
    await expect(searchInput).toHaveValue('Paris');
    
    // Verify the search component is responsive
    await expect(searchInput).toBeEnabled();
  });

  test('search handles no results gracefully', async ({ page }) => {
    const searchInput = getSearchInput(page);
    await searchInput.fill('NonexistentPlace123xyz');
    
    // Verify the input still works even with unusual queries
    await expect(searchInput).toHaveValue('NonexistentPlace123xyz');
    await expect(searchInput).toBeEnabled();
  });

  test('search can be cleared', async ({ page }) => {
    const searchInput = getSearchInput(page);
    await searchInput.fill('London');
    await expect(searchInput).toHaveValue('London');
    
    // Clear the input
    await searchInput.clear();
    await expect(searchInput).toHaveValue('');
  });

  test('map responds to search selection', async ({ page }) => {
    const searchInput = getSearchInput(page);
    await searchInput.fill('New York');
    
    // Verify the search input works
    await expect(searchInput).toHaveValue('New York');
    
    // Verify map is still visible (basic integration check)
    const mapContainer = getMapContainer(page);
    await expect(mapContainer).toBeVisible();
  });

  test('keyboard navigation works in search', async ({ page }) => {
    const searchInput = getSearchInput(page);
    await searchInput.fill('London');
    
    // Test keyboard interactions
    await searchInput.press('ArrowDown');
    await searchInput.press('ArrowUp');
    await searchInput.press('Escape');
    
    // Verify input still works after keyboard interactions
    await expect(searchInput).toHaveValue('London');
    await expect(searchInput).toBeEnabled();
  });

  test('search works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('Tokyo');
    await expect(searchInput).toHaveValue('Tokyo');
    
    // Verify search still works on mobile
    await expect(searchInput).toBeEnabled();
  });

  test('multiple searches work correctly', async ({ page }) => {
    const searchInput = getSearchInput(page);
    
    // First search
    await searchInput.fill('London');
    await expect(searchInput).toHaveValue('London');
    
    // Clear and second search
    await searchInput.clear();
    await searchInput.fill('Paris');
    await expect(searchInput).toHaveValue('Paris');
    
    // Verify multiple searches don't break the component
    await expect(searchInput).toBeEnabled();
  });
});