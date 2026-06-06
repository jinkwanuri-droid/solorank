/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Participant, ContestRules } from './types';
import { Sidebar } from './components/Sidebar';
import { MainList } from './components/MainList';
import { SettingsModal } from './components/SettingsModal';
import { DetailView } from './components/DetailView';
import { calculateParticipantScore, generateRandomMatch } from './utils/lolMockData';

// Starting default rules parameters
const DEFAULT_RULES: ContestRules = {
  periodStart: new Date(new Date().getTime() - 24 * 60 * 60 * 1000 * 2).toISOString(), // 2 days ago
  periodEnd: new Date(new Date().getTime() + 24 * 60 * 60 * 1000 * 5).toISOString(), // 5 days from now
  winPoints: 15,
  lossPoints: -10,
  winStreakThresholds: {
    3: 3,
    5: 5,
    7: 7,
    10: 10
  },
  winStreakBonuses: {
    3: 10,
    5: 20,
    7: 30,
    10: 50
  },
  lossStreakThreshold: 3,
  lossStreakPenalty: 15,
  riotApiKey: import.meta.env.VITE_RIOT_API_KEY || ''
};

export default function App() {
  const [rules, setRules] = useState<ContestRules>(DEFAULT_RULES);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  
  // Modal visibility states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Load initial State from localStorage or seed
  useEffect(() => {
    const savedRules = localStorage.getItem('lol_contest_rules');
    const savedParticipants = localStorage.getItem('lol_contest_participants');

    if (savedRules) {
      try {
        const parsed = JSON.parse(savedRules);
        parsed.riotApiKey = import.meta.env.VITE_RIOT_API_KEY || '';
        // Merge with DEFAULT_RULES to ensure new fields (like winStreakBonuses object) are present
        setRules({ ...DEFAULT_RULES, ...parsed });
      } catch (e) {
        console.error('Error parsing rules', e);
      }
    }

    if (savedParticipants) {
      try {
        const parsedParticipants = JSON.parse(savedParticipants);
        // Re-calculate scores upon load to ensure they match current rules logic
        const currentRules = savedRules ? { ...DEFAULT_RULES, ...JSON.parse(savedRules) } : DEFAULT_RULES;
        const recalculated = parsedParticipants.map((p: Participant) => calculateParticipantScore(p, currentRules));
        setParticipants(recalculated);
        return;
      } catch (e) {
        console.error('Error parsing participants', e);
      }
    }

    // Pre-seed elite players on first run
    const seedRules = savedRules ? { ...DEFAULT_RULES, ...JSON.parse(savedRules) } : DEFAULT_RULES;
    const seeds: Participant[] = [
      {
        id: 'seed_1',
        name: '쵸비',
        summonerName: 'GEN Chovy',
        tagLine: 'KR1',
        startTier: 'CHALLENGER',
        startDivision: 1,
        startLp: 1200,
        currentTier: 'CHALLENGER',
        currentDivision: 1,
        currentLp: 1200,
        matches: [],
        lpDiffPoints: 0,
        winStreakPoints: 0,
        lossStreakPoints: 0,
        winStreakCount: 0,
        lossStreakCount: 0,
        totalPoints: 0
      },
      {
        id: 'seed_2',
        name: '페이커',
        summonerName: 'T1 Faker',
        tagLine: 'KR1',
        startTier: 'GRANDMASTER',
        startDivision: 1,
        startLp: 680,
        currentTier: 'GRANDMASTER',
        currentDivision: 1,
        currentLp: 680,
        matches: [],
        lpDiffPoints: 0,
        winStreakPoints: 0,
        lossStreakPoints: 0,
        winStreakCount: 0,
        lossStreakCount: 0,
        totalPoints: 0
      },
      {
        id: 'seed_3',
        name: '쇼메이커',
        summonerName: 'DK Showmaker',
        tagLine: 'KR1',
        startTier: 'MASTER',
        startDivision: 1,
        startLp: 150,
        currentTier: 'MASTER',
        currentDivision: 1,
        currentLp: 150,
        matches: [],
        lpDiffPoints: 0,
        winStreakPoints: 0,
        lossStreakPoints: 0,
        winStreakCount: 0,
        lossStreakCount: 0,
        totalPoints: 0
      },
      {
        id: 'seed_4',
        name: '구마유시',
        summonerName: 'Gumayusi',
        tagLine: 'KR1',
        startTier: 'DIAMOND',
        startDivision: 1,
        startLp: 20,
        currentTier: 'DIAMOND',
        currentDivision: 1,
        currentLp: 20,
        matches: [],
        lpDiffPoints: 0,
        winStreakPoints: 0,
        lossStreakPoints: 0,
        winStreakCount: 0,
        lossStreakCount: 0,
        totalPoints: 0
      },
      {
        id: 'seed_5',
        name: '케리아',
        summonerName: 'Keria',
        tagLine: 'KR1',
        startTier: 'GRANDMASTER',
        startDivision: 1,
        startLp: 540,
        currentTier: 'GRANDMASTER',
        currentDivision: 1,
        currentLp: 540,
        matches: [],
        lpDiffPoints: 0,
        winStreakPoints: 0,
        lossStreakPoints: 0,
        winStreakCount: 0,
        lossStreakCount: 0,
        totalPoints: 0
      }
    ];

    // Seed 4-8 matches chronologically for each elite participant to instantly show gorgeous charts!
    const preSeeded = seeds.map(p => {
      let curP = { ...p };
      const matchCount = Math.floor(Math.random() * 5) + 4; // 4 to 8 games
      for (let i = 0; i < matchCount; i++) {
        // Distribute game startTime within start and now
        const matchTime = new Date(new Date(seedRules.periodStart).getTime() + Math.random() * (new Date().getTime() - new Date(seedRules.periodStart).getTime())).toISOString();
        const randMatch = generateRandomMatch(curP, seedRules, matchTime);
        curP.matches.push(randMatch);
        curP = calculateParticipantScore(curP, seedRules);
      }
      return curP;
    });

    setParticipants(preSeeded);
    localStorage.setItem('lol_contest_participants', JSON.stringify(preSeeded));
  }, []);

  // Update dynamic scores whenever rules parameters swap
  const handleSaveRules = (updatedRules: ContestRules) => {
    setRules(updatedRules);
    localStorage.setItem('lol_contest_rules', JSON.stringify(updatedRules));

    // Re-score every single participant based on newly assigned rules multipliers
    const updatedParticipants = participants.map((p) => calculateParticipantScore(p, updatedRules));
    setParticipants(updatedParticipants);
    localStorage.setItem('lol_contest_participants', JSON.stringify(updatedParticipants));

    // Sync selected participant drawer to preserve mathematical updates live
    if (selectedParticipant) {
      const freshSelected = updatedParticipants.find(p => p.id === selectedParticipant.id);
      if (freshSelected) setSelectedParticipant(freshSelected);
    }
  };

  const handleUpdateParticipants = (updatedList: Participant[]) => {
    setParticipants(updatedList);
    localStorage.setItem('lol_contest_participants', JSON.stringify(updatedList));
    
    if (selectedParticipant) {
      const freshSelected = updatedList.find(p => p.id === selectedParticipant.id);
      setSelectedParticipant(freshSelected || null);
    }
  };

  // 2. Real-time data sync handler: fetches actual Riot API data through our proxy
  const handleSyncAll = async () => {
    if (participants.length === 0 || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const updatedParticipants = [...participants];
      
      for (let i = 0; i < updatedParticipants.length; i++) {
        const p = updatedParticipants[i];
        try {
          const response = await fetch('/api/lol/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participant: p, rules })
          });
          
          if (response.ok) {
            const syncedData = await response.json();
            // Calculate score based on new matches and tier info
            updatedParticipants[i] = calculateParticipantScore(syncedData, rules);
          }
        } catch (err) {
          console.error(`Failed to sync ${p.name}:`, err);
        }
      }
      
      setParticipants(updatedParticipants);
      localStorage.setItem('lol_contest_participants', JSON.stringify(updatedParticipants));
      
      if (selectedParticipant) {
        const freshSelected = updatedParticipants.find(p => p.id === selectedParticipant.id);
        if (freshSelected) setSelectedParticipant(freshSelected);
      }
      
      alert('모든 참가자의 전적이 실시간으로 동기화되었습니다.');
    } catch (e) {
      console.error('Sync process failed:', e);
      alert('동기화 중 오류가 발생했습니다. API 키 및 네트워킹 상태를 확인해주세요.');
    } finally {
      setIsSyncing(false);
    }
  };

  // 3. Bulk match simulation processor for all active players
  const handleBulkAddMatches = (count: number) => {
    if (participants.length === 0) return;

    const startMs = new Date(rules.periodStart).getTime();
    const nowMs = new Date().getTime();

    const updatedParticipants = participants.map((p) => {
      let curP = { ...p };
      for (let i = 0; i < count; i++) {
        // Generate a random timestamp distributed inside start time and now
        const matchTime = new Date(startMs + Math.random() * (nowMs - startMs)).toISOString();
        const randMatch = generateRandomMatch(curP, rules, matchTime);
        curP.matches.push(randMatch);
        curP = calculateParticipantScore(curP, rules);
      }
      return curP;
    });

    setParticipants(updatedParticipants);
    localStorage.setItem('lol_contest_participants', JSON.stringify(updatedParticipants));

    if (selectedParticipant) {
      const freshSelected = updatedParticipants.find(p => p.id === selectedParticipant.id);
      if (freshSelected) {
        setSelectedParticipant(freshSelected);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#EBF1F7] flex relative overflow-hidden font-sans text-slate-800">
      
      {/* Real-time moving decorative mesh overlays */}
      <div className="glow-mesh opacity-10" />
      <div className="glow-mesh-2 opacity-10" />

      {/* 400px Broad Sidebar block, custom aligned */}
      <Sidebar
        rules={rules}
        participants={participants}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRunSimulation={handleSyncAll}
        isSyncing={isSyncing}
      />

      {/* Main leaderboard scroll panel */}
      <MainList
        participants={participants}
        rules={rules}
        onSelectParticipant={(p) => setSelectedParticipant(p)}
      />

      {/* Settings Modal controller */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        rules={rules}
        onSaveRules={handleSaveRules}
        participants={participants}
        onUpdateParticipants={handleUpdateParticipants}
        onBulkAddMatches={handleBulkAddMatches}
      />

      {/* Detailed Match Drawer Overlay card */}
      {selectedParticipant && (
        <DetailView
          participant={selectedParticipant}
          onClose={() => setSelectedParticipant(null)}
          rules={rules}
        />
      )}
    </div>
  );
}
