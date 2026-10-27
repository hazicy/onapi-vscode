import { useState } from "react";
import Request from "@/features/requests/components/Request";

export default function BodyFixture() {
  const [item, setItem] = useState<any>({
    id: "body-test",
    kind: "api",
    name: "Body test",
    request: { method: "POST", url: "https://example.test" },
  });
  return (
    <main style={{ height: 500 }}>
      <Request
        apiData={item}
        requestData={item.request}
        onRequestDataChange={(request) => setItem({ ...item, request })}
        onItemChange={setItem}
        includesTabs={["Headers", "Body"]}
        tabOptions={{ defaultActiveKey: "Body" }}
      />
      <output aria-label="Body data">
        {JSON.stringify(item.request.body ?? null)}
      </output>
    </main>
  );
}
