# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-07-17
### Added
- Initial release of the extension.

### Fixed
- **Context Invalidated Error**: Handled the Manifest V3 `Extension context invalidated` error silently using synchronous `try/catch` and `chrome.runtime.lastError`.
- **Notification Icon Bug**: Fixed an issue where Chrome Notifications failed to download the extension icon by using a root-relative path (`/icons/icon48.png`).
- **Accessibility Warnings**: Resolved `aria-hidden` focus trap warnings in the popup by replacing Bootstrap Modals with non-blocking Bootstrap Toasts.
- **SPA Duplication**: Prevented duplicate script injections and redundant event listeners caused by YouTube and YouTube Music's Single Page Application (SPA) navigation.
