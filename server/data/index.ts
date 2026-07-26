import type { Repository } from "./repository.ts";
import { createSqliteRepository } from "./sqlite/sqliteRepository.ts";
import { seed } from "./seed/index.ts";
import { config } from "../config.ts";

// the single repository instance the app uses
// swap this line for a supabase/postgres impl later — nothing else changes
export const repo: Repository = createSqliteRepository(config.databaseFile, seed);
