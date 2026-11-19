import { openapi } from "@orpc/openapi"
import { toTRPCMeta } from "@orpc/trpc"
import { TRPCError } from "@trpc/server"
import { APIError } from "better-auth"
import { and, count, eq, exists, inArray, isNull } from "drizzle-orm"
import * as z from "zod"

import { slugify } from "@/lib/slugify"
import { toTRPCError } from "@/lib/to-trpc-error"
import {
  createOrganizationSchema,
  selectOrganizationSchema,
  updateOrganizationSchema,
} from "@/schemas/organization"
import { createTRPCRouter, protectedProcedure } from "@/server/api/init"
import { auth } from "@/server/auth"
import {
  instanceFirewallRuleTable,
  instanceTable,
  ipAllocationTable,
  member as memberTable,
  networkTable,
  member as organizationMemberTable,
  sshKeyTable,
} from "@/server/db/schema"
import { isUniqueConstraintError } from "@/server/db/utils"

export const organizationRouter = createTRPCRouter({
  create: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "POST",
          path: "/organization/create",
          summary: "Create a new organization",
          tags: ["Organization"],
        }),
      ),
    )
    .input(createOrganizationSchema)
    .output(
      selectOrganizationSchema.pick({ logo: true, name: true, slug: true }),
    )
    .mutation(async ({ ctx, input }) => {
      const slug = slugify(input.name)

      if (!slug) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Organization name must contain at least one letter or number",
        })
      }

      let org
      try {
        org = await auth.api.createOrganization({
          body: {
            keepCurrentActiveOrganization: false,
            logo: input.logo,
            name: input.name,
            slug,
            userId: ctx.session.user.id,
          },
          headers: ctx.headers,
        })
      } catch (error) {
        if (
          isUniqueConstraintError(error, "organization_slug_unique") ||
          (error instanceof APIError &&
            error.body?.code === "ORGANIZATION_SLUG_ALREADY_TAKEN")
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Organization with slug "${slug}" already exists`,
          })
        }
        if (error instanceof APIError) throw toTRPCError(error)
        throw error
      }

      if (!org) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create organization",
        })
      }

      return {
        logo: org.logo ?? null,
        name: org.name,
        slug: org.slug,
      }
    }),

  get: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/organization",
          summary: "Get the active organization or an organization by ID",
          tags: ["Organization"],
        }),
      ),
    )
    .input(
      z
        .object({
          id: z.string().optional(),
          slug: z.string().optional(),
        })
        .optional(),
    )
    .output(
      selectOrganizationSchema.pick({
        id: true,
        logo: true,
        name: true,
        slug: true,
      }),
    )
    .query(async ({ ctx, input }) => {
      const organizationId = input?.id || ctx.organizationId

      const organization = await ctx.db.query.organization.findFirst({
        columns: { id: true, logo: true, name: true, slug: true },
        where: (org, { eq }) =>
          and(
            input?.slug ? eq(org.slug, input.slug) : eq(org.id, organizationId),
            exists(
              ctx.db
                .select({ id: memberTable.id })
                .from(memberTable)
                .where(
                  and(
                    eq(memberTable.organizationId, org.id),
                    eq(memberTable.userId, ctx.session.user.id),
                  ),
                ),
            ),
          ),
      })

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Organization with ID ${organizationId} not found`,
        })
      }

      return organization
    }),

  list: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/organization/list",
          summary: "List all organizations the user is a member of",
          tags: ["Organization"],
        }),
      ),
    )
    .output(
      z.array(
        selectOrganizationSchema.pick({
          id: true,
          logo: true,
          name: true,
          slug: true,
        }),
      ),
    )
    .query(async ({ ctx }) => {
      const data = await auth.api.listOrganizations({
        headers: ctx.headers,
      })

      return data.map((org) => ({
        id: org.id,
        logo: org.logo ?? null,
        name: org.name,
        slug: org.slug,
      }))
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
        // oxlint-disable-next-line typescript/await-thenable
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
        // oxlint-disable-next-line typescript/await-thenable
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

  update: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "PATCH",
          path: "/organization/update",
          summary: "Update the active organization",
          tags: ["Organization"],
        }),
      ),
    )
    .input(updateOrganizationSchema)
    .output(
      selectOrganizationSchema.pick({ logo: true, name: true, slug: true }),
    )
    .mutation(async ({ ctx, input }) => {
      let org
      try {
        org = await auth.api.updateOrganization({
          body: {
            data: {
              logo: input.logo,
              name: input.name,
            },
            organizationId: input.id,
          },
          headers: ctx.headers,
        })
      } catch (error) {
        console.log(error)
        if (error instanceof APIError) throw toTRPCError(error)
        throw error
      }

      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active organization to update",
        })
      }

      return {
        logo: org.logo ?? null,
        name: org.name,
        slug: org.slug,
      }
    }),
})
