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
import { createServer, type Server as HttpServer } from "node:http";
import { connect as connectTcp, type Socket as TcpSocket } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import test, { type TestContext } from "node:test";
import { Server, type ServerOptions, type Socket } from "socket.io";
import {
  SocketClient,
  type SocketIoResult,
  type SocketIoTarget,
} from "@onapi/runtime/socketio/client";
import type { WebSocketRuntimeOptions } from "@onapi/runtime/websocket/options";
import { applySocketSettings } from "../src/features/requests/transports/socket-settings";

async function listen(
  t: TestContext,
  http: HttpServer | HttpsServer,
  close?: () => void,
) {
  const sockets = new Set<TcpSocket>();
  http.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  http.listen(0, "127.0.0.1");
  await once(http, "listening");
  t.after(async () => {
    close?.();
    for (const socket of sockets) {
      socket.destroy();
    }
    await new Promise<void>((resolve) => http.close(() => resolve()));
  });
  const address = http.address();
  assert.ok(address && typeof address !== "string");
  return `127.0.0.1:${address.port}`;
}

async function server(
  t: TestContext,
  options: Partial<ServerOptions> = {},
  namespace = "/",
) {
  const http = createServer();
  const io = new Server(http, options);
  const sockets: Socket[] = [];
  const endpoint = io.of(namespace);
  endpoint.on("connection", (socket) => sockets.push(socket));
  const address = await listen(t, http, () => {
    io.close();
  });
  return {
    io,
    endpoint,
    sockets,
    address,
    url: `http://${address}${namespace}`,
  };
}

function client(
  t: TestContext,
  target: SocketIoTarget,
  options: WebSocketRuntimeOptions = {},
) {
  const events: SocketIoResult[] = [];
  const connection = new SocketClient(target, options, (message) =>
    events.push(message),
  );
  t.after(async () => {
    connection.disconnect();
    await connection.awaitDisconnect();
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
  assert.fail("Timed out waiting for a Socket.IO event");
}
const parameter = (key: string, value: string, is_checked = 1) => ({
  key,
  value,
  is_checked,
});

test(
  "custom handshake path, namespace, inherited parameters and environment metadata",
  { timeout: 8000 },
  async (t) => {
    const app = await server(t, { path: "/custom" }, "/room");
    const { connection } = client(
      t,
      {
        id: "request",
        parentId: "folder",
        url: `${app.url}?original=1`,
        config: { shake_hands_path: "/custom" },
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
            cookie: { parameter: [parameter("session", "xyz")] },
            query: { parameter: [parameter("global", "yes")] },
          },
        },
      },
    );
    const connected = await connection.connect();
    assert.equal(connected.isSuccess, true);
    const handshake = app.sockets[0].handshake;
    assert.equal(handshake.headers["x-token"], "environment");
    assert.equal(handshake.headers["x-folder"], "yes");
    assert.equal(handshake.headers.cookie, "existing=1;session=xyz");
    assert.equal(handshake.query.original, "1");
    assert.equal(handshake.query.name, "Alice");
    assert.equal(handshake.query.disabled, undefined);
    assert.equal(connected.actualRequestParas?.request.query.global, "yes");
  },
);

test(
  "JSON5, text and binary sends preserve variables, payloads and optional acknowledgements",
  { timeout: 8000 },
  async (t) => {
    const app = await server(t);
    const received: { data: unknown; ack: boolean }[] = [];
    app.endpoint.on("connection", (socket) =>
      socket.on("echo", (data, ack) => {
        received.push({ data, ack: typeof ack === "function" });
        socket.emit("result", data);
        if (typeof ack === "function") {
          ack({ ok: true, data });
        }
      }),
    );
    const { connection, events } = client(
      t,
      {
        url: app.url,
        request: { event: { parameter: [parameter("result", "1")] } },
      },
      { globals: { name: "Alice" } },
    );
    await connection.connect();
    await connection.emitEvent("echo", "hello {{name}}", "text");
    await waitFor(() => received[0]);
    assert.deepEqual(received[0], { data: "hello Alice", ack: false });
    await connection.emitEventWithAck("echo", '{name:"{{name}}"}', "json");
    await waitFor(() => events.find((event) => event.type === "send_ack"));
    assert.deepEqual(received[1], { data: { name: "Alice" }, ack: true });
    const ack = events.find((event) => event.type === "send_ack")!
      .message as any;
    assert.deepEqual(ack, {
      event: "echo",
      data: { ok: true, data: { name: "Alice" } },
    });
    await connection.emitEvent("echo", "aGVsbG8=", "base64");
    await connection.emitEvent("echo", "6869", "hexadecimal");
    await waitFor(() => received.length === 4 || undefined);
    assert.equal((received[2].data as Buffer).toString(), "hello");
    assert.equal((received[3].data as Buffer).toString(), "hi");
    assert.equal(events.filter((event) => event.type === "send").length, 4);
  },
);

