import "dotenv/config";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { participant, rules } = req.body;
  
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
    const summonerName = (participant.summonerName || "").trim();
    const tagLine = (participant.tagLine || "").trim().replace(/^#/, "");
    const headers = { "X-Riot-Token": apiKey };

    // 1. Get PUUID
    const accountUrl = `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(summonerName)}/${encodeURIComponent(tagLine)}`;
    const accountRes = await fetch(accountUrl, { headers });
    
    if (!accountRes.ok) {
      let errDetail = `Riot API ${accountRes.status}`;
      if (accountRes.status === 404) errDetail = "Riot ID를 찾을 수 없습니다.";
      else if (accountRes.status === 429) errDetail = "요청 한도 초과.";
      else if (accountRes.status === 403) errDetail = "Riot API Key 권한 없음 (403)";
      else if (accountRes.status === 401) errDetail = "Riot API Key 잘못됨 (401)";
      
      return res.json({ ...participant, syncStatus: 'failed', syncWarning: errDetail });
    }
    
    const accountData = await accountRes.json();
    const puuid = accountData?.puuid;
    if (!puuid) throw new Error("PUUID missing");

    // 2. We don't need Summoner ID anymore, Riot updated League API to use PUUID
    // 3. Get League Entry
    const leagueRes = await fetch(`https://kr.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`, { headers });
    if (!leagueRes.ok) return res.json({ ...participant, syncStatus: 'failed', syncWarning: `티어 정보 조회 실패: ${leagueRes.status}` });
    const leagueData = await leagueRes.json();
    const soloRank = Array.isArray(leagueData) ? leagueData.find((e: any) => e.queueType === 'RANKED_SOLO_5x5') : null;

    // 4. Match IDs
    const startTime = Math.floor(new Date(rules.periodStart).getTime() / 1000);
    const endTime = Math.floor(new Date(rules.periodEnd).getTime() / 1000);
    const matchesRes = await fetch(`https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?startTime=${startTime}&endTime=${endTime}&queue=420&type=ranked&start=0&count=10`, { headers });
    const matchIds = await matchesRes.json();

    // 5. Match Details
    const matches = [];
    if (Array.isArray(matchIds)) {
      for (const mId of matchIds) {
        try {
          await new Promise(r => setTimeout(r, 50));
          const dRes = await fetch(`https://asia.api.riotgames.com/lol/match/v5/matches/${mId}`, { headers });
          if (!dRes.ok) continue;
          const d = await dRes.json();
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
      currentTier: soloRank?.tier || participant.currentTier,
      currentDivision: soloRank ? (soloRank.rank === 'I' ? 1 : soloRank.rank === 'II' ? 2 : soloRank.rank === 'III' ? 3 : 4) : participant.currentDivision,
      currentLp: soloRank?.leaguePoints ?? participant.currentLp,
      matches,
      syncStatus: 'success',
      syncWarning: null
    });

  } catch (error: any) {
    return res.json({ ...participant, syncStatus: 'failed', syncWarning: `오류: ${error.message}` });
  }
}
