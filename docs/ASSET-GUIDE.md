# DikaOfc identity assets

This document describes the artwork behind the DikaOfc GitHub profile README: what each file is, how it was produced, and how to regenerate it. The README itself has no build step; every asset it needs is committed.

## Concept and art direction

The profile is a small digital identity lab: a near-black studio, one signature ice-blue light, engineered metallic forms, and precise technical metadata. The centerpiece is an original 3D scene with a geometric **D** monogram and an extruded **DIKAOFC** wordmark. The animated hero is pre-rendered, because GitHub Markdown cannot run JavaScript, Three.js, or WebGL.

| Token          | Value     | Use                          |
| -------------- | --------- | ---------------------------- |
| Background     | `#07090C` | Near-black canvas            |
| Secondary      | `#10151B` | Panels and depth             |
| Primary text   | `#EAF1F5` | Readable text                |
| Muted text     | `#9BA8B2` | Supporting metadata          |
| Accent         | `#8EDCF0` | Signature ice-blue light     |
| Accent shadow  | `#245B70` | Depth in rendered artwork    |

Typography: **Archivo Black** for the 3D wordmark, **JetBrains Mono** for metadata. Both fonts are licensed under the SIL Open Font License and stored in `scripts/fonts/`.

## Asset inventory

| File                              | Size    | Dimensions | Used in README | Purpose                                                                 |
| --------------------------------- | ------- | ---------- | -------------- | ----------------------------------------------------------------------- |
| `assets/dikaofc-hero.gif`         | 1.73 MB | 1440 × 540 | yes            | Animated 3D hero, 48 frames, 15 fps, 3.2 s seamless loop                |
| `assets/dikaofc-hero.png`         | 397 KB  | 1440 × 540 | linked         | Static poster, identical to frame 0 of the GIF                          |
| `assets/dikaofc-og.png`           | 392 KB  | 1200 × 630 | no             | Open Graph / social preview for ObitoGlory or posts                     |
| `assets/dikaofc-avatar.png`       | 418 KB  | 1024 × 1024| no             | Optional GitHub avatar (monogram, dark studio)                          |
| `assets/dikaofc-mark.svg`         | 2 KB    | 512 × 512  | no             | Scalable monogram / favicon / small mark                                |
| `assets/dikaofc-identity.png`     | 489 KB  | 960 × 600  | yes            | Editorial identity panel with the intentionally obscured portrait       |
| `assets/dikaofc-identity.svg`     | 3 KB    | 960 × 600  | no             | Editable source for the identity panel                                  |
| `assets/dikaofc-projects.png`     | 143 KB  | 1200 × 350 | yes            | Original schematic of DikaRoute, ObitoBuff CLI, and PentesterBot flows  |
| `assets/dikaofc-projects.svg`     | 4 KB    | 1200 × 350 | no             | Editable source for the project schematic                               |
| `assets/dikaofc-hero.svg`         | 4 KB    | 1200 × 630 | no             | Alternate flat hero poster kept as an earlier design study              |
| `assets/dika.jpg`                 | 42 KB   | 480 × 480  | via identity   | Owner-provided portrait, used with permission; face already obscured    |

The project schematic is an illustration of how each project works, not a product screenshot. The identity panel uses the owner-provided photo; it is not a stock image.

## Rendering pipeline

Requirements:

- Node.js 20 or newer
- `npm install` (Playwright and Three.js)
- `npx playwright install chromium` (browser binary)
- `ffmpeg` and `gifsicle` for GIF encoding and optimization

Commands:

```sh
npm run render:assets     # 3D hero, GIF, hero poster, OG still, avatar, identity and project panels
npm run optimize:assets   # recompress the GIF / print the asset inventory
npm run check:links       # verify README assets and external links
```

`render:assets` opens `scripts/hero-scene.html` in headless Chromium. The scene is built with Three.js r180, using PBR materials, PMREM environment lighting, a shadow catcher, and a restrained camera move. Chromium renders with SwiftShader software WebGL in this environment; no Blender or GPU renderer was available here. The committed assets are the output of this pipeline, so a reader never needs to run it.

Intermediate frames are written to a temporary directory and are not committed. Set `KEEP_RENDERS=1` if you want to inspect them.

### Animation notes

- 48 frames at 15 fps, 3.2 seconds per loop.
- All motion is periodic with the loop: slow camera drift, a small monogram rotation, a soft light sweep, and a moving radial glow.
- No flashing, no rapid brightness changes, no particle storm.
- Frame 0 is the static poster, so the README still reads correctly when animation is disabled.
- The GIF is optimized with `gifsicle -O3 --lossy=15`. A typical run encodes to an intermediate ffmpeg GIF of about 2.7 MB and lands around 1.7 MB after optimization (roughly a third smaller). An animated WebP was also tested (≈ 808 KB), but GIF was kept for the widest compatibility. If a smaller file is needed later, test the WebP version on GitHub before switching.

## Link audit

See `docs/LINK-AUDIT.md` for the verified status of every link in the README and the notes about the archive journal. Summary: all links used by the README return HTTP 200.

## Identity rules

- **DikaOfc** is the dominant public identity: README title, hero artwork, and profile introduction.
- **DikaCode** is the developer identity and brand. It is not a separate GitHub account and is never linked as one.
- **ObitoGlory** is the website and portfolio brand.
- **DikaGlory** and **DikaGlorya** are older handles that still appear in links.
- The only GitHub account is **github.com/dikaglorya**. Do not add unverified aliases or accounts to the README or to structured data.

## Manual steps after review

1. Review the README, the hero GIF, and the panels on desktop and mobile.
2. Commit and push this repository (`dikaglorya/dikaglorya`).
3. On the GitHub account settings, change the display name to **DikaOfc** and make the bio lead with DikaOfc (the profile currently shows `ObitoGlory` and `im dikacode / obitoglory`, which contradicts the primary-identity goal). The website field is already `https://obitoglory.tech`.
4. Optional: upload `assets/dikaofc-avatar.png` as the GitHub avatar and use `assets/dikaofc-og.png` on ObitoGlory or in social posts.
5. On the website (separate repository, not changed here): update the Person/Organization `sameAs` values, the contact page, and footer links to `https://github.com/dikaglorya`; remove references to `dikaofc` and `dikacode`; add a reciprocal link from the website back to this profile.
6. If the GIF feels heavy on slow connections, consider the WebP variant or a shorter loop, then test the rendered result on GitHub.

## Licensing

- Archivo Black and JetBrains Mono: SIL Open Font License 1.1 (`scripts/fonts/OFL-*.txt`).
- The 3D scene, monogram, animation, and project schematic are original artwork for DikaOfc.
- `assets/dika.jpg` is provided by the owner and used with full permission. The face is obscured in the source photo by choice.
