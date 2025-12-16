import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Transform campaigns to match the expected format
    const transformedCampaigns = campaigns.map((campaign: any) => ({
      id: campaign.id,
      campaignId: campaign.campaignId,
      name: campaign.name,
      status: campaign.status,
      budget: campaign.budget,
      acos: campaign.acos || 0,
      spend: campaign.spend || 0,
      sales: campaign.sales || 0,
      impressions: campaign.impressions || 0,
      clicks: campaign.clicks || 0,
      conversions: campaign.conversions || 0,
      lastAction: campaign.lastAction || 'No action yet',
      lastOptimized: campaign.lastOptimized?.toISOString() || null,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString()
    }))

    return NextResponse.json({
      campaigns: transformedCampaigns,
      total: transformedCampaigns.length
    })
  } catch (error: any) {
    console.error('Error in campaigns API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}
