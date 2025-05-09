"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { SCANNER_CONFIG } from "@/lib/config";

interface TickerLimitSettingsProps {
  defaultLimit?: number;
  maxLimit?: number;
  onLimitChange: (limit: number) => void;
  isLoading: boolean;
}

export function TickerLimitSettings({ 
  defaultLimit = SCANNER_CONFIG.DEFAULT_TICKER_LIMIT, 
  maxLimit = SCANNER_CONFIG.MAX_TICKER_LIMIT,
  onLimitChange,
  isLoading
}: TickerLimitSettingsProps) {
  const [limit, setLimit] = useState<number>(defaultLimit);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value)) {
      setLimit(0);
      return;
    }
    
    const newLimit = Math.min(Math.max(1, value), maxLimit);
    setLimit(newLimit);
  };

  const handleSliderChange = (value: number[]) => {
    setLimit(value[0]);
  };

  const handleApply = () => {
    onLimitChange(limit);
    toast.success(`Scanner limit set to ${limit} tickers`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scanner Settings</CardTitle>
        <CardDescription>
          Configure how many tickers to analyze
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ticker-limit">Number of Tickers to Analyze</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="ticker-limit"
              type="number"
              min={1}
              max={maxLimit}
              value={limit}
              onChange={handleInputChange}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">
              of {maxLimit} max
            </span>
          </div>
          <Slider
            value={[limit]}
            min={1}
            max={maxLimit}
            step={1}
            onValueChange={handleSliderChange}
            className="my-4"
          />
          <p className="text-sm text-muted-foreground">
            Analyzing more tickers provides wider market coverage but takes longer. For optimal performance, use 10-30 tickers.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleApply} disabled={isLoading}>
          {isLoading ? "Loading..." : "Apply Settings"}
        </Button>
      </CardFooter>
    </Card>
  );
}
