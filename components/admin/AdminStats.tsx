'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, UserCheck, UserX, Shield, Activity, MessageSquare, Eye } from 'lucide-react'

interface AdminStatsProps {
  stats: {
    totalUsers: number
    activeUsers: number
    bannedUsers: number
    adminUsers: number
    totalPolls?: number
    totalComments?: number
    totalVotes?: number
  }
}

export function AdminStats({ stats }: AdminStatsProps) {
  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      description: 'All registered users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: UserCheck,
      description: 'Users with active accounts',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Banned Users',
      value: stats.bannedUsers,
      icon: UserX,
      description: 'Users currently banned',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Admin Users',
      value: stats.adminUsers,
      icon: Shield,
      description: 'Users with admin privileges',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  // Add optional stats if available
  if (stats.totalPolls !== undefined) {
    statCards.push({
      title: 'Total Polls',
      value: stats.totalPolls,
      icon: Activity,
      description: 'All created polls',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    })
  }

  if (stats.totalComments !== undefined) {
    statCards.push({
      title: 'Total Comments',
      value: stats.totalComments,
      icon: MessageSquare,
      description: 'All poll comments',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    })
  }

  if (stats.totalVotes !== undefined) {
    statCards.push({
      title: 'Total Votes',
      value: stats.totalVotes,
      icon: Eye,
      description: 'All poll votes cast',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}