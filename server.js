const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";

function buildSearchQuery({ strokeType, playerName = "", extraKeywords = "" }) {
  const strokeMap = {
    forehand: "table tennis forehand topspin",
    backhand: "table tennis backhand drive",
    serve: "table tennis serve"
  };

  return [
    strokeMap[strokeType] || "table tennis technique",
    playerName,
    extraKeywords || "training slow motion front view"
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/search-videos", async (req, res) => {
  try {
    if (!YOUTUBE_API_KEY) {
      return res.status(500).json({
        error: "Missing YOUTUBE_API
