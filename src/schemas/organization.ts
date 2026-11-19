import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { organization as organizationTable } from "@/server/db/schema"

const organizationSchemaConstraints = {
  createdAt: z.coerce.date().optional(),
}

export const insertOrganizationSchema = createInsertSchema(
  organizationTable,
  organizationSchemaConstraints,
)
export const selectOrganizationSchema = createSelectSchema(
  organizationTable,
  organizationSchemaConstraints,
)

export const createOrganizationSchema = insertOrganizationSchema.pick({
  logo: true,
  name: true,
})

export const updateOrganizationSchema = selectOrganizationSchema
  .pick({
    logo: true,
    name: true,
  })
  .partial()
  .extend({ id: z.string().min(1) })
  .refine(
    (data) => data.name !== undefined || data.logo !== undefined,
    "At least one of 'name' or 'logo' must be provided",
  )

export const deleteOrganizationSchema = selectOrganizationSchema.pick({
  id: true,
})
