document.getElementById("year").textContent = new Date().getFullYear();

const episodesList = document.getElementById("episodes-list");
const rssFeedButton = document.getElementById("copy-rss-feed");
const podcastFeedUrl = "https://anchor.fm/s/116db53dc/podcast/rss";
const podcastPageUrl = "https://podcasters.spotify.com/pod/show/polovinkin";

async function copyRssFeedUrl() {
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
  return documentWithDescription.body.textContent.replace(/\s+/g, " ").trim();
}

function shortenDescription(description, maximumLength = 210) {
  if (description.length <= maximumLength) {
    return description;
  }

  return `${description.slice(0, maximumLength).trimEnd().replace(/[.,;:]$/, "")}…`;
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
  const description = shortenDescription(
    getDescriptionText(getElementText(item, "description")),
  );

  const card = document.createElement("a");
  card.className = "episode-card";
  card.href = link;
  card.target = "_blank";
  card.rel = "noopener noreferrer";

  const metadata = document.createElement("p");
  metadata.className = "episode-meta";

  const date = document.createElement("span");
  date.className = "episode-date";
  date.textContent = formatEpisodeDate(publicationDate);

  const episodeDuration = document.createElement("span");
  episodeDuration.className = "episode-duration";
  episodeDuration.textContent = `${formatEpisodeDuration(duration)} long`;

  metadata.append(date, episodeDuration);

  const content = document.createElement("div");
  content.className = "episode-content";

  const heading = document.createElement("h3");
  heading.textContent = title;

  const summary = document.createElement("p");
  summary.textContent = description;

  const action = document.createElement("span");
  action.className = "episode-action";
  action.textContent = "Listen";
  action.setAttribute("aria-hidden", "true");

  content.append(heading, summary);
  card.append(metadata, content, action);

  return card;
}

function showEpisodesFallback() {
  const message = document.createElement("p");
  message.className = "episodes-status";
  message.append("Episodes are temporarily unavailable. ");

  const link = document.createElement("a");
  link.className = "episodes-fallback-link";
  link.href = podcastPageUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "View them on Spotify";

  message.append(link);
  episodesList.replaceChildren(message);
}

async function loadEpisodes() {
  try {
    const response = await fetch(podcastFeedUrl);

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
    episodesList.setAttribute("aria-busy", "false");
  }
}

loadEpisodes();
