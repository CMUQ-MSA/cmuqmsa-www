# Ummah & World Crisis Brief editorial policy

The brief is a humanitarian information project. It does not speak for affected
communities, provide breaking-news coverage, collect donations, or endorse a
party to a conflict. Every public issue requires a writer and a second MSA
reviewer.

## Weekly publishing workflow

1. Select a small number of crises based on humanitarian severity and relevance,
   not social-media attention alone.
2. Draft concise summaries that distinguish verified facts, estimates, and
   unresolved claims. Avoid graphic imagery, advocacy slogans, and collective
   blame.
3. Use at least two substantive sources per crisis: at least one primary
   humanitarian source and one reputable independent newsroom or verification
   source. Record publication dates only when the source provides them; always
   record the date accessed.
4. Write the `latest_update` snippet from the newest verified source. Date it
   with that source's publication date; do not describe an undated or unverified
   claim as recent.
5. Add social evidence only after completing the social-source checks below.
   Every published issue should include at least one Instagram post and one X
   post when credible, relevant material is available. Reddit is optional and
   should never be included simply for platform variety.
6. Review every donation destination using the checklist below. Show no more
   than three choices for a crisis.
7. Run `python3 scripts/validate-brief.py` and preview the issue on mobile and
   desktop.
8. A second MSA editor checks every summary against its sources and opens every
   external link. The reviewer sets `reviewed_at` and changes `status` from
   `editorial-review` to `published` only after approval.
9. Obtain any required MSA leadership or CMU-Q Student Affairs approval before
   merging the issue into the public site.

## Social-evidence checklist

- Prefer official humanitarian and newsroom accounts. Search Al Jazeera English,
  Al Jazeera Palestine, and Gulf News when their reporting is relevant; verify a
  named anchor or correspondent's current affiliation through an outlet profile
  or recent byline before listing them.
- Link to the original Instagram, X, or Reddit post. Do not download, screenshot,
  or republish its media without permission.
- Record the publisher, author or responsible newsroom, handle, role, post date,
  access date, evidence type, and a neutral editor-written summary.
- Social evidence supplements the report's substantive sources. Eyewitness,
  visual-documentation, and community posts must cite at least one corroborating
  URL already present in the crisis's source list.
- Open the full post and review its surrounding context. Check for recycled or
  altered media, misleading captions, impersonation, and material updates or
  corrections.
- Add a concise content warning when the linked original contains distressing
  imagery. Do not use graphic imagery as the website card preview.
- If a post becomes private, deleted, materially edited, or impossible to
  authenticate, remove or replace it and record a correction when applicable.
- Keep quotations short and necessary. Prefer paraphrasing the relevant evidence
  in the site's own neutral language.

## Donation-link checklist

An organization may be listed only when the reviewer can answer yes to every
applicable item:

- The destination uses HTTPS and belongs to the organization's official domain.
- The organization is a registered charity, nonprofit, Red Cross/Red Crescent
  society, or intergovernmental humanitarian organization.
- Public governance, annual reporting, or financial information is available.
- The organization documents relevant operations or implementing partners in
  the affected area.
- The appeal explains the intended use of funds or clearly states that gifts are
  unrestricted.
- A general project selector is labeled as such; do not describe it as a
  crisis-specific appeal or imply that a donor's money is automatically directed
  to a particular country.
- The page does not ask donors to transfer money to an individual, personal
  wallet, or unverifiable intermediary.
- The link, purpose, and `verified_at` date are recorded in the issue data.
- A second editor has reviewed the listing and any institution-specific policy
  concerns.

Listing an organization is informational and is not a guarantee by CMU-Q MSA or
Carnegie Mellon University. The site must always send visitors to the external
organization and must never collect payment details.

## Corrections and stale issues

- Never silently change a material factual claim in a published edition. Add a
  dated entry to `corrections`, update `reviewed_at`, and have a second editor
  approve the change.
- Remove or replace a donation link immediately if its ownership, security, or
  campaign purpose cannot be reconfirmed.
- Student suggestions sent to `msa@andrew.cmu.edu` enter the same review process
  as editor-sourced links and are never published automatically.
- If a new weekly edition is delayed, keep the last edition visibly dated. Do
  not change its date or imply that it is current.
