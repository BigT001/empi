"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/app/context/AdminContext";
import { useResponsive } from "@/app/hooks/useResponsive";
import { Calendar, MessageCircle } from "lucide-react";

interface Review {
  _id: string;
  orderId: string;
  orderNumber: string;
  content: string;
  senderName: string;
  senderEmail: string;
  createdAt: string;
}

export default function ReviewsPage() {
  const router = useRouter();
  const { admin } = useAdmin();
  const { mounted } = useResponsive();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    if (!admin) {
      router.push("/admin/login");
      return;
    }

    fetchReviews();
  }, [admin, router]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/messages?messageType=review");
      const data = await response.json();

      if (data.success && Array.isArray(data.messages)) {
        const customerReviews = data.messages.filter(
          (msg: any) => msg.messageType === "review" && msg.senderType === "customer"
        );
        
        setReviews(customerReviews);
        setTotalReviews(customerReviews.length);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show view after mounting
  if (!mounted) {
    return null;
  }

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 5: return 'Excellent!';
      case 4: return 'Very Good';
      case 3: return 'Good';
      case 2: return 'Fair';
      case 1: return 'Poor';
      default: return 'No Rating';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-6 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 rounded-lg p-3">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Customer Reviews</h1>
              <p className="text-gray-600 mt-1">Feedback from your customers</p>
            </div>
          </div>

          {/* Stats */}
          <div className="inline-block bg-white rounded-lg p-4 border border-gray-200 mt-6">
            <p className="text-sm text-gray-600">Total Reviews</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-2">{totalReviews}</p>
          </div>
        </div>

        {/* Reviews List - Responsive grid: 1 col mobile, 2 col tablet, 3 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-12 col-span-full">
              <div className="animate-spin">
                <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 sm:p-12 text-center col-span-full">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900">No reviews yet</p>
              <p className="text-gray-600 mt-1">
                Customer reviews will appear here when they submit feedback
              </p>
            </div>
          ) : (
            reviews.map((review) => {
              // Parse review content - stored as JSON {rating, feedback}
              let parsedReview = { rating: 5, feedback: review.content };
              try {
                if (review.content && review.content.trim().startsWith('{')) {
                  const parsed = JSON.parse(review.content);
                  if (parsed.rating && parsed.feedback) {
                    parsedReview = { rating: parsed.rating, feedback: parsed.feedback };
                  }
                }
              } catch (e) {
                console.log('[ReviewsPage] Error parsing review content:', e);
              }

              return (
                <div
                  key={review._id}
                  className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition flex flex-col h-full"
                >
                  {/* Avatar and Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {review.senderName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{review.senderName}</h3>
                      <p className="text-xs text-gray-600 truncate">{review.senderEmail}</p>
                    </div>
                  </div>

                  {/* Star Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span key={i} className="text-lg sm:text-xl">
                          {i <= parsedReview.rating ? '⭐' : '☆'}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-gray-700">
                      {parsedReview.rating}/5
                    </span>
                  </div>

                  {/* Order Badge */}
                  <div className="bg-blue-50 rounded px-3 py-1 mb-3 inline-block w-fit">
                    <p className="text-xs font-semibold text-blue-700">
                      Order #{review.orderNumber}
                    </p>
                  </div>

                  {/* Review Content */}
                  <div className="bg-gray-50 rounded p-3 mb-4 flex-1 overflow-hidden">
                    <p className="text-gray-800 text-sm line-clamp-4">{parsedReview.feedback}</p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 pt-3 sm:pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="truncate">
                        {new Date(review.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        router.push(`/admin/custom-orders?view=${review.orderId}`)
                      }
                      className="text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm whitespace-nowrap"
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
