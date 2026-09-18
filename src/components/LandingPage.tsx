import React from 'react';
import { UserRole } from '../types';
import RoleWorkflowSection from './RoleWorkflowSection';
import { LandingNavbar } from './landing/LandingNavbar';
import { LandingHero } from './landing/LandingHero';
import { LandingAboutSection } from './landing/LandingAboutSection';
import { LandingFooter } from './landing/LandingFooter';

interface LandingPageProps {
  onLoginClick: (role?: UserRole | 'dashboard') => void;
  onOpenDoc: (title: string) => void;
  onNavigateAbout?: () => void;
  onNavigateHowItWorks?: () => void;
  onNavigateFaq?: () => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

export default function LandingPage({
  onLoginClick,
  onOpenDoc,
  onNavigateAbout,
  onNavigateHowItWorks,
  onNavigateFaq,
  isDarkMode = false,
  toggleTheme,
}: LandingPageProps) {
  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-all duration-300 bg-bg-base text-text-base"
      id="shambaloop_landing_page"
    >
      <LandingNavbar
        onLoginClick={onLoginClick}
        onOpenDoc={onOpenDoc}
        onNavigateAbout={onNavigateAbout}
        onNavigateHowItWorks={onNavigateHowItWorks}
        onNavigateFaq={onNavigateFaq}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      <LandingHero
        onLoginClick={onLoginClick}
        onOpenDoc={onOpenDoc}
        isDarkMode={isDarkMode}
      />

      <RoleWorkflowSection
        onLoginClick={onLoginClick}
        isDarkMode={isDarkMode}
      />

      <LandingAboutSection
        onLoginClick={onLoginClick}
        onOpenDoc={onOpenDoc}
        onNavigateAbout={onNavigateAbout}
      />

      <LandingFooter
        onOpenDoc={onOpenDoc}
        onNavigateAbout={onNavigateAbout}
        onNavigateHowItWorks={onNavigateHowItWorks}
        onNavigateFaq={onNavigateFaq}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
