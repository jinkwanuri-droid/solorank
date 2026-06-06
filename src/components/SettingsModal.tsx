/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ContestRules, Participant, LoLTier } from '../types';
import { SettingsIcon, TrophyIcon, LivePulseIcon, SparklesIcon } from './AnimatedIcons';
import { SEED_PARTICIPANTS_TEXT, calculateParticipantScore, generateRandomMatch } from '../utils/lolMockData';
import CustomDateTimePicker from './CustomDateTimePicker';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: ContestRules;
  onSaveRules: (rules: ContestRules) => void;
  participants: Participant[];
  onUpdateParticipants: (participants: Participant[]) => void;
  onBulkAddMatches: (times: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  rules,
  onSaveRules,
  participants,
  onUpdateParticipants,
  onBulkAddMatches
}) => {
  const [activeTab, setActiveTab] = useState<'game' | 'participant'>('game');
  const [periodStart, setPeriodStart] = useState(rules.periodStart);
  const [periodEnd, setPeriodEnd] = useState(rules.periodEnd);
  const [lpMultiplier, setLpMultiplier] = useState(rules.lpMultiplier);
  const [winPoints, setWinPoints] = useState(rules.winPoints);
  const [lossPoints, setLossPoints] = useState(rules.lossPoints);
  const [winStreakThresholds, setWinStreakThresholds] = useState(rules.winStreakThresholds || { 3: 3, 5: 5, 7: 7, 10: 10 });
  const [winStreakBonuses, setWinStreakBonuses] = useState(rules.winStreakBonuses || { 3: 10, 5: 20, 7: 30, 10: 50 });
  const [lossStreakThreshold, setLossStreakThreshold] = useState(rules.lossStreakThreshold);
  const [lossStreakPenalty, setLossStreakPenalty] = useState(rules.lossStreakPenalty);
  const [riotApiKey, setRiotApiKey] = useState(rules.riotApiKey || '');
  
  const [bulkText, setBulkText] = useState('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  if (!isOpen) return null;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRules({
      periodStart,
      periodEnd,
      winPoints: Number(winPoints),
      lossPoints: Number(lossPoints),
      winStreakThresholds: {
        3: Number(winStreakThresholds[3]),
        5: Number(winStreakThresholds[5]),
        7: Number(winStreakThresholds[7]),
        10: Number(winStreakThresholds[10]),
      },
      winStreakBonuses: {
        3: Number(winStreakBonuses[3]),
        5: Number(winStreakBonuses[5]),
        7: Number(winStreakBonuses[7]),
        10: Number(winStreakBonuses[10]),
      },
      lossStreakThreshold: Number(lossStreakThreshold),
      lossStreakPenalty: Number(lossStreakPenalty),
      riotApiKey: riotApiKey
    });
    onClose();
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n');
    const newParticipantsList: Participant[] = [];

    lines.forEach((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 2) return;
      const [name, summonerPair] = parts;
      const hashIdx = summonerPair.indexOf('#');
      if (hashIdx === -1) return;

      const summonerName = summonerPair.substring(0, hashIdx);
      const tagLine = summonerPair.substring(hashIdx + 1);

      newParticipantsList.push({
        id: `p_${Math.random().toString(36).substring(2, 11)}`,
        name,
        summonerName,
        tagLine,
        startTier: 'DIAMOND',
        startDivision: 1,
        startLp: 0,
        currentTier: 'DIAMOND',
        currentDivision: 1,
        currentLp: 0,
        matches: [],
        lpDiffPoints: 0,
        winStreakPoints: 0,
        lossStreakPoints: 0,
        winStreakCount: 0,
        lossStreakCount: 0,
        totalPoints: 0
      });
    });

    onUpdateParticipants([...participants, ...newParticipantsList]);
    setImportFeedback(`${newParticipantsList.length}명의 참가자가 추가되었습니다.`);
    setBulkText('');
  };

  const handleClearParticipants = () => {
    if (confirm('삭제하시겠습니까?')) {
      onUpdateParticipants([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl transition-opacity duration-300" onClick={onClose} />
      
      <div className="relative w-[640px] h-[640px] rounded-[40px] bg-white border border-slate-200 shadow-2xl z-10 flex flex-col overflow-visible">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">관리 콘솔</h2>
          <div className="flex items-center bg-slate-100 rounded-full p-1">
            <button
              onClick={() => setActiveTab('game')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'game' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
            >
              게임 관리
            </button>
            <button
              onClick={() => setActiveTab('participant')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'participant' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
            >
              참가자 관리
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-none rounded-b-[40px]">
          {activeTab === 'game' ? (
            <form onSubmit={handleSaveConfig} className="space-y-10">
              <div>
                <h3 className="text-[13px] font-bold text-blue-600 uppercase tracking-[0.2em] mb-6">내기 시간 설정</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[12px] font-bold text-slate-400 tracking-tight">시작 일시</label>
                    </div>
                    <CustomDateTimePicker 
                      value={periodStart} 
                      onChange={setPeriodStart} 
                      label="시작 일시" 
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[12px] font-bold text-slate-400 tracking-tight">종료 일시</label>
                    </div>
                    <CustomDateTimePicker 
                      value={periodEnd} 
                      onChange={setPeriodEnd} 
                      label="종료 일시" 
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[13px] font-bold text-blue-600 uppercase tracking-wider mb-3">라이엇 API 키 설정 (Riot API Key)</h4>
                <div className="space-y-2">
                  <span className="block text-[11.5px] text-slate-400 font-medium leading-relaxed">
                    전적 연동을 위해 라이엇 개발자 포털에서 발급받은 API 키를 입력해주세요. 입력된 키는 안전하게 브라우저에 저장됩니다. (Vercel 배포 환경에서도 직접 입력하여 정상 작동합니다.)
                  </span>
                  <input 
                    type="text" 
                    value={riotApiKey} 
                    onChange={(e) => setRiotApiKey(e.target.value)} 
                    placeholder="RGAPI-xxxx-xxxx-xxxx"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl py-3 px-4 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all" 
                  />
                </div>
              </div>

              <div>
                <h4 className="text-[13px] font-bold text-blue-600 uppercase tracking-wider mb-4">포인트 규칙</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-tight ml-1">기본 승리 포인트</label>
                    <input type="number" value={winPoints} onChange={(e) => setWinPoints(Number(e.target.value))} className="w-full bg-emerald-50/30 border border-emerald-100 rounded-2xl py-3 px-4 text-sm text-emerald-600 font-bold focus:outline-none focus:border-emerald-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-tight ml-1">기본 패배 감점</label>
                    <input type="number" value={lossPoints} onChange={(e) => setLossPoints(Number(e.target.value))} className="w-full bg-rose-50/30 border border-rose-100 rounded-2xl py-3 px-4 text-sm text-rose-600 font-bold focus:outline-none focus:border-rose-500 transition-all" />
                  </div>
                </div>
                
                <h4 className="text-[13px] font-bold text-blue-600 uppercase tracking-wider mt-8 mb-4">연승 보너스 설정</h4>
                <div className="grid grid-cols-4 gap-4">
                  {[3, 5, 7, 10].map(s => (
                    <div key={s} className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-400 tracking-tight ml-1">{s}연승 추가</label>
                      <input type="number" value={winStreakBonuses[s as 3|5|7|10]} onChange={(e) => setWinStreakBonuses(prev => ({...prev, [s]: Number(e.target.value)}))} className="w-full bg-blue-50/30 border border-blue-100 rounded-xl py-2.5 px-3 text-xs text-blue-600 font-black focus:outline-none focus:border-blue-500 transition-all text-center" />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-2">
                <button type="submit" className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold text-sm hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-[0.98]">
                  설정 저장 및 업데이트
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[13px] font-bold text-blue-600 uppercase tracking-wider">참가자 목록</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsEditMode(!isEditMode)} 
                      className={`text-[11px] px-3.5 py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
                        isEditMode 
                          ? 'bg-rose-50 border-rose-200 text-rose-600' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {isEditMode ? '수정 완료' : '수정'}
                    </button>
                    <button 
                      onClick={() => setIsBulkOpen(true)} 
                      className="text-[11px] bg-slate-900 text-white px-3.5 py-1.5 rounded-xl font-bold hover:bg-black transition-colors"
                    >
                      대량 등록
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-none">
                  {participants.map(p => (
                    <div 
                      key={p.id} 
                      className="flex justify-between items-center py-1.5 px-4 bg-slate-50 hover:bg-slate-100/50 rounded-xl transition-colors duration-150"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-extrabold text-slate-800 shrink-0">{p.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono font-bold truncate">{p.summonerName}#{p.tagLine}</span>
                      </div>
                      
                      {isEditMode && (
                        <button 
                          onClick={() => onUpdateParticipants(participants.filter(item => item.id !== p.id))} 
                          className="text-[10px] text-rose-600 font-black bg-rose-50 hover:bg-rose-100 border border-rose-100 px-2 py-0.5 rounded-md transition-all duration-200"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  ))}
                  {participants.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
                      <span className="text-xs text-slate-400 font-medium">참가자가 존재하지 않습니다.<br />대량 등록으로 추가해 보세요!</span>
                    </div>
                  )}
                </div>
              </div>

              {isBulkOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
                  <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
                    <h4 className="text-sm font-bold text-slate-800 mb-4">대량 등록</h4>
                    <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="홍길동 길동#KR1" rows={6} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-xs text-slate-800 mb-4 font-mono" />
                    <div className="flex gap-2">
                      <button onClick={() => { handleBulkImport(); setIsBulkOpen(false); }} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-bold">등록</button>
                      <button onClick={() => setIsBulkOpen(false)} className="bg-slate-200 py-2 px-4 rounded-lg text-xs font-bold">취소</button>
                    </div>
                    {importFeedback && <p className="text-xs text-blue-600 mt-2 font-bold">{importFeedback}</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
