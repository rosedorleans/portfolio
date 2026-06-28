const body = document.body;
const typeTarget = document.querySelector(".typewriter");
const projectPanels = document.querySelectorAll("[data-project-panel]");
const languageToggle = document.querySelector("[data-language-toggle]");
const metaDescription = document.querySelector('meta[name="description"]');
const viewTabs = document.querySelectorAll("[data-view-tab]");
const viewPanels = document.querySelectorAll("[data-view-panel]");
const diplomaList = document.querySelector("[data-diploma-list]");
const socialHintOutput = document.querySelector("[data-social-hint-output]");
const socialHintLinks = document.querySelectorAll("[data-social-hint]");
const youtubeApiKeyMeta = document.querySelector('meta[name="youtube-api-key"]');
const projectStore = window.portfolioProjectStore;
const youtubeViewsDataPath = "data/youtube-views.json";
const youtubeViewsRemoteDataPath =
  window.PORTFOLIO_YOUTUBE_VIEWS_URL ||
  "https://raw.githubusercontent.com/rosedorleans/portfolio/main/data/youtube-views.json";
let currentLanguage = "fr";
let typewriterTimers = [];
let activeSocialHintKey = "";
const previewImageCache = new Map();
const previewRequests = new WeakMap();
const youtubeViewCounts = new Map();
const projectSelectionMedia = window.matchMedia("(max-width: 920px)");
const socialHintMedia = window.matchMedia("(hover: hover) and (pointer: fine)");

