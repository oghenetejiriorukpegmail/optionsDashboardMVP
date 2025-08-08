import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5002';

test.describe('Key Levels and Historical Data Tests', () => {
  
  test('Key levels page loads for AMD', async ({ page }) => {
    await page.goto(`${BASE_URL}/ticker/AMD`);
    
    // Click on Key Levels tab
    await page.click('text=Key Levels');
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Check for key levels content
    const content = await page.textContent('body');
    console.log('Key Levels page content:', content?.substring(0, 500));
    
    // Check for key levels elements
    await expect(page.locator('text=/Support|Resistance|Pivot/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('Historical data displays in market page', async ({ page }) => {
    await page.goto(`${BASE_URL}/ticker/AMD`);
    
    // Click on Market tab
    await page.click('text=Market');
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Check page content
    const content = await page.textContent('body');
    console.log('Market page content:', content?.substring(0, 500));
    
    // Check for chart canvas
    const canvasCount = await page.locator('canvas').count();
    console.log('Number of canvas elements:', canvasCount);
    
    // Check for market analysis elements (can be either "Market Analysis" or "Market Context Analysis")
    await expect(page.locator('text=/Market.*Analysis/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('API returns historical data for AMD', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/ticker-context?symbol=AMD`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    console.log('Historical data:', data.historicalData);
    
    expect(data.historicalData).toBeDefined();
    expect(Array.isArray(data.historicalData)).toBeTruthy();
  });

  test('API returns key levels for AMD', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/ticker-context?symbol=AMD`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    console.log('Key levels:', data.keyLevels);
    
    expect(data.keyLevels).toBeDefined();
    expect(data.keyLevels.support).toBeDefined();
    expect(data.keyLevels.resistance).toBeDefined();
  });
});