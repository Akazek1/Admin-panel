"use client"

// Lets an admin create an account on someone's behalf — the phone is
// stored as proven (the admin is vouching for it in person) instead of
// going through the self-serve OTP flow. One dialog, reused from the
// Individuals, Companies and Agencies pages so "add account" behaves and
// looks the same everywhere, and each page just supplies its persona.

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { createAccount, CreateAccountPayload, CreateAccountResult } from "@/lib/api"
import { CopyableText } from "@/components/admin/copyable-text"

type Persona = "INDIVIDUAL" | "COMPANY" | "STAFFING_AGENCY"

const PERSONA_LABEL: Record<Persona, string> = {
  INDIVIDUAL: "Individual",
  COMPANY: "Service company",
  STAFFING_AGENCY: "Staffing agency",
}

interface CreateAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The page that opened this dialog fixes the persona — no picker shown. */
  defaultPersona: Persona
}

export function CreateAccountDialog({ open, onOpenChange, defaultPersona }: CreateAccountDialogProps) {
  const queryClient = useQueryClient()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [agencyModel, setAgencyModel] = useState<"PLACEMENT" | "DISPATCH">("PLACEMENT")
  const [result, setResult] = useState<CreateAccountResult | null>(null)

  const isBusiness = defaultPersona !== "INDIVIDUAL"

  const reset = () => {
    setFirstName("")
    setLastName("")
    setName("")
    setPhone("")
    setEmail("")
    setAgencyModel("PLACEMENT")
    setResult(null)
  }

  const mutation = useMutation({
    mutationFn: (payload: CreateAccountPayload) => createAccount(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] })
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] })
      queryClient.invalidateQueries({ queryKey: ["admin-agencies"] })
      setResult(data)
      toast({ title: `${PERSONA_LABEL[defaultPersona]} account created` })
    },
    onError: (error: any) => {
      toast({
        title: "Could not create the account",
        description: error?.response?.data?.message || error?.message || "Please check the details and try again.",
        variant: "destructive",
      })
    },
  })

  const handleSubmit = () => {
    if (!phone.trim()) return toast({ title: "Phone number is required", variant: "destructive" })
    if (defaultPersona === "INDIVIDUAL" && !firstName.trim()) {
      return toast({ title: "First name is required", variant: "destructive" })
    }
    if (isBusiness && (!name.trim() || !email.trim())) {
      return toast({ title: "Business name and email are required", variant: "destructive" })
    }

    mutation.mutate({
      persona: defaultPersona,
      phone: phone.trim(),
      ...(defaultPersona === "INDIVIDUAL"
        ? { firstName: firstName.trim(), lastName: lastName.trim() || undefined, email: email.trim() || undefined }
        : { name: name.trim(), email: email.trim(), ...(defaultPersona === "STAFFING_AGENCY" ? { agencyModel } : {}) }),
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <DialogContent className="sm:max-w-[440px]">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle>{PERSONA_LABEL[defaultPersona]} account created</DialogTitle>
              <DialogDescription>
                {result.tempPassword
                  ? "Share these sign-in details with the owner. They'll be asked to set their own password on first login."
                  : "They can sign in with their phone number the next time they open the app."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 text-sm">
              {result.organization ? (
                <>
                  <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-background/50 p-3">
                    <span className="text-muted-foreground">Login email</span>
                    <CopyableText value={result.organization.loginEmail} label="Login email" />
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-background/50 p-3">
                    <span className="text-muted-foreground">Temporary password</span>
                    <CopyableText value={result.tempPassword || ""} label="Temporary password" />
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-background/50 p-3">
                  <span className="text-muted-foreground">Phone number</span>
                  <CopyableText value={result.user?.phoneNumber || ""} label="Phone number" />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  onOpenChange(false)
                  reset()
                }}
              >
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Add {PERSONA_LABEL[defaultPersona].toLowerCase()}</DialogTitle>
              <DialogDescription>
                {isBusiness
                  ? "The phone is recorded as verified — you're vouching for it in person — and the business starts verified, skipping the review queue."
                  : "The phone is recorded as verified — you're vouching for it in person, so no OTP is sent."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              {defaultPersona === "INDIVIDUAL" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>First name</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jean" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Last name</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Uwimana" />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Business name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CleanPro Kigali Ltd" />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Phone number</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0788…" type="tel" />
              </div>

              <div className="space-y-1.5">
                <Label>{isBusiness ? "Email (their login)" : "Email (optional)"}</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" />
              </div>

              {defaultPersona === "STAFFING_AGENCY" && (
                <div className="space-y-1.5">
                  <Label>How does this agency work?</Label>
                  <Select value={agencyModel} onValueChange={(v) => setAgencyModel(v as "PLACEMENT" | "DISPATCH")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLACEMENT">Placement — long-term, e.g. nannies</SelectItem>
                      <SelectItem value="DISPATCH">Dispatch — per-visit, e.g. a salon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create account
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
