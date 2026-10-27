import { useState } from "react";
import type { HttpEditorEvent } from "@onapi/domain/requests/record";
import RequestScripts from "@/features/requests/editor/Request/RequestScripts";
import LineTabs from "@/shared/components/LineTabs/LineTabs";

export default function RequestScriptsFixture() {
  const [events, setEvents] = useState<HttpEditorEvent[]>([
    {
      id: "pre",
      listen: "prerequest",
      script: { exec: ["console.log('before')"] },
    },
    { id: "post", listen: "test", script: { exec: ["console.log('after')"] } },
  ]);
  return (
    <div style={{ height: 600, width: 800 }}>
      <LineTabs
        items={[
          {
            key: "pre",
            label: "Pre-request",
            children: (
              <RequestScripts
                listen="prerequest"
                events={events}
                onChange={setEvents}
              />
            ),
          },
          {
            key: "post",
            label: "Post-response",
            children: (
              <RequestScripts
                listen="test"
                events={events}
                onChange={setEvents}
              />
            ),
          },
        ]}
      />
      <output aria-label="Script events">{JSON.stringify(events)}</output>
    </div>
  );
}
