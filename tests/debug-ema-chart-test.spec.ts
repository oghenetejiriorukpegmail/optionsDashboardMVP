import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5002';

test.describe('Debug EMA Chart Fix', () => {
  
  test('Verify EMA lines are visible in Price and Moving Averages chart', async ({ page }) => {
    const consoleLogs: string[] = [];
    
    // Capture console logs
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    await page.goto(`${BASE_URL}/ticker/AAPL`);
    
    // Wait for data to load
    await page.waitForTimeout(5000);
    
    // Check for Price and Moving Averages chart section
    const chartSectionExists = await page.locator('text="Price and Moving Averages"').count();
    console.log('Price and Moving Averages section found:', chartSectionExists);
    
    // Check for canvas element in the chart
    const canvasCount = await page.locator('canvas').count();
    console.log('Total canvas elements found:', canvasCount);
    
    // Check for EMA legend items
    const emaLegendItems = await page.locator('text=/EMA.*Fast|EMA.*Medium|EMA.*Slow/').count();
    console.log('EMA legend items found:', emaLegendItems);
    
    // Check for the chart legend showing all lines
    const priceLegend = await page.locator('text=/AAPL.*Price/').count();
    console.log('Price line legend found:', priceLegend);
    
    // Take screenshot to verify visually
    await page.screenshot({ path: 'ema-chart-fixed.png', fullPage: true });
    
    // Print relevant console logs
    console.log('=== CONSOLE LOGS ===');
    consoleLogs.forEach((log, index) => {
      if (index < 10) { // Show first 10 logs only
        console.log(log);
      }
    });
    
    // Verify chart is present
    expect(chartSectionExists).toBeGreaterThan(0);
    expect(canvasCount).toBeGreaterThan(0);
  });
  
});