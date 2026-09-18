import React from 'react';
import { Star, MessageSquareQuote } from 'lucide-react';
import { User, Review } from '../../types';

interface ReviewsTabProps {
  user: User;
  reviewData: { received: Review[]; written: Review[]; averageRating: number } | null;
  onOpenReviewModal: () => void;
}

export const ReviewsTab: React.FC<ReviewsTabProps> = ({
  user,
  reviewData,
  onOpenReviewModal,
}) => {
  const received = reviewData?.received || [];
  const written = reviewData?.written || [];
  const avg = reviewData?.averageRating || 0;

  return (
    <section className="space-y-6" id="participant_reviews_view">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquareQuote className="w-5 h-5 text-amber-500" />
            <span>Cooperative Trust & Reputation Ledger</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ratings verified through clinical veterinary visits and completed milestones.
          </p>
        </div>

        <button
          onClick={onOpenReviewModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold transition shadow-xs cursor-pointer"
          id="btn_open_review_modal_tab"
        >
          <Star className="w-4 h-4 fill-slate-900" />
          <span>Write a Review</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Average Rating</span>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {avg ? avg.toFixed(1) : '5.0'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Received Reviews</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
            {received.length}
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Given Reviews</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
            {written.length}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Feedback From Partners ({received.length})
        </h4>
        {received.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl dark:border-slate-800 overflow-hidden">
            {received.map((r) => (
              <div key={r.id} className="p-4 bg-white dark:bg-slate-900 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{r.authorName}</span>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="font-bold">{r.rating}</span>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-xs">{r.comment}</p>
                <span className="text-[10px] text-slate-400 block pt-1">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            No partner feedback logged yet. Reviews unlock following completed contract milestones.
          </div>
        )}
      </div>
    </section>
  );
};
