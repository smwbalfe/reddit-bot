'use client'

import { useState } from 'react'
import { createConfig, updateConfig } from '@/src/lib/actions/create-config'
import { analyzeUrl } from '@/src/lib/actions/analyze-url'
import { ICP } from '@/src/lib/db/schema'

interface CreateIcpFormProps {
  onSuccess?: () => void
  editingIcp?: ICP | null
}

export default function CreateIcpForm({ onSuccess, editingIcp }: CreateIcpFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [keywords, setKeywords] = useState<string[]>(editingIcp?.data?.keywords || [])
  const [subreddits, setSubreddits] = useState<string[]>(editingIcp?.data?.subreddits || [])
  const [painPoints, setPainPoints] = useState<string>(editingIcp?.data?.painPoints || '')
  const [icpDescription, setIcpDescription] = useState<string>(editingIcp?.data?.description || '')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  const addKeyword = (keyword: string) => {
    if (keyword.trim() && !keywords.includes(keyword.trim())) {
      setKeywords([...keywords, keyword.trim()])
    }
  }

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index))
  }

  const addSubreddit = (subreddit: string) => {
    const cleanSubreddit = subreddit.replace(/^r\//, '').trim()
    if (cleanSubreddit && !subreddits.includes(cleanSubreddit)) {
      setSubreddits([...subreddits, cleanSubreddit])
    }
  }

  const removeSubreddit = (index: number) => {
    setSubreddits(subreddits.filter((_, i) => i !== index))
  }

  const handleAnalyzeUrl = async (url: string) => {
    if (!url.trim()) {
      setSubmitError('Please enter a website URL to analyze')
      return
    }

    setIsAnalyzing(true)
    setSubmitError(null)
    
    try {
      const result = await analyzeUrl(url)
      console.log(result)
      setKeywords(result.keywords)
      setSubreddits(result.subreddits)
      setIcpDescription(result.icp_description)
      setPainPoints(result.pain_points)
    } catch (error) {
      setSubmitError('Failed to analyze URL')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Add keywords, subreddits, painPoints, and description to form data
      formData.append('keywords', JSON.stringify(keywords))
      formData.append('subreddits', JSON.stringify(subreddits))
      formData.append('painPoints', painPoints)
      formData.set('description', icpDescription)
      
      const result = editingIcp 
        ? await updateConfig(editingIcp.id, formData)
        : await createConfig(formData)
      
      if (!result.success) {
        if (Array.isArray(result.error)) {
          setSubmitError(result.error.map(e => e.message).join(', '))
        } else {
          setSubmitError(result.error || `Failed to ${editingIcp ? 'update' : 'create'} product`)
        }
        return
      }

      onSuccess?.()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          name="name"
          type="text"
          id="name"
          required
          defaultValue={editingIcp?.name || ''}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter product name"
        />
      </div>

      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
          Website URL
        </label>
        <div className="flex gap-2">
          <input
            name="website"
            type="url"
            id="website"
            defaultValue={editingIcp?.website || ''}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com"
          />
          <button
            type="button"
            onClick={() => {
              const websiteInput = document.getElementById('website') as HTMLInputElement
              if (websiteInput?.value) {
                handleAnalyzeUrl(websiteInput.value)
              }
            }}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze URL'}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description (Auto-generated from URL analysis)
        </label>
        <textarea
          name="description"
          id="description"
          rows={4}
          required
          value={icpDescription}
          onChange={(e) => setIcpDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
          placeholder="This will be automatically filled when you analyze a URL, or you can enter your own description..."
        />
      </div>

      <div>
        <label htmlFor="painPoints" className="block text-sm font-medium text-gray-700 mb-1">
          Pain Points (Auto-generated from URL analysis)
        </label>
        <textarea
          name="painPoints"
          id="painPoints"
          rows={3}
          value={painPoints}
          onChange={(e) => setPainPoints(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
          placeholder="This will be automatically filled when you analyze a URL, or you can enter your own pain points..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Keywords {keywords.length > 0 && `(${keywords.length})`}
        </label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter a keyword and press Enter"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const target = e.target as HTMLInputElement
                  addKeyword(target.value)
                  target.value = ''
                }
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement
                if (input?.value) {
                  addKeyword(input.value)
                  input.value = ''
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add
            </button>
          </div>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md">
              {keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(index)}
                    className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subreddits {subreddits.length > 0 && `(${subreddits.length})`}
        </label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter subreddit name (e.g., 'entrepreneur' or 'r/entrepreneur')"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const target = e.target as HTMLInputElement
                  addSubreddit(target.value)
                  target.value = ''
                }
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement
                if (input?.value) {
                  addSubreddit(input.value)
                  input.value = ''
                }
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Add
            </button>
          </div>
          {subreddits.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-purple-50 rounded-md">
              {subreddits.map((subreddit, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                >
                  r/{subreddit}
                  <button
                    type="button"
                    onClick={() => removeSubreddit(index)}
                    className="ml-1 text-purple-600 hover:text-purple-800 focus:outline-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting 
            ? (editingIcp ? 'Updating...' : 'Creating...') 
            : (editingIcp ? 'Update Product' : 'Create Product')
          }
        </button>
      </div>
    </form>
  )
}