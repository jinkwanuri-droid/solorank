import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const DATA_FILE = path.join(process.cwd(), "contest_data.json");

  // Save/Load API endpoints for cross-device shared configuration
  app.get("/api/lol/data", async (req, res) => {
    try {
      const exists = await fs.access(DATA_FILE).then(() => true).catch(() => false);
      if (!exists) {
        return res.json({ rules: null, participants: null });
      }
      const content = await fs.readFile(DATA_FILE, "utf-8");
      res.json(JSON.parse(content));
    } catch (error: any) {
      console.error("Error reading data file:", error.message);
      res.status(500).json({ error: "Failed to load stored contest data" });
    }
  });

  app.post("/api/lol/data", async (req, res) => {
    try {
      const { rules, participants } = req.body;
      const dataToSave = { rules, participants };
      await fs.writeFile(DATA_FILE, JSON.stringify(dataToSave, null, 2), "utf-8");
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error writing data file:", error.message);
      res.status(500).json({ error: "Failed to persist contest data" });
    }
  });

  // API Routes
  
  // Riot API Proxy handler
  app.post("/api/lol/sync", async (req, res) => {
    const { participant, rules } = req.body;
    const apiKey = process.env.RIOT_API_KEY || process.env.VITE_RIOT_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_') || apiKey.includes('API_KEY')) {
      return res.json({
        ...participant,
        syncStatus: 'no_api_key',
        syncWarning: '서버 환경 변수(RIOT_API_KEY)가 등록되지 않아 전적 조회를 실행할 수 없습니다.'
      });
    }

    try {
      const { summonerName, tagLine } = participant;

      // 1. Get PUUID from Riot ID
      const accountRes = await fetch(
        `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(summonerName)}/${encodeURIComponent(tagLine)}?api_key=${apiKey}`
      );
      
      if (!accountRes.ok) {
        return res.json({
          ...participant,
          syncStatus: 'failed',
          syncWarning: `계정 정보를 불러올 수 없습니다: HTTP ${accountRes.status}`
        });
      }
      
      const accountData = await accountRes.json();
      const puuid = accountData?.puuid;
      if (!puuid) {
        throw new Error(`PUUID not found in account response`);
      }

      // 2. Get Summoner ID from PUUID
      const summonerRes = await fetch(
        `https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${apiKey}`
      );
      if (!summonerRes.ok) {
        return res.json({
          ...participant,
          syncStatus: 'failed',
          syncWarning: `소환사 정보를 불러올 수 없습니다: HTTP ${summonerRes.status}`
        });
      }
      const summonerData = await summonerRes.json();
      const id = summonerData?.id;

      // 3. Get Current Tier/LP
      const leagueRes = await fetch(
        `https://kr.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}?api_key=${apiKey}`
      );
      if (!leagueRes.ok) {
        return res.json({
          ...participant,
          syncStatus: 'failed',
          syncWarning: `리그 정보를 불러올 수 없습니다: HTTP ${leagueRes.status}`
        });
      }
      const leagueData = await leagueRes.json();
      
      let soloRank = null;
      if (Array.isArray(leagueData)) {
        soloRank = leagueData.find((e: any) => e.queueType === 'RANKED_SOLO_5x5');
      }

      // 4. Get Match IDs during period
      const startTime = Math.floor(new Date(rules.periodStart).getTime() / 1000);
      const endTime = Math.floor(new Date(rules.periodEnd).getTime() / 1000);
      
      const matchesRes = await fetch(
        `https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?startTime=${startTime}&endTime=${endTime}&queue=420&type=ranked&start=0&count=20&api_key=${apiKey}`
      );
      if (!matchesRes.ok) {
        return res.json({
          ...participant,
          syncStatus: 'failed',
          syncWarning: `매치 목록을 불러올 수 없습니다: HTTP ${matchesRes.status}`
        });
      }
      const matchIds = await matchesRes.json();

      // 5. Fetch Match Details
      const matches = [];
      if (Array.isArray(matchIds)) {
        for (const mId of matchIds) {
          try {
            // Small internal delay to throttle match detail requests
            await new Promise(resolve => setTimeout(resolve, 50));

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
