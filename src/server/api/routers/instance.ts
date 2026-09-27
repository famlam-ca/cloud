import { randomUUID } from "node:crypto"
import { openapi } from "@orpc/openapi"
import { toTRPCMeta } from "@orpc/trpc"
import type { inferProcedureBuilderResolverOptions } from "@trpc/server"
import { TRPCError } from "@trpc/server"
import { and, count, eq, inArray, isNull, lt, or } from "drizzle-orm"
import * as z from "zod"

import { env } from "@/env"
import { generateMacAddress } from "@/lib/crypto"
import { getProxmoxClient } from "@/lib/proxmox"
import type {
  InstancePowerActionEnum,
  InstanceStatusEnum,
} from "@/schemas/instance"
import {
  refinedCreateInstanceSchema,
  refinedUpdateInstanceSchema,
  selectInstanceSchema,
} from "@/schemas/instance"
import { selectSSHKeySchema } from "@/schemas/ssh-key"
import { createTRPCRouter, protectedProcedure } from "@/server/api/init"
import {
  firewallSyncStatusEnum,
  instanceSSHKeyTable,
  instanceTable,
  ipAllocationTable,
  sshKeyTable,
} from "@/server/db/schema"
import { isUniqueConstraintError } from "@/server/db/utils"
import { getNextVmid, getOrgInstanceOrThrow } from "@/server/queries/instance"
import { getCloudNetwork } from "@/server/queries/network"
import { addDeleteInstanceJob } from "@/server/queues/delete-instance-queue"
import { addPowerActionJob } from "@/server/queues/power-action-queue"
import { addProvisionJob } from "@/server/queues/provision-queue"
import { logActivity } from "@/server/services/activity"
import { createDhcpReservation } from "@/server/services/network"

const PROXMOX_DEFAULT_NODE = env.PROXMOX_NODE
const VALID_SOURCE_STATUS: Record<
  InstancePowerActionEnum,
  InstanceStatusEnum[]
> = {
  reboot: ["running"],
  shutdown: ["running"],
  start: ["stopped"],
  stop: [
    "queued",
    "provisioning",
    "starting",
    "running",
    "stopping",
    "restarting",
    "pending_deletion",
    "deleting",
    "deleted",
    "failed",
  ],
}
const TRANSIENT_STATUS: Record<InstancePowerActionEnum, InstanceStatusEnum> = {
  reboot: "restarting",
  shutdown: "stopping",
  start: "starting",
  stop: "stopping",
}

const proxmox = getProxmoxClient()

