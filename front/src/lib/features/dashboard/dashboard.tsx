"use client"

import { useUser } from "@/src/lib/features/auth/hooks/use-user"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { getUserConfigs, getUserPosts } from "@/src/lib/actions/create-config"
import { ICP } from "@/src/lib/db/schema"
import { MessageSquare, TrendingUp, Activity, Target, Calendar, BarChart3 } from "lucide-react"
import Link from "next/link"

type PostWithConfigId = {
  id: number
  configId: number
  subreddit: string
  title: string
  content: string
  url: string
  leadQuality: number | null
  painPoints: string | null
  productFitScore: number | null
  intentSignalsScore: number | null
  urgencyIndicatorsScore: number | null
  decisionAuthorityScore: number | null
  engagementQualityScore: number | null
  productFitJustification: string | null
  intentSignalsJustification: string | null
  urgencyIndicatorsJustification: string | null
  decisionAuthorityJustification: string | null
  engagementQualityJustification: string | null
  createdAt: Date
  updatedAt: Date
}

export function Dashboard() {
  const { user } = useUser()
  const [configs, setConfigs] = useState<ICP[]>([])
  const [posts, setPosts] = useState<PostWithConfigId[]>([])
  const [loading, setLoading] = useState(true)

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
      setPosts(data)
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-600"></div>
      </div>
    )
  }

  const highQualityLeads = posts.filter(post => (post.leadQuality ?? 0) >= 80).length
  const mediumQualityLeads = posts.filter(post => (post.leadQuality ?? 0) >= 60 && (post.leadQuality ?? 0) < 80).length
  const lowQualityLeads = posts.filter(post => (post.leadQuality ?? 0) < 60).length
  const avgLeadQuality = posts.length > 0 ? Math.round(posts.reduce((acc, post) => acc + (post.leadQuality ?? 0), 0) / posts.length) : 0
  
  const todayLeads = posts.filter(post => {
    const postDate = new Date(post.createdAt)
    const today = new Date()
    return postDate.toDateString() === today.toDateString()
  }).length

  const weekLeads = posts.filter(post => {
    const postDate = new Date(post.createdAt)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return postDate >= weekAgo
  }).length

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 text-lg">Overview of your lead generation performance</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-slate-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Leads</p>
                    <p className="text-3xl font-bold text-slate-900">{posts.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex text-sm text-slate-600">
                  <span>Today: {todayLeads} • This week: {weekLeads}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Active Products</p>
                    <p className="text-3xl font-bold text-slate-900">{configs.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/leads" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    Manage Products →
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Avg Lead Quality</p>
                    <p className="text-3xl font-bold text-slate-900">{avgLeadQuality}%</p>
                  </div>
                  <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
                <div className="mt-4 flex text-sm text-slate-600">
                  <span>High: {highQualityLeads} • Med: {mediumQualityLeads}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Low Quality</p>
                    <p className="text-3xl font-bold text-slate-900">{lowQualityLeads}</p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="mt-4 flex text-sm text-slate-600">
                  <span>&lt; 60% quality</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-slate-600" />
                  Lead Quality Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm font-medium text-slate-700">High Quality (80%+)</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{highQualityLeads}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="text-sm font-medium text-slate-700">Medium Quality (60-79%)</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{mediumQualityLeads}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                      <span className="text-sm font-medium text-slate-700">Low Quality (&lt;60%)</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{lowQualityLeads}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-slate-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {posts.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No leads yet</p>
                    <p className="text-slate-400 text-sm mt-1">Get started by creating your first product</p>
                    <Link 
                      href="/leads" 
                      className="inline-block mt-4 px-4 py-2 bg-slate-900 text-white text-sm rounded-md hover:bg-slate-800 transition-colors"
                    >
                      Create Product
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.slice(0, 5).map((post) => (
                      <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{post.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">r/{post.subreddit}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">{post.leadQuality}% quality</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {posts.length > 5 && (
                      <Link 
                        href="/leads" 
                        className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium pt-2"
                      >
                        View all {posts.length} leads →
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Ready to analyze your leads?</h3>
                  <p className="text-slate-600 mb-4">View detailed AI analysis, manage your products, and explore all discovered leads.</p>
                  <Link 
                    href="/leads" 
                    className="inline-flex items-center px-6 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    View Leads & Analysis
                  </Link>
                </div>
                <div className="hidden md:block">
                  <BarChart3 className="h-24 w-24 text-blue-200" />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
} 