test(
  "listener updates deduplicate events, remove only owned handlers and preserve multiple arguments",
  { timeout: 8000 },
  async (t) => {
    const app = await server(t);
    const { connection, events } = client(t, {
      url: app.url,
      request: { event: { parameter: [parameter("old", "1")] } },
    });
    await connection.connect();
    const updated = connection.updateEvent([
      parameter("news", "1"),
      parameter("news", "1"),
      parameter("disabled", "-1"),
      parameter("disconnect", "1"),
    ]);
    assert.deepEqual(updated, {
      addedEvents: ["news"],
      removedEvents: ["old"],
    });
    assert.deepEqual(connection.updateEvent([parameter("news", "1")]), {
      addedEvents: [],
      removedEvents: [],
    });
    app.sockets[0].emit("old", "ignored");
    app.sockets[0].emit("news", "one", { two: 2 });
    await waitFor(() => events.find((event) => event.type === "message"));
    assert.deepEqual(
      events
        .filter((event) => event.type === "message")
        .map((event) => event.message),
      [{ event: "news", data: ["one", { two: 2 }] }],
    );
  },
);

test(
  "failed namespace authentication and transport timeout settle the connection",
  { timeout: 8000 },
  async (t) => {
    const app = await server(t);
    app.endpoint.use((_socket, next) => next(new Error("denied")));
    const rejected = client(t, { url: app.url }).connection;
    await assert.rejects(
      rejected.connect(),
      (error: any) => error.isSuccess === false && /denied/.test(error.message),
    );
    await rejected.awaitDisconnect();
    const hanging = createServer(() => {});
    const address = await listen(t, hanging);
    const timed = client(t, {
      url: `http://${address}`,
      config: { shake_hands_timeout: 75 },
    }).connection;
    await assert.rejects(timed.connect(), (error: any) =>
      /timeout/i.test(error.message),
    );
    await timed.awaitDisconnect();
  },
);

test(
  "cancel before and during namespace handshake closes pending connections",
  { timeout: 8000 },
  async (t) => {
    const app = await server(t);
    let reached!: () => void;
    const pending = new Promise<void>((resolve) => {
      reached = resolve;
    });
    app.endpoint.use(() => {
      reached();
    });
    const early = client(t, { url: app.url }).connection;
    early.disconnect();
    await assert.rejects(early.connect(), /cancelled/);
    const late = client(t, { url: app.url }).connection;
    const connecting = late.connect();
    const cancelled = assert.rejects(connecting, /cancelled/);
    await pending;
    late.disconnect();
    await cancelled;
    await late.awaitDisconnect();
  },
);

test(
  "server disconnection and explicit disconnection publish one terminal event",
  { timeout: 8000 },
  async (t) => {
    const app = await server(t);
    const remote = client(t, { url: app.url });
    await remote.connection.connect();
    app.sockets[0].disconnect(true);
    await remote.connection.awaitDisconnect();
    assert.equal(
      remote.events.filter((event) => event.type === "disconnect").length,
      1,
    );
    const local = client(t, { url: app.url });
    await local.connection.connect();
    local.connection.disconnect();
    local.connection.disconnect();
    await local.connection.awaitDisconnect();
    assert.equal(
      local.events.filter((event) => event.type === "disconnect").length,
      1,
    );
    await assert.rejects(
      local.connection.emitEvent("echo", "closed"),
      /not connected/,
    );
  },
);

