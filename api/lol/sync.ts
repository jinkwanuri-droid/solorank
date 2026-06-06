import "dotenv/config";

// Force a 90-second cooldown per participant to respect Riot API rate limits
const SYNC_COOLDOWN_MS = 90000; 

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { participant, rules } = req.body;
  if (!participant) {
    return res.status(400).json({ error: "Missing participant parameter" });
  }

  console.log(`[Sync Request] Participant: ${participant?.name} (${participant?.summonerName}#${participant?.tagLine})`);
  
  // 1. Check client cooldown first
  if (participant.lastSyncedAt) {
    const elapsed = Date.now() - new Date(participant.lastSyncedAt).getTime();
    if (elapsed < SYNC_COOLDOWN_MS) {
      console.log(`[Sync Skip] Skipping ${participant.name} - within 90s cooldown (${Math.round((SYNC_COOLDOWN_MS - elapsed) / 1000)}s left)`);
      return res.json({
        ...participant,
        syncStatus: 'success',
        syncWarning: null
      });
    }
  }

  // Prioritize API key from user-provided rules (UI settings), then fallback to ENV
  const apiKey = (rules?.riotApiKey) || process.env.RIOT_API_KEY || process.env.VITE_RIOT_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_') || apiKey.includes('API_KEY')) {
    return res.json({
      ...participant,
      syncStatus: 'no_api_key',
      syncWarning: 'Riot API 키가 설정되지 않았습니다. 설정에서 키를 입력해주세요.'
    });
  }

  try {
    let summonerName = (participant.summonerName || "").trim();
    const tagLine = (participant.tagLine || "").trim().replace(/^#/, "");
    
    // Auto-normalize spaces / spelling for known high-elo streamer nicknames
    const strippedName = summonerName.replace(/\s+/g, "");
    
    const headers = { "X-Riot-Token": apiKey };

    let puuid = participant.puuid || "";

    // 2. Resolve PUUID (Check cache first)
    if (!puuid) {
      let resolveSuccess = false;
      let lastStatus = 0;

      // Try multiple spelling/spacing variations for the Riot ID
      const namesToTry = [
        summonerName, // 1. Exactly as provided
        summonerName.replace(/\s+/g, " ").trim(), // 2. Single space normalized
        summonerName.replace(/\s+/g, ""), // 3. No spaces
      ];
      
      // Remove duplicates from try list
      const uniqueNames = Array.from(new Set(namesToTry));

      for (const nameToTry of uniqueNames) {
        const accountUrl = `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(nameToTry)}/${encodeURIComponent(tagLine)}`;
        console.log(`[Sync API] Querying Riot API for PUUID: ${nameToTry}#${tagLine}`);
        const accountRes = await fetch(accountUrl, { headers });
        lastStatus = accountRes.status;

        if (accountRes.ok) {
          const text = await accountRes.text();
          try {
            const accountData = JSON.parse(text);
            puuid = accountData?.puuid || "";
            if (puuid) {
              summonerName = nameToTry; // Update to the one that worked
              resolveSuccess = true;
              break;
            }
          } catch (pe) {
            console.error("[Sync Error] JSON parse failed for account data");
          }
        }
        
        if (accountRes.status !== 404) break; // Only retry on 404
      }
      
      if (!resolveSuccess) {
        console.error(`[Sync Error] PUUID fetch failed for ${summonerName}#${tagLine}: HTTP ${lastStatus}`);
        let errDetail = `Riot API ${lastStatus}`;
        if (lastStatus === 404) errDetail = "Riot ID를 찾을 수 없습니다.";
        else if (lastStatus === 429) errDetail = "요청 한도 초과(429). 잠시 후 진행하세요.";
        else if (lastStatus === 403) errDetail = "Riot API Key 권한 없음 (403)";
        else if (lastStatus === 401) errDetail = "Riot API Key 잘못됨 (401)";
        
        return res.json({ ...participant, syncStatus: 'failed', syncWarning: errDetail });
      }
    } else {
      console.log(`[Sync PUUID Cache Hit] Using cached PUUID for ${participant.name}: ${puuid}`);
    }

    // 3. Get League Entry
    const leagueRes = await fetch(`https://kr.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`, { headers });
    if (!leagueRes.ok) {
      if (leagueRes.status === 429) {
        return res.json({ ...participant, puuid, syncStatus: 'failed', syncWarning: '티어 조회 요청 한도 초과(429).' });
      }
      return res.json({ ...participant, puuid, syncStatus: 'failed', syncWarning: `티어 정보 조회 실패: ${leagueRes.status}` });
    }
    
    let leagueData;
    const leagueText = await leagueRes.text();
    try {
      leagueData = JSON.parse(leagueText);
    } catch {
      throw new Error("티어 조회 응답이 정상 JSON이 아닙니다.");
    }
    
    const soloRank = Array.isArray(leagueData) ? leagueData.find((e: any) => e.queueType === 'RANKED_SOLO_5x5') : null;

    // 4. Match IDs
    const startTime = Math.floor(new Date(rules.periodStart).getTime() / 1000);
    const endTime = Math.floor(new Date(rules.periodEnd).getTime() / 1000);
    
    // Request at least 10 matches to support the recent 10 games UI requirement
    const matchesRes = await fetch(`https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?startTime=${startTime}&endTime=${endTime}&queue=420&type=ranked&start=0&count=10`, { headers });
    
    if (!matchesRes.ok) {
        if (matchesRes.status === 429) {
          return res.json({ ...participant, puuid, syncStatus: 'failed', syncWarning: '매치 조회 요청 한도 초과(429).' });
        }
        return res.json({ ...participant, puuid, syncStatus: 'failed', syncWarning: `매치 목록 조회 실패: ${matchesRes.status}` });
    }
    
    let matchIds;
    const matchesText = await matchesRes.text();
    try {
      matchIds = JSON.parse(matchesText);
    } catch {
      throw new Error("매치 목록 응답이 정상 JSON이 아닙니다.");
    }

    // 5. Match Details
    const matches = [];
    if (Array.isArray(matchIds)) {
      for (const mId of matchIds) {
        try {
          // Increase delay between match details slightly to respect limits
          await new Promise(r => setTimeout(r, 200));
          const dRes = await fetch(`https://asia.api.riotgames.com/lol/match/v5/matches/${mId}`, { headers });
          if (!dRes.ok) continue;
          
          const detailText = await dRes.text();
          let d;
          try {
            d = JSON.parse(detailText);
          } catch {
            continue; // Skip non-json or malformed responses
          }
          
          const p = d?.info?.participants?.find((p: any) => p.puuid === puuid);
          if (p) {
            matches.push({
              id: mId,
              gameId: d.info.gameId?.toString(),
              win: p.win,
              championName: p.championName,
              kills: p.kills, deaths: p.deaths, assists: p.assists,
              damageDealt: p.totalDamageDealtToChampions,
              damageTaken: p.totalDamageTaken,
              cs: (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0),
              duration: d.info.gameDuration,
              gameStartTime: d.info.gameStartTimestamp ? new Date(d.info.gameStartTimestamp).toISOString() : new Date().toISOString(),
              lpChange: p.win ? 20 : -15,
              tierAfter: soloRank?.tier || participant.currentTier,
              lpAfter: soloRank?.leaguePoints || participant.currentLp,
              divisionAfter: soloRank ? (soloRank.rank === 'I' ? 1 : soloRank.rank === 'II' ? 2 : soloRank.rank === 'III' ? 3 : 4) : participant.currentDivision
            });
          }
        } catch {}
      }
    }

    matches.sort((a: any, b: any) => new Date(a.gameStartTime).getTime() - new Date(b.gameStartTime).getTime());

    return res.json({
      ...participant,
      summonerName, // Update the client with the correctly spaced name
      puuid, // Ensure cached puuid is updated
      lastSyncedAt: new Date().toISOString(), // Track sync completion time
      currentTier: soloRank?.tier || participant.currentTier,
      currentDivision: soloRank ? (soloRank.rank === 'I' ? 1 : soloRank.rank === 'II' ? 2 : soloRank.rank === 'III' ? 3 : 4) : participant.currentDivision,
      currentLp: soloRank?.leaguePoints ?? participant.currentLp,
      matches,
      syncStatus: 'success',
      syncWarning: null
    });

  } catch (error: any) {
    console.error(`[Sync Uncaught Error] Exception for participant ${participant.name}:`, error);
    return res.json({ 
      ...participant, 
      syncStatus: 'failed', 
      syncWarning: `서버 통신 장애: ${error.message || "알 수 없는 형식"}` 
    });
  }
}
