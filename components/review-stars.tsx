import { Star } from 'lucide-react'; // Replace with your icon library if different
import { ReactElement } from 'react';

interface Review {
    rating: number;
}

interface ReviewStarsProps {
    review: Review;
}

const ReviewStars = ({ review }: ReviewStarsProps): ReactElement => {
    return (
        <div className="flex">
            {/* Define the gradient */}
            <svg className="hidden">
                <defs>
                    <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#FB9400', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#FB9400', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#FFAB38', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#FFAB38', stopOpacity: 1 }} />
                    </linearGradient>
                </defs>
            </svg>

            {/* Render 5 stars */}
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className={`w-4 h-4 ${i < review.rating ? 'fill-[#FB9400]' : 'fill-none stroke-gray-300'}`} // Fallback fill for visibility
                    fill={i < review.rating ? 'url(#starGradient)' : 'none'}
                    stroke={i < review.rating ? 'url(#starGradient)' : '#D1D5DB'}
                    strokeWidth={1.5} // Ensure stroke is visible
                />
            ))}
        </div>
    );
};

export default ReviewStars;