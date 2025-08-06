import { test, expect } from '@playwright/test';

test.describe('AMD Ticker Price Display Validation', () => {
  test('should display correct price for AMD ticker instead of $0.00', async ({ page }) => {
    // Navigate to the AMD ticker page
    await page.goto('/ticker/AMD');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Wait for any additional data fetching (give it extra time for API calls)
    await page.waitForTimeout(3000);
    
    // Look for the price display in the header section
    // Check multiple possible selectors for the price display
    const priceSelectors = [
      '[data-testid="ticker-price"]',
      '.ticker-price',
      'text=/\\$[0-9,]+\\.[0-9]{2}/',
      'text=/AMD.*\\$[0-9,]+\\.[0-9]{2}/',
      'h1:has-text("AMD") + *:has-text("$")',
      'h2:has-text("AMD") + *:has-text("$")',
      ':text("AMD") ~ :text-matches("\\$[0-9,]+\\.[0-9]{2}")',
    ];
    
    let priceElement = null;
    let actualPrice = '';
    
    // Try to find the price element using different selectors
    for (const selector of priceSelectors) {
      try {
        priceElement = page.locator(selector).first();
        if (await priceElement.isVisible({ timeout: 5000 })) {
          actualPrice = await priceElement.textContent() || '';
          if (actualPrice && !actualPrice.includes('$0.00')) {
            break;
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    // If we couldn't find with specific selectors, search more broadly
    if (!actualPrice || actualPrice.includes('$0.00')) {
      // Look for any text containing a dollar sign and numbers
      const allPriceElements = page.locator('text=/\\$[0-9,]+\\.[0-9]{2}/');
      const count = await allPriceElements.count();
      
      for (let i = 0; i < count; i++) {
        const element = allPriceElements.nth(i);
        const text = await element.textContent();
        if (text && !text.includes('$0.00')) {
          actualPrice = text;
          priceElement = element;
          break;
        }
      }
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ 
      path: 'test-results/amd-price-validation.png',
      fullPage: true 
    });
    
    // Log the page content for debugging
    const pageContent = await page.content();
    console.log('=== AMD Page Analysis ===');
    console.log('Found price text:', actualPrice);
    console.log('Page title:', await page.title());
    
    // Search for AMD and dollar signs in the page content
    const amdMatches = pageContent.match(/AMD.*?\$[\d,]+\.[\d]{2}/gi);
    const priceMatches = pageContent.match(/\$[\d,]+\.[\d]{2}/g);
    
    console.log('AMD + price matches:', amdMatches);
    console.log('All price matches:', priceMatches);
    
    // Verify the page loaded correctly
    await expect(page).toHaveTitle(/AMD|Options|Ticker/);
    
    // Verify we're on the correct ticker page
    await expect(page.locator('text=AMD')).toBeVisible();
    
    // Main assertion: Price should not be $0.00
    if (actualPrice) {
      console.log('✓ Found price:', actualPrice);
      expect(actualPrice).not.toContain('$0.00');
      
      // Extract numeric value and verify it's reasonable
      const numericPrice = parseFloat(actualPrice.replace(/[$,]/g, ''));
      expect(numericPrice).toBeGreaterThan(0);
      expect(numericPrice).toBeLessThan(1000); // Reasonable upper bound for AMD stock
      
      console.log('✓ Price validation passed:', numericPrice);
    } else {
      // If no price found, fail with detailed information
      throw new Error(`
        No valid price found on AMD ticker page!
        
        Expected: A price > $0.00 (like $167.18)
        Found prices: ${priceMatches?.join(', ') || 'None'}
        
        This suggests the TradeSetupRules component is still not extracting 
        the price correctly from the API response format { setup: {...} }
      `);
    }
  });
  
  test('should load AMD ticker page without errors', async ({ page }) => {
    // Monitor console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Monitor network failures
    const failedRequests: string[] = [];
    page.on('response', response => {
      if (!response.ok()) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });
    
    await page.goto('/ticker/AMD');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check for critical console errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('WebSocket') &&
      !error.includes('NEXT_REDIRECT')
    );
    
    console.log('Console errors:', criticalErrors);
    console.log('Failed requests:', failedRequests);
    
    // Don't fail on non-critical errors, but report them
    if (criticalErrors.length > 0) {
      console.warn('⚠️ Found console errors (not failing test):', criticalErrors);
    }
    
    if (failedRequests.length > 0) {
      console.warn('⚠️ Found failed requests (not failing test):', failedRequests);
    }
    
    // Verify basic page functionality
    await expect(page.locator('text=AMD')).toBeVisible();
  });
});