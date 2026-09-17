import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const portfolioPath = new URL("../data/portfolio.json", import.meta.url);
const outputPath = new URL("../data/steam-reviews.json", import.meta.url);

async function fetchSteamReviews(project) {
  const projectUrl = new URL(project.url);
  const appId = projectUrl.pathname.match(/^\/app\/(\d+)(?:\/|$)/)?.[1];

  if (projectUrl.hostname !== "store.steampowered.com" || !appId) {
    throw new Error(`Invalid Steam URL for ${project.id}`);
  }

  const url = new URL(`https://store.steampowered.com/appreviews/${appId}`);
  url.search = new URLSearchParams({
    json: "1",
    language: "all",
    review_type: "all",
    purchase_type: "all",
    filter: "all",
    filter_offtopic_activity: "0",
    num_per_page: "1",
  }).toString();

  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });

  if (!response.ok) {
    throw new Error(`Steam HTTP ${response.status} for ${project.id}`);
  }

  const data = await response.json();
  const reviewCount = data.query_summary?.total_reviews;

  if (data.success !== 1 || !Number.isSafeInteger(reviewCount) || reviewCount < 0) {
    throw new Error(`Missing total review count for ${project.id}`);
  }

  return [appId, { projectId: project.id, title: project.titleFr, reviewCount }];
}

async function main() {
  const portfolio = JSON.parse(await readFile(portfolioPath, "utf8"));
  const projects = portfolio.projects.filter((project) => project.category === "translation");
  // Fetch every total successfully before replacing the existing snapshot.
  const entries = await Promise.all(projects.map(fetchSteamReviews));
  const output = {
    generatedAt: new Date().toISOString(),
    source: "https://partner.steamgames.com/doc/store/getreviews",
    filters: { language: "all", review_type: "all", purchase_type: "all", filter_offtopic_activity: 0 },
    apps: Object.fromEntries(entries),
  };

  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  entries.forEach(([, app]) => console.log(`${app.title}: ${app.reviewCount} reviews`));
  console.log(`Saved ${fileURLToPath(outputPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
