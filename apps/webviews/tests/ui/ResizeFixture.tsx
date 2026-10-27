import { useRef, useState } from "react";
import ResizablePanels from "@/shared/components/ResizablePanels/ResizablePanels";

export default function ResizeFixture() {
  const [direction, setDirection] = useState<"horizontal" | "vertical">(
    "horizontal",
  );
  const ref = useRef<{
    resetLayout(): void;
    setPanelGroupLayout(sizes: number[]): void;
  }>(null);
  const panelProps = {
    defaultSize: 50,
    minSize: 10,
    collapsedSize: 5,
    collapsible: true,
  };
  return (
    <main>
      <button onClick={() => ref.current?.resetLayout()}>Reset layout</button>
      <button onClick={() => ref.current?.setPanelGroupLayout([95, 5])}>
        Collapse response
      </button>
      <button
        onClick={() =>
          setDirection((current) =>
            current === "horizontal" ? "vertical" : "horizontal",
          )
        }
      >
        Change orientation
      </button>
      <section
        aria-label="Resizable request"
        style={{ width: 800, height: 400 }}
      >
        <ResizablePanels
          ref={ref}
          panelGroupProps={{ direction, autoSaveId: "resize-migration-test" }}
          leftPanelProps={{ ...panelProps, collapseTitle: "Request collapsed" }}
          rightPanelProps={{
            ...panelProps,
            collapseTitle: "Response collapsed",
          }}
          leftPanel={
            <div data-testid="request-content" style={{ height: "100%" }}>
              Request content
            </div>
          }
          rightPanel={
            <div data-testid="response-content" style={{ height: "100%" }}>
              Response content
            </div>
          }
        />
      </section>
    </main>
  );
}
