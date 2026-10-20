# DikaOfc identity assets

This document describes the artwork behind the DikaOfc GitHub profile README: what each file is, how it is produced, and how to regenerate it. The README is image-first and has no build step; every asset it needs is committed.

## Concept and art direction

The profile is a small digital identity lab: a near-black studio, one signature ice-blue light, engineered metallic forms, and precise technical metadata. The centerpiece is an original 3D scene with a geometric **D** monogram and an extruded **DIKAOFC** wordmark. Five animated editorial panels carry the rest of the identity story: a scanned portrait archive, a capability map, a current-focus stack, an engineering-principles data-wall, and a contact tunnel. Every animation is pre-rendered, because GitHub Markdown cannot run JavaScript, Three.js, or WebGL.

| Token          | Value     | Use                          |
| -------------- | --------- | ---------------------------- |
| Background     | `#07090C` | Near-black canvas            |
| Secondary      | `#10151B` | Panels and depth             |
| Primary text   | `#EAF1F5` | Readable text                |
| Muted text     | `#9BA8B2` | Supporting metadata          |
| Accent         | `#8EDCF0` | Signature ice-blue light     |
| Accent shadow  | `#245B70` | Depth in rendered artwork    |

Typography: **Archivo Black** for the 3D wordmarks, **JetBrains Mono** for metadata. Both fonts are licensed under the SIL Open Font License and stored in `scripts/fonts/`.

## Asset inventory

All six animations are animated WebP at 24 fps, encoded for an infinite loop. Each has a static PNG fallback with the same basename.

| File                             | Dimensions | Frames | Loop  | Used in README |
| -------------------------------- | ---------- | -----: | ----- | -------------- |
| `assets/dikaofc-hero.webp`        | 1200 × 450 |    144 | 6.0 s | yes            |
| `assets/dikaofc-identity.webp`    | 1200 × 620 |    120 | 5.0 s | yes            |
| `assets/dikaofc-focus.webp`       | 1200 × 520 |    120 | 5.0 s | yes            |
| `assets/dikaofc-now.webp`         | 1200 × 480 |    120 | 5.0 s | yes            |
| `assets/dikaofc-principles.webp`  | 1200 × 520 |    144 | 6.0 s | yes            |
| `assets/dikaofc-contact.webp`     | 1200 × 340 |    120 | 5.0 s | yes            |
| `assets/dikaofc-hero.png`         | 1200 × 450 |      — | still | no             |
| `assets/dikaofc-identity.png`     | 1200 × 620 |      — | still | no             |
| `assets/dikaofc-focus.png`        | 1200 × 520 |      — | still | no             |
| `assets/dikaofc-now.png`          | 1200 × 480 |      — | still | no             |
| `assets/dikaofc-principles.png`   | 1200 × 520 |      — | still | no             |
| `assets/dikaofc-contact.png`      | 1200 × 340 |      — | still | no             |
| `assets/dikaofc-og.png`           | 1200 × 630 |      — | still | no             |
| `assets/dikaofc-avatar.png`       | 1024 × 1024 |     — | still | no             |

The PNG panels are static poster fallbacks for contexts that cannot animate and for previews. `dikaofc-og.png` is the Open Graph / social preview for ObitoGlory or posts; `dikaofc-avatar.png` is the optional GitHub avatar. The identity panel uses the owner-provided photo `assets/dika.jpg`; it is not a stock image, and the face is obscured by choice.

## Rendering pipeline

Requirements:

- Node.js 20 or newer
- `npm install` (Playwright and Three.js)
- `npx playwright install chromium` (browser binary)
- `img2webp` from the WebP tools (`webp`/`libwebp`) on `PATH`

Each scene is a self-contained HTML page opened in headless Chromium at the target viewport. The renderer steps through one normalized loop with `window.__setFrame(t)`, screenshots every frame as PNG, then encodes the sequence with `img2webp`:

- `-d 42` — 42 ms per frame, the 24 fps cadence
- `-q` — quality 86/88, set per scene by the render script
- `-loop 0` — infinite loop

The PNG fallbacks and the OG/avatar stills are captured from representative frames in the same run. Intermediate frames go to a temporary directory and are not committed. Set `KEEP_RENDERS=1` to inspect them.

Commands:

```sh
npm run render:assets                  # full render: hero, five panels, PNG fallbacks, OG, avatar
ONLY=identity,now npm run render:assets   # render selected scenes only
SKIP_HERO=1 npm run render:assets      # panels only; reuse the committed hero and stills
npm run optimize:assets                # re-optimize the WebP files and print the inventory
npm run check:links                    # verify README assets and external links
```

`ONLY` accepts a comma-separated list of scene names: `hero`, `identity`, `focus`, `now`, `principles`, `contact`. `SKIP_HERO=1` skips the WebGL hero, its loop, and the shared OG/avatar stills, then regenerates the editorial panels; the committed hero files are already in `assets/`.

Scene sources:

