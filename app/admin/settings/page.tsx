"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, KeyRound, Bell, Database } from "lucide-react"

const settingsSections = [
  {
    title: "Admin Access",
    icon: KeyRound,
    status: "Dev mode",
    description: "Admin login is currently using the development credential flow.",
  },
  {
    title: "Permissions",
    icon: ShieldCheck,
    status: "Enabled",
    description: "Sub-admin access is controlled by permission flags on the backend.",
  },
  {
    title: "Notifications",
    icon: Bell,
    status: "Connected",
    description: "Platform announcements and user notifications are managed from the Content area.",
  },
  {
    title: "Database",
    icon: Database,
    status: "Neon",
    description: "Schema migrations are managed through Prisma migrations.",
  },
]

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Operational settings and system status for the admin console.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {settingsSections.map((section) => (
          <Card key={section.title}>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <section.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{section.title}</CardTitle>
              </div>
              <Badge variant="outline">{section.status}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