const translations = {
  fr: {
    htmlLang: "fr",
    pageTitle: "Rose Dorléans - Autrice / Traductrice",
    metaDescription:
      "Portfolio de Rose Dorléans, autrice de scripts et traductrice spécialisée en jeux vidéo indés.",
    languageButton: "EN",
    languageButtonLabel: "Passer le site en anglais",
    portfolioLabel: "Portfolio de Rose Dorléans",
    portfolioContentLabel: "Sections du portfolio",
    viewSwitcherLabel: "Catégories du portfolio",
    activitiesTab: "Activités",
    diplomasTab: "Diplômes",
    activitiesLabel: "Activités",
    diplomasLabel: "Diplômes",
    diplomaTitleLabel: "Diplôme",
    diplomaSectorLabel: "Secteur",
    diplomaPlaceLabel: "Lieu",
    diplomaYearLabel: "Année",
    heroEyebrow: "Portfolio / écriture & traduction",
    heroName: "Rose Dorléans",
    heroSubtitle: "Autrice / Traductrice",
    heroIntro:
      '<span class="hero-intro-lead">Scripts, récits et localisations\nsensibles au ton, au rythme et aux détails.</span><span class="hero-intro-cta">Engagez-moi pour <strong>rechercher</strong>, <strong>écrire</strong>, <strong>relire</strong> ou <strong>traduire</strong>,\n et gagnez du temps et de la qualité sur vos projets.</span>',
    writingNumber: "01",
    writingTitle: "Écriture",
    writingBody:
      "Autrice de script, passionnée par le cinéma et la pop culture. Mes 3 années d'études de lettres m'ont appris à rechercher, analyser, rédiger et comprendre les codes de l'écriture narrative.",
    writingVisualLabel: "Visuel du projet d'écriture sélectionné",
    writingProjectsLabel: "Projets d'écriture",
    youtubeViewsSingular: "vue",
    youtubeViewsPlural: "vues",
    translationTitle: "Traduction",
    translationBody:
      "Traductrice spécialisée en jeux vidéo indés. Je suis bilingue anglais, et grâce à mon master en développement web, je peux comprendre les besoins techniques des studios.",
    translationVisualLabel: "Visuel du projet de traduction sélectionné",
    translationProjectsLabel: "Projets de traduction",
    translationNumber: "02",
    socialsTitle: "Réseaux",
    footerLabel: "Réseaux et contact",
    socialEmail: "Email",
    socialInstagram: "Instagram",
    socialX: "X",
    socialLetterboxd: "Letterboxd",
    socialGoodreads: "Goodreads",
    socialHintEmail: "Pour me contacter",
    socialHintInstagram: "Pour suivre mes actus",
    socialHintX: "Pour suivre TOUTES mes actus",
    socialHintLetterboxd: "Pour voir ce que je regarde",
    socialHintGoodreads: "Pour voir ce que je lis",
  },
  en: {
    htmlLang: "en",
    pageTitle: "Rose Dorléans - Writer / Translator",
    metaDescription:
      "Portfolio of Rose Dorléans, script writer and translator specialized in indie video games.",
    languageButton: "FR",
    languageButtonLabel: "Switch the site to French",
    portfolioLabel: "Rose Dorléans portfolio",
    portfolioContentLabel: "Portfolio sections",
    viewSwitcherLabel: "Portfolio categories",
    activitiesTab: "Activities",
    diplomasTab: "Education",
    activitiesLabel: "Activities",
    diplomasLabel: "Education",
    diplomaTitleLabel: "Diploma",
    diplomaSectorLabel: "Field",
    diplomaPlaceLabel: "Place",
    diplomaYearLabel: "Year",
    heroEyebrow: "Portfolio / writing & translation",
    heroName: "Rose Dorléans",
    heroSubtitle: "Writer / Translator",
    heroIntro:
      '<span class="hero-intro-lead">Scripts, stories, and localizations\nshaped around tone, rhythm, and detail.</span><span class="hero-intro-cta">Hire me to <strong>research</strong>, <strong>write</strong>, <strong>proofread</strong>, or <strong>translate</strong>, and save time while raising the quality of your projects.</span>',
    writingNumber: "01",
    writingTitle: "Writing",
    writingBody:
      "Ghost writer with a love for cinema and pop culture. Three years of literature studies taught me how to research, write, analyze, synthesize, and understand the codes of narrative writing.",
    writingVisualLabel: "Selected writing project visual",
    writingProjectsLabel: "Writing projects",
    youtubeViewsSingular: "view",
    youtubeViewsPlural: "views",
    translationTitle: "Translation",
    translationBody:
      "Translator specialized in indie video games. Born french, my web development background and litt studies help me understand english and studios' technical needs.",
    translationVisualLabel: "Selected translation project visual",
    translationProjectsLabel: "Translation projects",
    translationNumber: "02",
    socialsTitle: "Socials",
    footerLabel: "Social links and contact",
    socialEmail: "Email",
    socialInstagram: "Instagram",
    socialX: "X",
    socialLetterboxd: "Letterboxd",
    socialGoodreads: "Goodreads",
    socialHintEmail: "To contact me",
    socialHintInstagram: "To see my news",
    socialHintX: "To see ALL my news",
    socialHintLetterboxd: "To see what I watch",
    socialHintGoodreads: "To see what I read",
  },
};

function typeText(element, text) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  typewriterTimers.forEach((timer) => window.clearTimeout(timer));
  typewriterTimers = [];

  if (prefersReducedMotion) {
    element.textContent = text;
    return;
  }

  element.textContent = "";
  [...text].forEach((letter, index) => {
    const timer = window.setTimeout(() => {
      element.textContent += letter;
    }, 42 * index);
    typewriterTimers.push(timer);
  });
}

function stopTypewriter() {
  typewriterTimers.forEach((timer) => window.clearTimeout(timer));
  typewriterTimers = [];
}

function setSocialHint(key) {
  if (!socialHintOutput) {
    return;
  }

  const nextKey = socialHintMedia.matches ? key || "" : "";

  activeSocialHintKey = nextKey;
  socialHintOutput.textContent = nextKey ? translations[currentLanguage][nextKey] || "" : "";
  socialHintOutput.classList.toggle("is-visible", Boolean(nextKey));
}

function getProjectAlt(link) {
  const dynamicAlt = currentLanguage === "en" ? link.dataset.altEn : link.dataset.altFr;

  if (dynamicAlt) {
    return dynamicAlt;
  }

  return link.textContent.trim();
}

function formatProjectDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const [year, month, day] = dateValue.split("-");

  if (!year || !month || !day) {
    return dateValue;
  }

  return `${day}/${month}/${year}`;
}

function getYouTubeApiKey() {
  return String(
    window.PORTFOLIO_YOUTUBE_API_KEY ||
      window.YOUTUBE_API_KEY ||
      youtubeApiKeyMeta?.getAttribute("content") ||
      ""
  ).trim();
}

function getNormalizedYouTubeViewCount(viewCount) {
  const normalizedViewCount = String(viewCount || "").trim();

  return /^\d+$/.test(normalizedViewCount) ? normalizedViewCount : "";
}

function formatYouTubeViewCount(viewCount) {
  const normalizedViewCount = getNormalizedYouTubeViewCount(viewCount);
  const numericViewCount = Number(normalizedViewCount);

  if (!normalizedViewCount || !Number.isFinite(numericViewCount)) {
    return "";
  }

  const units = [
    { value: 1_000_000_000, suffix: "B" },
    { value: 1_000_000, suffix: "M" },
    { value: 1_000, suffix: "K" },
  ];
  const unit = units.find((candidate) => numericViewCount >= candidate.value);

  if (!unit) {
    return String(numericViewCount);
  }

  const scaledViewCount = numericViewCount / unit.value;
  const maximumFractionDigits = scaledViewCount >= 10 || Number.isInteger(scaledViewCount) ? 0 : 1;
  const factor = 10 ** maximumFractionDigits;
  const truncatedViewCount = Math.floor(scaledViewCount * factor) / factor;
  const formattedViewCount = truncatedViewCount.toFixed(maximumFractionDigits).replace(/\.0$/, "");

  return `${formattedViewCount}${unit.suffix}`;
}

function getYouTubeViewsText(viewCount) {
  const normalizedViewCount = getNormalizedYouTubeViewCount(viewCount);
  const formattedViewCount = formatYouTubeViewCount(normalizedViewCount);
  const numericViewCount = Number(normalizedViewCount);

  if (!formattedViewCount) {
    return "";
  }

  const copy = translations[currentLanguage];
  const label =
    currentLanguage === "fr" && numericViewCount >= 1_000_000
      ? `de ${copy.youtubeViewsPlural}`
      : normalizedViewCount === "1"
        ? copy.youtubeViewsSingular
        : copy.youtubeViewsPlural;

  return `${formattedViewCount} ${label}`;
}

function createEyeIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const eyeShape = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const pupil = document.createElementNS("http://www.w3.org/2000/svg", "circle");

  svg.setAttribute("class", "project-video-stats-icon");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  eyeShape.setAttribute(
    "d",
    "M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"
  );
  pupil.setAttribute("cx", "12");
  pupil.setAttribute("cy", "12");
  pupil.setAttribute("r", "3");
  svg.append(eyeShape, pupil);

  return svg;
}

function renderYouTubeViewCounter(counter) {
  const videoId = counter.dataset.youtubeViews || "";
  const viewCount = youtubeViewCounts.get(videoId) || "";
  const text = getYouTubeViewsText(viewCount);
  const label = currentLanguage === "en" ? `${text} on YouTube` : `${text} sur YouTube`;

  counter.hidden = !text;

  if (text) {
    const textElement = document.createElement("span");

    textElement.textContent = text;
    counter.replaceChildren(createEyeIcon(), textElement);
    counter.setAttribute("aria-label", label);
  } else {
    counter.replaceChildren();
    counter.removeAttribute("aria-label");
  }
}

function updateYouTubeVideoStats(container, link) {
  if (!container) {
    return;
  }

  const videoId = link?.dataset.youtubeVideoId || "";

  container.dataset.youtubeViews = videoId;
  renderYouTubeViewCounter(container);
}

function refreshYouTubeVideoStats() {
  document.querySelectorAll("[data-project-video-stats]").forEach((container) => {
    const card = container.closest(".activity-card");
    const activeLink = card?.querySelector(".project-link.is-active");

    updateYouTubeVideoStats(container, activeLink);
  });
}

