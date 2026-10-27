import { useState } from "react";
import { Table, Tree, TreeSelect, Upload, Button } from "@/shared/ui/base";
import type { DataNode } from "@/shared/ui/base";
import BasicTable from "@/shared/components/BasicTable";

const rows = [
  { id: "one", name: "First", count: 30 },
  { id: "two", name: "Second", count: 10 },
  { id: "three", name: "Third", count: 20 },
];
const columns = [
  { key: "name", dataIndex: "name", title: "Name", width: 160 },
  {
    key: "count",
    dataIndex: "count",
    title: "Count",
    width: 120,
    sorter: (a: (typeof rows)[number], b: (typeof rows)[number]) =>
      a.count - b.count,
  },
];
const nodes: DataNode[] = [
  {
    key: "folder",
    title: "Folder",
    children: [
      { key: "a", title: "Alpha" },
      { key: "b", title: "Beta" },
      { key: "disabled", title: "Disabled", disabled: true },
    ],
  },
  {
    key: "destination",
    title: "Destination",
    children: [{ key: "c", title: "Gamma" }],
  },
];
export default function DataFixture() {
  const [selection, setSelection] = useState<React.Key[]>([]);
  const [checks, setChecks] = useState<React.Key[]>([]);
  const [half, setHalf] = useState<React.Key[]>([]);
  const [drop, setDrop] = useState<any>(null);
  const [asyncNodes, setAsyncNodes] = useState<DataNode[]>([
    { key: "async", title: "Lazy folder", isLeaf: false },
  ]);
  const [loaded, setLoaded] = useState(0);
  const [choice, setChoice] = useState<any>();
  const [files, setFiles] = useState("");
  const [changes, setChanges] = useState(0);
  const [dragRows, setDragRows] = useState(rows);
  return (
    <main>
      <section aria-label="Data table">
        <Table
          dataSource={rows}
          columns={columns}
          rowKey="id"
          pagination={{ defaultPageSize: 2 }}
          rowSelection={{
            selectedRowKeys: selection,
            getCheckboxProps: (row) => ({ disabled: row.id === "two" }),
            onChange: setSelection,
          }}
        />
        <output aria-label="Selected rows">{JSON.stringify(selection)}</output>
      </section>
      <section aria-label="Resizable draggable table">
        <BasicTable
          rowKey="id"
          dataSource={dragRows}
          columns={columns}
          dragEnable
          resizableColEnable
          onDragEnd={({ active, over }) => {
            if (!over) {
              return;
            }
            const next = [...dragRows];
            const index = next.findIndex((row) => row.id === active.id);
            const target = next.findIndex((row) => row.id === over.id);
            const [moved] = next.splice(index, 1);
            next.splice(target, 0, moved);
            setDragRows(next);
          }}
        />
        <output aria-label="Row order">
          {dragRows.map((row) => row.id).join(",")}
        </output>
      </section>
      <section aria-label="Checked tree">
        <Tree
          aria-label="Files"
          checkable
          defaultExpandAll
          treeData={nodes}
          checkedKeys={checks}
          draggable
          allowDrop={({ dropNode, dropPosition }) =>
            dropPosition !== 0 || !!dropNode.children?.length
          }
          onCheck={(keys, info) => {
            setChecks(keys as React.Key[]);
            setHalf(info.halfCheckedKeys);
          }}
          onDrop={(info) =>
            setDrop({
              dragged: info.dragNode.key,
              target: info.node.key,
              gap: info.dropToGap,
              position: info.dropPosition,
            })
          }
        />
        <output aria-label="Checked keys">{JSON.stringify(checks)}</output>
        <output aria-label="Half checked keys">{JSON.stringify(half)}</output>
        <output aria-label="Tree drop">{JSON.stringify(drop)}</output>
        <Button onClick={() => setChecks([])}>Clear tree checks</Button>
      </section>
      <section aria-label="Async tree">
        <Tree
          aria-label="Async files"
          treeData={asyncNodes}
          loadData={async () => {
            setLoaded((count) => count + 1);
            setAsyncNodes([
              {
                key: "async",
                title: "Lazy folder",
                isLeaf: false,
                children: [
                  { key: "child", title: "Loaded child", isLeaf: true },
                ],
              },
            ]);
          }}
        />
        <output aria-label="Load count">{loaded}</output>
      </section>
      <section aria-label="Tree picker">
        <TreeSelect
          aria-label="Folder choice"
          value={choice}
          showSearch
          allowClear
          treeDefaultExpandAll
          fieldNames={{ value: "id", label: "name", children: "items" }}
          treeData={[
            {
              id: "root",
              name: "Root choice",
              selectable: false,
              items: [
                { id: "first", name: "First choice" },
                { id: "second", name: "Second choice" },
              ],
            },
          ]}
          onChange={setChoice}
        />
        <Button onClick={() => setChoice(undefined)}>Reset choice</Button>
        <output aria-label="Chosen folder">{choice ?? "empty"}</output>
      </section>
      <section aria-label="Local files">
        <Upload
          multiple
          accept=".json"
          maxCount={2}
          beforeUpload={(file) =>
            file.name.startsWith("ignore") ? Upload.LIST_IGNORE : false
          }
          onChange={({ fileList }) => {
            setFiles(fileList.map((file) => file.name).join(","));
            setChanges((count) => count + 1);
          }}
        >
          <Button>Choose local files</Button>
        </Upload>
        <output aria-label="File names">{files}</output>
        <output aria-label="File changes">{changes}</output>
      </section>
    </main>
  );
}
