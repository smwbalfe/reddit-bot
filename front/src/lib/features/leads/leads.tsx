'use client'

import React from "react"
import { useUser } from "@/src/lib/features/auth/hooks/use-user"
import { useState, useEffect } from "react"
import { useUsage } from "@/src/lib/features/global/hooks/use-usage"
import { Card, CardContent, CardHeader, CardDescription } from "@/src/lib/components/ui/card"
import { Button } from "@/src/lib/components/ui/button"
import { Badge } from "@/src/lib/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/lib/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/src/lib/components/ui/tooltip"
import { getUserConfigs } from "@/src/lib/actions/config/get-user-configs"
import { getUserPosts } from "@/src/lib/actions/config/get-user-posts"
import { generateReplyAction } from "@/src/lib/actions/generate-reply"
import { resetPollPeriod, getScraperStatus } from "@/src/lib/actions/system/set-system-flag"
import { ICP } from "@/src/lib/db/schema"
import { PostWithConfigId } from "@/src/lib/types"
import { MessageSquare, TrendingUp, ExternalLink, Package, Bot, ChevronDown, ChevronUp, RefreshCw, RotateCcw, Pause, Play } from "lucide-react"
import DashboardLayout from '@/src/lib/features/global/dashboard-layout'
import Link from 'next/link'
import { InterestLabel } from "@/src/lib/features/leads/components/interest-label"

export function LeadsPage() {
  const { user } = useUser()
  const { usage } = useUsage()
  const [configs, setConfigs] = useState<ICP[]>([])
  const [posts, setPosts] = useState<PostWithConfigId[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [generatingReply, setGeneratingReply] = useState<Set<number>>(new Set())
  const [replies, setReplies] = useState<Map<number, string>>(new Map())
  const [refreshing, setRefreshing] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [scraperPaused, setScraperPaused] = useState(false)


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
      fetchScraperStatus()
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return

    const interval = setInterval(() => {
      fetchScraperStatus()
    }, 30000) // Check status every 30 seconds

    return () => clearInterval(interval)
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

  const fetchScraperStatus = async () => {
    try {
      const status = await getScraperStatus()
      setScraperPaused(status.isPaused)
    } catch (error) {
      console.error('Error fetching scraper status:', error)
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
      const result = await generateReplyAction({
        icpId: config.id,
        redditPost: `${post.title}\n\n${post.content}`
      })
     
      const newReplies = new Map(replies)
      
      if (result.success && result.reply) {
        newReplies.set(post.id, result.reply)
        const newExpanded = new Set(expandedRows)
        newExpanded.add(post.id)
        setExpandedRows(newExpanded)
      } else {
        newReplies.set(post.id, result.error || 'Failed to generate reply. Please try again.')
      }
      
      setReplies(newReplies)
      
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

  const handleScanNow = async () => {
    setRefreshing(true)
    try {
      await resetPollPeriod()
      setScraperPaused(false)
      setTimeout(() => {
        fetchPosts()
        fetchScraperStatus()
      }, 3000)
    } catch (error) {
      console.error('Error triggering scanner:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleRefreshPage = async () => {
    setFetching(true)
    try {
      await fetchPosts()
      await fetchScraperStatus()
    } catch (error) {
      console.error('Error refreshing page:', error)
    } finally {
      setFetching(false)
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
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-slate-500" />
                    <span className="text-base font-medium text-slate-700">{configs.length}</span>
                    <span className="text-base text-slate-500">active products</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-slate-500" />
                    <span className="text-base font-medium text-slate-700">
                      {usage?.leadCount || posts.length}
                      {usage && !usage.isSubscribed && (
                        <span className="text-slate-400">/{usage.limit}</span>
                      )}
                    </span>
                    <span className="text-base text-slate-500">
                      {usage?.isAtLimit ? 'leads (limit reached)' : 'total leads'}
                      {usage && !usage.isSubscribed && usage.isAtLimit && (
                        <span className="text-orange-600 font-medium"> - upgrade for more</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {scraperPaused ? (
                      <Pause className="w-5 h-5 text-orange-500" />
                    ) : (
                      <Play className="w-5 h-5 text-green-500" />
                    )}
                    <span className="text-base font-medium text-slate-700">
                      {scraperPaused ? 'Paused' : 'Active'}
                    </span>
                    <span className="text-base text-slate-500">scanner</span>
                  </div>
                </div>
              </div>
              <TooltipProvider delayDuration={300}>
                <div className="flex gap-2 flex-wrap">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleRefreshPage}
                        disabled={fetching}
                        variant="ghost"
                        className="text-slate-600 hover:bg-slate-100"
                        size="default"
                      >
                        <RotateCcw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
                        {fetching ? 'Loading...' : 'Refresh'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="center" className="bg-slate-900 text-white border-slate-800">
                      <p>Reload leads from database</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {scraperPaused && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleScanNow}
                          disabled={refreshing}
                          variant="default"
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                          size="default"
                        >
                          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                          {refreshing ? 'Waking Scanner...' : 'Wake Scanner'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="center" className="bg-slate-900 text-white border-slate-800">
                        <p>Wake up the scanner to find new leads immediately</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href="/icps">
                        <Button 
                          variant="default"
                          className="bg-slate-900 hover:bg-slate-800 text-white"
                          size="default"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Manage Products
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="center" className="bg-slate-900 text-white border-slate-800">
                      <p>Manage your products & targeting</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
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

            <div className="w-full">
              <Card className="border border-slate-200 shadow-sm bg-white hidden md:block">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table className="border-separate border-spacing-0 w-full">
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead className="font-semibold border-b border-slate-200 py-4 px-6 w-32">Subreddit</TableHead>
                        <TableHead className="font-semibold border-b border-slate-200 py-4 px-6 w-40">Product</TableHead>
                        <TableHead className="font-semibold border-b border-slate-200 py-4 px-6 w-24">Interest</TableHead>
                        <TableHead className="font-semibold border-b border-slate-200 py-4 px-6">Title</TableHead>
                        <TableHead className="font-semibold border-b border-slate-200 py-4 px-6 w-28">Posted</TableHead>
                        <TableHead className="font-semibold text-center border-b border-slate-200 py-4 px-6 w-48">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.map(post => {
                        const config = configs.find(c => c.id === post.configId)
                        const isExpanded = expandedRows.has(post.id)
                        const isGenerating = generatingReply.has(post.id)
                        const reply = replies.get(post.id)
                        
                        return (
                          <React.Fragment key={post.id}>
                            <TableRow className="hover:bg-slate-50/50 border-b border-slate-100">
                              <TableCell className="py-4 px-6 w-32">
                                <Badge variant="secondary" className="text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200">
                                  r/{post.subreddit}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4 px-6 w-40">
                                <Badge variant="secondary" className="text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center gap-1 w-fit">
                                  <Package className="w-3 h-3" />
                                  {config?.name || 'Unknown Product'}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4 px-6 w-24">
                                <InterestLabel leadQuality={post.leadQuality ?? null} />
                              </TableCell>
                              <TableCell className="py-4 px-6">
                                <a 
                                  href={post.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="font-medium text-slate-900 hover:text-slate-700 cursor-pointer transition-colors block"
                                >
                                  {post.title}
                                </a>
                              </TableCell>
                              <TableCell className="text-slate-500 text-sm py-4 px-6 w-28">
                                {getRelativeTime(post.redditCreatedAt || post.createdAt)}
                              </TableCell>
                              <TableCell className="py-4 px-6 w-48">
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
                           cd                     className="text-xs"
                                              >
                                                Copy & Go to Reddit
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
                          </React.Fragment>
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
