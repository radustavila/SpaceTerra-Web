# SpaceTerra website

Static marketing site for **SpaceTerra: Star Map & Earth**, the Android app
(`com.radustavila.spaceterra`, source in the `Nasa_Explorer` repo). Served by GitHub Pages from
`main` (root) at <https://radustavila.github.io/SpaceTerra-Web/>. No build step, no dependencies.

Same structure as the Xpiry site (`Xpiry-Web`): one stylesheet, one script, hand-written pages.

| Path              | File                       | Purpose                                         |
|-------------------|----------------------------|-------------------------------------------------|
| `/`               | `index.html`               | Home — features, explore, how it works, privacy, data sources, FAQ |
| `/privacy/`       | `privacy/index.html`       | Privacy Policy (Play Console privacy policy URL) |
| `/terms/`         | `terms/index.html`         | Terms of Service                                |
| `/delete-data/`   | `delete-data/index.html`   | How to delete what the app keeps               |
| `/about/`         | `about/index.html`         | Who builds SpaceTerra                           |
| `/release-notes/` | `release-notes/index.html` | What changed in each version                    |
| (any missing path)| `404.html`                 | Redirects to the home page with a notice        |

Assets: `assets/css/styles.css`, `assets/js/site.js` (theme toggle, mobile nav, screenshot
carousel, scroll reveal, not-found notice — progressive enhancement only), `assets/img/*`.

## Where the content comes from

The app repo is the source of truth. When it changes, bring the site in step:

| Site                      | App repo (`Nasa_Explorer`)                                  |
|---------------------------|-------------------------------------------------------------|
| `privacy/index.html`      | `docs/privacy-policy.md`                                    |
| `terms/index.html`        | `docs/terms-of-service.md`                                  |
| `release-notes/index.html`| `app/src/main/play/release-notes/en-US/default.txt`, per release |
| Home page copy            | `docs/store/listing-en.md`                                  |
| `assets/img/screenshots/` | `docs/store/screenshots/phone/*.png`, resized to 640 wide WebP |
| `assets/img/*icon*`, favicons | `docs/store/icon/play_store_512.png`                    |

Screenshots and icons were made with ImageMagick and `cwebp`:

```bash
magick in.png -resize 640x tmp.png && cwebp -q 80 tmp.png -o assets/img/screenshots/name.webp
```

## Paths: relative everywhere

A GitHub Pages project site lives under `/SpaceTerra-Web/`, not at the domain root, so every
page links to assets and other pages with **relative** URLs (`assets/…` on the home page,
`../assets/…` one level down). That also means a move to a custom domain needs no page edits.

The one exception is `404.html`: GitHub Pages serves it for a missing path at any depth, so it
uses `<base href="/SpaceTerra-Web/">` and a `SITE_ROOT` constant. On a custom domain, set both
to `/`, add a `CNAME` file, and update the absolute URLs in `<link rel="canonical">`, `og:*`
tags and `sitemap.xml`.

## Things that live elsewhere

- **`app-ads.txt`** must sit at the root of the developer website in Play Console
  (`https://radustavila.github.io`), so the copy AdMob reads is the one in the
  `radustavila.github.io` repo. The copy here only matters if this site gets its own domain.
- **`robots.txt`** is only read at a host's root, so there is none here; submit `sitemap.xml`
  in Search Console instead.
- **Response headers** (CSP, caching) cannot be set on GitHub Pages, so there is no `_headers`.

## Local preview

```bash
python3 -m http.server 8080
# then open http://localhost:8080/
```

Unknown routes can only be tested on GitHub Pages; the notice itself can be checked locally at
`http://localhost:8080/?notfound=/blabla`.

## After editing CSS or JS

Run `tools/stamp-assets.sh`. It appends a content hash (`?v=…`) to every reference so browsers
holding the old file fetch the new one.
