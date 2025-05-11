"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  Save, 
  Key, 
  Trash2, 
  Info, 
  RefreshCw, 
  Database, 
  Shield, 
  Eye, 
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { SCANNER_CONFIG } from '@/lib/config';

// Default settings
const DEFAULT_SETTINGS = {
  // API keys
  apiKeys: {
    yahooFinance: '',
    alphaVantage: '',
  },
  // Data collection settings
  dataCollection: {
    autoUpdateEnabled: true,
    updateInterval: 60, // seconds
    maxConcurrentRequests: SCANNER_CONFIG.API.CONCURRENCY_LIMIT,
    cacheEnabled: true,
    cacheDuration: SCANNER_CONFIG.CACHE_DURATION / 60000, // minutes
  },
  // UI preferences
  uiPreferences: {
    darkMode: 'system', // system, dark, light
    defaultView: 'grid', // grid, table
    compactMode: false,
    showVolatilityMetrics: true,
    showGreekMetrics: true,
    defaultTickerLimit: SCANNER_CONFIG.DEFAULT_TICKER_LIMIT,
  },
  // Notification settings
  notifications: {
    alertsEnabled: true,
    soundEnabled: false,
    minStrengthForAlert: 75,
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [statusData, setStatusData] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Load settings from localStorage on initial mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('optionsDashboardSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
    
    // Fetch data collection status
    fetchStatus();
  }, []);
  
  // Fetch service status
  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/status');
      const data = await response.json();
      setStatusData(data);
    } catch (error) {
      console.error('Error fetching status:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch system status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to update settings
  const updateSettings = (section: string, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value,
      },
    }));
  };
  
  // Save settings
  const saveSettings = () => {
    try {
      localStorage.setItem('optionsDashboardSettings', JSON.stringify(settings));
      toast({
        title: 'Settings Saved',
        description: 'Your settings have been saved successfully',
      });
      
      // Apply settings immediately when possible
      applySettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };
  
  // Reset settings to defaults
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('optionsDashboardSettings');
    toast({
      title: 'Settings Reset',
      description: 'All settings have been reset to default values',
    });
  };
  
  // Apply settings where possible (e.g. dark mode)
  const applySettings = () => {
    // Apply dark mode
    const htmlElement = document.querySelector('html');
    if (htmlElement) {
      if (settings.uiPreferences.darkMode === 'dark') {
        htmlElement.classList.add('dark');
      } else if (settings.uiPreferences.darkMode === 'light') {
        htmlElement.classList.remove('dark');
      } else {
        // System preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          htmlElement.classList.add('dark');
        } else {
          htmlElement.classList.remove('dark');
        }
      }
    }
  };
  
  // Clear cache
  const clearCache = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/status?action=clear-cache', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.status === 'ok') {
        toast({
          title: 'Cache Cleared',
          description: 'Application cache has been cleared successfully',
        });
      } else {
        throw new Error(data.message || 'Failed to clear cache');
      }
      
      // Refresh status
      await fetchStatus();
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear cache',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format bytes to human-readable size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your dashboard preferences and API settings
        </p>
      </div>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="data-collection">Data Collection</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System Status</TabsTrigger>
        </TabsList>
        
        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>User Interface</CardTitle>
              <CardDescription>
                Customize how the dashboard looks and functions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex space-x-2">
                  <Button 
                    variant={settings.uiPreferences.darkMode === 'system' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => updateSettings('uiPreferences', 'darkMode', 'system')}
                  >
                    System
                  </Button>
                  <Button 
                    variant={settings.uiPreferences.darkMode === 'dark' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => updateSettings('uiPreferences', 'darkMode', 'dark')}
                  >
                    Dark
                  </Button>
                  <Button 
                    variant={settings.uiPreferences.darkMode === 'light' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => updateSettings('uiPreferences', 'darkMode', 'light')}
                  >
                    Light
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Default View</Label>
                <div className="flex space-x-2">
                  <Button 
                    variant={settings.uiPreferences.defaultView === 'grid' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => updateSettings('uiPreferences', 'defaultView', 'grid')}
                  >
                    Grid
                  </Button>
                  <Button 
                    variant={settings.uiPreferences.defaultView === 'table' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => updateSettings('uiPreferences', 'defaultView', 'table')}
                  >
                    Table
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="compact-mode">Compact Mode</Label>
                <Switch 
                  id="compact-mode" 
                  checked={settings.uiPreferences.compactMode}
                  onCheckedChange={(value) => updateSettings('uiPreferences', 'compactMode', value)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="volatility-metrics">Show Volatility Metrics</Label>
                <Switch 
                  id="volatility-metrics" 
                  checked={settings.uiPreferences.showVolatilityMetrics}
                  onCheckedChange={(value) => updateSettings('uiPreferences', 'showVolatilityMetrics', value)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="greek-metrics">Show Greek Metrics</Label>
                <Switch 
                  id="greek-metrics" 
                  checked={settings.uiPreferences.showGreekMetrics}
                  onCheckedChange={(value) => updateSettings('uiPreferences', 'showGreekMetrics', value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ticker-limit">Default Ticker Limit</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="ticker-limit"
                    type="number"
                    value={settings.uiPreferences.defaultTickerLimit}
                    onChange={(e) => updateSettings('uiPreferences', 'defaultTickerLimit', parseInt(e.target.value) || 10)}
                    className="w-24"
                    min={1}
                    max={100}
                  />
                  <span className="text-sm text-muted-foreground">
                    tickers (1-100)
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={resetSettings}
              >
                Reset to Defaults
              </Button>
              <Button 
                onClick={saveSettings}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* API Keys */}
        <TabsContent value="api-keys">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Configure API keys for various data providers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-md p-3 text-sm flex items-start space-x-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="text-amber-800 dark:text-amber-300">
                  <p className="font-semibold mb-1">Important Note</p>
                  <p>API keys are stored in your browser&apos;s local storage. Never share access to your dashboard or device with individuals you don&apos;t trust.</p>
                </div>
              </div>
              
              <div className="flex justify-end mb-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowApiKeys(!showApiKeys)}
                >
                  {showApiKeys ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showApiKeys ? 'Hide Keys' : 'Show Keys'}
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="yahoo-finance-key" className="flex items-center">
                    Yahoo Finance API Key 
                    <span className="text-xs text-muted-foreground ml-2">(Optional)</span>
                  </Label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Input
                        id="yahoo-finance-key"
                        type={showApiKeys ? 'text' : 'password'} 
                        value={settings.apiKeys.yahooFinance}
                        onChange={(e) => updateSettings('apiKeys', 'yahooFinance', e.target.value)}
                        placeholder="Enter your Yahoo Finance API Key"
                      />
                      <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    {settings.apiKeys.yahooFinance && (
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => updateSettings('apiKeys', 'yahooFinance', '')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Not required for basic functionality. Enables extended API access and higher rate limits.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="alpha-vantage-key" className="flex items-center">
                    Alpha Vantage API Key
                    <span className="text-xs text-muted-foreground ml-2">(Optional)</span>
                  </Label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Input
                        id="alpha-vantage-key"
                        type={showApiKeys ? 'text' : 'password'}
                        value={settings.apiKeys.alphaVantage}
                        onChange={(e) => updateSettings('apiKeys', 'alphaVantage', e.target.value)}
                        placeholder="Enter your Alpha Vantage API Key"
                      />
                      <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    {settings.apiKeys.alphaVantage && (
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => updateSettings('apiKeys', 'alphaVantage', '')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Used for alternative data source when Yahoo Finance is unavailable. Get a free key at <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">alphavantage.co</a>.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={resetSettings}
              >
                Reset to Defaults
              </Button>
              <Button 
                onClick={saveSettings}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Data Collection */}
        <TabsContent value="data-collection">
          <Card>
            <CardHeader>
              <CardTitle>Data Collection</CardTitle>
              <CardDescription>
                Configure how the application collects and caches data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="auto-update">Auto Update Data</Label>
                <Switch 
                  id="auto-update" 
                  checked={settings.dataCollection.autoUpdateEnabled}
                  onCheckedChange={(value) => updateSettings('dataCollection', 'autoUpdateEnabled', value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="update-interval">Update Interval (seconds)</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="update-interval"
                    type="number"
                    value={settings.dataCollection.updateInterval}
                    onChange={(e) => updateSettings('dataCollection', 'updateInterval', parseInt(e.target.value) || 60)}
                    className="w-24"
                    min={10}
                    max={3600}
                    disabled={!settings.dataCollection.autoUpdateEnabled}
                  />
                  <span className="text-sm text-muted-foreground">
                    seconds (10-3600)
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="concurrent-requests">Max Concurrent Requests</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="concurrent-requests"
                    type="number"
                    value={settings.dataCollection.maxConcurrentRequests}
                    onChange={(e) => updateSettings('dataCollection', 'maxConcurrentRequests', parseInt(e.target.value) || 1)}
                    className="w-24"
                    min={1}
                    max={5}
                  />
                  <span className="text-sm text-muted-foreground">
                    requests (1-5)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Higher values may cause rate limiting from data providers. Use with caution.
                </p>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="cache-enabled">Enable Data Caching</Label>
                <Switch 
                  id="cache-enabled" 
                  checked={settings.dataCollection.cacheEnabled}
                  onCheckedChange={(value) => updateSettings('dataCollection', 'cacheEnabled', value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cache-duration">Cache Duration (minutes)</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="cache-duration"
                    type="number"
                    value={settings.dataCollection.cacheDuration}
                    onChange={(e) => updateSettings('dataCollection', 'cacheDuration', parseInt(e.target.value) || 5)}
                    className="w-24"
                    min={1}
                    max={60}
                    disabled={!settings.dataCollection.cacheEnabled}
                  />
                  <span className="text-sm text-muted-foreground">
                    minutes (1-60)
                  </span>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  onClick={clearCache}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Clear Cache
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Clears the cache and forces fresh data to be fetched on next request.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={resetSettings}
              >
                Reset to Defaults
              </Button>
              <Button 
                onClick={saveSettings}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure alerts and notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="alerts-enabled">Enable Alert Notifications</Label>
                <Switch 
                  id="alerts-enabled" 
                  checked={settings.notifications.alertsEnabled}
                  onCheckedChange={(value) => updateSettings('notifications', 'alertsEnabled', value)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="sound-enabled">Enable Sound Alerts</Label>
                <Switch 
                  id="sound-enabled" 
                  checked={settings.notifications.soundEnabled}
                  onCheckedChange={(value) => updateSettings('notifications', 'soundEnabled', value)}
                  disabled={!settings.notifications.alertsEnabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="min-strength">Minimum Setup Strength for Alerts</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="min-strength"
                    type="number"
                    value={settings.notifications.minStrengthForAlert}
                    onChange={(e) => updateSettings('notifications', 'minStrengthForAlert', parseInt(e.target.value) || 75)}
                    className="w-24"
                    min={0}
                    max={100}
                    disabled={!settings.notifications.alertsEnabled}
                  />
                  <span className="text-sm text-muted-foreground">
                    % (0-100)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Only alert for setups with strength greater than or equal to this value.
                </p>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-md p-3 text-sm flex items-start space-x-2 mt-4">
                <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="text-amber-800 dark:text-amber-300">
                  <p className="font-semibold mb-1">Browser Permissions</p>
                  <p>Notifications require browser permission. You may need to enable notifications for this site in your browser settings.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={resetSettings}
              >
                Reset to Defaults
              </Button>
              <Button 
                onClick={saveSettings}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* System Status */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <div className="flex justify-between">
                <div>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>
                    View system information and data collection status
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchStatus}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="sr-only">Refresh</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading && !statusData ? (
                <div className="flex justify-center items-center h-40">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : statusData ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Database className="h-4 w-4 mr-2" />
                        System Information
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="font-medium">
                            <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                            {statusData.status}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Uptime:</span>
                          <span className="font-medium">
                            {Math.floor(statusData.systemInfo.uptime / 3600)} hours, {Math.floor((statusData.systemInfo.uptime % 3600) / 60)} minutes
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Environment:</span>
                          <span className="font-medium">
                            {statusData.systemInfo.environment}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Node Version:</span>
                          <span className="font-medium">
                            {statusData.systemInfo.nodeVersion}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Update:</span>
                          <span className="font-medium">
                            {new Date(statusData.systemInfo.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Data Collection
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Active Jobs:</span>
                          <span className="font-medium">
                            {statusData.dataCollection.activeJobs}
                          </span>
                        </div>
                        
                        <div className="mt-2">
                          <h4 className="text-xs font-medium text-muted-foreground mb-1">Monitoring Tickers:</h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.keys(statusData.dataCollection.jobs).map((ticker) => (
                              <Badge key={ticker} variant="outline" className="text-xs">
                                {ticker}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Database className="h-4 w-4 mr-2" />
                        Cache Status
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cache Entries:</span>
                          <span className="font-medium">
                            {statusData.cache.size}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cache Types:</span>
                          <span className="font-medium">
                            {Array.from(new Set(statusData.cache.entries.map((e: string) => e.split(':')[0]))).join(', ')}
                          </span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearCache} 
                        disabled={isLoading}
                        className="mt-4"
                      >
                        {isLoading ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Clear Cache
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Failed to load system status. Please try refreshing.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.push('/')}
        >
          Back to Dashboard
        </Button>
        <Button 
          onClick={saveSettings}
        >
          <Save className="h-4 w-4 mr-2" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
}