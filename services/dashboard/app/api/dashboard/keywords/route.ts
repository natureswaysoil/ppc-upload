import { NextResponse } from 'next/server'
import { queryBigQuery } from '@/lib/bigquery'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const matchType = searchParams.get('matchType')
    const limit = searchParams.get('limit') || '100'

    // Build WHERE clause
    const conditions = ['1=1'];
    
    if (status && status !== 'all') {
      conditions.push(`k.state = '${status.toUpperCase()}'`);
    }
    
    if (matchType && matchType !== 'all') {
      conditions.push(`k.match_type = '${matchType.toUpperCase()}'`);
    }

    const query = `
      SELECT
        k.keyword_id,
        k.keyword_text,
        k.campaign_id,
        c.campaign_name,
        k.match_type,
        k.bid,
        k.state as status,
        IFNULL(kp.acos, 0) as acos,
        IFNULL(kp.cost, 0) as spend,
        IFNULL(kp.sales, 0) as sales,
        IFNULL(kp.clicks, 0) as clicks,
        IFNULL(kp.impressions, 0) as impressions,
        IFNULL(kp.conversions, 0) as conversions,
        IFNULL(kp.ctr, 0) as ctr,
        IFNULL(kp.cpc, 0) as cpc,
        k.sync_timestamp
      FROM \`amazon-ppc-474902.amazon_ppc_data.keywords\` k
      LEFT JOIN \`amazon-ppc-474902.amazon_ppc_data.campaigns\` c ON k.campaign_id = c.campaign_id
      LEFT JOIN \`amazon-ppc-474902.amazon_ppc_data.keyword_performance\` kp ON k.keyword_id = kp.keyword_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY k.sync_timestamp DESC
      LIMIT ${limit}
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
      lastAction: 'Synced from Amazon',
      lastOptimized: k.sync_timestamp || null,
      createdAt: k.sync_timestamp || new Date().toISOString(),
      updatedAt: k.sync_timestamp || new Date().toISOString()
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
