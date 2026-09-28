import { createServer } from "node:http";
import postgres from "postgres";
import { VERSION, handler } from "./app.js";

const sql = postgres(process.env.DB_URL ?? "postgres://app:app@localhost:5432/app");

await sql`create table if not exists items (id serial primary key, name text not null)`;

const port = Number(process.env.PORT ?? 3000);
createServer(handler({ list: () => sql<{ id: number; name: string }[]>`select id, name from items order by id` })).listen(
  port,
  () => console.log(`demo-app ${VERSION} listening on :${port}`),
);
