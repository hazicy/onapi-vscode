import { useState } from "react";
import { AutoComplete } from "@/shared/ui/base";

export default function AutocompleteFixture() {
  const [value, setValue] = useState("");
  const scrollable = new URLSearchParams(location.search).has("scroll");
  return (
    <main
      style={
        scrollable
          ? { height: 180, overflow: "auto", marginTop: 100 }
          : undefined
      }
    >
      {scrollable && <div style={{ height: 60 }} />}
      <AutoComplete
        style={{ width: 400 }}
        showArrow
        placeholder="Header name"
        value={value}
        onChange={setValue}
        options={["Content-Type", "Accept"].map((value) => ({
          value,
          label: value,
        }))}
      />
      <button>Outside</button>
      <output aria-label="Current value">{value}</output>
      {scrollable && <div style={{ height: 1000 }} />}
    </main>
  );
}
