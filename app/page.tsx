"use client";

import Link from 'next/link';
import { 
  BarChart3, 
  Target, 
  CheckCircle, 
  LineChart, 
  Search, 
  ArrowRight,
  Shield,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  // Features summary for the landing page
  const features = [
    {
      title: 'Options Analysis',
      description: 'Analyze options chain data including implied volatility, open interest, and Greeks',
      icon: <Target className="h-5 w-5 text-blue-500" />,
    },
    {
      title: 'Technical Analysis',
      description: 'Integrate traditional technical analysis with key indicators and chart patterns',
      icon: <LineChart className="h-5 w-5 text-green-500" />,
    },
    {
      title: 'Strategy Scanner',
      description: 'Find trade opportunities that meet your specific criteria with our advanced scanner',
      icon: <Search className="h-5 w-5 text-purple-500" />,
    },
    {
      title: 'Risk Management',
      description: 'Calculate optimal position sizes and risk-to-reward ratios for each trade',
      icon: <Shield className="h-5 w-5 text-amber-500" />,
    }
  ];

  return (
    <div className="flex flex-col gap-8 py-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-lg border bg-background p-2">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>
        
        <div className="relative space-y-6 p-6 md:p-10 lg:p-14">
          <div className="space-y-2 max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Options-Technical Hybrid Trading Platform
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl">
              Combining the power of options analytics and technical analysis to identify 
              high-probability trading opportunities with precision
            </p>
          </div>
          
          <div className="flex justify-center gap-4 flex-wrap">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
              <Link href="/dashboard">
                <BarChart3 className="mr-2 h-4 w-4" />
                Launch Dashboard
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/guide">
                Learn More
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Platform Features</h2>
          <p className="text-muted-foreground">
            Our hybrid approach combines multiple analysis techniques
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {features.map((feature, index) => (
            <Card key={index} className="border bg-gradient-to-br from-background to-muted/50">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="rounded-full p-2 bg-primary/10">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Card className="max-w-2xl mx-auto border bg-gradient-to-br from-background to-muted/50">
            <CardHeader>
              <CardTitle>Ready to get started?</CardTitle>
              <CardDescription>
                Access all features through our comprehensive dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                <Link href="/dashboard" className="flex items-center">
                  Go to Dashboard
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}