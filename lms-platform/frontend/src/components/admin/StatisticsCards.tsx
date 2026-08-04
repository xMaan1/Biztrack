'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { LucideIcon } from 'lucide-react'

interface StatItem {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: string
  color?: string
}

interface StatisticsCardsProps {
  stats: StatItem[]
  loading?: boolean
}

export function StatisticsCards({ stats, loading }: StatisticsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {loading ? '...' : stat.value}
                </p>
                {stat.trend && (
                  <p className="text-sm text-green-500 mt-1">{stat.trend}</p>
                )}
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color || 'primary'}/10`}>
                <stat.icon className={`w-6 h-6 ${stat.color || 'text-primary'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
