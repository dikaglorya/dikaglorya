# README link and asset audit

The README combines local generated artwork with external profile, stats, badge, and social links. Run `npm run check:links` from the repository root for a current audit; it verifies each local README reference exists and sends GET requests to external URLs. External availability can change independently of this repository, so the script output is authoritative.

## Local assets

The README references the dark/light hero, about, skills, stats, divider, and footer SVGs in `assets/`, plus the owner-provided `assets/dika.jpg` portrait. `npm run validate` checks the 12 generated SVGs; `npm run check:links` checks that all local references are present and non-empty.

## Generated contribution snake

The README embeds dark and light snake SVGs from the `output` branch. `.github/workflows/snake.yml` publishes them on pushes to `main`, on its daily schedule, or by manual dispatch. A missing output branch or a failed workflow run will make these two image URLs return 404; inspect the workflow run before treating those URLs as broken permanently.

## Identity

The only official GitHub account linked in the README is `github.com/dikaglorya`. The portrait is intentionally obscured by choice.
