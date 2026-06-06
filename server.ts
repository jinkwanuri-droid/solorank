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
      
      // 1. Get PUUID from Riot ID
      const accountRes = await fetch(
        `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(summonerName)}/${encodeURIComponent(tagLine)}?api_key=${apiKey}`
      );
      
      if (!accountRes.ok) {
        throw new Error(`Failed to fetch account: ${accountRes.statusText}`);
      }
      
      const accountData = await accountRes.json();
      const puuid = accountData.puuid;

      // 2. Get Summoner ID from PUUID (Needed for League entries/Tiers)
      const summonerRes = await fetch(
        `https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${apiKey}`
      );
      const summonerData = await summonerRes.json();
      const id = summonerData.id;

      // 3. Get Current Tier/LP
      const leagueRes = await fetch(
        `https://kr.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}?api_key=${apiKey}`
      );
      const leagueData = await leagueRes.json();
      const soloRank = leagueData.find((e: any) => e.queueType === 'RANKED_SOLO_5x5');

      // 4. Get Match IDs during period
      const startTime = Math.floor(new Date(rules.periodStart).getTime() / 1000);
      const endTime = Math.floor(new Date(rules.periodEnd).getTime() / 1000);
      
      const matchesRes = await fetch(
        `https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?startTime=${startTime}&endTime=${endTime}&queue=420&type=ranked&start=0&count=20&api_key=${apiKey}`
      );
      const matchIds = await matchesRes.json();

      // 5. Fetch Match Details
      const matches = [];
      for (const mId of matchIds) {
        const detailRes = await fetch(
          `https://asia.api.riotgames.com/lol/match/v5/matches/${mId}?api_key=${apiKey}`
        );
        const detail = await detailRes.json();
        const info = detail.info;
        
        // Find the participant in the match
        const player = info.participants.find((p: any) => p.puuid === puuid);
        if (player) {
          const isWin = player.win;
          const lpChange = isWin ? 20 : -15; // Approximate LP change for visualization

          matches.push({
            id: mId,
            gameId: info.gameId.toString(),
            win: isWin,
            championName: player.championName,
            kills: player.kills,
            deaths: player.deaths,
            assists: player.assists,
            damageDealt: player.totalDamageDealtToChampions,
            damageTaken: player.totalDamageTaken,
            cs: player.totalMinionsKilled + player.neutralMinionsKilled,
            duration: info.gameDuration,
            gameStartTime: new Date(info.gameStartTimestamp).toISOString(),
            lpChange: lpChange,
            tierAfter: soloRank ? soloRank.tier : participant.currentTier,
            lpAfter: soloRank ? soloRank.leaguePoints : participant.currentLp,
            divisionAfter: soloRank ? (soloRank.rank === 'I' ? 1 : soloRank.rank === 'II' ? 2 : soloRank.rank === 'III' ? 3 : 4) : participant.currentDivision
          });
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
        matches: matches
      };

      res.json(updatedParticipant);
    } catch (error: any) {
      console.error("Sync Error:", error);
      res.status(500).json({ error: error.message });
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
