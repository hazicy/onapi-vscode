import { useState } from "react";
import { ConfigProvider, Select } from "@/shared/ui/base";
import CustomDrawer, { Drawer } from "@/shared/ui/Drawer";
import { getPopupContainer } from "@/shared/utils/popupContainer";

export default function DrawerFixture() {
  const query = new URLSearchParams(location.search);
  const [open, setOpen] = useState(false);
  const [nestedOpen, setNestedOpen] = useState(false);
  const [closes, setCloses] = useState(0);
  const [complete, setComplete] = useState("");
  const [selected, setSelected] = useState("");
  const Component = query.has("named") ? Drawer : CustomDrawer;
  return (
    <ConfigProvider getPopupContainer={getPopupContainer}>
      <button onClick={() => setOpen(true)}>Open drawer</button>
      <output aria-label="Close count">{closes}</output>
      <output aria-label="Transition complete">{complete}</output>
      <Component
        open={open}
        title="Test drawer"
        width={query.has("width") ? Number(query.get("width")) : undefined}
        height={240}
        placement={
          (query.get("side") || "right") as "right" | "left" | "top" | "bottom"
        }
        {...(query.has("dismissible")
          ? { keyboard: true, maskClosable: true }
          : {})}
        mask={!query.has("no-mask")}
        destroyOnClose={query.has("destroy")}
        forceRender={query.has("force")}
        styles={{ body: { padding: 0 } }}
        extra={<button onClick={() => setSelected("copied")}>Copy code</button>}
        footer={<button onClick={() => setOpen(false)}>Done</button>}
        onClose={() => {
          setCloses((value) => value + 1);
          setOpen(false);
        }}
        afterOpenChange={(value) => setComplete(String(value))}
      >
        <label>
          Draft
          <input aria-label="Draft" defaultValue="initial" />
        </label>
        <Select
          showSearch
          aria-label="Legacy select"
          placeholder="Choose option"
          value={selected || undefined}
          onChange={setSelected}
          options={[{ value: "chosen", label: "Chosen option" }]}
        />
        <output aria-label="Selected option">{selected}</output>
        <button onClick={() => setNestedOpen(true)}>Open nested drawer</button>
        <CustomDrawer
          title="Nested drawer"
          width={300}
          keyboard
          open={nestedOpen}
          onClose={() => setNestedOpen(false)}
        >
          Nested content
        </CustomDrawer>
      </Component>
    </ConfigProvider>
  );
}
