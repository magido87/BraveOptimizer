# Changelog

## 1.0.0

### Changed

- narrowed the extension to explicitly supported AI chat sites
- removed broad permissions and unused web-accessible resources
- removed stale Bard support and unrelated wildcard targets
- disabled the generic fallback adapter to avoid unsafe DOM mutations on unsupported layouts
- hardened DOM restoration to reuse cloned nodes instead of reparsing stored HTML
- fixed background initialization so listeners are not registered multiple times
- synchronized theme persistence through the settings store

### Added

- `LICENSE`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `QA_CHECKLIST.md`
- `REPOSITORY_METADATA.md`
- minimal `eslint` and `prettier` setup with npm scripts
