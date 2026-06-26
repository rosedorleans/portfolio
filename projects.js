(() => {
  const defaultImagePath = "assets/images/nom.png";
  const dataPath = "data/portfolio.json";
  let projectsCache = [];
  let diplomasCache = [];
  let isLoaded = false;

  function cloneItem(item) {
    return { ...item };
  }

  function createId(prefix) {
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

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

  function normalizeProject(project) {
    const titleFr = String(project.titleFr || project.title || "").trim();
    const titleEn = String(project.titleEn || titleFr).trim();

    return {
      id: String(project.id || createId("project")),
      category: project.category === "translation" ? "translation" : "writing",
      titleFr,
      titleEn,
      date: String(project.date || ""),
      url: String(project.url || ""),
      image: String(project.image || defaultImagePath),
      altFr: String(project.altFr || `Visuel du projet ${titleFr}`).trim(),
      altEn: String(project.altEn || `Visual for ${titleEn}`).trim(),
      youtubeVideoId: getYouTubeVideoId(project.url),
      visible: project.visible !== false,
    };
  }

  function normalizeDiploma(diploma) {
    const titleFr = String(diploma.titleFr || diploma.title || "").trim();
    const titleEn = String(diploma.titleEn || titleFr).trim();
    const sectorFr = String(diploma.sectorFr || diploma.sector || "").trim();
    const sectorEn = String(diploma.sectorEn || sectorFr).trim();
    const placeFr = String(diploma.placeFr || diploma.place || "").trim();
    const placeEn = String(diploma.placeEn || placeFr).trim();
    const yearFr = String(diploma.yearFr || diploma.year || "").trim();
    const yearEn = String(diploma.yearEn || yearFr).trim();

    return {
      id: String(diploma.id || createId("diploma")),
      titleFr,
      titleEn,
      sectorFr,
      sectorEn,
      placeFr,
      placeEn,
      yearFr,
      yearEn,
      visible: diploma.visible !== false,
    };
  }

  function getProjectTimestamp(project) {
    const timestamp = Date.parse(project.date);

    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  function sortProjectsByNewest(projects) {
    return [...projects].sort((projectA, projectB) => getProjectTimestamp(projectB) - getProjectTimestamp(projectA));
  }

  function setData(data) {
    projectsCache = Array.isArray(data?.projects) ? sortProjectsByNewest(data.projects.map(normalizeProject)) : [];
    diplomasCache = Array.isArray(data?.diplomas) ? data.diplomas.map(normalizeDiploma) : [];
    isLoaded = true;
  }

  async function load() {
    try {
      const response = await fetch(dataPath, { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setData(await response.json());
    } catch {
      setData({ projects: [], diplomas: [] });
    }
  }

  function ensureLoaded() {
    if (!isLoaded) {
      setData({ projects: [], diplomas: [] });
    }
  }

  function getProjects() {
    ensureLoaded();
    return projectsCache.map(cloneItem);
  }

  function getDiplomas() {
    ensureLoaded();
    return diplomasCache.map(cloneItem);
  }

  window.portfolioProjectStore = {
    defaultImagePath,
    ready: load(),
    getProjects,
    getDiplomas,
    normalizeProject,
    normalizeDiploma,
  };
})();
