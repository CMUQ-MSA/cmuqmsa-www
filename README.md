# CMU-Q MSA

Public landing page for the Muslim Students Association at Carnegie Mellon
University in Qatar.

Upcoming MSA events are read from the public ScottyConnect campus calendar.
The site also includes the weekly Ummah & World Crisis Brief at `/brief/`.

## Run locally

```bash
python3 -m http.server 8080
```

Or:

```bash
docker compose up --build
```

Then open [http://127.0.0.1:8080](http://127.0.0.1:8080).

## Update events

```bash
python3 scripts/refresh-events.py
```

That rewrites `data/events.json`. The page uses this snapshot when it cannot
reach a live calendar proxy (plain `http.server` has no proxy). `docker compose`
serves `/calendar.ics` from the same public feed.

## Edit the homepage

The mission, program descriptions, links, and program photos live in
`index.html`. Upcoming events are rendered by `app.js` from the live calendar
or the checked-in snapshot. Program image files live in `photos/`; use the
matching `photo-*` class in `styles.css` to tune a photo's focal position.

## Publish a crisis brief

Issues live in `data/brief/issues/` and the archive manifest lives in
`data/brief/index.json`. Copy the previous issue, assign a unique ISO date and
issue number, update the sources and donation-link review metadata, then add it
to the top of the manifest and set `current_issue`.

Every crisis entry requires at least two HTTPS sources and one to three reviewed
external donation destinations. Optional `social_evidence` entries render as
curated link cards rather than live embeds. Published issues must include at
least one Instagram and one X entry across the issue; Reddit is optional. Its
dated `latest_update` supplies the card in the issue's “Latest developments”
section. Drafts should use
`"status": "editorial-review"` and a null `reviewed_at`; only set a review date
and change the status to `published` after a second MSA editor approves the
issue.

Validate the archive before opening a pull request:

```bash
python3 scripts/validate-brief.py
```

Follow the sourcing, donation-review, approval, and correction workflow in
[`EDITORIAL.md`](EDITORIAL.md) for every edition.


## Brand

`brand/logo.png` is the white-field CMUQ MSA mark (maroon + gold). Replace that
file if the lockup changes.
