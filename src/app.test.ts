import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import { VERSION, handler } from "./app.js";

test("GET /health reports version and commit", async () => {
  const server = createServer(handler({ list: async () => [] })).listen(0);
  const { port } = server.address() as AddressInfo;
  const body = (await (await fetch(`http://localhost:${port}/health`)).json()) as Record<string, string>;
  server.close();
  assert.equal(body.status, "ok");
  assert.equal(body.version, VERSION);
  assert.ok(body.commit);
});

test("GET /items lists items", async () => {
  const server = createServer(handler({ list: async () => [{ id: 1, name: "a" }] })).listen(0);
  const { port } = server.address() as AddressInfo;
  const body = await (await fetch(`http://localhost:${port}/items`)).json();
  server.close();
  assert.deepEqual(body, [{ id: 1, name: "a" }]);
});
