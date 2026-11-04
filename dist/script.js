document.getElementById("year").textContent = new Date().getFullYear();

const heroTitle = document.querySelector(".hero-copy h1");
const heroTitleLines = [...heroTitle.querySelectorAll(".hero-title-line")];
const mobileLayout = window.matchMedia("(max-width: 760px)");
let fittedTitleWidth;

function fitMobileHeroTitle(force = false) {
  if (!mobileLayout.matches) {
    heroTitle.style.removeProperty("font-size");
    fittedTitleWidth = undefined;
    return;
  }

  const width = heroTitle.clientWidth;
  if (!width || (!force && width === fittedTitleWidth)) return;

  // Each line has its intrinsic text width, independent of the heading box.
  const textWidth = Math.max(...heroTitleLines.map(line => line.getBoundingClientRect().width));
  const currentSize = parseFloat(window.getComputedStyle(heroTitle).fontSize);
  if (!Number.isFinite(textWidth) || textWidth <= 0 || !Number.isFinite(currentSize)) return;

  // Fit the longest line, with a small rounding margin and a size ceiling.
  const fontSize = Math.min(currentSize * ((width - 2) / textWidth), width / 10);
  heroTitle.style.fontSize = `${Math.floor(fontSize * 100) / 100}px`;
  fittedTitleWidth = width;
}

fitMobileHeroTitle();
window.addEventListener("resize", () => fitMobileHeroTitle());
window.addEventListener("pageshow", () => fitMobileHeroTitle(true));
document.fonts?.ready.then(() => fitMobileHeroTitle(true));

const episodesList = document.getElementById("episodes-list");
const rssFeedButton = document.getElementById("copy-rss-feed");
const podcastFeedUrl = "https://anchor.fm/s/116db53dc/podcast/rss";

async function copyRssFeedUrl(event) {
  event.preventDefault();

  try {
    await navigator.clipboard.writeText(podcastFeedUrl);
    rssFeedButton.classList.add("is-copied");
    rssFeedButton.setAttribute("aria-label", "RSS feed URL copied");

    window.setTimeout(() => {
      rssFeedButton.classList.remove("is-copied");
      rssFeedButton.setAttribute("aria-label", "Copy RSS feed URL");
    }, 1800);
  } catch (error) {
    console.error("Could not copy RSS feed URL:", error);
    window.prompt("Copy this RSS feed URL:", podcastFeedUrl);
  }
}

rssFeedButton.addEventListener("click", copyRssFeedUrl);

function getElementText(parent, tagName) {
  return parent.getElementsByTagName(tagName)[0]?.textContent.trim() ?? "";
}

function getDescriptionText(description) {
  const documentWithDescription = new DOMParser().parseFromString(
    description,
    "text/html",
  );
  // Сохраняем границы строк и абзацев при удалении HTML-разметки.
  documentWithDescription.body
    .querySelectorAll("br, hr, p, div, li, blockquote, h1, h2, h3, h4, h5, h6")
    .forEach((element) => {
      element.before(" ");
      element.after(" ");
    });
  return documentWithDescription.body.textContent.replace(/\s+/g, " ").trim();
}

function formatEpisodeDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function formatEpisodeDuration(duration) {
  const durationParts = duration.split(":").map(Number);
  const minutes = durationParts.length === 3 ? durationParts[1] : durationParts[0];
  const hours = durationParts.length === 3 ? durationParts[0] : 0;

  if (hours) {
    return `${hours} hr ${minutes} min`;
  }

  return `${minutes} min`;
}

function createEpisodeCard(item) {
  const title = getElementText(item, "title");
  const link = getElementText(item, "link");
  const publicationDate = getElementText(item, "pubDate");
  const duration = getElementText(item, "itunes:duration");
  const description = getDescriptionText(getElementText(item, "description"));

  const card = document.createElement("article");
  card.className = "episode-card";

  const metadata = document.createElement("p");
  metadata.className = "episode-meta";

  const date = document.createElement("a");
  date.className = "episode-date";
  date.href = link;
  date.target = "_blank";
  date.rel = "noopener noreferrer";
  date.textContent = formatEpisodeDate(publicationDate);

  const episodeDuration = document.createElement("span");
  episodeDuration.className = "episode-duration";
  episodeDuration.textContent = formatEpisodeDuration(duration);
  const durationSuffix = document.createElement("span");
  durationSuffix.className = "episode-duration-suffix";
  durationSuffix.textContent = " long";
  episodeDuration.append(durationSuffix);

  metadata.append(date, episodeDuration);

  const content = document.createElement("div");
  content.className = "episode-content";

  const heading = document.createElement("h3");
  heading.textContent = title;

  const summary = document.createElement("p");
  summary.textContent = description;

  content.append(heading, summary);
  card.append(metadata, content);

  return card;
}

function showEpisodesFallback() {
  const message = document.createElement("p");
  message.className = "episodes-status";
  message.append(
    "We couldn’t load the episode list from Spotify, where we host the podcast. This may be because Spotify is unavailable in your country...",
    document.createElement("br"),
    "You can listen on your preferred service using the buttons above, or try enabling a VPN! :)",
  );

  episodesList.replaceChildren(message);
}

async function loadEpisodes() {
  const loadingMessage = document.createElement("p");
  loadingMessage.className = "episodes-status";
  loadingMessage.textContent = "Loading episodes…";
  episodesList.setAttribute("aria-busy", "true");
  episodesList.replaceChildren(loadingMessage);

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(podcastFeedUrl, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Podcast feed returned ${response.status}`);
    }

    const feedText = await response.text();
    const feedDocument = new DOMParser().parseFromString(feedText, "application/xml");

    if (feedDocument.querySelector("parsererror")) {
      throw new Error("Podcast feed could not be parsed");
    }

    const episodes = [...feedDocument.querySelectorAll("item")].slice(0, 6);

    if (!episodes.length) {
      throw new Error("Podcast feed has no episodes");
    }

    episodesList.replaceChildren(...episodes.map(createEpisodeCard));
  } catch (error) {
    console.error("Could not load podcast episodes:", error);
    showEpisodesFallback();
  } finally {
    window.clearTimeout(timeout);
    episodesList.setAttribute("aria-busy", "false");
  }
}

loadEpisodes();
