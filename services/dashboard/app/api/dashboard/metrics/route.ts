export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { queryBigQuery } from '@/lib/bigquery'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Query BigQuery for summary metrics
    const summaryQuery = `
      SELECT
        COUNT(DISTINCT campaign_id) as total_campaigns,
        COUNT(DISTINCT CASE WHEN campaign_status = 'ENABLED' THEN campaign_id END) as enabled_campaigns,
        COUNT(DISTINCT CASE WHEN campaign_status = 'PAUSED' THEN campaign_id END) as paused_campaigns,
        COUNT(DISTINCT keyword_id) as total_keywords,
        SAFE_DIVIDE(SUM(cost), SUM(sales_7d)) as current_acos,
        SUM(cost) as total_spend,
        SUM(sales_7d) as total_sales,
        SUM(clicks) as total_clicks,
        SUM(conversions_7d) as total_conversions
      FROM \`amazon-ppc-474902.amazon_ppc_data.keywords\`
      WHERE DATE(last_updated) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    `;

    const [summary] = await queryBigQuery(summaryQuery);

    // Get last optimization run time
    const lastRunQuery = `
      SELECT MAX(last_updated) as last_run
      FROM \`amazon-ppc-474902.amazon_ppc_data.keywords\`
    `;

    const [lastRun] = await queryBigQuery(lastRunQuery);

    const metrics = {
      totalCampaigns: Number(summary?.total_campaigns) || 0,
      enabledCampaigns: Number(summary?.enabled_campaigns) || 0,
      pausedCampaigns: Number(summary?.paused_campaigns) || 0,
      totalKeywords: Number(summary?.total_keywords) || 0,
      currentAcos: Number(summary?.current_acos) * 100 || 0,
      totalSpend: Number(summary?.total_spend) || 0,
      totalSales: Number(summary?.total_sales) || 0,
      totalClicks: Number(summary?.total_clicks) || 0,
      totalConversions: Number(summary?.total_conversions) || 0,
      lastRunTime: lastRun?.last_run || null
    };

    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch metrics',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
