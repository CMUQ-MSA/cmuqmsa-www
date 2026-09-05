const QATAR = "Asia/Qatar";
const MSA_CLUB = "MSA";

function isGalleryPhoto(photo) {
  return photo
    && typeof photo.src === "string"
    && /^photos\/[a-z0-9/-]+\.(avif|jpe?g|png|webp)$/i.test(photo.src)
    && typeof photo.alt === "string"
    && photo.alt.trim();
}

function buildPhotoCarousel(root, gallery) {
  const photos = Array.isArray(gallery?.photos) ? gallery.photos.filter(isGalleryPhoto) : [];
  if (!photos.length) return;

  const viewport = document.createElement("div");
  viewport.className = "carousel-viewport";

  const track = document.createElement("div");
  track.className = "carousel-track";

  const slides = photos.map((photo, index) => {
    const slide = document.createElement("figure");
    slide.className = "carousel-slide";
    slide.setAttribute("aria-hidden", index === 0 ? "false" : "true");

    const image = document.createElement("img");
    image.src = photo.src;
    image.alt = photo.alt.trim();
    image.loading = "lazy";
    image.decoding = "async";
    image.draggable = false;
    if (photo.position) image.style.objectPosition = photo.position;

    slide.append(image);
    track.append(slide);
    return slide;
  });

  viewport.append(track);
  root.replaceChildren(viewport);

  if (slides.length === 1) return;

  const label = gallery.label || "Program";
  root.classList.add("has-carousel");
  root.tabIndex = 0;
  root.setAttribute("role", "region");
  root.setAttribute("aria-roledescription", "carousel");
  root.setAttribute("aria-label", `${label} photos`);

  const controls = document.createElement("div");
  controls.className = "carousel-controls";
  const previous = appendTextElement(controls, "button", "carousel-button", "←");
  previous.type = "button";
  previous.setAttribute("aria-label", `Previous ${label} photo`);
  const status = appendTextElement(controls, "p", "carousel-status", "");
  status.setAttribute("aria-live", "polite");
  const next = appendTextElement(controls, "button", "carousel-button", "→");
  next.type = "button";
  next.setAttribute("aria-label", `Next ${label} photo`);
  root.append(controls);

  let current = 0;
  let pointerStart = null;

  function showPhoto(nextIndex) {
    current = (nextIndex + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    slides.forEach((slide, index) => slide.setAttribute("aria-hidden", index === current ? "false" : "true"));
    status.textContent = `${current + 1} of ${slides.length}`;
  }

  previous.addEventListener("click", () => showPhoto(current - 1));
  next.addEventListener("click", () => showPhoto(current + 1));
  root.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    showPhoto(current + (event.key === "ArrowRight" ? 1 : -1));
  });
  root.addEventListener("pointerdown", (event) => { pointerStart = event.clientX; });
  root.addEventListener("pointerup", (event) => {
    if (pointerStart === null) return;
    const distance = event.clientX - pointerStart;
    pointerStart = null;
    if (Math.abs(distance) < 45) return;
    showPhoto(current + (distance < 0 ? 1 : -1));
  });
  root.addEventListener("pointercancel", () => { pointerStart = null; });

  showPhoto(0);
}

function setupPhotoGalleries() {
  const galleries = window.MSA_PHOTO_GALLERIES || {};
  document.querySelectorAll("[data-gallery]").forEach((root) => {
    const gallery = galleries[root.dataset.gallery];
    if (gallery) buildPhotoCarousel(root, gallery);
  });
}

const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: QATAR });
const monthLongFmt = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: QATAR });
const weekdayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: QATAR });
const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", timeZone: QATAR });
const timeFmt = new Intl.DateTimeFormat("en-GB", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: QATAR,
});

function unfoldIcs(text) {
  return text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}

function unescapeIcs(value) {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function icsTime(value) {
  const input = value.trim();
  const match = input.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?(Z)?$/);
  if (!match) return input;

  const [, year, month, day, hour = "00", minute = "00", second = "00", utc] = match;
  const offset = utc ? "Z" : "+03:00";
  return `${year}-${month}-${day}T${hour}:${minute}:${second}${offset}`;
}

function parseIcs(text) {
  const body = unfoldIcs(text);
  const events = [];

  for (const raw of body.split("BEGIN:VEVENT").slice(1)) {
    const block = raw.split("END:VEVENT", 1)[0];
    const props = {};
    const categories = {};

    for (const line of block.split("\n")) {
      const separator = line.indexOf(":");
      if (separator === -1) continue;

      const key = line.slice(0, separator);
      const value = unescapeIcs(line.slice(separator + 1));
      const [name, ...parts] = key.split(";");
      const params = {};

      for (const part of parts) {
        const equals = part.indexOf("=");
        if (equals !== -1) params[part.slice(0, equals)] = part.slice(equals + 1);
      }

      if (name === "CATEGORIES") {
        categories[params["X-CG-CATEGORY"] || "category"] = value;
      } else {
        props[name] = value;
        if (name === "ORGANIZER") props.ORGANIZER_CN = (params.CN || "").replace(/^"|"$/g, "");
      }
    }

    events.push({
      uid: props.UID || "",
      title: (props.SUMMARY || "").trim(),
      start: icsTime(props.DTSTART || ""),
      end: icsTime(props.DTEND || props.DTSTART || ""),
      location: (props.LOCATION || "").trim(),
      description: (props.DESCRIPTION || "").trim(),
      url: (props.URL || "").trim(),
      organizer: props.ORGANIZER_CN || "",
      club: categories.club_acronym || "",
      type: categories.event_type || "",
    });
  }

  return events.sort((a, b) => a.start.localeCompare(b.start));
}

