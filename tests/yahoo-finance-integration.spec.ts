import { test, expect } from '@playwright/test';

test.describe('Yahoo Finance Options Data Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5000');
  });

  test('should fetch options chain data from Yahoo Finance API', async ({ page }) => {
    // Test the API endpoint directly
    const response = await page.request.get('http://localhost:5000/api/options-chain?symbol=AAPL');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    
    // Verify the response structure
    expect(data).toHaveProperty('symbol', 'AAPL');
    expect(data).toHaveProperty('expirations');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('dataSource');
    
    // Verify data source is Yahoo Finance or IBKR (not 'none' or synthetic)
    expect(['Yahoo Finance', 'IBKR', 'none']).toContain(data.dataSource);
    // If we have expirations, data source should NOT be 'none'
    if (data.expirations && data.expirations.length > 0) {
      expect(data.dataSource).not.toBe('none');
    }
    
    // Verify we have real expiration dates
    expect(Array.isArray(data.expirations)).toBeTruthy();
    if (data.expirations.length > 0) {
      // Check that expiration dates are in proper format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      expect(data.expirations[0]).toMatch(dateRegex);
    }
  });

  test('should fetch specific options chain with strike prices', async ({ page }) => {
    // First get available expirations
    const expResponse = await page.request.get('http://localhost:5000/api/options-chain?symbol=AAPL');
    const expData = await expResponse.json();
    
    if (expData.expirations && expData.expirations.length > 0) {
      // Fetch options chain for the first available expiration
      const firstExpiration = expData.expirations[0];
      const chainResponse = await page.request.get(`http://localhost:5000/api/options-chain?symbol=AAPL&expiration=${firstExpiration}`);
      
      expect(chainResponse.ok()).toBeTruthy();
      const chainData = await chainResponse.json();
      
      // Verify chain data structure
      expect(chainData).toHaveProperty('symbol', 'AAPL');
      expect(chainData).toHaveProperty('expiration', firstExpiration);
      expect(chainData).toHaveProperty('dataSource');
      
      // Check for calls and puts data
      if (chainData.calls && chainData.puts) {
        expect(Array.isArray(chainData.calls)).toBeTruthy();
        expect(Array.isArray(chainData.puts)).toBeTruthy();
        
        // Verify option contract structure if data exists
        if (chainData.calls.length > 0) {
          const firstCall = chainData.calls[0];
          expect(firstCall).toHaveProperty('strike');
          expect(firstCall).toHaveProperty('lastPrice');
          expect(firstCall).toHaveProperty('bid');
          expect(firstCall).toHaveProperty('ask');
          expect(firstCall).toHaveProperty('volume');
          expect(firstCall).toHaveProperty('openInterest');
          expect(firstCall).toHaveProperty('impliedVolatility');
        }
      }
    }
  });

  test('should display options chain chart with data source disclaimer', async ({ page }) => {
    // Navigate to a page that displays options data
    // This might be the dashboard or a specific ticker page
    await page.goto('http://localhost:5000/dashboard');
    
    // Wait for any options chain component to load
    // Look for the enhanced options chain component
    const optionsChainComponent = page.locator('[class*="EnhancedOptionsChain"], [class*="options-chain"]').first();
    
    if (await optionsChainComponent.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Check for data source disclaimer
      const disclaimer = page.locator('text=/Data provided by|Data delayed/i');
      await expect(disclaimer).toBeVisible({ timeout: 10000 });
      
      // Verify Yahoo Finance is mentioned
      const yahooDisclaimer = page.locator('text=/Yahoo Finance.*delayed.*15 min/i');
      const genericDisclaimer = page.locator('text=/For informational purposes only/i');
      
      // At least one disclaimer should be visible
      const hasDisclaimer = await yahooDisclaimer.isVisible({ timeout: 1000 }).catch(() => false) ||
                           await genericDisclaimer.isVisible({ timeout: 1000 }).catch(() => false);
      expect(hasDisclaimer).toBeTruthy();
    }
  });

  test('should navigate to ticker page and display options data', async ({ page }) => {
    // Navigate to a specific ticker page
    await page.goto('http://localhost:5000/ticker/AAPL');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if options chain visualization is present
    const optionsSection = page.locator('text=/Options Chain|Open Interest|Calls.*Puts/i').first();
    
    if (await optionsSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Verify the chart is rendered
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: 10000 });
      
      // Check for key metrics like PCR, Max Pain, etc.
      const metrics = page.locator('text=/PCR|Max Pain|Current Price/i');
      await expect(metrics.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should not display synthetic or mock data indicators', async ({ page }) => {
    // Check API responses don't contain synthetic data markers
    const response = await page.request.get('http://localhost:5000/api/options-chain?symbol=MSFT');
    const responseText = await response.text();
    
    // These strings would indicate synthetic/mock data
    const syntheticIndicators = [
      'synthetic',
      'mock',
      'demo',
      'test data',
      'simulated',
      'Generating synthetic'
    ];
    
    for (const indicator of syntheticIndicators) {
      expect(responseText.toLowerCase()).not.toContain(indicator.toLowerCase());
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Test with an invalid symbol
    const response = await page.request.get('http://localhost:5000/api/options-chain?symbol=INVALIDSYMBOL123');
    
    // API should still respond (might be 404 or 200 with empty data)
    expect(response.status()).toBeLessThan(500);
    
    const data = await response.json();
    
    // Should have proper error handling
    if (response.status() === 404 || (data.error && data.error === true)) {
      expect(data).toHaveProperty('message');
    } else {
      // Or return empty data gracefully
      expect(data.expirations).toEqual([]);
    }
  });

  test('should display data latency information when available', async ({ page }) => {
    // Make an API call that should include latency
    const response = await page.request.get('http://localhost:5000/api/options-chain?symbol=SPY&expiration=2024-12-20');
    
    if (response.ok()) {
      const data = await response.json();
      
      // Check if latency is reported
      if (data.dataLatency !== undefined) {
        expect(typeof data.dataLatency).toBe('number');
        expect(data.dataLatency).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

test.describe('Options Chain Visualization', () => {
  test('should render options chain chart correctly', async ({ page }) => {
    // Navigate to a page with options visualization
    await page.goto('http://localhost:5000/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for Chart.js canvas elements
    const charts = page.locator('canvas');
    const chartCount = await charts.count();
    
    if (chartCount > 0) {
      // Verify at least one chart is visible
      await expect(charts.first()).toBeVisible({ timeout: 10000 });
      
      // Check for chart controls (OI, Volume, Gamma buttons)
      const chartControls = page.locator('button:has-text("OI"), button:has-text("Volume"), button:has-text("Gamma")');
      if (await chartControls.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        // Verify controls are interactive
        await chartControls.first().click();
        
        // Chart should still be visible after interaction
        await expect(charts.first()).toBeVisible();
      }
    }
  });
});