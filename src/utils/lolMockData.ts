/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LoLTier, MatchRecord, Participant, ContestRules } from '../types';

// Absolute LP conversion weights
// Each division in Iron to Diamond is 100 LP. Each Tier has 4 divisions = 400 LP.
// Master, Grandmaster, Challenger share a flat continuous LP pool starting at 2800 LP.
export const TIER_ORDER: LoLTier[] = [
  'IRON',
  'BRONZE',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'EMERALD',
  'DIAMOND',
  'MASTER',
  'GRANDMASTER',
  'CHALLENGER'
];

export function getAbsoluteLp(tier: LoLTier, division: number, lp: number): number {
  const tierIndex = TIER_ORDER.indexOf(tier);
  
  if (tierIndex < 7) {
    // Iron to Diamond: each tier has 4 divisions (4 to 1)
    // Division 4 is offset 0, Division 3 is offset 100, Division 2 is offset 200, Division 1 is offset 300
    const divisionOffset = (4 - division) * 100;
    return tierIndex * 400 + divisionOffset + lp;
  } else {
    // Master, Grandmaster, Challenger: division doesn't partition into 100 LP boundaries.
    // Master starts at 2800 LP.
    // Grandmaster starts at 3300 LP.
    // Challenger starts at 3800 LP.
    const baseOffset = 2800;
    let extraOffset = 0;
    if (tier === 'GRANDMASTER') extraOffset = 500;
    if (tier === 'CHALLENGER') extraOffset = 1000;
    return baseOffset + extraOffset + lp;
  }
}

export function getTierDivisionLpFromAbsolute(absoluteLp: number): { tier: LoLTier, division: number, lp: number } {
  if (absoluteLp >= 2800) {
    // Master+
    const masterLp = absoluteLp - 2800;
    if (masterLp >= 1000) {
      return { tier: 'CHALLENGER', division: 1, lp: masterLp - 1000 };
    } else if (masterLp >= 500) {
      return { tier: 'GRANDMASTER', division: 1, lp: masterLp - 500 };
    } else {
      return { tier: 'MASTER', division: 1, lp: masterLp };
    }
  }
  
  const tierIndex = Math.floor(absoluteLp / 400);
  const remainingLp = absoluteLp % 400;
  const divisionOffset = Math.floor(remainingLp / 100);
  const division = 4 - divisionOffset;
  const lp = remainingLp % 100;
  
  return {
    tier: TIER_ORDER[tierIndex],
    division,
    lp
  };
}

export const CHAMPION_POOL = [
  '아리', '이즈리얼', '리 신', '야스오', '야네', '제드', '진', '럭스', '카이사', '스웨인',
  '아칼리', '트레쉬', '제이스', '다리우스', '사일러스', '티모', '바이', '징크스', '아트록스',
  '말파이트', '블리츠크랭크', '오리아나', '조이', '가렌', '애쉬', '신 짜오', '카타리나', '판테온',
  '킨드레드', '헤카림', '이렐리아', '피오라', '피즈', '르블랑', '제리', '사미라', '나피리', '브라이어'
];

export const CHAMP_COLORS: { [key: string]: string } = {
  '아리': 'from-pink-500 to-rose-400',
  '이즈리얼': 'from-yellow-400 to-amber-500',
  '리 신': 'from-red-600 to-orange-500',
  '야스오': 'from-blue-500 to-indigo-600',
  '야네': 'from-purple-600 to-indigo-700',
  '제드': 'from-neutral-800 to-red-900',
  '진': 'from-stone-500 to-neutral-700',
  '럭스': 'from-yellow-300 to-cyan-300',
  '카이사': 'from-purple-500 to-fuchsia-600',
  '스웨인': 'from-red-950 to-emerald-950',
  '아칼리': 'from-teal-800 to-emerald-600',
  '트레쉬': 'from-cyan-900 to-emerald-800',
  '제이스': 'from-blue-400 to-sky-600',
  '다리우스': 'from-red-800 to-stone-800',
  '사일러스': 'from-sky-700 to-indigo-900',
  '티모': 'from-emerald-400 to-yellow-400',
  '징크스': 'from-pink-500 to-cyan-400',
  '아트록스': 'from-amber-900 to-red-800',
  '가렌': 'from-yellow-500 to-blue-800',
  '애쉬': 'from-cyan-400 to-blue-500',
};

