'use client'

import { useUser } from "@/src/lib/features/auth/hooks/use-user"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardDescription } from "@/src/lib/components/ui/card"
import { Button } from "@/src/lib/components/ui/button"
import { Badge } from "@/src/lib/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/lib/components/ui/table"
import { getUserConfigs, getUserPosts } from "@/src/lib/actions/create-config"
import { ICP } from "@/src/lib/db/schema"
import { PostWithConfigId } from "@/src/lib/types"
import { MessageSquare, TrendingUp, ExternalLink, Package, Bot, ChevronDown, ChevronUp } from "lucide-react"
import DashboardLayout from '@/src/lib/components/dashboard-layout'
import Link from 'next/link'


function FuelGauge({ percentage, color }: { percentage: number; color: string }) {
  const angle = 180 - (percentage / 100) * 180
  
  return (
    <div className="relative w-12 h-6">
      <svg width="48" height="24" viewBox="0 0 48 24" className="overflow-visible">
        {Array.from({ length: 20 }, (_, i) => {
          const segmentAngle = 180 - (i * 9)
          const x1 = 24 + 18 * Math.cos((segmentAngle * Math.PI) / 180)
          const y1 = 24 - 18 * Math.sin((segmentAngle * Math.PI) / 180)
          const x2 = 24 + 14 * Math.cos((segmentAngle * Math.PI) / 180)
          const y2 = 24 - 14 * Math.sin((segmentAngle * Math.PI) / 180)
          
          let segmentColor = '#e2e8f0'
          if (i <= 6) segmentColor = '#f87171'
          else if (i <= 13) segmentColor = '#fb923c'
          else segmentColor = '#4ade80'
          
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={segmentColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          )
        })}
        
        <line
          x1="24"
          y1="24"
          x2={24 + 16 * Math.cos((angle * Math.PI) / 180)}
          y2={24 - 16 * Math.sin((angle * Math.PI) / 180)}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          markerEnd="url(#arrowhead)"
        />
        
        <circle
          cx="24"
          cy="24"
          r="2"
          fill={color}
        />
        
        <defs>
          <marker
            id="arrowhead"
            markerWidth="6"
            markerHeight="4"
            refX="6"
            refY="2"
            orient="auto"
          >
            <polygon points="0 0, 6 2, 0 4" fill={color} />
          </marker>
        </defs>
      </svg>
    </div>
  )
}

