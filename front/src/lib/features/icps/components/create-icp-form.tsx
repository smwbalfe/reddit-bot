'use client'

import { useState, useEffect } from 'react'
import { updateConfig } from '@/src/lib/actions/config/update-config'
import { useFormStore, useICPStore } from '@/src/lib/store'
import { CreateIcpFormProps } from '@/src/lib/features/icps/types'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'

const STEPS = [
    { id: 1, title: 'Basic Info', description: 'Product name and website' },
    { id: 2, title: 'Analysis', description: 'Generate or add details' },
    { id: 3, title: 'Details', description: 'Description and pain points' },
    { id: 4, title: 'Communities', description: 'Target subreddits' }
]

export default function CreateIcpForm({ onSuccess, editingIcp }: CreateIcpFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)
    const [websiteUrl, setWebsiteUrl] = useState('')
    const [productName, setProductName] = useState('')
    const [urlError, setUrlError] = useState('')

    const { createICP, error: icpError, setError: setIcpError } = useICPStore()

    const {
        generatedSubreddits,
        selectedSubreddits,
        painPoints,
        icpDescription,
        isAnalyzing,
        error: submitError,
        setPainPoints,
        setIcpDescription,
        addSubreddit,
        removeSubreddit,
        toggleSubreddit,
        analyzeWebsiteUrl,
        setError,
        resetForm,
        initializeFromICP
    } = useFormStore()

    useEffect(() => {
        if (editingIcp) {
            initializeFromICP(editingIcp)
            setProductName(editingIcp.name)
            setWebsiteUrl(editingIcp.website || '')
            setCurrentStep(3)
        } else {
            resetForm()
            setCurrentStep(1)
        }
    }, [editingIcp, initializeFromICP, resetForm])

    const handleAnalyzeUrl = async (url: string) => {
        await analyzeWebsiteUrl(url)
        setCurrentStep(3)
    }

    const nextStep = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1)
        }
    }

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const canProceedToNext = () => {
        switch (currentStep) {
            case 1:
                return productName.trim() && (websiteUrl.trim() === '' || (websiteUrl.trim() !== '' && !urlError))
            case 2:
                return true
            case 3:
                return icpDescription.trim()
            case 4:
                return selectedSubreddits.length > 0
            default:
                return false
        }
    }



    const handleAddSubreddit = (subreddit: string) => {
        const success = addSubreddit(subreddit)
        if (success) {
            return true
        }
        // Clear error after 3 seconds
        setTimeout(() => setError(null), 3000)
        return false
    }

    const handleSubmit = async () => {
        if (currentStep < STEPS.length) {
            nextStep()
            return
        }

        setIsSubmitting(true)
        setError(null)
        setIcpError(null)

        try {
            const formData = new FormData()
            formData.append('name', productName)
            formData.append('website', websiteUrl)
            formData.append('keywords', JSON.stringify([]))
            formData.append('subreddits', JSON.stringify(selectedSubreddits))
            formData.append('painPoints', painPoints)
            formData.set('description', icpDescription)

            if (editingIcp) {
                const result = await updateConfig(editingIcp.id, formData)
                if (!result.success) {
                    if (Array.isArray(result.error)) {
                        setError(result.error.map(e => e.message).join(', '))
                    } else {
                        setError(result.error || 'Failed to update product')
                    }
                    return
                }
            } else {
                const success = await createICP(formData)
                if (!success) {
                    return
                }
            }

            resetForm()
            onSuccess?.()
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Product Name*
                            </label>
                            <input
                                type="text"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                                placeholder="My Awesome Product"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Website URL
                            </label>
                            <input
                                type="url"
                                value={websiteUrl}
                                onChange={(e) => {
                                    const value = e.target.value
                                    setWebsiteUrl(value)
                                    
                                    // Real-time URL validation
                                    if (value.trim() === '') {
                                        setUrlError('')
                                        return
                                    }
                                    
                                    try {
                                        const url = new URL(value)
                                        if (!url.protocol.startsWith('http')) {
                                            setUrlError('URL must start with http:// or https://')
                                            return
                                        }
                                        setUrlError('')
                                    } catch {
                                        setUrlError('Please enter a valid URL (e.g., https://example.com)')
                                    }
                                }}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-base ${
                                    urlError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                placeholder="https://example.com (optional)"
                            />
                            {urlError && (
                                <p className="mt-1 text-sm text-red-600">{urlError}</p>
                            )}
                        </div>
                    </div>
                )

            case 2:
                return (
                    <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Product Details</h3>
                            <p className="text-gray-600 mb-6">Let AI analyze your website to automatically extract product information and suggest relevant communities.</p>
                            <button
                                type="button"
                                onClick={() => handleAnalyzeUrl(websiteUrl)}
                                disabled={isAnalyzing || !websiteUrl.trim() || !!urlError}
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-150"
                            >
                                {isAnalyzing ? 'Analyzing Website...' : 'Generate from Website'}
                            </button>
                            {!websiteUrl.trim() && (
                                <p className="mt-2 text-sm text-gray-500">Enter a website URL to use AI analysis</p>
                            )}
                            <button
                                type="button"
                                onClick={() => setCurrentStep(3)}
                                className="w-full mt-3 px-6 py-3 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
                            >
                                Skip and fill manually
                            </button>
                        </div>
                    </div>
                )

            case 3:
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Product Description*
                            </label>
                            <textarea
                                rows={4}
                                value={icpDescription}
                                onChange={(e) => setIcpDescription(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base"
                                placeholder="Describe your product and its key features..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Customer Pain Points
                            </label>
                            <textarea
                                rows={3}
                                value={painPoints}
                                onChange={(e) => setPainPoints(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base"
                                placeholder="What problems does your product solve?"
                            />
                        </div>
                    </div>
                )

            case 4:
                return (
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-medium text-gray-700">Target Communities</h4>
                                <span className="text-sm text-gray-500">{selectedSubreddits.length}/5 selected</span>
                            </div>

                            <div className="mb-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add subreddit (e.g., entrepreneur)"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                const target = e.target as HTMLInputElement
                                                if (selectedSubreddits.length < 5) {
                                                    if (handleAddSubreddit(target.value)) {
                                                        target.value = ''
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement
                                            if (input?.value && selectedSubreddits.length < 5) {
                                                if (handleAddSubreddit(input.value)) {
                                                    input.value = ''
                                                }
                                            }
                                        }}
                                        disabled={selectedSubreddits.length >= 5}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {selectedSubreddits.length > 0 && (
                                <div className="mb-4">
                                    <h5 className="text-sm font-medium text-gray-700 mb-2">Selected Communities:</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedSubreddits.map((subreddit, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                                            >
                                                r/{subreddit}
                                                <button
                                                    type="button"
                                                    onClick={() => removeSubreddit(index)}
                                                    className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {generatedSubreddits.length > 0 && (
                                <div>
                                    <h5 className="text-sm font-medium text-gray-700 mb-3">AI Suggestions:</h5>
                                    <div className="grid grid-cols-2 gap-2">
                                        {generatedSubreddits.map((subreddit) => (
                                            <button
                                                key={subreddit}
                                                type="button"
                                                onClick={() => toggleSubreddit(subreddit)}
                                                className={`p-3 text-sm rounded-lg border transition-all font-medium text-left ${selectedSubreddits.includes(subreddit)
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                                                    } ${selectedSubreddits.length >= 5 && !selectedSubreddits.includes(subreddit) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                disabled={selectedSubreddits.length >= 5 && !selectedSubreddits.includes(subreddit)}
                                            >
                                                r/{subreddit}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6">
            <div className="space-y-6">
                {/* Progress Indicator */}
                <div className="mb-8">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-gray-900">{STEPS[currentStep - 1]?.title}</h2>
                        <p className="text-gray-600 mt-1">{STEPS[currentStep - 1]?.description}</p>
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    {renderStep()}
                </div>

                {/* Error Message */}
                {(submitError || icpError) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <span className="text-red-400">⚠️</span>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-600">{submitError || icpError}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-6">
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canProceedToNext() || isSubmitting}
                        className="flex items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {currentStep === STEPS.length ? (
                            isSubmitting ? (editingIcp ? 'Updating...' : 'Creating...') : (editingIcp ? 'Update Product' : 'Create Product')
                        ) : (
                            <>
                                Next
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}