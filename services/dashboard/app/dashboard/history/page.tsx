
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  MinusCircle,
  Download,
  RefreshCw
} from 'lucide-react'
import { OptimizationRunSummary, OptimizationAction } from '@/lib/types'
import { DateRange } from 'react-day-picker'

export default function HistoryPage() {
  const [optimizationRuns, setOptimizationRuns] = useState<OptimizationRunSummary[]>([])
  const [actions, setActions] = useState<OptimizationAction[]>([])
  const [selectedRun, setSelectedRun] = useState<OptimizationRunSummary | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [statusFilter, setStatusFilter] = useState('all')
  const [triggerFilter, setTriggerFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange?.from) {
        params.append('startDate', dateRange.from.toISOString())
      }
      if (dateRange?.to) {
        params.append('endDate', dateRange.to.toISOString())
      }
      if (statusFilter) {
        params.append('status', statusFilter)
      }
      if (triggerFilter) {
        params.append('trigger', triggerFilter)
      }
      
      const response = await fetch(`/api/history?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setOptimizationRuns(data.optimizationRuns || [])
        setActions(data.actions || [])
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [dateRange, statusFilter, triggerFilter])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'running':
        return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

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

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return 'In progress...'
    
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationMs = end.getTime() - start.getTime()
    const minutes = Math.floor(durationMs / 60000)
    const seconds = Math.floor((durationMs % 60000) / 1000)
    
    return `${minutes}m ${seconds}s`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Optimization History</h1>
          <p className="text-muted-foreground">
            View detailed history of all optimization runs and actions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchHistory} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export History
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
              </SelectContent>
            </Select>
            <Select value={triggerFilter} onValueChange={setTriggerFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Triggers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Triggers</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Optimization Runs */}
        <Card>
          <CardHeader>
            <CardTitle>Optimization Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {optimizationRuns.map((run) => (
                  <div
                    key={run.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedRun?.id === run.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedRun(run)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(run.status)}
                        <Badge variant={run.triggeredBy === 'manual' ? 'default' : 'secondary'}>
                          {run.triggeredBy}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDuration(run.startTime, run.endTime)}
                      </div>
                    </div>
                    
                    <div className="text-sm font-medium mb-1">
                      {new Date(run.startTime).toLocaleString()}
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-2">
                      {run.summary}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span>{run.campaignsModified} campaigns modified</span>
                      <span>{run.keywordsOptimized} keywords optimized</span>
                      <span>{run.actionsPerformed} total actions</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Run Details & Actions */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedRun ? 'Run Details' : 'Recent Actions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRun ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Time</p>
                    <p className="font-medium">{new Date(selectedRun.startTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{formatDuration(selectedRun.startTime, selectedRun.endTime)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedRun.status)}
                      <span className="font-medium capitalize">{selectedRun.status}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Triggered By</p>
                    <Badge variant={selectedRun.triggeredBy === 'manual' ? 'default' : 'secondary'}>
                      {selectedRun.triggeredBy}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{selectedRun.campaignsModified}</p>
                    <p className="text-sm text-muted-foreground">Campaigns Modified</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{selectedRun.keywordsOptimized}</p>
                    <p className="text-sm text-muted-foreground">Keywords Optimized</p>
                  </div>
                </div>
                
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-center text-2xl font-bold text-orange-600">{selectedRun.actionsPerformed}</p>
                  <p className="text-center text-sm text-muted-foreground">Total Actions Performed</p>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-2">Summary</h4>
                  <p className="text-sm text-muted-foreground">{selectedRun.summary}</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {actions.map((action) => (
                    <div key={action.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                      <div className="flex-shrink-0">
                        {getActionIcon(action.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {action.action.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(action.timestamp).toLocaleTimeString()}
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
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
