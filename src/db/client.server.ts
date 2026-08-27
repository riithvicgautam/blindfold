import { drizzle } from "drizzle-orm/pg-proxy";

import * as schema from "./schema";

/**
 * Drizzle client.
 *
 * The database is reached through a privileged, server-only SQL executor
 * (`public.drizzle_exec`) instead of a raw TCP pool, because the app runs in an
 * edge runtime where long-lived Postgres sockets are not available. Drizzle
 * still builds and types every query; only the transport differs.
 *
 * SERVER ONLY — never import this from a component.
 */
export function getDb() {
  return drizzle(
    async (sql, params, method) => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const { data, error } = await supabaseAdmin.rpc("drizzle_exec", {
        query: sql,
        params: params.map((p) => (p === null || p === undefined ? null : String(p))),
      } as never);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const rows = (data ?? []) as Record<string, unknown>[];

      // pg-proxy expects positional rows for `all`, keyed rows otherwise.
      if (method === "all") {
        return { rows: rows.map((row) => Object.values(row)) };
      }
      return { rows };
    },
    { schema, casing: "snake_case" },
  );
}
