# Maple Glen Tavern — site files

Static site: upload this whole folder to any host (Netlify, Cloudflare Pages, cPanel, etc.). No build step.

```
index.html
css/styles.css
js/main.js
assets/logo.svg                 vector shamrock logo (also the favicon)
assets/video/flyover-1080.mp4   desktop hero loop (2.1 MB, no audio)
assets/video/flyover-720.mp4    phone hero loop (0.7 MB)
assets/video/flyover-720.webm   phone hero loop, WebM (0.65 MB)
assets/video/poster.jpg         first frame, shown while video loads
```

## Before launch
1. Search `index.html` for `[` to find every placeholder (story, events, reviews, kitchen hours, Instagram).
2. Confirm hours with the owner. Edit the `<tr data-open data-close>` rows in the footer table
   (they drive the live "Open now" badge) and the matching JSON-LD block in `<head>`.
3. Drop food photos into `assets/img/` and replace each `.photo-brief` figure with an `<img>`.
4. Remove `class="draft"` from the `<html>` tag to turn off placeholder highlighting.
