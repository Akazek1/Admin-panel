import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type AdminPageHeaderProps = {
  title: string
  description?: string
  children?: ReactNode
}

export function AdminPageHeader({ title, description, children }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  )
}

type AdminStatCardProps = {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  tone?: "green" | "blue" | "amber" | "red" | "purple"
}

const statTones = {
  green: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/10",
  blue: "bg-sky-500/10 text-sky-400 ring-sky-500/10",
  amber: "bg-amber-500/10 text-amber-400 ring-amber-500/10",
  red: "bg-red-500/10 text-red-400 ring-red-500/10",
  purple: "bg-purple-500/10 text-purple-400 ring-purple-500/10",
}

export function AdminStatCard({ title, value, description, icon: Icon, tone = "green" }: AdminStatCardProps) {
  return (
    <div className="rounded-lg border border-white/5 bg-card/70 p-4 shadow-sm shadow-black/10">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-full ring-1", statTones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-semibold leading-tight text-foreground">{value}</div>
          <p className="text-sm font-medium text-foreground/90">{title}</p>
          {description ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </div>
    </div>
  )
}

type EmptyStateProps = {
  title: string
  description?: string
  icon?: LucideIcon
}

export function EmptyState({ title, description, icon: Icon }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-white/10 bg-card/40 px-6 py-16 text-center">
      {Icon ? (
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <p className="font-medium text-foreground">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p> : null}
    </div>
  )
}
