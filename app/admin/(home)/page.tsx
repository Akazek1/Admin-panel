"use client"

import { useEffect, useState } from "react"
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Search, Users, Settings, HelpCircle, LogOut, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/mode-toggle"
import Image from "next/image"
import { MapPin, Copy } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { getPendingApprovals } from "@/lib/api"

export default function DashboardPage() {
  const [pendingCount, setPendingCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const pendingApprovals = await getPendingApprovals()
        setPendingCount(pendingApprovals.length)
      } catch (error) {
        console.error("Failed to fetch pending count:", error)
        toast({ title: "Error", description: "Failed to load pending providers count.", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchPendingCount()
  }, [])

  return (
    <div className="flex flex-col w-full min-h-screen">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6 md:px-8 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground md:block hidden tracking-tight">Dashboard</h1>
        <div className="relative ml-auto flex-1 md:grow-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects..."
            className="w-full rounded-lg bg-muted/50 pl-10 pr-4 py-2 transition-all duration-200 focus:ring-2 focus:ring-primary focus:bg-background md:w-[200px] lg:w-[336px]"
            aria-label="Search projects"
          />
        </div>
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full hover:bg-primary/10 transition-colors"
              aria-label="Open user menu"
            >
              <Users className="h-5 w-5 text-foreground" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-background border border-muted shadow-lg">
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer hover:bg-primary/5">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer hover:bg-primary/5">
              <HelpCircle className="h-4 w-4" />
              <span>Support</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer hover:bg-destructive/5 text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className="flex-1 p-4 md:p-6  mx-auto w-full">


        {/* Pending Providers Count Section */}
        <h2 className="text-2xl font-semibold text-darkText mb-6">Service Statistics</h2>
        <section className="grid grid-cols-4 gap-6">
          <div>
            {loading ? (
              <div className="flex justify-center items-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : pendingCount !== null ? (
              <Card className="bg-darkCard border-none shadow-lg max-w-sm">
                <CardHeader className="px-4 py-2.5">
                  <CardTitle className="text-lg font-medium text-muted-foreground">Pending Providers</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-2.5">
                  <p className="text-2xl font-bold text-darkText">{pendingCount}</p>
                </CardContent>
              </Card>
            ) : (
              <p className="text-muted-foreground">No pending providers available.</p>
            )}
          </div>
          <div>
            {loading ? (
              <div className="flex justify-center items-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : pendingCount !== null ? (
              <Card className="bg-darkCard border-none shadow-lg max-w-sm">
                <CardHeader className="px-4 py-2.5">
                  <CardTitle className="text-lg font-medium text-muted-foreground">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-2.5">
                  <p className="text-2xl font-bold text-darkText">${0}</p>
                </CardContent>
              </Card>
            ) : (
              <p className="text-muted-foreground">No pending providers available.</p>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}

