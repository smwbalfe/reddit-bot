"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/lib/components/ui/card"
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
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center p-12">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-purple-200 rounded-full animate-ping"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
                </svg>
              </div>
              Reddit Posts
            </CardTitle>
            <CardDescription>
              Manage and monitor your Reddit content
            </CardDescription>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className={`transition-all duration-200 ${
              showForm 
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200" 
                : "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg"
            }`}
            variant={showForm ? "outline" : "default"}
          >
            {showForm ? "✕ Cancel" : "+ Add Post"}
          </Button>
        </div>
      </CardHeader>

      {showForm && (
        <div className="px-6 pb-6">
          <Card className="border border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subreddit" className="text-sm font-medium text-gray-700">
                    Subreddit
                  </Label>
                  <Input
                    id="subreddit"
                    value={newPost.subreddit}
                    onChange={(e) => setNewPost({...newPost, subreddit: e.target.value})}
                    placeholder="webdev"
                    className="border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                    Category
                  </Label>
                  <Input
                    id="category"
                    value={newPost.category}
                    onChange={(e) => setNewPost({...newPost, category: e.target.value})}
                    placeholder="discussion"
                    className="border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Title
                </Label>
                <Input
                  id="title"
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  placeholder="Post title"
                  className="border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                  Content
                </Label>
                <Textarea
                  id="content"
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  placeholder="Post content"
                  className="border-gray-200 focus:border-orange-400 focus:ring-orange-400 min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url" className="text-sm font-medium text-gray-700">
                  URL
                </Label>
                <Input
                  id="url"
                  value={newPost.url}
                  onChange={(e) => setNewPost({...newPost, url: e.target.value})}
                  placeholder="https://reddit.com/r/..."
                  className="border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                />
              </div>
              <Button 
                onClick={handleCreatePost} 
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                disabled={!newPost.subreddit || !newPost.title || !newPost.content || !newPost.category || !newPost.url}
              >
                ✓ Create Post
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      <CardContent className="pt-0">
        {posts.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No posts yet</h3>
            <p className="text-gray-500 text-sm">Start by creating your first Reddit post</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="border border-gray-200 hover:border-orange-300 transition-all duration-200 hover:shadow-lg group bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-mono">
                        r/{post.subreddit}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        {post.category}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(post.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {post.title}
                    </a>
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed mb-4 line-clamp-3">
                    {post.content}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <a 
                      href={post.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                      </svg>
                      View on Reddit
                    </a>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>Monitored</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 