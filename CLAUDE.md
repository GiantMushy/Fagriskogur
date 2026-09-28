# fagriskogur.is

Static rebuild of the Fagriskógur Lodge website, which runs on WordPress (Uncode theme) at 1984 Hosting.
Built with Astro and deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

## Layout

- `src/pages/index.astro` – the homepage. Its copy is written straight into the page.
- `src/pages/rooms/[slug].astro` – the 11 room pages (`/rooms/<slug>/`), generated from `src/data/rooms.json`.
  Each has a hero, text sections, a facts row, photo rows (`PhotoRows.astro`) and a full-screen viewer (`Lightbox.astro`).
  The old WordPress addresses (`/portfolio/<old-slug>/`) redirect to them; the map is in `astro.config.mjs`.
- `src/data/rooms.json` – hand-edited room content. The order is the site order: bedrooms, lodge spaces, then the staff building.
- `src/assets/uploads/` – images copied from `wp-content/uploads/` (same paths). Look them up with `upload('2024/12/x.jpg')`.
- `src/lib/site.ts` – room data, `href()` for base-aware links, and image lookup.
- `src/scripts/parallax.ts` – Rellax-style scroll drift for `data-parallax` elements (homepage collages and attraction cards).
- `photos-inbox/` – drop zone for full-quality originals that will replace the WordPress uploads. Gitignored apart from its README.
- `snapshot/` – frozen HTML of the real pages on the old site. It was the reference for the first rebuild; the room pages and parts of the homepage have since been redesigned on purpose.
  Only the HTML is in git. Theme files and uploads are gitignored (licensing and size).
- `scripts/snapshot.mjs` re-downloads the snapshot. `scripts/extract-content.mjs` regenerates `rooms.json` and `src/assets/uploads/` from it.
  Both need the old site to still be online. Don't re-run extract: it writes rooms.json in the old WordPress-shaped format and would wipe the hand edits.

## Things to know

- The site is served at the domain root (https://fagriskogur.is). Internal links still go through `href()`, so a base path could be reintroduced.
- The old site is ~95% untouched Uncode demo content. Only the homepage and the `/portfolio/*` room pages were real.
  `/thorvardur/` is an unlinked test page and was not rebuilt.
- Every page sits behind a 6-digit access code (`src/lib/access.ts`, `src/components/AccessGate.astro`). The owner only wants
  invited visitors, but this is a courtesy lock, not security: the content still ships in the HTML. Pages are `noindex`.
- Email for @fagriskogur.is is hosted at 1984. The DNS cutover must leave MX/SPF alone, and the 1984 plan must not be cancelled.

## Commands

- `npm run build` then `npm run preview` – check the production build locally (http://localhost:4321/).
- `npm run dev` – dev server (slow first load, because images are processed on demand).

## Custom domain

- GitHub side (done): `site` is `https://fagriskogur.is` with no base path, and the repo's Pages custom domain is `fagriskogur.is`.
  There's no `public/CNAME`, because GitHub ignores it for Actions deploys.
- 1984 side (the owner does this in 1984.hosting → FreeDNS → DNS - Manage Domains):
  - `@`: A records 185.199.108.153, .109, .110, .111 and AAAA 2606:50c0:8000::153 … 8003::153, replacing A 185.112.145.110.
  - `www`: CNAME to `giantmushy.github.io`.
  - `*`: this wildcard was a CNAME to the apex. Change it to A 185.112.145.110, so other subdomains (mail etc.) stay on 1984 and don't point at GitHub.
  - Add TXT `_github-pages-challenge-GiantMushy` with the value from GitHub account settings → Pages.
  - Leave MX, SPF and everything else alone.
- After that: Verify the domain (account settings), use "Check again" in the repo's Pages settings, then enable Enforce HTTPS.
- To undo: set `@` back to A 185.112.145.110 and `www` back to a CNAME to fagriskogur.is. WordPress is still on 1984, untouched.
