# Webview source layout

Browser code is organized by product feature. Shared request definitions and
configuration types live in `@onapi/domain`; cross-process events live in
`@onapi/contracts`. See [workspace ownership](../../../docs/monorepo.md).

```text
src/
  app/
    webviews/                 # React entry points and VS Code bridge setup
    store/                    # Application state only (global and storage)
  features/
    requests/                 # Request workspace and execution
      editor/                 # Request fields, auth, body and URL editing
      response/               # Response content, metadata and execution details
      assertions/             # Assertion configuration and results
      scripts/                # Request scripts
      graphql/                # GraphQL query editing and contexts
      protocols/              # HTTP, GraphQL, SSE, WebSocket and Socket.IO views
      code-generation/        # Code generation drawer
      variables/              # Request variable extraction
      execution/              # Execution events and state transitions
      store/                  # Request state
    collections/              # Collection tree and folder settings
    environment/              # Environments, cookies and parameters
    testing/                  # Collection runs and reports
    schemas/                  # JSON Schema editing
    import/                   # Import and migration
    export/                   # Export formats and previews
    sync/                     # Push, conflicts and version comparison
    sharing/                  # Sharing and shared documents
    project/                  # Project configuration
    auth/                     # Login and user configuration
    settings/                 # Application settings
    variables/                # Variable inputs and insertion
    documentation/            # Documentation view
    curl/                     # cURL tools
  shared/
    ui/                       # UI primitives
    components/               # Reusable composed components and editors
    hooks/                    # Generic React hooks
    utils/                    # General utilities
    services/                 # Service transport
    assets/                   # Shared images and styles
    locale/                   # Localization
    theme/                    # Theme configuration
    contexts/                 # Shared React contexts
    state/                    # Generic store factory and UI services
    types/                    # Common types
    constants/                # Common constants
```

## Naming and imports

- Use PascalCase for React component names, component files and component folders:
  `EditItem.tsx`, `components/ImportData/ImportData.tsx`.
- Keep a standalone component and its stylesheet side by side as `Component.tsx`
  and `Component.module.css`; do not add a folder containing only that pair.
- Keep component folders when they contain supporting logic or subcomponents.
  Name the implementation after the component (`ImportData.tsx`), with a matching
  stylesheet (`ImportData.module.css`). Reserve `index.ts` for deliberate public
  exports; do not add one to every component directory.
- Keep a single hook or store in a named file such as `hooks/useApisHotkeys.ts`
  or `store/useSchemas.ts`, without a same-named wrapper directory. Create
  category directories only when needed; do not create empty placeholders.
- Keep private components, hooks, types and constants beside their owner. A
  private child does not need another `components/` or `hooks/` wrapper.
- Group large features by responsibility before adding technical categories.
  Request protocol screens belong in `requests/protocols/<protocol>/`; folder
  editing belongs in `collections/components/FolderEditor/`.
- Keep business components in their owning feature, including components used
  by other features. Promote code to `shared/` only when it has no feature-specific
  behavior or application-state dependency. Basic controls belong in `shared/ui/`;
  reusable composed components and editors belong in `shared/components/`.
- Hooks keep the `useSomething` convention. New ordinary utility, context and
  service modules use kebab-case filenames that describe their role. Existing
  modules can adopt this convention when reorganized.
- Put feature-specific code in `features/<feature>/`, with `components/`, `store/`,
  `hooks/`, `types/`, `constants/`, `events/` and `utils/` as needed.
- Import feature components and hooks from their feature paths; do not re-export
  them from shared barrels. Shared barrels expose reusable building blocks only.
- Import feature stores directly from their owning feature. `app/store` exposes
  application state only; `shared/state/store` owns the reusable Zustand factory,
  and `shared/state/ui-services` owns common modal and notification services.
- Keep variable insertion context in `features/variables/contexts` and Schema
  conversion tools in `features/schemas/utils`, beside their owning features.
- Shared code must not introduce dependencies on `features/` or `app/`.
  `pnpm check:boundaries` enforces this for alias and relative imports. Existing
  dependencies are tracked individually in
  [boundary exceptions](../../../tooling/webview-boundary-exceptions.json);
  remove an exception when its dependency is removed. The check rejects stale
  exceptions as well as new dependencies.
- Use `@/features/...`, `@/shared/...` and `@/app/...` for cross-directory imports.
  Relative imports are suitable within a component or feature.
- Import Lodash utilities as named exports from `lodash-es` in browser code;
  no build-time import rewriting is needed.
- Public panel IDs and generated bundle names remain camelCase. Their source
  files under `app/webviews/` use PascalCase in both Vite and development URLs.

## CSS Modules

- Use `container` for composed component roots, with short local names such as
  `item`, `header`, `title`, `toolbar`, and `actions`. CSS Modules provide scope;
  avoid repeating component names or parent roles (`itemContainer` → `item`).
- Prefer full words (`button`, `text`) to abbreviations or implementation names
  (`btn`, `typography`). Add context only to distinguish roles, such as
  `titleInput` and `searchInput`; name elements for their purpose rather than
  generic `wrap` or `box` layers.
- Bind local classes directly to the elements they style. Keep ordinary rules
  flat; nest interaction and state selectors when useful, and retain ancestor
  selectors only when the relationship actually changes the appearance.
- Keep necessary nesting shallow (one or two levels); avoid selectors that
  encode the full DOM hierarchy. Use `data-*` or native pseudo-classes for states.
- Keep component appearance and interaction styles inside the component.
  Callers use `className` for layout and spacing; recurring visual variants use
  typed props such as `size` and `variant`, rather than repeated overrides.
- Avoid `!important`. Use variables for themes, supported customization, and
  genuinely shared values; keep one-off local dimensions as direct values.
- Use pseudo-classes or `data-*` attributes for states, and CSS custom
  properties for dynamic values and component customization.
- Match stylesheet names to their component files: `Modal.tsx` uses
  `Modal.module.css`, including components kept in their own directories.
- Keep each primitive implementation next to its matching stylesheet; do not
  collect unrelated components into grouped implementation files.
- Keep default and state styles inside the owning component. Accept `className`
  on the root; expose named className props only for parts that need customization.
- Pass local module classes explicitly. Do not share empty class registries or
  reach into another component using shared selector names.
- Do not add compatibility marker classes. Use module exports for styling
  and accessible roles and names for test locators.
- Apply module classes directly to elements and existing UI components. Do not
  introduce style wrapper components or wrapper-only TypeScript modules.
- The production build lowers CSS nesting for Chromium 102, matching the
  minimum supported VS Code version.