function getBatches(items, batchSize) {
  const batches = [];

  for (let index = 0; index < items.length; index += batchSize) {
    batches.push(items.slice(index, index + batchSize));
  }

  return batches;
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

async function fetchOfficialYouTubeViewCounts(videoIds) {
  const apiKey = getYouTubeApiKey();
  const viewCounts = new Map();

  if (!apiKey || videoIds.length === 0) {
    return viewCounts;
  }

  const batches = getBatches(videoIds, 50);

  await Promise.all(
    batches.map(async (batch) => {
      const url = new URL("https://www.googleapis.com/youtube/v3/videos");

      url.searchParams.set("part", "statistics");
      url.searchParams.set("id", batch.join(","));
      url.searchParams.set("key", apiKey);

      const data = await fetchJson(url);

      (data.items || []).forEach((item) => {
        const videoId = item.id;
        const viewCount = getNormalizedYouTubeViewCount(item.statistics?.viewCount);

        if (videoId && viewCount) {
          viewCounts.set(videoId, viewCount);
        }
      });
    })
  );

  return viewCounts;
}

async function fetchCachedYouTubeViewCounts(videoIds) {
  const viewCounts = new Map();
  const sources = [
    youtubeViewsDataPath,
    `${youtubeViewsRemoteDataPath}?updated=${Date.now()}`,
  ];

  for (const source of sources) {
    try {
      const data = await fetchJson(source);
      const videos = data.videos || {};

      videoIds.forEach((videoId) => {
        const viewCount = getNormalizedYouTubeViewCount(videos[videoId]?.viewCount || videos[videoId]);

        if (viewCount) {
          viewCounts.set(videoId, viewCount);
        }
      });
    } catch (error) {
      console.warn(`Unable to load cached YouTube stats from ${source}.`, error);
    }
  }

  return viewCounts;
}

async function fetchYouTubeViewCounts(videoIds) {
  const viewCounts = new Map();

  try {
    const officialViewCounts = await fetchOfficialYouTubeViewCounts(videoIds);

    officialViewCounts.forEach((viewCount, videoId) => {
      viewCounts.set(videoId, viewCount);
    });
  } catch (error) {
    console.warn("Unable to load YouTube Data API stats.", error);
  }

  return viewCounts;
}

async function updateYouTubeViewCounts() {
  const videoIds = [
    ...new Set(
      [...document.querySelectorAll("[data-youtube-video-id]")]
        .map((link) => link.dataset.youtubeVideoId)
        .filter(Boolean)
    ),
  ];

  if (videoIds.length === 0) {
    return;
  }

  try {
    const cachedViewCounts = await fetchCachedYouTubeViewCounts(videoIds);

    cachedViewCounts.forEach((viewCount, videoId) => {
      youtubeViewCounts.set(videoId, viewCount);
    });
    refreshYouTubeVideoStats();

    const viewCounts = await fetchYouTubeViewCounts(videoIds);

    viewCounts.forEach((viewCount, videoId) => {
      youtubeViewCounts.set(videoId, viewCount);
    });
    refreshYouTubeVideoStats();
  } catch (error) {
    console.warn("Unable to load YouTube view counts.", error);
  }
}

function getProjectTimestamp(project) {
  const timestamp = Date.parse(project.date);

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getNewestVisibleProjectId(projects) {
  const newestProject = projects.reduce((newest, project) => {
    if (project.visible === false) {
      return newest;
    }

    if (!newest || getProjectTimestamp(project) > getProjectTimestamp(newest)) {
      return project;
    }

    return newest;
  }, null);

  return newestProject?.id || "";
}

function getLocalizedDiplomaValue(diploma, key) {
  const languageKey = currentLanguage === "en" ? `${key}En` : `${key}Fr`;
  const fallbackKey = `${key}Fr`;

  return diploma[languageKey] || diploma[fallbackKey] || "";
}

function createDiplomaCell(label, value, modifier) {
  const cell = document.createElement("div");
  const labelElement = document.createElement("span");
  const valueElement = document.createElement("span");

  cell.className = `diploma-cell ${modifier}`;
  labelElement.className = "diploma-label";
  labelElement.textContent = label;
  valueElement.className = "diploma-value";
  valueElement.textContent = value;

  cell.append(labelElement, valueElement);
  return cell;
}

function renderDiplomas() {
  if (!diplomaList) {
    return;
  }

  const copy = translations[currentLanguage];
  const diplomas = projectStore.getDiplomas().filter((diploma) => diploma.visible !== false);

  diplomaList.replaceChildren(...diplomas.map((diploma) => {
    const row = document.createElement("article");

    row.className = "diploma-row";
    row.append(
      createDiplomaCell(copy.diplomaTitleLabel, getLocalizedDiplomaValue(diploma, "title"), "is-title"),
      createDiplomaCell(copy.diplomaSectorLabel, getLocalizedDiplomaValue(diploma, "sector"), "is-sector"),
      createDiplomaCell(copy.diplomaPlaceLabel, getLocalizedDiplomaValue(diploma, "place"), "is-place"),
      createDiplomaCell(copy.diplomaYearLabel, getLocalizedDiplomaValue(diploma, "year"), "is-year")
    );

    return row;
  }));
}

function createProjectElement(project, isNewestProject = false) {
  const hasUrl = Boolean(project.url);
  const item = document.createElement("div");
  const element = document.createElement(hasUrl ? "a" : "button");
  const title = document.createElement("span");
  const meta = document.createElement("span");
  const date = document.createElement("time");
  const youtubeVideoId = project.category === "writing" ? project.youtubeVideoId || "" : "";

  item.className = "project-item";
  item.classList.toggle("has-url", hasUrl);
  item.classList.toggle("is-new", isNewestProject);

  element.className = "project-link";
  element.dataset.newProject = isNewestProject ? "true" : "false";
  element.dataset.project = project.id;
  element.dataset.image = project.image || projectStore.defaultImagePath;
  element.dataset.altFr = project.altFr || `Visuel du projet ${project.titleFr}`;
  element.dataset.altEn = project.altEn || `Visual for ${project.titleEn || project.titleFr}`;
  element.dataset.youtubeVideoId = youtubeVideoId;

  title.className = "project-title";
  title.dataset.dynamicTitle = "";
  title.dataset.titleFr = project.titleFr;
  title.dataset.titleEn = project.titleEn || project.titleFr;
  title.textContent = project.titleFr;

  meta.className = "project-meta";

  date.dateTime = project.date || "";
  date.textContent = formatProjectDate(project.date);
  meta.append(date);

  if (hasUrl) {
    element.href = project.url;
    element.target = "_blank";
    element.rel = "noreferrer";
  } else {
    element.type = "button";
  }

  element.append(title, meta);

  if (hasUrl) {
    const openLink = document.createElement("a");
    const titleFr = project.titleFr;
    const titleEn = project.titleEn || project.titleFr;

    openLink.className = "project-open-link";
    openLink.href = project.url;
    openLink.target = "_blank";
    openLink.rel = "noreferrer";
    openLink.dataset.projectOpenLabel = "";
    openLink.dataset.labelFr = `Ouvrir ${titleFr}`;
    openLink.dataset.labelEn = `Open ${titleEn}`;
    openLink.setAttribute("aria-label", openLink.dataset.labelFr);
    openLink.textContent = "↗";

    item.append(element, openLink);
    return item;
  }

  item.append(element);
  return item;
}

function renderProjectLists() {
  const projects = projectStore.getProjects();

  document.querySelectorAll("[data-project-list]").forEach((list) => {
    const category = list.dataset.projectList;
    const categoryProjects = projects.filter((project) => project.category === category && project.visible !== false);
    const newestVisibleProjectId = getNewestVisibleProjectId(categoryProjects);

    list.replaceChildren(
      ...categoryProjects.map((project) => createProjectElement(project, project.id === newestVisibleProjectId))
    );
  });
}

function markNewestProjectsAsDefault() {
  document.querySelectorAll("[data-project-panel]").forEach((panel) => {
    const links = [...panel.querySelectorAll(".project-link")];

    links.forEach((link) => {
      link.removeAttribute("aria-current");
    });

    links[0]?.setAttribute("aria-current", "true");
  });
}

function preloadPreviewImage(src) {
  if (!src || previewImageCache.has(src)) {
    return;
  }

  const image = new Image();
  image.decoding = "async";
  image.src = src;
  previewImageCache.set(src, image);

  image.decode?.().catch(() => {});
}

function switchPreview(preview, link) {
  if (!preview || !link.dataset.image) {
    return;
  }

  const nextImage = link.dataset.image;
  const requestId = Symbol(nextImage);

  preloadPreviewImage(nextImage);
  previewRequests.set(preview, requestId);

  if (preview.getAttribute("src") === nextImage) {
    preview.alt = getProjectAlt(link);
    preview.classList.remove("is-switching");
    return;
  }

  preview.classList.add("is-switching");
  preview.src = nextImage;
  preview.alt = getProjectAlt(link);

  const finishSwitch = () => {
    if (previewRequests.get(preview) === requestId && preview.getAttribute("src") === nextImage) {
      preview.classList.remove("is-switching");
    }
  };

  if (preview.complete) {
    finishSwitch();
    return;
  }

  preview.addEventListener("load", finishSwitch, { once: true });
  preview.addEventListener("error", finishSwitch, { once: true });
}

function translatePage(language) {
  currentLanguage = language;
  const copy = translations[language];

  document.documentElement.lang = copy.htmlLang;
  document.title = copy.pageTitle;

  if (metaDescription) {
    metaDescription.setAttribute("content", copy.metaDescription);
  }

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;

    if (Object.prototype.hasOwnProperty.call(copy, key)) {
      if (key === "heroIntro") {
        element.innerHTML = copy[key];
      } else {
        element.textContent = copy[key];
      }
    }
  });

  document.querySelectorAll(".project-link time[datetime]").forEach((element) => {
    element.textContent = formatProjectDate(element.getAttribute("datetime"));
  });

  refreshYouTubeVideoStats();

  document.querySelectorAll("[data-dynamic-title]").forEach((element) => {
    element.textContent =
      currentLanguage === "en" ? element.dataset.titleEn || element.dataset.titleFr : element.dataset.titleFr;
  });

  document.querySelectorAll("[data-project-open-label]").forEach((element) => {
    element.setAttribute(
      "aria-label",
      currentLanguage === "en" ? element.dataset.labelEn || element.dataset.labelFr : element.dataset.labelFr
    );
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", copy[element.dataset.i18nAriaLabel]);
  });

  if (typeTarget) {
    typeTarget.dataset.text = copy.heroSubtitle;

    if (!body.classList.contains("is-loading")) {
      stopTypewriter();
      typeTarget.textContent = copy.heroSubtitle;
    }
  }

  if (languageToggle) {
    languageToggle.textContent = copy.languageButton;
    languageToggle.setAttribute("aria-label", copy.languageButtonLabel);
  }

  if (activeSocialHintKey) {
    setSocialHint(activeSocialHintKey);
  }

  document.querySelectorAll("[data-project-panel]").forEach((panel) => {
    const activeLink = panel.querySelector(".project-link.is-active");
    const card = panel.closest(".activity-card");
    const preview = card?.querySelector("[data-project-preview]");
    const videoStatsContainer = card?.querySelector("[data-project-video-stats]");

    if (activeLink && preview) {
      preview.alt = getProjectAlt(activeLink);
    }

    if (activeLink) {
      updateYouTubeVideoStats(videoStatsContainer, activeLink);
    }
  });

  renderDiplomas();
}

