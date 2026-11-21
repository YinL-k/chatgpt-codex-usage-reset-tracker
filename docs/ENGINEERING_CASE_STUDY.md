# SakuraMeter — Engineering Case Study

> **Scope:** Code-grounded account of the Chrome Manifest V3 extension, based on the `main` branch at `b9618a9` (version `3.7.0.12`, reviewed 2026-11-14). This is an engineering overview, not a guarantee that every optional feature works on every future ChatGPT or third-party website version.

## The problem and product

SakuraMeter combines three different tasks in one browser extension:

1. **Local activity tracking:** Observe confirmed user sends in ChatGPT and present daily, weekly, monthly, and heatmap views. Locally observed activity is not an account-wide record across devices.
2. **Usage and forecasts:** Show available account-specific Codex usage data and server-provided reset timestamps without inventing missing data. Display **separately labeled, experimental third-party** global reset forecasts; these are not official OpenAI schedules.
3. **Optional assisted browsing:** Side Chat prepares user-reviewable page excerpts and highlighted text. The separate **Agent Beta**, when explicitly started by the user, coordinates a bounded sequence of page observations and supported DOM actions through the existing ChatGPT web composer.

The project uses the signed-in ChatGPT website rather than shipping its own model API key or an independent developer-operated chat proxy. This couples some integration points to changing browser-page behavior, which the documentation treats as a compatibility limitation.

## Architecture map

| Responsibility | Implementation entry points | Engineering considerations |
| --- | --- | --- |
| Extension composition and browser permissions | [manifest.json](../manifest.json) | MV3 service worker, content-script worlds, Side Panel, optional host permissions |
| Confirmed activity events and account usage | [content.js](../content.js), [usage-core.js](../usage-core.js), [background.js](../background.js), [usage-network-bridge.js](../usage-network-bridge.js) | Receipt validation/deduplication, pure normalization, storage migrations, serialized background writes |
| Usage and UI surfaces | [popup.js](../popup.js), [dashboard.js](../dashboard.js), [heatmap.js](../heatmap.js), [usage-ui.js](../usage-ui.js) | Progressive display when values are missing; locally recorded activity versus server-reported usage |
| Forecasts and notifications | [reset-forecast.js](../reset-forecast.js), [reset-notifications-worker.js](../reset-notifications-worker.js) | Third-party sources, backoff/staleness handling, user-configured notifications |
| Page context and Side Chat | [sidechat/core.js](../sidechat/core.js), [sidechat/worker.js](../sidechat/worker.js), [sidechat/adapter.js](../sidechat/adapter.js), [sidechat/panel.html](../sidechat/panel.html) | Tab/window scope, permission checks, session-scoped context and native composer integration |
| Optional Agent Beta | [sidechat/agent-protocol.js](../sidechat/agent-protocol.js), [sidechat/agent-loop.js](../sidechat/agent-loop.js), [sidechat/agent-worker.js](../sidechat/agent-worker.js), [sidechat/agent-page.js](../sidechat/agent-page.js) | Strict structured response validation, fixed action allowlist, run/snapshot identity, local approval and cancellation |
| Release tooling | [.github/workflows/release.yml](../.github/workflows/release.yml), [.github/scripts/release-package.py](../.github/scripts/release-package.py), [.github/scripts/store-publish.mjs](../.github/scripts/store-publish.mjs) | Single ZIP artifact, version/tag validation, integrity verification, independently gated store submissions |

### Data and trust boundaries

- The activity core normalizes and migrates browser-local records; unavailable quotas are not silently synthesized. Source and display layers should distinguish **observed messages**, **server-reported allowance**, and **third-party forecasts**.
- Page context is optional and scoped to a user-authorized active tab and Side Chat. Page excerpts may still contain visible sensitive text. See [PRIVACY.md](../PRIVACY.md) for the current capture, retention, and permission boundaries.
- Agent replies are **textual JSON or XML**, not executable JavaScript. The local validator accepts only supported actions (observe, click, fill, select, press, scroll, wait) with run/request/snapshot checks. The worker controls permissions and execution; the model cannot grant its own approval.
- Risk-sensitive input detection and consequential-action confirmation are **heuristics**, not a complete security boundary. Authentication, private content, generated actions, and third-party sites require careful human review.
- Browser extension permissions include optional broad host permissions for user-authorized page tasks; they are not evidence of a developer-operated data relay.

## Verification strategy

The repository provides a Node regression suite for usage/core, forecasts, Side Chat, Agent protocol/worker, and related state behavior. Example local commands, from the repository root:

```sh
npm install --prefix tests --ignore-scripts --no-package-lock
npm test --prefix tests
```

Dedicated browser/fixture scripts are under [tests/](../tests/), including page/reference capture, Agent transport, and visual checks. See [TESTING.md](../TESTING.md) for **dated historical verification reports and limitations**. The existence of tests is not proof that they passed on this exact machine or current browser. Authenticated-browser acceptance is distinct from fixture-based tests.

**GitHub Actions**:
- [Side Chat regression](../.github/workflows/sidechat-checks.yml) exercises Node tests and selected browser fixtures on relevant pull requests.
- [Release tooling checks](../.github/workflows/release-checks.yml) exercise store API contracts and package integrity without publishing.
- [Core regression](../.github/workflows/core-regression.yml) covers pull requests and pushes changing major core/runtime entry points. Passing a workflow is distinct from enabling required branch-protection checks.

## Delivery and release boundaries

The release workflow validates a matching manifest version and tag, builds one ZIP, verifies its digest before the GitHub Release, then submits the same package to separately gated Chrome and Edge jobs. Store review/approval and actual rollout are **not** established by a GitHub Release or an upload/submit job succeeding.

**Historical review-queue incident (maintainer clarification, 2026-11-15):** The GitHub Actions release run for `v3.7.0.12` on 2026-10-21 produced a valid GitHub Release, and the Edge submission job succeeded; the Chrome submission job returned HTTP 400. The project maintainer has since confirmed that an earlier Chrome version was still pending review and that the Chrome and Edge reviews have now cleared, with the end-to-end publishing workflow usable. The October 21 failed job remains a historical CI record; it should **not** be presented as an ongoing defect or a need to redesign the release pipeline. The review outcome is maintainer-reported, not independently verified here through the store dashboards.

See [STORE-PUBLISHING.md](../STORE-PUBLISHING.md) for the operational workflow and [releases](https://github.com/YinL-k/chatgpt-codex-usage-reset-tracker/releases) for published GitHub artifacts. Do not run publishing/review-cancellation operations as part of a portfolio demonstration.

## Suggested demo sequence

1. Show the local activity heatmap and explain what counts as a confirmed send.
2. Show server-reported usage alongside the clearly separate experimental forecast card.
3. Demonstrate Side Chat reference preview/dismissal on a non-sensitive test page.
4. Use local fixtures to illustrate Agent Beta's structured action validation, permission/approval boundaries, and cancellation behavior.
5. Walk through a test case and CI/release artifact checks, without implying Chrome or Edge approval from CI alone.

## Attribution and limitations

This document describes **this repository's implementation**, not unsupported user counts, conversion rates, store-review results, or specific per-commit personal authorship. For exact author attribution and change history, consult the repository commits and pull requests. Do not disclose personal chats, tokens, cookies, unpublished enterprise information, or sensitive browser contents in screenshots.
