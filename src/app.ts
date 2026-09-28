import { readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { COMMIT } from "./version.js";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string };
export const VERSION = pkg.version;

export interface Items {
  list(): Promise<{ id: number; name: string }[]>;
}

export function handler(items: Items) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const send = (status: number, body: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    try {
      if (req.method === "GET" && req.url === "/health") return send(200, { status: "ok", version: VERSION, commit: COMMIT });
      if (req.method === "GET" && req.url === "/items") return send(200, await items.list());
      return send(404, { error: "not found" });
    } catch (error) {
      console.error(error);
      return send(500, { error: "internal" });
    }
  };
}
