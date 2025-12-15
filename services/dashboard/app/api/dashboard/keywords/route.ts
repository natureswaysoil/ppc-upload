import { NextResponse } from 'next/server'
import { queryBigQuery } from '@/lib/bigquery'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const matchType = searchParams.get('matchType')

    // Build WHERE clause
    const conditions = ['1=1'];
    
    if (status && status !== 'all') {
      conditions.push(`keyword_status = '${status.toUpperCase()}'`);
    }
    
    if (matchType && matchType !== 'all') {
      conditions.push(`match_type = '${matchType.toUpperCase()}'`);
    }

    const query = `
      SELECT
        keyword_id,
        keyword_text,
        campaign_id,
        campaign_name,
        match_type,
        bid,
        keyword_status as status,
        SAFE_DIVIDE(cost, sales_7d) * 100 as acos,
        cost as spend,
        sales_7d as sales,
        clicks,
        impressions,
        conversions_7d as conversions,
        SAFE_DIVIDE(clicks, impressions) * 100 as ctr,
        SAFE_DIVIDE(cost, clicks) as cpc,
        last_updated,
        last_action
      FROM \`amazon-ppc-474902.amazon_ppc_data.keywords\`
      WHERE ${conditions.join(' AND ')}
      ORDER BY last_updated DESC
      LIMIT 1000
    `;

    const keywords = await queryBigQuery(query);

    // Transform data for frontend
    const transformedKeywords = keywords.map((k: any) => ({
      id: k.keyword_id,
      keywordId: k.keyword_id,
      text: k.keyword_text,
      campaignId: k.campaign_id,
      campaignName: k.campaign_name || `Campaign ${k.campaign_id?.substring(0, 8)}...`,
      matchType: k.match_type?.toLowerCase() || 'broad',
      bid: Number(k.bid) || 0,
      status: k.status?.toLowerCase() || 'enabled',
      acos: Number(k.acos) || 0,
      spend: Number(k.spend) || 0,
      sales: Number(k.sales) || 0,
      clicks: Number(k.clicks) || 0,
      impressions: Number(k.impressions) || 0,
      conversions: Number(k.conversions) || 0,
      ctr: Number(k.ctr) || 0,
      cpc: Number(k.cpc) || 0,
      lastAction: k.last_action || 'No action yet',
      lastOptimized: k.last_updated || null,
      createdAt: k.last_updated || new Date().toISOString(),
      updatedAt: k.last_updated || new Date().toISOString()
    }));

    return NextResponse.json({
      keywords: transformedKeywords,
      total: transformedKeywords.length
    });
  } catch (error: any) {
    console.error('Error in keywords API:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch keywords',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
