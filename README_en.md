[中文](README.md) | **English**

<p align="center"><img src="assets/sakurameter-128.png" width="88" alt="SakuraMeter icon" /></p>

# SakuraMeter — ChatGPT Usage Tracker & Codex Reset Monitor

**ChatGPT activity heatmaps · Codex quota and reset times · Global reset forecasts & alerts · Side Chat**

[![Latest release](https://img.shields.io/github/v/release/YinL-k/chatgpt-codex-usage-reset-tracker?label=Latest%20Release)](https://github.com/YinL-k/chatgpt-codex-usage-reset-tracker/releases/latest)
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/hnajkeiigdkgafcobbkchpcdafddfpki)
[![Chrome 116+](https://img.shields.io/badge/Chrome-116%2B-666)](manifest.json)

**[Install from Chrome Web Store](https://chromewebstore.google.com/detail/hnajkeiigdkgafcobbkchpcdafddfpki)** · **[Download the latest release](https://github.com/YinL-k/chatgpt-codex-usage-reset-tracker/releases/latest)** · **[Report a bug / Request a feature](https://github.com/YinL-k/chatgpt-codex-usage-reset-tracker/issues)**

> **See your ChatGPT and Codex usage without digging through account pages.** SakuraMeter combines locally recorded ChatGPT activity, available Codex usage windows and reset timestamps, and experimental third-party forecasts of global Codex resets. It uses your existing signed-in ChatGPT session; no API key is required.
>
> **Important:** Global reset forecasts are **not** an official OpenAI schedule or your personal quota reset countdown. SakuraMeter **cannot reset your quota**.

## What can SakuraMeter do for you?

| Your question | What you get |
| --- | --- |
| **How much Codex allowance is left? When does my window reset?** | Read-only, account-specific Codex usage percentages, reported windows and reset timestamps whenever ChatGPT exposes them. Missing numbers remain unavailable rather than being guessed. |
| **Could a global Codex reset happen soon?** | A **24/48-hour** experimental forecast and last verified global reset from [Codex Reset](https://codex-reset.com/), plus a separate **6/24-hour** forecast and threshold-based notifications from [LunarWerx](https://codex.lunarwerx.com/). |
| **How often do I use ChatGPT?** | Locally confirmed sends, daily trends, an annual activity heatmap, weekly/monthly charts, time-of-day patterns, and activity import/export. |
| **Can I ask ChatGPT about a page without leaving it?** | Optional **Side Chat** with current-page context, highlighted selections, a reference preview/removal control, and an explicit one-click send-selection action when the composer is empty. |
| **What about ChatGPT Pro usage?** | Display server-provided allowance information when available; otherwise show observed local activity and clearly labeled estimates, with manual calibration under Advanced settings. |

Built for Codex developers planning coding sessions, frequent ChatGPT users exploring their activity, and students or researchers asking questions while reading.

## Codex reset: two different things

| | Your personal quota window | Global reset outlook & alerts |
| --- | --- | --- |
| **What it is** | The reset time for a usage window on your account | Third-party forecasts of irregular, publicly reported global goodwill reset events |
| **Source** | Account data reported through your signed-in ChatGPT session | codex-reset.com: **24/48h** outlook; LunarWerx: **6/24h** forecast and confirmed-event data |
| **What it means** | Shown only when the service provides a timestamp; availability may change | Probabilistic, non-official signals; **not** a promise or a prediction of when your account will refill |
| **Where to look** | Dashboard → **Usage** | Dashboard → **Overview**; alert controls under **Usage → Advanced** |

**How do reset alerts work?** SakuraMeter periodically checks a public forecast in the background. If the forecast stays above the configured threshold for the required period, it can show a browser/OS notification. Choose **Standard** or **Low sensitivity**, or turn notifications off. These are **forecast alerts**, not notifications that a reset has definitely occurred.

Forecast data credits: [Codex Reset](https://codex-reset.com/) and [LunarWerx](https://codex.lunarwerx.com/) — independent third-party services, separate from personal usage retrieval.

## Get started

**Recommended: Chrome Web Store.** Use the install link above. Store approval and rollout can lag behind the latest GitHub release, so check the version displayed in the store.

**Manual install of the latest release (Chrome / compatible Chromium-based browsers):**

1. Download `SakuraMeter-<version>.zip` from [GitHub Releases](https://github.com/YinL-k/chatgpt-codex-usage-reset-tracker/releases/latest) and extract it.
2. Open `chrome://extensions` in Chrome or `edge://extensions` in Microsoft Edge and enable **Developer mode**.
3. Select **Load unpacked** and choose the extracted folder containing `manifest.json`.
4. Open [ChatGPT](https://chatgpt.com/) and sign in. Refresh any existing ChatGPT tab once, then open SakuraMeter from the browser toolbar.

**First steps:** Open the popup for a quick overview; visit **Overview / Activity / Usage** in the dashboard; configure reset alerts at **Usage → Advanced**. Open optional Side Chat using `Alt + Shift + C` or the extension entry point, and grant site access if you want page references.

**Updating an existing unpacked install:** Back up your original extension directory and export activity data first. Replace files in the **same loaded directory**, then reload from the extension manager. **Do not uninstall first.** Loading from a different directory can change the extension ID and isolate your stored data. Activity JSON exports do not include manual plans or calibration values. See the [Chinese installation guide](INSTALL-中文.md) for additional notes.

## Screenshots

<div align="center">
<img src="https://raw.githubusercontent.com/YinL-k/chatgpt-codex-usage-reset-tracker/main/store-assets/en/preview/large-promotional.jpg?v=3a031125" alt="SakuraMeter product preview" width="820" />
</div>

<details>
<summary><strong>Show six screenshots (dark and light themes)</strong></summary>

| Popup | Popup |
| :---: | :---: |
| <img src="store-assets/en/preview/01-popup-dark.jpg" alt="Popup dark theme" width="390" /> | <img src="store-assets/en/preview/02-popup-light.jpg" alt="Popup light theme" width="390" /> |
| Overview | Overview |
| <img src="store-assets/en/preview/03-overview-dark.jpg" alt="Overview dark theme" width="390" /> | <img src="store-assets/en/preview/04-overview-light.jpg" alt="Overview light theme" width="390" /> |
| Activity | Activity |
| <img src="store-assets/en/preview/05-activity-dark.jpg" alt="Activity dark theme" width="390" /> | <img src="store-assets/en/preview/06-activity-light.jpg" alt="Activity light theme" width="390" /> |

</details>

Screenshots may show an earlier UI. Refer to the relevant release and installed extension for current behavior.

## Privacy and limitations

- **Local-first usage history:** Activity and trend records stay in your browser. Conversation text is not saved to usage history or activity exports; matching text can be held briefly in memory for send confirmation.
- **Read-only usage checks:** SakuraMeter reads available usage data from your existing ChatGPT session. Refreshing does not require an API key, generate a reply, or send a chat message.
- **Third-party public forecasts:** Forecast requests use unauthenticated GET calls and do not include ChatGPT credentials. The provider can still receive ordinary connection metadata such as your IP address.
- **Optional page context:** Side Chat reads rendered page text or explicit highlights only while enabled and authorized. When you choose to submit a reference, it becomes ordinary text in a ChatGPT message, subject to your ChatGPT account/service settings.
- **Permission transparency:** `alarms` and `notifications` support forecast checks and alerts. `sidePanel`, `scripting`, and related permissions enable optional page context. Access to other sites is optional.

There is no developer-operated chat relay or telemetry backend. Read the [full privacy and permissions disclosure](PRIVACY.md). ChatGPT markup/private endpoints can change; unavailable usage or forecast data is not fabricated.

## FAQ

**Is the global reset forecast the same as my Codex reset timer?** No. One is a probabilistic third-party outlook for irregular global goodwill events; the other is your account's usage-window reset timestamp.

**Why do some meters say “—” or “Unavailable”?** You might not be signed in, the request might have failed, or the service may not expose that value for your account. SakuraMeter does not turn missing data into a guessed quota.

**Does SakuraMeter automatically send prompts to ChatGPT?** No. Tracking and read-only refreshes do not invoke models. Optional Side Chat sends only when you explicitly submit a message or click its send-selection action.

**Is this an official OpenAI extension?** No. SakuraMeter is an independent community project, not affiliated with or endorsed by OpenAI.

## Feedback, compatibility, and verification

Found a bug or have an idea? Open a [GitHub Issue](https://github.com/YinL-k/chatgpt-codex-usage-reset-tracker/issues) with your **browser/extension versions, reproduction steps, expected behavior, and actual behavior**. Never share cookies, tokens, private chats, or sensitive screenshots.

- **Compatibility:** Chrome 116+ is the declared minimum. Other Chromium browsers need their own compatibility checks. Private API and website changes can affect features.
- **Verification:** Historical test details are in [TESTING.md](TESTING.md). The v3.6.0.66 Side Chat changes received code review and static syntax checks, but full end-to-end acceptance against an authenticated browser session remains outstanding.
- **More information:** [GitHub Releases](https://github.com/YinL-k/chatgpt-codex-usage-reset-tracker/releases) · [Release notes](RELEASE.md) · [Brand assets](BRANDING.md)

**A small tool for a clearer view of ChatGPT and Codex.** Feedback from real users helps make it more useful for the next person.
