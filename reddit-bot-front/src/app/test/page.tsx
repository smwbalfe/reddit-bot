"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/lib/components/ui/tabs"
import { Button } from "@/src/lib/components/ui/button"
import { Input } from "@/src/lib/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/lib/components/ui/select"
import { Progress } from "@/src/lib/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/lib/components/ui/avatar"
import { Badge } from "@/src/lib/components/ui/badge"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const sentimentData = [
  { name: '1h', positive: 65, negative: 35, neutral: 45 },
  { name: '6h', positive: 55, negative: 45, neutral: 40 },
  { name: '12h', positive: 70, negative: 30, neutral: 50 },
  { name: '24h', positive: 45, negative: 55, neutral: 35 },
  { name: '48h', positive: 60, negative: 40, neutral: 45 },
]

const cryptoData = [
  { name: 'BTC', price: '$42,831.89', change: '+2.4%', sentiment: 'positive' },
  { name: 'ETH', price: '$2,345.12', change: '+1.2%', sentiment: 'positive' },
  { name: 'SOL', price: '$103.45', change: '-3.2%', sentiment: 'negative' },
  { name: 'DOGE', price: '$0.082', change: '+5.7%', sentiment: 'positive' },
]

export default function CryptoSentimentDashboard() {
  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Crypto Sentiment Analyzer</h1>
        <div className="flex gap-4">
          <Input placeholder="Search coin..." className="w-64" />
          <Select>
            <SelectTrigger className="w-32 ">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="6h">6 Hours</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
          <TabsTrigger value="tweets">Top Tweets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Positive Sentiment</CardTitle>
                <Badge variant="secondary">+8%</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">65.2%</div>
                <Progress value={65} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Negative Sentiment</CardTitle>
                <Badge variant="destructive">-3%</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24.5%</div>
                <Progress value={25} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tweet Volume</CardTitle>
                <Badge variant="secondary">+12%</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12,345</div>
                <Progress value={75} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Influencer Reach</CardTitle>
                <Badge variant="secondary">+5%</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2M</div>
                <Progress value={60} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sentimentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="positive" stroke="#10b981" name="Positive" />
                      <Line type="monotone" dataKey="negative" stroke="#ef4444" name="Negative" />
                      <Line type="monotone" dataKey="neutral" stroke="#6b7280" name="Neutral" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Mentioned Coins</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cryptoData.map((coin) => (
                  <div key={coin.name} className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={`https://cryptologos.cc/logos/${coin.name.toLowerCase()}-${coin.name.toLowerCase()}-logo.png`} />
                      <AvatarFallback>{coin.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{coin.name}</p>
                      <p className="text-sm text-muted-foreground">{coin.price}</p>
                    </div>
                    <Badge variant={coin.sentiment === 'positive' ? 'outline' : 'destructive'}>
                      {coin.change}
                    </Badge>
                    <Button variant="outline" size="sm">Details</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}