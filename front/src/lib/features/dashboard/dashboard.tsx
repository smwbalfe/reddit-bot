"use client"

import { useUser } from "@/src/lib/features/auth/hooks/use-user"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/lib/components/ui/card"
import { Button } from "@/src/lib/components/ui/button"
import { Input } from "@/src/lib/components/ui/input"
import { Label } from "@/src/lib/components/ui/label"
import { Badge } from "@/src/lib/components/ui/badge"
import { createConfig, getUserConfigs, deleteConfig, getUserPosts } from "@/src/lib/actions/create-config"
import { Config, RedditPost } from "@/src/lib/db/schema"

function ConfidenceMeter({ confidence }: { confidence: number | null }) {
  if (!confidence) return null
  
  const getColorClass = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs text-gray-500 font-medium">AI Confidence:</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
        <div
          className={`h-2 rounded-full transition-all ${getColorClass(confidence)}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 font-mono">{confidence}%</span>
    </div>
  )
}

export function Dashboard() {
  const { user } = useUser()
  const [configs, setConfigs] = useState<Config[]>([])
  const [posts, setPosts] = useState<RedditPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfigForm, setShowConfigForm] = useState(false)
  const [expandedConfigs, setExpandedConfigs] = useState<Set<number>>(new Set())
  const [newConfig, setNewConfig] = useState({
    subreddit: "",
    agentPrompt: ""
  })

  useEffect(() => {
    if (user?.id) {
      fetchConfigs()
      fetchPosts()
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

  const fetchPosts = async () => {
    if (!user?.id) return
    try {
      const data = await getUserPosts(user.id)
      setPosts(data)
    } catch (error) {
      console.error('Error fetching posts:', error)
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
      fetchPosts()
    } catch (error) {
      console.error('Error creating config:', error)
    }
  }

  const handleDeleteConfig = async (id: number) => {
    try {
      await deleteConfig(id)
      fetchConfigs()
      fetchPosts()
      setExpandedConfigs(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    } catch (error) {
      console.error('Error deleting config:', error)
    }
  }

  const toggleConfigExpanded = (configId: number) => {
    setExpandedConfigs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(configId)) {
        newSet.delete(configId)
      } else {
        newSet.add(configId)
      }
      return newSet
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-black">Reddit Lead Monitor</h1>
              <p className="text-gray-600 mt-1">Monitor subreddits for potential leads</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{configs.length} monitors</span>
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                {user.email?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <Card className="border border-gray-200">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg font-medium">Add Monitor</CardTitle>
                <CardDescription>Create a new monitor for a subreddit</CardDescription>
              </div>
              <Button 
                onClick={() => setShowConfigForm(!showConfigForm)}
                variant={showConfigForm ? "outline" : "default"}
              >
                {showConfigForm ? "Cancel" : "Add Monitor"}
              </Button>
            </div>
          </CardHeader>

          {showConfigForm && (
            <CardContent className="border-t border-gray-100 pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subreddit">Subreddit</Label>
                  <Input
                    id="subreddit"
                    value={newConfig.subreddit}
                    onChange={(e) => setNewConfig({...newConfig, subreddit: e.target.value})}
                    placeholder="SaaS"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="agentPrompt">What to look for</Label>
                  <Input
                    id="agentPrompt"
                    value={newConfig.agentPrompt}
                    onChange={(e) => setNewConfig({...newConfig, agentPrompt: e.target.value})}
                    placeholder="Posts about scaling issues"
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={handleCreateConfig} 
                  className="w-full"
                  disabled={!newConfig.subreddit || !newConfig.agentPrompt}
                >
                  Create Monitor
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : configs.length === 0 ? (
          <Card className="border border-gray-200">
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No monitors created yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {configs.map((config) => {
              const configPosts = posts.filter(post => post.configId === config.id)
              const isExpanded = expandedConfigs.has(config.id)
              
              return (
                <Card key={config.id} className="border border-gray-200">
                  <CardHeader 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleConfigExpanded(config.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <svg 
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <Badge variant="outline" className="bg-gray-50">
                            r/{config.subreddit}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{config.agentPrompt}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {configPosts.length} {configPosts.length === 1 ? 'post' : 'posts'} found
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteConfig(config.id)
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="border-t border-gray-100 pt-4">
                      {configPosts.length === 0 ? (
                        <div className="text-center py-8">
                          <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          <p className="text-gray-500 text-sm">No posts found yet</p>
                          <p className="text-gray-400 text-xs mt-1">AI is monitoring for relevant posts</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {configPosts.map(post => (
                            <div key={post.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-medium text-gray-900">{post.title}</h5>
                                <Badge variant="outline" className="text-xs bg-white">
                                  {post.category}
                                </Badge>
                              </div>
                              <p className="text-gray-600 text-sm mb-3 leading-relaxed">{post.content}</p>
                              <ConfidenceMeter confidence={post.confidence} />
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">
                                  {new Date(post.createdAt).toLocaleDateString()}
                                </span>
                                <a 
                                  href={post.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  View Post →
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 