function cleanDescription(text) {
  return text.replace(/\n---\nEvent Details:.*$/s, "").trim();
}

function isMsa(event) {
  return event.club === MSA_CLUB || /muslim students association/i.test(event.organizer || "");
}

function asDate(value) {
  return new Date(value);
}

function isValidEvent(event) {
  return event.title && !Number.isNaN(asDate(event.start).getTime()) && !Number.isNaN(asDate(event.end).getTime());
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function eventTime(event) {
  const start = asDate(event.start);
  const end = asDate(event.end);
  return `${timeFmt.format(start).toLowerCase()} – ${timeFmt.format(end).toLowerCase()}`;
}

function appendTextElement(parent, tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = content;
  parent.append(element);
  return element;
}

function renderFeaturedEvent(event) {
  const root = document.getElementById("next-event");
  root.replaceChildren();

  if (!event) {
    const empty = document.createElement("div");
    empty.className = "event-empty";
    appendTextElement(empty, "p", "live-label", "Calendar update");
    appendTextElement(empty, "h3", "", "Nothing scheduled just yet.");
    appendTextElement(empty, "p", "", "New events will appear here as soon as they are published on ScottyConnect.");
    const link = appendTextElement(empty, "a", "button button-gold", "Check ScottyConnect");
    link.href = "https://scottyconnect.qatar.cmu.edu/feeds?type=club&type_id=35465&tab=about";
    root.append(empty);
    return;
  }

  const start = asDate(event.start);
  const top = document.createElement("div");
  top.className = "next-event-top";
  appendTextElement(top, "p", "live-label", "Next event");

  const dateBlock = document.createElement("time");
  dateBlock.className = "event-date-block";
  dateBlock.dateTime = event.start;
  appendTextElement(dateBlock, "strong", "", dayFmt.format(start));
  appendTextElement(dateBlock, "span", "", `${monthLongFmt.format(start)}\n${weekdayFmt.format(start)}`);
  top.append(dateBlock);

  const body = document.createElement("div");
  body.className = "next-event-body";
  appendTextElement(body, "h3", "", event.title);

  const meta = document.createElement("p");
  meta.className = "event-meta";
  appendTextElement(meta, "span", "", eventTime(event));
  appendTextElement(meta, "span", "", event.location || "CMU-Q");
  body.append(meta);

  const description = cleanDescription(event.description || "");
  if (description) appendTextElement(body, "p", "event-description", description);

  const href = safeUrl(event.url);
  if (href) {
    const link = appendTextElement(body, "a", "button button-gold event-button", "View event and RSVP");
    link.href = href;
  }

  root.append(top, body);
}

function renderEventList(events) {
  const root = document.getElementById("event-list");
  root.replaceChildren();

  if (!events.length) {
    const item = document.createElement("li");
    item.className = "empty-list";
    appendTextElement(item, "p", "", "More events will be added soon.");
    root.append(item);
    return;
  }

  for (const event of events.slice(0, 4)) {
    const item = document.createElement("li");
    const start = asDate(event.start);
    const date = document.createElement("time");
    date.dateTime = event.start;
    date.append(document.createTextNode(dayFmt.format(start)));
    appendTextElement(date, "span", "", monthFmt.format(start));

    const details = document.createElement("div");
    appendTextElement(details, "h3", "", event.title);
    appendTextElement(details, "p", "", `${eventTime(event)}\n${event.location || "CMU-Q"}`);
    item.append(date, details);

    const href = safeUrl(event.url);
    if (href) {
      const link = appendTextElement(item, "a", "", "View");
      link.href = href;
      link.setAttribute("aria-label", `View ${event.title} on ScottyConnect`);
    }

    root.append(item);
  }
}

function renderEvents(events) {
  const additionalEvents = events.slice(1);
  const moreEvents = document.getElementById("more-events");
  const layout = document.getElementById("events-layout");

  moreEvents.hidden = additionalEvents.length === 0;
  layout.classList.toggle("single-event", additionalEvents.length === 0);
  renderFeaturedEvent(events[0] || null);
  renderEventList(additionalEvents);
}

async function loadEvents() {
  try {
    const live = await fetch("/calendar.ics", { cache: "no-store" });
    if (live.ok) {
      const text = await live.text();
      if (text.includes("BEGIN:VCALENDAR")) return parseIcs(text);
    }
  } catch {
    // The checked-in snapshot keeps local development and brief outages useful.
  }

  const snapshot = await fetch("data/events.json");
  if (!snapshot.ok) throw new Error("Calendar snapshot is unavailable");
  const data = await snapshot.json();
  return data.events || [];
}

function renderHijriDate() {
  const now = new Date();
  const arabic = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: QATAR,
  }).format(now);
  const english = new Intl.DateTimeFormat("en-GB-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: QATAR,
  }).format(now);

  document.getElementById("hijri-arabic").textContent = arabic;
  document.getElementById("hijri-english").textContent = `${english}, Hijri calendar`;
}

document.addEventListener("DOMContentLoaded", async () => {
  setupPhotoGalleries();
  renderHijriDate();

  try {
    const now = Date.now();
    const upcoming = (await loadEvents())
      .filter(isMsa)
      .filter(isValidEvent)
      .filter((event) => asDate(event.end).getTime() >= now);

    renderEvents(upcoming);
  } catch (error) {
    renderEvents([]);
    console.error(error);
  }
});
