import { readFile, writeFile } from "node:fs/promises";

export async function updateStatistics({ portfolioPath, outputPath, getId, fetchCount, collection, countKey, metadata }) {
  const portfolio = JSON.parse(await readFile(portfolioPath, "utf8"));
  let previous = {};
  try {
    previous = JSON.parse(await readFile(outputPath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const projectsById = new Map();
  for (const project of portfolio.projects || []) {
    const id = getId(project.url);
    if (id && project.visible !== false) projectsById.set(id, project);
  }

  const generatedAt = new Date().toISOString();
  let refreshed = 0;
  const entries = await Promise.all([...projectsById].map(async ([id, project]) => {
    const entry = { projectId: String(project.id || ""), title: String(project.titleFr || project.title || project.id || "") };
    try {
      const count = await fetchCount(id);
      refreshed += 1;
      console.log(`${entry.title}: ${count}`);
      return [id, { ...entry, [countKey]: count, updatedAt: generatedAt }];
    } catch (error) {
      console.warn(`Unable to update ${entry.title}: ${error.message}. Keeping the last known count if available.`);
      const cached = previous[collection]?.[id];
      const count = cached?.[countKey];
      if (count != null && /^\d+$/.test(String(count))) {
        return [id, { ...cached, ...entry, updatedAt: cached.updatedAt || previous.generatedAt }];
      }
      return null;
    }
  }));

  const output = {
    generatedAt: refreshed || !projectsById.size ? generatedAt : previous.generatedAt || null,
    ...metadata,
    [collection]: Object.fromEntries(entries.filter(Boolean)),
  };
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
}
