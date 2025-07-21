"use client"

import { useUser } from "@/src/lib/features/auth/hooks/use-user"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/lib/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/lib/components/ui/select"
import { Button } from "@/src/lib/components/ui/button"
import { Input } from "@/src/lib/components/ui/input"
import { Label } from "@/src/lib/components/ui/label"
import { Badge } from "@/src/lib/components/ui/badge"
import { RedditPosts } from "./reddit-posts"
import { createConfig, getUserConfigs, deleteConfig } from "@/src/lib/actions/create-config"
import { Config } from "@/src/lib/db/schema"

export function Dashboard() {
  const { user } = useUser()
  const [selectedSubreddit, setSelectedSubreddit] = useState("")
  const [configs, setConfigs] = useState<Config[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfigForm, setShowConfigForm] = useState(false)
  const [newConfig, setNewConfig] = useState({
    subreddit: "",
    agentPrompt: ""
  })

  useEffect(() => {
    if (user?.id) {
      fetchConfigs()
    }
  }, [user?.id])

  const fetchConfigs = async () => {
    if (!user?.id) return
    try {
      const data = await getUserConfigs(user.id)
      setConfigs(data)
    } catch (error) {
      console.error('Error fetching configs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateConfig = async () => {
    if (!user?.id || !newConfig.subreddit || !newConfig.agentPrompt) return
    
    try {
      await createConfig({
        userId: user.id,
        subreddit: newConfig.subreddit,
        agentPrompt: newConfig.agentPrompt
      })
      setNewConfig({ subreddit: "", agentPrompt: "" })
      setShowConfigForm(false)
      fetchConfigs()
    } catch (error) {
      console.error('Error creating config:', error)
    }
  }

  const handleDeleteConfig = async (id: number) => {
    try {
      await deleteConfig(id)
      fetchConfigs()
    } catch (error) {
      console.error('Error deleting config:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-purple-200 rounded-full animate-ping"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="backdrop-blur-sm bg-white/30 border-b border-white/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Reddit Monitors
              </h1>
              <p className="text-gray-600 mt-2 font-medium">Monitor subreddits and manage your content strategy</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                {configs.length} Active Configs
              </Badge>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                {user.email?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  Subreddit Configs
                </CardTitle>
                <CardDescription>
                  Manage your monitoring configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => setShowConfigForm(!showConfigForm)}
                  className={`w-full transition-all duration-200 ${
                    showConfigForm 
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200" 
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                  }`}
                  variant={showConfigForm ? "outline" : "default"}
                >
                  {showConfigForm ? "✕ Cancel" : "+ Add Config"}
                </Button>

                {showConfigForm && (
                  <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="subreddit" className="text-sm font-medium text-gray-700">
                          Subreddit
                        </Label>
                        <Input
                          id="subreddit"
                          value={newConfig.subreddit}
                          onChange={(e) => setNewConfig({...newConfig, subreddit: e.target.value})}
                          placeholder="webdev"
                          className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="agentPrompt" className="text-sm font-medium text-gray-700">
                          Agent Prompt
                        </Label>
                        <Input
                          id="agentPrompt"
                          value={newConfig.agentPrompt}
                          onChange={(e) => setNewConfig({...newConfig, agentPrompt: e.target.value})}
                          placeholder="Monitor for job postings"
                          className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                        />
                      </div>
                      <Button 
                        onClick={handleCreateConfig} 
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        disabled={!newConfig.subreddit || !newConfig.agentPrompt}
                      >
                        ✓ Create Config
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="relative">
                      <div className="w-8 h-8 border-3 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {configs.length === 0 ? (
                      <div className="text-center py-8 px-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-sm">No configs yet</p>
                        <p className="text-gray-400 text-xs mt-1">Create your first configuration to get started</p>
                      </div>
                    ) : (
                      configs.map((config) => (
                        <Card key={config.id} className="border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-md bg-white">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-mono text-xs">
                                  r/{config.subreddit}
                                </Badge>
                              </div>
                              <Button
                                onClick={() => handleDeleteConfig(config.id)}
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                              >
                                ✕
                              </Button>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">{config.agentPrompt}</p>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-3">
            <RedditPosts />
          </div>
        </div>
      </div>
    </div>
  )
} 