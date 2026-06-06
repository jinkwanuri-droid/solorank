/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LoLTier = 'CHALLENGER' | 'GRANDMASTER' | 'MASTER' | 'DIAMOND' | 'EMERALD' | 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'IRON';

export interface MatchRecord {
  id: string;
  gameId: string;
  win: boolean;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  damageDealt: number;
  damageTaken: number;
  cs: number;
  duration: number; // in seconds
  gameStartTime: string; // ISO string
  lpChange: number; // e.g. 20, -15
  tierAfter: LoLTier;
  lpAfter: number;
  divisionAfter: number;
}

export interface Participant {
  id: string;
  name: string; // e.g., 홍길동
  summonerName: string; // e.g., Hide on bush
  tagLine: string; // e.g., KR1
  
  // Starting state
  startTier: LoLTier;
  startDivision: number; // 1-4
  startLp: number; // 0-100 (or unlimited for Master+)
  
  // Current state
  currentTier: LoLTier;
  currentDivision: number;
  currentLp: number;
  
  // Accumulated statistics
  matches: MatchRecord[];
  
  // Calculated Points
  lpDiffPoints: number; // Points from LP difference
  winStreakPoints: number; // Bonus points from winning streak
  lossStreakPoints: number; // Penalty/Points from losing streak
  winStreakCount: number; // Current active win streak
  lossStreakCount: number; // Current active loss streak
  totalPoints: number; // Final combined scoreboard score
}

export interface ContestRules {
  periodStart: string; // ISO datetime
  periodEnd: string; // ISO datetime
  winPoints: number; // static points per win
  lossPoints: number; // static points per loss
  winStreakThresholds: {
    3: number;
    5: number;
    7: number;
    10: number;
  };
  winStreakBonuses: {
    3: number;
    5: number;
    7: number;
    10: number;
  };
  lossStreakThreshold: number; // e.g., 3 consecutive losses
  lossStreakPenalty: number; // e.g., 30 points penalty per extra loss on streak
  riotApiKey?: string; // Riot Dev API Key
}
