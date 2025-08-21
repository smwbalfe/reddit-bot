'use client'

import { useEffect, useState } from 'react'
import CreateIcpForm from './components/create-icp-form'
import DashboardLayout from '@/src/lib/features/global/dashboard-layout'
import { useICPStore } from '@/src/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/lib/components/ui/card'
import { Button } from '@/src/lib/components/ui/button'
import { ExternalLink, Trash2, Globe, RefreshCw, Plus, X, Edit2, Package, ChevronDown, ChevronRight, Database } from 'lucide-react'

export function IcpsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [newSubreddit, setNewSubreddit] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  
  const {
    icps,
    isLoading,
    isDeleting,
    isGenerating,
    generatedSubreddits,
    selectedSubreddits,
    fetchICPs,
    deleteICP,
    updateICP,
    regenerateSuggestions,
    updateSelectedSubreddits,
  } = useICPStore()

  useEffect(() => {
    fetchICPs()
  }, [fetchICPs])

  const handleCreateSuccess = () => {
    setShowCreateForm(false)
  }

  const startEditing = (field: string, currentValue: any) => {
    setEditingField(field)
    setEditingValue(currentValue)
  }

  const cancelEditing = () => {
    setEditingField(null)
    setEditingValue(null)
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
      
      const skipRefetch = field === 'subreddits'
      const success = await updateICP(icpId, formData, skipRefetch)
      if (success) {
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

    const success = await deleteICP(id)
    if (!success) {
      alert('Failed to delete product')
    }
  }


  const toggleSubredditSelection = (icpId: number, subreddit: string) => {
    const currentSelected = selectedSubreddits[icpId] || []
    let newSelected: string[]
    
    if (currentSelected.includes(subreddit)) {
      newSelected = currentSelected.filter(s => s !== subreddit)
    } else if (currentSelected.length < 5) {
      newSelected = [...currentSelected, subreddit]
    } else {
      return
    }
    
    updateSelectedSubreddits(icpId, newSelected)
    saveField(icpId, 'subreddits', newSelected)
  }

  const addSubreddit = async (icpId: number, subreddit: string) => {
    const cleanSubreddit = subreddit.replace(/^r\//, '').trim()
    const currentSelected = selectedSubreddits[icpId] || []
    
    if (!cleanSubreddit || currentSelected.includes(cleanSubreddit) || currentSelected.length >= 5) return
    
    const newSelected = [...currentSelected, cleanSubreddit]
    updateSelectedSubreddits(icpId, newSelected)
    await saveField(icpId, 'subreddits', newSelected)
    setNewSubreddit('')
  }

  const removeSubreddit = async (icpId: number, subredditIndex: number) => {
    const currentSelected = selectedSubreddits[icpId] || []
    const newSelected = currentSelected.filter((_, i) => i !== subredditIndex)
    updateSelectedSubreddits(icpId, newSelected)
    await saveField(icpId, 'subreddits', newSelected)
  }

  const handleRegenerateSuggestions = async (icpId: number) => {
    await regenerateSuggestions(icpId)
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }




  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-600"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Product Configuration</h1>
          <p className="text-base text-slate-600">Configure your product profile and targeting</p>
        </div>

        {icps.length === 0 ? (
          <>
            {showCreateForm && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Setup Your Product</CardTitle>
                </CardHeader>
                <CardContent>
                  <CreateIcpForm onSuccess={handleCreateSuccess} />
                </CardContent>
              </Card>
            )}

            {!showCreateForm && (
              <Card>
                <CardContent className="text-center py-16">
                  <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-6">
                    <Package className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Setup your product</h3>
                  <p className="text-base text-gray-600 mb-6">Configure your product to start generating leads from Reddit</p>
                  <Button 
                    onClick={() => setShowCreateForm(true)} 
                    size="default"
                    className="transition-all duration-150 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Setup Product
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          icps.map((icp) => (
              <Card key={icp.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-3">
                        {icp.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(icp.website, '_blank')}
                          className="h-7 w-7 p-0 text-blue-600"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                      <p className="text-sm text-slate-500 mt-2">{icp.website}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(icp.id)}
                        disabled={isDeleting === icp.id}
                        className="h-8 px-3 text-sm text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Product Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <span className="font-medium text-gray-600">Description:</span>
                        <p className="text-gray-800 mt-1 line-clamp-2">{icp.data.description || 'No description'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Pain Points:</span>
                        <p className="text-gray-800 mt-1 line-clamp-2">{icp.data.painPoints || 'No pain points'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Subreddits:</span>
                        <p className="text-gray-800 mt-1">{(selectedSubreddits[icp.id] || []).length}/5 selected</p>
                      </div>
                    </div>
                    
          
                  </div>

                  {/* Collapsible Sections */}
                  <div className="space-y-2">
                    {/* Description Section */}
                    <div className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleSection(`description-${icp.id}`)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {expandedSections[`description-${icp.id}`] ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="font-medium text-gray-900">Product Description</span>
                        </div>
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </button>
                      
                      {expandedSections[`description-${icp.id}`] && (
                        <div className="px-4 pb-4 border-t border-gray-100">
                          {editingField === `description-${icp.id}` ? (
                            <div className="space-y-3 mt-3">
                              <textarea
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="w-full px-3 py-3 text-base border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                rows={4}
                                placeholder="Describe your product and its key features..."
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveField(icp.id, 'description', editingValue)}
                                  disabled={isSaving}
                                >
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={cancelEditing}
                                  disabled={isSaving}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3">
                              <div 
                                className="text-gray-700 bg-white p-3 rounded-md border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors min-h-[4rem] flex items-center"
                                onClick={() => startEditing(`description-${icp.id}`, icp.data.description)}
                              >
                                {icp.data.description || 'Click to add product description...'}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Pain Points Section */}
                    <div className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleSection(`painPoints-${icp.id}`)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {expandedSections[`painPoints-${icp.id}`] ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="font-medium text-gray-900">Customer Pain Points</span>
                        </div>
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </button>
                      
                      {expandedSections[`painPoints-${icp.id}`] && (
                        <div className="px-4 pb-4 border-t border-gray-100">
                          {editingField === `painPoints-${icp.id}` ? (
                            <div className="space-y-3 mt-3">
                              <textarea
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="w-full px-3 py-3 text-base border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                rows={3}
                                placeholder="What problems does your product solve?"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveField(icp.id, 'painPoints', editingValue)}
                                  disabled={isSaving}
                                >
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={cancelEditing}
                                  disabled={isSaving}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3">
                              <div 
                                className="text-gray-700 bg-white p-3 rounded-md border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors min-h-[3rem] flex items-center"
                                onClick={() => startEditing(`painPoints-${icp.id}`, icp.data.painPoints)}
                              >
                                {icp.data.painPoints || 'Click to add customer pain points...'}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Subreddits Section */}
                    <div className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleSection(`subreddits-${icp.id}`)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {expandedSections[`subreddits-${icp.id}`] ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="font-medium text-gray-900">Target Communities</span>
                          <span className="text-sm text-gray-500">({(selectedSubreddits[icp.id] || []).length}/5)</span>
                        </div>
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </button>
                      
                      {expandedSections[`subreddits-${icp.id}`] && (
                        <div className="px-4 pb-4 border-t border-gray-100">
                          <div className="mt-4 space-y-6">
                            
                            {/* Currently Selected */}
                            {(selectedSubreddits[icp.id] || []).length > 0 ? (
                              <div>
                                <h5 className="text-sm font-semibold text-gray-900 mb-3">Currently Monitoring ({(selectedSubreddits[icp.id] || []).length}/5)</h5>
                                <div className="flex flex-wrap gap-2">
                                  {(selectedSubreddits[icp.id] || []).map((subreddit, index) => (
                                    <div
                                      key={index}
                                      className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200"
                                    >
                                      r/{subreddit}
                                      <button
                                        onClick={() => removeSubreddit(icp.id, index)}
                                        disabled={isSaving}
                                        className="text-green-600 hover:text-green-800 focus:outline-none"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-8 px-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                                <Globe className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                                <h6 className="text-sm font-medium text-gray-900 mb-2">No communities selected</h6>
                                <p className="text-sm text-gray-500 mb-4">Start by finding relevant subreddits or add them manually</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRegenerateSuggestions(icp.id)}
                                  disabled={isGenerating === icp.id}
                                  className="text-sm"
                                >
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  {isGenerating === icp.id ? 'Finding...' : 'Find Subreddits'}
                                </Button>
                              </div>
                            )}

                            {/* Add More Section */}
                            {(selectedSubreddits[icp.id] || []).length < 5 && (
                              <div>
                                <div className="flex items-center justify-between mb-4">
                                  <h5 className="text-sm font-semibold text-gray-900">Add More Communities</h5>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRegenerateSuggestions(icp.id)}
                                    disabled={isGenerating === icp.id}
                                    className="text-xs px-3 py-1"
                                  >
                                    <RefreshCw className="w-3 h-3 mr-2" />
                                    {isGenerating === icp.id ? 'Finding...' : 'Find More Subreddits'}
                                  </Button>
                                </div>
                                
                                {/* AI Suggestions */}
                                {generatedSubreddits[icp.id]?.filter(s => !(selectedSubreddits[icp.id] || []).includes(s)).length > 0 && (
                                  <div className="mb-4">
                                    <p className="text-xs font-medium text-blue-600 mb-3 uppercase tracking-wider">AI Suggestions</p>
                                    <div className="flex flex-wrap gap-2">
                                      {generatedSubreddits[icp.id]
                                        .filter(subreddit => !(selectedSubreddits[icp.id] || []).includes(subreddit))
                                        .map((subreddit, index) => (
                                          <button
                                            key={index}
                                            onClick={() => toggleSubredditSelection(icp.id, subreddit)}
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200 hover:bg-blue-100 transition-colors"
                                          >
                                            r/{subreddit}
                                            <Plus className="w-4 h-4" />
                                          </button>
                                        ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Add Custom */}
                                <div>
                                  <p className="text-xs font-medium text-gray-600 mb-3 uppercase tracking-wider">Add Custom</p>
                                  <div className="flex gap-3">
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
                                      placeholder="Enter subreddit name (e.g., startup)"
                                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <Button
                                      onClick={() => addSubreddit(icp.id, newSubreddit)}
                                      disabled={isSaving || !newSubreddit.trim()}
                                      size="sm"
                                      className="px-4"
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      Add
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Max reached message */}
                            {(selectedSubreddits[icp.id] || []).length >= 5 && (
                              <div className="text-center py-4 px-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-sm text-amber-700 font-medium">Maximum 5 communities reached</p>
                                <p className="text-xs text-amber-600 mt-1">Remove some to add different ones</p>
                              </div>
                            )}
                            
                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </DashboardLayout>
  )
}
