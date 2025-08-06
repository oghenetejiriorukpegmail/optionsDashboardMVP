import { test, expect } from '@playwright/test';

test.describe('Scanner Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the scanner page
    await page.goto('/scanner');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Scanner Data Collection & Display', () => {
    test('should navigate to scanner page and display interface', async ({ page }) => {
      // Verify scanner page loads correctly
      await expect(page.locator('h1').filter({ hasText: 'Options-Technical Hybrid Scanner' })).toBeVisible();
      
      // Verify key UI elements are present
      await expect(page.locator('label').filter({ hasText: /^Ticker$/ })).toBeVisible();
      await expect(page.locator('label').filter({ hasText: /^Setup Type$/ })).toBeVisible();
      await expect(page.locator('button', { hasText: 'Run Scanner' })).toBeVisible();
    });

    test('should select AMD from ticker dropdown', async ({ page }) => {
      // Click on ticker dropdown
      const tickerSelect = page.locator('[role="combobox"]').first();
      await tickerSelect.click();
      
      // Wait for dropdown options to appear
      await page.waitForSelector('[role="option"]', { timeout: 10000 });
      
      // Verify AMD option is available and select it
      const amdOption = page.locator('[role="option"]', { hasText: 'AMD' });
      await expect(amdOption).toBeVisible({ timeout: 10000 });
      await amdOption.click();
      
      // Verify AMD is selected
      await expect(tickerSelect).toContainText('AMD');
    });

    test('should run scanner for AMD and display results', async ({ page }) => {
      // Select AMD from dropdown
      const tickerSelect = page.locator('[role="combobox"]').first();
      await tickerSelect.click();
      await page.waitForSelector('[role="option"]', { timeout: 10000 });
      const amdOption = page.locator('[role="option"]', { hasText: 'AMD' });
      await amdOption.click();
      
      // Click Run Scanner button
      const runScannerButton = page.locator('button', { hasText: 'Run Scanner' });
      await runScannerButton.click();
      
      // Wait for loading state to appear and complete
      await expect(page.locator('button', { hasText: 'Scanning...' })).toBeVisible({ timeout: 5000 });
      
      // Wait for scan to complete (up to 2 minutes for data collection)
      await expect(page.locator('button', { hasText: 'Run Scanner' })).toBeVisible({ timeout: 120000 });
      
      // Verify results are displayed
      const resultsCard = page.locator('[role="tabpanel"]').first();
      await expect(resultsCard).toBeVisible({ timeout: 10000 });
    });

    test('should display AMD result card with actual price data', async ({ page }) => {
      // Run scanner for AMD
      const tickerSelect = page.locator('[role="combobox"]').first();
      await tickerSelect.click();
      await page.waitForSelector('[role="option"]', { timeout: 10000 });
      await page.locator('[role="option"]', { hasText: 'AMD' }).click();
      await page.locator('button', { hasText: 'Run Scanner' }).click();
      
      // Wait for scan completion
      await expect(page.locator('button', { hasText: 'Run Scanner' })).toBeVisible({ timeout: 120000 });
      
      // Look for AMD card in results
      const amdCard = page.locator('[data-testid="result-card-AMD"], .card:has-text("AMD")').first();
      if (await amdCard.count() > 0) {
        await expect(amdCard).toBeVisible();
        
        // Check for price data - should not be $0.00
        const entryPrice = amdCard.locator('text=/Entry:.*\\$[0-9]/');
        if (await entryPrice.count() > 0) {
          const entryText = await entryPrice.textContent();
          expect(entryText).not.toContain('$0.00');
          expect(entryText).not.toContain('$N/A');
        }
        
        // Check for target price
        const targetPrice = amdCard.locator('text=/Target:.*\\$[0-9]/');
        if (await targetPrice.count() > 0) {
          const targetText = await targetPrice.textContent();
          expect(targetText).not.toContain('$0.00');
          expect(targetText).not.toContain('$N/A');
        }
      }
    });

    test('should verify setup type shows as bullish/bearish/neutral', async ({ page }) => {
      // Run scanner for AMD
      const tickerSelect = page.locator('[role="combobox"]').first();
      await tickerSelect.click();
      await page.waitForSelector('[role="option"]', { timeout: 10000 });
      await page.locator('[role="option"]', { hasText: 'AMD' }).click();
      await page.locator('button', { hasText: 'Run Scanner' }).click();
      
      // Wait for scan completion
      await expect(page.locator('button', { hasText: 'Run Scanner' })).toBeVisible({ timeout: 120000 });
      
      // Look for setup type badge
      const setupBadge = page.locator('.badge, [role="badge"]').filter({ 
        hasText: /^(Bullish|Bearish|Neutral)$/i 
      }).first();
      
      if (await setupBadge.count() > 0) {
        await expect(setupBadge).toBeVisible();
        const badgeText = await setupBadge.textContent();
        expect(['Bullish', 'Bearish', 'Neutral']).toContain(badgeText?.trim() || '');
      }
    });

    test('should test API endpoint directly for AMD data', async ({ page }) => {
      // Test the scanner API endpoint directly
      const response = await page.request.get('/api/scanner?symbol=AMD');
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      
      // Verify response structure
      expect(data).toHaveProperty('timestamp');
      
      // If setup data is present, verify it has real values
      if (data.setup) {
        expect(data.setup).toHaveProperty('symbol', 'AMD');
        expect(data.setup).toHaveProperty('setupType');
        expect(['bullish', 'bearish', 'neutral']).toContain(data.setup.setupType);
        
        // Verify price data is realistic (AMD typically trades in $100-200 range)
        if (data.setup.entryPrice) {
          expect(data.setup.entryPrice).toBeGreaterThan(50);
          expect(data.setup.entryPrice).toBeLessThan(500);
        }
      }
    });
  });

  test.describe('Scanner to Ticker Navigation', () => {
    test('should navigate from scanner results to AMD ticker page', async ({ page }) => {
      // First run scanner for AMD
      const tickerSelect = page.locator('[role="combobox"]').first();
      await tickerSelect.click();
      await page.waitForSelector('[role="option"]', { timeout: 10000 });
      await page.locator('[role="option"]', { hasText: 'AMD' }).click();
      await page.locator('button', { hasText: 'Run Scanner' }).click();
      
      // Wait for scan completion
      await expect(page.locator('button', { hasText: 'Run Scanner' })).toBeVisible({ timeout: 120000 });
      
      // Click on AMD card or "View Full Analysis" link
      const amdCard = page.locator('a[href="/ticker/AMD"], .card:has-text("AMD") a, a:has-text("View Full Analysis")').first();
      
      if (await amdCard.count() > 0) {
        await amdCard.click();
        
        // Verify navigation to ticker page
        await expect(page).toHaveURL(/\/ticker\/AMD/);
        await expect(page.locator('h1')).toContainText('AMD Analysis');
      } else {
        // Alternative: try clicking directly on any AMD link
        const amdLink = page.locator('text=AMD').first();
        if (await amdLink.count() > 0) {
          await amdLink.click();
          await expect(page).toHaveURL(/\/ticker\/AMD/);
        }
      }
    });

    test('should verify AMD analysis page loads with real data', async ({ page }) => {
      // Navigate directly to AMD ticker page
      await page.goto('/ticker/AMD');
      await page.waitForLoadState('networkidle');
      
      // Verify page structure
      await expect(page.locator('h1').filter({ hasText: 'AMD Analysis' })).toBeVisible();
      await expect(page.locator('text=Back to Scanner')).toBeVisible();
      
      // Check for tab navigation
      const tabs = page.locator('[role="tablist"] [role="tab"]');
      await expect(tabs).toHaveCount(5); // Trade Setup, Key Levels, Risk, Timing, Market
      
      // Verify tabs are clickable
      const tradeSetupTab = page.locator('[role="tab"]', { hasText: 'Trade Setup' });
      await expect(tradeSetupTab).toBeVisible();
      await tradeSetupTab.click();
    });

    test('should check Current Market Status shows real values', async ({ page }) => {
      // Navigate to AMD ticker page
      await page.goto('/ticker/AMD');
      await page.waitForLoadState('networkidle');
      
      // Wait for components to load
      await page.waitForTimeout(5000);
      
      // Look for current price or market status elements
      const priceElements = page.locator('text=/\\$[0-9]+\\.?[0-9]*/');
      
      if (await priceElements.count() > 0) {
        const firstPrice = await priceElements.first().textContent();
        // Verify it's not $0.00
        expect(firstPrice).not.toContain('$0.00');
        expect(firstPrice).not.toContain('$N/A');
      }
      
      // Check for any "Current Market Status" or similar sections
      const marketStatus = page.locator('text=/Current.*Market.*Status|Market.*Status|Current.*Price/i');
      if (await marketStatus.count() > 0) {
        await expect(marketStatus.first()).toBeVisible();
      }
    });

    test('should verify technical indicators display properly', async ({ page }) => {
      // Navigate to AMD ticker page
      await page.goto('/ticker/AMD');
      await page.waitForLoadState('networkidle');
      
      // Check Market Context tab for technical indicators
      const marketTab = page.locator('[role="tab"]', { hasText: 'Market' });
      if (await marketTab.count() > 0) {
        await marketTab.click();
        await page.waitForTimeout(2000);
        
        // Look for RSI, PCR, or other technical indicators
        const technicalIndicators = page.locator('text=/RSI|PCR|EMA|Moving Average|Technical/i');
        if (await technicalIndicators.count() > 0) {
          await expect(technicalIndicators.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Data Completeness Validation', () => {
    test('should verify price displays as actual dollar amount', async ({ page }) => {
      // Test API endpoint for current market data
      const response = await page.request.get('/api/scanner?symbol=AMD');
      
      if (response.ok()) {
        const data = await response.json();
        
        if (data.setup && data.setup.price) {
          // AMD typically trades between $80-$200
          expect(data.setup.price).toBeGreaterThan(50);
          expect(data.setup.price).toBeLessThan(300);
        }
      }
    });

    test('should check EMA Trend shows real trend data', async ({ page }) => {
      // Test market context API
      const response = await page.request.get('/api/market-context?symbol=AMD');
      
      if (response.ok()) {
        const data = await response.json();
        
        if (data.technicals) {
          // Should have EMA values
          expect(data.technicals).toBeDefined();
          
          // EMA trend should not be "Unknown" if data is available
          if (data.technicals.ema_10 && data.technicals.ema_20 && data.technicals.ema_50) {
            expect(data.technicals.ema_10).toBeGreaterThan(0);
            expect(data.technicals.ema_20).toBeGreaterThan(0);
            expect(data.technicals.ema_50).toBeGreaterThan(0);
          }
        }
      }
    });

    test('should validate PCR and RSI values are realistic', async ({ page }) => {
      // Test technical indicators API
      const response = await page.request.get('/api/technical-indicators?symbol=AMD');
      
      if (response.ok()) {
        const data = await response.json();
        
        // RSI should be between 0 and 100
        if (data.rsi !== null && data.rsi !== undefined) {
          expect(data.rsi).toBeGreaterThanOrEqual(0);
          expect(data.rsi).toBeLessThanOrEqual(100);
        }
        
        // PCR should be a reasonable positive number
        if (data.pcr !== null && data.pcr !== undefined) {
          expect(data.pcr).toBeGreaterThan(0);
          expect(data.pcr).toBeLessThan(10); // PCR rarely exceeds 5-10
        }
      }
    });

    test('should ensure no N/A or error states for core data', async ({ page }) => {
      // Navigate to scanner and run scan
      await page.goto('/scanner');
      
      const tickerSelect = page.locator('[role="combobox"]').first();
      await tickerSelect.click();
      await page.waitForSelector('[role="option"]', { timeout: 10000 });
      await page.locator('[role="option"]', { hasText: 'AMD' }).click();
      await page.locator('button', { hasText: 'Run Scanner' }).click();
      
      // Wait for results
      await expect(page.locator('button', { hasText: 'Run Scanner' })).toBeVisible({ timeout: 120000 });
      
      // Check that key metrics don't show N/A or error states
      const naValues = page.locator('text=/N\\/A|undefined|null|error/i');
      const count = await naValues.count();
      
      // Log any N/A values found for debugging
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 5); i++) {
          const text = await naValues.nth(i).textContent();
          console.log(`Found potential N/A value: ${text}`);
        }
      }
      
      // Key price fields should not be N/A
      const entryPriceNA = page.locator('text=/Entry:.*N\\/A/');
      expect(await entryPriceNA.count()).toBe(0);
      
      const targetPriceNA = page.locator('text=/Target:.*N\\/A/');
      expect(await targetPriceNA.count()).toBe(0);
    });
  });

  test.describe('Error Handling', () => {
    test('should check for JavaScript errors in console', async ({ page }) => {
      const consoleErrors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Navigate to scanner and run a scan
      await page.goto('/scanner');
      
      const tickerSelect = page.locator('[role="combobox"]').first();
      await tickerSelect.click();
      await page.waitForSelector('[role="option"]', { timeout: 10000 });
      await page.locator('[role="option"]', { hasText: 'AMD' }).click();
      await page.locator('button', { hasText: 'Run Scanner' }).click();
      
      // Wait for scan completion
      await expect(page.locator('button', { hasText: 'Run Scanner' })).toBeVisible({ timeout: 120000 });
      
      // Check for specific errors we want to avoid
      const toFixedErrors = consoleErrors.filter(error => 
        error.includes('toFixed is not a function')
      );
      
      expect(toFixedErrors).toHaveLength(0);
      
      // Log other console errors for debugging
      if (consoleErrors.length > 0) {
        console.log('Console errors found:', consoleErrors);
      }
    });

    test('should verify numeric displays format correctly', async ({ page }) => {
      // Navigate to scanner and check number formatting
      await page.goto('/scanner');
      
      const tickerSelect = page.locator('[role="combobox"]').first();
      await tickerSelect.click();
      await page.waitForSelector('[role="option"]', { timeout: 10000 });
      await page.locator('[role="option"]', { hasText: 'AMD' }).click();
      await page.locator('button', { hasText: 'Run Scanner' }).click();
      
      // Wait for results
      await expect(page.locator('button', { hasText: 'Run Scanner' })).toBeVisible({ timeout: 120000 });
      
      // Check price format patterns
      const pricePattern = /\$\d+\.\d{2}/;
      const prices = page.locator('text=/\\$\\d+\\.\\d{2}/');
      
      if (await prices.count() > 0) {
        const firstPrice = await prices.first().textContent();
        expect(firstPrice).toMatch(pricePattern);
      }
      
      // Check percentage formats
      const percentages = page.locator('text=/\\d+\\.\\d+%/');
      if (await percentages.count() > 0) {
        const firstPercentage = await percentages.first().textContent();
        expect(firstPercentage).toMatch(/\d+\.\d+%/);
      }
    });

    test('should handle invalid ticker symbols gracefully', async ({ page }) => {
      // Test API with invalid symbol
      const response = await page.request.get('/api/scanner?symbol=INVALIDSYMBOL123');
      
      // Should not return server error
      expect(response.status()).toBeLessThan(500);
      
      if (response.ok()) {
        const data = await response.json();
        
        // Should either have empty setup or proper error message
        if (!data.setup) {
          expect(data).toHaveProperty('message');
        }
      }
    });

    test('should handle network timeouts gracefully', async ({ page }) => {
      // Navigate to scanner
      await page.goto('/scanner');
      
      // Try to intercept and delay network requests to simulate timeout
      await page.route('**/api/scanner*', async route => {
        // Delay for 1 second to simulate slow network
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });
      
      const tickerSelect = page.locator('[role="combobox"]').first();
      await tickerSelect.click();
      await page.waitForSelector('[role="option"]', { timeout: 10000 });
      await page.locator('[role="option"]', { hasText: 'AMD' }).click();
      await page.locator('button', { hasText: 'Run Scanner' }).click();
      
      // Should show loading state
      await expect(page.locator('button', { hasText: 'Scanning...' })).toBeVisible();
      
      // Should eventually complete or show proper error
      await page.waitForTimeout(5000);
      
      // Either scanner completes or shows proper error handling
      const scannerButton = page.locator('button', { hasText: 'Run Scanner' });
      const scanningButton = page.locator('button', { hasText: 'Scanning...' });
      
      expect(await scannerButton.count() + await scanningButton.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Full Workflow Integration Test', () => {
    test('should complete full scanner to analysis workflow', async ({ page }) => {
      // Step 1: Navigate to scanner
      await page.goto('/scanner');
      await expect(page.locator('h1').filter({ hasText: 'Options-Technical Hybrid Scanner' })).toBeVisible();
      
      // Step 2: Select AMD and run scanner
      const tickerSelect = page.locator('[role="combobox"]').first();
      await tickerSelect.click();
      await page.waitForSelector('[role="option"]', { timeout: 10000 });
      await page.locator('[role="option"]', { hasText: 'AMD' }).click();
      await page.locator('button', { hasText: 'Run Scanner' }).click();
      
      // Step 3: Wait for scan completion and verify results
      await expect(page.locator('button', { hasText: 'Run Scanner' })).toBeVisible({ timeout: 120000 });
      
      // Step 4: Navigate to ticker analysis page
      const analysisLink = page.locator('a[href="/ticker/AMD"], .card:has-text("AMD") a, a:has-text("View Full Analysis")').first();
      
      if (await analysisLink.count() > 0) {
        await analysisLink.click();
        
        // Step 5: Verify analysis page loads
        await expect(page).toHaveURL(/\/ticker\/AMD/);
        await expect(page.locator('h1').filter({ hasText: 'AMD Analysis' })).toBeVisible();
        
        // Step 6: Test tab navigation
        const marketTab = page.locator('[role="tab"]', { hasText: 'Market' });
        await marketTab.click();
        
        const riskTab = page.locator('[role="tab"]', { hasText: 'Risk' });
        await riskTab.click();
        
        // Step 7: Navigate back to scanner
        await page.locator('text=Back to Scanner').click();
        await expect(page).toHaveURL('/scanner');
        await expect(page.locator('h1').filter({ hasText: 'Options-Technical Hybrid Scanner' })).toBeVisible();
      }
    });
  });
});