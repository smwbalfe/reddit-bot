"use client"

import { useUser } from "@/src/lib/features/auth/hooks/use-user"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { MessageSquare, TrendingUp, Activity, Target, Calendar, BarChart3, Zap } from "lucide-react"
import Link from "next/link"
import { useDashboardStore } from "@/src/lib/store"
import { useDashboardMetrics } from "@/src/lib/features/dashboard/hooks/use-dashboard-metrics"
import { triggerLeadSearch } from "@/src/lib/actions/leads/trigger-lead-search"

export function Dashboard() {
  const { user } = useUser()
  const { 
    configs, 
    posts, 
    isLoading: loading, 
    fetchDashboardData 
  } = useDashboardStore()
  
  const [isSearching, setIsSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState("")
  
  const metrics = useDashboardMetrics(posts)

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData()
    }
  }, [user?.id, fetchDashboardData])

  const handleTriggerLeadSearch = async () => {
    if (!user?.id) return
    
    setIsSearching(true)
    setSearchMessage("")
    
    try {
      const result = await triggerLeadSearch({ userId: user.id })
      
      if (result.success) {
        setSearchMessage("Lead search triggered successfully! Check back in a few minutes for new leads.")
        // Refresh data after a delay
        setTimeout(() => {
          fetchDashboardData()
        }, 30000) // 30 seconds
      } else {
        setSearchMessage(result.message)
      }
    } catch (error) {
      setSearchMessage("Failed to trigger lead search. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-600"></div>
      </div>
    )
  }

  return (
          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
      <div className="space-y-2">
        <p className="text-slate-600 text-base sm:text-lg">Overview of your lead generation performance</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-slate-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Leads</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900">{metrics.totalLeads}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex text-xs sm:text-sm text-slate-600">
                  <span>Today: {metrics.todayLeads} • This week: {metrics.weekLeads}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Active Products</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900">{configs.length}</p>
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
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Avg Lead Quality</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900">{metrics.avgLeadQuality}%</p>
                  </div>
                  <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
                <div className="mt-4 flex text-sm text-slate-600">
                  <span>Ready: {metrics.leadDistribution.readyLeads} • Strong: {metrics.leadDistribution.strongLeads}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Never/Minimal</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900">{metrics.leadDistribution.neverLeads + metrics.leadDistribution.minimalLeads}</p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="mt-4 flex text-xs sm:text-sm text-slate-600">
                  <span>≤ 20% quality</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Manual Lead Search Trigger */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Search for New Leads</h3>
                      <p className="text-sm text-slate-600">Trigger an immediate search for fresh leads across all your products</p>
                    </div>
                  </div>
                  {searchMessage && (
                    <div className={`mt-3 p-3 rounded-lg text-sm ${
                      searchMessage.includes("successfully") 
                        ? "bg-green-50 text-green-700 border border-green-200" 
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                      {searchMessage}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={handleTriggerLeadSearch}
                    disabled={isSearching || configs.length === 0}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      isSearching || configs.length === 0
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                    }`}
                  >
                    {isSearching ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-slate-600"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Find New Leads
                      </>
                    )}
                  </button>
                  {configs.length === 0 && (
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      Create a product first
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                  Lead Quality Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-sm font-medium text-slate-700">Ready (81-100%)</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{metrics.leadDistribution.readyLeads}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-lime-500 rounded-full"></div>
                      <span className="text-sm font-medium text-slate-700">Strong (61-80%)</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{metrics.leadDistribution.strongLeads}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium text-slate-700">Genuine (41-60%)</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{metrics.leadDistribution.genuineLeads}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="text-sm font-medium text-slate-700">Moderate (21-40%)</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{metrics.leadDistribution.moderateLeads}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm font-medium text-slate-700">Minimal (11-20%)</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{metrics.leadDistribution.minimalLeads}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium text-slate-700">Never (0-10%)</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{metrics.leadDistribution.neverLeads}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
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
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{post.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">r/{post.subreddit}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">{post.leadQuality ?? 0}% quality</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {posts.length > 5 && (
                      <Link 
                        href="/leads" 
                        className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium pt-2"
                      >
                        View all {metrics.totalLeads} leads →
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Ready to analyze your leads?</h3>
                  <p className="text-slate-600 mb-4 text-sm sm:text-base">View detailed AI analysis, manage your products, and explore all discovered leads.</p>
                  <Link 
                    href="/leads" 
                    className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors text-sm sm:text-base"
                  >
                    View Leads & Analysis
                  </Link>
                </div>
                <div className="hidden lg:block">
                  <BarChart3 className="h-16 sm:h-24 w-16 sm:w-24 text-blue-200" />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
} 