
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create default admin user (john@doe.com / johndoe123)
  const hashedPassword = await bcrypt.hash('johndoe123', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      password: hashedPassword,
      name: 'Admin User'
    }
  })

  // Create PPC admin user (admin@amazon-ppc.com / ppcadmin123)
  const ppcAdminPassword = await bcrypt.hash('ppcadmin123', 12)
  
  const ppcAdmin = await prisma.user.upsert({
    where: { email: 'admin@amazon-ppc.com' },
    update: {},
    create: {
      email: 'admin@amazon-ppc.com',
      password: ppcAdminPassword,
      name: 'PPC Administrator'
    }
  })

  // Create default optimizer configuration
  const config = await prisma.optimizerConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      acosThreshold: 0.45,
      lookbackDays: 14,
      bidAdjustmentPercent: 0.15,
      minBid: 0.25,
      maxBid: 5.0,
      runFrequency: 2,
      isActive: true
    }
  })

  // Create sample campaigns (mock data based on the optimizer logs)
  const sampleCampaigns = [
    {
      campaignId: 'camp_001',
      name: 'Organic Fertilizer - Exact Match',
      status: 'enabled',
      budget: 50.0,
      budgetType: 'daily',
      acos: 38.5,
      spend: 1250.0,
      sales: 3247.0,
      clicks: 156,
      impressions: 12500,
      conversions: 15,
      ctr: 0.0125,
      cpc: 8.01
    },
    {
      campaignId: 'camp_002',
      name: 'Garden Soil - Broad Match',
      status: 'enabled',
      budget: 35.0,
      budgetType: 'daily',
      acos: 42.3,
      spend: 890.0,
      sales: 2104.0,
      clicks: 98,
      impressions: 8900,
      conversions: 9,
      ctr: 0.011,
      cpc: 9.08
    },
    {
      campaignId: 'camp_003',
      name: 'Composting Supplies - Auto',
      status: 'paused',
      budget: 25.0,
      budgetType: 'daily',
      acos: 67.8,
      spend: 450.0,
      sales: 663.0,
      clicks: 45,
      impressions: 4200,
      conversions: 3,
      ctr: 0.0107,
      cpc: 10.0
    }
  ]

  for (const campaign of sampleCampaigns) {
    await prisma.campaign.upsert({
      where: { campaignId: campaign.campaignId },
      update: campaign,
      create: campaign
    })
  }

  // Create sample keywords
  const sampleKeywords = [
    {
      keywordId: 'kw_001',
      campaignId: 'camp_001',
      text: 'organic plant fertilizer',
      matchType: 'exact',
      bid: 0.98,
      status: 'enabled',
      acos: 32.5,
      spend: 156.0,
      sales: 480.0,
      clicks: 18,
      impressions: 1200,
      conversions: 3,
      ctr: 0.015,
      cpc: 8.67
    },
    {
      keywordId: 'kw_002',
      campaignId: 'camp_002',
      text: 'potting soil',
      matchType: 'broad',
      bid: 1.02,
      status: 'enabled',
      acos: 58.2,
      spend: 89.0,
      sales: 153.0,
      clicks: 12,
      impressions: 890,
      conversions: 1,
      ctr: 0.0135,
      cpc: 7.42
    }
  ]

  for (const keyword of sampleKeywords) {
    await prisma.keyword.upsert({
      where: { keywordId: keyword.keywordId },
      update: keyword,
      create: keyword
    })
  }

  // Create sample optimization run
  const optimizationRun = await prisma.optimizationRun.create({
    data: {
      status: 'completed',
      totalCampaigns: 253,
      totalKeywords: 6064,
      campaignsModified: 15,
      keywordsOptimized: 47,
      actionsPerformed: 62,
      summary: 'Optimization completed successfully. Adjusted 47 keyword bids, paused 3 high-ACOS campaigns, and added 12 negative keywords.',
      triggeredBy: 'scheduled',
      endTime: new Date()
    }
  })

  // Create sample optimization logs
  const optimizationLogs = [
    {
      runId: optimizationRun.id,
      campaignId: 'camp_001',
      keywordId: 'kw_001',
      action: 'BID_INCREASE',
      oldValue: '0.85',
      newValue: '0.98',
      reason: 'Low ACOS (32%), high CTR',
      impact: 15.0
    },
    {
      runId: optimizationRun.id,
      campaignId: 'camp_002',
      keywordId: 'kw_002',
      action: 'BID_DECREASE',
      oldValue: '1.20',
      newValue: '1.02',
      reason: 'High ACOS (58%), poor performance',
      impact: -15.0
    },
    {
      runId: optimizationRun.id,
      campaignId: 'camp_003',
      action: 'CAMPAIGN_PAUSE',
      reason: 'ACOS above threshold (67%)',
      impact: 0
    }
  ]

  for (const log of optimizationLogs) {
    await prisma.optimizationLog.create({ data: log })
  }

  // Create sample metric snapshots for the last 10 days
  for (let i = 9; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    await prisma.metricSnapshot.upsert({
      where: { date },
      update: {},
      create: {
        date,
        totalSpend: 1200 + (Math.random() - 0.5) * 400,
        totalSales: 2800 + (Math.random() - 0.5) * 800,
        totalClicks: 150 + Math.floor((Math.random() - 0.5) * 60),
        totalImpressions: 12000 + Math.floor((Math.random() - 0.5) * 4000),
        totalConversions: 12 + Math.floor((Math.random() - 0.5) * 8),
        averageAcos: 40 + (Math.random() - 0.5) * 10,
        averageCtr: 0.012 + (Math.random() - 0.5) * 0.004,
        averageCpc: 8.5 + (Math.random() - 0.5) * 2,
        enabledCampaigns: 135,
        pausedCampaigns: 118,
        activeKeywords: 6064
      }
    })
  }

  console.log('✅ Database seeded successfully!')
  console.log(`👤 Admin user created: john@doe.com / johndoe123`)
  console.log(`👤 PPC admin created: admin@amazon-ppc.com / ppcadmin123`)
  console.log(`⚙️  Created ${sampleCampaigns.length} campaigns`)
  console.log(`🔑 Created ${sampleKeywords.length} keywords`)
  console.log(`📊 Created 10 days of metric snapshots`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
