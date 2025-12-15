
'use client'

import { useState, useEffect } from 'react'
import { MetricsCards } from '@/components/dashboard/metrics-cards'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { PerformanceCharts } from '@/components/dashboard/performance-charts'
import { CampaignStatusChart } from '@/components/dashboard/campaign-status-chart'
import { DashboardMetrics } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/dashboard/metrics')
      if (!response.ok) {
        throw new Error('Failed to fetch metrics')
      }
      
      const data = await response.json()
      setMetrics(data)
      setLastRefresh(new Date())
    } catch (error) {
      setError('Failed to load dashboard data. Please try again.')
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    fetchMetrics()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Amazon PPC Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and optimize your Sponsored Products campaigns
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Metrics Cards */}
      <MetricsCards metrics={metrics || ({} as DashboardMetrics)} loading={loading} />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Charts - Takes up 2/3 */}
        <div className="lg:col-span-2">
          <PerformanceCharts />
        </div>
        
        {/* Campaign Status Chart - Takes up 1/3 */}
        <div className="lg:col-span-1">
          <CampaignStatusChart 
            enabled={metrics?.enabledCampaigns || 0}
            paused={metrics?.pausedCampaigns || 0}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity />

      {/* Status Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Optimizer Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-sm font-medium text-green-600">Running</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Next Run</span>
                <span className="text-sm font-medium">
                  {new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Frequency</span>
                <span className="text-sm font-medium">Every 2 hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Run</span>
                <span className="text-sm font-medium">
                  {metrics?.lastRunTime 
                    ? new Date(metrics.lastRunTime).toLocaleString()
                    : 'Never'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => window.location.href = '/dashboard/controls'}
              >
                Run Optimizer Now
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => window.location.href = '/dashboard/settings'}
              >
                View Settings
              </Button>
              <Button className="w-full" variant="outline">
                Export Report
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => window.location.href = '/dashboard/history'}
              >
                View History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
