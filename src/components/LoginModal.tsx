import React, { useState } from 'react';
import { User, Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { ShieldCheck, Lock, User as UserIcon, ChefHat, KeyRound } from 'lucide-react';

interface LoginModalProps {
  users: User[];
  currentLang: Language;
  onLogin: (user: User) => void;
  onLanguageChange: (lang: Language) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  users,
  currentLang,
  onLogin,
  onLanguageChange
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || key;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    const cleanUser = username.trim();
    const found = users.find(u => u.username.toLowerCase() === cleanUser.toLowerCase() && u.password === password);

    if (found) {
      if (!found.active) {
        setError('⚠️ هذا الحساب معطل حاليًا، يرجى مراجعة المسؤول');
        return;
      }
      onLogin(found);
    } else {
      setError(t('login_err'));
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
    const found = users.find(user => user.username === u && user.password === p && user.active);
    if (found) {
      onLogin(found);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 p-6 text-center text-white relative">
          {/* Language Switcher in Login modal */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
            <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full font-mono">
              V3 Pro
            </span>
            <div className="flex gap-1 bg-black/40 backdrop-blur-sm p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => onLanguageChange('ar')}
                className={`px-2 py-0.5 rounded transition ${currentLang === 'ar' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                عربي
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-0.5 rounded transition ${currentLang === 'en' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('fr')}
                className={`px-2 py-0.5 rounded transition ${currentLang === 'fr' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                FR
              </button>
            </div>
          </div>

          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 mt-4 border border-white/20 shadow-inner">
            <ChefHat className="w-8 h-8 text-blue-300" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">D-Deli / بوتشرز</h2>
          <p className="text-xs text-blue-200/80 mt-1 font-medium">
            {t('login_subtitle')}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('username')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin, manager, kitchen..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                required
              />
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('password')}
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl font-semibold text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>{t('login_btn')}</span>
          </button>

          {/* Quick Demo Accounts */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('demo_accounts')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', '123')}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left dark:text-slate-300 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-blue-600 dark:text-blue-400">admin</div>
                  <div className="text-[10px] text-slate-400">pwd: 123</div>
                </div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('manager', '1234')}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left dark:text-slate-300 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400">manager</div>
                  <div className="text-[10px] text-slate-400">pwd: 1234</div>
                </div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">Manager</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('kitchen', '1234')}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left dark:text-slate-300 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-amber-600 dark:text-amber-400">kitchen</div>
                  <div className="text-[10px] text-slate-400">pwd: 1234</div>
                </div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">Kitchen</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('purchasing', '1234')}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left dark:text-slate-300 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-purple-600 dark:text-purple-400">purchasing</div>
                  <div className="text-[10px] text-slate-400">pwd: 1234</div>
                </div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">Purch</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
