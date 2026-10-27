import styles from "./ThemeFixture.module.css";
import { useState } from "react";
import { Button, Input, Select } from "@/shared/ui/base";
import { ThemeProvider } from "@/shared/ui/base/Theme";
import GlobalThemeStyle from "@/shared/theme/global";
import assertionStyles from "@/features/requests/components/ResponseAssert/index.module.css";
import graphqlStyles from "@/features/requests/components/Content/graphql/Debug/Request.module.css";
import sseStyles from "@/features/requests/components/Content/sse/Debug/Request.module.css";

export default function ThemeFixture() {
  const [dark, setDark] = useState(false);
  return (
    <ThemeProvider
      theme={{
        token: {
          colorPrimary: dark ? "#ff0000" : "#1677ff",
          fontSize: dark ? 14 : 12,
          fontSize14: dark ? 16 : 14,
          borderRadius: dark ? 6 : 4,
        },
      }}
    >
      <GlobalThemeStyle />
      <Button>Theme button</Button>
      <Input aria-label="Theme input" />
      <Select aria-label="Theme select" options={[]} />
      <button onClick={() => setDark((value) => !value)}>Toggle theme</button>
      <div
        data-disabled={!dark}
        style={{ color: "var(--color-primary)" }}
        className={styles.container}
      >
        Styled state
      </div>
      <span className={assertionStyles.responseAssertItem} data-passed={dark}>
        Assertion state
      </span>
      <div
        className={graphqlStyles.container}
        data-direction={dark ? "vertical" : "horizontal"}
      >
        GraphQL direction
      </div>
      <div
        className={sseStyles.container}
        data-direction={dark ? "vertical" : "horizontal"}
      >
        SSE direction
      </div>
    </ThemeProvider>
  );
}
