# Events pipeline

Populate date nights and exhibitions automatically, the same way the `briefings` repo builds the daily news: a deterministic fetch, an LLM selection pass, and a deterministic apply step that commits to `main`.

## Decisions

- **Scope:** Date nights are dated music and film events only; theater is out. Exhibitions are day outings and appear while they are open, whatever their end date. Restaurants and bars are not part of the site.
- **Sources:** Open-data agendas as the backbone, plus calendars from a short list of key venues. Barcelona's cultural agenda is published as JSON on [Open Data BCN](https://opendata-ajuntament.barcelona.cat/data/en/dataset/agenda-cultural) (CC BY 4.0, no token); check its freshness and coverage first. The Generalitat mentions an open culture agenda ("Agenda Oberta") that would cover the Empordà, but its API is unconfirmed. Prefer structured data (JSON feeds, iCal, JSON-LD `Event` markup on venue pages) over scraping text.
- **Key music calendars:** Jamboree, Harlem Jazz Club, Sala Apolo, Palau de la Música, L’Auditori, El Molino and Paral·lel 62 in Barcelona; Auditori de Girona and La Mirona in Girona; Teatre Municipal and La Bòbila in Palafrugell; and the Barcelona Jazz Festival.
- **Links:** Every event must have a usable event or ticket URL in `links`. Label a ticket-selling page "Tickets" and an event page "Event page". Add the venue's site as a second link when useful. Drop candidates without a usable URL.
- **Films:** Folded into this pipeline. Fetch English Cinema Barcelona, the Filmoteca de Catalunya and Cinema Truffaut in Girona from the scheduled job. The old `vose-flix` app broke because it fetched English Cinema Barcelona from the browser through public CORS proxies; a server-side job avoids that. Reuse its OMDb/TMDB rating logic to help the selection pass.
- **Cadence:** One daily job on the mini refreshes live music, films and exhibitions together. All three use the same fetch–select–apply pipeline, judged-candidate history and publishing step; do not create a separate exhibition schedule. The fetch runs every day; the LLM only sees candidates it has not judged before, so most runs are small. Ended events are removed daily.
- **Lookahead:** Dated events (concerts, screenings) within the next four weeks.
- **Nudges:** None. The site is the only output.

## Stages

1. **Fetch (deterministic):** Pull music, film and exhibition candidates from their respective sources in the shared daily job, including specific temporary-exhibition pages from museums and galleries. Normalize them to title, venue, start and end dates, URL, category and raw description. Drop candidates already in `src/data/outings.json` or already judged (keep a judged-IDs file). Write the day's candidates to a dated raw file.
2. **Select (LLM):** One pass over new candidates with the selection criteria below. Output a schema-validated list of picks with kind, base hints, mode, a one-line "why", and optional context. The context is a short paragraph of two or three sentences about the artist and their sound, the exhibition or film, or a practical venue or ticket tip. Ground it in fetched source material, including event pages, venue descriptions and ratings; do not invent facts. Keep it shorter when sources are thin.
3. **Apply (deterministic):** Resolve venue coordinates and drive times from each base (Google Places and Routes, cached per venue; key in `~/.secrets` as `GOOGLE_MAPS_API_KEY`). Assign bases with the same rule as places: every base within a two-hour drive, otherwise the nearer one. Remove ended events, validate with the zod schema, commit and push.

## Selection criteria

- **Music:** Look for live music in Barcelona and the Costa Brava that Herb and Lynne might enjoy together, with particular attention to jazz, Brazilian music, salsa, and other Cuban and Latin dance music. Also consider soul, funk, blues, singer-songwriters, Americana, alternative and classic rock, and Spanish and Latin American song. Use Herb's Spotify playlists as a starting point for judging artists and styles, and include smaller acts and distinctive interpretations. Be selective: a genre match alone is not enough; choose performances that seem compelling as a night out for both of them.
- **Exhibitions:** Select specific temporary exhibitions in history, art, archaeology and design. Each pick needs the exhibition title, venue, opening and closing dates, a link to that exhibition, and a concrete reason it might interest Herb and Lynne. General museums and their permanent collections are sources to monitor, rather than outing recommendations. Distinctive specialist museums, such as a typewriter museum, can still be standing day outings.
- **Films:** Original-version (VOSE) screenings only. Favor well-reviewed new releases and notable repertory screenings.

## Open questions

- How do Herb and Lynne reject a pick or tune the criteria – by telling an agent, with the change recorded in this file?
