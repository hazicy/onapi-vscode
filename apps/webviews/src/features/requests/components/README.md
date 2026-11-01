# Request panel components

All protocols use the same navigation and execution controls. Keep protocol data,
connection state and send handlers in each protocol; compose its UI with these components:

- `RequestTabs`: request and response tabs, using the shared Base UI tabs through
  `LineTabs`. It owns typography, sizing, active indicators, focus and overflow.
  Supply `items` with their real content. For externally controlled tab content,
  supply `activeKey`, `onChange`, `items` and `children` together.
- `RequestToolbar`: consistent row sizing for request controls and response tools.
  Place secondary actions before the primary execution action.
- `RequestAction`: the main Send / Connect / Invoke action and its Stop / Cancel /
  Disconnect state. Supply the translated label, disabled state and handler.
  Narrow panels retain an icon, accessible label and tooltip.

Use `countParams` on tab items for parameter counts and `tabBarExtraContent` for
status or secondary tools. Keep previews and filters distinct from primary panel
navigation. Do not recreate tab navigation with a protocol-specific button list,
or override these components' heights and active-state styles in a protocol.

`protocolNavigation.spec.ts` exercises the seven protocol entry points with a host
font size that differs from the legacy font token. It checks consistent tab and
action sizing, selected styling, keyboard focus/activation and panel association.
Protocol-specific browser tests cover save/revert, execution and narrow layouts.
