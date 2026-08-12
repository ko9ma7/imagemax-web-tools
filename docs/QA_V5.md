# QA — Template/Community Release

## Static / syntax checks
- JavaScript / MJS `node --check`: passed for all project scripts.
- HTML duplicate `id`: none across 5 HTML pages.
- Relative `href/src` targets: no missing local references.
- GitHub Actions YAML parse: `pages.yml`, `template-submission.yml` passed.
- Static HTTP smoke test: `/`, `/script/`, `/gui/`, `/reference/`, `/templates/`, `/community/index.json`, `/script/template-library.js` all returned HTTP 200.

## Template library
- Built-in template factory: **120 templates**.
- Unique built-in IDs: 120/120.
- Category counts:
  - basic 19
  - image 26
  - state 27
  - flow 13
  - input 11
  - utility 13
  - data 11
- Every built-in recipe was materialized into rule JSON and passed the same client-side rule/condition/action allowlist validator used for imported templates.
- Sample `.imxtplpack.json` passed validation.

## Community Action simulation
A synthetic GitHub `issues: opened` payload containing `data/sample-template-pack.json` was supplied to `scripts/process-template-submission.mjs` inside a temporary project copy.

Verified:
- submission marker extraction
- fenced JSON extraction
- schema / allowlist validation
- `community/templates/sample_count_click.json` generation
- `community/index.json` index update

The temporary QA files were removed afterward.

## Security-oriented checks
- Browser code contains no GitHub PAT/token.
- Default sharing path uses a user-created GitHub Issue.
- Optional Worker token is server-side only and the Worker creates Issues rather than writing repository contents.
- Community template IDs cannot contain path traversal characters.
- Community rules/actions are allowlisted; JavaScript code is not accepted as a template type.
- Share submission is capped at 20 templates; local packs may contain up to 50.
- Large Issue bodies fall back to clipboard + GitHub Issue instead of constructing an excessively long URL.

## Browser render limitation in this environment
A Chromium headless screenshot attempt was made, but the container's Chromium process did not complete within the QA timeout because of its DBus/runtime environment. Therefore this QA does **not** claim final browser-pixel visual verification. Static route, parser, syntax, template-generation, and community-processing checks above were completed.
