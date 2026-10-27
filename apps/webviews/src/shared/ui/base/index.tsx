export * from "./Button";
export * from "./Input";
export * from "./Checkbox";
export * from "./Switch";
export * from "./Radio";
export * from "./InputNumber";
export * from "./Collapse";
export * from "./Tabs";
export * from "./Segmented";
export * from "./Select";
export * from "./AutoComplete";
export * from "./Flex";
export * from "./Space";
export * from "./Row";
export * from "./Col";
export * from "./Divider";
export * from "./Empty";
export * from "./Spin";
export * from "./Skeleton";
export * from "./Typography";
export * from "./Tag";
export * from "./Badge";
export * from "./Alert";
export * from "./Progress";
export * from "./List";
export * from "./DatePicker";
export * from "./Tooltip";
export * from "./Popover";
export * from "./Dropdown";
export * from "./Menu";
export * from "./Popconfirm";
export * from "./Field";
export * from "./Table";
export * from "./Tree";
export * from "./TreeSelect";
export * from "./Upload";
export * from "./App";
export { Modal, modal } from "./Modal";
export { message, notification } from "./Toast";
import { ThemeProvider, useThemeConfig } from "./Theme";
import type { ThemeConfig } from "./Theme";
import type { UIProps } from "./types";
export * from "./types";

export { theme, ThemeProvider } from "./Theme";
export { Drawer } from "../Drawer";

export function ConfigProvider({
  theme = {},
  children,
}: UIProps & { theme?: ThemeConfig }) {
  const parent = useThemeConfig();
  return (
    <ThemeProvider
      theme={{
        ...parent,
        ...theme,
        token: { ...parent.token, ...theme.token },
        components: {
          Table: { ...parent.components?.Table, ...theme.components?.Table },
        },
      }}
    >
      {children}
    </ThemeProvider>
  );
}
