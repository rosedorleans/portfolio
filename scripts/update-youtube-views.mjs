import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, "..");
const portfolioPath = path.join(rootDirectory, "data", "portfolio.json");
const outputPath = path.join(rootDirectory, "data", "youtube-views.json");

function normalizeYouTubeVideoId(videoId) {
  const normalizedVideoId = String(videoId || "").trim();

  return /^[A-Za-z0-9_-]{11}$/.test(normalizedVideoId) ? normalizedVideoId : "";
}

function getYouTubeVideoId(url) {
  try {
    const videoUrl = new URL(url);
    const host = videoUrl.hostname.replace(/^www\./, "").toLowerCase();
    const pathParts = videoUrl.pathname.split("/").filter(Boolean);

    if (host === "youtu.be") {
      return normalizeYouTubeVideoId(pathParts[0]);
    }

    if (!["youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com"].includes(host)) {
      return "";
    }

    if (videoUrl.pathname === "/watch") {
      return normalizeYouTubeVideoId(videoUrl.searchParams.get("v"));
    }

    if (["embed", "shorts", "live"].includes(pathParts[0])) {
      return normalizeYouTubeVideoId(pathParts[1]);
    }
  } catch {
    return "";
  }

  return "";
}

function getNormalizedYouTubeViewCount(viewCount) {
  const normalizedViewCount = String(viewCount || "").trim();

  return /^\d+$/.test(normalizedViewCount) ? normalizedViewCount : "";
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

async function main() {
  const portfolio = JSON.parse(await readFile(portfolioPath, "utf8"));
  const videos = {};
  const projects = Array.isArray(portfolio.projects) ? portfolio.projects : [];
  const youtubeProjects = projects
    .map((project) => ({
      id: String(project.id || ""),
      title: String(project.titleFr || project.title || project.id || ""),
      videoId: getYouTubeVideoId(project.url),
    }))
    .filter((project) => project.videoId);

  await Promise.all(
    youtubeProjects.map(async (project) => {
      const viewCount = await fetchYouTubeViews(project.videoId);

      videos[project.videoId] = {
        projectId: project.id,
        title: project.title,
        viewCount,
      };
      console.log(`${project.title}: ${viewCount}`);
    })
  );

  const output = {
    generatedAt: new Date().toISOString(),
    source: "returnyoutubedislikeapi.com",
    videos,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
