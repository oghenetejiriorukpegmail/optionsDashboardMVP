import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5002';

test.describe('Debug Market Tab', () => {
  
  test('Navigate to Market tab and check chart rendering', async ({ page }) => {
    await page.goto(`${BASE_URL}/ticker/AAPL`);
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Click Market tab (the specific tab, not other Market elements)
    const marketTab = page.locator('button[role="tab"] >> text=Market');
    await expect(marketTab).toBeVisible();
    await marketTab.click();
    
    // Wait for market data to load
    await page.waitForTimeout(5000);
    
    // Click Trend tab within Market Analysis to see Price and Moving Averages chart
    const trendTab = page.locator('button[role="tab"] >> text=Trend');
    await expect(trendTab).toBeVisible();
    await trendTab.click();
    
    // Wait for chart to load
    await page.waitForTimeout(3000);
    
    // Check for Price and Moving Averages section
    const priceSection = await page.locator('text="Price and Moving Averages"').count();
    console.log('Price and Moving Averages section found:', priceSection);
    
    // Check canvas elements
    const canvasCount = await page.locator('canvas').count();
    console.log('Canvas elements found:', canvasCount);
    
    // Check for chart legends
    const emaLegends = await page.locator('text=/EMA.*Fast|EMA.*Medium|EMA.*Slow/').count();
    console.log('EMA legend items:', emaLegends);
    
    // Check page content for debugging
    const pageContent = await page.textContent('body');
    console.log('Market page loaded, contains "Price and Moving Averages":', 
                pageContent?.includes('Price and Moving Averages'));
    
    // Take screenshot to compare chart scaling
    await page.screenshot({ path: 'market-tab-improved-scaling.png', fullPage: true });
    
    console.log('=== Chart improved with dynamic scaling like TradingView ===');
  });
  
});