import { createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { instanceSSHKeyTable } from "@/server/db/schema"

const instanceSSHKeySchemaConstraints = {
  createdAt: z.coerce.date().optional(),
}

export const selectInstanceSSHKeySchema = createSelectSchema(
  instanceSSHKeyTable,
  instanceSSHKeySchemaConstraints,
)
