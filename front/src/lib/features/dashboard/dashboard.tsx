"use client"

import { useUser } from "@/src/lib/features/auth/hooks/use-user"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/lib/components/ui/select"
import { Button } from "@/src/lib/components/ui/button"
import { Input } from "@/src/lib/components/ui/input"
import { Label } from "@/src/lib/components/ui/label"
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-medium text-gray-900">Reddit Monitor</h1>
          <p className="text-sm text-gray-600 mt-1">Manage subreddit configs and view posts</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="border border-gray-200 rounded">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Subreddit Configs</h3>
              </div>
              <div className="p-4">
                <Button 
                  onClick={() => setShowConfigForm(!showConfigForm)}
                  className="w-full mb-4"
                  size="sm"
                >
                  {showConfigForm ? "Cancel" : "Add Config"}
                </Button>

                {showConfigForm && (
                  <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded">
                    <div>
                      <Label htmlFor="subreddit" className="text-xs">Subreddit</Label>
                      <Input
                        id="subreddit"
                        value={newConfig.subreddit}
                        onChange={(e) => setNewConfig({...newConfig, subreddit: e.target.value})}
                        placeholder="webdev"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="agentPrompt" className="text-xs">Agent Prompt</Label>
                      <Input
                        id="agentPrompt"
                        value={newConfig.agentPrompt}
                        onChange={(e) => setNewConfig({...newConfig, agentPrompt: e.target.value})}
                        placeholder="Monitor for job postings"
                        className="text-sm"
                      />
                    </div>
                    <Button onClick={handleCreateConfig} size="sm" className="w-full">
                      Create Config
                    </Button>
                  </div>
                )}

                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                ) : (
                  <div className="space-y-2">
                    {configs.map((config) => (
                      <div key={config.id} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">r/{config.subreddit}</span>
                          <Button
                            onClick={() => handleDeleteConfig(config.id)}
                            size="sm"
                            variant="destructive"
                            className="text-xs px-2 py-1"
                          >
                            Delete
                          </Button>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{config.agentPrompt}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-3">
            <RedditPosts />
          </div>
        </div>
      </div>
    </div>
  )
} 