export const instanceRouter = createTRPCRouter({
  count: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/instance/count",
          summary: "Count all instances for the active organization",
          tags: ["Instances"],
        }),
      ),
    )
    .output(z.number())
    .query(async ({ ctx }) => {
      const [instanceCount] = await ctx.db
        .select({ count: count() })
        .from(instanceTable)
        .where(
          and(
            eq(instanceTable.organizationId, ctx.organizationId),
            isNull(instanceTable.deletedAt),
          ),
        )

      return instanceCount.count
    }),

  create: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "POST",
          path: "/instance/create",
          successStatus: 202,
          summary: "Create a new instance",
          tags: ["Instances"],
        }),
      ),
    )
    .input(refinedCreateInstanceSchema)
    .output(
      z.object({
        instanceId: z.uuid(),
        jobId: z.string(),
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const network = await getCloudNetwork()
      if (!network) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Network not found",
        })
      }

      const macAddress = generateMacAddress()

      const plan = await ctx.db.query.resourcePlanTable.findFirst({
        where: (plan, { or, eq }) =>
          or(
            eq(plan.id, input.resourcePlanId),
            eq(plan.slug, input.resourcePlanId),
          ),
      })

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Resource plan ${input.resourcePlanId} not found`,
        })
      }

      const [sshKey] = await ctx.db
        .select()
        .from(sshKeyTable)
        .where(eq(sshKeyTable.id, input.sshKeyId))

      if (!sshKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `SSH key ${input.sshKeyId} not found`,
        })
      }

      const instance = await ctx.db.transaction(async (tx) => {
        const nextVmid = await getNextVmid(proxmox, tx)
        const instanceHostname = input.hostname.toLowerCase()

        const instanceRow = await tx
          .insert(instanceTable)
          .values({
            cores: plan.cores,
            disk: plan.disk,
            hostname: instanceHostname,
            id: randomUUID(),
            memory: plan.memory,
            networkId: network.id,
            operatingSystemId: input.operatingSystemId,
            organizationId: ctx.organizationId,
            pveNode: PROXMOX_DEFAULT_NODE,
            pveVmid: nextVmid,
            resourcePlanId: plan.id,
            status: "queued",
          })
          .returning()
          .catch((error) => {
            const constraintName = "instance_pve_vmid_unique"
            if (isUniqueConstraintError(error, constraintName)) return null
            throw error
          })

        if (!instanceRow) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create instance",
          })
        }

        const [newInstance] = instanceRow

        const ipAllocation = await tx
          .insert(ipAllocationTable)
          .values({
            gateway: network.gateway,
            id: randomUUID(),
            instanceId: newInstance.id,
            ipAddress: network.ip.split("/")[0],
            isPrimary: true,
            macAddress,
            networkId: network.id,
          })
          .returning()
          .catch((error) => {
            if (
              isUniqueConstraintError(error, "ip_allocation_ip_address_unique")
            )
              return null
            throw error
          })

        if (!ipAllocation) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `IP ${network.ip.split("/")[0]} already allocated`,
          })
        }

        const [instanceSSHKey] = await tx
          .insert(instanceSSHKeyTable)
          .values({
            id: randomUUID(),
            instanceId: newInstance.id,
            sshKeyId: input.sshKeyId,
          })
          .returning()

        if (!instanceSSHKey) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to associate SSH key with instance",
          })
        }

        await createDhcpReservation(
          network.ip.split("/")[0],
          macAddress,
          instanceHostname,
        )

        return {
          hostname: newInstance.hostname,
          id: newInstance.id,
          organizationId: newInstance.organizationId,
        }
      })

      const { jobId } = await addProvisionJob({
        instanceId: instance.id,
        macAddress,
        network,
        plan,
        sshKeyId: input.sshKeyId,
      })

      if (!jobId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Provision job could not be created",
        })
      }

      await logActivity(ctx.db, "instance_created", {
        actorId: ctx.session.session.userId,
        actorSnapshot: ctx.session.user,
        actorType: "user",
        channel: "api",
        metadata: { instance },
        organizationId: ctx.organizationId,
        referenceId: instance.id,
        referenceType: "instance",
      })

      return {
        instanceId: instance.id,
        jobId,
        message: "Your instance is being created.",
      }
    }),

  delete: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "DELETE",
          path: "/instance/{id}/delete",
          summary: "Delete an instance",
          tags: ["Instances"],
        }),
      ),
    )
    .input(z.object({ id: z.string() }))
    .output(
      z.object({
        instanceId: z.uuid(),
        jobId: z.string(),
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingInstance = await ctx.db.query.instanceTable.findFirst({
        where: (i, { and, eq }) =>
          and(eq(i.id, input.id), eq(i.organizationId, ctx.organizationId)),
      })

      if (!existingInstance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Instance ${input.id} not found`,
        })
      }

      if (existingInstance.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this instance",
        })
      }

      if (existingInstance.deletedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Instance ${input.id} is already deleted`,
        })
      }

      const instance = await ctx.db.transaction(async (tx) => {
        const instanceRow = await tx
          .update(instanceTable)
          .set({
            deletedAt: new Date(),
            status: "pending_deletion",
          })
          .where(
            and(
              eq(instanceTable.id, input.id),
              isNull(instanceTable.deletedAt),
            ),
          )
          .returning()

        const [deletedInstance] = instanceRow
        if (!deletedInstance) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Instance ${input.id} not found or already deleted`,
          })
        }

        return deletedInstance
      })

      const { jobId } = await addDeleteInstanceJob({
        instanceId: instance.id,
      })

      if (!jobId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Delete instance job could not be created",
        })
      }

      await logActivity(ctx.db, "instance_deletion_requested", {
        actorId: ctx.session.session.userId,
        actorSnapshot: ctx.session.user,
        actorType: "user",
        channel: "api",
        metadata: { instance },
        organizationId: ctx.organizationId,
        referenceId: instance.id,
        referenceType: "instance",
      })

      return {
        instanceId: instance.id,
        jobId,
        message: "Your instance is being deleted.",
      }
    }),

  firewallStatus: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/firewall-rule/status",
          summary: "Get the firewall sync status for a given instance",
          tags: ["Firewall Rules"],
        }),
      ),
    )
    .input(z.object({ instanceId: z.string() }))
    .output(
      z.object({
        firewallSyncError: z.string().nullable(),
        firewallSyncedAt: z.date().nullable(),
        firewallSyncStatus: z.enum(firewallSyncStatusEnum.enumValues),
      }),
    )
    .query(async ({ ctx, input }) => {
      const instance = await getOrgInstanceOrThrow(
        input.instanceId,
        ctx.organizationId,
        ctx.session.session.userId,
      )

      return {
        firewallSyncError: instance.firewallSyncError,
        firewallSyncedAt: instance.firewallSyncedAt,
        firewallSyncStatus: instance.firewallSyncStatus,
      }
    }),

  get: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/instance/{id}/get",
          summary: "Get an instance by ID",
          tags: ["Instances"],
        }),
      ),
    )
    .input(z.object({ id: z.string() }))
    .output(selectInstanceSchema)
    .query(async ({ ctx, input }) => {
      const instance = await getOrgInstanceOrThrow(
        input.id,
        ctx.organizationId,
        ctx.session.session.userId,
        { ipAllocations: true, sshKeys: true },
      )

      return instance
    }),

  getSSHKeys: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/instance/{id}/ssh-keys",
          summary: "Get all SSH keys associated with an instance",
          tags: ["Instances"],
        }),
      ),
    )
    .input(z.object({ id: z.string() }))
    .output(z.array(selectSSHKeySchema))
    .query(async ({ ctx, input }) => {
      const instance = await getOrgInstanceOrThrow(
        input.id,
        ctx.organizationId,
        ctx.session.session.userId,
        { sshKeys: true },
      )

      const sshKeys = await ctx.db.query.sshKeyTable.findMany({
        where: (key, { inArray }) =>
          inArray(
            key.id,
            instance.sshKeys.map((key) => key.sshKeyId),
          ),
      })

      return sshKeys
    }),

  list: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/instance/list",
          summary: "List all instances for the active organization",
          tags: ["Instances"],
        }),
      ),
    )
    .input(
      z.object({
        cursor: z
          .object({
            createdAt: z.date(),
            id: z.uuid(),
          })
          .nullish(),
        limit: z.int().positive().max(100),
      }),
    )
    .output(
      z.object({
        items: z.array(selectInstanceSchema),
        nextCursor: z
          .object({
            createdAt: z.date(),
            id: z.uuid(),
          })
          .nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const instances = await ctx.db.query.instanceTable.findMany({
        limit: input.limit + 1,
        orderBy: (instances, { desc }) => desc(instances.createdAt),
        where: (i, { and, eq }) =>
          and(
            eq(i.organizationId, ctx.organizationId),
            isNull(i.deletedAt),
            input.cursor
              ? or(
                  lt(i.createdAt, input.cursor.createdAt),
                  and(
                    eq(i.id, input.cursor.id),
                    eq(i.createdAt, input.cursor.createdAt),
                  ),
                )
              : undefined,
          ),
        with: {
          ipAllocations: true,
          sshKeys: true,
        },
      })

      const hasMore = instances.length > input.limit
      const items = hasMore ? instances.slice(0, -1) : instances
      const lastItem = items[items.length - 1]
      const nextCursor = hasMore
        ? { createdAt: lastItem.createdAt, id: lastItem.id }
        : undefined

      return {
        items,
        nextCursor,
      }
    }),

  reboot: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "POST",
          path: "/instance/{id}/reboot",
          summary: "Reboot an instance",
          tags: ["Instances"],
        }),
      ),
    )
    .input(z.object({ id: z.string() }))
    .output(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const action: InstancePowerActionEnum = "reboot"

      return await powerAction(action, { ctx, input })
    }),

  shutdown: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "POST",
          path: "/instance/{id}/shutdown",
          summary: "Shutdown an instance",
          tags: ["Instances"],
        }),
      ),
    )
    .input(z.object({ id: z.string() }))
    .output(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const action: InstancePowerActionEnum = "shutdown"

      return await powerAction(action, { ctx, input })
    }),

  start: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "POST",
          path: "/instance/{id}/start",
          summary: "Start an instance",
          tags: ["Instances"],
        }),
      ),
    )
    .input(z.object({ id: z.string() }))
    .output(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const action: InstancePowerActionEnum = "start"

      return await powerAction(action, { ctx, input })
    }),

  stop: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "POST",
          path: "/instance/{id}/stop",
          summary: "Stop an instance",
          tags: ["Instances"],
        }),
      ),
    )
    .input(z.object({ id: z.string() }))
    .output(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const action: InstancePowerActionEnum = "stop"

      return await powerAction(action, { ctx, input })
    }),

  update: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "PUT",
          path: "/instance/{id}",
          summary: "Update an instance",
          tags: ["Instances"],
        }),
      ),
    )
    .input(refinedUpdateInstanceSchema)
    .output(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const instance = await getOrgInstanceOrThrow(
        input.id,
        ctx.organizationId,
        ctx.session.session.userId,
      )

      const instanceHostname = input.hostname?.toLowerCase()

      // TODO: send to update instance queue
      await proxmox.nodes
        .$(PROXMOX_DEFAULT_NODE)
        .qemu.$(Number(instance.pveVmid))
        .config.$put({
          name: instanceHostname,
        })

      return { id: input.id }
    }),
})

