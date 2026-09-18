import React from 'react';
import { AboutFooter } from '../about/AboutFooter';

interface LandingFooterProps {
  onOpenDoc: (title: string) => void;
  onNavigateAbout?: () => void;
  onNavigateHowItWorks?: () => void;
  onNavigateFaq?: () => void;
  onBack?: () => void;
  isDarkMode?: boolean;
}

/**
 * LandingFooter providing identical, uniform design matching About Us footer
 */
export const LandingFooter: React.FC<LandingFooterProps> = ({
  onOpenDoc,
  onNavigateAbout,
  onNavigateHowItWorks,
  onNavigateFaq,
  onBack = () => window.scrollTo({ top: 0, behavior: 'smooth' }),
  isDarkMode = false,
}) => {
  return (
    <AboutFooter
      onBack={onBack}
      onOpenDoc={onOpenDoc}
      onNavigateAbout={onNavigateAbout}
      onNavigateHowItWorks={onNavigateHowItWorks}
      onNavigateFaq={onNavigateFaq}
      isDarkMode={isDarkMode}
    />
  );
};
