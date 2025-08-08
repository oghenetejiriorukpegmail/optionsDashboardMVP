import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5002';

test.describe('Debug Zoom Controls', () => {
  
  test('Check zoom buttons and functionality', async ({ page }) => {
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
    await page.waitForTimeout(3000);
    
    // Check for zoom buttons
    const zoomButtons = ['1M', '3M', '6M', '1Y'];
    for (const button of zoomButtons) {
      const buttonElement = page.locator(`button >> text="${button}"`);
      const isVisible = await buttonElement.isVisible();
      console.log(`${button} button visible: ${isVisible}`);
    }
    
    // Click 1M button and check if it becomes active
    const oneMonthButton = page.locator('button >> text="1M"');
    if (await oneMonthButton.isVisible()) {
      await oneMonthButton.click();
      await page.waitForTimeout(2000);
      console.log('Clicked 1M button');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'zoom-controls-debug.png', fullPage: true });
  });
  
});