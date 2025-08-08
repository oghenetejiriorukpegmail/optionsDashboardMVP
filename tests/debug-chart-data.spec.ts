import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5002';

test.describe('Debug Chart Data', () => {
  
  test('Check chart data and console logs', async ({ page }) => {
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    
    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      console.log(`CONSOLE ${msg.type()}: ${text}`);
      
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      } else {
        consoleLogs.push(text);
      }
    });
    
    await page.goto(`${BASE_URL}/ticker/AAPL`);
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Click Market tab
    const marketTab = page.locator('button[role="tab"] >> text=Market');
    await expect(marketTab).toBeVisible();
    await marketTab.click();
    
    // Wait for market data to load
    await page.waitForTimeout(5000);
    
    // Click Trend tab
    const trendTab = page.locator('button[role="tab"] >> text=Trend');
    await expect(trendTab).toBeVisible();
    await trendTab.click();
    
    // Wait for chart to load
    await page.waitForTimeout(5000);
    
    console.log('=== CONSOLE ERRORS ===');
    consoleErrors.forEach(error => console.log('ERROR:', error));
    
    console.log('=== CONSOLE LOGS (first 20) ===');
    consoleLogs.slice(0, 20).forEach(log => console.log('LOG:', log));
    
    // Check if chart canvas is present and has content
    const canvas = page.locator('canvas').first();
    if (await canvas.isVisible()) {
      const boundingBox = await canvas.boundingBox();
      console.log('Canvas bounding box:', boundingBox);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'chart-data-debug.png', fullPage: true });
  });
  
});