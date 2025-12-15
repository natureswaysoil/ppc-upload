
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Target,
  Key,
  MousePointer,
  RefreshCw
} from 'lucide-react'
import { KeywordPerformance } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<KeywordPerformance[]>([])
  const [filteredKeywords, setFilteredKeywords] = useState<KeywordPerformance[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [matchTypeFilter, setMatchTypeFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchKeywords = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (matchTypeFilter !== 'all') params.append('matchType', matchTypeFilter)
      
      const response = await fetch(`/api/dashboard/keywords?${params.toString()}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch keywords')
      }
      
      setKeywords(data.keywords || [])
      setFilteredKeywords(data.keywords || [])
    } catch (error: any) {
      console.error('Error fetching keywords:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load keywords',
        variant: 'destructive'
      })
      setKeywords([])
      setFilteredKeywords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeywords()
  }, [statusFilter, matchTypeFilter])

  useEffect(() => {
    let filtered = keywords

    if (searchTerm) {
      filtered = filtered.filter(keyword => 
        keyword.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        keyword.campaignName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredKeywords(filtered)
  }, [keywords, searchTerm])

  const getStatusBadge = (status: string) => {
    return status === 'enabled' ? (
      <Badge className="bg-green-100 text-green-800">Enabled</Badge>
    ) : (
      <Badge variant="secondary">Paused</Badge>
    )
  }

  const getMatchTypeBadge = (matchType: string) => {
    const colors = {
      exact: 'bg-blue-100 text-blue-800',
      phrase: 'bg-purple-100 text-purple-800', 
      broad: 'bg-orange-100 text-orange-800'
    }
    return (
      <Badge className={colors[matchType as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {matchType}
      </Badge>
    )
  }

  const getPerformanceTrend = (acos: number) => {
    if (acos <= 35) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (acos >= 55) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Target className="h-4 w-4 text-yellow-600" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Keywords</h1>
          <p className="text-muted-foreground">
            Monitor and optimize your keyword performance
          </p>
        </div>
        <Button onClick={fetchKeywords} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search keywords or campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
            <Select value={matchTypeFilter} onValueChange={setMatchTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Match Types</SelectItem>
                <SelectItem value="exact">Exact</SelectItem>
                <SelectItem value="phrase">Phrase</SelectItem>
                <SelectItem value="broad">Broad</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Keywords</p>
                <p className="text-2xl font-bold">{loading ? '...' : keywords.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg ACOS</p>
                <p className="text-2xl font-bold">
                  {loading ? '...' : keywords.length > 0 
                    ? (keywords.reduce((sum, k) => sum + (k.acos || 0), 0) / keywords.length).toFixed(1) + '%'
                    : '0%'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Spend</p>
                <p className="text-2xl font-bold">
                  {loading ? '...' : `$${keywords.reduce((sum, k) => sum + (k.spend || 0), 0).toLocaleString()}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MousePointer className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">
                  {loading ? '...' : keywords.reduce((sum, k) => sum + (k.clicks || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Keywords Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Keyword Performance 
            {!loading && <span className="text-sm font-normal text-muted-foreground ml-2">
              ({filteredKeywords.length} keywords)
            </span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredKeywords.length === 0 ? (
            <div className="text-center py-12">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No keywords found</p>
              <p className="text-muted-foreground">
                {keywords.length === 0 
                  ? 'Keywords will be synced from your Amazon campaigns'
                  : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Match Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bid</TableHead>
                  <TableHead>ACOS</TableHead>
                  <TableHead>Spend</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Conv.</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Last Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeywords.map((keyword) => (
                  <TableRow key={keyword.id}>
                    <TableCell className="font-medium">{keyword.text}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {keyword.campaignName}
                    </TableCell>
                    <TableCell>{getMatchTypeBadge(keyword.matchType)}</TableCell>
                    <TableCell>{getStatusBadge(keyword.status)}</TableCell>
                    <TableCell>${keyword.bid?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className={(keyword.acos || 0) <= 35 ? 'text-green-600' : (keyword.acos || 0) >= 55 ? 'text-red-600' : 'text-yellow-600'}>
                          {(keyword.acos || 0).toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>${(keyword.spend || 0).toLocaleString()}</TableCell>
                    <TableCell>${(keyword.sales || 0).toLocaleString()}</TableCell>
                    <TableCell>{keyword.clicks || 0}</TableCell>
                    <TableCell>{keyword.conversions || 0}</TableCell>
                    <TableCell>{getPerformanceTrend(keyword.acos || 0)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {keyword.lastAction}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
