/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Participant, ContestRules } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrophyIcon, 
  TrendUpIcon, 
  TrendDownIcon, 
  CrownRankingIcon,
  FlameStreakIcon,
  IceStreakIcon,
  SparklesIcon
} from './AnimatedIcons';
import { 
  formatTier, 
  getTierColor, 
  getAbsoluteLp 
} from '../utils/lolMockData';

interface MainListProps {
  participants: Participant[];
  rules: ContestRules;
  onSelectParticipant: (p: Participant) => void;
}

export const MainList: React.FC<MainListProps> = ({
  participants,
  rules,
  onSelectParticipant
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'points' | 'lp' | 'winrate'>('points');

  // Multi-dimensional sorting and filtering
  const sortedParticipants = [...participants]
    .filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.summonerName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'points') {
        return b.totalPoints - a.totalPoints;
      } else if (sortBy === 'lp') {
        const lpA = getAbsoluteLp(a.currentTier, a.currentDivision, a.currentLp);
        const lpB = getAbsoluteLp(b.currentTier, b.currentDivision, b.currentLp);
        return lpB - lpA;
      } else {
        const winrateA = a.matches.length > 0 ? (a.matches.filter(m => m.win).length / a.matches.length) : 0;
        const winrateB = b.matches.length > 0 ? (b.matches.filter(m => m.win).length / b.matches.length) : 0;
        return winrateB - winrateA;
      }
    });

  const getLpDelta = (p: Participant): number => {
    const startAbs = getAbsoluteLp(p.startTier, p.startDivision, p.startLp);
    const currAbs = getAbsoluteLp(p.currentTier, p.currentDivision, p.currentLp);
    return currAbs - startAbs;
  };

  return (
    <div className="flex-1 min-w-0 h-screen overflow-y-auto bg-slate-50/20 p-6 lg:p-12 flex flex-col space-y-12 relative scrollbar-none">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-20 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header and Filter/Sorting Rows */}
      <div className="space-y-8 relative z-10">
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
            참가자 종합 랭킹 보드
          </h2>
          <p className="text-base text-slate-500 font-medium max-w-xl leading-relaxed">
            기준 시간 내 진행된 솔로랭크 전적 및 점수를 <span className="text-blue-600 font-bold">실시간</span>으로 집계하여 순위를 산출합니다.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/40 p-2 rounded-[28px] border border-white/60 shadow-sm backdrop-blur-sm">
          {/* Search bar - Left Aligned */}
          <div className="relative group w-full md:w-80">
            <input
              type="text"
              placeholder="참가명 또는 소환사 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/80 border border-slate-200/60 rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all"
            />
            <svg className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter buttons - Right Aligned */}
          <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200/50">
            {[
              { id: 'points', label: '포인트 순' },
              { id: 'lp', label: '현재 LP 순' },
              { id: 'winrate', label: '승률 순' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setSortBy(btn.id as any)}
                className={`rounded-xl px-5 py-2 text-[12px] font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                  sortBy === btn.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-900 px-6'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Ranking Scroll List */}
      <div className="flex-1 relative z-10 space-y-3 pr-2 pb-12">
        <AnimatePresence>
          {sortedParticipants.length > 0 ? (
            sortedParticipants.map((p, idx) => {
              const lpDelta = getLpDelta(p);
              const totalGames = p.matches.length;
              const wins = p.matches.filter(m => m.win).length;
              const wr = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: idx * 0.05, 
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                  onClick={() => onSelectParticipant(p)}
                  className="bg-white/80 backdrop-blur-sm border border-slate-200/60 py-3.5 px-6 lg:px-8 rounded-[28px] flex flex-col lg:flex-row lg:items-center justify-between gap-6 cursor-pointer select-none relative group transition-all hover:bg-white hover:border-blue-300 hover:shadow-xl hover:shadow-blue-200/20 hover:-translate-y-0.5"
                >
                  {/* Left Identity Section */}
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                      {idx === 0 ? (
                        <div className="relative">
                          <CrownRankingIcon className="w-10 h-10 relative text-amber-500 drop-shadow-sm" />
                        </div>
                      ) : (
                        <span className={`text-2xl font-black font-mono tracking-tighter transition-colors ${
                          idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-orange-300' : 'text-slate-200 group-hover:text-slate-300'
                        }`}>
                          {idx + 1}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex flex-col gap-0.5">
                      <div className="flex items-center gap-4">
                        <strong className="text-2xl text-slate-900 font-black group-hover:text-blue-600 transition-colors tracking-tighter leading-tight">
                          {p.name}
                        </strong>
                        <span className="text-[10px] text-slate-400 font-mono font-bold truncate max-w-[120px] px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                          {p.summonerName}#{p.tagLine}
                        </span>
                      </div>
                      <div className={`text-[11px] font-bold ${getTierColor(p.currentTier)} bg-slate-50/50 w-fit px-2 py-0.5 rounded-md border border-slate-100/50`}>
                        {formatTier(p.currentTier, p.currentDivision)} · {p.currentLp}LP
                        <span className="text-emerald-500 font-black ml-2">
                          {p.matches.filter(m => m.win).length}승 {p.matches.length - p.matches.filter(m => m.win).length}패
                          <span className="ml-1 text-blue-400 opacity-60">
                            ({(() => {
                                let streak = 0;
                                for (let i = p.matches.length - 1; i >= 0; i--) {
                                  if (p.matches[i].win) streak++;
                                  else break;
                                }
                                return streak;
                              })()}연승)
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Content Grouped */}
                  <div className="flex items-center gap-12 text-right">
                    {/* Compact Vertical Stats */}
                    <div className="flex items-center gap-6 border-r border-slate-100 pr-12 h-10">
                       <div className="flex flex-col items-center leading-none">
                         <span className="text-slate-300 text-[8px] font-black uppercase mb-1">TOTAL</span>
                         <span className="text-slate-900 font-black text-xl">{totalGames}</span>
                       </div>
                       <div className="flex flex-col items-center leading-none">
                         <span className="text-slate-300 text-[8px] font-black uppercase mb-1">WINRATE</span>
                         <span className="text-blue-600 font-black text-xl">{wr}%</span>
                       </div>
                    </div>

                    {/* Recent Result Mini Circles */}
                    <div className="hidden xl:flex gap-1.5 items-center">
                      {p.matches.length > 0 ? (
                        [...p.matches].slice(-5).map((m) => (
                          <div 
                            key={m.id}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-black font-mono text-[9px] border shadow-sm ${
                              m.win 
                                ? 'bg-blue-600 border-blue-500 text-white' 
                                : 'bg-slate-100 border-slate-200 text-slate-400'
                            }`}
                          >
                            {m.win ? 'W' : 'L'}
                          </div>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-300 font-bold px-2 py-1 bg-slate-50 rounded-lg">전적 없음</span>
                      )}
                    </div>

                    {/* Final Points - Emphasis */}
                    <div className="text-right flex items-end gap-1 min-w-[100px] justify-end">
                      <strong className="text-4xl font-black text-blue-600 font-mono tracking-tighter leading-none">{p.totalPoints}</strong>
                      <span className="text-lg text-blue-400 font-black mb-0.5">P</span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-white/50 backdrop-blur-sm rounded-[48px] border-2 border-dashed border-slate-200 p-8 text-center space-y-6">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <CrownRankingIcon className="w-12 h-12" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-700">현재 등록된 소환사 참가자가 없습니다.</p>
                <p className="text-sm text-slate-400 mt-2">우측 상단 관리창 톱니바퀴 아이콘을 눌러 참가자들의 정보를 일괄 등록해 주세요.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
