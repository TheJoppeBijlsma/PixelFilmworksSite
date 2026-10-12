# Pixel Filmworks content workflow

Pixel Filmworks stays fully compatible with GitHub Pages: there is no external database, server, paid CMS, or client-side GitHub token.

## Owner workflow

Open `https://pixelfilmworks.com/admin/` and choose one of the GitHub-backed owner actions:

- **New project** — create a film, documentary, or series entry.
- **Edit project** — update one or more fields while keeping the others unchanged.
- **Visibility** — move a project between Draft, Hidden, and Published.
- **Delete project** — remove it from the managed catalog.

GitHub is the authentication layer. The automation only processes project-admin requests created by the repository owner.

## Source of truth

`content/projects.json` is the editable source catalog. A GitHub Action rebuilds `data/projects.js` after each successful owner request.

Only projects with `status: "published"` are written to the public browser catalog. `draft` and `hidden` entries do not appear on Home, Projects, More to Watch, or the generic project page through the public catalog.

Because the repository is public, **Hidden is not confidential storage**. Someone deliberately browsing the GitHub repository/history may still see metadata or media. True private content requires private storage outside a public GitHub Pages repository.

## Adding media

The GitHub forms accept either:

- an existing repository path, such as `/Assets/MovieBoxes/my-film.jpg`, or
- an image dragged into the form, which GitHub turns into an attachment URL.

For a polished long-term library, repository asset paths are preferable because they keep the visual files together with the site. GitHub-uploaded form attachments are convenient for quick publishing.

## New project pages

New projects automatically use the generic project route:

`/project/?id=PROJECT-ID`

That means a new release does **not** need a duplicated HTML page. The generic page reads the title, description, artwork, logo, video, trailer, metadata, and recommendations from the project catalog.

Existing legacy project URLs can remain unchanged so old links keep working.

## Automatic website behavior

Published catalog changes feed the same data into:

- Home project cards.
- Recently Added and category rows on Projects.
- Continue Watching for unfinished videos on that browser/device.
- PLAY / CONTINUE / START OVER state.
- More to Watch recommendations based on type, series, tags, year, and release order.
- The `/watch/` player and its YouTube video ID.

## Video hosting

YouTube remains the underlying video host so GitHub Pages does not carry video bandwidth. The `/watch/` route adds the Pixel Filmworks interface and local watch progress over the YouTube IFrame API.

A YouTube-backed player cannot guarantee that YouTube branding or overlays never appear. The custom player masks as much of the iframe chrome as practical, but a truly white-label player requires a different video host/CDN.

## Security

Never add GitHub personal access tokens, passwords, API secrets, or other credentials to website JavaScript. Everything served by GitHub Pages is public.
