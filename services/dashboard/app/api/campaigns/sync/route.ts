export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { amazonAdsAPI } from '@/lib/amazon-ads-api'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting campaign sync from Amazon Ads API...')

    // Fetch campaigns from Amazon Ads API
    const campaignsResponse = await amazonAdsAPI.getCampaigns()
    const campaigns = campaignsResponse.campaigns || []

    if (!Array.isArray(campaigns)) {
      throw new Error('Invalid campaigns response from API')
    }

    console.log(`Fetched ${campaigns.length} campaigns from Amazon Ads API`)

    // Fetch keywords for all campaigns
    console.log('Fetching keywords...')
    const keywordsResponse = await amazonAdsAPI.getKeywords()
    const keywords = keywordsResponse.keywords || []

    console.log(`Fetched ${keywords.length} keywords from Amazon Ads API`)

    // Sync campaigns to database
    const syncedCampaigns = []
    for (const campaign of campaigns) {
      try {
        const campaignData = {
          campaignId: campaign.campaignId.toString(),
          name: campaign.name || 'Untitled Campaign',
          status: campaign.state?.toLowerCase() || 'unknown',
          budget: campaign.budget ? parseFloat(campaign.budget) : null,
          budgetType: campaign.budgetType || null,
        }

        const dbCampaign = await prisma.campaign.upsert({
          where: { campaignId: campaignData.campaignId },
          update: campaignData,
          create: campaignData,
        })

        syncedCampaigns.push(dbCampaign)
      } catch (error) {
        console.error(`Error syncing campaign ${campaign.campaignId}:`, error)
      }
    }

    // Sync keywords to database
    const syncedKeywords = []
    if (Array.isArray(keywords)) {
      for (const keyword of keywords) {
        try {
          const keywordData = {
            keywordId: keyword.keywordId.toString(),
            campaignId: keyword.campaignId.toString(),
            text: keyword.keywordText || '',
            matchType: keyword.matchType || 'exact',
            bid: keyword.bid ? parseFloat(keyword.bid) : 0,
            status: keyword.state?.toLowerCase() || 'unknown',
          }

          const dbKeyword = await prisma.keyword.upsert({
            where: { keywordId: keywordData.keywordId },
            update: keywordData,
            create: keywordData,
          })

          syncedKeywords.push(dbKeyword)
        } catch (error) {
          console.error(`Error syncing keyword ${keyword.keywordId}:`, error)
        }
      }
    }

    console.log(`Synced ${syncedCampaigns.length} campaigns and ${syncedKeywords.length} keywords to database`)

    return NextResponse.json({
      success: true,
      campaigns: syncedCampaigns.length,
      keywords: syncedKeywords.length,
      message: `Successfully synced ${syncedCampaigns.length} campaigns and ${syncedKeywords.length} keywords`
    })
  } catch (error: any) {
    console.error('Error syncing campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to sync campaigns', details: error.message },
      { status: 500 }
    )
  }
}
