#!/usr/bin/env python3
"""Validate the crisis brief manifest, editions, sources, and aid links."""

from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "data" / "brief" / "index.json"
ISSUES_ROOT = (ROOT / "data" / "brief" / "issues").resolve()
REQUIRED_SECTIONS = ("ummah", "world")
SOCIAL_DOMAINS = {
    "instagram": {"instagram.com", "www.instagram.com"},
    "x": {"x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"},
    "reddit": {"reddit.com", "www.reddit.com", "old.reddit.com"},
}
EVIDENCE_TYPES = {
    "official-newsroom",
    "journalist-report",
    "humanitarian-update",
    "eyewitness-account",
    "visual-documentation",
    "community-discussion",
}
CORROBORATION_REQUIRED = {"eyewitness-account", "visual-documentation", "community-discussion"}


def read_json(path: Path, errors: list[str]) -> dict | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        try:
            label = path.relative_to(ROOT)
        except ValueError:
            label = path
        errors.append(f"{label}: {exc}")
        return None


def require_text(record: dict, field: str, context: str, errors: list[str]) -> str:
    value = record.get(field)
    if not isinstance(value, str) or not value.strip():
        errors.append(f"{context}: {field} must be non-empty text")
        return ""
    return value.strip()


def require_date(value: object, field: str, context: str, errors: list[str], *, nullable: bool = False) -> None:
    if nullable and value is None:
        return
    if not isinstance(value, str):
        errors.append(f"{context}: {field} must be an ISO date")
        return
    try:
        date.fromisoformat(value)
    except ValueError:
        errors.append(f"{context}: {field} must be an ISO date")


def require_https(value: object, field: str, context: str, errors: list[str]) -> None:
    if not isinstance(value, str):
        errors.append(f"{context}: {field} must be an HTTPS URL")
        return
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.netloc:
        errors.append(f"{context}: {field} must be an HTTPS URL")


def validate_source(source: object, context: str, errors: list[str]) -> None:
    if not isinstance(source, dict):
        errors.append(f"{context}: source must be an object")
        return
    require_text(source, "publisher", context, errors)
    require_text(source, "title", context, errors)
    require_https(source.get("url"), "url", context, errors)
    require_date(source.get("published_at"), "published_at", context, errors, nullable=True)
    require_date(source.get("accessed_at"), "accessed_at", context, errors)


def validate_social_evidence(
    item: object,
    context: str,
    source_urls: set[str],
    errors: list[str],
) -> str:
    if not isinstance(item, dict):
        errors.append(f"{context}: social evidence must be an object")
        return ""

    platform = require_text(item, "platform", context, errors)
    for field in ("publisher", "author", "handle", "author_role", "summary"):
        require_text(item, field, context, errors)
    require_date(item.get("posted_at"), "posted_at", context, errors)
    require_date(item.get("accessed_at"), "accessed_at", context, errors)

    url = item.get("url")
    require_https(url, "url", context, errors)
    if platform not in SOCIAL_DOMAINS:
        errors.append(f"{context}: platform must be instagram, x, or reddit")
    elif isinstance(url, str) and urlparse(url).netloc.lower() not in SOCIAL_DOMAINS[platform]:
        errors.append(f"{context}: url domain does not match platform {platform}")

    evidence_type = require_text(item, "evidence_type", context, errors)
    if evidence_type not in EVIDENCE_TYPES:
        errors.append(f"{context}: unsupported evidence_type {evidence_type!r}")

    corroborated_by = item.get("corroborated_by", [])
    if not isinstance(corroborated_by, list):
        errors.append(f"{context}: corroborated_by must be a list")
        corroborated_by = []
    for index, corroborating_url in enumerate(corroborated_by, start=1):
        require_https(corroborating_url, f"corroborated_by item {index}", context, errors)
        if isinstance(corroborating_url, str) and corroborating_url not in source_urls:
            errors.append(f"{context}: corroborating URL must also appear in this crisis's sources")
    if evidence_type in CORROBORATION_REQUIRED and not corroborated_by:
        errors.append(f"{context}: {evidence_type} requires at least one corroborating source")

    content_warning = item.get("content_warning")
    if content_warning is not None and (not isinstance(content_warning, str) or not content_warning.strip()):
        errors.append(f"{context}: content_warning must be non-empty text when provided")
    return platform


def validate_organization(organization: object, context: str, errors: list[str]) -> None:
    if not isinstance(organization, dict):
        errors.append(f"{context}: donation organization must be an object")
        return
    require_text(organization, "name", context, errors)
    require_text(organization, "purpose", context, errors)
    for field in ("button_label", "campaign_scope", "review_note"):
        require_text(organization, field, context, errors)
    require_https(organization.get("url"), "url", context, errors)
    require_date(organization.get("verified_at"), "verified_at", context, errors)


