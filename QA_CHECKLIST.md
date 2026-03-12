# Manual QA Checklist for Brave

## Load and Startup

- Open `brave://extensions`.
- Enable `Developer mode`.
- Load `/Users/s17/Desktop/Skärmavbilder/brave/BraveOptimizer` with `Load unpacked`.
- Confirm the extension loads without manifest errors.
- Confirm the popup opens and the options page opens.

## Supported Sites

Test at least one active conversation on each site you care about:

- `chatgpt.com`
- `claude.ai`
- `grok.x.ai` or `x.com/i/grok`
- `perplexity.ai`
- `gemini.google.com`

For each site:

- confirm the popup shows the correct site badge
- confirm `Trim DOM` reduces visible message count
- confirm `Restore All` restores the trimmed messages
- confirm scrolling upward restores older messages when lazy loading is enabled
- confirm `Auto-Trim` only triggers when you return to the bottom
- confirm the overlay appears, updates counts, and can be moved

## Permission and Safety Checks

- Confirm Brave shows only the `storage` permission for the extension.
- Confirm the extension is not enabled on unrelated sites.
- Confirm there are no unexpected network requests from extension scripts in DevTools.

## Regression Checks

- Change theme in the popup or options page and reload the tab; confirm the theme persists.
- Reload the browser and confirm badge behavior is still normal.
- Open multiple supported tabs and confirm actions stay tab-local.
- Use `Free Memory` and confirm the page remains usable.

## Failure Mode

- Visit an unsupported site and confirm the popup shows a disabled or unavailable state.
- Confirm there are no uncaught extension errors in the service worker or content script consoles.
