# CMU-Q MSA

Public landing page for the Muslim Students Association at Carnegie Mellon
University in Qatar.

Upcoming MSA events are read from the public ScottyConnect campus calendar.

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

## Brand

`brand/logo.png` is the white-field CMUQ MSA mark (maroon + gold). Replace that
file if the lockup changes.
