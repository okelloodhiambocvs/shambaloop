/**
 * ShambaLoop Official Brand Assets
 * Modular re-exports
 */
import React from 'react';
import { TrustBadge } from './brand/TrustBadge';

export { Logo } from './brand/Logo';
export { TrustBadge } from './brand/TrustBadge';
export { BrandedEmptyState } from './brand/BrandedEmptyState';
export { BrandedLoader } from './brand/BrandedLoader';
export { SkeletonLoader } from './brand/SkeletonLoader';

export const VerifiedBadge: React.FC<{
  type?: any;
  showLabel?: boolean;
  className?: string;
}> = ({ type, showLabel = true, className = '' }) => {
  const mappedType = type === 'kvb' || type === 'land' || type === 'escrow' || type === 'agreement' ? type : 'trust';
  return <TrustBadge type={mappedType} showLabel={showLabel} className={className} />;
};
