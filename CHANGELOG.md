# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.3] - 2026-06-10

### Fixed
- The **Supr / forward Delete** key (`\x1b[3~`) now clears a step back to default
  in the TUI, like Backspace. Previously only Backspace worked, so pressing Supr
  did nothing.

## [0.1.2] - 2026-06-10

### Changed
- CI is now a complete release pipeline: the GitHub Release (with notes from
  this changelog) is created automatically alongside the npm publish.

## [0.1.1] - 2026-06-10

### Changed
- Releases are now published automatically from GitHub Actions with npm
  **provenance** (SLSA) when a `v*` tag is pushed.

## [0.1.0] - 2026-06-08

### Added
- TUI configurator (`speckit-model-router`) to assign an AI model per spec-kit
  (SDD) step, stored per-user and applied globally across projects.
- Global opencode plugin that intercepts `/speckit.*` commands and re-dispatches
  them on the chosen model, leaving the session and `opencode.json` untouched.
- Per-step **clear** (Delete/Backspace) to reset a step back to default
  ("not set"); on the "Model for all" row it clears every step.
- **Uninstall / revert** with no residue: `U` in the TUI and the `--uninstall`
  CLI flag (with `--yes`/`-y`), behind a confirmation modal. Removes only the
  plugin file and the model map.
- `OPENCODE_CONFIG_DIR` is honoured when resolving the config directory.
- Cross-platform tool detection (`which`/`where`, no shell) — Windows code path
  is in place but not yet verified.

[Unreleased]: https://github.com/sergiojtsm/speckit-model-router/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/sergiojtsm/speckit-model-router/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/sergiojtsm/speckit-model-router/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/sergiojtsm/speckit-model-router/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/sergiojtsm/speckit-model-router/releases/tag/v0.1.0