export function getChampGrad(champ: string): string {
  return CHAMP_COLORS[champ] || 'from-blue-600 to-indigo-800';
}

// Generate a random match record for a participant
export function generateRandomMatch(
  participant: Participant, 
  rules: ContestRules, 
  customTime?: string
): MatchRecord {
  const isWin = Math.random() > 0.44; // Slightly positive winrate
  const champ = CHAMPION_POOL[Math.floor(Math.random() * CHAMPION_POOL.length)];
  
  const kills = Math.floor(Math.random() * 12) + (isWin ? 3 : 0);
  const deaths = Math.floor(Math.random() * 10) + (isWin ? 0 : 3);
  const assists = Math.floor(Math.random() * 16) + (isWin ? 4 : 0);
  
  const damageDealt = Math.floor(Math.random() * 25000) + 12000;
  const damageTaken = Math.floor(Math.random() * 20000) + 10000;
  const cs = Math.floor(Math.random() * 150) + 100;
  const duration = Math.floor(Math.random() * 600) + 1200; // 20 to 30 mins
  
  // Choose absolute match timestamp within range
  const startMs = new Date(rules.periodStart).getTime();
  const endMs = new Date(rules.periodEnd).getTime();
  const gameStartTime = customTime || new Date(startMs + Math.random() * (endMs - startMs)).toISOString();
  
  // Calculate LP change
  let lpChange = 0;
  if (isWin) {
    lpChange = Math.floor(Math.random() * 7) + 18; // +18 to +25 LP
  } else {
    lpChange = -(Math.floor(Math.random() * 6) + 15); // -15 to -20 LP
  }
  
  // Determine new cumulative Absolute LP
  // Start from absolute current LP of participant
  const currentAbs = getAbsoluteLp(participant.currentTier, participant.currentDivision, participant.currentLp);
  const newAbs = Math.max(0, currentAbs + lpChange);
  const nextState = getTierDivisionLpFromAbsolute(newAbs);
  
  return {
    id: `match_${Math.random().toString(36).substring(2, 11)}`,
    gameId: `KR_${Math.floor(Math.random() * 90000000) + 6000000000}`,
    win: isWin,
    championName: champ,
    kills,
    deaths,
    assists,
    damageDealt,
    damageTaken,
    cs,
    duration,
    gameStartTime,
    lpChange,
    tierAfter: nextState.tier,
    divisionAfter: nextState.division,
    lpAfter: nextState.lp
  };
}

