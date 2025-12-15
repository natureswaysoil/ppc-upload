
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { ChartData } from '@/lib/types'

const mockChartData: ChartData[] = [
  { date: '2024-10-01', acos: 42.5, spend: 1250, sales: 2940, clicks: 156, conversions: 12 },
  { date: '2024-10-02', acos: 38.2, spend: 1180, sales: 3090, clicks: 143, conversions: 15 },
  { date: '2024-10-03', acos: 45.8, spend: 1420, sales: 3100, clicks: 178, conversions: 14 },
  { date: '2024-10-04', acos: 41.3, spend: 1350, sales: 3270, clicks: 165, conversions: 16 },
  { date: '2024-10-05', acos: 39.7, spend: 1290, sales: 3250, clicks: 152, conversions: 18 },
  { date: '2024-10-06', acos: 44.2, spend: 1380, sales: 3120, clicks: 171, conversions: 13 },
  { date: '2024-10-07', acos: 37.8, spend: 1200, sales: 3180, clicks: 148, conversions: 17 },
  { date: '2024-10-08', acos: 43.1, spend: 1450, sales: 3370, clicks: 185, conversions: 15 },
  { date: '2024-10-09', acos: 40.6, spend: 1320, sales: 3250, clicks: 160, conversions: 16 },
  { date: '2024-10-10', acos: 42.9, spend: 1390, sales: 3240, clicks: 172, conversions: 14 }
]

export function PerformanceCharts() {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setData(mockChartData)
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading charts...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="acos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="acos">ACOS Trend</TabsTrigger>
            <TabsTrigger value="spend-sales">Spend vs Sales</TabsTrigger>
            <TabsTrigger value="clicks">Clicks & Conversions</TabsTrigger>
            <TabsTrigger value="performance">Daily Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="acos" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    label={{ value: 'ACOS (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
                  />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: any) => [`${value}%`, 'ACOS']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="acos" 
                    stroke="#60B5FF" 
                    strokeWidth={3}
                    dot={{ fill: '#60B5FF', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#60B5FF', strokeWidth: 2 }}
                  />
                  <Line 
                    y={45}
                    stroke="#FF6363" 
                    strokeDasharray="5 5" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Red dashed line shows ACOS threshold (45%)
            </div>
          </TabsContent>
          
          <TabsContent value="spend-sales" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
                  />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: any, name: string) => [`$${value}`, name === 'spend' ? 'Spend' : 'Sales']}
                  />
                  <Legend 
                    verticalAlign="top"
                    wrapperStyle={{ fontSize: 11 }}
                  />
                  <Bar dataKey="spend" fill="#FF9149" name="Spend" />
                  <Bar dataKey="sales" fill="#72BF78" name="Sales" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="clicks" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
                  />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: any, name: string) => [value, name === 'clicks' ? 'Clicks' : 'Conversions']}
                  />
                  <Legend 
                    verticalAlign="top"
                    wrapperStyle={{ fontSize: 11 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clicks" 
                    stroke="#A19AD3" 
                    strokeWidth={2}
                    name="Clicks"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="conversions" 
                    stroke="#FF90BB" 
                    strokeWidth={2}
                    name="Conversions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    label={{ value: 'ACOS (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
                  />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: any) => [`${value}%`, 'ACOS']}
                  />
                  <Bar 
                    dataKey="acos" 
                    fill="#80D8C3"
                    name="ACOS %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
