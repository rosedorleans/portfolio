import { createStatisticsHandler, fetchSteamReviews, normalizeSteamAppId } from "../../lib/project-statistics.mjs";

export const handler = createStatisticsHandler({
  normalizeId: normalizeSteamAppId,
  fetchCount: fetchSteamReviews,
  collection: "apps",
  countKey: "reviewCount",
  source: "https://partner.steamgames.com/doc/store/getreviews",
});
