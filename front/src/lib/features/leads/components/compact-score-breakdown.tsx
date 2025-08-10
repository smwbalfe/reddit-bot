import { PostWithConfigId } from "@/src/lib/types"
import { Clock, Star, Target, UserCheck, Zap } from "lucide-react"

export function CompactScoreBreakdown({ post }: { post: PostWithConfigId }) {
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