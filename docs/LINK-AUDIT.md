# Link and identity audit

Checked on 2026-10-20 with `npm run check:links` (HTTP GET, redirects followed) plus manual inspection of the ObitoGlory routes and structured data.

## README assets

| Path                            | Status |
| ------------------------------- | ------ |
| `assets/dikaofc-hero.gif`       | OK     |
| `assets/dikaofc-hero.png`       | OK     |
| `assets/dikaofc-identity.gif`   | OK     |
| `assets/dikaofc-identity.png`   | OK     |
| `assets/dikaofc-focus.gif`      | OK     |
| `assets/dikaofc-focus.png`      | OK     |
| `assets/dikaofc-contact.gif`    | OK     |

## External links used in the README

| URL                                                   | Status | Note                                        |
| ----------------------------------------------------- | ------ | ------------------------------------------- |
| `https://www.obitoglory.tech/`                        | 200    | Portfolio and services                      |
| `https://www.obitoglory.tech/proyek`                  | 200    | Project index                               |
| `https://www.obitoglory.tech/tentang`                 | 200    | About                                       |
| `https://www.obitoglory.tech/kontak`                  | 200    | Contact                                     |
| `https://dikaglorya.github.io/journal/`               | 200    | Archive technical journal                   |
| `https://github.com/dikaglorya`                       | 200    | The only official GitHub account            |
| `https://t.me/dikaacode`                              | 200    | Telegram contact                            |

## Verified but no longer linked

The project case studies below were checked during the audit. They were removed from the README when the Selected work section was removed; the project index above remains the supported entry point.

| URL                                                   | Status | Note                                        |
| ----------------------------------------------------- | ------ | ------------------------------------------- |
| `https://www.obitoglory.tech/proyek/dikaroute`        | 200    | DikaRoute case study                        |
| `https://www.obitoglory.tech/proyek/obitobuff`        | 200    | ObitoBuff CLI case study                    |
| `https://www.obitoglory.tech/proyek/pentesterbot`     | 200    | PentesterBot case study                     |
| `https://www.obitoglory.tech/proyek/telegrambot-ai`   | 200    | TelegramBot AI case study                   |
| `https://www.obitoglory.tech/proyek/remoteuniversal`  | 200    | RemoteUniversalDevice case study            |
| `https://www.obitoglory.tech/proyek/agentbuff`        | 200    | AgentBuff case study                        |
| `https://www.obitoglory.tech/proyek/freebuff-patch`   | 200    | Freebuff Patch case study                   |

## Route changes found during inspection

- `obitoglory.tech` now uses Indonesian routes: `/proyek`, `/tentang`, `/kontak`, `/layanan`, `/harga`, `/faq`. The English paths suggested in the original brief (`/projects/`, `/about/`, `/contact/`) return 404 on that domain, so the README uses the real routes.
- The new website has no `/journal` route. The only verified journal is the archive site `https://dikaglorya.github.io/journal/`; the README labels it as technical notes on the archive site.
- The old GitHub Pages case studies (`https://dikaglorya.github.io/projects/...`) still return 200. The current ObitoGlory project pages remain available; the README no longer includes the Selected work section.

## Identity consistency findings (outside this repository)

- The only official GitHub account is **https://github.com/dikaglorya**.
- The official GitHub profile currently has the display name `ObitoGlory` and the bio `im dikacode / obitoglory`, while the site's contact/schema links point to other accounts. This contradicts the goal of making DikaOfc the dominant identity. Recommended manual fix in GitHub settings: display name **DikaOfc**, bio starting with DikaOfc.
- `https://github.com/dikaofc` returns **404**, but the ObitoGlory structured data (`sameAs`) and several site links still point to it. This should be corrected on the website.
- `https://github.com/dikacode` exists but is **not** the owner's account, and it appears to use the owner's photo. It is not linked from this README. If it is impersonating the owner, it can be reported to GitHub through the normal impersonation report flow.
- Recommended website-side changes (the website repository was not modified here): update `sameAs` values, contact links, and footer links to `https://github.com/dikaglorya`; remove `dikaofc` and `dikacode`; add a reciprocal link from the website to this profile; keep only aliases the owner actually uses.
- The official account has two public repositories (`dikaglorya.github.io` and `dikaglorya`); the product tools themselves are not published there, and the README wording reflects that.

## What is not claimed

- No claims about Google rankings or search improvements were made or measured. Profile content helps visitors identify its owner; ranking depends on many signals outside the README.
- No fabricated visitor counts, contribution milestones, star counts, or popularity metrics are present.
- Project diagrams are labelled as illustrative schematics, not product screenshots.
