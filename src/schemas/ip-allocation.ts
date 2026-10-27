import { createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { ipAllocationTable } from "@/server/db/schema"

const ipAllocationSchemaConstraints = {
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}

export const selectIpAllocationSchema = createSelectSchema(
  ipAllocationTable,
  ipAllocationSchemaConstraints,
)
