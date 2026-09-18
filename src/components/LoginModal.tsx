import { TermsModalContent } from '../content/termsContent';
import { PrivacyModalContent } from '../content/privacyContent';
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Logo } from './BrandAssets';
import { Eye, EyeOff, Upload, CheckCircle2, FileText, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

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
    password: string;
    documents?: Record<string, { name: string; dataUrl: string }>;
    confirmPassword: string;
    termsAccepted: boolean;
    privacyAccepted: boolean;
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
  const demoModeEnabled = import.meta.env.MODE === 'test';
  const [tab, setTab] = useState<'quick' | 'phone' | 'register' | 'forgot'>(demoModeEnabled ? 'quick' : 'phone');
  
  // Login fields
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register fields
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [countyInput, setCountyInput] = useState('Nyandarua');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [policy, setPolicy] = useState<'terms' | 'privacy' | null>(null);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [roleInput, setRoleInput] = useState<UserRole>(() => {
    if (targetRole && targetRole !== 'dashboard') {
      return targetRole;
    }
    return UserRole.FARMER;
  });

  // Forgot password fields
  const [recoveryRequested, setRecoveryRequested] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');

  // Document uploads for KYC (Farmers & Vets)
  const [uploadedDocs, setUploadedDocs] = useState<{
    passportPhoto?: { name: string; size: string; dataUrl: string };
    idFront?: { name: string; size: string; dataUrl: string };
    idBack?: { name: string; size: string; dataUrl: string };
    chiefLetter?: { name: string; size: string; dataUrl: string };
    certifications?: { name: string; size: string; dataUrl: string };
  }>({});

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (targetRole && targetRole !== 'dashboard') {
      setRoleInput(targetRole);
    }
    if (targetRole === 'dashboard') setTab(demoModeEnabled ? 'quick' : 'phone');
    setErrorMsg('');
    setForgotSuccessMsg('');
  }, [targetRole, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (
    field: 'passportPhoto' | 'idFront' | 'idBack' | 'chiefLetter' | 'certifications',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024 || !['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) { setErrorMsg('Choose a JPEG, PNG, or PDF file no larger than 2 MB.'); return; }
    const reader = new FileReader();
    reader.onerror = () => setErrorMsg('Unable to read the selected file.');
    reader.onload = () => {
      const sizeKB = Math.round(file.size / 1024);
      setUploadedDocs(prev => ({
        ...prev,
        [field]: {
          name: file.name,
          size: `${sizeKB} KB`,
          dataUrl: reader.result as string
        }
      }));
    };
    reader.readAsDataURL(file);
  };

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
    if (!nameInput.trim() || !phoneInput.trim() || !passwordInput) {
      setErrorMsg('Name, phone number, and password are required.');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setErrorMsg('Passwords do not match. Please re-enter your password to confirm.');
      return;
    }
    if (passwordInput.length < 12) {
      setErrorMsg('Password must be at least 12 characters with uppercase, lowercase, number, and special character.');
      return;
    }
    if (!termsAgreed) {
      setErrorMsg('You must agree to the Terms and Conditions and Privacy Policy to register.');
      return;
    }

    const documentsMap: Record<string, { name: string; dataUrl: string }> = {};
    const fields = { passportPhoto: 'passport_photo', idFront: 'national_id_front', idBack: 'national_id_back', chiefLetter: 'chief_letter', certifications: 'certifications' } as const;
    if (roleInput !== UserRole.INVESTOR) {
      for (const [field, key] of Object.entries(fields)) {
        const document = uploadedDocs[field as keyof typeof uploadedDocs];
        if (!document) { setErrorMsg('Upload all five required identity documents.'); return; }
        documentsMap[key] = { name: document.name, dataUrl: document.dataUrl };
      }
    }

    setLoading(true);
    const result = await onCustomRegister({
      name: nameInput.trim(),
      phone: phoneInput.trim(),
      email: emailInput.trim() || undefined,
      role: roleInput,
      county: countyInput,
      password: passwordInput,
      confirmPassword: confirmPasswordInput,
      termsAccepted: termsAgreed,
      privacyAccepted: termsAgreed,
      documents: Object.keys(documentsMap).length > 0 ? documentsMap : undefined
    });
    setLoading(false);
    if (!result.success) {
      setErrorMsg(result.error || 'Registration failed.');
    } else {
      onClose();
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setForgotSuccessMsg('');
    if (!recoveryRequested) {
      setLoading(true);
      try {
        const response = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: forgotPhone }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setRecoveryRequested(true); setForgotSuccessMsg(data.message);
      } catch (error) { setErrorMsg((error as Error).message || 'Recovery unavailable.'); }
      finally { setLoading(false); }
      return;
    }
    if (!forgotPhone.trim() || !forgotNewPassword) {
      setErrorMsg('Please enter your registered phone number and new password.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }
    if (forgotNewPassword.length < 12) {
      setErrorMsg('Password must be at least 12 characters with uppercase, lowercase, number, and special character.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: recoveryToken, newPassword: forgotNewPassword, confirmPassword: forgotConfirmPassword })
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setErrorMsg(data.error || 'Password reset could not be completed.');
      } else {
        setForgotSuccessMsg('Password successfully updated! Redirecting to sign in...');
        setPhoneInput(forgotPhone.trim());
        setPasswordInput(forgotNewPassword);
        setTimeout(() => {
          setTab('phone');
          setForgotSuccessMsg('');
        }, 1500);
      }
    } catch {
      setLoading(false);
      setErrorMsg('Authentication server is unavailable. Please try again.');
    }
  };

  const roleDisplayTitle = () => {
    if (tab === 'forgot') return 'Reset Your Password';
    if (targetRole === UserRole.INVESTOR) return 'Log In as Investor';
    if (targetRole === UserRole.FARMER) return 'Log In as Farmer';
    if (targetRole === UserRole.VETERINARIAN) return 'Log In as Veterinarian';
    if (targetRole === 'dashboard') return 'Log In to Dashboard';
    return 'Log In to ShambaLoop';
  };

  const investorUsers = usersList.filter(u => u.role === UserRole.INVESTOR);
  const farmerUsers = usersList.filter(u => u.role === UserRole.FARMER);
  const adminUsers = usersList.filter(u => u.role === UserRole.ADMIN);
  const veterinarianUsers = usersList.filter(u => u.role === UserRole.VETERINARIAN);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none" id="login_modal_container">
      <div className="relative w-full max-w-lg bg-card-bg text-text-base rounded-3xl shadow-2xl border border-border-base overflow-hidden flex flex-col max-h-[90vh]" id="login_modal_box">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border-base flex justify-between items-start shrink-0">
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
        <div className="p-4 pb-0 shrink-0">
          <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {demoModeEnabled && (
              <button
                onClick={() => { setTab('quick'); setErrorMsg(''); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  tab === 'quick' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
                id="modal_tab_quick"
              >
                1-Click Role Login
              </button>
            )}
            <button
              onClick={() => { setTab('phone'); setErrorMsg(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'phone' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
              id="modal_tab_phone"
            >
              Sign In
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
            {tab === 'forgot' && (
              <button
                onClick={() => { setTab('forgot'); }}
                className="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all bg-emerald-600 text-white shadow-xs"
                id="modal_tab_forgot"
              >
                Reset Password
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {forgotSuccessMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{forgotSuccessMsg}</span>
            </div>
          )}

          {/* TAB 1: 1-CLICK DEMO ROLES (One per role) */}
          {tab === 'quick' && demoModeEnabled && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Choose a seeded demo account to explore its dashboard:
              </p>

              {/* Farmer Profile */}
              {farmerUsers.slice(0, 1).map(user => (
                <button
                  key={user.id}
                  onClick={() => void handleDemoLogin(user)}
                  disabled={loading}
                  className="w-full p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-500 hover:shadow-sm transition-all text-left flex items-center justify-between cursor-pointer"
                  id={`quick_user_btn_${user.id}`}
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      {user.name}
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full">Farmer</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {user.county} County • Livestock & Crop Management
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition">
                    Enter Farmer
                  </span>
                </button>
              ))}

              {/* Investor Profile */}
              {investorUsers.slice(0, 1).map(user => (
                <button
                  key={user.id}
                  onClick={() => void handleDemoLogin(user)}
                  disabled={loading}
                  className="w-full p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-500 hover:shadow-sm transition-all text-left flex items-center justify-between cursor-pointer"
                  id={`quick_user_btn_${user.id}`}
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      {user.name}
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full">Investor</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {user.county} • Capital Allocation & Shared Yields
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition">
                    Enter Investor
                  </span>
                </button>
              ))}

              {/* Veterinary Profile */}
              {veterinarianUsers.slice(0, 1).map(user => (
                <button
                  key={user.id}
                  onClick={() => void handleDemoLogin(user)}
                  disabled={loading}
                  className="w-full p-3.5 rounded-2xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/20 hover:border-teal-500 hover:shadow-sm transition-all text-left flex items-center justify-between cursor-pointer"
                  id={`quick_user_btn_${user.id}`}
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      {user.name}
                      <span className="text-[10px] bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-semibold px-2 py-0.5 rounded-full">Veterinarian</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {user.county} • Clinical Livestock Health Care
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition">
                    Enter Vet
                  </span>
                </button>
              ))}

              {/* Admin Profile */}
              {adminUsers.slice(0, 1).map(user => (
                <button
                  key={user.id}
                  onClick={() => void handleDemoLogin(user)}
                  disabled={loading}
                  className="w-full p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:border-slate-500 hover:shadow-sm transition-all text-left flex items-center justify-between cursor-pointer"
                  id={`quick_user_btn_${user.id}`}
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      {user.name}
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-2 py-0.5 rounded-full">Admin</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {user.county} • Regulatory Compliance & KYC Supervisor
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-700 text-white transition">
                    Enter Admin
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* TAB 2: PHONE & PASSWORD LOGIN */}
          {tab === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4" id="modal_phone_login_form">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Kenyan Mobile Number
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

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setTab('forgot'); setForgotPhone(phoneInput); setErrorMsg(''); }}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-500 transition cursor-pointer"
                    id="btn_forgot_password"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your account password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full p-3 pr-10 text-sm rounded-xl border border-border-base bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    id="modal_login_password_input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                    id="toggle_login_password_visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50"
                id="modal_login_submit_btn"
              >
                {loading ? 'Signing In...' : 'Log In to Dashboard'}
              </button>
            </form>
          )}

          {/* TAB 3: NEW ACCOUNT REGISTRATION */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5" id="modal_register_form">
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
                  Kenyan Mobile Number
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
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. kevin@shambaloop.ke"
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
                    <option value={UserRole.VETERINARIAN}>Veterinarian</option>
                  </select>
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={12}
                      autoComplete="new-password"
                      placeholder="12+ characters"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full p-2.5 pr-8 text-xs rounded-xl border border-border-base bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      id="modal_reg_password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                      id="toggle_reg_password"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={12}
                      autoComplete="new-password"
                      placeholder="Confirm password"
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      className="w-full p-2.5 pr-8 text-xs rounded-xl border border-border-base bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      id="modal_reg_confirm_password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title={showConfirmPassword ? 'Hide Password' : 'Show Password'}
                      id="toggle_reg_confirm_password"
                    >
                      {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* ROLE-SPECIFIC VERIFICATION DOCUMENT UPLOADS */}
              {(roleInput === UserRole.FARMER || roleInput === UserRole.VETERINARIAN) && (
                <div className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <ShieldCheck className="h-4 w-4" />
                    <span>
                      {roleInput === UserRole.FARMER ? 'Farmer Verification Documents' : 'Veterinarian Accreditation Documents'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                    {roleInput === UserRole.FARMER
                      ? 'Upload your passport photo, National ID (both sides), letter from your local Chief, and relevant agricultural certifications for trust vetting.'
                      : 'Upload your passport photo, National ID (both sides), and Kenya Veterinary Board (KVB) accreditation / degree certificates.'}
                  </p>

                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {/* Passport Photo */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                        <div className="truncate">
                          <span className="font-semibold block text-slate-900 dark:text-white">Passport Photo</span>
                          <span className="text-[10px] text-slate-500">
                            {uploadedDocs.passportPhoto ? `${uploadedDocs.passportPhoto.name} (${uploadedDocs.passportPhoto.size})` : 'Clear front-facing portrait'}
                          </span>
                        </div>
                      </div>
                      <label className="shrink-0 ml-2 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10px] font-bold cursor-pointer transition">
                        {uploadedDocs.passportPhoto ? 'Change' : 'Upload'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          className="hidden"
                          onChange={(e) => handleFileUpload('passportPhoto', e)}
                          id="upload_passport_photo"
                        />
                      </label>
                    </div>

                    {/* ID Photos Both Sides */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                        <div className="truncate">
                          <span className="font-semibold block text-slate-900 dark:text-white text-[11px]">ID Front Side</span>
                          <span className="text-[9px] text-slate-500 truncate block">
                            {uploadedDocs.idFront ? uploadedDocs.idFront.name : 'Photo & details'}
                          </span>
                        </div>
                        <label className="shrink-0 ml-1.5 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10px] font-bold cursor-pointer">
                          {uploadedDocs.idFront ? '✓' : 'Upload'}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,application/pdf"
                            className="hidden"
                            onChange={(e) => handleFileUpload('idFront', e)}
                            id="upload_id_front"
                          />
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                        <div className="truncate">
                          <span className="font-semibold block text-slate-900 dark:text-white text-[11px]">ID Back Side</span>
                          <span className="text-[9px] text-slate-500 truncate block">
                            {uploadedDocs.idBack ? uploadedDocs.idBack.name : 'Serial & thumbprint'}
                          </span>
                        </div>
                        <label className="shrink-0 ml-1.5 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10px] font-bold cursor-pointer">
                          {uploadedDocs.idBack ? '✓' : 'Upload'}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,application/pdf"
                            className="hidden"
                            onChange={(e) => handleFileUpload('idBack', e)}
                            id="upload_id_back"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Role Specific Requirements */}
                    {(
                      <>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                            <div className="truncate">
                              <span className="font-semibold block text-slate-900 dark:text-white">Letter from Chief</span>
                              <span className="text-[10px] text-slate-500">
                                {uploadedDocs.chiefLetter ? `${uploadedDocs.chiefLetter.name} (${uploadedDocs.chiefLetter.size})` : 'Location chief verification letter'}
                              </span>
                            </div>
                          </div>
                          <label className="shrink-0 ml-2 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10px] font-bold cursor-pointer transition">
                            {uploadedDocs.chiefLetter ? 'Change' : 'Upload'}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,application/pdf"
                              className="hidden"
                              onChange={(e) => handleFileUpload('chiefLetter', e)}
                              id="upload_chief_letter"
                            />
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                            <div className="truncate">
                              <span className="font-semibold block text-slate-900 dark:text-white">{roleInput === UserRole.FARMER ? 'Farm Certifications (Required)' : 'KVB License / Certifications (Required)'}</span>
                              <span className="text-[10px] text-slate-500">
                                {uploadedDocs.certifications ? `${uploadedDocs.certifications.name} (${uploadedDocs.certifications.size})` : 'GAP / Organic / Training certs'}
                              </span>
                            </div>
                          </div>
                          <label className="shrink-0 ml-2 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10px] font-bold cursor-pointer transition">
                            {uploadedDocs.certifications ? 'Change' : 'Upload'}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,application/pdf"
                              className="hidden"
                              onChange={(e) => handleFileUpload('certifications', e)}
                              id="upload_farmer_cert"
                            />
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {policy && <section className="rounded border p-3"><button type="button" onClick={() => setPolicy(null)}>Close policy</button>{policy === 'terms' ? <TermsModalContent /> : <PrivacyModalContent />}</section>}
              {/* MANDATORY TERMS AND CONDITIONS & PRIVACY POLICY CHECKBOX */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    id="modal_reg_terms_checkbox"
                  />
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                    I agree to the <button type="button" onClick={() => setPolicy('terms')} className="underline">Terms and Conditions</button> and <button type="button" onClick={() => setPolicy('privacy')} className="underline">Privacy Policy</button>, and consent to regulatory KYC verification of uploaded documents.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50"
                id="modal_reg_submit_btn"
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>
          )}

          {/* TAB 4: FORGOT PASSWORD */}
          {tab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4" id="modal_forgot_form">
              {recoveryRequested && <label className="block text-sm">Recovery code<input required autoComplete="one-time-code" value={recoveryToken} onChange={event => setRecoveryToken(event.target.value)} className="w-full rounded border p-3 text-slate-900" /></label>}
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                <KeyRound className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  Request a recovery code on your registered mobile number, then enter it below with your new password.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Registered Mobile Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0712345678"
                  value={forgotPhone}
                  onChange={(e) => setForgotPhone(e.target.value)}
                  className="w-full p-3 text-sm rounded-xl border border-border-base bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  id="modal_forgot_phone_input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showForgotNewPassword ? 'text' : 'password'}
                    required={recoveryRequested}
                    minLength={recoveryRequested ? 12 : undefined}
                    placeholder="12+ characters (uppercase, lowercase, number, symbol)"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="w-full p-3 pr-10 text-sm rounded-xl border border-border-base bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    id="modal_forgot_new_password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                    title={showForgotNewPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showForgotNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showForgotConfirmPassword ? 'text' : 'password'}
                    required={recoveryRequested}
                    minLength={recoveryRequested ? 12 : undefined}
                    placeholder="Re-enter new password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="w-full p-3 pr-10 text-sm rounded-xl border border-border-base bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    id="modal_forgot_confirm_password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                    title={showForgotConfirmPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showForgotConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50"
                id="modal_forgot_submit_btn"
              >
                {loading ? 'Please wait…' : recoveryRequested ? 'Reset password' : 'Send recovery code'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setTab('phone'); setErrorMsg(''); }}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                >
                  Remembered your password? <span className="text-emerald-600 dark:text-emerald-400 font-semibold underline">Back to Sign In</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
