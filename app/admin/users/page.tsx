"use client"

import React, { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAllUsers, banUser, unbanUser, updateUserProfile, uploadUserDocument, User } from "@/lib/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import {
  Loader2,
  MoreHorizontal,
  Ban,
  ShieldCheck,
  User as UserIcon,
  Search,
  Filter,
  Edit,
  Upload,
  Phone,
  Mail,
  UserCog,
} from "lucide-react"
import { formatDate } from "@/lib/utils"

// PII Masking utility
const maskString = (str: string | null, visibleChars = 4) => {
  if (!str) return "N/A"
  if (str.length <= visibleChars) return str
  return `${"*".repeat(str.length - visibleChars)}${str.slice(-visibleChars)}`
}

export default function UserManagementPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("ALL")
  
  // Selected User & Dialogs
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false)
  const [banReason, setBanReason] = useState("")
  
  // Support Edit State
  const [isEditMode, setIsEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  })

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAllUsers,
  })

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (data: any) => updateUserProfile(selectedUser!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      toast({ title: "Updated", description: "User profile updated successfully." })
      setIsEditMode(false)
      setSelectedUser(null)
    },
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadUserDocument(selectedUser!.id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      toast({ title: "Uploaded", description: "ID Document uploaded on behalf of user." })
      setSelectedUser(null)
    },
  })

  const banMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => banUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      toast({ title: "User Banned", description: "The account has been suspended." })
      setIsBanDialogOpen(false)
      setBanReason("")
      setSelectedUser(null)
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to ban user.", variant: "destructive" })
    },
  })

  const unbanMutation = useMutation({
    mutationFn: (id: string) => unbanUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      toast({ title: "User Restored", description: "The account is now active." })
    },
  })

  const filteredUsers = useMemo(() => {
    if (!users) return []
    return users.filter((user) => {
      const searchStr = `${user.firstName} ${user.lastName} ${user.phoneNumber} ${user.email}`.toLowerCase()
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase())
      const matchesRole = roleFilter === "ALL" || user.roles.includes(roleFilter)
      return matchesSearch && matchesRole
    })
  }, [users, searchTerm, roleFilter])

  const openSupportMode = (user: User) => {
    setSelectedUser(user)
    setEditFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
    })
    setIsEditMode(false)
  }

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(editFormData)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (confirm(`Upload ${file.name} as ID for ${selectedUser?.firstName}?`)) {
        uploadMutation.mutate(file)
      }
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex w-full sm:w-auto gap-2">
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
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact (PII Masked)</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className={user.isBanned ? "bg-red-50/50" : ""}>
                    <TableCell className="font-medium">
                      {user.firstName ? `${user.firstName} ${user.lastName || ""}` : "Unnamed User"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{maskString(user.phoneNumber)}</div>
                      <div className="text-xs text-muted-foreground">{maskString(user.email)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {user.roles.map((role) => (
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
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openSupportMode(user)}>
                            <UserCog className="w-4 h-4 mr-2" /> Support Mode
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.isBanned ? (
                            <DropdownMenuItem
                              className="text-green-600"
                              onClick={() => unbanMutation.mutate(user.id)}
                            >
                              <ShieldCheck className="w-4 h-4 mr-2" /> Unban User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedUser(user)
                                setIsBanDialogOpen(true)
                              }}
                            >
                              <Ban className="w-4 h-4 mr-2" /> Ban User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Support Mode Dialog */}
      <Dialog open={!!selectedUser && !isBanDialogOpen} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-primary" />
              Support Mode: {selectedUser?.firstName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="edit">Edit Profile</TabsTrigger>
                <TabsTrigger value="docs">Proxy Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg border">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase">Full Name</Label>
                    <p className="font-semibold">{selectedUser.firstName} {selectedUser.lastName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase">Username</Label>
                    <p className="font-mono text-sm">@{selectedUser.username || 'not_set'}</p>
                  </div>
                  <div className="col-span-2 border-t pt-2 mt-2">
                    <Label className="text-xs font-bold text-red-600 uppercase flex items-center gap-1">
                      <Phone className="w-3 h-3" /> PII Disclosure
                    </Label>
                    <div className="flex gap-4 mt-1">
                       <div>
                         <p className="text-[10px] text-muted-foreground">Phone</p>
                         <p className="font-mono">{selectedUser.phoneNumber}</p>
                       </div>
                       <div>
                         <p className="text-[10px] text-muted-foreground">Email</p>
                         <p className="font-mono">{selectedUser.email || "No email"}</p>
                       </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={selectedUser.isVerified ? "default" : "secondary"}>
                    {selectedUser.isVerified ? "Verified User" : "Unverified"}
                  </Badge>
                  <Badge variant={selectedUser.isBanned ? "destructive" : "outline"}>
                    {selectedUser.isBanned ? "Account Banned" : "Account Active"}
                  </Badge>
                </div>
              </TabsContent>
              
              <TabsContent value="edit" className="pt-4">
                <form onSubmit={handleUpdateSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input 
                        value={editFormData.firstName} 
                        onChange={e => setEditFormData({...editFormData, firstName: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input 
                        value={editFormData.lastName} 
                        onChange={e => setEditFormData({...editFormData, lastName: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Support Email</Label>
                    <Input 
                      type="email" 
                      value={editFormData.email} 
                      onChange={e => setEditFormData({...editFormData, email: e.target.value})} 
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Save Changes on Behalf of User
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="docs" className="pt-4 space-y-4">
                <div className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Upload className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Proxy Document Upload</h4>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      If the worker cannot upload their ID, you can do it here. 
                      This will create a new verification request for you to approve.
                    </p>
                  </div>
                  <Input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    id="proxy-upload" 
                    onChange={handleFileUpload}
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="proxy-upload" className="cursor-pointer">
                      Select ID Image
                    </label>
                  </Button>
                  {uploadMutation.isPending && <Loader2 className="w-6 h-6 animate-spin text-primary" />}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User Account</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Suspending {selectedUser?.firstName}'s account will prevent them from logging in or using the platform.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for suspension</label>
              <Textarea
                placeholder="e.g., Multiple reports of harassment, fraudulent activity, etc."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBanDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && banMutation.mutate({ id: selectedUser.id, reason: banReason })}
              disabled={banMutation.isPending || !banReason.trim()}
            >
              {banMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Confirm Suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
