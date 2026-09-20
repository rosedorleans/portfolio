export function normalizeYouTubeVideoId(value) {
  const id = String(value || "").trim();
  return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
}

export function normalizeSteamAppId(value) {
  const id = String(value || "").trim();
  return /^[1-9]\d{0,9}$/.test(id) ? id : "";
}

export function getYouTubeVideoId(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    const parts = url.pathname.split("/").filter(Boolean);
    if (host === "youtu.be") return normalizeYouTubeVideoId(parts[0]);
    if (!["youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com"].includes(host)) return "";
    if (url.pathname === "/watch") return normalizeYouTubeVideoId(url.searchParams.get("v"));
    if (["embed", "shorts", "live"].includes(parts[0])) return normalizeYouTubeVideoId(parts[1]);
  } catch {}
  return "";
}

export function getSteamAppId(value) {
  try {
    const url = new URL(value);
    if (url.hostname === "store.steampowered.com") {
      return normalizeSteamAppId(url.pathname.match(/^\/app\/(\d+)(?:\/|$)/)?.[1]);
    }
  } catch {}
  return "";
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function fetchYouTubeViews(videoId) {
  const url = new URL("https://returnyoutubedislikeapi.com/votes");
  url.searchParams.set("videoId", videoId);
  const data = await fetchJson(url);
  const viewCount = String(data.viewCount ?? "").trim();
  if (!/^\d+$/.test(viewCount)) throw new Error(`Missing viewCount for ${videoId}`);
  return viewCount;
}

export const steamReviewFilters = {
  language: "all",
  review_type: "all",
  purchase_type: "all",
  filter_offtopic_activity: 0,
};

export async function fetchSteamReviews(appId) {
  const url = new URL(`https://store.steampowered.com/appreviews/${appId}`);
  url.search = new URLSearchParams({ ...steamReviewFilters, json: "1", filter: "all", num_per_page: "1" });
  const data = await fetchJson(url);
  const count = data.query_summary?.total_reviews;
  if (data.success !== 1 || !Number.isSafeInteger(count) || count < 0) {
    throw new Error(`Missing total review count for ${appId}`);
  }
  return count;
}

// Each upstream failure is isolated: other projects still receive fresh counts.
export function createStatisticsHandler({ normalizeId, fetchCount, collection, countKey, source }) {
  return async (event) => {
    const ids = [...new Set(String(event.queryStringParameters?.ids || "").split(",").map(normalizeId).filter(Boolean))].slice(0, 50);
    const results = await Promise.allSettled(ids.map(async (id) => [id, { [countKey]: await fetchCount(id) }]));
    const entries = results.filter((result) => result.status === "fulfilled").map((result) => result.value);
    const failed = results.some((result) => result.status === "rejected");
    return {
      statusCode: ids.length && !entries.length ? 503 : 200,
      headers: {
        "Cache-Control": failed ? "no-store" : "public, max-age=300, s-maxage=3600",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ generatedAt: new Date().toISOString(), source, [collection]: Object.fromEntries(entries) }),
    };
  };
}