function setActivePortfolioView(view) {
  viewTabs.forEach((tab) => {
    const isActive = tab.dataset.viewTab === view;

    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });

  viewPanels.forEach((panel) => {
    panel.hidden = panel.dataset.viewPanel !== view;
  });
}

function initializePortfolioViews() {
  if (!viewTabs.length || !viewPanels.length) {
    return;
  }

  viewTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      setActivePortfolioView(tab.dataset.viewTab);
    });

    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) {
        return;
      }

      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextTab = viewTabs[(index + direction + viewTabs.length) % viewTabs.length];

      nextTab.focus();
      setActivePortfolioView(nextTab.dataset.viewTab);
    });
  });

  setActivePortfolioView("activities");
}

function updateProjectScrollbar(panel, projectList) {
  if (!panel || !projectList) {
    return;
  }

  const maxScroll = projectList.scrollHeight - projectList.clientHeight;
  const listHeight = projectList.clientHeight;
  const hasScroll = maxScroll > 1 && listHeight > 0;

  panel.classList.toggle("has-project-scroll", hasScroll);
  panel.style.setProperty("--project-scrollbar-top", `${projectList.offsetTop}px`);
  panel.style.setProperty("--project-scrollbar-height", `${listHeight}px`);

  if (!hasScroll) {
    panel.style.setProperty("--project-scrollbar-thumb-height", "0px");
    panel.style.setProperty("--project-scrollbar-thumb-top", `${projectList.offsetTop}px`);
    return;
  }

  const thumbHeight = Math.max(24, Math.round((projectList.clientHeight / projectList.scrollHeight) * listHeight));
  const thumbTravel = listHeight - thumbHeight;
  const thumbTop = projectList.offsetTop + Math.round((projectList.scrollTop / maxScroll) * thumbTravel);

  panel.style.setProperty("--project-scrollbar-thumb-height", `${thumbHeight}px`);
  panel.style.setProperty("--project-scrollbar-thumb-top", `${thumbTop}px`);
}

