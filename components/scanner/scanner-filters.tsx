"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { AlertTriangle } from "lucide-react";

interface ScannerFiltersProps {
  onApplyFilters: (filters: ScannerFilterValues) => void;
  isMockData?: boolean;
}

export interface ScannerFilterValues {
  setupType: string;
  pcr: {
    min: number;
    max: number;
  };
  rsi: {
    min: number;
    max: number;
  };
  stochasticRsi: {
    min: number;
    max: number;
  };
  iv: {
    min: number;
    max: number;
  };
  gex: string;
  includeGamma: boolean;
  includeVanna: boolean;
  includeCharm: boolean;
}

export const defaultFilters: ScannerFilterValues = {
  setupType: "all",
  pcr: {
    min: 0.5,
    max: 1.5,
  },
  rsi: {
    min: 30,
    max: 70,
  },
  stochasticRsi: {
    min: 20,
    max: 80,
  },
  iv: {
    min: 20,
    max: 80,
  },
  gex: "all",
  includeGamma: true,
  includeVanna: false,
  includeCharm: false,
};

const ScannerFilters: React.FC<ScannerFiltersProps> = ({
  onApplyFilters,
  isMockData = false
}) => {
  const [filters, setFilters] = useState<ScannerFilterValues>(defaultFilters);

  const handleSetupTypeChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      setupType: value,
    }));
  };

  const handlePCRChange = (values: number[]) => {
    setFilters((prev) => ({
      ...prev,
      pcr: {
        min: values[0],
        max: values[1],
      },
    }));
  };

  const handleRSIChange = (values: number[]) => {
    setFilters((prev) => ({
      ...prev,
      rsi: {
        min: values[0],
        max: values[1],
      },
    }));
  };

  const handleStochasticRSIChange = (values: number[]) => {
    setFilters((prev) => ({
      ...prev,
      stochasticRsi: {
        min: values[0],
        max: values[1],
      },
    }));
  };

  const handleIVChange = (values: number[]) => {
    setFilters((prev) => ({
      ...prev,
      iv: {
        min: values[0],
        max: values[1],
      },
    }));
  };

  const handleGEXChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      gex: value,
    }));
  };

  const handleSwitchChange = (name: keyof ScannerFilterValues) => {
    setFilters((prev) => ({
      ...prev,
      [name]: !(prev[name] as boolean),
    }));
  };

  const applyFilters = () => {
    onApplyFilters(filters);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    onApplyFilters(defaultFilters);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Scanner Filters</CardTitle>
        {isMockData && (
          <CardDescription className="flex items-center text-amber-500">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Using simulated data
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Setup Type</Label>
          <Select 
            value={filters.setupType}
            onValueChange={handleSetupTypeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select setup type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Setups</SelectItem>
              <SelectItem value="bullish">Bullish</SelectItem>
              <SelectItem value="bearish">Bearish</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Put-Call Ratio (PCR)</Label>
            <span className="text-sm text-muted-foreground">
              {filters.pcr.min.toFixed(1)} - {filters.pcr.max.toFixed(1)}
            </span>
          </div>
          <Slider
            min={0}
            max={3}
            step={0.1}
            value={[filters.pcr.min, filters.pcr.max]}
            onValueChange={handlePCRChange}
            className="my-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Bullish (&lt;0.8)</span>
            <span>Neutral</span>
            <span>Bearish (&gt;1.2)</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>RSI</Label>
            <span className="text-sm text-muted-foreground">
              {filters.rsi.min} - {filters.rsi.max}
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[filters.rsi.min, filters.rsi.max]}
            onValueChange={handleRSIChange}
            className="my-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Oversold</span>
            <span>Neutral</span>
            <span>Overbought</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Stochastic RSI</Label>
            <span className="text-sm text-muted-foreground">
              {filters.stochasticRsi.min} - {filters.stochasticRsi.max}
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[filters.stochasticRsi.min, filters.stochasticRsi.max]}
            onValueChange={handleStochasticRSIChange}
            className="my-4"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Implied Volatility (%)</Label>
            <span className="text-sm text-muted-foreground">
              {filters.iv.min} - {filters.iv.max}
            </span>
          </div>
          <Slider
            min={0}
            max={150}
            step={5}
            value={[filters.iv.min, filters.iv.max]}
            onValueChange={handleIVChange}
            className="my-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Low</span>
            <span>Moderate</span>
            <span>High</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Gamma Exposure (GEX)</Label>
          <Select 
            value={filters.gex}
            onValueChange={handleGEXChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select GEX filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All GEX Values</SelectItem>
              <SelectItem value="positive">Positive GEX (&gt;$500M)</SelectItem>
              <SelectItem value="negative">Negative GEX (&lt;-$500M)</SelectItem>
              <SelectItem value="neutral">Neutral GEX (±$200M)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Label>Advanced Options Analytics</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={filters.includeGamma}
                onCheckedChange={() => handleSwitchChange('includeGamma')}
                id="include-gamma"
              />
              <Label htmlFor="include-gamma" className="cursor-pointer">Include Gamma (pinning)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={filters.includeVanna}
                onCheckedChange={() => handleSwitchChange('includeVanna')}
                id="include-vanna"
              />
              <Label htmlFor="include-vanna" className="cursor-pointer">Include Vanna (IV sensitivity)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={filters.includeCharm}
                onCheckedChange={() => handleSwitchChange('includeCharm')}
                id="include-charm"
              />
              <Label htmlFor="include-charm" className="cursor-pointer">Include Charm (delta decay)</Label>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button onClick={applyFilters} className="w-full">Apply Filters</Button>
          <Button onClick={resetFilters} variant="outline" className="w-full">Reset</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScannerFilters;
