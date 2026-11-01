import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AiResponseSummary } from "@onapi/contracts";
import type { AiProvider, AiMessage } from "@onapi/domain/requests/ai-mcp";
import type { AiEditorRecord } from "@onapi/domain/requests/record";
import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import { useProtocolExecution } from "../../execution/useProtocolExecution";
import { parseAiConfig } from "../shared/request-input";

type Run = {
  provider: AiProvider;
  model: string;
  startedAt: number;
  cancelled: boolean;
  summary?: AiResponseSummary;
};

export function useAiConversation(
  record: AiEditorRecord,
  change: (record: AiEditorRecord) => void,
  keys: Partial<Record<AiProvider, string>>,
) {
  const { t } = useTranslation();
  const label = (key: string) => t(`ai_panel.${key}`);
  const [partial, setPartial] = useState({ text: "", reasoning: "" });
  const [outcome, setOutcome] = useState("");
  const streamed = useRef({ text: "", reasoning: "" });
  const run = useRef<Run | null>(null);
  const conversation = useRef(record.ai.messages);
  const latest = useRef({ record, change });
  latest.current = { record, change };
  const execution = useProtocolExecution(record.id, ({ event }) => {
    if (event.protocol !== "ai") {
      return;
    }
    if (event.type === "response.chunk") {
      const channel = event.channel === "reasoning" ? "reasoning" : "text";
      streamed.current = {
        ...streamed.current,
        [channel]: streamed.current[channel] + event.text,
      };
      setPartial(streamed.current);
    }
    if (event.type === "response.received" && run.current) {
      run.current.summary = event.value;
    }
    if (event.type === "execution.cancelled") {
      if (run.current) {
        run.current.cancelled = true;
      }
      setOutcome(label("cancelled"));
    }
    if (
      event.type === "execution.completed" ||
      event.type === "execution.cancelled"
    ) {
      const current = latest.current;
      const { text, reasoning } = streamed.current;
      const info = run.current;
      if (
        info &&
        (text || reasoning || info.summary) &&
        JSON.stringify(current.record.ai.messages) ===
          JSON.stringify(conversation.current)
      ) {
        const state =
          event.type === "execution.completed" && event.failed
            ? "failed"
            : info.cancelled
              ? "cancelled"
              : "completed";
        current.change({
          ...current.record,
          ai: {
            ...current.record.ai,
            messages: [
              ...current.record.ai.messages,
              {
                role: "assistant",
                content: text,
                ...(reasoning ? { reasoning } : {}),
                result: {
                  provider: info.provider,
                  model: info.model,
                  state,
                  completedAt: Date.now(),
                  durationMs:
                    info.summary?.durationMs ??
                    Math.round(performance.now() - info.startedAt),
                  finishReason: info.summary?.finishReason ?? state,
                  usage: info.summary?.usage ?? {},
                },
              },
            ],
          },
        });
      }
      run.current = null;
      streamed.current = { text: "", reasoning: "" };
      setPartial(streamed.current);
    }
  });
  const send = (retry = false) => {
    if (execution.busy || (!retry && !record.ai.prompt.trim())) {
      return;
    }
    execution.start((requestId) => {
      const config = parseAiConfig(record);
      if (!config.model.trim()) {
        throw new Error(label("model_required"));
      }
      if (!record.url?.trim()) {
        throw new Error(label("url_required"));
      }
      const messages: AiMessage[] = retry
        ? config.messages.at(-1)?.role === "assistant"
          ? config.messages.slice(0, -1)
          : config.messages
        : [...config.messages, { role: "user", content: config.prompt }];
      if (!messages.length) {
        throw new Error(label("message_required"));
      }
      conversation.current = messages;
      run.current = {
        provider: config.provider,
        model: config.model,
        startedAt: performance.now(),
        cancelled: false,
      };
      change({ ...record, ai: { ...record.ai, messages } });
      streamed.current = { text: "", reasoning: "" };
      setPartial(streamed.current);
      setOutcome("");
      return {
        action: "ai_send",
        requestId,
        data: {
          id: record.id,
          url: record.url,
          apiKey: keys[config.provider] || "",
          config: { ...config, messages },
        },
      };
    });
  };
  const stop = () => {
    const executionId = execution.activeId();
    if (executionId) {
      sendRequestPanelMessage({ action: "ai_stop", data: { executionId } });
    }
  };
  const clear = () => {
    change({ ...record, ai: { ...record.ai, messages: [] } });
    setOutcome("");
    execution.setError("");
  };
  return {
    busy: execution.busy,
    error: execution.error,
    setError: execution.setError,
    partial,
    outcome,
    clearOutcome: () => setOutcome(""),
    send,
    stop,
    clear,
  };
}
