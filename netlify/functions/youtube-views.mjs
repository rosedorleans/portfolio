const source = "returnyoutubedislikeapi.com";
const maxVideoIds = 50;

function normalizeYouTubeVideoId(videoId) {
  const normalizedVideoId = String(videoId || "").trim();

  return /^[A-Za-z0-9_-]{11}$/.test(normalizedVideoId) ? normalizedVideoId : "";
}

function getNormalizedYouTubeViewCount(viewCount) {
  const normalizedViewCount = String(viewCount || "").trim();

  return /^\d+$/.test(normalizedViewCount) ? normalizedViewCount : "";
}

function getRequestedVideoIds(event) {
  const ids = event.queryStringParameters?.ids || "";

  return [
    ...new Set(
      ids
        .split(",")
        .map(normalizeYouTubeVideoId)
        .filter(Boolean)
    ),
  ].slice(0, maxVideoIds);
}

async function fetchYouTubeViews(videoId) {
  const url = new URL("https://returnyoutubedislikeapi.com/votes");

  url.searchParams.set("videoId", videoId);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  const viewCount = getNormalizedYouTubeViewCount(data.viewCount);

  if (!viewCount) {
    throw new Error(`Missing viewCount for ${videoId}`);
  }

  return viewCount;
}

export async function handler(event) {
  const videoIds = getRequestedVideoIds(event);
  const videos = {};

  await Promise.allSettled(
    videoIds.map(async (videoId) => {
      const viewCount = await fetchYouTubeViews(videoId);

      videos[videoId] = { viewCount };
    })
  );

  return {
    statusCode: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      generatedAt: new Date().toISOString(),
      source,
      videos,
    }),
  };
}
