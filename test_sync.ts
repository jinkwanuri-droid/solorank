import fs from "fs";

async function testFetch() {
  const payload = {
    participant: {
      summonerName: '사나이묵직한주먹',
      tagLine: '산',
      currentTier: 'DIAMOND',
      currentDivision: 1,
      currentLp: 0,
    },
    rules: {
      riotApiKey: 'RGAPI-ebedbd83-e317-4fdc-af72-6df2c700329c', // A dummy or whatever
      periodStart: '2026-06-04T10:29:01.846Z',
      periodEnd: '2026-06-11T10:29:01.846Z'
    }
  };

  try {
    const res = await fetch("http://localhost:3000/api/lol/sync", {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log("Status:", res.status);
    try {
      const data = await res.json();
      console.log("Response JSON:", JSON.stringify(data, null, 2));
    } catch {
      const text = await res.text();
      console.log("Response text:", text);
    }
  } catch (error: any) {
    console.error("Fetch failed:", error.message);
  }
}

testFetch();
