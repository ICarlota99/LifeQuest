import { createDb, type Database } from "@lifequest/db";
import { env } from "./env.js";

export const db: Database = createDb(env.databaseUrl);
