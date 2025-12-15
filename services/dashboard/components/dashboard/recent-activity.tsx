
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  Pause, 
  Play, 
  MinusCircle,
  Clock
} from 'lucide-react'
import { OptimizationAction } from '@/lib/types'

const mockRecentActions: OptimizationAction[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    action: 'BID_INCREASE',
    campaignName: 'Organic Fertilizer - Exact',
    keywordText: 'organic plant fertilizer',
    oldValue: '$0.85',
    newValue: '$0.98',
    reason: 'Low ACOS (32%), high CTR',
    impact: 15.0
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    action: 'BID_DECREASE',
    campaignName: 'Garden Soil - Broad',
    keywordText: 'potting soil',
    oldValue: '$1.20',
    newValue: '$1.02',
    reason: 'High ACOS (58%), poor performance',
    impact: -15.0
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    action: 'CAMPAIGN_PAUSE',
    campaignName: 'Lawn Care Premium',
    reason: 'ACOS above threshold (67%)',
    impact: 0
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    action: 'NEGATIVE_KEYWORD',
    campaignName: 'Seed Starting Mix',
    keywordText: 'cheap soil',
    reason: 'No conversions after 15 clicks',
    impact: -5.0
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    action: 'CAMPAIGN_ACTIVATE',
    campaignName: 'Composting Supplies',
    reason: 'ACOS improved to 38%',
    impact: 0
  }
]

export function RecentActivity() {
  const [actions, setActions] = useState<OptimizationAction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setActions(mockRecentActions)
      setLoading(false)
    }, 1000)
  }, [])

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BID_INCREASE':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'BID_DECREASE':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'CAMPAIGN_PAUSE':
        return <Pause className="h-4 w-4 text-orange-600" />
      case 'CAMPAIGN_ACTIVATE':
        return <Play className="h-4 w-4 text-green-600" />
      case 'NEGATIVE_KEYWORD':
        return <MinusCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'BID_INCREASE':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Bid ↑</Badge>
      case 'BID_DECREASE':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Bid ↓</Badge>
      case 'CAMPAIGN_PAUSE':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Paused</Badge>
      case 'CAMPAIGN_ACTIVATE':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Activated</Badge>
      case 'NEGATIVE_KEYWORD':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Negative</Badge>
      default:
        return <Badge variant="outline">Action</Badge>
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Optimization Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="h-8 w-8 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Optimization Actions</CardTitle>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actions.map((action) => (
            <div key={action.id} className="flex items-center space-x-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <div className="flex-shrink-0">
                {getActionIcon(action.action)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getActionBadge(action.action)}
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatTimeAgo(action.timestamp)}
                  </span>
                </div>
                <p className="text-sm font-medium">{action.campaignName}</p>
                {action.keywordText && (
                  <p className="text-xs text-muted-foreground">
                    Keyword: "{action.keywordText}"
                  </p>
                )}
                {action.oldValue && action.newValue && (
                  <p className="text-xs text-muted-foreground">
                    {action.oldValue} → {action.newValue}
                  </p>
                )}
                {action.reason && (
                  <p className="text-xs text-muted-foreground">{action.reason}</p>
                )}
              </div>
              {action.impact && action.impact !== 0 && (
                <div className={`text-xs font-medium ${action.impact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {action.impact > 0 ? '+' : ''}{action.impact}%
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
