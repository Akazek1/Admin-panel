/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from "react";
import { Star, Trash2, Edit2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface Review {
    id: string;
    rating: number;
    comment: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        profilePicture?: string;
    };
    booking: {
        scheduledFor: string;
        updatedAt: string;
    };
}

interface ReviewManagementProps {
    serviceId: string;
}

const ReviewManagement: React.FC<ReviewManagementProps> = ({ serviceId }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [newReview, setNewReview] = useState<{ rating: number; comment: string }>({
        rating: 0,
        comment: "",
    });
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [currentUserId, setCurrentUserId] = useState<string>(""); 

    // Fetch user's reviews
    useEffect(() => {
        const fetchUserReviews = async () => {
            try {
                // Fetch all reviews and filter by currentUserId
                const response = await api.get(`/bookings/service/${serviceId}/reviews`);
                const allReviews = response.data.reviews;
                // Filter reviews by currentUserId (replace with actual auth system)
                const userReviews = allReviews.filter((review: Review) => review.user.id === currentUserId);
                setReviews(userReviews);
            } catch {
                toast.error("Failed to fetch your reviews");
            } finally {
                setLoading(false);
            }
        };

        // TODO: Set currentUserId from your auth system
        // setCurrentUserId(auth.currentUser.id);
        if (currentUserId) {
            fetchUserReviews();
        } else {
            setLoading(false); // If no user is logged in, stop loading
        }
    }, [serviceId, currentUserId]);

    // Handle rating selection
    const handleRating = (rating: number) => {
        setNewReview((prev) => ({ ...prev, rating }));
    };

    // Handle review submission (create or update)
    const handleSubmitReview = async () => {
        if (newReview.rating === 0 || !newReview.comment.trim()) {
            toast.error("Please provide a rating and comment");
            return;
        }

        setSubmitting(true);
        try {
            if (editingReview) {
                // Update existing review
                await api.patch(`/bookings/${editingReview.booking.scheduledFor}/reviews`, {
                    rating: newReview.rating,
                    comment: newReview.comment,
                });
                setReviews((prev) =>
                    prev.map((review) =>
                        review.id === editingReview.id
                            ? { ...review, rating: newReview.rating, comment: newReview.comment }
                            : review
                    )
                );
                toast.success("Review updated successfully");
            } else {
                // Create new review
                const response = await api.post(`/bookings/${serviceId}/reviews`, {
                    rating: newReview.rating,
                    comment: newReview.comment,
                });
                setReviews((prev) => [...prev, response.data]);
                toast.success("Review submitted successfully");
            }
            setIsModalOpen(false);
            setNewReview({ rating: 0, comment: "" });
            setEditingReview(null);
        } catch {
            toast.error("Failed to submit review");
        } finally {
            setSubmitting(false);
        }
    };

    // Handle review deletion
    const handleDeleteReview = async (reviewId: string, bookingId: string) => {
        if (!confirm("Are you sure you want to delete this review?")) return;

        try {
            await api.delete(`/bookings/${bookingId}/reviews`);
            setReviews((prev) => prev.filter((review) => review.id !== reviewId));
            toast.success("Review deleted successfully");
        } catch {
            toast.error("Failed to delete review");
        }
    };

    // Handle edit review
    const handleEditReview = (review: Review) => {
        setEditingReview(review);
        setNewReview({ rating: review.rating, comment: review.comment });
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-6 h-6 animate-spin text-[#145B10]" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-[#1B2431]">Manage Your Reviews</h1>
            <div className="space-y-4">
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button
                            className="bg-[#145B10] text-white hover:bg-[#145B10]/90 rounded-[100px] text-sm"
                            onClick={() => {
                                setEditingReview(null);
                                setNewReview({ rating: 0, comment: "" });
                            }}
                        >
                            Write a Review
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>
                                {editingReview ? "Edit Review" : "Write a Review"}
                            </DialogTitle>
                            <DialogDescription>
                                Share your experience with this service.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="flex items-center gap-2">
                                <Label>Rating:</Label>
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`w-6 h-6 cursor-pointer ${star <= newReview.rating
                                                ? "fill-[#FB9400] stroke-[#FB9400]"
                                                : "fill-none stroke-[#FB9400]"
                                                }`}
                                            onClick={() => handleRating(star)}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="comment">Comment</Label>
                                <Textarea
                                    id="comment"
                                    value={newReview.comment}
                                    onChange={(e) =>
                                        setNewReview((prev) => ({
                                            ...prev,
                                            comment: e.target.value,
                                        }))
                                    }
                                    placeholder="Write your review here..."
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-[#145B10] text-white hover:bg-[#145B10]/90"
                                onClick={handleSubmitReview}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : null}
                                {editingReview ? "Update Review" : "Submit Review"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="space-y-3">
                    {reviews.length > 0 ? (
                        reviews.map((review) => (
                            <div key={review.id} className="flex flex-col gap-3 border-b pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-2">
                                        <Avatar className="w-10 h-10">
                                            <AvatarImage src={review.user.profilePicture} />
                                            <AvatarFallback>
                                                {review.user.firstName.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex flex-col gap-1">
                                                <p className="font-semibold text-sm">
                                                    {review.user.firstName} {review.user.lastName}
                                                </p>
                                                <div className="flex">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`w-4 h-4 ${star <= review.rating
                                                                ? "fill-[#FB9400] stroke-[#FB9400]"
                                                                : "fill-none stroke-[#FB9400]"
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Edit2
                                            className="w-4 h-4 text-[#145B10] cursor-pointer hover:text-[#145B10]/80"
                                            onClick={() => handleEditReview(review)}
                                        />
                                        <Trash2
                                            className="w-4 h-4 text-red-500 cursor-pointer hover:text-red-600"
                                            onClick={() =>
                                                handleDeleteReview(review.id, review.booking.scheduledFor)
                                            }
                                        />
                                    </div>
                                </div>
                                <p className="text-[13px] leading-[120%] text-[#616161] font-semibold">
                                    {review.comment}
                                </p>
                                <p className="text-xs text-gray-400">
                                    Posted on{" "}
                                    {new Date(review.booking.updatedAt).toLocaleDateString()}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500">You haven&lsquo;t submitted any reviews yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewManagement;