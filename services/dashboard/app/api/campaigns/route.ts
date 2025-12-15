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

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where = status && status !== 'all' ? { status } : {}

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        keywords: true,
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Transform campaigns to match the expected format
    const transformedCampaigns = campaigns.map(campaign => ({
      id: campaign.id,
      campaignId: campaign.campaignId,
      name: campaign.name,
      status: campaign.status,
      budget: campaign.budget,
      budgetType: campaign.budgetType,
      acos: campaign.acos,
      spend: campaign.spend,
      sales: campaign.sales,
      clicks: campaign.clicks,
      impressions: campaign.impressions,
      conversions: campaign.conversions,
      ctr: campaign.ctr,
      cpc: campaign.cpc,
      lastAction: campaign.lastAction,
      lastOptimized: campaign.lastOptimized?.toISOString(),
      keywordCount: campaign.keywords.length,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
    }))

    return NextResponse.json(transformedCampaigns)
  } catch (error: any) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns', details: error.message },
      { status: 500 }
    )
  }
}
