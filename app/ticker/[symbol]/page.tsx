import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TradeSetupRules } from '@/components/trade-setup/trade-setup-rules';
import { KeyLevelsMapping } from '@/components/key-levels/key-levels-mapping';
import { RiskManagementClient } from '@/components/risk-management/risk-management-client';
import { ConfirmationTiming } from '@/components/confirmation/confirmation-timing';
import { MarketAnalysis } from '@/components/market-context/market-analysis';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Target, Shield, Clock, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface TickerPageProps {
  params: Promise<{
    symbol: string;
  }>;
}

export default async function TickerPage({ params }: TickerPageProps) {
  const { symbol } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with back button */}
      <div className="mb-6">
        <Link href="/scanner">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Scanner
          </Button>
        </Link>
        
        <h1 className="text-3xl font-bold">{symbol} Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive technical and options analysis for {symbol}
        </p>
      </div>

      {/* Tabbed interface for different analysis views */}
      <Tabs defaultValue="trade-setup" className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="trade-setup" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Trade Setup</span>
          </TabsTrigger>
          <TabsTrigger value="key-levels" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Key Levels</span>
          </TabsTrigger>
          <TabsTrigger value="risk-management" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Risk</span>
          </TabsTrigger>
          <TabsTrigger value="confirmation" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Timing</span>
          </TabsTrigger>
          <TabsTrigger value="market-context" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Market</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="trade-setup">
            <TradeSetupRules ticker={symbol} />
          </TabsContent>

          <TabsContent value="key-levels">
            <KeyLevelsMapping ticker={symbol} />
          </TabsContent>

          <TabsContent value="risk-management">
            <RiskManagementClient ticker={symbol} />
          </TabsContent>

          <TabsContent value="confirmation">
            <ConfirmationTiming ticker={symbol} />
          </TabsContent>

          <TabsContent value="market-context">
            <MarketAnalysis ticker={symbol} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}