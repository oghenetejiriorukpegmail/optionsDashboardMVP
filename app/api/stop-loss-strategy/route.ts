import { NextResponse } from 'next/server';

interface StopLossRequest {
  entryPrice: number;
  tradeType: 'call' | 'put' | 'stock' | 'spread';
  stopType: 'technical' | 'percentage' | 'atr' | 'fixed' | 'time';
  optionPremium?: number;
  daysToExpiration?: number;
  iv?: number;
  atrValue?: number;
  accountSize?: number;
  riskPercentage?: number;
  technicalLevel?: number;
  percentageValue?: number;
  fixedDollarAmount?: number;
  timeDays?: number;
}

export async function POST(request: Request) {
  try {
    const body: StopLossRequest = await request.json();
    
    // Validate required fields
    if (!body.entryPrice || !body.tradeType || !body.stopType) {
      return NextResponse.json({ 
        error: 'Missing required fields (entryPrice, tradeType, stopType)' 
      }, { status: 400 });
    }
    
    // Calculate stop loss based on strategy type
    let stopLossPrice: number | null = null;
    let stopLossAmount: number | null = null;
    let maxLoss: number | null = null;
    let riskDescription: string = '';
    let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';
    let additionalRecommendations: string[] = [];
    
    switch (body.stopType) {
      case 'technical':
        if (!body.technicalLevel) {
          return NextResponse.json({ 
            error: 'Missing technicalLevel for technical stop type' 
          }, { status: 400 });
        }
        
        stopLossPrice = body.technicalLevel;
        
        if (body.tradeType === 'call' || body.tradeType === 'stock') {
          // For long calls or stocks, stop is below entry
          if (stopLossPrice >= body.entryPrice) {
            return NextResponse.json({ 
              error: 'Technical stop level should be below entry price for long calls or stocks' 
            }, { status: 400 });
          }
          stopLossAmount = body.entryPrice - stopLossPrice;
        } else if (body.tradeType === 'put') {
          // For long puts, stop is above entry
          if (stopLossPrice <= body.entryPrice) {
            return NextResponse.json({ 
              error: 'Technical stop level should be above entry price for long puts' 
            }, { status: 400 });
          }
          stopLossAmount = stopLossPrice - body.entryPrice;
        }
        
        confidenceLevel = 'high';
        riskDescription = 'Technical stops based on support/resistance or key levels tend to provide strong risk management with clear invalidation points.';
        additionalRecommendations.push('Consider adding a time element to your technical stop - exit if price hasn\'t reached target within a specific timeframe.');
        break;
        
      case 'percentage':
        if (!body.percentageValue) {
          return NextResponse.json({ 
            error: 'Missing percentageValue for percentage stop type' 
          }, { status: 400 });
        }
        
        if (body.tradeType === 'call' || body.tradeType === 'spread' || body.tradeType === 'stock') {
          // For options, percentage is of premium paid
          if (body.tradeType === 'call' || body.tradeType === 'spread') {
            if (!body.optionPremium) {
              return NextResponse.json({ 
                error: 'Missing optionPremium for option percentage stop' 
              }, { status: 400 });
            }
            stopLossAmount = body.optionPremium * (body.percentageValue / 100);
            stopLossPrice = body.entryPrice - (body.entryPrice * (body.percentageValue / 100));
          } else {
            // For stocks
            stopLossAmount = body.entryPrice * (body.percentageValue / 100);
            stopLossPrice = body.entryPrice - stopLossAmount;
          }
        } else if (body.tradeType === 'put') {
          if (!body.optionPremium) {
            return NextResponse.json({ 
              error: 'Missing optionPremium for option percentage stop' 
            }, { status: 400 });
          }
          stopLossAmount = body.optionPremium * (body.percentageValue / 100);
          stopLossPrice = body.entryPrice + (body.entryPrice * (body.percentageValue / 100));
        }
        
        confidenceLevel = 'medium';
        riskDescription = 'Percentage-based stops are effective for standardizing risk across different positions, but may not account for market volatility.';
        
        if (body.iv && body.iv > 40) {
          additionalRecommendations.push('Consider wider percentage stops in high IV environment to account for increased price swings.');
        }
        break;
        
      case 'atr':
        if (!body.atrValue) {
          return NextResponse.json({ 
            error: 'Missing atrValue for ATR stop type' 
          }, { status: 400 });
        }
        
        // Typically, ATR stops are set at 2-3x the ATR value
        const atrMultiplier = 2.5;
        
        if (body.tradeType === 'call' || body.tradeType === 'stock') {
          // For long calls or stocks, stop is below entry
          stopLossPrice = body.entryPrice - (body.atrValue * atrMultiplier);
          stopLossAmount = body.entryPrice - stopLossPrice;
        } else if (body.tradeType === 'put') {
          // For long puts, stop is above entry
          stopLossPrice = body.entryPrice + (body.atrValue * atrMultiplier);
          stopLossAmount = stopLossPrice - body.entryPrice;
        } else if (body.tradeType === 'spread') {
          // For spreads, use ATR to determine general volatility
          if (!body.optionPremium) {
            return NextResponse.json({ 
              error: 'Missing optionPremium for spread ATR stop' 
            }, { status: 400 });
          }
          stopLossAmount = body.optionPremium * 0.5; // 50% of premium as default
          // Price isn't as relevant for spreads since we're usually looking at premium value
          stopLossPrice = null;
        }
        
        confidenceLevel = 'high';
        riskDescription = 'ATR-based stops dynamically adjust to market volatility, providing more room in volatile conditions and tighter stops in low volatility.';
        additionalRecommendations.push('For best results, use the 14-day ATR value and adjust the multiplier based on the timeframe of your trade.');
        break;
        
      case 'fixed':
        if (!body.fixedDollarAmount) {
          return NextResponse.json({ 
            error: 'Missing fixedDollarAmount for fixed stop type' 
          }, { status: 400 });
        }
        
        stopLossAmount = body.fixedDollarAmount;
        
        // Calculate stop price based on fixed dollar risk
        if (body.tradeType === 'call' || body.tradeType === 'stock') {
          if (body.tradeType === 'stock') {
            stopLossPrice = body.entryPrice - stopLossAmount;
          } else {
            stopLossPrice = null; // Less relevant for options where we're focusing on premium value
          }
        } else if (body.tradeType === 'put') {
          if (body.tradeType === 'stock') {
            stopLossPrice = body.entryPrice + stopLossAmount;
          } else {
            stopLossPrice = null; // Less relevant for options
          }
        } else if (body.tradeType === 'spread') {
          stopLossPrice = null; // Not relevant for spreads
        }
        
        confidenceLevel = 'medium';
        riskDescription = 'Fixed dollar stops ensure consistent maximum loss amounts regardless of position size or market conditions.';
        
        if (body.accountSize) {
          const riskPercentage = (stopLossAmount / body.accountSize) * 100;
          if (riskPercentage > 2) {
            additionalRecommendations.push(`Warning: Fixed stop represents ${riskPercentage.toFixed(2)}% of account size, which exceeds the 2% recommended maximum.`);
          }
        }
        break;
        
      case 'time':
        if (!body.timeDays) {
          return NextResponse.json({ 
            error: 'Missing timeDays for time-based stop' 
          }, { status: 400 });
        }
        
        // Time-based stops don't have a specific price level
        stopLossPrice = null;
        
        // For options, estimate loss based on theta decay
        if ((body.tradeType === 'call' || body.tradeType === 'put' || body.tradeType === 'spread') && body.optionPremium && body.daysToExpiration) {
          // Very rough theta approximation
          // In reality, this would be calculated using proper options pricing model
          const estimatedTheta = body.optionPremium / body.daysToExpiration;
          stopLossAmount = estimatedTheta * body.timeDays;
        } else {
          // For stocks, time stops are usually combined with price stops
          stopLossAmount = null;
        }
        
        confidenceLevel = 'low';
        riskDescription = 'Time-based stops protect against theta decay and opportunity cost, but should generally be combined with price-based stops.';
        additionalRecommendations.push('For best results, combine time-based stops with at least one price-based stop method.');
        
        if (body.daysToExpiration && body.timeDays > body.daysToExpiration * 0.5) {
          additionalRecommendations.push(`Warning: Time stop is set for more than half the time until expiration (${body.timeDays} days vs ${body.daysToExpiration} DTE).`);
        }
        break;
    }
    
    // Calculate max loss if account size and risk percentage provided
    if (body.accountSize && body.riskPercentage) {
      maxLoss = body.accountSize * (body.riskPercentage / 100);
      
      // Check if calculated stop loss exceeds max risk tolerance
      if (stopLossAmount && stopLossAmount > maxLoss) {
        additionalRecommendations.push(`Warning: Calculated stop loss amount (${stopLossAmount.toFixed(2)}) exceeds max risk tolerance of $${maxLoss.toFixed(2)} (${body.riskPercentage}% of account).`);
      }
    }
    
    // Return stop loss recommendations
    return NextResponse.json({
      success: true,
      entryPrice: body.entryPrice,
      tradeType: body.tradeType,
      stopType: body.stopType,
      stopLossPrice,
      stopLossAmount,
      maxLoss,
      riskDescription,
      confidenceLevel,
      additionalRecommendations,
      stopLossPercentage: stopLossAmount && body.optionPremium ? 
        (stopLossAmount / body.optionPremium * 100).toFixed(2) : null
    });
    
  } catch (error) {
    console.error('Error calculating stop loss strategy:', error);
    return NextResponse.json({ 
      error: true, 
      message: 'Failed to calculate stop loss strategy',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}