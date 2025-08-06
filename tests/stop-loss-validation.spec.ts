import { test, expect } from '@playwright/test';

test.describe('Stop Loss Calculation Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Set up error monitoring
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
  });

  test('AMD scanner results should show valid stop loss values', async ({ page }) => {
    console.log('🔍 Testing AMD scanner stop loss calculations...');
    
    // Navigate to scanner page
    await page.goto('/scanner');
    await page.waitForLoadState('networkidle');
    
    // Select AMD from dropdown
    const tickerSelect = page.locator('[role="combobox"]').first();
    await tickerSelect.click();
    await page.waitForSelector('[role="option"]', { timeout: 10000 });
    await page.locator('[role="option"]', { hasText: 'AMD' }).click();
    
    // Run scanner
    console.log('Running scanner for AMD...');
    await page.locator('button', { hasText: 'Run Scanner' }).click();
    
    // Wait for scan completion
    await expect(page.locator('button', { hasText: 'Scanning...' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button', { hasText: 'Run Scanner' })).toBeVisible({ timeout: 120000 });
    
    // Take screenshot for debugging
    await page.screenshot({ 
      path: 'test-results/amd-scanner-results.png',
      fullPage: true 
    });
    
    // Look for result cards
    const resultCards = page.locator('[data-testid*="result-card"], .card:has-text("AMD"), [role="tabpanel"] .card');
    const cardCount = await resultCards.count();
    console.log(`Found ${cardCount} result cards`);
    
    if (cardCount > 0) {
      const card = resultCards.first();
      
      // Check for stop loss values in the card
      const stopLossElements = page.locator('text=/Stop.*Loss.*\\$[0-9]/i, text=/SL.*\\$[0-9]/i, text=/Stop.*\\$[0-9]/i');
      const stopLossCount = await stopLossElements.count();
      console.log(`Found ${stopLossCount} stop loss elements`);
      
      if (stopLossCount > 0) {
        for (let i = 0; i < stopLossCount; i++) {
          const element = stopLossElements.nth(i);
          const text = await element.textContent();
          console.log(`Stop loss text ${i + 1}: ${text}`);
          
          // Verify stop loss is not null, 0, or invalid
          expect(text).not.toContain('$0.00');
          expect(text).not.toContain('$0');
          expect(text).not.toContain('null');
          expect(text).not.toContain('undefined');
          expect(text).not.toContain('N/A');
          
          // Extract numeric value
          const match = text?.match(/\$([0-9,]+\.?[0-9]*)/);
          if (match) {
            const stopLossValue = parseFloat(match[1].replace(/,/g, ''));
            console.log(`Stop loss numeric value: ${stopLossValue}`);
            
            // Verify it's a reasonable number for AMD (typically $100-200 range)
            expect(stopLossValue).toBeGreaterThan(0);
            expect(stopLossValue).toBeLessThan(500);
            expect(stopLossValue).not.toBeNaN();
            expect(isFinite(stopLossValue)).toBe(true);
          }
        }
      }
      
      // Also check for target price and risk-reward ratio
      const targetPriceElements = page.locator('text=/Target.*\\$[0-9]/i, text=/TP.*\\$[0-9]/i');
      const targetCount = await targetPriceElements.count();
      console.log(`Found ${targetCount} target price elements`);
      
      if (targetCount > 0) {
        const targetText = await targetPriceElements.first().textContent();
        console.log(`Target price: ${targetText}`);
        expect(targetText).not.toContain('$0.00');
        expect(targetText).not.toContain('null');
        expect(targetText).not.toContain('N/A');
      }
      
      // Check risk-reward ratio
      const rrElements = page.locator('text=/R\\/R.*[0-9]/i, text=/Risk.*Reward.*[0-9]/i, text=/RR.*[0-9]/i');
      const rrCount = await rrElements.count();
      console.log(`Found ${rrCount} risk-reward elements`);
      
      if (rrCount > 0) {
        const rrText = await rrElements.first().textContent();
        console.log(`Risk-reward ratio: ${rrText}`);
        expect(rrText).not.toContain('1.0'); // Should not be default fallback
        expect(rrText).not.toContain('null');
        expect(rrText).not.toContain('N/A');
      }
    }
    
    console.log('✅ AMD scanner stop loss validation completed');
  });

  test('AMD analysis page should show valid stop loss calculations', async ({ page }) => {
    console.log('🔍 Testing AMD analysis page stop loss calculations...');
    
    // Navigate directly to AMD analysis page
    await page.goto('/ticker/AMD');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Wait for data to load
    
    // Take screenshot for debugging
    await page.screenshot({ 
      path: 'test-results/amd-analysis-page.png',
      fullPage: true 
    });
    
    // Check Trade Setup tab for stop loss values
    const tradeSetupTab = page.locator('[role="tab"]', { hasText: 'Trade Setup' });
    if (await tradeSetupTab.count() > 0) {
      await tradeSetupTab.click();
      await page.waitForTimeout(2000);
      
      // Look for stop loss in trade setup
      const stopLossElements = page.locator('text=/Stop.*Loss.*\\$[0-9]/i, text=/SL.*\\$[0-9]/i, text=/Stop.*\\$[0-9]/i');
      const stopLossCount = await stopLossElements.count();
      console.log(`Found ${stopLossCount} stop loss elements in Trade Setup`);
      
      if (stopLossCount > 0) {
        for (let i = 0; i < stopLossCount; i++) {
          const text = await stopLossElements.nth(i).textContent();
          console.log(`Stop loss in Trade Setup ${i + 1}: ${text}`);
          
          // Validate stop loss
          expect(text).not.toContain('$0.00');
          expect(text).not.toContain('null');
          expect(text).not.toContain('undefined');
          expect(text).not.toContain('N/A');
        }
      }
    }
    
    // Check Risk tab for stop loss calculations
    const riskTab = page.locator('[role="tab"]', { hasText: 'Risk' });
    if (await riskTab.count() > 0) {
      await riskTab.click();
      await page.waitForTimeout(2000);
      
      // Look for stop loss in risk analysis
      const riskStopLoss = page.locator('text=/Stop.*Loss.*\\$[0-9]/i, text=/SL.*\\$[0-9]/i');
      const riskStopCount = await riskStopLoss.count();
      console.log(`Found ${riskStopCount} stop loss elements in Risk tab`);
      
      if (riskStopCount > 0) {
        for (let i = 0; i < riskStopCount; i++) {
          const text = await riskStopLoss.nth(i).textContent();
          console.log(`Stop loss in Risk tab ${i + 1}: ${text}`);
          
          // Validate stop loss
          expect(text).not.toContain('$0.00');
          expect(text).not.toContain('null');
          expect(text).not.toContain('undefined');
          expect(text).not.toContain('N/A');
        }
      }
    }
    
    console.log('✅ AMD analysis page stop loss validation completed');
  });

  test('Test multiple tickers for stop loss calculations (TSLA, AAPL)', async ({ page }) => {
    console.log('🔍 Testing multiple tickers for stop loss calculations...');
    
    const tickers = ['TSLA', 'AAPL'];
    
    for (const ticker of tickers) {
      console.log(`Testing ${ticker}...`);
      
      // Navigate to scanner
      await page.goto('/scanner');
      await page.waitForLoadState('networkidle');
      
      // Select ticker
      const tickerSelect = page.locator('[role="combobox"]').first();
      await tickerSelect.click();
      await page.waitForSelector('[role="option"]', { timeout: 10000 });
      
      const tickerOption = page.locator('[role="option"]', { hasText: ticker });
      if (await tickerOption.count() > 0) {
        await tickerOption.click();
        
        // Run scanner
        console.log(`Running scanner for ${ticker}...`);
        await page.locator('button', { hasText: 'Run Scanner' }).click();
        
        // Wait for scan completion
        await expect(page.locator('button', { hasText: 'Scanning...' })).toBeVisible({ timeout: 5000 });
        await expect(page.locator('button', { hasText: 'Run Scanner' })).toBeVisible({ timeout: 120000 });
        
        // Check for stop loss values
        const stopLossElements = page.locator('text=/Stop.*Loss.*\\$[0-9]/i, text=/SL.*\\$[0-9]/i, text=/Stop.*\\$[0-9]/i');
        const stopLossCount = await stopLossElements.count();
        
        if (stopLossCount > 0) {
          const text = await stopLossElements.first().textContent();
          console.log(`${ticker} stop loss: ${text}`);
          
          // Basic validation
          expect(text).not.toContain('$0.00');
          expect(text).not.toContain('null');
          expect(text).not.toContain('N/A');
          
          // Extract and validate numeric value
          const match = text?.match(/\$([0-9,]+\.?[0-9]*)/);
          if (match) {
            const value = parseFloat(match[1].replace(/,/g, ''));
            expect(value).toBeGreaterThan(0);
            expect(value).not.toBeNaN();
            expect(isFinite(value)).toBe(true);
            console.log(`${ticker} stop loss value: $${value}`);
          }
        }
        
        // Also test the individual analysis page
        await page.goto(`/ticker/${ticker}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        // Check Trade Setup tab
        const tradeSetupTab = page.locator('[role="tab"]', { hasText: 'Trade Setup' });
        if (await tradeSetupTab.count() > 0) {
          await tradeSetupTab.click();
          await page.waitForTimeout(1000);
          
          const analysisStopLoss = page.locator('text=/Stop.*Loss.*\\$[0-9]/i');
          if (await analysisStopLoss.count() > 0) {
            const analysisText = await analysisStopLoss.first().textContent();
            console.log(`${ticker} analysis page stop loss: ${analysisText}`);
            
            expect(analysisText).not.toContain('$0.00');
            expect(analysisText).not.toContain('null');
            expect(analysisText).not.toContain('N/A');
          }
        }
      } else {
        console.log(`${ticker} not found in dropdown, skipping...`);
      }
    }
    
    console.log('✅ Multiple ticker stop loss validation completed');
  });

  test('API endpoints should return valid stop loss data', async ({ page }) => {
    console.log('🔍 Testing API endpoints for stop loss data...');
    
    const tickers = ['AMD', 'TSLA', 'AAPL'];
    
    for (const ticker of tickers) {
      console.log(`Testing ${ticker} API endpoints...`);
      
      // Test scanner API
      const scannerResponse = await page.request.get(`/api/scanner?symbol=${ticker}`);
      if (scannerResponse.ok()) {
        const scannerData = await scannerResponse.json();
        console.log(`${ticker} scanner API response structure:`, Object.keys(scannerData));
        
        // Check for stop loss in various possible locations
        if (scannerData.setup) {
          if (scannerData.setup.stopLoss !== undefined) {
            console.log(`${ticker} stop loss from API: ${scannerData.setup.stopLoss}`);
            expect(scannerData.setup.stopLoss).not.toBe(null);
            expect(scannerData.setup.stopLoss).not.toBe(0);
            expect(scannerData.setup.stopLoss).not.toBeNaN();
            expect(typeof scannerData.setup.stopLoss).toBe('number');
          }
          
          if (scannerData.setup.targetPrice !== undefined) {
            console.log(`${ticker} target price from API: ${scannerData.setup.targetPrice}`);
            expect(scannerData.setup.targetPrice).not.toBe(null);
            expect(scannerData.setup.targetPrice).not.toBe(0);
            expect(scannerData.setup.targetPrice).not.toBeNaN();
          }
          
          if (scannerData.setup.riskRewardRatio !== undefined) {
            console.log(`${ticker} R/R ratio from API: ${scannerData.setup.riskRewardRatio}`);
            expect(scannerData.setup.riskRewardRatio).not.toBe(null);
            expect(scannerData.setup.riskRewardRatio).not.toBe(1.0); // Should not be default fallback
            expect(scannerData.setup.riskRewardRatio).not.toBeNaN();
          }
        }
      }
      
      // Test risk-reward analysis API
      const riskResponse = await page.request.get(`/api/risk-reward-analysis?symbol=${ticker}`);
      if (riskResponse.ok()) {
        const riskData = await riskResponse.json();
        console.log(`${ticker} risk analysis API response keys:`, Object.keys(riskData));
        
        if (riskData.stopLoss !== undefined) {
          console.log(`${ticker} stop loss from risk API: ${riskData.stopLoss}`);
          expect(riskData.stopLoss).not.toBe(null);
          expect(riskData.stopLoss).not.toBe(0);
          expect(riskData.stopLoss).not.toBeNaN();
        }
      }
      
      // Test stop loss strategy API
      const stopLossResponse = await page.request.get(`/api/stop-loss-strategy?symbol=${ticker}`);
      if (stopLossResponse.ok()) {
        const stopLossData = await stopLossResponse.json();
        console.log(`${ticker} stop loss strategy API response:`, Object.keys(stopLossData));
        
        if (stopLossData.recommendedStopLoss !== undefined) {
          console.log(`${ticker} recommended stop loss: ${stopLossData.recommendedStopLoss}`);
          expect(stopLossData.recommendedStopLoss).not.toBe(null);
          expect(stopLossData.recommendedStopLoss).not.toBe(0);
          expect(stopLossData.recommendedStopLoss).not.toBeNaN();
        }
      }
    }
    
    console.log('✅ API endpoints stop loss validation completed');
  });

  test('Verify stop loss calculations are consistent between scanner and analysis pages', async ({ page }) => {
    console.log('🔍 Testing consistency between scanner and analysis pages...');
    
    // Step 1: Get stop loss from scanner
    await page.goto('/scanner');
    await page.waitForLoadState('networkidle');
    
    const tickerSelect = page.locator('[role="combobox"]').first();
    await tickerSelect.click();
    await page.waitForSelector('[role="option"]', { timeout: 10000 });
    await page.locator('[role="option"]', { hasText: 'AMD' }).click();
    await page.locator('button', { hasText: 'Run Scanner' }).click();
    
    // Wait for scan completion
    await expect(page.locator('button', { hasText: 'Run Scanner' })).toBeVisible({ timeout: 120000 });
    
    // Extract stop loss from scanner results
    const scannerStopLoss = page.locator('text=/Stop.*Loss.*\\$[0-9]/i, text=/SL.*\\$[0-9]/i').first();
    let scannerStopLossValue = null;
    
    if (await scannerStopLoss.count() > 0) {
      const scannerText = await scannerStopLoss.textContent();
      const match = scannerText?.match(/\$([0-9,]+\.?[0-9]*)/);
      if (match) {
        scannerStopLossValue = parseFloat(match[1].replace(/,/g, ''));
        console.log(`Scanner stop loss value: $${scannerStopLossValue}`);
      }
    }
    
    // Step 2: Get stop loss from analysis page
    await page.goto('/ticker/AMD');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const tradeSetupTab = page.locator('[role="tab"]', { hasText: 'Trade Setup' });
    if (await tradeSetupTab.count() > 0) {
      await tradeSetupTab.click();
      await page.waitForTimeout(1000);
    }
    
    const analysisStopLoss = page.locator('text=/Stop.*Loss.*\\$[0-9]/i, text=/SL.*\\$[0-9]/i').first();
    let analysisStopLossValue = null;
    
    if (await analysisStopLoss.count() > 0) {
      const analysisText = await analysisStopLoss.textContent();
      const match = analysisText?.match(/\$([0-9,]+\.?[0-9]*)/);
      if (match) {
        analysisStopLossValue = parseFloat(match[1].replace(/,/g, ''));
        console.log(`Analysis page stop loss value: $${analysisStopLossValue}`);
      }
    }
    
    // Step 3: Compare values
    if (scannerStopLossValue !== null && analysisStopLossValue !== null) {
      // Values should be the same or within a reasonable tolerance
      const tolerance = 0.50; // 50 cents tolerance for rounding differences
      const difference = Math.abs(scannerStopLossValue - analysisStopLossValue);
      
      console.log(`Stop loss difference between pages: $${difference}`);
      expect(difference).toBeLessThanOrEqual(tolerance);
      
      console.log('✅ Stop loss values are consistent between pages');
    } else {
      console.log('⚠️  Could not extract stop loss values from one or both pages');
      // At minimum, ensure both pages show some stop loss value
      expect(scannerStopLossValue !== null || analysisStopLossValue !== null).toBe(true);
    }
  });
});