async function powerAction(
  action: InstancePowerActionEnum,
  opts: Pick<
    inferProcedureBuilderResolverOptions<typeof protectedProcedure>,
    "ctx"
  > & { input: { id: string } },
) {
  const { ctx, input } = opts

  const instance = await getOrgInstanceOrThrow(
    input.id,
    ctx.organizationId,
    ctx.session.session.userId,
  )

  const [updated] = await ctx.db
    .update(instanceTable)
    .set({ status: TRANSIENT_STATUS[action] })
    .where(
      and(
        eq(instanceTable.id, instance.id),
        inArray(instanceTable.status, VALID_SOURCE_STATUS[action]),
      ),
    )
    .returning()

  if (!updated) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Cannot ${action} instance while it is ${instance.status}`,
    })
  }

  const { jobId } = await addPowerActionJob({
    action,
    instanceId: instance.id,
  })

  if (!jobId) {
    await ctx.db
      .update(instanceTable)
      .set({ status: updated.status })
      .where(eq(instanceTable.id, instance.id))

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Power action job could not be created",
    })
  }

  await logActivity(ctx.db, "instance_power_action_requested", {
    actorId: ctx.session.session.userId,
    actorSnapshot: ctx.session.user,
    actorType: "user",
    channel: "api",
    metadata: { action, instance },
    organizationId: ctx.organizationId,
    referenceId: instance.id,
    referenceType: "instance",
  })

  return { id: instance.id }
}
