import { fetchYouTubeViews, getYouTubeVideoId } from "../lib/project-statistics.mjs";
import { updateStatistics } from "./lib/update-statistics.mjs";

updateStatistics({
  portfolioPath: new URL("../data/portfolio.json", import.meta.url),
  outputPath: new URL("../data/youtube-views.json", import.meta.url),
  getId: getYouTubeVideoId,
  fetchCount: fetchYouTubeViews,
  collection: "videos",
  countKey: "viewCount",
  metadata: { source: "returnyoutubedislikeapi.com" },
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
