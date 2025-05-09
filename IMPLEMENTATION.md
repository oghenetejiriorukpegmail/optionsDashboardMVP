# Options-Technical Hybrid Scanner Implementation

This document outlines the implementation details of the Options-Technical Hybrid Scanner, built according to the PRD specifications.

## Architecture Overview

The application architecture follows a typical Next.js pattern with a few custom components:

1. **Database Layer**
   - SQLite database for persistent storage
   - Repository pattern for data access

2. **Data Collection Services**
   - Yahoo Finance API integration
   - Recurring data collection jobs
   - Technical indicator calculations

3. **Analysis Engine**
   - Implementation of the Options-Technical Hybrid Strategy
   - Trade setup identification based on PRD criteria

4. **API Routes**
   - REST endpoints for frontend data access
   - Scanner, watchlist, and market data endpoints

5. **Frontend Components**
   - React components for visualizations and user interaction
   - Tailwind CSS for styling

## Key Components

### Database Schema

The SQLite database includes these main tables:

- **stock_data**: Store price data (OHLC, volume)
- **technical_indicators**: EMAs, RSI, Stochastic RSI
- **options_data**: Options chain metrics (OI, volume, Greeks)
- **market_sentiment**: PCR, IV percentile, Max Pain, GEX
- **trade_setups**: Identified setup opportunities
- **daily_summaries**: Consolidated daily metrics
- **watchlist**: User-saved tickers to monitor

### Data Collection

For each ticker, the application collects:

1. **Stock Price Data**
   - Current price every 10 seconds
   - Historical prices daily for calculating technical indicators

2. **Options Data**
   - Options chain every 15 minutes
   - Open interest, volume, implied volatility, and Greeks

3. **Derived Metrics**
   - Technical indicators (EMAs, RSI, etc.)
   - Options-based metrics (PCR, GEX, etc.)
   - Daily consolidated summaries

### Analysis Engine Implementation

The strategy analyzer implements the five core modules from the PRD:

1. **Market Context Analysis**
   - EMA trend identification (10 > 20 > 50 for bullish, etc.)
   - PCR thresholds with IV adjustments (PCR < 0.7 for low IV, etc.)
   - RSI and Stochastic RSI for momentum

2. **Key Levels Mapping**
   - Options chain analysis for support/resistance
   - Max Pain calculation
   - Gamma concentration for pinning zones

3. **Trade Setup Rules**
   - Bullish conditions: EMA alignment, PCR thresholds, RSI range, etc.
   - Bearish conditions: Inverse EMA alignment, high PCR, lower RSI range
   - Neutral conditions: Flat EMAs, mid-range PCR, mid-range RSI

4. **Confirmation and Timing**
   - Entry triggers: Stochastic RSI hooks, volume spikes
   - Exit triggers: RSI extremes, price reaching key levels

5. **Risk Management**
   - Stop loss placement at key support/resistance
   - Position sizing based on account risk and volatility
   - Risk-reward ratio calculation

### API Routes

Main API endpoints:

- **/api/scanner**: Runs analysis to find trade setups
- **/api/market-context**: Gets current market context for a ticker
- **/api/options-data**: Returns options chain with metrics
- **/api/historical-data**: Provides historical prices and indicators
- **/api/watchlist**: Manages user watchlist

### User Interface Components

Major UI components:

- **Scanner Dashboard**: Shows potential trade setups
- **Market Context View**: Displays trend, sentiment, momentum
- **Key Levels Visualization**: Options OI and gamma distribution
- **Trade Setup Cards**: Visual representation of setups

## Data Flow

1. **Data Collection**:
   ```
   Yahoo Finance API → Data Collection Services → SQLite Database
   ```

2. **Analysis**:
   ```
   Database → Strategy Analyzer → Trade Setups → Database
   ```

3. **Frontend Display**:
   ```
   Database → API Routes → React Components → User Interface
   ```

## Implementation Choices

### Using SQLite

SQLite was chosen for:
- Simplicity: No separate database server required
- Performance: Fast for the scale of data required
- Portability: Self-contained in a single file

### Data Collection Frequency

- Stock price: Every 10 seconds to catch intraday moves
- Options data: Every 15 minutes due to slower changes in options metrics
- Historical data: Daily for technical indicators

### Strategy Analyzer Scoring

The analyzer uses a weighted scoring system:
- EMA trend: 30 points
- PCR thresholds: 20 points
- RSI conditions: 15 points
- Stochastic RSI: 15 points
- GEX direction: 10 points
- Price near support/resistance: 5 points
- OI/gamma confirmation: 5 points

A setup needs at least 70 points to be considered valid (75 for neutral setups).

## Potential Enhancements

Future improvements could include:

1. **Alternative Data Sources**
   - Add support for other data providers beyond Yahoo Finance
   - Incorporate economic calendar and news sentiment

2. **Advanced Options Metrics**
   - Add charm, vanna, volga calculations
   - Include DIX and GEX from external providers

3. **Performance Optimizations**
   - Implement caching for frequently accessed data
   - Use WebSockets for live price updates

4. **Backtesting Module**
   - Add capability to test strategy against historical data
   - Generate performance metrics and optimization suggestions

5. **Multi-Timeframe Analysis**
   - Add support for different timeframes (intraday, weekly)
   - Improve support for different option expiration cycles
