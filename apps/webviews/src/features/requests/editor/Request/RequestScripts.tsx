import type { EventDefinition, ScriptDefinition } from "postman-collection";
import CodeEditor from "@/shared/components/CodeEditor/CodeEditor";
import { useState } from "react";
import { Collapse, Popconfirm } from "@/shared/ui/base";
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
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  return (
    <div className={styles.container}>
      <Collapse
        activeKey={activeKeys}
        onChange={(keys) =>
          setActiveKeys(Array.isArray(keys) ? keys.map(String) : [String(keys)])
        }
        itemClassName={styles.script}
        headerClassName={styles.header}
        triggerClassName={styles.trigger}
        panelClassName={styles.panel}
        items={selected.map((event, index) => {
          const key = event.id || String(index);
          return {
            key,
            label:
              scriptDefinition(event).name ||
              (listen === "test" ? "Tests" : "Pre-request script"),
            extra: (
              <Popconfirm
                title="Delete script?"
                onConfirm={() =>
                  onChange(events.filter((item) => item !== event))
                }
              >
                <button
                  type="button"
                  className={styles.deleteButton}
                  aria-label="Delete script"
                >
                  <AppIcon icon="trash-2" />
                </button>
              </Popconfirm>
            ),
            children: (
              <div className={styles.editor}>
                <ScriptEditor
                  event={event}
                  onChange={(value) => update(index, value)}
                />
              </div>
            ),
          };
        })}
      />
      <Button
        type="dashed"
        icon={<AppIcon icon="plus" />}
        onClick={() => {
          const id = crypto.randomUUID();
          onChange([
            ...events,
            { id, listen, script: { type: "text/javascript", exec: [""] } },
          ]);
          setActiveKeys((keys) => [...keys, id]);
        }}
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
