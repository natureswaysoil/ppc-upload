import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // We're using BigQuery now, not Amazon Ads API directly
    // This endpoint is not needed with BigQuery integration
    return NextResponse.json({
      message: 'Campaign sync is handled by the optimizer service',
      status: 'ok'
    })
  } catch (error: any) {
    console.error('Error in campaigns sync:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync campaigns' },
      { status: 500 }
    )
  }
}
