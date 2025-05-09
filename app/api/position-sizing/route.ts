import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.accountSize || !body.riskPercentage || !body.optionPremium) {
      return NextResponse.json({ 
        error: 'Missing required fields (accountSize, riskPercentage, optionPremium)' 
      }, { status: 400 });
    }
    
    // Extract values from request body
    const { 
      accountSize, 
      riskPercentage, 
      optionPremium, 
      stockPrice,
      iv,
      gexAdjustment 
    } = body;
    
    // Calculate risk amount
    const riskAmount = accountSize * (riskPercentage / 100);
    
    // Calculate initial number of contracts
    let contractsToTrade = Math.floor(riskAmount / optionPremium);
    
    // Apply adjustments based on IV and GEX
    let adjustmentFactor = 1.0;
    
    // IV adjustment
    if (iv > 60) {
      adjustmentFactor *= 0.8; // Reduce position size in high IV
    } else if (iv < 20) {
      adjustmentFactor *= 1.2; // Increase position size in low IV
    }
    
    // GEX adjustment
    if (gexAdjustment === 'conservative') {
      adjustmentFactor *= 0.8;
    } else if (gexAdjustment === 'aggressive') {
      adjustmentFactor *= 1.2;
    }
    
    // Calculate adjusted contracts
    const adjustedContracts = Math.floor(contractsToTrade * adjustmentFactor);
    
    // Ensure minimum of 1 contract
    const finalContracts = Math.max(1, adjustedContracts);
    
    // Calculate actual risk amount
    const actualRisk = finalContracts * optionPremium;
    
    // Calculate risk percentage of account
    const actualRiskPercentage = (actualRisk / accountSize) * 100;
    
    // Return position sizing recommendations
    return NextResponse.json({
      success: true,
      contractsToTrade: finalContracts,
      initialContractsCalculated: contractsToTrade,
      adjustmentFactor,
      maxRisk: actualRisk,
      maxRiskPercentage: actualRiskPercentage,
      notionalValue: finalContracts * optionPremium * 100, // Each contract represents 100 shares
      ivAdjustment: iv > 60 ? 'Applied High IV reduction' : 
                    iv < 20 ? 'Applied Low IV increase' : 
                    'No IV adjustment'
    });
  } catch (error) {
    console.error('Error calculating position size:', error);
    return NextResponse.json({ 
      error: true, 
      message: 'Failed to calculate position size',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}