import { CheckCircle, XCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface RuleCheckItemProps {
  title: string;
  description: string;
  passed: boolean;
  value: string;
  setupType?: 'bullish' | 'bearish' | 'neutral';
  compact?: boolean;
  className?: string;
}

export function RuleCheckItem({ 
  title, 
  description, 
  passed, 
  value,
  setupType = 'bullish',
  compact = false,
  className
}: RuleCheckItemProps) {
  // Get setup color based on type
  const setupColor = setupType === 'bullish' 
    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50' 
    : setupType === 'bearish'
    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50'
    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/50';
  
  // Get text color based on passed status
  const valueColor = passed 
    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    : 'text-red-800 border-red-800 dark:text-red-400 dark:border-red-400';
    
  if (compact) {
    return (
      <div className={cn("flex items-center justify-between", className)}>
        <div className="flex items-center gap-2">
          {passed ? 
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" /> : 
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          }
          <span className="text-sm font-medium">{title}</span>
        </div>
        <Badge variant={passed ? "default" : "outline"} className={valueColor}>
          {value}
        </Badge>
      </div>
    );
  }
    
  return (
    <div className={cn(`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md border ${setupColor}`, className)}>
      <div className="flex items-start gap-3">
        {passed ? 
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-500 mt-0.5" /> : 
          <XCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-500 mt-0.5" />
        }
        <div>
          <h4 className="text-sm font-medium">{title}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-2 sm:mt-0 pl-8 sm:pl-0 sm:text-right">
        <Badge variant={passed ? "default" : "outline"} className={valueColor}>
          {value}
        </Badge>
      </div>
    </div>
  );
}