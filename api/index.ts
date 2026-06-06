import express from "express";
import dataHandler from "./lol/data";
import syncHandler from "./lol/sync";

const app = express();
app.use(express.json());

// Proxy requests to the Vercel-compatible handlers
app.all("/api/lol/data", async (req, res) => {
  await dataHandler(req, res);
});

app.all("/api/lol/sync", async (req, res) => {
  await syncHandler(req, res);
});

export default app;