function InterestLabel({ leadQuality }: { leadQuality: number | null }) {
  if (!leadQuality) return null
  
  let color, bgColor, label
  
  if (leadQuality <= 10) {
    color = '#dc2626'
    bgColor = 'bg-red-100'
    label = 'Never'
  } else if (leadQuality <= 20) {
    color = '#ea580c'
    bgColor = 'bg-orange-100'
    label = 'Minimal'
  } else if (leadQuality <= 40) {
    color = '#d97706'
    bgColor = 'bg-amber-100'
    label = 'Moderate'
  } else if (leadQuality <= 60) {
    color = '#ca8a04'
    bgColor = 'bg-yellow-100'
    label = 'Genuine'
  } else if (leadQuality <= 80) {
    color = '#65a30d'
    bgColor = 'bg-lime-100'
    label = 'Strong'
  } else {
    color = '#16a34a'
    bgColor = 'bg-green-100'
    label = 'Ready'
  }
  
  return (
    <div className="flex flex-col items-center gap-2">
      <FuelGauge percentage={leadQuality} color={color} />
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-bold" style={{ color }}>{leadQuality}%</span>
        <span 
          className={`text-xs font-semibold px-2 py-1 rounded-full ${bgColor}`}
          style={{ color }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}


export function LeadsPage() {
  const { user } = useUser()
  const [configs, setConfigs] = useState<ICP[]>([])
  const [posts, setPosts] = useState<PostWithConfigId[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [generatingReply, setGeneratingReply] = useState<Set<number>>(new Set())
  const [replies, setReplies] = useState<Map<number, string>>(new Map())

  const getRelativeTime = (date: Date | null): string => {
    if (!date) return 'Unknown'
    
    const now = new Date()
    const diffInMs = now.getTime() - new Date(date).getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`
    } else {
      const diffInWeeks = Math.floor(diffInDays / 7)
      return `${diffInWeeks}w ago`
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchConfigs()
      fetchPosts()
    }
  }, [user?.id])

  const fetchConfigs = async () => {
    if (!user?.id) return
    try {
      const data = await getUserConfigs()
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
      const data = await getUserPosts()
      if (!data || !Array.isArray(data)) {
        setPosts([])
        return
      }
      const filteredData = data.filter(post => {
        return !post.title.toLowerCase().includes('[go]') && !post.title.toLowerCase().includes('(go)')
      })
      const sortedData = filteredData.sort((a, b) => {
        const scoreA = a.leadQuality ?? 0
        const scoreB = b.leadQuality ?? 0
        return scoreB - scoreA
      })
      setPosts(sortedData)
    } catch (error) {
      console.error('Error fetching posts:', error)
      setPosts([])
    }
  }

  const toggleRowExpansion = (postId: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
    }
    setExpandedRows(newExpanded)
  }

  const generateReply = async (post: PostWithConfigId) => {
    const config = configs.find(c => c.id === post.configId)
    if (!config) return

    const newGenerating = new Set(generatingReply)
    newGenerating.add(post.id)
    setGeneratingReply(newGenerating)

    try {
      const response = await fetch('http://localhost:8000/api/generate-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reddit_post: `${post.title}\n\n${post.content}`,
          product_description: config.data?.description || config.name
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate reply')
      }
      
      const data = await response.json()
      const newReplies = new Map(replies)
      newReplies.set(post.id, data.reply)
      setReplies(newReplies)
      
      // Auto-expand the row to show the reply
      const newExpanded = new Set(expandedRows)
      newExpanded.add(post.id)
      setExpandedRows(newExpanded)
      
    } catch (error) {
      console.error('Error generating reply:', error)
      const newReplies = new Map(replies)
      newReplies.set(post.id, 'Failed to generate reply. Please try again.')
      setReplies(newReplies)
    } finally {
      const newGenerating = new Set(generatingReply)
      newGenerating.delete(post.id)
      setGeneratingReply(newGenerating)
    }
  }


  if (!user) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-8">
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div className="space-y-3">
                <CardDescription className="text-base text-slate-600">View leads with detailed AI insights and manage your products (ideal customer profiles)</CardDescription>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-slate-500" />
                    <span className="text-base font-medium text-slate-700">{configs.length}</span>
                    <span className="text-base text-slate-500">active products</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-slate-500" />
                    <span className="text-base font-medium text-slate-700">{posts.length}</span>
                    <span className="text-base text-slate-500">total leads</span>
                  </div>
                </div>
              </div>
              <Link href="/icps">
                <Button 
                  variant="default"
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                  size="default"
                >
                  <ExternalLink className="w-5 h-5" />
                  Manage Products
                </Button>
              </Link>
            </div>
          </CardHeader>

        </Card>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-600"></div>
          </div>
        ) : configs.length === 0 ? (
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="text-center py-20">
              <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-6" />
              <p className="text-slate-500 text-xl font-medium">No products yet</p>
              <p className="text-slate-400 text-base mt-3">Create your first product to get started</p>
            </CardContent>
          </Card>
        ) : posts.length === 0 ? (
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="text-center py-20">
              <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-6" />
              <p className="text-slate-500 text-xl font-medium">No leads found yet</p>
              <p className="text-slate-400 text-base mt-3">AI is monitoring for relevant posts</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="block md:hidden space-y-4">
              {posts.map(post => {
                const config = configs.find(c => c.id === post.configId)
                const isExpanded = expandedRows.has(post.id)
                const isGenerating = generatingReply.has(post.id)
                const reply = replies.get(post.id)
                
                return (
                  <Card key={post.id} className="border border-slate-200 shadow-sm bg-white">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs font-medium bg-slate-100 text-slate-700">
                              r/{post.subreddit}
                            </Badge>
                            <Badge variant="secondary" className="text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {config?.name || 'Unknown'}
                            </Badge>
                          </div>
                          <InterestLabel leadQuality={post.leadQuality ?? null} />
                        </div>
                        
                        <a 
                          href={post.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-slate-900 hover:text-slate-700 cursor-pointer transition-colors line-clamp-2 block"
                          title={post.title}
                        >
                          {post.title}
                        </a>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-slate-500 text-sm">
                            {getRelativeTime(post.redditCreatedAt || post.createdAt)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => generateReply(post)}
                              disabled={isGenerating}
                              variant="ghost"
                              size="sm"
                              className="text-green-700 hover:text-green-800 hover:bg-green-50 text-xs"
                            >
                              <Bot className="w-3 h-3 mr-1" />
                              {isGenerating ? 'Generating...' : 'Reply'}
                            </Button>
                            <Button
                              onClick={() => toggleRowExpansion(post.id)}
                              variant="ghost"
                              size="sm"
                              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-2"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </Button>
                            <Link href={`/leads/${post.id}`}>
                              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-700 hover:bg-slate-100 text-xs">
                                Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                            <div>
                              <h4 className="font-semibold text-slate-900 mb-2 text-sm flex items-center gap-2">
                                <Bot className="w-4 h-4 text-green-600" />
                                Generated Reply
                              </h4>
                              {reply ? (
                                <div className="space-y-2">
                                  <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-sm text-slate-700 leading-relaxed min-h-16 max-h-32 overflow-y-auto break-words whitespace-pre-wrap">
                                    {reply}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={async () => {
                                        await navigator.clipboard.writeText(reply)
                                        window.open(post.url, '_blank')
                                      }}
                                      variant="outline"
                                      size="sm"
                                      className="text-xs"
                                    >
                                      Copy & Go to Reddit
                                    </Button>
                                    <Button
                                      onClick={() => generateReply(post)}
                                      disabled={isGenerating}
                                      variant="outline"
                                      size="sm"
                                      className="text-xs"
                                    >
                                      Regenerate
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-xs text-slate-500 text-center">
                                  Click "Reply" to generate an AI response
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="max-w-6xl">
              <Card className="border border-slate-200 shadow-sm bg-white hidden md:block">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table className="border-separate border-spacing-0">
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead className="font-semibold border-b border-slate-200 py-4 px-6 w-24">Subreddit</TableHead>
                        <TableHead className="font-semibold border-b border-slate-200 py-4 px-6 w-32">Product</TableHead>
                        <TableHead className="font-semibold border-b border-slate-200 py-4 px-6 w-20">Interest</TableHead>
                        <TableHead className="font-semibold border-b border-slate-200 py-4 px-6 max-w-sm">Title</TableHead>
                        <TableHead className="font-semibold border-b border-slate-200 py-4 px-6 w-24">Posted</TableHead>
                        <TableHead className="font-semibold text-center border-b border-slate-200 py-4 px-6 w-40">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.map(post => {
                        const config = configs.find(c => c.id === post.configId)
                        const isExpanded = expandedRows.has(post.id)
                        const isGenerating = generatingReply.has(post.id)
                        const reply = replies.get(post.id)
                        
                        return (
                          <>
                            <TableRow key={post.id} className="hover:bg-slate-50/50 border-b border-slate-100">
                              <TableCell className="py-4 px-6 w-24">
                                <Badge variant="secondary" className="text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200">
                                  r/{post.subreddit}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4 px-6 w-32">
                                <Badge variant="secondary" className="text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center gap-1 w-fit">
                                  <Package className="w-3 h-3" />
                                  {config?.name || 'Unknown Product'}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4 px-6 w-20">
                                <InterestLabel leadQuality={post.leadQuality ?? null} />
                              </TableCell>
                              <TableCell className="py-4 px-6 max-w-sm">
                                <a 
                                  href={post.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="font-medium text-slate-900 hover:text-slate-700 cursor-pointer transition-colors line-clamp-2 block"
                                >
                                  {post.title}
                                </a>
                              </TableCell>
                              <TableCell className="text-slate-500 text-sm py-4 px-6 w-24">
                                {getRelativeTime(post.redditCreatedAt || post.createdAt)}
                              </TableCell>
                              <TableCell className="py-4 px-6 w-40">
                                <div className="flex items-center gap-2">
                                  <Button
                                    onClick={() => generateReply(post)}
                                    disabled={isGenerating}
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-700 hover:text-green-800 hover:bg-green-50 text-xs flex-shrink-0"
                                  >
                                    <Bot className="w-3 h-3 mr-1" />
                                    {isGenerating ? 'Generating...' : 'Reply'}
                                  </Button>
                                  <Button
                                    onClick={() => toggleRowExpansion(post.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-2"
                                  >
                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  </Button>
                                  <Link href={`/leads/${post.id}`}>
                                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-700 hover:bg-slate-100 text-xs">
                                      Details
                                    </Button>
                                  </Link>
                                </div>
                              </TableCell>
                            </TableRow>
                            {isExpanded && (
                              <TableRow className="bg-slate-50/30">
                                <TableCell colSpan={6} className="py-4 px-6">
                                  <div className="max-w-4xl">
                                    <div>
                                      <div>
                                        <h4 className="font-semibold text-slate-900 mb-2 text-sm flex items-center gap-2">
                                          <Bot className="w-4 h-4 text-green-600" />
                                          Generated Reply
                                        </h4>
                                        {reply ? (
                                          <div className="space-y-2">
                                            <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-sm text-slate-700 leading-relaxed min-h-24 max-h-48 overflow-y-auto break-words whitespace-pre-wrap">
                                              {reply}
                                            </div>
                                            <div className="flex gap-2">
                                              <Button
                                                onClick={async () => {
                                                  await navigator.clipboard.writeText(reply)
                                                  window.open(post.url, '_blank')
                                                }}
                                                variant="outline"
                                                size="sm"
                                                className="text-xs"
                                              >
                                                Copy & Go to Reddit
                                              </Button>
                                              <Button
                                                onClick={() => generateReply(post)}
                                                disabled={isGenerating}
                                                variant="outline"
                                                size="sm"
                                                className="text-xs"
                                              >
                                                Regenerate
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-xs text-slate-500 flex items-center justify-center">
                                            Click "Reply" to generate an AI response
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
