"use client";

import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { RefreshCw } from "lucide-react";

interface ScannerControlsProps {
  onSearch: (searchText: string) => void;
  onRefresh?: () => void;
  totalResults: number;
  filteredResults: number;
  loading?: boolean;
  dataSource?: string | null;
}

export default function ScannerControls({
  onSearch,
  onRefresh,
  totalResults,
  filteredResults,
  loading = false,
  dataSource = null,
}: ScannerControlsProps) {
  const [searchText, setSearchText] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleSearch = () => {
    onSearch(searchText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Label htmlFor="searchInput" className="sr-only">
            Search Tickers
          </Label>
          <div className="relative">
            <Input
              id="searchInput"
              placeholder="Search by ticker symbol..."
              value={searchText}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              className="w-full"
              disabled={loading}
            />
            <Button
              onClick={handleSearch}
              className="absolute right-0 top-0 h-full rounded-l-none"
              disabled={loading}
            >
              Search
            </Button>
          </div>
        </div>
        
        {onRefresh && (
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onRefresh}
            disabled={loading}
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {filteredResults} of {totalResults} NASDAQ 100 stocks
        </div>
        
        {dataSource && (
          <div className="flex items-center gap-2">
            <span>Data Source:</span>
            <Badge variant={dataSource.includes('mock') ? "outline" : "default"}>
              {dataSource.includes('mock') ? 'Simulated Data' : 'Real-time Data'}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
