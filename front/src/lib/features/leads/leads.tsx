'use client'

import React from "react"
import { useSession } from "@/src/lib/features/auth/hooks/use-session"
import { useState, useEffect } from "react"
import { useUsage } from "@/src/lib/features/global/hooks/use-usage"
import { Card, CardContent, CardHeader, CardDescription } from "@/src/lib/components/ui/card"
import { Button } from "@/src/lib/components/ui/button"
import { Badge } from "@/src/lib/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/lib/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/src/lib/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/src/lib/components/ui/tabs"
import { getUserConfigs } from "@/src/lib/actions/config/get-user-configs"
import { getUserPosts } from "@/src/lib/actions/config/get-user-posts"
import { generateReplyAction } from "@/src/lib/actions/generate-reply"
import { resetPollPeriod, getScraperStatus } from "@/src/lib/actions/system/set-system-flag"
import { forceScrape } from "@/src/lib/actions/system/force-scrape"
import { getNextScrapeTime } from "@/src/lib/actions/config/get-next-scrape-time"
import { updateLeadStatus } from "@/src/lib/actions/config/update-lead-status"
import { ICP } from "@/src/lib/db/schema"
import { PostWithConfigId } from "@/src/lib/types"
import { MessageSquare, TrendingUp, ExternalLink, Package, Bot, ChevronDown, ChevronUp, RefreshCw, RotateCcw, Pause, Play, Clock, Eye, EyeOff, MessageCircle, CheckCircle } from "lucide-react"
import DashboardLayout from '@/src/lib/features/global/dashboard-layout'
import Link from 'next/link'
import { InterestLabel } from "@/src/lib/features/leads/components/interest-label"

