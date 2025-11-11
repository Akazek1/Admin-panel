"use client";

import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface ReviewSectionProps {
    serviceId: string;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ serviceId }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [averageRating, setAverageRating] = useState<number>(0);
    const [totalReviews, setTotalReviews] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    // Fetch reviews
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await api.get(`/bookings/service/${serviceId}/reviews`);
                const reviewsData = response.data.data.reviews || [];
                setReviews(reviewsData);

                // Calculate total reviews
                setTotalReviews(reviewsData.length);

                // Calculate average rating
                const avgRating =
                    reviewsData.length > 0
                        ? reviewsData.reduce((sum: number, review: Review) => sum + review.rating, 0) / reviewsData.length
                        : 0;
                setAverageRating(avgRating);
            } catch (error: any) {
                // Silently handle 404 - endpoint not implemented yet
                if (error?.response?.status === 404) {
                    setReviews([]);
                    setTotalReviews(0);
                    setAverageRating(0);
                } else {
                    // Only show error for actual failures
                    console.error("Failed to fetch reviews:", error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [serviceId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-[#145B10]" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Star className="w-4 h-4 fill-[#FB9400] stroke-[#FB9400]" />{" "}
                    {averageRating.toFixed(1)} | {totalReviews} reviews
                </p>
            </div>

            <div className="space-y-3">
                {reviews?.map((review) => (
                    <div key={review.id} className="flex flex-col gap-3">
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
                        <p className="text-[13px] leading-[120%] text-[#616161] font-semibold">
                            {review.comment}
                        </p>
                        <p className="text-xs text-gray-400">
                            Posted on{" "}
                            {new Date(review.booking.updatedAt).toLocaleDateString()}
                        </p>
                    </div>
                ))}
                {reviews?.length === 0 && (
                    <p className="text-sm text-gray-500">No reviews yet.</p>
                )}
            </div>
        </div>
    );
};

export default ReviewSection;