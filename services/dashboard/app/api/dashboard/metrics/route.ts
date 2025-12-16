export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { queryBigQuery } from '@/lib/bigquery'

export async function GET(req: NextRequest) {
  try {
    // Query BigQuery for summary metrics using actual schema
    const summaryQuery = `
      SELECT
        COUNT(DISTINCT c.campaign_id) as total_campaigns,
        COUNT(DISTINCT CASE WHEN c.state = 'ENABLED' THEN c.campaign_id END) as enabled_campaigns,
        COUNT(DISTINCT CASE WHEN c.state = 'PAUSED' THEN c.campaign_id END) as paused_campaigns,
        COUNT(DISTINCT k.keyword_id) as total_keywords,
        IFNULL(AVG(kp.acos), 0) as current_acos,
        IFNULL(SUM(kp.cost), 0) as total_spend,
        IFNULL(SUM(kp.sales), 0) as total_sales,
        IFNULL(SUM(kp.clicks), 0) as total_clicks,
        IFNULL(SUM(kp.conversions), 0) as total_conversions
      FROM \`amazon-ppc-474902.amazon_ppc_data.campaigns\` c
      LEFT JOIN \`amazon-ppc-474902.amazon_ppc_data.keywords\` k ON c.campaign_id = k.campaign_id
      LEFT JOIN \`amazon-ppc-474902.amazon_ppc_data.keyword_performance\` kp ON k.keyword_id = kp.keyword_id
    `;

    const [summary] = await queryBigQuery(summaryQuery);

    // Get last sync time
    const lastRunQuery = `
      SELECT MAX(sync_timestamp) as last_run
      FROM \`amazon-ppc-474902.amazon_ppc_data.keywords\`
    `;

    const [lastRun] = await queryBigQuery(lastRunQuery);

    const metrics = {
      totalCampaigns: Number(summary?.total_campaigns) || 0,
      enabledCampaigns: Number(summary?.enabled_campaigns) || 0,
      pausedCampaigns: Number(summary?.paused_campaigns) || 0,
      totalKeywords: Number(summary?.total_keywords) || 0,
      currentAcos: Number(summary?.current_acos) || 0,
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
