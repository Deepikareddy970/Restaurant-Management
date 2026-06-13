import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect to respective dashboard
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'MANAGER') navigate('/manager');
      else if (user.role === 'EMPLOYEE') navigate('/employee');
      else navigate('/customer');
    }
  }, [user, navigate]);







  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = await login(email, password, rememberMe);
      if (!data.success) {
        setError(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError('Server connection failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="w-full max-w-md p-8 rounded-3xl glass-panel relative overflow-hidden">
        {/* Decorative ambient background lights */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl dark:bg-indigo-500/20"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl dark:bg-violet-500/20"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-indigo-600/30">
            E
          </div>
          <h1 className="text-2xl font-black mt-4 bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
            Welcome to DineFlow
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Restaurant Management & Customer Services
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {error}
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
              placeholder="e.g. admin@epitome.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>

            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Password
              </label>

              <Link
                to="/forgot-password"
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Forgot?
              </Link>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition duration-200 text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-slate-500" />
                ) : (
                  <Eye className="w-5 h-5 text-slate-500" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-650 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 dark:bg-slate-900 dark:border-slate-800"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 hover:scale-[1.01]"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>



        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-8">
          Need an account?{' '}
          <Link
            to="/register"
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
