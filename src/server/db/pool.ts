import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { envs } from "../server-envs";

export const client = createClient({
  url: envs.DATABASE_URL,
  authToken: envs.DATABASE_TOKEN,
});
export const db = drizzle(client, { schema });

