import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Save/Load API endpoints - Now using Firestore
  app.get("/api/lol/data", async (req, res) => {
    try {
      const docRef = doc(db, "config", "contest");
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.log("[Data] No contest data found in Firestore.");
        return res.json({ rules: null, participants: null });
      }
      
      res.json(docSnap.data());
    } catch (error: any) {
      console.error("[Data] Error reading from Firestore:", error.message);
      res.status(500).json({ error: "Failed to load contest data" });
    }
  });

  app.post("/api/lol/data", async (req, res) => {
    try {
      const { rules, participants } = req.body;
      const docRef = doc(db, "config", "contest");
      
      await setDoc(docRef, { 
        rules, 
        participants,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Data] Error writing to Firestore:", error.message);
      res.status(500).json({ error: "Failed to save contest data" });
    }
  });

  // API Routes
  
  // Riot API Proxy handler
  app.post("/api/lol/sync", async (req, res) => {
    const { participant, rules } = req.body;
    const apiKey = process.env.RIOT_API_KEY || process.env.VITE_RIOT_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_') || apiKey.includes('API_KEY')) {
      console.warn("[Sync] RIOT_API_KEY is missing or invalid.");
      return res.json({
        ...participant,
        syncStatus: 'no_api_key',
        syncWarning: '서버 RIOT_API_KEY가 등록되지 않았습니다.'
      });
    }

    console.log(`[Sync] Starting ${participant.summonerName}#${participant.tagLine}`);

    try {
      const summonerName = (participant.summonerName || "").trim();
      const tagLine = (participant.tagLine || "").trim().replace(/^#/, "");
      
      const headers = { "X-Riot-Token": apiKey };

      // 1. Get PUUID
      const accountUrl = `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(summonerName)}/${encodeURIComponent(tagLine)}`;
      console.log(`[Sync] Requesting PUUID for: ${summonerName}#${tagLine}`);
      
      const accountRes = await fetch(accountUrl, { headers });
      console.log(`[Sync] Account API Status: ${accountRes.status}`);
      
      if (!accountRes.ok) {
        let errDetail = `Riot API ${accountRes.status}`;
        if (accountRes.status === 404) {
          errDetail = "Riot ID를 찾을 수 없습니다. 닉네임 또는 태그를 확인해주세요.";
        } else if (accountRes.status === 429) {
          errDetail = "API 요청 한도가 초과되었습니다. 잠시 후 다시 시도해주세요.";
        } else if (accountRes.status === 403) {
          errDetail = "API 키가 만료되었거나 권한이 없습니다.";
        }

        return res.json({
          ...participant,
          syncStatus: 'failed',
          syncWarning: errDetail
        });
      }
      
      const accountData = await accountRes.json();
      const puuid = accountData?.puuid;
      
      if (!puuid) {
        throw new Error("PUUID missing from account response");
      }

      // 2. Get Summoner ID
      const summonerRes = await fetch(
        `https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
        { headers }
      );
      if (!summonerRes.ok) {
        return res.json({
          ...participant,
          syncStatus: 'failed',
          syncWarning: `소환사 정보 조회 실패: ${summonerRes.status}`
        });
      }
      const summonerData = await summonerRes.json();
      const id = summonerData?.id;

      // 3. Get League Entry
      const leagueRes = await fetch(
        `https://kr.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}`,
        { headers }
      );
      if (!leagueRes.ok) {
        return res.json({
          ...participant,
          syncStatus: 'failed',
          syncWarning: `티어 정보 조회 실패: ${leagueRes.status}`
        });
      }
      const leagueData = await leagueRes.json();
      const soloRank = Array.isArray(leagueData) ? leagueData.find((e: any) => e.queueType === 'RANKED_SOLO_5x5') : null;

      // 4. Match IDs
      const startTime = Math.floor(new Date(rules.periodStart).getTime() / 1000);
      const endTime = Math.floor(new Date(rules.periodEnd).getTime() / 1000);
      
      const matchesRes = await fetch(
        `https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?startTime=${startTime}&endTime=${endTime}&queue=420&type=ranked&start=0&count=20`,
        { headers }
      );
      if (!matchesRes.ok) {
        return res.json({
          ...participant,
          syncStatus: 'failed',
          syncWarning: `매치 목록 조회 실패: ${matchesRes.status}`
        });
      }
      const matchIds = await matchesRes.json();

      // 5. Match Details
      const matches = [];
      if (Array.isArray(matchIds)) {
        for (const mId of matchIds) {
          try {
            await new Promise(resolve => setTimeout(resolve, 50));
            const detailRes = await fetch(`https://asia.api.riotgames.com/lol/match/v5/matches/${mId}`, { headers });
            if (!detailRes.ok) continue;
            
            const detail = await detailRes.json();
            const player = detail?.info?.participants?.find((p: any) => p.puuid === puuid);
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
                gameStartTime: detail.info.gameStartTimestamp ? new Date(detail.info.gameStartTimestamp).toISOString() : new Date().toISOString(),
                lpChange: player.win ? 20 : -15, // Approximate
                tierAfter: soloRank?.tier || participant.currentTier,
                lpAfter: soloRank?.leaguePoints || participant.currentLp,
                divisionAfter: soloRank ? (soloRank.rank === 'I' ? 1 : soloRank.rank === 'II' ? 2 : soloRank.rank === 'III' ? 3 : 4) : participant.currentDivision
              });
            }
          } catch {}
        }
      }

      matches.sort((a: any, b: any) => new Date(a.gameStartTime).getTime() - new Date(b.gameStartTime).getTime());

      res.json({
        ...participant,
        currentTier: soloRank?.tier || participant.currentTier,
        currentDivision: soloRank ? (soloRank.rank === 'I' ? 1 : soloRank.rank === 'II' ? 2 : soloRank.rank === 'III' ? 3 : 4) : participant.currentDivision,
        currentLp: soloRank?.leaguePoints ?? participant.currentLp,
        matches: matches,
        syncStatus: 'success',
        syncWarning: null
      });

    } catch (error: any) {
      console.warn("[Sync] Fatal error:", error.message);
      res.json({
        ...participant,
        syncStatus: 'failed',
        syncWarning: `오류 발생: ${error.message}`
      });
    }
  });

  // Vite setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
