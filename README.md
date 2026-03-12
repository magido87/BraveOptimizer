# BraveOptimizer

BraveOptimizer is a Manifest V3 browser extension that improves responsiveness on supported AI chat sites by trimming older conversation nodes from the live DOM and restoring them on demand.

The project is intentionally small:

- no build step
- no analytics
- no remote code
- no network requests from the extension

![Overlay widget on ChatGPT](screenshots/overlay-chatgpt.png)

## Supported Sites

The extension is scoped to the AI chat sites that are implemented in the repository and still appear intentionally supported by the codebase:

- ChatGPT (`chatgpt.com`)
- Claude (`claude.ai`)
- Grok (`grok.x.ai`, `x.com/i/grok`)
- Perplexity (`perplexity.ai`, `www.perplexity.ai`)
- Gemini (`gemini.google.com`)

Legacy or unrelated targets such as `bard.google.com`, generic wildcard hosts, social feeds, and broad catch-all page access have been removed.

## Architecture

The extension is organized into a few small runtime layers:

- `manifest.json`: MV3 entry point, permissions, and content script registration
- `background.js`: service worker for badge state and tab coordination
- `content/`: site detection, DOM trimming, lazy restoration, and performance controls
- `content/site-adapters/`: site-specific selectors and heuristics for each supported AI chat UI
- `popup/`: quick controls for the active tab
- `options/`: persistent settings UI
- `overlay/`: optional in-page widget
- `utils/`: shared configuration and storage helpers

The core runtime flow is:

1. A content script loads only on supported hostnames.
2. `SiteDetector` selects a concrete adapter for the current site.
3. `DOMTrimmer` replaces older message nodes with placeholders while preserving detached clones in memory.
4. `LazyLoader` restores messages as the user scrolls upward.
5. `PerformanceBoost` applies optional CSS and resource throttling.

## Installation

### macOS / Brave

1. Clone the repository:

```bash
git clone https://github.com/magido87/BraveOptimizer.git
cd BraveOptimizer
```

2. Install the development checks if you want linting and formatting:

```bash
npm install
```

3. Open Brave and navigate to `brave://extensions`.
4. Enable `Developer mode`.
5. Click `Load unpacked`.
6. Select this folder:

```text
/Users/s17/Desktop/Skärmavbilder/brave/BraveOptimizer
```

There is no build output folder. Load the repository root.

## Usage

- Open a supported AI chat site.
- Click the extension icon to open the popup.
- Use `Trim DOM` to remove older rendered messages.
- Use `Restore All` to reinsert all trimmed messages.
- Toggle `Auto-Trim`, `Lazy Loading`, or `Performance Boost` as needed.

Default hotkeys:

- `Alt+T`: trim
- `Alt+R`: restore
- `Alt+A`: toggle auto-trim
- `Alt+P`: toggle performance boost
- `Alt+O`: toggle overlay

## Privacy and Security Notes

- The extension stores settings and lightweight statistics in `chrome.storage.local`.
- It does not send chat content to any server.
- It does not inject remote scripts.
- It now requests only the `storage` permission.
- It no longer declares broad `host_permissions` or `<all_urls>` web-accessible resources.

Important limitation:

- Trimmed messages are retained in page memory as detached DOM clones for local restoration. That reduces live DOM pressure, but it does not provide secure deletion of page content.

## Development

Install dependencies and run checks:

```bash
npm install
npm run check
```

Available scripts:

- `npm run lint`
- `npm run format`
- `npm run format:check`
- `npm run check`

## Benchmarks

Benchmark placeholders for future updates:

- Conversation size before/after trimming
- DOM node count before/after trimming
- Scroll latency before/after trimming
- Memory usage snapshots in Brave Task Manager

No benchmark numbers are committed yet in this hardening pass.

## Manual QA

See [QA_CHECKLIST.md](/Users/s17/Desktop/Skärmavbilder/brave/BraveOptimizer/QA_CHECKLIST.md).

## Contributing

See [CONTRIBUTING.md](/Users/s17/Desktop/Skärmavbilder/brave/BraveOptimizer/CONTRIBUTING.md).

## Security

See [SECURITY.md](/Users/s17/Desktop/Skärmavbilder/brave/BraveOptimizer/SECURITY.md).

## Changelog

See [CHANGELOG.md](/Users/s17/Desktop/Skärmavbilder/brave/BraveOptimizer/CHANGELOG.md).

## License

MIT. See [LICENSE](/Users/s17/Desktop/Skärmavbilder/brave/BraveOptimizer/LICENSE).
