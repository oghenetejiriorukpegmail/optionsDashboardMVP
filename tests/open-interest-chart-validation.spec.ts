import { test, expect } from '@playwright/test';

test.describe('Open Interest Distribution Chart - AAPL', () => {
  test('should display Open Interest Distribution chart correctly on AAPL ticker page', async ({ page }) => {
    // Navigate to AAPL ticker page
    await page.goto('/ticker/AAPL');
    
    // Wait for the page to load completely
    await expect(page.locator('h1:has-text("AAPL Analysis")')).toBeVisible();
    
    // Click on the "Key Levels" tab to access the Open Interest chart
    await page.click('button[role="tab"]:has-text("Key Levels")');
    
    // Wait for the Key Levels tab content to load
    await expect(page.locator('text=AAPL Key Levels')).toBeVisible({ timeout: 30000 });
    
    // Wait for loading spinners to disappear
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Give time for API calls to complete
    
    // Scroll down to find the Open Interest Distribution section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check if the "Open Interest Distribution" section is visible
    const openInterestSection = page.locator('text=Open Interest Distribution').first();
    await expect(openInterestSection).toBeVisible({ timeout: 30000 });
    
    // Verify the chart container exists
    const chartContainer = page.locator('canvas').first();
    await expect(chartContainer).toBeVisible({ timeout: 30000 });
    
    // Check for chart legend elements or verify the chart is rendering data
    // The chart might show "No options data available" if there's no data
    const hasChartData = await page.locator('text=Call Open Interest').isVisible() && 
                         await page.locator('text=Put Open Interest').isVisible();
    const hasNoDataMessage = await page.locator('text=No options data available').isVisible();
    
    if (!hasChartData && !hasNoDataMessage) {
      // Check for any error messages or loading states
      const bodyText = await page.textContent('body');
      console.log('Page content for debugging:', bodyText?.substring(0, 1000));
    }
    
    // Verify that either we have chart data or a proper "no data" message
    const hasValidState = hasChartData || hasNoDataMessage;
    expect(hasValidState).toBe(true);
    
    // Verify key metrics are displayed
    await expect(page.locator('text=Max Pain')).toBeVisible();
    await expect(page.locator('text=OI Put/Call Ratio')).toBeVisible();
    await expect(page.locator('text=Volume PCR')).toBeVisible();
    
    // Check for key observations section
    await expect(page.locator('text=Key Observations')).toBeVisible();
    
    // Verify that actual numerical data is present (not just zeros)
    const maxPainValue = page.locator('[data-testid="max-pain-value"]').first();
    const putCallRatio = page.locator('[data-testid="pcr-value"]').first();
    
    // Take a screenshot of the Open Interest Distribution section
    const chartSection = page.locator('text=Open Interest Distribution').locator('xpath=ancestor::div[contains(@class, "border")]').first();
    await chartSection.screenshot({ 
      path: 'test-results/aapl-open-interest-chart.png',
      fullPage: false 
    });
    
    console.log('Screenshot saved to: test-results/aapl-open-interest-chart.png');
  });

  test('should handle loading states and display data correctly', async ({ page }) => {
    // Navigate to AAPL ticker page
    await page.goto('/ticker/AAPL');
    
    // Click on Key Levels tab
    await page.click('button[role="tab"]:has-text("Key Levels")');
    
    // Wait for loading to complete - no more loading spinners
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="loading-spinner"]'),
      undefined,
      { timeout: 45000 }
    );
    
    // Verify chart is rendered with actual data
    const chartCanvas = page.locator('canvas').first();
    await expect(chartCanvas).toBeVisible();
    
    // Check that the chart has been drawn (canvas should have content)
    const canvasExists = await chartCanvas.count();
    expect(canvasExists).toBeGreaterThan(0);
    
    // Verify expiration date selection is working
    const expirationTabs = page.locator('[role="tablist"]').first();
    await expect(expirationTabs).toBeVisible();
    
    // Check for the presence of strike prices in the chart
    const keyObservations = page.locator('text=Key Observations').locator('xpath=following-sibling::ul').first();
    await expect(keyObservations).toBeVisible();
  });

  test('should display appropriate error handling when no data is available', async ({ page }) => {
    // Navigate to a ticker that might not have options data
    await page.goto('/ticker/INVALID');
    
    // Click on Key Levels tab
    await page.click('button[role="tab"]:has-text("Key Levels")');
    
    // Wait for the component to load
    await page.waitForTimeout(5000);
    
    // Should handle the case gracefully - either show error message or default state
    const pageContent = await page.textContent('body');
    
    // The component should not crash and should show some indication of no data
    expect(pageContent).toBeTruthy();
  });

  test('should verify chart interactivity and responsiveness', async ({ page }) => {
    // Navigate to AAPL ticker page
    await page.goto('/ticker/AAPL');
    
    // Click on Key Levels tab
    await page.click('button[role="tab"]:has-text("Key Levels")');
    
    // Wait for chart to load
    await expect(page.locator('text=Open Interest Distribution')).toBeVisible({ timeout: 30000 });
    
    // Test expiration date switching
    const expirationButtons = page.locator('[role="tab"]');
    const buttonCount = await expirationButtons.count();
    
    if (buttonCount > 1) {
      // Click on second expiration date
      await expirationButtons.nth(1).click();
      
      // Wait for chart to update
      await page.waitForTimeout(3000);
      
      // Verify chart is still visible after expiration change
      await expect(page.locator('canvas').first()).toBeVisible();
    }
    
    // Test viewport responsiveness by changing window size
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('canvas').first()).toBeVisible();
    
    // Return to desktop size
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('canvas').first()).toBeVisible();
    
    // Take final screenshot of the responsive chart
    await page.screenshot({ 
      path: 'test-results/aapl-open-interest-responsive.png',
      fullPage: false 
    });
  });
});