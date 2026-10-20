# DikaOfc identity assets

This document describes the artwork behind the DikaOfc GitHub profile README: what each file is, how it was produced, and how to regenerate it. The README itself has no build step; every asset it needs is committed.

## Concept and art direction

The profile is a small digital identity lab: a near-black studio, one signature ice-blue light, engineered metallic forms, and precise technical metadata. The centerpiece is an original 3D scene with a geometric **D** monogram and an extruded **DIKAOFC** wordmark. Around it, three animated editorial panels carry the identity story: a scanned portrait, a capability map, and a contact gate. Every animation is pre-rendered, because GitHub Markdown cannot run JavaScript, Three.js, or WebGL.

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
| `assets/dikaofc-hero.gif`         | 4.3 MB  | 1200 × 450 | yes            | Animated 3D hero, 90 frames, 15 fps, 6 s seamless loop                  |
| `assets/dikaofc-hero.png`         | 458 KB  | 1440 × 540 | linked         | Full-resolution static hero poster                                      |
| `assets/dikaofc-og.png`           | 454 KB  | 1200 × 630 | no             | Open Graph / social preview for ObitoGlory or posts                     |
| `assets/dikaofc-avatar.png`       | 466 KB  | 1024 × 1024 | no             | Optional GitHub avatar (monogram, dark studio)                          |
| `assets/dikaofc-mark.svg`         | 2 KB    | 512 × 512  | no             | Scalable monogram / favicon / small mark                                |
| `assets/dikaofc-identity.gif`     | 2.0 MB  | 800 × 500  | yes            | Animated identity scan panel, 48 frames, 12 fps, 4 s loop               |
| `assets/dikaofc-identity.png`     | 489 KB  | 960 × 600  | linked         | Static identity fallback with the obscured portrait                     |
| `assets/dikaofc-identity.svg`     | 3 KB    | 960 × 600  | no             | Editable source for the identity panel                                  |
| `assets/dikaofc-focus.gif`        | 1.9 MB  | 1200 × 440 | yes            | Animated capability map, 72 frames, 15 fps, 4.8 s loop                  |
| `assets/dikaofc-focus.png`        | 250 KB  | 1200 × 440 | linked         | Static capability map fallback                                          |
| `assets/dikaofc-contact.gif`      | 730 KB  | 1200 × 260 | yes            | Animated contact gate, 48 frames, 12 fps, 4 s loop                      |
| `assets/dikaofc-contact.png`      | 132 KB  | 1200 × 260 | no             | Static contact banner fallback                                          |
| `assets/dikaofc-projects.png`     | 143 KB  | 1200 × 350 | no             | Optional project schematic (removed from README; kept as an asset)      |
| `assets/dikaofc-projects.svg`     | 4 KB    | 1200 × 350 | no             | Editable source for the optional project schematic                      |
| `assets/dikaofc-hero.svg`         | 4 KB    | 1200 × 630 | no             | Alternate flat hero poster kept as an earlier design study              |
| `assets/dika.jpg`                 | 42 KB   | 480 × 480  | via identity   | Owner-provided portrait, used with permission; face already obscured    |

The optional project schematic is an illustration of how each project works, not a product screenshot. It is no longer included in the README. The identity panel uses the owner-provided photo; it is not a stock image.

## Rendering pipeline

Requirements:

- Node.js 20 or newer
- `npm install` (Playwright and Three.js)
- `npx playwright install chromium` (browser binary)
- `ffmpeg` and `gifsicle` for GIF encoding and optimization

Commands:

```sh
npm run render:assets     # hero, posters, identity, capability map, contact gate, GIFs
SKIP_HERO=1 npm run render:assets  # panels only; reuse the committed 3D hero assets
npm run optimize:assets   # recompress the hero GIF / print the asset inventory
npm run check:links       # verify README assets and external links
```

`render:assets` opens four scenes in headless Chromium: `scripts/hero-scene.html` (Three.js), `scripts/identity-scene.html` (inline SVG plus overlays), `scripts/focus-scene.html` (canvas), and `scripts/cta-scene.html` (canvas). The hero uses Three.js r180 with PBR materials, a PMREM environment, a shadow catcher, and a deliberately slow camera orbit. Chromium renders with SwiftShader software WebGL in this environment; no Blender or GPU renderer was available here. The committed assets are the output of this pipeline, so a reader never needs to run it.

On a memory-constrained machine the 3D hero can exhaust Chromium's memory. `SKIP_HERO=1` skips the WebGL scenes and the hero GIF encode while still regenerating the animated editorial panels; the committed hero files are already in `assets/`.

Intermediate frames are written to a temporary directory and are not committed. Set `KEEP_RENDERS=1` if you want to inspect them.

### Animation notes

- **Hero:** 90 frames at 15 fps, 6 seconds per loop. The camera orbits and dollies, the **D** rotates to reveal its extrusion, each **DIKAOFC** letter floats at its own depth, and orbital rings, satellites, floor reflections, dust, and HUD telemetry keep moving. All motion is periodic, so the loop is seamless. The GIF is encoded at 1200 × 450, 160 colors, Bayer-5 dither, and `gifsicle --lossy=30`; the static poster is rendered at 1440 × 540.
- **Identity panel:** 48 frames at 12 fps, 4 seconds. A scanner bar crosses the portrait, a thin scanline crosses the panel, a sheen passes over the text, status dots pulse, and the scan/signal ticker updates. Encoded at 800 × 500, 96 colors, Bayer-5, `--lossy=35`.
- **Capability map:** 72 frames at 15 fps, 4.8 seconds. Five cards bob independently, scan bands cross them, reticles rotate, and data pulses travel along the bus. Encoded at 1200 × 440, 128 colors, Bayer-5, `--lossy=30`.
- **Contact gate:** 48 frames at 12 fps, 4 seconds. The portal rings counter-rotate, satellites orbit, the core breathes, and a sheen crosses the display type. Encoded at 1200 × 260, 128 colors, Bayer-5, `--lossy=30`.
- No flashing, no rapid brightness changes, no particle storm. The face in the portrait is obscured by choice.
- Static fallbacks: `dikaofc-hero.png`, `dikaofc-identity.png`, `dikaofc-focus.png`, and `dikaofc-contact.png`. The README links the first three; the contact section keeps its real HTML links below the animated banner.
- The four animated panels total roughly 9 MB (hero 4.3 MB, identity 2.0 MB, capability map 1.9 MB, contact gate 730 KB). Below-the-fold panels use `loading="lazy"` where GitHub preserves the attribute. If a smaller payload is needed, reduce the hero's color count or resolution first; test the result on GitHub before switching formats.

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
