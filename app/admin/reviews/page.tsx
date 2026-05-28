"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getReviews, deleteReview, updateReview } from "@/lib/api"
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
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Edit, Eye, EyeOff, Loader2, MessageSquareReply, Search, Star, Trash2, User } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface AdminReview {
  id: string
  rating: number
  comment: string | null
  reply?: string | null
  repliedAt?: string | null
  isHidden?: boolean
  hiddenReason?: string | null
  createdAt: string
  author: { firstName: string | null; lastName: string | null }
  target: { firstName: string | null; lastName: string | null }
  booking?: { id: string }
}

function displayName(user?: { firstName: string | null; lastName: string | null }) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Unknown user"
}

export default function ReviewModerationPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [visibilityFilter, setVisibilityFilter] = useState<"ALL" | "VISIBLE" | "HIDDEN">("ALL")
  const [editing, setEditing] = useState<AdminReview | null>(null)
  const [editComment, setEditComment] = useState("")
  const [hideReason, setHideReason] = useState("")
  
  const { data: reviews, isLoading } = useQuery<AdminReview[]>({
    queryKey: ["admin-reviews"],
    queryFn: getReviews,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] })
      toast({ title: "Deleted", description: "Review has been removed." })
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete review.",
        variant: "destructive",
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] })
      toast({ title: "Review updated" })
      setEditing(null)
      setHideReason("")
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Could not update review.", variant: "destructive" })
    },
  })

  const filteredReviews = (reviews ?? []).filter((review) => {
    const haystack = `${review.comment || ""} ${displayName(review.author)} ${displayName(review.target)}`.toLowerCase()
    const matchesSearch = haystack.includes(searchTerm.toLowerCase())
    const matchesVisibility =
      visibilityFilter === "ALL" ||
      (visibilityFilter === "VISIBLE" && !review.isHidden) ||
      (visibilityFilter === "HIDDEN" && review.isHidden)
    return matchesSearch && matchesVisibility
  })

  const openEdit = (review: AdminReview) => {
    setEditing(review)
    setEditComment(review.comment || "")
    setHideReason(review.hiddenReason || "")
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold">Review Moderation</h1>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search reviews..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Button variant={visibilityFilter === "ALL" ? "default" : "outline"} onClick={() => setVisibilityFilter("ALL")}>All</Button>
          <Button variant={visibilityFilter === "VISIBLE" ? "default" : "outline"} onClick={() => setVisibilityFilter("VISIBLE")}>Visible</Button>
          <Button variant={visibilityFilter === "HIDDEN" ? "default" : "outline"} onClick={() => setVisibilityFilter("HIDDEN")}>Hidden</Button>
          <Badge variant="outline" className="self-center">{filteredReviews.length} shown</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No reviews found on the platform.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rating</TableHead>
                  <TableHead className="max-w-md">Comment</TableHead>
                  <TableHead>From → To</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.id} className={review.isHidden ? "bg-muted/40 opacity-80" : ""}>
                    <TableCell>
                      <div className="space-y-1">
                        <span className="font-bold text-lg">{review.rating}</span>
                        {renderStars(review.rating)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm italic text-muted-foreground">
                        "{review.comment || "No comment"}"
                      </p>
                      {review.reply && (
                        <div className="mt-3 rounded-md border bg-muted/40 p-3">
                          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                            <MessageSquareReply className="h-3.5 w-3.5 text-primary" />
                            Reply from {displayName(review.target)}
                          </div>
                          <p className="text-sm text-muted-foreground">{review.reply}</p>
                          {review.repliedAt && (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Replied {formatDate(review.repliedAt)}
                            </p>
                          )}
                        </div>
                      )}
                      {review.isHidden && (
                        <div className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-800">
                          Hidden: {review.hiddenReason || "No reason recorded"}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-blue-500" />
                          <span className="font-medium">{displayName(review.author)}</span>
                        </div>
                        <div className="text-muted-foreground pl-4">→</div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-green-600" />
                          <span className="font-medium">{displayName(review.target)}</span>
                        </div>
                        {review.booking?.id && (
                          <div className="pt-1 pl-4 text-[10px] font-mono text-muted-foreground">
                            Booking {review.booking.id.slice(0, 8)}…
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(review.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(review)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            updateMutation.mutate({
                              id: review.id,
                              data: {
                                isHidden: !review.isHidden,
                                hiddenReason: review.isHidden ? null : "Hidden by admin review",
                              },
                            })
                          }
                        >
                          {review.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-red-50"
                          onClick={() => {
                            if (confirm("Permanently delete this review?")) {
                              deleteMutation.mutate(review.id)
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Review Moderation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Comment</Label>
              <Textarea rows={4} value={editComment} onChange={(e) => setEditComment(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hidden Reason</Label>
              <Input value={hideReason} onChange={(e) => setHideReason(e.target.value)} placeholder="Reason shown internally" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              variant="outline"
              onClick={() => editing && updateMutation.mutate({ id: editing.id, data: { isHidden: true, hiddenReason: hideReason || "Hidden by admin" } })}
            >
              Hide
            </Button>
            <Button
              onClick={() => editing && updateMutation.mutate({ id: editing.id, data: { comment: editComment, hiddenReason: hideReason } })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
