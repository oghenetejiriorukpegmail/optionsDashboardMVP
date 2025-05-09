import { nasdaq100Tickers } from './nasdaq100';

// Generate random number within a range
const randomInRange = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

// Generate random integer within a range
const randomIntInRange = (min: number, max: number) => {
  return Math.floor(randomInRange(min, max));
};

// Generate a random EMA trend
const generateEmaTrend = () => {
  const trends = [
    '10 > 20 > 50', 
    '10 < 20 < 50', 
    '10 > 20 < 50', 
    '10 < 20 > 50',
    'Flat'
  ];
  return trends[randomIntInRange(0, trends.length)];
};

// Generate a random setup type based on EMA trend
const getSetupTypeFromTrend = (emaTrend: string) => {
  if (emaTrend === '10 > 20 > 50') {
    return Math.random() > 0.2 ? 'bullish' : 'neutral';
  } else if (emaTrend === '10 < 20 < 50') {
    return Math.random() > 0.2 ? 'bearish' : 'neutral';
  } else {
    return 'neutral';
  }
};

// Generate a random setup strength
const generateSetupStrength = (setupType: string) => {
  if (setupType === 'neutral') return 'medium';
  
  const strengths = ['high', 'medium', 'low'];
  const weights = setupType === 'neutral' 
    ? [0.1, 0.7, 0.2] 
    : [0.4, 0.4, 0.2];
  
  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (let i = 0; i < strengths.length; i++) {
    cumulativeWeight += weights[i];
    if (random <= cumulativeWeight) {
      return strengths[i];
    }
  }
  
  return 'medium';
};

// Generate random RSI based on setup type
const generateRSI = (setupType: string) => {
  if (setupType === 'bullish') {
    return randomInRange(55, 80);
  } else if (setupType === 'bearish') {
    return randomInRange(20, 45);
  } else {
    return randomInRange(45, 55);
  }
};

// Generate random PCR based on setup type
const generatePCR = (setupType: string) => {
  if (setupType === 'bullish') {
    return randomInRange(0.5, 0.8);
  } else if (setupType === 'bearish') {
    return randomInRange(1.2, 1.5);
  } else {
    return randomInRange(0.8, 1.2);
  }
};

// Generate random support and resistance levels based on price
const generateKeyLevels = (price: number) => {
  // Generate 2 support levels below price
  const support = [
    Math.floor(price * (1 - randomInRange(0.02, 0.05))) / 1,
    Math.floor(price * (1 - randomInRange(0.005, 0.015))) / 1
  ];
  
  // Generate 2 resistance levels above price
  const resistance = [
    Math.ceil(price * (1 + randomInRange(0.005, 0.015))) / 1,
    Math.ceil(price * (1 + randomInRange(0.02, 0.05))) / 1
  ];
  
  // Generate max pain near price
  const maxPain = Math.round(price * (1 + randomInRange(-0.01, 0.01)));
  
  return {
    support,
    resistance,
    maxPain
  };
};

// Generate random stochastic RSI based on RSI
const generateStochasticRSI = (rsi: number) => {
  if (rsi > 70) {
    return randomInRange(75, 95);
  } else if (rsi < 30) {
    return randomInRange(5, 25);
  } else {
    return randomInRange(rsi - 10, rsi + 10);
  }
};

// Generate random volume data
const generateVolumeData = (setupType: string) => {
  const baseVolume = randomIntInRange(500000, 20000000);
  let percentChange;
  
  if (setupType === 'bullish') {
    percentChange = randomInRange(5, 30);
  } else if (setupType === 'bearish') {
    percentChange = randomInRange(-30, 10); // Can be negative or positive
  } else {
    percentChange = randomInRange(-10, 10);
  }
  
  return {
    current: baseVolume,
    percentChange
  };
};

// Generate random IV
const generateIV = () => {
  return randomInRange(20, 80);
};

// Generate random GEX based on setup type
const generateGEX = (setupType: string) => {
  if (setupType === 'bullish') {
    return randomInRange(200000000, 1000000000);
  } else if (setupType === 'bearish') {
    return randomInRange(-1000000000, -200000000);
  } else {
    return randomInRange(-200000000, 200000000);
  }
};

// Generate random recommendation based on setup type
const generateRecommendation = (price: number, setupType: string, keyLevels: any) => {
  if (setupType === 'bullish') {
    return {
      action: 'Buy calls',
      target: keyLevels.resistance[1],
      stop: keyLevels.support[0],
      expiration: '2025-05-30',
      strike: keyLevels.resistance[0]
    };
  } else if (setupType === 'bearish') {
    return {
      action: 'Buy puts',
      target: keyLevels.support[0],
      stop: keyLevels.resistance[1],
      expiration: '2025-05-30',
      strike: keyLevels.support[1]
    };
  } else {
    return {
      action: 'Sell iron condor',
      target: '50% premium',
      stop: 'Price breaks ' + keyLevels.resistance[0] + '/' + keyLevels.support[0],
      expiration: '2025-05-30',
      strike: price
    };
  }
};