function initializeProjectScrollbar(panel, projectList) {
  if (!projectList) {
    return;
  }

  const updateScrollbar = () => updateProjectScrollbar(panel, projectList);

  projectList.addEventListener("scroll", updateScrollbar, { passive: true });
  window.addEventListener("resize", updateScrollbar);

  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(updateScrollbar);

    observer.observe(panel);
    observer.observe(projectList);
    panel.projectScrollbarObserver = observer;
  }

  updateScrollbar();
  window.requestAnimationFrame(updateScrollbar);
}

function updateNewProjectSticker(panel, projectList) {
  if (!panel || !projectList) {
    return;
  }

  const newProjectLink = projectList.querySelector('.project-link[data-new-project="true"]');
  let sticker = panel.querySelector(":scope > .project-new-sticker");

  if (!newProjectLink) {
    sticker?.remove();
    return;
  }

  if (!sticker) {
    sticker = document.createElement("span");
    sticker.className = "project-new-sticker";
    sticker.textContent = "NEW";
    panel.append(sticker);
  }

  const linkRect = newProjectLink.getBoundingClientRect();
  const listRect = projectList.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const stickerHideOffset = 3;
  const isVisible = linkRect.top >= listRect.top - stickerHideOffset && linkRect.top < listRect.bottom;

  sticker.classList.toggle("is-hidden", !isVisible);
  panel.style.setProperty("--project-new-sticker-top", `${Math.round(linkRect.top - panelRect.top - 25)}px`);
  panel.style.setProperty("--project-new-sticker-right", `${Math.round(panelRect.right - linkRect.right - 8)}px`);
}

