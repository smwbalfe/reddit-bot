import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/lib/components/ui/card'
import { Progress } from '@/src/lib/components/ui/progress'
import { Button } from '@/src/lib/components/ui/button'
import { Badge } from '@/src/lib/components/ui/badge'
import { Activity, BarChart3, Settings, Shield, Users, Zap, ArrowUpRight, ChevronRight, CreditCard } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/lib/components/ui/tabs'
import { useUser } from '@/src/lib/features/auth/hooks/use-user'
import { useState } from 'react'

export const PremiumPage = () => {
    const { user } = useUser()
    const [isLoading, setIsLoading] = useState(false)
    const [usageData, setUsageData] = useState({
        dailyUsage: 75,
        storage: 45,
        totalUsage: 1239,
        activeUsers: 89,
        storageUsed: 45
    })

    if (!user) return null
    return (
        <div className="min-h-screen bg-background dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-5xl font-bold text-primary dark:text-blue-400">Premium Dashboard</h1>
                    </div>
                   
                </div>

                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        <TabsTrigger value="team">Team</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-primary- dark:bg-gray-800">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-2xl bg-red-">
                                        <Activity className="h-6 w-6 bg- text-primary dark:text-primary-dark" />
                                        Activity Overview
                                    </CardTitle>
                                    <CardDescription className="text-base">Your recent activity and performance</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-base font-semibold">Daily Usage</span>
                                                <span className="text-base text-text dark:text-gray-300">{usageData.dailyUsage}%</span>
                                            </div>
                                            <Progress value={usageData.dailyUsage} className="h-2 bg-primary/20 dark:bg-blue-900" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-base font-semibold">Storage</span>
                                                <span className="text-base text-text dark:text-gray-300">{usageData.storage}%</span>
                                            </div>
                                            <Progress value={usageData.storage} className="h-2 bg-primary/20 dark:bg-blue-900" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-2xl">
                                        <Zap className="h-6 w-6 text-secondary" />
                                        Premium Features
                                    </CardTitle>
                                    <CardDescription className="text-base">Access to exclusive features</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <Shield className="h-6 w-6 text-accent" />
                                            <div>
                                                <p className="text-lg font-semibold">Advanced Security</p>
                                                <p className="text-sm text-text dark:text-gray-300">Enterprise-grade protection</p>
                                            </div>
                                            <ChevronRight className="h-5 w-5 ml-auto text-text dark:text-gray-300" />
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <Users className="h-6 w-6 text-primary" />
                                            <div>
                                                <p className="text-lg font-semibold">Team Collaboration</p>
                                                <p className="text-sm text-text dark:text-gray-300">Unlimited team members</p>
                                            </div>
                                            <ChevronRight className="h-5 w-5 ml-auto text-text dark:text-gray-300" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-2xl">
                                        <Badge variant="secondary" className="bg-secondary text-white dark:bg-green-500 dark:text-gray-900 text-sm">New</Badge>
                                        Quick Actions
                                    </CardTitle>
                                    <CardDescription className="text-base">Common tasks and shortcuts</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Button variant="outline" className="h-20 flex flex-col gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <Activity className="h-6 w-6" />
                                            <span className="text-base">Analytics</span>
                                        </Button>
                                        <Button variant="outline" className="h-20 flex flex-col gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <Users className="h-6 w-6" />
                                            <span className="text-base">Team</span>
                                        </Button>
                                        <Button variant="outline" className="h-20 flex flex-col gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <Settings className="h-6 w-6" />
                                            <span className="text-base">Settings</span>
                                        </Button>
                                        <Button variant="outline" className="h-20 flex flex-col gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <Shield className="h-6 w-6" />
                                            <span className="text-base">Security</span>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-2xl">
                                    <BarChart3 className="h-6 w-6 text-primary" />
                                    Performance Metrics
                                </CardTitle>
                                <CardDescription className="text-base">Track your premium account performance</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-4 rounded-lg bg-primary text-white dark:bg-blue-600">
                                        <div className="flex items-center justify-between">
                                            <span className="text-base font-semibold">Total Usage</span>
                                            <ArrowUpRight className="h-5 w-5 text-white" />
                                        </div>
                                        <p className="text-3xl font-bold mt-2">{usageData.totalUsage}</p>
                                        <p className="text-sm">+12% from last month</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-secondary text-white dark:bg-green-600">
                                        <div className="flex items-center justify-between">
                                            <span className="text-base font-semibold">Active Users</span>
                                            <ArrowUpRight className="h-5 w-5 text-white" />
                                        </div>
                                        <p className="text-3xl font-bold mt-2">{usageData.activeUsers}</p>
                                        <p className="text-sm">+5% from last week</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-accent text-white dark:bg-amber-500">
                                        <div className="flex items-center justify-between">
                                            <span className="text-base font-semibold">Storage Used</span>
                                            <ArrowUpRight className="h-5 w-5 text-white" />
                                        </div>
                                        <p className="text-3xl font-bold mt-2">{usageData.storageUsed}%</p>
                                        <p className="text-sm">+3% from yesterday</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}