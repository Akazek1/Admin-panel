"use client"

import React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { getStats } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  Briefcase,
  UserCheck,
  Calendar,
  FileCheck,
  Building2,
  TrendingUp,
  Flag,
  ArrowRight,
} from "lucide-react"

const StatCard = ({ title, value, icon: Icon, description }: any) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className="p-2 bg-primary/10 rounded-lg">
        <Icon className="w-4 h-4 text-primary" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value ?? "..."}</div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
)

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getStats,
    refetchInterval: 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="space-y-8 p-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-8" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="mt-3 h-3 w-36" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time health and growth metrics for Akazek.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Button asChild variant="outline" className="h-auto justify-between px-4 py-3">
          <Link href="/admin/verifications">
            <span className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-primary" />
              Review verifications
            </span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-between px-4 py-3">
          <Link href="/admin/reports">
            <span className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-primary" />
              Triage reports
            </span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-between px-4 py-3">
          <Link href="/admin/pending-bookings">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Check bookings
            </span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers}
          icon={Users}
          description="Active registered accounts"
        />
        <StatCard
          title="Pending Verifications"
          value={stats?.pendingVerifications}
          icon={FileCheck}
          description="Workers awaiting ID approval"
        />
        <StatCard
          title="Active Jobs"
          value={stats?.activeJobs}
          icon={Briefcase}
          description="Open listings on the board"
        />
        <StatCard
          title="Total Bookings"
          value={stats?.totalBookings}
          icon={Calendar}
          description="Service matches made"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Marketplace Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-full">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Providers</p>
                  <p className="text-sm text-muted-foreground">Individual workers</p>
                </div>
              </div>
              <div className="text-xl font-bold">{stats?.totalWorkers}</div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 rounded-full">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold">Employers</p>
                  <p className="text-sm text-muted-foreground">Individuals hiring</p>
                </div>
              </div>
              <div className="text-xl font-bold">{stats?.totalEmployers}</div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 rounded-full">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold">Organizations</p>
                  <p className="text-sm text-muted-foreground">Companies & Agencies</p>
                </div>
              </div>
              <div className="text-xl font-bold">{stats?.totalOrganizations}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Health</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
              <TrendingUp className="w-12 h-12 text-primary" />
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              All systems operational. <br /> Marketplace liquidity is high.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
