import { createRef } from "react";
import {
  Button,
  Input,
  Select,
  Switch,
  Table,
  Tree,
  type InputRef,
} from "../../src/shared/ui/base";

// This file is checked by typecheck:e2e. Unsupported attributes and incorrect
// callbacks must stay errors even when the controls are wrapped in forwardRef.
const inputRef = createRef<InputRef>();
const rows = [{ id: "request", name: "Request" }];
export const validControls = [
  <Button aria-label="Send" onClick={(event) => event.preventDefault()} />,
  <Input ref={inputRef} onChange={(event) => event.target.value.trim()} />,
  <Select<string> value="http" onSelect={(value) => value.toUpperCase()} />,
  <Switch checked onChange={(checked) => checked.valueOf()} />,
  <Tree
    treeData={[{ key: "request", requestId: "1" }]}
    titleRender={(node) => node.requestId}
  />,
  <Table
    dataSource={rows}
    columns={[{ key: "name", render: (_value, row) => row.name }]}
  />,
];

// @ts-expect-error Unknown button attributes cannot bypass prop checking.
export const misspelledButtonProp = <Button laoding />;
// @ts-expect-error Search behavior belongs to input/select controls.
export const unrelatedCallback = <Button onSearch={() => {}} />;
// @ts-expect-error Input changes receive DOM events, not strings.
export const wrongInputCallback = <Input onChange={(value: string) => value} />;
export const wrongSelectCallback = (
  // @ts-expect-error Select callbacks preserve the selected value type.
  <Select<string> onSelect={(value: number) => value} />
);
// @ts-expect-error Switches use checked state.
export const oldSwitchValue = <Switch value />;
// @ts-expect-error Tree props have no arbitrary extension keys.
export const misspelledTreeProp = <Tree defaultExpanAll />;
// @ts-expect-error Pagination accepts only supported options.
export const misspelledPagination = <Table pagination={{ pageSzie: 20 }} />;
export const misspelledSelection = (
  // @ts-expect-error Selection options have no arbitrary extension keys.
  <Table rowSelection={{ hideSelectAl: true }} />
);
export const wrongTableRecord = (
  // @ts-expect-error Row callbacks retain the inferred record type.
  <Table dataSource={rows} onRow={(row: { missing: boolean }) => ({})} />
);
