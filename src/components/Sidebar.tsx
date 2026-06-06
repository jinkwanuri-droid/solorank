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
  isSyncing: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  rules,
  participants,
  onOpenSettings,
  onRunSimulation,
  isSyncing
}) => {
  const [timerData, setTimerData] = useState({ d: '0', h: '00', m: '00', s: '00' });
  
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
        setTimerData({ d: '0', h: '00', m: '00', s: '00' });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimerData({
        d: days.toString(),
        h: hours.toString().padStart(2, '0'),
        m: minutes.toString().padStart(2, '0'),
        s: seconds.toString().padStart(2, '0')
      });
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

        {/* Modern White Modular Timer (Based on user screenshot) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">남은 시간</span>
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[9px] text-blue-400 font-bold">(게임 시작 시간 기준)</span>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'DAYS', value: timerData.d },
              { label: 'HOURS', value: timerData.h },
              { label: 'MINUTES', value: timerData.m },
              { label: 'SECONDS', value: timerData.s },
            ].map((unit, i) => (
              <div key={unit.label} className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-col items-center justify-center group hover:border-blue-200 transition-colors">
                <span className="text-2xl font-black text-slate-900 font-mono tracking-tighter leading-none">{unit.value}</span>
                <span className="text-[8px] font-black text-slate-300 mt-2 tracking-widest group-hover:text-blue-300 transition-colors">{unit.label}</span>
              </div>
            ))}
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
        
        {/* Real-time Sync Trigger Button */}
        <div className="px-1">
          <button
            onClick={onRunSimulation}
            disabled={isSyncing}
            className={`w-full group relative flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm tracking-tight transition-all shadow-lg active:scale-[0.98] ${
              isSyncing 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:shadow-blue-300'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${isSyncing ? 'bg-slate-200' : 'bg-blue-500 group-hover:bg-blue-400'} transition-colors`}>
              <LivePulseIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <span>{isSyncing ? '전적 동기화 중...' : '실시간 전적 동기화'}</span>
            
            {!isSyncing && (
               <div className="absolute top-1.5 right-4 w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />
            )}
          </button>
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
        <div className="space-y-2">
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
                <div key={player.id} className="flex flex-col p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm hover:border-blue-200 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black font-mono ${
                        idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-slate-300 text-white' : idx === 2 ? 'bg-orange-300 text-white' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-[12px] font-bold text-slate-800">{player.name}</span>
                    </div>
                    <div className="flex items-end gap-0.5">
                      <strong className="text-[16px] font-black text-blue-600 font-mono tracking-tighter leading-none">{player.totalPoints}</strong>
                      <span className="text-[10px] font-black text-blue-400 mb-0.5">P</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 px-0.5">
                    <span className={`text-[9px] font-bold ${getTierColor(player.currentTier)} opacity-80`}>
                      {formatTier(player.currentTier, player.currentDivision).split(' ')[0]} {player.currentLp}LP
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="text-[9px] text-slate-400 font-bold">
                      <span className="text-blue-500/70">{wins}승</span> {losses}패
                    </span>
                    <span className="text-[9px] text-emerald-500 font-black">
                      ({streak}연승)
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
