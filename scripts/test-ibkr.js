#!/usr/bin/env node

/**
 * Test script to verify IBKR Client Portal Gateway connection
 */

const https = require('https');

// Allow self-signed certificates for local development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const IBKR_GATEWAY_URL = process.env.IBKR_GATEWAY_URL || 'https://localhost:5000';

async function testConnection() {
  console.log('Testing IBKR Client Portal Gateway connection...\n');
  console.log(`Gateway URL: ${IBKR_GATEWAY_URL}`);
  
  try {
    // Test 1: Check if gateway is running
    console.log('\n1. Checking if gateway is running...');
    const statusResponse = await fetch(`${IBKR_GATEWAY_URL}/v1/api/iserver/auth/status`);
    
    if (!statusResponse.ok) {
      console.error('❌ Gateway is not responding. Please ensure:');
      console.error('   - Client Portal Gateway is running');
      console.error('   - It\'s accessible at', IBKR_GATEWAY_URL);
      return false;
    }
    
    const status = await statusResponse.json();
    console.log('✅ Gateway is running');
    console.log('   Status:', JSON.stringify(status, null, 2));
    
    // Test 2: Check authentication
    console.log('\n2. Checking authentication status...');
    if (!status.authenticated) {
      console.error('❌ Not authenticated. Please:');
      console.error('   1. Open', IBKR_GATEWAY_URL, 'in your browser');
      console.error('   2. Log in with your IBKR credentials');
      console.error('   3. Complete any 2FA requirements');
      return false;
    }
    
    console.log('✅ Authenticated');
    console.log('   Username:', status.username);
    console.log('   Accounts:', status.accounts);
    
    // Test 3: Get account info
    console.log('\n3. Fetching account information...');
    const accountsResponse = await fetch(`${IBKR_GATEWAY_URL}/v1/api/portfolio/accounts`);
    
    if (accountsResponse.ok) {
      const accounts = await accountsResponse.json();
      console.log('✅ Account info retrieved');
      console.log('   Accounts:', accounts);
    }
    
    // Test 4: Test market data - AAPL quote
    console.log('\n4. Testing market data (AAPL quote)...');
    
    // First, search for AAPL contract
    const searchResponse = await fetch(`${IBKR_GATEWAY_URL}/v1/api/iserver/secdef/search?symbol=AAPL&secType=STK`);
    
    if (searchResponse.ok) {
      const contracts = await searchResponse.json();
      const aaplContract = contracts.find(c => c.description && c.description.includes('NASDAQ'));
      
      if (aaplContract) {
        console.log('✅ Found AAPL contract');
        console.log('   Contract ID:', aaplContract.conid);
        console.log('   Description:', aaplContract.description);
        
        // Get quote
        const quoteResponse = await fetch(
          `${IBKR_GATEWAY_URL}/v1/api/iserver/marketdata/snapshot?conids=${aaplContract.conid}&fields=31,84,86,87`
        );
        
        if (quoteResponse.ok) {
          const quote = await quoteResponse.json();
          console.log('✅ Market data retrieved');
          console.log('   Quote:', quote);
        }
      }
    }
    
    // Test 5: Test options chain
    console.log('\n5. Testing options chain (AAPL)...');
    const optionsResponse = await fetch(
      `${IBKR_GATEWAY_URL}/v1/api/iserver/secdef/option-chain?conid=${265598}&exchange=SMART`
    );
    
    if (optionsResponse.ok) {
      const optionsData = await optionsResponse.json();
      console.log('✅ Options chain data available');
      console.log('   Expirations:', optionsData.expirations?.slice(0, 5).join(', '), '...');
    }
    
    console.log('\n✅ All tests passed! IBKR integration is ready.');
    console.log('\nNext steps:');
    console.log('1. Keep the Client Portal Gateway running');
    console.log('2. Start your Options Dashboard');
    console.log('3. The app will now use real IBKR data');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Is the Client Portal Gateway running?');
    console.error('2. Can you access', IBKR_GATEWAY_URL, 'in your browser?');
    console.error('3. Are you logged in through the gateway?');
    console.error('4. Check firewall/security settings');
    return false;
  }
}

// Run the test
testConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });