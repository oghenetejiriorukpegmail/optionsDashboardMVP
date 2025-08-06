#!/usr/bin/env node

// Test MarketData.app integration and populate database
require('dotenv').config();
const axios = require('axios');

async function testIntegration() {
  const baseUrl = 'http://localhost:5002';
  
  console.log('Testing MarketData.app integration...\n');
  
  try {
    // 1. Check if server is running
    console.log('1. Checking server health...');
    try {
      const health = await axios.get(`${baseUrl}/api/health`);
      console.log('✓ Server is running:', health.data);
    } catch (error) {
      console.error('✗ Server not responding. Please start the server with: npm run dev');
      return;
    }
    
    // 2. Initialize database
    console.log('\n2. Initializing database...');
    const init = await axios.get(`${baseUrl}/api/init`);
    console.log('✓ Database initialized:', init.data.message);
    
    // 3. Collect data for a single stock
    console.log('\n3. Collecting data for AAPL...');
    const collectResponse = await axios.post(`${baseUrl}/api/collect-data`, {
      ticker: 'AAPL'
    });
    console.log('✓ Data collection triggered:', collectResponse.data);
    
    // Wait a bit for data to be collected
    console.log('\n4. Waiting 5 seconds for data collection...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 5. Check scanner results
    console.log('\n5. Checking scanner results...');
    const scannerResponse = await axios.get(`${baseUrl}/api/scanner?limit=5`);
    console.log('✓ Scanner results:', JSON.stringify(scannerResponse.data, null, 2));
    
    // 6. Test options chain
    console.log('\n6. Testing options chain for AAPL...');
    const optionsResponse = await axios.get(`${baseUrl}/api/options-chain?symbol=AAPL`);
    console.log('✓ Options expirations:', JSON.stringify(optionsResponse.data, null, 2));
    
    console.log('\n✓ All tests passed! MarketData.app integration is working.');
    
  } catch (error) {
    console.error('\n✗ Error:', error.response?.data || error.message);
    if (error.response?.status === 500) {
      console.error('Server error - check the terminal running npm run dev for details');
    }
  }
}

// Run the test
testIntegration();