function initializeNewProjectSticker(panel, projectList) {
  if (!projectList) {
    return;
  }

  const updateSticker = () => updateNewProjectSticker(panel, projectList);

  projectList.addEventListener("scroll", updateSticker, { passive: true });
  window.addEventListener("resize", updateSticker);
  updateSticker();
  window.requestAnimationFrame(updateSticker);
}

function initializeProjectPanels() {
  projectPanels.forEach((panel) => {
    const card = panel.closest(".activity-card");
    const preview = card?.querySelector("[data-project-preview]");
    const videoStatsContainer = card?.querySelector("[data-project-video-stats]");
    const projectList = panel.querySelector(".project-list");
    const links = [...panel.querySelectorAll(".project-link")];
    const defaultLink = links.find((link) => link.getAttribute("aria-current") === "true") || links[0];
    const visibleProjects = Number(panel.dataset.visibleProjects) || 5;
    let resetLink = defaultLink;

    panel.style.setProperty("--visible-projects", visibleProjects);
    initializeProjectScrollbar(panel, projectList);
    initializeNewProjectSticker(panel, projectList);

    function setActiveLink(link) {
      if (!link) {
        updateYouTubeVideoStats(videoStatsContainer, null);
        return;
      }

      if (!link.classList.contains("is-active")) {
        links.forEach((projectLink) => {
          projectLink.classList.toggle("is-active", projectLink === link);
        });
      }
      switchPreview(preview, link);
      updateYouTubeVideoStats(videoStatsContainer, link);
    }

    function activateProjectFromEvent(event) {
      const link = event.target.closest(".project-link");

      if (link && projectList.contains(link)) {
        setActiveLink(link);
      }
    }

    projectList?.addEventListener("mouseover", activateProjectFromEvent);
    projectList?.addEventListener("pointerover", activateProjectFromEvent);
    projectList?.addEventListener("mousemove", activateProjectFromEvent);
    projectList?.addEventListener("focusin", activateProjectFromEvent);
    projectList?.addEventListener("click", (event) => {
      const externalLink = event.target.closest(".project-open-link");

      if (externalLink) {
        return;
      }

      const link = event.target.closest(".project-link");

      if (link && projectList.contains(link) && projectSelectionMedia.matches) {
        event.preventDefault();
        setActiveLink(link);
      }
    });

    panel.addEventListener("mouseleave", () => {
      setActiveLink(resetLink);
    });

    panel.addEventListener("focusout", () => {
      window.setTimeout(() => {
        if (!panel.contains(document.activeElement)) {
          setActiveLink(resetLink);
        }
      }, 0);
    });

    links.forEach((link) => {
      preloadPreviewImage(link.dataset.image);
    });

    setActiveLink(resetLink);
  });
}

