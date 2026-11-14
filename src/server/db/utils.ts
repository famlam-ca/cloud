import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type postgres from "postgres"

import type * as schema from "@/server/db/schema"

export type DB = PostgresJsDatabase<typeof schema> & {
  $client: postgres.Sql<Record<string, never>>
}

export function isUniqueConstraintError(
  error: unknown,
  constraintName: string,
): boolean {
  let current: unknown = error

  while (typeof current === "object" && current !== null) {
    if (
      "code" in current &&
      current.code === "23505" &&
      "constraint_name" in current &&
      current.constraint_name === constraintName
    ) {
      return true
    }

    current = "cause" in current ? current.cause : null
  }

  return false
}
