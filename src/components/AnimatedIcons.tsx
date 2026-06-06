/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const TrophyIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={`${className} text-amber-400`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 9H4.5C3.12 9 2 7.88 2 6.5V5.5C2 4.12 3.12 3 4.5 3H6V9ZM18 9H19.5C20.88 9 22 7.88 22 6.5V5.5C22 4.12 20.88 3 19.5 3H18V9Z" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 3V6C4 10.42 7.58 14 12 14C16.42 14 20 10.42 20 6V3H4Z" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
      className="animate-pulse-soft" style={{ animationDuration: '4s' }} />
    <path d="M12 14V21M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CrownRankingIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
    <div className="absolute inset-0 bg-amber-400/10 blur-[4px] rounded-full" />
    <svg className="w-full h-full relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 22h16" stroke="url(#goldGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" fill="url(#goldGrad)" stroke="url(#goldGrad)" strokeWidth="1" strokeLinejoin="round" />
      <defs>
        <linearGradient id="goldGrad" x1="6" y1="2" x2="18" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

export const VictoryBadge: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={`${className} filter drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="2.5" fill="rgba(16,185,129,0.15)" className="animate-pulse-soft" style={{ animationDuration: '2s' }} />
    <path d="M8 12L11 15L16 9" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
      strokeDasharray="20" strokeDashoffset="20" style={{ animation: 'line-draw 0.4s ease-out forwards', animationDelay: '0.1s' }} />
  </svg>
);

export const DefeatBadge: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={`${className} filter drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2.5" fill="rgba(239,68,68,0.15)" />
    <path d="M9 9L15 15M15 9L9 15" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
      strokeDasharray="20" strokeDashoffset="20" style={{ animation: 'line-draw 0.3s ease-out forwards' }} />
  </svg>
);

export const FlameStreakIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={`${className} text-orange-500 animate-pulse-soft`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.657 16.657L13.414 20.9M12 21A9 9 0 1112 3a9 9 0 010 18z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 7c-2 2-2.5 5-1 7.5s3.5 1.5 4 0c.5-1.5 0-3.5-1.5-4.5m-3 6.5s.5-1.5 1-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IceStreakIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={`${className} text-sky-400`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" className="animate-pulse-soft" />
    <path d="M12 2V6M12 18V22M2 12H6M18 12H22M6.34 6.34L9.17 9.17M14.83 14.83L17.66 17.66M17.66 6.34L14.83 9.17M9.17 14.83L6.34 17.66" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const SettingsIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={`${className} hover:rotate-90 transition-transform duration-500 text-blue-400`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73h0l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.1a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73h0l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LivePulseIcon: React.FC<{ className?: string, text?: string }> = ({ className = 'w-3 h-3', text }) => (
  <div className="flex items-center gap-2">
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
    </span>
    {text && <span className="text-xs font-medium text-blue-400 leading-none">{text}</span>}
  </div>
);

export const SwordsIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={`${className} text-blue-400`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.5 17.5L3 6V3H6L17.5 14.5M14.5 17.5L19 13M14.5 17.5L21 21M17.5 14.5L13 19M17.5 14.5L21 21M21 21H18M21 21V18" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.5 14.5L21 3V6L14.5 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ShieldIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={`${className} text-stone-400`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const BoltIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={`${className} text-yellow-400 animate-pulse-soft`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TrendUpIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={`${className} text-emerald-400`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 6H23V12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TrendDownIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={`${className} text-red-400`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 18L13.5 8.5L8.5 13.5L1 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 18H23V12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SummonerAvatarIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg className={`${className} text-blue-300`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="animate-spin-slow" />
    <circle cx="12" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5.5 19.5C6.5 16.5 9 15 12 15C15 15 17.5 16.5 18.5 19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const SparklesIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} text-cyan-400 animate-pulse-soft`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3V21M3 12H21M12 3C12 7.142 8.858 12 3 12C8.858 12 12 16.858 12 21C12 16.858 15.142 12 21 12C15.142 12 12 7.142 12 3Z" 
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
