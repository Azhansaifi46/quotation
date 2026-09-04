import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, verifyLoginOTP, register, verifySignupOTP, resendOTP, demoLogin } = useAuth();

  // Screen State: 'login' | 'register' | 'otp'
  const [screen, setScreen] = useState('login');
  const [otpPurpose, setOtpPurpose] = useState('signup'); // 'signup' | 'login'
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');
  const [devOtpCode, setDevOtpCode] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 6-Digit OTP State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);

  // Resend OTP Cooldown Timer (60s)
  const [cooldown, setCooldown] = useState(0);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const from = location.state?.from?.pathname || '/dashboard';

  // Cooldown countdown effect
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // Demo Login Handler: Instant 1-click access to isolated demo account
  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');
      await demoLogin();
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to access demo account');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Submit Login Form -> Trigger 2FA OTP
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please enter your email/mobile and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');

      const res = await login(formData.email, formData.password);
      if (res?.requiresOtp) {
        setPendingEmail(res.email || formData.email);
        setPendingPhone(res.phone || '');
        setOtpPurpose(res.isVerified ? 'login' : 'signup');
        setDevOtpCode(res.devOtp || '');
        setScreen('otp');
        setOtp(['', '', '', '', '', '']);
        setCooldown(60);
        setSuccessMsg(res.message || `A 6-digit verification code was sent to ${res.email || formData.email}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Submit Signup Form -> Trigger Verification OTP
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');

      const res = await register(formData);
      if (res?.requiresOtp) {
        setPendingEmail(res.email || formData.email);
        setPendingPhone(res.phone || formData.phone);
        setOtpPurpose('signup');
        setDevOtpCode(res.devOtp || '');
        setScreen('otp');
        setOtp(['', '', '', '', '', '']);
        setCooldown(60);
        setSuccessMsg(res.message || `Verification code sent to ${res.email || formData.email}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFillDevOtp = () => {
    if (devOtpCode && devOtpCode.length === 6) {
      setOtp(devOtpCode.split(''));
      setError('');
    }
  };

  // Handle individual OTP input box changes & auto-focus next
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle pasting full 6-digit code
      const pastedDigits = value.replace(/\D/g, '').slice(0, 6).split('');
      if (pastedDigits.length > 0) {
        const newOtp = [...otp];
        pastedDigits.forEach((digit, idx) => {
          if (idx < 6) newOtp[idx] = digit;
        });
        setOtp(newOtp);
        const nextIdx = Math.min(5, pastedDigits.length);
        otpInputRefs.current[nextIdx]?.focus();
      }
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto focus next box
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleOtpVerify = async (e) => {
    if (e) e.preventDefault();
    const enteredOtp = otp.join('').trim();
    if (enteredOtp.length !== 6) {
      setError('Please enter all 6 digits of the verification code');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (otpPurpose === 'signup') {
        await verifySignupOTP(pendingEmail, enteredOtp);
      } else {
        await verifyLoginOTP(pendingEmail, enteredOtp);
      }

      // Success -> Redirect to dashboard
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (cooldown > 0 || !pendingEmail) return;

    try {
      setLoading(true);
      setError('');
      const res = await resendOTP(pendingEmail);
      setCooldown(60);
      setDevOtpCode(res?.devOtp || '');
      setSuccessMsg(res?.message || `A fresh code has been sent to ${pendingEmail}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d1a] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 selection:bg-purple-600 selection:text-white relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 shadow-xl shadow-purple-500/20 text-white">
            <Zap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wide text-white font-['Outfit'] uppercase">
              BILLPRO SAAS
            </h1>
            <p className="text-xs font-bold text-purple-400 tracking-widest uppercase">
              MULTI-BUSINESS QUOTATION & INVOICING SUITE
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#11182c]/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Mode Switcher (Hidden when verifying OTP) */}
          {screen !== 'otp' ? (
            <div className="flex bg-slate-900/90 p-1 rounded-2xl mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setScreen('login');
                  setError('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  screen === 'login'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setScreen('register');
                  setError('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  screen === 'register'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          ) : (
            /* OTP Header */
            <div className="mb-6 text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Enter Verification Code
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                We sent a 6-digit code to{' '}
                <span className="text-white font-semibold font-mono">{pendingEmail}</span>
              </p>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-medium flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-medium flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SCREEN 1: LOGIN FORM */}
          {screen === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address or Mobile Number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@company.com or +91 98765..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-500 hover:text-slate-300 absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
              >
                <span>{loading ? 'Validating...' : 'Continue with 2-Factor OTP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Demo Login Option */}
              <div className="pt-2 border-t border-slate-800/80 mt-3 text-center">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 hover:border-purple-500/40 border border-slate-700/80 text-purple-300 hover:text-purple-200 text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Demo Login (1-Click Instant Access)</span>
                </button>
              </div>
            </form>
          )}

          {/* SCREEN 2: SIGNUP FORM */}
          {screen === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Rajesh Kumar"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="rajesh@mybusiness.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mobile Number <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password (min. 6 characters) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-500 hover:text-slate-300 absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    minLength={6}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="p-1 text-slate-500 hover:text-slate-300 absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
              >
                <span>{loading ? 'Creating Account...' : 'Get Verification Code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* SCREEN 3: OTP VERIFICATION */}
          {screen === 'otp' && (
            <form onSubmit={handleOtpVerify} className="space-y-4">
              {/* Local Dev Mode Helper Banner */}
              {devOtpCode && (
                <div className="p-3.5 bg-gradient-to-r from-purple-900/40 via-indigo-950/40 to-slate-900/60 border border-purple-500/40 rounded-2xl text-xs space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-purple-300 font-semibold text-[11px]">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Quick Test Code:</span>
                    </span>
                    <span className="font-mono text-base font-black text-amber-300 tracking-widest bg-slate-900/80 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                      {devOtpCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoFillDevOtp}
                    className="w-full py-2 px-3 bg-purple-600/30 hover:bg-purple-600/50 active:scale-98 border border-purple-500/40 rounded-xl text-purple-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-purple-300" />
                    <span>Auto-Fill Code ({devOtpCode})</span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center leading-tight">
                    💡 Real SMS / Email: Configure your Gmail SMTP or SMS key in <code className="text-purple-300 font-mono">backend/.env</code>
                  </p>
                </div>
              )}

              {/* 6-Digit Individual Input Grid */}
              <div className="flex justify-center gap-2 sm:gap-3 my-3">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl border border-slate-700 bg-slate-900/90 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 outline-none transition-all shadow-inner"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Verifying...' : 'Verify Code & Access Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Resend OTP Section with Cooldown Timer */}
              <div className="pt-2 text-center text-xs space-y-2">
                {cooldown > 0 ? (
                  <p className="text-slate-400">
                    Resend code in <strong className="text-purple-400 font-mono">{cooldown}s</strong>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1.5 mx-auto transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resend Verification Code</span>
                  </button>
                )}

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setScreen('login');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-300 font-medium flex items-center gap-1 mx-auto mt-2 transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Back to sign in</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-2 text-slate-500 text-[11px]">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Encrypted with SHA-256 Hashed OTP & 256-Bit JWT Session Tokens</span>
        </div>
      </div>
    </div>
  );
}
