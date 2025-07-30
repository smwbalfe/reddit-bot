'use client'

import { useUser } from "@/src/lib/features/auth/hooks/use-user"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/lib/components/ui/card"
import { Button } from "@/src/lib/components/ui/button"
import { Badge } from "@/src/lib/components/ui/badge"
import { getUserConfigs, getUserPosts } from "@/src/lib/actions/create-config"
import { ICP } from "@/src/lib/db/schema"
import { ChevronRight, MessageSquare, TrendingUp, Activity, ExternalLink, ChevronDown, Hash, Package } from "lucide-react"
import DashboardLayout from '@/src/lib/components/dashboard-layout'
import Link from 'next/link'

function LeadQualityMeter({ leadQuality }: { leadQuality: number | null }) {
  if (!leadQuality) return null
  
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
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-2">
        <Activity className="w-3 h-3 text-slate-500" />
        <span className={`text-sm font-bold tabular-nums ${getTextColor(leadQuality)}`}>{leadQuality}%</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-500">Quality</span>
        <div className="bg-slate-200 rounded-full h-1.5 w-12">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${getColorClass(leadQuality)}`}
            style={{ width: `${leadQuality}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function InterestDial({ category }: { category: string | null }) {
  if (!category) return null
  
  const categoryMap: Record<string, { label: string; position: number; color: string }> = {
    'absolutely_never': { label: 'Never', position: 0, color: '#dc2626' },
    'never_interested': { label: 'Not Interested', position: 1, color: '#dc2626' },
    'minimal_interest': { label: 'Minimal', position: 2, color: '#ea580c' },
    'slight_interest': { label: 'Slight', position: 3, color: '#ea580c' },
    'moderate_interest': { label: 'Moderate', position: 4, color: '#d97706' },
    'genuine_interest': { label: 'Genuine', position: 5, color: '#d97706' },
    'strong_interest': { label: 'Strong', position: 6, color: '#ca8a04' },
    'very_interested': { label: 'Very High', position: 7, color: '#65a30d' },
    'ready_to_purchase': { label: 'Ready', position: 8, color: '#16a34a' },
    'guaranteed_buyer': { label: 'Guaranteed', position: 9, color: '#15803d' },
  }
  
  const categoryData = categoryMap[category]
  if (!categoryData) return null
  
  const { label, position, color } = categoryData
  const angle = (position * 18) - 81
  
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-12 h-6">
        <svg width="48" height="24" viewBox="0 0 48 24" className="overflow-visible">
          {Array.from({ length: 10 }, (_, i) => {
            const segmentAngle = (i * 18) - 81
            const x1 = 24 + 18 * Math.cos((segmentAngle * Math.PI) / 180)
            const y1 = 24 + 18 * Math.sin((segmentAngle * Math.PI) / 180)
            const x2 = 24 + 12 * Math.cos((segmentAngle * Math.PI) / 180)
            const y2 = 24 + 12 * Math.sin((segmentAngle * Math.PI) / 180)
            
            let segmentColor = '#e2e8f0'
            if (i < 3) segmentColor = '#f87171'
            else if (i < 7) segmentColor = '#fb923c' 
            else segmentColor = '#4ade80'
            
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={segmentColor}
                strokeWidth="3"
                strokeLinecap="round"
              />
            )
          })}
          <line
            x1="24"
            y1="24"
            x2={24 + 15 * Math.cos((angle * Math.PI) / 180)}
            y2={24 + 15 * Math.sin((angle * Math.PI) / 180)}
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            markerEnd="url(#arrowhead)"
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
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-slate-900">{label}</span>
        <span className="text-xs text-slate-500">Interest Level</span>
      </div>
    </div>
  )
}

type PostWithConfigId = {
  id: number
  configId: number
  subreddit: string
  title: string
  content: string
  url: string
  leadQuality: number | null
  leadCategory: string | null
  justification: string | null
  painPoints: string | null
  suggestedEngagement: string | null
  createdAt: Date
  updatedAt: Date
}

