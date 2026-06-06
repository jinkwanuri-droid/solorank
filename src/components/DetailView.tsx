/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Participant, MatchRecord, ContestRules } from '../types';
import { 
  TrophyIcon, 
  SwordsIcon, 
  ShieldIcon, 
  BoltIcon, 
  VictoryBadge, 
  DefeatBadge, 
  TrendUpIcon, 
  TrendDownIcon 
} from './AnimatedIcons';
import { 
  getChampGrad, 
  formatTier, 
  getTierColor 
} from '../utils/lolMockData';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';

interface DetailViewProps {
  participant: Participant | null;
  onClose: () => void;
  rules: ContestRules;
}

export const DetailView: React.FC<DetailViewProps> = ({ participant, onClose, rules }) => {
  if (!participant) return null;

  const totalGames = participant.matches.length;
  const winCount = participant.matches.filter(m => m.win).length;
  const winRate = totalGames > 0 ? Math.round((winCount / totalGames) * 100) : 0;
  
  // Calculate average stats
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalDamageDealt = 0;
  let totalDamageTaken = 0;
  let totalCs = 0;

  participant.matches.forEach(m => {
    totalKills += m.kills;
    totalDeaths += m.deaths;
    totalAssists += m.assists;
    totalDamageDealt += m.damageDealt;
    totalDamageTaken += m.damageTaken;
    totalCs += m.cs;
  });

  const avgKills = totalGames > 0 ? (totalKills / totalGames).toFixed(1) : '0.0';
  const avgDeaths = totalGames > 0 ? (totalDeaths / totalGames).toFixed(1) : '0.0';
  const avgAssists = totalGames > 0 ? (totalAssists / totalGames).toFixed(1) : '0.0';
  const avgKda = totalDeaths > 0 
    ? ((totalKills + totalAssists) / totalDeaths).toFixed(2) 
    : (totalKills + totalAssists).toFixed(2);

  // Group most played champions
  const champCounts: { [key: string]: number } = {};
  participant.matches.forEach(m => {
    champCounts[m.championName] = (champCounts[m.championName] || 0) + 1;
  });
  const sortedChamps = Object.entries(champCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Chart data: LP trend
  // We plot starting LP then matching cumulative LP
  const lpTrendData = [{
    name: '시작',
    lp: 0,
    fullLpLabel: `${formatTier(participant.startTier, participant.startDivision)} ${participant.startLp}LP`
  }];
  
  let tempAbsLp = 0; 
  // Let's accumulate LP difference changes
  participant.matches.forEach((m, idx) => {
    tempAbsLp += m.lpChange;
    lpTrendData.push({
      name: `G${idx + 1}`,
      lp: tempAbsLp,
      fullLpLabel: `${formatTier(m.tierAfter, m.divisionAfter)} ${m.lpAfter}LP (${m.lpChange > 0 ? '+' : ''}${m.lpChange})`
    });
  });

  // Chart data: Damage dealt vs damage taken
  const lastFiveMatches = [...participant.matches].slice(-5);
  const damageData = lastFiveMatches.map((m, idx) => ({
    name: `${idx + 1}경기 (${m.championName})`,
    '가한 피해량': m.damageDealt,
    '받은 피해량': m.damageTaken
  }));

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Glassmorphic backdrop with dark tint & blur */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-xl transition-opacity duration-300" 
        onClick={onClose} 
      />
      
      {/* Detailed Modal Box */}
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 p-6 md:p-8 text-slate-700 shadow-2xl z-10 scrollbar-none">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full bg-slate-100 p-2.5 text-slate-500 hover:text-slate-800 border border-slate-200 h-11 w-11 flex items-center justify-center cursor-pointer transition-all hover:bg-slate-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Participant Summoner Header Cards */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center border border-blue-200">
                <span className="text-2xl font-black tracking-tight text-white">{participant.name.slice(0, 2)}</span>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{participant.name}</h2>
                <span className="text-xs text-blue-600 border border-blue-200 px-2.5 py-0.5 rounded-full bg-blue-50 font-mono font-bold">
                  {participant.summonerName}#{participant.tagLine}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                <span>현재 티어: <strong className={`${getTierColor(participant.currentTier)} font-bold`}>{formatTier(participant.currentTier, participant.currentDivision)}</strong></span>
                <span>•</span>
                <span>{participant.currentLp} LP</span>
                <span>•</span>
                <span className="text-slate-400 font-medium">시작: {formatTier(participant.startTier, participant.startDivision)} {participant.startLp}LP</span>
              </div>
            </div>
          </div>

          {/* Quick Win Rates Indicator Grid */}
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2">
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">전적</span>
              <strong className="text-lg text-slate-800 font-bold">{totalGames}전 {winCount}승 {totalGames - winCount}패</strong>
            </div>
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2">
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">승률</span>
              <strong className="text-lg text-blue-600 font-bold">{winRate}%</strong>
            </div>
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2">
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">평균 KDA</span>
              <strong className="text-lg text-indigo-600 font-bold">{avgKda}</strong>
            </div>
          </div>
        </div>

        {/* Average statistics widgets row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between shadow-xs">
            <div>
              <span className="block text-xs text-slate-500">평균 K/D/A</span>
              <strong className="text-lg text-slate-800 font-bold">{avgKills} / {avgDeaths} / {avgAssists}</strong>
            </div>
            <BoltIcon className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between shadow-xs">
            <div>
              <span className="block text-xs text-slate-500">평균 CS</span>
              <strong className="text-lg text-slate-800 font-bold">{(totalCs / (totalGames || 1)).toFixed(0)}개</strong>
            </div>
            <TrophyIcon className="w-8 h-8 text-amber-500" />
          </div>
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between shadow-xs">
            <div>
              <span className="block text-xs text-slate-500">모스트 챔피언</span>
              <span className="block text-sm text-blue-600 font-bold">
                {sortedChamps.length > 0 ? sortedChamps.map(c => `${c[0]}`).join(', ') : '없음'}
              </span>
            </div>
            <SwordsIcon className="w-8 h-8 text-blue-500" />
          </div>
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between shadow-xs">
            <div>
              <span className="block text-xs text-slate-500">획득한 포인트</span>
              <div className="flex items-baseline gap-0.5">
                <strong className="text-xl text-blue-600 font-extrabold font-sans leading-none">{participant.totalPoints}</strong>
                <span className="text-xs text-blue-400 font-light font-sans">P</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
              {participant.totalPoints >= 0 ? <TrendUpIcon className="w-5 h-5 text-emerald-600" /> : <TrendDownIcon className="w-5 h-5 text-rose-600" />}
            </div>
          </div>
        </div>

        {/* Recharts Analytics Charts - LP progression & Damage chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* LP Trend Area Graph */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 block">누적 LP 변화 추이 (시작 대비 증감)</h3>
            <div className="h-48 w-full font-mono text-[10px]">
              {totalGames > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={lpTrendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lpGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b' }}
                      labelClassName="text-blue-600"
                    />
                    <Area type="monotone" dataKey="lp" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#lpGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">진행한 경기가 없어 추이 그래프를 생성할 수 없습니다.</div>
              )}
            </div>
          </div>

          {/* Damage Comparative Bar Chart */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 block">최근 5경기 딜량 대 칼 방어대량 비교</h3>
            <div className="h-48 w-full font-mono text-[10px]">
              {totalGames > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={damageData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }} />
                    <Legend verticalAlign="top" height={24} />
                    <Bar dataKey="가한 피해량" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="받은 피해량" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">진행한 경기가 없어 통계 전적 차트를 생성할 수 없습니다.</div>
              )}
            </div>
          </div>
        </div>

        {/* Personal Game log breakdown */}
        <div>
          <h3 className="text-sm font-bold tracking-wider text-slate-800 uppercase mb-4">상세 전적 히스토리 (최신순)</h3>
          
          <div className="space-y-3">
            {participant.matches.length > 0 ? (
              [...participant.matches].reverse().map((match, idx) => (
                <div 
                  key={match.id}
                  className={`relative p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all apple-glass-card-hover ${
                    match.win 
                      ? 'bg-blue-50/80 hover:bg-blue-105 border-blue-200/60' 
                      : 'bg-slate-50/80 hover:bg-slate-105 border-slate-200/80'
                  }`}
                >
                  {/* Left Column: Result & Champ */}
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      {match.win ? <VictoryBadge className="w-8 h-8 text-blue-600" /> : <DefeatBadge className="w-8 h-8 text-slate-500" />}
                      <span className={`text-[10px] font-black tracking-widest mt-1 ${match.win ? 'text-blue-600' : 'text-slate-500'}`}>
                        {match.win ? 'VICTORY' : 'DEFEAT'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getChampGrad(match.championName)} p-2 flex items-center justify-center border border-white/20`}>
                        <span className="text-xs font-semibold text-white tracking-tighter">{match.championName}</span>
                      </div>
                      <div>
                        <strong className="text-sm text-slate-800">{match.championName}</strong>
                        <div className="text-[11px] text-slate-500 mt-0.5">{formatDuration(match.duration)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: KDA, damage indicators */}
                  <div className="flex items-center gap-6 justify-between md:justify-start">
                    <div className="text-center md:text-left min-w-[80px]">
                      <span className="block text-xs font-medium text-slate-500">
                        <strong className="text-slate-800 font-bold">{match.kills}</strong> / <strong className="text-rose-600 font-bold">{match.deaths}</strong> / <strong className="text-slate-800 font-bold">{match.assists}</strong>
                      </span>
                      <span className="block text-[10px] text-indigo-600 mt-0.5 font-bold">
                        KDA {match.deaths > 0 ? ((match.kills + match.assists) / match.deaths).toFixed(2) : (match.kills + match.assists).toFixed(2)}
                      </span>
                    </div>

                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500">CS:</span>
                        <span className="text-xs text-slate-700">{match.cs}개</span>
                        <span className="text-[10px] text-slate-400">({(match.cs / (match.duration / 60)).toFixed(1)}/m)</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-500">딜량:</span>
                        <span className="text-xs text-blue-600 font-bold">{(match.damageDealt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Time & LP Shift */}
                  <div className="flex items-center justify-between md:justify-end gap-6">
                    <div className="text-right hidden sm:block">
                      <span className="block text-xs text-slate-500 font-mono">
                        {new Date(match.gameStartTime).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="block text-[11px] text-slate-400 mt-0.5">
                        {formatTier(match.tierAfter, match.divisionAfter)} {match.lpAfter}LP
                      </span>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <span className={`text-sm font-black tracking-tight ${match.lpChange > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {match.lpChange > 0 ? `+${match.lpChange}` : match.lpChange} LP
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-3xl text-slate-400">
                기록된 매치 리스트가 비어있습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
