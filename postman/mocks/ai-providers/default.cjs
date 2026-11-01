// Contract fixtures: OpenAI Responses / Chat Completions and DeepSeek Chat.
// Only dummy credentials and deterministic text are used here.
const http = require("node:http");
http
  .createServer(async (req, res) => {
    const json = (status, message) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ error: { message, type: "invalid_request_error" } }),
      );
    };
    try {
      if (
        req.method !== "POST" ||
        !["/responses", "/chat/completions"].includes(req.url)
      )
        return json(501, "Endpoint outside this fixture's contract");
      let body = req.body;
      if (!body) {
        let raw = "";
        for await (const chunk of req) raw += chunk;
        body = JSON.parse(raw);
      }
      if (typeof body === "string") body = JSON.parse(body);
      if (
        req.headers.authorization !== "Bearer fixture-key" ||
        body.model === "fixture-unauthorized"
      )
        return json(401, "Invalid API key");
      if (body.model === "fixture-rate-limit")
        return json(429, "Rate limit exceeded");
      const responses = req.url === "/responses";
      const messages = responses ? body.input : body.messages;
      if (
        !body.model ||
        body.stream !== true ||
        !Array.isArray(messages) ||
        !messages.length
      )
        return json(400, "model, messages/input and stream:true are required");
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      });
      const send = (value) => res.write(`data: ${JSON.stringify(value)}\n\n`);
      if (responses) {
        send({
          type: "response.created",
          response: { id: "resp_fixture", created_at: 1, model: body.model },
        });
        send({
          type: "response.output_item.added",
          output_index: 0,
          item: { type: "message", id: "msg_fixture" },
        });
        for (const delta of ["Hello", " world"])
          send({
            type: "response.output_text.delta",
            item_id: "msg_fixture",
            output_index: 0,
            content_index: 0,
            delta,
          });
        send({
          type: "response.completed",
          response: {
            usage: { input_tokens: 3, output_tokens: 2, total_tokens: 5 },
          },
        });
      } else {
        const chunk = (delta, finish_reason = null, usage) =>
          send({
            id: "chat-fixture",
            object: "chat.completion.chunk",
            created: 1,
            model: body.model,
            choices: [{ index: 0, delta, finish_reason }],
            ...(usage ? { usage } : {}),
          });
        if (body.thinking?.type === "enabled")
          chunk({ reasoning_content: "Let me think." });
        for (const content of ["Hello", " world"]) chunk({ content });
        if (body.model === "fixture-slow")
          await new Promise((resolve) => setTimeout(resolve, 2000));
        chunk({}, "stop", {
          prompt_tokens: 3,
          completion_tokens: 2,
          total_tokens: 5,
        });
        res.write("data: [DONE]\n\n");
      }
      res.end();
    } catch {
      if (!res.headersSent) json(400, "Invalid JSON request");
      else res.end();
    }
  })
  .listen(process.env.PORT || 4500);
