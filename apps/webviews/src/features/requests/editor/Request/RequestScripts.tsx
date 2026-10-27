import type { EventDefinition, ScriptDefinition } from "postman-collection";
import CodeEditor from "@/shared/components/CodeEditor/CodeEditor";
import SortableCollapse from "@/shared/components/SortableCollapse/SortableCollapse";
import Button from "@/shared/ui/Button";
import AppIcon from "@/shared/ui/AppIcon";
import styles from "./RequestScripts.module.css";

// Postman events are edited in place; no task compiler runs when sending.
export default function RequestScripts({
  listen,
  events,
  onChange,
}: {
  listen: string;
  events: EventDefinition[];
  onChange: (events: EventDefinition[]) => void;
}) {
  const selected = events.filter((event) => event.listen === listen);
  const update = (index: number, event: EventDefinition) => {
    const next = [...events];
    next[events.indexOf(selected[index])] = event;
    onChange(next);
  };
  return (
    <div className={styles.container}>
      <SortableCollapse
        rowKey="id"
        sortable={false}
        isTree={false}
        showOrderNumber={false}
        sortItemList={selected.map((event, index) => ({
          ...event,
          id: event.id || String(index),
        }))}
        customHeader={(event: EventDefinition) => (
          <span>
            {scriptDefinition(event).name ||
              (listen === "test" ? "Tests" : "Pre-request script")}
          </span>
        )}
        customContent={(event: EventDefinition) => {
          const index = selected.findIndex(
            (item, i) => (item.id || String(i)) === event.id,
          );
          return (
            <ScriptEditor
              event={selected[index]}
              onChange={(value) => update(index, value)}
            />
          );
        }}
        defaultTools={{
          onDelete: (event: EventDefinition) =>
            onChange(
              events.filter(
                (item) =>
                  item !==
                  selected.find(
                    (item, i) => (item.id || String(i)) === event.id,
                  ),
              ),
            ),
        }}
      />
      <Button
        size="large"
        type="dashed"
        icon={<AppIcon icon="plus" />}
        onClick={() =>
          onChange([
            ...events,
            {
              id: crypto.randomUUID(),
              listen,
              script: { type: "text/javascript", exec: [""] },
            },
          ])
        }
        className={styles.addButton}
      >
        Add script
      </Button>
    </div>
  );
}

function ScriptEditor({
  event,
  onChange,
}: {
  event: EventDefinition;
  onChange: (event: EventDefinition) => void;
}) {
  const script = scriptDefinition(event);
  const exec = script.exec;
  return (
    <CodeEditor
      value={Array.isArray(exec) ? exec.join("\n") : exec || ""}
      language="javascript"
      onChange={(value) =>
        onChange({
          ...event,
          script: {
            ...scriptDefinition(event),
            type: "text/javascript",
            exec: value.split("\n"),
          },
        })
      }
    />
  );
}

function scriptDefinition(event: EventDefinition): ScriptDefinition {
  const script = event.script;
  return typeof script === "string"
    ? { exec: [script] }
    : Array.isArray(script)
      ? { exec: script }
      : script;
}