- `scripts/hero-scene.html` — Three.js hero, OG and avatar layouts
- `scripts/identity-scene.html` — CSS/HTML 3D portrait archive
- `scripts/focus-scene.html` — capability map
- `scripts/now-scene.html` — current-focus mission stack
- `scripts/principles-scene.html` — engineering-principles data-wall
- `scripts/contact-scene.html` — contact tunnel

The hero uses Three.js r180 with PBR materials, a PMREM environment, shadow catchers, and looping camera motion. The five panels are CSS/HTML 3D scenes with shared styling in `scripts/panel.css`; no canvas or WebGL is required for them. Chromium renders the hero with SwiftShader software WebGL in this environment; no Blender or GPU renderer was available. The committed assets are the output of this pipeline, so a reader never needs to run it.

### Animation notes

- **Hero:** 144 frames at 24 fps, 6 seconds per loop, 1200 × 450. The **D** performs a full 360° spin per loop, the camera orbits and dollies with a subtle roll, each **DIKAOFC** letter floats at its own depth, and orbital rings, satellites, chrome debris, floor reflections, dust, and HUD telemetry keep moving. All motion is periodic, so the loop is seamless.
- **Identity:** 120 frames at 24 fps, 5 seconds, 1200 × 620. The chrome-backed portrait slab turntables in the studio, a glowing scan plane rides across the photo face, an orbit ring circles the slab, and the DIKAOFC wordmark plus the DikaCode and ObitoGlory role plates hover with letter cascades.
- **Capability map:** 120 frames at 24 fps, 5 seconds, 1200 × 520. Five cards (Languages, Web, Systems, AI, Automation) bob independently, scan bands cross them, reticles rotate, and data pulses travel along the bus.
- **Current focus:** 120 frames at 24 fps, 5 seconds, 1200 × 480. Three glass mission cards (AI Routing, Local-First AI, Ship Quality) pivot and hover around a glowing NOW monogram while a scan beam lights the active card and chrome shards drift past.
- **Principles data-wall:** 144 frames at 24 fps, 6 seconds, 1200 × 520. Six floating glass principle slabs (Build useful things, Prefer maintainable, Measure, don't fabricate, Document decisions, Keep interfaces accessible, Improve via feedback) hover in a 3D ring around a glowing chrome core while scan beams, rings and particles keep moving.
- **Contact tunnel:** 120 frames at 24 fps, 5 seconds, 1200 × 340. The portal rings rush through a deep 3D tunnel, radial rays rotate, the core breathes, floating shards drift, and the headline and contact rows hover as a layered 3D plate.
- **Shared HUD animator (`scripts/hud.mjs`):** every DOM scene imports it and calls `applyHud(t)` inside `setFrame(t)`. HUD labels and title blocks are split into per-character spans driven purely by `t`, with a very small vertical wave and a travelling cyan glow. Rotations and RGB-split glitches are deliberately disabled so tiny 8px HUD labels stay crisp. Large headlines and card copy move with their 3D panels.
- No flashing, no rapid brightness changes, no particle storm. The face in the portrait is obscured by choice.
- Every WebP is encoded with `-loop 0` (infinite loop) and the README references the loops directly, so all assets autoplay and loop forever on GitHub. Do not add `loading="lazy"`: deferred images may not start until scrolled, which breaks the autoplay showcase.

### Why animated WebP

GitHub READMEs render animated WebP inline when the file is committed and referenced with a relative `<img src="assets/...webp">` path. WebP keeps full 24-bit color and smooth metallic gradients at a fraction of the size of older animated formats, which matters for a page with six full-width loops. The static PNG fallbacks share the basenames, so a renderer that cannot animate still shows a coherent poster.

## Link audit

See `docs/LINK-AUDIT.md` for the verified status of every link in the README and the asset checks. Summary: all README links return HTTP 200 and every referenced asset belongs to the inventory above.

## Identity rules

- **DikaOfc** is the dominant public identity: README artwork, hero copy, and profile text.
- **DikaCode** is the developer identity and brand, not a separate GitHub account.
- **ObitoGlory** is the website and portfolio brand.
- **DikaGlory** and **DikaGlorya** are older handles that may still appear in archived links.
- The only official GitHub account is **github.com/dikaglorya**. Do not add unverified aliases or accounts to the README or structured data.

## Manual steps after review

1. Review the README and all six loops on desktop and mobile.
2. Commit and push this repository (`dikaglorya/dikaglorya`).
3. In the GitHub account settings, set the display name to **DikaOfc** and lead the bio with DikaOfc. The website field is already `https://obitoglory.tech`.
4. Optional: upload `assets/dikaofc-avatar.png` as the GitHub avatar and use `assets/dikaofc-og.png` on ObitoGlory or in social posts.
5. On the website (separate repository, not changed here): update the Person/Organization `sameAs` values, the contact page, and footer links to `https://github.com/dikaglorya`; add a reciprocal link from the website back to this profile.

## Licensing

- Archivo Black and JetBrains Mono: SIL Open Font License 1.1 (`scripts/fonts/OFL-*.txt`).
- The 3D scenes, monogram, animations, and diagrams are original artwork for DikaOfc.
- `assets/dika.jpg` is provided by the owner and used with full permission. The face is obscured in the source photo by choice.
