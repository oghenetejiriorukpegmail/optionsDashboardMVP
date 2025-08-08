import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5002';

test.describe('Debug Days to Expiry', () => {
  
  test('Debug Days to Expiry calculation for AAPL', async ({ page }) => {
    const consoleLogs: string[] = [];
    
    // Capture console logs
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    await page.goto(`${BASE_URL}/ticker/AAPL`);
    
    // Click on Key Levels tab
    await page.click('text=Key Levels');
    
    // Wait for content to load
    await page.waitForTimeout(5000);
    
    // Check expiration tabs
    const expirationTabs = await page.locator('button[role="tab"]').count();
    console.log('Expiration tabs found:', expirationTabs);
    
    // Get the first expiration tab text
    if (expirationTabs > 0) {
      const firstTabText = await page.locator('button[role="tab"]').first().textContent();
      console.log('First expiration tab text:', firstTabText);
    }
    
    // Check Days to Expiry value
    const daysToExpiryCard = await page.locator('text="Days to Expiry"').locator('..').locator('div').nth(1);
    const daysToExpiryValue = await daysToExpiryCard.textContent();
    console.log('Days to Expiry value:', daysToExpiryValue);
    
    // Check selected expiration display
    const selectedExpirationDisplay = await page.locator('text="Days to Expiry"').locator('..').locator('p').textContent();
    console.log('Selected expiration display:', selectedExpirationDisplay);
    
    // Print relevant console logs
    console.log('=== RELEVANT CONSOLE LOGS ===');
    consoleLogs.forEach(log => {
      if (log.includes('expiration') || log.includes('Expiry') || log.includes('date')) {
        console.log(log);
      }
    });
  });
  
});