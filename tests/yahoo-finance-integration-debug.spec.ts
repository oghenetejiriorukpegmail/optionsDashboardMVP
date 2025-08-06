import { test, expect } from '@playwright/test';

test.describe('Yahoo Finance Options Data Debug', () => {
  test('debug API response', async ({ page }) => {
    // Test the API endpoint directly
    const response = await page.request.get('http://localhost:4000/api/options-chain?symbol=AAPL');
    
    console.log('Response status:', response.status());
    console.log('Response headers:', response.headers());
    
    const responseText = await response.text();
    console.log('Response text (first 500 chars):', responseText.substring(0, 500));
    
    if (response.headers()['content-type']?.includes('application/json')) {
      try {
        const data = await response.json();
        console.log('Response JSON:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('Failed to parse JSON:', e);
      }
    }
  });
});