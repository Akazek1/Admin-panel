"use client"

import React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Crown,
  FileCheck2,
  Flag,
  Gavel,
  HelpCircle,
  Megaphone,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Star,
  UserCheck,
  UserRoundX,
  Users,
} from "lucide-react"
import { getStats } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type Tone = "green" | "blue" | "purple" | "amber" | "red"

const toneStyles: Record<Tone, { icon: string; text: string; badge: string; bar: string }> = {
  green: {
    icon: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/15",
    text: "text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-300",
    bar: "bg-emerald-500",
  },
  blue: {
    icon: "bg-sky-500/10 text-sky-400 ring-sky-500/15",
    text: "text-sky-400",
    badge: "bg-sky-500/10 text-sky-300",
    bar: "bg-sky-500",
  },
  purple: {
    icon: "bg-purple-500/10 text-purple-400 ring-purple-500/15",
    text: "text-purple-400",
    badge: "bg-purple-500/10 text-purple-300",
    bar: "bg-purple-500",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-400 ring-amber-500/15",
    text: "text-amber-400",
    badge: "bg-amber-500/10 text-amber-300",
    bar: "bg-amber-500",
  },
  red: {
    icon: "bg-red-500/10 text-red-400 ring-red-500/15",
    text: "text-red-400",
    badge: "bg-red-500/10 text-red-300",
    bar: "bg-red-500",
  },
}

const attentionItems = [
  {
    title: "Pending ID verifications",
    description: "Users submitted documents awaiting review",
    countKey: "pendingVerifications",
    fallback: 134,
    severity: "Medium",
    tone: "amber" as Tone,
    icon: FileCheck2,
    href: "/admin/verifications",
    action: "Review",
  },
  {
    title: "Agencies awaiting approval",
    description: "New agency registrations pending your approval",
    count: 12,
    severity: "Medium",
    tone: "purple" as Tone,
    icon: Building2,
    href: "/admin/agencies",
    action: "Review",
  },
  {
    title: "Companies awaiting approval",
    description: "New company registrations pending your approval",
    count: 4,
    severity: "Medium",
    tone: "blue" as Tone,
    icon: BriefcaseBusiness,
    href: "/admin/companies",
    action: "Review",
  },
  {
    title: "Reports needing review",
    description: "User reports awaiting admin review",
    count: 67,
    severity: "High",
    tone: "purple" as Tone,
    icon: Flag,
    href: "/admin/reports",
    action: "Review",
  },
  {
    title: "Disputes needing action",
    description: "Disputes raised requiring resolution",
    count: 17,
    severity: "High",
    tone: "red" as Tone,
    icon: Gavel,
    href: "/admin/disputes",
    action: "Review",
  },
  {
    title: "Stuck bookings",
    description: "Bookings stuck in progress for too long",
    count: 3,
    severity: "Medium",
    tone: "amber" as Tone,
    icon: Clock3,
    href: "/admin/active-bookings",
    action: "Investigate",
  },
  {
    title: "Unpaid agency commissions",
    description: "Commissions pending payment",
    count: 5,
    severity: "Medium",
    tone: "green" as Tone,
    icon: CircleDollarSign,
    href: "/admin/agencies",
    action: "Review",
  },
]

// Percentage change between two periods, formatted for display.
function pctChange(current: number, previous: number): string {
  if (previous <= 0) return current > 0 ? "New" : "—"
  const delta = Math.round(((current - previous) / previous) * 100)
  return `${delta >= 0 ? "+" : ""}${delta}%`
}

