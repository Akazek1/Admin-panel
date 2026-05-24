"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getReviews, deleteReview, Report } from "@/lib/api"
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
import { toast } from "@/components/ui/use-toast"
import { Loader2, Star, Trash2, User, MessageSquare } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function ReviewModerationPage() {
  const queryClient = useQueryClient()
  
  const { data: reviews, isLoading } = useQuery({
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Review Moderation</h1>
        <Badge variant="outline">{reviews?.length || 0} Total Reviews</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          {!reviews || reviews.length === 0 ? (
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
                {reviews.map((review: any) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <span className="font-bold text-lg">{review.rating}</span>
                        {renderStars(review.rating)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm italic text-muted-foreground line-clamp-3">
                        "{review.comment || "No comment"}"
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-blue-500" />
                          <span className="font-medium">{review.author.firstName}</span>
                        </div>
                        <div className="text-muted-foreground pl-4">→</div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-green-600" />
                          <span className="font-medium">{review.target.firstName}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(review.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
