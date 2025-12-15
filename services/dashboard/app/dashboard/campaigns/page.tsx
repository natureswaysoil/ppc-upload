
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
  Play, 
  Pause, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Target,
  Eye,
  Edit
} from 'lucide-react'
import { CampaignPerformance } from '@/lib/types'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignPerformance[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<CampaignPerformance[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  // Fetch campaigns from API
  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns?status=${statusFilter}`)
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data)
      } else {
        console.error('Failed to fetch campaigns')
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sync campaigns from Amazon Ads API
  const syncCampaigns = async () => {
    try {
      setSyncing(true)
      const response = await fetch('/api/campaigns/sync', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        console.log('Sync completed:', data)
        setLastSync(new Date())
        // Refresh campaigns list
        await fetchCampaigns()
      } else {
        console.error('Failed to sync campaigns')
      }
    } catch (error) {
      console.error('Error syncing campaigns:', error)
    } finally {
      setSyncing(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchCampaigns()
  }, [])

  useEffect(() => {
    let filtered = campaigns

    if (searchTerm) {
      filtered = filtered.filter(campaign => 
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(campaign => campaign.status === statusFilter)
    }

    setFilteredCampaigns(filtered)
  }, [campaigns, searchTerm, statusFilter])

  const handleCampaignAction = (campaignId: string, action: 'pause' | 'resume') => {
    setCampaigns(prev => 
      prev.map(campaign => 
        campaign.id === campaignId 
          ? { 
              ...campaign, 
              status: action === 'pause' ? 'paused' : 'enabled',
              lastAction: action === 'pause' ? 'Campaign paused manually' : 'Campaign resumed manually',
              lastOptimized: 'Just now'
            }
          : campaign
      )
    )
  }

  const getStatusBadge = (status: string) => {
    return status === 'enabled' ? (
      <Badge className="bg-green-100 text-green-800">Enabled</Badge>
    ) : (
      <Badge variant="secondary">Paused</Badge>
    )
  }

  const getAcosBadge = (acos: number) => {
    if (acos <= 35) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (acos <= 45) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>
    if (acos <= 60) return <Badge className="bg-orange-100 text-orange-800">Fair</Badge>
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage and monitor your Amazon PPC campaigns
            {lastSync && <span className="ml-2 text-xs">(Last synced: {lastSync.toLocaleString()})</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={syncCampaigns} disabled={syncing} variant="outline">
            {syncing ? 'Syncing...' : 'Sync from Amazon'}
          </Button>
          <Button>
            <Play className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search campaigns..."
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
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Campaigns</p>
                <p className="text-2xl font-bold">{campaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Enabled</p>
                <p className="text-2xl font-bold">{campaigns.filter(c => c.status === 'enabled').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Pause className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Paused</p>
                <p className="text-2xl font-bold">{campaigns.filter(c => c.status === 'paused').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Spend</p>
                <p className="text-2xl font-bold">
                  ${campaigns.reduce((sum, c) => sum + c.spend, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading campaigns...</p>
              </div>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">No campaigns found. Click "Sync from Amazon" to load your campaigns.</p>
                <Button onClick={syncCampaigns} disabled={syncing}>
                  {syncing ? 'Syncing...' : 'Sync from Amazon'}
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ACOS</TableHead>
                  <TableHead>Spend</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Last Action</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                  <TableCell>
                    {campaign.acos ? (
                      <div className="flex items-center space-x-2">
                        <span>{campaign.acos.toFixed(1)}%</span>
                        {getAcosBadge(campaign.acos)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{campaign.spend ? `$${campaign.spend.toLocaleString()}` : '$0'}</TableCell>
                  <TableCell>{campaign.sales ? `$${campaign.sales.toLocaleString()}` : '$0'}</TableCell>
                  <TableCell>{campaign.clicks ? campaign.clicks.toLocaleString() : '0'}</TableCell>
                  <TableCell>{campaign.conversions || '0'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div>
                      <p>{campaign.lastAction || 'No actions yet'}</p>
                      <p className="text-xs">{campaign.lastOptimized || 'Never'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCampaignAction(
                          campaign.id, 
                          campaign.status === 'enabled' ? 'pause' : 'resume'
                        )}
                      >
                        {campaign.status === 'enabled' ? (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Resume
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
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
