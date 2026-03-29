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
        error: "Missing YOUTUBE_API_KEY environment variable."
      });
    }

    const strokeType = String(req.query.strokeType || "forehand");
    const playerName = String(req.query.playerName || "");
    const maxResults = Math.min(Math.max(Number(req.query.maxResults || 5), 1), 10);
    const extraKeywords = String(req.query.extraKeywords || "training slow motion front view");
    const q = buildSearchQuery({ strokeType, playerName, extraKeywords });

    const searchParams = new URLSearchParams({
      part: "snippet",
      type: "video",
      q,
      maxResults: String(maxResults),
      videoEmbeddable: "true",
      safeSearch: "strict",
      key: YOUTUBE_API_KEY
    });

    const searchResp = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`);
    if (!searchResp.ok) {
      const details = await searchResp.text();
      return res.status(searchResp.status).json({ error: "YouTube search request failed.", details });
    }

    const searchData = await searchResp.json();
    const videoIds = (searchData.items || []).map(item => item?.id?.videoId).filter(Boolean);

    if (!videoIds.length) {
      return res.json({ query: q, items: [] });
    }

    const detailsParams = new URLSearchParams({
      part: "contentDetails,statistics,snippet",
      id: videoIds.join(","),
      key: YOUTUBE_API_KEY
    });

    const detailsResp = await fetch(`https://www.googleapis.com/youtube/v3/videos?${detailsParams.toString()}`);
    if (!detailsResp.ok) {
      const details = await detailsResp.text();
      return res.status(detailsResp.status).json({ error: "YouTube details request failed.", details });
    }

    const detailsData = await detailsResp.json();
    const detailsMap = new Map((detailsData.items || []).map(item => [item.id, item]));

    const items = (searchData.items || []).map((item) => {
      const videoId = item.id.videoId;
      const detail = detailsMap.get(videoId) || {};
      const snippet = item.snippet || {};
      const thumbnails = snippet.thumbnails || {};

      return {
        id: videoId,
        title: snippet.title || "",
        channelTitle: snippet.channelTitle || "",
        description: snippet.description || "",
        publishedAt: snippet.publishedAt || "",
        thumbnail: thumbnails.medium?.url || thumbnails.high?.url || thumbnails.default?.url || "",
        duration: detail.contentDetails?.duration || "",
        viewCount: detail.statistics?.viewCount || "0",
        embedUrl: `https://www.youtube.com/embed/${videoId}`
      };
    });

    res.json({ query: q, items });
  } catch (error) {
    res.status(500).json({ error: "Unexpected server error.", details: String(error) });
  }
});

app.use(express.static(path.join(__dirname, "public")));
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
