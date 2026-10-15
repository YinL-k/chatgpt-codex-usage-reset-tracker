# SakuraMeter 3.6.0.66

- Side Chat: add an explicit one-click **Send selection** button when text is highlighted and the composer is empty. The action uses the existing native ChatGPT send path and reference safeguards.
- Respect ChatGPT's native Voice, Stop, Send, and temporarily disabled Send states. Wait at most ten seconds for Send to become available; cancel on draft, selection or route changes and preserve the unsent draft on timeout.
- Simplify the center Side Chat toolbar by removing duplicated `SakuraMeter /` text. Close extension popovers on clicks outside the menu or Escape inside the embedded chat.
- Synchronize displayed version labels and renamed repository references. Packaging and store submission continue through the existing build-once GitHub Actions pipeline.
- Important: static code inspection was completed. Synthetic browser/regression tests and live authenticated ChatGPT acceptance for this change were deferred at user request; store review or approval is separate from submission.

# SakuraMeter 3.6.0.63

- Publish the completed 3.6.0.62 feature set through the verified tag-driven Chrome and Edge release pipeline.
- Synchronize packaged version labels to 3.6.0.63; extension functionality is unchanged.
- Build one ZIP and verify its SHA-256 before GitHub Release and both store submissions.
- Store review and real-account human acceptance remain separate from automated checks.

# SakuraMeter 3.6.0.62

- Added reset-forecast notification behavior with scheduled background checks and configurable Standard / Low sensitivity modes.
- Added required `alarms` permission for background scheduling and `notifications` permission for browser/OS alerts.
- Updated Page/Selection lifecycle behavior so closing Page immediately removes pending page context, keeps Selection independent, and prevents late replies from restoring cleared state.
- Kept reset forecasts explicitly experimental: notification thresholds are product parameters, not claimed prediction accuracy.
- Automated verification passes 71/71 Node unit/background-integration tests plus dedicated browser regressions for Popup/Dashboard, Page/Selection, and the iframe send adapter.
- Human acceptance is still pending for real logged-in ChatGPT sessions and actual browser/operating-system notification display.
