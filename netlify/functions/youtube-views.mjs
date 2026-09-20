import { createStatisticsHandler, fetchYouTubeViews, normalizeYouTubeVideoId } from "../../lib/project-statistics.mjs";

export const handler = createStatisticsHandler({
  normalizeId: normalizeYouTubeVideoId,
  fetchCount: fetchYouTubeViews,
  collection: "videos",
  countKey: "viewCount",
  source: "returnyoutubedislikeapi.com",
});
