import { createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { env } from "@/env"
import type {
  operatingSystemCategoryEnum,
  operatingSystemFamilyEnum,
} from "@/server/db/schema"
import {
  operatingSystemCategoryTable,
  operatingSystemReleaseTable,
  operatingSystemTable,
} from "@/server/db/schema"

export type OperatingSystem = typeof operatingSystemTable.$inferInsert
export type OperatingSystemCategoryEnum =
  (typeof operatingSystemCategoryEnum.enumValues)[number]
export type OperatingSystemFamilyEnum =
  (typeof operatingSystemFamilyEnum.enumValues)[number]

const operatingSystemSchemaConstraints = {
  createdAt: z.coerce.date().optional(),
  pveVmid: z
    .int()
    .min(env.NEXT_PUBLIC_PROXMOX_TEMPLATE_VMID_RANGE[0])
    .max(env.NEXT_PUBLIC_PROXMOX_TEMPLATE_VMID_RANGE[1]),
  updatedAt: z.coerce.date().optional(),
}

export const selectOperatingSystemCategorySchema = createSelectSchema(
  operatingSystemCategoryTable,
  {
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  },
)
const selectOperatingSystemReleaseSchema = createSelectSchema(
  operatingSystemReleaseTable,
  {
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  },
).extend({
  category: selectOperatingSystemCategorySchema.optional(),
})

export const selectOperatingSystemSchema = createSelectSchema(
  operatingSystemTable,
  operatingSystemSchemaConstraints,
).extend({
  release: selectOperatingSystemReleaseSchema.optional(),
})