export function LeadsPage() {
  const { user } = useSession()
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
  const [nextScrapeData, setNextScrapeData] = useState<{next_run_time: string, seconds_until_next_run: number} | null>(null)
  const [forcingScrape, setForcingScrape] = useState(false)
  const [activeProductTab, setActiveProductTab] = useState<string>('all')
  const [activeStatusTab, setActiveStatusTab] = useState<string>('all')
  const [updatingStatus, setUpdatingStatus] = useState<Set<number>>(new Set())


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
      fetchNextScrapeTime()
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return

    const interval = setInterval(() => {
      fetchScraperStatus()
      fetchNextScrapeTime()
    }, 10000) 

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

  const fetchNextScrapeTime = async () => {
    if (!user?.id) return
    try {
      const result = await getNextScrapeTime()
      if (result.success && result.data) {
        setNextScrapeData(result.data)
      }
    } catch (error) {
      console.error('Error fetching next scrape time:', error)
    }
  }

  const formatTimeUntilNext = (seconds: number): string => {
    if (seconds <= 0) return 'Running now'
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  const getFilteredPosts = () => {
    let filteredPosts = posts

    if (activeProductTab !== 'all') {
      filteredPosts = filteredPosts.filter(post => post.configId.toString() === activeProductTab)
    }

    if (activeStatusTab !== 'all') {
      filteredPosts = filteredPosts.filter(post => post.leadStatus === activeStatusTab)
    }

    return filteredPosts
  }

  const updatePostStatus = async (postId: number, status: 'new' | 'seen' | 'responded') => {
    const newUpdating = new Set(updatingStatus)
    newUpdating.add(postId)
    setUpdatingStatus(newUpdating)

    try {
      const result = await updateLeadStatus(postId, status)
      if (result.success) {
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId ? { ...post, leadStatus: status } : post
          )
        )
      } else {
        console.error('Failed to update status:', result.error)
      }
    } catch (error) {
      console.error('Error updating lead status:', error)
    } finally {
      const newUpdating2 = new Set(updatingStatus)
      newUpdating2.delete(postId)
      setUpdatingStatus(newUpdating2)
    }
  }

  const getStatusBadge = (status: 'new' | 'seen' | 'responded') => {
    switch (status) {
      case 'new':
        return (
          <Badge variant="secondary" className="text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            New
          </Badge>
        )
      case 'seen':
        return (
          <Badge variant="secondary" className="text-xs font-medium bg-orange-100 text-orange-700 flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Seen
          </Badge>
        )
      case 'responded':
        return (
          <Badge variant="secondary" className="text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Responded
          </Badge>
        )
    }
  }

  const getStatusCounts = () => {
    const relevantPosts = activeProductTab === 'all' 
      ? posts 
      : posts.filter(post => post.configId.toString() === activeProductTab)
    
    return {
      total: relevantPosts.length,
      new: relevantPosts.filter(p => p.leadStatus === 'new').length,
      seen: relevantPosts.filter(p => p.leadStatus === 'seen').length,
      responded: relevantPosts.filter(p => p.leadStatus === 'responded').length
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

  const handleForceScrape = async () => {
    setForcingScrape(true)
    try {
      const result = await forceScrape()
      if (result.success) {
        setTimeout(() => {
          fetchPosts()
          fetchScraperStatus()
          fetchNextScrapeTime()
        }, 3000)
      } else {
        console.error('Error forcing scrape:', result.error)
      }
    } catch (error) {
      console.error('Error triggering force scrape:', error)
    } finally {
      setForcingScrape(false)
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
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-500" />
                    <span className="text-base font-medium text-slate-700">
                      {nextScrapeData ? formatTimeUntilNext(nextScrapeData.seconds_until_next_run) : 'N/A'}
                    </span>
                    <span className="text-base text-slate-500">next scan</span>
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
                      <Button
                        onClick={handleForceScrape}
                        disabled={forcingScrape}
                        variant="default"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        size="default"
                      >
                        <RefreshCw className={`w-4 h-4 ${forcingScrape ? 'animate-spin' : ''}`} />
                        {forcingScrape ? 'Scraping...' : 'Force Scrape Now'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="center" className="bg-slate-900 text-white border-slate-800">
                      <p>Force a new scrape cycle to run immediately, bypassing the timer</p>
                    </TooltipContent>
                  </Tooltip>
                  
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
          <Tabs value={activeProductTab} onValueChange={(value) => {
            setActiveProductTab(value)
            setActiveStatusTab('all')
          }} className="w-full">
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="all">All Products ({posts.length})</TabsTrigger>
              {configs.map(config => {
                const postCount = posts.filter(post => post.configId === config.id).length
                return (
                  <TabsTrigger key={config.id} value={config.id.toString()}>
                    {config.name} ({postCount})
                  </TabsTrigger>
                )
              })}
            </TabsList>

            <TabsContent value={activeProductTab}>
              <Tabs value={activeStatusTab} onValueChange={setActiveStatusTab} className="w-full mb-6">
                <TabsList className="mb-6 flex-wrap">
                  <TabsTrigger value="all">All ({getStatusCounts().total})</TabsTrigger>
                  <TabsTrigger value="new">New ({getStatusCounts().new})</TabsTrigger>
                  <TabsTrigger value="seen">Seen ({getStatusCounts().seen})</TabsTrigger>
                  <TabsTrigger value="responded">Responded ({getStatusCounts().responded})</TabsTrigger>
                </TabsList>
                <TabsContent value={activeStatusTab}>
              <div className="block md:hidden space-y-4">
                {getFilteredPosts().map(post => {
                const config = configs.find(c => c.id === post.configId)
                const isExpanded = expandedRows.has(post.id)
                const isGenerating = generatingReply.has(post.id)
                const isUpdatingStatus = updatingStatus.has(post.id)
                const reply = replies.get(post.id)
                
                return (
                  <Card key={post.id} className="border border-slate-200 shadow-sm bg-white">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs font-medium bg-slate-100 text-slate-700">
                              r/{post.subreddit}
                            </Badge>
                            <Badge variant="secondary" className="text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {config?.name || 'Unknown'}
                            </Badge>
                            {getStatusBadge(post.leadStatus)}
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
                          <div className="flex items-center gap-1 flex-wrap">
                            {post.leadStatus !== 'seen' && (
                              <Button
                                onClick={() => updatePostStatus(post.id, 'seen')}
                                disabled={isUpdatingStatus}
                                variant="ghost"
                                size="sm"
                                className="text-orange-700 hover:text-orange-800 hover:bg-orange-50 text-xs px-2"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            )}
                            {post.leadStatus !== 'responded' && (
                              <Button
                                onClick={() => updatePostStatus(post.id, 'responded')}
                                disabled={isUpdatingStatus}
                                variant="ghost"
                                size="sm"
                                className="text-green-700 hover:text-green-800 hover:bg-green-50 text-xs px-2"
                              >
                                <MessageCircle className="w-3 h-3" />
                              </Button>
                            )}
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

            <div className="w-full max-w-[100vw] mx-auto">
              <Card className="border border-slate-200 shadow-sm bg-white hidden md:block">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table className="border-separate border-spacing-0 w-full min-w-[900px]">
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead className="font-semibold border-b border-slate-200 py-3 px-4 w-[140px]">Subreddit</TableHead>
                        <TableHead className="font-semibold border-b border-slate-200 py-3 px-4 w-[160px]">Product</TableHead>
                        <TableHead className="font-semibold border-b border-slate-200 py-3 px-4 w-[100px]">Status</TableHead>
                        <TableHead className="font-semibold border-b border-slate-200 py-3 px-4 w-[100px]">Interest</TableHead>
                        <TableHead className="font-semibold border-b border-slate-200 py-3 px-4 min-w-[300px] max-w-[400px]">Title</TableHead>
                        <TableHead className="font-semibold border-b border-slate-200 py-3 px-4 w-[100px]">Posted</TableHead>
                        <TableHead className="font-semibold text-center border-b border-slate-200 py-3 px-4 w-[240px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredPosts().map(post => {
                        const config = configs.find(c => c.id === post.configId)
                        const isExpanded = expandedRows.has(post.id)
                        const isGenerating = generatingReply.has(post.id)
                        const isUpdatingStatus = updatingStatus.has(post.id)
                        const reply = replies.get(post.id)
                        
                        return (
                          <React.Fragment key={post.id}>
                            <TableRow className="hover:bg-slate-50/50 border-b border-slate-100">
                              <TableCell className="py-3 px-4 w-[140px]">
                                <Badge variant="secondary" className="text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 truncate max-w-full">
                                  r/{post.subreddit}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-3 px-4 w-[160px]">
                                <Badge variant="secondary" className="text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center gap-1 w-fit max-w-full">
                                  <Package className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{config?.name || 'Unknown Product'}</span>
                                </Badge>
                              </TableCell>
                              <TableCell className="py-3 px-4 w-[100px]">
                                {getStatusBadge(post.leadStatus)}
                              </TableCell>
                              <TableCell className="py-3 px-4 w-[100px]">
                                <InterestLabel leadQuality={post.leadQuality ?? null} />
                              </TableCell>
                              <TableCell className="py-3 px-4 min-w-[300px] max-w-[400px]">
                                <a 
                                  href={post.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="font-medium text-slate-900 hover:text-slate-700 cursor-pointer transition-colors block line-clamp-2 leading-5 max-h-[2.5rem] overflow-hidden"
                                  title={post.title}
                                >
                                  {post.title}
                                </a>
                              </TableCell>
                              <TableCell className="text-slate-500 text-sm py-3 px-4 w-[100px]">
                                <span className="whitespace-nowrap">
                                  {getRelativeTime(post.redditCreatedAt || post.createdAt)}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 px-4 w-[240px]">
                                <div className="flex items-center gap-1 justify-center flex-wrap">
                                  {post.leadStatus !== 'seen' && (
                                    <Button
                                      onClick={() => updatePostStatus(post.id, 'seen')}
                                      disabled={isUpdatingStatus}
                                      variant="ghost"
                                      size="sm"
                                      className="text-orange-700 hover:text-orange-800 hover:bg-orange-50 text-xs px-2 flex-shrink-0"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                  )}
                                  {post.leadStatus !== 'responded' && (
                                    <Button
                                      onClick={() => updatePostStatus(post.id, 'responded')}
                                      disabled={isUpdatingStatus}
                                      variant="ghost"
                                      size="sm"
                                      className="text-green-700 hover:text-green-800 hover:bg-green-50 text-xs px-2 flex-shrink-0"
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                    </Button>
                                  )}
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
                                    className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-2 flex-shrink-0"
                                  >
                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  </Button>
                                  <Link href={`/leads/${post.id}`}>
                                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-700 hover:bg-slate-100 text-xs flex-shrink-0">
                                      Details
                                    </Button>
                                  </Link>
                                </div>
                              </TableCell>
                            </TableRow>
                            {isExpanded && (
                              <TableRow className="bg-slate-50/30">
                                <TableCell colSpan={7} className="py-4 px-4">
                                  <div className="w-full max-w-none">
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
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-xs text-slate-500 flex items-center justify-center">
                                          Click "Reply" to generate an AI response
                                        </div>
                                      )}
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
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        )}
        
       
      </div>
    </DashboardLayout>
  )
}
