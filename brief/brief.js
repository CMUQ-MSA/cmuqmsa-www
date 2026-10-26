const QATAR = "Asia/Qatar";
const MANIFEST_URL = "../data/brief/index.json";
const EDITORIAL_EMAIL = "msa@andrew.cmu.edu";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: QATAR,
});

function asCalendarDate(value) {
  return new Date(`${value}T12:00:00Z`);
}

function formatDate(value) {
  return dateFmt.format(asCalendarDate(value));
}

function appendText(parent, tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value;
  parent.append(element);
  return element;
}

function externalLink(parent, className, label, href) {
  const link = appendText(parent, "a", className, label);
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}

function suggestionHref(crisis, kind) {
  const subject = `Crisis Brief ${kind} suggestion: ${crisis.title}`;
  const body = [
    `Crisis: ${crisis.title}`,
    `Suggestion type: ${kind}`,
    "URL:",
    "Platform or organization:",
    "Why this is useful and credible:",
    "Supporting source or context:",
    "",
    "Suggestions are reviewed by the MSA editorial team before publication.",
  ].join("\n");
  return `mailto:${EDITORIAL_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function renderSources(parent, sources, video) {
  const block = document.createElement("div");
  appendText(block, "h4", "", "Sources");
  const list = document.createElement("ul");
  list.className = "source-list";

  for (const source of sources) {
    const item = document.createElement("li");
    externalLink(item, "", source.publisher, source.url);
    const dates = [];
    if (source.published_at) dates.push(`Published ${formatDate(source.published_at)}`);
    dates.push(`Accessed ${formatDate(source.accessed_at)}`);
    appendText(item, "span", "", `${source.title} · ${dates.join(" · ")}`);
    list.append(item);
  }

  block.append(list);

  if (video) {
    const videoBlock = document.createElement("section");
    videoBlock.className = `source-video${video.orientation === "portrait" ? " source-video-portrait" : ""}`;
    appendText(videoBlock, "h5", "", "Watch a short video");
    const frame = document.createElement("div");
    frame.className = "source-video-frame";
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(video.video_id)}?rel=0`;
    iframe.title = `${video.title} — ${video.publisher}`;
    iframe.loading = "lazy";
    iframe.referrerPolicy = "origin";
    iframe.allow = "encrypted-media; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    frame.append(iframe);
    videoBlock.append(frame);
    const videoMeta = video.published_at
      ? `${video.publisher} · Published ${formatDate(video.published_at)}`
      : `${video.publisher} · Published date not listed`;
    appendText(videoBlock, "p", "source-video-meta", videoMeta);
    externalLink(videoBlock, "source-video-link", "Open video on YouTube ↗", video.url);
    block.append(videoBlock);
  }

  parent.append(block);
}

function renderSocialEvidence(parent, crisis) {
  const evidence = crisis.social_evidence || [];
  if (!evidence.length) return;

  const block = document.createElement("section");
  block.className = "social-evidence";
  const heading = document.createElement("div");
  heading.className = "evidence-heading";
  const headingCopy = document.createElement("div");
  appendText(headingCopy, "p", "detail-kicker", "From the field and newsroom");
  appendText(headingCopy, "h4", "", "Social evidence");
  appendText(
    headingCopy,
    "p",
    "evidence-note",
    "Selected posts add visual or first-hand context. They supplement, but never replace, the verified sources below.",
  );
  const suggest = appendText(heading, "a", "suggest-link", "Suggest a post");
  suggest.href = suggestionHref(crisis, "social source");
  heading.prepend(headingCopy);
  block.append(heading);

  const grid = document.createElement("div");
  grid.className = "evidence-grid";
  for (const item of evidence) {
    const card = document.createElement("article");
    card.className = `evidence-card evidence-${item.platform}`;

    const meta = document.createElement("div");
    meta.className = "evidence-meta";
    const platformLabel = item.platform === "instagram" ? "Instagram" : item.platform === "x" ? "X" : "Reddit";
    appendText(meta, "span", "platform-badge", platformLabel);
    appendText(meta, "span", "evidence-type", item.evidence_type.replaceAll("-", " "));
    card.append(meta);

    appendText(card, "h5", "", item.publisher);
    const identity = [item.handle, item.author_role].filter(Boolean).join(" · ");
    if (identity) appendText(card, "p", "evidence-identity", identity);
    if (item.community) appendText(card, "p", "evidence-community", `Community: ${item.community}`);
    appendText(card, "p", "evidence-summary", item.summary);
    if (item.content_warning) appendText(card, "p", "content-warning", `Content note: ${item.content_warning}`);
    appendText(card, "p", "evidence-date", `Posted ${formatDate(item.posted_at)} · Checked ${formatDate(item.accessed_at)}`);
    externalLink(card, "evidence-link", `View original on ${platformLabel} →`, item.url);
    grid.append(card);
  }

  block.append(grid);
  parent.append(block);
}

