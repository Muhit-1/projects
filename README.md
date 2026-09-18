# Muhit Rahman — Portfolio Book

An Astro static site (deployed to GitHub Pages): a street scene whose doors open, then a hardcover book
that turns a page per scroll segment. All motion is CSS scroll-driven animation.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
```

## Adding / editing content

| I want to… | Edit |
|---|---|
| add a project | append an object to `src/data/projects.json` (copy an existing one) + drop images in `public/assets/projects/<slug>/` |
| change name, bio, contact, cover text, icons | `src/data/site.json` |
| add scenery (png/svg/webp) | put files in `public/assets/scene/`, list them in `site.json` → `scene.props` |
| hide the placeholder street props | `site.json` → `scene.showPlaceholderScenery: false` |

Every project automatically gets: an entry in the index page (click → jumps to it), a left page
(name, tagline, description, features, meta, links) and a right page (hero gif/picture on top,
up to 4 screenshots below; click any image to enlarge). Image paths in the JSON are relative to
`public/assets/` (e.g. `"projects/my-app/hero.gif"`). Bad JSON fails the build with a readable message.

Book layout: `cover (name)` → `about | index` → `project 1 left | right` … → `closing | back cover (contact + photo)`.
The scroll length grows by one screen per project; the intro (0–49 units) never changes.

## Deploy (GitHub Pages)

Repo Settings → Pages → Source: **GitHub Actions**. Pushing to `main` runs
`.github/workflows/deploy.yml`, which sets `SITE`/`BASE` from the repo name automatically.

## Files

```
src/data/          site.json, projects.json      ← your content
src/lib/data.ts    validation + scroll-timeline math (per-page ranges)
src/components/    Hero (scene+doors), Chrome (brand/icons/gauge), Book (all pages)
src/styles/        book.css (choreography, from the original), pages.css (page typography)
src/scripts/       main.js (gauge, jump links, lightbox, static fallback)
Portfolio Book/    the original hand-written version, untouched, for reference
```

Browsers without scroll-driven animation (Firefox for now) or with reduced motion get a static
book with PREV / NEXT buttons; index links still work there.
