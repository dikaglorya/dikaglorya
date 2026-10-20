# Generated SVG assets

The profile README uses a generated set of self-contained SVGs. Each artwork has a dark and light variant selected with `<picture>` and `prefers-color-scheme`; animations use inline SVG/CSS rather than JavaScript or external images.

## Inventory

| Pair | Dimensions | Content |
| --- | ---: | --- |
| `hero-dark.svg`, `hero-light.svg` | 1200 x 420 | Animated crystal, orbiting lights, perspective grid, and profile identity |
| `about-3d.svg`, `about-3d-light.svg` | 1200 x 330 | Isometric terminal and developer introduction |
| `skills-3d.svg`, `skills-3d-light.svg` | 1200 x 420 | Animated technology tiles |
| `stats-3d.svg`, `stats-3d-light.svg` | 1200 x 405 | Illustrative language chart |
| `divider.svg`, `divider-light.svg` | 1200 x 90 | Animated energy wave section divider |
| `footer-dark.svg`, `footer-light.svg` | 1200 x 300 | Animated mountain layers and closing message |

`assets/dika.jpg` is the owner-provided portrait shown in the README; the face is intentionally obscured. The SVGs are generated from `scripts/build-assets.js` and committed under `assets/`.

## Build and checks

Requirements: Node.js 20 or newer. From the repository root:

```sh
npm run build       # regenerate all 12 SVG files
npm run validate    # check SVG safety, structure, size, and XML parsing
npm run check:links # check local README assets and live external URLs
```

Validation uses `xmllint` when available and falls back to Chromium via Playwright. The generated SVGs include reduced-motion handling and descriptive title/description elements.

## Contribution snake

The contribution snake is generated separately by `.github/workflows/snake.yml` and published to the `output` branch. The workflow runs on pushes to `main`, daily, and by manual dispatch. The two raw GitHub URLs embedded in the README become available after the first successful workflow run.
