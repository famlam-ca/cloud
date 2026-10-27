import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { validateSourcePair } from "@/lib/network"
import type { firewallRuleSourceTypeEnum } from "@/server/db/schema"
import { instanceFirewallRuleTable } from "@/server/db/schema"

const instanceFirewallRuleSchemaConstraints = {
  createdAt: z.coerce.date().optional(),
  priority: z.int().min(0).max(1000),
  updatedAt: z.coerce.date().optional(),
}

export const insertInstanceFirewallRuleSchema = createInsertSchema(
  instanceFirewallRuleTable,
  instanceFirewallRuleSchemaConstraints,
)
export const selectInstanceFirewallRuleSchema = createSelectSchema(
  instanceFirewallRuleTable,
  instanceFirewallRuleSchemaConstraints,
)

export const createInstanceFirewallRuleSchema = insertInstanceFirewallRuleSchema
  .omit({
    createdAt: true,
    id: true,
    updatedAt: true,
  })
  // require sourceCidr when sourceType is "cidr"
  .superRefine((val, ctx) => {
    const error = validateSourcePair(val.sourceType, val.sourceCidr)
    if (error) {
      ctx.addIssue({
        code: "custom",
        message: error,
        path: ["sourceCidr"],
      })
    }
  })

export type FirewallRuleSourceTypeEnum =
  (typeof firewallRuleSourceTypeEnum.enumValues)[number]
export type InstanceFirewallRule = z.infer<
  typeof selectInstanceFirewallRuleSchema
>
