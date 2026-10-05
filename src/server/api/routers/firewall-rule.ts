import { randomUUID } from "node:crypto"
import { openapi } from "@orpc/openapi"
import { toTRPCMeta } from "@orpc/trpc"
import { TRPCError } from "@trpc/server"
import { eq, sql } from "drizzle-orm"
import * as z from "zod"

import { FIREWALL_RULE_PRIORITY_STEP } from "@/constants/app"
import { validateSourcePair } from "@/lib/network"
import {
  createInstanceFirewallRuleSchema,
  insertInstanceFirewallRuleSchema,
  selectInstanceFirewallRuleSchema,
} from "@/schemas/firewall-rule"
import { createTRPCRouter, protectedProcedure } from "@/server/api/init"
import { instanceFirewallRuleTable, instanceTable } from "@/server/db/schema"
import { getOrgFirewallRuleOrThrow } from "@/server/queries/firewall"
import { getOrgInstanceOrThrow } from "@/server/queries/instance"
import { addFirewallSyncJob } from "@/server/queues/firewall-sync-queue"
import { logActivity } from "@/server/services/activity"

export const firewallRuleRouter = createTRPCRouter({
  create: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "POST",
          path: "/firewall-rule/create",
          summary: "Create a new firewall rule",
          tags: ["Firewall Rules"],
        }),
      ),
    )
    .input(createInstanceFirewallRuleSchema)
    .output(
      z.object({
        id: z.uuid(),
        jobId: z.string(),
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await getOrgInstanceOrThrow(
        input.instanceId,
        ctx.organizationId,
        ctx.session.session.userId,
      )

      const rule = await ctx.db.transaction(async (tx) => {
        await tx
          .update(instanceTable)
          .set({ firewallSyncStatus: "pending" })
          .where(eq(instanceTable.id, input.instanceId))

        const priority =
          input.priority ??
          (await tx
            .select({
              maxPriority: sql<number>`coalesce(max(${instanceFirewallRuleTable.priority}), 0)`,
            })
            .from(instanceFirewallRuleTable)
            .where(eq(instanceFirewallRuleTable.instanceId, input.instanceId))
            .then(
              (rows) =>
                (rows[0]?.maxPriority ?? 0) + FIREWALL_RULE_PRIORITY_STEP,
            ))

        const [ruleRow] = await tx
          .insert(instanceFirewallRuleTable)
          .values({
            action: input.action,
            comment: input.comment ?? null,
            enabled: input.enabled,
            id: randomUUID(),
            instanceId: input.instanceId,
            portRange: input.portRange ?? null,
            priority,
            protocol: input.protocol,
            sourceCidr: input.sourceCidr ?? null,
            sourceType: input.sourceType,
          })
          .returning()

        if (!ruleRow) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create firewall rule",
          })
        }

        return {
          id: ruleRow.id,
        }
      })

      const { jobId } = await addFirewallSyncJob({
        instanceId: input.instanceId,
      })

      if (!jobId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Create firewall rule job could not be created",
        })
      }

      await logActivity(ctx.db, "firewall_rule_created", {
        actorId: ctx.session.session.userId,
        actorSnapshot: ctx.session.user,
        actorType: "user",
        channel: "api",
        metadata: {},
        organizationId: ctx.organizationId,
        referenceId: input.instanceId,
        referenceType: "instance",
      })

      return {
        id: rule.id,
        jobId,
        message: "Firewall rule created successfully",
      }
    }),

  delete: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "DELETE",
          path: "/firewall-rule/{id}/delete",
          summary: "Delete a firewall rule by ID",
          tags: ["Firewall Rules"],
        }),
      ),
    )
    .input(z.object({ id: z.string() }))
    .output(
      z.object({
        id: z.uuid(),
        jobId: z.string(),
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingRule = await getOrgFirewallRuleOrThrow(
        input.id,
        ctx.organizationId,
        ctx.session.session.userId,
      )

      const rule = await ctx.db.transaction(async (tx) => {
        await tx
          .update(instanceTable)
          .set({ firewallSyncStatus: "pending" })
          .where(eq(instanceTable.id, existingRule.instanceId))

        const [ruleRow] = await tx
          .delete(instanceFirewallRuleTable)
          .where(eq(instanceFirewallRuleTable.id, input.id))
          .returning()

        return {
          id: ruleRow.id,
        }
      })

      const { jobId } = await addFirewallSyncJob({
        instanceId: existingRule.instanceId,
      })

      if (!jobId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Delete firewall rule job could not be created",
        })
      }

      await logActivity(ctx.db, "firewall_rule_deleted", {
        actorId: ctx.session.session.userId,
        actorSnapshot: ctx.session.user,
        actorType: "user",
        channel: "api",
        metadata: {},
        organizationId: ctx.organizationId,
        referenceId: existingRule.instanceId,
        referenceType: "instance",
      })

      return {
        id: rule.id,
        jobId,
        message: "Firewall rule deleted successfully",
      }
    }),

  list: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/firewall-rule/list",
          summary: "List firewall rules for a given instance",
          tags: ["Firewall Rules"],
        }),
      ),
    )
    .input(z.object({ instanceId: z.string() }))
    .output(z.array(selectInstanceFirewallRuleSchema))
    .query(async ({ ctx, input }) => {
      await getOrgInstanceOrThrow(
        input.instanceId,
        ctx.organizationId,
        ctx.session.session.userId,
      )

      return ctx.db.query.instanceFirewallRuleTable.findMany({
        orderBy: (r, { asc }) => [asc(r.priority)],
        where: (r, { eq }) => eq(r.instanceId, input.instanceId),
      })
    }),

  reorder: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "POST",
          path: "/firewall-rule/reorder",
          summary: "Reorder firewall rules for a given instance",
          tags: ["Firewall Rules"],
        }),
      ),
    )
    .input(
      z.object({
        instanceId: z.string(),
        orderedRuleIds: z.array(z.string()).min(1),
      }),
    )
    .output(
      z.object({
        id: z.uuid(),
        jobId: z.string(),
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await getOrgInstanceOrThrow(
        input.instanceId,
        ctx.organizationId,
        ctx.session.session.userId,
      )

      const rules = await ctx.db.query.instanceFirewallRuleTable.findMany({
        where: (r, { eq }) => eq(r.instanceId, input.instanceId),
      })

      const ruleIdsSet = new Set(rules.map((r) => r.id))

      if (
        input.orderedRuleIds.length !== rules.length ||
        !input.orderedRuleIds.every((id) => ruleIdsSet.has(id))
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Ordered rule IDs must match the full set of existing rule IDs",
        })
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(instanceTable)
          .set({ firewallSyncStatus: "pending" })
          .where(eq(instanceTable.id, input.instanceId))

        // pass 1 pushes everyting to negative placeholder priorities
        await Promise.all(
          input.orderedRuleIds.map((id, idx) =>
            tx
              .update(instanceFirewallRuleTable)
              .set({ priority: -(idx + 1) })
              .where(eq(instanceFirewallRuleTable.id, id)),
          ),
        )
        // pass 2 writes final priorities
        await Promise.all(
          input.orderedRuleIds.map((id, idx) =>
            tx
              .update(instanceFirewallRuleTable)
              .set({ priority: (idx + 1) * FIREWALL_RULE_PRIORITY_STEP })
              .where(eq(instanceFirewallRuleTable.id, id)),
          ),
        )
      })

      const { jobId } = await addFirewallSyncJob({
        instanceId: input.instanceId,
      })

      if (!jobId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Reorder firewall rules job could not be created",
        })
      }

      await logActivity(ctx.db, "firewall_rule_reordered", {
        actorId: ctx.session.session.userId,
        actorSnapshot: ctx.session.user,
        actorType: "user",
        channel: "api",
        metadata: {
          ruleIds: input.orderedRuleIds,
        },
        organizationId: ctx.organizationId,
        referenceId: input.instanceId,
        referenceType: "instance",
      })

      return {
        id: input.instanceId,
        jobId,
        message: "Firewall rules reordered successfully",
      }
    }),

  retrySync: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "POST",
          path: "/firewall-rule/retry-sync",
          summary: "Retry syncing firewall rules for a given instance",
          tags: ["Firewall Rules"],
        }),
      ),
    )
    .input(z.object({ instanceId: z.string() }))
    .output(
      z.object({
        id: z.uuid(),
        jobId: z.string(),
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await getOrgInstanceOrThrow(
        input.instanceId,
        ctx.organizationId,
        ctx.session.session.userId,
      )

      await ctx.db
        .update(instanceTable)
        .set({ firewallSyncStatus: "pending" })
        .where(eq(instanceTable.id, input.instanceId))

      const { jobId } = await addFirewallSyncJob({
        instanceId: input.instanceId,
      })

      if (!jobId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Retry firewall sync job could not be created",
        })
      }

      await logActivity(ctx.db, "firewall_sync_retry_requested", {
        actorId: ctx.session.session.userId,
        actorSnapshot: ctx.session.user,
        actorType: "user",
        channel: "api",
        metadata: {},
        organizationId: ctx.organizationId,
        referenceId: input.instanceId,
        referenceType: "instance",
      })

      return {
        id: input.instanceId,
        jobId,
        message: "Firewall sync retried successfully",
      }
    }),

  update: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "PUT",
          path: "/firewall-rule/{id}/update",
          summary: "Update a firewall rule by ID",
          tags: ["Firewall Rules"],
        }),
      ),
    )
    .input(
      insertInstanceFirewallRuleSchema
        .partial()
        .omit({
          createdAt: true,
          id: true,
          updatedAt: true,
        })
        .and(
          z.object({
            id: z.uuid(),
          }),
        ),
    )
    .output(selectInstanceFirewallRuleSchema)
    .mutation(async ({ ctx, input }) => {
      const existingRule = await getOrgFirewallRuleOrThrow(
        input.id,
        ctx.organizationId,
        ctx.session.session.userId,
      )

      const merged = {
        sourceCidr:
          input.sourceCidr !== undefined
            ? input.sourceCidr
            : existingRule.sourceCidr,
        sourceType: input.sourceType ?? existingRule.sourceType,
      }

      const error = validateSourcePair(merged.sourceType, merged.sourceCidr)
      if (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error,
        })
      }

      const { id, ...rest } = input

      const [updatedRule] = await ctx.db.transaction(async (tx) => {
        await tx
          .update(instanceTable)
          .set({ firewallSyncStatus: "pending" })
          .where(eq(instanceTable.id, existingRule.instanceId))

        return await tx
          .update(instanceFirewallRuleTable)
          .set(rest)
          .where(eq(instanceFirewallRuleTable.id, id))
          .returning()
      })

      const { jobId } = await addFirewallSyncJob({
        instanceId: existingRule.instanceId,
      })

      if (!jobId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Update firewall rule job could not be created",
        })
      }

      await logActivity(ctx.db, "firewall_rule_updated", {
        actorId: ctx.session.session.userId,
        actorSnapshot: ctx.session.user,
        actorType: "user",
        channel: "api",
        metadata: {
          after: updatedRule,
          before: existingRule,
        },
        organizationId: ctx.organizationId,
        referenceId: existingRule.instanceId,
        referenceType: "instance",
      })

      return updatedRule
    }),
})