function renderAid(parent, organizations) {
  const block = document.createElement("div");
  block.className = "aid-block";
  appendText(block, "h4", "", "How you can help");
  const list = document.createElement("ul");
  list.className = "aid-list";

  for (const organization of organizations) {
    const item = document.createElement("li");
    appendText(item, "strong", "aid-name", organization.name);
    appendText(item, "span", "", organization.purpose);
    appendText(item, "span", "aid-scope", organization.campaign_scope);
    appendText(
      item,
      "span",
      "aid-review",
      `Official link checked ${formatDate(organization.verified_at)} · ${organization.review_note}`,
    );
    externalLink(item, "donate-button", `${organization.button_label} →`, organization.url);
    list.append(item);
  }

  block.append(list);
  parent.append(block);
}

function renderCrisis(crisis) {
  const card = document.createElement("article");
  card.className = "crisis-card";
  card.id = `crisis-${crisis.id}`;

  const aside = document.createElement("div");
  aside.className = "crisis-card-aside";
  appendText(aside, "p", "crisis-region", crisis.region);
  appendText(aside, "p", "crisis-status", crisis.status);

  const body = document.createElement("div");
  body.className = "crisis-card-body";
  appendText(body, "h3", "", crisis.title);
  appendText(body, "p", "crisis-summary", crisis.summary);

  const context = document.createElement("p");
  context.className = "why-it-matters";
  const label = document.createElement("strong");
  label.textContent = "Why it matters: ";
  context.append(label, document.createTextNode(crisis.why_it_matters));
  body.append(context);

  renderSocialEvidence(body, crisis);

  const details = document.createElement("div");
  details.className = "card-details";
  renderSources(details, crisis.sources, crisis.video);
  renderAid(details, crisis.donation_organizations);
  body.append(details);

  const suggest = document.createElement("p");
  suggest.className = "crisis-suggest";
  suggest.append("Know a strong source or verified aid organization? ");
  const suggestLink = appendText(suggest, "a", "", "Send it to the MSA editors");
  suggestLink.href = suggestionHref(crisis, "source or donation");
  suggest.append(". Suggestions are reviewed before publication.");
  body.append(suggest);

  card.append(aside, body);
  return card;
}

function renderLatest(issue) {
  const section = document.createElement("section");
  section.className = "latest-section";
  section.setAttribute("aria-labelledby", "latest-heading");

  const wrap = document.createElement("div");
  wrap.className = "wrap";
  const heading = document.createElement("div");
  heading.className = "latest-heading";
  const headingCopy = document.createElement("div");
  appendText(headingCopy, "p", "eyebrow", "Most recent");
  appendText(headingCopy, "h2", "", "Latest developments").id = "latest-heading";
  appendText(heading, "p", "", "The newest verified updates in this issue. Select a card to jump to the full crisis briefing, its sources, and reviewed ways to help.");
  heading.prepend(headingCopy);
  wrap.append(heading);

  const crises = Object.values(issue.sections)
    .flatMap((coverage) => coverage.items)
    .filter((crisis) => crisis.latest_update)
    .sort((a, b) => b.latest_update.published_at.localeCompare(a.latest_update.published_at));

  const grid = document.createElement("div");
  grid.className = "latest-grid";
  for (const crisis of crises) {
    const card = document.createElement("a");
    card.className = "latest-card";
    card.href = `#crisis-${crisis.id}`;
    appendText(card, "p", "latest-card-meta", `${formatDate(crisis.latest_update.published_at)} · ${crisis.region}`);
    appendText(card, "h3", "", crisis.title);
    appendText(card, "p", "latest-card-snippet", crisis.latest_update.snippet);
    appendText(card, "span", "latest-card-link", "Open the full briefing →");
    grid.append(card);
  }
  wrap.append(grid);
  section.append(wrap);
  return section;
}

