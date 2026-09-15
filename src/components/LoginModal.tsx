import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Logo } from './BrandAssets';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole?: UserRole | 'dashboard' | null;
  usersList: User[];
  onDemoLogin: (userId: string) => Promise<{ success: boolean; error?: string }>;
  onCustomLogin: (phone: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  onCustomRegister: (userData: {
    name: string;
    phone: string;
    email?: string;
    role: UserRole;
    county: string;
  }) => Promise<{ success: boolean; error?: string }>;
  isDarkMode?: boolean;
}

export default function LoginModal({
  isOpen,
  onClose,
  targetRole = null,
  usersList,
  onDemoLogin,
  onCustomLogin,
  onCustomRegister,
  isDarkMode = false
}: LoginModalProps) {
  const demoModeEnabled = import.meta.env.DEV;
  const [tab, setTab] = useState<'quick' | 'phone' | 'register'>(demoModeEnabled ? 'quick' : 'phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [countyInput, setCountyInput] = useState('Nyandarua');
  const [roleInput, setRoleInput] = useState<UserRole>(() => {
    if (targetRole && targetRole !== 'dashboard') {
      return targetRole;
    }
    return UserRole.FARMER;
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (targetRole && targetRole !== 'dashboard') {
      setRoleInput(targetRole);
    }
    if (targetRole === 'dashboard') setTab(demoModeEnabled ? 'quick' : 'phone');
    setErrorMsg('');
  }, [targetRole, isOpen]);

  if (!isOpen) return null;

  const handleDemoLogin = async (user: User) => {
    setErrorMsg('');
    setLoading(true);
    const result = await onDemoLogin(user.id);
    setLoading(false);
    if (result.success) onClose();
    else setErrorMsg(result.error || 'Demo sign-in could not be completed.');
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!phoneInput.trim()) {
      setErrorMsg('Please enter your phone number.');
      return;
    }
    setLoading(true);
    const result = await onCustomLogin(phoneInput.trim(), passwordInput || undefined);
    setLoading(false);
    if (!result.success) {
      setErrorMsg(result.error || 'User not found. Try registering a new account!');
    } else {
      onClose();
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!nameInput.trim() || !phoneInput.trim()) {
      setErrorMsg('Name and phone number are required.');
      return;
    }
    setLoading(true);
    const result = await onCustomRegister({
      name: nameInput.trim(),
      phone: phoneInput.trim(),
      email: emailInput.trim() || undefined,
      role: roleInput,
      county: countyInput
    });
    setLoading(false);
    if (!result.success) {
      setErrorMsg(result.error || 'Registration failed.');
    } else {
      onClose();
    }
  };

  // Filter seed / quick users by role if specified
  const roleDisplayTitle = () => {
    if (targetRole === UserRole.INVESTOR) return 'Log In as Investor';
    if (targetRole === UserRole.FARMER) return 'Log In as Farmer';
    if (targetRole === UserRole.VETERINARIAN) return 'Log In as Veterinarian';
    if (targetRole === 'dashboard') return 'Log In to Dashboard';
    return 'Log In to ShambaLoop';
  };

  const investorUsers = usersList.filter(u => u.role === UserRole.INVESTOR);
  const farmerUsers = usersList.filter(u => u.role === UserRole.FARMER);
  const landownerUsers = usersList.filter(u => u.role === UserRole.LANDOWNER);
  const adminUsers = usersList.filter(u => u.role === UserRole.ADMIN);
  const veterinarianUsers = usersList.filter(u => u.role === UserRole.VETERINARIAN);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none" id="login_modal_container">
      <div className="relative w-full max-w-md bg-card-bg text-text-base rounded-3xl shadow-2xl border border-border-base overflow-hidden flex flex-col max-h-[90vh]" id="login_modal_box">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border-base flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Logo size={36} variant="symbol" />
            <div>
              <h2 className="text-base font-bold font-display text-slate-900 dark:text-white">
                {roleDisplayTitle()}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Access your agricultural cooperative workspace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold px-2 py-1 rounded cursor-pointer"
            id="btn_close_login_modal"
          >
            Close [X]
          </button>
        </div>

        {/* Tab switcher */}
        <div className="p-4 pb-0">
          <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {demoModeEnabled && <button
              onClick={() => { setTab('quick'); setErrorMsg(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'quick' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
              id="modal_tab_quick"
            >
              1-Click Role Login
            </button>}
            <button
              onClick={() => { setTab('phone'); setErrorMsg(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'phone' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
              id="modal_tab_phone"
            >
              Phone Login
            </button>
            <button
              onClick={() => { setTab('register'); setErrorMsg(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'register' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
              id="modal_tab_register"
            >
              Register
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-xl" id="login_modal_error">
              {errorMsg}
            </div>
          )}

          {/* TAB 1: QUICK ROLE 1-CLICK SELECT */}
          {tab === 'quick' && (
            <div className="space-y-3" id="quick_role_select_list">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {targetRole === 'dashboard' ? 'Choose a seeded demo account to explore its dashboard:' : 'Select an account profile below to instantly log in:'}
              </p>

              {/* Investor Profile */}
              {(targetRole === null || targetRole === UserRole.INVESTOR || targetRole === 'dashboard') && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Investor Profiles
                  </span>
                  {investorUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => void handleDemoLogin(user)}
                      disabled={loading}
                      className="w-full p-3 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 hover:border-purple-500 hover:shadow-xs transition-all text-left flex items-center justify-between cursor-pointer"
                      id={`quick_user_btn_${user.id}`}
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{user.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {user.county} • Budget: KES {user.investmentBudgetKES?.toLocaleString() || '1.2M'}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-600 text-white">
                        Enter Investor
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Farmer Profile */}
              {(targetRole === null || targetRole === UserRole.FARMER || targetRole === 'dashboard') && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Farmer Profiles
                  </span>
                  {farmerUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => void handleDemoLogin(user)}
                      disabled={loading}
                      className="w-full p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-500 hover:shadow-xs transition-all text-left flex items-center justify-between cursor-pointer"
                      id={`quick_user_btn_${user.id}`}
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{user.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {user.county} • {user.farmSpecialties?.join(', ') || 'Dairy Breeding'}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-600 text-white">
                        Enter Farmer
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Landowner Profile */}
              {(targetRole === null || targetRole === UserRole.LANDOWNER || targetRole === 'dashboard') && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Landowner Profiles
                  </span>
                  {landownerUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => void handleDemoLogin(user)}
                      disabled={loading}
                      className="w-full p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-500 hover:shadow-xs transition-all text-left flex items-center justify-between cursor-pointer"
                      id={`quick_user_btn_${user.id}`}
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{user.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {user.county} • 12 Acres Available for Lease
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-600 text-white">
                        Enter Landowner
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Admin / Supervisor Profile */}
              {(targetRole === null || targetRole === UserRole.ADMIN || targetRole === 'dashboard') && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    System Supervisor / Dashboard Admin
                  </span>
                  {adminUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => void handleDemoLogin(user)}
                      disabled={loading}
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:border-slate-500 hover:shadow-xs transition-all text-left flex items-center justify-between cursor-pointer"
                      id={`quick_user_btn_${user.id}`}
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{user.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {user.county} • Cooperative Supervisor
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-900 dark:bg-slate-700 text-white">
                        Enter Admin
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Veterinary Profile */}
              {(targetRole === UserRole.VETERINARIAN || targetRole === 'dashboard') && veterinarianUsers.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Veterinary Profiles
                  </span>
                  {veterinarianUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => void handleDemoLogin(user)}
                      disabled={loading}
                      className="w-full p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-500 hover:shadow-xs transition-all text-left flex items-center justify-between cursor-pointer"
                      id={`quick_user_btn_${user.id}`}
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{user.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{user.county} · Veterinary field services</div>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-600 text-white">Enter Veterinary</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PHONE NUMBER LOGIN */}
          {tab === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4" id="modal_phone_login_form">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0712345678"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full p-3 text-sm rounded-xl border border-border-base bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  id="modal_login_phone_input"
                />
              </div>

              {targetRole === 'dashboard' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full p-3 text-sm rounded-xl border border-border-base bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    id="modal_login_password_input"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50"
                id="modal_login_submit_btn"
              >
                {loading ? 'Logging in...' : 'Log In to Dashboard'}
              </button>
            </form>
          )}

          {/* TAB 3: NEW ACCOUNT REGISTRATION */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3" id="modal_register_form">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kevin Ochieng"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-border-base bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  id="modal_reg_name"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0722334455"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-border-base bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  id="modal_reg_phone"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. kevin@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-border-base bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  id="modal_reg_email"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    County
                  </label>
                  <select
                    value={countyInput}
                    onChange={(e) => setCountyInput(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-border-base bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    id="modal_reg_county"
                  >
                    <option value="Nyandarua">Nyandarua</option>
                    <option value="Kisumu">Kisumu</option>
                    <option value="Uasin Gishu">Uasin Gishu</option>
                    <option value="Nairobi">Nairobi</option>
                    <option value="Kiambu">Kiambu</option>
                    <option value="Nakuru">Nakuru</option>
                    <option value="Meru">Meru</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Role
                  </label>
                  <select
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value as any)}
                    className="w-full p-2.5 text-xs rounded-xl border border-border-base bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    id="modal_reg_role"
                  >
                    <option value={UserRole.FARMER}>Farmer</option>
                    <option value={UserRole.INVESTOR}>Investor</option>
                    <option value={UserRole.LANDOWNER}>Landowner</option>
                    <option value={UserRole.VETERINARIAN}>Veterinarian</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50"
                id="modal_reg_submit_btn"
              >
                {loading ? 'Creating Account...' : 'Sign Up & Enter'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
