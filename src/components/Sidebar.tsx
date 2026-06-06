/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Participant, ContestRules } from '../types';
import { 
  TrophyIcon, 
  SettingsIcon, 
  LivePulseIcon, 
  TrendUpIcon, 
  SwordsIcon, 
  CrownRankingIcon,
  FlameStreakIcon,
  IceStreakIcon
} from './AnimatedIcons';
import { formatTier, getTierColor } from '../utils/lolMockData';

interface SidebarProps {
  rules: ContestRules;
  participants: Participant[];
  onOpenSettings: () => void;
  onRunSimulation: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  rules,
  participants,
  onOpenSettings,
  onRunSimulation
}) => {
  const [timeLeft, setTimeLeft] = useState('');
  
  // High contrast first to fifth ranked players for OBS Overlay Capture
  const topFive = [...participants]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 5);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(rules.periodEnd).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('컨텐츠 종료됨');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const dStr = days > 0 ? `${days}일 ` : '';
      const hStr = hours.toString().padStart(2, '0');
      const mStr = minutes.toString().padStart(2, '0');
      const sStr = seconds.toString().padStart(2, '0');

      setTimeLeft(`${dStr}${hStr}:${mStr}:${sStr}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [rules.periodEnd]);

  return (
    <aside id="sidebar-container" className="w-[400px] h-screen shrink-0 border-r border-slate-200 flex flex-col justify-between bg-gradient-to-b from-white via-white to-slate-50 relative z-10 select-none">
      
      {/* Decorative side mesh glow */}
      <div className="absolute top-20 left-0 w-36 h-36 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Sidebar core content block */}
      <div className="p-6 overflow-y-auto flex-1 space-y-6">
        
        {/* Header Branding with Shimmering Swords animated SVG */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl shadow-sm">
              <SwordsIcon className="w-6 h-6 text-blue-600 rotate-12" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tighter font-sans leading-tight">솔랭 달리기 리그</h1>
              <p className="text-[10px] text-blue-500 font-bold tracking-[0.2em] uppercase mt-0.5">LEAGUE SCOREBOARD ENGINE</p>
            </div>
          </div>
          
          <button 
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 hover:text-slate-950 transition-all cursor-pointer shadow-sm"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Live status timer, styled as a sleek banner */}
        <div className="p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between bg-white relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-50/50 rounded-full blur-2xl group-hover:bg-blue-100 transition-colors" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-500">남은 시간</span>
            <span className="text-[10px] text-blue-400 font-bold tracking-tight mt-0.5">(게임 시작 시간 기준)</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
             <strong className="text-[30px] font-black text-slate-950 font-sans tracking-tight">{timeLeft}</strong>
          </div>
        </div>

        {/* Settings Info Summary Detail List */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold text-blue-600 tracking-wider uppercase">현재 설정된 배점 가중치</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-200 text-left">
              <span className="text-[10px] text-slate-500 block">LP당 증감 가점</span>
              <strong className="text-sm text-slate-800 font-bold">비활성화됨 (0P)</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-200 text-left">
              <span className="text-[10px] text-slate-500 block">경기당 기본 승/패</span>
              <strong className="text-sm text-slate-800 font-bold">+{rules.winPoints}P / {rules.lossPoints}P</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-200 text-left flex items-center gap-2">
              <FlameStreakIcon className="w-4 h-4 text-orange-500 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block">3연승 보너스</span>
                <strong className="text-xs text-emerald-600 font-bold">+{rules.winStreakBonuses?.[3] || 0}P 추가</strong>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-200 text-left flex items-center gap-2">
              <IceStreakIcon className="w-4 h-4 text-cyan-600 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block">{rules.lossStreakThreshold}연패 디스카운트</span>
                <strong className="text-xs text-rose-600 font-bold">-{rules.lossStreakPenalty}P 강등</strong>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* OBS Overlay Summary (Top 5) */}
      <div className="p-6 border-t border-slate-200 bg-slate-50/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CrownRankingIcon className="w-4 h-4 text-amber-500 shadow-amber-200" />
            <span className="text-[11px] font-bold text-slate-700 tracking-tight">종합 랭킹 TOP 5</span>
          </div>
        </div>
        <div className="space-y-3">
          {topFive.length > 0 ? (
            topFive.map((player, idx) => {
              const wins = player.matches.filter(m => m.win).length;
              const losses = player.matches.length - wins;
              
              // Simple streak detection
              let streak = 0;
              for (let i = player.matches.length - 1; i >= 0; i--) {
                if (player.matches[i].win) streak++;
                else break;
              }

              return (
                <div key={player.id} className="flex flex-col p-3 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black font-mono tracking-tighter ${
                        idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-slate-300 text-white' : idx === 2 ? 'bg-orange-300 text-white' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-[13px] font-black text-slate-800">{player.name}</span>
                    </div>
                    <strong className="text-[14px] font-black text-blue-600 font-mono tracking-tighter">{player.totalPoints}P</strong>
                  </div>
                  <div className="flex items-center gap-3 px-1">
                    <span className={`text-[10px] font-bold ${getTierColor(player.currentTier)} bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100`}>
                      {formatTier(player.currentTier, player.currentDivision).split(' ')[0]} {player.currentLp}LP
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      <span className="text-blue-500">{wins}승</span> <span className="text-rose-400">{losses}패</span>
                    </span>
                    <span className="text-[10px] text-emerald-500 font-black">
                      ({streak}연승 중)
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 bg-slate-100/50 rounded-xl border border-dashed border-slate-200">
              <span className="text-[10px] text-slate-400 font-medium">참가자를 등록해주세요</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