// Relative time for the activity feed.
function relativeTime(iso: string): string {
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return ""
  const diff = Date.now() - time
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

// Humanize an audit action key like "user.ban" → "User Ban".
function humanizeAction(action: string): string {
  return action.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

// Icon + tone for an audit action, by keyword.
function activityVisual(action: string): { icon: typeof ShieldCheck; tone: Tone } {
  const a = action.toLowerCase()
  if (a.includes("ban") || a.includes("suspend") || a.includes("delete")) return { icon: UserRoundX, tone: "red" }
  if (a.includes("verif") || a.includes("approve")) return { icon: ShieldCheck, tone: "green" }
  if (a.includes("report") || a.includes("review")) return { icon: Flag, tone: "purple" }
  if (a.includes("organization") || a.includes("agency") || a.includes("company") || a.includes("placement"))
    return { icon: Building2, tone: "blue" }
  if (a.includes("booking")) return { icon: CalendarCheck, tone: "green" }
  if (a.includes("commission") || a.includes("payout")) return { icon: CircleDollarSign, tone: "amber" }
  return { icon: ShieldCheck, tone: "green" }
}

const quickActions = [
  { label: "Review Verifications", href: "/admin/verifications", icon: ShieldCheck, tone: "green" as Tone },
  { label: "Triage Reports", href: "/admin/reports", icon: Flag, tone: "purple" as Tone },
  { label: "View Active Bookings", href: "/admin/active-bookings", icon: CalendarCheck, tone: "green" as Tone },
  { label: "Approve Organizations", href: "/admin/agencies", icon: Building2, tone: "blue" as Tone },
  { label: "Create Announcement", href: "/admin/announcements", icon: Megaphone, tone: "blue" as Tone },
  { label: "Manage Service Groupings", href: "/admin/service-categories", icon: Star, tone: "green" as Tone },
]

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-white/5 bg-card/70 shadow-sm shadow-black/10", className)}>
      {children}
    </section>
  )
}

function SectionHeader({ title, action, href }: { title: string; action?: string; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      {action && href ? (
        <Button asChild variant="ghost" size="sm" className="h-8 text-emerald-400 hover:text-emerald-300">
          <Link href={href}>
            {action}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      ) : null}
    </div>
  )
}

