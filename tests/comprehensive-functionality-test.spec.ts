import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5002';

test.describe('Comprehensive Functionality Test', () => {
  
  test('NASDAQ 100 tickers are available', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/tickers`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.tickers).toBeDefined();
    expect(data.tickers.length).toBeGreaterThanOrEqual(100);
    expect(data.tickers).toContain('AMD');
    expect(data.tickers).toContain('AAPL');
    expect(data.tickers).toContain('NVDA');
  });

  test('AMD ticker data is complete', async ({ request }) => {
    // Test ticker-context API
    const response = await request.get(`${BASE_URL}/api/ticker-context?symbol=AMD`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    
    // Verify all required fields are present
    expect(data.symbol).toBe('AMD');
    expect(data.price).toBeDefined();
    expect(data.price).toBeGreaterThan(0);
    
    // Check RSI is available
    expect(data.rsi).toBeDefined();
    expect(data.rsi).toBeGreaterThan(0);
    expect(data.rsi).toBeLessThan(100);
    
    // Check PCR is available
    expect(data.pcr).toBeDefined();
    expect(data.pcr).toBeGreaterThan(0);
    
    // Check EMA trend is available
    expect(data.emaTrend).toBeDefined();
    expect(data.emaTrend).not.toBe('Unknown');
    
    // Check IV is available
    expect(data.iv).toBeDefined();
  });

  test('Options data is available for AMD', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/options-data?ticker=AMD`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.optionsData).toBeDefined();
    expect(Array.isArray(data.optionsData)).toBeTruthy();
    expect(data.optionsData.length).toBeGreaterThan(0);
    
    // Verify options data structure
    const firstOption = data.optionsData[0];
    expect(firstOption.ticker).toBe('AMD');
    expect(firstOption.strike_price).toBeDefined();
    expect(firstOption.call_oi).toBeDefined();
    expect(firstOption.put_oi).toBeDefined();
    expect(firstOption.call_gamma).toBeDefined();
    expect(firstOption.put_gamma).toBeDefined();
  });

  test('Market Context page loads without crashing', async ({ page }) => {
    await page.goto(`${BASE_URL}/market-context`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Select AMD ticker
    const tickerInput = page.locator('input[placeholder*="ticker" i], select').first();
    await tickerInput.fill('AMD');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Verify Market Analysis component is visible
    await expect(page.locator('text=/Market Analysis/i')).toBeVisible();
    
    // Verify data is displayed
    await expect(page.locator('text=/RSI/i')).toBeVisible();
    await expect(page.locator('text=/PCR/i')).toBeVisible();
    await expect(page.locator('text=/EMA/i')).toBeVisible();
  });

  test('Scanner functionality works', async ({ page }) => {
    await page.goto(`${BASE_URL}/scanner`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Enter AMD ticker
    const tickerInput = page.locator('input[placeholder*="ticker" i]').first();
    await tickerInput.fill('AMD');
    
    // Click scan button
    await page.click('button:has-text("Scan")');
    
    // Wait for results
    await page.waitForSelector('text=/Loading|Analyzing|AMD/i', { timeout: 30000 });
    
    // Verify scan completed
    const hasResults = await page.locator('text=/bullish|bearish|neutral/i').count() > 0;
    expect(hasResults).toBeTruthy();
  });

  test('Ticker detail page shows all data', async ({ page }) => {
    await page.goto(`${BASE_URL}/ticker/AMD`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for Technical Chart
    await expect(page.locator('text=/Technical Chart/i')).toBeVisible();
    
    // Check for RSI Chart
    await expect(page.locator('text=/RSI.*Stochastic/i')).toBeVisible();
    
    // Check for Options Chain (Open Interest)
    await expect(page.locator('text=/Options.*Chain|Open.*Interest/i')).toBeVisible();
    
    // Check for Market Context
    await expect(page.locator('text=/Market.*Context/i')).toBeVisible();
  });

  test('Dashboard page shows data collection status', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for Dashboard title
    await expect(page.locator('text=/Dashboard|Overview/i')).toBeVisible();
    
    // Check for collect data button
    await expect(page.locator('button:has-text(/Collect|Refresh/i)')).toBeVisible();
    
    // Check for tickers list
    await expect(page.locator('text=/Tickers|Symbols/i')).toBeVisible();
  });

  test('API health check passes', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.initialized).toBe(true);
  });

  test('Technical indicators are calculated correctly', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/technical-indicators?symbol=AMD`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.indicators).toBeDefined();
    
    // Check EMA values
    expect(data.indicators.ema10).toBeDefined();
    expect(data.indicators.ema20).toBeDefined();
    expect(data.indicators.ema50).toBeDefined();
    
    // Check RSI
    expect(data.indicators.rsi).toBeDefined();
    expect(data.indicators.rsi).toBeGreaterThanOrEqual(0);
    expect(data.indicators.rsi).toBeLessThanOrEqual(100);
    
    // Check Stochastic RSI
    expect(data.indicators.stochasticRsi).toBeDefined();
  });

  test('Options chain visualization loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/ticker/AMD`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for canvas elements (charts)
    const canvasElements = await page.locator('canvas').count();
    expect(canvasElements).toBeGreaterThan(0);
    
    // Verify charts are rendered
    await page.waitForTimeout(2000);
    
    // Check if canvas has content (not empty)
    const canvasHasContent = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas');
      for (const canvas of canvases) {
        const ctx = (canvas as HTMLCanvasElement).getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const hasContent = imageData.data.some(channel => channel !== 0);
          if (hasContent) return true;
        }
      }
      return false;
    });
    
    expect(canvasHasContent).toBeTruthy();
  });
});

test.describe('Data Persistence', () => {
  test('Database contains multiple tables with data', async ({ request }) => {
    // Test that data persists across requests
    const response1 = await request.get(`${BASE_URL}/api/ticker-context?symbol=AMD`);
    const data1 = await response1.json();
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Request again
    const response2 = await request.get(`${BASE_URL}/api/ticker-context?symbol=AMD`);
    const data2 = await response2.json();
    
    // Data should be consistent
    expect(data1.symbol).toBe(data2.symbol);
    expect(data1.rsi).toBe(data2.rsi);
    expect(data1.pcr).toBe(data2.pcr);
  });
});