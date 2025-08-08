import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5002';

test.describe('Debug Open Interest Chart', () => {
  
  test('Debug OI chart rendering for AAPL Key Levels page', async ({ page }) => {
    const consoleLogs: string[] = [];
    
    // Capture console logs including errors
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    await page.goto(`${BASE_URL}/ticker/AAPL`);
    
    // Click on Key Levels tab
    await page.click('text=Key Levels');
    
    // Wait for content to load
    await page.waitForTimeout(8000);
    
    // Check if canvas elements exist
    const canvasCount = await page.locator('canvas').count();
    console.log('Canvas elements found:', canvasCount);
    
    // Check for chart container
    const chartContainerExists = await page.locator('div:has(canvas)').count();
    console.log('Chart containers found:', chartContainerExists);
    
    // Check for specific chart titles
    const oiChartTitle = await page.locator('text="Open Interest Distribution"').count();
    console.log('OI Chart title found:', oiChartTitle);
    
    // Check if data exists in the component
    const hasData = await page.locator('text=/No.*[Dd]ata/').count();
    console.log('No Data messages found:', hasData);
    
    // Check for PCR values
    const pcrElements = await page.locator('text=/Put.*Call.*Ratio/').count();
    console.log('PCR elements found:', pcrElements);
    
    // Print all console logs
    console.log('=== CONSOLE LOGS ===');
    consoleLogs.forEach(log => {
      console.log(log);
    });
    
    // Take screenshot for manual review
    await page.screenshot({ path: 'debug-oi-chart.png', fullPage: true });
  });
  
});