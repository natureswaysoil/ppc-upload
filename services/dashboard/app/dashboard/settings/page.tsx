
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Save, RotateCcw, AlertTriangle, CheckCircle, Settings } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface OptimizerSettings {
  acosThreshold: number
  lookbackDays: number
  bidAdjustmentPercent: number
  minBid: number
  maxBid: number
  runFrequency: number
  isActive: boolean
}

const defaultSettings: OptimizerSettings = {
  acosThreshold: 45,
  lookbackDays: 14,
  bidAdjustmentPercent: 15,
  minBid: 0.25,
  maxBid: 5.0,
  runFrequency: 2,
  isActive: true
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<OptimizerSettings>(defaultSettings)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (key: keyof OptimizerSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setHasChanges(false)
        toast({
          title: "Settings saved",
          description: "Optimizer configuration has been updated successfully.",
        })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(defaultSettings)
    setHasChanges(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Optimizer Settings</h1>
            <p className="text-muted-foreground">Configure your PPC optimization parameters</p>
          </div>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Optimizer Settings</h1>
          <p className="text-muted-foreground">
            Configure your Amazon PPC optimization parameters
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {settings.isActive ? (
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
      </div>

      {/* Settings Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ACOS & Performance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Performance Thresholds</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="acosThreshold">
                ACOS Threshold ({settings.acosThreshold}%)
              </Label>
              <Slider
                id="acosThreshold"
                min={10}
                max={100}
                step={1}
                value={[settings.acosThreshold]}
                onValueChange={(value) => handleSettingChange('acosThreshold', value[0])}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Campaigns with ACOS above this threshold will be paused
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lookbackDays">Lookback Period</Label>
              <Select 
                value={settings.lookbackDays.toString()}
                onValueChange={(value) => handleSettingChange('lookbackDays', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Time period for performance analysis
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bid Management */}
        <Card>
          <CardHeader>
            <CardTitle>Bid Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bidAdjustment">
                Bid Adjustment ({settings.bidAdjustmentPercent}%)
              </Label>
              <Slider
                id="bidAdjustment"
                min={5}
                max={50}
                step={1}
                value={[settings.bidAdjustmentPercent]}
                onValueChange={(value) => handleSettingChange('bidAdjustmentPercent', value[0])}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Percentage to increase/decrease keyword bids
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minBid">Minimum Bid ($)</Label>
                <Input
                  id="minBid"
                  type="number"
                  min="0.01"
                  max="10"
                  step="0.01"
                  value={settings.minBid}
                  onChange={(e) => handleSettingChange('minBid', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxBid">Maximum Bid ($)</Label>
                <Input
                  id="maxBid"
                  type="number"
                  min="0.01"
                  max="50"
                  step="0.01"
                  value={settings.maxBid}
                  onChange={(e) => handleSettingChange('maxBid', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Automation Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Automation Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="runFrequency">Run Frequency</Label>
              <Select 
                value={settings.runFrequency.toString()}
                onValueChange={(value) => handleSettingChange('runFrequency', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Every hour</SelectItem>
                  <SelectItem value="2">Every 2 hours</SelectItem>
                  <SelectItem value="4">Every 4 hours</SelectItem>
                  <SelectItem value="6">Every 6 hours</SelectItem>
                  <SelectItem value="12">Every 12 hours</SelectItem>
                  <SelectItem value="24">Daily</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How often the optimizer should run automatically
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={settings.isActive}
                onCheckedChange={(value) => handleSettingChange('isActive', value)}
              />
              <Label htmlFor="isActive">Enable automatic optimization</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Turn off to disable all automatic optimization actions
            </p>
          </CardContent>
        </Card>

        {/* Status & Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasChanges && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You have unsaved changes. Click "Save Settings" to apply them.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col space-y-2">
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges || saving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>

            <Separator />
            
            <div className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Configuration Status</span>
                <Badge variant={hasChanges ? "secondary" : "default"}>
                  {hasChanges ? 'Modified' : 'Saved'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="text-sm">Just now</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Settings Info */}
      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <strong>ACOS Threshold:</strong> Campaigns exceeding this threshold will be automatically paused. 
              Set this carefully to avoid pausing profitable campaigns.
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm">
              <strong>Bid Adjustments:</strong> The optimizer will increase bids for performing keywords 
              and decrease bids for underperforming ones within your min/max limits.
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <strong>Run Frequency:</strong> More frequent runs provide faster optimization but may 
              cause instability. 2-4 hours is recommended for most accounts.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
