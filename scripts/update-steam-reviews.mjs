import { fetchSteamReviews, getSteamAppId, steamReviewFilters } from "../lib/project-statistics.mjs";
import { updateStatistics } from "./lib/update-statistics.mjs";

updateStatistics({
  portfolioPath: new URL("../data/portfolio.json", import.meta.url),
  outputPath: new URL("../data/steam-reviews.json", import.meta.url),
  getId: getSteamAppId,
  fetchCount: fetchSteamReviews,
  collection: "apps",
  countKey: "reviewCount",
  metadata: { source: "https://partner.steamgames.com/doc/store/getreviews", filters: steamReviewFilters },
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
