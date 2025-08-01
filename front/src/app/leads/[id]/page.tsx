'use client'

import { useUser } from "@/src/lib/features/auth/hooks/use-user"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/lib/components/ui/card"
import { Button } from "@/src/lib/components/ui/button"
import { Badge } from "@/src/lib/components/ui/badge"
import { getUserConfigs, getUserPosts } from "@/src/lib/actions/create-config"
import { ICP } from "@/src/lib/db/schema"
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

function InterestLabel({ category, leadQuality, finalScore }: { category: string | null; leadQuality: number | null; finalScore?: number | null }) {
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
  const percentage = finalScore ?? leadQuality ?? Math.round(((position + 1) / 10) * 100)
  
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

function AIScoreCard({ score, justification, title, icon, color }: {
  score: number | null
  justification: string | null
  title: string
  icon: React.ReactNode
  color: string
}) {
  if (score === null) return null
  
  // Get proper color based on score
  let displayColor = color
  let bgColor = 'bg-slate-50'
  
  if (score <= 20) {
    displayColor = '#dc2626'
    bgColor = 'bg-red-50'
  } else if (score <= 40) {
    displayColor = '#ea580c'
    bgColor = 'bg-orange-50'
  } else if (score <= 60) {
    displayColor = '#d97706'
    bgColor = 'bg-amber-50'
  } else if (score <= 80) {
    displayColor = '#65a30d'
    bgColor = 'bg-lime-50'
  } else {
    displayColor = '#16a34a'
    bgColor = 'bg-green-50'
  }
  
  return (
    <div className={`relative p-4 rounded-lg border ${bgColor} border-opacity-20 group cursor-help transition-all hover:shadow-md`}>
      <div className="flex items-center gap-3">
        {/* Icon and Gauge */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md" style={{ color: displayColor }}>
            {icon}
          </div>
          <FuelGauge percentage={score} color={displayColor} />
        </div>
        
        {/* Score and Title */}
        <div className="flex-1">
          <div className="text-2xl font-bold" style={{ color: displayColor }}>
            {score}%
          </div>
          <div className="text-sm font-medium text-slate-700">{title}</div>
        </div>
      </div>
      
      {/* Hover Tooltip for Justification */}
      {justification && (
        <div className="absolute left-0 top-full mt-2 w-80 p-3 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
          <div className="text-sm text-slate-700 leading-relaxed">
            {justification}
          </div>
          <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-l border-t border-slate-200 transform rotate-45"></div>
        </div>
      )}
    </div>
  )
}

function CompactScoreBreakdown({ post }: { post: PostWithConfigId }) {
  const factors = [
    {
      name: 'Product Fit',
      score: post.productFitScore,
      justification: post.productFitJustification,
      icon: <Target className="w-4 h-4" />,
      color: '#3b82f6'
    },
    {
      name: 'Intent',
      score: post.intentSignalsScore,
      justification: post.intentSignalsJustification,
      icon: <Zap className="w-4 h-4" />,
      color: '#10b981'
    },
    {
      name: 'Urgency',
      score: post.urgencyIndicatorsScore,
      justification: post.urgencyIndicatorsJustification,
      icon: <Clock className="w-4 h-4" />,
      color: '#f59e0b'
    },
    {
      name: 'Authority',
      score: post.decisionAuthorityScore,
      justification: post.decisionAuthorityJustification,
      icon: <UserCheck className="w-4 h-4" />,
      color: '#8b5cf6'
    },
    {
      name: 'Engagement',
      score: post.engagementQualityScore,
      justification: post.engagementQualityJustification,
      icon: <Star className="w-4 h-4" />,
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
    <div className="space-y-4">
      {/* Final Score Display - Compact */}
      {post.leadQuality && (
        <div className="flex items-center justify-center pb-3 border-b border-slate-100">
          <div className="inline-flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{post.leadQuality}%</div>
              <div className="text-xs text-slate-600 font-medium">Overall Score</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Compact Score Grid */}
      <div className="grid grid-cols-5 gap-2">
        {factors.map((factor, index) => {
          if (factor.score === null) return null;
          
          let displayColor = factor.color
          let bgColor = 'bg-slate-50'
          
          if (factor.score <= 20) {
            displayColor = '#dc2626'
            bgColor = 'bg-red-50'
          } else if (factor.score <= 40) {
            displayColor = '#ea580c'
            bgColor = 'bg-orange-50'
          } else if (factor.score <= 60) {
            displayColor = '#d97706'
            bgColor = 'bg-amber-50'
          } else if (factor.score <= 80) {
            displayColor = '#65a30d'
            bgColor = 'bg-lime-50'
          } else {
            displayColor = '#16a34a'
            bgColor = 'bg-green-50'
          }
          
          return (
            <div 
              key={index} 
              className={`relative p-2 rounded-md border ${bgColor} border-opacity-20 group cursor-help transition-all hover:shadow-sm`}
              title={factor.justification || ''}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="p-1 rounded" style={{ color: displayColor }}>
                  {factor.icon}
                </div>
                <div className="text-lg font-bold" style={{ color: displayColor }}>
                  {factor.score}%
                </div>
                <div className="text-xs font-medium text-slate-600 text-center leading-tight">
                  {factor.name}
                </div>
              </div>
              
              {/* Hover Tooltip */}
              {factor.justification && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-white border border-slate-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="text-xs text-slate-700 leading-relaxed">
                    {factor.justification}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-white border-r border-b border-slate-200 transform rotate-45"></div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Overall Assessment - Compact */}
      {post.overallAssessment && (
        <div className="mt-3 p-3 bg-slate-50 rounded-lg border text-sm">
          <div className="font-medium text-slate-900 mb-1 flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            Assessment
          </div>
          <p className="text-slate-700 leading-relaxed text-xs">{post.overallAssessment}</p>
        </div>
      )}
    </div>
  )
}


function CollapsibleSection({ title, children, icon, defaultOpen = false }: { 
  title: string; 
  children: React.ReactNode; 
  icon: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <Card className="border-0 shadow-sm bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 hover:bg-slate-50 transition-colors">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-slate-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-500" />
          )}
        </CardHeader>
      </button>
      {isOpen && (
        <CardContent>
          {children}
        </CardContent>
      )}
    </Card>
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
  leadCategory?: string | null
  justification?: string | null
  painPoints?: string | null
  // New detailed scoring fields
  finalScore?: number | null
  productFitScore?: number | null
  intentSignalsScore?: number | null
  urgencyIndicatorsScore?: number | null
  decisionAuthorityScore?: number | null
  engagementQualityScore?: number | null
  productFitJustification?: string | null
  intentSignalsJustification?: string | null
  urgencyIndicatorsJustification?: string | null
  decisionAuthorityJustification?: string | null
  engagementQualityJustification?: string | null
  overallAssessment?: string | null
  createdAt: Date
  updatedAt: Date
}

export default function LeadDetailPage() {
  const { user } = useUser()
  const params = useParams()
  const leadId = parseInt(params.id as string)
  
  const [configs, setConfigs] = useState<ICP[]>([])
  const [post, setPost] = useState<PostWithConfigId | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingReply, setGeneratingReply] = useState(false)
  const [generatedReply, setGeneratedReply] = useState<string | null>(null)

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

  const handleGenerateReply = async () => {
    if (!post || !user?.id) return
    
    setGeneratingReply(true)
    try {
      const config = configs.find(c => c.id === post.configId)
      const response = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          postTitle: post.title,
          postContent: post.content,
          subreddit: post.subreddit,
          productName: config?.name,
          productDescription: config?.description,
          productWebsite: config?.website,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setGeneratedReply(data.reply)
      } else {
        throw new Error('Failed to generate reply')
      }
    } catch (error) {
      console.error('Error generating reply:', error)
      alert('Failed to generate reply. Please try again.')
    } finally {
      setGeneratingReply(false)
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
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {/* Back Button */}
        <Link href="/leads">
          <Button variant="ghost" className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Button>
        </Link>

        {/* Header Card */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start gap-6">
              <div className="flex-1">
                <CardTitle className="text-xl font-semibold text-slate-900 leading-tight mb-3">
                  {post.title}
                </CardTitle>
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="secondary" className="text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    r/{post.subreddit}
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {config?.name || 'Unknown Product'}
                  </Badge>
                </div>
                <div className="text-sm text-slate-500">
                  Posted on {new Date(post.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              <div className="flex items-start gap-3">
                {(post.leadQuality || post.leadCategory) && (
                  <InterestLabel category={post.leadCategory} leadQuality={post.leadQuality} finalScore={post.finalScore} />
                )}
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={handleGenerateReply}
                    disabled={generatingReply}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    {generatingReply ? 'Generating...' : 'Reply'}
                  </Button>
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

        {/* Content Card with Scroll */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-900">Original Post Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-slate-50 rounded-lg max-h-60 overflow-y-auto">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>
          </CardContent>
        </Card>

        {/* Compact AI Scoring Analysis */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Lead Score Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <CompactScoreBreakdown post={post} />
          </CardContent>
        </Card>

        {/* Generated Reply Display */}
        {generatedReply && (
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                Generated Reply
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-slate-700 leading-relaxed text-sm mb-3">{generatedReply}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(generatedReply)}
                    className="text-green-700 border-green-300 hover:bg-green-100"
                  >
                    Copy Reply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGeneratedReply(null)}
                    className="text-slate-600 border-slate-300 hover:bg-slate-100"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {post.justification && (
          <CollapsibleSection 
            title="AI Analysis Justification" 
            icon={<Activity className="w-5 h-5 text-slate-600" />}
          >
            <p className="text-slate-700 leading-relaxed">{post.justification}</p>
          </CollapsibleSection>
        )}
      </div>
    </DashboardLayout>
  )
}