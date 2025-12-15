
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface CampaignStatusChartProps {
  enabled: number
  paused: number
}

export function CampaignStatusChart({ enabled, paused }: CampaignStatusChartProps) {
  const data = [
    { name: 'Enabled', value: enabled, color: '#72BF78' },
    { name: 'Paused', value: paused, color: '#FF9149' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any, name: string) => [value, `${name} Campaigns`]}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                wrapperStyle={{ fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Enabled</span>
            </div>
            <span className="text-sm font-medium">{enabled} ({((enabled / (enabled + paused)) * 100).toFixed(1)}%)</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm">Paused</span>
            </div>
            <span className="text-sm font-medium">{paused} ({((paused / (enabled + paused)) * 100).toFixed(1)}%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
