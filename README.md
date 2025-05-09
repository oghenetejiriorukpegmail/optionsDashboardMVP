# Options-Technical Hybrid Scanner

A trading tool that combines options data and technical analysis to identify trading opportunities in volatile stocks. This application implements the "Options-Technical Hybrid Strategy" framework, which analyzes market context, maps key price levels using options chain metrics, and generates bullish, bearish, or neutral trade setups.

## Features

- **Market Context Analysis**: Evaluate trends, sentiment, and momentum
- **Key Levels Mapping**: Identify support/resistance using options chain data
- **Trade Setup Rules**: Define conditions for bullish, bearish, or neutral setups
- **Confirmation & Timing**: Find precise entry and exit points
- **Risk Management**: Position sizing and stop loss placement
- **Scanner**: Find trading opportunities across multiple stocks

## Technical Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Chart.js
- **Data Storage**: SQLite database
- **Data Fetching**: Yahoo Finance API (free tier)
- **Technical Analysis**: TA-Lib for calculating indicators

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/trading-app-options.git
cd trading-app-options
```

2. Install dependencies:
```bash
npm install
```

3. Initialize the database:
```bash
node scripts/init-db.js
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

## Data Collection

The application collects data from Yahoo Finance API:

- Stock quotes are fetched every 10 seconds
- Historical data is fetched once per day
- Options data is fetched every 15 minutes
- Daily summaries are generated once per day

All data is stored in a SQLite database for efficient retrieval and analysis.

## How It Works

### Data Collection Process

1. When the application starts, it automatically begins collecting data for the default tickers (TSLA, AAPL, AMZN, etc.)
2. For each ticker, it collects:
   - Current price data (OHLC, volume)
   - Historical data for calculating technical indicators
   - Options chain data for sentiment analysis and key levels

### Analysis Process

The scanner implements the Options-Technical Hybrid Strategy framework as follows:

1. **Market Context Analysis**:
   - Trend identification using EMAs (10, 20, 50 day)
   - Sentiment analysis using PCR with IV-adjusted thresholds
   - Momentum assessment with RSI (14) and Stochastic RSI

2. **Key Levels Mapping**:
   - Identify support/resistance from options OI and gamma
   - Calculate Max Pain points
   - Analyze GEX (Gamma Exposure) for market direction

3. **Trade Setup Rules**:
   - Bullish setups: EMA alignment (10>20>50), PCR thresholds, RSI 55-80, etc.
   - Bearish setups: EMA alignment (10<20<50), PCR thresholds, RSI 20-45, etc.
   - Neutral setups: Flat EMAs, PCR 0.8-1.2, RSI 45-65, etc.

4. **Risk Management**:
   - Stop loss placement at key technical levels
   - Position sizing based on account risk parameters
   - Risk-reward ratio calculation

## Customization

### Adding New Tickers

To add more tickers for tracking:

1. Go to `lib/services/dataCollector.ts`
2. Add tickers to the `DEFAULT_TICKERS` array
3. Restart the application

### Adjusting Scanning Parameters

To modify the scanning parameters:

1. Edit the trade setup rules in `lib/services/strategyAnalyzer.ts`
2. Adjust thresholds for bullish, bearish, or neutral setups

## Production Deployment

For production deployment:

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
