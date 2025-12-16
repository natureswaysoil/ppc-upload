export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { queryBigQuery } from '@/lib/bigquery'

export async function GET(req: NextRequest) {
  try {
    // Use the pre-built dashboard_overview view
    const overviewQuery = `
      SELECT * FROM \`amazon-ppc-474902.amazon_ppc_data.dashboard_overview\`
    `;

    const [overview] = await queryBigQuery(overviewQuery);

    // Calculate ACOS (cost / sales * 100)
    const acos = overview?.total_ppc_sales > 0 
      ? (overview.total_ppc_spend / overview.total_ppc_sales) * 100 
      : 0;

    const metrics = {
      totalCampaigns: Number(overview?.total_campaigns) || 0,
      enabledCampaigns: Number(overview?.active_campaigns) || 0,
      pausedCampaigns: (Number(overview?.total_campaigns) || 0) - (Number(overview?.active_campaigns) || 0),
      totalKeywords: Number(overview?.total_keywords) || 0,
      currentAcos: acos,
      totalSpend: Number(overview?.total_ppc_spend) || 0,
      totalSales: Number(overview?.total_ppc_sales) || 0,
      totalClicks: 0, // Not available in overview
      totalConversions: Number(overview?.total_orders) || 0,
      lastRunTime: overview?.last_updated || null
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
