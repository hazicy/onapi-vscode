import assert from "node:assert/strict";
import { once } from "node:events";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createServer as createHttpsServer,
  type Server as HttpsServer,
} from "node:https";
import { createServer, type Server, type IncomingMessage } from "node:http";
import { connect as connectTcp, type Socket } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import test, { type TestContext } from "node:test";
import { WebSocketServer } from "ws";
import {
  WSClient,
  type WebSocketResult,
} from "@onapi/runtime/websocket/client";
import {
  createVariableReplacer,
  prepareWebSocket,
  type WebSocketRuntimeOptions,
  type WebSocketTarget,
} from "@onapi/runtime/websocket/options";

async function listen(t: TestContext, server: Server | HttpsServer) {
  const sockets = new Set<Socket>();
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    for (const socket of sockets) {
      socket.destroy();
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return `127.0.0.1:${address.port}`;
}

async function echoServer(t: TestContext) {
  const http = createServer();
  const server = new WebSocketServer({ server: http });
  const requests: IncomingMessage[] = [];
  const received: { data: Buffer; binary: boolean }[] = [];
  server.on("headers", (headers) =>
    headers.push("Set-Cookie: session=abc; Path=/; HttpOnly"),
  );
  server.on("connection", (socket, request) => {
    requests.push(request);
    socket.on("message", (data, binary) => {
      received.push({ data: data as Buffer, binary });
      socket.send(data, { binary });
    });
  });
  const address = await listen(t, http);
  t.after(() => {
    for (const socket of server.clients) {
      socket.terminate();
    }
    server.close();
  });
  return { server, address, requests, received };
}

function client(
  t: TestContext,
  target: WebSocketTarget,
  options: WebSocketRuntimeOptions = {},
) {
  const events: WebSocketResult[] = [];
  const connection = new WSClient(target, options, (event) =>
    events.push(event),
  );
  t.after(async () => {
    connection.close();
    await connection.wait();
  });
  return { connection, events };
}

async function waitFor<T>(value: () => T | undefined) {
  const end = Date.now() + 3000;
  while (Date.now() < end) {
    const result = value();
    if (result !== undefined && result !== false) {
      return result;
    }
    await delay(5);
  }
  assert.fail("Timed out waiting for a WebSocket event");
}

const parameter = (key: string, value: string, is_checked = 1) => ({
  key,
  value,
  is_checked,
});

test(
  "handshake preserves environment variables, inherited parameters, cookies and metadata",
  { timeout: 8000 },
  async (t) => {
    const echo = await echoServer(t);
    const { connection } = client(
      t,
      {
        id: "request",
        parentId: "folder",
        url: `ws://${echo.address}/echo?original=1`,
        request: {
          header: {
            parameter: [
              parameter("X-Token", "{{token}}"),
              parameter("Cookie", "existing=1"),
            ],
          },
          query: {
            parameter: [
              parameter("name", "{{name}}"),
              parameter("disabled", "no", -1),
            ],
          },
        },
      },
      {
        globals: { token: "global", name: "Alice" },
        env: { environment: { token: "environment" } },
        collection: [
          {
            id: "folder",
            parentId: "0",
            request: { header: { parameter: [parameter("X-Folder", "yes")] } },
          },
        ],
        project: {
          request: {
            query: { parameter: [parameter("global", "yes")] },
            cookie: { parameter: [parameter("session", "xyz")] },
          },
        },
      },
    );
    const result = await connection.connect();
    assert.equal(result.isSuccess, true);
    assert.equal(result.type, "connection");
    const request = echo.requests[0];
    assert.equal(request.headers["x-token"], "environment");
    assert.equal(request.headers["x-folder"], "yes");
    assert.equal(request.headers.cookie, "existing=1;session=xyz");
    assert.equal(request.url, "/echo?original=1&name=Alice&global=yes");
    const data = result.data as any;
    assert.equal(data.response.statusCode, 101);
    assert.equal(
      data.response.headers["set-cookie"][0],
      "session=abc; Path=/; HttpOnly",
    );
    assert.equal(data.response.cookies[0].name, "session");
    assert.equal(
      data.request.headers["sec-websocket-key"],
      request.headers["sec-websocket-key"],
    );
  },
);

test(
  "text, JSON, base64 and hexadecimal round trips preserve wire bytes and event formats",
  { timeout: 8000 },
  async (t) => {
    const echo = await echoServer(t);
    const { connection, events } = client(
      t,
      { url: `ws://${echo.address}` },
      { env: { environment: { name: "Alice" } } },
    );
    await connection.connect();
    await connection.send({ type: "json", msg: '{"name":"{{name}}"}' });
    await waitFor(() => events.find((event) => event.type === "message"));
    assert.equal(echo.received[0].data.toString(), '{"name":"Alice"}');
    assert.equal(echo.received[0].binary, false);
    assert.equal(
      events.find((event) => event.type === "message")?.dataType,
      "json",
    );
    for (const [type, msg, expected] of [
      ["base64", "aGVsbG8=", "hello"],
      ["hexadecimal", "68 69", "hi"],
    ]) {
      const count = echo.received.length;
      await connection.send({ type, msg });
      await waitFor(() => echo.received[count]);
      assert.equal(echo.received[count].binary, true);
      assert.equal(echo.received[count].data.toString(), expected);
    }
    await waitFor(
      () =>
        events.filter((event) => event.type === "message").length === 3 ||
        undefined,
    );
    assert.equal(events.filter((event) => event.type === "send").length, 3);
    connection.close();
    await connection.wait();
    assert.equal(events.at(-1)?.type, "close");
    await assert.rejects(connection.send({ msg: "after closing" }), /not open/);
  },
);

test(
  "binary image and PDF detection preserves incoming message order",
  { timeout: 8000 },
  async (t) => {
    const echo = await echoServer(t);
    const { connection, events } = client(t, { url: `ws://${echo.address}` });
    await connection.connect();
    const socket = [...echo.server.clients][0];
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1cAAAAASUVORK5CYII=",
      "base64",
    );
    socket.send(png);
    socket.send(Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n"));
    socket.send("last");
    await waitFor(() => events.length === 3 || undefined);
    assert.deepEqual(
      events.map((event) => event.contentType),
      ["image/png", "application/pdf", undefined],
    );
    assert.equal((events[2].data as Buffer).toString(), "last");
  },
);

test(
  "URL normalization, subprotocol and disabled parameter overrides",
  { timeout: 8000 },
  async (t) => {
    const echo = await echoServer(t);
    const { connection } = client(
      t,
      {
        url: `${echo.address}/path`,
        parentId: "0",
        request: {
          header: {
            parameter: [
              parameter("Sec-WebSocket-Protocol", "echo"),
              parameter("X-Disabled", "no", -1),
            ],
          },
        },
      },
      {
        project: {
          request: {
            header: { parameter: [parameter("X-Disabled", "inherited")] },
          },
        },
      },
    );
    await connection.connect();
    assert.equal(echo.requests[0].headers["sec-websocket-protocol"], "echo");
    assert.equal(echo.requests[0].headers["x-disabled"], undefined);
  },
);

test(
  "handshake rejection and timeout settle both connect and wait",
  { timeout: 8000 },
  async (t) => {
    const http = createServer();
    http.on("upgrade", (request, socket) => {
      if (request.url === "/reject") {
        socket.end("HTTP/1.1 401 Unauthorized\r\nContent-Length: 0\r\n\r\n");
      }
    });
    const address = await listen(t, http);
    for (const path of ["reject", "timeout"]) {
      const { connection } = client(t, {
        url: `ws://${address}/${path}`,
        config: { shake_hands_timeout: 75 },
      });
      await assert.rejects(
        connection.connect(),
        (error: any) =>
          error.isSuccess === false && /401|timed out/i.test(error.message),
      );
      await connection.wait();
    }
  },
);

test(
  "closing before or during handshake cancels pending connections",
  { timeout: 8000 },
  async (t) => {
    const http = createServer();
    http.on("upgrade", () => {});
    const address = await listen(t, http);
    const early = client(t, { url: `ws://${address}` }).connection;
    early.close();
    await assert.rejects(early.connect(), (error: any) =>
      /cancelled/.test(error.message),
    );
    const late = client(t, { url: `ws://${address}` }).connection;
    const upgraded = once(http, "upgrade");
    const connecting = late.connect();
    const rejected = assert.rejects(
      connecting,
      (error: any) => error.isSuccess === false,
    );
    await upgraded;
    late.close();
    await rejected;
    await late.wait();
  },
);

test(
  "incoming message limit closes the connection with an error",
  { timeout: 8000 },
  async (t) => {
    const echo = await echoServer(t);
    const { connection, events } = client(t, {
      url: `ws://${echo.address}`,
      config: { information_size: 0.001 },
    });
    await connection.connect();
    [...echo.server.clients][0].send("x".repeat(2048));
    await connection.wait();
    assert.ok(
      events.some(
        (event) => event.type === "error" && /payload/i.test(event.message),
      ),
    );
  },
);

test(
  "custom HTTP CONNECT proxy forwards traffic and supports authentication and bypass",
  { timeout: 8000 },
  async (t) => {
    const echo = await echoServer(t);
    const http = createServer();
    const tunnels: IncomingMessage[] = [];
    http.on("connect", (request, socket, head) => {
      tunnels.push(request);
      const destination = new URL(`http://${request.url}`);
      const upstream = connectTcp(
        Number(destination.port),
        destination.hostname,
        () => {
          socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
          if (head.length) {
            upstream.write(head);
          }
          socket.pipe(upstream).pipe(socket);
        },
      );
      socket.on("close", () => upstream.destroy());
      upstream.on("error", () => socket.destroy());
    });
    const address = await listen(t, http);
    const options: WebSocketRuntimeOptions = {
      system_configs: {
        proxy: {
          type: 1,
          protocols: ["http"],
          auth: {
            host: address,
            authenticate: 1,
            username: "user",
            password: "pass",
          },
        },
      },
    };
    const proxied = client(
      t,
      { url: `ws://${echo.address}` },
      options,
    ).connection;
    await proxied.connect();
    assert.equal(tunnels.length, 1);
    assert.equal(
      tunnels[0].headers["proxy-authorization"],
      `Basic ${Buffer.from("user:pass").toString("base64")}`,
    );
    options.system_configs!.proxy!.bypass = ["127.0.0.1"];
    await client(
      t,
      { url: `ws://${echo.address}` },
      options,
    ).connection.connect();
    assert.equal(tunnels.length, 1);
  },
);

test("placeholder replacement preserves literal values, legacy mock variables and unknown expressions", async () => {
  const replace = await createVariableReplacer({
    globals: { "a.b": "$&", name: "Alice" },
    env: { environment: { name: "Bob" } },
  });
  assert.equal(
    await replace("{{a.b}} {{name}} {{unknown}}"),
    "$& Bob {{unknown}}",
  );
  assert.equal(await replace("{{name|upcase}}"), "BOB");
  assert.match(await replace("{{'internet.email' | faker}}"), /@/);
  assert.match(await replace("{{'string.uuid' | faker}}"), /^[\da-f-]{36}$/i);
  assert.equal(await replace("{{$email}}"), "{{$email}}");
});

test("certificate options and HTTP URL aliases are mapped for ws", async () => {
  const prepared = await prepareWebSocket(
    {
      url: "https://example.com/socket",
      config: { certificate_verification: 1 },
    },
    {
      system_configs: {
        ca_cert: {
          open: 1,
          base64: `data:application/x-pem-file;base64,${Buffer.from("certificate").toString("base64")}`,
        },
      },
    },
  );
  assert.equal(prepared.url, "wss://example.com/socket");
  assert.equal(prepared.clientOptions.rejectUnauthorized, true);
  assert.equal((prepared.clientOptions.ca as Buffer).toString(), "certificate");
  await assert.rejects(
    prepareWebSocket({ url: "ftp://example.com" }, {}),
    /Unsupported/,
  );
});

test(
  "server-initiated closing clears wait and permits a new connection",
  { timeout: 8000 },
  async (t) => {
    const echo = await echoServer(t);
    const first = client(t, { url: `ws://${echo.address}` });
    await first.connection.connect();
    [...echo.server.clients][0].close();
    await first.connection.wait();
    assert.equal(first.events.at(-1)?.type, "close");
    assert.equal(first.events.at(-1)?.isSuccess, true);
    await client(t, { url: `ws://${echo.address}` }).connection.connect();
  },
);

test(
  "WSS certificate verification, custom CA and mutual TLS work with real TLS sockets",
  { timeout: 15000 },
  async (t) => {
    const directory = await mkdtemp(path.join(tmpdir(), "onapi-ws-tls-"));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const configPath = path.join(directory, "openssl.cnf");
    const keyPath = path.join(directory, "key.pem");
    const certPath = path.join(directory, "cert.pem");
    await writeFile(
      configPath,
      `[req]\ndistinguished_name=dn\nx509_extensions=ext\nprompt=no\n[dn]\nCN=localhost\n[ext]\nsubjectAltName=DNS:localhost,IP:127.0.0.1\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,digitalSignature,keyEncipherment,keyCertSign\nextendedKeyUsage=serverAuth,clientAuth\n`,
    );
    execFileSync(
      "openssl",
      [
        "req",
        "-new",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-keyout",
        keyPath,
        "-out",
        certPath,
        "-days",
        "1",
        "-config",
        configPath,
      ],
      { stdio: "ignore" },
    );
    const key = await readFile(keyPath);
    const cert = await readFile(certPath);
    const server = createHttpsServer({ key, cert });
    const wsServer = new WebSocketServer({ server });
    const address = await listen(t, server);
    t.after(() => {
      for (const socket of wsServer.clients) {
        socket.terminate();
      }
      wsServer.close();
    });
    const strictTarget = {
      url: `wss://${address}`,
      config: { certificate_verification: 1 },
    };
    const untrusted = client(t, strictTarget).connection;
    await assert.rejects(untrusted.connect(), (error: any) =>
      /self.signed/i.test(error.message),
    );
    await untrusted.wait();
    await client(t, {
      ...strictTarget,
      config: { certificate_verification: -1 },
    }).connection.connect();
    await client(t, strictTarget, {
      system_configs: { ca_cert: { open: 1, path: certPath } },
    }).connection.connect();

    const mutualServer = createHttpsServer({
      key,
      cert,
      ca: cert,
      requestCert: true,
      rejectUnauthorized: true,
    });
    const mutualWs = new WebSocketServer({ server: mutualServer });
    const mutualAddress = await listen(t, mutualServer);
    t.after(() => {
      for (const socket of mutualWs.clients) {
        socket.terminate();
      }
      mutualWs.close();
    });
    const target = {
      url: `wss://${mutualAddress}`,
      config: { certificate_verification: 1 },
    };
    const { connection } = client(t, target, {
      system_configs: {
        ca_cert: { open: 1, base64: cert.toString("base64") },
        client_cert: {
          certificateId: {
            host: "127.0.0.1",
            port: Number(mutualAddress.split(":")[1]),
            crt: { file_url: certPath },
            key: { file_url: keyPath },
          },
        },
      },
    });
    await connection.connect();
    assert.equal([...mutualWs.clients].length, 1);
  },
);
