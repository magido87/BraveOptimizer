# Contributing

## Scope

This repository is intentionally small and build-free. Contributions should preserve that unless there is a clear operational reason to add tooling.

## Development Workflow

1. Install dependencies with `npm install`.
2. Run `npm run check` before opening a pull request.
3. Test manually in Brave using `Load unpacked`.
4. Keep changes narrowly scoped and explain any permission or host-scope changes explicitly.

## Coding Guidelines

- Prefer small, reviewable patches.
- Keep Manifest V3 compatibility intact.
- Avoid adding remote dependencies or runtime network calls.
- Reduce privileges instead of expanding them.
- Favor adapter-specific fixes over generic heuristics when site markup changes.

## Pull Requests

Please include:

- what changed
- why it changed
- which supported sites were manually tested
- whether permissions or manifest scope changed
- screenshots for UI changes when relevant

## Security-Sensitive Changes

Changes involving `manifest.json`, content script injection scope, storage import/export, or DOM restoration behavior should explain the security impact in the pull request description.
