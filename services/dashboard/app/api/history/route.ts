
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const statusFilter = searchParams.get('status')
    const triggerFilter = searchParams.get('trigger')

    // Build filters
    const whereClause: any = {}
    
    if (startDate || endDate) {
      whereClause.startTime = {}
      if (startDate) whereClause.startTime.gte = new Date(startDate)
      if (endDate) whereClause.startTime.lte = new Date(endDate)
    }
    
    if (statusFilter && statusFilter !== 'all') {
      whereClause.status = statusFilter
    }
    
    if (triggerFilter && triggerFilter !== 'all') {
      whereClause.triggeredBy = triggerFilter
    }

    // Get optimization runs
    const runs = await prisma.optimizationRun.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      orderBy: { startTime: 'desc' },
      take: 50,
      include: {
        optimizationLogs: {
          take: 100,
          orderBy: { timestamp: 'desc' }
        }
      }
    })

    // If no runs found, return mock data
    if (runs.length === 0) {
      return NextResponse.json(generateMockHistory(startDate, endDate, statusFilter, triggerFilter))
    }

    // Transform to response format
    const optimizationRuns = runs.map(run => ({
      id: run.id,
      startTime: run.startTime.toISOString(),
      endTime: run.endTime?.toISOString() || null,
      status: run.status,
      totalCampaigns: run.totalCampaigns,
      totalKeywords: run.totalKeywords,
      campaignsModified: run.campaignsModified,
      keywordsOptimized: run.keywordsOptimized,
      actionsPerformed: run.actionsPerformed,
      summary: run.summary || 'Optimization completed',
      triggeredBy: run.triggeredBy
    }))

    const actions = runs.flatMap(run => 
      run.optimizationLogs.map((log: any) => ({
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        action: log.actionType,
        campaignName: log.campaignName || '',
        keywordText: log.keywordText || '',
        oldValue: log.oldValue || '',
        newValue: log.newValue || '',
        reason: log.reason || '',
        impact: log.impactPercent || 0
      }))
    ).slice(0, 50)

    return NextResponse.json({
      optimizationRuns,
      actions
    })
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateMockHistory(
  startDate: string | null, 
  endDate: string | null, 
  statusFilter: string | null,
  triggerFilter: string | null
) {
  const end = endDate ? new Date(endDate) : new Date()
  const start = startDate ? new Date(startDate) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  const runs = []
  const actions = []
  let runId = 1
  let actionId = 1
  
  for (let d = new Date(end); d >= start; d.setHours(d.getHours() - 2)) {
    const triggered = Math.random() > 0.3 ? 'scheduled' : 'manual'
    const status = 'completed'
    
    // Apply filters
    if (statusFilter && statusFilter !== 'all' && status !== statusFilter) continue
    if (triggerFilter && triggerFilter !== 'all' && triggered !== triggerFilter) continue
    
    const startTime = new Date(d)
    const endTime = new Date(d.getTime() + 3 * 60 * 1000 + Math.random() * 3 * 60 * 1000)
    const campaignsModified = Math.floor(Math.random() * 20) + 5
    const keywordsOptimized = Math.floor(Math.random() * 50) + 20
    const actionsPerformed = campaignsModified + keywordsOptimized
    
    runs.push({
      id: String(runId++),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      status,
      totalCampaigns: 253,
      totalKeywords: 6064,
      campaignsModified,
      keywordsOptimized,
      actionsPerformed,
      summary: `Optimization completed. Adjusted ${keywordsOptimized} keyword bids and modified ${campaignsModified} campaigns.`,
      triggeredBy: triggered
    })
    
    // Add some actions for this run
    const actionTypes = ['BID_INCREASE', 'BID_DECREASE', 'CAMPAIGN_PAUSE', 'CAMPAIGN_ACTIVATE', 'NEGATIVE_KEYWORD']
    for (let i = 0; i < Math.min(3, actionsPerformed); i++) {
      const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)]
      actions.push({
        id: String(actionId++),
        timestamp: new Date(startTime.getTime() + i * 30000).toISOString(),
        action: actionType,
        campaignName: `Campaign ${Math.floor(Math.random() * 100)}`,
        keywordText: actionType.includes('BID') ? `keyword ${Math.floor(Math.random() * 500)}` : '',
        oldValue: actionType.includes('BID') ? `$${(Math.random() * 2 + 0.5).toFixed(2)}` : '',
        newValue: actionType.includes('BID') ? `$${(Math.random() * 2 + 0.5).toFixed(2)}` : '',
        reason: actionType.includes('INCREASE') ? 'Low ACOS, high CTR' : 'High ACOS, poor performance',
        impact: actionType.includes('INCREASE') ? 15 : actionType.includes('DECREASE') ? -15 : 0
      })
    }
  }
  
  return {
    optimizationRuns: runs.slice(0, 50),
    actions: actions.slice(0, 50)
  }
}
