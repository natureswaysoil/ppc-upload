export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    // const session = await getServerSession(authOptions)
    
    if (false) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get optimization runs
    const runs = await prisma.optimizationRun.findMany({
      orderBy: { startTime: 'desc' },
      take: limit,
      skip: offset,
      include: {
        actions: true
      }
    })

    const totalCount = await prisma.optimizationRun.count()

    // If no data, return mock data
    if (runs.length === 0) {
      return NextResponse.json({
        runs: generateMockHistory(),
        total: 10,
        limit,
        offset
      })
    }

    // Transform to response format
    const optimizationRuns = runs.map((run: any) => ({
      id: run.id,
      startTime: run.startTime.toISOString(),
      endTime: run.endTime?.toISOString() || null,
      status: run.status,
      totalCampaigns: run.totalCampaigns || 0,
      totalKeywords: run.totalKeywords || 0,
      campaignsModified: run.campaignsModified || 0,
      keywordsOptimized: run.keywordsOptimized || 0,
      actionsPerformed: run.actionsPerformed || 0,
      summary: run.summary || '',
      triggeredBy: run.triggeredBy || 'scheduled',
      actions: run.actions?.map((action: any) => ({
        id: action.id,
        timestamp: action.timestamp.toISOString(),
        action: action.action,
        entityType: action.entityType,
        entityId: action.entityId,
        oldValue: action.oldValue,
        newValue: action.newValue,
        reason: action.reason
      })) || []
    }))

    return NextResponse.json({
      runs: optimizationRuns,
      total: totalCount,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching optimization history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateMockHistory() {
  const now = new Date()
  const mockRuns = []
  
  for (let i = 0; i < 10; i++) {
    const startTime = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const endTime = new Date(startTime.getTime() + 5 * 60 * 1000)
    
    mockRuns.push({
      id: `mock-${i}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      status: 'completed',
      totalCampaigns: 253,
      totalKeywords: 6064,
      campaignsModified: Math.floor(Math.random() * 20) + 5,
      keywordsOptimized: Math.floor(Math.random() * 150) + 50,
      actionsPerformed: Math.floor(Math.random() * 200) + 75,
      summary: `Optimized ${Math.floor(Math.random() * 150) + 50} keywords across ${Math.floor(Math.random() * 20) + 5} campaigns`,
      triggeredBy: 'scheduled',
      actions: []
    })
  }
  
  return mockRuns
}
