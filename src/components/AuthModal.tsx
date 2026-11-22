import React, { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { auth, getFriendlyAuthErrorMessage } from '../firebase';

type AuthMode = 'login' | 'register' | 'reset';

interface AuthViewProps {
  /** 'fullscreen' renders a centered login/verification gate; 'modal' renders an overlay dialog */
  variant: 'fullscreen' | 'modal';
  /** Current signed-in Firebase user (if signed in but unverified, shows verification step) */
  user: User | null;
  onGoogleSignIn: () => Promise<void>;
  onAuthSuccess: (user: User) => void;
  onSignOut?: () => Promise<void>;
  onContinueOffline?: () => void;
  onClose?: () => void;
}

export function AuthModal({
  variant,
  user,
  onGoogleSignIn,
  onAuthSuccess,
  onSignOut,
  onContinueOffline,
  onClose,
}: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingVerify, setIsCheckingVerify] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrorMsg(null);
    setInfoMsg(null);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      setPassword('');
      if (cred.user.emailVerified) {
        onAuthSuccess(cred.user);
      } else {
        setInfoMsg(
          'เข้าสู่ระบบแล้ว แต่บัญชีนี้ยังไม่ได้ยืนยันอีเมล กรุณากดลิงก์ยืนยันในอีเมลของคุณเพื่อเปิดใช้งานซิงค์ข้อมูล Cloud',
        );
      }
    } catch (error) {
      setErrorMsg(getFriendlyAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim();
    if (!trimmedEmail) {
      setErrorMsg('กรุณากรอกอีเมล');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('กรุณาตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      if (trimmedName) {
        await updateProfile(cred.user, { displayName: trimmedName.slice(0, 80) }).catch(() => {
          // Non-critical displayName update
        });
      }
      await sendEmailVerification(cred.user);
      setPassword('');
      setConfirmPassword('');
      setResendCooldown(60);
      setInfoMsg(
        `สร้างบัญชีเรียบร้อยและส่งลิงก์ยืนยันไปยัง ${trimmedEmail} แล้ว กรุณากดลิงก์ในอีเมล (หรือตรวจสอบในโฟลเดอร์สแปม) จากนั้นกดปุ่ม "ตรวจสอบการยืนยันอีเมล"`,
      );
    } catch (error) {
      setErrorMsg(getFriendlyAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('กรุณากรอกอีเมลที่ใช้สมัครสมาชิก');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setInfoMsg(
        'หากอีเมลนี้มีบัญชีอยู่ในระบบ ลิงก์สำหรับตั้งรหัสผ่านใหม่ได้ถูกส่งไปยังอีเมลของคุณแล้ว (กรุณาตรวจสอบในกล่องจดหมายหรือโฟลเดอร์สแปม)',
      );
    } catch (error) {
      setErrorMsg(getFriendlyAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckEmailVerified = async () => {
    const active = auth.currentUser;
    if (!active) return;
    setErrorMsg(null);
    setInfoMsg(null);
    setIsCheckingVerify(true);
    try {
      await reload(active);
      // Force refresh ID token so Firestore security rules receive email_verified: true immediately
      await active.getIdToken(true);
      if (auth.currentUser?.emailVerified) {
        onAuthSuccess(auth.currentUser);
      } else {
        setErrorMsg(
          'ยังตรวจไม่พบการยืนยันอีเมล กรุณาเปิดอีเมลแล้วคลิกลิงก์ยืนยันก่อนกดตรวจสอบอีกครั้ง',
        );
      }
    } catch (error) {
      setErrorMsg(getFriendlyAuthErrorMessage(error));
    } finally {
      setIsCheckingVerify(false);
    }
  };

  const handleResendVerification = async () => {
    const active = auth.currentUser;
    if (!active || resendCooldown > 0) return;
    setErrorMsg(null);
    setInfoMsg(null);
    setIsSubmitting(true);
    try {
      await sendEmailVerification(active);
      setResendCooldown(60);
      setInfoMsg(`ส่งลิงก์ยืนยันอีเมลไปยัง ${active.email ?? 'อีเมลของคุณ'} อีกครั้งเรียบร้อยแล้ว`);
    } catch (error) {
      setErrorMsg(getFriendlyAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleClick = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setIsSubmitting(true);
    try {
      await onGoogleSignIn();
    } catch (error) {
      setErrorMsg(getFriendlyAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const needsEmailVerification = Boolean(user && !user.emailVerified);

  const cardContent = (
    <div className="bg-white border border-pblue-200/80 rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
      <div className="h-[3px] w-full pastel-top-ribbon" aria-hidden="true" />
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-pborder bg-gradient-to-r from-pblue-50/70 via-white to-ppink-50/60 flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-pblue-800 mb-1">
            <ShieldCheck className="w-4 h-4 text-pblue-600" />
            โรงพยาบาลบางพลี · งานวิสัญญีพยาบาล
          </div>
          <h2 className="text-lg font-bold text-[#243040] tracking-tight">
            {needsEmailVerification
              ? 'ยืนยันอีเมลก่อนเข้าใช้งาน'
              : mode === 'login'
                ? 'เข้าสู่ระบบ Bangplee Pre-Anesthetic'
                : mode === 'register'
                  ? 'สมัครสมาชิกผู้ใช้งานใหม่'
                  : 'ลืมรหัสผ่าน / ตั้งรหัสผ่านใหม่'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {needsEmailVerification
              ? 'เพื่อความปลอดภัยของข้อมูลผู้ป่วย กรุณายืนยันอีเมลก่อนเชื่อมต่อ Cloud'
              : 'เข้าสู่ระบบเพื่อซิงค์ข้อมูลใบเยี่ยม Pre-op / Post-op ร่วมกับทีมแบบ Real-time'}
          </p>
        </div>
        {variant === 'modal' && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="p-1.5 text-slate-400 hover:text-prose-800 hover:bg-prose-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-2 px-3.5 py-2.5 rounded-lg bg-prose-50 border border-prose-200 text-xs text-prose-800"
          >
            <AlertCircle className="w-4 h-4 text-prose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div
            role="status"
            className="flex items-start gap-2 px-3.5 py-2.5 rounded-lg bg-pgreen-50 border border-pgreen-200 text-xs text-pgreen-800"
          >
            <CheckCircle2 className="w-4 h-4 text-pgreen-600 shrink-0 mt-0.5" />
            <span>{infoMsg}</span>
          </div>
        )}

        {needsEmailVerification ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-pblue-50 border border-pblue-200 p-4 text-xs text-pblue-800 space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-pblue-600" />
                อีเมลที่รอการยืนยัน: <span className="font-mono">{user?.email}</span>
              </div>
              <p className="text-pblue-800/90 leading-relaxed">
                ระบบได้ส่งลิงก์ยืนยันไปยังอีเมลของคุณแล้ว กรุณาเปิดกล่องจดหมาย (หรือโฟลเดอร์ Spam/Junk) กดลิงก์ยืนยัน แล้วกลับมาคลิกปุ่มด้านล่าง
              </p>
            </div>

            <button
              type="button"
              disabled={isCheckingVerify}
              onClick={() => void handleCheckEmailVerified()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-pblue-600 rounded-lg hover:bg-pblue-700 disabled:opacity-60 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isCheckingVerify ? 'animate-spin' : ''}`} />
              {isCheckingVerify ? 'กำลังตรวจสอบ...' : 'ฉันยืนยันอีเมลแล้ว — เข้าใช้งานทันที'}
            </button>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <button
                type="button"
                disabled={isSubmitting || resendCooldown > 0}
                onClick={() => void handleResendVerification()}
                className="text-pblue-800 hover:text-prose-800 font-medium underline disabled:opacity-50 disabled:no-underline"
              >
                {resendCooldown > 0
                  ? `ส่งลิงก์อีกครั้งได้ใน ${resendCooldown} วินาที`
                  : 'ส่งลิงก์ยืนยันอีเมลอีกครั้ง'}
              </button>
              {onSignOut && (
                <button
                  type="button"
                  onClick={() => void onSignOut()}
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-prose-800 underline"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  สลับบัญชี / ออกจากระบบ
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Mode Tabs (Login / Register) */}
            {mode !== 'reset' && (
              <div className="grid grid-cols-2 gap-1 p-1 bg-pblue-50/70 border border-pblue-100 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                    mode === 'login'
                      ? 'bg-white text-pblue-800 shadow-2xs'
                      : 'text-slate-600 hover:text-pblue-800'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  เข้าสู่ระบบ
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                    mode === 'register'
                      ? 'bg-white text-ppink-800 shadow-2xs'
                      : 'text-slate-600 hover:text-ppink-800'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  สมัครสมาชิกใหม่
                </button>
              </div>
            )}

            {mode === 'login' && (
              <form onSubmit={(e) => void handleEmailLogin(e)} className="space-y-3.5">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">อีเมล (Email)</span>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@hospital.com"
                      maxLength={120}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
                    />
                  </div>
                </label>

                <label className="block space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">รหัสผ่าน (Password)</span>
                    <button
                      type="button"
                      onClick={() => switchMode('reset')}
                      className="text-[11px] text-blue-800 hover:text-blue-950 font-medium hover:underline"
                    >
                      ลืมรหัสผ่าน?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่าน"
                      maxLength={128}
                      className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-pblue-600 rounded-lg hover:bg-pblue-700 disabled:opacity-60 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </button>
              </form>
            )}

            {mode === 'register' && (
              <form onSubmit={(e) => void handleRegister(e)} className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">
                    ชื่อ-นามสกุลผู้ใช้งาน (แสดงในระบบ)
                  </span>
                  <input
                    type="text"
                    autoComplete="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="เช่น พว.สมหญิง ใจดี"
                    maxLength={80}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">อีเมล (Email)</span>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@hospital.com"
                      maxLength={120}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
                    />
                  </div>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">
                    รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
                  </span>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="ตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร"
                      maxLength={128}
                      className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">ยืนยันรหัสผ่าน</span>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านอีกครั้ง"
                      maxLength={128}
                      className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-prose-600 rounded-lg hover:bg-prose-700 disabled:opacity-60 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  {isSubmitting ? 'กำลังสร้างบัญชี...' : 'สมัครสมาชิกและส่งอีเมลยืนยัน'}
                </button>
              </form>
            )}

            {mode === 'reset' && (
              <form onSubmit={(e) => void handlePasswordReset(e)} className="space-y-3.5">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">
                    อีเมลที่ใช้เข้าสู่ระบบ
                  </span>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@hospital.com"
                      maxLength={120}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-pborder rounded-lg bg-white text-[#243040] focus:outline-none focus:ring-2 focus:ring-pblue-300/40 focus:border-pblue-400"
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-pblue-600 rounded-lg hover:bg-pblue-700 disabled:opacity-60 transition-colors"
                >
                  <KeyRound className="w-4 h-4" />
                  {isSubmitting ? 'กำลังส่งลิงก์...' : 'ส่งลิงก์ตั้งรหัสผ่านใหม่'}
                </button>

                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="w-full py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 underline"
                >
                  กลับไปหน้าเข้าสู่ระบบ
                </button>
              </form>
            )}

            {/* Divider & Google Sign-In */}
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-200" />
              <span className="shrink-0 mx-3 text-[11px] text-slate-400 font-medium">หรือ</span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleGoogleClick()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-60 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.08 3.56-5.15 3.56-8.65z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.87-3c-1.07.72-2.45 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.97H1.25v3.1A12 12 0 0 0 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.25 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.25a12 12 0 0 0 0 10.74l4-3.1z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.76c1.76 0 3.35.61 4.6 1.8l3.45-3.45C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.25 6.63l4 3.1c.95-2.85 3.61-4.97 6.75-4.97z"
                />
              </svg>
              เข้าสู่ระบบด้วยบัญชี Google
            </button>

            {variant === 'fullscreen' && onContinueOffline && (
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={onContinueOffline}
                  className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                >
                  ใช้งานชั่วคราวแบบออฟไลน์เฉพาะเครื่องนี้ (ไม่ซิงค์ข้อมูล Cloud)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  if (variant === 'fullscreen') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pblue-50 via-ppink-50/70 to-pgreen-50 flex flex-col items-center justify-center px-4 py-8">
        {cardContent}
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="เข้าสู่ระบบ"
      className="no-print fixed inset-0 z-50 bg-[#243040]/40 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto"
    >
      {cardContent}
    </div>
  );
}