// Score parsing logic based on full chronological rules evaluation
export function calculateParticipantScore(
  participant: Participant, 
  rules: ContestRules
): Participant {
  const startAbs = getAbsoluteLp(participant.startTier, participant.startDivision, participant.startLp);
  
  // Filter matches within period [periodStart, periodEnd]
  const validMatches = participant.matches.filter(m => {
    const time = new Date(m.gameStartTime).getTime();
    return time >= new Date(rules.periodStart).getTime() && time <= new Date(rules.periodEnd).getTime();
  });
  
  // Sort matches chronologically ascending to evaluate continuous streak counters
  const sortedMatches = [...validMatches].sort(
    (a, b) => new Date(a.gameStartTime).getTime() - new Date(b.gameStartTime).getTime()
  );
  
  let currentAbs = startAbs;
  let winStreakCount = 0;
  let lossStreakCount = 0;
  let winStreakPoints = 0;
  let lossStreakPoints = 0;
  let basePoints = 0;
  
  // Re-calculate state step-by-step
  for (const m of sortedMatches) {
    currentAbs = Math.max(0, currentAbs + m.lpChange);
    
    // Add base points for win/loss
    if (m.win) {
      basePoints += rules.winPoints;
      winStreakCount++;
      lossStreakCount = 0;
      
      // Streak points rule evaluation
      const bonuses = rules.winStreakBonuses || { 3: 0, 5: 0, 7: 0, 10: 0 };
      
      if (winStreakCount >= 10) {
        winStreakPoints += bonuses[10] || 0;
      } else if (winStreakCount >= 7) {
        winStreakPoints += bonuses[7] || 0;
      } else if (winStreakCount >= 5) {
        winStreakPoints += bonuses[5] || 0;
      } else if (winStreakCount >= 3) {
        winStreakPoints += bonuses[3] || 0;
      }
    } else {
      basePoints += rules.lossPoints;
      lossStreakCount++;
      winStreakCount = 0;
      
      // Loss Streak penalty evaluation
      if (lossStreakCount >= rules.lossStreakThreshold) {
        lossStreakPoints -= rules.lossStreakPenalty; // penalty is subtracted
      }
    }
  }
  
  const curState = getTierDivisionLpFromAbsolute(currentAbs);
  
  // Calculate Base LP Diff points (Optional: could add a weight for LP gained/lost)
  const lpDiffPoints = basePoints;
  
  // Total point calc
  const totalPoints = lpDiffPoints + winStreakPoints + lossStreakPoints;
  
  return {
    ...participant,
    currentTier: curState.tier,
    currentDivision: curState.division,
    currentLp: curState.lp,
    matches: sortedMatches, // keep chronologically sorted
    lpDiffPoints,
    winStreakPoints,
    lossStreakPoints,
    winStreakCount,
    lossStreakCount,
    totalPoints
  };
}

// Helper to style tier names nicely
export function formatTier(tier: LoLTier, division: number): string {
  if (['CHALLENGER', 'GRANDMASTER', 'MASTER'].includes(tier)) {
    return tier.charAt(0) + tier.slice(1).toLowerCase();
  }
  
  // Upper to clean capitalized (e.g. Diamond 2)
  return `${tier.charAt(0) + tier.slice(1).toLowerCase()} ${division}`;
}

export function formatTierShort(tier: LoLTier, division: number): string {
  const abbrMap: Record<string, string> = {
    'CHALLENGER': 'C',
    'GRANDMASTER': 'GM',
    'MASTER': 'M',
    'DIAMOND': 'D',
    'EMERALD': 'E',
    'PLATINUM': 'P',
    'GOLD': 'G',
    'SILVER': 'S',
    'BRONZE': 'B',
    'IRON': 'I'
  };
  
  const abbr = abbrMap[tier] || tier.charAt(0);
  if (['CHALLENGER', 'GRANDMASTER', 'MASTER'].includes(tier)) {
    return abbr;
  }
  return `${abbr}${division}`;
}

export function getTierColor(tier: LoLTier): string {
  switch (tier) {
    case 'CHALLENGER': return 'text-rose-400 border-rose-500/30';
    case 'GRANDMASTER': return 'text-red-400 border-red-500/30';
    case 'MASTER': return 'text-purple-400 border-purple-500/30';
    case 'DIAMOND': return 'text-blue-400 border-blue-500/30';
    case 'EMERALD': return 'text-emerald-400 border-emerald-500/30';
    case 'PLATINUM': return 'text-cyan-400 border-cyan-500/30';
    case 'GOLD': return 'text-yellow-400 border-yellow-500/30';
    case 'SILVER': return 'text-slate-300 border-slate-400/30';
    case 'BRONZE': return 'text-amber-700 border-amber-800/30';
    case 'IRON': return 'text-neutral-500 border-neutral-600/30';
    default: return 'text-gray-400 border-gray-500/30';
  }
}

// Generate seed list of participants matching summoner#tagLINE
export const SEED_PARTICIPANTS_TEXT = `룰러 룰러#KR1
페이커 T1 Faker#KR1
쇼메이커 DK Showmaker#KR1
쵸비 GEN Chovy#KR1
데프트 마포고광인#KR1
케리아 Keria#KR1
구마유시 Gumayusi#KR1
오너 Oner#KR1
제우스 Zeus#KR1
`;
