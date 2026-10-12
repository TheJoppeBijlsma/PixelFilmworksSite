# Pixel Filmworks content workflow

The site is intentionally kept compatible with GitHub Pages: no server, database or paid hosting is required.

## Publish a new project

For a new project you normally only need to do three things:

1. Upload the visual assets to `Assets/` (thumbnail, background/banner and optionally a transparent logo).
2. Add one object to `data/projects.js`.
3. Point `detailUrl` to the generic project page: `/project/?id=YOUR-ID`.

The Projects page, Home page, More to Watch recommendations and custom watch player can all read that same catalog entry.

## Recommended catalog fields

```js
{
  id: "my-new-film",
  title: "My New Film",
  type: "shortfilm",
  genre: "Short film",
  year: 2026,
  durationLabel: "12m",
  tags: ["live-action", "shortfilm", "drama"],
  description: "Short description shown on the project page.",
  detailUrl: "/project/?id=my-new-film",
  thumbnail: "/Assets/MovieBoxes/my-new-film.jpg",
  background: "/Assets/FilmPageBackgrounds/my-new-film.jpg",
  logo: "/Assets/FilmLogos/my-new-film.png",
  youtubeId: "YOUTUBE_VIDEO_ID",
  trailerUrl: "/projects/trailers/my-new-film/",
  featured: true,
  publishedOrder: 11
}
```

`logo`, `trailerUrl`, `genre`, `durationLabel` and `description` are optional. If there is no logo, the generic page displays the title as typography instead.

## What updates automatically

- The newest projects shown on Home.
- The Recently Added row on Projects.
- Continue Watching on Projects when a visitor has unfinished viewing progress on that device.
- The PLAY / CONTINUE / RESTART state on project pages.
- Remaining watch time after the player has learned the video's duration.
- More to Watch recommendations based on series, type and tags.
- The `/watch/` player chooses the correct hosted video from the project ID.

## Video hosting

YouTube remains the underlying video host so bandwidth does not come from GitHub Pages. The `/watch/` page uses a Pixel Filmworks control layer through the YouTube IFrame API. This gives the site its own controls and watch-progress behavior while keeping hosting free.

Do not put API tokens, GitHub personal access tokens or other secrets in this repository or in browser JavaScript. GitHub Pages is public static hosting, so anything shipped to the browser must be treated as public.

## Existing projects

Existing project URLs can remain as they are. New projects can use the generic `/project/?id=...` page, which removes the need to duplicate a full HTML page for every release.
