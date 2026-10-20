# Link and identity audit

Checked on 2026-10-20. External URLs were verified with HTTP GET (redirects followed); README asset paths were checked against the six-scene WebP inventory.

## README animations

| Path                              | Dimensions | Frames | Status     |
| --------------------------------- | ---------- | -----: | ---------- |
| `assets/dikaofc-hero.webp`        | 1200 × 450 |    144 | Referenced |
| `assets/dikaofc-identity.webp`    | 1200 × 620 |    120 | Referenced |
| `assets/dikaofc-focus.webp`       | 1200 × 520 |    120 | Referenced |
| `assets/dikaofc-now.webp`         | 1200 × 480 |    120 | Referenced |
| `assets/dikaofc-principles.webp`  | 1200 × 520 |    144 | Referenced |
| `assets/dikaofc-contact.webp`     | 1200 × 340 |    120 | Referenced |

## Static assets

| Path                            | Dimensions  | Role                    |
| ------------------------------- | ----------- | ----------------------- |
| `assets/dikaofc-hero.png`       | 1200 × 450  | Hero fallback           |
| `assets/dikaofc-identity.png`   | 1200 × 620  | Identity fallback       |
| `assets/dikaofc-focus.png`      | 1200 × 520  | Focus fallback          |
| `assets/dikaofc-now.png`        | 1200 × 480  | Now fallback            |
| `assets/dikaofc-principles.png` | 1200 × 520  | Principles fallback     |
| `assets/dikaofc-contact.png`    | 1200 × 340  | Contact fallback        |
| `assets/dikaofc-og.png`         | 1200 × 630  | Open Graph preview      |
| `assets/dikaofc-avatar.png`     | 1024 × 1024 | Optional GitHub avatar  |

The six PNG fallbacks share the basenames of the WebP loops and are not linked from the README. All fourteen files are emitted by `npm run render:assets`; they must be present in `assets/` before publishing. At the time of this audit the new WebP/PNG set had not yet been rendered, so those paths are the only ones that would 404 until that run completes.

## External links used in the README

| URL                                     | Status | Note                             |
| --------------------------------------- | ------ | -------------------------------- |
| `https://www.obitoglory.tech/`          | 200    | Portfolio and services           |
| `https://www.obitoglory.tech/proyek`    | 200    | Project index                    |
| `https://dikaglorya.github.io/journal/` | 200    | Technical journal                |
| `https://www.obitoglory.tech/tentang`   | 200    | About                            |
| `https://www.obitoglory.tech/kontak`    | 200    | Contact                          |
| `https://github.com/dikaglorya`         | 200    | The only official GitHub account |

No broken external links were found.

## Identity and retired references

- The only official GitHub account is **https://github.com/dikaglorya**.
- **DikaOfc** is the public identity, **DikaCode** is the developer identity and brand, and **ObitoGlory** is the website and portfolio brand.
- There are **no references to a dikacode GitHub account** anywhere in the README.
- There are **no GIF, button GIF, intro, current, or retired panel asset references** in the README. The page uses only the six animated WebP loops above.
- The website uses Indonesian routes (`/proyek`, `/tentang`, `/kontak`); the English paths are not used. The journal is the GitHub Pages archive at `https://dikaglorya.github.io/journal/`.
