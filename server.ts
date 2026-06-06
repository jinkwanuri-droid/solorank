import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Riot API Proxy handler
  app.post("/api/lol/sync", async (req, res) => {
    const { participant, rules } = req.body;
    const apiKey = process.env.RIOT_API_KEY || rules.riotApiKey;

    if (!apiKey) {
      return res.status(400).json({ error: "Riot API Key is required" });
    }

    try {
      const { summonerName, tagLine } = participant;
      
      // Verify API key formatting or if it's a placeholder
      if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_') || apiKey.includes('API_KEY')) {
        console.warn(`Sync skipped for ${summonerName}#${tagLine}: Valid Riot API Key is not configured.`);
        return res.json({
          ...participant,
          syncStatus: 'no_api_key',
          syncWarning: 'Riot API 키가 설정되지 않아 로컬 데이터를 유지합니다.'
        });
      }

      // 1. Get PUUID from Riot ID
      const accountRes = await fetch(
        `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(summonerName)}/${encodeURIComponent(tagLine)}?api_key=${apiKey}`
      );
      
      if (!accountRes.ok) {
        if (accountRes.status === 404) {
          console.warn(`Account not found for ${summonerName}#${tagLine} (404). Kept cached data.`);
          return res.json({
            ...participant,
            syncStatus: 'not_found',
            syncWarning: `존재하지 않는 소환사명 또는 태그라인입니다: ${summonerName}#${tagLine}`
          });
        }
        if (accountRes.status === 401 || accountRes.status === 403) {
          console.warn(`Riot API authentication failed (HTTP ${accountRes.status}) while syncing ${summonerName}#${tagLine}.`);
          return res.json({
            ...participant,
            syncStatus: 'auth_failed',
            syncWarning: 'Riot API 키 인증에 실패했습니다 (만료 혹은 권한 없음).'
          });
        }
        throw new Error(`Failed to fetch account for ${summonerName}#${tagLine}: ${accountRes.status} ${accountRes.statusText}`);
      }
      
      const accountData = await accountRes.json();
      const puuid = accountData?.puuid;
      if (!puuid) {
        throw new Error(`PUUID not found in account response for ${summonerName}#${tagLine}`);
      }

      // 2. Get Summoner ID from PUUID (Needed for League entries/Tiers)
      const summonerRes = await fetch(
        `https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${apiKey}`
      );
      if (!summonerRes.ok) {
        if (summonerRes.status === 404) {
          console.warn(`Summoner profile (League v4) not found for PUUID ${puuid} on KR server.`);
          return res.json({
            ...participant,
            syncStatus: 'summoner_not_found',
            syncWarning: `KR 서버에서 소환사 정보를 찾을 수 없습니다: ${summonerName}#${tagLine}`
          });
        }
        throw new Error(`Failed to fetch summoner for PUUID ${puuid}: ${summonerRes.status} ${summonerRes.statusText}`);
      }
      const summonerData = await summonerRes.json();
      const id = summonerData?.id;
      if (!id) {
        console.warn(`Summoner ID field not found in response for PUUID ${puuid}. Response body:`, summonerData);
        return res.json({
          ...participant,
          syncStatus: 'id_missing',
          syncWarning: `소환사 ID를 불러오는 데 실패했습니다 (API 응답 형식 다름).`
        });
      }

      // 3. Get Current Tier/LP
      const leagueRes = await fetch(
        `https://kr.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}?api_key=${apiKey}`
      );
      if (!leagueRes.ok) {
        throw new Error(`Failed to fetch league entries for Summoner ID ${id}: ${leagueRes.status} ${leagueRes.statusText}`);
      }
      const leagueData = await leagueRes.json();
      
      let soloRank = null;
      if (Array.isArray(leagueData)) {
        soloRank = leagueData.find((e: any) => e.queueType === 'RANKED_SOLO_5x5');
      } else {
        console.warn(`League entries response is not an array for ${summonerName}:`, leagueData);
      }

      // 4. Get Match IDs during period
      const startTime = Math.floor(new Date(rules.periodStart).getTime() / 1000);
      const endTime = Math.floor(new Date(rules.periodEnd).getTime() / 1000);
      
      const matchesRes = await fetch(
        `https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?startTime=${startTime}&endTime=${endTime}&queue=420&type=ranked&start=0&count=20&api_key=${apiKey}`
      );
      if (!matchesRes.ok) {
        throw new Error(`Failed to fetch match IDs for PUUID ${puuid}: ${matchesRes.status} ${matchesRes.statusText}`);
      }
      const matchIds = await matchesRes.json();

      // 5. Fetch Match Details
      const matches = [];
      if (Array.isArray(matchIds)) {
        for (const mId of matchIds) {
          try {
            const detailRes = await fetch(
              `https://asia.api.riotgames.com/lol/match/v5/matches/${mId}?api_key=${apiKey}`
            );
            if (!detailRes.ok) {
              console.warn(`Failed to fetch match detail for ID ${mId}: ${detailRes.statusText}`);
              continue;
            }
            const detail = await detailRes.json();
            const info = detail?.info;
            if (!info || !Array.isArray(info.participants)) {
              continue;
            }
            
            // Find the participant in the match
            const player = info.participants.find((p: any) => p.puuid === puuid);
            if (player) {
              const isWin = player.win;
              const lpChange = isWin ? 20 : -15; // Approximate LP change for visualization

              matches.push({
                id: mId,
                gameId: info.gameId?.toString() || `sim_${Math.random()}`,
                win: isWin,
                championName: player.championName || "Unknown",
                kills: player.kills || 0,
                deaths: player.deaths || 0,
                assists: player.assists || 0,
                damageDealt: player.totalDamageDealtToChampions || 0,
                damageTaken: player.totalDamageTaken || 0,
                cs: (player.totalMinionsKilled || 0) + (player.neutralMinionsKilled || 0),
                duration: info.gameDuration || 1800,
                gameStartTime: info.gameStartTimestamp ? new Date(info.gameStartTimestamp).toISOString() : new Date().toISOString(),
                lpChange: lpChange,
                tierAfter: soloRank ? soloRank.tier : participant.currentTier,
                lpAfter: soloRank ? soloRank.leaguePoints : participant.currentLp,
                divisionAfter: soloRank ? (soloRank.rank === 'I' ? 1 : soloRank.rank === 'II' ? 2 : soloRank.rank === 'III' ? 3 : 4) : participant.currentDivision
              });
            }
          } catch (matchError) {
            console.error(`Error fetching match detail for ID ${mId}:`, matchError);
          }
        }
      }

      // Sort by time ascending
      matches.sort((a, b) => new Date(a.gameStartTime).getTime() - new Date(b.gameStartTime).getTime());

      // Prepare updated participant
      const updatedParticipant = {
        ...participant,
        currentTier: soloRank ? soloRank.tier : participant.currentTier,
        currentDivision: soloRank ? (soloRank.rank === 'I' ? 1 : soloRank.rank === 'II' ? 2 : soloRank.rank === 'III' ? 3 : 4) : participant.currentDivision,
        currentLp: soloRank ? soloRank.leaguePoints : participant.currentLp,
        matches: matches,
        syncStatus: 'success',
        syncWarning: null
      };

      res.json(updatedParticipant);
    } catch (error: any) {
      console.warn("Sync Request Intercepted or Failed:", error.message);
      // Fallback: return the original participant object to keep the client operational
      res.json({
        ...participant,
        syncStatus: 'failed',
        syncWarning: `동기화 오류: ${error.message}`
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
