'use client'

import { useEffect, useState } from 'react'
import CreateIcpForm from '@/src/lib/components/create-icp-form'
import { ICP } from '@/src/lib/db/schema'
import { getUserConfigs, deleteConfig } from '@/src/lib/actions/create-config'
import DashboardLayout from '@/src/lib/components/dashboard-layout'

export default function IcpsPage() {
  const [icps, setIcps] = useState<ICP[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingIcp, setEditingIcp] = useState<ICP | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

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
    setEditingIcp(null)
    fetchIcps()
  }

  const handleEdit = (icp: ICP) => {
    setEditingIcp(icp)
    setShowCreateForm(true)
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

  const handleCancelEdit = () => {
    setShowCreateForm(false)
    setEditingIcp(null)
  }


  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Products
            </h1>
            <p className="text-gray-600">
              Manage your products and their ideal customer profiles to better target your content.
            </p>
          </div>

          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Your Products</h2>
            <button
              onClick={() => showCreateForm ? handleCancelEdit() : setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {showCreateForm ? 'Cancel' : 'Create New Product'}
            </button>
          </div>

          {showCreateForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingIcp ? 'Edit Product' : 'Create New Product'}
              </h3>
              <CreateIcpForm onSuccess={handleCreateSuccess} editingIcp={editingIcp} />
            </div>
          )}

          {icps.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first product to get started.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Your First Product
              </button>
            </div>
          ) : (
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
                  <p className="text-gray-600 mb-4">{icp.description}</p>
                  
                  {icp.keywords && icp.keywords.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Keywords:</h4>
                      <div className="flex flex-wrap gap-2">
                        {icp.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Created: {new Date(icp.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(icp)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        Edit
                      </button>
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
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}