function initializeSocialHints() {
  const socialLinksContainer = document.querySelector(".social-links");

  socialHintLinks.forEach((link) => {
    link.addEventListener("mouseenter", () => {
      setSocialHint(link.dataset.socialHint);
    });

    link.addEventListener("focus", () => {
      setSocialHint(link.dataset.socialHint);
    });

    link.addEventListener("blur", () => {
      setSocialHint("");
    });
  });

  socialLinksContainer?.addEventListener("pointerover", (event) => {
    const link = event.target.closest("[data-social-hint]");

    if (link && socialLinksContainer.contains(link)) {
      setSocialHint(link.dataset.socialHint);
    }
  });

  socialLinksContainer?.addEventListener("mouseover", (event) => {
    const link = event.target.closest("[data-social-hint]");

    if (link && socialLinksContainer.contains(link)) {
      setSocialHint(link.dataset.socialHint);
    }
  });

  socialLinksContainer?.addEventListener("mouseleave", () => {
    setSocialHint("");
  });

  const clearSocialHintOnMediaChange = () => {
    setSocialHint("");
  };

  if (typeof socialHintMedia.addEventListener === "function") {
    socialHintMedia.addEventListener("change", clearSocialHintOnMediaChange);
  } else {
    socialHintMedia.addListener?.(clearSocialHintOnMediaChange);
  }
}

async function initializePortfolio() {
  await projectStore.ready;
  renderProjectLists();
  markNewestProjectsAsDefault();
  translatePage(currentLanguage);
  initializePortfolioViews();
  initializeProjectPanels();
  initializeSocialHints();
  updateYouTubeViewCounts();
}

initializePortfolio();

languageToggle?.addEventListener("click", () => {
  translatePage(currentLanguage === "fr" ? "en" : "fr");
});

window.addEventListener("load", () => {
  window.setTimeout(() => {
    body.classList.remove("is-loading");

    if (typeTarget) {
      typeText(typeTarget, typeTarget.dataset.text || typeTarget.textContent.trim());
    }
  }, 520);
});
