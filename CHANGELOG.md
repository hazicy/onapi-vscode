# Changelog

All notable changes to OnAPI are documented here.

## Unreleased

### Added

- Format documents with Oxfmt in an extension worker, with a loading skeleton while the response is formatted.
- Typed panel message contract with request ids.
- Content reveal animation and skeleton placeholders in place of loading text.

### Changed

- Webview HTML applies theme-aware base colors.
- GraphQL schema loading spinner fills the panel.

## 0.0.3 - 2026-10-28

### Changed

- Lowered the minimum supported VS Code version to 1.101.0.

### Fixed

- Pressing Escape to dismiss a popup no longer discards the current selection.

### Added

- Execution state and cancellation are scoped by execution id.

## 0.0.2 - 2026-10-27

### Added

- Cancel a running request.
- Dedicated test results tab with pass counts.
- Responsive request panel with clearer empty states.

### Fixed

- Dot handling for path variables and proxy bypass.
- Dot separators in import accept and GraphQL key helpers.
- Parameter row heights align with the shared CSS variable.

## 0.0.1 - 2026-10-27

- Initial release of OnAPI for VS Code.
