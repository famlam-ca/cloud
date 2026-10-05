import { openapi } from "@orpc/openapi"
import { toTRPCMeta } from "@orpc/trpc"
import { TRPCError } from "@trpc/server"
import { and, count, eq, inArray, isNull } from "drizzle-orm"
import * as z from "zod"

import { selectOrganizationSchema } from "@/schemas/organization"
import { createTRPCRouter, protectedProcedure } from "@/server/api/init"
import {
  instanceFirewallRuleTable,
  instanceTable,
  ipAllocationTable,
  networkTable,
  member as organizationMemberTable,
  sshKeyTable,
} from "@/server/db/schema"

export const organizationRouter = createTRPCRouter({
  get: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/organization/{id}",
          summary: "Get an organization by ID",
          tags: ["Organization"],
        }),
      ),
    )
    .input(z.object({ id: z.string().optional() }).optional())
    .output(selectOrganizationSchema)
    .query(async ({ ctx, input }) => {
      const organizationId = input?.id || ctx.organizationId

      const organization = await ctx.db.query.organization.findFirst({
        where: (org, { eq }) => eq(org.id, organizationId),
      })

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Organization with ID ${organizationId} not found`,
        })
      }

      return organization
    }),

  resourceSummary: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/organization/resource-summary",
          summary: "Get a summary of resources for the active organization",
          tags: ["Organization"],
        }),
      ),
    )
    .output(
      z.object({
        apiKeyCount: z.number(),
        firewallRuleCount: z.number(),
        instanceCount: z.number(),
        memberCount: z.number(),
        networkCount: z.number(),
        primaryIpCount: z.number(),
        snapshotCount: z.number(),
        sshKeyCount: z.number(),
      }),
    )
    .query(async ({ ctx }) => {
      const orgInstanceIds = await ctx.db.query.instanceTable.findMany({
        columns: { id: true },
        where: and(
          eq(instanceTable.organizationId, ctx.organizationId),
          isNull(instanceTable.deletedAt),
        ),
      })

      const [
        apiKeyCount,
        firewallRuleCount,
        instanceCount,
        memberCount,
        networkCount,
        primaryIpCount,
        snapshotCount,
        sshKeyCount,
      ] = await Promise.all([
        [{ count: 0 }],
        ctx.db
          .select({ count: count() })
          .from(instanceFirewallRuleTable)
          .where(
            inArray(
              instanceFirewallRuleTable.instanceId,
              orgInstanceIds.map((i) => i.id),
            ),
          ),
        ctx.db
          .select({ count: count() })
          .from(instanceTable)
          .where(
            and(
              eq(instanceTable.organizationId, ctx.organizationId),
              isNull(instanceTable.deletedAt),
            ),
          ),
        ctx.db
          .select({ count: count() })
          .from(organizationMemberTable)
          .where(
            eq(organizationMemberTable.organizationId, ctx.organizationId),
          ),
        ctx.db.select({ count: count() }).from(networkTable),
        ctx.db
          .select({ count: count() })
          .from(ipAllocationTable)
          .where(
            inArray(
              ipAllocationTable.instanceId,
              orgInstanceIds.map((instance) => instance.id),
            ),
          ),
        [{ count: 0 }],
        ctx.db
          .select({ count: count() })
          .from(sshKeyTable)
          .where(eq(sshKeyTable.organizationId, ctx.organizationId)),
      ])

      return {
        apiKeyCount: apiKeyCount[0].count,
        firewallRuleCount: firewallRuleCount[0].count,
        instanceCount: instanceCount[0].count,
        memberCount: memberCount[0].count,
        networkCount: networkCount[0].count,
        primaryIpCount: primaryIpCount[0].count,
        snapshotCount: snapshotCount[0].count,
        sshKeyCount: sshKeyCount[0].count,
      }
    }),
})
