"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { KeyRound, Loader2 } from "lucide-react"
import axiosInstance from "@/lib/axios-instance"
import { ADMIN_ACCESS_QUERY_KEY, useAdminAccess } from "@/lib/admin-access"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

const MIN_LENGTH = 10

export default function ChangePasswordPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: access } = useAdminAccess()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")

  const forced = !!access?.mustChangePassword

  const mutation = useMutation({
    mutationFn: () => axiosInstance.post("/admin/me/password", { currentPassword, newPassword }),
    onSuccess: async () => {
      toast({ title: "Password updated" })
      await queryClient.invalidateQueries({ queryKey: ADMIN_ACCESS_QUERY_KEY })
      router.replace("/admin")
    },
    onError: (err: any) => {
      const message = err.response?.data?.message
      setError(Array.isArray(message) ? message.join(" ") : message || "Couldn't update the password.")
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (newPassword.length < MIN_LENGTH) return setError(`Use at least ${MIN_LENGTH} characters.`)
    if (newPassword !== confirm) return setError("The new passwords don't match.")
    mutation.mutate()
  }

  return (
    <div className="flex min-h-screen items-start justify-center p-6 pt-24">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <CardTitle>{forced ? "Choose your password" : "Change password"}</CardTitle>
          <CardDescription>
            {forced
              ? "You signed in with a temporary password. Set your own to continue."
              : "Update the password you use to sign in to the admin panel."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">{forced ? "Temporary password" : "Current password"}</Label>
              <Input id="current" type="password" autoComplete="current-password" value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" autoComplete="new-password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} required />
              <p className="text-xs text-muted-foreground">At least {MIN_LENGTH} characters.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input id="confirm" type="password" autoComplete="new-password" value={confirm}
                onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
