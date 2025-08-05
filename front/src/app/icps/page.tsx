'use client'

import { useEffect, useState } from 'react'
import CreateIcpForm from '@/src/lib/components/create-icp-form'
import { ICP } from '@/src/lib/db/schema'
import { getUserConfigs, deleteConfig, updateConfig } from '@/src/lib/actions/create-config'
import DashboardLayout from '@/src/lib/components/dashboard-layout'

export default function IcpsPage() {
  const [icps, setIcps] = useState<ICP[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  
  // Inline editing states
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')
  const [newSubreddit, setNewSubreddit] = useState('')

  const fetchIcps = async () => {
    try {
      const data = await getUserConfigs()
      setIcps(data)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchIcps()
  }, [])

  const handleCreateSuccess = () => {
    setShowCreateForm(false)
    fetchIcps()
  }

  const startEditing = (field: string, currentValue: any) => {
    setEditingField(field)
    setEditingValue(currentValue)
  }

  const cancelEditing = () => {
    setEditingField(null)
    setEditingValue(null)
    setNewKeyword('')
    setNewSubreddit('')
  }

  const saveField = async (icpId: number, field: string, value: any) => {
    setIsSaving(true)
    try {
      const icp = icps.find(i => i.id === icpId)
      if (!icp) return

      const formData = new FormData()
      formData.append('name', icp.name)
      formData.append('website', icp.website)
      formData.append('description', field === 'description' ? value : icp.data.description || '')
      formData.append('painPoints', field === 'painPoints' ? value : icp.data.painPoints || '')
      formData.append('keywords', JSON.stringify(field === 'keywords' ? value : icp.data.keywords || []))
      formData.append('subreddits', JSON.stringify(field === 'subreddits' ? value : icp.data.subreddits || []))

      const result = await updateConfig(icpId, formData)
      if (result.success) {
        fetchIcps()
        cancelEditing()
      } else {
        alert('Failed to update product')
      }
    } catch (error) {
      alert('Failed to update product')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product? This will also delete all associated posts.')) {
      return
    }

    setDeletingId(id)
    try {
      const result = await deleteConfig(id)
      if (result.success) {
        fetchIcps()
      } else {
        alert('Failed to delete product')
      }
    } catch (error) {
      alert('Failed to delete product')
    } finally {
      setDeletingId(null)
    }
  }

  const addKeyword = async (icpId: number, keyword: string) => {
    const icp = icps.find(i => i.id === icpId)
    if (!icp || !keyword.trim()) return
    
    const currentKeywords = icp.data.keywords || []
    if (currentKeywords.includes(keyword.trim())) return
    
    const newKeywords = [...currentKeywords, keyword.trim()]
    await saveField(icpId, 'keywords', newKeywords)
    setNewKeyword('')
  }

  const removeKeyword = async (icpId: number, keywordIndex: number) => {
    const icp = icps.find(i => i.id === icpId)
    if (!icp) return
    
    const newKeywords = (icp.data.keywords || []).filter((_, i) => i !== keywordIndex)
    await saveField(icpId, 'keywords', newKeywords)
  }

  const addSubreddit = async (icpId: number, subreddit: string) => {
    const icp = icps.find(i => i.id === icpId)
    if (!icp || !subreddit.trim()) return
    
    const cleanSubreddit = subreddit.replace(/^r\//, '').trim()
    const currentSubreddits = icp.data.subreddits || []
    if (currentSubreddits.includes(cleanSubreddit)) return
    
    const newSubreddits = [...currentSubreddits, cleanSubreddit]
    await saveField(icpId, 'subreddits', newSubreddits)
    setNewSubreddit('')
  }

  const removeSubreddit = async (icpId: number, subredditIndex: number) => {
    const icp = icps.find(i => i.id === icpId)
    if (!icp) return
    
    const newSubreddits = (icp.data.subreddits || []).filter((_, i) => i !== subredditIndex)
    await saveField(icpId, 'subreddits', newSubreddits)
  }


  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 space-y-6">
          <div className="text-center">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-600">
            Manage your product and its ideal customer profile to better target your content. You can create one product per account.
          </p>
        </div>



          {showCreateForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Create New Product
              </h3>
              <CreateIcpForm onSuccess={handleCreateSuccess} />
            </div>
          )}

          {icps.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No product yet</h3>
              <p className="text-gray-600 mb-4">
                Create your product to get started with lead generation.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Your Product
              </button>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
                <p className="text-sm text-blue-700">
                  You have reached the limit of one product per account. You can edit your existing product below.
                </p>
              </div>
              <div className="grid gap-6">
                {icps.map((icp) => (
                <div key={icp.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{icp.name}</h3>
                    <div className="flex items-center gap-2">
                      <a
                        href={icp.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Visit Website →
                      </a>
                    </div>
                  </div>
                  
                  {/* Description - Inline Editable */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Description:</h4>
                      {editingField !== `description-${icp.id}` && (
                        <button
                          onClick={() => startEditing(`description-${icp.id}`, icp.data.description)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    {editingField === `description-${icp.id}` ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveField(icp.id, 'description', editingValue)}
                            disabled={isSaving}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={isSaving}
                            className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-md cursor-pointer hover:bg-gray-100" 
                         onClick={() => startEditing(`description-${icp.id}`, icp.data.description)}>
                        {icp.data.description || 'Click to add description...'}
                      </p>
                    )}
                  </div>
                  
                  {/* Pain Points - Inline Editable */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Pain Points:</h4>
                      {editingField !== `painPoints-${icp.id}` && (
                        <button
                          onClick={() => startEditing(`painPoints-${icp.id}`, icp.data.painPoints)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    {editingField === `painPoints-${icp.id}` ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveField(icp.id, 'painPoints', editingValue)}
                            disabled={isSaving}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={isSaving}
                            className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md cursor-pointer hover:bg-gray-100" 
                         onClick={() => startEditing(`painPoints-${icp.id}`, icp.data.painPoints)}>
                        {icp.data.painPoints || 'Click to add pain points...'}
                      </p>
                    )}
                  </div>
                  
                  {/* Keywords - Inline Editable */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Keywords:</h4>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(icp.data.keywords || []).map((keyword, index) => (
                        <span
                          key={index}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {keyword}
                          <button
                            onClick={() => removeKeyword(icp.id, index)}
                            disabled={isSaving}
                            className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addKeyword(icp.id, newKeyword)
                          }
                        }}
                        placeholder="Add a keyword..."
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => addKeyword(icp.id, newKeyword)}
                        disabled={isSaving || !newKeyword.trim()}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Subreddits - Inline Editable */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Subreddits Being Monitored:</h4>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(icp.data.subreddits || []).map((subreddit, index) => (
                        <span
                          key={index}
                          className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                        >
                          r/{subreddit}
                          <button
                            onClick={() => removeSubreddit(icp.id, index)}
                            disabled={isSaving}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSubreddit}
                        onChange={(e) => setNewSubreddit(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addSubreddit(icp.id, newSubreddit)
                          }
                        }}
                        placeholder="Add a subreddit (e.g., entrepreneur)..."
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                      <button
                        onClick={() => addSubreddit(icp.id, newSubreddit)}
                        disabled={isSaving || !newSubreddit.trim()}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Created: {new Date(icp.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(icp.id)}
                        disabled={deletingId === icp.id}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === icp.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </>
          )}
      </div>
    </DashboardLayout>
  )
}