test(
  "independent clients do not share managers and queued sends preserve order",
  { timeout: 8000 },
  async (t) => {
    const app = await server(t);
    const received: string[] = [];
    app.endpoint.on("connection", (socket) =>
      socket.on("echo", (value) => received.push(value)),
    );
    const first = client(t, { url: app.url }).connection;
    const second = client(t, { url: app.url }).connection;
    await Promise.all([first.connect(), second.connect()]);
    assert.equal(app.sockets.length, 2);
    first.disconnect();
    await Promise.all([
      second.emitEvent("echo", "{{$fakerjs.internet.email}}"),
      second.emitEvent("echo", "second"),
    ]);
    await waitFor(() => received.length === 2 || undefined);
    assert.match(received[0], /@/);
    assert.equal(received[1], "second");
  },
);

test(
  "HTTP CONNECT proxy forwards Socket.IO polling and traffic with authentication",
  { timeout: 8000 },
  async (t) => {
    const app = await server(t);
    const proxy = createServer();
    const authorizations: (string | undefined)[] = [];
    proxy.on("connect", (request, socket, head) => {
      authorizations.push(request.headers["proxy-authorization"]);
      const target = new URL(`http://${request.url}`);
      const upstream = connectTcp(Number(target.port), target.hostname, () => {
        socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
        if (head.length) {
          upstream.write(head);
        }
        socket.pipe(upstream).pipe(socket);
      });
      socket.on("close", () => upstream.destroy());
      upstream.on("error", () => socket.destroy());
    });
    const address = await listen(t, proxy);
    await client(
      t,
      { url: app.url },
      {
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
      },
    ).connection.connect();
    assert.ok(authorizations.length > 0);
    assert.ok(
      authorizations.every(
        (value) =>
          value === `Basic ${Buffer.from("user:pass").toString("base64")}`,
      ),
    );
  },
);

test("shared system settings map proxy, language and certificate options for both clients", () => {
  const options = applySocketSettings(
    {},
    {
      proxy: 3,
      language: "en",
      request_proxy_url: "http://localhost:9000",
      request_proxy_port: 8000,
      request_proxy_type: ["http"],
    },
    "http://system-proxy:3128",
  );
  assert.equal(
    options.system_configs?.proxy?.auth?.host,
    "http://localhost:8000/",
  );
  assert.equal(options.system_configs?.proxy?.type, 1);
  assert.equal(options.systemProxy, "http://system-proxy:3128");
});

test(
  "TLS verification, custom CA and mutual TLS work through the official transports",
  { timeout: 15000 },
  async (t) => {
    const directory = await mkdtemp(path.join(tmpdir(), "onapi-socketio-tls-"));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const config = path.join(directory, "openssl.cnf");
    const keyPath = path.join(directory, "key.pem");
    const certPath = path.join(directory, "cert.pem");
    await writeFile(
      config,
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
        config,
      ],
      { stdio: "ignore" },
    );
    const key = await readFile(keyPath),
      cert = await readFile(certPath);
    const http = createHttpsServer({ key, cert });
    const io = new Server(http);
    const address = await listen(t, http, () => {
      io.close();
    });
    const target = {
      url: `https://${address}`,
      config: { certificate_verification: 1, shake_hands_timeout: 500 },
    };
    const untrusted = client(t, target).connection;
    await assert.rejects(
      untrusted.connect(),
      (error: any) => error.isSuccess === false,
    );
    await untrusted.awaitDisconnect();
    await client(t, {
      ...target,
      config: { certificate_verification: -1 },
    }).connection.connect();
    await client(t, target, {
      system_configs: { ca_cert: { open: 1, path: certPath } },
    }).connection.connect();

    const mutualHttp = createHttpsServer({
      key,
      cert,
      ca: cert,
      requestCert: true,
      rejectUnauthorized: true,
    });
    const mutualIo = new Server(mutualHttp);
    const mutualAddress = await listen(t, mutualHttp, () => {
      mutualIo.close();
    });
    await client(
      t,
      { ...target, url: `https://${mutualAddress}` },
      {
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
      },
    ).connection.connect();
  },
);