function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
  href,
}: {
  title: string
  value: string | number
  description: string
  icon: React.ElementType
  tone: Tone
  href?: string
}) {
  const content = (
    <div className="flex h-full items-center gap-3 rounded-lg border border-white/5 bg-card/70 p-4 shadow-sm shadow-black/10 transition-colors hover:bg-card">
      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full ring-1", toneStyles[tone].icon)}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-semibold leading-tight text-foreground">{value}</p>
        <p className="mt-1 text-sm font-medium leading-tight text-foreground">{title}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">{description}</p>
      </div>
      {href ? <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" /> : null}
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}

function MiniSparkline({ tone }: { tone: Tone }) {
  const color = tone === "red" ? "#ef4444" : "#22c55e"

  return (
    <svg viewBox="0 0 120 34" className="h-8 w-24" aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={tone === "red" ? "2,20 16,28 30,16 44,24 58,24 72,14 86,30 100,22 118,26" : "2,28 16,28 30,20 44,24 58,10 72,18 86,8 100,20 118,6"}
      />
    </svg>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getStats,
    refetchInterval: 60 * 1000,
  })

  const totalUsers = numberValue(stats?.totalUsers, 0)
  const totalProviders = numberValue(stats?.totalWorkers, 0)
  const activeBookings = numberValue(stats?.activeBookings, 0)
  const pendingVerifications = numberValue(stats?.pendingVerifications, 0)
  const agencyCount = numberValue(stats?.agencyCount, 0)
  const companyCount = numberValue(stats?.companyCount, 0)
  const reports = stats?.reports ?? { pending: 0, reviewing: 0, resolved: 0, dismissed: 0, total: 0 }
  const unresolvedIssues = numberValue(stats?.unresolvedIssues, 0)
  // Real "needs attention" total: pending verifications + open reports + open issues.
  const needsReview = pendingVerifications + reports.pending + unresolvedIssues

  // Real counts for the "Needs Attention" list, keyed by item title.
  const attentionCounts: Record<string, number> = {
    "Pending ID verifications": pendingVerifications,
    "Agencies awaiting approval": numberValue(stats?.pendingAgencies, 0),
    "Companies awaiting approval": numberValue(stats?.pendingCompanies, 0),
    "Reports needing review": reports.pending,
    "Disputes needing action": unresolvedIssues,
    "Stuck bookings": numberValue(stats?.stuckBookings, 0),
    "Unpaid agency commissions": numberValue(stats?.unpaidCommissions?.count, 0),
  }
  const resolvedAttentionItems = attentionItems.map((item) => ({
    ...item,
    count:
      attentionCounts[item.title] ??
      ("count" in item ? item.count : numberValue(stats?.[item.countKey as keyof typeof stats], item.fallback)),
  }))

  // Marketplace activity — real counts, with month-over-month change where available.
  const marketplaceMetrics: { label: string; value: number; change: string; tone: Tone }[] = [
    {
      label: "Bookings (This Month)",
      value: numberValue(stats?.bookingsThisMonth, 0),
      change: pctChange(numberValue(stats?.bookingsThisMonth, 0), numberValue(stats?.bookingsLastMonth, 0)),
      tone: numberValue(stats?.bookingsThisMonth, 0) >= numberValue(stats?.bookingsLastMonth, 0) ? "green" : "red",
    },
    { label: "Active Bookings", value: activeBookings, change: "Now", tone: "green" },
    { label: "Completed Bookings", value: numberValue(stats?.completedBookings, 0), change: "All time", tone: "green" },
    { label: "Cancelled Bookings", value: numberValue(stats?.cancelledBookings, 0), change: "All time", tone: "red" },
    {
      label: "New Services (This Month)",
      value: numberValue(stats?.servicesThisMonth, 0),
      change: pctChange(numberValue(stats?.servicesThisMonth, 0), numberValue(stats?.servicesLastMonth, 0)),
      tone: numberValue(stats?.servicesThisMonth, 0) >= numberValue(stats?.servicesLastMonth, 0) ? "green" : "red",
    },
    {
      label: "New Providers (This Month)",
      value: numberValue(stats?.providersThisMonth, 0),
      change: pctChange(numberValue(stats?.providersThisMonth, 0), numberValue(stats?.providersLastMonth, 0)),
      tone: numberValue(stats?.providersThisMonth, 0) >= numberValue(stats?.providersLastMonth, 0) ? "green" : "red",
    },
  ]

  // Reports by status — bar width is the share of total reports.
  const reportsTotal = reports.total || 1
  const reportBars: { label: string; value: number; width: string; tone: Tone }[] = [
    { label: "Open", value: reports.pending, width: `${Math.round((reports.pending / reportsTotal) * 100)}%`, tone: "purple" },
    { label: "In Review", value: reports.reviewing, width: `${Math.round((reports.reviewing / reportsTotal) * 100)}%`, tone: "amber" },
    { label: "Resolved", value: reports.resolved, width: `${Math.round((reports.resolved / reportsTotal) * 100)}%`, tone: "green" },
    { label: "Rejected", value: reports.dismissed, width: `${Math.round((reports.dismissed / reportsTotal) * 100)}%`, tone: "red" },
  ]

  const safetySignals: { label: string; value: string; tone: Tone; icon: typeof ShieldCheck }[] = [
    { label: "Verifications Approved", value: formatNumber(numberValue(stats?.verificationsApproved, 0)), tone: "green", icon: ShieldCheck },
    { label: "Verifications Rejected", value: formatNumber(numberValue(stats?.verificationsRejected, 0)), tone: "red", icon: ShieldAlert },
    { label: "Banned / Suspended Users", value: formatNumber(numberValue(stats?.bannedUsers, 0)), tone: "red", icon: UserRoundX },
    { label: "Flagged Reviews", value: formatNumber(numberValue(stats?.flaggedReviews, 0)), tone: "purple", icon: Flag },
    { label: "Repeat Reported Users", value: formatNumber(numberValue(stats?.repeatReportedUsers, 0)), tone: "red", icon: AlertTriangle },
  ]

  const unpaidCommissions = stats?.unpaidCommissions ?? { count: 0, amount: 0 }
  const operationMetrics: { label: string; value: string; detail: string; tone: Tone; icon: typeof ShieldCheck }[] = [
    { label: "Agencies", value: formatNumber(agencyCount), detail: "Registered", tone: "green", icon: Building2 },
    { label: "Companies", value: formatNumber(companyCount), detail: "Registered", tone: "blue", icon: BriefcaseBusiness },
    { label: "Placements (This Month)", value: formatNumber(numberValue(stats?.placementsThisMonth, 0)), detail: "This month", tone: "green", icon: Users },
    { label: "Worker Opt-outs", value: formatNumber(numberValue(stats?.optedOutWorkers, 0)), detail: "All time", tone: "amber", icon: UserCheck },
    { label: "Unresolved Issues", value: formatNumber(unresolvedIssues), detail: "Open", tone: unresolvedIssues > 0 ? "red" : "green", icon: AlertTriangle },
    { label: "Unpaid Commissions", value: formatNumber(unpaidCommissions.count), detail: `RWF ${formatNumber(unpaidCommissions.amount)}`, tone: "amber", icon: CircleDollarSign },
  ]

  const recentActivity = (stats?.recentActivity ?? []).map((entry) => {
    const visual = activityVisual(entry.action)
    return {
      title: humanizeAction(entry.action),
      detail: `${entry.actorName} · ${entry.targetType}`,
      time: relativeTime(entry.createdAt),
      tone: visual.tone,
      icon: visual.icon,
    }
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#101211] p-6">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-72" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-44" />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 min-[1800px]:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-[420px] rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#101211] p-5 text-foreground">
      <div className="mx-auto max-w-[1760px] space-y-4">
        <header className="flex flex-col gap-4 border-b border-white/5 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Welcome back, Emmanuel Ops</h1>
              <Crown className="h-5 w-5 text-amber-400" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Super Admin</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="relative h-10 w-10">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">12</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <HelpCircle className="h-5 w-5" />
            </Button>
            <div className="ml-2 flex items-center gap-3 rounded-full border border-white/10 bg-card/70 px-3 py-2">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muted font-semibold">
                EO
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-card bg-emerald-400" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-tight">Emmanuel Ops</p>
                <p className="text-xs text-muted-foreground">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 min-[1800px]:grid-cols-6">
          <KpiCard title="Total Individuals" value={formatNumber(totalUsers)} description="All registered users" icon={Users} tone="green" href="/admin/users" />
          <KpiCard title="Active Providers" value={formatNumber(totalProviders)} description={`${totalUsers ? Math.round((totalProviders / totalUsers) * 100) : 0}% of individuals`} icon={ShieldCheck} tone="blue" href="/admin/users" />
          <KpiCard title="Agencies" value={formatNumber(agencyCount)} description="Registered agencies" icon={Building2} tone="purple" href="/admin/agencies" />
          <KpiCard title="Companies" value={formatNumber(companyCount)} description="Registered companies" icon={BriefcaseBusiness} tone="blue" href="/admin/companies" />
          <KpiCard title="Active Bookings" value={formatNumber(activeBookings)} description="Currently in progress" icon={CalendarCheck} tone="green" href="/admin/active-bookings" />
          <KpiCard title="Needs Review" value={formatNumber(needsReview)} description="Verifications + Reports + Disputes" icon={AlertTriangle} tone="amber" href="/admin/verifications" />
        </div>

        <div className="grid grid-cols-1 gap-4 min-[1900px]:grid-cols-[minmax(0,1fr)_430px]">
          <div className="space-y-4">
            <Panel>
              <SectionHeader title="Needs Attention" action={`View all (${needsReview})`} href="/admin/verifications" />
              <div className="px-4 pb-3">
                <div className="flex flex-wrap gap-2 border-b border-white/5 pb-3">
                  {["All", "Users", "Bookings", "Organizations", "Reports"].map((tab) => (
                    <button
                      key={tab}
                      className={cn(
                        "rounded-md border border-white/10 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
                        tab === "All" && "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 px-4 pb-4 min-[1700px]:grid-cols-2">
                {resolvedAttentionItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-background/35 p-3 transition-colors hover:bg-white/[0.03]"
                  >
                    <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1", toneStyles[item.tone].icon)}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="w-10 shrink-0 text-2xl font-semibold">{item.count}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <Badge className={cn("shrink-0", toneStyles[item.tone].badge)}>{item.severity}</Badge>
                    <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-sky-400 md:inline-flex">
                      {item.action}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </Panel>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel>
                <SectionHeader title="Marketplace Activity" action="View full report" href="/admin/active-bookings" />
                <div className="grid grid-cols-1 gap-2 px-4 pb-4 sm:grid-cols-2 xl:grid-cols-3">
                  {marketplaceMetrics.map((metric) => (
                    <div key={metric.label} className="rounded-lg border border-white/5 bg-background/35 p-3">
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                      <div className="mt-2 flex items-end justify-between gap-2">
                        <div>
                          <p className="text-2xl font-semibold">{formatNumber(metric.value)}</p>
                          <p className={cn("mt-1 text-xs font-medium", toneStyles[metric.tone].text)}>{metric.change}</p>
                        </div>
                        <MiniSparkline tone={metric.tone} />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel>
                <SectionHeader title="Trust & Safety Snapshot" action="View report" href="/admin/reports" />
                <div className="grid grid-cols-1 gap-4 px-4 pb-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Reports by status</p>
                    {reportBars.map((bar) => (
                      <div key={bar.label} className="grid grid-cols-[82px_1fr_36px] items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{bar.label}</span>
                        <div className="h-2 rounded-full bg-muted/60">
                          <div className={cn("h-2 rounded-full", toneStyles[bar.tone].bar)} style={{ width: bar.width }} />
                        </div>
                        <span className="text-right font-medium">{bar.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-white/5 pt-3 text-sm font-semibold">
                      <span>Total</span>
                      <span>{formatNumber(reports.total)}</span>
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-white/5 pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                    {safetySignals.map((signal) => (
                      <div key={signal.label} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                          <signal.icon className={cn("h-4 w-4 shrink-0", toneStyles[signal.tone].text)} />
                          <span className="truncate">{signal.label}</span>
                        </span>
                        <span className={cn("font-semibold", toneStyles[signal.tone].text)}>{signal.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>
            </div>

            <Panel>
              <SectionHeader title="Agencies & Companies Operations" />
              <div className="grid grid-cols-1 gap-2 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[1800px]:grid-cols-7">
                {operationMetrics.map((metric) => (
                  <Link key={metric.label} href="/admin/agencies" className="rounded-lg border border-white/5 bg-background/35 p-3 transition-colors hover:bg-white/[0.03]">
                    <p className="line-clamp-2 min-h-8 text-xs text-muted-foreground">{metric.label}</p>
                    <div className="mt-3 flex items-end justify-between gap-2">
                      <div>
                        <p className="text-2xl font-semibold">{metric.value}</p>
                        <p className={cn("mt-1 text-xs font-medium", toneStyles[metric.tone].text)}>{metric.detail}</p>
                      </div>
                      <metric.icon className={cn("h-6 w-6", toneStyles[metric.tone].text)} />
                    </div>
                  </Link>
                ))}
              </div>
            </Panel>

            <Panel>
              <SectionHeader title="Quick Actions" />
              <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3 min-[1800px]:grid-cols-6">
                {quickActions.map((action) => (
                  <Button key={action.label} asChild variant="outline" className="h-auto justify-between border-white/10 bg-background/40 px-3 py-3">
                    <Link href={action.href}>
                      <span className="flex min-w-0 items-center gap-3 text-left">
                        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", toneStyles[action.tone].badge)}>
                          <action.icon className="h-5 w-5" />
                        </span>
                        <span className="whitespace-normal text-sm font-semibold leading-tight">{action.label}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Link>
                  </Button>
                ))}
              </div>
            </Panel>
          </div>

          <Panel className="min-[1900px]:sticky min-[1900px]:top-5 min-[1900px]:self-start">
            <SectionHeader title="Recent Activity" action="View all" href="/admin/audit-logs" />
            <div className="px-4 pb-3">
              <div className="flex flex-wrap gap-2 border-b border-white/5 pb-3">
                {["All", "Admin Actions", "Bookings", "Reports"].map((tab) => (
                  <button
                    key={tab}
                    className={cn(
                      "rounded-md border border-white/10 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
                      tab === "All" && "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 pb-4">
              <div className="relative space-y-0">
                {recentActivity.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No recent activity yet.</p>
                ) : (
                  <>
                    <div className="absolute bottom-5 left-5 top-5 w-px bg-white/10" />
                    {recentActivity.map((activity, index) => (
                      <div key={`${activity.title}-${index}`} className="relative flex gap-3 border-b border-white/5 py-4 last:border-b-0">
                        <div className={cn("z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1", toneStyles[activity.tone].icon)}>
                          <activity.icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{activity.title}</p>
                          <p className="mt-1 truncate text-sm text-muted-foreground">{activity.detail}</p>
                        </div>
                        <p className="shrink-0 text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </Panel>
        </div>

        <footer className="flex flex-col justify-between gap-2 border-t border-white/5 pt-3 text-xs text-muted-foreground sm:flex-row">
          <span className="inline-flex items-center gap-2">
            Last data update: 2 minutes ago
            <RefreshCw className="h-3.5 w-3.5" />
          </span>
          <span>All times are in EAT (UTC+3)</span>
        </footer>
      </div>
    </div>
  )
}
