# Interactive Brokers Client Portal API Setup Guide

This guide will help you set up the IBKR Client Portal Gateway to provide real market data to your Options Dashboard.

## Prerequisites

- Active Interactive Brokers account (not IBKR Lite)
- Market data subscriptions for the instruments you want to trade
- Java 8 or higher installed on your system

## Step 1: Download Client Portal Gateway

1. Go to [IBKR Client Portal API](https://www.interactivebrokers.com/en/trading/ib-api.php)
2. Download the **Client Portal Gateway** for your operating system
3. Extract the ZIP file to a convenient location (e.g., `~/ibkr-gateway/`)

## Step 2: Configure the Gateway

1. Navigate to the extracted folder
2. Edit `conf.yaml` file to configure:
   ```yaml
   listenPort: 5000
   listenHost: 127.0.0.1
   sslCert: vertx.jks
   sslPwd: mywebapi
   ```

3. For production use, consider:
   - Changing the SSL certificate
   - Using a different port if 5000 conflicts
   - Setting up proper SSL certificates

## Step 3: Start the Gateway

### Mac/Linux:
```bash
cd ~/ibkr-gateway/
chmod +x bin/run.sh
bin/run.sh root/conf.yaml
```

### Windows:
```cmd
cd C:\ibkr-gateway\
bin\run.bat root\conf.yaml
```

## Step 4: Authenticate

1. Open your browser and go to: https://localhost:5000/
2. You'll see a certificate warning (this is normal for local development)
3. Click "Advanced" and "Proceed to localhost"
4. Log in with your IBKR credentials
5. Complete any two-factor authentication if enabled

## Step 5: Configure Environment Variables

Add these to your `.env` file:

```env
# IBKR Configuration
IBKR_GATEWAY_URL=https://localhost:5000
IBKR_ACCOUNT_ID=YOUR_ACCOUNT_ID  # Optional, will auto-detect

# Disable SSL verification for local development (not for production!)
NODE_TLS_REJECT_UNAUTHORIZED=0
```

## Step 6: Verify Connection

Run the test script:
```bash
npm run test:ibkr
```

This should show:
- ✓ Gateway is running
- ✓ Authentication successful
- ✓ Account connected
- ✓ Market data available

## Market Data Subscriptions

Ensure you have the following subscriptions in your IBKR account:

### Essential:
- **US Securities Snapshot** ($1.50/month) - For stocks
- **OPRA (US Options)** ($4.50/month) - For options chains

### Optional:
- **US Securities Snapshot and Futures Value Bundle** ($10/month) - Includes more data
- **NASDAQ TotalView** ($15/month) - Full depth of book

## Troubleshooting

### Gateway won't start
- Check Java is installed: `java -version`
- Check port 5000 is not in use
- Try a different port in conf.yaml

### Can't authenticate
- Ensure you're using a regular IBKR account (not Lite)
- Check your credentials
- Try clearing browser cookies for localhost:5000

### No market data
- Verify your market data subscriptions in Account Management
- Ensure you have trading permissions for the instruments
- Check if markets are open

### SSL Certificate errors
- For development, set `NODE_TLS_REJECT_UNAUTHORIZED=0`
- For production, use proper certificates

## Security Notes

1. **Never expose the gateway to the internet** - It should only run locally
2. **Use strong passwords** and enable 2FA on your IBKR account
3. **For production**, set up proper SSL certificates
4. **Monitor API usage** to stay within limits

## API Limits

- Default: 50 requests/second
- Market data lines: 100 concurrent (expandable)
- No limit on historical data requests
- Options chains count as multiple lines

## Next Steps

Once the gateway is running and authenticated:
1. The Options Dashboard will automatically use IBKR data
2. All synthetic data will be replaced with real market data
3. You'll see live quotes, real options chains, and actual Greeks

## Support

- IBKR API Documentation: https://www.interactivebrokers.com/api-doc/
- IBKR API Forum: https://www.interactivebrokers.com/en/index.php?f=5314
- Client Portal API Guide: https://www.interactivebrokers.com/api-doc/