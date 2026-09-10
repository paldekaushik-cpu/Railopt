import { AuthUser } from '../firebase/authService';
import { LogOut, Train, ShieldCheck, Database, RefreshCw } from 'lucide-react';
import { SIMULATED_DISCLAIMER } from '../data/simulatedData';

interface HeaderProps {
  user: AuthUser | null;
  onLogout: () => void;
  onResetSeedData: () => void;
  isSeeding: boolean;
}

export function Header({ user, onLogout, onResetSeedData, isSeeding }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      {/* Top Simulated System Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="font-semibold uppercase tracking-wider text-[11px] bg-amber-200/70 text-amber-950 px-1.5 py-0.5 rounded">
            SIH 2026 • Problem SIH26027
          </span>
          <span>{SIMULATED_DISCLAIMER}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onResetSeedData}
            disabled={isSeeding}
            className="inline-flex items-center gap-1 text-xs text-blue-800 hover:text-blue-900 font-medium hover:underline disabled:opacity-50"
            title="Reset simulated data in Cloud Firestore"
          >
            <RefreshCw className={`w-3 h-3 ${isSeeding ? 'animate-spin' : ''}`} />
            {isSeeding ? 'Seeding Firestore...' : 'Reset Demo Data'}
          </button>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-emerald-700">
            <Database className="w-3.5 h-3.5" />
            <span className="font-medium text-xs">Cloud Firestore Connected</span>
          </div>
        </div>
      </div>

      {/* Main App Bar */}
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center shadow-sm">
            <Train className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">RailOpt AI</h1>
              <span className="text-[11px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                Decision Support Prototype
              </span>
            </div>
            <p className="text-xs text-slate-500">
              AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations
            </p>
          </div>
        </div>

        {/* User profile & actions */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 justify-end">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              {user?.displayName || 'Railway Operations Officer'}
            </div>
            <div className="text-xs text-slate-500">{user?.role || 'Sr. DOM / Section Controller'}</div>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-red-700 hover:bg-red-50 border border-slate-300 hover:border-red-200 rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
