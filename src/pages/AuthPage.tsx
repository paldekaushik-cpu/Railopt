import React, { useState } from 'react';
import { authService } from '../firebase/authService';
import { Train, ShieldCheck, Lock, Mail, ArrowRight, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { SIMULATED_DISCLAIMER } from '../data/simulatedData';

export function AuthPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (isRegistering) {
        await authService.register(email, password);
      } else {
        await authService.login(email, password);
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg((err as { message?: string })?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await authService.demoLogin();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Demo sign-in encounter. Proceeding with guest access.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Top Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs text-amber-300">
        <span className="font-bold uppercase tracking-wider bg-amber-400/20 px-2 py-0.5 rounded mr-2">
          SIH 2026 • SIH26027
        </span>
        {SIMULATED_DISCLAIMER}
      </div>

      {/* Main Center Auth Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/90 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-6 backdrop-blur-md">
          {/* Logo & Identity */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-600 text-white shadow-lg ring-4 ring-blue-500/20">
              <Train className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">RailOpt AI</h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways
            </p>
          </div>

          {/* Quick 1-Click Demo Evaluation Button */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-500/40 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-200">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Hackathon Evaluation & Instant Demo Access</span>
            </div>
            <p className="text-[11px] text-slate-300">
              One-click access with pre-configured Senior Divisional Operations Manager (Sr. DOM) role and seeded Firestore data.
            </p>
            <button
              onClick={handleDemoAccess}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Accessing Secure Session...' : 'Instant Demo Login (Sr. DOM)'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-700 w-full"></div>
            <span className="bg-slate-800 px-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Or Sign In with Official Email
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Standard Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Railway Portal Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="officer@indianrailways.gov.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isRegistering ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{isLoading ? 'Creating Account...' : 'Register Officer Credentials'}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{isLoading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
            >
              {isRegistering
                ? 'Already have an officer account? Sign in here'
                : 'Need to create a new officer account? Register here'}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center text-xs text-slate-500 border-t border-slate-800">
        Smart India Hackathon 2026 • Ministry of Railways Problem Statement SIH26027 Prototype
      </div>
    </div>
  );
}
