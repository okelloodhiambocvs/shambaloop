import React, { useEffect } from 'react';
import { AboutNavbar } from './AboutNavbar';
import { AboutHero } from './AboutHero';
import { AboutProblem } from './AboutProblem';
import { AboutApproach } from './AboutApproach';
import { AboutSolution } from './AboutSolution';
import { AboutFooter } from './AboutFooter';
import { AboutPageProps } from './types';

export default function AboutPage({
  onBack,
  onLoginClick,
  onOpenDoc,
  onNavigateHowItWorks,
  onNavigateFaq,
  isDarkMode,
  toggleTheme,
}: AboutPageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.title = 'About Us | ShambaLoop Kenya';
    return () => {
      document.title = 'ShambaLoop';
    };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors bg-white dark:bg-[#0b130e] text-slate-900 dark:text-slate-100"
      id="shambaloop_about_page"
    >
      <AboutNavbar
        onBack={onBack}
        onLoginClick={() => onLoginClick('dashboard')}
        onOpenDoc={onOpenDoc}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        activePage="about"
        onNavigateAbout={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onNavigateHowItWorks={onNavigateHowItWorks}
        onNavigateFaq={onNavigateFaq}
      />

      <main className="flex-1">
        <AboutHero onExplore={onBack} />
        <AboutProblem />
        <AboutApproach />
        <AboutSolution />
      </main>

      <AboutFooter
        onBack={onBack}
        onOpenDoc={onOpenDoc}
        onNavigateAbout={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onNavigateHowItWorks={onNavigateHowItWorks}
        onNavigateFaq={onNavigateFaq}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
