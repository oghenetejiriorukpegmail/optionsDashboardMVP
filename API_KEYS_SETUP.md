# API Keys Setup for Market Data

The application now uses multiple free market data APIs with a fallback strategy. Here's how to set them up:

## Required Environment Variables

Add these to your `.env` or `.env.local` file:

```bash
# Polygon.io (Primary API - Required)
POLYGON_API_KEY=your_polygon_key_here

# Alpha Vantage (Fallback - Optional but recommended)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here

# Twelve Data (Final fallback - Optional)
TWELVE_DATA_API_KEY=your_twelve_data_key_here
```

## Getting API Keys

### 1. Polygon.io (Primary)
- Sign up at: https://polygon.io/dashboard/signup
- Free tier: 5 API requests per minute
- Provides: Stock quotes and historical data
- **Best data quality and reliability**

### 2. Alpha Vantage (Fallback)
- Sign up at: https://www.alphavantage.co/support/#api-key
- Free tier: 5 API requests per minute, 500 requests per day
- Provides: Stock quotes and historical data

### 3. Twelve Data (Final Fallback)
- Sign up at: https://twelvedata.com/register
- Free tier: 8 API requests per minute, 800 requests per day
- Provides: Stock quotes and historical data

## Important Notes

1. **Options Data**: None of these free APIs provide options chain data. The application will continue to attempt Yahoo Finance for options data, but this may fail due to authentication requirements.

2. **Rate Limiting**: The application implements rate limiting to stay within free tier limits:
   - Alpha Vantage: 5 requests/minute
   - Twelve Data: 8 requests/minute
   - Polygon.io: 5 requests/minute

3. **Fallback Strategy**: The application attempts to fetch data in this order:
   1. Polygon.io (primary - if API key is configured)
   2. Alpha Vantage (fallback - if API key is configured)
   3. Twelve Data (final fallback - if API key is configured)
   4. Throws error if all fail

4. **Production Considerations**: For production use, consider upgrading to paid tiers for higher rate limits and more reliable data access.