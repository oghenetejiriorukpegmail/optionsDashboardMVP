"use client";

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export function Initializer() {
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize application on first load
    const initializeApp = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (data.status === 'ok') {
          setIsInitialized(true);
          console.log('Application initialized successfully');
        } else {
          console.error('Application initialization failed:', data);
          toast({
            title: "Initialization Error",
            description: "Failed to initialize application. Some features may not work properly.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Failed to check application health:', error);
        toast({
          title: "Initialization Error",
          description: "Failed to initialize application. Some features may not work properly.",
          variant: "destructive",
        });
      }
    };

    initializeApp();
  }, [toast]);

  return null; // This component doesn't render anything
}
