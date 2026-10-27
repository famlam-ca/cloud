import { createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { env } from "@/env"
import { networkTable } from "@/server/db/schema"

const networkSchemaConstraints = {
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  vlanId: z
    .int()
    .min(Number(env.OPNSENSE_CLOUD_NETWORK_VLAN_ID))
    .max(Number(env.OPNSENSE_CLOUD_NETWORK_VLAN_ID)),
}

export const selectNetworkSchema = createSelectSchema(
  networkTable,
  networkSchemaConstraints,
)
