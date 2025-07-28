'use client'

import { useState } from 'react'
import { createConfig, updateConfig } from '@/src/lib/actions/create-config'
import { generateKeywordsFromUrl } from '@/src/lib/actions/generate-keywords-from-url'
import { ICP } from '@/src/lib/db/schema'

interface CreateIcpFormProps {
  onSuccess?: () => void
  editingIcp?: ICP | null
}

export default function CreateIcpForm({ onSuccess, editingIcp }: CreateIcpFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [keywords, setKeywords] = useState<string[]>(editingIcp?.keywords || [])
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false)

  const handleGenerateKeywords = async (websiteUrl: string) => {
    if (!websiteUrl.trim()) {
      setSubmitError('Please enter a website URL to generate keywords')
      return
    }

    setIsGeneratingKeywords(true)
    setSubmitError(null)
    
    try {
      const generatedKeywords = await generateKeywordsFromUrl(websiteUrl)
      setKeywords(generatedKeywords)
    } catch (error) {
      setSubmitError('Failed to generate keywords from URL')
    } finally {
      setIsGeneratingKeywords(false)
    }
  }

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Add keywords to form data
      formData.append('keywords', JSON.stringify(keywords))
      
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
                handleGenerateKeywords(websiteInput.value)
              }
            }}
            disabled={isGeneratingKeywords}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingKeywords ? 'Generating...' : 'Generate Keywords'}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          id="description"
          rows={4}
          required
          defaultValue={editingIcp?.description || ''}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
          placeholder="Describe the ideal customer profile for this product..."
        />
      </div>


      {keywords.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            High-Intent Keywords ({keywords.length})
          </label>
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md">
            {keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

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