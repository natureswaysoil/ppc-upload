
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  TrendingUp, 
  DollarSign, 
  MousePointer, 
  Target,
  BarChart3,
  Activity,
  Users,
  ShoppingCart
} from 'lucide-react'
import { DashboardMetrics } from '@/lib/types'

interface MetricsCardsProps {
  metrics: DashboardMetrics
  loading?: boolean
}

export function MetricsCards({ metrics, loading = false }: MetricsCardsProps) {
  const cards = [
    {
      title: 'Total Campaigns',
      value: metrics?.totalCampaigns?.toString() || '0',
      subtitle: `${metrics?.enabledCampaigns || 0} enabled • ${metrics?.pausedCampaigns || 0} paused`,
      icon: BarChart3,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50'
    },
    {
      title: 'Total Keywords',
      value: metrics?.totalKeywords?.toLocaleString() || '0',
      subtitle: 'Active keywords monitored',
      icon: Activity,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/50'
    },
    {
      title: 'Current ACOS',
      value: `${metrics?.currentAcos?.toFixed(1) || '0.0'}%`,
      subtitle: 'Target: 45.0%',
      icon: Target,
      color: metrics?.currentAcos > 45 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600',
      bgColor: metrics?.currentAcos > 45 ? 'bg-red-50 dark:bg-red-950/50' : 'bg-green-50 dark:bg-green-950/50'
    },
    {
      title: 'Total Spend',
      value: `$${metrics?.totalSpend?.toLocaleString() || '0'}`,
      subtitle: '30-day period',
      icon: DollarSign,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/50'
    },
    {
      title: 'Total Sales',
      value: `$${metrics?.totalSales?.toLocaleString() || '0'}`,
      subtitle: 'Revenue generated',
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/50'
    },
    {
      title: 'Total Clicks',
      value: metrics?.totalClicks?.toLocaleString() || '0',
      subtitle: 'Ad clicks received',
      icon: MousePointer,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/50'
    },
    {
      title: 'Conversions',
      value: metrics?.totalConversions?.toLocaleString() || '0',
      subtitle: 'Sales conversions',
      icon: ShoppingCart,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50'
    },
    {
      title: 'ROI',
      value: metrics?.totalSales && metrics?.totalSpend 
        ? `${((metrics.totalSales / metrics.totalSpend - 1) * 100).toFixed(1)}%`
        : '0.0%',
      subtitle: 'Return on ad spend',
      icon: Users,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/50'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-8 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className={cn("hover:shadow-lg transition-all duration-300", card.bgColor)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-lg bg-gradient-to-r", card.color)}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                {card.title === 'Current ACOS' && (
                  <Badge variant={metrics?.currentAcos > 45 ? "destructive" : "default"}>
                    {metrics?.currentAcos > 45 ? 'Above Target' : 'On Target'}
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">{card.title}</h3>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
