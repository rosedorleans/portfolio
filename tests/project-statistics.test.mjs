import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, unlink, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import vm from "node:vm";
import {
  getYouTubeVideoId, getSteamAppId, fetchYouTubeViews, fetchSteamReviews,
  createStatisticsHandler, normalizeSteamAppId,
} from "../lib/project-statistics.mjs";
import { updateStatistics } from "../scripts/lib/update-statistics.mjs";

test("new project URLs are recognized without an ID list", () => {
  for (const url of [
    "https://youtu.be/aV_EbGzMhig?si=share",
    "https://www.youtube.com/watch?v=aV_EbGzMhig&t=5",
    "https://m.youtube.com/shorts/aV_EbGzMhig",
    "https://www.youtube-nocookie.com/embed/aV_EbGzMhig",
    "https://youtube.com/live/aV_EbGzMhig",
  ]) assert.equal(getYouTubeVideoId(url), "aV_EbGzMhig");
  assert.equal(getSteamAppId("https://store.steampowered.com/app/123456/New_game/?l=french"), "123456");
  for (const url of ["", "not a URL", "https://example.com/watch?v=aV_EbGzMhig", "https://youtube.com/watch?v=bad"]) {
    assert.equal(getYouTubeVideoId(url), "");
  }
  for (const url of ["", "https://itch.io/game", "https://example.com/app/123", "https://store.steampowered.com/bundle/123"]) {
    assert.equal(getSteamAppId(url), "");
  }
});

test("upstream responses validate counts, preserve zero and use all Steam reviews", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.ok(options.signal);
      if (url.hostname === "returnyoutubedislikeapi.com") return { ok: true, json: async () => ({ viewCount: 0 }) };
      assert.equal(url.searchParams.get("purchase_type"), "all");
      assert.equal(url.searchParams.get("language"), "all");
      assert.equal(url.searchParams.get("filter_offtopic_activity"), "0");
      return { ok: true, json: async () => ({ success: 1, query_summary: { total_reviews: 0 } }) };
    };
    assert.equal(await fetchYouTubeViews("aV_EbGzMhig"), "0");
    assert.equal(await fetchSteamReviews("123"), 0);
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ success: 1, query_summary: {} }) });
    await assert.rejects(fetchYouTubeViews("aV_EbGzMhig"), /Missing viewCount/);
    await assert.rejects(fetchSteamReviews("123"), /Missing total/);
    globalThis.fetch = async () => ({ ok: false, status: 429 });
    await assert.rejects(fetchYouTubeViews("aV_EbGzMhig"), /429/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("snapshot refresh adds new games and isolates unavailable or unrelated projects", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "portfolio-statistics-"));
  const portfolioPath = path.join(directory, "portfolio.json");
  const outputPath = path.join(directory, "statistics.json");
  try {
    const projects = [
      { id: "new-game", url: "https://store.steampowered.com/app/123/New/" },
      { id: "old-game", url: "https://store.steampowered.com/app/456/Old/" },
      { id: "duplicate", url: "https://store.steampowered.com/app/123/New/" },
      { id: "unavailable", url: "https://store.steampowered.com/app/789/" },
      { id: "hidden", url: "https://store.steampowered.com/app/999/", visible: false },
      { id: "other-store", category: "translation", url: "https://example.itch.io/new-game" },
    ];
    await writeFile(portfolioPath, JSON.stringify({ projects }));
    const oldTimestamp = "2026-01-01T00:00:00.000Z";
    await writeFile(outputPath, JSON.stringify({ generatedAt: oldTimestamp, apps: { 456: { reviewCount: 42 }, 888: { reviewCount: 99 } } }));
    const requested = [];
    const options = {
      portfolioPath, outputPath, getId: getSteamAppId, collection: "apps", countKey: "reviewCount",
      metadata: { source: "test" },
      fetchCount: async (id) => {
        requested.push(id);
        if (id === "123") return 0;
        throw new Error("upstream unavailable");
      },
    };
    await updateStatistics(options);
    const snapshot = JSON.parse(await readFile(outputPath, "utf8"));
    assert.deepEqual(requested.sort(), ["123", "456", "789"]);
    assert.equal(snapshot.apps[123].reviewCount, 0);
    assert.equal(snapshot.apps[456].reviewCount, 42);
    assert.equal(snapshot.apps[456].updatedAt, oldTimestamp);
    assert.equal(snapshot.apps[789], undefined);
    assert.equal(snapshot.apps[888], undefined);
    await updateStatistics({ ...options, fetchCount: async () => { throw new Error("offline"); } });
    const offline = JSON.parse(await readFile(outputPath, "utf8"));
    assert.equal(offline.generatedAt, snapshot.generatedAt);
    assert.deepEqual(offline.apps, snapshot.apps);
    await unlink(outputPath);
    await updateStatistics(options);
    assert.equal(JSON.parse(await readFile(outputPath, "utf8")).apps[123].reviewCount, 0);
  } finally {
    await Promise.all([portfolioPath, outputPath].map((file) => unlink(file).catch(() => {})));
    await rmdir(directory);
  }
});

