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

    const searchParams = req.nextUrl.searchParams
    const startDate = searchParams.get('startDate') || 
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || 
      new Date().toISOString().split('T')[0];

    // Query performance data by date
    const query = `
      SELECT
        DATE(last_updated) as date,
        SAFE_DIVIDE(SUM(cost), SUM(sales_7d)) * 100 as acos,
        SUM(cost) as spend,
        SUM(sales_7d) as sales,
        SUM(clicks) as clicks,
        SUM(conversions_7d) as conversions,
        SAFE_DIVIDE(SUM(sales_7d), SUM(cost)) as roas
      FROM \`amazon-ppc-474902.amazon_ppc_data.keywords\`
      WHERE DATE(last_updated) BETWEEN '${startDate}' AND '${endDate}'
      GROUP BY date
      ORDER BY date ASC
    `;

    const performanceData = await queryBigQuery(query);

    // Transform and calculate aggregates
    const transformedData = performanceData.map((row: any) => ({
      date: row.date?.value || row.date,
      acos: Number(row.acos) || 0,
      spend: Number(row.spend) || 0,
      sales: Number(row.sales) || 0,
      clicks: Number(row.clicks) || 0,
      conversions: Number(row.conversions) || 0,
      roas: Number(row.roas) || 0
    }));

    const totalSpend = transformedData.reduce((sum: number, d: any) => sum + d.spend, 0);
    const totalSales = transformedData.reduce((sum: number, d: any) => sum + d.sales, 0);
    const avgAcos = transformedData.length > 0 
      ? transformedData.reduce((sum: number, d: any) => sum + d.acos, 0) / transformedData.length 
      : 0;
    const avgRoas = totalSpend > 0 ? totalSales / totalSpend : 0;

    return NextResponse.json({
      performanceData: transformedData,
      aggregates: {
        avgAcos: avgAcos.toFixed(1),
        totalSpend: totalSpend.toFixed(2),
        totalSales: totalSales.toFixed(2),
        avgRoas: avgRoas.toFixed(2)
      }
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
