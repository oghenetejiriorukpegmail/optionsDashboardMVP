import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5002';

test.describe('Docker Deployment Validation', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check for main navigation elements
    await expect(page).toHaveTitle(/Options Dashboard/i);
    await expect(page.locator('text=Scanner')).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should access health endpoint', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.initialized).toBe(true);
  });

  test('should load scanner page', async ({ page }) => {
    await page.goto(`${BASE_URL}/scanner`);
    
    // Check for scanner elements
    await expect(page.locator('h1:has-text("Options Scanner")')).toBeVisible();
    await expect(page.locator('button:has-text("Scan")')).toBeVisible();
    
    // Check filters are present
    await expect(page.locator('text=Options Analytics')).toBeVisible();
    await expect(page.locator('text=Technical Signals')).toBeVisible();
  });

  test('should perform a scan operation', async ({ page }) => {
    await page.goto(`${BASE_URL}/scanner`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Enter a ticker
    await page.fill('input[placeholder*="ticker" i], input[placeholder*="symbol" i]', 'AAPL');
    
    // Click scan button
    await page.click('button:has-text("Scan")');
    
    // Wait for results or "No results" message
    await page.waitForSelector('text=/Loading|Analyzing|No results|AAPL/i', { timeout: 30000 });
    
    // Verify the scan completed (either with results or no results)
    const hasResults = await page.locator('text=/bullish|bearish|neutral/i').count() > 0;
    const hasNoResults = await page.locator('text=/no results/i').count() > 0;
    
    expect(hasResults || hasNoResults).toBeTruthy();
  });

  test('should load market context page', async ({ page }) => {
    await page.goto(`${BASE_URL}/market-context`);
    
    // Check for market context elements
    await expect(page.locator('text=/Market Context/i')).toBeVisible();
    
    // Check for ticker selector
    const tickerSelector = page.locator('input[placeholder*="ticker" i], select, input[placeholder*="symbol" i]');
    await expect(tickerSelector).toBeVisible();
  });

  test('should access API endpoints', async ({ request }) => {
    // Test multiple API endpoints
    const endpoints = [
      '/api/status',
      '/api/tickers',
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(`${BASE_URL}${endpoint}`);
      expect(response.ok()).toBeTruthy();
      
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
    }
  });

  test('should load dashboard page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Check for dashboard elements
    await expect(page.locator('text=/Dashboard|Overview/i')).toBeVisible();
    
    // Check for data collection button
    await expect(page.locator('button:has-text(/Collect|Refresh/i)')).toBeVisible();
  });

  test('should have responsive navigation', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Test navigation links
    const navLinks = [
      { text: 'Scanner', url: '/scanner' },
      { text: 'Dashboard', url: '/dashboard' },
      { text: 'Market Context', url: '/market-context' },
    ];

    for (const link of navLinks) {
      const navElement = page.locator(`a:has-text("${link.text}")`).first();
      if (await navElement.isVisible()) {
        await navElement.click();
        await expect(page).toHaveURL(new RegExp(link.url));
        await page.goBack();
      }
    }
  });

  test('should handle database operations', async ({ page, request }) => {
    // Test that database is initialized
    const healthResponse = await request.get(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    expect(healthData.initialized).toBe(true);
    
    // Test watchlist API (database operation)
    const watchlistResponse = await request.get(`${BASE_URL}/api/watchlist`);
    expect(watchlistResponse.ok()).toBeTruthy();
    
    const watchlistData = await watchlistResponse.json();
    expect(Array.isArray(watchlistData)).toBeTruthy();
  });

  test('should display correct port in use', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Verify we're on the correct port (5002)
    const url = page.url();
    expect(url).toContain(':5002');
  });
});

test.describe('Docker Container Health Checks', () => {
  test('should verify container is healthy', async ({ request }) => {
    // Multiple health check attempts
    for (let i = 0; i < 3; i++) {
      const response = await request.get(`${BASE_URL}/api/health`);
      expect(response.status()).toBe(200);
      
      // Small delay between checks
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  });

  test('should handle concurrent requests', async ({ request }) => {
    // Send multiple concurrent requests
    const promises = Array(5).fill(null).map(() => 
      request.get(`${BASE_URL}/api/health`)
    );
    
    const responses = await Promise.all(promises);
    
    // All should succeed
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy();
    });
  });
});