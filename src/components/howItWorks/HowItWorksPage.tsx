import React, { useEffect } from 'react';
import { AboutNavbar } from '../about/AboutNavbar';
import { AboutFooter } from '../about/AboutFooter';
import { HowItWorksHero } from './HowItWorksHero';
import { FarmerWorkflow } from './FarmerWorkflow';
import { InvestorWorkflow } from './InvestorWorkflow';
import { VetWorkflow } from './VetWorkflow';
import { WorkflowEscrowSection } from './WorkflowEscrowSection';
import { UserRole } from '../../types';

interface HowItWorksPageProps {
  onBack: () => void;
  onLoginClick: (role?: UserRole) => void;
  onOpenDoc: (title: string) => void;
  onNavigateAbout?: () => void;
  onNavigateFaq?: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({
  onBack,
  onLoginClick,
  onOpenDoc,
  onNavigateAbout,
  onNavigateFaq,
  isDarkMode,
  toggleTheme,
}) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <AboutNavbar
        onBack={onBack}
        onLoginClick={() => onLoginClick()}
        onOpenDoc={onOpenDoc}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        activePage="how-it-works"
        onNavigateAbout={onNavigateAbout}
        onNavigateHowItWorks={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onNavigateFaq={onNavigateFaq}
      />

      <main className="flex-1">
        <HowItWorksHero onLoginClick={onLoginClick} />
        <FarmerWorkflow onLoginClick={onLoginClick} />
        <InvestorWorkflow onLoginClick={onLoginClick} />
        <VetWorkflow onLoginClick={onLoginClick} />
        <WorkflowEscrowSection onLoginClick={onLoginClick} />
      </main>

      <AboutFooter
        onBack={onBack}
        onOpenDoc={onOpenDoc}
        onNavigateAbout={onNavigateAbout}
        onNavigateHowItWorks={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onNavigateFaq={onNavigateFaq}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
