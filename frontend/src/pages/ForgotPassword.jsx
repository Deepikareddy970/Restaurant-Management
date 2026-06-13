import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HelpCircle } from 'lucide-react';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const data = await forgotPassword(email);
      if (data.success) {
        setSuccess('Reset instructions with OTP have been sent to your email.');
        setTimeout(() => {
          navigate(`/reset-password?email=${encodeURIComponent(email)}`);
        }, 1500);
      } else {
        setError(data.message || 'Failed to request reset. Please verify your email.');
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
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl dark:bg-indigo-500/20"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl dark:bg-violet-500/20"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-indigo-600/30">
            E
          </div>
          <h1 className="text-2xl font-black mt-4 bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
            Forgot Password
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Enter your email to receive a password reset OTP
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition duration-200 text-sm"
              placeholder=" sarah@epitome.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 hover:scale-[1.01] mt-4"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <HelpCircle className="w-4 h-4" />
                <span>Send Reset Code</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-8">
          Remembered password?{' '}
          <Link
            to="/login"
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            Go to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