function renderCoverageSection(section, sectionId) {
  const root = document.createElement("section");
  root.className = "coverage-section";
  root.id = sectionId;
  root.setAttribute("aria-labelledby", `${sectionId}-heading`);

  const wrap = document.createElement("div");
  wrap.className = "wrap";
  const heading = document.createElement("div");
  heading.className = "coverage-heading";
  appendText(heading, "h2", "", section.title).id = `${sectionId}-heading`;
  appendText(heading, "p", "", section.description);
  wrap.append(heading);

  const list = document.createElement("div");
  list.className = "crisis-list";
  if (section.items.length) {
    for (const crisis of section.items) list.append(renderCrisis(crisis));
  } else {
    appendText(list, "p", "section-empty", "No stories are scheduled for this section in this issue.");
  }
  wrap.append(list);
  root.append(wrap);
  return root;
}

function renderIssue(issue) {
  const content = document.getElementById("brief-content");
  content.replaceChildren();
  content.setAttribute("aria-busy", "false");

  const intro = document.createElement("section");
  intro.className = "issue-intro";
  const introWrap = document.createElement("div");
  introWrap.className = "wrap issue-intro-grid";
  appendText(introWrap, "div", "issue-number", String(issue.issue_number).padStart(2, "0"));
  const introCopy = document.createElement("div");
  appendText(introCopy, "p", "eyebrow", `Issue ${String(issue.issue_number).padStart(2, "0")} · ${formatDate(issue.published_at)}`);
  appendText(introCopy, "h2", "", issue.headline);
  appendText(introCopy, "p", "issue-intro-copy", issue.introduction);
  appendText(introCopy, "p", "issue-byline", `Prepared by ${issue.editors.join(" and ")}`);
  introWrap.append(introCopy);
  intro.append(introWrap);

  content.append(
    intro,
    renderLatest(issue),
    renderCoverageSection(issue.sections.ummah, "ummah"),
    renderCoverageSection(issue.sections.world, "world"),
  );

  const reviewDate = issue.reviewed_at ? `Reviewed ${formatDate(issue.reviewed_at)}` : "Awaiting MSA editorial review";
  const heroDate = document.getElementById("hero-issue-date");
  heroDate.dateTime = issue.published_at;
  heroDate.textContent = formatDate(issue.published_at);
  document.getElementById("hero-review-date").textContent = reviewDate;
  document.getElementById("selected-issue-label").textContent = `Issue ${String(issue.issue_number).padStart(2, "0")} · ${formatDate(issue.published_at)}`;
  document.getElementById("editorial-status").hidden = issue.status !== "editorial-review";
  document.title = `${issue.headline} | Ummah & World Crisis Brief`;
}

function renderError() {
  const content = document.getElementById("brief-content");
  content.replaceChildren();
  content.setAttribute("aria-busy", "false");
  const error = document.createElement("div");
  error.className = "wrap brief-error";
  appendText(error, "h2", "", "This issue could not be opened.");
  appendText(error, "p", "", "Please try again later or contact the MSA editorial team if the problem continues.");
  const link = appendText(error, "a", "button button-gold", "Return to the MSA homepage");
  link.href = "../";
  content.append(error);
}

function populateArchive(manifest, selectedId) {
  const picker = document.getElementById("issue-picker");
  picker.replaceChildren();
  for (const issue of manifest.issues) {
    const option = document.createElement("option");
    option.value = issue.id;
    option.textContent = `Issue ${String(issue.issue_number).padStart(2, "0")} · ${formatDate(issue.published_at)}`;
    option.selected = issue.id === selectedId;
    picker.append(option);
  }
  picker.disabled = false;
  picker.addEventListener("change", () => {
    const url = new URL(window.location.href);
    url.searchParams.set("issue", picker.value);
    window.location.assign(url);
  });
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

async function loadBrief() {
  const manifestResponse = await fetch(MANIFEST_URL, { cache: "no-store" });
  if (!manifestResponse.ok) throw new Error("Brief manifest unavailable");
  const manifest = await manifestResponse.json();

  const requestedId = new URLSearchParams(window.location.search).get("issue");
  const requested = manifest.issues.find((issue) => issue.id === requestedId);
  const selected = requested || manifest.issues.find((issue) => issue.id === manifest.current_issue);
  if (!selected) throw new Error("No current brief issue configured");

  populateArchive(manifest, selected.id);
  const issueResponse = await fetch(selected.file, { cache: "no-store" });
  if (!issueResponse.ok) throw new Error("Brief issue unavailable");
  renderIssue(await issueResponse.json());
}

document.addEventListener("DOMContentLoaded", async () => {
  renderHijriDate();
  try {
    await loadBrief();
  } catch (error) {
    renderError();
    console.error(error);
  }
});
