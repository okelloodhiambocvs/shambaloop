import React, { useState, useEffect } from 'react';
import { 
  User, UserRole, Listing, ListingType, LeaseAgreement, 
  LivestockPartnership, VerificationRequest, MpesaTransaction, VeterinaryReport,
  FarmerProposal, InvestorCriteria, InvestorFarmerProfile, FarmEvent, VeterinaryJob, TripartiteMatch, Dispute
} from './types';
import ListingCard from './components/ListingCard';
import CreateListingModal from './components/CreateListingModal';
import EscrowPaymentModal from './components/EscrowPaymentModal';
import { WorkflowTooltip } from './components/WorkflowTooltip';
import AdminPanel from './components/AdminPanel';
import VeterinaryDashboard from './components/VeterinaryDashboard';
import FarmerDashboard from './components/FarmerDashboard';
import InvestorDashboard from './components/InvestorDashboard';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import { Logo, VerifiedBadge, BrandedEmptyState, BrandedLoader } from './components/BrandAssets';
import { Sun, Moon } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Brush, Cell } from 'recharts';

import { validateSchema, registrationSchema, listingSchema, leaseSchema, validatePasswordStrength } from './utils/validation';
import { safeFetch, showToast } from './utils/apiHandler';
import { useAuditLogger } from './hooks/useAuditLogger';

const CustomProductionTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formattedDate = data.formattedDate || '';
    const dateStr = data.date || '';

    return (
      <div className="bg-slate-950 border border-slate-800 text-white rounded-xl p-3 shadow-xl text-[11px] space-y-2 select-none z-50 min-w-[210px]" id="production_trend_tooltip_box">
        <div className="border-b border-white/10 pb-1">
          <p className="font-bold text-emerald-400 font-sans">{formattedDate}</p>
          <p className="text-[9px] text-slate-400 font-mono">{dateStr}</p>
        </div>
        <div className="space-y-3">
          {payload.map((entry: any, index: number) => {
            const isCompare = entry.dataKey === 'compareQuantity';
            const logElement = isCompare ? data.originalLog2 : data.originalLog1;
            const title = entry.name || (isCompare ? 'Comparison Asset' : 'Primary Asset');
            const color = entry.stroke || entry.fill || (isCompare ? '#b45309' : '#10b981');
            
            const qty = entry.value || 0;
            const rev = logElement?.revenueKES || 0;
            const inv = logElement?.investorPayoutKES || 0;
            const farm = logElement?.farmerPayoutKES || 0;

            const isAnomaly = isCompare ? data.compareIsAnomaly : data.isAnomaly;
            const ma = isCompare ? data.compareMovingAverage7Day : data.movingAverage7Day;
            const dropPct = isCompare ? data.comparePercentDrop : data.percentDrop;

            return (
              <div key={index} className="space-y-1">
                <p className="flex items-center gap-1 font-bold text-[10px]" style={{ color }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                  <span>{title}</span>
                </p>
                <p className="flex justify-between gap-4 text-[10px]">
                  <span className="text-slate-400 font-sans">Yield Level:</span>
                  <span className="font-bold font-mono">{qty} {logElement?.metric || 'Liters'}</span>
                </p>
                {ma && (
                  <p className="flex justify-between gap-4 text-[9px] text-slate-400">
                    <span>7-Day Moving Avg:</span>
                    <span className="font-mono text-slate-300">{ma} {logElement?.metric || 'Liters'}</span>
                  </p>
                )}
                
                {isAnomaly && (
                  <div className="bg-rose-950/85 border border-rose-800 text-rose-300 rounded-lg p-1.5 mt-1 space-y-0.5 animate-pulse">
                    <p className="font-bold text-[9px] flex items-center gap-1">
                      <span>Yield Outlier Drop Alert</span>
                    </p>
                    <p className="text-[8px] text-rose-200">
                      Dropped by <span className="font-bold text-rose-100">{dropPct}%</span> below the 7-day moving average!
                    </p>
                  </div>
                )}

                {rev > 0 && (
                  <div className="pl-1.5 border-l border-white/10 space-y-0.5 mt-0.5">
                    <p className="flex justify-between gap-4 text-[9px] text-slate-300">
                      <span>Market Valuation:</span>
                      <span className="font-mono text-amber-300">KES {rev.toLocaleString()}</span>
                    </p>
                    <p className="flex justify-between gap-4 text-[8px] text-slate-400">
                      <span>Farmer split:</span>
                      <span className="font-mono text-emerald-300">KES {farm.toLocaleString()}</span>
                    </p>
                    <p className="flex justify-between gap-4 text-[8px] text-slate-400">
                      <span>Investor split:</span>
                      <span className="font-mono text-amber-300">KES {inv.toLocaleString()}</span>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const CustomProductionDot = (props: any) => {
  const { cx, cy, payload, dataKey } = props;
  if (!payload) return null;

  const isCompare = dataKey === 'compareQuantity';
  const isAnomaly = isCompare ? payload.compareIsAnomaly : payload.isAnomaly;
  const currentDrop = isCompare ? payload.comparePercentDrop : payload.percentDrop;
  const currentMA = isCompare ? payload.compareMovingAverage7Day : payload.movingAverage7Day;

  if (isAnomaly) {
    return (
      <g style={{ cursor: 'pointer' }} id={`drop_alert_dot_${payload.date}_${dataKey}`}>
        {/* Pulsing background circle glow */}
        <circle cx={cx} cy={cy} r={8} fill="#ef4444" opacity={0.4} className="animate-ping" style={{ transformOrigin: `${cx}px ${cy}px` }} />
        {/* Triangle caution indicator */}
        <path
          d={`M ${cx} ${cy - 8} L ${cx - 7} ${cy + 5} L ${cx + 7} ${cy + 5} Z`}
          fill="#ef4444"
          stroke="#ffffff"
          strokeWidth={1}
          strokeLinejoin="round"
        />
        {/* Exclamation point inside the triangle */}
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="8px" fontWeight="900" fill="#ffffff" fontFamily="sans-serif">!</text>
        <title>{`Anomaly: Yield dropped by ${currentDrop}% below 7-day moving avg (${currentMA})`}</title>
      </g>
    );
  }

  // Standard dot
  const fillCol = isCompare ? '#b45309' : '#059669';
  return <circle cx={cx} cy={cy} r={3.5} stroke="#fff" strokeWidth={1.5} fill={fillCol} id={`normal_dot_${payload.date}_${dataKey}`} />;
};

const COUNTIES_LIST = ['All Counties', 'Nyandarua', 'Kiambu', 'Nakuru', 'Uasin Gishu', 'Nairobi'];

// --- Canonical Seed Users Single Source of Truth ---
export const CANONICAL_SEED_USERS: Record<string, User> = {
  [UserRole.LANDOWNER]: {
    id: 'user_1',
    phone: '0712345678',
    name: 'Wanjiku Kamau',
    email: 'wanjiku@shambaloop.co.ke',
    role: UserRole.LANDOWNER,
    verified: true,
    county: 'Nyandarua',
    createdAt: '2026-06-15T00:00:00.000Z',
    farmSpecialties: ['Potato Farming', 'Cabbage Farm leasing'],
    seekingLandAcreage: 12
  },
  [UserRole.FARMER]: {
    id: 'user_2',
    phone: '0722111222',
    name: 'Josphat Kiprop',
    email: 'kiprop.farm@gmail.com',
    role: UserRole.FARMER,
    verified: true,
    county: 'Uasin Gishu',
    createdAt: '2026-06-15T00:00:00.000Z',
    farmSpecialties: ['Dairy Farming', 'Maize Production', 'Heifer breeding'],
    seekingLandAcreage: 20
  },
  [UserRole.INVESTOR]: {
    id: 'user_3',
    phone: '0733444555',
    name: 'David Mwangi',
    email: 'mwangi.diaspora@yahoo.com',
    role: UserRole.INVESTOR,
    verified: true,
    county: 'Nairobi',
    createdAt: '2026-06-15T00:00:00.000Z',
    investmentBudgetKES: 1200000,
    preferredSectors: ['Livestock', 'Leaseholds'],
    investmentGoal: 'Seeking high-yield dairy cows or 10-25 acres of fertile cabbage shamba'
  },
  [UserRole.ADMIN]: {
    id: 'user_admin',
    phone: '0700000000',
    role: UserRole.ADMIN,
    verified: true,
    county: 'Nairobi',
    name: 'Sylvanus Oroko',
    email: 'admin@shambaloop.ke',
    createdAt: '2026-06-15T00:00:00.000Z'
  },
  [UserRole.VETERINARIAN]: {
    id: 'user_vet',
    phone: '0744555666',
    role: UserRole.VETERINARIAN,
    verified: true,
    county: 'Kiambu',
    name: 'Dr. Akinyi Otieno',
    email: 'vet@shambaloop.ke',
    createdAt: '2026-06-15T00:00:00.000Z',
    farmSpecialties: ['Dairy health', 'Vaccination', 'Breeding checks']
  }
};

const seedUsers: User[] = [
  CANONICAL_SEED_USERS[UserRole.LANDOWNER],
  CANONICAL_SEED_USERS[UserRole.FARMER],
  CANONICAL_SEED_USERS[UserRole.INVESTOR],
  CANONICAL_SEED_USERS[UserRole.ADMIN],
  CANONICAL_SEED_USERS[UserRole.VETERINARIAN]
];

export default function App() {
  const { logAction } = useAuditLogger();

  // 1. Theme Configuration & State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('sl_theme') === 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    localStorage.setItem('sl_theme', nextTheme ? 'dark' : 'light');
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Dynamic user list and session authentication states
  const [usersList, setUsersList] = useState<User[]>(() => {
    const stored = localStorage.getItem('sl_users_list');
    const coreSeedIds = new Set(seedUsers.map(u => u.id));
    const coreSeedPhones = new Set(seedUsers.map(u => u.phone));

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User[];
        // Purge any duplicate, obsolete, or extra 'user_' prefixed users
        // and any custom-registered accounts matching core seed phone numbers to prevent duplicates
        const filtered = parsed.filter(u => {
          if (u.id.startsWith('user_') && !coreSeedIds.has(u.id)) {
            return false;
          }
          if (!coreSeedIds.has(u.id) && coreSeedPhones.has(u.phone)) {
            return false;
          }
          return true;
        });

        const idMap = new Map<string, User>();
        // First populate seedUsers to guarantee exactly one of each official seed user is represented
        seedUsers.forEach(u => idMap.set(u.id, u));

        // Let's also enforce uniqueness by phone number to wipe out potential custom duplicates
        const phoneMap = new Map<string, User>();
        seedUsers.forEach(u => phoneMap.set(u.phone, u));

        filtered.forEach(u => {
          if (!idMap.has(u.id) && !phoneMap.has(u.phone)) {
            idMap.set(u.id, u);
            phoneMap.set(u.phone, u);
          }
        });

        const merged = Array.from(idMap.values());
        localStorage.setItem('sl_users_list', JSON.stringify(merged));
        return merged;
      } catch (err) {
        console.error("Purging faulty custom session data:", err);
      }
    }
    localStorage.setItem('sl_users_list', JSON.stringify(seedUsers));
    return seedUsers;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('sl_current_user');
    if (stored) {
      try {
        const u = JSON.parse(stored) as User;
        const matchingSeed = seedUsers.find(su => su.phone === u.phone || su.id === u.id);
        if (matchingSeed) {
          return matchingSeed;
        }
        return u;
      } catch (err) {
        // Fallback below
      }
    }
    return null; // Show landing page when not logged in
  });

  const [veterinaryReports, setVeterinaryReports] = useState<VeterinaryReport[]>(() => {
    const stored = localStorage.getItem('sl_veterinary_reports');
    if (stored) {
      try {
        return JSON.parse(stored) as VeterinaryReport[];
      } catch {
        return [];
      }
    }
    return [{
      id: 'vet_report_1',
      partnershipId: 'part_xyz',
      animalTagId: 'SL-KE-FR-901',
      veterinarianId: 'user_vet',
      veterinarianName: 'Dr. Akinyi Otieno',
      farmerId: 'user_2',
      investorId: 'user_3',
      visitType: 'Vaccination',
      findings: 'Routine vaccination completed. Animal is active with normal rumen activity.',
      recommendations: 'Continue current feed plan and schedule the next review in 30 days.',
      status: 'FIT_FOR_PRODUCTION',
      createdAt: '2026-06-12T00:00:00.000Z'
    }];
  });

  // Login Modal state for landing page & header
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginTargetRole, setLoginTargetRole] = useState<UserRole | 'dashboard' | null>(null);

  // Manage login/register UI state values
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authPhone, setAuthPhone] = useState('');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authCounty, setAuthCounty] = useState('Nyandarua');
  const [authRole, setAuthRole] = useState<UserRole>(UserRole.FARMER);
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');



  // Authentication Handlers
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    // Schema compilation checks
    const valResult = validateSchema({
      name: authName,
      phone: authPhone,
      email: authEmail || undefined,
      role: authRole,
      county: authCounty
    }, registrationSchema);

    if (!valResult.success) {
      const firstErrorMsg = Object.values(valResult.errors)[0];
      setAuthError(firstErrorMsg);
      showToast(firstErrorMsg);
      return;
    }

    try {
      const { data, error } = await safeFetch<any>('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: authPhone,
          name: authName,
          email: authEmail || undefined,
          role: authRole,
          county: authCounty
        })
      });

      if (!error && data?.user) {
        setAuthSuccessMsg('Akaunti imeundwa! Account created successfully.');
        setCurrentUser(data.user);
        localStorage.setItem('sl_current_user', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('sl_token', data.token);
        }
        setUsersList(prev => [...prev.filter(u => u.phone !== data.user.phone), data.user]);
        logAction('register_account', { name: authName, phone: authPhone, role: authRole }, data.user.id, data.user.name);
        // Reset fields
        setAuthPhone('');
        setAuthName('');
        setAuthEmail('');
      } else {
        setAuthError(error || 'Registration failed');
      }
    } catch (err: any) {
      // Offline fallback
      const offlineId = `user_${Date.now()}`;
      const offlineUser: User = {
        id: offlineId,
        phone: authPhone,
        name: authName,
        email: authEmail || undefined,
        role: authRole,
        verified: false,
        county: authCounty,
        createdAt: new Date().toISOString()
      };
      setUsersList(prev => [...prev.filter(u => u.phone !== offlineUser.phone), offlineUser]);
      setCurrentUser(offlineUser);
      localStorage.setItem('sl_current_user', JSON.stringify(offlineUser));
      setAuthSuccessMsg('Offline registration succeeded (In-Memory)!');
      logAction('register_account_offline', { name: authName, phone: authPhone, role: authRole }, offlineId, authName);
      // Reset fields
      setAuthPhone('');
      setAuthName('');
      setAuthEmail('');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    if (!authPhone) {
      setAuthError('Please enter your phone number to login.');
      return;
    }

    try {
      const { data, error } = await safeFetch<any>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: authPhone, password: authPassword || undefined })
      });

      if (!error && data?.user) {
        setCurrentUser(data.user);
        localStorage.setItem('sl_current_user', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('sl_token', data.token);
        }
        setAuthSuccessMsg('Karibu tena! Welcome back.');
        logAction('login_account', { phone: authPhone }, data.user.id, data.user.name);
      } else {
        setAuthError(error || 'Login failed');
      }
    } catch (err) {
      // Offline fallback
      const matchedUser = usersList.find(u => u.phone === authPhone);
      if (matchedUser) {
        setCurrentUser(matchedUser);
        localStorage.setItem('sl_current_user', JSON.stringify(matchedUser));
        setAuthSuccessMsg('Welcome back (offline sandbox session)!');
        logAction('login_account_offline', { phone: authPhone }, matchedUser.id, matchedUser.name);
      } else {
        setAuthError('Phone number not found. You can register a new account on the register tab!');
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sl_current_user');
    localStorage.removeItem('sl_token');
  };

  const handleSaveVeterinaryReport = async (input: { partnershipId: string; visitType: string; findings: string; recommendations: string; status: VeterinaryReport['status'] }) => {
    const { data, error } = await veterinaryFetch<VeterinaryReport>('/api/veterinary/reports', { method: 'POST', body: JSON.stringify(input) });
    if (error || !data) throw new Error(error || 'Could not publish the veterinary report.');
    setVeterinaryReports(previous => [data, ...previous]);
    showToast('Veterinary report published.');
  };

  const openLoginModal = (targetRole?: UserRole | 'dashboard') => {
    setLoginTargetRole(targetRole || null);
    setIsLoginModalOpen(true);
  };

  const handleSelectModalUser = (user: User) => {
    if (loginTargetRole && loginTargetRole !== 'dashboard' && user.role !== loginTargetRole) {
      return;
    }

    if (loginTargetRole === 'dashboard' && user.role !== UserRole.ADMIN) {
      return;
    }

    setCurrentUser(user);
    localStorage.setItem('sl_current_user', JSON.stringify(user));
    setIsLoginModalOpen(false);
    logAction('login_role_select', { role: user.role, name: user.name }, user.id, user.name);
  };

  const handleModalCustomLogin = async (phone: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const matched = usersList.find(u => u.phone === phone);

    if (loginTargetRole && loginTargetRole !== 'dashboard' && matched && matched.role !== loginTargetRole) {
      return { success: false, error: 'This account does not match the selected role.' };
    }

    if (loginTargetRole === 'dashboard' && matched && matched.role !== UserRole.ADMIN) {
      return { success: false, error: 'Only the admin account can access the dashboard.' };
    }

    try {
      const { data, error } = await safeFetch<any>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });

      if (!error && data?.user) {
        if (loginTargetRole && loginTargetRole !== 'dashboard' && data.user.role !== loginTargetRole) {
          return { success: false, error: 'This account does not match the selected role.' };
        }

        if (loginTargetRole === 'dashboard' && data.user.role !== UserRole.ADMIN) {
          return { success: false, error: 'Only the admin account can access the dashboard.' };
        }

        setCurrentUser(data.user);
        localStorage.setItem('sl_current_user', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('sl_token', data.token);
        }
        logAction('login_account', { phone }, data.user.id, data.user.name);
        return { success: true };
      } else {
        // Check offline fallback
        if (matched) {
          if (loginTargetRole && loginTargetRole !== 'dashboard' && matched.role !== loginTargetRole) {
            return { success: false, error: 'This account does not match the selected role.' };
          }

          if (loginTargetRole === 'dashboard' && matched.role !== UserRole.ADMIN) {
            return { success: false, error: 'Only the admin account can access the dashboard.' };
          }

          setCurrentUser(matched);
          localStorage.setItem('sl_current_user', JSON.stringify(matched));
          logAction('login_account_offline', { phone }, matched.id, matched.name);
          return { success: true };
        }
        return { success: false, error: error || 'Phone number not found. You can create a new account!' };
      }
    } catch (err: any) {
      const matched = usersList.find(u => u.phone === phone);
      if (matched) {
        setCurrentUser(matched);
        localStorage.setItem('sl_current_user', JSON.stringify(matched));
        logAction('login_account_offline', { phone }, matched.id, matched.name);
        return { success: true };
      }
      return { success: false, error: 'User not found. Try registering!' };
    }
  };

  const handleModalCustomRegister = async (userData: {
    name: string;
    phone: string;
    email?: string;
    role: UserRole;
    county: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await safeFetch<any>('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (!error && data?.user) {
        setCurrentUser(data.user);
        localStorage.setItem('sl_current_user', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('sl_token', data.token);
        }
        setUsersList(prev => [...prev.filter(u => u.phone !== data.user.phone), data.user]);
        logAction('register_account', userData, data.user.id, data.user.name);
        return { success: true };
      } else {
        // Offline fallback
        const offlineId = `user_${Date.now()}`;
        const offlineUser: User = {
          id: offlineId,
          ...userData,
          verified: false,
          createdAt: new Date().toISOString()
        };
        setUsersList(prev => [...prev.filter(u => u.phone !== offlineUser.phone), offlineUser]);
        setCurrentUser(offlineUser);
        localStorage.setItem('sl_current_user', JSON.stringify(offlineUser));
        logAction('register_account_offline', userData, offlineId, userData.name);
        return { success: true };
      }
    } catch (err: any) {
      const offlineId = `user_${Date.now()}`;
      const offlineUser: User = {
        id: offlineId,
        ...userData,
        verified: false,
        createdAt: new Date().toISOString()
      };
      setUsersList(prev => [...prev.filter(u => u.phone !== offlineUser.phone), offlineUser]);
      setCurrentUser(offlineUser);
      localStorage.setItem('sl_current_user', JSON.stringify(offlineUser));
      logAction('register_account_offline', userData, offlineId, userData.name);
      return { success: true };
    }
  };

  // Core Listings & Business Data states
  const [listings, setListings] = useState<Listing[]>([]);
  const [leases, setLeases] = useState<LeaseAgreement[]>([]);
  const [partnerships, setPartnerships] = useState<LivestockPartnership[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [analytics, setAnalytics] = useState<any>({
    activeListings: 0,
    activeFarms: 0,
    totalLeasedAcreage: 0,
    totalEscrowKES: 0,
    registeredUsersCount: 4,
    pendingVerificationsCount: 0
  });
  const [farmerInvestors, setFarmerInvestors] = useState<User[]>([]);
  const [farmerVeterinarians, setFarmerVeterinarians] = useState<User[]>([]);
  const [investorFarmers, setInvestorFarmers] = useState<InvestorFarmerProfile[]>([]);
  const [investorCriteria, setInvestorCriteria] = useState<InvestorCriteria | null>(null);

  // Ecosystem state for 4-role dashboards
  const [proposals, setProposals] = useState<FarmerProposal[]>([
    {
      id: 'prop_1',
      farmerId: 'user_farmer_1',
      farmerName: 'John Kamau',
      farmerPhone: '+254712345678',
      investorId: 'user_investor_1',
      investorName: 'Samuel Kibet',
      title: 'Pedigree Friesian Dairy Expansion (5 In-Calf Heifers)',
      sector: 'Dairy',
      farmDescription: '8 acres with permanent borehole solar pumping and 3 acres established Brachiaria & Napier fodder.',
      capitalRequestedKES: 350000,
      farmerContribution: '8 acres land, borehole water supply, 2 full-time herdsmen, zero-grazing unit',
      investorSharePercent: 40,
      farmerSharePercent: 60,
      status: 'SUBMITTED',
      createdAt: '2026-06-10'
    },
    {
      id: 'prop_2',
      farmerId: 'user_farmer_2',
      farmerName: 'Wanjiku Mwangi',
      farmerPhone: '+254723456789',
      title: 'Commercial Greenhouse Drip Horticulture (Capsicum & Tomatoes)',
      sector: 'Horticulture',
      farmDescription: 'Experienced agronomist with 12 years in greenhouse production seeking capital to install 2 metallic tunnels.',
      capitalRequestedKES: 480000,
      farmerContribution: '4 acres fertile loam soil, water reservoir, supermarket off-take contract',
      investorSharePercent: 45,
      farmerSharePercent: 55,
      status: 'UNDER_REVIEW',
      createdAt: '2026-06-11'
    }
  ]);

  const [farmEvents, setFarmEvents] = useState<FarmEvent[]>([
    {
      id: 'evt_1',
      farmId: 'farm_kiambu_01',
      farmerName: 'John Kamau',
      eventType: 'CALVING_DUE',
      title: 'Heifer SL-KE-FR-901 in Final 10-Day Gestation Window',
      description: 'Pedigree Friesian heifer confirmed pregnant via veterinary ultrasound. Transition diet introduced.',
      severity: 'MEDIUM',
      actionTaken: 'Daily pelvic ligament and udder checks; Dr. Akinyi on emergency standby',
      impactOnProduce: 'Projected +26 Liters/day milk surge upon calving',
      date: '2026-06-12',
      reportedBy: 'John Kamau (Farm Manager)'
    },
    {
      id: 'evt_2',
      farmId: 'farm_nyandarua_02',
      farmerName: 'Josphat Kiprop',
      eventType: 'DROUGHT_ALERT',
      title: 'Delayed Short Rains Advisory in Nyandarua Plateau',
      description: 'Sub-county meteorological department issued dry spell alert. Fodder conservation activated.',
      severity: 'HIGH',
      actionTaken: 'Purchased 40 bales of Rhodes grass hay and opened secondary silage bunker',
      impactOnProduce: 'Yield maintained steady at 22L/day through preserved silage',
      date: '2026-06-11',
      reportedBy: 'Josphat Kiprop (Farm Manager)'
    }
  ]);

  const [vetJobs, setVetJobs] = useState<VeterinaryJob[]>([
    {
      id: 'job_1',
      farmId: 'part_xyz',
      farmerName: 'John Kamau',
      farmerPhone: '+254712345678',
      location: 'Kiambu Zero-Grazing Unit, Muguga Ward',
      animalOrCropType: 'Pedigree Friesian Heifers (SL-901 & SL-902)',
      serviceType: 'PREGNANCY_SCAN',
      urgency: 'NORMAL',
      status: 'ASSIGNED',
      assignedVetId: 'user_vet_1',
      assignedVetName: 'Dr. Akinyi Otieno',
      requestedDate: '2026-06-12',
      notes: 'Day 60 post-insemination ultrasound scan and body condition score audit'
    },
    {
      id: 'job_2',
      farmId: 'farm_kisumu_03',
      farmerName: 'Otieno Odhiambo',
      farmerPhone: '+254734567890',
      location: 'Riat Hills Farm, Kisumu County',
      animalOrCropType: 'Dairy Crosses (12 Head)',
      serviceType: 'VACCINATION',
      urgency: 'URGENT',
      status: 'OPEN',
      requestedDate: '2026-06-13',
      notes: 'County Foot and Mouth Disease (FMD) booster vaccination drive'
    }
  ]);

  const [investorCriteriaList, setInvestorCriteriaList] = useState<InvestorCriteria[]>([
    {
      id: 'crit_1',
      investorId: 'user_investor_1',
      investorName: 'Samuel Kibet',
      lookingFor: 'FARMER_WITH_LAND_NEEDING_CAPITAL',
      budgetKES: 1200000,
      preferredSectors: ['Dairy', 'Horticulture'],
      targetCounties: ['Kiambu', 'Nyandarua', 'Nakuru'],
      notes: 'Seeking experienced dairy farmer with verified land and reliable water source.',
      status: 'ACTIVE',
      createdAt: '2026-06-08'
    }
  ]);

  const [tripartiteMatches, setTripartiteMatches] = useState<TripartiteMatch[]>([
    {
      id: 'match_1',
      investorId: 'user_investor_1',
      investorName: 'Samuel Kibet',
      farmerId: 'user_farmer_1',
      farmerName: 'John Kamau',
      veterinarianId: 'user_vet_1',
      veterinarianName: 'Dr. Akinyi Otieno',
      sector: 'Dairy',
      allocatedCapitalKES: 450000,
      agreedTerms: '60% Farmer / 40% Investor split with monthly veterinary certification',
      status: 'ACTIVE',
      createdAt: '2026-06-09'
    }
  ]);

  const [disputesList, setDisputesList] = useState<Dispute[]>([
    {
      id: 'disp_101',
      leaseId: 'lease_abc',
      creatorId: 'user_farmer_1',
      creatorName: 'John Kamau',
      reason: 'Boundary beacon adjustment dispute with neighboring parcel owner; requesting registry confirmation before second tranche disbursement.',
      status: 'OPEN',
      createdAt: '2026-06-10T09:30:00Z',
      updatedAt: '2026-06-10T09:30:00Z'
    }
  ]);

  const handleCreateProposal = async (proposalData: { investorId?: string; title: string; sector: FarmerProposal['sector']; farmDescription: string; capitalRequestedKES: number; farmerContribution: string; investorSharePercent: number }) => {
    const { data, error } = await farmerFetch<FarmerProposal>('/api/farmer/proposals', { method: 'POST', body: JSON.stringify(proposalData) });
    if (error || !data) throw new Error(error || 'Could not submit the proposal.');
    setProposals(previous => [data, ...previous]);
    showToast('Proposal sent to the investor.');
  };

  const handleUpdateInvestorProposal = async (proposalId: string, status: Extract<FarmerProposal['status'], 'NEGOTIATING' | 'ACCEPTED' | 'REJECTED'>) => {
    const { data, error } = await investorFetch<FarmerProposal>(`/api/investor/proposals/${encodeURIComponent(proposalId)}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    if (error || !data) throw new Error(error || 'Could not update the proposal.');
    setProposals(previous => previous.map(proposal => proposal.id === data.id ? data : proposal));
    showToast(`Proposal marked ${status.toLowerCase()}.`);
  };

  const handleSaveInvestorCriteria = async (criteriaData: Omit<InvestorCriteria, 'id' | 'createdAt' | 'investorId' | 'investorName' | 'status'>) => {
    const { data, error } = await investorFetch<InvestorCriteria>('/api/investor/criteria', { method: 'PUT', body: JSON.stringify(criteriaData) });
    if (error || !data) throw new Error(error || 'Could not save the investment brief.');
    setInvestorCriteria(data);
    setInvestorCriteriaList(previous => [data, ...previous.filter(criteria => criteria.investorId !== data.investorId)]);
    setCurrentUser(previous => previous ? { ...previous, investmentBudgetKES: data.budgetKES, preferredSectors: data.preferredSectors, investmentGoal: data.partnerRequirements } : previous);
    showToast('Investment brief saved.');
  };

  const handleRequestVetJob = async (jobData: Pick<VeterinaryJob, 'farmId' | 'location' | 'animalOrCropType' | 'serviceType' | 'urgency' | 'assignedVetId' | 'notes'>) => {
    const { data, error } = await farmerFetch<VeterinaryJob>('/api/farmer/veterinary-jobs', { method: 'POST', body: JSON.stringify(jobData) });
    if (error || !data) throw new Error(error || 'Could not request veterinary care.');
    setVetJobs(previous => [data, ...previous]);
    showToast('Veterinary service request submitted.');
  };

  const handleUpdateVetJobStatus = async (jobId: string, status: VeterinaryJob['status']) => {
    const { data, error } = await veterinaryFetch<VeterinaryJob>(`/api/veterinary/jobs/${encodeURIComponent(jobId)}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    if (error || !data) throw new Error(error || 'Could not update the veterinary job.');
    setVetJobs(previous => previous.map(job => job.id === data.id ? data : job));
    showToast(`Job status updated to ${status}.`);
  };

  const handleLogFarmEvent = async (eventData: Pick<FarmEvent, 'farmId' | 'eventType' | 'title' | 'description' | 'severity'>) => {
    // Veterinary activity is still recorded locally by the existing veterinary workspace.
    // Farmer activity is persisted through the ownership-checked farmer endpoint.
    if (currentUser?.role !== UserRole.FARMER) {
      const event: FarmEvent = {
        ...eventData,
        id: `evt_${Date.now()}`,
        date: new Date().toISOString(),
        farmerName: currentUser?.name || 'Veterinary professional',
        reportedBy: currentUser?.name || 'Veterinary professional',
      };
      setFarmEvents(previous => [event, ...previous]);
      showToast('Farm event saved.');
      return;
    }
    const { data, error } = await farmerFetch<FarmEvent>('/api/farmer/events', { method: 'POST', body: JSON.stringify(eventData) });
    if (error || !data) throw new Error(error || 'Could not save the farm event.');
    setFarmEvents(previous => [data, ...previous]);
    showToast('Farm event saved.');
  };

  const handleCreateTripartiteMatch = async (matchData: Pick<TripartiteMatch, 'investorId' | 'farmerId' | 'veterinarianId' | 'sector' | 'allocatedCapitalKES' | 'agreedTerms'>) => {
    const { data, error } = await adminFetch<TripartiteMatch>('/api/admin/matches', { method: 'POST', body: JSON.stringify(matchData) });
    if (error || !data) throw new Error(error || 'Could not create the match.');
    setTripartiteMatches(previous => [data, ...previous]);
    showToast('Tripartite match proposal created.');
  };

  const handleResolveDispute = async (disputeId: string, resolution: 'refund_farmer' | 'disburse_landowner', reason: string) => {
    const { data, error } = await adminFetch<{ dispute: Dispute; agreement: LeaseAgreement }>(`/api/disputes/${encodeURIComponent(disputeId)}/resolve`, { method: 'POST', body: JSON.stringify({ resolution, resolutionReason: reason }) });
    if (error || !data) throw new Error(error || 'Could not resolve the dispute.');
    setDisputesList(previous => previous.map(dispute => dispute.id === data.dispute.id ? data.dispute : dispute));
    setLeases(previous => previous.map(lease => lease.id === data.agreement.id ? data.agreement : lease));
    showToast('Dispute resolution recorded.');
  };

  const handleDeleteListing = (listingId: string) => {
    setListings(prev => prev.filter(l => l.id !== listingId));
    showToast('Listing removed from public registry by administrator.');
  };

  // UI Filters
  const [selectedCounty, setSelectedCounty] = useState<string>('All Counties');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('default');
  const [dashboardView, setDashboardView] = useState<'overview' | 'listings'>('overview');

  // -------------------------------------------------------------
  // Offline & Data Sync Service Worker Infrastructure state
  // -------------------------------------------------------------
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showSyncLogList, setShowSyncLogList] = useState<boolean>(false);
  const [cacheDetails, setCacheDetails] = useState<{
    status: 'unregistered' | 'registered' | 'active' | 'error';
    lastSynced: string | null;
    cachedCount: number;
    syncLog: string[];
  }>({
    status: 'unregistered',
    lastSynced: localStorage.getItem('sl_last_synced_time') || null,
    cachedCount: 0,
    syncLog: ['Local sync service initializing...']
  });

  const updateCacheStatusMetrics = async () => {
    if ('caches' in window) {
      try {
        const cache = await caches.open('shambaloop-data-v1');
        const keys = await cache.keys();
        let listingsCount = 0;
        let lastSyncedStr = localStorage.getItem('sl_last_synced_time');

        for (const key of keys) {
          if (key.url.includes('/api/listings')) {
            const response = await cache.match(key);
            if (response && !lastSyncedStr) {
              const dateHeader = response.headers.get('date');
              if (dateHeader) {
                lastSyncedStr = new Date(dateHeader).toLocaleTimeString();
              }
            }
            listingsCount++;
          }
        }

        setCacheDetails(prev => ({
          ...prev,
          cachedCount: listingsCount || prev.cachedCount,
          lastSynced: lastSyncedStr || prev.lastSynced
        }));
      } catch (e) {
        console.warn('Error reading cache data metrics', e);
      }
    }
  };

  const addSyncLogMessage = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setCacheDetails(prev => ({
      ...prev,
      syncLog: [ `[${timestamp}] ${msg}`, ...prev.syncLog.slice(0, 7) ]
    }));
  };

  // Modals & Triggers States
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedListingForAction, setSelectedListingForAction] = useState<Listing | null>(null);

  // Interactive Live Ledger Logging state (milk yields etc)
  const [activePartnershipForYieldLog, setActivePartnershipForYieldLog] = useState<string>('');
  const [yieldQty, setYieldQty] = useState<number>(15);
  const [yieldMetric, setYieldMetric] = useState<string>('Milk Liters');
  const [activePartnershipForHealthLog, setActivePartnershipForHealthLog] = useState<string>('');
  const [selectedPartnershipId, setSelectedPartnershipId] = useState<string>('part_xyz');
  const [comparePartnershipId, setComparePartnershipId] = useState<string>('');
  const [trendStartDate, setTrendStartDate] = useState<string>('');
  const [trendEndDate, setTrendEndDate] = useState<string>('');
  const [chartViewType, setChartViewType] = useState<'line' | 'bar'>('line');
  const [chartColorScheme, setChartColorScheme] = useState<string>('emerald-earth');
  const [showInsightSummary, setShowInsightSummary] = useState<boolean>(false);
  const [healthStatusSelected, setHealthStatusSelected] = useState<'Healthy' | 'Sick' | 'Vaccinated'>('Healthy');
  const [healthLogNotes, setHealthLogNotes] = useState('');
  const [dateValidationError, setDateValidationError] = useState<string>('');
  const [showForecastLine, setShowForecastLine] = useState<boolean>(true);

  // Submit land deeds model states
  const [docType, setDocType] = useState<'TITLE_DEED' | 'ID_CARD' | 'LIVESTOCK_CERT'>('TITLE_DEED');
  const [docNumber, setDocNumber] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationSubmittedMsg, setVerificationSubmittedMsg] = useState('');

  // Newsletter subscription state
  const [newsEmail, setNewsEmail] = useState('');
  const [newsLegalAgreed, setNewsLegalAgreed] = useState(false);
  const [newsPrivacyAgreed, setNewsPrivacyAgreed] = useState(false);
  const [newsSuccessMsg, setNewsSuccessMsg] = useState('');

  // Footer dynamic documents viewer modal state
  const [activeFooterDoc, setActiveFooterDoc] = useState<{ title: string; content: React.ReactNode } | null>(null);
  const [footerDocLoading, setFooterDocLoading] = useState(false);

  const openFooterDoc = (title: string) => {
    setFooterDocLoading(true);
    let content: React.ReactNode = null;
    switch (title.toLowerCase()) {
      case 'faq':
        content = (
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              Frequently Asked Questions (FAQ) — ShambaLoop Cooperative
            </h4>
            <div className="space-y-3.5">
              <div>
                <p className="font-bold text-slate-800 dark:text-white">Q1: What exactly is ShambaLoop Kenya?</p>
                <p className="mt-1 text-slate-600 dark:text-slate-400 font-normal">
                  ShambaLoop is a state-of-the-art digital agricultural cooperative program based in Kisumu and the Lakeside Basin. Our mission is to eliminate structural friction for Kenyan smallholders by enabling landowners to subdivide and lease idle land plots, while allowing urban investors to fund high-pedigree dairy herds in collaboration with local farmers.
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-white">Q2: How does the M-Pesa Escrow process keep my funds safe?</p>
                <p className="mt-1 text-slate-600 dark:text-slate-400 font-normal">
                  When you initiate a lease or cattle purchase, the financial stake is locked securely inside the ShambaLoop digital trust ledger. The funds are only disbursed to the landowner or livestock provider when our official regional registry verifies original land ownership (via land registrar index check) or the cow is veterinary-logged. If verification fails, your money is immediately refunded back to your M-Pesa wallet.
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-white">Q3: How are daily milk yields and revenues calculated and split?</p>
                <p className="mt-1 text-slate-600 dark:text-slate-400 font-normal">
                  Our farmers log daily yields (such as liters of milk or egg counts) on the platform, which are integrated with national dairy benchmark pricing (e.g. 58 KES per Liter of chilled dairy yield). Payout balances are automatically recalculated according to specified partnership split percentages (for example, 60% to the farmer and 40% to the financier).
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-white">Q4: Who does the physical work on leased farm divisions?</p>
                <p className="mt-1 text-slate-600 dark:text-slate-400 font-normal">
                  Our active land leases are taken up by vetted local smallholders and farming companies. ShambaLoop's field officers supervise on-ground soil prep, water routing, and harvest execution.
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-white">Q5: Can I visit the physical ShambaLoop offices and hubs?</p>
                <p className="mt-1 text-slate-600 dark:text-slate-400 font-normal">
                  Yes, you are welcome! We are located at Milimani Estate, Riat Hills, Kisumu, Kenya. We have physical check stations across Yacht Club and Tom Mboya area.
                </p>
              </div>
            </div>
          </div>
        );
        break;
      case 'chat with us':
        content = (
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              Live Member Support Desk
            </h4>
            <p>Welcome to the ShambaLoop Live Support console. We connect landowners, independent farmers, and municipal cooperative registers across Western Kenya in real time.</p>
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">Hub Agent Designation</span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Representative: George Odhiambo (District Supervisor)</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Typical Response Queue: Under 5 minutes • Active Hours: 7 AM – 9 PM EAT.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <a href="tel:+254728606684" className="flex-1 text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition">
                Call Direct (+254728606684)
              </a>
              <button onClick={() => alert('Cooperative Live Chat activated. Our agent is online!')} className="flex-1 bg-slate-900 text-white hover:bg-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition">
                Launch Web Desk
              </button>
            </div>
          </div>
        );
        break;
      case 'help center':
        content = (
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              Cooperative Help & Resolution Center
            </h4>
            <p className="font-semibold text-slate-800 dark:text-slate-200">Get assistance with land leaseholds, livestock registrations, and escrow transfers:</p>
            <div className="space-y-3">
              <div>
                <span className="font-bold text-slate-800 dark:text-white block">1. Initial Asset Onboarding:</span>
                <p className="mt-0.5 text-slate-600 dark:text-slate-400">Access your ShambaLoop account dashboard, choose "Add New Listing," and upload GPS coordinates, soil metrics, or dairy animal vaccination credentials.</p>
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-white block">2. Dispute Arbitration & Escrow Pauses:</span>
                <p className="mt-0.5 text-slate-600 dark:text-slate-400">If you encounter boundary mismatches or crop-share conflicts, report them immediately. We pause the payout process until regional field officers conduct a physical audit.</p>
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-white block">3. Regional Field Operations:</span>
                <p className="mt-0.5 text-slate-600 dark:text-slate-400">Our regional dispatch center in Milimani coordinates physical site surveys for soil testing and cattle inspection across Lakeside Wards.</p>
              </div>
            </div>
            <p className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
              Need immediate help? Reach out directly via <span className="font-bold text-emerald-600 font-mono">+254728606684</span> or email us at <span className="text-emerald-500 font-semibold underline">support@shambaloop.com</span>.
            </p>
          </div>
        );
        break;
      case 'track your order':
        content = (
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              Escrow Contract & Parcel Tracker
            </h4>
            <p>Input your secure MPESA payment code, lease contract ID, or cattle certification index to monitor status maps in real time.</p>
            <div className="space-y-2 max-w-sm">
              <input type="text" placeholder="e.g. SL-9842K-TX" className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <button onClick={() => alert('Tracker Update: PENDING OWNERSHIP VERIFICATION. Field officer scheduled to inspect Riat Hills plot boundaries today.')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition">
                Query ShambaLoop Ledger
              </button>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-[11px] text-slate-500 mt-2 font-sans">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <p><strong>ESCROWED:</strong> Funds safely frozen in Sandbox contract.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                <p><strong>PENDING AUDIT:</strong> Land registrar title-check active.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                <p><strong>VERIFIED:</strong> Release approval complete; preparing transfer.</p>
              </div>
            </div>
          </div>
        );
        break;
      case 'shipping and delivery':
        content = (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              Livestock Hauling & Land Demarcation Guide
            </h4>
            <p>We facilitate secure livestock transportation, calf shipping, and GPS land division services across Western Kenya.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Live Heifer Deliveries:</strong> Pedigree dairy cows are transported in specialized, veterinary-vetted, and fully insured trucks within 24 to 48 hours.</li>
              <li><strong>Deed Subdivisions:</strong> Physical boundary markers, sub-plots beaconing, and land allotment registries are certified at our Kisumu hub.</li>
              <li><strong>Pick-up Requirements:</strong> Certified buyers must bring original national ID cards and verification codes issued by ShambaLoop at check-out.</li>
            </ul>
          </div>
        );
        break;
      case 'pick-up stations':
        content = (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              Offices & Verification Pickup Hubs
            </h4>
            <p>Our approved pickup points for signing physical agricultural leases, issuing printed cattle pedigree deeds, and claiming feed rations:</p>
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-205">Kisumu Lakeside Center:</span>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Yacht Club Road area, Kisumu CBD. Open: Mon–Sat, 8 AM – 5 PM. Direct Phone line available.</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-205">Riat Hills Audit post:</span>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Milimani Estate Road, near Riat Hills, supervising Lakeside ward plots.</p>
              </div>
            </div>
          </div>
        );
        break;
      case 'return policy':
      case 'returns and refunds policy':
        content = (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              Refunds & Escrow Release Safeguards
            </h4>
            <p className="font-semibold text-slate-800 dark:text-slate-200">ShambaLoop agricultural cooperative escrow structures are strictly bound by the Cooperative Societies Acts of Kenya:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Land Lease Stake:</strong> If the district land registrar finds boundary disputes, legal overlaps, or deed forgery, the full transaction value is instantly refunded to your MPESA account.</li>
              <li><strong>Livestock Heifers:</strong> Heifers can be claimable for full refund or direct exchange within 7 days of haul if they fail safety veterinary reports.</li>
              <li><strong>Processing Queues:</strong> Refund reviews take maximum 24 business hours to verify. No transaction processing fees apply on cancellations.</li>
            </ul>
          </div>
        );
        break;
      case 'how to order?':
        content = (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              How to Lease and Invest on ShambaLoop
            </h4>
            <p>Our unified platform streamlines lease partnerships in three fully automated stages:</p>
            <ul className="list-decimal pl-5 space-y-2">
              <li><strong>1. Discover Assets:</strong> Browse verified cropland acreage, high breed milking cows, or farm job profiles using the responsive header searching tool.</li>
              <li><strong>2. Review Verifications:</strong> Check deed registrar coordinates, veterinary statuses, and historical soil profiles of each catalog asset.</li>
              <li><strong>3. Commit Stake:</strong> Complete payment via secure virtual sandbox M-Pesa. Stakes are locked on escrow until land title verification secures your lease.</li>
            </ul>
          </div>
        );
        break;
      case 'dispute resolution policy':
        content = (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              Lakeside Basin Arbitration & Resolution Guidelines
            </h4>
            <p className="font-semibold text-slate-800 dark:text-slate-200">Resolving boundary and revenue-split conflicts impartially:</p>
            <p>For any ownership disputes in Kisumu and neighboring agricultural regions, ShambaLoop provides collaborative arbitration panels consisting of local county surveyors and land management executives.</p>
            <p>If you experience crop yield disputes, lease length conflicts, or layout issues, call our direct line at <span className="font-bold underline text-emerald-600 font-mono">+254728606684</span> to temporarily hold funds. Our target response is within 12 hours.</p>
          </div>
        );
        break;
      case 'corporate and bulk purchase':
        content = (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              Institutional Partners & SACCO portfolios
            </h4>
            <p>Are you representing an investment pool, dairy cooperative syndicate, or regional SACCO?</p>
            <p>ShambaLoop provides custom enterprise services including institutional layout management, joint title pooling, and bulk cattle immunization logs. Connect with us at <span className="text-emerald-600 font-bold underline">corporate@shambaloop.com</span> or contact George Odhiambo directly (+254728606684).</p>
          </div>
        );
        break;
      case 'advertise with shambaloop':
        content = (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              Promote Your Agricultural Services
            </h4>
            <p>Advertise feed, fertilizer formulations, milking equipment leasing, or tractor maintenance packages right inside our active farming dashboards.</p>
            <p>Reach over thousands of verified smallholders, land leaseholders, and investors along the Lakeside Basin. Direct inquiries to our marketing coordinator (+254728606684).</p>
          </div>
        );
        break;
      case 'report a product':
        content = (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              Flag Forged or Suspicious Listings
            </h4>
            <p>We work tirelessly to verify all listings. If you find land title irregularities, unrealistic animal breeds, or poor husbandry, please flag them.</p>
            <p>Our platform monitoring officer will review the listing and dispatch ground staff within 12 hours to verify properties.</p>
            <button onClick={() => alert('Thank you. A trust audit flag has been recorded and a regional officer from Milimani has been dispatched to investigate.')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wide transition block">
              Flag Suspicious Asset
            </button>
          </div>
        );
        break;
      case 'shambaloop payment information guidelines':
        content = (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              Secure Ledger & Escrow Guidelines
            </h4>
            <p>Ensuring payment protection on all land transactions:</p>
            <ul className="list-disc pl-5 space-y-1.5 font-normal">
              <li><strong>Virtual M-Pesa:</strong> Utilize our sandbox virtual M-Pesa to simulate the escrow authorization step.</li>
              <li><strong>SACCO Bank Wire:</strong> For bulk or corporate land transactions, payouts are secured via Cooperative Bank of Kenya (Kisumu Branch).</li>
              <li><strong>Fraud prevention:</strong> Never complete payment outside our application interface. ShambaLoop will never ask for PIN numbers.</li>
            </ul>
          </div>
        );
        break;
      case 'black friday':
        content = (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              Harvest Festival Bovine Deals
            </h4>
            <p>Enjoy up to 25% discount on cattle lease entry fees and cooperative subscription quotas during the peak harvest months of November and December. Keep checking the active marketplace alerts.</p>
          </div>
        );
        break;
      case 'about us':
        content = (
          <div className="space-y-5 text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-sans max-h-[75vh] overflow-y-auto pr-2" id="footer_about_us_modal_content">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase font-mono">
                Official Cooperative Charter & Platform Blueprint
              </span>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-lg mt-2 font-display">
                About ShambaLoop Kenya — Cooperative Agricultural Digitization
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                A Unified Trust & Telemetry Ecosystem Uniting Land, Capital, Labor, and Clinical Governance
              </p>
            </div>

            {/* Vision & Mission */}
            <div className="space-y-2">
              <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Platform Vision & Institutional Mandate
              </h5>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                ShambaLoop Kenya was established to eliminate the systemic friction, trust deficits, and capital barriers that have historically held back East Africa’s agricultural economy. Vast expanses of high-potential arable land lie underutilized or fallow due to absentee ownership or fears of informal encroachment. Simultaneously, millions of skilled smallholder farmers face severe liquidity constraints, while urban and diaspora Kenyans seeking agricultural returns lack trustworthy, transparent mechanisms to deploy capital safely.
              </p>
              <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-slate-800 dark:text-slate-200 space-y-1">
                <strong className="block text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
                  Our Core Purpose
                </strong>
                <p className="text-[11.5px] leading-relaxed">
                  To provide a digital trust framework where agricultural land leases, livestock investments, and production telemetry are authenticated, audited, and protected by Kenya statutory law (Section 12 of the Kenya Land Act, Cap 490 Cooperative Societies Act, and ODPC Data Protection), supported by Safaricom Daraja M-Pesa automated escrow custody.
                </p>
              </div>
            </div>

            {/* The 4 Platform Roles */}
            <div className="space-y-3">
              <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                The 4 Operational Platform Roles
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Admin */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-bold">ROLE 01</span>
                    <strong className="text-slate-900 dark:text-white text-xs font-bold font-display">1. Administrator & Registry Supervisor</strong>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Acts as the neutral compliance officer and cooperative registrar. Validates Title Deeds and survey beacons against official lands databases, verifies KYC documentation, supervises tripartite agreements, arbitrates disputes, and authorizes escrow release milestones.
                  </p>
                </div>

                {/* Farmer */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-bold">ROLE 02</span>
                    <strong className="text-slate-900 dark:text-white text-xs font-bold font-display">2. Smallholder Farmer & Operator</strong>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    The hands-on agricultural operator and livestock custodian. Obtains certified land leases without predatory leaseholder risks, accesses working capital, utilizes the Farm Management System (FMS) for daily milk and harvest entries, and executes veterinary directives.
                  </p>
                </div>

                {/* Investor */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-mono text-[10px] font-bold">ROLE 03</span>
                    <strong className="text-slate-900 dark:text-white text-xs font-bold font-display">3. Capital Investor & Financier</strong>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Provides asset and input financing for certified dairy herds (Friesian, Ayrshire) and horticultural projects without needing to physically own or farm land. Monitors daily yield charts, receives anomaly alerts, and earns automated dividends disbursed straight to M-Pesa.
                  </p>
                </div>

                {/* Veterinary */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-mono text-[10px] font-bold">ROLE 04</span>
                    <strong className="text-slate-900 dark:text-white text-xs font-bold font-display">4. Veterinary & Clinical Auditor</strong>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Kenya Veterinary Board (KVB) licensed surgeons and animal health technicians. Dispatched on-demand for emergency clinical cases, routinely administers vaccinations and artificial insemination, conducts bi-weekly audits, and maintains permanent life-event health records.
                  </p>
                </div>
              </div>
            </div>

            {/* Core Collaborative Processes */}
            <div className="space-y-3">
              <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Core Collaborative Processes
              </h5>
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="font-bold text-slate-900 dark:text-white block text-xs">
                    1. Tripartite Partnerships & Section 12 Land Protections
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    Landowners, investors, and farmers enter structured multi-party leases authenticated by registry supervisors. Leases comply with Section 12 of the Kenya Land Act to protect landowners from squatter claims while guaranteeing tenant farmers uninterrupted growing cycles.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="font-bold text-slate-900 dark:text-white block text-xs">
                    2. Safaricom Daraja M-Pesa Escrow Custody
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    Investor capital is held in isolated escrow vaults. Funds are disbursed in milestones (e.g. initial land prep, seedling/livestock procurement, mid-cycle maintenance) upon administrative verification and veterinary confirmation, eliminating fraud.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="font-bold text-slate-900 dark:text-white block text-xs">
                    3. Real-Time Telemetry & 7-Day Rolling Anomaly Detection
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    Farmers record morning and evening production daily. Our statistical analytics engine benchmarks output against rolling 7-day moving averages; if milk output drops by &gt;15%, the system immediately alerts the investor and dispatches a certified veterinary officer.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="font-bold text-slate-900 dark:text-white block text-xs">
                    4. Veterinary Health Governance & Life-Event Trails
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    KVB doctors inspect herds every 14 days, verifying biosecurity, mastitis screening, and nutritional compliance. Digital records track every artificial insemination, pregnancy check, calving, and vaccination with cryptographic audit logs.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="font-bold text-slate-900 dark:text-white block text-xs">
                    5. Automated Net Profit Splits & Direct M-Pesa Settlement
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    Revenues generated from milk collections or crop bulk sales are processed through platform ledgers. Agreed distributions (e.g. 60% farmer operator, 40% investor partner, or custom terms) are automatically calculated, with net funds settled electronically to registered M-Pesa phone numbers.
                  </p>
                </div>
              </div>
            </div>

            {/* Regulatory and Regional Desks */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
              <strong className="block text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
                Regulatory Oversight & Operational Base
              </strong>
              <p>
                ShambaLoop Kenya operates under the cooperative framework of the Kenya Cooperative Societies Act (Cap 490) and is certified for citizen data privacy by the Office of the Data Protection Commissioner (ODPC Act of 2019).
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                Headquarters: Milimani Innovation Hub, Kisumu County. Regional Extension Desks: Nyandarua (Ol Kalou), Nakuru (Njoro Basin), Kiambu (Muguga Hub). Contact Hotline: +254728606684.
              </p>
            </div>
          </div>
        );
        break;
      case 'shambaloop careers':
        content = (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              Join Our Agricultural Tech Team
            </h4>
            <p>We are expanding! ShambaLoop regularly hires GIS mapping technicians, veterinary assistants, and contract legal specialists in Western Kenya.</p>
            <p className="font-semibold text-slate-800 dark:text-slate-205">Active Opening: Field Verification Officer (Riat Hills Ward)</p>
            <p>Send CVs directly to careers@shambaloop.com. We prioritize female candidates and Kisumu residents.</p>
          </div>
        );
        break;
      case 'shambaloop express':
        content = (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              Express Soil Testing & Calf Transfer Services
            </h4>
            <p>Guaranteed 24-hour dispatch for veterinary cow inspections, RFID tagging, and urgent soil sample checks in Kisumu Central and Riat areas.</p>
          </div>
        );
        break;
      case 'terms and conditions':
      case 'store credit terms and conditions':
        content = (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              Legal Terms & Cooperative Conditions
            </h4>
            <p>By accessing the ShambaLoop cooperative dashboard, registering land divisions, or funding agreements, you agree to comply with the Cooperative Societies Act, Cap 490 of Kenya.</p>
            <p>Land claims must be backed by official title deeds or letter of allotment. Submissions with fraudulent numbers will be permanently banned and reported to the authorities.</p>
          </div>
        );
        break;
      case 'privacy notice':
      case 'cookies notice':
        content = (
          <div className="space-y-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans max-h-[65vh] pr-1">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase font-mono">
                ODPC Registered • Act of 2019 Compliant
              </span>
              <h4 className="font-sans font-black text-slate-800 dark:text-white text-base mt-2 tracking-tight">
                ShambaLoop Kenya Data Privacy & Protection Policy
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                Document Ref: SL-DPP-2026-V3 | Last Reviewed: June 15, 2026
              </p>
            </div>

            <div className="space-y-4">
              <section className="space-y-1.5">
                <h5 className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-xs flex items-center gap-1">
                  1. Introduction & Binding Scope
                </h5>
                <p>
                  This Privacy Policy outlines how the ShambaLoop Cooperative (referred to here as "ShambaLoop", "we", or "our") handles personal, geospatial, and economic data within our trust-matching ecosystem. By accessing our platform, coordinates mapping, or cooperative ledger tools, you explicitly consent to the collection and processing of your details as detailed herein.
                </p>
                <p>
                  We operate in complete, audited compliance with the <strong>Kenya Data Protection Act of 2019</strong> and the subsequent Data Protection (General) Regulations.
                </p>
              </section>

              <section className="space-y-1.5">
                <h5 className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-xs flex items-center gap-1">
                  2. Categories of Information Collected
                </h5>
                <p>
                  To enable peer-to-peer trust-matching without structural friction, we store and categorize several telemetry scopes:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  <li>
                    <strong>Identity & Credentials:</strong> Full human name, identity serial numbers, email correspondence addresses, and active Kenyan mobile phone logs used primarily for security OTP verification and virtual M-Pesa billing.
                  </li>
                  <li>
                    <strong>Agronomic & Geospatial Data:</strong> Precision GPS coordinate tags of farm divisions, sub-county parcel identifiers, land registry title indicators, soil pH metrics, water accessibility indexes, and historical weather-yield records.
                  </li>
                  <li>
                    <strong>Livestock Health Records:</strong> RFID ear-tag serial codes, breed types, immunization/vaccination logs, dairy yield metrics (in Liters), and supervisor health stamps.
                  </li>
                  <li>
                    <strong>Financial Ledgers:</strong> Simulated wallet transactional records, virtual M-Pesa escrow balances, SACCO wire information, and cooperative revenue split percentages.
                  </li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h5 className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-xs flex items-center gap-1">
                  3. Purpose & Legal Bases for Processing
                </h5>
                <p>
                  We process data under the legal criteria of section 30 of the Kenya Data Protection Act:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-xl border border-emerald-100/30">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-[10px] uppercase">Contractual Execution</span>
                    <p className="mt-0.5 text-slate-500 dark:text-slate-400">Processing contact details and ledger status to enable electronic escrow lockups and land lease coordination between landowners and farmers.</p>
                  </div>
                  <div className="p-3 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-xl border border-emerald-100/30">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-[10px] uppercase">Legitimate Public Interest</span>
                    <p className="mt-0.5 text-slate-500 dark:text-slate-400">Verifying title details against official county registers to prevent boundary fraud and protect cooperative investments.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-1.5">
                <h5 className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-xs flex items-center gap-1">
                  4. Third-Party Access, Sharing & Marketing
                </h5>
                <p className="text-slate-800 dark:text-slate-200 font-bold">
                  We maintain a strict NO-SHARE policy with external marketing agencies or credit scoring bureaus.
                </p>
                <p>
                  Agronomic and coordinate details are exclusively shared with approved local GIS verification surveyors and visiting veterinary supervisors to confirm state conditions before escrow releases. All partner coops are bound by reciprocal NDAs.
                </p>
              </section>

              <section className="space-y-1.5">
                <h5 className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-xs flex items-center gap-1">
                  5. Cookie and Session Management Policy
                </h5>
                <p>
                  We utilize standard browser local storage and tracking cookies strictly for functional purposes:
                </p>
                <ul className="list-decimal pl-5 space-y-1 text-slate-500 dark:text-slate-400">
                  <li><strong>Device Profile:</strong> To preserve dark/light theme options and custom dashboard layouts.</li>
                  <li><strong>Active Login State:</strong> Keeping your member profile active so you do not need to enter credentials repeatedly.</li>
                  <li><strong>Network Telemetry:</strong> To cache map tiles locally and quicken rendering for low-bandwidth zones.</li>
                </ul>
                <p>No behavioral or targeted cross-site ad beacons are implemented inside ShambaLoop systems.</p>
              </section>

              <section className="space-y-1.5">
                <h5 className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-xs flex items-center gap-1">
                  6. User Data Rights & Portability
                </h5>
                <p>
                  Under the Kenyan Data Privacy framework, you hold explicit rights to:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400">
                  <li>Request a full digital export of all registered properties and financial ledgers.</li>
                  <li>Rectify or correct inaccurate land titles or immunization dates.</li>
                  <li>Request the complete deletion or decommissioning of your tracking coordinates (Right to Erasure).</li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h5 className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-xs flex items-center gap-1">
                  7. Infrastructure Security & Contact Info
                </h5>
                <p>
                  All data is encrypted in transit and back-ends are sandboxed inside isolated containers in Frankfurt and Nairobi data zones under supervisor guidance. Physical ledger backups are processed every 24 hours at our main hub.
                </p>
                <p className="pt-2">
                  For any query, right of erasure application, or to coordinate with our designated compliance supervisor:
                </p>
                <div className="mt-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  <p className="font-bold text-slate-800 dark:text-white">George Odhiambo (Data Governance Supervisor)</p>
                  <p className="text-slate-500 dark:text-slate-400">ShambaLoop Hub Contact Desk, Milimani Estate, Kisumu County, Kenya</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold mt-1">
                    Email: privacy-compliance@shambaloop.com • Tel: +254728606684
                  </p>
                </div>
              </section>
            </div>
          </div>
        );
        break;
      case 'flash sales':
        content = (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              RAINY SEASON GRAZING DEALS
            </h4>
            <p>Hourly dairy leasing options and pasture allocations inside Kisumu Hub during high-clover rainy intervals. Watch the dashboard alerts for flash deals.</p>
          </div>
        );
        break;
      case 'sell on shambaloop':
        content = (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              List Your Farm Plots & Milking Cattle
            </h4>
            <p>Register cattle, milking equipment, sub-county parcels, or dairy calves. Reach thousand of verified coop investors instantly. Fill the "Add New Listing" form to begin.</p>
          </div>
        );
        break;
      case 'vendor hub':
        content = (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              Unified Agro-Retailer Platform
            </h4>
            <p>Approved dealers track fertilizer orders, vaccination packages, feed bags, and microclimatic tools supplied to ShambaLoop smallholders.</p>
          </div>
        );
        break;
      case 'become a sales consultant':
        content = (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              Onboard Smallholders & Earn Commissions
            </h4>
            <p>Help local landowners list dormant ancestral lands near the Lakeside Basin. We provide training on mobile coordinate tools and deed check standards. Onboarders earn weekly bonuses.</p>
          </div>
        );
        break;
      case 'become a shambaloop order point':
        content = (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider pb-1 border-b">
              Register Pick-up Depot Points
            </h4>
            <p>Register your retail shop, agro-dealer depot, or warehouse as a physical hub where members pick up hardcopy certificates and signed lease files securely.</p>
          </div>
        );
        break;
      default:
        content = (
          <div className="text-xs text-slate-600 dark:text-slate-300 font-sans">
            <p>Agricultural documents are available at ShambaLoop Kenya. For verification inquiries in Milimani, please contact george on +254728606684.</p>
          </div>
        );
    }
    setActiveFooterDoc({ title, content });
    setTimeout(() => {
      setFooterDocLoading(false);
    }, 1000);
  };

  // Synchronous loading triggers
  const [networkLoading, setNetworkLoading] = useState(false);

  // 1. Initial Load of Listings from Full-Stack Express Server (or local Storage fallback)
  const fetchAllData = async () => {
    setNetworkLoading(true);
    const wasOnline = navigator.onLine;
    try {
      const token = localStorage.getItem('sl_token');
      const isAdmin = currentUser?.role === UserRole.ADMIN && Boolean(token);
      const adminHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

      // Admins receive their protected moderation queue; all other users only see public listings.
      const listRes = await fetch(isAdmin ? '/api/admin/listings' : '/api/listings', { headers: adminHeaders });
      if (listRes.ok) {
        const data = await listRes.json();
        setListings(data);
        
        // Cache success markers
        const syncTime = new Date().toLocaleTimeString();
        localStorage.setItem('sl_last_synced_time', syncTime);
        localStorage.setItem('sl_listings', JSON.stringify(data));
        addSyncLogMessage('Successfully synced latest listings from ShambaLoop registry!');
      }

      // Fetch leases
      const leaseRes = await fetch('/api/land/leases');
      if (leaseRes.ok) {
        const data = await leaseRes.json();
        setLeases(data);
        localStorage.setItem('sl_leases', JSON.stringify(data));
      }

      // Fetch partnerships
      const partRes = await fetch('/api/livestock/partnerships');
      if (partRes.ok) {
        const data = await partRes.json();
        setPartnerships(data);
        localStorage.setItem('sl_partnerships', JSON.stringify(data));
      }

      if (isAdmin) {
        const [verRes, metricRes, usersRes, disputesRes, matchesRes] = await Promise.all([
          fetch('/api/admin/verifications', { headers: adminHeaders }),
          fetch('/api/admin/analytics', { headers: adminHeaders }),
          fetch('/api/auth/users', { headers: adminHeaders }),
          fetch('/api/disputes', { headers: adminHeaders }),
          fetch('/api/admin/matches', { headers: adminHeaders })
        ]);
        if (verRes.ok) { const data = await verRes.json(); setVerifications(data); localStorage.setItem('sl_verifications', JSON.stringify(data)); }
        if (metricRes.ok) setAnalytics(await metricRes.json());
        if (usersRes.ok) setUsersList(await usersRes.json());
        if (disputesRes.ok) setDisputesList(await disputesRes.json());
        if (matchesRes.ok) setTripartiteMatches(await matchesRes.json());
      }

      // Trigger cache metric recalculation
      setTimeout(() => {
        updateCacheStatusMetrics();
      }, 500);

    } catch (err) {
      console.warn('Backend server cold restarting or offline. Falling back to robust offline sandbox data.', err);
      addSyncLogMessage('Sync connection interrupted. Utilizing local cached data offline...');
      // In case server has not initialized completely, load defaults to stay 100% interactive
      loadLocalBackupSandbox();
    } finally {
      setNetworkLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === UserRole.ADMIN && localStorage.getItem('sl_token')) {
      fetchAllData();
    }
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    const token = localStorage.getItem('sl_token');
    if (currentUser?.role !== UserRole.FARMER || !token) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch('/api/livestock/partnerships', { headers }),
      fetch('/api/farmer/investors', { headers }),
      fetch('/api/farmer/veterinarians', { headers }),
      fetch('/api/farmer/proposals', { headers }),
      fetch('/api/farmer/events', { headers }),
      fetch('/api/farmer/veterinary-jobs', { headers }),
      fetch('/api/veterinary/reports', { headers })
    ]).then(async responses => {
      const [partnershipsResponse, investorsResponse, vetsResponse, proposalsResponse, eventsResponse, jobsResponse, reportsResponse] = responses;
      if (partnershipsResponse.ok) setPartnerships(await partnershipsResponse.json());
      if (investorsResponse.ok) setFarmerInvestors(await investorsResponse.json());
      if (vetsResponse.ok) setFarmerVeterinarians(await vetsResponse.json());
      if (proposalsResponse.ok) setProposals(await proposalsResponse.json());
      if (eventsResponse.ok) setFarmEvents(await eventsResponse.json());
      if (jobsResponse.ok) setVetJobs(await jobsResponse.json());
      if (reportsResponse.ok) setVeterinaryReports(await reportsResponse.json());
    }).catch(() => showToast('Farmer workspace data could not be refreshed.'));
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    const token = localStorage.getItem('sl_token');
    if (currentUser?.role !== UserRole.INVESTOR || !token) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch('/api/livestock/partnerships', { headers }),
      fetch('/api/investor/farmers', { headers }),
      fetch('/api/investor/proposals', { headers }),
      fetch('/api/investor/events', { headers }),
      fetch('/api/veterinary/reports', { headers }),
      fetch('/api/investor/criteria', { headers })
    ]).then(async responses => {
      const [partnershipsResponse, farmersResponse, proposalsResponse, eventsResponse, reportsResponse, criteriaResponse] = responses;
      if (partnershipsResponse.ok) setPartnerships(await partnershipsResponse.json());
      if (farmersResponse.ok) setInvestorFarmers(await farmersResponse.json());
      if (proposalsResponse.ok) setProposals(await proposalsResponse.json());
      if (eventsResponse.ok) setFarmEvents(await eventsResponse.json());
      if (reportsResponse.ok) setVeterinaryReports(await reportsResponse.json());
      if (criteriaResponse.ok) setInvestorCriteria(await criteriaResponse.json());
    }).catch(() => showToast('Investor workspace data could not be refreshed.'));
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    const token = localStorage.getItem('sl_token');
    if (currentUser?.role !== UserRole.VETERINARIAN || !token) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([fetch('/api/veterinary/jobs', { headers }), fetch('/api/veterinary/partnerships', { headers }), fetch('/api/veterinary/reports', { headers })]).then(async ([jobs, partnershipsResponse, reports]) => {
      if (jobs.ok) setVetJobs(await jobs.json());
      if (partnershipsResponse.ok) setPartnerships(await partnershipsResponse.json());
      if (reports.ok) setVeterinaryReports(await reports.json());
    }).catch(() => showToast('Veterinary workspace data could not be refreshed.'));
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    // A. Sync status event handlers
    const handleOnline = () => {
      setIsOnline(true);
      addSyncLogMessage('Internet connection restored. Synchronizing with cloud registries...');
      fetchAllData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      addSyncLogMessage('Internet connection dropped. Offline sync status active.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // B. Service Worker registration & Activation Checks
    if ('serviceWorker' in navigator) {
      addSyncLogMessage('Registering ShambaLoop sync service worker in background...');
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registration successful with scope:', registration.scope);
          setCacheDetails(prev => ({ ...prev, status: 'registered' }));
          addSyncLogMessage('Sync service armed! Client caching is fully enabled.');
          
          // Listen to updates or state changes
          if (registration.installing) {
            addSyncLogMessage('Sync service installing browser assets...');
          }
          if (registration.active) {
            setCacheDetails(prev => ({ ...prev, status: 'active' }));
          }

          // Initial check of cache metrics
          updateCacheStatusMetrics();
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
          setCacheDetails(prev => ({ ...prev, status: 'error' }));
          addSyncLogMessage('Error registering sync worker: ' + error.message);
        });
    } else {
      addSyncLogMessage('Browser unsupported for service worker sync.');
    }

    // Initial load
    fetchAllData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadLocalBackupSandbox = () => {
    const savedListings = localStorage.getItem('sl_listings');
    const savedLeases = localStorage.getItem('sl_leases');
    const savedPartnerships = localStorage.getItem('sl_partnerships');
    const savedVerifications = localStorage.getItem('sl_verifications');

    if (savedListings) setListings(JSON.parse(savedListings));
    else {
      const defaultListings: Listing[] = [
        {
          id: 'list_1',
          type: ListingType.LAND,
          title: '5-Acre Flat Fertile Red Soil Plot',
          description: 'Highly productive parcel suitable for high-yield white potatoes, cabbages or garden-pea operations. Already fenced off. Water is readily available through an on-site solar-pumped borehole feeding into gravity tanks. Easily accessible via primary graded feeder road 2km off the Ol Kalou tarmac.',
          locationCounty: 'Nyandarua',
          priceKES: 12000,
          verified: true,
          imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
          ownerId: 'user_1',
          ownerName: 'Wanjiku Kamau',
          ownerPhone: '0712345678',
          landDetails: {
            acreage: 5,
            soilType: 'Volcanic Red Loam',
            waterSource: 'Solar Borehole',
            accessibility: 'Chipped Feeder Road',
            idealCrops: ['Potatoes', 'Cabbages', 'Carrots']
          },
          createdAt: new Date().toISOString()
        },
        {
          id: 'list_2',
          type: ListingType.LIVESTOCK,
          title: 'High-Yield Friesian Dairy Heifers',
          description: 'Listing for shared investment in 2 pedigree Friesian dairy cows registered with the Kenya Stud Book. Produces 24-26 Liters daily. Looking to partner with a skilled farm manager who already has fodder/silage prepared in Kiambu or Nakuru.',
          locationCounty: 'Kiambu',
          priceKES: 185000,
          revenueSplitPercent: 40,
          verified: true,
          imageUrl: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800',
          ownerId: 'user_3',
          ownerName: 'David Mwangi',
          ownerPhone: '0733444555',
          livestockDetails: {
            species: 'dairy',
            tagId: 'SL-KE-FR-901',
            breed: 'Pure pedigree Friesian',
            expectedYield: '22 - 26 Liters per day each',
            revenueShareConfig: '60% Farmer (land/labor), 40% Investor (purchase)'
          },
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'list_3',
          type: ListingType.OPPORTUNITY,
          title: 'Contract Farming: 10,000 Broiler Feed Cycle',
          description: 'Modern deep litter poultry structure ready in Nakuru. Fully funded chick purchase and feed schedules by landowner. Looking for 1 resident farm caretaker with poultry experience.',
          locationCounty: 'Nakuru',
          priceKES: 35000,
          verified: true,
          imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800',
          ownerId: 'user_1',
          ownerName: 'Wanjiku Kamau',
          ownerPhone: '0712345678',
          opportunityDetails: {
            requiredSkills: ['Biosecurity hygiene', 'Vaccinations management'],
            durationMonths: 6,
            expectedWorkforce: 2,
            compensationType: 'Profit-Share'
          },
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setListings(defaultListings);
      localStorage.setItem('sl_listings', JSON.stringify(defaultListings));
    }

    if (savedLeases) setLeases(JSON.parse(savedLeases));
    else {
      const defaultLeases: LeaseAgreement[] = [
        {
          id: 'lease_abc',
          listingId: 'list_1',
          landownerId: 'user_1',
          farmerId: 'user_2',
          acreageLeased: 2,
          pricePerAcreKES: 12000,
          durationMonths: 12,
          startDate: '2026-07-01',
          status: 'SIGNED',
          mpesaEscrowStatus: 'ESCROWED',
          paymentsMade: 24000
        }
      ];
      setLeases(defaultLeases);
      localStorage.setItem('sl_leases', JSON.stringify(defaultLeases));
    }

    if (savedPartnerships) {
      const parsed = JSON.parse(savedPartnerships);
      if (Array.isArray(parsed) && parsed.length === 1 && parsed[0].id === 'part_xyz') {
        parsed.push({
          id: 'part_pqr',
          listingId: 'list_2',
          investorId: 'user_3',
          farmerId: 'user_2',
          animalTagId: 'SL-KE-AY-902',
          animalType: 'dairy',
          breed: 'Ayrshire Premium Heifer',
          splitPercentInvestor: 40,
          status: 'ACTIVE',
          healthLogs: [
            {
              id: 'h_2',
              date: '2026-06-11',
              status: 'Healthy',
              notes: 'Vaccination completed. Highly active feeding.',
              recordedBy: 'Josphat Kiprop (Farmer)'
            }
          ],
          productionLogs: [
            {
              id: 'p_2_1',
              date: '2026-06-08',
              metric: 'Milk Liters',
              quantity: 18,
              revenueKES: 1080,
              investorPayoutKES: 432,
              farmerPayoutKES: 648
            },
            {
              id: 'p_2_2',
              date: '2026-06-09',
              metric: 'Milk Liters',
              quantity: 19,
              revenueKES: 1140,
              investorPayoutKES: 456,
              farmerPayoutKES: 684
            },
            {
              id: 'p_2_3',
              date: '2026-06-10',
              metric: 'Milk Liters',
              quantity: 21,
              revenueKES: 1260,
              investorPayoutKES: 504,
              farmerPayoutKES: 756
            },
            {
              id: 'p_2_4',
              date: '2026-06-11',
              metric: 'Milk Liters',
              quantity: 20,
              revenueKES: 1200,
              investorPayoutKES: 480,
              farmerPayoutKES: 720
            },
            {
              id: 'p_2_5',
              date: '2026-06-12',
              metric: 'Milk Liters',
              quantity: 22,
              revenueKES: 1320,
              investorPayoutKES: 528,
              farmerPayoutKES: 792
            }
          ]
        });
        setPartnerships(parsed);
        localStorage.setItem('sl_partnerships', JSON.stringify(parsed));
      } else {
        setPartnerships(parsed);
      }
    } else {
      const defaultParts: LivestockPartnership[] = [
        {
          id: 'part_xyz',
          listingId: 'list_2',
          investorId: 'user_3',
          farmerId: 'user_2',
          animalTagId: 'SL-KE-FR-901',
          animalType: 'dairy',
          breed: 'Pure pedigree Friesian',
          splitPercentInvestor: 40,
          status: 'ACTIVE',
          healthLogs: [
            {
              id: 'h_1',
              date: '2026-06-11',
              status: 'Healthy',
              notes: 'General state remains robust. Rumen activity completely healthy.',
              recordedBy: 'Josphat Kiprop (Farmer)'
            }
          ],
          productionLogs: [
            {
              id: 'p_1',
              date: '2026-06-08',
              metric: 'Milk Liters',
              quantity: 21,
              revenueKES: 1260,
              investorPayoutKES: 504,
              farmerPayoutKES: 756
            },
            {
              id: 'p_2',
              date: '2026-06-09',
              metric: 'Milk Liters',
              quantity: 23,
              revenueKES: 1380,
              investorPayoutKES: 552,
              farmerPayoutKES: 828
            },
            {
              id: 'p_3',
              date: '2026-06-10',
              metric: 'Milk Liters',
              quantity: 22,
              revenueKES: 1320,
              investorPayoutKES: 528,
              farmerPayoutKES: 792
            },
            {
              id: 'p_4',
              date: '2026-06-11',
              metric: 'Milk Liters',
              quantity: 25,
              revenueKES: 1500,
              investorPayoutKES: 600,
              farmerPayoutKES: 900
            },
            {
              id: 'p_5',
              date: '2026-06-12',
              metric: 'Milk Liters',
              quantity: 24,
              revenueKES: 1440,
              investorPayoutKES: 576,
              farmerPayoutKES: 864
            }
          ]
        },
        {
          id: 'part_pqr',
          listingId: 'list_2',
          investorId: 'user_3',
          farmerId: 'user_2',
          animalTagId: 'SL-KE-AY-902',
          animalType: 'dairy',
          breed: 'Ayrshire Premium Heifer',
          splitPercentInvestor: 40,
          status: 'ACTIVE',
          healthLogs: [
            {
              id: 'h_2',
              date: '2026-06-11',
              status: 'Healthy',
              notes: 'Vaccination completed. Highly active feeding.',
              recordedBy: 'Josphat Kiprop (Farmer)'
            }
          ],
          productionLogs: [
            {
              id: 'p_2_1',
              date: '2026-06-08',
              metric: 'Milk Liters',
              quantity: 18,
              revenueKES: 1080,
              investorPayoutKES: 432,
              farmerPayoutKES: 648
            },
            {
              id: 'p_2_2',
              date: '2026-06-09',
              metric: 'Milk Liters',
              quantity: 19,
              revenueKES: 1140,
              investorPayoutKES: 456,
              farmerPayoutKES: 684
            },
            {
              id: 'p_2_3',
              date: '2026-06-10',
              metric: 'Milk Liters',
              quantity: 21,
              revenueKES: 1260,
              investorPayoutKES: 504,
              farmerPayoutKES: 756
            },
            {
              id: 'p_2_4',
              date: '2026-06-11',
              metric: 'Milk Liters',
              quantity: 20,
              revenueKES: 1200,
              investorPayoutKES: 480,
              farmerPayoutKES: 720
            },
            {
              id: 'p_2_5',
              date: '2026-06-12',
              metric: 'Milk Liters',
              quantity: 22,
              revenueKES: 1320,
              investorPayoutKES: 528,
              farmerPayoutKES: 792
            }
          ]
        }
      ];
      setPartnerships(defaultParts);
      localStorage.setItem('sl_partnerships', JSON.stringify(defaultParts));
    }

    if (savedVerifications) setVerifications(JSON.parse(savedVerifications));
    else {
      const defaultVers: VerificationRequest[] = [
        {
          id: 'verify_req_1',
          userId: 'user_2',
          userName: 'Josphat Kiprop',
          userRole: UserRole.FARMER,
          documentType: 'TITLE_DEED',
          documentNumber: 'BARINGO/SOY/15A',
          notes: 'Submitting agricultural training course certs for confirmation.',
          status: 'PENDING',
          submittedAt: new Date().toISOString()
        }
      ];
      setVerifications(defaultVers);
      localStorage.setItem('sl_verifications', JSON.stringify(defaultVers));
    }
  };

  // Sync state changes back to localStorage for persistence buffer
  useEffect(() => {
    if (listings.length > 0) localStorage.setItem('sl_listings', JSON.stringify(listings));
    if (leases.length > 0) localStorage.setItem('sl_leases', JSON.stringify(leases));
    if (partnerships.length > 0) localStorage.setItem('sl_partnerships', JSON.stringify(partnerships));
    if (verifications.length > 0) localStorage.setItem('sl_verifications', JSON.stringify(verifications));
    localStorage.setItem('sl_veterinary_reports', JSON.stringify(veterinaryReports));
    
    // Sync usersList back to localStorage, strictly filtering for and retaining only the approved seed accounts
    const approvedSeedIds = ['user_1', 'user_2', 'user_3', 'user_admin', 'user_vet'];
    const cleanUsersList = usersList.filter(u => approvedSeedIds.includes(u.id));
    localStorage.setItem('sl_users_list', JSON.stringify(cleanUsersList));
    
    // Recalculate frontend KPIs
    const activeF = leases.filter(a => a.status === 'SIGNED').length + partnerships.filter(p => p.status === 'ACTIVE').length;
    const leasedAcres = leases.reduce((acc, cur) => acc + cur.acreageLeased, 0);
    const lockedKES = leases.reduce((acc, cur) => acc + cur.paymentsMade, 0);

    setAnalytics({
      activeListings: listings.length,
      activeFarms: activeF,
      totalLeasedAcreage: leasedAcres,
      totalEscrowKES: lockedKES,
      registeredUsersCount: usersList.length,
      pendingVerificationsCount: verifications.filter(v => v.status === 'PENDING').length
    });
  }, [listings, leases, partnerships, verifications, usersList, veterinaryReports]);

  // 2. Listing Operations
  const handleAddNewListing = async (newListingData: any) => {
    // Schema verification
    const valResult = validateSchema(newListingData, listingSchema);
    if (!valResult.success) {
      const firstErrorMsg = Object.values(valResult.errors)[0];
      showToast(firstErrorMsg);
      return;
    }

    try {
      const { data, error } = await safeFetch<any>('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newListingData)
      });
      if (!error && data) {
        setListings([data, ...listings]);
        logAction('submit_listing', { id: data.id, title: data.title, type: data.type, price: data.priceKES }, currentUser?.id, currentUser?.name);
      } else {
        // Fallback
        const mockSaved = {
          ...newListingData,
          id: `list_${Date.now()}`,
          verified: currentUser.role === UserRole.ADMIN // Admin immediately verified
        };
        setListings([mockSaved, ...listings]);
        logAction('submit_listing_fallback', { title: mockSaved.title, type: mockSaved.type, price: mockSaved.priceKES }, currentUser?.id, currentUser?.name);
      }
    } catch (e) {
      // Fallback
      const mockSaved = {
        ...newListingData,
        id: `list_${Date.now()}`,
        verified: currentUser.role === UserRole.ADMIN
      };
      setListings([mockSaved, ...listings]);
      logAction('submit_listing_fallback', { title: mockSaved.title, type: mockSaved.type, price: mockSaved.priceKES }, currentUser?.id, currentUser?.name);
    }
    setIsListingModalOpen(false);
  };

  // 3. Lease & Escrow trigger after Mpesa Payment succeeds
  const handlePaymentCompleted = async (agreementData: any) => {
    if (selectedListingForAction?.type === ListingType.LAND) {
      // Validate lease parameters!
      const valResult = validateSchema(agreementData, leaseSchema);
      if (!valResult.success) {
        const firstErrorMsg = Object.values(valResult.errors)[0];
        showToast(firstErrorMsg);
        return;
      }

      try {
        const { data, error } = await safeFetch<any>('/api/land/leases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agreementData)
        });
        if (!error && data) {
          setLeases([data, ...leases]);
          logAction('propose_lease', { id: data.id, listingId: data.listingId, acreage: data.acreageLeased, pricePerAcreKES: data.pricePerAcreKES }, currentUser?.id, currentUser?.name);
        } else {
          setLeases([agreementData, ...leases]);
          logAction('propose_lease_fallback', { listingId: agreementData.listingId, acreage: agreementData.acreageLeased }, currentUser?.id, currentUser?.name);
        }
      } catch (e) {
        setLeases([agreementData, ...leases]);
        logAction('propose_lease_fallback', { listingId: agreementData.listingId, acreage: agreementData.acreageLeased }, currentUser?.id, currentUser?.name);
      }
    } else if (selectedListingForAction?.type === ListingType.LIVESTOCK) {
      try {
        const { data, error } = await safeFetch<any>('/api/livestock/partnerships', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agreementData)
        });
        if (!error && data) {
          setPartnerships([data, ...partnerships]);
          logAction('sponsor_livestock', { id: data.id, listingId: data.listingId, species: data.animalType, breed: data.breed }, currentUser?.id, currentUser?.name);
        } else {
          setPartnerships([agreementData, ...partnerships]);
          logAction('sponsor_livestock_fallback', { listingId: agreementData.listingId, breed: agreementData.breed }, currentUser?.id, currentUser?.name);
        }
      } catch (e) {
        setPartnerships([agreementData, ...partnerships]);
        logAction('sponsor_livestock_fallback', { listingId: agreementData.listingId, breed: agreementData.breed }, currentUser?.id, currentUser?.name);
      }
    }

    setIsPaymentModalOpen(false);
    setSelectedListingForAction(null);
  };

  // 4. Log yields metric to active Livestock Tag IDs
  const handleLogYield = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePartnershipForYieldLog) return;

    const pricePerUnit = yieldMetric === 'Milk Liters' ? 60 : 350; // 60 KES Liter milk, 350 Tray eggs
    const totalRev = yieldQty * pricePerUnit;

    const p = partnerships.find(item => item.id === activePartnershipForYieldLog);
    if (!p) return;

    const investorPayout = Math.round(totalRev * (p.splitPercentInvestor / 100));
    const farmerPayout = totalRev - investorPayout;

    const newLog = {
      id: `p_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      metric: yieldMetric,
      quantity: yieldQty,
      revenueKES: totalRev,
      investorPayoutKES: investorPayout,
      farmerPayoutKES: farmerPayout
    };

    try {
      const res = await fetch('/api/livestock/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnershipId: activePartnershipForYieldLog,
          quantity: yieldQty,
          metric: yieldMetric,
          pricePerUnit
        })
      });
      if (res.ok) {
        const updatedPart = await res.json();
        setPartnerships(partnerships.map(item => item.id === activePartnershipForYieldLog ? updatedPart : item));
      } else {
        const updated = {
          ...p,
          productionLogs: [newLog, ...(p.productionLogs || [])]
        };
        setPartnerships(partnerships.map(item => item.id === activePartnershipForYieldLog ? updated : item));
      }
    } catch (err) {
      const updated = {
        ...p,
        productionLogs: [newLog, ...(p.productionLogs || [])]
      };
      setPartnerships(partnerships.map(item => item.id === activePartnershipForYieldLog ? updated : item));
    }

    alert('Maajabu! Production log successfully registered. Payout split calculated.');
    setActivePartnershipForYieldLog('');
  };

  // 5. Log health monitoring updates
  const handleLogHealth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePartnershipForHealthLog) return;

    const p = partnerships.find(item => item.id === activePartnershipForHealthLog);
    if (!p) return;

    const newLog = {
      id: `h_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      status: healthStatusSelected,
      notes: healthLogNotes || 'Routine animal inspection completed.',
      recordedBy: currentUser.name
    };

    try {
      const res = await fetch('/api/livestock/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnershipId: activePartnershipForHealthLog,
          status: healthStatusSelected,
          notes: healthLogNotes || 'Inspection.'
        })
      });
      if (res.ok) {
        const updatedPart = await res.json();
        setPartnerships(partnerships.map(item => item.id === activePartnershipForHealthLog ? updatedPart : item));
      } else {
        const updated = {
          ...p,
          healthLogs: [newLog, ...(p.healthLogs || [])]
        };
        setPartnerships(partnerships.map(item => item.id === activePartnershipForHealthLog ? updated : item));
      }
    } catch (err) {
      const updated = {
        ...p,
        healthLogs: [newLog, ...(p.healthLogs || [])]
      };
      setPartnerships(partnerships.map(item => item.id === activePartnershipForHealthLog ? updated : item));
    }

    alert('Health status saved. Tag registry updated.');
    setActivePartnershipForHealthLog('');
    setHealthLogNotes('');
  };

  // 6. Submit Land titles for admin review
  const handleDocVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber) return;

    const reqData = {
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      documentType: docType,
      documentNumber: docNumber,
      notes: verificationNotes,
    };

    try {
      const res = await fetch('/api/verification/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqData)
      });
      if (res.ok) {
        const savedReq = await res.json();
        setVerifications([savedReq, ...verifications]);
      } else {
        const savedReq = {
          ...reqData,
          id: `verify_req_${Date.now()}`,
          status: 'PENDING' as any,
          submittedAt: new Date().toISOString()
        };
        setVerifications([savedReq, ...verifications]);
      }
    } catch (err) {
      const savedReq = {
        ...reqData,
        id: `verify_req_${Date.now()}`,
        status: 'PENDING' as any,
        submittedAt: new Date().toISOString()
      };
      setVerifications([savedReq, ...verifications]);
    }

    setVerificationSubmittedMsg('Tafadhali subiri. Your registration has been submitted and sent to the District Registry Ward.');
    setDocNumber('');
    setVerificationNotes('');
    setTimeout(() => setVerificationSubmittedMsg(''), 6000);
  };

  // 7. Administrative callbacks use the backend as the source of truth. No local fallback is allowed.
  const adminFetch = <T,>(url: string, init: RequestInit = {}) => {
    const token = localStorage.getItem('sl_token');
    if (!token) return Promise.resolve({ data: null as T | null, error: 'An administrator session is required.' });
    return safeFetch<T>(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers }
    });
  };

  const farmerFetch = <T,>(url: string, init: RequestInit = {}) => {
    const token = localStorage.getItem('sl_token');
    if (!token) return Promise.resolve({ data: null as T | null, error: 'A signed-in farmer session is required.' });
    return safeFetch<T>(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers }
    });
  };

  const investorFetch = <T,>(url: string, init: RequestInit = {}) => {
    const token = localStorage.getItem('sl_token');
    if (!token) return Promise.resolve({ data: null as T | null, error: 'A signed-in investor session is required.' });
    return safeFetch<T>(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers }
    });
  };

  const veterinaryFetch = <T,>(url: string, init: RequestInit = {}) => {
    const token = localStorage.getItem('sl_token');
    if (!token) return Promise.resolve({ data: null as T | null, error: 'A signed-in veterinary session is required.' });
    return safeFetch<T>(url, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers } });
  };

  const handleSaveFarmerProfile = async (input: { farmSpecialties: string[]; seekingLandAcreage: number }) => {
    const { data, error } = await farmerFetch<{ user: User }>('/api/farmer/profile', { method: 'PUT', body: JSON.stringify(input) });
    if (error || !data) throw new Error(error || 'Could not save the farm summary.');
    setCurrentUser(data.user);
    localStorage.setItem('sl_current_user', JSON.stringify(data.user));
    setUsersList(previous => previous.map(user => user.id === data.user.id ? data.user : user));
    showToast('Farm summary saved.');
  };

  const handleFarmerProduction = async (partnershipId: string, quantity: number, metric: string) => {
    const { data, error } = await farmerFetch<LivestockPartnership>('/api/livestock/production', { method: 'POST', body: JSON.stringify({ partnershipId, quantity, metric }) });
    if (error || !data) throw new Error(error || 'Could not save the production record.');
    setPartnerships(previous => previous.map(partnership => partnership.id === data.id ? data : partnership));
    showToast('Production record saved.');
  };

  const handleModerateListing = async (listingId: string, status: 'APPROVED' | 'REJECTED' | 'SUSPENDED', note?: string) => {
    const { data, error } = await adminFetch<{ listing: Listing }>('/api/admin/approve-listing', { method: 'POST', body: JSON.stringify({ listingId, status, note }) });
    if (error || !data) throw new Error(error || 'Could not update the listing.');
    setListings(previous => previous.map(listing => listing.id === listingId ? data.listing : listing));
    logAction('moderate_listing', { listingId, status }, currentUser?.id, currentUser?.name);
  };

  const handleReviewVerification = async (requestId: string, status: 'APPROVED' | 'REJECTED' | 'MORE_INFO', note?: string) => {
    const { data, error } = await adminFetch<{ verification: VerificationRequest }>('/api/admin/approve-doc', { method: 'POST', body: JSON.stringify({ requestId, status, note }) });
    if (error || !data) throw new Error(error || 'Could not update the verification.');
    setVerifications(previous => previous.map(verification => verification.id === requestId ? data.verification : verification));
    if (status !== 'MORE_INFO') await fetchAllData();
    logAction('review_verification', { requestId, status }, currentUser?.id, currentUser?.name);
  };

  const handleDisburseEscrow = async (leaseId: string) => {
    try {
      await safeFetch('/api/land/leases/disburse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaseId })
      });
      logAction('disburse_escrow', { leaseId }, currentUser?.id, currentUser?.name);
    } catch (e) {}

    setLeases(leases.map(l => l.id === leaseId ? { ...l, mpesaEscrowStatus: 'DISBURSED' } : l));
    alert('Shamba payment disbursed from Escrow ledger directly to Landowner M-Pesa account!');
  };

  const handleApproveUser = async (userId: string, status: 'APPROVED' | 'REJECTED') => {
    const { data, error } = await adminFetch<{ user: User }>('/api/admin/approve-user', { method: 'POST', body: JSON.stringify({ userId, status }) });
    if (error || !data) throw new Error(error || 'Could not update the user.');
    const updated = usersList.map(user => user.id === userId ? data.user : user);
    setUsersList(updated);
    logAction('approve_user', { userId, status }, currentUser?.id, currentUser?.name);

    // If the approved user was the currentUser, update currentUser as well
    if (currentUser && currentUser.id === userId) {
      const updatedCur = { ...currentUser, verified: status === 'APPROVED' };
      setCurrentUser(updatedCur);
      localStorage.setItem('sl_current_user', JSON.stringify(updatedCur));
    }
  };

  // Filters calculation
  const displayedListings = listings.filter((item) => {
    const matchCounty = selectedCounty === 'All Counties' || item.locationCounty === selectedCounty;
    const matchType = selectedType === 'all' || item.type === selectedType;
    const matchesSearch = !searchQuery.trim() || (() => {
      const q = searchQuery.toLowerCase();
      const titleMatch = item.title?.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      const countyMatch = item.locationCounty?.toLowerCase().includes(q);
      return titleMatch || descMatch || countyMatch;
    })();
    return matchCounty && matchType && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'price-low') {
      return a.priceKES - b.priceKES;
    }
    if (sortBy === 'price-high') {
      return b.priceKES - a.priceKES;
    }
    // Default: Sort by newest (reverse chronological)
    return b.id.localeCompare(a.id);
  });

  const visibleVeterinaryReports = currentUser?.role === UserRole.ADMIN
    ? veterinaryReports
    : veterinaryReports.filter(report => report.farmerId === currentUser?.id || report.investorId === currentUser?.id || report.veterinarianId === currentUser?.id);

  if (!currentUser) {
    return (
      <>
        <LandingPage
          onLoginClick={(role) => openLoginModal(role)}
          onOpenDoc={(title) => openFooterDoc(title)}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />

        {isLoginModalOpen && (
          <LoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            targetRole={loginTargetRole}
            usersList={usersList}
            onSelectUser={handleSelectModalUser}
            onCustomLogin={handleModalCustomLogin}
            onCustomRegister={handleModalCustomRegister}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Global Modal for Landing Page Docs */}
        {activeFooterDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" id="landing_doc_modal_backdrop">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto" id="landing_doc_modal_content">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {activeFooterDoc.title}
                </h3>
                <button
                  onClick={() => setActiveFooterDoc(null)}
                  className="p-1 px-2.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  id="landing_doc_modal_close_btn"
                >
                  Close
                </button>
              </div>
              <div>
                {footerDocLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3">
                    <BrandedLoader size="md" message="Loading cooperative document..." />
                  </div>
                ) : (
                  activeFooterDoc.content
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen pb-16 flex flex-col font-sans transition-all duration-300 bg-bg-base text-text-base border-border-base" id="shambaloop_app_stage">


      {/* Platform Branding Header */}
      <header className="sticky top-0 z-30 select-none border-b transition-all duration-300 bg-card-bg border-border-base text-text-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
          <button 
            onClick={() => {
              setSearchQuery('');
              setSelectedCounty('All Counties');
              setSelectedType('all');
              setDashboardView('overview');
            }}
            className="flex items-center gap-3 shrink-0 focus:outline-none cursor-pointer group text-left"
            id="shambaloop_header_logo_btn"
          >
            <Logo size={42} variant="full" isDarkMode={isDarkMode} />
          </button>

          {/* Header Search Bar */}
          <div className="flex-1 max-w-[200px] sm:max-w-xs md:max-w-sm mx-1 sm:mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                aria-label="Search assets"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets (county, breed, etc)..."
                className={`w-full pl-3.5 pr-7 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-slate-850 border-slate-700 text-white placeholder-slate-500' 
                    : 'bg-slate-100 border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
                id="header_search_input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-[10px] font-bold"
                  title="Clear search"
                  id="btn_clear_header_search"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Swahili Warm Greeting */}
          <div className={`hidden lg:block text-xs font-semibold shrink-0 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Habari yako, <span className="text-emerald-600 dark:text-emerald-400 font-bold">{currentUser.name}</span>! County: <span className="font-mono text-xs">{currentUser.county}</span>
          </div>

          {/* User Controls Panel */}
          <div className="flex items-center gap-3">
            {/* Quick theme toggle with high-contrast icon and label */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer text-xs font-bold border shadow-2xs ${
                isDarkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700 hover:border-amber-400/50' 
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 hover:border-slate-400'
              }`}
              title="Toggle Light / Dark Theme"
              id="header_theme_toggle_btn"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">Light Theme</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">Dark Theme</span>
                </>
              )}
            </button>

            {/* Current role indicator and logout. Role changes require a new login. */}
            <div className={`flex items-center gap-2 p-1.5 rounded-xl border transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
              <span className={`text-[9px] font-bold uppercase px-1.5 hidden lg:inline ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Active Trust Role:</span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase border ${isDarkMode ? 'bg-emerald-900/80 text-emerald-200 border-emerald-700' : 'bg-emerald-100 text-emerald-900 border-emerald-300'}`} id="header_current_role">
                {currentUser.role}
              </span>

              {/* Explicit logout */}
              <button
                onClick={handleLogout}
                className={`p-1.5 px-3 rounded-lg hover:text-rose-500 transition-colors cursor-pointer border border-transparent hover:border-rose-300 dark:hover:border-rose-800 font-bold ${isDarkMode ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-700 hover:bg-slate-200'}`}
                title="Logout and return to landing page"
                id="header_logout_btn"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider font-sans">Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 lg:mt-8 space-y-8 flex-1">
        
        {/* ROLE SPECIFIC DASHBOARDS WITH STANDARDIZED PERFORMANT FADE-IN */}
        {currentUser && (
          <section key={currentUser.role} className="space-y-4 animate-fade-in">
            {/* Admin Dashboard */}
            {currentUser.role === UserRole.ADMIN && (
              <AdminPanel
                allListings={listings}
                verificationRequests={verifications}
                activeLeases={leases}
                usersList={usersList}
                disputes={disputesList}
                partnerships={partnerships}
                matches={tripartiteMatches}
                analytics={analytics}
                onModerateListing={handleModerateListing}
                onReviewVerification={handleReviewVerification}
                onApproveUser={handleApproveUser}
                onResolveDispute={handleResolveDispute}
                onCreateTripartiteMatch={handleCreateTripartiteMatch}
              />
            )}

            {/* Investor Dashboard */}
            {currentUser.role === UserRole.INVESTOR && (
              <InvestorDashboard
                currentUser={currentUser}
                partnerships={partnerships}
                veterinaryReports={veterinaryReports}
                proposals={proposals}
                farmEvents={farmEvents}
                farmers={investorFarmers}
                criteria={investorCriteria}
                onSaveCriteria={handleSaveInvestorCriteria}
                onUpdateProposal={handleUpdateInvestorProposal}
              />
            )}

            {/* Farmer Dashboard */}
            {currentUser.role === UserRole.FARMER && (
              <FarmerDashboard
                currentUser={currentUser}
                partnerships={partnerships}
                reports={veterinaryReports.filter(report => report.farmerId === currentUser.id)}
                proposals={proposals}
                events={farmEvents}
                vetJobs={vetJobs}
                investors={farmerInvestors}
                veterinarians={farmerVeterinarians}
                onCreateProposal={handleCreateProposal}
                onSaveProfile={handleSaveFarmerProfile}
                onRequestVet={handleRequestVetJob}
                onLogProduction={handleFarmerProduction}
                onLogEvent={handleLogFarmEvent}
              />
            )}

            {/* Veterinary Dashboard */}
            {currentUser.role === UserRole.VETERINARIAN && (
              <VeterinaryDashboard
                currentUser={currentUser}
                partnerships={partnerships}
                reports={veterinaryReports}
                vetJobs={vetJobs}
                onSaveReport={handleSaveVeterinaryReport}
                onUpdateJobStatus={handleUpdateVetJobStatus}
              />
            )}

            {(currentUser.role === UserRole.INVESTOR || currentUser.role === UserRole.FARMER || currentUser.role === UserRole.ADMIN) && visibleVeterinaryReports.length > 0 && (
              <section className="rounded-2xl border border-emerald-100 dark:border-emerald-900/60 bg-white dark:bg-slate-900 p-5 space-y-3" id="shared_veterinary_reports">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Shared veterinary reports</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Published health and key-life-event records for the collaboration.</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Auditable record</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {visibleVeterinaryReports.map(report => (
                    <article key={report.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs">
                      <div className="flex justify-between gap-2 font-bold">
                        <span>{report.animalTagId} · {report.visitType}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 uppercase text-[9px]">{report.status.replaceAll('_', ' ')}</span>
                      </div>
                      <p className="mt-2 text-slate-600 dark:text-slate-300"><strong>Findings:</strong> {report.findings}</p>
                      <p className="mt-1 text-slate-600 dark:text-slate-300"><strong>Recommendation:</strong> {report.recommendations}</p>
                      <p className="mt-2 text-[10px] text-slate-400">By {report.veterinarianName} · {new Date(report.createdAt).toLocaleDateString()}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Landowner Dashboard */}
            {currentUser.role === UserRole.LANDOWNER && (
              <div className="bg-white rounded-2xl border border-emerald-100 dark:border-emerald-900/60 shadow-xs overflow-hidden" id="landowner_dashboard_matching">
                <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white p-5 select-none">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-400/30 font-bold text-xs">
                        LND
                      </div>
                      <div>
                        <h2 className="text-sm font-bold tracking-wide uppercase">Landowner Dashboard</h2>
                        <span className="text-[10.5px] text-emerald-250">Active Tenant & Investor Matches seeking fertile arable shamba</span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-xs font-bold text-amber-400">Est. Leases: {leases.filter(l => l.landownerId === currentUser.id).length} Active</div>
                      <div className="text-[9px] text-emerald-300 uppercase">Region: {currentUser.county} County</div>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tenant Farmers & Investors Seeking Land Leases in Kenya</h3>
                    <span className="text-[10px] text-slate-400 font-mono">Found {usersList.filter(u => u.role === UserRole.FARMER || u.role === UserRole.INVESTOR).length} matching targets</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {usersList.filter(u => u.id !== currentUser.id && (u.seekingLandAcreage || u.preferredSectors?.includes('Leaseholds'))).map((tenant) => (
                      <div key={tenant.id} className="p-4 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 hover:border-emerald-355 hover:shadow-2xs transition-all space-y-3 flex flex-col justify-between" id={`tenant_match_${tenant.id}`}>
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-extrabold tracking-wider ${
                              tenant.role === UserRole.INVESTOR ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            }`}>
                              {tenant.role}
                            </span>
                            <span className="text-[9.5px] font-semibold text-slate-500 dark:text-slate-400">{tenant.county} Base</span>
                          </div>

                          <div>
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white">{tenant.name}</h4>
                            <p className="text-[10px] text-slate-500 font-sans">Mobile contacts: {tenant.phone}</p>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-2.5 rounded-lg text-[10px] text-slate-650 dark:text-slate-300 font-sans space-y-1">
                            <p><strong className="text-slate-800 dark:text-slate-200">Target Acreage:</strong> {tenant.seekingLandAcreage || '10-25'} Acres</p>
                            <p><strong className="text-slate-850 dark:text-slate-200">Crops/Sectors:</strong> {tenant.farmSpecialties?.join(', ') || tenant.preferredSectors?.join(', ') || 'Leaseholds'}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 items-center mt-2">
                          <button
                            onClick={() => alert(`Proposal submitted! A legal lease proposal representing your registered acreage has been securely dispatched to ${tenant.name}. They can review the physical coordinates under their shamba trust dashboard.`)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-755 text-white text-[10px] font-bold uppercase py-2 rounded-lg transition-all tracking-wider cursor-pointer text-center"
                          >
                            Propose Shamba Lease Leasehold
                          </button>
                          <WorkflowTooltip
                            role={currentUser.role}
                            actionType="propose_tenant_lease"
                            align="right"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        <nav className="flex items-center gap-2 border-b border-border-base pb-3" aria-label="Dashboard views">
          <button
            type="button"
            onClick={() => setDashboardView('overview')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${dashboardView === 'overview' ? 'bg-emerald-700 text-white' : 'bg-card-bg text-text-base border border-border-base hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setDashboardView('listings')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${dashboardView === 'listings' ? 'bg-emerald-700 text-white' : 'bg-card-bg text-text-base border border-border-base hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            Listings
          </button>
        </nav>

        {/* Section: Market Browsing & Livestock Registry logs */}
        {dashboardView === 'listings' && <section className="dashboard-surface grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Filters and Active Farm contracts */}
          <div className="space-y-6">
            
            {/* Filter Section box */}
            <div className="bg-white p-5 rounded-2xl border border-agri-dirt-100 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
                <span>Filter Marketplace Listings</span>
              </div>

              {/* County Picker */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Kenyan County Region</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {COUNTIES_LIST.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedCounty(c)}
                      className={`px-2 py-2 rounded-lg text-[10px] font-bold border transition text-center truncate ${
                        (c === 'All Counties' && selectedCounty === 'All Counties') || (selectedCounty === c)
                          ? 'bg-agri-green-900 border-agri-green-900 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {c === 'All Counties' ? 'Zote (All)' : c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Listing type toggle */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Asset Category Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 font-bold focus:outline-none"
                >
                  <option value="all">All listings (Zote)</option>
                  <option value={ListingType.LAND}>Land for Lease (Shamba)</option>
                  <option value={ListingType.LIVESTOCK}>Livestock Partnership (Mshiriki)</option>
                  <option value={ListingType.OPPORTUNITY}>Farm Opportunity Jobs</option>
                </select>
              </div>

              {/* Fast stats indicators inside filter */}
              <div className="pt-2 flex justify-between text-[11px] font-semibold text-slate-500 border-t border-slate-100">
                <span>Matching postings:</span>
                <span className="mono-display text-slate-900 font-bold">{displayedListings.length} Assets found</span>
              </div>
            </div>

            {/* My Active Farms agreements Ledger */}
            <div className="bg-white p-5 rounded-2xl border border-agri-dirt-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
                  <span>My Active Farms & Ledgers</span>
                </div>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase">Simulated</span>
              </div>

              {leases.length === 0 && partnerships.length === 0 ? (
                <BrandedEmptyState
                  type="partnerships"
                  message="You have no active signed leases or livestock partnerships yet. Sponsor an animal profile or start a crop leasing agreement to initiate escrow-protected yield tracking."
                  className="py-6 px-4 bg-slate-50 border-none shadow-none"
                />
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {/* Lease records */}
                  {leases.map((lease) => (
                    <div key={lease.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex justify-between items-start font-bold text-slate-800">
                        <span className="text-slate-900 line-clamp-1">Simulated Lease: {lease.acreageLeased} Acres</span>
                        <span className="text-emerald-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded mono-display">
                          {lease.mpesaEscrowStatus}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Per acre pricing: KES {lease.pricePerAcreKES.toLocaleString()} | Locked: KES {lease.paymentsMade.toLocaleString()}
                      </p>
                      
                      {/* Interactive Milestones and disputing outcomes */}
                      {lease.mpesaEscrowStatus === 'ESCROWED' && (
                        <div className="pt-1 select-none flex items-center justify-between bg-white p-2 rounded border border-amber-200">
                          <span className="text-[10px] font-semibold text-amber-900">Ward Release check:</span>
                          <button
                            onClick={() => handleDisburseEscrow(lease.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-1 px-2 rounded text-[10px] uppercase cursor-pointer"
                          >
                            Release Funds
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Partnership records */}
                  {partnerships.map((p) => (
                    <div 
                      key={p.id} 
                      onClick={() => setSelectedPartnershipId(p.id)}
                      className={`p-3 rounded-xl border text-xs space-y-3 transition-all cursor-pointer ${
                        selectedPartnershipId === p.id 
                          ? 'bg-emerald-50/50 border-emerald-500 ring-1 ring-emerald-500/20 shadow-xs' 
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start font-bold">
                        <div>
                          <span className="text-emerald-800 uppercase block text-[9px] font-bold tracking-wider">LIVESTOCK PARTNERSHIP</span>
                          <span className="text-slate-900 font-display font-medium text-[11px] block mt-0.5">Breed: {p.breed}</span>
                        </div>
                        <span className="bg-white border rounded px-1.5 py-0.5 font-bold font-mono text-emerald-800 text-[10px] tracking-tight">{p.animalTagId}</span>
                      </div>

                      <div className="text-[10px] text-slate-500 font-medium bg-white p-2 rounded border space-y-1">
                        <div className="flex justify-between">
                          <span>Split arrangement:</span>
                          <strong>{p.splitPercentInvestor}% Investor / {100 - p.splitPercentInvestor}% Farmer</strong>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-1">
                          <span>Recorded Health Logs:</span>
                          <strong>{p.healthLogs?.length || 0} Entries</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Total milk weight logged:</span>
                          <strong className="mono-display text-emerald-700">{p.productionLogs?.reduce((acc, cur) => acc + cur.quantity, 0) || 0} Liters</strong>
                        </div>
                      </div>

                      {/* Yield Logging Trigger forms */}
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setActivePartnershipForYieldLog(activePartnershipForYieldLog === p.id ? '' : p.id);
                              setActivePartnershipForHealthLog('');
                            }}
                            className="flex-1 text-center py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] rounded-lg tracking-wider uppercase cursor-pointer"
                          >
                            Log Yield (Litres)
                          </button>
                          <button
                            onClick={() => {
                              setActivePartnershipForHealthLog(activePartnershipForHealthLog === p.id ? '' : p.id);
                              setActivePartnershipForYieldLog('');
                            }}
                            className="flex-1 flex items-center justify-center gap-1 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[9px] rounded-lg tracking-wider uppercase cursor-pointer"
                          >
                            Animal Audit
                          </button>
                        </div>

                        {/* Interactive Child view form overlay */}
                        {activePartnershipForYieldLog === p.id && (
                          <form onSubmit={handleLogYield} className="bg-white p-2.5 rounded border border-emerald-300 space-y-2 font-semibold">
                            <p className="text-[10px] text-emerald-950 font-bold border-b pb-1">Register Daily Production</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[8px] uppercase">Quantity of Metric</label>
                                <input
                                  type="number"
                                  value={yieldQty}
                                  onChange={(e) => setYieldQty(Number(e.target.value))}
                                  className="w-full p-1 border text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] uppercase">Yield Metric</label>
                                <select
                                  value={yieldMetric}
                                  onChange={(e) => setYieldMetric(e.target.value)}
                                  className="w-full p-1 border text-xs"
                                >
                                  <option value="Milk Liters">Milk Liters</option>
                                  <option value="Egg Trays">Egg Trays</option>
                                </select>
                              </div>
                            </div>
                            <button
                              type="submit"
                              className="w-full bg-[#41b045] text-white font-bold py-1.5 rounded text-[9px] uppercase hover:bg-emerald-700 cursor-pointer"
                            >
                              Submit & Recalculate Split
                            </button>
                          </form>
                        )}

                        {activePartnershipForHealthLog === p.id && (
                          <form onSubmit={handleLogHealth} className="bg-white p-2.5 rounded border border-slate-300 space-y-2 font-semibold">
                            <p className="text-[10px] text-slate-800 font-bold border-b pb-1">Animal Health Checkup</p>
                            <div className="space-y-1">
                              <label className="text-[8px] uppercase">Confirmed status color tag</label>
                              <select
                                value={healthStatusSelected}
                                onChange={(e: any) => setHealthStatusSelected(e.target.value)}
                                className="w-full p-1 border text-xs"
                              >
                                <option value="Healthy">Healthy (Normal check)</option>
                                <option value="Sick">Sick (Veterinary called)</option>
                                <option value="Vaccinated">Vaccinated (County standard)</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] uppercase">Inspection details</label>
                              <input
                                type="text"
                                placeholder="Deworming completed or ticks clear"
                                value={healthLogNotes}
                                onChange={(e) => setHealthLogNotes(e.target.value)}
                                className="w-full p-1 border text-xs text-slate-800 font-normal"
                              />
                            </div>
                            <button
                              type="submit"
                              className="w-full bg-slate-900 text-white font-bold py-1.5 rounded text-[9px] uppercase hover:bg-slate-800 cursor-pointer"
                            >
                              Save Log to Tag Register
                            </button>
                          </form>
                        )}

                        {/* Display logged history detail lines for complete trace */}
                        {p.productionLogs && p.productionLogs.length > 0 && (
                          <div className="pt-2 border-t border-slate-100">
                            <p className="text-[8px] uppercase font-bold text-slate-400">Yield Ledger Ledger logs:</p>
                            <div className="space-y-1 max-h-[80px] overflow-y-auto mt-1 font-mono text-[9px]">
                              {p.productionLogs.map((log: any, idx) => (
                                <div key={idx} className="flex justify-between text-slate-600 bg-white p-1 rounded border border-slate-200/50">
                                  <span>{log.date} ({log.quantity}L):</span>
                                  <span className="font-bold text-emerald-800">Split: Farmer/Inv KES {log.farmerPayoutKES}/{log.investorPayoutKES}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Visual Production Trend Line Chart for Selected Partnership */}
              {partnerships.length > 0 && (() => {
                const selectedP = partnerships.find(p => p.id === selectedPartnershipId) || partnerships[0];
                if (!selectedP) return null;

                // 1. Get logs for first partnership
                const rawLogs = selectedP.productionLogs || [];
                const sortedRawLogs1 = [...rawLogs]
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                const logs1WithMA = sortedRawLogs1.map((log, idx) => {
                  const startIdx = Math.max(0, idx - 6);
                  const subset = sortedRawLogs1.slice(startIdx, idx + 1);
                  const sum = subset.reduce((acc, item) => acc + item.quantity, 0);
                  const avg = subset.length > 0 ? (sum / subset.length) : 0;
                  const isAnomaly = avg > 0 && log.quantity < avg * 0.8;

                  return {
                    ...log,
                    movingAverage7Day: parseFloat(avg.toFixed(1)),
                    isAnomaly,
                    percentDrop: parseFloat((avg > 0 ? ((avg - log.quantity) / avg) * 100 : 0).toFixed(1))
                  };
                });

                const filteredLogs = logs1WithMA.filter(log => {
                  if (trendStartDate && log.date < trendStartDate) return false;
                  if (trendEndDate && log.date > trendEndDate) return false;
                  return true;
                });

                // 2. Get logs for comparison partnership if selected
                const compareP = comparePartnershipId ? partnerships.find(p => p.id === comparePartnershipId) : null;
                const rawLogs2 = compareP ? (compareP.productionLogs || []) : [];
                const sortedRawLogs2 = [...rawLogs2]
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                const logs2WithMA = sortedRawLogs2.map((log, idx) => {
                  const startIdx = Math.max(0, idx - 6);
                  const subset = sortedRawLogs2.slice(startIdx, idx + 1);
                  const sum = subset.reduce((acc, item) => acc + item.quantity, 0);
                  const avg = subset.length > 0 ? (sum / subset.length) : 0;
                  const isAnomaly = avg > 0 && log.quantity < avg * 0.8;

                  return {
                    ...log,
                    movingAverage7Day: parseFloat(avg.toFixed(1)),
                    isAnomaly,
                    percentDrop: parseFloat((avg > 0 ? ((avg - log.quantity) / avg) * 100 : 0).toFixed(1))
                  };
                });

                const filteredLogs2 = logs2WithMA.filter(log => {
                  if (trendStartDate && log.date < trendStartDate) return false;
                  if (trendEndDate && log.date > trendEndDate) return false;
                  return true;
                });

                // Convert date formatting helper
                const formatMyDate = (dateStr: string) => {
                  try {
                    const parts = dateStr.split('-');
                    if (parts.length < 3) return dateStr;
                    const m = parts[1];
                    const d = parts[2];
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthIdx = parseInt(m, 10) - 1;
                    const monthStr = months[monthIdx] || m;
                    return `${monthStr} ${parseInt(d, 10)}`;
                  } catch (e) {
                    return dateStr;
                  }
                };

                // Merge logs from both series by date chronologically
                const dateMap: { [date: string]: any } = {};

                filteredLogs.forEach(log => {
                  if (!dateMap[log.date]) {
                    dateMap[log.date] = {
                      date: log.date,
                      formattedDate: formatMyDate(log.date),
                    };
                  }
                  dateMap[log.date].quantity = log.quantity;
                  dateMap[log.date].movingAverage7Day = log.movingAverage7Day;
                  dateMap[log.date].isAnomaly = log.isAnomaly;
                  dateMap[log.date].percentDrop = log.percentDrop;
                  dateMap[log.date].originalLog1 = log;
                });

                filteredLogs2.forEach(log => {
                  if (!dateMap[log.date]) {
                    dateMap[log.date] = {
                      date: log.date,
                      formattedDate: formatMyDate(log.date),
                    };
                  }
                  dateMap[log.date].compareQuantity = log.quantity;
                  dateMap[log.date].compareMovingAverage7Day = log.movingAverage7Day;
                  dateMap[log.date].compareIsAnomaly = log.isAnomaly;
                  dateMap[log.date].comparePercentDrop = log.percentDrop;
                  dateMap[log.date].originalLog2 = log;
                });

                const chartData = Object.values(dateMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                const totalLogsCount = rawLogs.length + rawLogs2.length;
                const filteredLogsCount = filteredLogs.length + filteredLogs2.length;
                const hasAnomalyTriggered = chartData.some(d => d.isAnomaly || d.compareIsAnomaly);

                const activeAnomaliesList: {
                  date: string;
                  formattedDate: string;
                  animalId: string;
                  breed: string;
                  quantity: number;
                  drop: number;
                  ma: number;
                  isCompare: boolean;
                }[] = [];

                chartData.forEach(d => {
                  if (d.isAnomaly) {
                    activeAnomaliesList.push({
                      date: d.date,
                      formattedDate: d.formattedDate,
                      animalId: selectedP.animalTagId,
                      breed: selectedP.breed,
                      quantity: d.quantity,
                      drop: d.percentDrop,
                      ma: d.movingAverage7Day,
                      isCompare: false,
                    });
                  }
                  if (d.compareIsAnomaly && compareP) {
                    activeAnomaliesList.push({
                      date: d.date,
                      formattedDate: d.formattedDate,
                      animalId: compareP.animalTagId,
                      breed: compareP.breed,
                      quantity: d.compareQuantity,
                      drop: d.comparePercentDrop,
                      ma: d.compareMovingAverage7Day,
                      isCompare: true,
                    });
                  }
                });

                // --- 1. Linear Regression Next-7-Days yield forecast ---
                const N_lr = filteredLogs.length;
                let lr_m = 0;
                let lr_c = 0;
                if (N_lr >= 2) {
                  let sumX = 0;
                  let sumY = 0;
                  let sumXY = 0;
                  let sumXX = 0;
                  filteredLogs.forEach((log, i) => {
                    sumX += i;
                    sumY += log.quantity;
                    sumXY += i * log.quantity;
                    sumXX += i * i;
                  });
                  const denominator = N_lr * sumXX - sumX * sumX;
                  if (denominator !== 0) {
                    lr_m = (N_lr * sumXY - sumX * sumY) / denominator;
                    lr_c = (sumY - lr_m * sumX) / N_lr;
                  } else {
                    lr_m = 0;
                    lr_c = sumY / N_lr;
                  }
                } else if (N_lr === 1) {
                  lr_m = 0;
                  lr_c = filteredLogs[0].quantity;
                }

                const forecastPoints: any[] = [];
                if (chartData.length > 0) {
                  const lastEntry = chartData[chartData.length - 1];
                  const lastDate = new Date(lastEntry.date);
                  
                  // Set up reference forecast link point on actual series
                  lastEntry.forecastQuantity = lastEntry.quantity;

                  for (let j = 1; j <= 7; j++) {
                    const nextDateObj = new Date(lastDate);
                    nextDateObj.setDate(lastDate.getDate() + j);
                    
                    const yyyy = nextDateObj.getFullYear();
                    const mm = String(nextDateObj.getMonth() + 1).padStart(2, '0');
                    const dd = String(nextDateObj.getDate()).padStart(2, '0');
                    const nextDateStr = `${yyyy}-${mm}-${dd}`;

                    const xVal = N_lr + j - 1;
                    const predictedVal = parseFloat((lr_m * xVal + lr_c).toFixed(1));
                    const finalProj = Math.max(0, predictedVal);

                    forecastPoints.push({
                      date: nextDateStr,
                      formattedDate: formatMyDate(nextDateStr),
                      forecastQuantity: finalProj,
                      isForecast: true,
                    });
                  }
                }
                const combinedChartData = showForecastLine ? [...chartData, ...forecastPoints] : [...chartData];

                // --- 2. Chart Color Scheme Mappings ---
                const primaryColor = (() => {
                  if (chartColorScheme === 'high-contrast') return '#ea580c'; // High Contrast Orange
                  if (chartColorScheme === 'grayscale') return '#4b5563'; // Slate 600
                  return '#059669'; // Emerald-600 (Professional Emerald/Earth Default)
                })();

                const compareColor = (() => {
                  if (chartColorScheme === 'high-contrast') return '#a21caf'; // Purple
                  if (chartColorScheme === 'grayscale') return '#9ca3af'; // Slate 400
                  return '#b45309'; // Amber-700 (Earth Brown)
                })();

                const forecastColor = (() => {
                  if (chartColorScheme === 'high-contrast') return '#e11d48'; // Bright Red
                  if (chartColorScheme === 'grayscale') return '#374151'; // Dark Charcoal
                  return '#f59e0b'; // Amber / gold
                })();

                // --- 3. CSV Export handler ---
                const handleExportCSV = () => {
                  if (chartData.length === 0) return;
                  const headers = [
                    'Date',
                    `Primary Yield [${selectedP.animalTagId}] (Liters)`,
                    'Primary Revenue (KES)',
                    'Primary Farmer Payout (KES)',
                    'Primary Investor Payout (KES)',
                    compareP ? `Comparison Yield [${compareP.animalTagId}] (Liters)` : '',
                    compareP ? 'Comparison Revenue (KES)' : '',
                    compareP ? 'Comparison Farmer Payout (KES)' : '',
                    compareP ? 'Comparison Investor Payout (KES)' : ''
                  ].filter(Boolean).join(',');

                  const rows = chartData.map(row => {
                    const log1 = row.originalLog1;
                    const log2 = row.originalLog2;
                    return [
                      row.date,
                      row.quantity !== undefined ? row.quantity : '',
                      log1?.revenueKES !== undefined ? log1.revenueKES : '',
                      log1?.farmerPayoutKES !== undefined ? log1.farmerPayoutKES : '',
                      log1?.investorPayoutKES !== undefined ? log1.investorPayoutKES : '',
                      ...(compareP ? [
                        row.compareQuantity !== undefined ? row.compareQuantity : '',
                        log2?.revenueKES !== undefined ? log2.revenueKES : '',
                        log2?.farmerPayoutKES !== undefined ? log2.farmerPayoutKES : '',
                        log2?.investorPayoutKES !== undefined ? log2.investorPayoutKES : ''
                      ] : [])
                    ].join(',');
                  });

                  const csvString = [headers, ...rows].join('\n');
                  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.setAttribute("href", url);
                  link.setAttribute("download", `ShambaLoop_Production_Export_${selectedP.animalTagId}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                };

                // --- 4. Interactive Insight Calculation Block ---
                const primarySummary = (() => {
                  if (filteredLogs.length === 0) return null;
                  const totalQty = filteredLogs.reduce((acc, l) => acc + l.quantity, 0);
                  const avgQty = parseFloat((totalQty / filteredLogs.length).toFixed(1));
                  const totalRev = filteredLogs.reduce((acc, l) => acc + (l.revenueKES || 0), 0);
                  const topDay = [...filteredLogs].sort((a, b) => b.quantity - a.quantity)[0];
                  
                  const mean = totalQty / filteredLogs.length;
                  const sumOfSquareDiffs = filteredLogs.reduce((acc, l) => acc + Math.pow(l.quantity - mean, 2), 0);
                  const variance = parseFloat((sumOfSquareDiffs / filteredLogs.length).toFixed(2));
                  const stdDev = parseFloat(Math.sqrt(variance).toFixed(2));
                  return { avgQty, totalRev, topDay, totalQty, variance, stdDev };
                })();

                const comparisonSummary = (() => {
                  if (!compareP || filteredLogs2.length === 0) return null;
                  const totalQty = filteredLogs2.reduce((acc, l) => acc + l.quantity, 0);
                  const avgQty = parseFloat((totalQty / filteredLogs2.length).toFixed(1));
                  const totalRev = filteredLogs2.reduce((acc, l) => acc + (l.revenueKES || 0), 0);
                  const topDay = [...filteredLogs2].sort((a, b) => b.quantity - a.quantity)[0];

                  const mean = totalQty / filteredLogs2.length;
                  const sumOfSquareDiffs = filteredLogs2.reduce((acc, l) => acc + Math.pow(l.quantity - mean, 2), 0);
                  const variance = parseFloat((sumOfSquareDiffs / filteredLogs2.length).toFixed(2));
                  const stdDev = parseFloat(Math.sqrt(variance).toFixed(2));
                  return { avgQty, totalRev, topDay, totalQty, variance, stdDev };
                })();

                return (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3.5" id="production_trend_chart_sec">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1">
                          <span>Production Pattern Trend Comparison</span>
                        </h4>
                        <p className="text-[9px] text-slate-500 font-medium">
                          Primary: <span className="font-mono text-emerald-800 font-bold">{selectedP.animalTagId}</span> ({selectedP.breed})
                          {compareP && (
                            <>
                              {' '}vs <span className="font-mono text-amber-800 dark:text-amber-500 font-bold">{compareP.animalTagId}</span> ({compareP.breed})
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 select-none">
                        <div className="flex items-center gap-1.5 align-middle">
                          {hasAnomalyTriggered && (
                            <div className="flex items-center gap-1 text-[8px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 animate-pulse">
                              <span>&gt;20% Yield Drop Warned</span>
                            </div>
                          )}
                          {(trendStartDate || trendEndDate) && (
                            <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-150">
                              Filtered: {filteredLogsCount}/{totalLogsCount} logs
                            </span>
                          )}
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Live Ledger
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Selector Dropdown to pick a Second Livestock Partnership to Compare */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50/40 border border-emerald-500/10 p-2.5 rounded-xl">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Multi-Series Benchmark Selector</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label htmlFor="compare_asset_select" className="text-[9px] font-bold text-slate-500">Compare with:</label>
                        <select
                          id="compare_asset_select"
                          value={comparePartnershipId}
                          onChange={(e) => setComparePartnershipId(e.target.value)}
                          className="p-1 px-2 border border-slate-200 rounded-lg bg-white text-[10px] text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 font-semibold cursor-pointer"
                        >
                          <option value="">-- Select Animal to Compare --</option>
                          {partnerships
                            .filter(p => p.id !== selectedP.id)
                            .map(p => (
                              <option key={p.id} value={p.id}>
                                {p.breed} ({p.animalTagId})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Compact Date Range Filter & Quick Presets Control Panel */}
                    <div className="bg-slate-50/70 border border-slate-200/60 p-2.5 rounded-xl space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Date Range Filter</span>
                        
                        {/* Quick Presets & File download actions */}
                        <div className="flex flex-wrap items-center gap-1.5 selection:hidden">
                          <button
                            type="button"
                            onClick={() => {
                              setTrendStartDate('2026-06-06');
                              setTrendEndDate('2026-06-13');
                              setDateValidationError('');
                            }}
                            className={`px-2 py-0.5 text-[8px] font-bold rounded border transition-all cursor-pointer ${
                              trendStartDate === '2026-06-06' && trendEndDate === '2026-06-13'
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            7 Days
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTrendStartDate('2026-05-14');
                              setTrendEndDate('2026-06-13');
                              setDateValidationError('');
                            }}
                            className={`px-2 py-0.5 text-[8px] font-bold rounded border transition-all cursor-pointer ${
                              trendStartDate === '2026-05-14' && trendEndDate === '2026-06-13'
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            30 Days
                          </button>
                          {(trendStartDate || trendEndDate) && (
                            <button
                              type="button"
                              onClick={() => {
                                setTrendStartDate('');
                                setTrendEndDate('');
                                setDateValidationError('');
                              }}
                              className="px-2 py-0.5 text-[8px] font-bold rounded border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
                            >
                              Reset
                            </button>
                          )}

                          <div className="h-3 w-[1px] bg-slate-200 mx-0.5"></div>

                          {chartData.length > 0 && (
                            <button
                              type="button"
                              onClick={handleExportCSV}
                              className="px-2 py-0.5 text-[8px] font-black rounded border border-emerald-250 bg-emerald-100/65 text-emerald-800 hover:bg-emerald-200 hover:border-emerald-350 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Export current filtered list to CSV"
                              id="btn_export_trend_csv"
                            >
                              <span>Export CSV</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Start Date */}
                        <div className="space-y-1">
                          <label htmlFor="trend_start_date" className="block text-[8px] font-bold text-slate-500 uppercase">From Date</label>
                          <input
                            id="trend_start_date"
                            type="date"
                            value={trendStartDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTrendStartDate(val);
                              if (val && trendEndDate && val > trendEndDate) {
                                setDateValidationError("Error: 'From Date' cannot be after 'To Date'.");
                              } else {
                                setDateValidationError("");
                              }
                            }}
                            className={`w-full text-[10px] font-medium text-slate-800 bg-white dark:bg-slate-800 dark:text-white border rounded-lg p-1 px-1.5 focus:outline-none focus:ring-1 ${
                              dateValidationError 
                                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' 
                                : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20'
                            }`}
                          />
                        </div>

                        {/* End Date */}
                        <div className="space-y-1">
                          <label htmlFor="trend_end_date" className="block text-[8px] font-bold text-slate-500 uppercase">To Date</label>
                          <input
                            id="trend_end_date"
                            type="date"
                            value={trendEndDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTrendEndDate(val);
                              if (trendStartDate && val && trendStartDate > val) {
                                setDateValidationError("Error: 'From Date' cannot be after 'To Date'.");
                              } else {
                                setDateValidationError("");
                              }
                            }}
                            max="2026-12-31"
                            className={`w-full text-[10px] font-medium text-slate-800 bg-white dark:bg-slate-800 dark:text-white border rounded-lg p-1 px-1.5 focus:outline-none focus:ring-1 ${
                              dateValidationError 
                                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' 
                                : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20'
                            }`}
                          />
                        </div>
                      </div>

                      {dateValidationError && (
                        <div className="bg-rose-50 border border-rose-250 text-rose-700 p-2 rounded-lg text-[10.5px] font-semibold flex items-center gap-1.5 animate-pulse" id="date_validation_error_alert">
                          <span>{dateValidationError}</span>
                        </div>
                      )}

                      {/* Display toggle and color choice controls */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/50 dark:border-slate-800 pt-2.5 mt-1 font-sans">
                        <div className="space-y-1 text-left">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Chart Display Mode</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setChartViewType('line')}
                              className={`px-2.5 py-0.5 text-[8.5px] font-bold rounded border transition-all cursor-pointer flex items-center gap-1 ${
                                chartViewType === 'line'
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                              }`}
                              id="btn_chart_style_line"
                            >
                              Line Series
                            </button>
                            <button
                              type="button"
                              onClick={() => setChartViewType('bar')}
                              className={`px-2.5 py-0.5 text-[8.5px] font-bold rounded border transition-all cursor-pointer flex items-center gap-1 ${
                                chartViewType === 'bar'
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                              }`}
                              id="btn_chart_style_bar"
                            >
                              Bar Columns
                            </button>
                          </div>
                        </div>

                        {/* 7-day Future Yield Forecast Toggle */}
                        <div className="space-y-1 text-left">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">7-Day Forecast Line</span>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => setShowForecastLine(!showForecastLine)}
                              className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                showForecastLine ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                              id="btn_toggle_forecast_show"
                              title="Toggle the 7-day future yield forecast projection line"
                            >
                              <span
                                className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                  showForecastLine ? 'translate-x-3.5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-300">
                              {showForecastLine ? 'Visible' : 'Hidden'}
                            </span>
                          </div>
                        </div>

                        {/* Color Choice settings selector menu items */}
                        <div className="space-y-1 text-left">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Color Theme Picker</span>
                          <div className="flex items-center gap-1 flex-wrap" id="color_palette_menu2">
                            <button
                              type="button"
                              onClick={() => setChartColorScheme('emerald-earth')}
                              className={`px-1.5 py-0.5 text-[7.5px] font-extrabold rounded border transition-all cursor-pointer ${
                                chartColorScheme === 'emerald-earth'
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-550 hover:bg-opacity-5'
                              }`}
                              id="btn_palette_emerald_earth"
                            >
                              Emerald & Earth
                            </button>
                            <button
                              type="button"
                              onClick={() => setChartColorScheme('high-contrast')}
                              className={`px-1.5 py-0.5 text-[7.5px] font-extrabold rounded border transition-all cursor-pointer ${
                                chartColorScheme === 'high-contrast'
                                  ? 'border-orange-600 bg-orange-50 text-orange-800 font-black'
                                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-550 hover:bg-opacity-5'
                              }`}
                              id="btn_palette_high_contrast"
                            >
                              High Contrast
                            </button>
                            <button
                              type="button"
                              onClick={() => setChartColorScheme('grayscale')}
                              className={`px-1.5 py-0.5 text-[7.5px] font-extrabold rounded border transition-all cursor-pointer ${
                                chartColorScheme === 'grayscale'
                                  ? 'border-slate-700 bg-slate-100 text-slate-800'
                                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-550 hover:bg-opacity-5'
                              }`}
                              id="btn_palette_grayscale"
                            >
                              Grayscale
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {chartData.length > 0 ? (
                      <div className="space-y-3">
                        {/* Automated High-Priority Yield Alert Feed */}
                        {activeAnomaliesList.length > 0 && (
                          <div className="bg-rose-50/70 border border-rose-250/30 rounded-xl p-2.5 space-y-1.5 mt-1" id="production_trend_anomaly_notifications">
                            <div className="flex items-center gap-1.5 text-rose-800">
                              <span className="flex h-1.5 w-1.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                              </span>
                              <span className="text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                                <span>Automated High-Priority Yield Alert Feed ({activeAnomaliesList.length})</span>
                              </span>
                            </div>
                            <div className="grid grid-cols-1 gap-1 max-h-[110px] overflow-y-auto pr-1">
                              {activeAnomaliesList.map((anomaly, idx) => (
                                <div 
                                  key={idx} 
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[9px] bg-white border border-rose-100 p-2 rounded-lg shadow-3xs hover:border-rose-350 transition-all cursor-help"
                                  title={`7-Day average was ${anomaly.ma} Liters. Registered yield was ${anomaly.quantity} Liters.`}
                                >
                                  <div className="flex items-start gap-1.5">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                    <div>
                                      <p className="font-bold text-slate-800">
                                        Yield Drop Detected for <span className="text-rose-700 font-mono font-bold">{anomaly.animalId}</span> ({anomaly.breed})
                                      </p>
                                      <p className="text-slate-550">
                                        Yield dropped to <span className="font-bold font-mono text-slate-700">{anomaly.quantity}L</span> on <span className="font-semibold">{anomaly.formattedDate}</span>.
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right flex items-center gap-2 sm:flex-col sm:items-end justify-between sm:justify-center shrink-0">
                                    <span className="inline-block px-1 border border-rose-200/50 py-0.5 text-[8px] font-bold text-rose-700 bg-rose-50 rounded">
                                      -{anomaly.drop}% Drop
                                    </span>
                                    <span className="text-[8px] text-slate-400 font-mono font-medium">
                                      7d MA: {anomaly.ma}L
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div 
                          className="h-52 md:h-64 bg-slate-50/50 rounded-xl p-1.5 md:p-3 border border-slate-100 cursor-pointer hover:bg-slate-50/80 transition-all relative"
                          onClick={() => setShowInsightSummary(true)}
                          title="Click the chart to unlock the Insight Summary Card"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            {chartViewType === 'line' ? (
                              <LineChart 
                                data={combinedChartData} 
                                margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                                onClick={() => setShowInsightSummary(true)}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis 
                                  dataKey="formattedDate" 
                                  tick={{ fontSize: 8, fill: '#64748b', fontWeight: 600 }} 
                                  stroke="#cbd5e1"
                                  tickLine={false}
                                  axisLine={false}
                                  minTickGap={25}
                                />
                                <YAxis 
                                  tick={{ fontSize: 8, fill: '#64748b', fontWeight: 600 }} 
                                  stroke="#cbd5e1"
                                  tickLine={false}
                                  axisLine={false}
                                />
                                <Tooltip content={<CustomProductionTooltip />} />
                                
                                {/* Primary Asset Line */}
                                <Line 
                                  type="monotone" 
                                  dataKey="quantity" 
                                  stroke={primaryColor} 
                                  strokeWidth={2.5} 
                                  dot={<CustomProductionDot />}
                                  activeDot={{ r: 5.5 }}
                                  name={`${selectedP.breed} (${selectedP.animalTagId})`}
                                />

                                {/* Optional Comparison Asset Line */}
                                {compareP && (
                                  <Line 
                                    type="monotone" 
                                    dataKey="compareQuantity" 
                                    stroke={compareColor} 
                                    strokeWidth={2.5} 
                                    dot={<CustomProductionDot />}
                                    activeDot={{ r: 5.5 }}
                                    name={`${compareP.breed} (${compareP.animalTagId})`}
                                  />
                                )}

                                {/* Next-7-Days Regression Forecast projection Line */}
                                {showForecastLine && (
                                  <Line
                                    type="monotone"
                                    dataKey="forecastQuantity"
                                    stroke={forecastColor}
                                    strokeWidth={2.5}
                                    strokeDasharray="4 4"
                                    dot={false}
                                    name="7-Day Yield Forecast"
                                  />
                                )}

                                {combinedChartData.length > 2 && (
                                  <Brush 
                                    dataKey="formattedDate" 
                                    height={18} 
                                    stroke="#10b981" 
                                    fill="#ffffff"
                                    travellerWidth={6}
                                    tick={{ fontSize: 7, fill: '#64748b' }}
                                  />
                                )}
                              </LineChart>
                            ) : (
                              <BarChart 
                                data={combinedChartData} 
                                margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                                onClick={() => setShowInsightSummary(true)}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis 
                                  dataKey="formattedDate" 
                                  tick={{ fontSize: 8, fill: '#64748b', fontWeight: 600 }} 
                                  stroke="#cbd5e1"
                                  tickLine={false}
                                  axisLine={false}
                                  minTickGap={25}
                                />
                                <YAxis 
                                  tick={{ fontSize: 8, fill: '#64748b', fontWeight: 600 }} 
                                  stroke="#cbd5e1"
                                  tickLine={false}
                                  axisLine={false}
                                />
                                <Tooltip content={<CustomProductionTooltip />} />
                                
                                {/* Primary Asset Bar */}
                                <Bar 
                                  dataKey="quantity" 
                                  radius={[3, 3, 0, 0]}
                                  name={`${selectedP.breed} (${selectedP.animalTagId})`}
                                >
                                  {combinedChartData.map((entry: any, index: number) => {
                                    const isAnomaly = entry.isAnomaly;
                                    return (
                                      <Cell 
                                        key={`primary-cell-${index}`} 
                                        fill={isAnomaly ? '#ef4444' : primaryColor} 
                                      />
                                    );
                                  })}
                                </Bar>

                                {/* Optional Comparison Asset Bar */}
                                {compareP && (
                                  <Bar 
                                    dataKey="compareQuantity" 
                                    radius={[3, 3, 0, 0]}
                                    name={`${compareP.breed} (${compareP.animalTagId})`}
                                  >
                                    {combinedChartData.map((entry: any, index: number) => {
                                      const isAnomaly = entry.compareIsAnomaly;
                                      return (
                                        <Cell 
                                          key={`compare-cell-${index}`} 
                                          fill={isAnomaly ? '#f43f5e' : compareColor} 
                                        />
                                      );
                                    })}
                                  </Bar>
                                )}

                                {/* Forecast representation in Bar mode */}
                                {showForecastLine && (
                                  <Bar 
                                    dataKey="forecastQuantity" 
                                    fill={forecastColor} 
                                    radius={[3, 3, 0, 0]}
                                    opacity={0.7}
                                    name="7-Day Yield Forecast"
                                  />
                                )}

                                {combinedChartData.length > 2 && (
                                  <Brush 
                                    dataKey="formattedDate" 
                                    height={18} 
                                    stroke="#10b981" 
                                    fill="#ffffff"
                                    travellerWidth={6}
                                    tick={{ fontSize: 7, fill: '#64748b' }}
                                  />
                                )}
                              </BarChart>
                            )}
                          </ResponsiveContainer>
                        </div>

                        {/* Interactive Invite or Active Insight card render */}
                        {!showInsightSummary ? (
                          <div 
                            onClick={() => setShowInsightSummary(true)}
                            className="text-center py-2 bg-slate-50 border border-slate-200/60 rounded-lg text-[9.5px] text-slate-500 font-semibold cursor-pointer hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 select-none"
                            id="insight_card_open_trigger"
                          >
                            <span>Click anywhere on the chart or click here to expand the data analysis <strong>Insight Summary</strong> card</span>
                          </div>
                        ) : (
                          <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-3 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-250 shadow-md border border-slate-800" id="production_insight_summary_card">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                              <div>
                                <h5 className="text-[10.5px] font-extrabold text-emerald-400 uppercase tracking-widest">Selected Period Insight Summary</h5>
                                <p className="text-[8px] text-slate-400 font-medium">Derived automatically based on real yield ledger logs</p>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowInsightSummary(false);
                                }}
                                className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-md transition-all cursor-pointer"
                                aria-label="Dismiss summary"
                                id="btn_dismiss_insight_summary"
                              >
                                Close
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              {/* Primary Animal Stats */}
                              {primarySummary && (
                                <div className="space-y-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">{selectedP.breed} [{selectedP.animalTagId}]</span>
                                    <span className="text-[8px] text-slate-400 font-mono">Primary Series</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-slate-900/40 p-1.5 rounded border border-slate-800">
                                      <p className="text-[8px] text-slate-400 uppercase">Avg Yield</p>
                                      <p className="text-[11px] font-black font-mono text-white">{primarySummary.avgQty} L/day</p>
                                    </div>
                                    <div className="bg-slate-900/40 p-1.5 rounded border border-slate-800">
                                      <p className="text-[8px] text-slate-400 uppercase">Top Yield</p>
                                      <p className="text-[11px] font-black font-mono text-emerald-400">{primarySummary.topDay?.quantity || 0} L</p>
                                      <span className="block text-[7px] text-slate-500 font-mono uppercase">{primarySummary.topDay?.date ? formatMyDate(primarySummary.topDay.date) : ''}</span>
                                    </div>
                                    <div className="bg-slate-900/40 p-1.5 rounded border border-slate-800">
                                      <p className="text-[8px] text-slate-400 uppercase">Total Revenue</p>
                                      <p className="text-[11px] font-black font-mono text-amber-400">{primarySummary.totalRev.toLocaleString()} KES</p>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-slate-800/50">
                                    <div className="bg-slate-900/30 p-1.5 rounded border border-slate-800/60">
                                      <p className="text-[8px] text-slate-400 uppercase font-semibold">Yield Stability (SD)</p>
                                      <p className="text-[11.5px] font-black font-mono text-violet-400">± {primarySummary.stdDev} L</p>
                                      <span className="block text-[7.5px] text-slate-500 font-sans tracking-wide">
                                        {primarySummary.stdDev < 1.5 ? 'Highly Stable' : primarySummary.stdDev < 3.5 ? 'Moderate' : 'Volatile'}
                                      </span>
                                    </div>
                                    <div className="bg-slate-900/30 p-1.5 rounded border border-slate-800/60">
                                      <p className="text-[8px] text-slate-400 uppercase font-semibold">Variance (σ²)</p>
                                      <p className="text-[11.5px] font-black font-mono text-fuchsia-400">{primarySummary.variance} L²</p>
                                      <span className="block text-[7.5px] text-slate-500 font-sans tracking-wide">Yield dispersion</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Comparison Animal Stats */}
                              {compareP && comparisonSummary ? (
                                <div className="space-y-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider">{compareP.breed} [{compareP.animalTagId}]</span>
                                    <span className="text-[8px] text-slate-400 font-mono">Comparison Benchmark</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-slate-900/40 p-1.5 rounded border border-slate-800">
                                      <p className="text-[8px] text-slate-400 uppercase">Avg Yield</p>
                                      <p className="text-[11px] font-black font-mono text-white">{comparisonSummary.avgQty} L/day</p>
                                    </div>
                                    <div className="bg-slate-900/40 p-1.5 rounded border border-slate-800">
                                      <p className="text-[8px] text-slate-400 uppercase">Top Yield</p>
                                      <p className="text-[11px] font-black font-mono text-amber-400">{comparisonSummary.topDay?.quantity || 0} L</p>
                                      <span className="block text-[7px] text-slate-500 font-mono uppercase">{comparisonSummary.topDay?.date ? formatMyDate(comparisonSummary.topDay.date) : ''}</span>
                                    </div>
                                    <div className="bg-slate-900/40 p-1.5 rounded border border-slate-800">
                                      <p className="text-[8px] text-slate-400 uppercase">Total Revenue</p>
                                      <p className="text-[11px] font-black font-mono text-amber-400">{comparisonSummary.totalRev.toLocaleString()} KES</p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-slate-800/50">
                                    <div className="bg-slate-900/30 p-1.5 rounded border border-slate-800/60">
                                      <p className="text-[8px] text-slate-400 uppercase font-semibold">Yield Stability (SD)</p>
                                      <p className="text-[11.5px] font-black font-mono text-violet-400">± {comparisonSummary.stdDev} L</p>
                                      <span className="block text-[7.5px] text-slate-500 font-sans tracking-wide">
                                        {comparisonSummary.stdDev < 1.5 ? 'Highly Stable' : comparisonSummary.stdDev < 3.5 ? 'Moderate' : 'Volatile'}
                                      </span>
                                    </div>
                                    <div className="bg-slate-900/30 p-1.5 rounded border border-slate-800/60">
                                      <p className="text-[8px] text-slate-400 uppercase font-semibold">Variance (σ²)</p>
                                      <p className="text-[11.5px] font-black font-mono text-fuchsia-400">{comparisonSummary.variance} L²</p>
                                      <span className="block text-[7.5px] text-slate-500 font-sans tracking-wide">Yield dispersion</span>
                                    </div>
                                  </div>
                                </div>
                              ) : compareP ? (
                                <div className="flex items-center justify-center p-4 bg-slate-950/60 text-slate-500 text-[8px] uppercase tracking-wider rounded-lg border border-slate-800">
                                  No logs synced for compared livestock in selected range
                                </div>
                              ) : (
                                <div className="flex items-center justify-center p-4 bg-slate-950/30 text-slate-500 text-[9px] font-semibold text-center rounded-lg border border-slate-800">
                                  Select an animal from the compare benchmark dropdown menu to contrast metrics side-by-side
                                </div>
                              )}
                            </div>

                            <p className="text-[8px] text-slate-500 text-right font-mono italic">
                              * Daily averages calculated specifically across the filtered date bracket of existing logs.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-slate-400 bg-slate-50 border border-dashed rounded-xl space-y-1.5">
                        {rawLogs.length > 0 ? (
                          <>
                            <p className="text-[10px] font-bold text-slate-700">No logs match this date range</p>
                            <p className="text-[9px] text-slate-500">
                              Adjust your From/To date filters or click{' '}
                              <button
                                type="button"
                                onClick={() => {
                                  setTrendStartDate('');
                                  setTrendEndDate('');
                                }}
                                className="text-emerald-700 hover:underline font-bold"
                              >
                                Reset Filters
                              </button>{' '}
                              to see all logs.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-[10px] font-bold text-slate-700">No production records yet</p>
                            <p className="text-[9px] text-slate-500">Record an animal yield log using "Log Yield" on this herd above!</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Verification Request Upload forms for physical landowners */}
            <div className="bg-white p-5 rounded-2xl border border-agri-dirt-100 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
                <span>Submit Title Deed for Registry</span>
              </div>

              <form onSubmit={handleDocVerificationSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Accreditation Category</label>
                  <select
                    value={docType}
                    onChange={(e: any) => setDocType(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                  >
                    <option value="TITLE_DEED">Title Deed Verification (Shamba deed)</option>
                    <option value="LIVESTOCK_CERT">Friesian Heifer Passport ID Cert</option>
                    <option value="ID_CARD">National ID Card verification</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Registrar Identification Number</label>
                  <input
                    type="text"
                    required
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="e.g. OL KALOU/TOWNSHIP/2056"
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Deed verification notes</label>
                  <input
                    type="text"
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Describe borders or acreage matches"
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-normal text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1b2b3a] hover:bg-slate-850 text-white font-bold p-3 rounded-xl tracking-wider uppercase text-[10px] cursor-pointer"
                >
                  Verify Ownership Credentials
                </button>

                {verificationSubmittedMsg && (
                  <div className="p-3 bg-emerald-50 rounded text-emerald-800 border border-emerald-300 font-semibold animate-pulse leading-normal">
                    {verificationSubmittedMsg}
                  </div>
                )}
              </form>
            </div>

          </div>

          {/* MAIN GRID MIDDLE + RIGHT AREA (Jumia-style Browsing) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Feed Section Title */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-agri-dirt-100 gap-2 select-none">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-ping glow-active"></span>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-text-base">
                    Active {selectedCounty !== 'All Counties' && `${selectedCounty} Hub`} Listings ({displayedListings.length})
                  </h2>
                </div>
                
                {/* Reordering Sorting controls */}
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsListingModalOpen(true)}
                    className="rounded-lg bg-emerald-700 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-emerald-800"
                  >
                    Add listing
                  </button>
                  <span className="text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap text-[10px] uppercase tracking-wider">Sort by price:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={`p-1.5 pr-6 rounded-lg text-xs font-bold focus:outline-none appearance-none cursor-pointer border transition-colors ${
                      isDarkMode 
                        ? 'bg-slate-805 border-slate-700 text-white' 
                        : 'bg-white border-slate-200 text-slate-850'
                    }`}
                    id="feed_sort_dropdown"
                  >
                    <option value="default font-bold">Default (Newest)</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                  
                  <div className={`p-0.5 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} flex items-center`}>
                    <button 
                      onClick={() => { fetchAllData(); }} 
                      type="button"
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 cursor-pointer" 
                      title="Refresh listing synchronization"
                      id="feed_refresh_sync_btn"
                    >
                      <span className="text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300 px-1.5 py-0.5 whitespace-nowrap">Sync</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Online / Offline Sync Service Dashboard Card */}
              <div className={`mt-4 p-4 rounded-2xl border transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-slate-900/60 border-slate-800' 
                  : 'bg-white border-slate-200'
              } shadow-xs space-y-3`} id="local_sync_status_card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex leading-none">
                      {isOnline ? (
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                      ) : (
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none flex items-center gap-1.5">
                        <span>{isOnline ? 'Online Sync Active' : 'Offline Mode Active'}</span>
                        <span className={`text-[8px] font-bold text-slate-400 px-1 py-0.5 rounded border border-slate-200/50 ${(isOnline ? 'bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50/30 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400')}`}>
                          {isOnline ? 'CLOUDLINK OK' : 'CELL LOCK'}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {isOnline 
                          ? 'Service worker monitoring and caching the latest ShambaLoop marketplace feeds.' 
                          : 'Connection interrupted. Viewing the regional browser sync data.'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Badge Group */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                      cacheDetails.status === 'active' || cacheDetails.status === 'registered'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`} id="sw_status_badge">
                      Service Worker: {cacheDetails.status.toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                      cacheDetails.cachedCount > 0
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`} id="listings_cached_badge">
                      Cached Data: {cacheDetails.cachedCount} Items
                    </span>
                  </div>
                </div>

                {/* Additional Offline Alert Box */}
                {!isOnline && (
                  <div className="p-3 bg-amber-50/70 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-xl flex gap-2 text-[11px] leading-relaxed text-amber-800 dark:text-amber-400 font-sans shadow-inner" id="offline_network_banner_notice">
                    <span className="shrink-0 text-xs font-bold text-amber-900">Notice:</span>
                    <div>
                      <p className="font-bold text-amber-900 dark:text-amber-305">Browsing local backup registry records</p>
                      <p className="text-[10px] text-amber-700 dark:text-amber-500 mt-0.5 leading-normal">
                        You can safely review pedigree tag IDs, soil profiles, active leases, and land listings. Submitting brand new listings or payments will be held in sandbox queues or processed when cell reception returns.
                      </p>
                    </div>
                  </div>
                )}

                {/* Bottom line: Last Synced Time & collapse log button */}
                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">
                    Last Registry Synchronization:{' '}
                    <strong className="font-mono text-slate-700 dark:text-slate-350">
                      {cacheDetails.lastSynced || 'Never synced'}
                    </strong>
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSyncLogList(!showSyncLogList)}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer transition-all uppercase tracking-wide text-[9px] flex items-center gap-0.5"
                      id="toggle_sw_logs_btn"
                    >
                      {showSyncLogList ? 'Hide Connection Logs ▲' : 'Show Connection Logs ▼'}
                    </button>
                  </div>
                </div>

                {/* Sync Event Log list */}
                {showSyncLogList && (
                  <div className="p-3 bg-slate-950 dark:bg-black/45 rounded-xl font-mono text-[9px] text-emerald-400 max-h-36 overflow-y-auto space-y-1 border border-white/5 shadow-inner" id="sw_connection_logs_panel">
                    <p className="text-slate-500 pb-1 border-b border-white/5 font-sans font-bold uppercase tracking-wide text-[8px] flex justify-between items-center">
                      <span>Sync Server Event Streams</span>
                      <span className="animate-pulse text-emerald-500">FEED LOGS ACTIVE</span>
                    </p>
                    {cacheDetails.syncLog.map((log, idx) => (
                      <p key={idx} className="leading-snug truncate">
                        {log}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {networkLoading && listings.length === 0 ? (
                <BrandedLoader label="Syncing ShambaLoop Trust Registries..." className="py-20" />
              ) : displayedListings.length === 0 ? (
                <BrandedEmptyState
                  type="listings"
                  message={`No active land plots, livestock options, or contract positions matching filters in ${selectedCounty === 'All Counties' ? 'any county' : `${selectedCounty} County`}. Make a listing to start!`}
                  ctaText="Add New Listing"
                  onCtaClick={() => setIsListingModalOpen(true)}
                  className="my-4"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {displayedListings.map((listing) => (
                    <div key={listing.id}>
                      <ListingCard
                        listing={listing}
                        currentUserRole={currentUser.role}
                        onAction={(item) => {
                          setSelectedListingForAction(item);
                          setIsPaymentModalOpen(true);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Farm Performance summary page at bottom of main screen */}
            <div className="bg-white rounded-2xl border border-agri-dirt-100 shadow-xs p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="font-bold text-xs uppercase tracking-widest text-[#2f4f1a] flex items-center gap-1.5">
                  Kenyan Region Cultivation Indices
                </h3>
                <span className="text-[9px] text-[#41b045] font-extrabold uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Live Soil Trends</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
                <div className="p-3 bg-[#fbfaf8] border rounded-xl leading-relaxed">
                  <span className="font-bold text-amber-900 uppercase tracking-wide text-[9px] block">Nyandarua Zone (Loam soil)</span>
                  <p className="text-[10px] text-slate-600 mt-1">Potatoes are currently pulling record pricing: 4,200 KES per 90kg bag in Nairobi market depots.</p>
                </div>
                <div className="p-3 bg-[#f9faf6] border rounded-xl leading-relaxed">
                  <span className="font-bold text-emerald-900 uppercase tracking-wide text-[9px] block">Kiambu Milk Sheds</span>
                  <p className="text-[10px] text-slate-600 mt-1">Brookside dairy cooperatives raised farmgate procurement pay rate to 58 KES per Liter of chilled dairy yields.</p>
                </div>
                <div className="p-3 bg-[#faf8f5] dark:bg-slate-900/40 border rounded-xl leading-relaxed">
                  <span className="font-bold text-amber-900 dark:text-amber-500 uppercase tracking-wide text-[9px] block">Trans Nzoia Silages</span>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1">Maize harvesting starts mid-September. Tractor leasing demands expected to spike by 35% in Kitale.</p>
                </div>
              </div>
            </div>

          </div>

        </section>}

      </main>

      {/* Logged-in workspaces keep the footer unobtrusive: brand mark only. */}
      <footer className="mt-10 flex justify-center border-t border-border-base bg-card-bg py-4" id="shambaloop_custom_footer">
        <Logo size={30} variant="symbol" isDarkMode={isDarkMode} />
        {false && <>
        {/* Newsletter Section */}
        <div className="bg-slate-950/80 py-8 border-b border-slate-800" id="newsletter_section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-emerald-500 rounded-sm"></span>
                  New to ShambaLoop?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                  Subscribe to our newsletter to get updates on our latest offers, you can unsubscribe at any time as described in{" "}
                  <button onClick={() => openFooterDoc('Privacy Notice')} className="text-emerald-400 hover:underline hover:text-emerald-300 font-semibold cursor-pointer">
                    Privacy Policy
                  </button>.
                </p>
                
                {/* Checkboxes & Legal Agreement Text */}
                <div className="space-y-2.5 pt-3 max-w-xl">
                  <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-slate-300 select-none">
                    <input 
                      type="checkbox" 
                      checked={newsLegalAgreed} 
                      onChange={(e) => {
                        setNewsLegalAgreed(e.target.checked);
                        setNewsSuccessMsg('');
                      }}
                      className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>
                      To subscribe to our newsletter, you must first read and agree to ShambaLoop's{" "}
                      <button onClick={() => openFooterDoc('Terms and Conditions')} className="text-emerald-400 underline hover:text-emerald-300 font-bold cursor-pointer">
                        I accept the Legal Terms
                      </button>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-slate-300 select-none">
                    <input 
                      type="checkbox" 
                      checked={newsPrivacyAgreed} 
                      onChange={(e) => {
                        setNewsPrivacyAgreed(e.target.checked);
                        setNewsSuccessMsg('');
                      }}
                      className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>
                      I agree to ShambaLoop’s{" "}
                      <button onClick={() => openFooterDoc('Privacy Notice')} className="text-emerald-400 underline hover:text-emerald-300 font-bold cursor-pointer">
                        Privacy and Cookie Policy
                      </button>. You can unsubscribe from newsletters at any time.
                    </span>
                  </label>
                </div>
              </div>

              {/* Email Form & Gender selection */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="email" 
                    placeholder="Enter E-mail Address" 
                    value={newsEmail}
                    onChange={(e) => {
                      setNewsEmail(e.target.value);
                      setNewsSuccessMsg('');
                    }}
                    className="flex-1 p-3 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => {
                        if (!newsEmail) {
                          setNewsSuccessMsg('Error: Please enter a valid email address first.');
                        } else if (!newsLegalAgreed || !newsPrivacyAgreed) {
                          setNewsSuccessMsg('Error: You must check both boxes to agree to terms.');
                        } else {
                          setNewsSuccessMsg('Success: Subscribed as Male successfully! Welcome to the ShambaLoop cooperative newsletter digest.');
                        }
                      }}
                      className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-[11px] uppercase rounded-lg cursor-pointer flex-1 sm:flex-none transition-all shadow-md"
                    >
                      MALE
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        if (!newsEmail) {
                          setNewsSuccessMsg('Error: Please enter a valid email address first.');
                        } else if (!newsLegalAgreed || !newsPrivacyAgreed) {
                          setNewsSuccessMsg('Error: You must check both boxes to agree to terms.');
                        } else {
                          setNewsSuccessMsg('Success: Subscribed as Female successfully! Welcome to the ShambaLoop cooperative newsletter digest.');
                        }
                      }}
                      className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-[11px] uppercase rounded-lg cursor-pointer flex-1 sm:flex-none transition-all shadow-md"
                    >
                      FEMALE
                    </button>
                  </div>
                </div>

                {newsSuccessMsg && (
                  <div className={`p-3 rounded-lg text-xs font-bold border ${newsSuccessMsg.startsWith('Error') ? 'bg-red-950/60 text-red-300 border-red-800' : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'}`}>
                    {newsSuccessMsg}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Multi-column menus section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="footer_menu_grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* COLUMN 1: NEED HELP? */}
            <div className="space-y-3">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">NEED HELP?</h4>
              <ul className="space-y-2 text-slate-300 font-medium font-sans">
                <li><button onClick={() => openFooterDoc('Chat with us')} className="hover:text-emerald-400 transition hover:underline text-left cursor-pointer">Chat with us</button></li>
                <li><button onClick={() => openFooterDoc('Help Center')} className="hover:text-emerald-400 transition hover:underline text-left cursor-pointer">Help Center</button></li>
                <li className="text-slate-300">
                  <span className="block text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Contact Us Via:</span>
                  <a href="tel:+254728606684" className="font-mono text-emerald-400 font-bold text-xs block mt-0.5 tracking-wide hover:underline transition">+254728606684</a>
                </li>
                <li className="text-slate-300 text-[11px] leading-relaxed pt-1 border-t border-slate-800">
                  <span className="block text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Visit Us:</span>
                  <span className="font-bold text-white block text-[11px]">Kisumu & Lakeside Basin Hub</span>
                  Milimani Estate, Riat Hills, Kisumu CBD, Yacht Club, Tom Mboya.
                </li>
              </ul>
            </div>

            {/* COLUMN 2: ABOUT SHAMBALOOP */}
            <div className="space-y-3">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">ABOUT SHAMBALOOP</h4>
              <ul className="space-y-2 text-slate-300 font-medium text-left">
                <li><button onClick={() => openFooterDoc('About Us')} className="hover:text-emerald-400 transition hover:underline text-left cursor-pointer">About Us & Cooperative Charter</button></li>
                <li>
                  <button 
                    onClick={() => openFooterDoc('FAQ')} 
                    className="text-emerald-400 font-bold hover:text-emerald-300 transition hover:underline text-left cursor-pointer"
                    id="footer_faq_link_btn"
                  >
                    Frequently Asked Questions (FAQ)
                  </button>
                </li>
                <li><button onClick={() => openFooterDoc('Terms and Conditions')} className="hover:text-emerald-400 transition hover:underline text-left cursor-pointer">Terms & Conditions</button></li>
                <li><button onClick={() => openFooterDoc('Privacy Notice')} className="hover:text-emerald-400 transition hover:underline text-left cursor-pointer">Privacy & Data Notice</button></li>
              </ul>
            </div>

            {/* COLUMN 3: CONTACT US */}
            <div className="space-y-3 bg-slate-800/60 p-4 rounded-xl border border-slate-700/80">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider border-b border-slate-700/80 pb-1.5">Contact Us</h4>
              <div className="space-y-2.5 text-slate-300">
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase font-extrabold tracking-wider">Business Entity</span>
                  <p className="font-bold text-white text-xs">ShambaLoop Kenya Ltd.</p>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase font-extrabold tracking-wider">Headquarters</span>
                  <p className="text-[11px] text-slate-300 leading-normal">
                    Milimani Estate, Riat Hills, Kisumu CBD<br />
                    Postal: P.O. Box 1178-40100 Kisumu, Kenya
                  </p>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase font-extrabold tracking-wider">Phone Support</span>
                  <a href="tel:+254728606684" className="font-mono text-emerald-400 text-xs font-bold hover:underline transition block">+254728606684</a>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase font-extrabold tracking-wider">WhatsApp Business</span>
                  <a href="https://wa.me/254728606684" target="_blank" rel="noreferrer" className="font-mono text-emerald-400 text-xs font-bold hover:underline block">+254728606684</a>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom copyright section with Logo & Tagline */}
        <div className="bg-slate-950 py-8 border-t border-slate-800 text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Logo size={38} variant="footer" isDarkMode={true} />
            </div>
            <div className="text-center md:text-right space-y-1">
              <p className="text-xs text-slate-300">© 2026 ShambaLoop. All Rights Reserved. Kenya's Premier Agritech Trust Ecosystem.</p>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-display">Connecting People, Land, Livestock, and Opportunity</p>
            </div>
          </div>
        </div>
        </>}
      </footer>

      {/* RENDER MODAL: Catalog asset creation */}
      {isListingModalOpen && (
        <CreateListingModal
          onClose={() => setIsListingModalOpen(false)}
          onSubmit={handleAddNewListing}
          ownerId={currentUser.id}
          ownerName={currentUser.name}
          ownerPhone={currentUser.phone}
        />
      )}

      {/* RENDER MODALS: Payment gate and agreements sealing */}
      {isPaymentModalOpen && selectedListingForAction && (
        <EscrowPaymentModal
          listing={selectedListingForAction}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedListingForAction(null);
          }}
          currentUserPhone={currentUser.phone}
          currentUserId={currentUser.id}
          onPaymentSuccess={handlePaymentCompleted}
        />
      )}

      {/* RENDER MODAL: Dynamic Footer Policies & Documentation Viewer */}
      {activeFooterDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none" id="footer_doc_modal_container">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]" id="footer_doc_modal">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-6 bg-emerald-500 rounded-sm"></span>
                <h3 className="font-sans font-extrabold uppercase tracking-wider text-xs text-slate-800 dark:text-white">
                  {activeFooterDoc.title}
                </h3>
              </div>
              <button 
                onClick={() => setActiveFooterDoc(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition px-2 py-1 rounded text-xs cursor-pointer font-bold"
                id="btn_close_footer_doc"
              >
                Close [X]
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto font-sans leading-relaxed text-sm text-slate-600 dark:text-slate-300 space-y-4 max-h-[60vh] custom-scrollbar">
              {footerDocLoading ? (
                <div className="space-y-4 animate-pulse pt-1" id="footer_doc_skeleton_wrapper">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3"></div>
                  <div className="space-y-2 pt-2">
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-full"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-5/6"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-11/12"></div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 pb-1">
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-2/5"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-4/5"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
                  </div>
                </div>
              ) : (
                activeFooterDoc.content
              )}
            </div>

            {/* Footer */}
            <div className="p-5 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-150 dark:border-slate-800/80 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveFooterDoc(null)}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 cursor-pointer text-white rounded-xl shadow-md transition-all uppercase tracking-wider"
                id="btn_dismiss_footer_doc"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
