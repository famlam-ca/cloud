import { createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { resourcePlanTable } from "@/server/db/schema"

const resourcePlanSchemaConstraints = {
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}

export const selectResourcePlanSchema = createSelectSchema(
  resourcePlanTable,
  resourcePlanSchemaConstraints,
)

export type ResourcePlan = z.infer<typeof selectResourcePlanSchema>
