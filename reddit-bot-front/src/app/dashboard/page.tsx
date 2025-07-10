"use client"

import { useUser } from "@/src/lib/features/auth/hooks/use-user"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { Badge } from "@/src/lib/components/ui/badge"
import { Button } from "@/src/lib/components/ui/button"
import { Input } from "@/src/lib/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/lib/components/ui/select"
import { Search, Plus, Trash2, Activity, Eye, MessageSquare, TrendingUp, Clock } from "lucide-react"

interface Keyword {
  id: number
  keyword: string
  subreddit: string
  mentions: number
  status: "active" | "paused"
  lastMention: string
}

export default function Dashboard() {
  const { user } = useUser()
  const [keywords, setKeywords] = useState<Keyword[]>([
    { id: 1, keyword: "Next.js", subreddit: "webdev", mentions: 12, status: "active", lastMention: "2 hours ago" },
    { id: 2, keyword: "React", subreddit: "reactjs", mentions: 8, status: "active", lastMention: "1 hour ago" },
    { id: 3, keyword: "TypeScript", subreddit: "programming", mentions: 5, status: "paused", lastMention: "4 hours ago" }
  ])
  
  const [newKeyword, setNewKeyword] = useState("")
  const [selectedSubreddit, setSelectedSubreddit] = useState("")

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const addKeyword = () => {
    if (newKeyword.trim() && selectedSubreddit) {
      const keyword: Keyword = {
        id: Date.now(),
        keyword: newKeyword.trim(),
        subreddit: selectedSubreddit,
        mentions: 0,
        status: "active",
        lastMention: "Just added"
      }
      setKeywords([...keywords, keyword])
      setNewKeyword("")
      setSelectedSubreddit("")
    }
  }

  const deleteKeyword = (id: number) => {
    setKeywords(keywords.filter(k => k.id !== id))
  }

  const toggleStatus = (id: number) => {
    setKeywords(keywords.map(k => 
      k.id === id ? { ...k, status: k.status === "active" ? "paused" : "active" } : k
    ))
  }

  const totalMentions = keywords.reduce((sum, k) => sum + k.mentions, 0)
  const activeKeywords = keywords.filter(k => k.status === "active").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <Activity className="h-4 w-4 mr-2" />
            Reddit Monitor
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            Keyword Monitoring Dashboard
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Track and analyze keyword mentions across your favorite subreddits in real-time
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Active Keywords</CardTitle>
              <div className="p-2 bg-blue-200 rounded-lg">
                <Activity className="h-4 w-4 text-blue-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{activeKeywords}</div>
              <p className="text-xs text-blue-700 mt-1">Currently monitoring</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-900">Total Mentions</CardTitle>
              <div className="p-2 bg-emerald-200 rounded-lg">
                <MessageSquare className="h-4 w-4 text-emerald-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900">{totalMentions}</div>
              <p className="text-xs text-emerald-700 mt-1">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                All time
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">Subreddits</CardTitle>
              <div className="p-2 bg-purple-200 rounded-lg">
                <Eye className="h-4 w-4 text-purple-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{new Set(keywords.map(k => k.subreddit)).size}</div>
              <p className="text-xs text-purple-700 mt-1">Communities tracked</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-xl">
            <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Add New Keyword
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Enter keyword to monitor..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className="flex-1 h-12 text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
              <Select value={selectedSubreddit} onValueChange={setSelectedSubreddit}>
                <SelectTrigger className="sm:w-64 h-12 border-slate-200 focus:border-blue-500">
                  <SelectValue placeholder="Select subreddit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webdev">r/webdev</SelectItem>
                  <SelectItem value="reactjs">r/reactjs</SelectItem>
                  <SelectItem value="programming">r/programming</SelectItem>
                  <SelectItem value="javascript">r/javascript</SelectItem>
                  <SelectItem value="nextjs">r/nextjs</SelectItem>
                  <SelectItem value="technology">r/technology</SelectItem>
                  <SelectItem value="startups">r/startups</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={addKeyword} 
                disabled={!newKeyword.trim() || !selectedSubreddit}
                className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Keyword
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-xl">
            <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              Monitored Keywords
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {keywords.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6">
                    <Search className="h-12 w-12 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">No keywords yet</h3>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Start monitoring Reddit conversations by adding your first keyword above
                  </p>
                </div>
              ) : (
                keywords.map((keyword) => (
                  <div key={keyword.id} className="group bg-gradient-to-r from-white to-slate-50 border border-slate-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-slate-800">{keyword.keyword}</h3>
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            r/{keyword.subreddit}
                          </Badge>
                          <Badge 
                            variant={keyword.status === "active" ? "default" : "secondary"}
                            className={keyword.status === "active" 
                              ? "bg-green-100 text-green-800 border-green-200" 
                              : "bg-slate-100 text-slate-600 border-slate-200"
                            }
                          >
                            {keyword.status === "active" ? "Active" : "Paused"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{keyword.mentions}</span>
                            <span>mentions</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-purple-500" />
                            <span>Last: {keyword.lastMention}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStatus(keyword.id)}
                          className="border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          {keyword.status === "active" ? "Pause" : "Resume"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteKeyword(keyword.id)}
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 