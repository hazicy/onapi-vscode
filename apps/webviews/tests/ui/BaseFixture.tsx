import styles from "../../src/shared/ui/Empty.module.css";
import { useState, type CSSProperties } from "react";

import {
  App,
  Button,
  Empty,
  Input,
  InputNumber,
  Select,
  Checkbox,
  Radio,
  Switch,
  Tabs,
  Collapse,
  Field,
  Table,
  Tree,
  TreeSelect,
  Dropdown,
  Modal,
  Upload,
  message,
} from "@/shared/ui/base";

function Content() {
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [radio, setRadio] = useState("a");
  const [enabled, setEnabled] = useState(false);
  const [number, setNumber] = useState<number | null>(2);
  const [selected, setSelected] = useState<string[]>([]);
  const [menu, setMenu] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [files, setFiles] = useState("");
  const [tree, setTree] = useState("");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  return (
    <>
      <section aria-label="Module styles">
        <Button size="small">Small module button</Button>
        <Button size="large">Large module button</Button>
        <div
          style={
            {
              "--vscode-tab-unfocusedInactiveForeground": "rgb(10, 20, 30)",
            } as CSSProperties
          }
          className={styles.container}
        >
          <Empty
            description="Styled empty description"
            className={styles.empty}
            descriptionClassName={styles.emptyDescription}
          />
        </div>
        <Empty
          description="Plain empty description"
          style={{ color: "rgb(4, 5, 6)" }}
        />
      </section>
      <section aria-label="Controls">
        <Input
          aria-label="Text value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          allowClear
        />
        <Select
          aria-label="Search choice"
          showSearch
          options={[
            { value: "one", label: "First option" },
            { value: "two", label: "Second option" },
          ]}
          onChange={(v) => setValue(v)}
        />
        <Select
          aria-label="Multiple choices"
          mode="multiple"
          options={[
            { value: "a", label: "Alpha" },
            { value: "b", label: "Beta" },
          ]}
          value={selected}
          onChange={setSelected}
        />
        <Checkbox
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        >
          Accept terms
        </Checkbox>
        <Switch
          aria-label="Enable feature"
          checked={enabled}
          onChange={setEnabled}
        />
        <Radio.Group
          value={radio}
          onChange={(e) => setRadio(e.target.value)}
          options={[
            { value: "a", label: "Mode A" },
            { value: "b", label: "Mode B" },
          ]}
        />
        <InputNumber
          aria-label="Quantity"
          value={number}
          onChange={setNumber}
        />
        <output aria-label="Control result">
          {JSON.stringify({ value, checked, radio, enabled, number, selected })}
        </output>
      </section>
      <Tabs
        items={[
          { key: "first", label: "First tab", children: "First panel" },
          { key: "second", label: "Second tab", children: "Second panel" },
        ]}
      />
      <Collapse
        items={[
          {
            key: "details",
            label: "Expand details",
            children: "Expanded content",
          },
        ]}
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setNameError(name.trim() ? "" : "Name is required");
          if (name.trim()) {
            setSubmitted(name);
          }
        }}
      >
        <Field id="required-name" label="Required name" error={nameError}>
          <Input
            id="required-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Button htmlType="submit">Save form</Button>
      </form>
      <output aria-label="Submitted value">{submitted}</output>
      <Table
        rowKey="id"
        dataSource={[
          { id: "1", name: "First row" },
          { id: "2", name: "Second row" },
        ]}
        columns={[{ key: "name", dataIndex: "name", title: "Name" }]}
        rowSelection={{ onChange: (keys) => setTree(keys.join(",")) }}
      />
      <output aria-label="Row selection">{tree}</output>
      <Tree
        checkable
        defaultExpandAll
        treeData={[
          {
            key: "root",
            title: "Parent node",
            children: [{ key: "leaf", title: "Leaf node" }],
          },
        ]}
        onCheck={(keys) => setTree(JSON.stringify(keys))}
      />
      <Dropdown
        trigger={["click"]}
        menu={{
          items: [{ key: "item", label: "Run menu action" }],
          onClick: (info) => setMenu(info.key),
        }}
      >
        <Button>Open menu</Button>
      </Dropdown>
      <output aria-label="Menu result">{menu}</output>
      <Dropdown
        trigger={["contextMenu"]}
        menu={{
          items: [{ key: "context", label: "Run context action" }],
          onClick: (info) => setMenu(info.key),
        }}
      >
        <Button>Context target</Button>
      </Dropdown>
      <Select
        aria-label="Tag values"
        mode="tags"
        tokenSeparators={[","]}
        value={selected}
        onChange={setSelected}
      />
      <TreeSelect
        aria-label="Tree choice"
        treeDefaultExpandAll
        treeData={[
          {
            value: "parent",
            title: "Parent choice",
            children: [{ value: "leaf", title: "Leaf choice" }],
          },
        ]}
        onChange={setValue}
      />
      <Button
        onClick={async () =>
          setMenu(
            String(
              await Modal.confirm({
                title: "Await confirmation",
                content: "Resolve confirmation",
              }),
            ),
          )
        }
      >
        Await confirmation
      </Button>
      <Button
        onClick={() =>
          Modal.confirm({
            title: "Confirm action",
            content: "Proceed with action?",
            onOk: () => setMenu("confirmed"),
          })
        }
      >
        Open confirmation
      </Button>
      <Button onClick={() => message.success("Saved successfully")}>
        Show toast
      </Button>
      <Upload
        beforeUpload={() => false}
        onChange={(info) => setFiles(info.file.name)}
        showUploadList={false}
      >
        <Button>Choose file</Button>
      </Upload>
      <output aria-label="Uploaded name">{files}</output>
    </>
  );
}
export default function BaseFixture() {
  return (
    <App>
      <Content />
    </App>
  );
}
