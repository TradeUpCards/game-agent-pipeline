'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Key, Save, Eye, EyeOff } from 'lucide-react'

export default function SettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)

  const saveSettings = () => {
    // TODO: Implement actual settings save
    localStorage.setItem('openai_api_key', apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="container mx-auto py-6 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Configure your API keys and application preferences
            </p>
          </div>

          {/* API Keys */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Configure API keys for AI services and external integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full pr-10 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Required for content annotation and Q&A generation
                </p>
              </div>

              <Button onClick={saveSettings} disabled={!apiKey}>
                <Save className="mr-2 h-4 w-4" />
                {saved ? 'Saved!' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>

          {/* Application Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Application Settings
              </CardTitle>
              <CardDescription>
                General application preferences and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Dark Mode</label>
                  <p className="text-xs text-muted-foreground">
                    Use dark theme throughout the application
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Auto-refresh Data</label>
                  <p className="text-xs text-muted-foreground">
                    Automatically refresh file lists and statistics
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Default Output Directory
                </label>
                <input
                  type="text"
                  defaultValue="diablo-agent-training"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Game Agent Pipeline</strong> v1.0.0</p>
                <p>AI Training Data Pipeline for Game Agents</p>
                <p className="text-muted-foreground">
                  Built with Next.js, TypeScript, and Tailwind CSS
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}