def validate_crisis(crisis: object, context: str, social_platforms: set[str], errors: list[str]) -> str:
    if not isinstance(crisis, dict):
        errors.append(f"{context}: crisis must be an object")
        return ""

    crisis_id = require_text(crisis, "id", context, errors)
    for field in ("title", "region", "status", "summary", "why_it_matters"):
        require_text(crisis, field, context, errors)

    latest_update = crisis.get("latest_update")
    if not isinstance(latest_update, dict):
        errors.append(f"{context}: latest_update must be an object")
    else:
        require_date(latest_update.get("published_at"), "published_at", f"{context} latest_update", errors)
        require_text(latest_update, "snippet", f"{context} latest_update", errors)

    sources = crisis.get("sources")
    if not isinstance(sources, list) or len(sources) < 2:
        errors.append(f"{context}: at least two sources are required")
    else:
        for index, source in enumerate(sources, start=1):
            validate_source(source, f"{context} source {index}", errors)

    source_urls = {
        source.get("url")
        for source in sources or []
        if isinstance(source, dict) and isinstance(source.get("url"), str)
    }
    evidence = crisis.get("social_evidence", [])
    if not isinstance(evidence, list):
        errors.append(f"{context}: social_evidence must be a list")
    else:
        for index, item in enumerate(evidence, start=1):
            platform = validate_social_evidence(item, f"{context} social evidence {index}", source_urls, errors)
            if platform:
                social_platforms.add(platform)

    organizations = crisis.get("donation_organizations")
    if not isinstance(organizations, list) or not organizations:
        errors.append(f"{context}: at least one donation organization is required")
    else:
        if len(organizations) > 3:
            errors.append(f"{context}: no more than three donation organizations are allowed")
        for index, organization in enumerate(organizations, start=1):
            validate_organization(organization, f"{context} donation {index}", errors)

    return crisis_id


def validate_issue(issue: dict, entry: dict, context: str, errors: list[str]) -> None:
    if issue.get("id") != entry.get("id"):
        errors.append(f"{context}: issue id does not match the manifest")
    if issue.get("issue_number") != entry.get("issue_number"):
        errors.append(f"{context}: issue number does not match the manifest")
    if issue.get("published_at") != entry.get("published_at"):
        errors.append(f"{context}: publication date does not match the manifest")

    require_date(issue.get("published_at"), "published_at", context, errors)
    require_date(issue.get("reviewed_at"), "reviewed_at", context, errors, nullable=True)
    status = require_text(issue, "status", context, errors)
    if status not in {"editorial-review", "published"}:
        errors.append(f"{context}: status must be editorial-review or published")
    if status == "published" and issue.get("reviewed_at") is None:
        errors.append(f"{context}: published issues require reviewed_at")

    for field in ("headline", "introduction"):
        require_text(issue, field, context, errors)
    editors = issue.get("editors")
    if not isinstance(editors, list) or not editors or not all(isinstance(editor, str) and editor.strip() for editor in editors):
        errors.append(f"{context}: editors must contain at least one name")

    sections = issue.get("sections")
    if not isinstance(sections, dict):
        errors.append(f"{context}: sections must be an object")
        return

    crisis_ids: set[str] = set()
    social_platforms: set[str] = set()
    for section_name in REQUIRED_SECTIONS:
        section = sections.get(section_name)
        section_context = f"{context} section {section_name}"
        if not isinstance(section, dict):
            errors.append(f"{section_context}: required section is missing")
            continue
        require_text(section, "title", section_context, errors)
        require_text(section, "description", section_context, errors)
        items = section.get("items")
        if not isinstance(items, list):
            errors.append(f"{section_context}: items must be a list")
            continue
        for index, crisis in enumerate(items, start=1):
            crisis_id = validate_crisis(crisis, f"{section_context} item {index}", social_platforms, errors)
            if crisis_id in crisis_ids:
                errors.append(f"{context}: duplicate crisis id {crisis_id!r}")
            crisis_ids.add(crisis_id)

    if status == "published":
        missing_platforms = {"instagram", "x"} - social_platforms
        if missing_platforms:
            errors.append(
                f"{context}: published issues require social evidence from "
                + " and ".join(sorted(missing_platforms))
            )


def main() -> int:
    errors: list[str] = []
    manifest = read_json(MANIFEST_PATH, errors)
    if manifest is None:
        print("\n".join(f"ERROR: {error}" for error in errors), file=sys.stderr)
        return 1

    current_issue = require_text(manifest, "current_issue", "manifest", errors)
    issues = manifest.get("issues")
    if not isinstance(issues, list) or not issues:
        errors.append("manifest: issues must contain at least one edition")
        issues = []

    ids: set[str] = set()
    numbers: set[int] = set()
    for index, entry in enumerate(issues, start=1):
        context = f"manifest issue {index}"
        if not isinstance(entry, dict):
            errors.append(f"{context}: entry must be an object")
            continue

        issue_id = require_text(entry, "id", context, errors)
        issue_number = entry.get("issue_number")
        if not isinstance(issue_number, int) or issue_number < 1:
            errors.append(f"{context}: issue_number must be a positive integer")
        require_date(entry.get("published_at"), "published_at", context, errors)

        if issue_id in ids:
            errors.append(f"{context}: duplicate id {issue_id!r}")
        ids.add(issue_id)
        if isinstance(issue_number, int) and issue_number in numbers:
            errors.append(f"{context}: duplicate issue number {issue_number}")
        if isinstance(issue_number, int):
            numbers.add(issue_number)

        file_value = require_text(entry, "file", context, errors)
        issue_path = (ROOT / "brief" / file_value).resolve()
        if issue_path.parent != ISSUES_ROOT:
            errors.append(f"{context}: file must resolve inside data/brief/issues")
            continue
        issue = read_json(issue_path, errors)
        if issue is not None:
            validate_issue(issue, entry, str(issue_path.relative_to(ROOT)), errors)

    if current_issue and current_issue not in ids:
        errors.append("manifest: current_issue does not reference an archive entry")

    if errors:
        print("\n".join(f"ERROR: {error}" for error in errors), file=sys.stderr)
        return 1

    print(f"Brief archive is valid: {len(issues)} issue(s), current issue {current_issue}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