test("live endpoint deduplicates and bounds IDs, returns partial success, signals total failure", async () => {
  const requested = [];
  const handler = createStatisticsHandler({
    normalizeId: normalizeSteamAppId, collection: "apps", countKey: "reviewCount", source: "test",
    fetchCount: async (id) => {
      requested.push(id);
      if (id === "2") throw new Error("unavailable");
      return 0;
    },
  });
  const result = await handler({ queryStringParameters: { ids: "1,2,1,nope,https://example.com,-1" } });
  assert.equal(result.statusCode, 200);
  assert.deepEqual(requested, ["1", "2"]);
  assert.deepEqual(JSON.parse(result.body).apps, { 1: { reviewCount: 0 } });
  assert.equal(result.headers["Cache-Control"], "no-store");
  assert.equal((await handler({ queryStringParameters: { ids: "2" } })).statusCode, 503);
  requested.length = 0;
  await handler({ queryStringParameters: { ids: Array.from({ length: 60 }, (_, i) => i + 1).join(",") } });
  assert.equal(requested.length, 50);
  requested.length = 0;
  assert.equal((await handler({})).statusCode, 200);
  assert.equal(requested.length, 0);
});

async function loadBrowserStatistics(fetch) {
  const source = await readFile(new URL("../script.js", import.meta.url), "utf8");
  // Evaluate the actual page helpers without launching its UI initialization.
  const start = source.indexOf("function getBatches(");
  const end = source.indexOf("function getProjectTimestamp(", start);
  const context = vm.createContext({ fetch, URL, AbortSignal, console, window: { location: { href: "https://portfolio.example/" } } });
  vm.runInContext(source.slice(start, end), context);
  return context;
}

test("browser displays cache promptly and uses per-project freshness when sources disagree", async () => {
  let resolveRemote;
  let localWasApplied = false;
  const remote = new Promise((resolve) => { resolveRemote = resolve; });
  const context = await loadBrowserStatistics(async (url) => ({
    ok: true,
    json: async () => url === "remote" ? remote : {
      generatedAt: "2026-09-20", apps: { 1: { reviewCount: 42, updatedAt: "2026-09-19" } },
    },
  }));
  const options = {
    ids: ["1", "2"], sources: ["local", "remote"], collection: "apps", countKey: "reviewCount",
    normalize: context.normalizeSteamReviewCount,
    applyCounts: (counts) => {
      assert.equal(counts.get("1"), 42);
      if (!counts.has("2")) localWasApplied = true;
    },
  };
  const refresh = context.fetchCachedProjectCounts(options);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(localWasApplied, true);
  resolveRemote({ generatedAt: "2026-09-21", apps: {
    1: { reviewCount: 30, updatedAt: "2026-09-18" }, 2: { reviewCount: 0 },
  } });
  await refresh;
});

test("browser retrieves more than 50 new projects and keeps successful batches on failure", async () => {
  const batches = [];
  const context = await loadBrowserStatistics(async (url) => {
    const ids = url.searchParams.get("ids").split(",");
    batches.push(ids);
    if (ids.includes("51")) throw new Error("second batch offline");
    return { ok: true, json: async () => ({ apps: Object.fromEntries(ids.map((id) => [id, { reviewCount: Number(id) }])) }) };
  });
  const counts = await context.fetchLiveProjectCounts({
    ids: Array.from({ length: 65 }, (_, i) => String(i + 1)), endpoint: "/.netlify/functions/steam-reviews",
    collection: "apps", countKey: "reviewCount", normalize: context.normalizeSteamReviewCount,
  });
  assert.deepEqual(batches.map((batch) => batch.length), [50, 15]);
  assert.equal(counts.size, 50);
  assert.equal(counts.get("1"), 1);
  assert.equal(counts.has("51"), false);
});
