# Regression tests

This directory is the private `@onapi/tests` workspace. Run `pnpm test:unit`
from the repository root; generated bundles are written to `test-results/`.
Declare libraries imported by test fixtures in this workspace's `package.json`,
even when an application also uses them. Application dependencies remain in
their own manifests. The root manifest contains shared development tools only.

| Directory               | Owner or scope                                          |
| ----------------------- | ------------------------------------------------------- |
| `webviews/`             | UI state, editor data and request presentation          |
| `extension/`            | Host lifecycle, panels, trees and persistence           |
| `domain/`               | Models and pure business utilities                      |
| `api-converter/`        | Import/export formats and conversion                    |
| `runtime/`              | Worker execution and protocol integration               |
| `workspace/`            | Package boundaries, assembly and cross-workspace wiring |
| `helpers/`, `fixtures/` | Shared loaders, mocks and fixture data                  |

All test directories use `tests`. The `.test.mjs` regressions use Node's test
runner and an explicit TypeScript source loader for host/UI mocks; `.ts` is used
for Playwright tests, protocol test bundles and compile-time contract assertions.
These extensions describe different execution methods rather than alternative
styles for the same runner.

Browser tests remain in [Webviews](../apps/webviews/tests/README.md), VS Code
host and socket tests in [Extension](../apps/extension/tests), and type-only
contract assertions in [Contracts](../packages/contracts/tests). Contract
assertions run with `pnpm --dir packages/contracts typecheck`; socket suites run
with `pnpm test:websocket` and `pnpm test:socketio`.
