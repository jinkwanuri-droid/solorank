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
}

export const Sidebar: React.FC<SidebarProps> = ({
  rules,
  participants,
  onOpenSettings
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
    <aside id="sidebar-container" className="w-[400px] h-screen shrink-0 border-r border-slate-200 flex flex-col justify-between bg-gradient-to-b from-white via-white to-slate-50 relative z-30 select-none overflow-hidden">
      
      {/* Decorative side mesh glow */}
      <div className="absolute top-20 left-0 w-36 h-36 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Sidebar core content block */}
      <div className="p-5 flex-1 space-y-4 flex flex-col justify-start overflow-visible relative z-40">
        
        {/* Header Branding with Shimmering Swords animated SVG */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 border border-blue-100/80 rounded-2xl shadow-sm">
              <SwordsIcon className="w-5.5 h-5.5 text-blue-600 rotate-12" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tighter font-sans leading-tight">솔랭 달리기 리그</h1>
              <p className="text-[9px] text-blue-500 font-bold tracking-[0.2em] uppercase mt-0.5">LEAGUE SCOREBOARD ENGINE</p>
            </div>
          </div>
          
          <button 
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 hover:text-slate-950 transition-all cursor-pointer shadow-sm"
          >
            <SettingsIcon className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* 10px Spacing between branding and timer */}
        <div className="h-[10px] shrink-0" />

        {/* Modern White Modular Timer (Based on user screenshot) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">남은 시간</span>
            <span className="text-[9px] text-blue-500 font-bold bg-blue-50/50 px-2 py-0.5 rounded-md border border-blue-100/30">(게임 시작 시간 기준)</span>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'days', value: timerData.d },
              { label: 'hours', value: timerData.h },
              { label: 'minutes', value: timerData.m },
              { label: 'seconds', value: timerData.s },
            ].map((unit) => (
              <div 
                key={unit.label} 
                className="bg-gradient-to-b from-white to-slate-50/50 border border-slate-200/85 rounded-xl py-2 px-1 flex flex-col items-center justify-center shadow-[inset_0_1.5px_0_rgba(255,255,255,0.9),0_2px_4px_rgba(15,23,42,0.03)] hover:border-blue-200 hover:shadow-md transition-all duration-300"
              >
                <span className="text-[24px] font-black text-slate-800 font-sans tracking-tight leading-none">{unit.value}</span>
                <span className="text-[8px] font-light text-slate-400 mt-1.5 tracking-wider font-sans leading-none">{unit.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Game Rules Hover Button & Tooltip Popover */}
        <div className="relative group/rules px-0.5">
          <button className="w-full relative flex items-center justify-between py-2.5 px-3.5 bg-white border border-slate-200 rounded-xl font-bold text-[11px] text-slate-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/25 transition-all shadow-[0_1.5px_3px_rgba(0,0,0,0.015)] cursor-pointer group active:scale-[0.99]">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span>게임규칙</span>
            </div>
            <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Hover Popover */}
          <div className="absolute left-0 top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-[0_20px_40px_rgba(15,23,42,0.15)] p-4 text-xs space-y-3 opacity-0 pointer-events-none group-hover/rules:opacity-100 group-hover/rules:pointer-events-auto transition-all duration-300 transform translate-y-1 group-hover/rules:translate-y-0 z-50">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <strong className="text-slate-800 text-[12px] font-black">🏆 현재 설정된 점수 산출 배점</strong>
              <span className="text-[9px] text-blue-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/40">Riot API 연동</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">경기당 기본 승리</span>
                <div className="flex items-baseline gap-0.5">
                  <strong className="text-blue-600 font-black text-xs">+{rules.winPoints}</strong>
                  <span className="text-[10px] font-light text-blue-400">P</span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">경기당 기본 패배</span>
                <div className="flex items-baseline gap-0.5">
                  <strong className="text-rose-500 font-black text-xs">{rules.lossPoints}</strong>
                  <span className="text-[10px] font-light text-rose-400">P</span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">LP당 증감 가점</span>
                <span className="text-slate-400 font-bold text-[10px]">비활성화됨 (0P)</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">3연승 보너스</span>
                <div className="flex items-baseline gap-0.5">
                  <strong className="text-emerald-500 font-black text-xs">+{rules.winStreakBonuses?.[3] || 0}</strong>
                  <span className="text-[10px] font-light text-emerald-400">P</span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">{rules.lossStreakThreshold}연패 패널티</span>
                <div className="flex items-baseline gap-0.5">
                  <strong className="text-slate-800 font-black text-xs">{rules.lossStreakPenalty}</strong>
                  <span className="text-[10px] font-light text-slate-500">P</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50/30 rounded-xl p-2.5 border border-blue-100/30">
              <p className="text-[10px] text-blue-600 font-semibold leading-relaxed">
                * 전적 및 티어 갱신 시 실시간으로 계산되어 반영됩니다. (자동 동기화 1분 간격 자동 수행)
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* OBS Overlay Summary (Top 5) */}
      <div className="p-5 border-t border-slate-200 bg-slate-50/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CrownRankingIcon className="w-3.5 h-3.5 text-amber-500 shadow-amber-200" />
            <span className="text-[11px] font-bold text-slate-700 tracking-tight">종합 랭킹 TOP 5</span>
          </div>
        </div>
        <div className="space-y-1">
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
                <div key={player.id} className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-blue-200 transition-all group h-8.5">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-black font-mono shrink-0 ${
                      idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-slate-300 text-white' : idx === 2 ? 'bg-orange-300 text-white' : 'bg-slate-50 text-slate-400 border border-slate-100'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-[11px] font-bold text-slate-800 truncate w-11 shrink-0">{player.name}</span>
                    <span className={`text-[9px] font-semibold ${getTierColor(player.currentTier)} bg-slate-50 border border-slate-100/50 px-1 py-0.5 rounded w-[72px] shrink-0 truncate text-center`}>
                      {formatTier(player.currentTier, player.currentDivision).split(' ')[0]} {player.currentLp}L
                    </span>
                    <span className="text-[9px] text-slate-400 font-extrabold w-[48px] shrink-0 whitespace-nowrap text-center">
                      <span className="text-blue-500/70">{wins}W</span> {losses}L
                    </span>
                    <div className="w-[32px] shrink-0">
                      {streak > 0 && (
                        <span className="text-[8px] text-emerald-500 font-extrabold bg-emerald-50 border border-emerald-100/30 px-1 rounded block text-center truncate leading-none py-0.5">
                          {streak}🔥
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-baseline shrink-0 gap-0.5 pl-1 w-10 justify-end">
                    <strong className="text-[13px] font-black text-blue-600 font-sans tracking-tight leading-none">{player.totalPoints}</strong>
                    <span className="text-[8px] font-light text-blue-400">P</span>
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
