import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Vitest sets NODE_ENV=test: tests must never touch the dev schema.
const url = process.env.NODE_ENV === "test" ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL (or TEST_DATABASE_URL under test) is not set");

export const db = drizzle({ client: new Pool({ connectionString: url }), schema });
export type Db = typeof db;
