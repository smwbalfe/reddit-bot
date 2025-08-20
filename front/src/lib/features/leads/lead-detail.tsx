'use client'

import { useSession } from "@/src/lib/features/auth/hooks/use-session"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/lib/components/ui/card"
import { Button } from "@/src/lib/components/ui/button"
import { Badge } from "@/src/lib/components/ui/badge"
import { ICP } from "@/src/lib/db/schema"
import { PostWithConfigId } from "@/src/lib/types"
import { ChevronLeft, MessageSquare, Activity, ExternalLink, Package, Bot } from "lucide-react"
import DashboardLayout from '@/src/lib/features/global/dashboard-layout'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { InterestLabel } from "@/src/lib/features/leads/components/interest-label"
import { getUserConfigs } from "@/src/lib/actions/config/get-user-configs"
import { getUserPosts } from "@/src/lib/actions/config/get-user-posts"
import { CompactScoreBreakdown } from "@/src/lib/features/leads/components/compact-score-breakdown"

export function LeadDetailPage() {
  const { user } = useSession()
  const params = useParams()
  const leadId = parseInt(params.id as string)
  
  const [configs, setConfigs] = useState<ICP[]>([])
  const [post, setPost] = useState<PostWithConfigId | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatedReply, setGeneratedReply] = useState<string>('')
  const [isGeneratingReply, setIsGeneratingReply] = useState(false)

  useEffect(() => {
    if (user?.id && leadId) {
      fetchData()
    }
  }, [user?.id, leadId])

  const fetchData = async () => {
    if (!user?.id) return
    try {
      const [configsData, postsData] = await Promise.all([
        getUserConfigs(),
        getUserPosts()
      ])
      setConfigs(configsData)
      const foundPost = postsData.find(p => p.id === leadId)
      setPost(foundPost || null)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-600"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!post) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="text-center py-20">
              <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-6" />
              <p className="text-slate-500 text-xl font-medium">Lead not found</p>
              <Link href="/leads">
                <Button className="mt-4">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Leads
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const config = configs.find(c => c.id === post.configId)

  return (
    <DashboardLayout>
      <div className="p-4 space-y-3">
        <Link href="/leads">
          <Button variant="ghost" className="mb-2">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Button>
        </Link>

        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-slate-900 leading-tight mb-2">
                  {post.title}
                </CardTitle>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1">
                    r/{post.subreddit}
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {config?.name || 'Unknown Product'}
                  </Badge>
                </div>
                <div className="text-sm text-slate-500 space-y-1">
                  {post.redditCreatedAt ? (
                    <div>
                      Originally posted on Reddit: {new Date(post.redditCreatedAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                     
                    </div>
                  ) : (
                    <div>
                      Posted on {new Date(post.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                  <div className="text-xs text-slate-400">
                    Discovered: {new Date(post.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                        {post.leadQuality && (
          <InterestLabel leadQuality={post.leadQuality ?? null} />
                )}
                <div className="flex flex-col gap-2">
                  <a 
                    href={post.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-shrink-0"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Reddit
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Original Post Content</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">{post.content}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-white border-0 overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-slate-100/50">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              Lead Score Analysis
            </CardTitle>
            <CardDescription className="text-slate-600 text-sm">
              AI-powered scoring breakdown with detailed insights
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 px-6 pb-6">
            <CompactScoreBreakdown post={post} />
          </CardContent>
        </Card>

        {generatedReply && (
          <Card className="shadow-sm bg-white border-0 overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-green-50/50 to-emerald-50/50 border-b border-slate-100/50">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <Bot className="w-4 h-4 text-green-600" />
                </div>
                Generated Reply
              </CardTitle>
              <CardDescription className="text-slate-600 text-sm">
                AI-generated authentic Reddit reply following OGTool best practices
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 px-6 pb-6">
              <div className="p-6 bg-slate-50 rounded-lg">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap break-words text-base">{generatedReply}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={async () => {
                    await navigator.clipboard.writeText(generatedReply)
                    window.open(post.url, '_blank')
                  }}
                  variant="outline"
                  size="sm"
                >
                  Copy & Go to Reddit
                </Button>
              </div>
            </CardContent>
          </Card>
        )}



      </div>
    </DashboardLayout>
  )
}
