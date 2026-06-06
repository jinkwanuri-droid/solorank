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

import { saveContestData, loadContestData } from './db/firebase';

// ... (Rest remains the same)
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
  riotApiKey: '',
};

export default function App() {
  const [rules, setRules] = useState<ContestRules>(DEFAULT_RULES);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  
  // Use refs to keep newest states available for background timers
  const participantsRef = React.useRef<Participant[]>([]);
  const rulesRef = React.useRef<ContestRules>(DEFAULT_RULES);
  const initialSyncDone = React.useRef(false);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  useEffect(() => {
    rulesRef.current = rules;
  }, [rules]);

  // Modal visibility states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Synchronize rules & participants with Firestore dynamically
  const syncToBackend = async (currentRules: ContestRules, currentParticipants: Participant[]) => {
    try {
      await saveContestData(currentRules, currentParticipants);
    } catch (e) {
      console.warn('Failed to sync data to Firestore:', e);
    }
  };

  // 1. Load initial State from server database or fallback to localStorage / seed
  useEffect(() => {
    const loadInitialData = async () => {
      let isLoadedFromServer = false;
      try {
        const serverData = await loadContestData();
        if (serverData && serverData.rules && serverData.participants) {
          setRules(serverData.rules);
          const recalculated = serverData.participants.map((p: Participant) => 
            calculateParticipantScore(p, serverData.rules)
          );
          setParticipants(recalculated);
          isLoadedFromServer = true;
        }
      } catch (err) {
        console.warn("Failed to load initial data from server. Fallback to local storage or seeds.", err);
      }

      if (isLoadedFromServer) return;

      const savedRules = localStorage.getItem('lol_contest_rules');
      const savedParticipants = localStorage.getItem('lol_contest_participants');
      let currentRules = DEFAULT_RULES;

      if (savedRules) {
        try {
          const parsed = JSON.parse(savedRules);
          currentRules = { ...DEFAULT_RULES, ...parsed };
          setRules(currentRules);
        } catch (e) {
          console.error('Error parsing rules', e);
        }
      }

      if (savedParticipants) {
        try {
          const parsedParticipants = JSON.parse(savedParticipants);
          const recalculated = parsedParticipants.map((p: Participant) => calculateParticipantScore(p, currentRules));
          setParticipants(recalculated);
          syncToBackend(currentRules, recalculated);
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
    syncToBackend(seedRules, preSeeded);
  };

  loadInitialData();
}, []);

  // Update dynamic scores whenever rules parameters swap
  const handleSaveRules = (updatedRules: ContestRules) => {
    setRules(updatedRules);
    localStorage.setItem('lol_contest_rules', JSON.stringify(updatedRules));

    // Re-score every single participant based on newly assigned rules multipliers
    const updatedParticipants = participants.map((p) => calculateParticipantScore(p, updatedRules));
    setParticipants(updatedParticipants);
    localStorage.setItem('lol_contest_participants', JSON.stringify(updatedParticipants));
    syncToBackend(updatedRules, updatedParticipants);

    // Sync selected participant drawer to preserve mathematical updates live
    if (selectedParticipant) {
      const freshSelected = updatedParticipants.find(p => p.id === selectedParticipant.id);
      if (freshSelected) setSelectedParticipant(freshSelected);
    }
  };

  const handleUpdateParticipants = (updatedList: Participant[]) => {
    setParticipants(updatedList);
    localStorage.setItem('lol_contest_participants', JSON.stringify(updatedList));
    syncToBackend(rules, updatedList);
    
    if (selectedParticipant) {
      const freshSelected = updatedList.find(p => p.id === selectedParticipant.id);
      setSelectedParticipant(freshSelected || null);
    }
  };

  // 2. Real-time data sync handler: fetches actual Riot API data through our proxy
  const handleSyncAll = async (isSilent = false) => {
    const currentParticipants = participantsRef.current;
    const currentRules = rulesRef.current;
    if (currentParticipants.length === 0 || isSyncing) return;
    
    setIsSyncing(true);
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    try {
      const updatedParticipants = [...currentParticipants];
      
      for (let i = 0; i < updatedParticipants.length; i++) {
        const p = updatedParticipants[i];
        let retryCount = 0;
        const maxRetries = 2;
        let success = false;

        while (retryCount <= maxRetries && !success) {
          try {
            // Increased delay to respect strict Riot Dev Key 2-minute limits
            if (i > 0 || retryCount > 0) await delay(2000); 

            const response = await fetch('/api/lol/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ participant: p, rules: currentRules })
            });
            
            if (response.ok) {
              const syncedData = await response.json();
              
              if (syncedData.syncStatus === 'failed') {
                updatedParticipants[i] = {
                  ...p,
                  syncStatus: 'failed',
                  syncWarning: syncedData.syncWarning || '연동 실패'
                };
                success = true;
                continue;
              }

              updatedParticipants[i] = calculateParticipantScore(syncedData, currentRules);
              success = true;
            } else if (response.status === 429) {
              throw new Error('429_TOO_MANY_REQUESTS');
            } else {
              console.error(`Failed to sync ${p.name}: HTTP ${response.status}`);
              updatedParticipants[i] = { ...p, syncStatus: 'failed', syncWarning: `HTTP ${response.status}` };
              success = true; 
            }
          } catch (err: any) {
            if (err.message === '429_TOO_MANY_REQUESTS') {
              retryCount++;
              if (retryCount <= maxRetries) {
                await delay(5000 * retryCount);
                continue; 
              }
            }
            console.error(`Failed to sync ${p.name}:`, err);
            updatedParticipants[i] = { ...p, syncStatus: 'failed', syncWarning: '연동 오류' };
            success = true;
          }
        }
      }
      
      setParticipants(updatedParticipants);
      localStorage.setItem('lol_contest_participants', JSON.stringify(updatedParticipants));
      syncToBackend(currentRules, updatedParticipants);
      
      setSelectedParticipant(prevSelected => {
        if (!prevSelected) return null;
        const freshSelected = updatedParticipants.find(p => p.id === prevSelected.id);
        return freshSelected || null;
      });
      
      if (!isSilent) {
        alert('모든 참가자의 전적이 실시간으로 동기화되었습니다.');
      }
    } catch (e) {
      console.error('Sync process failed:', e);
      if (!isSilent) {
        alert('동기화 중 오류가 발생했습니다. API 키 및 네트워킹 상태를 확인해주세요.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Trigger silent sync automatically on page load once participants are populated
  useEffect(() => {
    if (participants.length > 0 && !initialSyncDone.current) {
      initialSyncDone.current = true;
      handleSyncAll(true);
    }
  }, [participants]);

  // Set up 30-second automatic sync interval
  useEffect(() => {
    const timer = setInterval(() => {
      handleSyncAll(true);
    }, 30000); // 30 seconds (30,000ms)

    return () => clearInterval(timer);
  }, []);

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
    syncToBackend(rules, updatedParticipants);

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

      {/* 350px Broad Sidebar block, custom aligned */}
      <Sidebar
        rules={rules}
        participants={participants}
        onOpenSettings={() => setIsSettingsOpen(true)}
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