export default function LeadsPage() {
  const { user } = useUser()
  const [configs, setConfigs] = useState<ICP[]>([])
  const [posts, setPosts] = useState<PostWithConfigId[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set())

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
      const sortedData = data.sort((a, b) => {
        const qualityA = a.leadQuality || 0
        const qualityB = b.leadQuality || 0
        return qualityB - qualityA
      })
      setPosts(sortedData)
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  }

  const togglePostExpansion = (postId: number) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
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
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div className="space-y-3">
                <CardTitle className="text-2xl font-semibold text-slate-900">Leads & AI Analysis</CardTitle>
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
          <div className="space-y-3">
            {posts.map(post => {
              const config = configs.find(c => c.id === post.configId)
              const isExpanded = expandedPosts.has(post.id)
              
              return (
                <Card key={post.id} className="border border-slate-200 shadow-sm bg-white hover:shadow-md hover:border-slate-300 transition-all duration-200 rounded-xl overflow-hidden">
                  <CardContent className="p-0">
                    {/* Collapsed Header - Always Visible */}
                    <div 
                      className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => togglePostExpansion(post.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-semibold text-lg text-slate-900 leading-tight line-clamp-2 flex-1">{post.title}</h3>
                            <ChevronDown 
                              className={`w-5 h-5 text-slate-400 transition-transform duration-200 flex-shrink-0 mt-1 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1">
          
                              r/{post.subreddit}
                            </Badge>
                            <Badge variant="secondary" className="text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {config?.name || 'Unknown Product'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            {post.leadCategory && (
                              <InterestDial category={post.leadCategory} />
                            )}
                            <LeadQualityMeter leadQuality={post.leadQuality} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 p-4 pt-5 space-y-4">
                        {/* Content */}
                        <div className="p-4 bg-slate-50 rounded-lg">
                          <p className="text-slate-700 text-sm leading-relaxed">{post.content}</p>
                        </div>

                        {/* Pain Points */}
                        {post.painPoints && (
                          <div className="space-y-2">
                            <h6 className="text-base font-bold text-red-600 flex items-center gap-2">
                              <Activity className="w-4 h-4 text-red-600" />
                              Pain Points Identified
                            </h6>
                            <div className="space-y-2">
                              {post.painPoints.split('\n\n').map((section, index) => {
                                const lines = section.trim().split('\n');
                                if (lines.length > 1 && lines[0].endsWith(':')) {
                                  return (
                                    <div key={index} className="space-y-1">
                                      <div className="text-sm font-bold text-slate-800">{lines[0]}</div>
                                      <p className="text-sm text-slate-700 leading-relaxed pl-2">{lines.slice(1).join(' ')}</p>
                                    </div>
                                  );
                                }
                                return (
                                  <p key={index} className="text-sm text-slate-700 leading-relaxed">{section}</p>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Suggested Engagement */}
                        {post.suggestedEngagement && (
                          <div className="space-y-2">
                            <h6 className="text-base font-bold text-green-600 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-green-600" />
                              Suggested Engagement
                            </h6>
                            <div className="space-y-2">
                              {post.suggestedEngagement.split('\n\n').map((section, index) => {
                                const lines = section.trim().split('\n');
                                if (lines.length > 1 && lines[0].endsWith(':')) {
                                  return (
                                    <div key={index} className="space-y-1">
                                      <div className="text-sm font-bold text-slate-800">{lines[0]}</div>
                                      <p className="text-sm text-slate-700 leading-relaxed pl-2">{lines.slice(1).join(' ')}</p>
                                    </div>
                                  );
                                }
                                return (
                                  <p key={index} className="text-sm text-slate-700 leading-relaxed">{section}</p>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500 font-medium">
                            {new Date(post.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                          <a 
                            href={post.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-slate-900 hover:text-slate-700 text-sm font-medium flex items-center gap-2 group px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            View on Reddit
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </a>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}