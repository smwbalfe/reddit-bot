'use client'

import { useUser } from "@/src/lib/features/auth/hooks/use-user"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/lib/components/ui/card"
import { Button } from "@/src/lib/components/ui/button"
import { Badge } from "@/src/lib/components/ui/badge"
import { getUserConfigs, getUserPosts } from "@/src/lib/actions/create-config"
import { ICP } from "@/src/lib/db/schema"
import { PostWithConfigId } from "@/src/lib/types"
import { ChevronLeft, MessageSquare, Activity, ExternalLink, Package, Hash, ChevronDown, ChevronUp, Target, Zap, Clock, UserCheck, Star } from "lucide-react"
import DashboardLayout from '@/src/lib/components/dashboard-layout'
import Link from 'next/link'
import { useParams } from 'next/navigation'

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

function InterestLabel({ category, leadQuality }: { category: string | null; leadQuality: number | null }) {
  if (!category) return null
  
  const categoryMap: Record<string, { label: string; position: number; color: string; bgColor: string }> = {
    'absolutely_never': { label: 'Never', position: 0, color: '#dc2626', bgColor: 'bg-red-100' },
    'never_interested': { label: 'Not Interested', position: 1, color: '#dc2626', bgColor: 'bg-red-100' },
    'minimal_interest': { label: 'Minimal', position: 2, color: '#ea580c', bgColor: 'bg-orange-100' },
    'slight_interest': { label: 'Slight', position: 3, color: '#ea580c', bgColor: 'bg-orange-100' },
    'moderate_interest': { label: 'Moderate', position: 4, color: '#d97706', bgColor: 'bg-amber-100' },
    'genuine_interest': { label: 'Genuine', position: 5, color: '#d97706', bgColor: 'bg-amber-100' },
    'strong_interest': { label: 'Strong', position: 6, color: '#ca8a04', bgColor: 'bg-yellow-100' },
    'very_interested': { label: 'Very High', position: 7, color: '#65a30d', bgColor: 'bg-lime-100' },
    'ready_to_purchase': { label: 'Ready', position: 8, color: '#16a34a', bgColor: 'bg-green-100' },
    'guaranteed_buyer': { label: 'Guaranteed', position: 9, color: '#15803d', bgColor: 'bg-emerald-100' },
  }
  
  const categoryData = categoryMap[category]
  if (!categoryData) return null
  
  const { label, position, color, bgColor } = categoryData
  const percentage = leadQuality ?? Math.round(((position + 1) / 10) * 100)
  
  return (
    <div className="flex flex-col items-center gap-2">
      <FuelGauge percentage={percentage} color={color} />
      <div className="flex flex-col items-center gap-1">
        <span className="text-lg font-bold" style={{ color }}>{percentage}%</span>
        <span 
          className={`text-sm font-semibold px-2 py-1 rounded-full ${bgColor}`}
          style={{ color }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

function CompactScoreBreakdown({ post }: { post: PostWithConfigId }) {
  const factors = [
    {
      name: 'Product Fit',
      score: post.analysisData?.productFitScore,
      justification: post.analysisData?.productFitJustification,
      icon: <Target className="w-3 h-3 sm:w-4 sm:h-4" />,
      color: '#3b82f6'
    },
    {
      name: 'Intent',
      score: post.analysisData?.intentSignalsScore,
      justification: post.analysisData?.intentSignalsJustification,
      icon: <Zap className="w-3 h-3 sm:w-4 sm:h-4" />,
      color: '#10b981'
    },
    {
      name: 'Urgency',
      score: post.analysisData?.urgencyIndicatorsScore,
      justification: post.analysisData?.urgencyIndicatorsJustification,
      icon: <Clock className="w-3 h-3 sm:w-4 sm:h-4" />,
      color: '#f59e0b'
    },
    {
      name: 'Authority',
      score: post.analysisData?.decisionAuthorityScore,
      justification: post.analysisData?.decisionAuthorityJustification,
      icon: <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />,
      color: '#8b5cf6'
    },
    {
      name: 'Engagement',
      score: post.analysisData?.engagementQualityScore,
      justification: post.analysisData?.engagementQualityJustification,
      icon: <Star className="w-3 h-3 sm:w-4 sm:h-4" />,
      color: '#ef4444'
    }
  ]

  const hasAnyScores = factors.some(factor => factor.score !== null)
  
  if (!hasAnyScores) {
    return (
      <div className="text-center py-4">
        <div className="text-slate-500 text-sm mb-1">No detailed AI scoring available</div>
        <div className="text-slate-400 text-xs">This lead was processed before detailed scoring was implemented</div>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {post.leadQuality && (
        <div className="flex items-center justify-center pb-2 sm:pb-4">
          <div className="relative">
            {(() => {
              let bgGradient = 'from-blue-50 to-indigo-50'
              let textGradient = 'from-blue-600 to-indigo-600'
              let glowGradient = 'from-blue-400 to-indigo-400'
              let barGradient = 'from-blue-400 to-indigo-400'
              
              if (post.leadQuality <= 20) {
                bgGradient = 'from-red-50 to-pink-50'
                textGradient = 'from-red-600 to-red-700'
                glowGradient = 'from-red-400 to-pink-400'
                barGradient = 'from-red-400 to-pink-400'
              } else if (post.leadQuality <= 40) {
                bgGradient = 'from-orange-50 to-amber-50'
                textGradient = 'from-orange-600 to-amber-600'
                glowGradient = 'from-orange-400 to-amber-400'
                barGradient = 'from-orange-400 to-amber-400'
              } else if (post.leadQuality <= 60) {
                bgGradient = 'from-amber-50 to-yellow-50'
                textGradient = 'from-amber-600 to-yellow-600'
                glowGradient = 'from-amber-400 to-yellow-400'
                barGradient = 'from-amber-400 to-yellow-400'
              } else if (post.leadQuality <= 80) {
                bgGradient = 'from-lime-50 to-green-50'
                textGradient = 'from-lime-600 to-green-600'
                glowGradient = 'from-lime-400 to-green-400'
                barGradient = 'from-lime-400 to-green-400'
              } else {
                bgGradient = 'from-green-50 to-emerald-50'
                textGradient = 'from-green-600 to-emerald-600'
                glowGradient = 'from-green-400 to-emerald-400'
                barGradient = 'from-green-400 to-emerald-400'
              }
              
              return (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-r ${glowGradient} rounded-xl blur opacity-20`}></div>
                  <div className={`relative bg-gradient-to-r ${bgGradient} p-3 sm:p-4 rounded-xl`}>
                    <div className="text-center">
                      <div className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${textGradient} bg-clip-text text-transparent mb-1`}>
                        {post.leadQuality}%
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 font-medium">Overall Lead Score</div>
                      <div className={`mt-1.5 sm:mt-2 h-1 w-12 sm:w-16 bg-gradient-to-r ${barGradient} rounded-full mx-auto`}></div>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {post.analysisData?.painPoints && (
        <div className="p-2.5 sm:p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg">
          <div className="font-semibold text-red-900 mb-1.5 sm:mb-2 flex items-center gap-2">
            <div className="p-0.5 sm:p-1 bg-red-100 rounded-lg flex-shrink-0">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full"></div>
            </div>
            <span className="text-sm sm:text-base">Pain Points</span>
          </div>
          <p className="text-red-800 text-xs sm:text-sm leading-relaxed pl-5 sm:pl-6">{post.analysisData.painPoints}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3">
        {factors.map((factor, index) => {
          if (factor.score == null) return null;
          
          let displayColor = factor.color
          let bgColor = 'bg-slate-50'
          let ringColor = 'ring-slate-200'
          
          if (factor.score <= 20) {
            displayColor = '#dc2626'
            bgColor = 'bg-red-50'
            ringColor = 'ring-red-200'
          } else if (factor.score <= 40) {
            displayColor = '#ea580c'
            bgColor = 'bg-orange-50'
            ringColor = 'ring-orange-200'
          } else if (factor.score <= 60) {
            displayColor = '#d97706'
            bgColor = 'bg-amber-50'
            ringColor = 'ring-amber-200'
          } else if (factor.score <= 80) {
            displayColor = '#65a30d'
            bgColor = 'bg-lime-50'
            ringColor = 'ring-lime-200'
          } else {
            displayColor = '#16a34a'
            bgColor = 'bg-green-50'
            ringColor = 'ring-green-200'
          }
          
          return (
            <div key={index} className="space-y-2">
              <div className={`p-3 sm:p-4 rounded-lg ${bgColor} ring-1 ${ringColor} transition-all duration-200`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/60 flex-shrink-0" style={{ color: displayColor }}>
                      {factor.icon}
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl font-bold" style={{ color: displayColor }}>
                        {factor.score}%
                      </div>
                      <div className="text-sm font-semibold text-slate-700">
                        {factor.name}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {factor.justification && (
                <div className="px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-600 leading-relaxed border-l-2" style={{ borderLeftColor: displayColor }}>
                  <span className="font-semibold text-slate-800">{factor.name}:</span> {factor.justification}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {post.overallAssessment && (
        <div className="p-2.5 sm:p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg ring-1 ring-slate-200">
          <div className="font-semibold text-slate-900 mb-1.5 sm:mb-2 flex items-center gap-2">
            <div className="p-0.5 sm:p-1 bg-blue-100 rounded-lg flex-shrink-0">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-500 rounded-full"></div>
            </div>
            <span className="text-sm sm:text-base">AI Assessment</span>
          </div>
          <p className="text-slate-700 leading-relaxed text-xs sm:text-sm pl-5 sm:pl-6">{post.overallAssessment}</p>
        </div>
      )}
    </div>
  )
}



export function LeadDetailPage() {
  const { user } = useUser()
  const params = useParams()
  const leadId = parseInt(params.id as string)
  
  const [configs, setConfigs] = useState<ICP[]>([])
  const [post, setPost] = useState<PostWithConfigId | null>(null)
  const [loading, setLoading] = useState(true)

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
          <InterestLabel category={null} leadQuality={post.leadQuality ?? null} />
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



      </div>
    </DashboardLayout>
  )
}
