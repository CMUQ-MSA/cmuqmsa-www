#!/usr/bin/env python3
"""Pull the public CMU-Q campus calendar into data/events.json."""

from __future__ import annotations

import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ICS_URL = "https://scottyconnect.qatar.cmu.edu/ical/cmu/ical_cmu.ics"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "events.json"


def unfold(text: str) -> str:
    return re.sub(r"\r?\n[ \t]", "", text)


def unescape(value: str) -> str:
    return (
        value.replace("\\n", "\n")
        .replace("\\,", ",")
        .replace("\\;", ";")
        .replace("\\\\", "\\")
    )


def ics_time(value: str) -> str:
    value = value.strip()
    if value.endswith("Z") and "T" in value:
        return (
            datetime.strptime(value, "%Y%m%dT%H%M%SZ")
            .replace(tzinfo=timezone.utc)
            .strftime("%Y-%m-%dT%H:%M:%SZ")
        )
    return value


def parse_ics(text: str) -> list[dict]:
    text = unfold(text.replace("\r\n", "\n"))
    events = []
    for block in text.split("BEGIN:VEVENT")[1:]:
        block = block.split("END:VEVENT", 1)[0]
        props: dict[str, str] = {}
        cats: dict[str, str] = {}
        for line in block.split("\n"):
            if ":" not in line:
                continue
            key, raw = line.split(":", 1)
            name, *params = key.split(";")
            paramap = {}
            for param in params:
                if "=" in param:
                    pk, pv = param.split("=", 1)
                    paramap[pk] = pv
            value = unescape(raw)
            if name == "CATEGORIES":
                cats[paramap.get("X-CG-CATEGORY", "category")] = value
            else:
                props[name] = value
                if name == "ORGANIZER":
                    props["ORGANIZER_CN"] = paramap.get("CN", "").strip('"')
                    props["ORGANIZER_URL"] = value
        events.append(
            {
                "uid": props.get("UID", ""),
                "title": props.get("SUMMARY", "").strip(),
                "start": ics_time(props.get("DTSTART", "")),
                "end": ics_time(props.get("DTEND", "")),
                "location": props.get("LOCATION", "").strip(),
                "description": props.get("DESCRIPTION", "").strip(),
                "url": props.get("URL", "").strip(),
                "organizer": props.get("ORGANIZER_CN", ""),
                "organizer_url": props.get("ORGANIZER_URL", ""),
                "club": cats.get("club_acronym", ""),
                "type": cats.get("event_type", ""),
                "created": ics_time(props.get("CREATED", "")),
                "last_modified": ics_time(props.get("LAST-MODIFIED", "")),
            }
        )
    events.sort(key=lambda event: event["start"])
    return events


def main() -> None:
    request = urllib.request.Request(ICS_URL, headers={"User-Agent": "cmuqmsa-www/1"})
    with urllib.request.urlopen(request, timeout=20) as response:
        raw = response.read().decode("utf-8")
    payload = {
        "source": ICS_URL,
        "fetched_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "events": parse_ics(raw),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {OUT} ({len(payload['events'])} events)")


if __name__ == "__main__":
    main()
