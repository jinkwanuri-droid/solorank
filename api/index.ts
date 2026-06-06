import express from "express";
import { fileURLToPath } from "url";
import { dirname } from "path";

const app = express();
app.use(express.json());

// Riot API Proxy handler (Copied from server.ts)
app.post("/api/lol/sync", async (req, res) => {
  const { participant, rules } = req.body;
  const apiKey = process.env.RIOT_API_KEY || process.env.VITE_RIOT_API_KEY || (rules && rules.riotApiKey);

  if (!apiKey) {
    return res.status(400).json({ error: "Riot API Key is required" });
  }

  try {
    const { summonerName, tagLine } = participant;
    
    if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_') || apiKey.includes('API_KEY')) {
      return res.json({
        ...participant,
        syncStatus: 'no_api_key',
        syncWarning: 'Riot API 키가 설정되지 않았습니다.'
      });
    }

    // 1. Get PUUID
    const accountRes = await fetch(
      `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(summonerName)}/${encodeURIComponent(tagLine)}?api_key=${apiKey}`
    );
    
    if (!accountRes.ok) {
       // Return handled error
       return res.json({ ...participant, syncStatus: 'failed', syncWarning: `계정을 찾을 수 없습니다: ${accountRes.status}` });
    }
    
    const accountData = await accountRes.json();
    const puuid = accountData?.puuid;

    // 2. Get Summoner ID
    const summonerRes = await fetch(
      `https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${apiKey}`
    );
    const summonerData = await summonerRes.json();
    const id = summonerData?.id;

    // 3. Get Current Tier/LP
    const leagueRes = await fetch(
      `https://kr.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}?api_key=${apiKey}`
    );
    const leagueData = await leagueRes.json();
    let soloRank = null;
    if (Array.isArray(leagueData)) {
      soloRank = leagueData.find((e: any) => e.queueType === 'RANKED_SOLO_5x5');
    }

    // 4. Get Match IDs
    const startTime = Math.floor(new Date(rules.periodStart).getTime() / 1000);
    const endTime = Math.floor(new Date(rules.periodEnd).getTime() / 1000);
    const matchesRes = await fetch(
      `https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?startTime=${startTime}&endTime=${endTime}&queue=420&type=ranked&start=0&count=20&api_key=${apiKey}`
    );
    const matchIds = await matchesRes.json();

    // 5. Match Details
    const matches = [];
    if (Array.isArray(matchIds)) {
      for (const mId of matchIds) {
        const detailRes = await fetch(`https://asia.api.riotgames.com/lol/match/v5/matches/${mId}?api_key=${apiKey}`);
        if (detailRes.ok) {
          const detail = await detailRes.json();
          const player = detail.info.participants.find((p: any) => p.puuid === puuid);
          if (player) {
            matches.push({
              id: mId,
              gameId: detail.info.gameId?.toString(),
              win: player.win,
              championName: player.championName,
              kills: player.kills,
              deaths: player.deaths,
              assists: player.assists,
              damageDealt: player.totalDamageDealtToChampions,
              damageTaken: player.totalDamageTaken,
              cs: (player.totalMinionsKilled || 0) + (player.neutralMinionsKilled || 0),
              duration: detail.info.gameDuration,
              gameStartTime: new Date(detail.info.gameStartTimestamp).toISOString(),
              lpChange: player.win ? 20 : -15,
              tierAfter: soloRank ? soloRank.tier : participant.currentTier,
              lpAfter: soloRank ? soloRank.leaguePoints : participant.currentLp,
              divisionAfter: soloRank ? (soloRank.rank === 'I' ? 1 : soloRank.rank === 'II' ? 2 : soloRank.rank === 'III' ? 3 : 4) : participant.currentDivision
            });
          }
        }
      }
    }

    res.json({
      ...participant,
      currentTier: soloRank ? soloRank.tier : participant.currentTier,
      currentDivision: soloRank ? (soloRank.rank === 'I' ? 1 : soloRank.rank === 'II' ? 2 : soloRank.rank === 'III' ? 3 : 4) : participant.currentDivision,
      currentLp: soloRank ? soloRank.leaguePoints : participant.currentLp,
      matches: matches,
      syncStatus: 'success'
    });
  } catch (error: any) {
    res.json({ ...participant, syncStatus: 'failed', syncWarning: error.message });
  }
});

export default app;
