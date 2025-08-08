import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5002';

test.describe('Debug PCR Calculations', () => {
  
  test('Debug PCR calculations in Key Levels page for AAPL', async ({ page }) => {
    const consoleLogs: string[] = [];
    
    // Capture console logs
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });
    
    await page.goto(`${BASE_URL}/ticker/AAPL`);
    
    // Click on Key Levels tab
    await page.click('text=Key Levels');
    
    // Wait for content to load
    await page.waitForTimeout(5000);
    
    // Print all console logs
    console.log('=== CONSOLE LOGS ===');
    consoleLogs.forEach(log => {
      if (log.includes('DEBUG')) {
        console.log(log);
      }
    });
    
    // Check if PCR values are displayed
    const pcrElement = await page.locator('text=/OI Put\/Call Ratio/').first();
    await expect(pcrElement).toBeVisible({ timeout: 15000 });
    
    // Get the PCR value displayed in the UI
    const pcrValue = await page.locator('text="OI Put/Call Ratio"').locator('..').locator('div').nth(1).textContent();
    console.log('PCR Value in UI:', pcrValue);
    
    // Also get Volume PCR
    const volumePcrValue = await page.locator('text="Volume PCR"').locator('..').locator('div').nth(1).textContent();
    console.log('Volume PCR Value in UI:', volumePcrValue);
  });
  
});