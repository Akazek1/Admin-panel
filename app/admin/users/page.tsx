"use client"

import React, { useEffect, useState, useDeferredValue, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { getAllUsers, User } from "@/lib/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Loader2,
  Search,
  Filter,
  User as UserIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"

const PAGE_SIZE = 50

function formatJoinedDate(value?: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

export default function UserManagementPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const deferredSearchTerm = useDeferredValue(searchTerm)

  const { data: users, isLoading, isError, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAllUsers,
    staleTime: 5 * 60 * 1000,
  })

  const filteredUsers = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase()
    if (!users) return []
    return users.filter((user) => {
      const roles = Array.isArray(user.roles) ? user.roles : []
      const searchStr = `${user.firstName || ""} ${user.lastName || ""} ${user.phoneNumber || ""} ${user.email || ""}`.toLowerCase()
      const matchesSearch = !normalizedSearch || searchStr.includes(normalizedSearch)
      const matchesRole = roleFilter === "ALL" || roles.includes(roleFilter)
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "BANNED" && user.isBanned) ||
        (statusFilter === "VERIFIED" && user.isVerified && !user.isBanned) ||
        (statusFilter === "UNVERIFIED" && !user.isVerified && !user.isBanned)
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, deferredSearchTerm, roleFilter, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const visibleUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredUsers.slice(start, start + PAGE_SIZE)
  }, [filteredUsers, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [deferredSearchTerm, roleFilter, statusFilter])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount))
  }, [pageCount])

  const allVisibleSelected =
    visibleUsers.length > 0 && visibleUsers.every((user) => selectedIds.includes(user.id))

  const toggleVisibleUsers = (checked: boolean) => {
    const visibleIds = visibleUsers.map((user) => user.id)
    setSelectedIds((prev) =>
      checked
        ? Array.from(new Set([...prev, ...visibleIds]))
        : prev.filter((id) => !visibleIds.includes(id))
    )
  }

  const toggleUser = (id: string, checked: boolean) => {
    setSelectedIds((prev) => checked ? [...prev, id] : prev.filter((selectedId) => selectedId !== id))
  }

  const clearFilters = () => {
    setSearchTerm("")
    setRoleFilter("ALL")
    setStatusFilter("ALL")
    setSelectedIds([])
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                {roleFilter === "ALL" ? "All Roles" : roleFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRoleFilter("ALL")}>All Roles</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter("WORKER")}>Workers</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter("EMPLOYER")}>Employers</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter("ADMIN")}>Admins</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                {statusFilter === "ALL" ? "All Statuses" : statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" collisionPadding={16}>
              <DropdownMenuItem onClick={() => setStatusFilter("ALL")}>All Statuses</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("VERIFIED")}>Verified</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("UNVERIFIED")}>Unverified</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("BANNED")}>Banned</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {filteredUsers.length} matching · showing {visibleUsers.length} · {selectedIds.length} selected
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="px-6 py-12 text-center">
              <p className="font-medium">Could not load users</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {(error as any)?.response?.data?.message || (error as Error)?.message || "Please refresh or check the backend connection."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={(value) => toggleVisibleUsers(!!value)}
                      aria-label="Select visible users"
                    />
                  </TableHead>
                  <TableHead className="w-16 text-center px-0">Photo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className={`group cursor-pointer ${user.isBanned ? "bg-red-50/50" : ""}`}
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                  >
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <div className="inline-flex">
                        <Checkbox
                          checked={selectedIds.includes(user.id)}
                          onCheckedChange={(value) => toggleUser(user.id, !!value)}
                          aria-label={`Select ${user.firstName || user.phoneNumber}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="px-0">
                      <div className="flex justify-center">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt=""
                            className="h-11 w-11 rounded-lg border object-cover shadow-sm transition-opacity group-hover:opacity-90"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-lg bg-muted flex items-center justify-center border">
                            <UserIcon className="w-4 h-4 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="inline-flex flex-col">
                        <span>{user.firstName ? `${user.firstName} ${user.lastName || ""}` : "Unnamed User"}</span>
                        <span className="text-xs font-normal text-muted-foreground">@{user.username || user.id.slice(0, 8)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {(Array.isArray(user.roles) ? user.roles : []).map((role) => (
                          <Badge key={role} variant="outline" className="text-[10px]">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.isBanned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : user.isVerified ? (
                        <Badge variant="default" className="bg-green-600">Verified</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatJoinedDate(user.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {filteredUsers.length > PAGE_SIZE && (
        <div className="flex flex-col items-center justify-between gap-3 rounded-lg border bg-muted/20 px-4 py-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              disabled={currentPage === pageCount}
            >
              Next
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}
