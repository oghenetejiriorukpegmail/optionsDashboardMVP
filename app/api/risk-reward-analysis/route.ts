import { NextResponse } from 'next/server';

interface RiskRewardRequest {
  entryPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  positionType: 'long' | 'short' | 'call' | 'put' | 'spread' | 'condor';
  iv?: number;
  winProbability?: number;
  investmentAmount?: number;
  optionPremium?: number;
  strike?: number;
  daysToExpiration?: number;
  quantity?: number;
}

export async function POST(request: Request) {
  try {
    const body: RiskRewardRequest = await request.json();
    
    // Validate required fields
    if (!body.entryPrice || !body.targetPrice || !body.stopLossPrice || !body.positionType) {
      return NextResponse.json({ 
        error: 'Missing required fields (entryPrice, targetPrice, stopLossPrice, positionType)' 
      }, { status: 400 });
    }
    
    // Initialize variables
    let riskAmount: number;
    let rewardAmount: number;
    let riskRewardRatio: number;
    let dollarRisk: number;
    let dollarReward: number;
    let expectedValue: number;
    let winProbability = body.winProbability || 0; // Default to 0 if not provided
    let adjustedRiskRewardRatio: number;
    let riskScore: number; // 1-10 scale where 10 is safest
    let recommendations: string[] = [];
    
    // Calculate based on position type
    switch (body.positionType) {
      case 'long': // Stocks - long position
      case 'short': // Stocks - short position
        // Calculate risk and reward
        if (body.positionType === 'long') {
          // For long stock positions
          riskAmount = body.entryPrice - body.stopLossPrice;
          rewardAmount = body.targetPrice - body.entryPrice;
        } else {
          // For short stock positions (inverse calculations)
          riskAmount = body.stopLossPrice - body.entryPrice;
          rewardAmount = body.entryPrice - body.targetPrice;
        }
        
        // Ensure we're working with positive values
        riskAmount = Math.abs(riskAmount);
        rewardAmount = Math.abs(rewardAmount);
        
        // Calculate dollar values if quantity is provided
        if (body.quantity) {
          dollarRisk = riskAmount * body.quantity;
          dollarReward = rewardAmount * body.quantity;
        } else {
          dollarRisk = riskAmount;
          dollarReward = rewardAmount;
        }
        
        break;
        
      case 'call':
      case 'put':
        // For options, risk is typically the premium paid
        if (!body.optionPremium) {
          return NextResponse.json({ 
            error: 'Missing optionPremium for options position type' 
          }, { status: 400 });
        }
        
        // Calculate option-specific risk/reward
        riskAmount = body.optionPremium; // Maximum risk is premium paid
        
        // For calls, reward is target price minus (strike price plus premium)
        if (body.positionType === 'call') {
          if (!body.strike) {
            return NextResponse.json({ 
              error: 'Missing strike price for call option' 
            }, { status: 400 });
          }
          
          // Calculate potential reward (intrinsic value at target price)
          const intrinsicValueAtTarget = Math.max(0, body.targetPrice - body.strike);
          rewardAmount = intrinsicValueAtTarget - body.optionPremium;
        } else {
          // For puts, reward is (strike price minus target price) minus premium
          if (!body.strike) {
            return NextResponse.json({ 
              error: 'Missing strike price for put option' 
            }, { status: 400 });
          }
          
          // Calculate potential reward (intrinsic value at target price)
          const intrinsicValueAtTarget = Math.max(0, body.strike - body.targetPrice);
          rewardAmount = intrinsicValueAtTarget - body.optionPremium;
        }
        
        // Convert to dollar values (each contract is for 100 shares)
        dollarRisk = riskAmount * 100 * (body.quantity || 1);
        dollarReward = rewardAmount * 100 * (body.quantity || 1);
        
        break;
        
      case 'spread':
      case 'condor':
        // For spreads and condors, risk and reward are usually fixed
        if (!body.optionPremium) {
          return NextResponse.json({ 
            error: 'Missing optionPremium for spread/condor position type' 
          }, { status: 400 });
        }
        
        // For credit spreads, max risk is width of spread minus premium received
        // For debit spreads, max risk is premium paid
        // We'll simplify by using a generic calculation based on entry price vs stop loss
        riskAmount = Math.abs(body.entryPrice - body.stopLossPrice);
        rewardAmount = Math.abs(body.targetPrice - body.entryPrice);
        
        // Calculate dollar risk and reward (100 multiplier for option contracts)
        dollarRisk = riskAmount * 100 * (body.quantity || 1);
        dollarReward = rewardAmount * 100 * (body.quantity || 1);
        
        break;
      
      default:
        return NextResponse.json({ 
          error: `Unsupported position type: ${body.positionType}` 
        }, { status: 400 });
    }
    
    // Calculate risk-reward ratio
    riskRewardRatio = rewardAmount / riskAmount;
    
    // Estimate win probability if not provided
    if (!body.winProbability) {
      // Very simplified probability estimation
      if (body.positionType === 'call' || body.positionType === 'put') {
        if (body.strike && body.iv) {
          // Higher IV means lower probability for OTM options
          const strikeToSpotRatio = body.strike / body.entryPrice;
          
          if (body.positionType === 'call') {
            // For calls, closer to ATM = higher probability
            if (strikeToSpotRatio <= 1.0) {
              // ITM calls - higher probability
              winProbability = 65 - (body.iv * 0.2);
            } else {
              // OTM calls - lower probability
              const otmFactor = strikeToSpotRatio - 1.0;
              winProbability = 50 - (otmFactor * 100) - (body.iv * 0.2);
            }
          } else {
            // For puts, further below spot = higher probability
            if (strikeToSpotRatio >= 1.0) {
              // ITM puts - higher probability
              winProbability = 65 - (body.iv * 0.2);
            } else {
              // OTM puts - lower probability
              const otmFactor = 1.0 - strikeToSpotRatio;
              winProbability = 50 - (otmFactor * 100) - (body.iv * 0.2);
            }
          }
        } else {
          // Default probability without IV or strike information
          winProbability = 50;
        }
      } else if (body.positionType === 'spread' || body.positionType === 'condor') {
        // Credit spreads typically have higher probability
        winProbability = 60;
      } else {
        // Default probability for stock positions
        winProbability = 55;
      }
      
      // Clamp probability between 10% and 90%
      winProbability = Math.max(10, Math.min(90, winProbability));
    }
    
    // Calculate expected value
    expectedValue = (dollarReward * (winProbability / 100)) - (dollarRisk * (1 - (winProbability / 100)));
    
    // Calculate probability-adjusted risk-reward ratio
    adjustedRiskRewardRatio = (riskRewardRatio * winProbability) / 100;
    
    // Calculate risk score (1-10 scale)
    // Factors: R/R ratio, win probability, IV (for options)
    let baseScore = riskRewardRatio * 2; // R/R of 5:1 would give a 10
    
    // Adjust for win probability
    baseScore *= (winProbability / 50); // Normalize around 50% probability
    
    // Adjust for IV (if applicable)
    if (body.iv && (body.positionType === 'call' || body.positionType === 'put')) {
      // Higher IV is riskier
      const ivFactor = 1 - (body.iv / 100);
      baseScore *= ivFactor;
    }
    
    // Final score clamped between 1-10
    riskScore = Math.min(10, Math.max(1, baseScore));
    
    // Generate recommendations based on analysis
    if (riskRewardRatio < 1) {
      recommendations.push("Warning: Risk exceeds potential reward. Consider adjusting entry, target, or stop loss to improve ratio.");
    }
    
    if (riskRewardRatio >= 1 && riskRewardRatio < 2) {
      recommendations.push("Moderate risk/reward profile. Consider reducing position size or finding more favorable entry points.");
    }
    
    if (riskRewardRatio >= 3) {
      recommendations.push("Excellent risk/reward ratio. Consider increasing position size if within risk tolerance.");
    }
    
    if (winProbability < 40) {
      recommendations.push("Low probability trade. Ensure risk is appropriately sized for the speculative nature of this position.");
    }
    
    if (expectedValue <= 0) {
      recommendations.push("Negative expected value. This trade has a negative mathematical expectation over time.");
    }
    
    if (body.positionType === 'call' || body.positionType === 'put') {
      // Options-specific recommendations
      if (body.daysToExpiration) {
        if (body.daysToExpiration < 14) {
          recommendations.push("Short-dated option. Time decay (theta) will accelerate rapidly - consider earlier profit taking.");
        }
        
        if (body.iv && body.iv > 60) {
          recommendations.push("High implied volatility environment. Consider spreading positions (spreads, condors) to reduce vega risk.");
        }
      }
    }
    
    // Return risk-reward analysis
    return NextResponse.json({
      success: true,
      riskAmount,
      rewardAmount,
      riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2)),
      winProbability: parseFloat(winProbability.toFixed(1)),
      expectedValue: parseFloat(expectedValue.toFixed(2)),
      dollarRisk: parseFloat(dollarRisk.toFixed(2)),
      dollarReward: parseFloat(dollarReward.toFixed(2)),
      adjustedRiskRewardRatio: parseFloat(adjustedRiskRewardRatio.toFixed(2)),
      riskScore: parseFloat(riskScore.toFixed(1)),
      recommendations,
      tradeQuality: riskScore >= 7 ? 'excellent' : 
                   riskScore >= 5 ? 'good' : 
                   riskScore >= 3 ? 'fair' : 'poor'
    });
    
  } catch (error) {
    console.error('Error calculating risk-reward analysis:', error);
    return NextResponse.json({ 
      error: true, 
      message: 'Failed to calculate risk-reward analysis',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}