// Generate random options chain data
const generateOptionsChain = (price: number) => {
  const baseStrike = Math.round(price / 10) * 10; // Round to nearest 10
  const strikes = [];
  
  for (let i = -2; i <= 2; i++) {
    const strike = baseStrike + (i * 10);
    
    // Make strikes closer to current price have higher OI/volume
    const distanceFactor = 1 - (Math.abs(i) * 0.2);
    
    strikes.push({
      strike,
      call: {
        oi: Math.round(randomInRange(5000, 15000) * distanceFactor),
        volume: Math.round(randomInRange(800, 3500) * distanceFactor),
        iv: randomInRange(40, 50),
        gamma: randomInRange(0.02, 0.05),
        charm: randomInRange(0.01, 0.02),
        vanna: randomInRange(0.25, 0.45),
        vomma: randomInRange(0.1, 0.15)
      },
      put: {
        oi: Math.round(randomInRange(5000, 15000) * distanceFactor),
        volume: Math.round(randomInRange(800, 3500) * distanceFactor),
        iv: randomInRange(40, 50),
        gamma: randomInRange(0.02, 0.05),
        charm: randomInRange(-0.02, -0.01),
        vanna: randomInRange(-0.45, -0.25),
        vomma: randomInRange(0.1, 0.15)
      }
    });
  }
  
  return strikes;
};

// Generate historical price data
const generateHistoricalData = (price: number, setupType: string) => {
  const data = [];
  let currentPrice = price;
  
  // Generate trend for the past 10 days
  for (let i = 0; i < 10; i++) {
    let dailyChange;
    
    if (setupType === 'bullish') {
      dailyChange = randomInRange(-0.5, 1.5); // Mostly rising
    } else if (setupType === 'bearish') {
      dailyChange = randomInRange(-1.5, 0.5); // Mostly falling
    } else {
      dailyChange = randomInRange(-0.75, 0.75); // Sideways
    }
    
    // Going backwards in time
    currentPrice = currentPrice - dailyChange;
    
    // Calculate EMAs (simplified)
    const ema10 = currentPrice * (1 + randomInRange(-0.01, 0.01));
    let ema20, ema50;
    
    if (setupType === 'bullish') {
      ema20 = ema10 * (1 - randomInRange(0.005, 0.015));
      ema50 = ema20 * (1 - randomInRange(0.005, 0.015));
    } else if (setupType === 'bearish') {
      ema20 = ema10 * (1 + randomInRange(0.005, 0.015));
      ema50 = ema20 * (1 + randomInRange(0.005, 0.015));
    } else {
      ema20 = ema10 * (1 + randomInRange(-0.005, 0.005));
      ema50 = ema20 * (1 + randomInRange(-0.005, 0.005));
    }
    
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      close: currentPrice,
      ema10,
      ema20,
      ema50,
      volume: randomIntInRange(5000000, 15000000),
      rsi: generateRSI(setupType)
    });
  }
  
  // Return in chronological order
  return data.reverse();
};

// Generate complete stock data
export const generateStockData = (symbol: string) => {
  // Generate a random price between $10 and $1000
  const price = Math.round(randomInRange(10, 1000) * 100) / 100;
  
  // Generate EMA trend
  const emaTrend = generateEmaTrend();
  
  // Determine setup type based on EMA trend
  const setupType = getSetupTypeFromTrend(emaTrend);
  
  // Generate setup strength
  const setupStrength = generateSetupStrength(setupType);
  
  // Generate RSI and Stochastic RSI
  const rsi = generateRSI(setupType);
  const stochasticRsi = generateStochasticRSI(rsi);
  
  // Generate PCR
  const pcr = generatePCR(setupType);
  
  // Generate volume data
  const volume = generateVolumeData(setupType);
  
  // Generate IV
  const iv = generateIV();
  
  // Generate GEX
  const gex = generateGEX(setupType);
  
  // Generate key levels
  const keyLevels = generateKeyLevels(price);
  
  // Generate recommendation
  const recommendation = generateRecommendation(price, setupType, keyLevels);
  
  // Generate options chain
  const optionsChain = generateOptionsChain(price);
  
  // Generate historical data
  const historicalData = generateHistoricalData(price, setupType);
  
  return {
    symbol,
    price,
    setupType,
    setupStrength,
    emaTrend,
    pcr,
    rsi,
    stochasticRsi,
    volume,
    iv,
    gex,
    keyLevels,
    recommendation,
    optionsChain,
    historicalData
  };
};

// Generate scanner results for all NASDAQ 100 stocks
export const generateNasdaq100ScannerResults = () => {
  // Generate individual stock data for each ticker
  const stockData = nasdaq100Tickers.map(ticker => generateStockData(ticker));
  
  // Count setups by type
  const setupCounts = {
    bullish: stockData.filter(stock => stock.setupType === 'bullish').length,
    bearish: stockData.filter(stock => stock.setupType === 'bearish').length,
    neutral: stockData.filter(stock => stock.setupType === 'neutral').length
  };
  
  // Generate market summary
  const marketSummary = {
    sentiment: setupCounts.bullish > setupCounts.bearish ? 'moderately bullish' : 
               setupCounts.bearish > setupCounts.bullish ? 'moderately bearish' : 'neutral',
    volatility: 'moderate',
    gexAggregate: stockData.reduce((sum, stock) => sum + stock.gex, 0),
    pcrAggregate: stockData.reduce((sum, stock) => sum + stock.pcr, 0) / stockData.length
  };
  
  return {
    timestamp: new Date().toISOString(),
    marketSummary,
    setupCounts,
    results: stockData
  };
};
