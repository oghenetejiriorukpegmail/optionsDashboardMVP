'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface RefreshDataButtonProps {
  ticker?: string;
  onRefresh?: () => void;
}

export function RefreshDataButton({ ticker, onRefresh }: RefreshDataButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    
    try {
      if (ticker) {
        // Refresh single ticker
        const response = await fetch('/api/collect-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ticker }),
        });

        if (!response.ok) {
          throw new Error('Failed to refresh data');
        }

        const data = await response.json();
        toast.success(`Data refreshed for ${ticker}`);
      } else {
        // Refresh all tickers
        const response = await fetch('/api/collect-data-bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to refresh data');
        }

        const data = await response.json();
        toast.success(`Data refreshed for ${data.successful} tickers`);
        
        if (data.errors && data.errors.length > 0) {
          toast.warning(`Failed to refresh ${data.failed} tickers`);
        }
      }

      // Call the onRefresh callback if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleRefresh}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      {isLoading ? 'Refreshing...' : ticker ? `Refresh ${ticker}` : 'Refresh All Data'}
    </Button>
  );
}