# Security Policy

## Supported Surface

This extension is intended to run only on the hostnames declared in `manifest.json`. Broad wildcard access is considered a security regression unless there is a documented and reviewed need.

## Reporting

If you find a security issue, open a private report with the maintainer before publishing details publicly.

Include:

- affected version or commit
- impact summary
- reproduction steps
- screenshots or console output if helpful

## Security Expectations for Changes

- No remote code execution paths.
- No external network requests from extension runtime code.
- No use of `eval`, `new Function`, or dynamic script injection.
- No expansion to `<all_urls>` or broad host access without a strong justification.
- Prefer DOM node cloning over reparsing stored HTML when restoring content.

## Current Risk Notes

- The extension manipulates live third-party page DOMs that can change without notice, so selector drift remains an operational risk.
- Trimmed content remains in local memory for restoration during the active page session.
