import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

const VerifyOtp = () => {
  const { verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      setError('No email reference found. Please navigate from registration page.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const data = await verifyOtp(email, otpCode);
      if (data.success) {
        setSuccess('OTP verification successful! Account activated. Redirecting to Login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'Verification failed. Please check the code.');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="w-full max-w-md p-8 rounded-3xl glass-panel relative overflow-hidden">
        {/* Ambient Lights */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl dark:bg-indigo-500/20"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl dark:bg-violet-500/20"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-indigo-600/30">
            E
          </div>
          <h1 className="text-2xl font-black mt-4 bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
            Verify Your Email
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            An OTP code has been sent to {email || 'your email'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              disabled
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 text-slate-400 focus:outline-none text-sm"
              value={email}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Enter 6-Digit OTP Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-center text-xl font-bold tracking-widest text-slate-850 dark:text-slate-100 placeholder-slate-300 focus:outline-none focus:border-indigo-600 transition duration-200"
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !email}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 hover:scale-[1.01] mt-4"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>Verify & Activate</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-8">
          Code not received? Check your server console log (or Ethereal sandbox) if custom Gmail details are not configured.
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;
