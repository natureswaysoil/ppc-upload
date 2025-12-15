
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Download
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ControlsPage() {
  const [isRunning, setIsRunning] = useState(true)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [lastRun, setLastRun] = useState('2 hours ago')
  const [nextRun, setNextRun] = useState('In 12 minutes')
  const { toast } = useToast()

  const handleRunNow = async () => {
    setIsOptimizing(true)
    toast({
      title: "Optimization Started",
      description: "Manual optimization run has been triggered.",
    })
    
    // Simulate optimization run
    setTimeout(() => {
      setIsOptimizing(false)
      setLastRun('Just now')
      setNextRun('In 2 hours')
      toast({
        title: "Optimization Complete",
        description: "Manual optimization run completed successfully.",
      })
    }, 5000)
  }

  const handlePauseResume = () => {
    setIsRunning(!isRunning)
    toast({
      title: isRunning ? "Optimizer Paused" : "Optimizer Resumed",
      description: isRunning 
        ? "Automatic optimization has been paused." 
        : "Automatic optimization has been resumed.",
    })
  }

  const handleEmergencyStop = () => {
    setIsRunning(false)
    setIsOptimizing(false)
    toast({
      title: "Emergency Stop Activated",
      description: "All optimization activities have been halted.",
      variant: "destructive"
    })
  }

  const handleExportReport = () => {
    toast({
      title: "Report Export Started",
      description: "Your optimization report is being prepared for download.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Optimizer Controls</h1>
          <p className="text-muted-foreground">
            Manually control your Amazon PPC optimization process
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isOptimizing ? (
            <Badge className="bg-blue-100 text-blue-800 animate-pulse">Optimizing</Badge>
          ) : isRunning ? (
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          ) : (
            <Badge variant="secondary">Paused</Badge>
          )}
        </div>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>System Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                isRunning ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {isRunning ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <Pause className="h-6 w-6 text-gray-600" />
                )}
              </div>
              <h3 className="font-semibold">Scheduler Status</h3>
              <p className="text-sm text-muted-foreground">
                {isRunning ? 'Running' : 'Paused'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-2">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold">Last Run</h3>
              <p className="text-sm text-muted-foreground">{lastRun}</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mb-2">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold">Next Run</h3>
              <p className="text-sm text-muted-foreground">
                {isRunning ? nextRun : 'Scheduled runs paused'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Manual Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full" 
              onClick={handleRunNow}
              disabled={isOptimizing}
            >
              <Play className="h-4 w-4 mr-2" />
              {isOptimizing ? 'Optimizing...' : 'Run Optimizer Now'}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handlePauseResume}
              disabled={isOptimizing}
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Scheduler
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume Scheduler
                </>
              )}
            </Button>
            
            <Separator />
            
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleEmergencyStop}
            >
              <Square className="h-4 w-4 mr-2" />
              Emergency Stop
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reports & Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleExportReport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Current Report
            </Button>
            
            <Button variant="outline" className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear History
            </Button>
            
            <Button variant="outline" className="w-full">
              <Activity className="h-4 w-4 mr-2" />
              View Logs
            </Button>
            
            <Button variant="outline" className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Health Check
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Important Warnings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-yellow-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Important Notes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Manual Run:</strong> Running the optimizer manually will not affect the scheduled runs. 
              The next automatic run will still occur as planned.
            </AlertDescription>
          </Alert>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Emergency Stop:</strong> This will immediately halt all optimization activities 
              and pause the scheduler. Use only when necessary.
            </AlertDescription>
          </Alert>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Pause vs Stop:</strong> Pausing preserves all settings and allows easy resumption. 
              Emergency stop requires manual restart and review.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Current Activity */}
      {isOptimizing && (
        <Card>
          <CardHeader>
            <CardTitle>Current Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Fetching campaign data...</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Analyzing keyword performance...</span>
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm">Applying optimizations...</span>
                <Clock className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm">Generating reports...</span>
                <Clock className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
