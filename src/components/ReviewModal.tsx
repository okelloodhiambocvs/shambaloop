import React, { useEffect, useState, useMemo } from 'react';
import { Star, X, CheckCircle2, AlertCircle, MessageSquareQuote, ShieldCheck } from 'lucide-react';
import { User, UserRole, Review } from '../types';
import { sharedWorkspaceApi } from '../services/sharedWorkspaceService';

interface ReviewCandidate {
  id: string;
  name: string;
  role: string;
  county: string;
  context: string;
  engagementId?: string;
  engagementType?: string;
  alreadyReviewed: boolean;
}

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onReviewSubmitted?: (review: Review) => void;
  preselectedTarget?: { id: string; name: string; role: string } | null;
}

const ratingLabels: Record<number, string> = {
  1: '1 Star - Unsatisfactory / High Risk',
  2: '2 Stars - Needs Improvement',
  3: '3 Stars - Satisfactory / Standard',
  4: '4 Stars - Very Good / Reliable',
  5: '5 Stars - Exceptional / Highly Recommended'
};

export default function ReviewModal({
  isOpen,
  onClose,
  currentUser,
  onReviewSubmitted,
  preselectedTarget
}: ReviewModalProps) {
  // Determine allowed roles for this reviewer
  const allowedRoles = useMemo(() => {
    if (currentUser.role === UserRole.VETERINARIAN) {
      return [
        { value: 'farmer', label: 'Farmer / Shamba Operator' },
        { value: 'investor', label: 'Investor / Capital Partner' }
      ];
    }
    if (currentUser.role === UserRole.INVESTOR) {
      return [
        { value: 'farmer', label: 'Farmer / Shamba Operator' },
        { value: 'veterinarian', label: 'Veterinarian / Clinical Officer' }
      ];
    }
    if (currentUser.role === UserRole.FARMER) {
      return [
        { value: 'investor', label: 'Investor / Capital Partner' },
        { value: 'veterinarian', label: 'Veterinarian / Clinical Officer' }
      ];
    }
    return [
      { value: 'farmer', label: 'Farmer' },
      { value: 'investor', label: 'Investor' },
      { value: 'veterinarian', label: 'Veterinarian' }
    ];
  }, [currentUser.role]);

  const [targetRole, setTargetRole] = useState<string>(allowedRoles[0]?.value || 'farmer');
  const [candidates, setCandidates] = useState<ReviewCandidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchLoading, setFetchLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  // Fetch candidates when modal opens
  useEffect(() => {
    if (!isOpen) {
      setSuccess(false);
      setError('');
      return;
    }

    const loadCandidates = async () => {
      setFetchLoading(true);
      setError('');
      try {
        const res = await sharedWorkspaceApi.reviewCandidates();
        if (res.data?.candidates) {
          setCandidates(res.data.candidates);
        } else if (res.error) {
          setError(res.error);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load partners for review.');
      } finally {
        setFetchLoading(false);
      }
    };

    void loadCandidates();
  }, [isOpen]);

  // Set initial target based on preselected target or candidate list
  useEffect(() => {
    if (preselectedTarget) {
      const matchedRole = allowedRoles.find(r => r.value === preselectedTarget.role.toLowerCase());
      if (matchedRole) {
        setTargetRole(matchedRole.value);
      }
      setSelectedCandidateId(preselectedTarget.id);
    }
  }, [preselectedTarget, allowedRoles]);

  // Filter candidates matching currently selected target role
  const matchingCandidates = useMemo(() => {
    return candidates.filter(c => c.role.toLowerCase() === targetRole.toLowerCase());
  }, [candidates, targetRole]);

  // Sync selectedCandidateId when role changes if current selection is invalid
  useEffect(() => {
    if (matchingCandidates.length > 0) {
      if (!matchingCandidates.some(c => c.id === selectedCandidateId)) {
        setSelectedCandidateId(matchingCandidates[0].id);
      }
    } else {
      setSelectedCandidateId('');
    }
  }, [targetRole, matchingCandidates, selectedCandidateId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidateId) {
      setError('Please select a partner to review.');
      return;
    }
    if (!comment.trim()) {
      setError('Please provide feedback comments.');
      return;
    }

    const candidate = candidates.find(c => c.id === selectedCandidateId);
    setLoading(true);
    setError('');

    try {
      const payload: Record<string, unknown> = {
        targetUserId: selectedCandidateId,
        rating,
        comment: comment.trim()
      };

      if (candidate?.engagementId) {
        if (candidate.engagementType === 'job') {
          payload.jobId = candidate.engagementId;
        } else {
          payload.partnershipId = candidate.engagementId;
        }
      }

      const res = await sharedWorkspaceApi.submitReview(payload);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        if (res.data?.review && onReviewSubmitted) {
          onReviewSubmitted(res.data.review);
        }
        setTimeout(() => {
          onClose();
        }, 1600);
      }
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none"
      id="review_modal_backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review_modal_title"
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        id="review_modal_box"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <MessageSquareQuote className="h-5 w-5" />
            </div>
            <div>
              <h3 id="review_modal_title" className="text-sm font-bold text-slate-900 dark:text-white">
                Submit Agricultural Partner Review
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Cooperative peer feedback for verified accountability
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close review dialog"
            id="btn_close_review_modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {success ? (
            <div className="py-8 text-center space-y-3" id="review_modal_success">
              <div className="inline-flex p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Review Published Successfully!
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                Thank you for contributing to transparent and trustworthy cooperative farming on ShambaLoop.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" id="review_submission_form">
              {error && (
                <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Target Role Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  1. Who are you reviewing?
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  id="review_target_role_select"
                >
                  {allowedRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  {currentUser.role === UserRole.VETERINARIAN && 'As a veterinarian, you can evaluate participating farmers or project investors.'}
                  {currentUser.role === UserRole.INVESTOR && 'As an investor, you can evaluate partner farmers or clinical veterinarians.'}
                  {currentUser.role === UserRole.FARMER && 'As a farmer, you can evaluate capital investors or clinical veterinarians.'}
                </p>
              </div>

              {/* 2. Specific Partner Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  2. Select the respective {targetRole === 'farmer' ? 'Farmer' : targetRole === 'investor' ? 'Investor' : 'Veterinarian'}
                </label>
                {fetchLoading ? (
                  <div className="p-3 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                    Loading verified partner list...
                  </div>
                ) : matchingCandidates.length > 0 ? (
                  <select
                    value={selectedCandidateId}
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    required
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                    id="review_target_partner_select"
                  >
                    {matchingCandidates.map((cand) => (
                      <option key={cand.id} value={cand.id}>
                        {cand.name} ({cand.county}) — {cand.context} {cand.alreadyReviewed ? '★ [Previously Reviewed]' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900">
                    No active or past engagements found with any {targetRole} yet. Once you engage in a partnership, proposal, or veterinary job, they will be listed here.
                  </div>
                )}
              </div>

              {/* 3. Interactive Star Rating */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  3. Overall Rating
                </label>
                <div className="flex items-center gap-1.5 my-1" id="review_star_rating_selector">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none transition-colors cursor-pointer"
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`h-6 w-6 ${
                          (hoverRating || rating) >= star
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                    {ratingLabels[hoverRating || rating]}
                  </span>
                </div>
              </div>

              {/* 4. Comments */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  4. Written Evaluation & Feedback
                </label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Describe communication timeliness, animal welfare standards, transparency, financial diligence, or veterinary precision..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  id="review_comment_input"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  id="btn_cancel_review"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedCandidateId || matchingCandidates.length === 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                  id="btn_submit_review"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {loading ? 'Submitting Review...' : 'Publish Review'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
