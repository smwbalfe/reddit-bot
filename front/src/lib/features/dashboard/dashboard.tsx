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
import { Plus, ChevronRight, Trash2, MessageSquare, TrendingUp, Activity } from "lucide-react"

function ConfidenceMeter({ confidence }: { confidence: number | null }) {
  if (!confidence) return null
  
  const getColorClass = (score: number) => {
    if (score >= 80) return "bg-emerald-500"
    if (score >= 60) return "bg-amber-500"
    return "bg-rose-500"
  }

  const getTextColor = (score: number) => {
    if (score >= 80) return "text-emerald-700"
    if (score >= 60) return "text-amber-700"
    return "text-rose-700"
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Activity className="w-3 h-3 text-slate-500" />
        <span className="text-xs text-slate-600 font-medium">Confidence</span>
      </div>
      <div className="flex-1 bg-slate-100 rounded-full h-1.5 max-w-20">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${getColorClass(confidence)}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${getTextColor(confidence)}`}>{confidence}%</span>
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Reddit Monitor</h1>
              <p className="text-lg text-slate-600">Track opportunities across subreddits</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-slate-500" />
                  <span className="text-base font-medium text-slate-700">{configs.length}</span>
                  <span className="text-base text-slate-500">monitors</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-base font-semibold text-slate-700 ring-1 ring-slate-200">
                {user.email?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-semibold text-slate-900">New Monitor</CardTitle>
                <CardDescription className="text-base text-slate-600">Set up monitoring for a subreddit</CardDescription>
              </div>
              <Button 
                onClick={() => setShowConfigForm(!showConfigForm)}
                variant={showConfigForm ? "outline" : "default"}
                className={showConfigForm ? "" : "bg-slate-900 hover:bg-slate-800 text-white"}
                size="default"
              >
                <Plus className="w-5 h-5" />
                {showConfigForm ? "Cancel" : "Add Monitor"}
              </Button>
            </div>
          </CardHeader>

          {showConfigForm && (
            <CardContent className="border-t border-slate-100 pt-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="subreddit" className="text-base font-medium text-slate-700">Subreddit</Label>
                  <Input
                    id="subreddit"
                    value={newConfig.subreddit}
                    onChange={(e) => setNewConfig({...newConfig, subreddit: e.target.value})}
                    placeholder="SaaS"
                    className="border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="agentPrompt" className="text-base font-medium text-slate-700">What to look for</Label>
                  <Input
                    id="agentPrompt"
                    value={newConfig.agentPrompt}
                    onChange={(e) => setNewConfig({...newConfig, agentPrompt: e.target.value})}
                    placeholder="Posts about scaling issues"
                    className="border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                  />
                </div>
                <Button 
                  onClick={handleCreateConfig} 
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                  disabled={!newConfig.subreddit || !newConfig.agentPrompt}
                >
                  Create Monitor
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-600"></div>
          </div>
        ) : configs.length === 0 ? (
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="text-center py-20">
              <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-6" />
              <p className="text-slate-500 text-xl font-medium">No monitors yet</p>
              <p className="text-slate-400 text-base mt-3">Create your first monitor to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {configs.map((config) => {
              const configPosts = posts.filter(post => post.configId === config.id)
              const isExpanded = expandedConfigs.has(config.id)
              
              return (
                <Card key={config.id} className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-200">
                  <CardHeader 
                    className="cursor-pointer hover:bg-slate-50 transition-colors duration-150 rounded-t-xl"
                    onClick={() => toggleConfigExpanded(config.id)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <ChevronRight 
                            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                          />
                          <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 font-semibold text-base px-4 py-2">
                            r/{config.subreddit}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium text-slate-900 truncate">{config.agentPrompt}</p>
                          <p className="text-sm text-slate-500 mt-2 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            {configPosts.length} {configPosts.length === 1 ? 'post' : 'posts'}
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
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="border-t border-slate-100 pt-6">
                      {configPosts.length === 0 ? (
                        <div className="text-center py-16">
                          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500 text-base font-medium">No posts found yet</p>
                          <p className="text-slate-400 text-sm mt-2">AI is monitoring for relevant posts</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {configPosts.map(post => (
                            <div key={post.id} className="border border-slate-200 rounded-lg p-6 bg-slate-50 hover:bg-white hover:shadow-sm transition-all duration-200">
                              <div className="flex justify-between items-start mb-4">
                                <h5 className="font-semibold text-lg text-slate-900 leading-snug">{post.title}</h5>
                                <Badge variant="outline" className="text-sm bg-white border-slate-200 text-slate-600 ml-4 shrink-0 px-3 py-1">
                                  {post.category}
                                </Badge>
                              </div>
                              <p className="text-slate-600 text-base mb-5 leading-relaxed">{post.content}</p>
                              <div className="mb-5">
                                <ConfidenceMeter confidence={post.confidence} />
                              </div>
                              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                                <span className="text-sm text-slate-500 font-medium">
                                  {new Date(post.createdAt).toLocaleDateString()}
                                </span>
                                <a 
                                  href={post.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-slate-900 hover:text-slate-700 text-base font-medium flex items-center gap-2 group"
                                >
                                  View Post
                                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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