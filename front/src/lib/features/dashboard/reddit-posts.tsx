"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { Badge } from "@/src/lib/components/ui/badge"
import { Button } from "@/src/lib/components/ui/button"
import { Input } from "@/src/lib/components/ui/input"
import { Label } from "@/src/lib/components/ui/label"
import { Textarea } from "@/src/lib/components/ui/textarea"
import { getRedditPosts } from "@/src/lib/actions/get-reddit-posts"
import { createRedditPost } from "@/src/lib/actions/create-reddit-post"
import { RedditPost } from "@/src/lib/db/schema"

export function RedditPosts() {
  const [posts, setPosts] = useState<RedditPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newPost, setNewPost] = useState({
    subreddit: "",
    title: "",
    content: "",
    category: "",
    url: ""
  })

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const data = await getRedditPosts()
      setPosts(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!newPost.subreddit || !newPost.title || !newPost.content || !newPost.category || !newPost.url) {
      return
    }
    
    try {
      await createRedditPost(newPost)
      setNewPost({
        subreddit: "",
        title: "",
        content: "",
        category: "",
        url: ""
      })
      setShowForm(false)
      fetchPosts()
    } catch (error) {
      console.error('Error creating post:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-sm font-medium text-gray-900">Reddit Posts</h2>
        <Button 
          onClick={() => setShowForm(!showForm)}
          size="sm"
        >
          {showForm ? "Cancel" : "Add Post"}
        </Button>
      </div>

      {showForm && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subreddit" className="text-xs">Subreddit</Label>
              <Input
                id="subreddit"
                value={newPost.subreddit}
                onChange={(e) => setNewPost({...newPost, subreddit: e.target.value})}
                placeholder="webdev"
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="category" className="text-xs">Category</Label>
              <Input
                id="category"
                value={newPost.category}
                onChange={(e) => setNewPost({...newPost, category: e.target.value})}
                placeholder="discussion"
                className="text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="title" className="text-xs">Title</Label>
              <Input
                id="title"
                value={newPost.title}
                onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                placeholder="Post title"
                className="text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="content" className="text-xs">Content</Label>
              <Textarea
                id="content"
                value={newPost.content}
                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                placeholder="Post content"
                className="text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="url" className="text-xs">URL</Label>
              <Input
                id="url"
                value={newPost.url}
                onChange={(e) => setNewPost({...newPost, url: e.target.value})}
                placeholder="https://reddit.com/r/..."
                className="text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleCreatePost} size="sm" className="w-full">
                Create Post
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {posts.length === 0 ? (
        <div className="p-6 text-center text-gray-500 text-sm">
          No posts found
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {posts.map((post) => (
            <div key={post.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    r/{post.subreddit}
                  </span>
                  <span className="text-sm font-medium text-blue-700 bg-blue-100 px-3 py-1 rounded">
                    {post.category}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                <a href={post.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {post.title}
                </a>
              </h3>
              <p className="text-xs text-gray-600 line-clamp-3">
                {post.content}
              </p>
              <div className="mt-2">
                <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                  View on Reddit
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 