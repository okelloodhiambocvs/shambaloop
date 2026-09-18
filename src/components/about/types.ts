export interface ProblemCardItem {
  id: string;
  image: string;
  badge: string;
  title: string;
  description: string;
}

export interface SolutionStepItem {
  number: number;
  image: string;
  category: string;
  title: string;
  description: string;
  accentColor: string;
}

export interface ApproachPointItem {
  title: string;
  description: string;
}

export interface AboutPageProps {
  onBack: () => void;
  onLoginClick: (role?: any) => void;
  onOpenDoc: (doc: string) => void;
  onNavigateHowItWorks?: () => void;
  onNavigateFaq?: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}
