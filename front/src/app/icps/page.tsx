'use client'

import { useEffect, useState } from 'react'
import CreateIcpForm from '@/src/lib/components/create-icp-form'
import { ICP } from '@/src/lib/db/schema'
import { getUserConfigs } from '@/src/lib/actions/create-config'
import DashboardLayout from '@/src/lib/components/dashboard-layout'

export default function IcpsPage() {
  const [icps, setIcps] = useState<ICP[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const fetchIcps = async () => {
    try {
      const data = await getUserConfigs()
      setIcps(data)
    } catch (error) {
      console.error('Error fetching ICPs:', error)
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
              Ideal Customer Profiles
            </h1>
            <p className="text-gray-600">
              Manage your ideal customer profiles to better target your content.
            </p>
          </div>

          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Your ICPs</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {showCreateForm ? 'Cancel' : 'Create New ICP'}
            </button>
          </div>

          {showCreateForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New ICP</h3>
              <CreateIcpForm onSuccess={handleCreateSuccess} />
            </div>
          )}

          {icps.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No ICPs yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first ideal customer profile to get started.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Your First ICP
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {icps.map((icp) => (
                <div key={icp.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{icp.name}</h3>
                    <a
                      href={icp.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Visit Website →
                    </a>
                  </div>
                  <p className="text-gray-600 mb-4">{icp.description}</p>
                  <div className="text-sm text-gray-500">
                    Created: {new Date(icp.createdAt).toLocaleDateString()}
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