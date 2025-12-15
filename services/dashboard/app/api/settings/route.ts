
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { readOptimizerConfig, updateOptimizerConfig } from '@/lib/optimizer-parser'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to get settings from database first
    let settings = await prisma.optimizerConfig.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    // If no settings in DB, try to read from config file
    if (!settings) {
      const fileConfig = await readOptimizerConfig()
      if (fileConfig) {
        settings = {
          id: 'default',
          acosThreshold: fileConfig.acos_threshold || 0.45,
          lookbackDays: fileConfig.lookback_days || 14,
          bidAdjustmentPercent: fileConfig.bid_adjustment_percent || 0.15,
          minBid: fileConfig.min_bid || 0.25,
          maxBid: fileConfig.max_bid || 5.0,
          runFrequency: fileConfig.run_frequency || 2,
          isActive: fileConfig.active !== undefined ? fileConfig.active : true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    }

    // Return default settings if nothing found
    if (!settings) {
      settings = {
        id: 'default',
        acosThreshold: 45,
        lookbackDays: 14,
        bidAdjustmentPercent: 15,
        minBid: 0.25,
        maxBid: 5.0,
        runFrequency: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }

    return NextResponse.json({
      acosThreshold: settings.acosThreshold * 100, // Convert to percentage
      lookbackDays: settings.lookbackDays,
      bidAdjustmentPercent: settings.bidAdjustmentPercent * 100, // Convert to percentage
      minBid: settings.minBid,
      maxBid: settings.maxBid,
      runFrequency: settings.runFrequency,
      isActive: settings.isActive
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      acosThreshold,
      lookbackDays,
      bidAdjustmentPercent,
      minBid,
      maxBid,
      runFrequency,
      isActive
    } = body

    // Save to database
    const settings = await prisma.optimizerConfig.create({
      data: {
        acosThreshold: acosThreshold / 100, // Convert from percentage
        lookbackDays,
        bidAdjustmentPercent: bidAdjustmentPercent / 100, // Convert from percentage
        minBid,
        maxBid,
        runFrequency,
        isActive
      }
    })

    // Update the optimizer config file
    const configUpdate = {
      target_acos: acosThreshold / 100,
      high_acos: acosThreshold / 100,
      lookback_days: lookbackDays,
      up_pct: bidAdjustmentPercent / 100,
      down_pct: bidAdjustmentPercent / 100,
      min_bid: minBid,
      max_bid: maxBid
    }

    await updateOptimizerConfig(configUpdate)

    return NextResponse.json({ 
      message: 'Settings updated successfully',
      settings: {
        acosThreshold,
        lookbackDays,
        bidAdjustmentPercent,
        minBid,
        maxBid,
        runFrequency,
        isActive
      }
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
